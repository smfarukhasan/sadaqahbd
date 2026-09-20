'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '../../../../i18n/routing';
import { useSearchParams } from 'next/navigation';
import styles from './page.module.css';
import {
  Lock,
  ShieldCheck,
  AlertCircle,
  HeartHandshake,
  GraduationCap,
  UserCheck,
  Building2,
  CheckCircle2,
  Phone,
} from 'lucide-react';
import { getFriendlyAuthErrorMessage } from '../../../../lib/auth-errors';
import { getApiUrl } from '../../../../lib/api-config';
import { useAuthStore, getRoleDashboardPath } from '../../../../lib/auth-store';

type PublicRoleKey = 'donor' | 'student' | 'teacher' | 'organization';

interface RoleOption {
  key: PublicRoleKey;
  titleBn: string;
  titleEn: string;
  descBn: string;
  descEn: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const ROLES: RoleOption[] = [
  {
    key: 'donor',
    titleBn: 'সম্মানিত দাতা (Donor)',
    titleEn: 'Donor',
    descBn: 'সরাসরি শিক্ষার্থীদের সহায়তা বা ফান্ডে অনুদান প্রদান করুন।',
    descEn: 'Support students or donate to general funds directly.',
    icon: HeartHandshake,
  },
  {
    key: 'student',
    titleBn: 'শিক্ষার্থী (Student)',
    titleEn: 'Student',
    descBn: 'শিক্ষা সহায়তার আবেদন ও যাচাইকরণ প্রক্রিয়া ট্র্যাক করুন।',
    descEn: 'Apply for education grants and track verification status.',
    icon: GraduationCap,
  },
  {
    key: 'teacher',
    titleBn: 'শিক্ষক (Teacher)',
    titleEn: 'Teacher',
    descBn: 'প্রতিষ্ঠানের শিক্ষার্থীদের আবেদন পরীক্ষা ও সত্যায়ন করুন।',
    descEn: 'Verify and attest applications from your students.',
    icon: UserCheck,
  },
  {
    key: 'organization',
    titleBn: 'শিক্ষা প্রতিষ্ঠান (Institution)',
    titleEn: 'Institution',
    descBn: 'শিক্ষক অন্তর্ভুক্তি ও শিক্ষার্থীদের প্রাতিষ্ঠানিক ছাড়পত্র দিন।',
    descEn: 'Manage teachers and provide institutional clearance.',
    icon: Building2,
  },
];

function SetPasswordContent() {
  const t = useTranslations('Auth');
  const commonT = useTranslations('Common');
  const locale = useLocale();
  const isBn = locale === 'bn';
  const router = useRouter();
  const searchParams = useSearchParams();

  const user = useAuthStore((s) => s.user);
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const loadingAuth = useAuthStore((s) => s.loading);

  const initialRoleParam = (searchParams.get('role') || '').toLowerCase();
  const validInitialRole: PublicRoleKey = ['donor', 'student', 'teacher', 'organization'].includes(
    initialRoleParam
  )
    ? (initialRoleParam as PublicRoleKey)
    : user?.role && ['donor', 'student', 'teacher', 'organization'].includes(user.role)
    ? (user.role as PublicRoleKey)
    : 'student';

  const [selectedRole, setSelectedRole] = useState<PublicRoleKey>(validInitialRole);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Protection Guard: Old/Existing accounts MUST NEVER see this setup!
  useEffect(() => {
    if (!loadingAuth && user) {
      if (user.isPasswordSet) {
        const dest = getRoleDashboardPath(user.role);
        router.replace(dest as any);
      }
    }
  }, [user, loadingAuth, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError(isBn ? 'পাসওয়ার্ড ন্যূনতম ৮ অক্ষরের হতে হবে।' : 'Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError(isBn ? 'উভয় পাসওয়ার্ড হুবহু এক হতে হবে।' : 'Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { auth } = await import('../../../../lib/firebase');
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error(isBn ? 'লগইন সেশন পাওয়া যায়নি। অনুগ্রহ করে পুনরায় লগইন করুন।' : 'Session not found. Please log in again.');
      }

      const token = await currentUser.getIdToken();
      const apiUrl = getApiUrl();

      // Safely attempt client-side Firebase Auth password update if supported
      try {
        const { updatePassword } = await import('firebase/auth');
        await updatePassword(currentUser, password);
      } catch (fbPwErr: any) {
        console.warn('Firebase client updatePassword skipped or requires re-auth:', fbPwErr?.message);
      }

      const payload: any = {
        password,
        confirmPassword,
        role: selectedRole,
      };
      if (phone.trim()) {
        payload.phone = phone.trim();
      }

      const res = await fetch(`${apiUrl}/auth/set-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || (isBn ? 'পাসওয়ার্ড সংরক্ষণ করতে সমস্যা হয়েছে' : 'Failed to set password'));
      }

      const data = await res.json();
      if (data.user) {
        useAuthStore.getState().setUser(data.user);
        const destination = getRoleDashboardPath(data.user.role);
        router.replace(destination as any);
      } else {
        router.replace(getRoleDashboardPath(selectedRole) as any);
      }
    } catch (err: any) {
      setError(getFriendlyAuthErrorMessage(err, isBn ? 'bn' : 'en', isBn ? 'সেটআপ সম্পন্ন করতে সমস্যা হয়েছে' : 'Failed to complete setup'));
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.iconCircle}>
            <ShieldCheck size={32} />
          </div>
          <h1>{isBn ? 'অ্যাকাউন্ট সেটআপ ও রোল নির্বাচন' : 'Account Setup & Role Selection'}</h1>
          <p>
            {isBn
              ? 'প্ল্যাটফর্মে আপনার অ্যাকাউন্ট সক্রিয় করতে পছন্দের রোল ও একটি নিরাপদ পাসওয়ার্ড নির্ধারণ করুন।'
              : 'Select your account role and set a secure password to complete your registration.'}
          </p>
        </div>

        {error && (
          <div className={styles.errorBox}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* 1. ROLE SELECTION (Directly above Password & Confirm Password) */}
          <div className={styles.roleSection}>
            <div className={styles.roleSectionHeader}>
              <span className={styles.roleSectionTitle}>
                <ShieldCheck size={16} color="var(--primary)" />
                {isBn ? 'অ্যাকাউন্টের ধরন (রোল) বেছে নিন *' : 'Select Account Role *'}
              </span>
              <span className={styles.roleSectionSubtitle}>
                {isBn
                  ? 'আপনার প্রয়োজন অনুযায়ী প্ল্যাটফর্ম ভূমিকা নির্বাচন করুন:'
                  : 'Choose the appropriate role for your account:'}
              </span>
            </div>

            <div className={styles.roleGrid}>
              {ROLES.map((r) => {
                const Icon = r.icon;
                const isSelected = selectedRole === r.key;
                return (
                  <div
                    key={r.key}
                    onClick={() => setSelectedRole(r.key)}
                    className={`${styles.roleCard} ${isSelected ? styles.roleCardActive : ''}`}
                  >
                    <div className={styles.roleIcon}>
                      <Icon size={20} />
                    </div>

                    <div className={styles.roleInfo}>
                      <div className={styles.roleTitleRow}>
                        <span className={styles.roleTitle}>{isBn ? r.titleBn : r.titleEn}</span>
                        {isSelected && <CheckCircle2 size={16} className={styles.checkIcon} />}
                      </div>
                      <span className={styles.roleDesc}>{isBn ? r.descBn : r.descEn}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. PASSWORD & CONFIRM PASSWORD */}
          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label>{isBn ? 'পাসওয়ার্ড (ন্যূনতম ৮ অক্ষর) *' : 'Password (min 8 chars) *'}</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <div className={styles.field}>
              <label>{isBn ? 'কনফার্ম পাসওয়ার্ড *' : 'Confirm Password *'}</label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* 3. OPTIONAL PHONE NUMBER (if not set) */}
          {(!user?.phone || user.phone === '') && (
            <div className={styles.field}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Phone size={14} /> {isBn ? 'মোবাইল নম্বর (ঐচ্ছিক)' : 'Mobile Phone (Optional)'}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+8801XXXXXXXXX"
              />
            </div>
          )}

          {/* SUBMIT BUTTON */}
          <button type="submit" disabled={loading} className={styles.submitBtn}>
            <ShieldCheck size={20} />
            <span>
              {loading
                ? commonT('loading')
                : isBn
                ? `অ্যাকাউন্ট নিশ্চিত করুন (${
                    selectedRole === 'donor'
                      ? 'দাতা'
                      : selectedRole === 'student'
                      ? 'শিক্ষার্থী'
                      : selectedRole === 'teacher'
                      ? 'শিক্ষক'
                      : 'প্রতিষ্ঠান'
                  })`
                : `Confirm Account (${selectedRole.toUpperCase()})`}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: '5rem', textAlign: 'center' }}>লোড হচ্ছে...</div>}>
      <SetPasswordContent />
    </Suspense>
  );
}
