'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link, usePathname, useRouter } from '../../i18n/routing';
import styles from './Navbar.module.css';
import {
  HeartHandshake,
  User,
  Heart,
  ShieldCheck,
  LogOut,
  Lock,
} from 'lucide-react';
import { useAuthStore, getRoleDashboardPath } from '../../lib/auth-store';
import { isPanelRoute } from '../../lib/is-panel-route';

export default function Navbar() {
  const t = useTranslations('Common');
  const navT = useTranslations('Nav');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const toggleLanguage = () => {
    const nextLocale = locale === 'bn' ? 'en' : 'bn';
    router.replace(pathname, { locale: nextLocale });
  };

  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return false;
  };

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

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <header className={`${styles.header} ${isScrolled ? styles.headerScrolled : ''} desktop-only`}>
      <div className={`container ${styles.headerInner}`}>
        {/* Brand */}
        <Link href={isMandatorySetup ? '/set-password' : '/'} className={styles.brand}>
          <div className={styles.brandIconWrapper}>
            <HeartHandshake size={23} />
          </div>
          <div className={styles.brandTextGroup}>
            <span className={styles.brandTitle}>{t('siteName')}</span>
            <span className={styles.brandTagline}>{t('verified')}</span>
          </div>
        </Link>

        {isMandatorySetup ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              className={styles.trustBadge}
              style={{
                borderColor: 'rgba(217, 119, 6, 0.4)',
                backgroundColor: 'rgba(217, 119, 6, 0.08)',
                color: 'var(--accent)',
              }}
            >
              <Lock size={15} />
              <span>{locale === 'bn' ? 'অ্যাকাউন্ট সেটআপ আবশ্যক' : 'Setup Required'}</span>
            </div>
          </div>
        ) : (
          /* Navigation Links */
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
          </nav>
        )}

        {/* Right Side Actions */}
        <div className={styles.actions}>
          {isMandatorySetup ? (
            <>
              {/* Language Toggle */}
              <button
                type="button"
                onClick={toggleLanguage}
                className={styles.langToggleBtn}
                title={locale === 'bn' ? 'Switch to English (EN)' : 'বাংলায় পরিবর্তন করুন (BN)'}
                aria-label="Toggle BN / EN language"
              >
                <span className={`${styles.langTag} ${locale === 'bn' ? styles.langActive : styles.langInactive}`}>BN</span>
                <span className={styles.langDivider}>/</span>
                <span className={`${styles.langTag} ${locale === 'en' ? styles.langActive : styles.langInactive}`}>EN</span>
              </button>

              {/* Logout button */}
              <button
                type="button"
                onClick={handleLogout}
                className={styles.langBtn}
                style={{
                  color: 'var(--danger)',
                  borderColor: 'rgba(239, 68, 68, 0.3)',
                  backgroundColor: 'rgba(239, 68, 68, 0.05)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
                title={locale === 'bn' ? 'লগআউট' : 'Logout'}
              >
                <LogOut size={16} />
                <span>{locale === 'bn' ? 'লগআউট' : 'Logout'}</span>
              </button>
            </>
          ) : (
            <>
              {/* Transparency trust badge */}
              <div className={styles.trustBadge}>
                <span className={styles.pulseDot} />
                <ShieldCheck size={15} />
                <span>{t('verified')}</span>
              </div>

              {/* Language Toggle */}
              <button
                type="button"
                onClick={toggleLanguage}
                className={styles.langToggleBtn}
                title={locale === 'bn' ? 'Switch to English (EN)' : 'বাংলায় পরিবর্তন করুন (BN)'}
                aria-label="Toggle BN / EN language"
              >
                <span className={`${styles.langTag} ${locale === 'bn' ? styles.langActive : styles.langInactive}`}>BN</span>
                <span className={styles.langDivider}>/</span>
                <span className={`${styles.langTag} ${locale === 'en' ? styles.langActive : styles.langInactive}`}>EN</span>
              </button>

              {/* Donate CTA */}
              <Link href="/donate" className={styles.donateBtn}>
                <Heart size={16} />
                <span>{t('donateNow')}</span>
              </Link>

              {/* Login / Profile */}
              {user ? (
                <div className={styles.userSection}>
                  <Link
                    href={getRoleDashboardPath(user.role) as any}
                    className={styles.userProfilePill}
                  >
                    <div className={styles.userAvatar}>
                      <User size={14} />
                    </div>
                    <div className={styles.userMeta}>
                      <span className={styles.userName}>
                        {user.fullName ? user.fullName.split(' ')[0] : 'ইউজার'}
                      </span>
                      <span className={styles.userRoleBadge}>
                        {user.role === 'donor'
                          ? 'দাতা'
                          : user.role === 'student'
                          ? 'শিক্ষার্থী'
                          : user.role === 'teacher'
                          ? 'শিক্ষক'
                          : user.role === 'organization'
                          ? 'প্রতিষ্ঠান'
                          : 'এডমিন'}
                      </span>
                    </div>
                  </Link>
                  <button
                    type="button"
                    onClick={logout}
                    className={styles.logoutBtn}
                    title="লগআউট"
                    aria-label="Logout"
                  >
                    <LogOut size={15} />
                  </button>
                </div>
              ) : (
                <Link href="/login" className={styles.loginBtn}>
                  <User size={16} />
                  <span>{t('login')}</span>
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
