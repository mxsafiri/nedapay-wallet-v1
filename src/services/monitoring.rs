use crate::services::queue::QueuedEmail;
use redis::{aio::ConnectionManager, AsyncCommands};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use thiserror::Error;
use chrono::{DateTime, Utc};

const EMAIL_QUEUE_KEY: &str = "email:queue";
const EMAIL_PROCESSING_KEY: &str = "email:processing";
const EMAIL_FAILED_KEY: &str = "email:failed";
const METRICS_KEY: &str = "email:metrics";

#[derive(Error, Debug)]
pub enum MonitoringError {
    #[error("Redis error: {0}")]
    RedisError(#[from] redis::RedisError),
    #[error("JSON error: {0}")]
    JsonError(#[from] serde_json::Error),
}

#[derive(Debug, Serialize, Deserialize)]
pub struct QueueMetrics {
    pub pending_count: i64,
    pub processing_count: i64,
    pub failed_count: i64,
    pub success_rate: f64,
    pub average_processing_time: f64,
    pub retries_count: i64,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct QueueStatus {
    pub metrics: QueueMetrics,
    pub failed_emails: Vec<QueuedEmail>,
    pub processing_emails: Vec<QueuedEmail>,
}

pub struct MonitoringService {
    redis: ConnectionManager,
}

impl MonitoringService {
    pub fn new(redis: ConnectionManager) -> Self {
        Self { redis }
    }

    // Get current queue metrics
    pub async fn get_queue_metrics(&self) -> Result<QueueMetrics, MonitoringError> {
        let mut conn = self.redis.clone();

        let (pending, processing, failed): (i64, i64, i64) = tokio::join!(
            conn.zcard(EMAIL_QUEUE_KEY),
            conn.zcard(EMAIL_PROCESSING_KEY),
            conn.zcard(EMAIL_FAILED_KEY)
        );

        // Get success rate and processing time from stored metrics
        let metrics: Option<String> = conn.get(METRICS_KEY).await?;
        let (success_rate, avg_time) = if let Some(metrics_str) = metrics {
            let stored: QueueMetrics = serde_json::from_str(&metrics_str)?;
            (stored.success_rate, stored.average_processing_time)
        } else {
            (100.0, 0.0) // Default values for new system
        };

        // Count retries
        let emails: Vec<String> = conn.zrange(EMAIL_QUEUE_KEY, 0, -1).await?;
        let retries = emails
            .iter()
            .filter_map(|email| serde_json::from_str::<QueuedEmail>(email).ok())
            .map(|email| email.retries as i64)
            .sum();

        let metrics = QueueMetrics {
            pending_count: pending?,
            processing_count: processing?,
            failed_count: failed?,
            success_rate,
            average_processing_time: avg_time,
            retries_count: retries,
            timestamp: Utc::now(),
        };

        // Store metrics for historical tracking
        conn.set(
            METRICS_KEY,
            serde_json::to_string(&metrics)?,
        )
        .await?;

        Ok(metrics)
    }

    // Get detailed queue status
    pub async fn get_queue_status(&self) -> Result<QueueStatus, MonitoringError> {
        let metrics = self.get_queue_metrics().await?;
        let mut conn = self.redis.clone();

        // Get failed emails
        let failed_jsons: Vec<String> = conn.zrange(EMAIL_FAILED_KEY, 0, -1).await?;
        let failed_emails = failed_jsons
            .into_iter()
            .filter_map(|json| serde_json::from_str(&json).ok())
            .collect();

        // Get processing emails
        let processing_jsons: Vec<String> = conn.zrange(EMAIL_PROCESSING_KEY, 0, -1).await?;
        let processing_emails = processing_jsons
            .into_iter()
            .filter_map(|json| serde_json::from_str(&json).ok())
            .collect();

        Ok(QueueStatus {
            metrics,
            failed_emails,
            processing_emails,
        })
    }

    // Update success rate
    pub async fn update_success_rate(&self, success: bool) -> Result<(), MonitoringError> {
        let mut conn = self.redis.clone();
        let metrics: Option<String> = conn.get(METRICS_KEY).await?;
        
        let mut current_metrics = if let Some(metrics_str) = metrics {
            serde_json::from_str::<QueueMetrics>(&metrics_str)?
        } else {
            QueueMetrics {
                pending_count: 0,
                processing_count: 0,
                failed_count: 0,
                success_rate: 100.0,
                average_processing_time: 0.0,
                retries_count: 0,
                timestamp: Utc::now(),
            }
        };

        // Update success rate with exponential moving average
        let alpha = 0.1; // Smoothing factor
        let new_rate = if success { 100.0 } else { 0.0 };
        current_metrics.success_rate = (alpha * new_rate) + ((1.0 - alpha) * current_metrics.success_rate);

        conn.set(
            METRICS_KEY,
            serde_json::to_string(&current_metrics)?,
        )
        .await?;

        Ok(())
    }

    // Update average processing time
    pub async fn update_processing_time(&self, duration_ms: f64) -> Result<(), MonitoringError> {
        let mut conn = self.redis.clone();
        let metrics: Option<String> = conn.get(METRICS_KEY).await?;
        
        let mut current_metrics = if let Some(metrics_str) = metrics {
            serde_json::from_str::<QueueMetrics>(&metrics_str)?
        } else {
            QueueMetrics {
                pending_count: 0,
                processing_count: 0,
                failed_count: 0,
                success_rate: 100.0,
                average_processing_time: 0.0,
                retries_count: 0,
                timestamp: Utc::now(),
            }
        };

        // Update average processing time with exponential moving average
        let alpha = 0.1; // Smoothing factor
        current_metrics.average_processing_time = 
            (alpha * duration_ms) + ((1.0 - alpha) * current_metrics.average_processing_time);

        conn.set(
            METRICS_KEY,
            serde_json::to_string(&current_metrics)?,
        )
        .await?;

        Ok(())
    }
}
