use crate::models::reserve::{ReserveAccount, ReserveTransaction};
use crate::services::notification::NotificationService;
use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use std::sync::Arc;
use thiserror::Error;
use tokio::time::{self, Duration};
use tracing::{error, info, warn};

#[derive(Debug, Error)]
pub enum ReconciliationError {
    #[error("Database error: {0}")]
    DatabaseError(#[from] sqlx::Error),
    #[error("Reserve ratio below threshold: {0}")]
    ReserveRatioError(Decimal),
    #[error("Reconciliation failed: {0}")]
    ReconciliationFailed(String),
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ReconciliationReport {
    pub timestamp: DateTime<Utc>,
    pub wallet_total: Decimal,
    pub reserve_total: Decimal,
    pub ratio: Decimal,
    pub discrepancy: Option<Decimal>,
    pub status: ReconciliationStatus,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum ReconciliationStatus {
    Success,
    Warning,
    Error,
}

pub struct ReconciliationService {
    pool: Arc<PgPool>,
    notification_service: Arc<NotificationService>,
    min_reserve_ratio: Decimal,
    warning_reserve_ratio: Decimal,
}

impl ReconciliationService {
    pub fn new(
        pool: Arc<PgPool>,
        notification_service: Arc<NotificationService>,
        min_reserve_ratio: Decimal,
        warning_reserve_ratio: Decimal,
    ) -> Self {
        Self {
            pool,
            notification_service,
            min_reserve_ratio,
            warning_reserve_ratio,
        }
    }

    /// Starts the periodic reconciliation process
    pub async fn start_periodic_reconciliation(&self) {
        let pool = Arc::clone(&self.pool);
        let notification_service = Arc::clone(&self.notification_service);
        let min_ratio = self.min_reserve_ratio;
        let warning_ratio = self.warning_reserve_ratio;

        tokio::spawn(async move {
            let mut interval = time::interval(Duration::from_secs(24 * 60 * 60)); // Daily

            loop {
                interval.tick().await;
                match Self::perform_reconciliation(&pool, min_ratio, warning_ratio).await {
                    Ok(report) => {
                        info!("Daily reconciliation completed: {:?}", report);
                        if let Some(discrepancy) = report.discrepancy {
                            if discrepancy != Decimal::ZERO {
                                notification_service
                                    .send_alert(
                                        "Reconciliation Discrepancy",
                                        &format!(
                                            "Found discrepancy of {} in daily reconciliation",
                                            discrepancy
                                        ),
                                    )
                                    .await;
                            }
                        }
                    }
                    Err(e) => {
                        error!("Reconciliation failed: {}", e);
                        notification_service
                            .send_alert("Reconciliation Failed", &e.to_string())
                            .await;
                    }
                }
            }
        });
    }

    /// Performs the reconciliation process
    async fn perform_reconciliation(
        pool: &PgPool,
        min_ratio: Decimal,
        warning_ratio: Decimal,
    ) -> Result<ReconciliationReport, ReconciliationError> {
        let mut tx = pool.begin().await?;

        // Get total wallet balances and reserve amounts
        let totals = sqlx::query!(
            r#"
            WITH wallet_total AS (
                SELECT COALESCE(SUM(balance), 0) as total
                FROM wallets
                WHERE status = 'active'
            ),
            reserve_total AS (
                SELECT COALESCE(SUM(balance), 0) as total
                FROM reserve_accounts
                WHERE status = 'active'
            )
            SELECT 
                w.total as wallet_total,
                r.total as reserve_total
            FROM wallet_total w
            CROSS JOIN reserve_total r
            "#
        )
        .fetch_one(&mut *tx)
        .await?;

        let wallet_total = totals.wallet_total.unwrap_or(Decimal::ZERO);
        let reserve_total = totals.reserve_total.unwrap_or(Decimal::ZERO);
        let ratio = if wallet_total.is_zero() {
            Decimal::ONE
        } else {
            reserve_total / wallet_total
        };

        // Check reserve ratio
        let status = if ratio < min_ratio {
            error!("Reserve ratio {} below minimum threshold {}", ratio, min_ratio);
            ReconciliationStatus::Error
        } else if ratio < warning_ratio {
            warn!("Reserve ratio {} below warning threshold {}", ratio, warning_ratio);
            ReconciliationStatus::Warning
        } else {
            ReconciliationStatus::Success
        };

        // Calculate discrepancy
        let discrepancy = if wallet_total != reserve_total {
            Some(reserve_total - wallet_total)
        } else {
            None
        };

        // If there's a discrepancy, create a reconciliation transaction
        if let Some(diff) = discrepancy {
            if diff != Decimal::ZERO {
                // Create reconciliation transaction
                ReserveTransaction::daily_reconciliation(pool).await?;
            }
        }

        // Create reconciliation report
        let report = ReconciliationReport {
            timestamp: Utc::now(),
            wallet_total,
            reserve_total,
            ratio,
            discrepancy,
            status,
        };

        // Store reconciliation report in database
        sqlx::query!(
            r#"
            INSERT INTO audit_logs (
                action, entity_type, entity_id, changes
            )
            VALUES (
                'reconciliation',
                'system',
                $1,
                $2
            )
            "#,
            Uuid::new_v4(),
            serde_json::to_value(&report)?
        )
        .execute(&mut *tx)
        .await?;

        tx.commit().await?;

        // If ratio is below minimum, return error
        if ratio < min_ratio {
            return Err(ReconciliationError::ReserveRatioError(ratio));
        }

        Ok(report)
    }

    /// Manually triggers a reconciliation
    pub async fn trigger_reconciliation(&self) -> Result<ReconciliationReport, ReconciliationError> {
        Self::perform_reconciliation(
            &self.pool,
            self.min_reserve_ratio,
            self.warning_reserve_ratio,
        )
        .await
    }
}
