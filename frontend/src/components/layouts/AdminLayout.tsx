'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  Users,
  Wallet,
  Shield,
  FileText,
  Settings,
  LogOut,
  Loader2,
  Beaker,
  Search,
  Bell,
  Landmark,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { isDemoMode } from '@/lib/config/deployment';
import { theme } from '@/styles/theme';
import { motion } from 'framer-motion';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: BarChart3 },
  { name: 'Users', href: '/admin/users', icon: Users },
  { 
    name: 'Transactions', 
    href: '/admin/transactions', 
    icon: Wallet,
    subItems: [
      { 
        name: 'TransactionsReconciliation', 
        href: '/admin/transactions/reconciliation', 
        icon: RefreshCw 
      }
    ]
  },
  { name: 'Security', href: '/admin/security', icon: Shield },
  { name: 'Compliance', href: '/admin/compliance', icon: FileText },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

if (isDemoMode()) {
  navigation.push({ name: 'Demo Controls', href: '/admin/demo', icon: Beaker });
}

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      // Implement logout logic here
      router.push('/login');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to log out',
        variant: 'destructive',
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B120C] text-white">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="hidden md:flex md:w-64 md:flex-col bg-[#0B120C] border-r border-[rgba(255,255,255,0.1)]">
          <div className="flex flex-col flex-grow pt-5">
            <Link href="/admin" className="flex items-center flex-shrink-0 px-4 mb-8 group">
              <div className="relative">
                <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-[#14DD3C] to-[#0B120C] opacity-75 blur group-hover:opacity-100 transition duration-200"></div>
                <div className="relative flex items-center gap-2 px-3 py-2 bg-[#0B120C] rounded-lg">
                  <Landmark className="w-6 h-6 text-[#14DD3C] group-hover:animate-pulse" />
                  <div>
                    <span className="text-xl font-bold bg-gradient-to-r from-[#14DD3C] to-white bg-clip-text text-transparent">
                      NEDApay
                    </span>
                    {isDemoMode() && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-2 px-2 py-0.5 text-xs bg-[#14DD3C] text-black rounded-full inline-block"
                      >
                        DEMO
                      </motion.span>
                    )}
                  </div>
                </div>
              </div>
            </Link>

            {/* Search Bar */}
            <div className="px-4 mb-6">
              <div className="relative group">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-hover:text-[#14DD3C] transition-colors" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#14DD3C] focus:border-transparent transition-all hover:bg-[rgba(255,255,255,0.08)]"
                />
              </div>
            </div>

            <nav className="flex-1 px-4 pb-4 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href || 
                               (item.subItems?.some(sub => pathname === sub.href));
                const isSubItemActive = item.subItems?.some(sub => pathname === sub.href);
                
                return (
                  <div key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        isActive
                          ? 'bg-[#14DD3C] text-white'
                          : 'text-gray-300 hover:bg-[#14DD3C]/10 hover:text-white',
                        'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200'
                      )}
                    >
                      <item.icon
                        className={cn(
                          isActive ? 'text-white' : 'text-gray-400 group-hover:text-white',
                          'mr-3 h-5 w-5 flex-shrink-0 transition-colors'
                        )}
                      />
                      {item.name}
                    </Link>
                    
                    {item.subItems && (
                      <div className="ml-8 mt-1 space-y-1">
                        {item.subItems.map((subItem) => {
                          const isSubActive = pathname === subItem.href;
                          return (
                            <motion.div
                              key={subItem.name}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Link
                                href={subItem.href}
                                className={cn(
                                  isSubActive
                                    ? 'bg-[#14DD3C]/20 text-white border-l-2 border-[#14DD3C]'
                                    : 'text-gray-400 hover:bg-[#14DD3C]/10 hover:text-white',
                                  'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200'
                                )}
                              >
                                <subItem.icon
                                  className={cn(
                                    isSubActive ? 'text-[#14DD3C]' : 'text-gray-400 group-hover:text-[#14DD3C]',
                                    'mr-3 h-4 w-4 flex-shrink-0 transition-colors'
                                  )}
                                />
                                <span className="text-sm">{subItem.name}</span>
                              </Link>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            <div className="px-4 pb-4">
              <Button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-white border-0"
              >
                {isLoggingOut ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <LogOut className="w-4 h-4 mr-2" />
                )}
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col flex-1">
          <div className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 bg-[#0B120C] border-b border-[rgba(255,255,255,0.1)]">
            <div className="flex-1" />
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="relative hover:bg-[rgba(255,255,255,0.1)]"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-[#14DD3C] rounded-full" />
              </Button>
            </div>
          </div>

          <main className="flex-1 overflow-y-auto p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
