'use client';

import React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link, usePathname, useRouter } from '../../i18n/routing';
import styles from './AppHeader.module.css';
import { HeartHandshake, Bell, Globe, User } from 'lucide-react';

export default function AppHeader() {
  const t = useTranslations('Common');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const toggleLanguage = () => {
    const nextLocale = locale === 'bn' ? 'en' : 'bn';
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <header className={`${styles.appHeader} mobile-only`}>
      <Link href="/" className={styles.brand}>
        <HeartHandshake className={styles.brandIcon} size={24} />
        <span className={styles.brandText}>{t('siteName')}</span>
      </Link>

      <div className={styles.rightActions}>
        <button
          onClick={toggleLanguage}
          className={styles.iconBtn}
          title={t('language')}
          aria-label={t('language')}
        >
          <span className={styles.langLabel}>
            {locale === 'bn' ? 'EN' : 'বাং'}
          </span>
        </button>

        <Link href="/portal/notifications" className={styles.iconBtn} aria-label="Notifications">
          <Bell size={20} />
        </Link>

        <Link href="/login" className={styles.iconBtn} aria-label="Account">
          <User size={20} />
        </Link>
      </div>
    </header>
  );
}
