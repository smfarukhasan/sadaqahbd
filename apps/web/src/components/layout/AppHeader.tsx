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
        <div className={styles.brandIconWrapper}>
          <HeartHandshake size={18} />
        </div>
        <span className={styles.brandText}>{t('siteName')}</span>
      </Link>

      <div className={styles.rightActions}>
        <button
          onClick={toggleLanguage}
          className={styles.langPill}
          title={t('language')}
          aria-label={t('language')}
        >
          <Globe size={13} />
          <span>{locale === 'bn' ? 'EN' : 'বাং'}</span>
        </button>

        <Link
          href="/portal"
          className={styles.iconBtn}
          aria-label="Notifications"
        >
          <Bell size={18} />
          <span className={styles.notificationDot} />
        </Link>

        <Link
          href="/login"
          className={`${styles.iconBtn} ${styles.profileBtn}`}
          aria-label="Account"
        >
          <User size={18} />
        </Link>
      </div>
    </header>
  );
}

