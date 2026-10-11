'use client';

import React, { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { Link, useRouter } from '../../../i18n/routing';
import {
  Heart,
  ShieldCheck,
  DollarSign,
  FileText,
  ExternalLink,
  Package,
  PlusCircle,
  User,
} from 'lucide-react';
import { useAuthStore, getRoleDashboardPath } from '../../../lib/auth-store';
import PortalLayout, { PortalNavItem } from '../../../components/layout/PortalLayout';
import { getApiUrl } from '../../../lib/api-config';
import { getAuthToken } from '../../../lib/auth-token';
import MyDonationsSection from '../../../components/portal/MyDonationsSection';
import ItemDonationModal from '../../../components/portal/ItemDonationModal';
import FinancialDonationModal from '../../../components/portal/FinancialDonationModal';
import StudentDetailsModal from '../../../components/portal/StudentDetailsModal';
import styles from './donor.module.css';

export default function DonorDashboardPage() {
  const locale = useLocale();
  const isBn = locale === 'bn';
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const loadingAuth = useAuthStore((s) => s.loading);

  const [activeNav, setActiveNav] = useState<'overview' | 'history' | 'my-donations' | 'all_posts' | 'impact'>('overview');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const tabParam = new URLSearchParams(window.location.search).get('tab');
      if (tabParam === 'my-donations' || tabParam === 'history' || tabParam === 'all_posts' || tabParam === 'impact') {
        setActiveNav(tabParam as any);
      }
    }
  }, []);
  const [donations, setDonations] = useState<any[]>([]);
  const [publicPosts, setPublicPosts] = useState<any[]>([]);
  const [postSearchTerm, setPostSearchTerm] = useState('');
  const [loadingData, setLoadingData] = useState(true);

  // Modals state
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isFinancialModalOpen, setIsFinancialModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Role Protection Guard
  useEffect(() => {
    if (!loadingAuth) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'donor') {
        router.replace(getRoleDashboardPath(user.role) as any);
      }
    }
  }, [user, loadingAuth, router]);

  useEffect(() => {
    if (!user || user.role !== 'donor') return;

    getAuthToken()
      .then((token: string | null) => {
        if (!token) throw new Error('No auth token');
        const apiUrl = getApiUrl();
        return fetch(`${apiUrl}/donations/my-history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      })
      .then((res: any) => {
        if (!res.ok) throw new Error('Failed to load donations');
        return res.json();
      })
      .then((data: any) => {
        if (Array.isArray(data)) {
          const mapped = data.map((d: any) => ({
            id: d.id,
            trxId: d.trxId || d.transactionReference || 'N/A',
            date: new Date(d.createdAt).toLocaleDateString(
              isBn ? 'bn-BD' : 'en-US',
              { year: 'numeric', month: 'short', day: 'numeric' }
            ),
            time: new Date(d.createdAt).toLocaleTimeString(
              isBn ? 'bn-BD' : 'en-US',
              { hour: '2-digit', minute: '2-digit' }
            ),
            target: d.isRandom
              ? isBn
                ? 'সাধারণ শিক্ষা তহবিল (General Pool)'
                : 'General Fund Pool'
              : d.postTitle || (isBn ? 'শিক্ষা সহায়তা অনুদান' : 'Education Grant'),
            amount: isBn
              ? `৳${Number(d.amount).toLocaleString('bn-BD')}`
              : `৳${Number(d.amount).toLocaleString('en-US')}`,
            rawAmount: Number(d.amount),
            paymentMethod: d.paymentMethod?.toUpperCase() || 'BKASH',
            senderPhone: d.senderPhone || 'N/A',
            status:
              d.status === 'accepted'
                ? isBn
                  ? 'অনুমোদিত ও গ্রহণকৃত'
                  : 'Verified & Accepted'
                : d.status === 'pending'
                ? isBn
                  ? 'যাচাই প্রক্রিয়াধীন'
                  : 'Under Verification'
                : isBn
                ? 'বাতিলকৃত'
                : 'Declined',
            rawStatus: d.status,
            isRandom: d.isRandom,
            studentUserId: d.studentUserId,
            postId: d.postId,
          }));
          setDonations(mapped);
        }
      })
      .catch((err: any) => console.error('Failed to load donor history:', err))
      .finally(() => setLoadingData(false));
  }, [firebaseUser, user, isBn]);

  const totalDonatedAmount = donations.reduce(
    (sum, d) => sum + (d.rawStatus === 'accepted' ? d.rawAmount : 0),
    0
  );
  const studentsHelpedCount = donations.filter(
    (d) => !d.isRandom && d.rawStatus === 'accepted'
  ).length;

  useEffect(() => {
    const apiUrl = getApiUrl();
    fetch(`${apiUrl}/posts/public`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setPublicPosts(data);
      })
      .catch((err) => console.error('Failed to load public posts:', err));
  }, []);

  if (loadingAuth || !user || user.role !== 'donor') {
    return (
      <div className="container" style={{ padding: '6rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        {isBn ? 'লোড হচ্ছে...' : 'Loading...'}
      </div>
    );
  }

  const navItems: PortalNavItem[] = [
    {
      id: 'overview',
      labelBn: 'ওভারভিউ',
      labelEn: 'Overview',
      icon: DollarSign,
    },
    {
      id: 'all_posts',
      labelBn: 'শিক্ষার্থীদের পোস্ট তালিকা',
      labelEn: 'Student Posts List',
      icon: FileText,
      badge: publicPosts.length,
    },
    {
      id: 'my-donations',
      labelBn: 'আমার দান সমূহ',
      labelEn: 'My Donations',
      icon: Heart,
      badge: donations.length,
    },
    {
      id: 'impact',
      labelBn: 'শিক্ষার্থী ইম্প্যাক্ট',
      labelEn: 'Beneficiary Impact',
      icon: ShieldCheck,
      badge: studentsHelpedCount,
    },
  ];

  return (
    <PortalLayout
      role="donor"
      roleNameBn="দাতা পোর্টাল"
      roleNameEn="Donor Portal"
      roleIcon={Heart}
      navItems={navItems}
      activeNav={activeNav}
      onNavSelect={(id: any) => setActiveNav(id)}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* VIEW 1: OVERVIEW */}
        {activeNav === 'overview' && (
          <div>
            {/* Top Action Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                marginBottom: '1.5rem',
              }}
            >
              <div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  {isBn ? `স্বাগতম, ${user.fullName}` : `Welcome, ${user.fullName}`}
                </h1>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
                  {isBn
                    ? 'আপনার প্রতিটি দানের মাধ্যমে সুবিধাবঞ্চিত শিক্ষার্থীদের শিক্ষাজীবন আলোকিত হচ্ছে'
                    : 'Your valuable contributions are helping underprivileged students build a brighter future'}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setIsItemModalOpen(true)}
                  className="btn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.65rem',
                    padding: '0.95rem 1.75rem',
                    fontSize: '1.05rem',
                    fontWeight: '800',
                    borderRadius: 'var(--radius-lg, 16px)',
                    backgroundColor: '#f59e0b',
                    color: '#ffffff',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 6px 20px -3px rgba(245, 158, 11, 0.45)',
                    transition: 'all 0.2s ease',
                    flex: '1 1 auto',
                  }}
                >
                  <Package size={22} />
                  <span>{isBn ? 'অর্থ ছাড়া পণ্য দান করুন' : 'Donate Physical Goods'}</span>
                </button>

                <button
                  onClick={() => setIsFinancialModalOpen(true)}
                  className="btn btn-primary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.65rem',
                    padding: '0.95rem 1.85rem',
                    fontSize: '1.05rem',
                    fontWeight: '800',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: '#10b981',
                    color: '#ffffff',
                    borderRadius: 'var(--radius-lg, 16px)',
                    boxShadow: '0 6px 20px -3px rgba(16, 185, 129, 0.45)',
                    transition: 'all 0.2s ease',
                    flex: '1 1 auto',
                  }}
                >
                  <PlusCircle size={22} />
                  <span>{isBn ? 'নতুন আর্থিক অনুদান' : 'Make Financial Donation'}</span>
                </button>
              </div>
            </div>

            {/* Stats Cards (Responsive: Desktop text top & amount right-centered; Mobile text left & amount right-centered) */}
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statTextCol}>
                  <span className={styles.statLabel}>
                    {isBn ? 'মোট অনুদান প্রদান' : 'Total Contributions'}
                  </span>
                </div>
                <div className={styles.statAmountCol}>
                  <h3 className={styles.statAmount}>
                    ৳{totalDonatedAmount.toLocaleString()}
                  </h3>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statTextCol}>
                  <span className={styles.statLabel}>
                    {isBn ? 'সহায়তাপ্রাপ্ত শিক্ষার্থী' : 'Students Directly Aided'}
                  </span>
                </div>
                <div className={styles.statAmountCol}>
                  <h3 className={styles.statAmount}>
                    {studentsHelpedCount} {isBn ? 'জন' : ''}
                  </h3>
                </div>
              </div>
            </div>

            {/* Quick Recent Donations */}
            <div
              style={{
                backgroundColor: 'var(--surface)',
                borderRadius: 'var(--radius-xl, 24px)',
                border: '1px solid var(--surface-border)',
                padding: '1.75rem',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Heart size={20} color="#10b981" />
                  {isBn ? 'সাম্প্রতিক অনুদানসমূহ' : 'Recent Donations'}
                </h3>
                <button
                  onClick={() => setActiveNav('history')}
                  style={{ background: 'none', border: 'none', color: '#10b981', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  {isBn ? `সব দেখুন (${donations.length}) →` : `View All (${donations.length}) →`}
                </button>
              </div>

              {loadingData ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  {isBn ? 'লোড হচ্ছে...' : 'Loading...'}
                </div>
              ) : donations.length === 0 ? (
                <div style={{ padding: '2.5rem', textAlign: 'center', backgroundColor: 'var(--background-alt, #0f172a)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)' }}>
                  <p style={{ margin: 0 }}>{isBn ? 'কোনো পূর্ববর্তী অনুদান পাওয়া যায়নি।' : 'No previous donations found.'}</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {donations.slice(0, 3).map((d) => (
                    <div
                      key={d.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '1rem 1.25rem',
                        backgroundColor: 'var(--background-alt, #0f172a)',
                        borderRadius: 'var(--radius-md, 12px)',
                        border: '1px solid var(--surface-border)',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                      }}
                    >
                      <div>
                        <strong style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>{d.target}</strong>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          {d.date} • {d.paymentMethod}
                        </div>
                        {d.studentUserId && (
                          <button
                            type="button"
                            onClick={() => setSelectedStudentId(d.studentUserId)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#10b981',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              padding: 0,
                              marginTop: '0.25rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                            }}
                          >
                            <User size={13} />
                            <span>{isBn ? 'শিক্ষার্থীর বিবরণ দেখুন →' : 'View Student Details →'}</span>
                          </button>
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#10b981' }}>{d.amount}</span>
                        <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>{d.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW: ALL STUDENT POSTS (Integrated directly in Portal Drawer) */}
        {activeNav === 'all_posts' && (
          <div>
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={24} color="#38bdf8" />
                  {isBn ? 'শিক্ষার্থীদের পোস্ট তালিকা' : 'Student Assistance Posts'}
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0.25rem 0 0' }}>
                  {isBn
                    ? 'ভেরিফাইড ও শিক্ষক-অনুমোদিত শিক্ষার্থীদের পোস্ট থেকে সরাসরি সহায়তা করুন'
                    : 'Directly support verified and institution-approved student assistance campaigns'}
                </p>
              </div>

              <div style={{ position: 'relative', minWidth: '260px' }}>
                <input
                  type="text"
                  placeholder={isBn ? 'শিক্ষার্থী বা প্রতিষ্ঠানের নাম দিয়ে খুঁজুন...' : 'Search student or institute...'}
                  value={postSearchTerm}
                  onChange={(e) => setPostSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 1rem 0.65rem 2.4rem',
                    borderRadius: 'var(--radius-md, 12px)',
                    border: '1px solid var(--surface-border, #cbd5e1)',
                    backgroundColor: 'var(--surface, #ffffff)',
                    color: 'var(--text-main)',
                    fontSize: '0.88rem',
                  }}
                />
                <FileText
                  size={16}
                  style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                />
              </div>
            </div>

            {publicPosts.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-xl)', color: 'var(--text-muted)' }}>
                {isBn ? 'বর্তমানে কোনো পোস্ট উপলব্ধ নেই।' : 'No public student posts available at the moment.'}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                {publicPosts
                  .filter((p) => {
                    if (!postSearchTerm.trim()) return true;
                    const q = postSearchTerm.toLowerCase();
                    return (
                      p.title?.toLowerCase().includes(q) ||
                      p.studentName?.toLowerCase().includes(q) ||
                      p.orgName?.toLowerCase().includes(q)
                    );
                  })
                  .map((post) => {
                    const req = Number(post.totalRequiredAmount || 0);
                    const rec = Number(post.receivedAmount || 0);
                    const rem = Math.max(0, req - rec);
                    const progress = req > 0 ? Math.min(100, Math.round((rec / req) * 100)) : 0;

                    return (
                      <div
                        key={post.id}
                        style={{
                          backgroundColor: 'var(--surface)',
                          borderRadius: 'var(--radius-xl, 20px)',
                          border: '1px solid var(--surface-border)',
                          padding: '1.25rem',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          boxShadow: 'var(--shadow-card)',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.75rem' }}>
                            <span
                              style={{
                                padding: '0.2rem 0.6rem',
                                borderRadius: '20px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                                color: '#10b981',
                              }}
                            >
                              {post.orgName || (isBn ? 'অনুমোদিত প্রতিষ্ঠান' : 'Approved Institution')}
                            </span>
                            {post.isDoubleVerified && (
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                <ShieldCheck size={14} /> {isBn ? 'ভেরিফাইড' : 'Verified'}
                              </span>
                            )}
                          </div>

                          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.4rem', lineHeight: 1.35 }}>
                            {post.title}
                          </h3>

                          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {post.problemDescription}
                          </p>

                          {/* Progress Bar */}
                          <div style={{ marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                              <span>{isBn ? `সংগৃহীত: ৳${rec.toLocaleString()}` : `Raised: ৳${rec}`}</span>
                              <span>{isBn ? `লক্ষ্য: ৳${req.toLocaleString()}` : `Goal: ৳${req}`}</span>
                            </div>
                            <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--background-alt, #e2e8f0)', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ width: `${progress}%`, height: '100%', backgroundColor: '#10b981', borderRadius: '4px', transition: 'width 0.3s' }} />
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--surface-border)' }}>
                          {post.studentUserId && (
                            <button
                              onClick={() => setSelectedStudentId(post.studentUserId)}
                              style={{
                                flex: 1,
                                padding: '0.5rem',
                                borderRadius: 'var(--radius-md, 10px)',
                                border: '1px solid var(--surface-border)',
                                backgroundColor: 'transparent',
                                color: 'var(--text-main)',
                                fontWeight: 700,
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                              }}
                            >
                              {isBn ? 'প্রোফাইল' : 'Profile'}
                            </button>
                          )}
                          <button
                            onClick={() => setIsFinancialModalOpen(true)}
                            style={{
                              flex: 2,
                              padding: '0.5rem',
                              borderRadius: 'var(--radius-md, 10px)',
                              border: 'none',
                              backgroundColor: '#10b981',
                              color: '#ffffff',
                              fontWeight: 700,
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                            }}
                          >
                            {isBn ? 'সহায়তা করুন' : 'Donate'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: DONATION HISTORY TABLE (Uses Reusable MyDonationsSection) */}
        {(activeNav === 'my-donations' || activeNav === 'history') && <MyDonationsSection />}

        {/* VIEW 3: BENEFICIARY IMPACT */}
        {activeNav === 'impact' && (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={24} color="#10b981" />
                {isBn ? 'শিক্ষার্থী ইম্প্যাক্ট ও স্বচ্ছতা সনদ' : 'Beneficiary Impact & Transparency'}
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0.25rem 0 0' }}>
                {isBn
                  ? 'আপনার সাদাকাহ্‌ সুবিধাবঞ্চিক শিক্ষার্থীদের জীবনে যে পরিবর্তন এনেছে তার বিবরণ।'
                  : 'Track how your generous support creates lasting educational opportunities.'}
              </p>
            </div>

            <div
              style={{
                backgroundColor: 'var(--surface)',
                borderRadius: 'var(--radius-xl, 24px)',
                border: '1px solid var(--surface-border)',
                padding: '2rem',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1rem' }}>
                {isBn ? 'স্বচ্ছতার শতভাগ নিশ্চয়তা' : '100% Transparency Commitment'}
              </h3>
              <p style={{ color: 'var(--text-body)', lineHeight: 1.7, fontSize: '0.95rem' }}>
                {isBn
                  ? 'সাদাকাহ বিডি-তে প্রতিটি অনুদান কঠোরভাবে অডিট করা হয়। আপনার প্রদত্ত অর্থ অনুমোদিত শিক্ষা প্রতিষ্ঠানের প্রধান ও ভেরিফাইড শিক্ষকদের উপস্থিতিতে সরাসরি শিক্ষার্থীদের টিউশন ফি, বইপত্র ও মেসে বিতরণ করা হয়।'
                  : 'At SadaqahBD, every donation is strictly audited. Your funds are disbursed directly for tuition and educational supplies in cooperation with verified institute heads.'}
              </p>

              <div style={{ marginTop: '1.5rem' }}>
                <Link
                  href="/ledger"
                  className="btn btn-outline"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none', fontWeight: 700 }}
                >
                  <ExternalLink size={16} /> {isBn ? 'পাবলিক লেজার ও হিসাব বই দেখুন' : 'View Public Ledger'}
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Item Donation Modal */}
      <ItemDonationModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
      />

      {/* Financial Donation Modal */}
      <FinancialDonationModal
        isOpen={isFinancialModalOpen}
        onClose={() => setIsFinancialModalOpen(false)}
      />

      {/* Student Details Modal */}
      <StudentDetailsModal
        isOpen={!!selectedStudentId}
        onClose={() => setSelectedStudentId(null)}
        studentId={selectedStudentId}
        isBn={isBn}
      />
    </PortalLayout>
  );
}
