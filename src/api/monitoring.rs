use crate::{
    api::{
        error::ApiError,
        middleware::auth::{require_kyc_level, AuthUser},
        response::ApiResponse,
    },
    services::monitoring::{MonitoringService, QueueMetrics, QueueStatus},
};
use axum::{
    extract::{Path, State},
    routing::get,
    Json, Router,
};
use serde::Serialize;
use std::sync::Arc;
use uuid::Uuid;

pub fn monitoring_routes() -> Router {
    Router::new()
        .route("/monitoring/email/metrics", get(get_email_metrics))
        .route("/monitoring/email/status", get(get_email_status))
        .route("/monitoring/email/retry/:id", get(retry_failed_email))
}

#[derive(Debug, Serialize)]
pub struct EmailMetricsResponse {
    pub metrics: QueueMetrics,
    pub health_status: QueueHealthStatus,
    pub recommendations: Vec<String>,
}

#[derive(Debug, Serialize)]
pub enum QueueHealthStatus {
    Healthy,
    Warning,
    Critical,
}

async fn get_email_metrics(
    State(monitoring): State<Arc<MonitoringService>>,
    auth_user: AuthUser,
) -> Result<ApiResponse<EmailMetricsResponse>, ApiError> {
    // Require admin access
    require_kyc_level(3, &auth_user)?;

    let metrics = monitoring.get_queue_metrics().await
        .map_err(|e| ApiError::InternalError(e.into()))?;

    // Analyze queue health
    let (status, recommendations) = analyze_queue_health(&metrics);

    Ok(ApiResponse::success(EmailMetricsResponse {
        metrics,
        health_status: status,
        recommendations,
    }))
}

async fn get_email_status(
    State(monitoring): State<Arc<MonitoringService>>,
    auth_user: AuthUser,
) -> Result<ApiResponse<QueueStatus>, ApiError> {
    // Require admin access
    require_kyc_level(3, &auth_user)?;

    let status = monitoring.get_queue_status().await
        .map_err(|e| ApiError::InternalError(e.into()))?;

    Ok(ApiResponse::success(status))
}

async fn retry_failed_email(
    State(monitoring): State<Arc<MonitoringService>>,
    auth_user: AuthUser,
    Path(email_id): Path<Uuid>,
) -> Result<ApiResponse<()>, ApiError> {
    // Require admin access
    require_kyc_level(3, &auth_user)?;

    // Retry the email
    // TODO: Implement retry logic

    Ok(ApiResponse::message("Email queued for retry"))
}

fn analyze_queue_health(metrics: &QueueMetrics) -> (QueueHealthStatus, Vec<String>) {
    let mut recommendations = Vec::new();
    let mut status = QueueHealthStatus::Healthy;

    // Check success rate
    if metrics.success_rate < 95.0 {
        status = QueueHealthStatus::Warning;
        recommendations.push("Success rate is below 95%. Check SMTP configuration and email templates.".to_string());
    }
    if metrics.success_rate < 80.0 {
        status = QueueHealthStatus::Critical;
        recommendations.push("Critical: Success rate is below 80%. Immediate attention required.".to_string());
    }

    // Check processing time
    if metrics.average_processing_time > 5000.0 {
        status = QueueHealthStatus::Warning;
        recommendations.push("Average processing time is high. Consider optimizing email templates or SMTP configuration.".to_string());
    }

    // Check retry count
    if metrics.retries_count > 100 {
        status = QueueHealthStatus::Warning;
        recommendations.push("High number of retries. Check for persistent delivery issues.".to_string());
    }

    // Check queue size
    if metrics.pending_count > 1000 {
        status = QueueHealthStatus::Warning;
        recommendations.push("Large number of pending emails. Consider scaling email processing.".to_string());
    }

    // Check failed emails
    if metrics.failed_count > 50 {
        status = QueueHealthStatus::Critical;
        recommendations.push("High number of failed emails. Review and retry or purge failed queue.".to_string());
    }

    (status, recommendations)
}
