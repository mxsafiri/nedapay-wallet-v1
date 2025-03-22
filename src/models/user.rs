use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct User {
    pub id: Uuid,
    pub email: String,
    #[serde(skip_serializing)]
    pub password_hash: String,
    pub full_name: String,
    pub phone_number: Option<String>,
    pub kyc_status: KycStatus,
    pub kyc_level: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "VARCHAR", rename_all = "lowercase")]
pub enum KycStatus {
    Pending,
    Submitted,
    Verified,
    Rejected,
}

impl User {
    pub async fn create(
        pool: &sqlx::PgPool,
        email: String,
        password_hash: String,
        full_name: String,
        phone_number: Option<String>,
    ) -> Result<Self, sqlx::Error> {
        sqlx::query_as!(
            User,
            r#"
            INSERT INTO users (email, password_hash, full_name, phone_number)
            VALUES ($1, $2, $3, $4)
            RETURNING *
            "#,
            email,
            password_hash,
            full_name,
            phone_number,
        )
        .fetch_one(pool)
        .await
    }

    pub async fn find_by_email(pool: &sqlx::PgPool, email: &str) -> Result<Option<Self>, sqlx::Error> {
        sqlx::query_as!(
            User,
            r#"
            SELECT * FROM users WHERE email = $1
            "#,
            email
        )
        .fetch_optional(pool)
        .await
    }

    pub async fn update_kyc_status(
        &mut self,
        pool: &sqlx::PgPool,
        status: KycStatus,
        level: i32,
    ) -> Result<(), sqlx::Error> {
        let result = sqlx::query!(
            r#"
            UPDATE users
            SET kyc_status = $1, kyc_level = $2, updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
            "#,
            status.to_string(),
            level,
            self.id
        )
        .execute(pool)
        .await?;

        if result.rows_affected() == 1 {
            self.kyc_status = status;
            self.kyc_level = level;
            Ok(())
        } else {
            Err(sqlx::Error::RowNotFound)
        }
    }
}
