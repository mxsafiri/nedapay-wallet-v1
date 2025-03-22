use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ApiError {
    #[error("Authentication failed: {0}")]
    AuthenticationError(String),
    
    #[error("Authorization failed: {0}")]
    AuthorizationError(String),
    
    #[error("Invalid input: {0}")]
    ValidationError(String),
    
    #[error("Resource not found: {0}")]
    NotFoundError(String),
    
    #[error("Insufficient funds: {0}")]
    InsufficientFundsError(String),
    
    #[error("Rate limit exceeded")]
    RateLimitError,
    
    #[error("Internal server error")]
    InternalError(#[from] anyhow::Error),
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let (status, error_message) = match self {
            ApiError::AuthenticationError(_) => (StatusCode::UNAUTHORIZED, self.to_string()),
            ApiError::AuthorizationError(_) => (StatusCode::FORBIDDEN, self.to_string()),
            ApiError::ValidationError(_) => (StatusCode::BAD_REQUEST, self.to_string()),
            ApiError::NotFoundError(_) => (StatusCode::NOT_FOUND, self.to_string()),
            ApiError::InsufficientFundsError(_) => (StatusCode::BAD_REQUEST, self.to_string()),
            ApiError::RateLimitError => (StatusCode::TOO_MANY_REQUESTS, self.to_string()),
            ApiError::InternalError(_) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                "Internal server error".to_string(),
            ),
        };

        let body = Json(json!({
            "error": {
                "message": error_message,
                "code": status.as_u16()
            }
        }));

        (status, body).into_response()
    }
}
