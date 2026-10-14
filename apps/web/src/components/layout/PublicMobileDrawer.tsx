'use client';

import React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link, usePathname, useRouter } from '../../i18n/routing';
import styles from './PublicMobileDrawer.module.css';
import {
  X,
  Home,
  FileText,
  BarChart3,
  User,
  LogOut,
  Sun,
  Moon,
  Heart,
  HeartHandshake,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore, getRoleDashboardPath } from '../../lib/auth-store';
import { useThemeStore } from '../../lib/theme-store';
import { useMobileDrawerStore } from '../../lib/drawer-store';
import { isPanelRoute } from '../../lib/is-panel-route';

export default function PublicMobileDrawer() {
  const t = useTranslations('Common');
  const navT = useTranslations('Nav');
  const locale = useLocale();
  const isBn = locale === 'bn';
  const pathname = usePathname();
  const router = useRouter();

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  const isOpen = useMobileDrawerStore((s) => s.isOpen);
  const closeDrawer = useMobileDrawerStore((s) => s.closeDrawer);

  // If on panel route, PortalLayout or admin page renders its own panel drawer using the same store
  if (isPanelRoute(pathname)) {
    return null;
  }

  const toggleLanguage = () => {
    const nextLocale = locale === 'bn' ? 'en' : 'bn';
    router.replace(pathname, { locale: nextLocale });
  };

  const handleLogout = async () => {
    closeDrawer();
    await logout();
    router.replace('/login');
  };

  const userRolePath = user ? getRoleDashboardPath(user.role) : '/login';

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      <div
        className={`${styles.backdrop} ${isOpen ? styles.backdropOpen : ''}`}
        onClick={closeDrawer}
      />

      {/* Off-Canvas Drawer Container */}
      <aside className={`${styles.drawer} ${isOpen ? styles.drawerOpen : ''}`}>
        {/* Drawer Header */}
        <div className={styles.drawerHeader}>
          <div className={styles.brand}>
            <div className={styles.brandIconWrapper}>
              <HeartHandshake size={20} />
            </div>
            <div className={styles.brandTextGroup}>
              <span className={styles.brandTitle}>{t('siteName')}</span>
              <span className={styles.brandTagline}>{t('verified')}</span>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={closeDrawer}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Card */}
        <div className={styles.userCardSection}>
          {user ? (
            <div className={styles.userProfileCard}>
              <div className={styles.userAvatar}>
                {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className={styles.userInfo}>
                <span className={styles.userName}>{user.fullName}</span>
                <span className={styles.userRoleBadge}>
                  <ShieldCheck size={12} />
                  {user.role === 'donor'
                    ? isBn ? 'দাতা' : 'Donor'
                    : user.role === 'student'
                    ? isBn ? 'শিক্ষার্থী' : 'Student'
                    : user.role === 'teacher'
                    ? isBn ? 'শিক্ষক' : 'Teacher'
                    : user.role === 'organization'
                    ? isBn ? 'প্রতিষ্ঠান' : 'Organization'
                    : isBn ? 'এডমিন' : 'Admin'}
                </span>
              </div>
              <Link
                href={userRolePath as any}
                className={styles.dashboardBtn}
                onClick={closeDrawer}
              >
                <span>{isBn ? 'ড্যাশবোর্ড' : 'Dashboard'}</span>
                <ChevronRight size={14} />
              </Link>
            </div>
          ) : (
            <Link
              href="/login"
              className={styles.loginCardBtn}
              onClick={closeDrawer}
            >
              <User size={18} />
              <span>{isBn ? 'লগইন করুন / রেজিস্ট্রেশন' : 'Login / Register'}</span>
            </Link>
          )}
        </div>

        {/* Quick Settings: Language & Theme Switchers */}
        <div className={styles.settingsRow}>
          <button
            type="button"
            onClick={toggleLanguage}
            className={styles.settingPill}
          >
            <span className={locale === 'bn' ? styles.activeTag : ''}>BN</span>
            <span className={styles.tagDivider}>/</span>
            <span className={locale === 'en' ? styles.activeTag : ''}>EN</span>
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            className={styles.settingPill}
          >
            {theme === 'dark' ? (
              <>
                <Sun size={16} color="#fbbf24" />
                <span>{isBn ? 'লাইট মোড' : 'Light Mode'}</span>
              </>
            ) : (
              <>
                <Moon size={16} color="#0284c7" />
                <span>{isBn ? 'ডার্ক মোড' : 'Dark Mode'}</span>
              </>
            )}
          </button>
        </div>

        {/* Main Public Links */}
        <nav className={styles.navLinks}>
          <Link
            href="/"
            className={`${styles.navItem} ${pathname === '/' ? styles.navItemActive : ''}`}
            onClick={closeDrawer}
          >
            <Home size={19} />
            <span>{navT('home')}</span>
          </Link>

          <Link
            href="/posts"
            className={`${styles.navItem} ${pathname.startsWith('/posts') ? styles.navItemActive : ''}`}
            onClick={closeDrawer}
          >
            <FileText size={19} />
            <span>{navT('posts')}</span>
          </Link>

          <Link
            href="/ledger"
            className={`${styles.navItem} ${pathname.startsWith('/ledger') ? styles.navItemActive : ''}`}
            onClick={closeDrawer}
          >
            <BarChart3 size={19} />
            <span>{navT('ledger')}</span>
          </Link>

          {user && (
            <>
              <Link
                href={
                  user.role === 'admin' || user.role === 'super_admin' || user.role === 'master_admin'
                    ? ('/admin?tab=my_donations' as any)
                    : (`${userRolePath}?tab=my-donations` as any)
                }
                className={`${styles.navItem} ${pathname.includes('my-donations') || pathname.includes('my_donations') ? styles.navItemActive : ''}`}
                onClick={closeDrawer}
              >
                <Heart size={19} color="#10b981" />
                <span>{isBn ? 'আমার দান সমূহ' : 'My Donations'}</span>
              </Link>

              <Link
                href={userRolePath as any}
                className={`${styles.navItem} ${pathname.startsWith(userRolePath) && !pathname.includes('my-donations') && !pathname.includes('my_donations') ? styles.navItemActive : ''}`}
                onClick={closeDrawer}
              >
                <User size={19} />
                <span>{isBn ? 'আমার পোর্টাল / ড্যাশবোর্ড' : 'My Portal / Dashboard'}</span>
              </Link>
            </>
          )}
        </nav>

        {/* Footer: Logout when logged in, Khub Soja Credit when logged out */}
        {user ? (
          <div className={styles.drawerFooter}>
            <button
              type="button"
              onClick={handleLogout}
              className={styles.logoutBtn}
            >
              <LogOut size={18} />
              <span>{isBn ? 'লগআউট' : 'Logout'}</span>
            </button>
          </div>
        ) : (
          <div className={styles.drawerCreditFooter}>
            <span className={styles.creditLabel}>
              {isBn ? 'ডিজাইন ও ডেভেলপমেন্টেঃ ' : 'Design & Development: '}
            </span>
            <a
              href="https://khubsoja.com/"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.creditLink}
              onClick={closeDrawer}
            >
              {isBn ? 'খুব সোজা' : 'Khub Soja'}
            </a>
          </div>
        )}
      </aside>
    </>
  );
}
