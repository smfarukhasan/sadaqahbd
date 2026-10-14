'use client';

import React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link, usePathname } from '../../i18n/routing';
import styles from './BottomNav.module.css';
import { Home, Heart, FileText, BarChart3, Menu, PlusCircle } from 'lucide-react';
import { useAuthStore } from '../../lib/auth-store';
import { useMobileDrawerStore } from '../../lib/drawer-store';
import FinancialDonationModal from '../portal/FinancialDonationModal';

export default function BottomNav() {
  const [isFinancialModalOpen, setIsFinancialModalOpen] = React.useState(false);
  const navT = useTranslations('Nav');
  const locale = useLocale();
  const isBn = locale === 'bn';
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  const toggleDrawer = useMobileDrawerStore((s) => s.toggleDrawer);
  const isDrawerOpen = useMobileDrawerStore((s) => s.isOpen);

  const isMandatorySetup = pathname.includes('/set-password') || (user && !user.isPasswordSet);
  const cleanPath = pathname ? pathname.replace(/^\/(bn|en)(\/|$)/, '/') : '';
  const isAdminRoute = cleanPath.startsWith('/admin') || cleanPath.startsWith('/masteradmin');

  // Admin and Master Admin have their own dedicated admin mobile bottom navigation.
  if (isMandatorySetup || isAdminRoute) {
    return null;
  }

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
          <Home size={28} />
          {isActive('/') && <span className={styles.activeDot} />}
        </div>
        <span className={styles.tabLabel}>{navT('home')}</span>
      </Link>

      <Link
        href="/posts"
        className={`${styles.tab} ${isActive('/posts') ? styles.tabActive : ''}`}
      >
        <div className={styles.iconContainer}>
          <FileText size={28} />
          {isActive('/posts') && <span className={styles.activeDot} />}
        </div>
        <span className={styles.tabLabel}>{navT('posts')}</span>
      </Link>

      {/* Floating Center Action (Student: Apply, Others: Donate) */}
      {user?.role === 'student' ? (
        <Link
          href={{ pathname: '/student', query: { tab: 'applications', action: 'new' } }}
          className={`${styles.tab} ${styles.donateHighlight}`}
          style={{ background: 'none', border: 'none', textDecoration: 'none' }}
        >
          <div className={styles.donateIconWrapper}>
            <PlusCircle size={36} className={styles.heartPulse} />
          </div>
          <span className={styles.donateLabel}>{isBn ? 'আবেদন' : 'Apply'}</span>
        </Link>
      ) : (
        <button
          type="button"
          onClick={() => setIsFinancialModalOpen(true)}
          className={`${styles.tab} ${styles.donateHighlight}`}
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <div className={styles.donateIconWrapper}>
            <Heart size={36} className={styles.heartPulse} />
          </div>
          <span className={styles.donateLabel}>{navT('donate')}</span>
        </button>
      )}

      <Link
        href="/ledger"
        className={`${styles.tab} ${isActive('/ledger') ? styles.tabActive : ''}`}
      >
        <div className={styles.iconContainer}>
          <BarChart3 size={28} />
          {isActive('/ledger') && <span className={styles.activeDot} />}
        </div>
        <span className={styles.tabLabel}>{navT('ledger')}</span>
      </Link>

      {/* Unified Mobile Drawer Trigger Tab */}
      <button
        type="button"
        onClick={toggleDrawer}
        className={`${styles.tab} ${isDrawerOpen ? styles.tabActive : ''}`}
        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <div className={styles.iconContainer}>
          <Menu size={28} />
          {isDrawerOpen && <span className={styles.activeDot} />}
        </div>
        <span className={styles.tabLabel}>{isBn ? 'মেনু' : 'Menu'}</span>
      </button>

      <FinancialDonationModal
        isOpen={isFinancialModalOpen}
        onClose={() => setIsFinancialModalOpen(false)}
      />
    </nav>
  );
}
