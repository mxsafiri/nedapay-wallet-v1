use crate::api::error::ApiError;
use axum::{
    async_trait,
    extract::{FromRequestParts, TypedHeader},
    headers::{authorization::Bearer, Authorization},
    http::request::Parts,
    RequestPartsExt,
};
use jsonwebtoken::{decode, DecodingKey, Validation};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: Uuid,        // User ID
    pub exp: usize,       // Expiration time
    pub iat: usize,       // Issued at
    pub kyc_level: i32,   // KYC level for authorization
}

#[derive(Debug, Clone)]
pub struct AuthUser {
    pub id: Uuid,
    pub kyc_level: i32,
}

#[async_trait]
impl<S> FromRequestParts<S> for AuthUser
where
    S: Send + Sync,
{
    type Rejection = ApiError;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        // Extract the token from the Authorization header
        let TypedHeader(Authorization(bearer)) = parts
            .extract::<TypedHeader<Authorization<Bearer>>>()
            .await
            .map_err(|_| ApiError::AuthenticationError("Invalid token".to_string()))?;

        // Decode and validate the token
        let token_data = decode::<Claims>(
            bearer.token(),
            &DecodingKey::from_secret(std::env::var("JWT_SECRET").unwrap().as_bytes()),
            &Validation::default(),
        )
        .map_err(|_| ApiError::AuthenticationError("Invalid token".to_string()))?;

        Ok(AuthUser {
            id: token_data.claims.sub,
            kyc_level: token_data.claims.kyc_level,
        })
    }
}

// Rate limiting middleware using Redis
pub async fn rate_limit(
    redis: &redis::Client,
    user_id: Uuid,
    limit: u32,
    window_secs: u32,
) -> Result<(), ApiError> {
    let mut conn = redis
        .get_async_connection()
        .await
        .map_err(|e| ApiError::InternalError(e.into()))?;

    let key = format!("rate_limit:{}:{}", user_id, window_secs);
    let count: Option<u32> = redis::cmd("GET")
        .arg(&key)
        .query_async(&mut conn)
        .await
        .map_err(|e| ApiError::InternalError(e.into()))?;

    match count {
        Some(c) if c >= limit => Err(ApiError::RateLimitError),
        Some(c) => {
            redis::cmd("INCR")
                .arg(&key)
                .query_async(&mut conn)
                .await
                .map_err(|e| ApiError::InternalError(e.into()))?;
            Ok(())
        }
        None => {
            redis::cmd("SETEX")
                .arg(&key)
                .arg(window_secs)
                .arg(1)
                .query_async(&mut conn)
                .await
                .map_err(|e| ApiError::InternalError(e.into()))?;
            Ok(())
        }
    }
}

// KYC level authorization middleware
pub fn require_kyc_level(required_level: i32, user: &AuthUser) -> Result<(), ApiError> {
    if user.kyc_level < required_level {
        Err(ApiError::AuthorizationError(format!(
            "KYC level {} required. Current level: {}",
            required_level, user.kyc_level
        )))
    } else {
        Ok(())
    }
}
