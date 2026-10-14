'use client';

import React, { useState } from 'react';
import { DollarSign, Clock, History as HistoryIcon, Search, Eye } from 'lucide-react';
import styles from '../../admin.module.css';

interface PendingDonationsTabProps {
  isBn: boolean;
  loadingData: boolean;
  pendingDonations: any[];
  donationsHistory: any[];
  handleOpenDonationReview: (don: any, isReadOnly?: boolean) => void;
}

export function PendingDonationsTab({
  isBn,
  loadingData,
  pendingDonations,
  donationsHistory,
  handleOpenDonationReview,
}: PendingDonationsTabProps) {
  const [pendingDonationsTab, setPendingDonationsTab] = useState<'pending' | 'history'>('pending');
  const [donationHistorySearch, setDonationHistorySearch] = useState<string>('');
  const [donationHistoryStatusFilter, setDonationHistoryStatusFilter] = useState<'all' | 'accepted' | 'rejected'>('all');

  return (
    <div>
      <div className={styles.contentHeader}>
        <div>
          <h1 className={styles.pageTitle}>
            <DollarSign size={26} color="#10b981" />
            {isBn ? 'অনুদান পেমেন্ট যাচাই ও ছাড়পত্র' : 'Donation Payment Verifications'}
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            {isBn
              ? 'দাতাদের প্রেরিত লেনদেন আইডি যাচাই, পাবলিক লেজারে পোস্টিং ও অনুমোদনের অতীত ইতিহাস।'
              : 'Verify transaction references, post to the public ledger, and review clearance history.'}
          </p>
        </div>
      </div>

      {/* Sub-tabs: Pending vs History */}
      <div className={styles.verificationTabs}>
        <button
          type="button"
          className={`${styles.verificationTabBtn} ${pendingDonationsTab === 'pending' ? styles.verificationTabBtnActive : ''}`}
          onClick={() => setPendingDonationsTab('pending')}
        >
          <Clock size={16} />
          <span>{isBn ? 'পেন্ডিং পেমেন্ট অনুমোদন' : 'Pending Approvals'}</span>
          <span className={styles.tabBadge}>{pendingDonations.length}</span>
        </button>

        <button
          type="button"
          className={`${styles.verificationTabBtn} ${pendingDonationsTab === 'history' ? styles.verificationTabBtnActive : ''}`}
          onClick={() => setPendingDonationsTab('history')}
        >
          <HistoryIcon size={16} />
          <span>{isBn ? 'অনুমোদন ও বাতিলের ইতিহাস' : 'Clearance History'}</span>
          <span className={styles.tabBadge}>{donationsHistory.length}</span>
        </button>
      </div>

      {/* TAB 1: Pending Donations */}
      {pendingDonationsTab === 'pending' && (
        <div
          className="card"
          style={{
            padding: '1.5rem',
            backgroundColor: 'var(--surface, #ffffff)',
            borderRadius: '12px',
            border: '1px solid var(--color-border)',
          }}
        >
          {loadingData ? (
            <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>
              {isBn ? 'ডাটা লোড হচ্ছে...' : 'Loading data...'}
            </p>
          ) : pendingDonations.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>
              {isBn ? 'কোনো অনুদান ভেরিফিকেশন অপেক্ষমান নেই।' : 'No pending donations waiting for verification.'}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {pendingDonations.map((don) => (
                <div
                  key={don.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1.25rem',
                    backgroundColor: 'var(--background-alt, #f8fafc)',
                    borderRadius: '10px',
                    border: '1px solid var(--color-border)',
                    flexWrap: 'wrap',
                    gap: '1rem',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: '700', fontSize: '1.05rem', color: 'var(--text-main, #0f172a)' }}>
                        {don.donorName}
                      </span>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          fontWeight: 600,
                          backgroundColor: don.type === 'random' ? 'rgba(13, 148, 136, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                          color: don.type === 'random' ? '#0d9488' : '#2563eb',
                        }}
                      >
                        {don.type === 'random' ? (isBn ? 'সাধারণ শিক্ষা তহবিল' : 'General Fund') : `সরাসরি: ${don.studentName}`}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      মাধ্যম: <strong>{don.method}</strong> | ট্রানজেকশন আইডি: <code>{don.trxId}</code> {don.time && `| সময়: ${don.time}`}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <span style={{ fontWeight: '800', color: 'var(--color-primary)', fontSize: '1.25rem' }}>
                      ৳{Number(don.amount || 0).toLocaleString()}
                    </span>

                    <button
                      className="btn btn-primary"
                      style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
                      onClick={() => handleOpenDonationReview(don)}
                    >
                      <Eye size={16} /> {isBn ? 'ড্রয়ারে যাচাই ও ছাড়' : 'Review & Verify'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Clearance History */}
      {pendingDonationsTab === 'history' && (
        <div>
          {/* Search & Filter Toolbar */}
          <div
            style={{
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'center',
              marginBottom: '1rem',
              backgroundColor: 'var(--surface, #ffffff)',
              padding: '0.75rem 1rem',
              borderRadius: '12px',
              border: '1px solid var(--color-border)',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '220px' }}>
              <Search size={18} color="var(--color-text-muted)" />
              <input
                type="text"
                placeholder={isBn ? 'দাতা, TrxID বা ক্যাম্পেইন নাম দিয়ে খুঁজুন...' : 'Search by donor, TrxID, or campaign...'}
                value={donationHistorySearch}
                onChange={(e) => setDonationHistorySearch(e.target.value)}
                style={{
                  width: '100%',
                  border: 'none',
                  outline: 'none',
                  fontSize: '0.9rem',
                  backgroundColor: 'transparent',
                  color: 'var(--text-main, #0f172a)',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <select
                value={donationHistoryStatusFilter}
                onChange={(e) => setDonationHistoryStatusFilter(e.target.value as any)}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.85rem',
                  backgroundColor: 'var(--surface, #ffffff)',
                  color: 'var(--text-main, #0f172a)',
                  cursor: 'pointer',
                }}
              >
                <option value="all">{isBn ? 'সকল হিস্টোরি (All)' : 'All Records'}</option>
                <option value="accepted">{isBn ? 'অনুমোদিত (Verified)' : 'Verified Only'}</option>
                <option value="rejected">{isBn ? 'প্রত্যাখ্যাত (Rejected)' : 'Rejected Only'}</option>
              </select>

              {(donationHistorySearch || donationHistoryStatusFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setDonationHistorySearch('');
                    setDonationHistoryStatusFilter('all');
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    color: 'var(--text-muted, #64748b)',
                  }}
                >
                  {isBn ? 'রিসেট' : 'Clear'}
                </button>
              )}
            </div>
          </div>

          <div
            className="card"
            style={{
              padding: '1.5rem',
              backgroundColor: 'var(--surface, #ffffff)',
              borderRadius: '12px',
              border: '1px solid var(--color-border)',
            }}
          >
            {donationsHistory.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>
                {isBn ? 'কোনো অনুদানের পূর্ববর্তী হিস্টোরি পাওয়া যায়নি।' : 'No historical donation clearance records found.'}
              </p>
            ) : (
              (() => {
                const filteredHistory = donationsHistory.filter((don) => {
                  if (donationHistoryStatusFilter !== 'all' && don.status !== donationHistoryStatusFilter) {
                    return false;
                  }
                  if (donationHistorySearch) {
                    const q = donationHistorySearch.toLowerCase();
                    return (
                      (don.donorName && don.donorName.toLowerCase().includes(q)) ||
                      (don.trxId && don.trxId.toLowerCase().includes(q)) ||
                      (don.studentName && don.studentName.toLowerCase().includes(q)) ||
                      (don.method && don.method.toLowerCase().includes(q))
                    );
                  }
                  return true;
                });

                if (filteredHistory.length === 0) {
                  return (
                    <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>
                      {isBn ? 'ফিল্টারের সাথে কোনো হিস্টোরি রেকর্ড মেলেনি।' : 'No history matches the selected filters.'}
                    </p>
                  );
                }

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {filteredHistory.map((don) => (
                      <div
                        key={don.id}
                        style={{
                          padding: '1.25rem',
                          backgroundColor: 'var(--background-alt, #f8fafc)',
                          borderRadius: '10px',
                          border: '1px solid var(--color-border)',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            flexWrap: 'wrap',
                            gap: '0.75rem',
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                              <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main, #0f172a)' }}>
                                {don.donorName}
                              </span>
                              <span
                                style={{
                                  fontSize: '0.75rem',
                                  padding: '0.15rem 0.5rem',
                                  borderRadius: '4px',
                                  fontWeight: 600,
                                  backgroundColor: don.type === 'random' ? 'rgba(13, 148, 136, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                                  color: don.type === 'random' ? '#0d9488' : '#2563eb',
                                }}
                              >
                                {don.type === 'random' ? (isBn ? 'সাধারণ শিক্ষা তহবিল' : 'General Fund') : `সরাসরি: ${don.studentName}`}
                              </span>
                            </div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                              মাধ্যম: <strong>{don.method}</strong> | ট্রানজেকশন আইডি: <code>{don.trxId}</code> {don.time && `| সময়: ${don.time}`}
                            </p>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span style={{ fontWeight: 800, color: 'var(--color-primary)', fontSize: '1.25rem' }}>
                              ৳{Number(don.amount || 0).toLocaleString()}
                            </span>

                            <button
                              type="button"
                              className="btn btn-outline"
                              style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
                              onClick={() => handleOpenDonationReview(don, true)}
                              title={isBn ? 'বিস্তারিত পর্যালোচনা (রিড-অনলি)' : 'Review Details (View Only)'}
                            >
                              <Eye size={15} /> {isBn ? 'বিস্তারিত দেখুন' : 'View Details'}
                            </button>
                          </div>
                        </div>

                        <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              padding: '0.2rem 0.6rem',
                              borderRadius: '9999px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              backgroundColor: don.status === 'accepted' ? '#ecfdf5' : '#fef2f2',
                              color: don.status === 'accepted' ? '#047857' : '#b91c1c',
                              border: `1px solid ${don.status === 'accepted' ? '#a7f3d0' : '#fecaca'}`,
                            }}
                          >
                            {don.status === 'accepted' ? '✓ ' + (isBn ? 'অনুমোদিত ও ভেরিফাইড' : 'Verified') : '✕ ' + (isBn ? 'প্রত্যাখ্যাত' : 'Rejected')}
                          </span>

                          {don.donorEmail && (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              ইমেইল: {don.donorEmail}
                            </span>
                          )}
                          {don.donorPhone && (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              | ফোন: {don.donorPhone}
                            </span>
                          )}
                        </div>

                        {don.rejectionReason && (
                          <div className={styles.historyRejectionBox}>
                            <strong>✕ {isBn ? 'প্রত্যাখ্যানের কারণ:' : 'Rejection Reason:'}</strong> {don.rejectionReason}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default PendingDonationsTab;
