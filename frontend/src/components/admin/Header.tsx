'use client';

import { signOut, useSession } from 'next-auth/react';
import { Bell, LogOut, Settings, User } from 'lucide-react';

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="bg-white dark:bg-gray-800 shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {session?.user?.email || 'Admin Dashboard'}
            </h2>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
              <Bell className="h-5 w-5" />
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
              <Settings className="h-5 w-5" />
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
              <User className="h-5 w-5" />
            </button>
            <button
              onClick={() => signOut()}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
