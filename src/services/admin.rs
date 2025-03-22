use crate::{
    models::{
        user::{User, UserKycLevel},
        transaction::Transaction,
        reserve::ReserveBalance,
    },
    db::DbPool,
};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::postgres::PgPool;
use thiserror::Error;
use uuid::Uuid;

#[derive(Error, Debug)]
pub enum AdminError {
    #[error("Database error: {0}")]
    DbError(#[from] sqlx::Error),
    #[error("User not found")]
    UserNotFound,
    #[error("Invalid input: {0}")]
    InvalidInput(String),
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserFilter {
    pub kyc_level: Option<UserKycLevel>,
    pub status: Option<String>,
    pub created_after: Option<DateTime<Utc>>,
    pub created_before: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TransactionFilter {
    pub user_id: Option<Uuid>,
    pub status: Option<String>,
    pub min_amount: Option<i64>,
    pub max_amount: Option<i64>,
    pub created_after: Option<DateTime<Utc>>,
    pub created_before: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize)]
pub struct SystemStats {
    pub total_users: i64,
    pub active_users: i64,
    pub total_transactions: i64,
    pub total_volume: i64,
    pub reserve_ratio: f64,
}

pub struct AdminService {
    pool: PgPool,
}

impl AdminService {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    // User Management
    pub async fn get_users(&self, filter: &UserFilter) -> Result<Vec<User>, AdminError> {
        let mut query = sqlx::QueryBuilder::new(
            "SELECT * FROM users WHERE true",
        );

        if let Some(kyc_level) = &filter.kyc_level {
            query.push(" AND kyc_level = ");
            query.push_bind(kyc_level);
        }

        if let Some(status) = &filter.status {
            query.push(" AND status = ");
            query.push_bind(status);
        }

        if let Some(after) = &filter.created_after {
            query.push(" AND created_at >= ");
            query.push_bind(after);
        }

        if let Some(before) = &filter.created_before {
            query.push(" AND created_at <= ");
            query.push_bind(before);
        }

        query.push(" ORDER BY created_at DESC");

        let users = query
            .build_query_as::<User>()
            .fetch_all(&self.pool)
            .await?;

        Ok(users)
    }

    pub async fn update_user_kyc(
        &self,
        user_id: Uuid,
        kyc_level: UserKycLevel,
    ) -> Result<User, AdminError> {
        let user = sqlx::query_as::<_, User>(
            "UPDATE users SET kyc_level = $1 WHERE id = $2 RETURNING *",
        )
        .bind(kyc_level)
        .bind(user_id)
        .fetch_optional(&self.pool)
        .await?
        .ok_or(AdminError::UserNotFound)?;

        Ok(user)
    }

    // Transaction Management
    pub async fn get_transactions(
        &self,
        filter: &TransactionFilter,
    ) -> Result<Vec<Transaction>, AdminError> {
        let mut query = sqlx::QueryBuilder::new(
            "SELECT * FROM transactions WHERE true",
        );

        if let Some(user_id) = &filter.user_id {
            query.push(" AND user_id = ");
            query.push_bind(user_id);
        }

        if let Some(status) = &filter.status {
            query.push(" AND status = ");
            query.push_bind(status);
        }

        if let Some(min) = &filter.min_amount {
            query.push(" AND amount >= ");
            query.push_bind(min);
        }

        if let Some(max) = &filter.max_amount {
            query.push(" AND amount <= ");
            query.push_bind(max);
        }

        if let Some(after) = &filter.created_after {
            query.push(" AND created_at >= ");
            query.push_bind(after);
        }

        if let Some(before) = &filter.created_before {
            query.push(" AND created_at <= ");
            query.push_bind(before);
        }

        query.push(" ORDER BY created_at DESC");

        let transactions = query
            .build_query_as::<Transaction>()
            .fetch_all(&self.pool)
            .await?;

        Ok(transactions)
    }

    // Reserve Management
    pub async fn get_reserve_balance(&self) -> Result<ReserveBalance, AdminError> {
        let balance = sqlx::query_as::<_, ReserveBalance>(
            "SELECT * FROM reserve_balances ORDER BY created_at DESC LIMIT 1",
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(balance)
    }

    pub async fn update_reserve_balance(
        &self,
        amount: i64,
        proof_url: &str,
    ) -> Result<ReserveBalance, AdminError> {
        let balance = sqlx::query_as::<_, ReserveBalance>(
            "INSERT INTO reserve_balances (amount, proof_url) VALUES ($1, $2) RETURNING *",
        )
        .bind(amount)
        .bind(proof_url)
        .fetch_one(&self.pool)
        .await?;

        Ok(balance)
    }

    // System Statistics
    pub async fn get_system_stats(&self) -> Result<SystemStats, AdminError> {
        let (total_users, active_users): (i64, i64) = sqlx::query_as(
            "SELECT COUNT(*), COUNT(*) FILTER (WHERE last_login > NOW() - INTERVAL '30 days') FROM users",
        )
        .fetch_one(&self.pool)
        .await?;

        let (total_transactions, total_volume): (i64, i64) = sqlx::query_as(
            "SELECT COUNT(*), COALESCE(SUM(amount), 0) FROM transactions WHERE status = 'completed'",
        )
        .fetch_one(&self.pool)
        .await?;

        let reserve_balance = self.get_reserve_balance().await?.amount;
        let total_wallet_balance: i64 = sqlx::query_scalar(
            "SELECT COALESCE(SUM(balance), 0) FROM wallets",
        )
        .fetch_one(&self.pool)
        .await?;

        let reserve_ratio = if total_wallet_balance > 0 {
            reserve_balance as f64 / total_wallet_balance as f64
        } else {
            1.0
        };

        Ok(SystemStats {
            total_users,
            active_users,
            total_transactions,
            total_volume,
            reserve_ratio,
        })
    }
}
