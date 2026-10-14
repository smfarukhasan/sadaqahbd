'use client';

import React from 'react';
import { Building2, X, Clock, AlertTriangle } from 'lucide-react';

export interface UnassignedUser {
  id: string;
  fullName?: string;
  email: string;
  phone?: string;
}

interface AssignOrgModalProps {
  isOpen: boolean;
  loading: boolean;
  confirmPopup: boolean;
  orgName: string;
  selectedUserId: string;
  unassignedUsers: UnassignedUser[];
  isBn: boolean;
  onClose: () => void;
  onSelectUser: (userId: string) => void;
  onNextStep: () => void;
  onBackStep: () => void;
  onConfirm: () => void;
}

export default function AssignOrgModal({
  isOpen,
  loading,
  confirmPopup,
  orgName,
  selectedUserId,
  unassignedUsers,
  isBn,
  onClose,
  onSelectUser,
  onNextStep,
  onBackStep,
  onConfirm,
}: AssignOrgModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem',
      }}
      onClick={() => {
        if (!loading) {
          onClose();
        }
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--surface, #ffffff)',
          borderRadius: '16px',
          maxWidth: '560px',
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid var(--color-border, #e2e8f0)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--color-border, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--surface-header, rgba(37, 99, 235, 0.04))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: 'rgba(37, 99, 235, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563eb',
              }}
            >
              <Building2 size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>
                {isBn ? 'প্রতিষ্ঠানের প্রশাসনিক ক্ষমতা অর্পণ' : 'Bind Organization Authority'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted, #64748b)' }}>
                {orgName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (!loading) {
                onClose();
              }
            }}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: 'var(--text-muted, #64748b)',
              padding: '0.25rem',
              borderRadius: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem' }}>
          {!confirmPopup ? (
            <>
              <div
                style={{
                  padding: '0.85rem 1rem',
                  backgroundColor: 'rgba(37, 99, 235, 0.06)',
                  border: '1px solid rgba(37, 99, 235, 0.2)',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  color: 'var(--text-main, #0f172a)',
                  marginBottom: '1.25rem',
                  lineHeight: 1.5,
                }}
              >
                <strong>ℹ️ {isBn ? 'সদস্য-প্রস্তাবিত প্রতিষ্ঠান:' : 'Member-Proposed Institution:'}</strong>{' '}
                {isBn
                  ? `"${orgName}" প্রতিষ্ঠানটি কোনো শিক্ষক বা শিক্ষার্থীর অনুরোধে তৈরি হয়েছে। এটি চূড়ান্ত অনুমোদন দিতে প্ল্যাটফর্মের একজন প্রাতিষ্ঠানিক অ্যাকাউন্ট ধারী নির্বাচন করুন যার নিয়ন্ত্রণে এই প্রতিষ্ঠানের পূর্ণ ক্ষমতা প্রদান করা হবে।`
                  : `"${orgName}" was suggested by a member. To complete verification, select an unassigned organization account to bind authority.`}
              </div>

              {loading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Clock size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '0.5rem' }} />
                  <p style={{ margin: 0 }}>{isBn ? 'অ্যাকাউন্ট লোড হচ্ছে...' : 'Loading accounts...'}</p>
                </div>
              ) : unassignedUsers.length === 0 ? (
                <div
                  style={{
                    padding: '1.25rem',
                    backgroundColor: '#fffbeb',
                    border: '1px solid #fde68a',
                    borderRadius: '10px',
                    color: '#92400e',
                    fontSize: '0.88rem',
                    textAlign: 'center',
                  }}
                >
                  <AlertTriangle size={24} style={{ margin: '0 auto 0.5rem', color: '#d97706' }} />
                  <p style={{ fontWeight: 700, margin: '0 0 0.25rem' }}>
                    {isBn ? 'কোনো বরাদ্দহীন প্রতিষ্ঠান অ্যাকাউন্ট নেই' : 'No Unassigned Organization Accounts'}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.82rem' }}>
                    {isBn
                      ? 'অনুমোদন দেওয়ার জন্য প্রথমে একটি প্রতিষ্ঠান রোল সম্পন্ন ইউজার অ্যাকাউন্ট রেজিস্টার অথবা তৈরি করুন।'
                      : 'Please register or create an organization-role user account first before approving.'}
                  </p>
                </div>
              ) : (
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      color: 'var(--text-main, #0f172a)',
                      marginBottom: '0.5rem',
                    }}
                  >
                    {isBn ? 'কর্তৃপক্ষ ইউজার নির্বাচন করুন:' : 'Select Authority Account:'}{' '}
                    <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => onSelectUser(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: '1px solid var(--color-border, #cbd5e1)',
                      backgroundColor: 'var(--surface, #ffffff)',
                      color: 'var(--text-main, #0f172a)',
                      fontSize: '0.9rem',
                      outline: 'none',
                    }}
                  >
                    <option value="">
                      -- {isBn ? 'প্রতিষ্ঠান অ্যাকাউন্ট বেছে নিন' : 'Select an organization account'} --
                    </option>
                    {unassignedUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName || u.email} — {u.email} {u.phone ? `(${u.phone})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.75rem' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={onClose}
                  disabled={loading}
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!selectedUserId || loading}
                  onClick={onNextStep}
                >
                  {isBn ? 'পরবর্তী ধাপ' : 'Next Step'}
                </button>
              </div>
            </>
          ) : (
            /* Confirmation Popup Mode */
            <div>
              <div
                style={{
                  padding: '1.25rem',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '12px',
                  color: '#991b1b',
                  marginBottom: '1.25rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <AlertTriangle size={20} color="#dc2626" />
                  <h4 style={{ margin: 0, fontWeight: 800, fontSize: '0.95rem' }}>
                    {isBn ? 'চূড়ান্ত ক্ষমতা অর্পণ নিশ্চিতকরণ' : 'Confirm Authority Assignment'}
                  </h4>
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.5 }}>
                  {isBn
                    ? `আপনি কি নিশ্চিত যে "${orgName}" প্রতিষ্ঠানের পূর্ণ প্রশাসনিক নিয়ন্ত্রণ নির্বাচিত অ্যাকাউন্টে প্রদান করবেন? অনুমোদনের পর উক্ত প্রতিষ্ঠান অ্যাকাউন্টে তাৎক্ষণিক অ্যাক্সেস চালু হয়ে যাবে।`
                    : `Are you sure you want to bind full institutional authority of "${orgName}" to the selected account? This will immediately activate the account.`}
                </p>
              </div>

              {(() => {
                const selected = unassignedUsers.find((u) => u.id === selectedUserId);
                if (!selected) return null;
                return (
                  <div
                    style={{
                      padding: '1rem',
                      backgroundColor: 'var(--surface-sunken, #f8fafc)',
                      borderRadius: '10px',
                      border: '1px solid var(--color-border, #e2e8f0)',
                      fontSize: '0.85rem',
                      color: 'var(--text-main, #0f172a)',
                    }}
                  >
                    <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>
                      {isBn ? 'নির্বাচিত কর্মকর্তা:' : 'Selected Account:'}
                    </div>
                    <div>👤 <strong>{selected.fullName || 'Unnamed'}</strong></div>
                    <div>✉️ {selected.email}</div>
                    {selected.phone && <div>📞 {selected.phone}</div>}
                  </div>
                );
              })()}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.75rem' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={onBackStep}
                  disabled={loading}
                >
                  {isBn ? 'পিছনে যান' : 'Go Back'}
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ backgroundColor: '#16a34a', borderColor: '#16a34a' }}
                  disabled={loading}
                  onClick={onConfirm}
                >
                  {loading
                    ? (isBn ? 'প্রক্রিয়াধীন...' : 'Processing...')
                    : (isBn ? 'হ্যাঁ, অনুমোদন ও ক্ষমতা অর্পণ করুন' : 'Confirm & Bind Authority')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
