mod api;
mod auth;
mod config;
mod db;
mod handlers;
mod models;
mod services;
mod utils;

use axum::{
    routing::{get, post},
    Router,
};
use std::net::SocketAddr;
use tower_http::cors::CorsLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "info".into()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Load environment variables
    dotenv::dotenv().ok();

    // Initialize the database connection pool
    let db_pool = db::init_db_pool().await;
    
    // Initialize Redis connection
    let redis_client = services::cache::init_redis().await;

    // Build our application with a route
    let app = Router::new()
        .route("/health", get(handlers::health::health_check))
        .route("/api/v1/auth/register", post(handlers::auth::register))
        .route("/api/v1/auth/login", post(handlers::auth::login))
        .route("/api/v1/wallet/balance", get(handlers::wallet::get_balance))
        .route("/api/v1/wallet/deposit", post(handlers::wallet::deposit))
        .route("/api/v1/wallet/withdraw", post(handlers::wallet::withdraw))
        .layer(CorsLayer::permissive()) // Configure CORS for development
        .with_state(db_pool);

    // Run the server
    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    tracing::info!("listening on {}", addr);
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}
