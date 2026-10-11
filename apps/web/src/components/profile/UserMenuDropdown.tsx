'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '../../i18n/routing';
import styles from './UserMenuDropdown.module.css';
import { useAuthStore } from '../../lib/auth-store';
import UserProfileModal from './UserProfileModal';
import {
  User,
  ChevronDown,
  KeyRound,
  LogOut,
  Languages,
  Sun,
  Moon,
} from 'lucide-react';
import { useThemeStore } from '../../lib/theme-store';

interface UserMenuDropdownProps {
  customDisplayName?: string;
  customRole?: string;
  onSelectNav?: (navKey: string) => void;
}

const ROLE_LABELS: Record<string, { bn: string; en: string }> = {
  super_admin: { bn: 'সুপার এডমিন', en: 'Super Admin' },
  admin: { bn: 'এডমিন', en: 'Admin' },
  student: { bn: 'শিক্ষার্থী', en: 'Student' },
  teacher: { bn: 'শিক্ষক', en: 'Teacher' },
  organization: { bn: 'প্রতিষ্ঠান', en: 'Organization' },
  donor: { bn: 'দাতা', en: 'Donor' },
};

export default function UserMenuDropdown({
  customDisplayName,
  customRole,
  onSelectNav,
}: UserMenuDropdownProps) {
  const locale = useLocale();
  const isBn = locale === 'bn';
  const pathname = usePathname();
  const router = useRouter();

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const initTheme = useThemeStore((s) => s.initTheme);

  const [isOpen, setIsOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'profile' | 'password'>('profile');

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const displayName =
    customDisplayName ||
    user?.fullName ||
    user?.email?.split('@')[0] ||
    (isBn ? 'এডমিন কর্মকর্তা' : 'Admin Officer');
  const rawRole = customRole || user?.role || 'admin';
  const displayRoleLabel = ROLE_LABELS[rawRole]?.[isBn ? 'bn' : 'en'] || rawRole;
  const userEmail = user?.email || 'admin@sadaqahbd.com';
  const userInitial = displayName.charAt(0).toUpperCase();

  const handleOpenProfile = () => {
    setModalTab('profile');
    setModalOpen(true);
    setIsOpen(false);
  };

  const handleOpenPassword = () => {
    setModalTab('password');
    setModalOpen(true);
    setIsOpen(false);
  };

  const handleToggleLanguage = () => {
    const nextLocale = locale === 'bn' ? 'en' : 'bn';
    setIsOpen(false);
    router.replace(pathname, { locale: nextLocale });
  };

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    window.location.href = '/login';
  };

  return (
    <>
      <div className={styles.menuWrapper} ref={wrapperRef}>
        {/* Trigger Button displaying user avatar, user name & role */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`${styles.triggerBtn} ${isOpen ? styles.triggerBtnOpen : ''}`}
          title={isBn ? `${displayName} (${displayRoleLabel})` : `${displayName} (${displayRoleLabel})`}
          aria-expanded={isOpen}
        >
          {user?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatarUrl}
              alt={displayName}
              className={styles.avatarPhoto}
            />
          ) : (
            <div className={styles.avatar}>{userInitial}</div>
          )}
          <div className={styles.userTextGroup}>
            <span className={styles.userName}>{displayName}</span>
            <span className={styles.userRoleText}>{displayRoleLabel}</span>
          </div>
          <ChevronDown size={14} className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`} />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className={styles.dropdownMenu}>
            {/* Header with user info */}
            <div className={styles.menuHeader}>
              <span className={styles.headerFullName}>{displayName}</span>
              <span className={styles.headerEmail}>{userEmail}</span>
            </div>

            <div className={styles.divider} />

            {/* 1. Profile Info */}
            <button
              type="button"
              className={styles.menuItem}
              onClick={handleOpenProfile}
            >
              <div className={styles.itemLeft}>
                <User size={16} />
                <span>{isBn ? 'প্রোফাইল' : 'Profile'}</span>
              </div>
            </button>

            {/* 2. BN / EN Language Switch */}
            <button
              type="button"
              className={styles.menuItem}
              onClick={handleToggleLanguage}
            >
              <div className={styles.itemLeft}>
                <Languages size={16} />
                <span>{isBn ? 'ভাষা' : 'Language'}</span>
              </div>
              <span className={styles.langPill}>
                <span className={isBn ? styles.langActive : styles.langInactive}>BN</span>
                <span style={{ color: '#cbd5e1', fontWeight: 400 }}>/</span>
                <span className={!isBn ? styles.langActive : styles.langInactive}>EN</span>
              </span>
            </button>

            {/* 3. Light / Dark Theme Switch */}
            <button
              type="button"
              className={styles.menuItem}
              onClick={toggleTheme}
            >
              <div className={styles.itemLeft}>
                {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                <span>{isBn ? 'থিম' : 'Theme'}</span>
              </div>
              <span className={styles.themePill}>
                <span
                  className={theme === 'light' ? styles.themeActive : styles.themeInactive}
                  title={isBn ? 'লাইট মোড' : 'Light Mode'}
                >
                  <Sun size={13} />
                </span>
                <span style={{ color: '#cbd5e1', fontWeight: 400, fontSize: '0.7rem' }}>/</span>
                <span
                  className={theme === 'dark' ? styles.themeActive : styles.themeInactive}
                  title={isBn ? 'ডার্ক মোড' : 'Dark Mode'}
                >
                  <Moon size={13} />
                </span>
              </span>
            </button>

            {/* 3. Change Password */}
            <button
              type="button"
              className={styles.menuItem}
              onClick={handleOpenPassword}
            >
              <div className={styles.itemLeft}>
                <KeyRound size={16} />
                <span>{isBn ? 'পাসওয়ার্ড পরিবর্তন' : 'Change Password'}</span>
              </div>
            </button>

            <div className={styles.divider} />

            {/* 4. Logout Button */}
            <button
              type="button"
              className={`${styles.menuItem} ${styles.menuItemDanger}`}
              onClick={handleLogout}
            >
              <div className={styles.itemLeft}>
                <LogOut size={16} />
                <span>{isBn ? 'লগআউট' : 'Logout'}</span>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* User Profile & Password Modal */}
      <UserProfileModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        isBn={isBn}
        initialTab={modalTab}
      />
    </>
  );
}
