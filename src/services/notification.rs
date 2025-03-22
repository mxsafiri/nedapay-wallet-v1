use serde::Serialize;
use std::sync::Arc;
use tokio::sync::Mutex;
use tracing::{error, info};

#[derive(Debug, Serialize)]
pub struct Alert {
    pub title: String,
    pub message: String,
    pub timestamp: chrono::DateTime<chrono::Utc>,
    pub severity: AlertSeverity,
}

#[derive(Debug, Serialize)]
pub enum AlertSeverity {
    Info,
    Warning,
    Error,
}

pub struct NotificationService {
    alerts: Arc<Mutex<Vec<Alert>>>,
    // Add email client, SMS client, etc. as needed
}

impl NotificationService {
    pub fn new() -> Self {
        Self {
            alerts: Arc::new(Mutex::new(Vec::new())),
        }
    }

    /// Sends an alert through configured channels
    pub async fn send_alert(&self, title: &str, message: &str) {
        let alert = Alert {
            title: title.to_string(),
            message: message.to_string(),
            timestamp: chrono::Utc::now(),
            severity: AlertSeverity::Warning,
        };

        // Store alert
        self.store_alert(alert.clone()).await;

        // Log alert
        info!("Alert: {} - {}", title, message);

        // TODO: Implement email/SMS notifications
    }

    /// Stores an alert in memory
    async fn store_alert(&self, alert: Alert) {
        let mut alerts = self.alerts.lock().await;
        alerts.push(alert);

        // Keep only last 100 alerts
        if alerts.len() > 100 {
            alerts.remove(0);
        }
    }

    /// Gets recent alerts
    pub async fn get_recent_alerts(&self) -> Vec<Alert> {
        let alerts = self.alerts.lock().await;
        alerts.clone()
    }
}
