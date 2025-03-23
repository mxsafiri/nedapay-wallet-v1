'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Settings,
  Shield,
  Mail,
  FileText,
  BarChart,
} from 'lucide-react';

const menuItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/transactions', label: 'Transactions', icon: CreditCard },
  { href: '/admin/demo', label: 'Demo Controls', icon: BarChart },
  { href: '/admin/compliance', label: 'Compliance', icon: Shield },
  { href: '/admin/email-monitoring', label: 'Email Monitor', icon: Mail },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64">
        <div className="flex flex-col flex-1 min-h-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
                NEDApay Admin
              </h1>
            </div>
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className={`mr-3 h-5 w-5 ${
                      isActive
                        ? 'text-gray-500 dark:text-gray-300'
                        : 'text-gray-400 dark:text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                    }`} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </aside>
  );
}
