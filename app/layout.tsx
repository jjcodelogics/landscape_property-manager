import type { Metadata } from 'next';
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
        <meta name="theme-color" content="#111827" />
      </head>
      <body className="font-sans antialiased touch-manipulation">{children}</body>
    </html>
  );
}
