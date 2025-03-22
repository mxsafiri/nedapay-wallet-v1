use crate::{
    api::{
        error::ApiError,
        middleware::auth::{require_kyc_level, AuthUser},
        response::ApiResponse,
    },
    services::security::{SecurityService, SecurityAlert},
};
use axum::{
    extract::{Path, State},
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use uuid::Uuid;

pub fn security_routes() -> Router {
    Router::new()
        .route("/admin/security/alerts", get(get_alerts))
        .route("/admin/security/alerts/:id/resolve", post(resolve_alert))
        .route("/admin/security/monitor/reserve", post(check_reserve_ratio))
        .route("/admin/security/monitor/access", post(check_system_access))
}

async fn get_alerts(
    State(security): State<Arc<SecurityService>>,
    auth_user: AuthUser,
) -> Result<ApiResponse<Vec<SecurityAlert>>, ApiError> {
    // Require admin access
    require_kyc_level(3, &auth_user)?;

    let alerts = security.get_unresolved_alerts().await
        .map_err(|e| ApiError::InternalError(e.into()))?;

    Ok(ApiResponse::success(alerts))
}

async fn resolve_alert(
    State(security): State<Arc<SecurityService>>,
    auth_user: AuthUser,
    Path(alert_id): Path<Uuid>,
) -> Result<ApiResponse<SecurityAlert>, ApiError> {
    // Require admin access
    require_kyc_level(3, &auth_user)?;

    let alert = security.resolve_alert(alert_id, auth_user.id).await
        .map_err(|e| ApiError::InternalError(e.into()))?;

    Ok(ApiResponse::success(alert))
}

async fn check_reserve_ratio(
    State(security): State<Arc<SecurityService>>,
    auth_user: AuthUser,
) -> Result<ApiResponse<()>, ApiError> {
    // Require admin access
    require_kyc_level(3, &auth_user)?;

    security.monitor_reserve_ratio().await
        .map_err(|e| ApiError::InternalError(e.into()))?;

    Ok(ApiResponse::message("Reserve ratio check completed"))
}

#[derive(Debug, Deserialize)]
struct AccessMonitorRequest {
    action: String,
    ip_address: String,
}

async fn check_system_access(
    State(security): State<Arc<SecurityService>>,
    auth_user: AuthUser,
    Json(req): Json<AccessMonitorRequest>,
) -> Result<ApiResponse<()>, ApiError> {
    // Require admin access
    require_kyc_level(3, &auth_user)?;

    security.monitor_system_access(auth_user.id, &req.action, &req.ip_address).await
        .map_err(|e| ApiError::InternalError(e.into()))?;

    Ok(ApiResponse::message("System access check completed"))
}
