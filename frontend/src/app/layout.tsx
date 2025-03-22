import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import { Providers } from '@/components/providers';
import '@/styles/fonts.css';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'NEDApay Admin',
  description: 'Admin dashboard for NEDApay wallet system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
