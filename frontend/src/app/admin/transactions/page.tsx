'use client';

import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  userId: string;
  provider: 'bank' | 'mobile_money';
  createdAt: string;
}

export default function TransactionsPage() {
  // Fetch latest transactions
  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ['transactions'],
    queryFn: () => api.get('/admin/transactions').then(res => res.data),
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'destructive';
      default:
        return 'warning';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Transactions</h2>
      </div>

      <Card>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions?.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="font-mono">{tx.id}</TableCell>
                  <TableCell className="capitalize">{tx.type}</TableCell>
                  <TableCell>{formatCurrency(tx.amount)}</TableCell>
                  <TableCell className="capitalize">
                    {tx.provider.replace('_', ' ')}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(tx.status)}>
                      {tx.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(tx.createdAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}

              {!transactions?.length && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    No transactions found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
