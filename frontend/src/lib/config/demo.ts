/**
 * Demo mode configuration
 * Controls behavior of the banking partner demo deployment
 */

import { z } from 'zod';

export interface DemoScenario {
  delay: number;
  failureRate: number;
  description: string;
  features?: {
    retryable?: boolean;
    reconciliation?: boolean;
    partialSuccess?: boolean;
  };
}

export interface DemoResponse {
  status: 'success' | 'failed' | 'pending' | 'partial';
  delay: number;
  error?: string;
  details?: {
    retryAfter?: number;
    partialAmount?: number;
    reconciliationId?: string;
  };
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
  // New scenarios
  peakHours: {
    delay: 3000,
    failureRate: 0.15,
    description: 'Peak hours with increased latency',
    features: {
      retryable: true,
      reconciliation: true,
    },
  },
  maintenanceWindow: {
    delay: 8000,
    failureRate: 0.8,
    description: 'System maintenance with limited availability',
    features: {
      retryable: true,
    },
  },
  networkIssues: {
    delay: 4000,
    failureRate: 0.3,
    description: 'Network connectivity problems',
    features: {
      retryable: true,
      reconciliation: true,
    },
  },
  partialSettlement: {
    delay: 1500,
    failureRate: 0.2,
    description: 'Partial settlement due to liquidity',
    features: {
      partialSuccess: true,
      reconciliation: true,
    },
  },
  internationalTransfer: {
    delay: 6000,
    failureRate: 0.25,
    description: 'International transfer with compliance checks',
    features: {
      reconciliation: true,
    },
  },
  complianceHold: {
    delay: 10000,
    failureRate: 0.4,
    description: 'Transactions held for compliance review',
    features: {
      retryable: true,
      reconciliation: true,
    },
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
  retryableError: {
    status: 'failed',
    delay: 1000,
    error: 'Temporary error, please retry',
    details: {
      retryAfter: 3000,
    },
  },
  partialSettlement: {
    status: 'partial',
    delay: 1500,
    details: {
      partialAmount: 500,
      reconciliationId: 'RECON-123',
    },
  },
};

interface ScenarioConfig {
  delay: number;
  failureRate: number;
  description: string;
  features?: {
    retryable?: boolean;
    reconciliation?: boolean;
    partialSuccess?: boolean;
  };
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

export const demoConfigNew = {
  limits: {
    maxDailyTransactions: 1000,
    maxTransactionAmount: 10000,
    minTransactionAmount: 1,
  },
  delays: {
    transactionProcessing: 2000, // 2 seconds
    bankVerification: 1500,      // 1.5 seconds
    reconciliation: 3000,        // 3 seconds
  },
  scenarios: {
    normal: {
      name: 'Normal Operation',
      description: 'Standard banking operations with typical success rates',
      failureRate: 0.01,        // 1% failure rate
      avgProcessingTime: 2000,  // 2 seconds
    },
    highLoad: {
      name: 'High Load',
      description: 'Simulated high transaction volume with increased delays',
      failureRate: 0.05,        // 5% failure rate
      avgProcessingTime: 4000,  // 4 seconds
    },
    degraded: {
      name: 'Degraded Service',
      description: 'Banking system under stress with higher failure rates',
      failureRate: 0.15,        // 15% failure rate
      avgProcessingTime: 6000,  // 6 seconds
    },
    maintenance: {
      name: 'Maintenance Mode',
      description: 'System in maintenance with limited functionality',
      failureRate: 1,           // 100% failure rate
      avgProcessingTime: 1000,  // 1 second
    },
  },
} as const;

// Define scenario types based on the config
export type ScenarioType = keyof typeof demoConfigNew.scenarios;
const scenarioTypes = ['normal', 'highLoad', 'degraded', 'maintenance'] as const;

export const DemoTransactionSchema = z.object({
  amount: z.number()
    .min(demoConfigNew.limits.minTransactionAmount)
    .max(demoConfigNew.limits.maxTransactionAmount),
  type: z.enum(['deposit', 'withdrawal', 'transfer'] as const),
  scenario: z.enum(scenarioTypes).optional(),
});

export type DemoTransaction = z.infer<typeof DemoTransactionSchema>;

export function resetDemoEnvironmentNew() {
  // Reset all demo-related state
  localStorage.removeItem('demo_scenario');
  localStorage.removeItem('demo_transactions');
  localStorage.removeItem('demo_balances');
  
  // Reset to default scenario
  return demoConfigNew.scenarios.normal;
}
