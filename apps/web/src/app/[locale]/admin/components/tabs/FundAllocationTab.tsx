'use client';

import React, { useState, useEffect, useTransition } from 'react';
import {
  Coins,
  TrendingUp,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Search,
  Building2,
  User,
  ExternalLink,
  History,
  GraduationCap,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  X,
  Clock,
} from 'lucide-react';
import { getApiUrl } from '@/lib/api-config';
import { getAuthToken } from '@/lib/auth-token';
import { Link } from '@/i18n/routing';
import styles from '../../admin.module.css';

interface FundAllocationTabProps {
  isBn: boolean;
  canEdit: boolean;
  setFeedbackMsg: (msg: string) => void;
}

interface PoolStats {
  totalDonated: number;
  totalRandom: number;
  totalDirect: number;
  totalAllocated: number;
  randomFundPoolBalance: number;
  totalDirectlyToStudents: number;
}

interface EligiblePost {
  id: string;
  title: string;
  studentFullName: string;
  studentClassDepartment?: string;
  studentId: string;
  orgName?: string;
  totalRequiredAmount: number;
  receivedAmount: number;
  remainingAmount: number;
  verificationStatus: string;
  createdAt: string;
}

interface AllocationRecord {
  id: string;
  amount: number;
  notes?: string;
  createdAt: string;
  studentPostId: string;
  postTitle: string;
  studentName: string;
  studentId: string;
  orgName?: string;
  allocatedByAdminName?: string;
}

