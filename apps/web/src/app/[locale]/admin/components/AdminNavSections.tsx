'use client';

import {
  ShieldCheck,
  Building2,
  UserCheck,
  ArrowLeftRight,
  GraduationCap,
  Heart,
  DollarSign,
  Package,
  SlidersHorizontal,
  Users,
  Coins,
  Smartphone,
  ShieldAlert,
  MessageSquare,
} from 'lucide-react';
import styles from '../admin.module.css';

interface AdminNavSectionsProps {
  activeNav: string;
  onSelect: (key: string) => void;
  orgCount: number;
  postCount: number;
  donationCount: number;
  userRole?: string;
  isCollapsed?: boolean;
  affiliationCount?: number;
  itemDonationCount?: number;
  isBn?: boolean;
  transferCount?: number;
  canAccessFundAllocation?: boolean;
  canAccessAppsPrivilege?: boolean;
  canAccessSmsPackages?: boolean;
  canAccessStudentExemptions?: boolean;
  phoneExemptionCount?: number;
}

export default function AdminNavSections({
  activeNav,
  onSelect,
  orgCount,
  postCount,
  donationCount,
  userRole,
  isCollapsed = false,
  affiliationCount = 0,
  itemDonationCount = 0,
  isBn = true,
  transferCount = 0,
  canAccessFundAllocation = false,
  canAccessAppsPrivilege = false,
  canAccessSmsPackages = false,
  canAccessStudentExemptions = false,
  phoneExemptionCount = 0,
}: AdminNavSectionsProps) {
  const renderNavBadge = (count: number = 0) => {
    if (isCollapsed) return null;
    const safeCount = Number.isFinite(count) ? Math.max(0, count) : 0;
    const isZero = safeCount === 0;
    return (
      <span
        className={styles.navBadge}
        style={{
          backgroundColor: isZero ? 'rgba(148, 163, 184, 0.2)' : '#ef4444',
          color: isZero ? '#94a3b8' : '#ffffff',
          border: isZero ? '1px solid rgba(148, 163, 184, 0.3)' : 'none',
          boxShadow: isZero ? 'none' : '0 2px 6px rgba(239, 68, 68, 0.35)',
          minWidth: '22px',
          height: '18px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.72rem',
          lineHeight: 1,
          fontWeight: 700,
          padding: '0 0.4rem',
          borderRadius: '10px',
        }}
      >
        {safeCount.toString()}
      </span>
    );
  };

  return (
    <>
      {/* 1. Overview */}
      <div className={styles.navSection}>
        {!isCollapsed && <div className={styles.navSectionTitle}>{isBn ? 'মূল কন্ট্রোল' : 'Main Controls'}</div>}
        <button
          type="button"
          className={`${styles.navItem} ${activeNav === 'overview' ? styles.navItemActive : ''}`}
          onClick={() => onSelect('overview')}
          title={isBn ? 'ড্যাশবোর্ড ওভারভিউ' : 'Dashboard Overview'}
        >
          <div className={styles.navItemContent}>
            <ShieldCheck size={18} />
            {!isCollapsed && <span className={styles.navItemText}>{isBn ? 'ড্যাশবোর্ড ওভারভিউ' : 'Dashboard Overview'}</span>}
          </div>
        </button>
      </div>

      {/* 2. Verifications & Approvals */}
      <div className={styles.navSection}>
        {!isCollapsed && <div className={styles.navSectionTitle}>{isBn ? 'যাচাই ও অনুমোদন কেন্দ্র' : 'Verification & Clearances'}</div>}
        <button
          type="button"
          className={`${styles.navItem} ${activeNav === 'org_requests' ? styles.navItemActive : ''}`}
          onClick={() => onSelect('org_requests')}
          title={isBn ? 'প্রতিষ্ঠান ভেরিফিকেশন' : 'Institute Verification'}
        >
          <div className={styles.navItemContent}>
            <Building2 size={18} />
            {!isCollapsed && <span className={styles.navItemText}>{isBn ? 'প্রতিষ্ঠান ছাড়পত্র' : 'Institute Clearance'}</span>}
          </div>
          {renderNavBadge(orgCount)}
        </button>

        <button
          type="button"
          className={`${styles.navItem} ${activeNav === 'affiliation_requests' ? styles.navItemActive : ''}`}
          onClick={() => onSelect('affiliation_requests')}
          title={isBn ? 'শিক্ষক ও শিক্ষার্থী অনুমোদন' : 'Teacher & Student Clearances'}
        >
          <div className={styles.navItemContent}>
            <UserCheck size={18} />
            {!isCollapsed && <span className={styles.navItemText}>{isBn ? 'শিক্ষক ও শিক্ষার্থী ছাড়পত্র' : 'Teacher & Student Clearances'}</span>}
          </div>
          {renderNavBadge(affiliationCount)}
        </button>

        <button
          type="button"
          className={`${styles.navItem} ${activeNav === 'transfer_requests' ? styles.navItemActive : ''}`}
          onClick={() => onSelect('transfer_requests')}
          title={isBn ? 'প্রতিষ্ঠান স্থানান্তর ছাড়পত্র' : 'Institution Transfers'}
        >
          <div className={styles.navItemContent}>
            <ArrowLeftRight size={18} />
            {!isCollapsed && <span className={styles.navItemText}>{isBn ? 'প্রতিষ্ঠান স্থানান্তর ছাড়পত্র' : 'Institution Transfers'}</span>}
          </div>
          {renderNavBadge(transferCount)}
        </button>

        <button
          type="button"
          className={`${styles.navItem} ${activeNav === 'student_posts' ? styles.navItemActive : ''}`}
          onClick={() => onSelect('student_posts')}
          title={isBn ? 'শিক্ষার্থী পোস্ট যাচাই' : 'Student Campaign Verification'}
        >
          <div className={styles.navItemContent}>
            <GraduationCap size={18} />
            {!isCollapsed && <span className={styles.navItemText}>{isBn ? 'শিক্ষার্থী পোস্ট যাচাই' : 'Student Campaign Verification'}</span>}
          </div>
          {renderNavBadge(postCount)}
        </button>

        {canAccessStudentExemptions && (
          <button
            type="button"
            className={`${styles.navItem} ${activeNav === 'phone_exemptions' ? styles.navItemActive : ''}`}
            onClick={() => onSelect('phone_exemptions')}
            title={isBn ? 'ফোন ভেরিফিকেশন অব্যাহতি' : 'Phone Exemption Clearances'}
          >
            <div className={styles.navItemContent}>
              <Smartphone size={18} />
              {!isCollapsed && (
                <span className={styles.navItemText}>
                  {isBn ? 'ফোন অব্যাহতি ছাড়পত্র' : 'Phone Exemptions'}
                </span>
              )}
            </div>
            {renderNavBadge(phoneExemptionCount)}
          </button>
        )}
      </div>

      {/* 3. Donors & Community */}
      <div className={styles.navSection}>
        {!isCollapsed && <div className={styles.navSectionTitle}>{isBn ? 'দাতা ও অনুদান' : 'Donors & Donations'}</div>}
        <button
          type="button"
          className={`${styles.navItem} ${activeNav === 'donors' ? styles.navItemActive : ''}`}
          onClick={() => onSelect('donors')}
          title={isBn ? 'ডোনার তালিকা' : 'Donor Directory'}
        >
          <div className={styles.navItemContent}>
            <Heart size={18} />
            {!isCollapsed && <span className={styles.navItemText}>{isBn ? 'ডোনার তালিকা' : 'Donor Directory'}</span>}
          </div>
        </button>

        <button
          type="button"
          className={`${styles.navItem} ${activeNav === 'pending_donations' ? styles.navItemActive : ''}`}
          onClick={() => onSelect('pending_donations')}
          title={isBn ? 'অনুদান পেমেন্ট যাচাই' : 'Donation Payment Verification'}
        >
          <div className={styles.navItemContent}>
            <DollarSign size={18} />
            {!isCollapsed && <span className={styles.navItemText}>{isBn ? 'অনুদান পেমেন্ট যাচাই' : 'Donation Verification'}</span>}
          </div>
          {renderNavBadge(donationCount)}
        </button>

        <button
          type="button"
          className={`${styles.navItem} ${activeNav === 'item_donations' ? styles.navItemActive : ''}`}
          onClick={() => onSelect('item_donations')}
          title={isBn ? 'পণ্য অনুদান যাচাই' : 'Item Donations Verification'}
        >
          <div className={styles.navItemContent}>
            <Package size={18} />
            {!isCollapsed && <span className={styles.navItemText}>{isBn ? 'পণ্য অনুদান যাচাই' : 'Item Donations'}</span>}
          </div>
          {renderNavBadge(itemDonationCount)}
        </button>

        {/* Fund Allocation (Only Master Admin & Super Admins with permission) */}
        {canAccessFundAllocation && (
          <button
            type="button"
            className={`${styles.navItem} ${activeNav === 'fund_allocation' ? styles.navItemActive : ''}`}
            onClick={() => onSelect('fund_allocation')}
            title={isBn ? 'তহবিল বণ্টন ও বরাদ্দ' : 'Fund Allocation'}
          >
            <div className={styles.navItemContent}>
              <Coins size={18} color="#10b981" />
              {!isCollapsed && (
                <span className={styles.navItemText}>
                  {isBn ? 'তহবিল বণ্টন ও বরাদ্দ' : 'Fund Allocation'}
                </span>
              )}
            </div>
          </button>
        )}
      </div>

      {/* 4. User Management (All Organizations, All Students, All Teachers, All Donors, All Users, Super Admins) */}
      <div className={styles.navSection}>
        {!isCollapsed && <div className={styles.navSectionTitle}>{isBn ? 'ইউজার ব্যবস্থাপনা' : 'User Management'}</div>}
        <button
          type="button"
          className={`${styles.navItem} ${activeNav === 'all_organizations' ? styles.navItemActive : ''}`}
          onClick={() => onSelect('all_organizations')}
          title={isBn ? 'সকল প্রতিষ্ঠান' : 'All Organizations'}
        >
          <div className={styles.navItemContent}>
            <Building2 size={18} />
            {!isCollapsed && <span className={styles.navItemText}>{isBn ? 'সকল প্রতিষ্ঠান' : 'All Organizations'}</span>}
          </div>
        </button>

        <button
          type="button"
          className={`${styles.navItem} ${activeNav === 'all_students' ? styles.navItemActive : ''}`}
          onClick={() => onSelect('all_students')}
          title={isBn ? 'সকল শিক্ষার্থী' : 'All Students'}
        >
          <div className={styles.navItemContent}>
            <GraduationCap size={18} />
            {!isCollapsed && <span className={styles.navItemText}>{isBn ? 'সকল শিক্ষার্থী' : 'All Students'}</span>}
          </div>
        </button>

        <button
          type="button"
          className={`${styles.navItem} ${activeNav === 'all_teachers' ? styles.navItemActive : ''}`}
          onClick={() => onSelect('all_teachers')}
          title={isBn ? 'সকল শিক্ষক' : 'All Teachers'}
        >
          <div className={styles.navItemContent}>
            <UserCheck size={18} />
            {!isCollapsed && <span className={styles.navItemText}>{isBn ? 'সকল শিক্ষক' : 'All Teachers'}</span>}
          </div>
        </button>

        <button
          type="button"
          className={`${styles.navItem} ${(activeNav === 'all_donors' || activeNav === 'donors') ? styles.navItemActive : ''}`}
          onClick={() => onSelect('all_donors')}
          title={isBn ? 'সকল ডোনার' : 'All Donors'}
        >
          <div className={styles.navItemContent}>
            <Heart size={18} />
            {!isCollapsed && <span className={styles.navItemText}>{isBn ? 'সকল ডোনার' : 'All Donors'}</span>}
          </div>
        </button>

        <button
          type="button"
          className={`${styles.navItem} ${activeNav === 'all_users' ? styles.navItemActive : ''}`}
          onClick={() => onSelect('all_users')}
          title={isBn ? 'সকল ব্যবহারকারী অডিট' : 'All Users Audit'}
        >
          <div className={styles.navItemContent}>
            <SlidersHorizontal size={18} />
            {!isCollapsed && <span className={styles.navItemText}>{isBn ? 'সকল ইউজার অডিট' : 'All Users Audit'}</span>}
          </div>
        </button>

        <button
          type="button"
          className={`${styles.navItem} ${activeNav === 'super_admins' ? styles.navItemActive : ''}`}
          onClick={() => onSelect('super_admins')}
          title={isBn ? 'সুপার এডমিন ও স্টাফ তালিকা' : 'Super Admins & Staff'}
        >
          <div className={styles.navItemContent}>
            <Users size={18} />
            {!isCollapsed && (
              <span className={styles.navItemText}>{isBn ? 'সুপার এডমিন ও স্টাফ তালিকা' : 'Super Admins & Staff'}</span>
            )}
          </div>
        </button>
      </div>

      {/* 5. Personal Activity (ব্যক্তিগত কার্যক্রম) */}
      <div className={styles.navSection}>
        {!isCollapsed && <div className={styles.navSectionTitle}>{isBn ? 'ব্যক্তিগত কার্যক্রম' : 'Personal Activity'}</div>}
        <button
          type="button"
          className={`${styles.navItem} ${(activeNav === 'my_donations' || activeNav === 'my-donations') ? styles.navItemActive : ''}`}
          onClick={() => onSelect('my_donations')}
          title={isBn ? 'আমার দান সমূহ' : 'My Donations'}
        >
          <div className={styles.navItemContent}>
            <Heart size={18} color="#10b981" />
            {!isCollapsed && <span className={styles.navItemText}>{isBn ? 'আমার দান সমূহ' : 'My Donations'}</span>}
          </div>
        </button>
      </div>

      {/* 6. Maintenance (মেইন্টেনেন্স) - Master Admin & Permitted Super Admins */}
      {(canAccessAppsPrivilege || canAccessSmsPackages) && (
        <div className={styles.navSection}>
          {!isCollapsed && <div className={styles.navSectionTitle}>{isBn ? 'মেইন্টেনেন্স' : 'Maintenance'}</div>}
          {canAccessAppsPrivilege && (
            <button
              type="button"
              className={`${styles.navItem} ${activeNav === 'apps_privilege' ? styles.navItemActive : ''}`}
              onClick={() => onSelect('apps_privilege')}
              title="Apps Privilege"
            >
              <div className={styles.navItemContent}>
                <ShieldAlert size={18} color="#e11d48" />
                {!isCollapsed && <span className={styles.navItemText}>Apps Privilege</span>}
              </div>
            </button>
          )}

          {canAccessSmsPackages && (
            <button
              type="button"
              className={`${styles.navItem} ${activeNav === 'sms_packages' ? styles.navItemActive : ''}`}
              onClick={() => onSelect('sms_packages')}
              title="SMS Packages"
            >
              <div className={styles.navItemContent}>
                <MessageSquare size={18} color="#0284c7" />
                {!isCollapsed && <span className={styles.navItemText}>SMS Packages</span>}
              </div>
            </button>
          )}
        </div>
      )}
    </>
  );
}
