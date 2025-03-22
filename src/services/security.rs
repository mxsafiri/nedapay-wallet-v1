use crate::{
    models::{
        user::User,
        audit::AuditLog,
    },
    services::email::EmailService,
};
use chrono::{DateTime, Duration, Utc};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use std::sync::Arc;
use thiserror::Error;
use uuid::Uuid;

#[derive(Error, Debug)]
pub enum SecurityError {
    #[error("Database error: {0}")]
    DbError(#[from] sqlx::Error),
    #[error("Redis error: {0}")]
    RedisError(#[from] redis::RedisError),
    #[error("Email error: {0}")]
    EmailError(String),
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SecurityAlert {
    pub id: Uuid,
    pub alert_type: String,
    pub severity: AlertSeverity,
    pub description: String,
    pub metadata: serde_json::Value,
    pub resolved: bool,
    pub resolved_by: Option<Uuid>,
    pub resolved_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "VARCHAR", rename_all = "lowercase")]
pub enum AlertSeverity {
    Low,
    Medium,
    High,
    Critical,
}

pub struct SecurityService {
    pool: PgPool,
    email: Arc<EmailService>,
    redis: redis::Client,
}

impl SecurityService {
    pub fn new(pool: PgPool, email: Arc<EmailService>, redis: redis::Client) -> Self {
        Self { pool, email, redis }
    }

    // Monitor suspicious login attempts
    pub async fn monitor_login_attempts(
        &self,
        user_id: Uuid,
        ip_address: &str,
    ) -> Result<(), SecurityError> {
        let mut conn = self.redis.get_async_connection().await?;
        let key = format!("login_attempts:{}:{}", user_id, ip_address);
        
        // Increment attempts counter
        let attempts: i32 = redis::cmd("INCR")
            .arg(&key)
            .query_async(&mut conn)
            .await?;

        // Set expiry for 1 hour if not set
        if attempts == 1 {
            redis::cmd("EXPIRE")
                .arg(&key)
                .arg(3600)
                .query_async(&mut conn)
                .await?;
        }

        // Check if attempts exceed threshold
        if attempts >= 5 {
            self.create_security_alert(
                "excessive_login_attempts",
                AlertSeverity::High,
                "Multiple failed login attempts detected",
                serde_json::json!({
                    "user_id": user_id,
                    "ip_address": ip_address,
                    "attempts": attempts
                }),
            ).await?;
        }

        Ok(())
    }

    // Monitor suspicious transactions
    pub async fn monitor_transactions(
        &self,
        user_id: Uuid,
        amount: i64,
        recipient: &str,
    ) -> Result<bool, SecurityError> {
        // Get user's transaction history
        let avg_amount: i64 = sqlx::query_scalar(
            r#"
            SELECT AVG(amount)::BIGINT
            FROM transactions
            WHERE user_id = $1
            AND created_at > NOW() - INTERVAL '30 days'
            AND status = 'completed'
            "#,
        )
        .bind(user_id)
        .fetch_one(&self.pool)
        .await?;

        // Check if amount is significantly higher than average
        if amount > avg_amount * 3 {
            self.create_security_alert(
                "unusual_transaction_amount",
                AlertSeverity::Medium,
                "Transaction amount significantly higher than user average",
                serde_json::json!({
                    "user_id": user_id,
                    "amount": amount,
                    "avg_amount": avg_amount,
                    "recipient": recipient
                }),
            ).await?;
            return Ok(false);
        }

        Ok(true)
    }

    // Monitor reserve ratio
    pub async fn monitor_reserve_ratio(&self) -> Result<(), SecurityError> {
        let ratio: f64 = sqlx::query_scalar(
            r#"
            WITH reserve_total AS (
                SELECT COALESCE(SUM(amount), 0) as total
                FROM reserve_balances
                WHERE status = 'active'
            ),
            wallet_total AS (
                SELECT COALESCE(SUM(balance), 0) as total
                FROM wallets
            )
            SELECT CASE 
                WHEN w.total = 0 THEN 1.0
                ELSE r.total::float / w.total::float
            END
            FROM reserve_total r, wallet_total w
            "#,
        )
        .fetch_one(&self.pool)
        .await?;

        if ratio < 1.0 {
            self.create_security_alert(
                "low_reserve_ratio",
                AlertSeverity::Critical,
                "Reserve ratio below 100%",
                serde_json::json!({
                    "current_ratio": ratio,
                    "threshold": 1.0
                }),
            ).await?;
        }

        Ok(())
    }

    // Monitor system access patterns
    pub async fn monitor_system_access(
        &self,
        admin_id: Uuid,
        action: &str,
        ip_address: &str,
    ) -> Result<(), SecurityError> {
        // Check for concurrent access from different IPs
        let recent_ips: Vec<String> = sqlx::query_scalar(
            r#"
            SELECT DISTINCT ip_address
            FROM audit_logs
            WHERE admin_id = $1
            AND created_at > NOW() - INTERVAL '5 minutes'
            "#,
        )
        .bind(admin_id)
        .fetch_all(&self.pool)
        .await?;

        if recent_ips.len() > 1 && !recent_ips.contains(&ip_address.to_string()) {
            self.create_security_alert(
                "concurrent_admin_access",
                AlertSeverity::High,
                "Admin accessing system from multiple IP addresses",
                serde_json::json!({
                    "admin_id": admin_id,
                    "current_ip": ip_address,
                    "recent_ips": recent_ips
                }),
            ).await?;
        }

        Ok(())
    }

    // Create security alert
    async fn create_security_alert(
        &self,
        alert_type: &str,
        severity: AlertSeverity,
        description: &str,
        metadata: serde_json::Value,
    ) -> Result<SecurityAlert, SecurityError> {
        let alert = sqlx::query_as::<_, SecurityAlert>(
            r#"
            INSERT INTO security_alerts (
                alert_type, severity, description, metadata
            )
            VALUES ($1, $2, $3, $4)
            RETURNING *
            "#,
        )
        .bind(alert_type)
        .bind(severity)
        .bind(description)
        .bind(metadata)
        .fetch_one(&self.pool)
        .await?;

        // Notify admins for high and critical alerts
        if matches!(severity, AlertSeverity::High | AlertSeverity::Critical) {
            let admins: Vec<User> = sqlx::query_as(
                "SELECT * FROM users WHERE kyc_level = 3",
            )
            .fetch_all(&self.pool)
            .await?;

            for admin in admins {
                self.email
                    .send_security_alert(
                        &admin.email,
                        &admin.full_name,
                        alert_type,
                        description,
                    )
                    .await
                    .map_err(|e| SecurityError::EmailError(e.to_string()))?;
            }
        }

        Ok(alert)
    }

    // Get unresolved alerts
    pub async fn get_unresolved_alerts(&self) -> Result<Vec<SecurityAlert>, SecurityError> {
        let alerts = sqlx::query_as::<_, SecurityAlert>(
            "SELECT * FROM security_alerts WHERE resolved = false ORDER BY created_at DESC",
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(alerts)
    }

    // Resolve alert
    pub async fn resolve_alert(
        &self,
        alert_id: Uuid,
        admin_id: Uuid,
    ) -> Result<SecurityAlert, SecurityError> {
        let alert = sqlx::query_as::<_, SecurityAlert>(
            r#"
            UPDATE security_alerts
            SET resolved = true,
                resolved_by = $2,
                resolved_at = NOW()
            WHERE id = $1
            RETURNING *
            "#,
        )
        .bind(alert_id)
        .bind(admin_id)
        .fetch_one(&self.pool)
        .await?;

        Ok(alert)
    }
}
