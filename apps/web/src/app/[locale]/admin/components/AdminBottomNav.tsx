'use client';

import React from 'react';
import { ShieldCheck, Building2, Heart, Menu } from 'lucide-react';
import styles from '../admin.module.css';

export interface AdminBottomNavProps {
  activeNav: string;
  setActiveNav: (nav: string) => void;
  setIsMobileDrawerOpen: (open: boolean) => void;
  approvalBadgeCount: number;
  isBn: boolean;
}

export function AdminBottomNav({
  activeNav,
  setActiveNav,
  setIsMobileDrawerOpen,
  approvalBadgeCount,
  isBn,
}: AdminBottomNavProps) {
  return (
    <nav className={styles.adminBottomNav} aria-label={isBn ? 'মোবাইল নেভিগেশন' : 'Mobile Admin Navigation'}>
      <button
        type="button"
        className={`${styles.bottomNavItem} ${activeNav === 'overview' ? styles.bottomNavItemActive : ''}`}
        onClick={() => setActiveNav('overview')}
      >
        <ShieldCheck size={20} />
        <span>{isBn ? 'ওভারভিউ' : 'Overview'}</span>
      </button>

      <button
        type="button"
        className={`${styles.bottomNavItem} ${
          ['org_requests', 'student_posts', 'affiliation_requests', 'pending_donations'].includes(activeNav)
            ? styles.bottomNavItemActive
            : ''
        }`}
        onClick={() => setActiveNav('org_requests')}
      >
        <Building2 size={20} />
        <span>{isBn ? 'ছাড়পত্র' : 'Approvals'}</span>
        {approvalBadgeCount > 0 && (
          <span className={styles.bottomNavBadge}>
            {approvalBadgeCount.toLocaleString(isBn ? 'bn-BD' : 'en-US')}
          </span>
        )}
      </button>

      <button
        type="button"
        className={`${styles.bottomNavItem} ${
          ['donors', 'pending_donations', 'item_donations'].includes(activeNav) ? styles.bottomNavItemActive : ''
        }`}
        onClick={() => setActiveNav('donors')}
      >
        <Heart size={20} />
        <span>{isBn ? 'ডোনার' : 'Donors'}</span>
      </button>

      <button
        type="button"
        className={styles.bottomNavItem}
        onClick={() => setIsMobileDrawerOpen(true)}
      >
        <Menu size={20} />
        <span>{isBn ? 'মেনু' : 'Menu'}</span>
      </button>
    </nav>
  );
}

export default AdminBottomNav;
