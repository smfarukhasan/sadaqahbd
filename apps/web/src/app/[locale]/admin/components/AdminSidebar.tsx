'use client';

import React from 'react';
import { X, LogOut, ChevronRight, ChevronLeft } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import AdminNavSections from './AdminNavSections';
import styles from '../admin.module.css';

export interface AdminSidebarProps {
  isMobileDrawerOpen: boolean;
  setIsMobileDrawerOpen: (open: boolean) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  displayName: string;
  displayRole: string;
  user: any;
  activeNav: string;
  handleNavSelect: (navKey: string) => void;
  effectiveOrgCount: number;
  effectivePostCount: number;
  effectiveDonationCount: number;
  effectiveAffiliationCount: number;
  effectiveItemDonationCount: number;
  effectiveTransferCount: number;
  canAccessFundAllocation?: boolean;
  canAccessAppsPrivilege?: boolean;
  canAccessSmsPackages?: boolean;
  canAccessStudentExemptions?: boolean;
  phoneExemptionCount?: number;
  isBn: boolean;
}

export function AdminSidebar({
  isMobileDrawerOpen,
  setIsMobileDrawerOpen,
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  displayName,
  displayRole,
  user,
  activeNav,
  handleNavSelect,
  effectiveOrgCount,
  effectivePostCount,
  effectiveDonationCount,
  effectiveAffiliationCount,
  effectiveItemDonationCount,
  effectiveTransferCount,
  canAccessFundAllocation = false,
  canAccessAppsPrivilege = false,
  canAccessSmsPackages = false,
  canAccessStudentExemptions = false,
  phoneExemptionCount = 0,
  isBn,
}: AdminSidebarProps) {
  const handleLogout = async () => {
    await useAuthStore.getState().logout();
    window.location.href = '/login';
  };

  return (
    <>
      {/* ====================================================================
          Mobile Off-Canvas Drawer Backdrop & Drawer
          ==================================================================== */}
      <div
        className={`${styles.drawerOverlay} ${isMobileDrawerOpen ? styles.drawerOverlayOpen : ''}`}
        onClick={() => setIsMobileDrawerOpen(false)}
      />

      <aside className={`${styles.mobileDrawer} ${isMobileDrawerOpen ? styles.mobileDrawerOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.userProfileCard}>
            <div className={styles.userAvatar}>{displayName.charAt(0)}</div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{displayName}</span>
              <span className={styles.userRole}>{user?.email || displayRole}</span>
            </div>
          </div>
          <button
            className={styles.collapseBtn}
            onClick={() => setIsMobileDrawerOpen(false)}
            aria-label={isBn ? 'ড্রয়ার বন্ধ করুন' : 'Close Drawer'}
          >
            <X size={18} />
          </button>
        </div>

        {/* Mobile Navigation Links */}
        <div style={{ flex: 1, paddingBottom: '1rem', overflowY: 'auto' }}>
          <AdminNavSections
            activeNav={activeNav}
            onSelect={handleNavSelect}
            orgCount={effectiveOrgCount}
            postCount={effectivePostCount}
            donationCount={effectiveDonationCount}
            userRole={user?.role}
            isCollapsed={false}
            affiliationCount={effectiveAffiliationCount}
            itemDonationCount={effectiveItemDonationCount}
            isBn={isBn}
            transferCount={effectiveTransferCount}
            canAccessFundAllocation={canAccessFundAllocation}
            canAccessAppsPrivilege={canAccessAppsPrivilege}
            canAccessSmsPackages={canAccessSmsPackages}
            canAccessStudentExemptions={canAccessStudentExemptions}
            phoneExemptionCount={phoneExemptionCount}
          />
        </div>

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

      {/* ====================================================================
          Desktop Sidebar Navigation Drawer (Collapsible, Full 100vh from Top: 0)
          ==================================================================== */}
      <aside
        className={`${styles.sidebarDrawer} ${
          isSidebarCollapsed ? styles.sidebarDrawerCollapsed : ''
        }`}
      >
        {/* User Profile Card at the very top of Drawer */}
        <div className={styles.sidebarHeader}>
          {!isSidebarCollapsed && (
            <div className={styles.userProfileCard}>
              <div className={styles.userAvatar}>{displayName.charAt(0)}</div>
              <div className={styles.userInfo}>
                <span className={styles.userName}>{displayName}</span>
                <span className={styles.userRole}>{user?.email || displayRole}</span>
              </div>
            </div>
          )}
          <button
            type="button"
            className={styles.collapseBtn}
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            title={
              isSidebarCollapsed
                ? (isBn ? 'ড্রয়ার প্রসারিত করুন' : 'Expand Sidebar')
                : (isBn ? 'ড্রয়ার সংকুচিত করুন' : 'Collapse Sidebar')
            }
          >
            {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Desktop Navigation Links */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <AdminNavSections
            activeNav={activeNav}
            onSelect={handleNavSelect}
            orgCount={effectiveOrgCount}
            postCount={effectivePostCount}
            donationCount={effectiveDonationCount}
            userRole={user?.role}
            isCollapsed={isSidebarCollapsed}
            affiliationCount={effectiveAffiliationCount}
            itemDonationCount={effectiveItemDonationCount}
            isBn={isBn}
            transferCount={effectiveTransferCount}
            canAccessFundAllocation={canAccessFundAllocation}
            canAccessAppsPrivilege={canAccessAppsPrivilege}
            canAccessSmsPackages={canAccessSmsPackages}
            canAccessStudentExemptions={canAccessStudentExemptions}
            phoneExemptionCount={phoneExemptionCount}
          />
        </div>

        {/* Desktop Drawer Bottom Logout */}
        <div className={styles.drawerFooter}>
          <button
            type="button"
            onClick={handleLogout}
            className={styles.drawerLogoutBtn}
            title={isBn ? 'লগআউট' : 'Logout'}
          >
            <LogOut size={18} />
            {!isSidebarCollapsed && <span>{isBn ? 'লগআউট' : 'Logout'}</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

export default AdminSidebar;
