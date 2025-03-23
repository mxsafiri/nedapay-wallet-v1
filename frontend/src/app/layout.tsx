import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import { Providers } from '@/components/providers';
import '@/styles/fonts.css';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'NEDApay Bank Partner Portal',
  description: 'Secure banking integration portal for financial institutions',
  keywords: 'banking, fintech, integration, API, transactions, monitoring',
  authors: [{ name: 'NEDApay' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#14DD3C',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased min-h-screen bg-background">
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
