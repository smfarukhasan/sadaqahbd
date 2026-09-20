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
} from 'lucide-react';
import { useAuthStore, getRoleDashboardPath } from '../../../lib/auth-store';
import PortalLayout, { PortalNavItem } from '../../../components/layout/PortalLayout';
import { getApiUrl } from '../../../lib/api-config';
import EReceiptModal, { ReceiptData } from '../../../components/portal/EReceiptModal';

export default function DonorDashboardPage() {
  const locale = useLocale();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const loadingAuth = useAuthStore((s) => s.loading);

  const [activeNav, setActiveNav] = useState<'overview' | 'history' | 'impact'>('overview');
  const [donations, setDonations] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);

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
    if (!firebaseUser || !user || user.role !== 'donor') return;

    firebaseUser
      .getIdToken()
      .then((token: string) => {
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
            trxId: d.trxId,
            date: new Date(d.createdAt).toLocaleDateString(
              locale === 'bn' ? 'bn-BD' : 'en-US',
              {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              }
            ),
            time: new Date(d.createdAt).toLocaleTimeString(
              locale === 'bn' ? 'bn-BD' : 'en-US',
              {
                hour: '2-digit',
                minute: '2-digit',
              }
            ),
            target: d.isRandom
              ? locale === 'bn'
                ? 'সাধারণ তহবিল (General Pool)'
                : 'General Fund Pool'
              : d.postTitle || (locale === 'bn' ? 'শিক্ষা সহায়তা অনুদান' : 'Education Grant'),
            amount:
              locale === 'bn'
                ? `৳${Number(d.amount).toLocaleString('bn-BD')}`
                : `৳${Number(d.amount).toLocaleString('en-US')}`,
            rawAmount: Number(d.amount),
            paymentMethod: d.paymentMethod?.toUpperCase() || 'BKASH',
            senderPhone: d.senderPhone || 'N/A',
            status:
              d.status === 'accepted'
                ? locale === 'bn'
                  ? 'সফল ও অনুমোদিত'
                  : 'Verified & Accepted'
                : d.status === 'pending'
                ? locale === 'bn'
                  ? 'যাচাই প্রক্রিয়াধীন'
                  : 'Under Verification'
                : locale === 'bn'
                ? 'বাতিলকৃত'
                : 'Cancelled',
            rawStatus: d.status,
            isRandom: d.isRandom,
            receiptNo: `REC-${d.id.slice(0, 8).toUpperCase()}`,
          }));
          setDonations(mapped);
        }
      })
      .catch((err: any) => console.error('Failed to load donor history:', err))
      .finally(() => setLoadingData(false));
  }, [firebaseUser, user, locale]);

  const totalDonatedAmount = donations.reduce(
    (sum, d) => sum + (d.rawStatus === 'accepted' ? d.rawAmount : 0),
    0
  );
  const studentsHelpedCount = donations.filter(
    (d) => !d.isRandom && d.rawStatus === 'accepted'
  ).length;

  if (loadingAuth || !user || user.role !== 'donor') {
    return (
      <div className="container" style={{ padding: '6rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        {locale === 'bn' ? 'লোড হচ্ছে...' : 'Loading...'}
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
      id: 'history',
      labelBn: 'অনুদান ইতিহাস',
      labelEn: 'Donation History',
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
                  {locale === 'bn' ? `স্বাগতম, ${user.fullName}` : `Welcome, ${user.fullName}`}
                </h1>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
                  {locale === 'bn'
                    ? 'আপনার প্রতিটি দানের মাধ্যমে সুবিধাবঞ্চিত শিক্ষার্থীদের শিক্ষাজীবন আলোকিত হচ্ছে'
                    : 'Your valuable contributions are helping underprivileged students build a brighter future'}
                </p>
              </div>

              <Link
                href="/donate"
                className="btn btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.65rem 1.35rem',
                  fontWeight: '700',
                  textDecoration: 'none',
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  boxShadow: '0 4px 12px -2px rgba(5, 150, 105, 0.4)',
                }}
              >
                <DollarSign size={18} />
                <span>{locale === 'bn' ? 'নতুন অনুদান প্রদান করুন' : 'Make a Donation'}</span>
              </Link>
            </div>

            {/* Stats Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1.25rem',
                marginBottom: '2rem',
              }}
            >
              <div
                style={{
                  padding: '1.5rem',
                  backgroundColor: '#ffffff',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--surface-border, #e2e8f0)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                }}
              >
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700' }}>
                  {locale === 'bn' ? 'মোট অনুদান প্রদান' : 'Total Contributions'}
                </span>
                <h3 style={{ fontSize: '1.85rem', fontWeight: '800', color: '#059669', margin: '0.35rem 0 0' }}>
                  ৳{totalDonatedAmount.toLocaleString()}
                </h3>
              </div>

              <div
                style={{
                  padding: '1.5rem',
                  backgroundColor: '#ffffff',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--surface-border, #e2e8f0)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                }}
              >
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700' }}>
                  {locale === 'bn' ? 'সহায়তাপ্রাপ্ত শিক্ষার্থী' : 'Students Directly Aided'}
                </span>
                <h3 style={{ fontSize: '1.85rem', fontWeight: '800', color: '#047857', margin: '0.35rem 0 0' }}>
                  {studentsHelpedCount} {locale === 'bn' ? 'জন' : ''}
                </h3>
              </div>

              <div
                style={{
                  padding: '1.5rem',
                  backgroundColor: '#ffffff',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--surface-border, #e2e8f0)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                }}
              >
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700' }}>
                  {locale === 'bn' ? 'স্বচ্ছতা সনদ' : 'Transparency Status'}
                </span>
                <h3 style={{ fontSize: '1.85rem', fontWeight: '800', color: '#0d9488', margin: '0.35rem 0 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={26} /> {locale === 'bn' ? '১০০% অডিটভুক্ত' : '100% Audited'}
                </h3>
              </div>
            </div>

            {/* Quick Recent Donations */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--surface-border, #e2e8f0)',
                padding: '1.75rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Heart size={20} color="#059669" />
                  {locale === 'bn' ? 'সাম্প্রতিক অনুদানসমূহ' : 'Recent Donations'}
                </h3>
                <button
                  onClick={() => setActiveNav('history')}
                  style={{ background: 'none', border: 'none', color: '#059669', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  {locale === 'bn' ? `সব দেখুন (${donations.length}) →` : `View All (${donations.length}) →`}
                </button>
              </div>

              {loadingData ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>লোড হচ্ছে...</div>
              ) : donations.length === 0 ? (
                <div style={{ padding: '2.5rem', textAlign: 'center', backgroundColor: 'var(--background, #f8fafc)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)' }}>
                  <p style={{ margin: 0 }}>কোনো পূর্ববর্তী অনুদান পাওয়া যায়নি।</p>
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
                        backgroundColor: 'var(--background, #f8fafc)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--surface-border, #e2e8f0)',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                      }}
                    >
                      <div>
                        <strong style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>{d.target}</strong>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          {d.date} • {d.method}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#059669' }}>{d.amount}</span>
                        <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700 }}>{d.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: DONATION HISTORY TABLE */}
        {activeNav === 'history' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Heart size={24} color="#059669" />
                  {locale === 'bn' ? 'আমার অনুদানের হিসাব খতিয়ান' : 'Personal Donation Ledger'}
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0.25rem 0 0' }}>
                  {locale === 'bn'
                    ? 'আপনার প্রতিটি দানের স্বচ্ছ হিসাব ও ট্যাক্স-অডিট উপযোগী অফিসিয়াল ই-রশিদ।'
                    : 'Complete records of your contributions and verified tax-deductible e-receipts.'}
                </p>
              </div>

              <Link
                href="/posts"
                className="btn btn-outline"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1.15rem', fontWeight: '700', textDecoration: 'none' }}
              >
                <ExternalLink size={16} /> {locale === 'bn' ? 'সহায়তা প্রত্যাশী শিক্ষার্থীদের দেখুন' : 'Browse Students'}
              </Link>
            </div>

            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--surface-border, #e2e8f0)',
                padding: '2rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              {loadingData ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  {locale === 'bn' ? 'লোড হচ্ছে...' : 'Loading...'}
                </div>
              ) : donations.length === 0 ? (
                <div
                  style={{
                    padding: '3.5rem 1.5rem',
                    textAlign: 'center',
                    backgroundColor: 'var(--background, #f8fafc)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--surface-border, #e2e8f0)',
                  }}
                >
                  <Heart size={40} color="#059669" style={{ margin: '0 auto 0.75rem' }} />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
                    {locale === 'bn' ? 'কোনো পূর্ববর্তী অনুদান নেই' : 'No Previous Donations Found'}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.35rem auto 1.25rem', maxWidth: '400px' }}>
                    {locale === 'bn'
                      ? 'আপনি এখনো কোনো অনুদান সম্পন্ন করেননি। শিক্ষার্থীদের শিক্ষা তহবিলে সাদাকাহ প্রদান করুন।'
                      : 'You have not made any donations yet. Support underprivileged students by donating today.'}
                  </p>
                  <Link
                    href="/donate"
                    className="btn btn-primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 1.35rem', fontWeight: '700', textDecoration: 'none' }}
                  >
                    <DollarSign size={16} /> {locale === 'bn' ? 'এখন অনুদান দিন' : 'Donate Now'}
                  </Link>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1.5px solid var(--surface-border, #e2e8f0)', textAlign: 'left', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '0.75rem' }}>{locale === 'bn' ? 'তারিখ' : 'Date'}</th>
                        <th style={{ padding: '0.75rem' }}>{locale === 'bn' ? 'সহায়তাপ্রাপ্ত খাত / শিক্ষার্থী' : 'Purpose / Recipient'}</th>
                        <th style={{ padding: '0.75rem' }}>{locale === 'bn' ? 'পরিমাণ' : 'Amount'}</th>
                        <th style={{ padding: '0.75rem' }}>{locale === 'bn' ? 'পেমেন্ট মাধ্যম' : 'Method'}</th>
                        <th style={{ padding: '0.75rem' }}>{locale === 'bn' ? 'স্ট্যাটাস' : 'Status'}</th>
                        <th style={{ padding: '0.75rem' }}>{locale === 'bn' ? 'ই-রশিদ' : 'E-Receipt'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {donations.map((d) => (
                        <tr key={d.id} style={{ borderBottom: '1px solid var(--surface-border, #e2e8f0)' }}>
                          <td style={{ padding: '0.75rem' }}>{d.date}</td>
                          <td style={{ padding: '0.75rem' }}>
                            <strong style={{ color: 'var(--text-main)' }}>{d.target}</strong>
                          </td>
                          <td style={{ padding: '0.75rem', fontWeight: '800', color: '#059669' }}>
                            {d.amount}
                          </td>
                          <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>
                            {d.method}
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            <span
                              style={{
                                padding: '0.2rem 0.6rem',
                                borderRadius: 'var(--radius-full)',
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                backgroundColor:
                                  d.rawStatus === 'accepted'
                                    ? 'rgba(5, 150, 105, 0.1)'
                                    : 'rgba(217, 119, 6, 0.1)',
                                color:
                                  d.rawStatus === 'accepted' ? '#059669' : 'var(--accent, #d97706)',
                              }}
                            >
                              {d.status}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedReceipt({
                                  receiptNo: d.receiptNo,
                                  date: d.date,
                                  purpose: d.target,
                                  amount: d.amount,
                                  method: d.method,
                                  trxId: d.trxId,
                                  donorName: user.fullName || 'Valued Donor',
                                })
                              }
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                padding: '0.35rem 0.8rem',
                                backgroundColor: '#ffffff',
                                border: '1px solid var(--surface-border, #e2e8f0)',
                                borderRadius: 'var(--radius-sm)',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                fontWeight: '700',
                                color: '#059669',
                              }}
                            >
                              <FileText size={14} /> {locale === 'bn' ? 'রশিদ দেখুন' : 'View Receipt'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 3: BENEFICIARY IMPACT */}
        {activeNav === 'impact' && (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={24} color="#059669" />
                {locale === 'bn' ? 'সহায়তাপ্রাপ্ত শিক্ষার্থীদের শিক্ষাজীবনে প্রভাব' : 'Beneficiary Student Impact'}
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0.25rem 0 0' }}>
                {locale === 'bn'
                  ? 'আপনার অর্থায়নে যেসকল শিক্ষার্থীর শিক্ষা কার্যক্রম অব্যাহত রয়েছে তাদের বিবরণ'
                  : 'Report of students whose education is continuing through your generous grants'}
              </p>
            </div>

            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--surface-border, #e2e8f0)',
                padding: '2.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(5, 150, 105, 0.1)',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem',
                }}
              >
                <ShieldCheck size={36} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                {studentsHelpedCount > 0
                  ? `আপনি সরাসরি ${studentsHelpedCount} জন শিক্ষার্থীর শিক্ষাজীবন অব্যাহত রাখতে সহায়তা করেছেন!`
                  : 'শিক্ষার্থীদের পাশে দাঁড়াতে একটি অনুদান প্রদান করুন'}
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: 500, margin: '0.5rem auto 1.5rem' }}>
                সাদাকাহ বিডি-র ৪-ধাপের কঠোর ভেরিফিকেশন সিস্টেমের মাধ্যমে আপনার অনুদানের শতভাগ সরাসরি শিক্ষার্থীর পড়াশোনার খরচে নিশ্চিত করা হয়।
              </p>
              <Link
                href="/posts"
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 1.35rem', fontWeight: '700', textDecoration: 'none' }}
              >
                <ExternalLink size={16} /> আরও শিক্ষার্থীকে সহায়তা করুন
              </Link>
            </div>
          </div>
        )}

      {/* E-Receipt Modal */}
      {selectedReceipt && (
        <EReceiptModal receipt={selectedReceipt} onClose={() => setSelectedReceipt(null)} />
      )}
      </div>
    </PortalLayout>
  );
}
