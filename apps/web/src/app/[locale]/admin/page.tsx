'use client';

import React from 'react';
import { useAdminDashboard } from './hooks/useAdminDashboard';
import AdminSidebar from './components/AdminSidebar';
import AdminHeader from './components/AdminHeader';
import AdminTabRouter from './components/AdminTabRouter';
import AdminActionDrawer from './components/AdminActionDrawer';
import AdminBottomNav from './components/AdminBottomNav';
import AdminModals from './components/AdminModals';
import styles from './admin.module.css';

export default function AdminDashboardPage() {
  const {
    sidebarProps,
    headerProps,
    tabRouterProps,
    actionDrawerProps,
    bottomNavProps,
    modalsProps,
  } = useAdminDashboard();

  return (
    <div className={styles.adminRoot}>
      {/* Off-Canvas Mobile Drawer & Collapsible Desktop Sidebar */}
      <AdminSidebar {...sidebarProps} />

      {/* Main Workspace (Executive Header + Tab Content Canvas) */}
      <div className={styles.adminMainWrapper}>
        <AdminHeader {...headerProps} />
        <AdminTabRouter {...tabRouterProps} />
      </div>

      {/* Action / Inspection Slide-Over Drawer */}
      <AdminActionDrawer {...actionDrawerProps} />

      {/* Mobile Bottom Navigation Bar (< 768px - Adaptive App Experience) */}
      <AdminBottomNav {...bottomNavProps} />

      {/* Universal Details & Entity Assignment Modals */}
      <AdminModals {...modalsProps} />
    </div>
  );
}
