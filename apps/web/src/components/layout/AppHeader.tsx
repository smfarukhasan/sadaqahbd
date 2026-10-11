'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link, usePathname, useRouter } from '../../i18n/routing';
import styles from './AppHeader.module.css';
import { HeartHandshake, User, LogOut, Sun, Moon } from 'lucide-react';
import { useAuthStore, getRoleDashboardPath } from '../../lib/auth-store';
import { isPanelRoute } from '../../lib/is-panel-route';
import { useThemeStore } from '../../lib/theme-store';

export default function AppHeader() {
  const t = useTranslations('Common');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const initTheme = useThemeStore((s) => s.initTheme);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    initTheme();
    setMounted(true);
  }, [initTheme]);

  const isMandatorySetup = pathname.includes('/set-password') || (user && !user.isPasswordSet);

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 15);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Dedicated User Panels have their own separate executive portal UI
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
    <header className={`${styles.appHeader} ${isScrolled ? styles.appHeaderScrolled : ''} mobile-only`}>
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

        <button
          type="button"
          onClick={toggleTheme}
          className={styles.iconBtn}
          title={
            locale === 'bn'
              ? theme === 'dark'
                ? 'লাইট মোড'
                : 'ডার্ক মোড'
              : theme === 'dark'
                ? 'Light Mode'
                : 'Dark Mode'
          }
          aria-label="Toggle theme"
        >
          {mounted && theme === 'dark' ? (
            <Sun size={18} style={{ color: '#fbbf24' }} />
          ) : (
            <Moon size={18} style={{ color: '#38bdf8' }} />
          )}
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

