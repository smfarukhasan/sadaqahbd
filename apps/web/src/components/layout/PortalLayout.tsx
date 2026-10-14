'use client';

import React, { useState, useEffect } from 'react';
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
  FileText,
} from 'lucide-react';
import { useAuthStore } from '../../lib/auth-store';
import { useMobileDrawerStore } from '../../lib/drawer-store';
import UserMenuDropdown from '../profile/UserMenuDropdown';
import AdminNotificationDropdown from './AdminNotificationDropdown';
import PhoneVerificationModal from '../profile/PhoneVerificationModal';

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

  const isMobileOpen = useMobileDrawerStore((s) => s.isOpen);
  const openDrawer = useMobileDrawerStore((s) => s.openDrawer);
  const closeDrawer = useMobileDrawerStore((s) => s.closeDrawer);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [hasCheckedPhone, setHasCheckedPhone] = useState(false);

  useEffect(() => {
    if (!user || role === 'admin' || hasCheckedPhone) return;

    let needsVerification = false;
    if (role === 'student') {
      const validUntil = (user as any).phoneExemptionValidUntil
        ? new Date((user as any).phoneExemptionValidUntil)
        : null;
      const isExempt = validUntil ? validUntil.getTime() > Date.now() : false;
      needsVerification = !user.isPhoneVerified && !isExempt;
    } else {
      needsVerification = !user.isPhoneVerified;
    }

    if (needsVerification) {
      setIsPhoneModalOpen(true);
    }
    setHasCheckedPhone(true);
  }, [user, role, hasCheckedPhone]);

  const toggleLanguage = () => {
    const nextLocale = locale === 'bn' ? 'en' : 'bn';
    router.replace(pathname, { locale: nextLocale });
  };

  const handleLogout = async () => {
    closeDrawer();
    await logout();
    router.replace('/login');
  };

  const handleSelectNav = (id: string) => {
    onNavSelect(id);
    closeDrawer();
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

    const mainItems = navItems.filter((i) => i.id !== 'my-donations' && (i as any).section !== 'personal');
    const personalItems = navItems.filter((i) => i.id === 'my-donations' || (i as any).section === 'personal');

    const renderButtons = (items: PortalNavItem[]) =>
      items.map((item) => {
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
              <Icon size={19} color={item.id === 'my-donations' ? '#10b981' : undefined} />
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
      });

    return (
      <div className={styles.navScrollContainer}>
        {mainItems.length > 0 && (
          <nav className={styles.navSection}>
            {!isDrawerCollapsed && (
              <div className={styles.navSectionTitle}>
                {isBn ? 'মেনু ও অপশন' : 'Menu & Navigation'}
              </div>
            )}
            {renderButtons(mainItems)}
          </nav>
        )}

        {personalItems.length > 0 && (
          <nav className={styles.navSection}>
            {!isDrawerCollapsed && (
              <div className={styles.navSectionTitle}>
                {isBn ? 'ব্যক্তিগত হিসাব' : 'Personal Activity'}
              </div>
            )}
            {renderButtons(personalItems)}
          </nav>
        )}
      </div>
    );
  };

  return (
    <div className={styles.portalRoot}>
      {/* Mobile Off-Canvas Drawer Backdrop */}
      <div
        className={`${styles.drawerOverlay} ${isMobileOpen ? styles.drawerOverlayOpen : ''}`}
        onClick={closeDrawer}
      />

      {/* ----------------------------------------------------
          1. LEFT EXECUTIVE SIDEBAR DRAWER (Full 100vh on Desktop)
          ---------------------------------------------------- */}
      <aside
        className={`${styles.sidebarDrawer} ${
          isCollapsed ? styles.sidebarDrawerCollapsed : ''
        } ${isMobileOpen ? styles.mobileDrawerOpen : ''}`}
      >
        {/* User Profile Card at the very top of Drawer */}
        <div className={styles.sidebarHeader}>
          {(!isCollapsed || isMobileOpen) && (
            <div className={styles.userProfileCard}>
              <div className={styles.userAvatar}>{userInitial}</div>
              <div className={styles.userInfo}>
                <span className={styles.userName}>{user?.fullName || (isBn ? roleNameBn : roleNameEn)}</span>
                <span className={styles.userEmail}>{user?.email || (isBn ? roleNameBn : roleNameEn)}</span>
              </div>
            </div>
          )}

          <button
            type="button"
            className={styles.collapseToggleBtn}
            onClick={() => {
              if (isMobileOpen) {
                closeDrawer();
              } else {
                setIsCollapsed(!isCollapsed);
              }
            }}
            title={
              isMobileOpen
                ? (isBn ? 'ড্রয়ার বন্ধ করুন' : 'Close Drawer')
                : isCollapsed
                ? (isBn ? 'ড্রয়ার প্রসারিত করুন' : 'Expand Sidebar')
                : (isBn ? 'ড্রয়ার সংকুচিত করুন' : 'Collapse Sidebar')
            }
          >
            {isMobileOpen ? (
              <X size={18} />
            ) : isCollapsed ? (
              <ChevronRight size={18} />
            ) : (
              <ChevronLeft size={18} />
            )}
          </button>
        </div>

        {/* Single Unified Navigation Scroll List */}
        {renderNavList(isCollapsed && !isMobileOpen)}

        {/* Drawer Bottom Logout */}
        <div className={styles.drawerFooter}>
          <button
            type="button"
            onClick={handleLogout}
            className={styles.drawerLogoutBtn}
            title={isBn ? 'লগআউট' : 'Logout'}
          >
            <LogOut size={18} />
            {(!isCollapsed || isMobileOpen) && <span>{isBn ? 'লগআউট' : 'Logout'}</span>}
          </button>
        </div>
      </aside>

      {/* ----------------------------------------------------
          2. WORKSPACE WRAPPER (Top Header + Main Content Canvas)
          ---------------------------------------------------- */}
      <div className={styles.workspaceWrapper}>
        <header className={styles.topHeader}>
          {/* Mobile view Left (Hamburger + Brand + Role Tag) */}
          <div className={styles.mobileHeaderLeft}>
            <button
              type="button"
              className={styles.mobileMenuBtn}
              onClick={openDrawer}
              aria-label={isBn ? 'মেনু ড্রয়ার খুলুন' : 'Open Menu Drawer'}
            >
              <Menu size={22} />
            </button>
            <div className={styles.brandIconWrapper} style={{ width: 34, height: 34 }}>
              <RoleIcon size={18} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span className={styles.brandName} style={{ fontSize: '0.95rem' }}>
                {isBn ? 'সাদাকাহ বিডি' : 'Sadaqahbd'}
              </span>
              <span className={styles.brandRoleTag}>
                {isBn ? roleNameBn : roleNameEn}
              </span>
            </div>
          </div>

          {/* Desktop view Left: "সাদাকাহ বিডি" and role panel as a tag */}
          <div className={styles.desktopHeaderLeft}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div className={styles.brandIconWrapper}>
                <RoleIcon size={20} />
              </div>
              <span className={styles.brandName}>
                {isBn ? 'সাদাকাহ বিডি' : 'Sadaqahbd'}
              </span>
              <span className={styles.brandRoleTag}>
                {isBn ? roleNameBn : roleNameEn}
              </span>
            </div>
          </div>

          {/* Right Actions (Website, Notifications, User Profile dropdown) */}
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
            <UserMenuDropdown onSelectNav={onNavSelect} />
          </div>
        </header>

        {/* Main Content Area */}
        <main className={styles.mainContent}>{children}</main>

        {/* Mandatory Phone Verification Modal */}
        <PhoneVerificationModal
          isOpen={isPhoneModalOpen}
          onClose={() => setIsPhoneModalOpen(false)}
          isBn={isBn}
          mode="verify_mandatory"
        />
      </div>
    </div>
  );
}
