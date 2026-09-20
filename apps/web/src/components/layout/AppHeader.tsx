'use client';

import React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link, usePathname, useRouter } from '../../i18n/routing';
import styles from './AppHeader.module.css';
import { HeartHandshake, User } from 'lucide-react';

import { LogOut } from 'lucide-react';
import { useAuthStore, getRoleDashboardPath } from '../../lib/auth-store';
import { isPanelRoute } from '../../lib/is-panel-route';

export default function AppHeader() {
  const t = useTranslations('Common');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const isMandatorySetup = pathname.includes('/set-password') || (user && !user.isPasswordSet);

  // Dedicated User Panels (Admin, Student, Teacher, Org, Donor, MasterAdmin) have their own separate executive portal UI
  if (isPanelRoute(pathname)) {
    return null;
  }

  const toggleLanguage = () => {
    const nextLocale = locale === 'bn' ? 'en' : 'bn';
    router.replace(pathname, { locale: nextLocale });
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <header className={`${styles.appHeader} mobile-only`}>
      <Link href={isMandatorySetup ? '/set-password' : '/'} className={styles.brand}>
        <div className={styles.brandIconWrapper}>
          <HeartHandshake size={18} />
        </div>
        <span className={styles.brandText}>{t('siteName')}</span>
      </Link>

      <div className={styles.rightActions}>
        <button
          type="button"
          onClick={toggleLanguage}
          className={styles.langPill}
          title={locale === 'bn' ? 'Switch to English (EN)' : 'বাংলায় দেখুন (BN)'}
          aria-label="Toggle BN / EN language"
        >
          <span className={`${styles.langTag} ${locale === 'bn' ? styles.langActive : styles.langInactive}`}>BN</span>
          <span className={styles.langDivider}>/</span>
          <span className={`${styles.langTag} ${locale === 'en' ? styles.langActive : styles.langInactive}`}>EN</span>
        </button>

        {isMandatorySetup ? (
          <button
            onClick={handleLogout}
            className={styles.iconBtn}
            title={locale === 'bn' ? 'লগআউট' : 'Logout'}
            aria-label="Logout"
            style={{ color: '#ef4444' }}
          >
            <LogOut size={18} />
          </button>
        ) : (
          <Link
            href={user ? (getRoleDashboardPath(user.role) as any) : '/login'}
            className={`${styles.iconBtn} ${styles.profileBtn}`}
            aria-label="Account"
            title={user ? (locale === 'bn' ? 'ড্যাশবোর্ডে প্রবেশ করুন' : 'Go to Dashboard') : (locale === 'bn' ? 'লগইন করুন' : 'Login')}
          >
            <User size={18} />
            {user && <span className={styles.activeDot} />}
          </Link>
        )}
      </div>
    </header>
  );
}

