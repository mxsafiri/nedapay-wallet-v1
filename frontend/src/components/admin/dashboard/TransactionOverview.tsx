'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  timestamp: string;
  userId: string;
}

interface TransactionOverviewProps {
  recentTransactions: Transaction[];
  totalVolume: number;
  successRate: number;
}

export function TransactionOverview({ recentTransactions, totalVolume, successRate }: TransactionOverviewProps) {
  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Transaction Overview</h3>
        <Badge variant={successRate >= 95 ? "success" : "warning"}>
          {successRate}% Success Rate
        </Badge>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">24h Volume</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">{formatCurrency(totalVolume)}</span>
            {totalVolume > 0 ? (
              <TrendingUp className="text-green-500" size={20} />
            ) : (
              <TrendingDown className="text-red-500" size={20} />
            )}
          </div>
        </div>

        <div className="divide-y">
          {recentTransactions.map((tx) => (
            <div key={tx.id} className="py-2 flex justify-between items-center">
              <div>
                <span className="text-sm font-medium capitalize">{tx.type}</span>
                <span className="text-xs text-muted-foreground ml-2">
                  {new Date(tx.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {formatCurrency(tx.amount)}
                </span>
                <Badge variant={tx.status === 'completed' ? 'success' : 'warning'}>
                  {tx.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
