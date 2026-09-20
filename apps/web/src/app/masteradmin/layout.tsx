import React from 'react';
import '../globals.css';
import AuthInitializer from '../../components/layout/AuthInitializer';

export const metadata = {
  title: 'Master Admin Gateway | Sadaqahbd',
  robots: 'noindex, nofollow',
};

export default function MasterAdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ backgroundColor: '#0f172a', minHeight: '100vh', color: '#f8fafc' }}>
        <AuthInitializer />
        {children}
      </body>
    </html>
  );
}
