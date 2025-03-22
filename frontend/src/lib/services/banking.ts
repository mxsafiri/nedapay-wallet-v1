import { api } from '@/lib/api';
import { AxiosError } from 'axios';

export interface BankDetails {
  accountNumber: string;
  bankName: string;
  accountName?: string;
  swiftCode?: string;
  routingNumber?: string;
}

export interface BankTransaction {
  id: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  bankDetails: BankDetails;
  reference: string;
  createdAt: string;
  updatedAt: string;
  error?: string;
}

export interface BankTransactionResponse {
  transaction: BankTransaction;
  redirectUrl?: string; // For bank-hosted payment pages
  reference: string;
  message: string;
}

export class BankingService {
  /**
   * Initialize a bank deposit
   */
  static async initiateDeposit(
    amount: number,
    accountNumber: string,
    bankName: string
  ): Promise<BankTransactionResponse> {
    try {
      const response = await api.post('/banking/deposit', {
        amount,
        bankDetails: {
          accountNumber,
          bankName,
        },
      });

      return response.data;
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to initiate bank deposit');
    }
  }

  /**
   * Initialize a bank withdrawal
   */
  static async initiateWithdrawal(
    amount: number,
    accountNumber: string,
    bankName: string
  ): Promise<BankTransactionResponse> {
    try {
      const response = await api.post('/banking/withdrawal', {
        amount,
        bankDetails: {
          accountNumber,
          bankName,
        },
      });

      return response.data;
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to initiate bank withdrawal');
    }
  }

  /**
   * Verify bank account details
   */
  static async verifyBankAccount(
    accountNumber: string,
    bankName: string
  ): Promise<{ valid: boolean; accountName?: string }> {
    try {
      const response = await api.post('/banking/verify-account', {
        accountNumber,
        bankName,
      });

      return response.data;
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to verify bank account');
    }
  }

  /**
   * Get supported banks list
   */
  static async getSupportedBanks(): Promise<Array<{ name: string; code: string }>> {
    try {
      const response = await api.get('/banking/supported-banks');
      return response.data.banks;
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to fetch supported banks');
    }
  }

  /**
   * Check transaction status
   */
  static async checkTransactionStatus(transactionId: string): Promise<BankTransaction> {
    try {
      const response = await api.get(`/banking/transaction/${transactionId}`);
      return response.data.transaction;
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to check transaction status');
    }
  }
}
