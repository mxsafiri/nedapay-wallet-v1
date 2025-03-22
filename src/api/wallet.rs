use crate::{
    api::{
        error::ApiError,
        middleware::auth::{require_kyc_level, AuthUser},
        response::{ApiResponse, PaginatedResponse},
    },
    models::wallet::{Wallet, WalletStatus},
};
use axum::{
    extract::{Path, Query, State},
    routing::{get, post},
    Json, Router,
};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;
use validator::Validate;

pub fn wallet_routes() -> Router {
    Router::new()
        .route("/wallets", get(list_wallets).post(create_wallet))
        .route("/wallets/:id", get(get_wallet))
        .route("/wallets/:id/balance", get(get_balance))
}

// Request/Response types
#[derive(Debug, Deserialize, Validate)]
pub struct CreateWalletRequest {
    #[validate(length(min = 1))]
    pub currency: String,
}

#[derive(Debug, Deserialize)]
pub struct ListWalletsQuery {
    pub page: Option<u32>,
    pub per_page: Option<u32>,
    pub currency: Option<String>,
    pub status: Option<WalletStatus>,
}

#[derive(Debug, Serialize)]
pub struct WalletResponse {
    pub id: Uuid,
    pub currency: String,
    pub balance: Decimal,
    pub status: WalletStatus,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

impl From<Wallet> for WalletResponse {
    fn from(wallet: Wallet) -> Self {
        Self {
            id: wallet.id,
            currency: wallet.currency,
            balance: wallet.balance,
            status: wallet.status,
            created_at: wallet.created_at,
        }
    }
}

// Handlers
async fn create_wallet(
    State(pool): State<PgPool>,
    auth_user: AuthUser,
    Json(req): Json<CreateWalletRequest>,
) -> Result<ApiResponse<WalletResponse>, ApiError> {
    // Validate KYC level
    require_kyc_level(1, &auth_user)?;

    // Validate request
    req.validate()
        .map_err(|e| ApiError::ValidationError(e.to_string()))?;

    // Create wallet
    let wallet = Wallet::create(&pool, auth_user.id, &req.currency).await?;

    Ok(ApiResponse::success(WalletResponse::from(wallet)))
}

async fn list_wallets(
    State(pool): State<PgPool>,
    auth_user: AuthUser,
    Query(query): Query<ListWalletsQuery>,
) -> Result<ApiResponse<PaginatedResponse<WalletResponse>>, ApiError> {
    let page = query.page.unwrap_or(1);
    let per_page = query.per_page.unwrap_or(10).min(100);
    let offset = ((page - 1) * per_page) as i64;

    let (wallets, total) = Wallet::list(
        &pool,
        auth_user.id,
        query.currency.as_deref(),
        query.status,
        per_page as i64,
        offset,
    )
    .await?;

    let response = PaginatedResponse::new(
        wallets.into_iter().map(WalletResponse::from).collect(),
        total as u64,
        page,
        per_page,
    );

    Ok(ApiResponse::success(response))
}

async fn get_wallet(
    State(pool): State<PgPool>,
    auth_user: AuthUser,
    Path(wallet_id): Path<Uuid>,
) -> Result<ApiResponse<WalletResponse>, ApiError> {
    let wallet = Wallet::find(&pool, wallet_id).await?;

    // Verify ownership
    if wallet.user_id != auth_user.id {
        return Err(ApiError::AuthorizationError(
            "Not authorized to access this wallet".to_string(),
        ));
    }

    Ok(ApiResponse::success(WalletResponse::from(wallet)))
}

async fn get_balance(
    State(pool): State<PgPool>,
    auth_user: AuthUser,
    Path(wallet_id): Path<Uuid>,
) -> Result<ApiResponse<Decimal>, ApiError> {
    let wallet = Wallet::find(&pool, wallet_id).await?;

    // Verify ownership
    if wallet.user_id != auth_user.id {
        return Err(ApiError::AuthorizationError(
            "Not authorized to access this wallet".to_string(),
        ));
    }

    Ok(ApiResponse::success(wallet.balance))
}
