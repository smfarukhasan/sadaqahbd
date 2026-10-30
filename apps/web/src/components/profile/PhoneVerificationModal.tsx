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
  User,
  Calendar,
  MapPin,
  Users,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { getApiUrl } from '@/lib/api-config';
import { getAuthToken } from '../../lib/auth-token';
import {
  UserRole,
  extract11DigitPhone,
  isValid11DigitPhone,
  formatPhoneForDisplay,
} from '@sadaqahbd/schema';

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
  const [phone, setPhone] = useState<string>(extract11DigitPhone(user?.phone) || '');
  const [otpCode, setOtpCode] = useState<string>('');
  const [step, setStep] = useState<'input_phone' | 'enter_otp' | 'manage_list'>('input_phone');
  const [isSecondaryAdding, setIsSecondaryAdding] = useState<boolean>(false);
  const [phoneVerifiedInSession, setPhoneVerifiedInSession] = useState<boolean>(Boolean(user?.isPhoneVerified));

  // Verified phones list (for manage_phones mode)
  const [verifiedPhones, setVerifiedPhones] = useState<any[]>([]);
  const [loadingPhones, setLoadingPhones] = useState<boolean>(false);

  // Student Comprehensive Verification Fields
  const [studentFullName, setStudentFullName] = useState<string>(user?.fullName || '');
  const [studentFatherName, setStudentFatherName] = useState<string>('');
  const [studentDob, setStudentDob] = useState<string>('');
  const [studentBloodGroup, setStudentBloodGroup] = useState<string>('A+');
  const [studentNidOrBirth, setStudentNidOrBirth] = useState<string>('');
  const [studentPresentAddress, setStudentPresentAddress] = useState<string>(user?.address || '');
  const [studentPermanentAddress, setStudentPermanentAddress] = useState<string>('');
  const [studentGuardianName, setStudentGuardianName] = useState<string>('');
  const [studentGuardianRelationship, setStudentGuardianRelationship] = useState<string>(isBn ? 'পিতা' : 'Father');
  const [studentGuardianPhone, setStudentGuardianPhone] = useState<string>('');
  const [studentGuardianAddress, setStudentGuardianAddress] = useState<string>('');
  const [isSamePhoneAsStudent, setIsSamePhoneAsStudent] = useState<boolean>(false);

  // Student Phone Exemption & Verification state
  const [isPhoneExemptionChecked, setIsPhoneExemptionChecked] = useState<boolean>(false);
  const [phoneExemptionReason, setPhoneExemptionReason] = useState<string>('');
  const [studentExemptionStatus, setStudentExemptionStatus] = useState<any>(null);
  const [studentProfileData, setStudentProfileData] = useState<any>(null);
  const [submittingStudentInfo, setSubmittingStudentInfo] = useState<boolean>(false);
  const [isReapplying, setIsReapplying] = useState<boolean>(false);

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

  const loadStudentData = async () => {
    if (!isStudent) return;
    try {
      const token = await getAuthToken();
      const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' };

      const [exempRes, profRes] = await Promise.all([
        fetch(`${getApiUrl()}/sms/student-exemption`, { headers }).catch(() => null),
        fetch(`${getApiUrl()}/users/my-student-profile`, { headers }).catch(() => null),
      ]);

      if (exempRes && exempRes.ok) {
        const data = await exempRes.json().catch(() => null);
        if (data) setStudentExemptionStatus(data);
      }

      if (profRes && profRes.ok) {
        const prof = await profRes.json().catch(() => null);
        if (prof) {
          setStudentProfileData(prof);
          const p = prof.profile;
          const u = prof.user;
          if (u?.fullName) setStudentFullName(u.fullName);
          if (p?.fatherName) setStudentFatherName(p.fatherName);
          if (p?.dateOfBirth) setStudentDob(p.dateOfBirth);
          if (p?.bloodGroup) setStudentBloodGroup(p.bloodGroup);
          if (p?.nidOrBirthCertificateNumber) setStudentNidOrBirth(p.nidOrBirthCertificateNumber);
          if (p?.presentAddress || u?.address) setStudentPresentAddress(p?.presentAddress || u?.address || '');
          if (p?.permanentAddress) setStudentPermanentAddress(p.permanentAddress);
          if (p?.guardianName) setStudentGuardianName(p.guardianName);
          if (p?.guardianRelationship) setStudentGuardianRelationship(p.guardianRelationship);
          if (p?.guardianPhone) setStudentGuardianPhone(extract11DigitPhone(p.guardianPhone));
          if (p?.guardianAddress) setStudentGuardianAddress(p.guardianAddress);
        }
      }
    } catch (err) {
      console.error('Error fetching student data:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setFeedback(null);
      setOtpCode('');
      setPhone(extract11DigitPhone(user?.phone) || '');
      setPhoneVerifiedInSession(Boolean(user?.isPhoneVerified));
      loadVerifiedPhones();
      if (isStudent) {
        loadStudentData();
      }

      if (mode === 'manage_phones') {
        setStep('manage_list');
      } else {
        setStep('input_phone');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mode]);

  // Sync guardian phone if "একই" checkbox is checked
  useEffect(() => {
    if (isSamePhoneAsStudent && phone) {
      setStudentGuardianPhone(phone);
    }
  }, [phone, isSamePhoneAsStudent]);

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
    const clean = extract11DigitPhone(targetPhone);
    if (!clean || !isValid11DigitPhone(clean)) {
      setFeedback({
        type: 'error',
        text: isBn
          ? 'ফোন নম্বর অবশ্যই ১১ সংখ্যার হতে হবে (যেমন: 01XXXXXXXXX)।'
          : 'Phone number must be strictly 11 digits (e.g. 01XXXXXXXXX).',
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
        setFeedback({
          type: 'info',
          text: data.message || (isBn ? 'ওটিপি কোড পাঠানো হয়েছে।' : 'OTP code sent.'),
        });
        setStep('enter_otp');
        setResendCooldown(60);
      } else {
        setFeedback({
          type: 'error',
          text: data.message || (isBn ? 'ওটিপি পাঠাতে ব্যর্থ হয়েছে।' : 'Failed to send OTP.'),
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err?.message || (isBn ? 'সার্ভারে সংযোগে সমস্যা।' : 'Connection error.'),
      });
    } finally {
      setSendingOtp(false);
    }
  };

  // Handle Verify OTP
  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) {
      setFeedback({
        type: 'error',
        text: isBn ? 'অনুগ্রহ করে ৬ ডিজিটের ওটিপি কোড লিখুন।' : 'Enter 6-digit OTP code.',
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
          phone: extract11DigitPhone(phone),
          otpCode: otpCode.trim(),
          isSecondary: isSecondaryAdding,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (user) {
          setUser({ ...user, isPhoneVerified: true, phone: `+88${extract11DigitPhone(phone)}` });
        }
        setPhoneVerifiedInSession(true);

        setFeedback({
          type: 'success',
          text: data.message || (isBn ? 'ফোন নম্বর সফলভাবে ভেরিফাই হয়েছে!' : 'Phone verified successfully!'),
        });

        loadVerifiedPhones();

        if (isStudent && mode === 'verify_mandatory') {
          // Keep in form so student can finish submitting profile data
          setStep('input_phone');
        } else if (mode === 'verify_mandatory') {
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

  // Handle Remove Verified Phone
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

  // Handle Comprehensive Student Information Verification Submit
  const handleSubmitStudentVerification = async () => {
    // Validations
    if (!studentFullName.trim() || studentFullName.trim().length < 2) {
      setFeedback({ type: 'error', text: isBn ? 'শিক্ষার্থীর পূর্ণ নাম প্রদান করা আবশ্যক।' : 'Full Name is required.' });
      return;
    }
    if (!studentFatherName.trim() || studentFatherName.trim().length < 2) {
      setFeedback({ type: 'error', text: isBn ? 'পিতার নাম প্রদান করা আবশ্যক।' : "Father's name is required." });
      return;
    }
    if (!studentDob.trim()) {
      setFeedback({ type: 'error', text: isBn ? 'জন্ম তারিখ নির্বাচন করা আবশ্যক।' : 'Date of Birth is required.' });
      return;
    }
    if (!studentBloodGroup.trim()) {
      setFeedback({ type: 'error', text: isBn ? 'রক্তের গ্রুপ নির্বাচন করুন।' : 'Blood group is required.' });
      return;
    }
    if (!studentNidOrBirth.trim() || studentNidOrBirth.trim().length < 5) {
      setFeedback({ type: 'error', text: isBn ? 'এনআইডি অথবা জন্মনিবন্ধন নম্বর আবশ্যক।' : 'NID or Birth Certificate number is required.' });
      return;
    }
    if (!studentPresentAddress.trim() || studentPresentAddress.trim().length < 3) {
      setFeedback({ type: 'error', text: isBn ? 'বর্তমান ঠিকানা প্রদান করা আবশ্যক।' : 'Present address is required.' });
      return;
    }
    if (!studentPermanentAddress.trim() || studentPermanentAddress.trim().length < 3) {
      setFeedback({ type: 'error', text: isBn ? 'স্থায়ী ঠিকানা প্রদান করা আবশ্যক।' : 'Permanent address is required.' });
      return;
    }
    if (!studentGuardianName.trim() || studentGuardianName.trim().length < 2) {
      setFeedback({ type: 'error', text: isBn ? 'অভিভাবকের নাম প্রদান করা আবশ্যক।' : "Guardian's name is required." });
      return;
    }
    if (!studentGuardianRelationship.trim()) {
      setFeedback({ type: 'error', text: isBn ? 'অভিভাবকের সাথে সম্পর্ক আবশ্যক।' : 'Relationship with guardian is required.' });
      return;
    }
    if (!studentGuardianPhone.trim() || !isValid11DigitPhone(studentGuardianPhone.trim())) {
      setFeedback({ type: 'error', text: isBn ? 'অভিভাবকের ফোন নম্বর অবশ্যই ১১ সংখ্যার হতে হবে (যেমন: 01XXXXXXXXX)।' : "Guardian's phone must be 11 digits." });
      return;
    }
    if (!studentGuardianAddress.trim() || studentGuardianAddress.trim().length < 3) {
      setFeedback({ type: 'error', text: isBn ? 'অভিভাবকের ঠিকানা প্রদান করা আবশ্যক।' : "Guardian's address is required." });
      return;
    }

    // Phone / Exemption check
    if (isPhoneExemptionChecked) {
      if (!phoneExemptionReason.trim() || phoneExemptionReason.trim().length < 10) {
        setFeedback({
          type: 'error',
          text: isBn
            ? 'অনুগ্রহ করে ফোন নম্বর না থাকার কারণ বিস্তারিত লিখুন (কমপক্ষে ১০ অক্ষর)।'
            : 'Please state the detailed reason for phone exemption (min 10 chars).',
        });
        return;
      }
    } else {
      if (!phoneVerifiedInSession && !user?.isPhoneVerified) {
        setFeedback({
          type: 'error',
          text: isBn
            ? 'অনুগ্রহ করে আপনার ফোন নম্বরে ওটিপি কোড পাঠিয়ে ভেরিফাই করুন, অথবা ফোন না থাকলে "অব্যাহতি আবেদন" বক্সে টিক দিন।'
            : 'Please verify your phone via OTP or check exemption request.',
        });
        return;
      }
    }

    try {
      setSubmittingStudentInfo(true);
      setFeedback(null);
      const token = await getAuthToken();

      const payload = {
        fullName: studentFullName.trim(),
        fatherName: studentFatherName.trim(),
        dateOfBirth: studentDob.trim(),
        bloodGroup: studentBloodGroup.trim(),
        nidOrBirthCertificateNumber: studentNidOrBirth.trim(),
        presentAddress: studentPresentAddress.trim(),
        permanentAddress: studentPermanentAddress.trim(),
        guardianName: studentGuardianName.trim(),
        guardianRelationship: studentGuardianRelationship.trim(),
        guardianPhone: studentGuardianPhone.trim(),
        guardianAddress: studentGuardianAddress.trim(),
        phoneExemptionRequested: isPhoneExemptionChecked,
        phoneExemptionReason: isPhoneExemptionChecked ? phoneExemptionReason.trim() : null,
      };

      const res = await fetch(`${getApiUrl()}/users/student-information-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({
          type: 'success',
          text: data.message || (isBn ? 'আপনার তথ্য ভেরিফিকেশন সফলভাবে জমা হয়েছে!' : 'Verification submitted successfully!'),
        });
        setIsReapplying(false);
        await loadStudentData();
      } else {
        setFeedback({
          type: 'error',
          text: data.message || (isBn ? 'তথ্য জমা দিতে সমস্যা হয়েছে।' : 'Submission failed.'),
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err?.message || (isBn ? 'সার্ভারে সংযোগে সমস্যা।' : 'Connection error.'),
      });
    } finally {
      setSubmittingStudentInfo(false);
    }
  };

  const isExemptActive = studentExemptionStatus?.isExemptActive;
  const exemptionValidUntil = studentExemptionStatus?.phoneExemptionValidUntil;
  const latestExemptionRequest = studentExemptionStatus?.latestRequest;
  const studentVerifStatus = studentProfileData?.profile?.verificationStatus;
  const isStudentPendingAdmin =
    (latestExemptionRequest?.status === 'pending' || studentVerifStatus === 'pending_admin') &&
    !isExemptActive &&
    !isReapplying;

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString(isBn ? 'bn-BD' : 'en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const isStudentMandatoryView = isStudent && mode === 'verify_mandatory';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: isStudentMandatoryView ? '680px' : '460px',
          backgroundColor: 'var(--surface, #ffffff)',
          borderRadius: '16px',
          padding: isStudentMandatoryView ? '1.75rem' : '1.5rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          position: 'relative',
          maxHeight: '92vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: 'rgba(5, 150, 105, 0.1)',
                color: 'var(--color-primary, #059669)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isStudentMandatoryView ? <Users size={22} /> : <Smartphone size={20} />}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>
                {isStudentMandatoryView
                  ? (isBn ? 'শিক্ষার্থীর তথ্য ভেরিফিকেশন' : 'Student Information Verification')
                  : mode === 'manage_phones'
                  ? (isBn ? 'ভেরিফাইড ফোন নম্বর সমূহ' : 'Verified Phone Numbers')
                  : (isBn ? 'ফোন নম্বর ভেরিফিকেশন' : 'Phone Verification')}
              </h3>
              <span style={{ fontSize: '0.76rem', color: 'var(--color-text-muted, #64748b)' }}>
                {isStudentMandatoryView
                  ? (isBn ? 'ব্যক্তিগত তথ্য, অভিভাবকের তথ্য ও ফোন ভেরিফিকেশন' : 'Personal, Address, Guardian & Phone Verification')
                  : (isBn ? 'নিরাপত্তা ও ওটিপি নিশ্চিতকরণ' : 'Security & OTP Confirmation')}
              </span>
            </div>
          </div>

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
              backgroundColor: feedback.type === 'success' ? '#ecfdf5' : feedback.type === 'info' ? '#eff6ff' : '#fef2f2',
              border: `1px solid ${feedback.type === 'success' ? '#a7f3d0' : feedback.type === 'info' ? '#bfdbfe' : '#fecaca'}`,
              color: feedback.type === 'success' ? '#065f46' : feedback.type === 'info' ? '#1d4ed8' : '#991b1b',
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

        {/* Active Exemption Banner */}
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
                ? `আপনি ${formatDate(exemptionValidUntil)} পর্যন্ত ফোন নম্বর ছাড়াই প্ল্যাটফর্ম ব্যবহার করতে পারবেন।`
                : `Your exemption is valid until ${formatDate(exemptionValidUntil)}.`}
            </p>
          </div>
        )}

        {/* Pending Review Banner */}
        {isStudent && isStudentPendingAdmin && (
          <div
            style={{
              backgroundColor: '#fef3c7',
              border: '1px solid #f59e0b',
              borderRadius: '10px',
              padding: '1.25rem',
              marginBottom: '1.25rem',
              color: '#92400e',
              fontSize: '0.86rem',
              textAlign: 'center',
            }}
          >
            <Clock size={32} color="#d97706" style={{ margin: '0 auto 0.5rem' }} />
            <h4 style={{ margin: '0 0 0.35rem', fontSize: '1rem', fontWeight: 800 }}>
              {isBn ? 'আপনার তথ্য ভেরিফিকেশন পর্যালোচনায় রয়েছে' : 'Information Under Review'}
            </h4>
            <p style={{ margin: '0 0 0.85rem', fontSize: '0.82rem', lineHeight: 1.5, color: '#78350f' }}>
              {isBn
                ? 'আপনার দাখিলকৃত ব্যক্তিগত, অভিভাবক ও ফোন ভেরিফিকেশনের তথ্যটি মাস্টার এডমিন / সুপার এডমিন পর্যালোচনায় রয়েছে। অনুমোদিত হলে স্বয়ংক্রিয়ভাবে ফিচার আনলক হবে।'
                : 'Your verification submission is currently under administrative review.'}
            </p>
            <button
              type="button"
              onClick={() => setIsReapplying(true)}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: '6px',
                border: '1px solid #d97706',
                backgroundColor: 'transparent',
                color: '#92400e',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {isBn ? 'তথ্য সংশোধন / নতুন আবেদন' : 'Edit Information'}
            </button>
          </div>
        )}

        {/* Rejected Notice Banner */}
        {isStudent && (latestExemptionRequest?.status === 'rejected' || studentVerifStatus === 'rejected') && !isReapplying && (
          <div
            style={{
              backgroundColor: '#fee2e2',
              border: '1px solid #ef4444',
              borderRadius: '10px',
              padding: '1rem',
              marginBottom: '1.25rem',
              color: '#991b1b',
              fontSize: '0.84rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, marginBottom: '0.25rem' }}>
              <AlertTriangle size={16} color="#dc2626" />
              <span>{isBn ? 'পূর্ববর্তী আবেদন প্রত্যাখ্যাত হয়েছিল' : 'Previous Submission Rejected'}</span>
            </div>
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', lineHeight: 1.4 }}>
              {isBn
                ? `কারণ: "${latestExemptionRequest?.rejectionReason || studentProfileData?.profile?.rejectionReason || 'তথ্য অপর্যাপ্ত'}"`
                : `Reason: "${latestExemptionRequest?.rejectionReason || studentProfileData?.profile?.rejectionReason || 'Incomplete details'}"`}
            </p>
            <button
              type="button"
              onClick={() => setIsReapplying(true)}
              style={{
                background: 'none',
                border: 'none',
                color: '#b91c1c',
                fontWeight: 700,
                fontSize: '0.8rem',
                textDecoration: 'underline',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              {isBn ? 'সঠিক তথ্য দিয়ে পুনরায় আবেদন করুন' : 'Re-apply with corrected information'}
            </button>
          </div>
        )}

        {/* ====================================================================
            VIEW A: Student Information Verification Comprehensive Form
            ==================================================================== */}
        {isStudentMandatoryView && (!isStudentPendingAdmin || isReapplying) ? (
          <div>
            <p style={{ margin: '0 0 1.25rem', fontSize: '0.84rem', color: 'var(--color-text-muted, #64748b)', lineHeight: 1.5 }}>
              {isBn
                ? 'প্ল্যাটফর্মে সক্রিয় হতে ও প্রতিষ্ঠানে যুক্ত হওয়ার পূর্বে আপনার তথ্য ভেরিফিকেশন সম্পন্ন করা বাধ্যতামূলক। ভেরিফিকেশনের পর এই তথ্য পরিবর্তনযোগ্য নয়।'
                : 'Complete your verification to activate your student account. These details cannot be altered once verified.'}
            </p>

            {/* Section 1: Personal Details */}
            <div style={{ marginBottom: '1.25rem', padding: '1rem', borderRadius: '10px', backgroundColor: 'var(--background-alt, #f8fafc)', border: '1px solid var(--color-border, #e2e8f0)' }}>
              <h4 style={{ margin: '0 0 0.85rem', fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main, #0f172a)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <User size={16} color="var(--color-primary, #059669)" />
                <span>{isBn ? '১. ব্যক্তিগত ও পরিচিতি তথ্য' : '1. Personal Information'}</span>
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem', color: 'var(--text-main, #0f172a)' }}>
                    {isBn ? 'শিক্ষার্থীর পূর্ণ নাম' : 'Full Name'} <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={studentFullName}
                    onChange={(e) => setStudentFullName(e.target.value)}
                    placeholder="পূর্ণ নাম"
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1.5px solid var(--color-border, #cbd5e1)', fontSize: '0.88rem', outline: 'none', backgroundColor: '#ffffff' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem', color: 'var(--text-main, #0f172a)' }}>
                    {isBn ? 'পিতার নাম' : "Father's Name"} <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={studentFatherName}
                    onChange={(e) => setStudentFatherName(e.target.value)}
                    placeholder="পিতার নাম"
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1.5px solid var(--color-border, #cbd5e1)', fontSize: '0.88rem', outline: 'none', backgroundColor: '#ffffff' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem', color: 'var(--text-main, #0f172a)' }}>
                    {isBn ? 'জন্ম তারিখ' : 'Date of Birth'} <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={studentDob}
                    onChange={(e) => setStudentDob(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1.5px solid var(--color-border, #cbd5e1)', fontSize: '0.88rem', outline: 'none', backgroundColor: '#ffffff' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem', color: 'var(--text-main, #0f172a)' }}>
                    {isBn ? 'রক্তের গ্রুপ' : 'Blood Group'} <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={studentBloodGroup}
                    onChange={(e) => setStudentBloodGroup(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1.5px solid var(--color-border, #cbd5e1)', fontSize: '0.88rem', outline: 'none', backgroundColor: '#ffffff' }}
                  >
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem', color: 'var(--text-main, #0f172a)' }}>
                    {isBn ? 'এনআইডি অথবা জন্মনিবন্ধন নম্বর' : 'NID or Birth Certificate No'} <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={studentNidOrBirth}
                    onChange={(e) => setStudentNidOrBirth(e.target.value)}
                    placeholder="১৭ বা ১০ সংখ্যার এনআইডি / জন্মনিবন্ধন নম্বর"
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1.5px solid var(--color-border, #cbd5e1)', fontSize: '0.88rem', outline: 'none', backgroundColor: '#ffffff' }}
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Address Information */}
            <div style={{ marginBottom: '1.25rem', padding: '1rem', borderRadius: '10px', backgroundColor: 'var(--background-alt, #f8fafc)', border: '1px solid var(--color-border, #e2e8f0)' }}>
              <h4 style={{ margin: '0 0 0.85rem', fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main, #0f172a)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <MapPin size={16} color="var(--color-primary, #059669)" />
                <span>{isBn ? '২. ঠিকানা সংক্রান্ত তথ্য' : '2. Address Details'}</span>
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem', color: 'var(--text-main, #0f172a)' }}>
                    {isBn ? 'বর্তমান ঠিকানা' : 'Present Address'} <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={studentPresentAddress}
                    onChange={(e) => setStudentPresentAddress(e.target.value)}
                    placeholder="গ্রাম/রোড, ডাকঘর, থানা, জেলা"
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1.5px solid var(--color-border, #cbd5e1)', fontSize: '0.88rem', outline: 'none', backgroundColor: '#ffffff' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem', color: 'var(--text-main, #0f172a)' }}>
                    {isBn ? 'স্থায়ী ঠিকানা' : 'Permanent Address'} <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={studentPermanentAddress}
                    onChange={(e) => setStudentPermanentAddress(e.target.value)}
                    placeholder="স্থায়ী জেলা, থানা বা ঠিকানা"
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1.5px solid var(--color-border, #cbd5e1)', fontSize: '0.88rem', outline: 'none', backgroundColor: '#ffffff' }}
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Guardian Details */}
            <div style={{ marginBottom: '1.25rem', padding: '1rem', borderRadius: '10px', backgroundColor: 'var(--background-alt, #f8fafc)', border: '1px solid var(--color-border, #e2e8f0)' }}>
              <h4 style={{ margin: '0 0 0.85rem', fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main, #0f172a)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Users size={16} color="var(--color-primary, #059669)" />
                <span>{isBn ? '৩. অভিভাবকের তথ্য' : '3. Guardian Details'}</span>
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem', color: 'var(--text-main, #0f172a)' }}>
                    {isBn ? 'অভিভাবকের নাম' : "Guardian's Name"} <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={studentGuardianName}
                    onChange={(e) => setStudentGuardianName(e.target.value)}
                    placeholder="অভিভাবকের নাম"
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1.5px solid var(--color-border, #cbd5e1)', fontSize: '0.88rem', outline: 'none', backgroundColor: '#ffffff' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem', color: 'var(--text-main, #0f172a)' }}>
                    {isBn ? 'সম্পর্ক' : 'Relationship'} <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={studentGuardianRelationship}
                    onChange={(e) => setStudentGuardianRelationship(e.target.value)}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1.5px solid var(--color-border, #cbd5e1)', fontSize: '0.88rem', outline: 'none', backgroundColor: '#ffffff' }}
                  >
                    {[
                      { val: 'পিতা', label: isBn ? 'পিতা' : 'Father' },
                      { val: 'মাতা', label: isBn ? 'মাতা' : 'Mother' },
                      { val: 'বড় ভাই', label: isBn ? 'বড় ভাই' : 'Brother' },
                      { val: 'বড় বোন', label: isBn ? 'বড় বোন' : 'Sister' },
                      { val: 'চাচা', label: isBn ? 'চাচা' : 'Uncle' },
                      { val: 'মামা', label: isBn ? 'মামা' : 'Maternal Uncle' },
                      { val: 'অন্যান্য', label: isBn ? 'অন্যান্য' : 'Other' },
                    ].map((item) => (
                      <option key={item.val} value={item.val}>{item.label}</option>
                    ))}
                  </select>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
                      {isBn ? 'অভিভাবকের ফোন নম্বর' : "Guardian's Phone"} <span style={{ color: '#ef4444' }}>*</span>
                    </label>

                    {/* "একই" Checkbox */}
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', fontWeight: 700, color: '#059669', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={isSamePhoneAsStudent}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setIsSamePhoneAsStudent(checked);
                          if (checked && phone) {
                            setStudentGuardianPhone(phone);
                          }
                        }}
                      />
                      <span>{isBn ? 'একই (শিক্ষার্থীর নম্বরের মতো)' : 'Same as student phone'}</span>
                    </label>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'stretch' }}>
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0.55rem 0.85rem',
                        borderTopLeftRadius: '8px',
                        borderBottomLeftRadius: '8px',
                        border: '1.5px solid var(--color-border, #cbd5e1)',
                        borderRight: 'none',
                        backgroundColor: 'var(--background-alt, #f1f5f9)',
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        color: 'var(--text-main, #334155)',
                        userSelect: 'none',
                      }}
                    >
                      +88
                    </span>
                    <input
                      type="tel"
                      maxLength={11}
                      value={studentGuardianPhone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^\d]/g, '');
                        setStudentGuardianPhone(val);
                        if (val !== phone) setIsSamePhoneAsStudent(false);
                      }}
                      placeholder="01XXXXXXXXX"
                      style={{
                        flex: 1,
                        padding: '0.55rem 0.75rem',
                        borderTopRightRadius: '8px',
                        borderBottomRightRadius: '8px',
                        border: '1.5px solid var(--color-border, #cbd5e1)',
                        fontSize: '0.88rem',
                        outline: 'none',
                        backgroundColor: '#ffffff',
                      }}
                    />
                  </div>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem', color: 'var(--text-main, #0f172a)' }}>
                    {isBn ? 'অভিভাবকের ঠিকানা' : "Guardian's Address"} <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={studentGuardianAddress}
                    onChange={(e) => setStudentGuardianAddress(e.target.value)}
                    placeholder="অভিভাবকের বর্তমান ঠিকানা"
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1.5px solid var(--color-border, #cbd5e1)', fontSize: '0.88rem', outline: 'none', backgroundColor: '#ffffff' }}
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Phone Verification / Exemption Option */}
            <div style={{ marginBottom: '1.5rem', padding: '1rem', borderRadius: '10px', backgroundColor: 'var(--background-alt, #f8fafc)', border: '1px solid var(--color-border, #e2e8f0)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main, #0f172a)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Smartphone size={16} color="var(--color-primary, #059669)" />
                  <span>{isBn ? '৪. ফোন ভেরিফিকেশন ও ছাড়পত্র' : '4. Phone Verification & Exemption'}</span>
                </h4>

                {/* Exemption Checkbox */}
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', fontWeight: 700, color: '#4338ca', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isPhoneExemptionChecked}
                    onChange={(e) => setIsPhoneExemptionChecked(e.target.checked)}
                  />
                  <span>{isBn ? 'শিক্ষার্থী ফোন ভেরিফিকেশন অব্যাহতি আবেদন' : 'Apply for Phone Exemption'}</span>
                </label>
              </div>

              {isPhoneExemptionChecked ? (
                /* Exemption Reason Textarea */
                <div>
                  <p style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', color: '#64748b' }}>
                    {isBn
                      ? 'ব্যক্তিগত ফোন না থাকার বিস্তারিত কারণ উল্লেখ করুন। এডমিন প্যানেল থেকে পর্যালোচনা করে নির্দিষ্ট মেয়াদের জন্য অনুমোদন দেওয়া হবে।'
                      : 'Detail why you do not have personal phone access. Admins will review for time-limited exemption.'}
                  </p>
                  <textarea
                    rows={3}
                    value={phoneExemptionReason}
                    onChange={(e) => setPhoneExemptionReason(e.target.value)}
                    placeholder={isBn ? 'ফোন না থাকার বিস্তারিত কারণ লিখুন (কমপক্ষে ১০ অক্ষর)...' : 'Write your reason here (min 10 chars)...'}
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      borderRadius: '8px',
                      border: '1.5px solid #818cf8',
                      backgroundColor: '#ffffff',
                      fontSize: '0.85rem',
                      outline: 'none',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
              ) : (
                /* Phone Number & OTP Verification Sub-block */
                <div>
                  {phoneVerifiedInSession || user?.isPhoneVerified ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#ecfdf5', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #10b981', color: '#065f46', fontSize: '0.84rem', fontWeight: 700 }}>
                      <CheckCircle2 size={18} color="#059669" />
                      <span>{isBn ? `ফোন নম্বর ভেরিফাইড (${phone || user?.phone})` : `Phone Verified (${phone || user?.phone})`}</span>
                    </div>
                  ) : step === 'enter_otp' ? (
                    <div>
                      <p style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', color: '#64748b' }}>
                        {isBn ? `${phone} নম্বরে প্রেরিত ৬ ডিজিটের ওটিপি লিখুন (ডেমো কোড: 123456):` : `Enter 6-digit OTP for ${phone} (Demo: 123456):`}
                      </p>
                      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <input
                          type="text"
                          maxLength={6}
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/[^\d]/g, ''))}
                          placeholder="123456"
                          style={{
                            width: '160px',
                            padding: '0.55rem',
                            borderRadius: '8px',
                            border: '2px solid #059669',
                            fontSize: '1.2rem',
                            fontWeight: 800,
                            letterSpacing: '0.3rem',
                            textAlign: 'center',
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleVerifyOtp}
                          disabled={verifyingOtp || otpCode.length !== 6}
                          style={{
                            padding: '0.55rem 1rem',
                            borderRadius: '8px',
                            backgroundColor: '#059669',
                            color: '#ffffff',
                            fontWeight: 700,
                            border: 'none',
                            cursor: verifyingOtp || otpCode.length !== 6 ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {verifyingOtp ? (isBn ? 'যাচাই হচ্ছে...' : 'Verifying...') : (isBn ? 'ওটিপি নিশ্চিত করুন' : 'Verify OTP')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'stretch', maxWidth: '340px', marginBottom: '0.5rem' }}>
                        <span
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0.55rem 0.85rem',
                            borderTopLeftRadius: '8px',
                            borderBottomLeftRadius: '8px',
                            border: '1.5px solid var(--color-border, #cbd5e1)',
                            borderRight: 'none',
                            backgroundColor: 'var(--background-alt, #f1f5f9)',
                            fontSize: '0.88rem',
                            fontWeight: 700,
                            color: 'var(--text-main, #334155)',
                            userSelect: 'none',
                          }}
                        >
                          +88
                        </span>
                        <input
                          type="tel"
                          maxLength={11}
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, ''))}
                          placeholder="01XXXXXXXXX"
                          style={{
                            flex: 1,
                            padding: '0.55rem 0.75rem',
                            borderTopRightRadius: '8px',
                            borderBottomRightRadius: '8px',
                            border: '1.5px solid var(--color-border, #cbd5e1)',
                            fontSize: '0.88rem',
                            outline: 'none',
                            backgroundColor: '#ffffff',
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSendOtp(phone, false)}
                        disabled={sendingOtp || phone.length !== 11}
                        style={{
                          padding: '0.45rem 0.85rem',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(5, 150, 105, 0.1)',
                          color: '#059669',
                          border: '1px solid #059669',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: sendingOtp || phone.length !== 11 ? 'not-allowed' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        <Send size={13} />
                        <span>{sendingOtp ? (isBn ? 'পাঠানো হচ্ছে...' : 'Sending...') : (isBn ? 'ওটিপি কোড পাঠান (ডেমো ১২৩৪৫৬)' : 'Send OTP Code')}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border, #e2e8f0)' }}>
              <button
                type="button"
                onClick={handleSubmitStudentVerification}
                disabled={submittingStudentInfo}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  fontSize: '0.92rem',
                  fontWeight: 800,
                  cursor: submittingStudentInfo ? 'not-allowed' : 'pointer',
                  opacity: submittingStudentInfo ? 0.7 : 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
                }}
              >
                {submittingStudentInfo ? (
                  <>
                    <RefreshCw className="spin" size={16} />
                    <span>{isBn ? 'জমা হচ্ছে...' : 'Submitting...'}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    <span>{isBn ? 'তথ্য ভেরিফিকেশন জমা দিন' : 'Submit Information Verification'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : step === 'manage_list' ? (
          /* ====================================================================
              VIEW B: Manage Verified Phones (Multi-phone List, Max 2)
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

            {verifiedPhones.length < 2 && (
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
            )}
          </div>
        ) : step === 'enter_otp' ? (
          /* ====================================================================
              VIEW C: Enter 6-digit OTP (for Non-students or Standalone mode)
              ==================================================================== */
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.65rem 0.9rem',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid #f59e0b',
                borderRadius: '8px',
                color: '#b45309',
                fontSize: '0.85rem',
                fontWeight: 700,
                marginBottom: '1rem',
              }}
            >
              <Info size={17} style={{ flexShrink: 0 }} />
              <span>
                {isBn
                  ? 'ডেমো ওটিপি সক্রিয়: ওটিপি কোড "123456" ব্যবহার করুন।'
                  : 'Demo OTP Active: Use OTP code "123456".'}
              </span>
            </div>

            <p style={{ margin: '0 0 1rem', fontSize: '0.84rem', color: 'var(--color-text-muted, #64748b)', lineHeight: 1.45 }}>
              {isBn
                ? `${phone} নম্বরে ওটিপি পাঠানো হয়েছে। ডেমো ওটিপি কোড '123456' নিচে লিখুন:`
                : `Enter the demo 6-digit code "123456" sent to ${phone}:`}
            </p>

            <div style={{ marginBottom: '1.25rem' }}>
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/[^\d]/g, ''))}
                placeholder="123456"
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
              VIEW D: Input Phone Number (for Teachers, Orgs, Donors)
              ==================================================================== */
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                backgroundColor: 'rgba(5, 150, 105, 0.1)',
                border: '1px solid rgba(5, 150, 105, 0.25)',
                color: 'var(--color-primary, #059669)',
                borderRadius: '6px',
                padding: '0.3rem 0.65rem',
                fontSize: '0.78rem',
                fontWeight: 700,
                marginBottom: '1rem',
              }}
            >
              <Info size={14} />
              <span>{isBn ? 'ডেমো মোড: ওটিপি কোড ১২৩৪৫৬' : 'Demo Mode: OTP 123456'}</span>
            </div>

            <p style={{ margin: '0 0 1rem', fontSize: '0.84rem', color: 'var(--color-text-muted, #64748b)', lineHeight: 1.45 }}>
              {isBn
                ? 'আপনার একাউন্টের সুরক্ষায় মোবাইল নম্বর ভেরিফিকেশন করা বাধ্যতামূলক। আপনার ব্যবহৃত ১১ ডিজিটের নম্বরটি লিখুন:'
                : 'Mobile number verification is required. Enter your active 11-digit Bangladesh phone number:'}
            </p>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main, #0f172a)', marginBottom: '0.35rem' }}>
                {isBn ? 'মোবাইল নম্বর (১১ ডিজিট):' : 'Mobile Number (11 Digits):'}
              </label>
              <div style={{ display: 'flex', alignItems: 'stretch' }}>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0.65rem 0.85rem',
                    borderTopLeftRadius: '8px',
                    borderBottomLeftRadius: '8px',
                    border: '1.5px solid var(--color-border, #cbd5e1)',
                    borderRight: 'none',
                    backgroundColor: 'var(--background-alt, #f1f5f9)',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    color: 'var(--text-main, #334155)',
                    userSelect: 'none',
                  }}
                >
                  +88
                </span>
                <input
                  type="tel"
                  maxLength={11}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, ''))}
                  placeholder="01XXXXXXXXX"
                  style={{
                    flex: 1,
                    padding: '0.65rem 0.85rem',
                    borderTopRightRadius: '8px',
                    borderBottomRightRadius: '8px',
                    border: '1.5px solid var(--color-border, #cbd5e1)',
                    backgroundColor: 'var(--surface, #ffffff)',
                    color: 'var(--text-main, #0f172a)',
                    fontSize: '0.92rem',
                    fontWeight: 600,
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleSendOtp(phone, isSecondaryAdding)}
              disabled={sendingOtp || phone.length !== 11}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                backgroundColor: 'var(--color-primary, #059669)',
                color: '#ffffff',
                fontSize: '0.92rem',
                fontWeight: 700,
                border: 'none',
                cursor: sendingOtp || phone.length !== 11 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                opacity: sendingOtp || phone.length !== 11 ? 0.7 : 1,
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
          </div>
        )}
      </div>
    </div>
  );
}
