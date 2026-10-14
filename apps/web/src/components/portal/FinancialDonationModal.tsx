'use client';

import React, { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from '../../i18n/routing';
import { useAuthStore } from '../../lib/auth-store';
import { getApiUrl } from '../../lib/api-config';
import { getAuthToken } from '../../lib/auth-token';
import {
  Heart,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  CreditCard,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface FinancialDonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultPostId?: string;
  defaultPostTitle?: string;
  isDirectOnly?: boolean;
  defaultAmount?: string | number;
}

export default function FinancialDonationModal({
  isOpen,
  onClose,
  onSuccess,
  defaultPostId,
  defaultPostTitle,
  isDirectOnly,
  defaultAmount,
}: FinancialDonationModalProps) {
  const locale = useLocale();
  const isBn = locale === 'bn';
  const router = useRouter();

  const user = useAuthStore((s) => s.user);
  const firebaseUser = useAuthStore((s) => s.firebaseUser);

  const [isRandom, setIsRandom] = useState(isDirectOnly ? false : !defaultPostId);
  const [postId, setPostId] = useState(defaultPostId || '');
  const [publicPosts, setPublicPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  const [amount, setAmount] = useState('500');
  const [paymentMethod, setPaymentMethod] = useState('Mobile Banking');
  const [trxId, setTrxId] = useState('');
  const [donorNote, setDonorNote] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setSuccessMsg('');
      setTrxId('');
      setDonorNote('');
      setAmount(defaultAmount ? String(defaultAmount) : '500');
      if (defaultPostId) {
        setPostId(defaultPostId);
        setIsRandom(false);
      } else if (isDirectOnly) {
        setIsRandom(false);
      }
    }
  }, [isOpen, defaultPostId, isDirectOnly, defaultAmount]);

  useEffect(() => {
    if (isOpen && !isRandom && !defaultPostId) {
      setLoadingPosts(true);
      const apiUrl = getApiUrl();
      fetch(`${apiUrl}/posts/public`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setPublicPosts(data);
            if (data.length > 0 && !postId) {
              setPostId(data[0].id);
            }
          }
        })
        .catch(() => {})
        .finally(() => setLoadingPosts(false));
    }
  }, [isOpen, isRandom, defaultPostId, postId]);

  if (!isOpen) return null;

  const getEffectiveAmount = (): number => {
    return Number(amount) || 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push(`/login?redirect=/donor` as any);
      return;
    }

    if (!isRandom && !postId.trim()) {
      setErrorMsg(
        isBn
          ? 'অনুগ্রহ করে সহায়তার জন্য একজন শিক্ষার্থী নির্বাচন করুন।'
          : 'Please select a student campaign to donate to.'
      );
      return;
    }

    const finalAmt = getEffectiveAmount();
    if (!finalAmt || finalAmt < 10) {
      setErrorMsg(
        isBn
          ? 'অনুগ্রহ করে সর্বনিম্ন ১০ টাকার সহায়তা অ্যামাউন্ট লিখুন।'
          : 'Please enter a valid donation amount (min ৳10).'
      );
      return;
    }

    if (!trxId.trim()) {
      setErrorMsg(
        isBn
          ? 'পেমেন্টের ট্রানজেকশন আইডি / রেফারেন্স নম্বর আবশ্যক।'
          : 'Transaction ID / Reference number is required.'
      );
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const token = await getAuthToken();
      const apiUrl = getApiUrl();

      const res = await fetch(`${apiUrl}/donations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          isRandom,
          postId: isRandom ? undefined : postId.trim(),
          amount: finalAmt,
          paymentMethod,
          transactionReference: trxId.trim(),
          donorNote: donorNote.trim() || undefined,
          isAnonymous,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || (isBn ? 'আবেদন ব্যর্থ হয়েছে' : 'Submission failed'));
      }

      setSuccessMsg(
        isBn
          ? isRandom
            ? 'সাধারণ শিক্ষা তহবিলে আপনার অর্থ সহায়তার আবেদনটি সফলভাবে জমা হয়েছে! এটি এডমিন ভেরিফিকেশনের পর লেজারে যুক্ত হবে।'
            : 'সরাসরি শিক্ষার্থীর অ্যাকাউন্টে অর্থ সহায়তার আবেদনটি সফলভাবে জমা হয়েছে! এডমিন ভেরিফিকেশনের পর শিক্ষার্থীর প্রাপ্ত অর্থ বৃদ্ধি পাবে।'
          : 'Financial aid request submitted! Pending admin verification.'
      );

      if (onSuccess) onSuccess();

      setTimeout(() => {
        onClose();
      }, 2500);
    } catch (err: any) {
      setErrorMsg(err.message || (isBn ? 'ত্রুটি দেখা দিয়েছে' : 'An error occurred'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          backgroundColor: 'var(--surface, #ffffff)',
          border: '1px solid var(--surface-border, #e2e8f0)',
          borderRadius: 'var(--radius-xl, 24px)',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--surface-border, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--background-alt, #f8fafc)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '10px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981',
              }}
            >
              <Heart size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                {isBn ? 'শিক্ষার্থীর জন্য অর্থ সহায়তা প্রদান' : 'Provide Financial Aid for Student'}
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                {isBn
                  ? 'আপনার অনুদান সবচেয়ে জরুরি ও পিছিয়ে থাকা শিক্ষার্থীদের জন্য কর্তৃপক্ষের সিদ্ধান্ত অনুসারে যুক্ত করা হবে।'
                  : 'Your donation will be allocated according to authority decision.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.4rem',
              borderRadius: '8px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          {errorMsg && (
            <div
              style={{
                padding: '0.85rem 1rem',
                backgroundColor: 'var(--danger-light, #fef2f2)',
                color: '#ef4444',
                borderRadius: 'var(--radius-md, 12px)',
                marginBottom: '1.25rem',
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div
              style={{
                padding: '1rem 1.25rem',
                backgroundColor: 'var(--success-light, #ecfdf5)',
                color: '#10b981',
                borderRadius: 'var(--radius-md, 12px)',
                marginBottom: '1.25rem',
                fontSize: '0.9rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
              }}
            >
              <CheckCircle2 size={22} />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {/* Donation Destination Selector */}
            {defaultPostId ? (
              <div
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                  border: '1.5px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}
              >
                <ShieldCheck size={26} color="#10b981" style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '0.78rem', color: '#047857', fontWeight: 700 }}>
                    {isBn ? 'সরাসরি শিক্ষার্থী ক্যাম্পেইনে অনুদান' : 'Direct Student Campaign Aid'}
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    {defaultPostTitle || (isBn ? 'নির্দিষ্ট শিক্ষার্থী আবেদন' : 'Student Campaign')}
                  </div>
                </div>
              </div>
            ) : !isDirectOnly ? (
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.45rem' }}>
                  {isBn ? 'অনুদানের খাত / প্রাপক *' : 'Donation Destination *'}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setIsRandom(true)}
                    style={{
                      padding: '0.65rem 0.5rem',
                      borderRadius: 'var(--radius-md, 10px)',
                      border: isRandom ? '2px solid #10b981' : '1px solid var(--surface-border, #cbd5e1)',
                      backgroundColor: isRandom ? 'rgba(16,185,129,0.1)' : 'var(--background, #f8fafc)',
                      color: isRandom ? '#10b981' : 'var(--text-main)',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                    }}
                  >
                    {isBn ? 'সাধারণ শিক্ষা তহবিল' : 'General Pool Fund'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsRandom(false)}
                    style={{
                      padding: '0.65rem 0.5rem',
                      borderRadius: 'var(--radius-md, 10px)',
                      border: !isRandom ? '2px solid #10b981' : '1px solid var(--surface-border, #cbd5e1)',
                      backgroundColor: !isRandom ? 'rgba(16,185,129,0.1)' : 'var(--background, #f8fafc)',
                      color: !isRandom ? '#10b981' : 'var(--text-main)',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                    }}
                  >
                    {isBn ? 'নির্দিষ্ট শিক্ষার্থী' : 'Specific Student'}
                  </button>
                </div>

                {!isRandom && (
                  <div>
                    {loadingPosts ? (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {isBn ? 'শিক্ষার্থী তালিকা লোড হচ্ছে...' : 'Loading students...'}
                      </div>
                    ) : publicPosts.length === 0 ? (
                      <div style={{ fontSize: '0.85rem', color: '#ef4444' }}>
                        {isBn ? 'কোনো যাচাইকৃত শিক্ষার্থী আবেদন সক্রিয় নেই।' : 'No active student campaigns found.'}
                      </div>
                    ) : (
                      <select
                        value={postId}
                        onChange={(e) => setPostId(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.85rem',
                          borderRadius: 'var(--radius-md, 10px)',
                          border: '1px solid var(--surface-border, #cbd5e1)',
                          backgroundColor: 'var(--background, #ffffff)',
                          color: 'var(--text-main)',
                          fontSize: '0.88rem',
                        }}
                      >
                        {publicPosts.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.title} — {p.studentName || p.studentFullName || 'শিক্ষার্থী'} (বাকি: ৳{Number(p.remainingAmount || 0).toLocaleString()})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
              </div>
            ) : null}

            {/* Amount Selection */}
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.5rem' }}>
                {isBn ? 'সহায়তার পরিমাণ (৳) *' : 'Donation Amount (৳) *'}
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
                {['100', '200', '500', '1000'].map((amt) => {
                  const isSelected = amount === amt;
                  return (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAmount(amt)}
                      style={{
                        padding: '0.65rem 0.5rem',
                        borderRadius: 'var(--radius-md, 10px)',
                        border: isSelected ? '2px solid #10b981' : '1px solid var(--surface-border, #cbd5e1)',
                        backgroundColor: isSelected ? 'var(--primary-light, rgba(16,185,129,0.12))' : 'var(--background, #f8fafc)',
                        color: isSelected ? '#059669' : 'var(--text-main)',
                        fontWeight: 700,
                        fontSize: '0.92rem',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      ৳{amt}
                    </button>
                  );
                })}
              </div>

              <input
                type="number"
                min="10"
                required
                placeholder={isBn ? 'টাকার পরিমাণ লিখুন (যেমন: ৫০০)' : 'Enter amount in BDT'}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md, 10px)',
                  border: '1.5px solid var(--surface-border, #cbd5e1)',
                  backgroundColor: 'var(--background, #ffffff)',
                  color: 'var(--text-main)',
                  fontSize: '1rem',
                  fontWeight: 700,
                }}
              />
            </div>

            {/* Payment Method */}
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.35rem' }}>
                {isBn ? 'পেমেন্ট মাধ্যম *' : 'Payment Method *'}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                {[
                  { id: 'Mobile Banking', nameBn: 'মোবাইল ব্যাংকিং', nameEn: 'Mobile Banking' },
                  { id: 'Online Banking', nameBn: 'অনলাইন ব্যাংকিং', nameEn: 'Online Banking' },
                  { id: 'Handcash', nameBn: 'হ্যান্ডক্যাশ', nameEn: 'Handcash' },
                  { id: 'Others', nameBn: 'অন্যান্য', nameEn: 'Others' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    style={{
                      padding: '0.6rem 0.4rem',
                      borderRadius: 'var(--radius-md, 10px)',
                      border: paymentMethod === m.id ? '2px solid #10b981' : '1px solid var(--surface-border, #cbd5e1)',
                      backgroundColor: paymentMethod === m.id ? 'var(--primary-light, rgba(16,185,129,0.1))' : 'var(--background, #f8fafc)',
                      color: paymentMethod === m.id ? '#10b981' : 'var(--text-main)',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                    }}
                  >
                    {isBn ? m.nameBn : m.nameEn}
                  </button>
                ))}
              </div>
            </div>

            {/* Transaction ID */}
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.35rem' }}>
                {isBn ? 'ট্রানজেকশন আইডি / রেফারেন্স নম্বর *' : 'Transaction ID / Reference *'}
              </label>
              <input
                type="text"
                placeholder={isBn ? 'যেমন: 9B7X2K4L1P' : 'e.g. 9B7X2K4L1P'}
                value={trxId}
                onChange={(e) => setTrxId(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.7rem 0.9rem',
                  borderRadius: 'var(--radius-md, 10px)',
                  border: '1px solid var(--surface-border, #cbd5e1)',
                  backgroundColor: 'var(--background, #ffffff)',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem',
                }}
              />
            </div>

            {/* Donor Note */}
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.35rem' }}>
                {isBn ? 'দোয়া বা বার্তা (ঐচ্ছিক)' : 'Prayer / Note (Optional)'}
              </label>
              <textarea
                rows={2}
                placeholder={isBn ? 'শিক্ষার্থীর জন্য শুভকামনা বা বিশেষ বার্তা লিখুন...' : 'Write prayer or good wishes...'}
                value={donorNote}
                onChange={(e) => setDonorNote(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.7rem 0.9rem',
                  borderRadius: 'var(--radius-md, 10px)',
                  border: '1px solid var(--surface-border, #cbd5e1)',
                  backgroundColor: 'var(--background, #ffffff)',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Anonymous / Hide Identity Checkbox */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.65rem',
                padding: '0.85rem',
                backgroundColor: isAnonymous ? 'rgba(16, 185, 129, 0.08)' : 'var(--surface-border-subtle, rgba(0,0,0,0.03))',
                borderRadius: 'var(--radius-md, 10px)',
                border: isAnonymous ? '1.5px solid #10b981' : '1px solid var(--surface-border, #cbd5e1)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onClick={() => setIsAnonymous(!isAnonymous)}
            >
              <input
                type="checkbox"
                id="isAnonymousFinancial"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                style={{
                  width: '18px',
                  height: '18px',
                  accentColor: '#10b981',
                  cursor: 'pointer',
                  marginTop: '2px',
                }}
              />
              <label
                htmlFor="isAnonymousFinancial"
                style={{
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  color: 'var(--text-main)',
                  userSelect: 'none',
                }}
              >
                <strong style={{ display: 'block', color: isAnonymous ? '#059669' : 'var(--text-main)' }}>
                  {isBn ? 'পরিচয় গোপন রাখতে চাই (পাবলিক লেজারে বেনামী)' : 'Keep identity anonymous in public ledger'}
                </strong>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                  {isBn
                    ? 'টিক দিলে পাবলিক হিসাব বইতে আপনার নাম "গোপন রাখা হয়েছে" হিসেবে দেখাবে। তবে মাস্টার এডমিন ও অনুমোদিত কর্তৃপক্ষ স্বচ্ছতা নিশ্চিতকরণে অভ্যন্তরীণভাবে দেখতে পারবে।'
                    : 'Your name will show as anonymous on the public transparency ledger. Admins can verify internally.'}
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                marginTop: '0.5rem',
                padding: '0.85rem',
                borderRadius: 'var(--radius-md, 12px)',
                fontWeight: 700,
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                backgroundColor: '#10b981',
                border: 'none',
                color: '#ffffff',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>{isBn ? 'জমা হচ্ছে...' : 'Submitting...'}</span>
                </>
              ) : (
                <>
                  <Send size={18} />
                  <span>
                    {isBn
                      ? `৳${getEffectiveAmount().toLocaleString('bn-BD')} অর্থ সহায়তা জমা দিন`
                      : `Submit ৳${getEffectiveAmount().toLocaleString('en-US')} Financial Aid`}
                  </span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
