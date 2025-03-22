use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sqlx::{PgPool, Postgres, Transaction};
use thiserror::Error;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct ReserveAccount {
    pub id: Uuid,
    pub bank_name: String,
    pub account_number: String,
    pub currency: String,
    pub balance: Decimal,
    pub status: ReserveStatus,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct ReserveTransaction {
    pub id: Uuid,
    pub reserve_account_id: Uuid,
    pub transaction_id: Option<Uuid>,
    pub amount: Decimal,
    pub operation_type: ReserveOperationType,
    pub status: ReserveTransactionStatus,
    pub reference_id: Option<String>,
    pub metadata: Option<Value>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::Type, Clone, PartialEq)]
#[sqlx(type_name = "VARCHAR", rename_all = "lowercase")]
pub enum ReserveStatus {
    Active,
    Suspended,
    Closed,
}

#[derive(Debug, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "VARCHAR", rename_all = "lowercase")]
pub enum ReserveOperationType {
    BankDeposit,
    BankWithdrawal,
    FeeCollection,
    Reconciliation,
}

#[derive(Debug, Serialize, Deserialize, sqlx::Type, Clone, PartialEq)]
#[sqlx(type_name = "VARCHAR", rename_all = "lowercase")]
pub enum ReserveTransactionStatus {
    Pending,
    Completed,
    Failed,
}

#[derive(Debug, Error)]
pub enum ReserveError {
    #[error("Insufficient reserve: required {required}, available {available}")]
    InsufficientReserve { required: Decimal, available: Decimal },
    #[error("Reserve account is not active")]
    InactiveReserve,
    #[error("Invalid amount: {0}")]
    InvalidAmount(String),
    #[error("Database error: {0}")]
    DatabaseError(#[from] sqlx::Error),
    #[error("Reserve ratio below threshold")]
    ReserveRatioError,
}

impl ReserveAccount {
    /// Creates a new reserve account
    pub async fn create(
        pool: &PgPool,
        bank_name: String,
        account_number: String,
        currency: String,
    ) -> Result<Self, ReserveError> {
        let account = sqlx::query_as!(
            ReserveAccount,
            r#"
            INSERT INTO reserve_accounts (bank_name, account_number, currency)
            VALUES ($1, $2, $3)
            RETURNING *
            "#,
            bank_name,
            account_number,
            currency,
        )
        .fetch_one(pool)
        .await?;

        Ok(account)
    }

    /// Updates reserve account balance
    pub async fn update_balance(
        &mut self,
        pool: &PgPool,
        amount: Decimal,
    ) -> Result<(), ReserveError> {
        if self.status != ReserveStatus::Active {
            return Err(ReserveError::InactiveReserve);
        }

        let new_balance = self.balance + amount;
        if new_balance < Decimal::ZERO {
            return Err(ReserveError::InsufficientReserve {
                required: amount.abs(),
                available: self.balance,
            });
        }

        let result = sqlx::query!(
            r#"
            UPDATE reserve_accounts
            SET balance = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2 AND status = 'active'
            "#,
            new_balance,
            self.id
        )
        .execute(pool)
        .await?;

        if result.rows_affected() == 1 {
            self.balance = new_balance;
            Ok(())
        } else {
            Err(ReserveError::InactiveReserve)
        }
    }

    /// Checks if reserve ratio is maintained
    pub async fn check_reserve_ratio(pool: &PgPool) -> Result<Decimal, ReserveError> {
        let result = sqlx::query!(
            r#"
            WITH total_wallet_balance AS (
                SELECT COALESCE(SUM(balance), 0) as total
                FROM wallets
                WHERE status = 'active'
            ),
            total_reserve_balance AS (
                SELECT COALESCE(SUM(balance), 0) as total
                FROM reserve_accounts
                WHERE status = 'active'
            )
            SELECT 
                CASE 
                    WHEN w.total = 0 THEN 1
                    ELSE r.total / w.total
                END as ratio
            FROM total_wallet_balance w
            CROSS JOIN total_reserve_balance r
            "#
        )
        .fetch_one(pool)
        .await?;

        let ratio: Decimal = result.ratio.unwrap_or(Decimal::ONE);
        if ratio < Decimal::ONE {
            Err(ReserveError::ReserveRatioError)
        } else {
            Ok(ratio)
        }
    }
}

impl ReserveTransaction {
    /// Creates a new reserve transaction
    pub async fn create(
        db_tx: &mut Transaction<'_, Postgres>,
        reserve_account_id: Uuid,
        amount: Decimal,
        operation_type: ReserveOperationType,
        transaction_id: Option<Uuid>,
        reference_id: Option<String>,
        metadata: Option<Value>,
    ) -> Result<Self, ReserveError> {
        // Get the reserve account
        let mut reserve = sqlx::query_as!(
            ReserveAccount,
            r#"
            SELECT * FROM reserve_accounts
            WHERE id = $1
            FOR UPDATE
            "#,
            reserve_account_id
        )
        .fetch_one(&mut **db_tx)
        .await?;

        // Update reserve balance
        reserve.update_balance(db_tx, amount).await?;

        // Create reserve transaction record
        let reserve_tx = sqlx::query_as!(
            ReserveTransaction,
            r#"
            INSERT INTO reserve_transactions (
                reserve_account_id, transaction_id, amount,
                operation_type, reference_id, metadata
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
            "#,
            reserve_account_id,
            transaction_id,
            amount,
            operation_type as ReserveOperationType,
            reference_id,
            metadata
        )
        .fetch_one(&mut **db_tx)
        .await?;

        Ok(reserve_tx)
    }

    /// Performs daily reconciliation of reserves
    pub async fn daily_reconciliation(pool: &PgPool) -> Result<ReserveTransaction, ReserveError> {
        let mut db_tx = pool.begin().await?;

        // Calculate the difference between wallet balances and reserve
        let result = sqlx::query!(
            r#"
            WITH wallet_total AS (
                SELECT COALESCE(SUM(balance), 0) as total
                FROM wallets
                WHERE status = 'active'
            ),
            reserve_total AS (
                SELECT COALESCE(SUM(balance), 0) as total
                FROM reserve_accounts
                WHERE status = 'active'
            )
            SELECT 
                w.total as wallet_total,
                r.total as reserve_total,
                r.total - w.total as difference
            FROM wallet_total w
            CROSS JOIN reserve_total r
            "#
        )
        .fetch_one(&mut *db_tx)
        .await?;

        let difference = result.difference.unwrap_or(Decimal::ZERO);
        
        // If there's a discrepancy, create a reconciliation transaction
        if difference != Decimal::ZERO {
            // Get the main reserve account
            let reserve_account = sqlx::query_as!(
                ReserveAccount,
                r#"
                SELECT * FROM reserve_accounts
                WHERE status = 'active'
                ORDER BY created_at ASC
                LIMIT 1
                "#
            )
            .fetch_one(&mut *db_tx)
            .await?;

            let metadata = serde_json::json!({
                "wallet_total": result.wallet_total,
                "reserve_total": result.reserve_total,
                "reconciliation_date": Utc::now()
            });

            let reserve_tx = Self::create(
                &mut db_tx,
                reserve_account.id,
                difference,
                ReserveOperationType::Reconciliation,
                None,
                Some(format!("reconciliation_{}", Utc::now().date_naive())),
                Some(metadata),
            )
            .await?;

            db_tx.commit().await?;
            Ok(reserve_tx)
        } else {
            db_tx.commit().await?;
            Err(ReserveError::InvalidAmount("No reconciliation needed".to_string()))
        }
    }
}
