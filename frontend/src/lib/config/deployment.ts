/**
 * Deployment mode for the application
 * @enum {string}
 */
export type DeploymentMode = 'demo' | 'production';

/**
 * Configuration for demo mode features
 */
export interface DemoConfig {
  /** Artificial delay for API responses (in milliseconds) */
  apiDelay: number;
  /** Probability of simulated transaction failure (0.0 - 1.0) */
  failureRate: number;
  /** Maximum allowed transaction amount in demo mode */
  maxTransactionAmount: number;
}

/**
 * Get the current deployment mode from environment
 * @returns {DeploymentMode} Current deployment mode
 */
export const getDeploymentMode = (): DeploymentMode => {
  return (process.env.NEXT_PUBLIC_DEPLOYMENT_MODE === 'demo' ? 'demo' : 'production');
};

/**
 * Check if the application is running in demo mode
 * @returns {boolean} True if running in demo mode
 */
export const isDemoMode = (): boolean => {
  return getDeploymentMode() === 'demo';
};

/**
 * Get demo mode configuration
 * Only relevant when running in demo mode
 * @returns {DemoConfig} Demo mode configuration
 */
export const getDemoConfig = (): DemoConfig => {
  return {
    apiDelay: parseInt(process.env.NEXT_PUBLIC_MOCK_API_DELAY || '2000', 10),
    failureRate: parseFloat(process.env.NEXT_PUBLIC_MOCK_FAILURE_RATE || '0.1'),
    maxTransactionAmount: parseFloat(process.env.NEXT_PUBLIC_DEMO_MAX_TRANSACTION || '10000'),
  };
};

/**
 * Feature flags configuration based on deployment mode
 */
export const features = {
  /** Core features - always enabled */
  enableCore: true,
  
  /** Demo-only features */
  enableMockApi: isDemoMode(),
  enableTestData: isDemoMode(),
  
  /** Production-only features */
  enableLiveApi: !isDemoMode(),
  enableRealTransactions: !isDemoMode(),
  
  /** MVP limitations */
  enableStaking: false,
  enableGovernance: false,
  enableLending: false,
  
  /** Configurable features */
  enableKyc: process.env.NEXT_PUBLIC_ENABLE_KYC === 'true',
  enableTransactions: process.env.NEXT_PUBLIC_ENABLE_TRANSACTIONS === 'true',
};

// Log deployment mode on app initialization
if (typeof window !== 'undefined') {
  const mode = getDeploymentMode();
  console.log(`🚀 NEDApay Wallet running in ${mode} mode`);
  
  if (isDemoMode()) {
    console.log('⚠️ Demo Mode - Limited features enabled');
    console.log('Features:', features);
  }
}
