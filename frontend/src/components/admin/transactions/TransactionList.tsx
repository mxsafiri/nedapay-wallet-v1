'use client';

import React from 'react';
import { useTransaction } from '@/hooks/useTransaction';
import { BankTransaction } from '@/lib/mock-api/banking';
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
  transactions?: BankTransaction[];
  onReconcile?: (transactionId: string) => void;
}

export function TransactionList({ transactions = [], onReconcile }: TransactionListProps) {
  const { triggerReconciliation, loading } = useTransaction();

  const handleReconcile = async (transactionId: string) => {
    await triggerReconciliation(transactionId);
    onReconcile?.(transactionId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      case 'processing':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Reference</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Provider</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell className="font-mono">{transaction.reference}</TableCell>
              <TableCell className="capitalize">{transaction.type}</TableCell>
              <TableCell className="capitalize">{transaction.provider}</TableCell>
              <TableCell>
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: transaction.currency,
                }).format(transaction.amount)}
              </TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className={`${getStatusColor(transaction.status)} text-white`}
                >
                  {transaction.status}
                </Badge>
              </TableCell>
              <TableCell>
                {new Date(transaction.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
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
