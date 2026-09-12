'use client';

import React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link, usePathname, useRouter } from '../../i18n/routing';
import styles from './Navbar.module.css';
import { HeartHandshake, Globe, User, ShieldCheck } from 'lucide-react';

export default function Navbar() {
  const t = useTranslations('Common');
  const navT = useTranslations('Nav');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const toggleLanguage = () => {
    const nextLocale = locale === 'bn' ? 'en' : 'bn';
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <header className={`${styles.header} desktop-only`}>
      <div className={`container ${styles.headerInner}`}>
        <Link href="/" className={styles.brand}>
          <HeartHandshake className={styles.brandIcon} size={28} />
          <span className={styles.brandText}>{t('siteName')}</span>
        </Link>

        <nav className={styles.navLinks}>
          <Link href="/" className={styles.navLink}>
            {navT('home')}
          </Link>
          <Link href="/posts" className={styles.navLink}>
            {navT('posts')}
          </Link>
          <Link href="/ledger" className={styles.navLink}>
            {navT('ledger')}
          </Link>
          <Link href="/donate" className={`${styles.navLink} ${styles.donateHighlight}`}>
            {t('donateNow')}
          </Link>
        </nav>

        <div className={styles.actions}>
          <button
            onClick={toggleLanguage}
            className={styles.langBtn}
            title={t('language')}
          >
            <Globe size={18} />
            <span>{locale === 'bn' ? 'English' : 'বাংলা'}</span>
          </button>

          <Link href="/login" className={styles.loginBtn}>
            <User size={18} />
            <span>{t('login')}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
