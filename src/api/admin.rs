use crate::{
    api::{
        error::ApiError,
        middleware::auth::{require_kyc_level, AuthUser},
        response::ApiResponse,
    },
    models::user::UserKycLevel,
    services::admin::{AdminService, SystemStats, UserFilter, TransactionFilter},
};
use axum::{
    extract::{Path, Query, State},
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use uuid::Uuid;

pub fn admin_routes() -> Router {
    Router::new()
        // User Management
        .route("/admin/users", get(get_users))
        .route("/admin/users/:id/kyc", post(update_user_kyc))
        // Transaction Management
        .route("/admin/transactions", get(get_transactions))
        // Reserve Management
        .route("/admin/reserve", get(get_reserve_balance))
        .route("/admin/reserve", post(update_reserve_balance))
        // System Statistics
        .route("/admin/stats", get(get_system_stats))
}

// User Management
async fn get_users(
    State(admin): State<Arc<AdminService>>,
    auth_user: AuthUser,
    Query(filter): Query<UserFilter>,
) -> Result<ApiResponse<Vec<crate::models::user::User>>, ApiError> {
    // Require admin access
    require_kyc_level(3, &auth_user)?;

    let users = admin.get_users(&filter).await
        .map_err(|e| ApiError::InternalError(e.into()))?;

    Ok(ApiResponse::success(users))
}

#[derive(Debug, Deserialize)]
struct UpdateKycRequest {
    kyc_level: UserKycLevel,
}

async fn update_user_kyc(
    State(admin): State<Arc<AdminService>>,
    auth_user: AuthUser,
    Path(user_id): Path<Uuid>,
    Json(req): Json<UpdateKycRequest>,
) -> Result<ApiResponse<crate::models::user::User>, ApiError> {
    // Require admin access
    require_kyc_level(3, &auth_user)?;

    let user = admin.update_user_kyc(user_id, req.kyc_level).await
        .map_err(|e| ApiError::InternalError(e.into()))?;

    Ok(ApiResponse::success(user))
}

// Transaction Management
async fn get_transactions(
    State(admin): State<Arc<AdminService>>,
    auth_user: AuthUser,
    Query(filter): Query<TransactionFilter>,
) -> Result<ApiResponse<Vec<crate::models::transaction::Transaction>>, ApiError> {
    // Require admin access
    require_kyc_level(3, &auth_user)?;

    let transactions = admin.get_transactions(&filter).await
        .map_err(|e| ApiError::InternalError(e.into()))?;

    Ok(ApiResponse::success(transactions))
}

// Reserve Management
async fn get_reserve_balance(
    State(admin): State<Arc<AdminService>>,
    auth_user: AuthUser,
) -> Result<ApiResponse<crate::models::reserve::ReserveBalance>, ApiError> {
    // Require admin access
    require_kyc_level(3, &auth_user)?;

    let balance = admin.get_reserve_balance().await
        .map_err(|e| ApiError::InternalError(e.into()))?;

    Ok(ApiResponse::success(balance))
}

#[derive(Debug, Deserialize)]
struct UpdateReserveRequest {
    amount: i64,
    proof_url: String,
}

async fn update_reserve_balance(
    State(admin): State<Arc<AdminService>>,
    auth_user: AuthUser,
    Json(req): Json<UpdateReserveRequest>,
) -> Result<ApiResponse<crate::models::reserve::ReserveBalance>, ApiError> {
    // Require admin access
    require_kyc_level(3, &auth_user)?;

    let balance = admin.update_reserve_balance(req.amount, &req.proof_url).await
        .map_err(|e| ApiError::InternalError(e.into()))?;

    Ok(ApiResponse::success(balance))
}

// System Statistics
async fn get_system_stats(
    State(admin): State<Arc<AdminService>>,
    auth_user: AuthUser,
) -> Result<ApiResponse<SystemStats>, ApiError> {
    // Require admin access
    require_kyc_level(3, &auth_user)?;

    let stats = admin.get_system_stats().await
        .map_err(|e| ApiError::InternalError(e.into()))?;

    Ok(ApiResponse::success(stats))
}
