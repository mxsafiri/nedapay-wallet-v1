use crate::{
    api::{
        error::ApiError,
        middleware::auth::{require_kyc_level, AuthUser},
        response::{ApiResponse, PaginatedResponse},
    },
    models::{
        transaction::{Transaction, TransactionStatus, TransactionType},
        wallet::Wallet,
    },
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

pub fn transaction_routes() -> Router {
    Router::new()
        .route("/transactions", get(list_transactions).post(create_transaction))
        .route("/transactions/:id", get(get_transaction))
}

// Request/Response types
#[derive(Debug, Deserialize, Validate)]
pub struct CreateTransactionRequest {
    pub transaction_type: TransactionType,
    #[validate(range(min = 0.01))]
    pub amount: Decimal,
    pub currency: String,
    pub debit_wallet_id: Option<Uuid>,
    pub credit_wallet_id: Option<Uuid>,
    pub reference_id: Option<String>,
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Deserialize)]
pub struct ListTransactionsQuery {
    pub page: Option<u32>,
    pub per_page: Option<u32>,
    pub wallet_id: Option<Uuid>,
    pub transaction_type: Option<TransactionType>,
    pub status: Option<TransactionStatus>,
    pub start_date: Option<chrono::DateTime<chrono::Utc>>,
    pub end_date: Option<chrono::DateTime<chrono::Utc>>,
}

#[derive(Debug, Serialize)]
pub struct TransactionResponse {
    pub id: Uuid,
    pub transaction_type: TransactionType,
    pub amount: Decimal,
    pub currency: String,
    pub status: TransactionStatus,
    pub debit_wallet_id: Option<Uuid>,
    pub credit_wallet_id: Option<Uuid>,
    pub reference_id: Option<String>,
    pub metadata: Option<serde_json::Value>,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

impl From<Transaction> for TransactionResponse {
    fn from(tx: Transaction) -> Self {
        Self {
            id: tx.id,
            transaction_type: tx.transaction_type,
            amount: tx.amount,
            currency: tx.currency,
            status: tx.status,
            debit_wallet_id: tx.debit_wallet_id,
            credit_wallet_id: tx.credit_wallet_id,
            reference_id: tx.reference_id,
            metadata: tx.metadata,
            created_at: tx.created_at,
        }
    }
}

// Handlers
async fn create_transaction(
    State(pool): State<PgPool>,
    auth_user: AuthUser,
    Json(req): Json<CreateTransactionRequest>,
) -> Result<ApiResponse<TransactionResponse>, ApiError> {
    // Validate KYC level based on transaction type and amount
    let required_kyc_level = match req.transaction_type {
        TransactionType::Transfer if req.amount > Decimal::new(1000, 0) => 2,
        TransactionType::Withdrawal if req.amount > Decimal::new(500, 0) => 2,
        _ => 1,
    };
    require_kyc_level(required_kyc_level, &auth_user)?;

    // Validate request
    req.validate()
        .map_err(|e| ApiError::ValidationError(e.to_string()))?;

    // Verify wallet ownership and get wallets
    let (debit_wallet, credit_wallet) = match req.transaction_type {
        TransactionType::Transfer => {
            let debit_wallet = match req.debit_wallet_id {
                Some(id) => {
                    let wallet = Wallet::find(&pool, id).await?;
                    if wallet.user_id != auth_user.id {
                        return Err(ApiError::AuthorizationError(
                            "Not authorized to access debit wallet".to_string(),
                        ));
                    }
                    Some(wallet)
                }
                None => None,
            };

            let credit_wallet = match req.credit_wallet_id {
                Some(id) => {
                    let wallet = Wallet::find(&pool, id).await?;
                    Some(wallet)
                }
                None => None,
            };

            (debit_wallet, credit_wallet)
        }
        TransactionType::Deposit => (None, Some(Wallet::find(&pool, req.credit_wallet_id.unwrap()).await?)),
        TransactionType::Withdrawal => (Some(Wallet::find(&pool, req.debit_wallet_id.unwrap()).await?), None),
        _ => (None, None),
    };

    // Create transaction
    let transaction = Transaction::create(
        &pool,
        req.transaction_type,
        req.amount,
        &req.currency,
        debit_wallet.as_ref(),
        credit_wallet.as_ref(),
        req.reference_id,
        req.metadata,
    )
    .await?;

    Ok(ApiResponse::success(TransactionResponse::from(transaction)))
}

async fn list_transactions(
    State(pool): State<PgPool>,
    auth_user: AuthUser,
    Query(query): Query<ListTransactionsQuery>,
) -> Result<ApiResponse<PaginatedResponse<TransactionResponse>>, ApiError> {
    let page = query.page.unwrap_or(1);
    let per_page = query.per_page.unwrap_or(10).min(100);
    let offset = ((page - 1) * per_page) as i64;

    // If wallet_id is specified, verify ownership
    if let Some(wallet_id) = query.wallet_id {
        let wallet = Wallet::find(&pool, wallet_id).await?;
        if wallet.user_id != auth_user.id {
            return Err(ApiError::AuthorizationError(
                "Not authorized to access this wallet's transactions".to_string(),
            ));
        }
    }

    let (transactions, total) = Transaction::list(
        &pool,
        auth_user.id,
        query.wallet_id,
        query.transaction_type,
        query.status,
        query.start_date,
        query.end_date,
        per_page as i64,
        offset,
    )
    .await?;

    let response = PaginatedResponse::new(
        transactions.into_iter().map(TransactionResponse::from).collect(),
        total as u64,
        page,
        per_page,
    );

    Ok(ApiResponse::success(response))
}

async fn get_transaction(
    State(pool): State<PgPool>,
    auth_user: AuthUser,
    Path(transaction_id): Path<Uuid>,
) -> Result<ApiResponse<TransactionResponse>, ApiError> {
    let transaction = Transaction::find(&pool, transaction_id).await?;

    // Verify ownership of either debit or credit wallet
    if let Some(wallet_id) = transaction.debit_wallet_id.or(transaction.credit_wallet_id) {
        let wallet = Wallet::find(&pool, wallet_id).await?;
        if wallet.user_id != auth_user.id {
            return Err(ApiError::AuthorizationError(
                "Not authorized to access this transaction".to_string(),
            ));
        }
    }

    Ok(ApiResponse::success(TransactionResponse::from(transaction)))
}
