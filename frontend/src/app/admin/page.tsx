'use client';

import React from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Card } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Users, ArrowUpRight, ArrowDownRight, Wallet, Percent, Activity, LineChart, Bell } from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardStats {
  totalUsers: number;
  totalTransactions: number;
  totalVolume: number;
  reserveRatio: number;
  pendingKyc: number;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/admin/dashboard/stats').then(res => res.data),
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-96">
          <LoadingSpinner className="w-8 h-8 text-[#14DD3C]" />
        </div>
      </AdminLayout>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats ? formatNumber(stats.totalUsers) : '-',
      icon: Users,
      trend: '+12.5%',
      trendUp: true
    },
    {
      title: 'Total Transactions',
      value: stats ? formatNumber(stats.totalTransactions) : '-',
      icon: Activity,
      trend: '+8.2%',
      trendUp: true
    },
    {
      title: 'Total Volume',
      value: stats ? formatCurrency(stats.totalVolume) : '-',
      icon: Wallet,
      trend: '+15.3%',
      trendUp: true
    },
    {
      title: 'Reserve Ratio',
      value: stats ? formatPercentage(stats.reserveRatio) : '-',
      icon: Percent,
      trend: '-2.1%',
      trendUp: false
    }
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
          <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleString()}</p>
        </div>

        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
        >
          {statCards.map((stat, index) => (
            <motion.div key={index} variants={item}>
              <Card className="p-6 hover:shadow-lg transition-shadow duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-[#14DD3C]/10 rounded-lg">
                    <stat.icon className="w-5 h-5 text-[#14DD3C]" />
                  </div>
                  <div className={`flex items-center ${stat.trendUp ? 'text-[#14DD3C]' : 'text-red-500'}`}>
                    <span className="text-sm font-medium">{stat.trend}</span>
                    {stat.trendUp ? (
                      <ArrowUpRight className="w-4 h-4 ml-1" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 ml-1" />
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-[#14DD3C]/10 rounded-lg">
                  <LineChart className="w-5 h-5 text-[#14DD3C]" />
                </div>
                <h3 className="text-lg font-medium">Recent Activity</h3>
              </div>
              <button className="text-sm text-[#14DD3C] hover:underline">View All</button>
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 rounded-full bg-[#14DD3C]" />
                    <div>
                      <p className="text-sm font-medium">New transaction processed</p>
                      <p className="text-xs text-muted-foreground">2 minutes ago</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium">$1,234.56</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-[#14DD3C]/10 rounded-lg">
                  <Bell className="w-5 h-5 text-[#14DD3C]" />
                </div>
                <h3 className="text-lg font-medium">System Notifications</h3>
              </div>
              <button className="text-sm text-[#14DD3C] hover:underline">View All</button>
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map((_, i) => (
                <div key={i} className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-2 h-2 rounded-full bg-[#14DD3C]" />
                  <div>
                    <p className="text-sm font-medium">System update completed</p>
                    <p className="text-xs text-muted-foreground">1 hour ago</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
