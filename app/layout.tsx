import type { Metadata } from 'next';
import ErrorBoundary from '@/components/ErrorBoundary';
import './globals.css';

export const metadata: Metadata = {
  title: 'LandscapeManager',
  description: 'Landscaping task management for large facility terrains',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
        <meta name="theme-color" content="#005f73" />
      </head>
      <body className="antialiased touch-manipulation">
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  );
}
