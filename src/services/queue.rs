use crate::services::email::{EmailError, EmailService};
use redis::{aio::ConnectionManager, AsyncCommands};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use thiserror::Error;
use tokio::time::{self, Duration};
use tracing::{error, info};
use uuid::Uuid;

const EMAIL_QUEUE_KEY: &str = "email:queue";
const EMAIL_PROCESSING_KEY: &str = "email:processing";
const EMAIL_FAILED_KEY: &str = "email:failed";
const MAX_RETRIES: i32 = 3;
const PROCESSING_TIMEOUT: i64 = 300; // 5 minutes

#[derive(Error, Debug)]
pub enum QueueError {
    #[error("Redis error: {0}")]
    RedisError(#[from] redis::RedisError),
    #[error("JSON error: {0}")]
    JsonError(#[from] serde_json::Error),
    #[error("Email error: {0}")]
    EmailError(#[from] EmailError),
}

#[derive(Debug, Serialize, Deserialize)]
pub struct QueuedEmail {
    pub id: Uuid,
    pub to_email: String,
    pub subject: String,
    pub template: String,
    pub data: serde_json::Value,
    pub retries: i32,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

pub struct EmailQueue {
    redis: ConnectionManager,
    email_service: Arc<EmailService>,
}

impl EmailQueue {
    pub fn new(redis: ConnectionManager, email_service: Arc<EmailService>) -> Self {
        Self {
            redis,
            email_service,
        }
    }

    // Start the email queue processor
    pub async fn start(&self) {
        let redis = self.redis.clone();
        let email_service = Arc::clone(&self.email_service);

        tokio::spawn(async move {
            let mut interval = time::interval(Duration::from_secs(5));
            loop {
                interval.tick().await;
                if let Err(e) = Self::process_queue(&redis, &email_service).await {
                    error!("Error processing email queue: {}", e);
                }
                if let Err(e) = Self::recover_stuck_emails(&redis).await {
                    error!("Error recovering stuck emails: {}", e);
                }
            }
        });
    }

    // Add email to queue
    pub async fn queue_email(
        &self,
        to_email: &str,
        subject: &str,
        template: &str,
        data: serde_json::Value,
    ) -> Result<Uuid, QueueError> {
        let email = QueuedEmail {
            id: Uuid::new_v4(),
            to_email: to_email.to_string(),
            subject: subject.to_string(),
            template: template.to_string(),
            data,
            retries: 0,
            created_at: chrono::Utc::now(),
        };

        let json = serde_json::to_string(&email)?;
        self.redis.zadd(EMAIL_QUEUE_KEY, json, 0).await?;

        info!("Email queued: {}", email.id);
        Ok(email.id)
    }

    // Process emails in the queue
    async fn process_queue(
        redis: &ConnectionManager,
        email_service: &EmailService,
    ) -> Result<(), QueueError> {
        let now = chrono::Utc::now().timestamp();

        // Get up to 10 emails from the queue
        let emails: Vec<String> = redis
            .zrangebyscore::<_, _, Vec<String>>(EMAIL_QUEUE_KEY, 0, now)
            .await?;

        for email_json in emails {
            let email: QueuedEmail = serde_json::from_str(&email_json)?;
            
            // Move to processing queue
            redis.zrem(EMAIL_QUEUE_KEY, &email_json).await?;
            redis
                .zadd(
                    EMAIL_PROCESSING_KEY,
                    email_json.clone(),
                    chrono::Utc::now().timestamp(),
                )
                .await?;

            // Try to send the email
            match email_service
                .send_email(&email.to_email, &email.subject, &email.template, &email.data)
                .await
            {
                Ok(_) => {
                    info!("Email sent successfully: {}", email.id);
                    redis.zrem(EMAIL_PROCESSING_KEY, email_json).await?;
                }
                Err(e) => {
                    error!("Failed to send email {}: {}", email.id, e);
                    let mut email = email;
                    email.retries += 1;

                    if email.retries >= MAX_RETRIES {
                        // Move to failed queue
                        let json = serde_json::to_string(&email)?;
                        redis.zrem(EMAIL_PROCESSING_KEY, email_json).await?;
                        redis
                            .zadd(
                                EMAIL_FAILED_KEY,
                                json,
                                chrono::Utc::now().timestamp(),
                            )
                            .await?;
                    } else {
                        // Requeue with exponential backoff
                        let delay = 60 * (2_i64.pow(email.retries as u32));
                        let next_attempt = chrono::Utc::now().timestamp() + delay;
                        let json = serde_json::to_string(&email)?;
                        redis.zrem(EMAIL_PROCESSING_KEY, email_json).await?;
                        redis.zadd(EMAIL_QUEUE_KEY, json, next_attempt).await?;
                    }
                }
            }
        }

        Ok(())
    }

    // Recover stuck emails from processing queue
    async fn recover_stuck_emails(redis: &ConnectionManager) -> Result<(), QueueError> {
        let cutoff = chrono::Utc::now().timestamp() - PROCESSING_TIMEOUT;

        // Get stuck emails
        let stuck_emails: Vec<String> = redis
            .zrangebyscore::<_, _, Vec<String>>(EMAIL_PROCESSING_KEY, 0, cutoff)
            .await?;

        for email_json in stuck_emails {
            let mut email: QueuedEmail = serde_json::from_str(&email_json)?;
            email.retries += 1;

            // Remove from processing queue
            redis.zrem(EMAIL_PROCESSING_KEY, &email_json).await?;

            if email.retries >= MAX_RETRIES {
                // Move to failed queue
                let json = serde_json::to_string(&email)?;
                redis
                    .zadd(
                        EMAIL_FAILED_KEY,
                        json,
                        chrono::Utc::now().timestamp(),
                    )
                    .await?;
            } else {
                // Requeue with exponential backoff
                let delay = 60 * (2_i64.pow(email.retries as u32));
                let next_attempt = chrono::Utc::now().timestamp() + delay;
                let json = serde_json::to_string(&email)?;
                redis.zadd(EMAIL_QUEUE_KEY, json, next_attempt).await?;
            }
        }

        Ok(())
    }

    // Get failed emails
    pub async fn get_failed_emails(&self) -> Result<Vec<QueuedEmail>, QueueError> {
        let emails: Vec<String> = self
            .redis
            .zrange(EMAIL_FAILED_KEY, 0, -1)
            .await?;

        let failed_emails = emails
            .into_iter()
            .filter_map(|json| serde_json::from_str(&json).ok())
            .collect();

        Ok(failed_emails)
    }

    // Retry failed email
    pub async fn retry_failed_email(&self, email_id: Uuid) -> Result<(), QueueError> {
        let emails: Vec<String> = self
            .redis
            .zrange(EMAIL_FAILED_KEY, 0, -1)
            .await?;

        for email_json in emails {
            let email: QueuedEmail = serde_json::from_str(&email_json)?;
            if email.id == email_id {
                // Remove from failed queue
                self.redis.zrem(EMAIL_FAILED_KEY, &email_json).await?;

                // Reset retries and requeue
                let mut email = email;
                email.retries = 0;
                let json = serde_json::to_string(&email)?;
                self.redis
                    .zadd(
                        EMAIL_QUEUE_KEY,
                        json,
                        chrono::Utc::now().timestamp(),
                    )
                    .await?;

                info!("Failed email {} requeued", email_id);
                break;
            }
        }

        Ok(())
    }
}
