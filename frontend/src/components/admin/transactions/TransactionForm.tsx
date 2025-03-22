'use client';

import React, { useState } from 'react';
import { useTransaction } from '@/hooks/useTransaction';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TransactionFormProps {
  onTransactionCreated?: () => void;
}

export function TransactionForm({ onTransactionCreated }: TransactionFormProps) {
  const [type, setType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [provider, setProvider] = useState<'bank' | 'mobile'>('bank');
  const [amount, setAmount] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [mobileProvider, setMobileProvider] = useState('');

  const {
    initiateDeposit,
    initiateWithdrawal,
    initiateMobileDeposit,
    loading,
    error
  } = useTransaction();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount);

    if (isNaN(numericAmount) || numericAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      if (provider === 'bank') {
        if (type === 'deposit') {
          await initiateDeposit(numericAmount, accountNumber, bankName);
        } else {
          await initiateWithdrawal(numericAmount, accountNumber, bankName);
        }
      } else {
        await initiateMobileDeposit(numericAmount, phoneNumber, mobileProvider);
      }
      
      // Reset form
      setAmount('');
      setAccountNumber('');
      setBankName('');
      setPhoneNumber('');
      setMobileProvider('');
      
      onTransactionCreated?.();
    } catch (err) {
      console.error('Transaction failed:', err);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Transaction</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Transaction Type</Label>
              <Select
                value={type}
                onValueChange={(value: 'deposit' | 'withdrawal') => setType(value)}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deposit">Deposit</SelectItem>
                  <SelectItem value="withdrawal">Withdrawal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider">Provider</Label>
              <Select
                value={provider}
                onValueChange={(value: 'bank' | 'mobile') => setProvider(value)}
              >
                <SelectTrigger id="provider">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank">Bank</SelectItem>
                  <SelectItem value="mobile">Mobile Money</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              required
              min="0"
              step="0.01"
            />
          </div>

          {provider === 'bank' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Enter account number"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bankName">Bank Name</Label>
                <Input
                  id="bankName"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Enter bank name"
                  required
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter phone number"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobileProvider">Mobile Provider</Label>
                <Input
                  id="mobileProvider"
                  value={mobileProvider}
                  onChange={(e) => setMobileProvider(e.target.value)}
                  placeholder="Enter mobile provider"
                  required
                />
              </div>
            </>
          )}

          {error && (
            <div className="text-red-500 text-sm mt-2">{error}</div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Processing...' : 'Submit Transaction'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
