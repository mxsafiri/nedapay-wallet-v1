'use client';

import React from 'react';
import { useTransaction } from '@/hooks/useTransaction';
import type { BankTransaction } from '@/lib/services/banking';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface TransactionListProps {
  transactions: BankTransaction[];
  onViewDetails?: (transaction: BankTransaction) => void;
}

export function TransactionList({ transactions, onViewDetails }: TransactionListProps) {
  const { triggerReconciliation, loading } = useTransaction();

  const handleReconcile = async (transactionId: string) => {
    await triggerReconciliation(transactionId);
  };

  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Reference</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Bank</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell>{transaction.reference}</TableCell>
              <TableCell className="capitalize">{transaction.type}</TableCell>
              <TableCell>${transaction.amount.toFixed(2)}</TableCell>
              <TableCell>
                <Badge variant={transaction.status === 'completed' ? 'success' : 'secondary'}>
                  {transaction.status}
                </Badge>
              </TableCell>
              <TableCell>{transaction.bankDetails.bankName}</TableCell>
              <TableCell>{new Date(transaction.createdAt).toLocaleDateString()}</TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewDetails?.(transaction)}
                >
                  View Details
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReconcile(transaction.id)}
                  disabled={loading || transaction.status !== 'completed'}
                >
                  Reconcile
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {transactions.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-4">
                No transactions found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
