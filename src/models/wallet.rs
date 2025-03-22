use crate::models::user::User;
use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use thiserror::Error;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Wallet {
    pub id: Uuid,
    pub user_id: Uuid,
    pub balance: Decimal,
    pub currency: String,
    pub status: WalletStatus,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "VARCHAR", rename_all = "lowercase")]
pub enum WalletStatus {
    Active,
    Frozen,
    Closed,
}

#[derive(Debug, Error)]
pub enum WalletError {
    #[error("Insufficient funds: required {required}, available {available}")]
    InsufficientFunds { required: Decimal, available: Decimal },
    #[error("Wallet is not active")]
    InactiveWallet,
    #[error("Invalid amount: {0}")]
    InvalidAmount(String),
    #[error("Database error: {0}")]
    DatabaseError(#[from] sqlx::Error),
}

impl Wallet {
    /// Creates a new wallet for a user
    pub async fn create(
        pool: &PgPool,
        user_id: Uuid,
        currency: String,
    ) -> Result<Self, WalletError> {
        let wallet = sqlx::query_as!(
            Wallet,
            r#"
            INSERT INTO wallets (user_id, currency)
            VALUES ($1, $2)
            RETURNING *
            "#,
            user_id,
            currency,
        )
        .fetch_one(pool)
        .await?;

        Ok(wallet)
    }

    /// Retrieves a wallet by its ID
    pub async fn find_by_id(pool: &PgPool, id: Uuid) -> Result<Option<Self>, WalletError> {
        let wallet = sqlx::query_as!(
            Wallet,
            r#"
            SELECT * FROM wallets WHERE id = $1
            "#,
            id
        )
        .fetch_optional(pool)
        .await?;

        Ok(wallet)
    }

    /// Gets all wallets for a user
    pub async fn find_by_user(pool: &PgPool, user_id: Uuid) -> Result<Vec<Self>, WalletError> {
        let wallets = sqlx::query_as!(
            Wallet,
            r#"
            SELECT * FROM wallets WHERE user_id = $1
            "#,
            user_id
        )
        .fetch_all(pool)
        .await?;

        Ok(wallets)
    }

    /// Updates wallet balance within a transaction
    pub async fn update_balance(
        &mut self,
        pool: &PgPool,
        amount: Decimal,
    ) -> Result<(), WalletError> {
        // Validate wallet status
        if self.status != WalletStatus::Active {
            return Err(WalletError::InactiveWallet);
        }

        // Calculate new balance
        let new_balance = self.balance + amount;
        
        // Validate non-negative balance
        if new_balance < Decimal::ZERO {
            return Err(WalletError::InsufficientFunds {
                required: amount.abs(),
                available: self.balance,
            });
        }

        // Update balance in database
        let result = sqlx::query!(
            r#"
            UPDATE wallets
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
            Err(WalletError::InactiveWallet)
        }
    }

    /// Freezes a wallet
    pub async fn freeze(&mut self, pool: &PgPool) -> Result<(), WalletError> {
        let result = sqlx::query!(
            r#"
            UPDATE wallets
            SET status = 'frozen', updated_at = CURRENT_TIMESTAMP
            WHERE id = $1 AND status = 'active'
            "#,
            self.id
        )
        .execute(pool)
        .await?;

        if result.rows_affected() == 1 {
            self.status = WalletStatus::Frozen;
            Ok(())
        } else {
            Err(WalletError::InactiveWallet)
        }
    }

    /// Validates if the wallet can process a debit transaction
    pub fn can_debit(&self, amount: Decimal) -> Result<(), WalletError> {
        if self.status != WalletStatus::Active {
            return Err(WalletError::InactiveWallet);
        }

        if amount <= Decimal::ZERO {
            return Err(WalletError::InvalidAmount("Amount must be positive".to_string()));
        }

        if self.balance < amount {
            return Err(WalletError::InsufficientFunds {
                required: amount,
                available: self.balance,
            });
        }

        Ok(())
    }

    /// Validates if the wallet can process a credit transaction
    pub fn can_credit(&self, amount: Decimal) -> Result<(), WalletError> {
        if self.status != WalletStatus::Active {
            return Err(WalletError::InactiveWallet);
        }

        if amount <= Decimal::ZERO {
            return Err(WalletError::InvalidAmount("Amount must be positive".to_string()));
        }

        Ok(())
    }
}
