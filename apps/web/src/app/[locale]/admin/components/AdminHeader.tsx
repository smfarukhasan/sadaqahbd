'use client';

import React from 'react';
import Link from 'next/link';
import { Menu, ShieldCheck, Globe } from 'lucide-react';
import { UserRole } from '@sadaqahbd/schema';
import AdminNotificationDropdown from '@/components/layout/AdminNotificationDropdown';
import UserMenuDropdown from '@/components/profile/UserMenuDropdown';
import styles from '../admin.module.css';

export interface AdminHeaderProps {
  isBn: boolean;
  user: any;
  displayName: string;
  displayRole: string;
  notificationCategories: any[];
  handleNavSelect: (navKey: string) => void;
  setIsMobileDrawerOpen: (open: boolean) => void;
}

export function AdminHeader({
  isBn,
  user,
  displayName,
  displayRole,
  notificationCategories,
  handleNavSelect,
  setIsMobileDrawerOpen,
}: AdminHeaderProps) {
  return (
    <header className={styles.adminHeader}>
      {/* Mobile view Left (Menu trigger + Brand + Role Tag) */}
      <div className={styles.mobileHeaderLeft}>
        <button
          type="button"
          className={styles.mobileMenuTrigger}
          onClick={() => setIsMobileDrawerOpen(true)}
          aria-label={isBn ? 'এডমিন মেনু ড্রয়ার খুলুন' : 'Open Admin Menu Drawer'}
        >
          <Menu size={22} color="#34d399" />
        </button>

        <div
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            background: '#059669',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
            flexShrink: 0,
          }}
        >
          <ShieldCheck size={18} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#ffffff', whiteSpace: 'nowrap' }}>
            {isBn ? 'সাদাকাহ বিডি' : 'Sadaqahbd'}
          </span>
          <span className={styles.brandRoleTag}>
            {user?.role === UserRole.MASTER_ADMIN
              ? (isBn ? 'মাস্টার এডমিন' : 'Master Admin')
              : user?.role === UserRole.SUPER_ADMIN
              ? (isBn ? 'সুপার এডমিন' : 'Super Admin')
              : (isBn ? 'এডমিন' : 'Admin')}
          </span>
        </div>
      </div>

      {/* Desktop view Left: "সাদাকাহ বিডি" and role panel as a tag beside it */}
      <div className={styles.desktopHeaderLeft}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: '#059669',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={20} />
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#ffffff', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>
            {isBn ? 'সাদাকাহ বিডি' : 'Sadaqahbd'}
          </span>
          <span className={styles.brandRoleTag}>
            {user?.role === UserRole.MASTER_ADMIN
              ? (isBn ? 'মাস্টার এডমিন' : 'Master Admin')
              : user?.role === UserRole.SUPER_ADMIN
              ? (isBn ? 'সুপার এডমিন' : 'Super Admin')
              : (isBn ? 'এডমিন' : 'Admin')}
          </span>
        </div>
      </div>

      {/* Right Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Link
          href="/"
          className={styles.publicSiteBtn}
          title={isBn ? 'পাবলিক ওয়েবসাইট দেখুন' : 'Visit Public Website'}
          aria-label={isBn ? 'পাবলিক ওয়েবসাইট' : 'Public Site'}
        >
          <Globe size={16} className={styles.publicSiteIcon} />
          <span className={styles.publicSiteText}>
            {isBn ? 'পাবলিক ওয়েবসাইট' : 'Public Site'}
          </span>
        </Link>

        {/* Admin Notifications Dropdown */}
        <AdminNotificationDropdown
          categories={notificationCategories}
          onSelectNav={handleNavSelect}
        />

        {/* Profile Dropdown with Name & Actions */}
        <UserMenuDropdown customDisplayName={displayName} customRole={displayRole} />
      </div>
    </header>
  );
}

export default AdminHeader;
