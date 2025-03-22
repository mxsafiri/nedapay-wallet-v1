use crate::models::wallet::{Wallet, WalletError};
use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sqlx::{PgPool, Postgres, Transaction};
use thiserror::Error;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Transaction {
    pub id: Uuid,
    pub debit_wallet_id: Option<Uuid>,
    pub credit_wallet_id: Option<Uuid>,
    pub amount: Decimal,
    pub currency: String,
    pub transaction_type: TransactionType,
    pub status: TransactionStatus,
    pub reference_id: Option<String>,
    pub metadata: Option<Value>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::Type, Clone)]
#[sqlx(type_name = "VARCHAR", rename_all = "lowercase")]
pub enum TransactionType {
    Deposit,
    Withdrawal,
    Transfer,
    Fee,
    Refund,
}

#[derive(Debug, Serialize, Deserialize, sqlx::Type, Clone, PartialEq)]
#[sqlx(type_name = "VARCHAR", rename_all = "lowercase")]
pub enum TransactionStatus {
    Pending,
    Processing,
    Completed,
    Failed,
    Reversed,
}

#[derive(Debug, Error)]
pub enum TransactionError {
    #[error("Invalid transaction: {0}")]
    InvalidTransaction(String),
    #[error("Wallet error: {0}")]
    WalletError(#[from] WalletError),
    #[error("Database error: {0}")]
    DatabaseError(#[from] sqlx::Error),
    #[error("Transaction not found")]
    NotFound,
}

impl Transaction {
    /// Creates a new transaction with double-entry accounting
    pub async fn create(
        pool: &PgPool,
        debit_wallet_id: Option<Uuid>,
        credit_wallet_id: Option<Uuid>,
        amount: Decimal,
        currency: String,
        transaction_type: TransactionType,
        reference_id: Option<String>,
        metadata: Option<Value>,
    ) -> Result<Self, TransactionError> {
        // Validate transaction
        if debit_wallet_id.is_none() && credit_wallet_id.is_none() {
            return Err(TransactionError::InvalidTransaction(
                "Either debit or credit wallet must be specified".to_string(),
            ));
        }

        if debit_wallet_id == credit_wallet_id && debit_wallet_id.is_some() {
            return Err(TransactionError::InvalidTransaction(
                "Debit and credit wallets cannot be the same".to_string(),
            ));
        }

        // Start a database transaction
        let mut db_tx = pool.begin().await?;

        // Create the transaction record
        let transaction = sqlx::query_as!(
            Transaction,
            r#"
            INSERT INTO transactions (
                debit_wallet_id, credit_wallet_id, amount, currency,
                transaction_type, reference_id, metadata
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
            "#,
            debit_wallet_id,
            credit_wallet_id,
            amount,
            currency,
            transaction_type as TransactionType,
            reference_id,
            metadata
        )
        .fetch_one(&mut *db_tx)
        .await?;

        // Process wallet updates
        Self::process_wallet_updates(&mut db_tx, &transaction).await?;

        // Commit the transaction
        db_tx.commit().await?;

        Ok(transaction)
    }

    /// Process wallet balance updates within a database transaction
    async fn process_wallet_updates(
        db_tx: &mut Transaction<'_, Postgres>,
        transaction: &Transaction,
    ) -> Result<(), TransactionError> {
        // Update debit wallet if exists
        if let Some(debit_id) = transaction.debit_wallet_id {
            let mut debit_wallet = Wallet::find_by_id(db_tx, debit_id)
                .await?
                .ok_or_else(|| TransactionError::InvalidTransaction("Debit wallet not found".to_string()))?;

            debit_wallet.can_debit(transaction.amount)?;
            debit_wallet
                .update_balance(db_tx, -transaction.amount)
                .await?;
        }

        // Update credit wallet if exists
        if let Some(credit_id) = transaction.credit_wallet_id {
            let mut credit_wallet = Wallet::find_by_id(db_tx, credit_id)
                .await?
                .ok_or_else(|| {
                    TransactionError::InvalidTransaction("Credit wallet not found".to_string())
                })?;

            credit_wallet.can_credit(transaction.amount)?;
            credit_wallet
                .update_balance(db_tx, transaction.amount)
                .await?;
        }

        Ok(())
    }

    /// Updates transaction status
    pub async fn update_status(
        &mut self,
        pool: &PgPool,
        status: TransactionStatus,
    ) -> Result<(), TransactionError> {
        let result = sqlx::query!(
            r#"
            UPDATE transactions
            SET status = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            "#,
            status as TransactionStatus,
            self.id
        )
        .execute(pool)
        .await?;

        if result.rows_affected() == 1 {
            self.status = status;
            Ok(())
        } else {
            Err(TransactionError::NotFound)
        }
    }

    /// Retrieves a transaction by ID
    pub async fn find_by_id(pool: &PgPool, id: Uuid) -> Result<Option<Self>, TransactionError> {
        let transaction = sqlx::query_as!(
            Transaction,
            r#"
            SELECT * FROM transactions WHERE id = $1
            "#,
            id
        )
        .fetch_optional(pool)
        .await?;

        Ok(transaction)
    }

    /// Gets all transactions for a wallet
    pub async fn find_by_wallet(
        pool: &PgPool,
        wallet_id: Uuid,
        limit: i64,
        offset: i64,
    ) -> Result<Vec<Self>, TransactionError> {
        let transactions = sqlx::query_as!(
            Transaction,
            r#"
            SELECT * FROM transactions
            WHERE debit_wallet_id = $1 OR credit_wallet_id = $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
            "#,
            wallet_id,
            limit,
            offset
        )
        .fetch_all(pool)
        .await?;

        Ok(transactions)
    }

    /// Reverses a transaction if possible
    pub async fn reverse(
        &mut self,
        pool: &PgPool,
        reason: Option<String>,
    ) -> Result<Transaction, TransactionError> {
        if self.status != TransactionStatus::Completed {
            return Err(TransactionError::InvalidTransaction(
                "Only completed transactions can be reversed".to_string(),
            ));
        }

        let mut metadata = self.metadata.clone().unwrap_or_else(|| serde_json::json!({}));
        if let Some(reason_text) = reason {
            metadata["reverse_reason"] = serde_json::json!(reason_text);
        }

        // Create reversal transaction
        let reversal = Self::create(
            pool,
            self.credit_wallet_id, // Swap debit and credit
            self.debit_wallet_id,
            self.amount,
            self.currency.clone(),
            TransactionType::Refund,
            Some(format!("reversal_{}", self.id)),
            Some(metadata),
        )
        .await?;

        // Update original transaction status
        self.update_status(pool, TransactionStatus::Reversed).await?;

        Ok(reversal)
    }
}
