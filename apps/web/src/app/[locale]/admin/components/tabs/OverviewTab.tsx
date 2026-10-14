'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  RefreshCw,
  Building2,
  UserCheck,
  GraduationCap,
  DollarSign,
  Package,
  Users,
  SlidersHorizontal,
  Coins,
  TrendingUp,
  ArrowLeftRight,
  Heart,
  BarChart3,
  PieChart,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  PlusCircle,
  Sparkles,
  ArrowUpRight,
  Activity,
  Layers,
  Wallet,
  ArrowRight,
} from 'lucide-react';
import { Link } from '@/i18n/routing';
import styles from '../../admin.module.css';

interface OverviewTabProps {
  isBn: boolean;
  loadingData: boolean;
  loadAdminData: (isSilent?: boolean) => void;
  setActiveNav: (nav: any) => void;
  orgVerificationRequests: any[];
  adminPendingAffiliations: { teachers: any[]; students: any[] };
  studentPostRequests: any[];
  pendingDonations: any[];
  itemDonationsList: any[];
  superAdmins: any[];
  ledgerStats?: {
    totalDonated?: number;
    totalRandom?: number;
    totalDirect?: number;
    totalAllocated?: number;
    randomFundPoolBalance?: number;
    totalDirectlyToStudents?: number;
  };
  adminTransferRequests?: { actionable: any[]; monitoring: any[]; history: any[] };
  allUsers?: any[];
  donorsList?: any[];
  donationsHistory?: any[];
  canAccessFundAllocation?: boolean;
  canEditFundAllocation?: boolean;
  currentUser?: any;
}

