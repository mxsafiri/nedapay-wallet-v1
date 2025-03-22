'use client';

import React from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Tabs, TabsList, TabsTrigger } from '@radix-ui/react-tabs';
import { usePathname, useRouter } from 'next/navigation';

interface TransactionsLayoutProps {
  children: React.ReactNode;
}

export default function TransactionsLayout({ children }: TransactionsLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleTabChange = (value: string) => {
    router.push(value);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <Tabs
          defaultValue={pathname}
          onValueChange={handleTabChange}
          className="space-y-4"
        >
          <TabsList>
            <TabsTrigger value="/admin/transactions">Transactions</TabsTrigger>
            <TabsTrigger value="/admin/transactions/reconciliation">Reconciliation</TabsTrigger>
          </TabsList>
        </Tabs>
        {children}
      </div>
    </AdminLayout>
  );
}
