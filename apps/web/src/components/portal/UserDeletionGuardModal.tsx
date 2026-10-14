'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Trash2,
  Loader2,
  CheckCircle2,
  Info,
  Phone,
  Mail,
  User as UserIcon,
  Building2,
} from 'lucide-react';
import { getApiUrl } from '../../lib/api-config';
import { getAuthToken } from '../../lib/auth-token';

interface UserDeletionGuardModalProps {
  isOpen: boolean;
  user: any | null;
  onClose: () => void;
  onDeleted?: () => void;
  isBn?: boolean;
}

export default function UserDeletionGuardModal({
  isOpen,
  user,
  onClose,
  onDeleted,
  isBn = true,
}: UserDeletionGuardModalProps) {
  const [loading, setLoading] = useState(true);
  const [eligibility, setEligibility] = useState<any>(null);
  const [confirmedCheck, setConfirmedCheck] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen && user?.id) {
      checkEligibility();
      setConfirmedCheck(false);
      setErrorMsg('');
    } else {
      setEligibility(null);
      setLoading(false);
    }
  }, [isOpen, user]);

  const checkEligibility = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      setErrorMsg('');
      const apiUrl = getApiUrl();
      const token = await getAuthToken();
      const res = await fetch(`${apiUrl}/users/${user.id}/deletion-eligibility`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to check deletion eligibility');
      }

      const data = await res.json();
      setEligibility(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'যাচাই করতে সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!user?.id || !eligibility?.canDelete || !confirmedCheck) return;

    try {
      setDeleting(true);
      setErrorMsg('');
      const apiUrl = getApiUrl();
      const token = await getAuthToken();
      const res = await fetch(`${apiUrl}/users/${user.id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || (isBn ? 'ডিলিট করা সম্ভব হয়নি' : 'Failed to delete user'));
      }

      if (onDeleted) onDeleted();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'ডিলিট করতে ত্রুটি দেখা দিয়েছে');
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen || !user) return null;

  const isBlocked = eligibility?.hasPlatformData || !eligibility?.canDelete;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(5px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !deleting) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '560px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: isBlocked ? '2px solid #fecaca' : '1px solid #e2e8f0',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: isBlocked ? '#fef2f2' : '#f8fafc',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {isBlocked ? (
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: '#fee2e2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#dc2626',
                  flexShrink: 0,
                }}
              >
                <ShieldAlert size={22} />
              </div>
            ) : (
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: '#ecfdf5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#059669',
                  flexShrink: 0,
                }}
              >
                <ShieldCheck size={22} />
              </div>
            )}
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: '1.05rem',
                  fontWeight: 800,
                  color: isBlocked ? '#991b1b' : '#0f172a',
                }}
              >
                {isBlocked
                  ? isBn
                    ? 'অ্যাকাউন্ট ডিলিট নিষিদ্ধ — প্ল্যাটফর্ম সততা ও স্বচ্ছতা'
                    : 'Account Deletion Prohibited — Platform Integrity Policy'
                  : isBn
                  ? 'ব্যক্তিগত তথ্যসম্পন্ন খালি অ্যাকাউন্ট যাচাইকরণ'
                  : 'Verified Empty Account (Personal Info Only)'}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                {isBn
                  ? 'প্ল্যাটফর্ম অডিট ট্রেইল ও ডেটা ইন্টিগ্রিটি গার্ডিয়ান'
                  : 'Platform Audit Trail & Data Integrity Guardian'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '0.4rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
          {/* User Preview Mini Card */}
          <div
            style={{
              padding: '0.85rem 1rem',
              borderRadius: '10px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
            }}
          >
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>
                {user.fullName || 'Unnamed User'}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', gap: '0.8rem', marginTop: '2px' }}>
                <span>{user.email}</span>
                {user.phone && <span>• {user.phone}</span>}
              </div>
            </div>
            <span
              style={{
                padding: '0.2rem 0.6rem',
                borderRadius: '14px',
                fontSize: '0.72rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                backgroundColor: '#e2e8f0',
                color: '#334155',
              }}
            >
              {user.role}
            </span>
          </div>

          {loading ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
              <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 0.75rem', color: 'var(--color-primary, #059669)' }} />
              <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                {isBn ? 'ব্যবহারকারীর প্ল্যাটফর্ম অডিট ও সততা যাচাই করা হচ্ছে...' : 'Auditing platform data integrity...'}
              </div>
            </div>
          ) : errorMsg ? (
            <div
              style={{
                padding: '1rem',
                borderRadius: '10px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                fontSize: '0.85rem',
                marginBottom: '1rem',
              }}
            >
              {errorMsg}
            </div>
          ) : isBlocked ? (
            /* BLOCKED STATE: User Has Platform Data */
            <div>
              <div
                style={{
                  padding: '1rem',
                  borderRadius: '10px',
                  backgroundColor: '#fff1f2',
                  border: '1px solid #fecdd3',
                  marginBottom: '1.25rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#be123c', fontWeight: 800, fontSize: '0.88rem', marginBottom: '0.5rem' }}>
                  <AlertTriangle size={18} />
                  <span>{isBn ? 'এই অ্যাকাউন্টটি ডিলিট করা কঠোরভাবে নিষিদ্ধ' : 'Deletion Strictly Prohibited'}</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#881337', lineHeight: 1.5 }}>
                  {isBn
                    ? 'প্ল্যাটফর্মের স্বচ্ছতা, সততা এবং অডিট ট্রেইল রক্ষার স্বার্থে যেসব অ্যাকাউন্টে কোনো কার্যক্রম বা রেকর্ড রয়েছে, তা ড্যাশবোর্ড থেকে মুছে ফেলা সম্পূর্ণভাবে নিষিদ্ধ।'
                    : 'To maintain platform auditability, transparency, and financial integrity, accounts with recorded platform activities cannot be deleted via the dashboard.'}
                </p>
              </div>

              {/* Specific Records Found */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#334155', marginBottom: '0.5rem' }}>
                  {isBn ? 'সংরক্ষিত প্ল্যাটফর্ম কার্যক্রমের তালিকা:' : 'Active Platform Records Found:'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {(isBn ? eligibility?.reasonsBn : eligibility?.reasonsEn)?.map((reason: string, idx: number) => (
                    <div
                      key={idx}
                      style={{
                        padding: '0.5rem 0.75rem',
                        borderRadius: '8px',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: '#1e293b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <Lock size={14} color="#dc2626" />
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Policy Directive & Software Company Contact Notice */}
              <div
                style={{
                  padding: '0.9rem 1rem',
                  borderRadius: '10px',
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fde68a',
                  fontSize: '0.78rem',
                  color: '#92400e',
                  lineHeight: 1.5,
                }}
              >
                <div style={{ fontWeight: 800, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Info size={14} />
                  <span>{isBn ? 'প্ল্যাটফর্ম সততা ও সফটওয়্যার নীতিমালা:' : 'Platform Integrity Policy Directive:'}</span>
                </div>
                <p style={{ margin: 0 }}>
                  {isBn
                    ? 'মূল কথা হলো শুধুমাত্র কোনো কার্যক্রম ছাড়া ব্যক্তিগত তথ্যসম্পন্ন খালি অ্যাকাউন্ট ডিলিটযোগ্য। কোনো ডাটা থাকা ইউজার প্ল্যাটফর্মের সততার জন্য ডিলিট করা যাবে না। একান্তই কোনো ডাটা রিমুভ করার প্রয়োজন হলে সফটওয়্যার কোম্পানির সাথে যোগাযোগ করতে হবে। নীতিগত স্বচ্ছতা ও সততা বজায় রাখতে সফটওয়্যার কোম্পানি সর্বদা আপসহীন।'
                    : 'Only empty accounts with purely personal information and zero platform transactions can be removed. Any account with platform data is locked for transparency. For extraordinary audit removal requests, contact the authorized software development company.'}
                </p>
              </div>
            </div>
          ) : (
            /* ALLOWED STATE: Purely personal info, empty account */
            <div>
              <div
                style={{
                  padding: '1rem',
                  borderRadius: '10px',
                  backgroundColor: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  marginBottom: '1.25rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#047857', fontWeight: 800, fontSize: '0.88rem', marginBottom: '0.5rem' }}>
                  <CheckCircle2 size={18} />
                  <span>{isBn ? 'যাচাই সম্পন্ন: কোনো প্ল্যাটফর্ম রেকর্ড নেই' : 'Audit Passed: Zero Platform Records'}</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#065f46', lineHeight: 1.5 }}>
                  {isBn
                    ? 'এই ব্যবহারকারীর কোনো আর্থিক অনুদান, পোস্ট, প্রাতিষ্ঠানিক কার্যক্রম বা অভিযোগের রেকর্ড নেই (শুধুমাত্র প্রাথমিক ব্যক্তিগত তথ্য বিদ্যমান)। প্ল্যাটফর্ম নীতিমালা অনুসারে এই খালি অ্যাকাউন্টটি অপসারণ করা সম্ভব।'
                    : 'This user has zero donations, student posts, institutional records, or complaints (solely personal profile data). Deletion is permitted under policy.'}
                </p>
              </div>

              {/* Confirmation Checkbox */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.65rem',
                  cursor: 'pointer',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#f8fafc',
                  fontSize: '0.82rem',
                  color: '#334155',
                  fontWeight: 600,
                  lineHeight: 1.4,
                }}
              >
                <input
                  type="checkbox"
                  checked={confirmedCheck}
                  onChange={(e) => setConfirmedCheck(e.target.checked)}
                  style={{ marginTop: '2px', cursor: 'pointer' }}
                />
                <span>
                  {isBn
                    ? 'আমি নিশ্চিত যে এই অ্যাকাউন্টটির কোনো প্ল্যাটফর্ম কার্যক্রম নেই এবং এটি স্থায়ীভাবে ডিলিট করতে সম্মত।'
                    : 'I confirm that this account has zero platform records and I agree to permanently delete it.'}
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
          }}
        >
          {isBlocked ? (
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.55rem 1.25rem',
                borderRadius: '8px',
                backgroundColor: '#0f172a',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              {isBn ? 'বুঝেছি / বন্ধ করুন' : 'Understood / Close'}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={deleting}
                style={{
                  padding: '0.55rem 1.1rem',
                  borderRadius: '8px',
                  backgroundColor: '#ffffff',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={!confirmedCheck || deleting}
                style={{
                  padding: '0.55rem 1.25rem',
                  borderRadius: '8px',
                  backgroundColor: confirmedCheck && !deleting ? '#dc2626' : '#fca5a5',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: confirmedCheck && !deleting ? 'pointer' : 'not-allowed',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                {deleting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>{isBn ? 'মুছে ফেলা হচ্ছে...' : 'Deleting...'}</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    <span>{isBn ? 'স্থায়ীভাবে ডিলিট করুন' : 'Confirm Delete'}</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
