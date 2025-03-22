use std::env;

/// Represents the deployment mode of the application
#[derive(Debug, Clone, PartialEq)]
pub enum DeploymentMode {
    /// Demo mode for bank partner demonstrations
    /// - Uses sandbox APIs
    /// - Restricts certain features
    /// - Shows mock data
    Demo,
    
    /// Production mode for real users
    /// - Uses live APIs
    /// - Full feature access
    /// - Real transaction processing
    Production,
}

impl DeploymentMode {
    /// Returns true if running in demo mode
    pub fn is_demo(&self) -> bool {
        matches!(self, DeploymentMode::Demo)
    }

    /// Returns true if running in production mode
    pub fn is_production(&self) -> bool {
        matches!(self, DeploymentMode::Production)
    }
}

impl Default for DeploymentMode {
    fn default() -> Self {
        DeploymentMode::Production
    }
}

impl From<String> for DeploymentMode {
    fn from(s: String) -> Self {
        match s.to_lowercase().as_str() {
            "demo" => DeploymentMode::Demo,
            _ => DeploymentMode::Production,
        }
    }
}

/// Get the current deployment mode from environment
/// 
/// # Returns
/// - `DeploymentMode::Demo` if DEPLOYMENT_MODE=demo
/// - `DeploymentMode::Production` otherwise
/// 
/// # Example
/// ```rust
/// use crate::config::deployment::get_deployment_mode;
/// 
/// let mode = get_deployment_mode();
/// if mode.is_demo() {
///     println!("Running in demo mode!");
/// }
/// ```
pub fn get_deployment_mode() -> DeploymentMode {
    env::var("DEPLOYMENT_MODE")
        .map(DeploymentMode::from)
        .unwrap_or_default()
}

/// Configuration for demo mode features
#[derive(Debug, Clone)]
pub struct DemoConfig {
    /// Artificial delay for API responses (in milliseconds)
    pub api_delay: u64,
    
    /// Probability of simulated transaction failure (0.0 - 1.0)
    pub failure_rate: f64,
    
    /// Maximum allowed transaction amount in demo mode
    pub max_transaction_amount: f64,
}

impl Default for DemoConfig {
    fn default() -> Self {
        Self {
            api_delay: 2000,
            failure_rate: 0.1,
            max_transaction_amount: 10000.0,
        }
    }
}

/// Get demo mode configuration
/// Only relevant when running in demo mode
pub fn get_demo_config() -> DemoConfig {
    DemoConfig {
        api_delay: env::var("DEMO_API_DELAY")
            .ok()
            .and_then(|v| v.parse().ok())
            .unwrap_or(2000),
        
        failure_rate: env::var("DEMO_FAILURE_RATE")
            .ok()
            .and_then(|v| v.parse().ok())
            .unwrap_or(0.1),
            
        max_transaction_amount: env::var("DEMO_MAX_TRANSACTION")
            .ok()
            .and_then(|v| v.parse().ok())
            .unwrap_or(10000.0),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_deployment_mode_from_string() {
        assert!(matches!(DeploymentMode::from("demo".to_string()), DeploymentMode::Demo));
        assert!(matches!(DeploymentMode::from("DEMO".to_string()), DeploymentMode::Demo));
        assert!(matches!(DeploymentMode::from("production".to_string()), DeploymentMode::Production));
        assert!(matches!(DeploymentMode::from("invalid".to_string()), DeploymentMode::Production));
    }
    
    #[test]
    fn test_deployment_mode_helpers() {
        let demo = DeploymentMode::Demo;
        let prod = DeploymentMode::Production;
        
        assert!(demo.is_demo());
        assert!(!demo.is_production());
        assert!(!prod.is_demo());
        assert!(prod.is_production());
    }
}
