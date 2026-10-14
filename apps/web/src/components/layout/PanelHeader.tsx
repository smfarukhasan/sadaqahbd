'use client';

import React from 'react';
import { useLocale } from 'next-intl';
import { Link, usePathname, useRouter } from '../../i18n/routing';
import styles from './PanelHeader.module.css';
import {
  Globe,
  LogOut,
  CheckCircle2,
  LucideIcon,
} from 'lucide-react';
import { useAuthStore } from '../../lib/auth-store';

export interface PanelHeaderProps {
  role: 'student' | 'teacher' | 'organization' | 'donor' | 'admin' | 'master_admin';
  titleBn: string;
  titleEn: string;
  subtitleBn: string;
  subtitleEn: string;
  badgeBn: string;
  badgeEn: string;
  icon: LucideIcon;
  accentColor?: string;
  accentBg?: string;
  accentBorder?: string;
}

export default function PanelHeader({
  role,
  titleBn,
  titleEn,
  subtitleBn,
  subtitleEn,
  badgeBn,
  badgeEn,
  icon: Icon,
  accentColor = '#0d9488',
  accentBg = 'rgba(13, 148, 136, 0.15)',
  accentBorder = 'rgba(13, 148, 136, 0.35)',
}: PanelHeaderProps) {
  const locale = useLocale();
  const isBn = locale === 'bn';
  const pathname = usePathname();
  const router = useRouter();

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const toggleLanguage = () => {
    const nextLocale = locale === 'bn' ? 'en' : 'bn';
    router.replace(pathname, { locale: nextLocale });
  };

  const handleLogout = async () => {
    const isMaster = user?.role === 'master_admin';
    await logout();
    router.replace(isMaster ? '/' : '/login');
  };

  const userInitial = user?.fullName ? user.fullName.charAt(0).toUpperCase() : role.charAt(0).toUpperCase();

  return (
    <header
      className={styles.topBanner}
      style={
        {
          '--panel-accent': accentColor,
          '--panel-accent-bg': accentBg,
          '--panel-accent-border': accentBorder,
        } as React.CSSProperties
      }
    >
      <div className={styles.bannerContent}>
        {/* Left: Brand / Role Title */}
        <div className={styles.bannerLeft}>
          <div className={styles.bannerIcon}>
            <Icon size={22} />
          </div>
          <div className={styles.titleBlock}>
            <div className={styles.bannerTitleRow}>
              <h1 className={styles.bannerTitle}>{isBn ? titleBn : titleEn}</h1>
              <span className={styles.rolePill}>
                <CheckCircle2 size={12} /> {isBn ? badgeBn : badgeEn}
              </span>
            </div>
            <span className={styles.bannerSubtitle}>{isBn ? subtitleBn : subtitleEn}</span>
          </div>
        </div>

        {/* Right: User Profile & Actions */}
        <div className={styles.bannerRight}>
          {user && (
            <div className={styles.userBadge}>
              <div className={styles.userAvatar}>{userInitial}</div>
              <div className={styles.userInfo}>
                <span className={styles.userName}>{user.fullName || user.email?.split('@')[0]}</span>
                <span className={styles.userEmail}>{user.email}</span>
              </div>
            </div>
          )}

          <div className={styles.actionsGroup}>
            <button
              type="button"
              onClick={toggleLanguage}
              className={styles.langBtn}
              title={isBn ? 'Switch to English (EN)' : 'বাংলায় পরিবর্তন করুন (BN)'}
              aria-label="Toggle BN / EN language"
            >
              <span className={`${styles.langTag} ${isBn ? styles.langActive : styles.langInactive}`}>BN</span>
              <span className={styles.langDivider}>/</span>
              <span className={`${styles.langTag} ${!isBn ? styles.langActive : styles.langInactive}`}>EN</span>
            </button>

            <Link
              href="/"
              className={styles.websiteBtn}
              title={isBn ? 'পাবলিক ওয়েবসাইট দেখুন' : 'Visit Public Website'}
              aria-label={isBn ? 'পাবলিক ওয়েবসাইট' : 'Public Site'}
            >
              <Globe size={15} />
              <span className={styles.websiteBtnText}>{isBn ? 'ওয়েবসাইট' : 'Public Site'}</span>
            </Link>

            <button onClick={handleLogout} className={styles.logoutBtn} title="Logout">
              <LogOut size={14} />
              <span>{isBn ? 'লগআউট' : 'Logout'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
