import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'NEDApay Admin',
  description: 'Secure admin interface for NEDApay wallet system',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {children}
    </div>
  );
}
