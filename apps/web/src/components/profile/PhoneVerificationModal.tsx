'use client';

import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  X,
  Send,
  RefreshCw,
  Plus,
  Trash2,
  FileText,
  Clock,
  ArrowRight,
  Info,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { getApiUrl } from '@/lib/api-config';
import { getAuthToken } from '@/lib/auth-token';
import { UserRole } from '@sadaqahbd/schema';

interface PhoneVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  isBn?: boolean;
  mode?: 'verify_mandatory' | 'manage_phones';
  onSuccess?: () => void;
}

export default function PhoneVerificationModal({
  isOpen,
  onClose,
  isBn = true,
  mode = 'verify_mandatory',
  onSuccess,
}: PhoneVerificationModalProps) {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  // Phone input & OTP state
  const [phone, setPhone] = useState<string>(user?.phone || '');
  const [otpCode, setOtpCode] = useState<string>('');
  const [step, setStep] = useState<'input_phone' | 'enter_otp' | 'manage_list'>('input_phone');
  const [isSecondaryAdding, setIsSecondaryAdding] = useState<boolean>(false);

  // Verified phones list (for manage_phones mode)
  const [verifiedPhones, setVerifiedPhones] = useState<any[]>([]);
  const [loadingPhones, setLoadingPhones] = useState<boolean>(false);

  // Student Exemption Request state
  const [showExemptionForm, setShowExemptionForm] = useState<boolean>(false);
  const [exemptionReason, setExemptionReason] = useState<string>('');
  const [studentExemptionStatus, setStudentExemptionStatus] = useState<any>(null);
  const [submittingExemption, setSubmittingExemption] = useState<boolean>(false);

  // Timers & loading
  const [sendingOtp, setSendingOtp] = useState<boolean>(false);
  const [verifyingOtp, setVerifyingOtp] = useState<boolean>(false);
  const [deletingPhone, setDeletingPhone] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const isStudent = user?.role === UserRole.STUDENT;

  // Load verified phones & student exemption status on modal open
  const loadVerifiedPhones = async () => {
    try {
      setLoadingPhones(true);
      const token = await getAuthToken();
      const res = await fetch(`${getApiUrl()}/sms/my-phones`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      if (res.ok) {
        const list = await res.json();
        setVerifiedPhones(list || []);
      }
    } catch (err) {
      console.error('Error fetching verified phones:', err);
    } finally {
      setLoadingPhones(false);
    }
  };

  const loadStudentExemption = async () => {
    if (!isStudent) return;
    try {
      const token = await getAuthToken();
      const res = await fetch(`${getApiUrl()}/sms/student-exemption`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        setStudentExemptionStatus(data);
      }
    } catch (err) {
      console.error('Error fetching student exemption:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setFeedback(null);
      setOtpCode('');
      setPhone(user?.phone || '');
      loadVerifiedPhones();
      loadStudentExemption();

      if (mode === 'manage_phones') {
        setStep('manage_list');
      } else {
        setStep('input_phone');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mode]);

  // Resend OTP countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  if (!isOpen) return null;

  // Handle Send OTP
  const handleSendOtp = async (targetPhone = phone, isSecondary = isSecondaryAdding) => {
    const clean = targetPhone.replace(/[^\d+]/g, '');
    if (!clean || clean.length < 11) {
      setFeedback({
        type: 'error',
        text: isBn ? 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।' : 'Please enter a valid 11-digit phone number.',
      });
      return;
    }

    try {
      setSendingOtp(true);
      setFeedback(null);
      const token = await getAuthToken();

      const res = await fetch(`${getApiUrl()}/sms/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: JSON.stringify({
          phone: clean,
          isSecondary,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStep('enter_otp');
        setResendCooldown(60);
        setFeedback({
          type: 'success',
          text: data.message || (isBn ? 'আপনার নম্বরে ৬ ডিজিটের ওটিপি পাঠানো হয়েছে।' : 'OTP has been sent to your phone.'),
        });
      } else {
        setFeedback({
          type: 'error',
          text: data.message || (isBn ? 'ওটিপি পাঠাতে সমস্যা হয়েছে।' : 'Failed to send OTP.'),
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err?.message || (isBn ? 'সার্ভারে সংযোগ করা যায়নি।' : 'Server connection error.'),
      });
    } finally {
      setSendingOtp(false);
    }
  };

  // Handle Verify OTP
  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.trim().length !== 6) {
      setFeedback({
        type: 'error',
        text: isBn ? '৬ ডিজিটের সঠিক ওটিপি কোড লিখুন।' : 'Enter the 6-digit OTP code.',
      });
      return;
    }

    try {
      setVerifyingOtp(true);
      setFeedback(null);
      const token = await getAuthToken();

      const res = await fetch(`${getApiUrl()}/sms/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: JSON.stringify({
          phone,
          otpCode: otpCode.trim(),
          isSecondary: isSecondaryAdding,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Update user in auth store
        if (user) {
          setUser({
            ...user,
            phone: isSecondaryAdding ? user.phone : phone,
            isPhoneVerified: true,
            secondaryPhone: isSecondaryAdding ? phone : user.secondaryPhone,
            isSecondaryPhoneVerified: isSecondaryAdding ? true : user.isSecondaryPhoneVerified,
          });
        }

        setFeedback({
          type: 'success',
          text: data.message || (isBn ? 'ফোন নম্বর সফলভাবে ভেরিফাই হয়েছে!' : 'Phone verified successfully!'),
        });

        loadVerifiedPhones();

        if (mode === 'verify_mandatory') {
          setTimeout(() => {
            if (onSuccess) onSuccess();
            onClose();
          }, 1200);
        } else {
          setStep('manage_list');
          setIsSecondaryAdding(false);
        }
      } else {
        setFeedback({
          type: 'error',
          text: data.message || (isBn ? 'ভুল ওটিপি কোড প্রদান করা হয়েছে।' : 'Invalid OTP code.'),
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err?.message || (isBn ? 'যাচাই প্রক্রিয়া সম্পন্ন করা যায়নি।' : 'Verification failed.'),
      });
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Handle Remove Verified Phone (Only if 2 verified numbers exist)
  const handleRemovePhone = async (phoneToRemove: string) => {
    if (verifiedPhones.length <= 1) {
      setFeedback({
        type: 'error',
        text: isBn
          ? 'আপনার একাউন্টে শুধুমাত্র ১টি নম্বর রয়েছে। নতুন আরেকটি নম্বর ভেরিফাই না করা পর্যন্ত এটি মোছা যাবে না।'
          : 'You must have 2 verified numbers to remove one.',
      });
      return;
    }

    try {
      setDeletingPhone(phoneToRemove);
      setFeedback(null);
      const token = await getAuthToken();

      const res = await fetch(`${getApiUrl()}/sms/my-phones/${encodeURIComponent(phoneToRemove)}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({
          type: 'success',
          text: data.message || (isBn ? 'ফোন নম্বরটি সফলভাবে রিমুভ করা হয়েছে।' : 'Phone removed successfully.'),
        });
        loadVerifiedPhones();
      } else {
        setFeedback({
          type: 'error',
          text: data.message || (isBn ? 'রিমুভ করা সম্ভব হয়নি।' : 'Could not remove phone.'),
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err?.message || (isBn ? 'সার্ভারে সংযোগে সমস্যা।' : 'Connection error.'),
      });
    } finally {
      setDeletingPhone(null);
    }
  };

  // Handle Student Exemption Application
  const handleSubmitStudentExemption = async () => {
    if (!exemptionReason || exemptionReason.trim().length < 10) {
      setFeedback({
        type: 'error',
        text: isBn
          ? 'অনুগ্রহ করে ফোন নম্বর না থাকার বিস্তারিত কারণ লিখুন (কমপক্ষে ১০ অক্ষর)।'
          : 'Please provide detailed reason (at least 10 characters).',
      });
      return;
    }

    try {
      setSubmittingExemption(true);
      setFeedback(null);
      const token = await getAuthToken();

      const res = await fetch(`${getApiUrl()}/sms/student-exemption`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: JSON.stringify({ reason: exemptionReason.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({
          type: 'success',
          text: data.message || (isBn ? 'আবেদন সফলভাবে জমা হয়েছে।' : 'Application submitted.'),
        });
        setShowExemptionForm(false);
        loadStudentExemption();
      } else {
        setFeedback({
          type: 'error',
          text: data.message || (isBn ? 'আবেদন জমা দেওয়া যায়নি।' : 'Failed to submit application.'),
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err?.message || (isBn ? 'সার্ভারে সংযোগ করা যায়নি।' : 'Connection error.'),
      });
    } finally {
      setSubmittingExemption(false);
    }
  };

  // Format date helper
  const formatDate = (dStr?: string) => {
    if (!dStr) return '';
    try {
      return new Date(dStr).toLocaleDateString(isBn ? 'bn-BD' : 'en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dStr;
    }
  };

  const isExemptActive = studentExemptionStatus?.isExemptActive;
  const exemptionValidUntil = studentExemptionStatus?.phoneExemptionValidUntil;
  const latestExemptionRequest = studentExemptionStatus?.latestRequest;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--surface, #ffffff)',
          borderRadius: '16px',
          maxWidth: '490px',
          width: '100%',
          padding: '1.75rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          position: 'relative',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'rgba(5, 150, 105, 0.1)',
                color: 'var(--color-primary, #059669)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Smartphone size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>
                {mode === 'manage_phones'
                  ? (isBn ? 'ভেরিফাইড ফোন নম্বর সমূহ' : 'Verified Phone Numbers')
                  : (isBn ? 'ফোন নম্বর ভেরিফিকেশন' : 'Phone Verification')}
              </h3>
              <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted, #64748b)' }}>
                {isBn ? 'নিরাপত্তা ও ওটিপি নিশ্চিতকরণ' : 'Security & OTP Confirmation'}
              </span>
            </div>
          </div>

          {/* Allow close if manage mode, or if student has active exemption */}
          {(mode === 'manage_phones' || isExemptActive) && (
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-text-muted, #94a3b8)',
                cursor: 'pointer',
                padding: '0.2rem',
              }}
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Feedback message */}
        {feedback && (
          <div
            style={{
              padding: '0.85rem 1rem',
              borderRadius: '8px',
              backgroundColor: feedback.type === 'success' ? '#ecfdf5' : '#fef2f2',
              border: `1px solid ${feedback.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
              color: feedback.type === 'success' ? '#065f46' : '#991b1b',
              fontSize: '0.84rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem',
            }}
          >
            {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* If Student Has Active Exemption Banner */}
        {isStudent && isExemptActive && (
          <div
            style={{
              backgroundColor: '#ecfdf5',
              border: '1.5px solid #059669',
              borderRadius: '10px',
              padding: '0.9rem',
              marginBottom: '1.25rem',
              color: '#065f46',
              fontSize: '0.84rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, marginBottom: '0.25rem' }}>
              <ShieldCheck size={16} color="#059669" />
              <span>{isBn ? 'ফোন নম্বর অব্যাহতি সক্রিয়' : 'Phone Exemption Active'}</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', lineHeight: 1.4 }}>
              {isBn
                ? `আপনি ${formatDate(exemptionValidUntil)} পর্যন্ত ফোন নম্বর ছাড়াই প্ল্যাটফর্ম ব্যবহার করতে পারবেন। চাইলে যেকোনো সময় নিচে নম্বর ভেরিফাই করতে পারেন।`
                : `Your exemption is valid until ${formatDate(exemptionValidUntil)}. You may add a verified phone at any time.`}
            </p>
          </div>
        )}

        {/* If Student Has Pending Exemption Request */}
        {isStudent && latestExemptionRequest?.status === 'pending' && !isExemptActive && (
          <div
            style={{
              backgroundColor: '#fef3c7',
              border: '1px solid #f59e0b',
              borderRadius: '10px',
              padding: '0.9rem',
              marginBottom: '1.25rem',
              color: '#92400e',
              fontSize: '0.84rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, marginBottom: '0.25rem' }}>
              <Clock size={16} color="#d97706" />
              <span>{isBn ? 'অব্যাহতি আবেদন পর্যালোচনায় রয়েছে' : 'Exemption Pending Review'}</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', lineHeight: 1.4 }}>
              {isBn
                ? 'আপনার ফোন নম্বর না থাকার আবেদনটি এডমিন পর্যালোচনায় রয়েছে। অনুমোদন হলে আপনি নোটিফিকেশন পাবেন।'
                : 'Your exemption request is under administrative review.'}
            </p>
          </div>
        )}

        {/* If Student Exemption was Rejected, Show Note */}
        {isStudent && latestExemptionRequest?.status === 'rejected' && !showExemptionForm && (
          <div
            style={{
              backgroundColor: '#fee2e2',
              border: '1px solid #ef4444',
              borderRadius: '10px',
              padding: '0.9rem',
              marginBottom: '1.25rem',
              color: '#991b1b',
              fontSize: '0.84rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, marginBottom: '0.25rem' }}>
              <AlertTriangle size={16} color="#dc2626" />
              <span>{isBn ? 'আগের আবেদন প্রত্যাখ্যাত হয়েছিল' : 'Previous Request Rejected'}</span>
            </div>
            <p style={{ margin: '0 0 0.4rem', fontSize: '0.8rem', lineHeight: 1.4 }}>
              {isBn
                ? `কারণ: "${latestExemptionRequest.rejectionReason || 'তথ্য অপর্যাপ্ত'}"`
                : `Reason: "${latestExemptionRequest.rejectionReason || 'Insufficient details'}"`}
            </p>
            <button
              type="button"
              onClick={() => setShowExemptionForm(true)}
              style={{
                background: 'none',
                border: 'none',
                color: '#b91c1c',
                fontWeight: 700,
                fontSize: '0.78rem',
                textDecoration: 'underline',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              {isBn ? 'নতুন কারণ সহ পুনরায় আবেদন করুন' : 'Re-apply with updated reason'}
            </button>
          </div>
        )}

        {/* ====================================================================
            VIEW: Student Exemption Application Form
            ==================================================================== */}
        {showExemptionForm ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.75rem' }}>
              <FileText size={18} color="#4338ca" />
              <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
                {isBn ? 'ফোন নম্বর না থাকার আবেদনপত্র' : 'Phone Exemption Request Form'}
              </h4>
            </div>

            <p style={{ margin: '0 0 0.85rem', fontSize: '0.82rem', color: 'var(--color-text-muted, #64748b)', lineHeight: 1.45 }}>
              {isBn
                ? 'আপনার নিজস্ব কোনো ফোন নম্বর বা বাটন ফোন না থাকলে বিস্তারিত কারণ উল্লেখ করুন। এডমিন এটি পর্যালোচনা করে একটি নির্দিষ্ট সময়সীমার জন্য ছাড়পত্র প্রদান করবেন।'
                : 'Explain in detail why you do not have access to a personal phone. Admins will review and grant temporary access.'}
            </p>

            <textarea
              rows={4}
              value={exemptionReason}
              onChange={(e) => setExemptionReason(e.target.value)}
              placeholder={isBn ? 'ফোন নম্বর না থাকার বিস্তারিত কারণ লিখুন...' : 'Write your reason here...'}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1.5px solid var(--color-border, #cbd5e1)',
                backgroundColor: 'var(--surface, #ffffff)',
                color: 'var(--text-main, #0f172a)',
                fontSize: '0.85rem',
                marginBottom: '1rem',
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
              <button
                type="button"
                onClick={() => setShowExemptionForm(false)}
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
                {isBn ? 'ফিরে যান' : 'Back'}
              </button>
              <button
                type="button"
                onClick={handleSubmitStudentExemption}
                disabled={submittingExemption || !exemptionReason.trim()}
                style={{
                  padding: '0.55rem 1.25rem',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#4338ca',
                  color: '#ffffff',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: submittingExemption ? 'not-allowed' : 'pointer',
                  opacity: submittingExemption ? 0.7 : 1,
                }}
              >
                {submittingExemption ? (isBn ? 'জমা হচ্ছে...' : 'Submitting...') : (isBn ? 'আবেদন জমা দিন' : 'Submit Application')}
              </button>
            </div>
          </div>
        ) : step === 'manage_list' ? (
          /* ====================================================================
              VIEW: Manage Verified Phones (Multi-phone List, Max 2)
              ==================================================================== */
          <div>
            <p style={{ margin: '0 0 1rem', fontSize: '0.84rem', color: 'var(--color-text-muted, #64748b)', lineHeight: 1.45 }}>
              {isBn
                ? 'আপনার একাউন্টের সাথে যুক্ত ভেরিফাইড নম্বরসমূহ। সর্বোচ্চ ২টি নম্বর যুক্ত রাখা সম্ভব।'
                : 'Verified phone numbers linked to your account. Maximum of 2 numbers permitted.'}
            </p>

            {loadingPhones ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted, #64748b)' }}>
                <RefreshCw className="spin" size={20} style={{ margin: '0 auto 0.5rem' }} />
                <p style={{ fontSize: '0.82rem' }}>{isBn ? 'নম্বর লোড হচ্ছে...' : 'Loading numbers...'}</p>
              </div>
            ) : verifiedPhones.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', backgroundColor: 'var(--background-alt, #fafbfc)', borderRadius: '10px', marginBottom: '1rem' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted, #64748b)' }}>
                  {isBn ? 'কোনো ভেরিফাইড নম্বর পাওয়া যায়নি।' : 'No verified numbers found.'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.25rem' }}>
                {verifiedPhones.map((p, idx) => {
                  const canDelete = verifiedPhones.length >= 2;
                  return (
                    <div
                      key={p.id || idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem 1rem',
                        borderRadius: '10px',
                        border: '1px solid var(--color-border, #e2e8f0)',
                        backgroundColor: 'var(--background-alt, #fafbfc)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <Smartphone size={18} color="var(--color-primary, #059669)" />
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
                              {p.phone}
                            </span>
                            {p.isPrimary && (
                              <span
                                style={{
                                  fontSize: '0.68rem',
                                  fontWeight: 700,
                                  padding: '0.1rem 0.45rem',
                                  borderRadius: '6px',
                                  backgroundColor: 'rgba(5, 150, 105, 0.1)',
                                  color: 'var(--color-primary, #059669)',
                                }}
                              >
                                {isBn ? 'প্রাথমিক' : 'Primary'}
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted, #94a3b8)' }}>
                            {isBn ? 'ভেরিফাইড' : 'Verified'}
                          </span>
                        </div>
                      </div>

                      {/* Delete Button (Only enabled when 2 numbers exist) */}
                      <button
                        type="button"
                        onClick={() => handleRemovePhone(p.phone)}
                        disabled={!canDelete || deletingPhone === p.phone}
                        title={
                          !canDelete
                            ? (isBn
                                ? 'আপনার একাউন্টে ১টি নম্বর রয়েছে। আরেকটি নম্বর যোগ না করা পর্যন্ত এটি মোছা যাবে না।'
                                : 'You must have 2 numbers to remove one.')
                            : (isBn ? 'নম্বর মুছুন' : 'Remove number')
                        }
                        style={{
                          background: 'none',
                          border: 'none',
                          color: canDelete ? '#dc2626' : '#cbd5e1',
                          cursor: canDelete ? 'pointer' : 'not-allowed',
                          padding: '0.35rem',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'color 0.15s',
                        }}
                      >
                        {deletingPhone === p.phone ? (
                          <RefreshCw className="spin" size={16} />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Explanatory Rule note for removal */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.45rem',
                fontSize: '0.75rem',
                color: 'var(--color-text-muted, #64748b)',
                marginBottom: '1.25rem',
                lineHeight: 1.4,
              }}
            >
              <Info size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>
                {isBn
                  ? 'নিয়মাবলী: একাউন্টে ১টি ভেরিফাইড নম্বর থাকা বাধ্যতামূলক। কোনো নম্বর মুছতে হলে প্রথমে আরেকটি নম্বর ভেরিফাই করে যুক্ত করতে হবে।'
                  : 'Policy: At least one verified number is mandatory. You can only remove a number if you have 2 numbers.'}
              </span>
            </div>

            {/* Add second number action (if count < 2) */}
            {verifiedPhones.length < 2 ? (
              <button
                type="button"
                onClick={() => {
                  setPhone('');
                  setIsSecondaryAdding(true);
                  setStep('input_phone');
                  setFeedback(null);
                }}
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(5, 150, 105, 0.08)',
                  border: '1.5px dashed var(--color-primary, #059669)',
                  color: 'var(--color-primary, #059669)',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                }}
              >
                <Plus size={16} />
                <span>{isBn ? '+ আরেকটি ভেরিফাইড নম্বর যুক্ত করুন' : '+ Add Another Verified Number'}</span>
              </button>
            ) : (
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#059669', textAlign: 'center', fontWeight: 600 }}>
                {isBn ? 'আপনার একাউন্টে সর্বোচ্চ ২টি নম্বর যুক্ত করা রয়েছে।' : 'Maximum 2 numbers are linked.'}
              </p>
            )}
          </div>
        ) : step === 'enter_otp' ? (
          /* ====================================================================
              VIEW: Enter 6-digit OTP
              ==================================================================== */
          <div>
            <p style={{ margin: '0 0 1rem', fontSize: '0.84rem', color: 'var(--color-text-muted, #64748b)', lineHeight: 1.45 }}>
              {isBn
                ? `${phone} নম্বরে ৬ ডিজিটের ওটিপি কোড পাঠানো হয়েছে। কোডটি নিচে লিখুন:`
                : `Enter the 6-digit code sent to ${phone}:`}
            </p>

            <div style={{ marginBottom: '1.25rem' }}>
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/[^\d]/g, ''))}
                placeholder="• • • • • •"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '10px',
                  border: '2px solid var(--color-primary, #059669)',
                  backgroundColor: 'var(--surface, #ffffff)',
                  color: 'var(--text-main, #0f172a)',
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  textAlign: 'center',
                  letterSpacing: '0.5rem',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <button
                type="button"
                onClick={() => setStep('input_phone')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-muted, #64748b)',
                  fontSize: '0.78rem',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                {isBn ? 'ভুল নম্বর? পরিবর্তন করুন' : 'Change phone number'}
              </button>

              <button
                type="button"
                onClick={() => handleSendOtp(phone, isSecondaryAdding)}
                disabled={resendCooldown > 0 || sendingOtp}
                style={{
                  background: 'none',
                  border: 'none',
                  color: resendCooldown > 0 ? 'var(--color-text-muted, #94a3b8)' : 'var(--color-primary, #059669)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                  padding: 0,
                }}
              >
                {resendCooldown > 0
                  ? (isBn ? `পুনরায় পাঠান (${resendCooldown}s)` : `Resend in ${resendCooldown}s`)
                  : (isBn ? 'পুনরায় কোড পাঠান' : 'Resend OTP')}
              </button>
            </div>

            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={verifyingOtp || otpCode.length !== 6}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                backgroundColor: 'var(--color-primary, #059669)',
                color: '#ffffff',
                fontSize: '0.92rem',
                fontWeight: 700,
                border: 'none',
                cursor: verifyingOtp || otpCode.length !== 6 ? 'not-allowed' : 'pointer',
                opacity: verifyingOtp || otpCode.length !== 6 ? 0.7 : 1,
              }}
            >
              {verifyingOtp ? (isBn ? 'যাচাই করা হচ্ছে...' : 'Verifying...') : (isBn ? 'ভেরিফিকেশন সম্পন্ন করুন' : 'Complete Verification')}
            </button>
          </div>
        ) : (
          /* ====================================================================
              VIEW: Input Phone Number
              ==================================================================== */
          <div>
            <p style={{ margin: '0 0 1rem', fontSize: '0.84rem', color: 'var(--color-text-muted, #64748b)', lineHeight: 1.45 }}>
              {isBn
                ? 'আপনার একাউন্টের সুরক্ষায় মোবাইল নম্বর ভেরিফিকেশন করা বাধ্যতামূলক। আপনার ব্যবহৃত ১১ ডিজিটের নম্বরটি লিখুন:'
                : 'Mobile number verification is required. Enter your active 11-digit Bangladesh phone number:'}
            </p>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main, #0f172a)', marginBottom: '0.35rem' }}>
                {isBn ? 'মোবাইল নম্বর (১১ ডিজিট):' : 'Mobile Number (11 Digits):'}
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span
                  style={{
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border, #cbd5e1)',
                    backgroundColor: 'var(--background-alt, #f1f5f9)',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    color: 'var(--text-main, #334155)',
                  }}
                >
                  +88
                </span>
                <input
                  type="tel"
                  maxLength={11}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, ''))}
                  placeholder="017XXXXXXXX"
                  style={{
                    flex: 1,
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1.5px solid var(--color-border, #cbd5e1)',
                    backgroundColor: 'var(--surface, #ffffff)',
                    color: 'var(--text-main, #0f172a)',
                    fontSize: '0.92rem',
                    fontWeight: 600,
                  }}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleSendOtp(phone, isSecondaryAdding)}
              disabled={sendingOtp || phone.length < 11}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                backgroundColor: 'var(--color-primary, #059669)',
                color: '#ffffff',
                fontSize: '0.92rem',
                fontWeight: 700,
                border: 'none',
                cursor: sendingOtp || phone.length < 11 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                opacity: sendingOtp || phone.length < 11 ? 0.7 : 1,
              }}
            >
              {sendingOtp ? (
                <span>{isBn ? 'ওটিপি পাঠানো হচ্ছে...' : 'Sending OTP...'}</span>
              ) : (
                <>
                  <span>{isBn ? 'ওটিপি কোড পাঠান' : 'Send OTP Code'}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            {/* Special Button for Students: Phone Exemption Application */}
            {isStudent && (
              <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border, #e2e8f0)', textAlign: 'center' }}>
                <p style={{ margin: '0 0 0.5rem', fontSize: '0.78rem', color: 'var(--color-text-muted, #64748b)' }}>
                  {isBn ? 'আপনার নিজস্ব কোনো ফোন নম্বর নেই?' : "Don't have access to a personal phone?"}
                </p>
                <button
                  type="button"
                  onClick={() => setShowExemptionForm(true)}
                  style={{
                    background: 'rgba(67, 56, 202, 0.08)',
                    border: '1px solid rgba(67, 56, 202, 0.25)',
                    borderRadius: '8px',
                    padding: '0.55rem 1rem',
                    color: '#4338ca',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <FileText size={15} />
                  <span>{isBn ? 'ফোন নম্বর না থাকার জন্য অব্যাহতি আবেদন' : 'Apply for Phone Exemption'}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
