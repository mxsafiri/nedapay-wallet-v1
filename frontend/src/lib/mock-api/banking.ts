import { demoConfig, demoScenarios, shouldFail, getRandomDelay, getRandomDiscrepancy } from '../config/demo';
import type { BankTransaction, BankTransactionResponse } from '../services/banking';
import type { ReconciliationResult } from '../services/transaction';

// Re-export the BankTransaction type for components
export type { BankTransaction, BankTransactionResponse };

export class MockBankingApi {
  private transactions = new Map<string, BankTransaction>();
  private currentScenario = demoConfig.defaultScenario;

  /**
   * Set the current demo scenario
   */
  setScenario(scenarioName: string): void {
    if (scenarioName in demoScenarios) {
      this.currentScenario = scenarioName;
    }
  }

  /**
   * Process a transaction based on current scenario
   */
  private async processTransaction(transaction: BankTransaction): Promise<BankTransaction> {
    const delay = demoScenarios[this.currentScenario].delay;
    await new Promise(resolve => setTimeout(resolve, delay));

    if (shouldFail(demoScenarios[this.currentScenario].failureRate)) {
      throw new Error('Transaction failed due to demo scenario settings');
    }

    const updatedTransaction = {
      ...transaction,
      status: 'completed' as const,
      updatedAt: new Date().toISOString(),
    };

    this.transactions.set(transaction.id, updatedTransaction);
    return updatedTransaction;
  }

  /**
   * Mock bank deposit
   */
  async bankDeposit(
    amount: number,
    accountNumber: string,
    bankName: string
  ): Promise<BankTransactionResponse> {
    if (amount > demoConfig.limits.maxTransactionValue) {
      throw new Error('Amount exceeds maximum transaction limit');
    }

    const transaction: BankTransaction = {
      id: `dep_${Date.now()}`,
      type: 'deposit',
      amount,
      status: 'pending',
      bankDetails: {
        accountNumber,
        bankName,
      },
      reference: `REF${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.transactions.set(transaction.id, transaction);
    const processedTransaction = await this.processTransaction(transaction);
    
    return {
      transaction: processedTransaction,
      reference: processedTransaction.reference,
      message: 'Deposit initiated successfully',
      redirectUrl: 'https://bank.example.com/pay',
    };
  }

  /**
   * Mock bank withdrawal
   */
  async bankWithdraw(
    amount: number,
    accountNumber: string,
    bankName: string
  ): Promise<BankTransactionResponse> {
    if (amount > demoConfig.limits.maxTransactionValue) {
      throw new Error('Amount exceeds maximum transaction limit');
    }

    const transaction: BankTransaction = {
      id: `wit_${Date.now()}`,
      type: 'withdrawal',
      amount,
      status: 'pending',
      bankDetails: {
        accountNumber,
        bankName,
      },
      reference: `REF${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.transactions.set(transaction.id, transaction);
    const processedTransaction = await this.processTransaction(transaction);
    
    return {
      transaction: processedTransaction,
      reference: processedTransaction.reference,
      message: 'Withdrawal initiated successfully',
    };
  }

  /**
   * Mock mobile deposit
   */
  async mobileDeposit(
    amount: number,
    phoneNumber: string,
    provider: string
  ): Promise<BankTransactionResponse> {
    if (amount > demoConfig.limits.maxTransactionValue) {
      throw new Error('Amount exceeds maximum transaction limit');
    }

    const transaction: BankTransaction = {
      id: `mob_${Date.now()}`,
      type: 'deposit',
      amount,
      status: 'pending',
      bankDetails: {
        accountNumber: phoneNumber,
        bankName: provider,
      },
      reference: `REF${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.transactions.set(transaction.id, transaction);
    const processedTransaction = await this.processTransaction(transaction);
    
    return {
      transaction: processedTransaction,
      reference: processedTransaction.reference,
      message: 'Mobile deposit initiated successfully',
      redirectUrl: 'https://mobile.example.com/pay',
    };
  }

  /**
   * Mock transaction status check
   */
  async checkTransactionStatus(transactionId: string): Promise<BankTransaction> {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }
    return transaction;
  }

  /**
   * Trigger reconciliation process
   */
  async triggerReconciliation(transactionId: string): Promise<ReconciliationResult> {
    const transaction = await this.checkTransactionStatus(transactionId);
    
    // Only reconcile completed transactions
    if (transaction.status !== 'completed') {
      return {
        success: false,
        reserveBalance: 0,
        walletBalance: 0,
        discrepancy: null,
        error: 'Cannot reconcile incomplete transaction',
      };
    }

    const hasDiscrepancy = Math.random() > 0.8;
    const discrepancy = hasDiscrepancy ? getRandomDiscrepancy() : null;

    return {
      success: !hasDiscrepancy,
      reserveBalance: transaction.amount,
      walletBalance: hasDiscrepancy ? transaction.amount + (discrepancy || 0) : transaction.amount,
      discrepancy,
      error: hasDiscrepancy ? 'Discrepancy detected in reconciliation' : undefined,
    };
  }

  /**
   * Reset the mock API state
   */
  reset(): void {
    this.transactions.clear();
    this.currentScenario = demoConfig.defaultScenario;
  }
}

// Export a singleton instance
export const mockBankingApi = new MockBankingApi();
