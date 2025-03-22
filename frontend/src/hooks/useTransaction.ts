import { useState } from 'react';
import { TransactionService } from '@/lib/services/transaction';
import type { TransactionResult, ReconciliationResult } from '@/lib/services/transaction';

/**
 * Custom hook for handling banking transactions
 * Supports both demo and production modes
 */
export function useTransaction() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Initialize a bank deposit transaction
   * @param amount Amount to deposit
   * @param accountNumber Bank account number
   * @param bankName Name of the bank
   */
  const initiateDeposit = async (
    amount: number,
    accountNumber: string,
    bankName: string
  ) => {
    try {
      setLoading(true);
      setError(null);
      const result = await TransactionService.initiateDeposit(amount, accountNumber, bankName);
      if (result.error) {
        setError(result.error);
        throw new Error(result.error);
      }
      return result.transaction;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate deposit');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Initialize a bank withdrawal transaction
   * @param amount Amount to withdraw
   * @param accountNumber Bank account number
   * @param bankName Name of the bank
   */
  const initiateWithdrawal = async (
    amount: number,
    accountNumber: string,
    bankName: string
  ) => {
    try {
      setLoading(true);
      setError(null);
      const result = await TransactionService.initiateWithdrawal(amount, accountNumber, bankName);
      if (result.error) {
        setError(result.error);
        throw new Error(result.error);
      }
      return result.transaction;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate withdrawal');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Initialize a mobile money deposit
   * @param amount Amount to deposit
   * @param phoneNumber Mobile money phone number
   * @param provider Mobile money provider
   */
  const initiateMobileDeposit = async (
    amount: number,
    phoneNumber: string,
    provider: string
  ) => {
    try {
      setLoading(true);
      setError(null);
      const result = await TransactionService.initiateMobileDeposit(amount, phoneNumber, provider);
      if (result.error) {
        setError(result.error);
        throw new Error(result.error);
      }
      return result.transaction;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate mobile deposit');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Trigger reconciliation for a transaction
   * Only available in demo mode
   * @param transactionId ID of the transaction to reconcile
   */
  const triggerReconciliation = async (transactionId: string): Promise<ReconciliationResult> => {
    try {
      setLoading(true);
      setError(null);
      return await TransactionService.triggerReconciliation(transactionId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to trigger reconciliation';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    initiateDeposit,
    initiateWithdrawal,
    initiateMobileDeposit,
    triggerReconciliation,
  };
}
