/**
 * Demo mode configuration
 * Controls behavior of the banking partner demo deployment
 */

export interface DemoScenario {
  delay: number;
  failureRate: number;
  description: string;
}

export interface DemoResponse {
  status: 'success' | 'failed' | 'pending';
  delay: number;
  error?: string;
}

/**
 * Predefined transaction scenarios for demos
 */
export const demoScenarios: Record<string, DemoScenario> = {
  instantSuccess: {
    delay: 0,
    failureRate: 0,
    description: 'Instant successful transaction',
  },
  normalProcessing: {
    delay: 2000,
    failureRate: 0.1,
    description: 'Normal processing with occasional failures',
  },
  highFailure: {
    delay: 1000,
    failureRate: 0.5,
    description: 'High failure rate scenario',
  },
  slowProcessing: {
    delay: 5000,
    failureRate: 0.2,
    description: 'Slow processing with moderate failures',
  },
};

/**
 * Mock API response templates
 */
export const mockResponses: Record<string, DemoResponse> = {
  successfulDeposit: {
    status: 'success',
    delay: 2000,
  },
  failedWithdrawal: {
    status: 'failed',
    delay: 1000,
    error: 'Insufficient funds',
  },
  pendingTransaction: {
    status: 'pending',
    delay: 5000,
  },
  networkError: {
    status: 'failed',
    delay: 1000,
    error: 'Network connectivity issues',
  },
};

interface ScenarioConfig {
  delay: number;
  failureRate: number;
  description: string;
}

interface DemoConfig {
  defaultScenario: string;
  autoResetInterval: number;
  maxTransactionAmount: number;
  minTransactionDelay: number;
  scenarios: {
    [key: string]: ScenarioConfig;
  };
  reconciliation: {
    discrepancyRate: number;
    maxDiscrepancy: number;
    autoReconcileInterval: number;
  };
  limits: {
    maxTransactionValue: number;
    maxDailyTransactions: number;
    maxPendingTransactions: number;
  };
  features: {
    allowInternational: boolean;
    allowCrypto: boolean;
    allowStaking: boolean;
    allowLending: boolean;
  };
}

/**
 * Demo environment configuration
 */
export const demoConfig: DemoConfig = {
  defaultScenario: 'normal',
  autoResetInterval: 24 * 60 * 60 * 1000, // 24 hours
  maxTransactionAmount: 10000,
  minTransactionDelay: 500,
  scenarios: {
    default: {
      delay: 1000,
      failureRate: 0.05,
      description: 'Normal processing conditions'
    },
    slow: {
      delay: 3000,
      failureRate: 0.1,
      description: 'Slow network conditions'
    },
    error: {
      delay: 500,
      failureRate: 0.5,
      description: 'High failure rate scenario'
    },
    instant: {
      delay: 100,
      failureRate: 0,
      description: 'Instant processing'
    }
  },
  reconciliation: {
    discrepancyRate: 0.01,
    maxDiscrepancy: 100,
    autoReconcileInterval: 15 * 60 * 1000 // 15 minutes
  },
  limits: {
    maxTransactionValue: 10000,
    maxDailyTransactions: 100,
    maxPendingTransactions: 10
  },
  features: {
    allowInternational: false,
    allowCrypto: false,
    allowStaking: false,
    allowLending: false
  }
}

/**
 * Get a random delay within acceptable range
 */
export function getRandomDelay(min: number = 1000, max: number = 5000): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

/**
 * Check if a transaction should fail based on failure rate
 */
export function shouldFail(failureRate: number): boolean {
  return Math.random() < failureRate;
}

/**
 * Generate a random discrepancy amount
 */
export function getRandomDiscrepancy(maxAmount: number = 100): number {
  return Math.round(Math.random() * maxAmount * 100) / 100;
}

/**
 * Reset demo environment to initial state
 */
export function resetDemoEnvironment(): void {
  // Clear stored transactions
  localStorage.removeItem('demo_transactions');
  // Reset balances
  localStorage.setItem('demo_balance', '10000');
  // Clear pending operations
  localStorage.removeItem('demo_pending');
  // Reset reconciliation state
  localStorage.removeItem('demo_reconciliation');
}
