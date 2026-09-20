import React from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '../../i18n/routing';
import AuthInitializer from '../../components/layout/AuthInitializer';
import SuspendedAccountGuard from '../../components/auth/SuspendedAccountGuard';
import MandatorySetupGuard from '../../components/auth/MandatorySetupGuard';
import Navbar from '../../components/layout/Navbar';
import AppHeader from '../../components/layout/AppHeader';
import BottomNav from '../../components/layout/BottomNav';
import Footer from '../../components/layout/Footer';
import '../globals.css';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('sadaqahbd_theme')||(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.setAttribute('data-theme',t);}catch(e){}})()`,
          }}
        />
      </head>
      <body>
        <NextIntlClientProvider messages={messages}>
          <AuthInitializer />
          <SuspendedAccountGuard />
          <MandatorySetupGuard />
          <AppHeader />
          <Navbar />
          <main className="safe-bottom-padding">{children}</main>
          <Footer />
          <BottomNav />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
