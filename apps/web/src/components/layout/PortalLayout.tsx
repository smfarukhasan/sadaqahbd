'use client';

import React, { useState } from 'react';
import { useLocale } from 'next-intl';
import { Link, usePathname, useRouter } from '../../i18n/routing';
import styles from './PortalLayout.module.css';
import {
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Globe,
  LogOut,
  LucideIcon,
  ShieldCheck,
  HeartHandshake,
  User,
} from 'lucide-react';
import { useAuthStore } from '../../lib/auth-store';
import UserMenuDropdown from '../profile/UserMenuDropdown';
import AdminNotificationDropdown from './AdminNotificationDropdown';

export interface PortalNavItem {
  id: string;
  labelBn: string;
  labelEn: string;
  icon: LucideIcon;
  badge?: number | string;
}

export interface PortalLayoutProps {
  role: 'student' | 'teacher' | 'organization' | 'donor' | 'admin';
  roleNameBn: string;
  roleNameEn: string;
  roleIcon: LucideIcon;
  navItems: PortalNavItem[];
  activeNav: string;
  onNavSelect: (id: string) => void;
  children: React.ReactNode;
}

export default function PortalLayout({
  role,
  roleNameBn,
  roleNameEn,
  roleIcon: RoleIcon,
  navItems,
  activeNav,
  onNavSelect,
  children,
}: PortalLayoutProps) {
  const locale = useLocale();
  const isBn = locale === 'bn';
  const pathname = usePathname();
  const router = useRouter();

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleLanguage = () => {
    const nextLocale = locale === 'bn' ? 'en' : 'bn';
    router.replace(pathname, { locale: nextLocale });
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const handleSelectNav = (id: string) => {
    onNavSelect(id);
    setIsMobileOpen(false);
  };

  const userInitial = user?.fullName
    ? user.fullName.charAt(0).toUpperCase()
    : role.charAt(0).toUpperCase();

  const renderNavList = (isDrawerCollapsed: boolean) => {
    if (navItems.length === 0) {
      return (
        <div style={{ padding: '1.5rem 1rem', textAlign: 'center', color: '#64748b', fontSize: '0.82rem' }}>
          {!isDrawerCollapsed && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={22} color="#94a3b8" />
              <span style={{ fontWeight: 600 }}>{isBn ? 'অনুমোদনের পর ফিচার আনলক হবে' : 'Features unlock after verification'}</span>
            </div>
          )}
        </div>
      );
    }

    return (
      <nav className={styles.navSection}>
        {!isDrawerCollapsed && (
          <div className={styles.navSectionTitle}>
            {isBn ? 'মেনু ও অপশন' : 'Menu & Navigation'}
          </div>
        )}
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeNav === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectNav(item.id)}
              className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
              title={isBn ? item.labelBn : item.labelEn}
            >
              <div className={styles.navItemContent}>
                <Icon size={19} />
                {!isDrawerCollapsed && (
                  <span className={styles.navItemText}>
                    {isBn ? item.labelBn : item.labelEn}
                  </span>
                )}
              </div>
              {!isDrawerCollapsed && item.badge !== undefined && item.badge !== 0 && (
                <span className={styles.navBadge}>{item.badge}</span>
              )}
            </button>
          );
        })}
      </nav>
    );
  };

  return (
    <div className={styles.portalRoot}>
      {/* ----------------------------------------------------
          1. TOP EXECUTIVE HEADER (Brand, User Info & Actions)
          ---------------------------------------------------- */}
      <header className={styles.topHeader}>
        <div className={styles.topHeaderLeft}>
          {/* Mobile Drawer Hamburger Button */}
          <button
            type="button"
            className={styles.mobileMenuToggle}
            onClick={() => setIsMobileOpen(true)}
            aria-label="Open Mobile Menu"
          >
            <Menu size={22} />
          </button>

          {/* Brand Logo & Role Badge */}
          <div className={styles.portalBrand}>
            <div className={styles.brandIconWrapper}>
              <RoleIcon size={20} />
            </div>
            <div className={styles.brandTextGroup}>
              <span className={styles.brandName}>
                {isBn ? 'সাদাকাহ বিডি' : 'Sadaqahbd'}
              </span>
              <span className={styles.roleBadge}>
                <ShieldCheck size={12} /> {isBn ? roleNameBn : roleNameEn}
              </span>
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className={styles.topHeaderRight}>
          <Link
            href="/"
            className={`${styles.actionBtn} ${styles.websiteBtn}`}
            title={isBn ? 'পাবলিক ওয়েবসাইট দেখুন' : 'Visit Public Website'}
            aria-label={isBn ? 'পাবলিক ওয়েবসাইট' : 'Public Site'}
          >
            <Globe size={16} className={styles.websiteBtnIcon} />
            <span className={styles.websiteBtnText}>{isBn ? 'ওয়েবসাইট' : 'Public Site'}</span>
          </Link>

          {/* Notifications Dropdown */}
          <AdminNotificationDropdown />

          {/* User Profile Menu with Name, Dropdown: Profile, BN/EN, Password, Logout */}
          <UserMenuDropdown />
        </div>
      </header>

      {/* ----------------------------------------------------
          2. WORKSPACE LAYOUT: SIDEBAR DRAWER + MAIN CONTENT
          ---------------------------------------------------- */}
      <div className={styles.workspaceLayout}>
        {/* Mobile Off-Canvas Drawer Backdrop */}
        <div
          className={`${styles.mobileBackdrop} ${isMobileOpen ? styles.mobileBackdropOpen : ''}`}
          onClick={() => setIsMobileOpen(false)}
        />

        {/* Mobile Slide-over Drawer */}
        <aside
          className={`${styles.mobileDrawer} ${isMobileOpen ? styles.mobileDrawerOpen : ''}`}
        >
          <div className={styles.sidebarHeader}>
            {user ? (
              <div className={styles.userProfileCard}>
                <div className={styles.userAvatar}>{userInitial}</div>
                <div className={styles.userInfo}>
                  <span className={styles.userName}>{user.fullName}</span>
                  <span className={styles.userEmail}>{user.email}</span>
                </div>
              </div>
            ) : (
              <div className={styles.brandBox}>
                <div className={styles.brandIcon}>
                  <HeartHandshake size={20} />
                </div>
                <div className={styles.brandInfo}>
                  <span className={styles.brandTitle}>সাদাকাহ বিডি</span>
                  <span className={styles.roleBadge}>
                    {isBn ? roleNameBn : roleNameEn}
                  </span>
                </div>
              </div>
            )}
            <button
              type="button"
              className={styles.collapseToggleBtn}
              onClick={() => setIsMobileOpen(false)}
              aria-label="Close Menu"
            >
              <X size={18} />
            </button>
          </div>

          {renderNavList(false)}

          {/* Mobile Drawer Bottom Logout */}
          <div className={styles.drawerFooter}>
            <button
              type="button"
              onClick={handleLogout}
              className={styles.drawerLogoutBtn}
            >
              <LogOut size={18} />
              <span>{isBn ? 'লগআউট' : 'Logout'}</span>
            </button>
          </div>
        </aside>

        {/* Desktop Collapsible Sidebar Drawer */}
        <aside
          className={`${styles.sidebarDrawer} ${
            isCollapsed ? styles.sidebarDrawerCollapsed : ''
          }`}
        >
          <div className={styles.sidebarHeader}>
            {user && !isCollapsed && (
              <div className={styles.userProfileCard}>
                <div className={styles.userAvatar}>{userInitial}</div>
                <div className={styles.userInfo}>
                  <span className={styles.userName}>{user.fullName}</span>
                  <span className={styles.userEmail}>{user.email}</span>
                </div>
              </div>
            )}

            <button
              type="button"
              className={styles.collapseToggleBtn}
              onClick={() => setIsCollapsed(!isCollapsed)}
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>

          {renderNavList(isCollapsed)}

          {/* Desktop Drawer Bottom Logout */}
          <div className={styles.drawerFooter}>
            <button
              type="button"
              onClick={handleLogout}
              className={styles.drawerLogoutBtn}
              title={isBn ? 'লগআউট' : 'Logout'}
            >
              <LogOut size={18} />
              {!isCollapsed && <span>{isBn ? 'লগআউট' : 'Logout'}</span>}
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className={styles.mainContent}>{children}</main>
      </div>
    </div>
  );
}