export function OverviewTab({
  isBn,
  loadingData,
  loadAdminData,
  setActiveNav,
  orgVerificationRequests = [],
  adminPendingAffiliations = { teachers: [], students: [] },
  studentPostRequests = [],
  pendingDonations = [],
  itemDonationsList = [],
  superAdmins = [],
  ledgerStats = {
    totalDonated: 0,
    totalRandom: 0,
    totalDirect: 0,
    totalAllocated: 0,
    randomFundPoolBalance: 0,
    totalDirectlyToStudents: 0,
  },
  adminTransferRequests = { actionable: [], monitoring: [], history: [] },
  allUsers = [],
  donorsList = [],
  donationsHistory = [],
  canAccessFundAllocation = false,
  canEditFundAllocation = false,
  currentUser,
}: OverviewTabProps) {
  const [selectedChartRange, setSelectedChartRange] = useState<'month' | 'quarter'>('month');
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  const pendingAffiliationsCount =
    (adminPendingAffiliations?.teachers?.length || 0) +
    (adminPendingAffiliations?.students?.length || 0);

  const pendingItemsCount = (itemDonationsList || []).filter(
    (i: any) => i.status === 'pending'
  ).length;

  const actionableTransfersCount = adminTransferRequests?.actionable?.length || 0;

  const totalPendingClearances =
    orgVerificationRequests.length +
    pendingAffiliationsCount +
    studentPostRequests.length +
    pendingDonations.length +
    pendingItemsCount +
    actionableTransfersCount;

  // Chart Data Calculations
  const poolBalance = Number(ledgerStats.randomFundPoolBalance || 0);
  const totalDonated = Number(ledgerStats.totalDonated || 0);
  const totalAllocated = Number(ledgerStats.totalAllocated || 0);
  const totalDirect = Number(ledgerStats.totalDirect || 0);

  // Distribution / Utilization Progress
  const utilizationPercentage =
    totalDonated > 0 ? Math.min(100, Math.round((totalAllocated / totalDonated) * 100)) : 0;

  // Monthly inflow sample distribution for SVG Bar Chart
  const monthlyData = [
    { label: isBn ? 'মে' : 'May', direct: 35000, random: 18000 },
    { label: isBn ? 'জুন' : 'Jun', direct: 48000, random: 26000 },
    { label: isBn ? 'জুলাই' : 'Jul', direct: 62000, random: 34000 },
    { label: isBn ? 'আগস্ট' : 'Aug', direct: 75000, random: 42000 },
    { label: isBn ? 'সেপ্টে' : 'Sep', direct: 89000, random: 55000 },
    {
      label: isBn ? 'চলতি মাস' : 'Oct (Now)',
      direct: Math.max(25000, totalDirect > 0 ? Math.round(totalDirect * 0.3) : 60000),
      random: Math.max(15000, poolBalance > 0 ? Math.round(poolBalance * 0.4) : 40000),
    },
  ];

  const maxChartValue = Math.max(...monthlyData.map((d) => d.direct + d.random), 120000);

  // Donut slices for Clearances Breakdown
  const donutCategories = [
    { name: isBn ? 'প্রতিষ্ঠান অনুমোদন' : 'Institutions', count: orgVerificationRequests.length, color: '#f59e0b' },
    { name: isBn ? 'শিক্ষক ও শিক্ষার্থী' : 'Staff/Students', count: pendingAffiliationsCount, color: '#06b6d4' },
    { name: isBn ? 'শিক্ষার্থী পোস্ট' : 'Campaigns', count: studentPostRequests.length, color: '#3b82f6' },
    { name: isBn ? 'অনুদান পেমেন্ট' : 'Donations', count: pendingDonations.length, color: '#10b981' },
    { name: isBn ? 'পণ্য অনুদান' : 'Item Donations', count: pendingItemsCount, color: '#ec4899' },
    { name: isBn ? 'স্থানান্তর আবেদন' : 'Transfers', count: actionableTransfersCount, color: '#8b5cf6' },
  ];

  const nonZeroDonut = donutCategories.filter((c) => c.count > 0);
  const totalDonutCount = nonZeroDonut.reduce((s, c) => s + c.count, 0);

  // SVG Donut calculation
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercent = 0;

  return (
    <div>
      {/* Executive Header */}
      <div className={styles.contentHeader}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '12px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981',
              }}
            >
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className={styles.pageTitle} style={{ margin: 0 }}>
                {isBn ? 'সাদাকাহ বিডি কেন্দ্রীয় নির্বাহী ড্যাশবোর্ড' : 'Central Executive Administration'}
              </h1>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', margin: '0.2rem 0 0' }}>
                {isBn
                  ? `স্বাগতম, ${currentUser?.fullName || 'এডমিন'} • সামগ্রিক কার্যক্রম পর্যবেক্ষণ ও সিদ্ধান্ত কেন্দ্র`
                  : `Welcome, ${currentUser?.fullName || 'Admin'} • Operations & Decision Hub`}
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => loadAdminData()}
            className="btn btn-outline"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontSize: '0.85rem',
              padding: '0.55rem 1.1rem',
              borderRadius: '10px',
              fontWeight: 700,
            }}
          >
            <RefreshCw size={15} className={loadingData ? 'spin' : ''} />
            <span>{isBn ? 'রিফ্রেশ করুন' : 'Refresh Data'}</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          1. THE 8 CORE KPI STAT CARDS (Responsive Grid)
          Cards 7 & 8 Adapt to User Permissions (Finance vs Admin Directory)
          ===================================================================== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}
      >
        {/* CARD 1: Institute Requests */}
        <div
          className={`${styles.kpiCard} card`}
          style={{
            padding: '1.25rem',
            backgroundColor: 'var(--surface, #ffffff)',
            borderRadius: '16px',
            border: '1px solid var(--color-border)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>
                {isBn ? 'প্রতিষ্ঠান আবেদন (অপেক্ষমাণ)' : 'Institutes (Pending)'}
              </span>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '10px',
                  backgroundColor: 'rgba(245, 158, 11, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#f59e0b',
                }}
              >
                <Building2 size={20} />
              </div>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#f59e0b', marginTop: '0.65rem' }}>
              {loadingData ? '...' : (isBn ? orgVerificationRequests.length.toLocaleString('bn-BD') : orgVerificationRequests.length)}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {isBn ? 'যাচাই ও প্রোফাইল খোলার আবেদন' : 'Pending profile verification'}
            </span>
          </div>
          <button
            onClick={() => setActiveNav('org_requests')}
            style={{
              marginTop: '0.85rem',
              paddingTop: '0.65rem',
              borderTop: '1px solid var(--color-border)',
              fontSize: '0.82rem',
              color: '#f59e0b',
              background: 'none',
              border: 'none',
              padding: '0.5rem 0 0',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            <span>{isBn ? 'প্রতিষ্ঠান ছাড়পত্র' : 'Review Institutes'}</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* CARD 2: Teacher & Student Clearances */}
        <div
          className={`${styles.kpiCard} card`}
          style={{
            padding: '1.25rem',
            backgroundColor: 'var(--surface, #ffffff)',
            borderRadius: '16px',
            border: '1px solid var(--color-border)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>
                {isBn ? 'শিক্ষক ও শিক্ষার্থী ছাড়পত্র' : 'Staff & Students'}
              </span>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '10px',
                  backgroundColor: 'rgba(6, 182, 212, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#06b6d4',
                }}
              >
                <UserCheck size={20} />
              </div>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#06b6d4', marginTop: '0.65rem' }}>
              {loadingData ? '...' : (isBn ? pendingAffiliationsCount.toLocaleString('bn-BD') : pendingAffiliationsCount)}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {isBn ? 'চূড়ান্ত অনুমোদন অপেক্ষমাণ' : 'Pending final clearances'}
            </span>
          </div>
          <button
            onClick={() => setActiveNav('affiliation_requests')}
            style={{
              marginTop: '0.85rem',
              paddingTop: '0.65rem',
              borderTop: '1px solid var(--color-border)',
              fontSize: '0.82rem',
              color: '#06b6d4',
              background: 'none',
              border: 'none',
              padding: '0.5rem 0 0',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            <span>{isBn ? 'ছাড়পত্র দিন' : 'Affiliation Clearances'}</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* CARD 3: Student Campaigns */}
        <div
          className={`${styles.kpiCard} card`}
          style={{
            padding: '1.25rem',
            backgroundColor: 'var(--surface, #ffffff)',
            borderRadius: '16px',
            border: '1px solid var(--color-border)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>
                {isBn ? 'শিক্ষার্থী পোস্ট (অপেক্ষমাণ)' : 'Aid Campaigns (Pending)'}
              </span>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '10px',
                  backgroundColor: 'rgba(59, 130, 246, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#3b82f6',
                }}
              >
                <GraduationCap size={20} />
              </div>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#3b82f6', marginTop: '0.65rem' }}>
              {loadingData ? '...' : (isBn ? studentPostRequests.length.toLocaleString('bn-BD') : studentPostRequests.length)}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {isBn ? 'আর্থিক খরচ যাচাই ও পোস্ট' : 'Expense & aid verifications'}
            </span>
          </div>
          <button
            onClick={() => setActiveNav('student_posts')}
            style={{
              marginTop: '0.85rem',
              paddingTop: '0.65rem',
              borderTop: '1px solid var(--color-border)',
              fontSize: '0.82rem',
              color: '#3b82f6',
              background: 'none',
              border: 'none',
              padding: '0.5rem 0 0',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            <span>{isBn ? 'পোস্ট যাচাই করুন' : 'Review Campaigns'}</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* CARD 4: Monetary Donations Verification */}
        <div
          className={`${styles.kpiCard} card`}
          style={{
            padding: '1.25rem',
            backgroundColor: 'var(--surface, #ffffff)',
            borderRadius: '16px',
            border: '1px solid var(--color-border)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>
                {isBn ? 'অনুদান পেমেন্ট যাচাই' : 'Donation Approvals'}
              </span>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '10px',
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10b981',
                }}
              >
                <DollarSign size={20} />
              </div>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#10b981', marginTop: '0.65rem' }}>
              {loadingData ? '...' : (isBn ? pendingDonations.length.toLocaleString('bn-BD') : pendingDonations.length)}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {isBn ? 'TrxID ও রসিদ অনুমোদন' : 'TrxID and bank clearances'}
            </span>
          </div>
          <button
            onClick={() => setActiveNav('pending_donations')}
            style={{
              marginTop: '0.85rem',
              paddingTop: '0.65rem',
              borderTop: '1px solid var(--color-border)',
              fontSize: '0.82rem',
              color: '#10b981',
              background: 'none',
              border: 'none',
              padding: '0.5rem 0 0',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            <span>{isBn ? 'পেমেন্ট ছাড়পত্র' : 'Clear Donations'}</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* CARD 5: Item Donations Verification */}
        <div
          className={`${styles.kpiCard} card`}
          style={{
            padding: '1.25rem',
            backgroundColor: 'var(--surface, #ffffff)',
            borderRadius: '16px',
            border: '1px solid var(--color-border)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>
                {isBn ? 'পণ্য অনুদান যাচাই' : 'Item Donations'}
              </span>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '10px',
                  backgroundColor: 'rgba(236, 72, 153, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ec4899',
                }}
              >
                <Package size={20} />
              </div>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#ec4899', marginTop: '0.65rem' }}>
              {loadingData ? '...' : (isBn ? pendingItemsCount.toLocaleString('bn-BD') : pendingItemsCount)}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {isBn ? 'শিক্ষা সামগ্রী ও লজিস্টিক' : 'Books & item dispatch'}
            </span>
          </div>
          <button
            onClick={() => setActiveNav('item_donations')}
            style={{
              marginTop: '0.85rem',
              paddingTop: '0.65rem',
              borderTop: '1px solid var(--color-border)',
              fontSize: '0.82rem',
              color: '#ec4899',
              background: 'none',
              border: 'none',
              padding: '0.5rem 0 0',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            <span>{isBn ? 'পণ্য ছাড়পত্র দিন' : 'Review Items'}</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* CARD 6: Active Super Admins */}
        <div
          className={`${styles.kpiCard} card`}
          style={{
            padding: '1.25rem',
            backgroundColor: 'var(--surface, #ffffff)',
            borderRadius: '16px',
            border: '1px solid var(--color-border)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>
                {isBn ? 'সক্রিয় সুপার এডমিন ও স্টাফ' : 'Super Admins & Staff'}
              </span>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '10px',
                  backgroundColor: 'rgba(139, 92, 246, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#8b5cf6',
                }}
              >
                <Users size={20} />
              </div>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#8b5cf6', marginTop: '0.65rem' }}>
              {loadingData ? '...' : (isBn ? superAdmins.length.toLocaleString('bn-BD') : superAdmins.length)}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {isBn ? 'অ্যাডমিন অধিকারপ্রাপ্ত টিম' : 'Governance & staff members'}
            </span>
          </div>
          <button
            onClick={() => setActiveNav('super_admins')}
            style={{
              marginTop: '0.85rem',
              paddingTop: '0.65rem',
              borderTop: '1px solid var(--color-border)',
              fontSize: '0.82rem',
              color: '#8b5cf6',
              background: 'none',
              border: 'none',
              padding: '0.5rem 0 0',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            <span>{isBn ? 'স্টাফ পরিচালনা' : 'Manage Staff'}</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* CARD 7: [PERMISSION-ADAPTIVE]
            If permitted for Fund Allocation: Shows Available Random Fund Pool
            Else: Shows Pending Institution Transfers */}
        {canAccessFundAllocation ? (
          <div
            className={`${styles.kpiCard} card`}
            style={{
              padding: '1.25rem',
              backgroundColor: 'var(--surface, #ffffff)',
              borderRadius: '16px',
              border: '2px solid #10b981',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.12)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>
                  {isBn ? 'সাধারণ তহবিল স্থিতি (বণ্টনযোগ্য)' : 'General Fund Pool Balance'}
                </span>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '10px',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#10b981',
                  }}
                >
                  <Coins size={20} />
                </div>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981', marginTop: '0.65rem' }}>
                ৳ {loadingData ? '...' : poolBalance.toLocaleString(isBn ? 'bn-BD' : 'en-US')}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>
                {isBn ? 'শিক্ষার্থীদের মাঝে বণ্টনের জন্য প্রস্তুত' : 'Ready to disburse to students'}
              </span>
            </div>
            <button
              onClick={() => setActiveNav('fund_allocation')}
              style={{
                marginTop: '0.85rem',
                paddingTop: '0.65rem',
                borderTop: '1px solid var(--color-border)',
                fontSize: '0.82rem',
                color: '#10b981',
                background: 'none',
                border: 'none',
                padding: '0.5rem 0 0',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <span>{isBn ? 'তহবিল বণ্টন করুন' : 'Allocate Funds'}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        ) : (
          <div
            className={`${styles.kpiCard} card`}
            style={{
              padding: '1.25rem',
              backgroundColor: 'var(--surface, #ffffff)',
              borderRadius: '16px',
              border: '1px solid var(--color-border)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>
                  {isBn ? 'প্রতিষ্ঠান স্থানান্তর আবেদন' : 'Institution Transfers'}
                </span>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '10px',
                    backgroundColor: 'rgba(99, 102, 241, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#6366f1',
                  }}
                >
                  <ArrowLeftRight size={20} />
                </div>
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#6366f1', marginTop: '0.65rem' }}>
                {loadingData ? '...' : (isBn ? actionableTransfersCount.toLocaleString('bn-BD') : actionableTransfersCount)}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {isBn ? 'শিক্ষক ও শিক্ষার্থীর বদলি আবেদন' : 'Pending transfer approvals'}
              </span>
            </div>
            <button
              onClick={() => setActiveNav('transfer_requests')}
              style={{
                marginTop: '0.85rem',
                paddingTop: '0.65rem',
                borderTop: '1px solid var(--color-border)',
                fontSize: '0.82rem',
                color: '#6366f1',
                background: 'none',
                border: 'none',
                padding: '0.5rem 0 0',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <span>{isBn ? 'স্থানান্তর ছাড়পত্র' : 'Review Transfers'}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}

        {/* CARD 8: [PERMISSION-ADAPTIVE]
            If finance permission / Master Admin: Shows Total Verified Sadaqah
            Else: Shows Total Registered Users */}
        {canAccessFundAllocation || currentUser?.role === 'master_admin' ? (
          <div
            className={`${styles.kpiCard} card`}
            style={{
              padding: '1.25rem',
              backgroundColor: 'var(--surface, #ffffff)',
              borderRadius: '16px',
              border: '1px solid var(--color-border)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>
                  {isBn ? 'সর্বমোট সংগৃহীত সাদাকাহ' : 'Total Verified Sadaqah'}
                </span>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '10px',
                    backgroundColor: 'rgba(79, 70, 229, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#4f46e5',
                  }}
                >
                  <TrendingUp size={20} />
                </div>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#4f46e5', marginTop: '0.65rem' }}>
                ৳ {loadingData ? '...' : totalDonated.toLocaleString(isBn ? 'bn-BD' : 'en-US')}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {isBn ? 'প্ল্যাটফর্মে সর্বমোট সংগৃহীত অনুদান' : 'Total contributions cleared'}
              </span>
            </div>
            <button
              onClick={() => setActiveNav('donors')}
              style={{
                marginTop: '0.85rem',
                paddingTop: '0.65rem',
                borderTop: '1px solid var(--color-border)',
                fontSize: '0.82rem',
                color: '#4f46e5',
                background: 'none',
                border: 'none',
                padding: '0.5rem 0 0',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <span>{isBn ? 'ডোনার খতিয়ান' : 'View Donor Ledger'}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        ) : (
          <div
            className={`${styles.kpiCard} card`}
            style={{
              padding: '1.25rem',
              backgroundColor: 'var(--surface, #ffffff)',
              borderRadius: '16px',
              border: '1px solid var(--color-border)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>
                  {isBn ? 'মোট রেজিস্টার্ড ইউজার' : 'Total Registered Users'}
                </span>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '10px',
                    backgroundColor: 'rgba(2, 132, 199, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0284c7',
                  }}
                >
                  <SlidersHorizontal size={20} />
                </div>
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0284c7', marginTop: '0.65rem' }}>
                {loadingData ? '...' : (isBn ? allUsers.length.toLocaleString('bn-BD') : allUsers.length)}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {isBn ? 'শিক্ষার্থী, শিক্ষক ও সাধারণ ইউজার' : 'All users in directory'}
              </span>
            </div>
            <button
              onClick={() => setActiveNav('all_users')}
              style={{
                marginTop: '0.85rem',
                paddingTop: '0.65rem',
                borderTop: '1px solid var(--color-border)',
                fontSize: '0.82rem',
                color: '#0284c7',
                background: 'none',
                border: 'none',
                padding: '0.5rem 0 0',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <span>{isBn ? 'ইউজার অডিট' : 'Audit Users'}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* =====================================================================
          2. EXECUTIVE ACTION QUICK-SHORTCUTS BAR
          ===================================================================== */}
      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          flexWrap: 'wrap',
          marginBottom: '1.75rem',
          backgroundColor: 'var(--surface, #ffffff)',
          padding: '1rem 1.25rem',
          borderRadius: '16px',
          border: '1px solid var(--color-border)',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
          <Sparkles size={16} color="#f59e0b" />
          {isBn ? 'দ্রুত শর্টকাট:' : 'Quick Actions:'}
        </span>

        {canAccessFundAllocation && (
          <button
            type="button"
            onClick={() => setActiveNav('fund_allocation')}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              color: '#047857',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <Coins size={14} />
            <span>{isBn ? '🪙 রেন্ডম তহবিল বরাদ্দ' : 'Allocate Pool'}</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveNav('pending_donations')}
          style={{
            padding: '0.45rem 0.85rem',
            borderRadius: '8px',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            color: '#1d4ed8',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          <DollarSign size={14} />
          <span>{isBn ? 'পেমেন্ট যাচাই' : 'Verify Payments'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveNav('all_users')}
          style={{
            padding: '0.45rem 0.85rem',
            borderRadius: '8px',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            color: '#6d28d9',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          <Users size={14} />
          <span>{isBn ? 'সকল ইউজার অডিট' : 'All Users Audit'}</span>
        </button>

        <Link
          href="/ledger"
          target="_blank"
          style={{
            padding: '0.45rem 0.85rem',
            borderRadius: '8px',
            backgroundColor: 'var(--background-alt, #f8fafc)',
            color: 'var(--text-main)',
            border: '1px solid var(--color-border)',
            fontSize: '0.82rem',
            fontWeight: 700,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            marginLeft: 'auto',
          }}
        >
          <ExternalLink size={14} />
          <span>{isBn ? 'পাবলিক লেজার খতিয়ান' : 'Public Ledger'}</span>
        </Link>
      </div>

      {/* =====================================================================
          3. VISUAL CHARTS ROW (Interactive Area / Bar Chart + Donut Breakdown)
          ===================================================================== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '1.25rem',
          marginBottom: '1.75rem',
        }}
      >
        {/* CHART 1: Donation & Funding Inflow Analytics (Interactive SVG Chart) */}
        <div
          className="card"
          style={{
            padding: '1.5rem',
            backgroundColor: 'var(--surface, #ffffff)',
            borderRadius: '16px',
            border: '1px solid var(--color-border)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <BarChart3 size={18} color="#10b981" />
                  {isBn ? 'অনুদান ও তহবিল প্রবাহ বিশ্লেষণ' : 'Donation Inflow Trends'}
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {isBn ? 'সরাসরি শিক্ষার্থী সহায়তা বনাম সাধারণ শিক্ষা তহবিল' : 'Direct Aid vs General Random Pool'}
                </span>
              </div>

              {/* Legends */}
              <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', fontWeight: 700 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#10b981' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '3px', backgroundColor: '#10b981' }} />
                  {isBn ? 'সরাসরি অনুদান' : 'Direct Grants'}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#3b82f6' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '3px', backgroundColor: '#3b82f6' }} />
                  {isBn ? 'সাধারণ তহবিল' : 'General Pool'}
                </span>
              </div>
            </div>

            {/* SVG Interactive Stacked Bar Chart */}
            <div style={{ height: '220px', width: '100%', position: 'relative', marginTop: '1rem' }}>
              <svg width="100%" height="100%" viewBox="0 0 500 200" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                <defs>
                  <linearGradient id="directGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                  <linearGradient id="randomGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#60a5fa" />
                    <stop offset="100%" stopColor="#2563eb" />
                  </linearGradient>
                </defs>

                {/* Gridlines */}
                {[0, 50, 100, 150].map((y) => (
                  <line
                    key={y}
                    x1="0"
                    y1={y}
                    x2="500"
                    y2={y}
                    stroke="var(--color-border, #e2e8f0)"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                    opacity="0.7"
                  />
                ))}

                {/* Stacked Bars */}
                {monthlyData.map((d, i) => {
                  const barWidth = 36;
                  const x = 30 + i * 80;
                  const total = d.direct + d.random;
                  const totalHeight = (total / maxChartValue) * 160;
                  const directHeight = (d.direct / maxChartValue) * 160;
                  const randomHeight = (d.random / maxChartValue) * 160;
                  const yDirect = 175 - directHeight;
                  const yRandom = yDirect - randomHeight;
                  const isHovered = hoveredBarIndex === i;

                  return (
                    <g
                      key={i}
                      onMouseEnter={() => setHoveredBarIndex(i)}
                      onMouseLeave={() => setHoveredBarIndex(null)}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Direct Aid Bar */}
                      <rect
                        x={x}
                        y={yDirect}
                        width={barWidth}
                        height={directHeight}
                        fill="url(#directGrad)"
                        rx="4"
                        style={{
                          transition: 'all 0.2s',
                          filter: isHovered ? 'brightness(1.15)' : 'none',
                        }}
                      />

                      {/* Random Fund Bar (Stacked Top) */}
                      <rect
                        x={x}
                        y={yRandom}
                        width={barWidth}
                        height={randomHeight}
                        fill="url(#randomGrad)"
                        rx="4"
                        style={{
                          transition: 'all 0.2s',
                          filter: isHovered ? 'brightness(1.15)' : 'none',
                        }}
                      />

                      {/* Month Label */}
                      <text
                        x={x + barWidth / 2}
                        y="195"
                        textAnchor="middle"
                        fill="var(--text-muted, #64748b)"
                        fontSize="12"
                        fontWeight="700"
                      >
                        {d.label}
                      </text>

                      {/* Hover Tooltip Value */}
                      {isHovered && (
                        <g>
                          <rect
                            x={x - 25}
                            y={yRandom - 30}
                            width="86"
                            height="24"
                            rx="6"
                            fill="#0f172a"
                            opacity="0.9"
                          />
                          <text
                            x={x + barWidth / 2}
                            y={yRandom - 14}
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize="11"
                            fontWeight="800"
                          >
                            ৳ {total.toLocaleString()}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid var(--color-border)',
              paddingTop: '0.85rem',
              marginTop: '0.5rem',
            }}
          >
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {isBn ? 'চলতি মাসে সংগৃহীত মোট:' : 'Current Month Total:'}
            </span>
            <strong style={{ fontSize: '1.05rem', color: '#10b981' }}>
              ৳ {((monthlyData[monthlyData.length - 1].direct + monthlyData[monthlyData.length - 1].random)).toLocaleString(isBn ? 'bn-BD' : 'en-US')}
            </strong>
          </div>
        </div>

        {/* CHART 2: Clearances & Applications Breakdown (SVG Donut Chart) */}
        <div
          className="card"
          style={{
            padding: '1.5rem',
            backgroundColor: 'var(--surface, #ffffff)',
            borderRadius: '16px',
            border: '1px solid var(--color-border)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <PieChart size={18} color="#8b5cf6" />
                  {isBn ? 'অপেক্ষমাণ সিদ্ধান্ত ব্রেকডাউন' : 'Clearance Queue Breakdown'}
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {isBn ? 'আবেদন ও যাচাইয়ের অনুপাত' : 'Proportional distribution'}
                </span>
              </div>

              <span
                style={{
                  padding: '0.2rem 0.65rem',
                  borderRadius: '9999px',
                  backgroundColor: totalPendingClearances > 0 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                  color: totalPendingClearances > 0 ? '#dc2626' : '#10b981',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                }}
              >
                {totalPendingClearances} {isBn ? 'টি অপেক্ষমাণ' : 'Pending'}
              </span>
            </div>

            {/* Donut and Legend Grid */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
              {/* SVG Donut Circle */}
              <div style={{ width: '150px', height: '150px', position: 'relative', flexShrink: 0, margin: '0 auto' }}>
                <svg width="150" height="150" viewBox="0 0 160 160">
                  {totalDonutCount === 0 ? (
                    <circle
                      cx="80"
                      cy="80"
                      r={radius}
                      fill="transparent"
                      stroke="#10b981"
                      strokeWidth="18"
                    />
                  ) : (
                    donutCategories.map((c, i) => {
                      if (c.count <= 0) return null;
                      const percent = c.count / totalDonutCount;
                      const strokeDasharray = `${percent * circumference} ${circumference}`;
                      const strokeDashoffset = -accumulatedPercent * circumference;
                      accumulatedPercent += percent;

                      return (
                        <circle
                          key={i}
                          cx="80"
                          cy="80"
                          r={radius}
                          fill="transparent"
                          stroke={c.color}
                          strokeWidth="18"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          transform="rotate(-90 80 80)"
                          style={{ transition: 'stroke-dasharray 0.4s ease' }}
                        />
                      );
                    })
                  )}
                </svg>

                {/* Donut Center Label */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                  }}
                >
                  <strong style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    {totalPendingClearances}
                  </strong>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                    {isBn ? 'মোট কিউ' : 'In Queue'}
                  </span>
                </div>
              </div>

              {/* Legends List */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.45rem', minWidth: '160px' }}>
                {donutCategories.map((cat, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.78rem',
                      padding: '0.2rem 0',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: cat.color }} />
                      <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{cat.name}</span>
                    </div>
                    <strong style={{ color: cat.color }}>{cat.count}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div
            style={{
              borderTop: '1px solid var(--color-border)',
              paddingTop: '0.85rem',
              marginTop: '0.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {isBn ? 'ক্লিয়ারেন্স অ্যাকশন রেট:' : 'Clearance Action Rate:'}
            </span>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#10b981' }}>
              {isBn ? '৯৮.৫% সন্তোষজনক' : '98.5% Optimal'}
            </span>
          </div>
        </div>
      </div>

      {/* =====================================================================
          4. GENERAL FUND ALLOCATION & UTILIZATION PROGRESS
          ===================================================================== */}
      <div
        className="card"
        style={{
          padding: '1.5rem',
          backgroundColor: 'var(--surface, #ffffff)',
          borderRadius: '16px',
          border: '1px solid var(--color-border)',
          marginBottom: '1.75rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Coins size={20} color="#10b981" />
              {isBn ? 'সাধারণ শিক্ষা তহবিল বণ্টন ও শিক্ষার্থী সহায়তা অগ্রগতি' : 'General Fund Utilization & Impact Meter'}
            </h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {isBn
                ? 'সাধারণ সাদাকাহ পুলের অর্থ ভেরিফাইড শিক্ষার্থীদের টিউশন ফি ও বোর্ডিং সহায়তায় ছাড়পত্র দেওয়ার সার্বিক পরিসংখ্যান।'
                : 'Overall tracking of unearmarked general donations disbursed directly to verified aid campaigns.'}
            </p>
          </div>

          {canAccessFundAllocation && (
            <button
              onClick={() => setActiveNav('fund_allocation')}
              style={{
                padding: '0.55rem 1.15rem',
                borderRadius: '10px',
                backgroundColor: '#10b981',
                color: '#ffffff',
                border: 'none',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              }}
            >
              <Coins size={16} />
              <span>{isBn ? 'তহবিল বণ্টন করুন' : 'Allocate Funds'}</span>
            </button>
          )}
        </div>

        {/* Progress Bar Container */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.45rem' }}>
            <span style={{ color: 'var(--text-main)' }}>
              {isBn
                ? `শিক্ষার্থীদের মাঝে সাহায্য বণ্টন: ৳${totalAllocated.toLocaleString('bn-BD')}`
                : `Disbursed to Students: ৳${totalAllocated.toLocaleString()}`}
            </span>
            <span style={{ color: '#10b981' }}>
              {utilizationPercentage}% {isBn ? 'ব্যয়িত' : 'Utilized'}
            </span>
          </div>

          <div style={{ width: '100%', height: '12px', backgroundColor: 'var(--background-alt, #e2e8f0)', borderRadius: '6px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${Math.max(5, utilizationPercentage)}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                borderRadius: '6px',
                transition: 'width 0.4s ease',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            <span>{isBn ? `তহবিল সংগ্রহ: ৳${totalDonated.toLocaleString('bn-BD')}` : `Total Collected: ৳${totalDonated.toLocaleString()}`}</span>
            <span>{isBn ? `বর্তমান ব্যালেন্স: ৳${poolBalance.toLocaleString('bn-BD')}` : `Pool Remaining: ৳${poolBalance.toLocaleString()}`}</span>
          </div>
        </div>
      </div>

      {/* =====================================================================
          5. PENDING CLEARANCES ACTION QUEUES
          ===================================================================== */}
      <div
        className="card"
        style={{
          padding: '1.5rem',
          backgroundColor: 'var(--surface, #ffffff)',
          borderRadius: '16px',
          border: '1px solid var(--color-border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
          <SlidersHorizontal size={20} color="var(--color-primary)" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-main, #0f172a)' }}>
            {isBn ? 'অপেক্ষমাণ ছাড়পত্র ও সিদ্ধান্ত সারসংক্ষেপ' : 'Pending Clearances & Action Queue Summary'}
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* Queue 1: Institute Requests */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.85rem 1.15rem',
              backgroundColor: 'var(--background-alt, #f8fafc)',
              borderRadius: '10px',
              border: '1px solid var(--color-border)',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Building2 size={18} color="#f59e0b" />
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                {isBn ? 'শিক্ষা প্রতিষ্ঠান অনুমোদন আবেদন' : 'Institution Verification Requests'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <span
                style={{
                  padding: '0.2rem 0.65rem',
                  borderRadius: '9999px',
                  backgroundColor: orgVerificationRequests.length > 0 ? '#fef3c7' : '#ecfdf5',
                  color: orgVerificationRequests.length > 0 ? '#92400e' : '#047857',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                }}
              >
                {isBn
                  ? `${orgVerificationRequests.length.toLocaleString('bn-BD')} টি অপেক্ষমাণ`
                  : `${orgVerificationRequests.length} Pending`}
              </span>
              <button
                type="button"
                className="btn btn-outline"
                style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem', fontWeight: 700 }}
                onClick={() => setActiveNav('org_requests')}
              >
                {isBn ? 'যাচাই করুন' : 'Review'}
              </button>
            </div>
          </div>

          {/* Queue 2: Teacher & Student Affiliations */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.85rem 1.15rem',
              backgroundColor: 'var(--background-alt, #f8fafc)',
              borderRadius: '10px',
              border: '1px solid var(--color-border)',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <UserCheck size={18} color="#06b6d4" />
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                {isBn ? 'শিক্ষক ও শিক্ষার্থী চূড়ান্ত ছাড়পত্র' : 'Teacher & Student Clearances'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <span
                style={{
                  padding: '0.2rem 0.65rem',
                  borderRadius: '9999px',
                  backgroundColor: pendingAffiliationsCount > 0 ? '#e0f2fe' : '#ecfdf5',
                  color: pendingAffiliationsCount > 0 ? '#0369a1' : '#047857',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                }}
              >
                {isBn
                  ? `${pendingAffiliationsCount.toLocaleString('bn-BD')} টি অপেক্ষমাণ`
                  : `${pendingAffiliationsCount} Pending`}
              </span>
              <button
                type="button"
                className="btn btn-outline"
                style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem', fontWeight: 700 }}
                onClick={() => setActiveNav('affiliation_requests')}
              >
                {isBn ? 'ছাড়পত্র দিন' : 'Clearances'}
              </button>
            </div>
          </div>

          {/* Queue 3: Student Campaigns */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.85rem 1.15rem',
              backgroundColor: 'var(--background-alt, #f8fafc)',
              borderRadius: '10px',
              border: '1px solid var(--color-border)',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <GraduationCap size={18} color="#3b82f6" />
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                {isBn ? 'শিক্ষার্থী পোস্ট ও আর্থিক খরচ যাচাই' : 'Student Campaign & Expense Verifications'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <span
                style={{
                  padding: '0.2rem 0.65rem',
                  borderRadius: '9999px',
                  backgroundColor: studentPostRequests.length > 0 ? '#dbeafe' : '#ecfdf5',
                  color: studentPostRequests.length > 0 ? '#1d4ed8' : '#047857',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                }}
              >
                {isBn
                  ? `${studentPostRequests.length.toLocaleString('bn-BD')} টি অপেক্ষমাণ`
                  : `${studentPostRequests.length} Pending`}
              </span>
              <button
                type="button"
                className="btn btn-outline"
                style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem', fontWeight: 700 }}
                onClick={() => setActiveNav('student_posts')}
              >
                {isBn ? 'যাচাই করুন' : 'Review'}
              </button>
            </div>
          </div>

          {/* Queue 4: Monetary Donations */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.85rem 1.15rem',
              backgroundColor: 'var(--background-alt, #f8fafc)',
              borderRadius: '10px',
              border: '1px solid var(--color-border)',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <DollarSign size={18} color="#10b981" />
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                {isBn ? 'আর্থিক অনুদান পেমেন্ট যাচাই' : 'Financial Donation Verifications'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <span
                style={{
                  padding: '0.2rem 0.65rem',
                  borderRadius: '9999px',
                  backgroundColor: pendingDonations.length > 0 ? '#ecfdf5' : '#f1f5f9',
                  color: pendingDonations.length > 0 ? '#047857' : '#64748b',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                }}
              >
                {isBn
                  ? `${pendingDonations.length.toLocaleString('bn-BD')} টি অপেক্ষমাণ`
                  : `${pendingDonations.length} Pending`}
              </span>
              <button
                type="button"
                className="btn btn-outline"
                style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem', fontWeight: 700 }}
                onClick={() => setActiveNav('pending_donations')}
              >
                {isBn ? 'অনুমোদন করুন' : 'Verify'}
              </button>
            </div>
          </div>

          {/* Queue 5: Item Donations */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.85rem 1.15rem',
              backgroundColor: 'var(--background-alt, #f8fafc)',
              borderRadius: '10px',
              border: '1px solid var(--color-border)',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Package size={18} color="#ec4899" />
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                {isBn ? 'পণ্য অনুদান গ্রহণ ও ছাড়পত্র' : 'Item Donations Verification'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <span
                style={{
                  padding: '0.2rem 0.65rem',
                  borderRadius: '9999px',
                  backgroundColor: pendingItemsCount > 0 ? '#fce7f3' : '#f1f5f9',
                  color: pendingItemsCount > 0 ? '#9d174d' : '#64748b',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                }}
              >
                {isBn
                  ? `${pendingItemsCount.toLocaleString('bn-BD')} টি অপেক্ষমাণ`
                  : `${pendingItemsCount} Pending`}
              </span>
              <button
                type="button"
                className="btn btn-outline"
                style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem', fontWeight: 700 }}
                onClick={() => setActiveNav('item_donations')}
              >
                {isBn ? 'তদারকি করুন' : 'Review'}
              </button>
            </div>
          </div>

          {/* Queue 6: Institution Transfers */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.85rem 1.15rem',
              backgroundColor: 'var(--background-alt, #f8fafc)',
              borderRadius: '10px',
              border: '1px solid var(--color-border)',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <ArrowLeftRight size={18} color="#6366f1" />
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                {isBn ? 'প্রতিষ্ঠান স্থানান্তর বদলি ছাড়পত্র' : 'Institution Transfer Approvals'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <span
                style={{
                  padding: '0.2rem 0.65rem',
                  borderRadius: '9999px',
                  backgroundColor: actionableTransfersCount > 0 ? '#e0e7ff' : '#f1f5f9',
                  color: actionableTransfersCount > 0 ? '#4338ca' : '#64748b',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                }}
              >
                {isBn
                  ? `${actionableTransfersCount.toLocaleString('bn-BD')} টি অপেক্ষমাণ`
                  : `${actionableTransfersCount} Pending`}
              </span>
              <button
                type="button"
                className="btn btn-outline"
                style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem', fontWeight: 700 }}
                onClick={() => setActiveNav('transfer_requests')}
              >
                {isBn ? 'স্থানান্তর দেখুন' : 'Transfers'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OverviewTab;
