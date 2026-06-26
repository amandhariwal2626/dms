import type { Metadata } from 'next';
import './globals.css';
import { AppProviders } from '@/providers/app-providers';

export const metadata: Metadata = {
  title: 'Monorepo Foundation',
  description: 'Infrastructure-only monorepo foundation',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.JSX.Element {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <div className="root">
          <AppProviders>
           {children}
          </AppProviders>
        </div>
      </body>
    </html>
  );
}
