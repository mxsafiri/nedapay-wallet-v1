'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    // Check if user is already authenticated
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/admin'); // Redirect to admin dashboard if already logged in
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container flex items-center justify-center min-h-screen py-12">
        {children}
      </div>
    </div>
  );
}
