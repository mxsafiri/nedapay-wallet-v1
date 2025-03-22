use lettre::{
    message::{header, MultiPart, SinglePart},
    transport::smtp::{authentication::Credentials, AsyncSmtpTransport, Tokio1Executor},
    AsyncTransport, Message,
};
use serde::Serialize;
use std::sync::Arc;
use thiserror::Error;
use handlebars::Handlebars;
use crate::services::queue::EmailQueue;

#[derive(Error, Debug)]
pub enum EmailError {
    #[error("Template error: {0}")]
    TemplateError(#[from] handlebars::TemplateError),
    #[error("Email error: {0}")]
    EmailError(#[from] lettre::error::Error),
    #[error("Rendering error: {0}")]
    RenderError(#[from] handlebars::RenderError),
    #[error("Queue error: {0}")]
    QueueError(String),
}

pub struct EmailService {
    mailer: AsyncSmtpTransport<Tokio1Executor>,
    templates: Arc<Handlebars<'static>>,
    from_email: String,
    from_name: String,
    queue: Arc<EmailQueue>,
}

#[derive(Debug, Serialize)]
struct EmailTemplate<T> {
    app_name: String,
    app_url: String,
    support_email: String,
    data: T,
}

impl EmailService {
    pub async fn new(queue: Arc<EmailQueue>) -> Result<Self, EmailError> {
        let creds = Credentials::new(
            std::env::var("SMTP_USERNAME").unwrap(),
            std::env::var("SMTP_PASSWORD").unwrap(),
        );

        let mailer = AsyncSmtpTransport::<Tokio1Executor>::relay(&std::env::var("SMTP_HOST").unwrap())
            .unwrap()
            .credentials(creds)
            .build();

        let mut hb = Handlebars::new();
        // Register email templates
        hb.register_template_string("verify_email", include_str!("../templates/verify_email.hbs"))?;
        hb.register_template_string("reset_password", include_str!("../templates/reset_password.hbs"))?;
        hb.register_template_string("two_factor_enabled", include_str!("../templates/two_factor_enabled.hbs"))?;
        hb.register_template_string("security_alert", include_str!("../templates/security_alert.hbs"))?;

        Ok(Self {
            mailer,
            templates: Arc::new(hb),
            from_email: std::env::var("FROM_EMAIL").unwrap_or_else(|_| "no-reply@nedapay.com".to_string()),
            from_name: std::env::var("FROM_NAME").unwrap_or_else(|_| "NEDApay".to_string()),
            queue,
        })
    }

    // Send verification email
    pub async fn send_verification_email(
        &self,
        to_email: &str,
        full_name: &str,
        token: &str,
    ) -> Result<(), EmailError> {
        #[derive(Serialize)]
        struct VerifyEmailData {
            full_name: String,
            verification_link: String,
        }

        let data = EmailTemplate {
            app_name: "NEDApay".to_string(),
            app_url: std::env::var("APP_URL").unwrap(),
            support_email: std::env::var("SUPPORT_EMAIL").unwrap(),
            data: VerifyEmailData {
                full_name: full_name.to_string(),
                verification_link: format!(
                    "{}/verify-email?token={}",
                    std::env::var("APP_URL").unwrap(),
                    token
                ),
            },
        };

        self.queue_email(
            to_email,
            "Verify Your NEDApay Account",
            "verify_email",
            &data,
        )
        .await
    }

    // Send password reset email
    pub async fn send_password_reset(
        &self,
        to_email: &str,
        full_name: &str,
        token: &str,
    ) -> Result<(), EmailError> {
        #[derive(Serialize)]
        struct ResetPasswordData {
            full_name: String,
            reset_link: String,
        }

        let data = EmailTemplate {
            app_name: "NEDApay".to_string(),
            app_url: std::env::var("APP_URL").unwrap(),
            support_email: std::env::var("SUPPORT_EMAIL").unwrap(),
            data: ResetPasswordData {
                full_name: full_name.to_string(),
                reset_link: format!(
                    "{}/reset-password?token={}",
                    std::env::var("APP_URL").unwrap(),
                    token
                ),
            },
        };

        self.queue_email(
            to_email,
            "Reset Your NEDApay Password",
            "reset_password",
            &data,
        )
        .await
    }

    // Send 2FA enabled notification
    pub async fn send_2fa_enabled(
        &self,
        to_email: &str,
        full_name: &str,
        backup_codes: &[String],
    ) -> Result<(), EmailError> {
        #[derive(Serialize)]
        struct TwoFactorData {
            full_name: String,
            backup_codes: Vec<String>,
        }

        let data = EmailTemplate {
            app_name: "NEDApay".to_string(),
            app_url: std::env::var("APP_URL").unwrap(),
            support_email: std::env::var("SUPPORT_EMAIL").unwrap(),
            data: TwoFactorData {
                full_name: full_name.to_string(),
                backup_codes: backup_codes.to_vec(),
            },
        };

        self.queue_email(
            to_email,
            "Two-Factor Authentication Enabled",
            "two_factor_enabled",
            &data,
        )
        .await
    }

    // Send security alert
    pub async fn send_security_alert(
        &self,
        to_email: &str,
        full_name: &str,
        alert_type: &str,
        details: &str,
    ) -> Result<(), EmailError> {
        #[derive(Serialize)]
        struct SecurityAlertData {
            full_name: String,
            alert_type: String,
            details: String,
            timestamp: String,
        }

        let data = EmailTemplate {
            app_name: "NEDApay".to_string(),
            app_url: std::env::var("APP_URL").unwrap(),
            support_email: std::env::var("SUPPORT_EMAIL").unwrap(),
            data: SecurityAlertData {
                full_name: full_name.to_string(),
                alert_type: alert_type.to_string(),
                details: details.to_string(),
                timestamp: chrono::Utc::now().to_rfc3339(),
            },
        };

        self.queue_email(to_email, "Security Alert", "security_alert", &data).await
    }

    // Queue email for sending
    async fn queue_email<T: Serialize>(
        &self,
        to_email: &str,
        subject: &str,
        template: &str,
        data: &T,
    ) -> Result<(), EmailError> {
        let json_data = serde_json::to_value(data)
            .map_err(|e| EmailError::QueueError(e.to_string()))?;

        self.queue
            .queue_email(to_email, subject, template, json_data)
            .await
            .map_err(|e| EmailError::QueueError(e.to_string()))?;

        Ok(())
    }

    // Internal method to actually send the email
    pub(crate) async fn send_email<T: Serialize>(
        &self,
        to_email: &str,
        subject: &str,
        template: &str,
        data: &T,
    ) -> Result<(), EmailError> {
        let html = self.templates.render(template, &data)?;
        
        let email = Message::builder()
            .from(format!("{} <{}>", self.from_name, self.from_email).parse().unwrap())
            .to(to_email.parse().unwrap())
            .subject(subject)
            .multipart(
                MultiPart::alternative()
                    .singlepart(
                        SinglePart::builder()
                            .header(header::ContentType::TEXT_PLAIN)
                            .body(html.clone()),
                    )
                    .singlepart(
                        SinglePart::builder()
                            .header(header::ContentType::TEXT_HTML)
                            .body(html),
                    ),
            )?;

        self.mailer.send(email).await?;
        Ok(())
    }
}
