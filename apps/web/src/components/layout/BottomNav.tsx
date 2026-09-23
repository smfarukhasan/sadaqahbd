'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '../../i18n/routing';
import styles from './BottomNav.module.css';
import { Home, Heart, FileText, BarChart3, User, PlusCircle } from 'lucide-react';
import { useAuthStore, getRoleDashboardPath } from '../../lib/auth-store';
import { isPanelRoute } from '../../lib/is-panel-route';

export default function BottomNav() {
  const navT = useTranslations('Nav');
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  const userRolePath = user ? getRoleDashboardPath(user.role) : '/login';
  const isMandatorySetup = pathname.includes('/set-password') || (user && !user.isPasswordSet);

  // Dedicated User Panels (Admin, Student, Teacher, Org, Donor, MasterAdmin) have their own separate executive portal UI
  if (isMandatorySetup || isPanelRoute(pathname)) {
    return null;
  }

  const roleTabLabel = user
    ? (user.role === 'student'
        ? 'ড্যাশবোর্ড'
        : user.role === 'teacher'
        ? 'শিক্ষক'
        : user.role === 'organization'
        ? 'প্রতিষ্ঠান'
        : user.role === 'donor'
        ? 'ডোনার'
        : 'এডমিন')
    : navT('portal');

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

      {/* Floating Center Action (Student: Apply, Others: Donate) */}
      {user?.role === 'student' ? (
        <Link
          href={{ pathname: '/student', query: { tab: 'applications', action: 'new' } }}
          className={`${styles.tab} ${styles.donateHighlight}`}
          style={{ background: '#059669' }}
        >
          <div className={styles.donateIconWrapper}>
            <PlusCircle size={22} className={styles.heartPulse} />
          </div>
          <span className={styles.donateLabel}>আবেদন</span>
        </Link>
      ) : (
        <Link
          href="/donate"
          className={`${styles.tab} ${styles.donateHighlight}`}
        >
          <div className={styles.donateIconWrapper}>
            <Heart size={22} className={styles.heartPulse} />
          </div>
          <span className={styles.donateLabel}>{navT('donate')}</span>
        </Link>
      )}

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
        href={userRolePath as any}
        className={`${styles.tab} ${isActive(userRolePath) ? styles.tabActive : ''}`}
      >
        <div className={styles.iconContainer}>
          <User size={21} />
          {isActive(userRolePath) && <span className={styles.activeDot} />}
        </div>
        <span className={styles.tabLabel}>{roleTabLabel}</span>
      </Link>
    </nav>
  );
}

