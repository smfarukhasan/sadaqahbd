'use client';

import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Check,
  X,
  User,
  ShieldCheck,
} from 'lucide-react';
import { getApiUrl } from '@/lib/api-config';
import { getAuthToken } from '@/lib/auth-token';
import styles from '../../admin.module.css';

interface StudentPhoneExemptionsTabProps {
  isBn: boolean;
  user: any;
  onRefreshCount?: () => void;
}

export default function StudentPhoneExemptionsTab({
  isBn,
  user,
  onRefreshCount,
}: StudentPhoneExemptionsTabProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [exemptions, setExemptions] = useState<any[]>([]);
  const [filterTab, setFilterTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals state
  const [approveModalItem, setApproveModalItem] = useState<any | null>(null);
  const [approveValidDate, setApproveValidDate] = useState<string>('');
  const [rejectModalItem, setRejectModalItem] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [submittingAction, setSubmittingAction] = useState<boolean>(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadExemptions = async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      const res = await fetch(`${getApiUrl()}/sms/admin/exemptions`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
      if (res.ok) {
        const json = await res.json();
        setExemptions(json);
        if (onRefreshCount) onRefreshCount();
      }
    } catch (err) {
      console.error('Failed to load student exemptions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExemptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenApproveModal = (item: any) => {
    // Default valid date: +3 months from today
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    setApproveValidDate(d.toISOString().slice(0, 10));
    setApproveModalItem(item);
    setActionFeedback(null);
  };

  const handleOpenRejectModal = (item: any) => {
    setRejectionReason('');
    setRejectModalItem(item);
    setActionFeedback(null);
  };

  const handleConfirmApproval = async () => {
    if (!approveModalItem || !approveValidDate) return;
    try {
      setSubmittingAction(true);
      const token = await getAuthToken();

      const res = await fetch(
        `${getApiUrl()}/sms/admin/exemptions/${approveModalItem.id}/review`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
          body: JSON.stringify({
            action: 'approve',
            validUntil: new Date(approveValidDate).toISOString(),
          }),
        }
      );

      const data = await res.json();
      if (res.ok && data.success) {
        setActionFeedback({
          type: 'success',
          text: data.message || (isBn ? 'আবেদন সফলভাবে অনুমোদন করা হয়েছে।' : 'Approved successfully.'),
        });
        setApproveModalItem(null);
        loadExemptions();
      } else {
        setActionFeedback({
          type: 'error',
          text: data.message || (isBn ? 'অনুমোদন ব্যর্থ হয়েছে।' : 'Approval failed.'),
        });
      }
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        text: err?.message || (isBn ? 'অনুমোদন প্রক্রিয়ায় সমস্যা হয়েছে।' : 'Error processing approval.'),
      });
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleConfirmRejection = async () => {
    if (!rejectModalItem || !rejectionReason.trim()) return;
    try {
      setSubmittingAction(true);
      const token = await getAuthToken();

      const res = await fetch(
        `${getApiUrl()}/sms/admin/exemptions/${rejectModalItem.id}/review`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
          body: JSON.stringify({
            action: 'reject',
            rejectionReason: rejectionReason.trim(),
          }),
        }
      );

      const data = await res.json();
      if (res.ok && data.success) {
        setActionFeedback({
          type: 'success',
          text: data.message || (isBn ? 'আবেদনটি রিজেক্ট করা হয়েছে।' : 'Rejected successfully.'),
        });
        setRejectModalItem(null);
        loadExemptions();
      } else {
        setActionFeedback({
          type: 'error',
          text: data.message || (isBn ? 'রিজেক্ট ব্যর্থ হয়েছে।' : 'Rejection failed.'),
        });
      }
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        text: err?.message || (isBn ? 'রিজেক্ট প্রক্রিয়ায় সমস্যা হয়েছে।' : 'Error processing rejection.'),
      });
    } finally {
      setSubmittingAction(false);
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString(isBn ? 'bn-BD' : 'en-US', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  // Preset date helper (+1 month, +3 months, +6 months, +1 year)
  const setPresetDate = (months: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    setApproveValidDate(d.toISOString().slice(0, 10));
  };

  const pendingList = exemptions.filter((e) => e.status === 'pending');
  const approvedList = exemptions.filter((e) => e.status === 'approved');
  const rejectedList = exemptions.filter((e) => e.status === 'rejected');

  const filteredExemptions = (
    filterTab === 'pending'
      ? pendingList
      : filterTab === 'approved'
      ? approvedList
      : rejectedList
  ).filter((e) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      e.studentName?.toLowerCase().includes(term) ||
      e.studentEmail?.toLowerCase().includes(term) ||
      e.reason?.toLowerCase().includes(term)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
          borderRadius: '16px',
          padding: '1.5rem 1.75rem',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 10px 25px -5px rgba(49, 46, 129, 0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', backgroundColor: 'rgba(255, 255, 255, 0.15)', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.75rem', backdropFilter: 'blur(6px)' }}>
              <Smartphone size={14} color="#fef08a" />
              <span>{isBn ? 'শিক্ষার্থী ছাড়পত্র ব্যবস্থাপনা' : 'Student Phone Exemption Clearances'}</span>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.4rem', color: '#ffffff' }}>
              {isBn ? 'শিক্ষার্থী ফোন ভেরিফিকেশন অব্যাহতি' : 'Student Phone Verification Exemptions'}
            </h2>
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'rgba(255, 255, 255, 0.88)', maxWidth: '620px', lineHeight: 1.5 }}>
              {isBn
                ? 'ব্যক্তিগত ফোন নম্বর না থাকা শিক্ষার্থীদের একাউন্ট ব্যবহারের বিশেষ আবেদন যাচাই, ডেট পিকার দিয়ে মেয়াদ নির্ধারণ ও রিজেক্ট হিস্টোরি অডিট।'
                : 'Review exemption applications from students without personal phones, set validity with date picker, and audit rejection reasons.'}
            </p>
          </div>

          <button
            type="button"
            onClick={loadExemptions}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={13} />
            <span>{isBn ? 'রিফ্রেশ' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Action Feedback */}
      {actionFeedback && (
        <div
          style={{
            padding: '0.9rem 1.2rem',
            borderRadius: '10px',
            backgroundColor: actionFeedback.type === 'success' ? '#ecfdf5' : '#fef2f2',
            border: `1px solid ${actionFeedback.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
            color: actionFeedback.type === 'success' ? '#065f46' : '#991b1b',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            fontSize: '0.88rem',
            fontWeight: 600,
          }}
        >
          {actionFeedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{actionFeedback.text}</span>
        </div>
      )}

      {/* Tabs and Search Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          backgroundColor: 'var(--surface, #ffffff)',
          padding: '1rem 1.25rem',
          borderRadius: '12px',
          border: '1px solid var(--color-border, #e2e8f0)',
        }}
      >
        {/* Sub-tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setFilterTab('pending')}
            style={{
              padding: '0.5rem 0.9rem',
              borderRadius: '8px',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: filterTab === 'pending' ? '1.5px solid #4338ca' : '1px solid var(--color-border, #cbd5e1)',
              backgroundColor: filterTab === 'pending' ? 'rgba(67, 56, 202, 0.1)' : 'transparent',
              color: filterTab === 'pending' ? '#4338ca' : 'var(--color-text-muted, #64748b)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
            }}
          >
            <span>{isBn ? 'অপেক্ষমান আবেদন' : 'Pending Requests'}</span>
            <span
              style={{
                fontSize: '0.72rem',
                padding: '0.1rem 0.45rem',
                borderRadius: '10px',
                backgroundColor: pendingList.length > 0 ? '#ef4444' : '#94a3b8',
                color: '#ffffff',
              }}
            >
              {pendingList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('approved')}
            style={{
              padding: '0.5rem 0.9rem',
              borderRadius: '8px',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: filterTab === 'approved' ? '1.5px solid #059669' : '1px solid var(--color-border, #cbd5e1)',
              backgroundColor: filterTab === 'approved' ? 'rgba(5, 150, 105, 0.1)' : 'transparent',
              color: filterTab === 'approved' ? '#059669' : 'var(--color-text-muted, #64748b)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
            }}
          >
            <span>{isBn ? 'অনুমোদিত ইতিহাস' : 'Approved History'}</span>
            <span
              style={{
                fontSize: '0.72rem',
                padding: '0.1rem 0.45rem',
                borderRadius: '10px',
                backgroundColor: '#059669',
                color: '#ffffff',
              }}
            >
              {approvedList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('rejected')}
            style={{
              padding: '0.5rem 0.9rem',
              borderRadius: '8px',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: filterTab === 'rejected' ? '1.5px solid #dc2626' : '1px solid var(--color-border, #cbd5e1)',
              backgroundColor: filterTab === 'rejected' ? 'rgba(220, 38, 38, 0.1)' : 'transparent',
              color: filterTab === 'rejected' ? '#dc2626' : 'var(--color-text-muted, #64748b)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
            }}
          >
            <span>{isBn ? 'প্রত্যাখ্যাত ইতিহাস' : 'Rejected History'}</span>
            <span
              style={{
                fontSize: '0.72rem',
                padding: '0.1rem 0.45rem',
                borderRadius: '10px',
                backgroundColor: '#dc2626',
                color: '#ffffff',
              }}
            >
              {rejectedList.length}
            </span>
          </button>
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', minWidth: '220px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-muted, #94a3b8)',
            }}
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isBn ? 'শিক্ষার্থী খুঁজুন...' : 'Search student...'}
            style={{
              width: '100%',
              padding: '0.45rem 0.75rem 0.45rem 2rem',
              borderRadius: '8px',
              border: '1px solid var(--color-border, #cbd5e1)',
              fontSize: '0.82rem',
              backgroundColor: 'var(--background-alt, #fafbfc)',
            }}
          />
        </div>
      </div>

      {/* List Container */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {loading && exemptions.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted, #64748b)' }}>
            <RefreshCw className={styles.spin} size={24} style={{ margin: '0 auto 0.5rem' }} />
            <p>{isBn ? 'আবেদন লোড হচ্ছে...' : 'Loading requests...'}</p>
          </div>
        ) : filteredExemptions.length === 0 ? (
          <div
            style={{
              padding: '3rem 1.5rem',
              textAlign: 'center',
              backgroundColor: 'var(--surface, #ffffff)',
              borderRadius: '12px',
              border: '1px solid var(--color-border, #e2e8f0)',
              color: 'var(--color-text-muted, #64748b)',
            }}
          >
            <Smartphone size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
            <p style={{ margin: 0, fontSize: '0.92rem', fontWeight: 600 }}>
              {isBn ? 'কোনো আবেদন পাওয়া যায়নি।' : 'No exemption requests found.'}
            </p>
          </div>
        ) : (
          filteredExemptions.map((item) => (
            <div
              key={item.id}
              style={{
                backgroundColor: 'var(--surface, #ffffff)',
                borderRadius: '12px',
                border: '1px solid var(--color-border, #e2e8f0)',
                padding: '1.25rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(67, 56, 202, 0.1)',
                      color: '#4338ca',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1rem',
                    }}
                  >
                    {item.studentName?.charAt(0) || 'S'}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
                      {item.studentName}
                    </h4>
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted, #64748b)' }}>
                      {item.studentEmail} {item.studentPhone ? `• ${item.studentPhone}` : ''}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <span
                    style={{
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.6rem',
                      borderRadius: '8px',
                      backgroundColor:
                        item.status === 'approved'
                          ? '#d1fae5'
                          : item.status === 'rejected'
                          ? '#fee2e2'
                          : '#fef3c7',
                      color:
                        item.status === 'approved'
                          ? '#047857'
                          : item.status === 'rejected'
                          ? '#b91c1c'
                          : '#b45309',
                    }}
                  >
                    {item.status === 'approved'
                      ? (isBn ? 'অনুমোদিত' : 'Approved')
                      : item.status === 'rejected'
                      ? (isBn ? 'প্রত্যাখ্যাত' : 'Rejected')
                      : (isBn ? 'অপেক্ষমান' : 'Pending')}
                  </span>
                  <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted, #94a3b8)' }}>
                    {formatDate(item.createdAt)}
                  </span>
                </div>
              </div>

              {/* Student's Reason Box */}
              <div
                style={{
                  backgroundColor: 'var(--background-alt, #fafbfc)',
                  padding: '0.85rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border, #f1f5f9)',
                  fontSize: '0.84rem',
                  color: 'var(--text-main, #334155)',
                  lineHeight: 1.5,
                }}
              >
                <span style={{ fontWeight: 700, color: 'var(--text-main, #0f172a)', display: 'block', marginBottom: '0.2rem', fontSize: '0.78rem' }}>
                  {isBn ? 'ফোন নম্বর না থাকার কারণ:' : 'Reason for Phone Exemption:'}
                </span>
                &ldquo;{item.reason}&rdquo;
              </div>

              {/* If Approved: Validity Info */}
              {item.status === 'approved' && item.validUntil && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.8rem',
                    color: '#059669',
                    fontWeight: 600,
                    padding: '0.4rem 0.75rem',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(5, 150, 105, 0.08)',
                  }}
                >
                  <Calendar size={14} />
                  <span>
                    {isBn
                      ? `অব্যাহতির নির্ধারিত মেয়াদ: ${formatDate(item.validUntil)} পর্যন্ত`
                      : `Exemption Valid Until: ${formatDate(item.validUntil)}`}
                  </span>
                  {item.reviewedAt && (
                    <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--color-text-muted, #64748b)' }}>
                      {isBn ? `অনুমোদন তারিখ: ${formatDate(item.reviewedAt)}` : `Reviewed: ${formatDate(item.reviewedAt)}`}
                    </span>
                  )}
                </div>
              )}

              {/* If Rejected: Rejection Reason Info */}
              {item.status === 'rejected' && item.rejectionReason && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.8rem',
                    color: '#dc2626',
                    fontWeight: 600,
                    padding: '0.4rem 0.75rem',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(220, 38, 38, 0.08)',
                  }}
                >
                  <XCircle size={14} />
                  <span>
                    {isBn ? `বাতিলের কারণ: "${item.rejectionReason}"` : `Rejection Reason: "${item.rejectionReason}"`}
                  </span>
                  {item.reviewedAt && (
                    <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--color-text-muted, #64748b)' }}>
                      {isBn ? `তারিখ: ${formatDate(item.reviewedAt)}` : `Reviewed: ${formatDate(item.reviewedAt)}`}
                    </span>
                  )}
                </div>
              )}

              {/* Action Buttons (Only for Pending requests) */}
              {item.status === 'pending' && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: '0.65rem',
                    paddingTop: '0.5rem',
                    borderTop: '1px solid var(--color-border, #f1f5f9)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleOpenRejectModal(item)}
                    style={{
                      padding: '0.45rem 0.9rem',
                      borderRadius: '6px',
                      border: '1px solid #fecaca',
                      backgroundColor: '#fff1f2',
                      color: '#dc2626',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <X size={14} />
                    <span>{isBn ? 'বাতিল করুন' : 'Reject'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenApproveModal(item)}
                    style={{
                      padding: '0.45rem 1rem',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: 'var(--color-primary, #059669)',
                      color: '#ffffff',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      boxShadow: '0 2px 6px rgba(5, 150, 105, 0.2)',
                    }}
                  >
                    <Check size={14} />
                    <span>{isBn ? 'অনুমোদন ও মেয়াদ নির্ধারণ' : 'Approve & Set Expiry'}</span>
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* ====================================================================
          Approve Modal with Date Picker (Day, Month, Year)
          ==================================================================== */}
      {approveModalItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
            backdropFilter: 'blur(3px)',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--surface, #ffffff)',
              borderRadius: '14px',
              maxWidth: '480px',
              width: '100%',
              padding: '1.5rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={20} color="var(--color-primary, #059669)" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
                  {isBn ? 'ফোন অব্যাহতি অনুমোদন' : 'Approve Phone Exemption'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setApproveModalItem(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted, #94a3b8)' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.84rem', color: 'var(--color-text-muted, #64748b)', margin: '0 0 1rem', lineHeight: 1.5 }}>
              {isBn
                ? `শিক্ষার্থী ${approveModalItem.studentName}-এর ফোন নম্বর না থাকার আবেদনটি অনুমোদন করতে চান? শিক্ষার্থীকে কত তারিখ পর্যন্ত ফোন নম্বর ছাড়াই ব্যবহারের অনুমতি দেবেন তা নির্ধারণ করুন:`
                : `Set the validity date until which ${approveModalItem.studentName} can use the platform without a verified phone:`}
            </p>

            {/* Quick Preset Buttons */}
            <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <button
                type="button"
                onClick={() => setPresetDate(1)}
                style={{
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: '1px solid var(--color-border, #cbd5e1)',
                  backgroundColor: 'var(--background-alt, #fafbfc)',
                  cursor: 'pointer',
                }}
              >
                +১ {isBn ? 'মাস' : 'Month'}
              </button>
              <button
                type="button"
                onClick={() => setPresetDate(3)}
                style={{
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: '1px solid var(--color-border, #cbd5e1)',
                  backgroundColor: 'var(--background-alt, #fafbfc)',
                  cursor: 'pointer',
                }}
              >
                +৩ {isBn ? 'মাস' : 'Months'}
              </button>
              <button
                type="button"
                onClick={() => setPresetDate(6)}
                style={{
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: '1px solid var(--color-border, #cbd5e1)',
                  backgroundColor: 'var(--background-alt, #fafbfc)',
                  cursor: 'pointer',
                }}
              >
                +৬ {isBn ? 'মাস' : 'Months'}
              </button>
              <button
                type="button"
                onClick={() => setPresetDate(12)}
                style={{
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: '1px solid var(--color-border, #cbd5e1)',
                  backgroundColor: 'var(--background-alt, #fafbfc)',
                  cursor: 'pointer',
                }}
              >
                +১ {isBn ? 'বছর' : 'Year'}
              </button>
            </div>

            {/* Date Picker Input */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main, #0f172a)', marginBottom: '0.35rem' }}>
                {isBn ? 'অব্যাহতির শেষ তারিখ (দিন/মাস/বছর):' : 'Validity Expiry Date:'}
              </label>
              <input
                type="date"
                value={approveValidDate}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setApproveValidDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  border: '1.5px solid var(--color-primary, #059669)',
                  backgroundColor: 'var(--surface, #ffffff)',
                  color: 'var(--text-main, #0f172a)',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                }}
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted, #64748b)', marginTop: '0.3rem', display: 'block' }}>
                {isBn
                  ? 'এই তারিখ অতিক্রান্ত হলে এবং ফোন নম্বর যুক্ত না করলে একাউন্ট স্বয়ংক্রিয়ভাবে লক হয়ে যাবে।'
                  : 'Account will auto-lock if phone is not added before this date.'}
              </span>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
              <button
                type="button"
                onClick={() => setApproveModalItem(null)}
                style={{
                  padding: '0.55rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border, #cbd5e1)',
                  backgroundColor: 'transparent',
                  color: 'var(--color-text-muted, #64748b)',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmApproval}
                disabled={submittingAction || !approveValidDate}
                style={{
                  padding: '0.55rem 1.25rem',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: 'var(--color-primary, #059669)',
                  color: '#ffffff',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: submittingAction ? 'not-allowed' : 'pointer',
                  opacity: submittingAction ? 0.7 : 1,
                }}
              >
                {submittingAction ? (isBn ? 'অনুমোদন হচ্ছে...' : 'Approving...') : (isBn ? 'চূড়ান্ত অনুমোদন' : 'Confirm Approval')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          Reject Modal with Reason Textarea
          ==================================================================== */}
      {rejectModalItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
            backdropFilter: 'blur(3px)',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--surface, #ffffff)',
              borderRadius: '14px',
              maxWidth: '480px',
              width: '100%',
              padding: '1.5rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <XCircle size={20} color="#dc2626" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
                  {isBn ? 'আবেদন বাতিলের কারণ' : 'Reject Exemption Request'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRejectModalItem(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted, #94a3b8)' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.84rem', color: 'var(--color-text-muted, #64748b)', margin: '0 0 1rem', lineHeight: 1.5 }}>
              {isBn
                ? `শিক্ষার্থী ${rejectModalItem.studentName}-এর আবেদন রিজেক্ট করার কারণ উল্লেখ করুন। শিক্ষার্থী এই কারণ দেখতে পাবে এবং প্রয়োজনে পুনরায় আবেদন করতে পারবে:`
                : `Specify why ${rejectModalItem.studentName}'s request is being rejected. The student will see this note:`}
            </p>

            <textarea
              rows={4}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder={isBn ? 'রিজেক্ট করার যৌক্তিক কারণ লিখুন...' : 'Write rejection reason...'}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1.5px solid #fecaca',
                backgroundColor: 'var(--surface, #ffffff)',
                color: 'var(--text-main, #0f172a)',
                fontSize: '0.85rem',
                marginBottom: '1.25rem',
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
              <button
                type="button"
                onClick={() => setRejectModalItem(null)}
                style={{
                  padding: '0.55rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border, #cbd5e1)',
                  backgroundColor: 'transparent',
                  color: 'var(--color-text-muted, #64748b)',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {isBn ? 'ফিরে যান' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmRejection}
                disabled={submittingAction || !rejectionReason.trim()}
                style={{
                  padding: '0.55rem 1.25rem',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: submittingAction || !rejectionReason.trim() ? 'not-allowed' : 'pointer',
                  opacity: submittingAction || !rejectionReason.trim() ? 0.7 : 1,
                }}
              >
                {submittingAction ? (isBn ? 'বাতিল হচ্ছে...' : 'Rejecting...') : (isBn ? 'বাতিল নিশ্চিত করুন' : 'Confirm Rejection')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
