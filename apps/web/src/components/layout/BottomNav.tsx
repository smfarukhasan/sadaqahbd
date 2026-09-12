'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '../../i18n/routing';
import styles from './BottomNav.module.css';
import { Home, Heart, FileText, BarChart3, User } from 'lucide-react';

export default function BottomNav() {
  const navT = useTranslations('Nav');
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className={`${styles.bottomNav} mobile-only`} aria-label="Mobile Navigation">
      <Link
        href="/"
        className={`${styles.tab} ${isActive('/') ? styles.tabActive : ''}`}
      >
        <div className={styles.iconContainer}>
          <Home size={21} />
          {isActive('/') && <span className={styles.activeDot} />}
        </div>
        <span className={styles.tabLabel}>{navT('home')}</span>
      </Link>

      <Link
        href="/posts"
        className={`${styles.tab} ${isActive('/posts') ? styles.tabActive : ''}`}
      >
        <div className={styles.iconContainer}>
          <FileText size={21} />
          {isActive('/posts') && <span className={styles.activeDot} />}
        </div>
        <span className={styles.tabLabel}>{navT('posts')}</span>
      </Link>

      {/* Floating Center Donate Action */}
      <Link
        href="/donate"
        className={`${styles.tab} ${styles.donateHighlight}`}
      >
        <div className={styles.donateIconWrapper}>
          <Heart size={22} className={styles.heartPulse} />
        </div>
        <span className={styles.donateLabel}>{navT('donate')}</span>
      </Link>

      <Link
        href="/ledger"
        className={`${styles.tab} ${isActive('/ledger') ? styles.tabActive : ''}`}
      >
        <div className={styles.iconContainer}>
          <BarChart3 size={21} />
          {isActive('/ledger') && <span className={styles.activeDot} />}
        </div>
        <span className={styles.tabLabel}>{navT('ledger')}</span>
      </Link>

      <Link
        href="/portal"
        className={`${styles.tab} ${isActive('/portal') ? styles.tabActive : ''}`}
      >
        <div className={styles.iconContainer}>
          <User size={21} />
          {isActive('/portal') && <span className={styles.activeDot} />}
        </div>
        <span className={styles.tabLabel}>{navT('portal')}</span>
      </Link>
    </nav>
  );
}

