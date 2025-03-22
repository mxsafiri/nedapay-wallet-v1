import { mockBankingApi } from '../mock-api/banking';
import { isDemoMode } from '../config/deployment';
import { BankingService } from './banking';
import type { BankTransaction, BankTransactionResponse } from './banking';

export interface TransactionResult {
  transaction: BankTransaction | null;
  error?: string;
  redirectUrl?: string;
}

export interface ReconciliationResult {
  success: boolean;
  reserveBalance: number;
  walletBalance: number;
  discrepancy: number | null;
  error?: string;
}

interface TransactionAPI {
  bankDeposit: (amount: number, accountNumber: string, bankName: string) => Promise<BankTransactionResponse>;
  bankWithdraw: (amount: number, accountNumber: string, bankName: string) => Promise<BankTransactionResponse>;
  mobileDeposit: (amount: number, phoneNumber: string, provider: string) => Promise<BankTransactionResponse>;
  checkTransactionStatus: (transactionId: string) => Promise<BankTransaction>;
  triggerReconciliation: (transactionId: string) => Promise<ReconciliationResult>;
}

/**
 * Service for handling banking transactions
 * Supports both demo and production modes
 */
export class TransactionService {
  /**
   * Get the appropriate API based on deployment mode
   */
  private static getApi(): TransactionAPI {
    return isDemoMode() ? mockBankingApi : this.getLiveApi();
  }

  /**
   * Get the live API for production mode
   */
  private static getLiveApi(): TransactionAPI {
    return {
      bankDeposit: this.handleLiveDeposit.bind(this),
      bankWithdraw: this.handleLiveWithdrawal.bind(this),
      mobileDeposit: this.handleLiveMobileDeposit.bind(this),
      checkTransactionStatus: this.handleLiveStatus.bind(this),
      triggerReconciliation: this.handleLiveReconciliation.bind(this),
    };
  }

  /**
   * Handle live bank deposit
   */
  private static async handleLiveDeposit(
    amount: number,
    accountNumber: string,
    bankName: string
  ): Promise<BankTransactionResponse> {
    return await BankingService.initiateDeposit(amount, accountNumber, bankName);
  }

  /**
   * Handle live bank withdrawal
   */
  private static async handleLiveWithdrawal(
    amount: number,
    accountNumber: string,
    bankName: string
  ): Promise<BankTransactionResponse> {
    return await BankingService.initiateWithdrawal(amount, accountNumber, bankName);
  }

  /**
   * Handle live mobile money deposit
   */
  private static async handleLiveMobileDeposit(
    amount: number,
    phoneNumber: string,
    provider: string
  ): Promise<BankTransactionResponse> {
    throw new Error('Mobile money integration not implemented');
  }

  /**
   * Handle live transaction status check
   */
  private static async handleLiveStatus(
    transactionId: string
  ): Promise<BankTransaction> {
    return await BankingService.checkTransactionStatus(transactionId);
  }

  /**
   * Handle live reconciliation
   */
  private static async handleLiveReconciliation(
    transactionId: string
  ): Promise<ReconciliationResult> {
    throw new Error('Reconciliation not implemented for live mode');
  }

  /**
   * Initialize a bank deposit transaction
   */
  static async initiateDeposit(
    amount: number,
    accountNumber: string,
    bankName: string
  ): Promise<TransactionResult> {
    try {
      const api = this.getApi();
      const response: BankTransactionResponse = await api.bankDeposit(amount, accountNumber, bankName);
      return {
        transaction: response.transaction,
        redirectUrl: response.redirectUrl
      };
    } catch (err) {
      return {
        transaction: null,
        error: err instanceof Error ? err.message : 'Failed to initiate deposit'
      };
    }
  }

  /**
   * Initialize a bank withdrawal transaction
   */
  static async initiateWithdrawal(
    amount: number,
    accountNumber: string,
    bankName: string
  ): Promise<TransactionResult> {
    try {
      const api = this.getApi();
      const response: BankTransactionResponse = await api.bankWithdraw(amount, accountNumber, bankName);
      return {
        transaction: response.transaction,
        redirectUrl: response.redirectUrl
      };
    } catch (err) {
      return {
        transaction: null,
        error: err instanceof Error ? err.message : 'Failed to initiate withdrawal'
      };
    }
  }

  /**
   * Initialize a mobile money deposit
   */
  static async initiateMobileDeposit(
    amount: number,
    phoneNumber: string,
    provider: string
  ): Promise<TransactionResult> {
    try {
      const api = this.getApi();
      const response: BankTransactionResponse = await api.mobileDeposit(amount, phoneNumber, provider);
      return {
        transaction: response.transaction,
        redirectUrl: response.redirectUrl
      };
    } catch (err) {
      return {
        transaction: null,
        error: err instanceof Error ? err.message : 'Failed to initiate mobile deposit'
      };
    }
  }

  /**
   * Check transaction status
   */
  static async checkTransactionStatus(transactionId: string): Promise<TransactionResult> {
    try {
      const api = this.getApi();
      const transaction: BankTransaction = await api.checkTransactionStatus(transactionId);
      return { transaction };
    } catch (err) {
      return {
        transaction: null,
        error: err instanceof Error ? err.message : 'Failed to check transaction status'
      };
    }
  }

  /**
   * Trigger reconciliation for a transaction
   */
  static async triggerReconciliation(transactionId: string): Promise<ReconciliationResult> {
    try {
      const api = this.getApi();
      return await api.triggerReconciliation(transactionId);
    } catch (err) {
      return {
        success: false,
        reserveBalance: 0,
        walletBalance: 0,
        discrepancy: null,
        error: err instanceof Error ? err.message : 'Failed to trigger reconciliation'
      };
    }
  }
}
