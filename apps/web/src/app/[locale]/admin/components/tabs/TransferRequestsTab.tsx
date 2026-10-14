'use client';

import React, { useState } from 'react';
import {
  ArrowLeftRight,
  Clock,
  CheckCircle2,
  History as HistoryIcon,
  Search,
  X,
  Eye,
  XCircle,
} from 'lucide-react';
import styles from '../../admin.module.css';

interface TransferRequestsTabProps {
  isBn: boolean;
  adminTransferRequests: {
    actionable: any[];
    monitoring: any[];
    history: any[];
  };
  onOpenTransferReview: (itemData: any, isReadOnly: boolean) => void;
}

export function TransferRequestsTab({
  isBn,
  adminTransferRequests,
  onOpenTransferReview,
}: TransferRequestsTabProps) {
  const [transferSubTab, setTransferSubTab] = useState<'actionable' | 'monitoring' | 'history'>('actionable');
  const [transferSearch, setTransferSearch] = useState<string>('');

  return (
    <div>
      <div className={styles.contentHeader}>
        <div>
          <h1 className={styles.pageTitle}>
            <ArrowLeftRight size={26} color="var(--color-primary)" />
            {isBn ? 'শিক্ষক ও শিক্ষার্থী প্রতিষ্ঠান পরিবর্তন ও স্থানান্তর কেন্দ্র' : 'Teacher & Student Institution Transfers'}
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            {isBn
              ? 'উভয় প্রতিষ্ঠান কর্তৃক প্রাথমিক ছাড়পত্র প্রাপ্ত আবেদনের চূড়ান্ত প্রশাসনিক নিষ্পত্তি ও তদারকি।'
              : 'Final administrative clearance and live oversight of multi-institution transfer requests.'}
          </p>
        </div>
      </div>

      {/* Prominent Guidance & Policy Banner */}
      <div
        style={{
          marginBottom: '1.5rem',
          padding: '1.25rem 1.5rem',
          backgroundColor: 'rgba(37, 99, 235, 0.06)',
          border: '1px solid var(--surface-border, rgba(37, 99, 235, 0.25))',
          borderRadius: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Clock size={18} color="var(--secondary, #3b82f6)" />
          <strong style={{ fontSize: '0.95rem', color: 'var(--text-main, #1e40af)' }}>
            {isBn ? 'এডমিন স্থানান্তর নীতিমালা ও নির্দেশিকা' : 'Administrator Transfer Guidelines & Flow'}
          </strong>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.85rem', fontSize: '0.83rem' }}>
          <div style={{ padding: '0.85rem', backgroundColor: 'var(--surface, #ffffff)', borderRadius: '10px', border: '1px solid var(--surface-border, #e2e8f0)', boxShadow: 'var(--shadow-xs)' }}>
            <strong style={{ color: 'var(--text-main, #0f172a)', display: 'block', marginBottom: '0.3rem', fontSize: '0.87rem' }}>
              {isBn ? '১. পর্যবেক্ষণ পর্ব (Monitoring):' : '1. Live Monitoring:'}
            </strong>
            <span style={{ color: 'var(--text-muted, #64748b)', lineHeight: 1.55 }}>
              {isBn
                ? 'শিক্ষার্থী বা শিক্ষক আবেদন করার পর বর্তমান প্রতিষ্ঠান ও নতুন প্রতিষ্ঠান ছাড়পত্র দেওয়ার আগ পর্যন্ত এডমিনরা শুধু স্ট্যাটাস তদারকি করতে পারবেন।'
                : 'Admins monitor status while the request is being evaluated by current and target institutions.'}
            </span>
          </div>
          <div style={{ padding: '0.85rem', backgroundColor: 'var(--surface, #ffffff)', borderRadius: '10px', border: '1px solid var(--surface-border, #e2e8f0)', boxShadow: 'var(--shadow-xs)' }}>
            <strong style={{ color: 'var(--text-main, #0f172a)', display: 'block', marginBottom: '0.3rem', fontSize: '0.87rem' }}>
              {isBn ? '২. চূড়ান্ত অনুমোদন (Actionable):' : '2. Final Admin Clearance:'}
            </strong>
            <span style={{ color: 'var(--text-muted, #64748b)', lineHeight: 1.55 }}>
              {isBn
                ? 'উভয় শিক্ষা প্রতিষ্ঠান অনুমোদন করলেই কেবলমাত্র কর্তৃপক্ষের নিকট চূড়ান্ত ছাড়পত্রের বাটন সক্রিয় হবে।'
                : 'Action buttons unlock for platform authority only after both institutions approve.'}
            </span>
          </div>
          <div style={{ padding: '0.85rem', backgroundColor: 'var(--surface, #ffffff)', borderRadius: '10px', border: '1px solid var(--surface-border, #e2e8f0)', boxShadow: 'var(--shadow-xs)' }}>
            <strong style={{ color: 'var(--text-main, #0f172a)', display: 'block', marginBottom: '0.3rem', fontSize: '0.87rem' }}>
              {isBn ? '৩. স্থায়ী ডাটা সংরক্ষণ নীতি:' : '3. Data Lineage & Isolation:'}
            </strong>
            <span style={{ color: 'var(--text-muted, #64748b)', lineHeight: 1.55 }}>
              {isBn
                ? 'স্থানান্তরের পূর্ববর্তী সকল পোস্ট ও অর্থ বরাদ্দ পুরাতন প্রতিষ্ঠানের নামেই স্থায়ী থাকবে। নতুন পোস্ট ও রেকর্ড নতুন প্রতিষ্ঠানের সাথে যুক্ত হবে।'
                : 'Historical campaigns and allocation data remain permanently tied to the previous institution.'}
            </span>
          </div>
        </div>
      </div>

      {/* Sub-tabs: Actionable vs Live Monitoring vs History */}
      <div className={styles.verificationTabs}>
        <button
          type="button"
          className={`${styles.verificationTabBtn} ${transferSubTab === 'actionable' ? styles.verificationTabBtnActive : ''}`}
          onClick={() => setTransferSubTab('actionable')}
        >
          <CheckCircle2 size={16} />
          <span>{isBn ? 'চূড়ান্ত অনুমোদন অপেক্ষমাণ' : 'Actionable Clearances'}</span>
          <span className={styles.tabBadge}>
            {adminTransferRequests.actionable.length}
          </span>
        </button>

        <button
          type="button"
          className={`${styles.verificationTabBtn} ${transferSubTab === 'monitoring' ? styles.verificationTabBtnActive : ''}`}
          onClick={() => setTransferSubTab('monitoring')}
        >
          <Clock size={16} />
          <span>{isBn ? 'চলমান পর্যবেক্ষণ (প্রতিষ্ঠান পর্যায়)' : 'Live Monitoring'}</span>
          <span className={styles.tabBadge}>
            {adminTransferRequests.monitoring.length}
          </span>
        </button>

        <button
          type="button"
          className={`${styles.verificationTabBtn} ${transferSubTab === 'history' ? styles.verificationTabBtnActive : ''}`}
          onClick={() => setTransferSubTab('history')}
        >
          <HistoryIcon size={16} />
          <span>{isBn ? 'সম্পন্ন ও বাতিল ইতিহাস' : 'Transfer History'}</span>
          <span className={styles.tabBadge}>
            {adminTransferRequests.history.length}
          </span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'center',
          margin: '1rem 0 1.5rem',
          backgroundColor: 'var(--surface, #ffffff)',
          padding: '0.75rem 1rem',
          borderRadius: '10px',
          border: '1px solid var(--color-border)',
        }}
      >
        <Search size={18} color="var(--text-muted)" />
        <input
          type="text"
          value={transferSearch}
          onChange={(e) => setTransferSearch(e.target.value)}
          placeholder={
            isBn
              ? 'আবেদনকারীর নাম, ইমেইল অথবা প্রতিষ্ঠানের নাম দিয়ে অনুসন্ধান করুন...'
              : 'Search by applicant name, email, or institution name...'
          }
          style={{
            border: 'none',
            outline: 'none',
            background: 'transparent',
            width: '100%',
            fontSize: '0.9rem',
            color: 'var(--text-main, #0f172a)',
          }}
        />
        {transferSearch && (
          <button
            type="button"
            onClick={() => setTransferSearch('')}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* SUB-TAB 1: ACTIONABLE (AWAITING ADMIN FINAL VERIFICATION) */}
      {transferSubTab === 'actionable' && (
        <div
          className="card"
          style={{
            padding: '1.5rem',
            backgroundColor: 'var(--surface, #ffffff)',
            borderRadius: '12px',
            border: '1px solid var(--color-border)',
          }}
        >
          <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main, #0f172a)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={20} color="#059669" />
              {isBn ? 'এডমিন চূড়ান্ত ছাড়পত্রের জন্য প্রস্তুত' : 'Actionable Transfer Requests'} ({adminTransferRequests.actionable.length})
            </h3>
          </div>

          {(() => {
            const filtered = adminTransferRequests.actionable.filter((item) => {
              if (!transferSearch.trim()) return true;
              const q = transferSearch.toLowerCase();
              return (
                (item.userName && item.userName.toLowerCase().includes(q)) ||
                (item.userEmail && item.userEmail.toLowerCase().includes(q)) ||
                (item.currentOrgName && item.currentOrgName.toLowerCase().includes(q)) ||
                (item.targetOrgName && item.targetOrgName.toLowerCase().includes(q))
              );
            });

            if (filtered.length === 0) {
              return (
                <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2.5rem', margin: 0 }}>
                  {transferSearch
                    ? (isBn ? 'অনুসন্ধানের সাথে কোনো আবেদন মেলেনি।' : 'No matching actionable transfers.')
                    : (isBn ? 'বর্তমানে চূড়ান্ত অনুমোদনের জন্য কোনো স্থানান্তর আবেদন অপেক্ষমাণ নেই।' : 'No transfer requests pending admin final clearance.')}
                </p>
              );
            }

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filtered.map((item) => (
                  <div
                    key={item.id}
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
                    <div style={{ flex: '1 1 340px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            padding: '0.2rem 0.55rem',
                            borderRadius: '999px',
                            backgroundColor: item.userRole === 'teacher' ? 'rgba(37, 99, 235, 0.12)' : 'rgba(5, 150, 105, 0.12)',
                            color: item.userRole === 'teacher' ? '#2563eb' : '#059669',
                          }}
                        >
                          {item.userRole === 'teacher' ? (isBn ? 'শিক্ষক' : 'Teacher') : (isBn ? 'শিক্ষার্থী' : 'Student')}
                        </span>
                        <h4 style={{ fontWeight: 800, fontSize: '1.05rem', margin: 0, color: 'var(--text-main, #0f172a)' }}>
                          {item.userName}
                        </h4>
                        <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '999px', backgroundColor: '#dcfce7', color: '#166534', fontWeight: 700 }}>
                          ✓ {isBn ? 'উভয় প্রতিষ্ঠান অনুমোদিত' : 'Approved by both orgs'}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.86rem', marginTop: '0.4rem', color: 'var(--text-main)' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{isBn ? 'স্থানান্তর পথ: ' : 'Route: '}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{item.currentOrgName}</span>
                        {' '}➔{' '}
                        <strong style={{ color: 'var(--secondary, #2563eb)' }}>{item.targetOrgName}</strong>
                      </div>

                      <div style={{ fontSize: '0.82rem', color: 'var(--text-main)', marginTop: '0.35rem', fontStyle: 'italic', backgroundColor: 'var(--surface, #ffffff)', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--surface-border, #e2e8f0)' }}>
                        &quot;{item.reason}&quot;
                      </div>

                      <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.4rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <span>{isBn ? 'ইমেইল: ' : 'Email: '}{item.userEmail}</span>
                        {item.userPhone && <span>{isBn ? 'ফোন: ' : 'Phone: '}{item.userPhone}</span>}
                        <span>{isBn ? 'আবেদনের তারিখ: ' : 'Applied: '}{new Date(item.createdAt).toLocaleDateString(isBn ? 'bn-BD' : 'en-US')}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ padding: '0.55rem 1.15rem', fontSize: '0.85rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                        onClick={() => onOpenTransferReview(item, false)}
                      >
                        <CheckCircle2 size={16} />
                        {isBn ? 'যাচাই ও চূড়ান্ত ছাড়পত্র দিন' : 'Review & Final Approve'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* SUB-TAB 2: MONITORING (WAITING FOR ORGS) */}
      {transferSubTab === 'monitoring' && (
        <div
          className="card"
          style={{
            padding: '1.5rem',
            backgroundColor: 'var(--surface, #ffffff)',
            borderRadius: '12px',
            border: '1px solid var(--color-border)',
          }}
        >
          <div style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main, #0f172a)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={20} color="#f59e0b" />
              {isBn ? 'চলমান স্থানান্তর পর্যবেক্ষণ (প্রতিষ্ঠান পর্যায়)' : 'Live Monitoring - Institutional Stage'} ({adminTransferRequests.monitoring.length})
            </h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
              {isBn
                ? 'এসব আবেদন বর্তমানে প্রতিষ্ঠানসমূহের বিবেচনাধীন রয়েছে। উভয় প্রতিষ্ঠান অনুমোদন করলে এডমিন চূড়ান্ত ছাড়পত্র দিতে পারবেন।'
                : 'These requests are currently awaiting approval from current or target institutions.'}
            </p>
          </div>

          {(() => {
            const filtered = adminTransferRequests.monitoring.filter((item) => {
              if (!transferSearch.trim()) return true;
              const q = transferSearch.toLowerCase();
              return (
                (item.userName && item.userName.toLowerCase().includes(q)) ||
                (item.userEmail && item.userEmail.toLowerCase().includes(q)) ||
                (item.currentOrgName && item.currentOrgName.toLowerCase().includes(q)) ||
                (item.targetOrgName && item.targetOrgName.toLowerCase().includes(q))
              );
            });

            if (filtered.length === 0) {
              return (
                <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2.5rem', margin: 0 }}>
                  {isBn ? 'বর্তমানে কোনো পর্যবেক্ষণাধীন স্থানান্তর আবেদন নেই।' : 'No transfer requests currently in institutional stages.'}
                </p>
              );
            }

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filtered.map((item) => {
                  const isPendingCurrent = item.status === 'pending_current_org';
                  const isApprovedCurrent = item.status === 'current_org_approved';

                  return (
                    <div
                      key={item.id}
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
                      <div style={{ flex: '1 1 340px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              padding: '0.2rem 0.55rem',
                              borderRadius: '999px',
                              backgroundColor: item.userRole === 'teacher' ? 'rgba(37, 99, 235, 0.12)' : 'rgba(5, 150, 105, 0.12)',
                              color: item.userRole === 'teacher' ? '#2563eb' : '#059669',
                            }}
                          >
                            {item.userRole === 'teacher' ? (isBn ? 'শিক্ষক' : 'Teacher') : (isBn ? 'শিক্ষার্থী' : 'Student')}
                          </span>
                          <h4 style={{ fontWeight: 800, fontSize: '1.05rem', margin: 0, color: 'var(--text-main, #0f172a)' }}>
                            {item.userName}
                          </h4>
                          {isPendingCurrent && (
                            <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '999px', backgroundColor: '#fef3c7', color: '#92400e', fontWeight: 700 }}>
                              ⏳ {isBn ? 'বর্তমান প্রতিষ্ঠানের ছাড়পত্র অপেক্ষমাণ' : 'Awaiting Current Org Release'}
                            </span>
                          )}
                          {isApprovedCurrent && (
                            <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '999px', backgroundColor: '#e0e7ff', color: '#3730a3', fontWeight: 700 }}>
                              ⏳ {isBn ? 'নতুন প্রতিষ্ঠানের গ্রহণ অপেক্ষমাণ' : 'Awaiting Target Org Acceptance'}
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: '0.86rem', marginTop: '0.4rem', color: 'var(--text-main)' }}>
                          <span style={{ color: 'var(--text-muted)' }}>{isBn ? 'স্থানান্তর পথ: ' : 'Route: '}</span>
                          <span style={{ color: 'var(--text-muted)' }}>{item.currentOrgName}</span>
                          {' '}➔{' '}
                          <strong style={{ color: 'var(--secondary, #2563eb)' }}>{item.targetOrgName}</strong>
                        </div>

                        <div style={{ fontSize: '0.82rem', color: 'var(--text-main)', marginTop: '0.35rem', fontStyle: 'italic', backgroundColor: 'var(--surface, #ffffff)', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--surface-border, #e2e8f0)' }}>
                          &quot;{item.reason}&quot;
                        </div>

                        <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.4rem' }}>
                          {isBn ? 'আবেদনের তারিখ: ' : 'Applied on: '}{new Date(item.createdAt).toLocaleDateString(isBn ? 'bn-BD' : 'en-US')}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="btn btn-outline"
                          style={{
                            padding: '0.5rem 1rem',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            backgroundColor: '#eff6ff',
                            borderColor: '#bfdbfe',
                            color: '#1d4ed8',
                          }}
                          onClick={() => onOpenTransferReview(item, true)}
                        >
                          <Eye size={15} />
                          {isBn ? 'অগ্রগতি পর্যবেক্ষণ' : 'Monitor Progress'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* SUB-TAB 3: HISTORY */}
      {transferSubTab === 'history' && (
        <div
          className="card"
          style={{
            padding: '1.5rem',
            backgroundColor: 'var(--surface, #ffffff)',
            borderRadius: '12px',
            border: '1px solid var(--color-border)',
          }}
        >
          <div style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main, #0f172a)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <HistoryIcon size={20} color="#2563eb" />
              {isBn ? 'স্থানান্তরের নিষ্পত্তি ও পূর্ববর্তী ইতিহাস' : 'Completed Transfer Log'} ({adminTransferRequests.history.length})
            </h3>
          </div>

          {(() => {
            const filtered = adminTransferRequests.history.filter((item) => {
              if (!transferSearch.trim()) return true;
              const q = transferSearch.toLowerCase();
              return (
                (item.userName && item.userName.toLowerCase().includes(q)) ||
                (item.userEmail && item.userEmail.toLowerCase().includes(q)) ||
                (item.currentOrgName && item.currentOrgName.toLowerCase().includes(q)) ||
                (item.targetOrgName && item.targetOrgName.toLowerCase().includes(q))
              );
            });

            if (filtered.length === 0) {
              return (
                <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2.5rem', margin: 0 }}>
                  {isBn ? 'কোনো স্থানান্তরের ইতিহাস পাওয়া যায়নি।' : 'No transfer history records found.'}
                </p>
              );
            }

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filtered.map((item) => {
                  const isApproved = item.status === 'approved';

                  return (
                    <div
                      key={item.id}
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
                      <div style={{ flex: '1 1 340px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                          <strong style={{ fontSize: '1.05rem', color: 'var(--text-main, #0f172a)' }}>
                            {item.userName}
                          </strong>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            ({item.userRole === 'teacher' ? (isBn ? 'শিক্ষক' : 'Teacher') : (isBn ? 'শিক্ষার্থী' : 'Student')})
                          </span>
                        </div>

                        <div style={{ fontSize: '0.85rem', color: '#1e293b' }}>
                          <span>{item.currentOrgName}</span> &rarr; <strong style={{ color: '#2563eb' }}>{item.targetOrgName}</strong>
                        </div>

                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontStyle: 'italic' }}>
                          &quot;{item.reason}&quot;
                        </div>

                        {item.status === 'rejected' && (
                          <div style={{ marginTop: '0.4rem', fontSize: '0.82rem', color: '#b91c1c' }}>
                            ❌ {isBn ? 'বাতিলের কারণ:' : 'Reason:'}{' '}
                            {item.currentOrgRejectionReason || item.targetOrgRejectionReason || item.finalRejectionReason || (isBn ? 'উল্লেখ নেই' : 'Not specified')}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                        {isApproved ? (
                          <span className={styles.historyBadgeApproved}>
                            <CheckCircle2 size={13} /> {isBn ? 'চূড়ান্ত অনুমোদিত' : 'Transfer Approved'}
                          </span>
                        ) : (
                          <span className={styles.historyBadgeRejected}>
                            <XCircle size={13} /> {isBn ? 'আবেদন বাতিল' : 'Rejected'}
                          </span>
                        )}

                        <button
                          type="button"
                          className="btn btn-outline"
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', fontWeight: 600 }}
                          onClick={() => onOpenTransferReview(item, true)}
                        >
                          <Eye size={14} /> {isBn ? 'লগ দেখুন' : 'View Log'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

export default TransferRequestsTab;
