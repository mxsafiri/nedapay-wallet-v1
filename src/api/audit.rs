use crate::{
    api::{
        error::ApiError,
        middleware::auth::{require_kyc_level, AuthUser},
        response::ApiResponse,
    },
    services::audit::AuditService,
};
use axum::{
    extract::{Path, Query, State},
    routing::get,
    Router,
};
use serde::Deserialize;
use std::sync::Arc;
use uuid::Uuid;

pub fn audit_routes() -> Router {
    Router::new()
        .route("/admin/audit/logs", get(get_admin_logs))
        .route("/admin/audit/entity/:type/:id", get(get_entity_logs))
        .route("/admin/audit/search", get(search_logs))
}

#[derive(Debug, Deserialize)]
struct PaginationQuery {
    limit: Option<i64>,
    offset: Option<i64>,
}

async fn get_admin_logs(
    State(audit): State<Arc<AuditService>>,
    auth_user: AuthUser,
    Query(pagination): Query<PaginationQuery>,
) -> Result<ApiResponse<Vec<crate::models::audit::AuditLog>>, ApiError> {
    // Require admin access
    require_kyc_level(3, &auth_user)?;

    let limit = pagination.limit.unwrap_or(50);
    let offset = pagination.offset.unwrap_or(0);

    let logs = audit.get_admin_logs(auth_user.id, limit, offset).await
        .map_err(|e| ApiError::InternalError(e.into()))?;

    Ok(ApiResponse::success(logs))
}

#[derive(Debug, Deserialize)]
struct EntityPathParams {
    r#type: String,
    id: Uuid,
}

async fn get_entity_logs(
    State(audit): State<Arc<AuditService>>,
    auth_user: AuthUser,
    Path(params): Path<EntityPathParams>,
    Query(pagination): Query<PaginationQuery>,
) -> Result<ApiResponse<Vec<crate::models::audit::AuditLog>>, ApiError> {
    // Require admin access
    require_kyc_level(3, &auth_user)?;

    let limit = pagination.limit.unwrap_or(50);
    let offset = pagination.offset.unwrap_or(0);

    let logs = audit.get_entity_logs(&params.r#type, params.id, limit, offset).await
        .map_err(|e| ApiError::InternalError(e.into()))?;

    Ok(ApiResponse::success(logs))
}

#[derive(Debug, Deserialize)]
struct SearchQuery {
    q: String,
    #[serde(flatten)]
    pagination: PaginationQuery,
}

async fn search_logs(
    State(audit): State<Arc<AuditService>>,
    auth_user: AuthUser,
    Query(query): Query<SearchQuery>,
) -> Result<ApiResponse<Vec<crate::models::audit::AuditLog>>, ApiError> {
    // Require admin access
    require_kyc_level(3, &auth_user)?;

    let limit = query.pagination.limit.unwrap_or(50);
    let offset = query.pagination.offset.unwrap_or(0);

    let logs = audit.search_logs(&query.q, limit, offset).await
        .map_err(|e| ApiError::InternalError(e.into()))?;

    Ok(ApiResponse::success(logs))
}
