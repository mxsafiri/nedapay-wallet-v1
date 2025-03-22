use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct AuditLog {
    pub id: Uuid,
    pub admin_id: Uuid,
    pub action: String,
    pub entity_type: String,
    pub entity_id: Option<Uuid>,
    pub old_value: Option<Value>,
    pub new_value: Option<Value>,
    pub ip_address: String,
    pub user_agent: String,
    pub created_at: DateTime<Utc>,
}

impl AuditLog {
    pub async fn create(
        pool: &PgPool,
        admin_id: Uuid,
        action: &str,
        entity_type: &str,
        entity_id: Option<Uuid>,
        old_value: Option<Value>,
        new_value: Option<Value>,
        ip_address: &str,
        user_agent: &str,
    ) -> Result<Self, sqlx::Error> {
        let log = sqlx::query_as::<_, Self>(
            r#"
            INSERT INTO audit_logs (
                admin_id, action, entity_type, entity_id,
                old_value, new_value, ip_address, user_agent
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
            "#,
        )
        .bind(admin_id)
        .bind(action)
        .bind(entity_type)
        .bind(entity_id)
        .bind(old_value)
        .bind(new_value)
        .bind(ip_address)
        .bind(user_agent)
        .fetch_one(pool)
        .await?;

        Ok(log)
    }

    pub async fn list_by_admin(
        pool: &PgPool,
        admin_id: Uuid,
        limit: i64,
        offset: i64,
    ) -> Result<Vec<Self>, sqlx::Error> {
        let logs = sqlx::query_as::<_, Self>(
            r#"
            SELECT * FROM audit_logs
            WHERE admin_id = $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
            "#,
        )
        .bind(admin_id)
        .bind(limit)
        .bind(offset)
        .fetch_all(pool)
        .await?;

        Ok(logs)
    }

    pub async fn list_by_entity(
        pool: &PgPool,
        entity_type: &str,
        entity_id: Uuid,
        limit: i64,
        offset: i64,
    ) -> Result<Vec<Self>, sqlx::Error> {
        let logs = sqlx::query_as::<_, Self>(
            r#"
            SELECT * FROM audit_logs
            WHERE entity_type = $1 AND entity_id = $2
            ORDER BY created_at DESC
            LIMIT $3 OFFSET $4
            "#,
        )
        .bind(entity_type)
        .bind(entity_id)
        .bind(limit)
        .bind(offset)
        .fetch_all(pool)
        .await?;

        Ok(logs)
    }

    pub async fn search(
        pool: &PgPool,
        query: &str,
        limit: i64,
        offset: i64,
    ) -> Result<Vec<Self>, sqlx::Error> {
        let logs = sqlx::query_as::<_, Self>(
            r#"
            SELECT * FROM audit_logs
            WHERE 
                action ILIKE $1 OR
                entity_type ILIKE $1 OR
                ip_address ILIKE $1 OR
                user_agent ILIKE $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
            "#,
        )
        .bind(format!("%{}%", query))
        .bind(limit)
        .bind(offset)
        .fetch_all(pool)
        .await?;

        Ok(logs)
    }
}
