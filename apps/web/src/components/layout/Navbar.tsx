'use client';

import React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link, usePathname, useRouter } from '../../i18n/routing';
import styles from './Navbar.module.css';
import {
  HeartHandshake,
  Globe,
  User,
  Heart,
  ShieldCheck,
  BarChart3,
  FileText,
} from 'lucide-react';

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

  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className={`${styles.header} desktop-only`}>
      <div className={`container ${styles.headerInner}`}>
        {/* Brand */}
        <Link href="/" className={styles.brand}>
          <div className={styles.brandIconWrapper}>
            <HeartHandshake className={styles.brandIcon} size={22} />
          </div>
          <div className={styles.brandTextGroup}>
            <span className={styles.brandTitle}>{t('siteName')}</span>
            <span className={styles.brandTagline}>স্বচ্ছতার সাথে শিক্ষা সহায়তা</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className={styles.navLinks} aria-label="Main Navigation">
          <Link
            href="/"
            className={`${styles.navLink} ${isActive('/') ? styles.navLinkActive : ''}`}
          >
            <span>{navT('home')}</span>
          </Link>
          <Link
            href="/posts"
            className={`${styles.navLink} ${isActive('/posts') ? styles.navLinkActive : ''}`}
          >
            <span>{navT('posts')}</span>
          </Link>
          <Link
            href="/ledger"
            className={`${styles.navLink} ${isActive('/ledger') ? styles.navLinkActive : ''}`}
          >
            <span>{navT('ledger')}</span>
          </Link>
          <Link
            href="/portal"
            className={`${styles.navLink} ${isActive('/portal') ? styles.navLinkActive : ''}`}
          >
            <span>{navT('portal')}</span>
          </Link>
        </nav>

        {/* Right Side Actions */}
        <div className={styles.actions}>
          {/* Transparency trust badge */}
          <div className={styles.trustBadge}>
            <ShieldCheck size={15} />
            <span>দ্বৈত ভেরিফাইড</span>
          </div>

          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className={styles.langBtn}
            title={t('language')}
          >
            <Globe size={16} />
            <span>{locale === 'bn' ? 'English' : 'বাংলা'}</span>
          </button>

          {/* Donate CTA */}
          <Link href="/donate" className={styles.donateBtn}>
            <Heart size={16} />
            <span>{t('donateNow')}</span>
          </Link>

          {/* Login / Profile */}
          <Link href="/login" className={styles.loginBtn}>
            <User size={16} />
            <span>{t('login')}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

