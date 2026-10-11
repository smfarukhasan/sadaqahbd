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
import PublicMobileDrawer from '../../components/layout/PublicMobileDrawer';
import Footer from '../../components/layout/Footer';
import MainContent from '../../components/layout/MainContent';
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
    <NextIntlClientProvider messages={messages}>
      <AuthInitializer />
      <SuspendedAccountGuard />
      <MandatorySetupGuard />
      <AppHeader />
      <Navbar />
      <MainContent>{children}</MainContent>
      <Footer />
      <BottomNav />
      <PublicMobileDrawer />
    </NextIntlClientProvider>
  );
}