export default function FundAllocationTab({
  isBn,
  canEdit,
  setFeedbackMsg,
}: FundAllocationTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'eligible' | 'history'>('eligible');
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [poolStats, setPoolStats] = useState<PoolStats>({
    totalDonated: 0,
    totalRandom: 0,
    totalDirect: 0,
    totalAllocated: 0,
    randomFundPoolBalance: 0,
    totalDirectlyToStudents: 0,
  });

  const [eligiblePosts, setEligiblePosts] = useState<EligiblePost[]>([]);
  const [allocationsHistory, setAllocationsHistory] = useState<AllocationRecord[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedPost, setSelectedPost] = useState<EligiblePost | null>(null);
  const [allocationAmount, setAllocationAmount] = useState<string>('');
  const [allocationNotes, setAllocationNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string>('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const apiUrl = getApiUrl();
      const token = await getAuthToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const [statsRes, eligibleRes, historyRes] = await Promise.all([
        fetch(`${apiUrl}/donations/ledger-stats`),
        fetch(`${apiUrl}/donations/allocations/eligible-posts`, { headers }),
        fetch(`${apiUrl}/donations/allocations/history`, { headers }),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setPoolStats(statsData);
      }

      if (eligibleRes.ok) {
        const eligibleData = await eligibleRes.json();
        if (Array.isArray(eligibleData)) {
          setEligiblePosts(eligibleData);
        }
      }

      if (historyRes.ok) {
        const historyData = await historyRes.json();
        if (Array.isArray(historyData)) {
          setAllocationsHistory(historyData);
        }
      }
    } catch (err) {
      console.error('Failed to load fund allocation data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAllocateModal = (post: EligiblePost) => {
    setSelectedPost(post);
    setModalError('');
    setAllocationNotes('');

    // Default suggested amount: the smaller of the remaining needed and available pool
    const suggested = Math.min(poolStats.randomFundPoolBalance, post.remainingAmount);
    setAllocationAmount(suggested > 0 ? String(suggested) : '');
    setIsModalOpen(true);
  };

  const handleConfirmAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPost) return;

    const numAmount = parseFloat(allocationAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setModalError(isBn ? 'অনুগ্রহ করে সঠিক পরিমাণ লিখুন' : 'Please enter a valid amount');
      return;
    }

    if (numAmount > poolStats.randomFundPoolBalance) {
      setModalError(
        isBn
          ? `তহবিলে পর্যাপ্ত অর্থ নেই। সর্বোচ্চ ব্যালেন্স: ৳${poolStats.randomFundPoolBalance.toLocaleString('bn-BD')}`
          : `Insufficient pool balance. Available: ৳${poolStats.randomFundPoolBalance.toLocaleString()}`
      );
      return;
    }

    if (numAmount > selectedPost.remainingAmount) {
      setModalError(
        isBn
          ? `বরাদ্দের পরিমাণ শিক্ষার্থীর বাকি টাকার (৳${selectedPost.remainingAmount.toLocaleString('bn-BD')}) চেয়ে বেশি হতে পারবে না`
          : `Amount cannot exceed remaining needed (৳${selectedPost.remainingAmount})`
      );
      return;
    }

    setSubmitting(true);
    setModalError('');

    try {
      const apiUrl = getApiUrl();
      const token = await getAuthToken();
      const res = await fetch(`${apiUrl}/donations/allocate-fund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentPostId: selectedPost.id,
          amount: numAmount,
          notes: allocationNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Allocation failed');
      }

      setFeedbackMsg(
        isBn
          ? `সফলভাবে "${selectedPost.studentFullName}"-এর আবেদনে ৳${numAmount.toLocaleString('bn-BD')} বরাদ্দ করা হয়েছে।`
          : `Successfully allocated ৳${numAmount.toLocaleString()} to ${selectedPost.studentFullName}'s campaign.`
      );

      setIsModalOpen(false);
      setSelectedPost(null);
      await fetchData();
    } catch (err: any) {
      setModalError(err.message || 'Failed to complete fund allocation');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredEligible = eligiblePosts.filter((p) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      p.title?.toLowerCase().includes(q) ||
      p.studentFullName?.toLowerCase().includes(q) ||
      p.orgName?.toLowerCase().includes(q) ||
      p.studentClassDepartment?.toLowerCase().includes(q)
    );
  });

  const filteredHistory = allocationsHistory.filter((h) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      h.postTitle?.toLowerCase().includes(q) ||
      h.studentName?.toLowerCase().includes(q) ||
      h.orgName?.toLowerCase().includes(q) ||
      h.allocatedByAdminName?.toLowerCase().includes(q) ||
      h.notes?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      {/* Content Header */}
      <div className={styles.contentHeader}>
        <div>
          <h1 className={styles.pageTitle}>
            <Coins size={26} color="#10b981" />
            {isBn ? 'সাধারণ শিক্ষা তহবিল বণ্টন ও অনুদান বরাদ্দ' : 'General Fund Allocation & Grants'}
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            {isBn
              ? 'সাধারণ সাদাকাহ তহবিল (Random Fund Pool) থেকে ভেরিফাইড শিক্ষার্থীদের অসম্পূর্ণ আবেদনে প্রয়োজনীয় শিক্ষাব্যয় মেটাতে অর্থ বরাদ্দ করুন।'
              : 'Disburse unearmarked general pool funds directly to verified student aid campaigns.'}
          </p>
        </div>
      </div>

      {/* Top Pool Stats Overview Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}
      >
        {/* Card 1: Pool Balance */}
        <div
          style={{
            backgroundColor: 'var(--surface, #ffffff)',
            borderRadius: '16px',
            border: '2px solid #10b981',
            padding: '1.25rem',
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.12)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              {isBn ? 'বর্তমান সাধারণ তহবিল স্থিতি' : 'Available Pool Balance'}
            </span>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981',
              }}
            >
              <Wallet size={20} />
            </div>
          </div>
          <div style={{ marginTop: '0.75rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981', margin: 0 }}>
              ৳ {poolStats.randomFundPoolBalance.toLocaleString(isBn ? 'bn-BD' : 'en-US')}
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>
              {isBn ? 'শিক্ষার্থীদের মাঝে বণ্টনের জন্য উন্মুক্ত' : 'Available to allocate to students'}
            </span>
          </div>
        </div>

        {/* Card 2: Total General Fund Raised */}
        <div
          style={{
            backgroundColor: 'var(--surface, #ffffff)',
            borderRadius: '16px',
            border: '1px solid var(--color-border)',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              {isBn ? 'মোট সাধারণ ফান্ড সংগ্রহ' : 'Total Pool Raised'}
            </span>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                backgroundColor: 'rgba(59, 130, 246, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#3b82f6',
              }}
            >
              <TrendingUp size={20} />
            </div>
          </div>
          <div style={{ marginTop: '0.75rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              ৳ {poolStats.totalRandom.toLocaleString(isBn ? 'bn-BD' : 'en-US')}
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>
              {isBn ? 'র‍্যান্ডম তহবিলে দাতাদের প্রদত্ত মোট অনুদান' : 'Cumulative general donations'}
            </span>
          </div>
        </div>

        {/* Card 3: Total Allocated to Students */}
        <div
          style={{
            backgroundColor: 'var(--surface, #ffffff)',
            borderRadius: '16px',
            border: '1px solid var(--color-border)',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              {isBn ? 'মোট শিক্ষার্থী বরাদ্দ' : 'Total Disbursed'}
            </span>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                backgroundColor: 'rgba(168, 85, 247, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#a855f7',
              }}
            >
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div style={{ marginTop: '0.75rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              ৳ {poolStats.totalAllocated.toLocaleString(isBn ? 'bn-BD' : 'en-US')}
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>
              {isBn ? 'সাধারণ তহবিল থেকে প্রদত্ত সাহায্য' : 'Disbursed from pool so far'}
            </span>
          </div>
        </div>

        {/* Card 4: Eligible Campaigns Needing Funds */}
        <div
          style={{
            backgroundColor: 'var(--surface, #ffffff)',
            borderRadius: '16px',
            border: '1px solid var(--color-border)',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              {isBn ? 'বরাদ্দযোগ্য আবেদন' : 'Eligible Campaigns'}
            </span>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f59e0b',
              }}
            >
              <GraduationCap size={20} />
            </div>
          </div>
          <div style={{ marginTop: '0.75rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f59e0b', margin: 0 }}>
              {eligiblePosts.length} {isBn ? 'টি' : ''}
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>
              {isBn ? 'ভেরিফাইড আবেদন যাদের এখনো অর্থ প্রয়োজন' : 'Verified posts waiting for funds'}
            </span>
          </div>
        </div>
      </div>

      {/* Sub-Tabs & Search Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.25rem',
        }}
      >
        <div className={styles.verificationTabs} style={{ margin: 0 }}>
          <button
            type="button"
            className={`${styles.verificationTabBtn} ${activeSubTab === 'eligible' ? styles.verificationTabBtnActive : ''}`}
            onClick={() => setActiveSubTab('eligible')}
          >
            <GraduationCap size={16} />
            <span>{isBn ? 'তহবিল পাওয়ার যোগ্য আবেদন' : 'Eligible Campaigns'}</span>
            <span className={styles.tabBadge}>{eligiblePosts.length}</span>
          </button>

          <button
            type="button"
            className={`${styles.verificationTabBtn} ${activeSubTab === 'history' ? styles.verificationTabBtnActive : ''}`}
            onClick={() => setActiveSubTab('history')}
          >
            <History size={16} />
            <span>{isBn ? 'তহবিল বরাদ্দের খতিয়ান ও ইতিহাস' : 'Disbursement History'}</span>
            <span className={styles.tabBadge}>{allocationsHistory.length}</span>
          </button>
        </div>

        <div style={{ position: 'relative', minWidth: '260px' }}>
          <Search
            size={16}
            color="var(--text-muted)"
            style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              activeSubTab === 'eligible'
                ? isBn
                  ? 'শিক্ষার্থী বা প্রতিষ্ঠানের নাম...'
                  : 'Search student or institute...'
                : isBn
                ? 'শিক্ষার্থী বা বরাদ্দকারী...'
                : 'Search student or admin...'
            }
            style={{
              width: '100%',
              padding: '0.55rem 0.85rem 0.55rem 2.25rem',
              borderRadius: '10px',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--surface, #ffffff)',
              fontSize: '0.85rem',
              color: 'var(--text-main)',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* TAB 1: Eligible Student Campaigns */}
      {activeSubTab === 'eligible' && (
        <div
          className="card"
          style={{
            padding: '1.5rem',
            backgroundColor: 'var(--surface, #ffffff)',
            borderRadius: '16px',
            border: '1px solid var(--color-border)',
          }}
        >
          {loading ? (
            <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '3rem' }}>
              {isBn ? 'যোগ্য আবেদন লোড হচ্ছে...' : 'Loading eligible campaigns...'}
            </p>
          ) : filteredEligible.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
              <ShieldCheck size={48} color="#10b981" style={{ margin: '0 auto 0.75rem', opacity: 0.8 }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--text-main)' }}>
                {isBn ? 'কোনো বরাদ্দযোগ্য অসম্পূর্ণ আবেদন নেই' : 'No eligible campaigns requiring allocation'}
              </h3>
              <p style={{ fontSize: '0.85rem', margin: 0 }}>
                {isBn
                  ? 'বর্তমানে সকল ভেরিফাইড আবেদন সম্পূর্ণ ফান্ডেড অথবা কোনো নতুন আবেদন অপেক্ষমান নেই।'
                  : 'All verified campaigns are either fully funded or there are no active campaigns.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
              {filteredEligible.map((post) => {
                const req = post.totalRequiredAmount;
                const rec = post.receivedAmount;
                const rem = post.remainingAmount;
                const progress = req > 0 ? Math.min(100, Math.round((rec / req) * 100)) : 0;
                const isPoolEmpty = poolStats.randomFundPoolBalance <= 0;

                return (
                  <div
                    key={post.id}
                    style={{
                      border: '1px solid var(--color-border)',
                      borderRadius: '14px',
                      padding: '1.25rem',
                      backgroundColor: 'var(--background-alt, #f8fafc)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                    }}
                  >
                    <div>
                      {/* Top Badges */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.65rem' }}>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '0.2rem 0.6rem',
                            borderRadius: '9999px',
                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                            color: '#10b981',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                          }}
                        >
                          <Building2 size={13} />
                          {post.orgName || (isBn ? 'অনুমোদিত প্রতিষ্ঠান' : 'Institution')}
                        </span>

                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '0.2rem 0.5rem',
                            borderRadius: '6px',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            color: '#2563eb',
                          }}
                        >
                          {post.studentClassDepartment || (isBn ? 'শিক্ষার্থী' : 'Student')}
                        </span>
                      </div>

                      {/* Title & Student Name */}
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.35rem', lineHeight: 1.35 }}>
                        {post.title}
                      </h3>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.85rem' }}>
                        <User size={14} />
                        <strong>{post.studentFullName}</strong>
                      </div>

                      {/* Progress Bar & Amounts */}
                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                          <span style={{ color: '#10b981' }}>
                            {isBn ? `সংগৃহীত: ৳${rec.toLocaleString('bn-BD')}` : `Raised: ৳${rec.toLocaleString()}`}
                          </span>
                          <span style={{ color: 'var(--text-muted)' }}>
                            {isBn ? `লক্ষ্য: ৳${req.toLocaleString('bn-BD')}` : `Goal: ৳${req.toLocaleString()}`}
                          </span>
                        </div>
                        <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--color-border)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${progress}%`, height: '100%', backgroundColor: '#10b981', borderRadius: '4px' }} />
                        </div>
                      </div>

                      {/* Remaining Highlight Box */}
                      <div
                        style={{
                          backgroundColor: 'rgba(239, 68, 68, 0.08)',
                          border: '1px dashed rgba(239, 68, 68, 0.35)',
                          borderRadius: '10px',
                          padding: '0.65rem 0.85rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '1rem',
                        }}
                      >
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#dc2626' }}>
                          {isBn ? 'বাকি প্রয়োজন:' : 'Still Needed:'}
                        </span>
                        <strong style={{ fontSize: '1.1rem', color: '#dc2626' }}>
                          ৳ {rem.toLocaleString(isBn ? 'bn-BD' : 'en-US')}
                        </strong>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '0.65rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.85rem' }}>
                      <Link
                        href={`/posts/${post.id}` as any}
                        target="_blank"
                        className="btn"
                        style={{
                          padding: '0.55rem 0.75rem',
                          borderRadius: '8px',
                          border: '1px solid var(--color-border)',
                          backgroundColor: 'var(--surface)',
                          color: 'var(--text-main)',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        <ExternalLink size={14} />
                        <span>{isBn ? 'পোস্ট' : 'Post'}</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => openAllocateModal(post)}
                        disabled={!canEdit || isPoolEmpty}
                        style={{
                          flex: 1,
                          padding: '0.6rem 1rem',
                          borderRadius: '8px',
                          border: 'none',
                          backgroundColor: isPoolEmpty || !canEdit ? 'var(--color-border)' : '#10b981',
                          color: '#ffffff',
                          fontSize: '0.85rem',
                          fontWeight: 800,
                          cursor: isPoolEmpty || !canEdit ? 'not-allowed' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.45rem',
                          boxShadow: isPoolEmpty || !canEdit ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.35)',
                          transition: 'all 0.2s',
                        }}
                        title={
                          !canEdit
                            ? isBn
                              ? 'আপনার বরাদ্দ করার পারমিশন নেই'
                              : 'No allocation permission'
                            : isPoolEmpty
                            ? isBn
                              ? 'সাধারণ তহবিলে ব্যালেন্স নেই'
                              : 'General pool is empty'
                            : ''
                        }
                      >
                        <Coins size={16} />
                        <span>{isBn ? 'তহবিল বরাদ্দ করুন' : 'Allocate Fund'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Disbursement History */}
      {activeSubTab === 'history' && (
        <div
          className="card"
          style={{
            padding: '1.5rem',
            backgroundColor: 'var(--surface, #ffffff)',
            borderRadius: '16px',
            border: '1px solid var(--color-border)',
          }}
        >
          {loading ? (
            <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '3rem' }}>
              {isBn ? 'ইতিহাস লোড হচ্ছে...' : 'Loading history...'}
            </p>
          ) : filteredHistory.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '3rem' }}>
              {isBn ? 'কোনো ফান্ড বরাদ্দের রেকর্ড পাওয়া যায়নি।' : 'No fund allocation records found.'}
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className={styles.table} style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                    <th style={{ padding: '0.85rem 0.75rem' }}>{isBn ? 'তারিখ ও সময়' : 'Date & Time'}</th>
                    <th style={{ padding: '0.85rem 0.75rem' }}>{isBn ? 'শিক্ষার্থী ও আবেদন' : 'Student & Campaign'}</th>
                    <th style={{ padding: '0.85rem 0.75rem' }}>{isBn ? 'প্রতিষ্ঠান' : 'Institution'}</th>
                    <th style={{ padding: '0.85rem 0.75rem' }}>{isBn ? 'বরাদ্দকারী' : 'Allocated By'}</th>
                    <th style={{ padding: '0.85rem 0.75rem' }}>{isBn ? 'মন্তব্য / নোট' : 'Remarks / Note'}</th>
                    <th style={{ padding: '0.85rem 0.75rem', textAlign: 'right' }}>{isBn ? 'বরাদ্দের পরিমাণ' : 'Amount'}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '1rem 0.75rem', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>
                          {new Date(item.createdAt).toLocaleDateString(isBn ? 'bn-BD' : 'en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {new Date(item.createdAt).toLocaleTimeString(isBn ? 'bn-BD' : 'en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>

                      <td style={{ padding: '1rem 0.75rem' }}>
                        <strong style={{ fontSize: '0.92rem', color: 'var(--text-main)', display: 'block' }}>
                          {item.studentName}
                        </strong>
                        <Link
                          href={`/posts/${item.studentPostId}` as any}
                          target="_blank"
                          style={{
                            fontSize: '0.8rem',
                            color: '#2563eb',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            marginTop: '0.2rem',
                          }}
                        >
                          <span>{item.postTitle}</span>
                          <ExternalLink size={12} />
                        </Link>
                      </td>

                      <td style={{ padding: '1rem 0.75rem', fontSize: '0.85rem' }}>
                        {item.orgName || (isBn ? 'স্বতন্ত্র / অপ্রকাশিত' : 'N/A')}
                      </td>

                      <td style={{ padding: '1rem 0.75rem', fontSize: '0.85rem' }}>
                        <span
                          style={{
                            padding: '0.2rem 0.55rem',
                            borderRadius: '6px',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            color: '#2563eb',
                            fontWeight: 700,
                            fontSize: '0.78rem',
                          }}
                        >
                          {item.allocatedByAdminName || (isBn ? 'কর্তৃপক্ষ' : 'Admin')}
                        </span>
                      </td>

                      <td style={{ padding: '1rem 0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {item.notes || '—'}
                      </td>

                      <td style={{ padding: '1rem 0.75rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <strong style={{ fontSize: '1.1rem', color: '#10b981', fontWeight: 800 }}>
                          ৳ {item.amount.toLocaleString(isBn ? 'bn-BD' : 'en-US')}
                        </strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Allocation Execution Modal */}
      {isModalOpen && selectedPost && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => !submitting && setIsModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: 'var(--surface, #ffffff)',
              borderRadius: '20px',
              border: '1px solid var(--color-border)',
              width: '100%',
              maxWidth: '520px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              overflow: 'hidden',
              animation: 'modalSlideUp 0.25s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'var(--background-alt, #f8fafc)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
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
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                    {isBn ? 'তহবিল বরাদ্দ নিশ্চিতকরণ' : 'Confirm Fund Allocation'}
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {isBn ? 'সাধারণ শিক্ষা তহবিল থেকে বণ্টন' : 'Disburse from General Random Fund'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => !submitting && setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleConfirmAllocation} style={{ padding: '1.5rem' }}>
              {modalError && (
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid #ef4444',
                    borderRadius: '8px',
                    color: '#dc2626',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <AlertCircle size={18} />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Student Summary Card */}
              <div
                style={{
                  backgroundColor: 'var(--background-alt, #f8fafc)',
                  borderRadius: '12px',
                  padding: '1rem',
                  border: '1px solid var(--color-border)',
                  marginBottom: '1.25rem',
                }}
              >
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                  {isBn ? 'আবেদনকারী শিক্ষার্থী:' : 'Student Beneficiary:'}
                </div>
                <strong style={{ fontSize: '1rem', color: 'var(--text-main)', display: 'block' }}>
                  {selectedPost.studentFullName} ({selectedPost.orgName || (isBn ? 'মাদ্রাসা/প্রতিষ্ঠান' : 'Institute')})
                </strong>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  {selectedPost.title}
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.75rem',
                    marginTop: '0.85rem',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid var(--color-border)',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                      {isBn ? 'শিক্ষার্থীর বাকি প্রয়োজন' : 'Remaining Needed'}
                    </span>
                    <strong style={{ fontSize: '1.05rem', color: '#dc2626' }}>
                      ৳ {selectedPost.remainingAmount.toLocaleString(isBn ? 'bn-BD' : 'en-US')}
                    </strong>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                      {isBn ? 'তহবিলের বর্তমান স্থিতি' : 'Pool Balance'}
                    </span>
                    <strong style={{ fontSize: '1.05rem', color: '#10b981' }}>
                      ৳ {poolStats.randomFundPoolBalance.toLocaleString(isBn ? 'bn-BD' : 'en-US')}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Allocation Amount Input */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
                  {isBn ? 'বরাদ্দের পরিমাণ (টাকা):' : 'Allocation Amount (BDT):'}
                </label>
                <div style={{ position: 'relative' }}>
                  <span
                    style={{
                      position: 'absolute',
                      left: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '1.1rem',
                      fontWeight: 800,
                      color: 'var(--text-muted)',
                    }}
                  >
                    ৳
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    max={Math.min(poolStats.randomFundPoolBalance, selectedPost.remainingAmount)}
                    required
                    value={allocationAmount}
                    onChange={(e) => setAllocationAmount(e.target.value)}
                    placeholder="0.00"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem 0.75rem 2.25rem',
                      borderRadius: '10px',
                      border: '2px solid #10b981',
                      fontSize: '1.15rem',
                      fontWeight: 800,
                      color: 'var(--text-main)',
                      backgroundColor: 'var(--surface, #ffffff)',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Quick Presets */}
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.65rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      const full = Math.min(poolStats.randomFundPoolBalance, selectedPost.remainingAmount);
                      setAllocationAmount(String(full));
                    }}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      backgroundColor: 'rgba(16, 185, 129, 0.12)',
                      color: '#047857',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      cursor: 'pointer',
                    }}
                  >
                    {isBn ? 'সম্পূর্ণ বাকি টাকা' : 'Full Remaining'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const half = Math.min(
                        poolStats.randomFundPoolBalance,
                        Math.round(selectedPost.remainingAmount / 2)
                      );
                      setAllocationAmount(String(half));
                    }}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      color: '#2563eb',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      cursor: 'pointer',
                    }}
                  >
                    50%
                  </button>

                  {[1000, 2000, 5000, 10000].map((amt) => {
                    if (amt > selectedPost.remainingAmount || amt > poolStats.randomFundPoolBalance) return null;
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setAllocationAmount(String(amt))}
                        style={{
                          padding: '0.35rem 0.65rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          backgroundColor: 'var(--surface)',
                          color: 'var(--text-main)',
                          border: '1px solid var(--color-border)',
                          cursor: 'pointer',
                        }}
                      >
                        ৳{amt.toLocaleString()}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notes Input */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-main)' }}>
                  {isBn ? 'বরাদ্দের উদ্দেশ্য / নোট (ঐচ্ছিক):' : 'Allocation Purpose / Remarks (Optional):'}
                </label>
                <textarea
                  rows={2}
                  value={allocationNotes}
                  onChange={(e) => setAllocationNotes(e.target.value)}
                  placeholder={
                    isBn
                      ? 'উদা: সাধারণ শিক্ষা তহবিল থেকে জরুরি টিউশন ফি বাবদ এককালীন বরাদ্দ'
                      : 'e.g. Special grant for tuition fees from general education fund'
                  }
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    borderRadius: '10px',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.85rem',
                    color: 'var(--text-main)',
                    backgroundColor: 'var(--surface, #ffffff)',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                  style={{
                    padding: '0.65rem 1.25rem',
                    borderRadius: '10px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'transparent',
                    color: 'var(--text-muted)',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '0.65rem 1.75rem',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: '#10b981',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                  }}
                >
                  {submitting ? (
                    <>
                      <div className="spinner" style={{ width: 16, height: 16, border: '2px solid #ffffff', borderTopColor: 'transparent', borderRadius: '50%' }} />
                      <span>{isBn ? 'বরাদ্দ হচ্ছে...' : 'Allocating...'}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} />
                      <span>{isBn ? 'বরাদ্দ নিশ্চিত করুন' : 'Confirm Allocation'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
