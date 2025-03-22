'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  userId: string;
  reference: string;
  provider: 'bank' | 'mobile_money';
  reconciliationStatus: 'matched' | 'unmatched' | 'pending';
  createdAt: string;
  updatedAt: string;
}

interface ReconciliationStats {
  totalTransactions: number;
  matchedCount: number;
  unmatchedCount: number;
  totalAmount: number;
  unmatchedAmount: number;
}

export default function ReconciliationPage() {
  const { toast } = useToast();
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isReconciling, setIsReconciling] = useState(false);

  // Fetch transactions with reconciliation status
  const {
    data: transactions,
    isLoading: transactionsLoading,
    refetch: refetchTransactions
  } = useQuery<{ transactions: Transaction[], stats: ReconciliationStats }>({
    queryKey: ['reconciliation', selectedStatus, searchTerm],
    queryFn: () => api.get('/admin/transactions/reconciliation', {
      params: {
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        search: searchTerm || undefined
      }
    }).then(res => res.data),
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Trigger manual reconciliation
  const handleReconciliation = async (transactionId?: string) => {
    try {
      setIsReconciling(true);
      await api.post('/admin/transactions/reconcile', {
        transactionId // If undefined, reconciles all pending transactions
      });
      await refetchTransactions();
      toast({
        title: 'Reconciliation initiated',
        description: 'The system is matching transactions with provider records.',
        variant: 'default'
      });
    } catch (error) {
      toast({
        title: 'Reconciliation failed',
        description: 'Failed to initiate reconciliation process.',
        variant: 'destructive'
      });
    } finally {
      setIsReconciling(false);
    }
  };

  const stats = transactions?.stats || {
    totalTransactions: 0,
    matchedCount: 0,
    unmatchedCount: 0,
    totalAmount: 0,
    unmatchedAmount: 0
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Transaction Reconciliation</h2>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="relative"
        >
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#14DD3C] to-[#0B120C] rounded-lg blur opacity-75"></div>
          <Button 
            onClick={() => handleReconciliation()}
            disabled={isReconciling}
            className="relative bg-[#0B120C] hover:bg-[#14DD3C]/10 text-white border border-[#14DD3C]/50 hover:border-[#14DD3C]"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isReconciling ? 'animate-spin' : ''}`} />
            {isReconciling ? 'Reconciling...' : 'Reconcile All Pending'}
          </Button>
        </motion.div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 border-[#14DD3C]/10">
          <h3 className="text-sm font-medium text-muted-foreground">Total Transactions</h3>
          <p className="text-2xl font-bold">{stats.totalTransactions}</p>
        </Card>
        <Card className="p-4 border-[#14DD3C]/10">
          <h3 className="text-sm font-medium text-muted-foreground">Matched Transactions</h3>
          <p className="text-2xl font-bold text-[#14DD3C]">{stats.matchedCount}</p>
        </Card>
        <Card className="p-4 border-[#14DD3C]/10">
          <h3 className="text-sm font-medium text-muted-foreground">Unmatched Transactions</h3>
          <p className="text-2xl font-bold text-red-500">{stats.unmatchedCount}</p>
        </Card>
        <Card className="p-4 border-[#14DD3C]/10">
          <h3 className="text-sm font-medium text-muted-foreground">Unmatched Amount</h3>
          <p className="text-2xl font-bold text-red-500">{formatCurrency(stats.unmatchedAmount)}</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="w-[200px]">
          <Select
            value={selectedStatus}
            onValueChange={setSelectedStatus}
          >
            <SelectTrigger className="border-[#14DD3C]/20 focus:ring-[#14DD3C]/20">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Transactions</SelectItem>
              <SelectItem value="matched">Matched</SelectItem>
              <SelectItem value="unmatched">Unmatched</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Input
          placeholder="Search by ID or reference..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-[#14DD3C]/20 focus:ring-[#14DD3C]/20"
        />
      </div>

      {/* Transactions Table */}
      <Card className="border-[#14DD3C]/10">
        <div className="relative">
          {transactionsLoading && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center">
              <LoadingSpinner className="w-8 h-8 text-[#14DD3C]" />
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions?.transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{transaction.reference}</TableCell>
                  <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                  <TableCell className="capitalize">{transaction.type}</TableCell>
                  <TableCell className="capitalize">{transaction.provider}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        transaction.reconciliationStatus === 'matched'
                          ? 'success'
                          : transaction.reconciliationStatus === 'unmatched'
                          ? 'destructive'
                          : 'default'
                      }
                      className="gap-1"
                    >
                      {transaction.reconciliationStatus === 'matched' ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : transaction.reconciliationStatus === 'unmatched' ? (
                        <AlertCircle className="w-3 h-3" />
                      ) : null}
                      {transaction.reconciliationStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReconciliation(transaction.id)}
                        disabled={isReconciling || transaction.reconciliationStatus === 'matched'}
                        className="border-[#14DD3C]/20 hover:border-[#14DD3C] hover:bg-[#14DD3C]/10"
                      >
                        <RefreshCw className={`mr-2 h-3 w-3 ${isReconciling ? 'animate-spin' : ''}`} />
                        Reconcile
                      </Button>
                    </motion.div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
