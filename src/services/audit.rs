use crate::models::audit::AuditLog;
use axum::http::HeaderMap;
use serde_json::Value;
use sqlx::PgPool;
use std::net::IpAddr;
use thiserror::Error;
use uuid::Uuid;

#[derive(Error, Debug)]
pub enum AuditError {
    #[error("Database error: {0}")]
    DbError(#[from] sqlx::Error),
    #[error("Missing required header: {0}")]
    MissingHeader(String),
}

pub struct AuditService {
    pool: PgPool,
}

impl AuditService {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn log_admin_action(
        &self,
        admin_id: Uuid,
        action: &str,
        entity_type: &str,
        entity_id: Option<Uuid>,
        old_value: Option<Value>,
        new_value: Option<Value>,
        headers: &HeaderMap,
    ) -> Result<AuditLog, AuditError> {
        // Extract IP address
        let ip_address = headers
            .get("x-forwarded-for")
            .and_then(|h| h.to_str().ok())
            .and_then(|s| s.split(',').next())
            .unwrap_or("unknown")
            .to_string();

        // Extract user agent
        let user_agent = headers
            .get("user-agent")
            .and_then(|h| h.to_str().ok())
            .unwrap_or("unknown")
            .to_string();

        let log = AuditLog::create(
            &self.pool,
            admin_id,
            action,
            entity_type,
            entity_id,
            old_value,
            new_value,
            &ip_address,
            &user_agent,
        )
        .await?;

        Ok(log)
    }

    pub async fn get_admin_logs(
        &self,
        admin_id: Uuid,
        limit: i64,
        offset: i64,
    ) -> Result<Vec<AuditLog>, AuditError> {
        let logs = AuditLog::list_by_admin(&self.pool, admin_id, limit, offset).await?;
        Ok(logs)
    }

    pub async fn get_entity_logs(
        &self,
        entity_type: &str,
        entity_id: Uuid,
        limit: i64,
        offset: i64,
    ) -> Result<Vec<AuditLog>, AuditError> {
        let logs = AuditLog::list_by_entity(&self.pool, entity_type, entity_id, limit, offset).await?;
        Ok(logs)
    }

    pub async fn search_logs(
        &self,
        query: &str,
        limit: i64,
        offset: i64,
    ) -> Result<Vec<AuditLog>, AuditError> {
        let logs = AuditLog::search(&self.pool, query, limit, offset).await?;
        Ok(logs)
    }
}
