use crate::{
    api::{error::ApiError, response::ApiResponse},
    models::user::{User, UserStatus},
};
use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use axum::{
    extract::State,
    routing::{get, post},
    Json, Router,
};
use jsonwebtoken::{encode, EncodingKey, Header};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use time::OffsetDateTime;
use validator::Validate;

pub fn auth_routes() -> Router {
    Router::new()
        .route("/auth/register", post(register))
        .route("/auth/login", post(login))
        .route("/auth/verify-email", post(verify_email))
        .route("/auth/request-reset", post(request_password_reset))
        .route("/auth/reset-password", post(reset_password))
        .route("/auth/enable-2fa", post(enable_2fa))
        .route("/auth/verify-2fa", post(verify_2fa))
}

#[derive(Debug, Deserialize, Validate)]
pub struct RegisterRequest {
    #[validate(email)]
    pub email: String,
    #[validate(length(min = 8))]
    pub password: String,
    #[validate(length(min = 2))]
    pub full_name: String,
    pub phone_number: Option<String>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct LoginRequest {
    #[validate(email)]
    pub email: String,
    pub password: String,
    pub totp_code: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct AuthResponse {
    pub token: String,
    pub user: UserResponse,
}

#[derive(Debug, Serialize)]
pub struct UserResponse {
    pub id: uuid::Uuid,
    pub email: String,
    pub full_name: String,
    pub phone_number: Option<String>,
    pub kyc_status: String,
    pub kyc_level: i32,
    pub two_factor_enabled: bool,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

impl From<User> for UserResponse {
    fn from(user: User) -> Self {
        Self {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            phone_number: user.phone_number,
            kyc_status: user.kyc_status.to_string(),
            kyc_level: user.kyc_level,
            two_factor_enabled: user.two_factor_enabled,
            created_at: user.created_at,
        }
    }
}

async fn register(
    State(pool): State<PgPool>,
    Json(req): Json<RegisterRequest>,
) -> Result<ApiResponse<UserResponse>, ApiError> {
    // Validate request
    req.validate()
        .map_err(|e| ApiError::ValidationError(e.to_string()))?;

    // Check if user exists
    if User::find_by_email(&pool, &req.email).await?.is_some() {
        return Err(ApiError::ValidationError("Email already registered".to_string()));
    }

    // Hash password
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let password_hash = argon2
        .hash_password(req.password.as_bytes(), &salt)
        .map_err(|e| ApiError::InternalError(e.into()))?
        .to_string();

    // Create user
    let user = User::create(
        &pool,
        &req.email,
        &password_hash,
        &req.full_name,
        req.phone_number.as_deref(),
    )
    .await?;

    // Send verification email
    // TODO: Implement email service
    
    Ok(ApiResponse::success(UserResponse::from(user)))
}

async fn login(
    State(pool): State<PgPool>,
    Json(req): Json<LoginRequest>,
) -> Result<ApiResponse<AuthResponse>, ApiError> {
    // Validate request
    req.validate()
        .map_err(|e| ApiError::ValidationError(e.to_string()))?;

    // Find user
    let user = User::find_by_email(&pool, &req.email)
        .await?
        .ok_or_else(|| ApiError::AuthenticationError("Invalid credentials".to_string()))?;

    // Verify password
    let parsed_hash = PasswordHash::new(&user.password_hash)
        .map_err(|e| ApiError::InternalError(e.into()))?;
    
    if !Argon2::default()
        .verify_password(req.password.as_bytes(), &parsed_hash)
        .is_ok()
    {
        return Err(ApiError::AuthenticationError("Invalid credentials".to_string()));
    }

    // Check user status
    if user.status != UserStatus::Active {
        return Err(ApiError::AuthenticationError(
            "Account is not active".to_string(),
        ));
    }

    // Verify 2FA if enabled
    if user.two_factor_enabled {
        if let Some(totp_code) = req.totp_code {
            if !verify_totp(&user.totp_secret.unwrap(), &totp_code) {
                return Err(ApiError::AuthenticationError("Invalid 2FA code".to_string()));
            }
        } else {
            return Err(ApiError::AuthenticationError("2FA code required".to_string()));
        }
    }

    // Generate JWT
    let claims = Claims {
        sub: user.id,
        exp: (OffsetDateTime::now_utc() + time::Duration::hours(24)).unix_timestamp() as usize,
        iat: OffsetDateTime::now_utc().unix_timestamp() as usize,
        kyc_level: user.kyc_level,
    };

    let token = encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(std::env::var("JWT_SECRET").unwrap().as_bytes()),
    )
    .map_err(|e| ApiError::InternalError(e.into()))?;

    Ok(ApiResponse::success(AuthResponse {
        token,
        user: UserResponse::from(user),
    }))
}

async fn verify_email(
    State(pool): State<PgPool>,
    Json(token): Json<String>,
) -> Result<ApiResponse<()>, ApiError> {
    // Verify token and update user
    // TODO: Implement email verification logic
    Ok(ApiResponse::message("Email verified successfully"))
}

async fn request_password_reset(
    State(pool): State<PgPool>,
    Json(email): Json<String>,
) -> Result<ApiResponse<()>, ApiError> {
    // Generate reset token and send email
    // TODO: Implement password reset logic
    Ok(ApiResponse::message("Password reset instructions sent"))
}

async fn reset_password(
    State(pool): State<PgPool>,
    Json(req): Json<ResetPasswordRequest>,
) -> Result<ApiResponse<()>, ApiError> {
    // Verify token and update password
    // TODO: Implement password reset logic
    Ok(ApiResponse::message("Password reset successfully"))
}

#[derive(Debug, Deserialize, Validate)]
pub struct ResetPasswordRequest {
    pub token: String,
    #[validate(length(min = 8))]
    pub new_password: String,
}

async fn enable_2fa(
    State(pool): State<PgPool>,
    auth_user: AuthUser,
) -> Result<ApiResponse<TwoFactorResponse>, ApiError> {
    // Generate TOTP secret and QR code
    // TODO: Implement 2FA setup
    Ok(ApiResponse::message("2FA enabled successfully"))
}

#[derive(Debug, Serialize)]
pub struct TwoFactorResponse {
    pub secret: String,
    pub qr_code: String,
}

async fn verify_2fa(
    State(pool): State<PgPool>,
    auth_user: AuthUser,
    Json(code): Json<String>,
) -> Result<ApiResponse<()>, ApiError> {
    // Verify TOTP code
    // TODO: Implement 2FA verification
    Ok(ApiResponse::message("2FA verified successfully"))
}

// Helper function to verify TOTP codes
fn verify_totp(secret: &str, code: &str) -> bool {
    // TODO: Implement TOTP verification
    true
}
