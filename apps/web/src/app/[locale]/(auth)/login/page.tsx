'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '../../../../i18n/routing';
import styles from './page.module.css';
import {
  loginWithGoogle,
  loginWithEmail,
  registerWithEmail,
} from '../../../../lib/firebase';
import {
  LogIn,
  UserPlus,
  AlertCircle,
  HeartHandshake,
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

type CategoryKey = 'donor' | 'institutional' | 'admin';

export default function LoginPage() {
  const t = useTranslations('Auth');
  const commonT = useTranslations('Common');
  const router = useRouter();

  const [activeCategory, setActiveCategory] = useState<CategoryKey>('donor');
  const [selectedRole, setSelectedRole] = useState<string>('donor');
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Category change handler
  const handleCategorySelect = (cat: CategoryKey) => {
    setActiveCategory(cat);
    if (cat === 'donor') {
      setSelectedRole('donor');
    } else if (cat === 'institutional') {
      setSelectedRole('student');
    } else if (cat === 'admin') {
      setSelectedRole('admin');
    }
  };

  const getRoleLabel = (r: string) => {
    switch (r) {
      case 'donor':
        return t('roleDonor');
      case 'student':
        return t('roleStudent');
      case 'teacher':
        return t('roleTeacher');
      case 'organization':
        return t('roleOrganization');
      case 'admin':
        return t('roleAdmin');
      case 'super_admin':
        return t('roleSuperAdmin');
      default:
        return r;
    }
  };

  const syncProfileWithBackend = async (token: string, roleToSync: string) => {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
    const res = await fetch(`${apiUrl}/auth/sync-profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ role: roleToSync }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(
        errData.message || 'সার্ভার প্রোফাইল সিঙ্ক করতে সমস্যা হয়েছে'
      );
    }
    return res.json();
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const user = await loginWithGoogle();
      const token = await user.getIdToken();

      // Sync role selection to database
      const userData = await syncProfileWithBackend(token, selectedRole);

      // If first-time google login without local password, must set password
      if (!userData.isPasswordSet) {
        router.push('/set-password');
      } else {
        if (
          ['master_admin', 'super_admin', 'admin'].includes(userData.role)
        ) {
          router.push('/admin');
        } else {
          router.push('/');
        }
      }
    } catch (err: any) {
      setError(err.message || 'গুগল লগইনে সমস্যা হয়েছে');
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isRegister) {
        const user = await registerWithEmail(email, password);
        const token = await user.getIdToken();
        const userData = await syncProfileWithBackend(token, selectedRole);
        if (
          ['master_admin', 'super_admin', 'admin'].includes(userData.role)
        ) {
          router.push('/admin');
        } else {
          router.push('/');
        }
      } else {
        const user = await loginWithEmail(email, password);
        const token = await user.getIdToken();
        const userData = await syncProfileWithBackend(token, selectedRole);
        if (
          ['master_admin', 'super_admin', 'admin'].includes(userData.role)
        ) {
          router.push('/admin');
        } else {
          router.push('/');
        }
      }
    } catch (err: any) {
      setError(err.message || 'অথেনটিকেশনে ত্রুটি দেখা দিয়েছে');
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        {/* Role Selection Category Cards */}
        <div className={styles.roleSection}>
          <div className={styles.roleSectionHeader}>
            <h2 className={styles.roleSectionTitle}>
              {t('roleSelectionTitle')}
            </h2>
            <p className={styles.roleSectionSubtitle}>
              {t('roleSelectionSubtitle')}
            </p>
          </div>

          <div className={styles.categoryGrid}>
            {/* Category 1: Donor */}
            <div
              className={`${styles.categoryCard} ${
                activeCategory === 'donor' ? styles.categoryCardActive : ''
              }`}
              onClick={() => handleCategorySelect('donor')}
            >
              <div className={styles.categoryIcon}>
                <HeartHandshake size={20} />
              </div>
              <span className={styles.categoryNumber}>গ্রুপ ১</span>
              <span className={styles.categoryTitle}>
                {t('categoryDonor')}
              </span>
              <span className={styles.categorySub}>
                {t('categoryDonorSub')}
              </span>
            </div>

            {/* Category 2: Institutional (Student, Teacher, Org) */}
            <div
              className={`${styles.categoryCard} ${
                activeCategory === 'institutional'
                  ? styles.categoryCardActive
                  : ''
              }`}
              onClick={() => handleCategorySelect('institutional')}
            >
              <div className={styles.categoryIcon}>
                <GraduationCap size={20} />
              </div>
              <span className={styles.categoryNumber}>গ্রুপ ২</span>
              <span className={styles.categoryTitle}>
                {t('categoryInstitutional')}
              </span>
              <span className={styles.categorySub}>
                {t('categoryInstitutionalSub')}
              </span>
            </div>

            {/* Category 3: Admin & Super Admin */}
            <div
              className={`${styles.categoryCard} ${
                activeCategory === 'admin' ? styles.categoryCardActive : ''
              }`}
              onClick={() => handleCategorySelect('admin')}
            >
              <div className={styles.categoryIcon}>
                <ShieldCheck size={20} />
              </div>
              <span className={styles.categoryNumber}>গ্রুপ ৩</span>
              <span className={styles.categoryTitle}>
                {t('categoryAdmin')}
              </span>
              <span className={styles.categorySub}>
                {t('categoryAdminSub')}
              </span>
            </div>
          </div>

          {/* Subrole Selectors */}
          {activeCategory === 'institutional' && (
            <div className={styles.subRoleWrapper}>
              <span className={styles.subRoleLabel}>
                সুনির্দিষ্ট প্রাতিষ্ঠানিক ভূমিকা নির্বাচন করুন:
              </span>
              <div className={styles.subRoleChips}>
                <button
                  type="button"
                  onClick={() => setSelectedRole('student')}
                  className={`${styles.subRoleChip} ${
                    selectedRole === 'student' ? styles.subRoleChipActive : ''
                  }`}
                >
                  {t('roleStudent')}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole('teacher')}
                  className={`${styles.subRoleChip} ${
                    selectedRole === 'teacher' ? styles.subRoleChipActive : ''
                  }`}
                >
                  {t('roleTeacher')}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole('organization')}
                  className={`${styles.subRoleChip} ${
                    selectedRole === 'organization'
                      ? styles.subRoleChipActive
                      : ''
                  }`}
                >
                  {t('roleOrganization')}
                </button>
              </div>
            </div>
          )}

          {activeCategory === 'admin' && (
            <div className={styles.subRoleWrapper}>
              <span className={styles.subRoleLabel}>
                প্রশাসনিক পদবি নির্বাচন করুন:
              </span>
              <div className={styles.subRoleChips}>
                <button
                  type="button"
                  onClick={() => setSelectedRole('admin')}
                  className={`${styles.subRoleChip} ${
                    selectedRole === 'admin' ? styles.subRoleChipActive : ''
                  }`}
                >
                  {t('roleAdmin')}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole('super_admin')}
                  className={`${styles.subRoleChip} ${
                    selectedRole === 'super_admin'
                      ? styles.subRoleChipActive
                      : ''
                  }`}
                >
                  {t('roleSuperAdmin')}
                </button>
              </div>
            </div>
          )}

          {/* Selected Role Summary Indicator */}
          <div className={styles.selectedSummary}>
            <span className={styles.selectedSummaryLabel}>
              {t('selectedRoleInfo')}:
            </span>
            <span className={styles.selectedSummaryRole}>
              {getRoleLabel(selectedRole)}
            </span>
          </div>
        </div>

        {/* Tab Headers (Login vs Register) */}
        <div className={styles.tabHeader}>
          <button
            onClick={() => setIsRegister(false)}
            className={`${styles.tabBtn} ${
              !isRegister ? styles.tabActive : ''
            }`}
          >
            {t('loginTitle')}
          </button>
          <button
            onClick={() => setIsRegister(true)}
            className={`${styles.tabBtn} ${
              isRegister ? styles.tabActive : ''
            }`}
          >
            {t('registerTitle')}
          </button>
        </div>

        {error && (
          <div className={styles.errorBox}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Google 1-Click Login Button with Role Indicator */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className={styles.googleBtn}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>
            {t('googleLoginAs', { role: getRoleLabel(selectedRole) })}
          </span>
        </button>

        <div className={styles.divider}>
          <span>{t('orWithEmail')}</span>
        </div>

        {/* 2. Email & Password Form */}
        <form onSubmit={handleEmailAuth} className={styles.form}>
          {isRegister && (
            <>
              <div className={styles.field}>
                <label>{t('fullNameLabel')}</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="আপনার পূর্ণ নাম"
                />
              </div>

              <div className={styles.field}>
                <label>{t('phoneLabel')}</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+8801XXXXXXXXX"
                />
              </div>
            </>
          )}

          <div className={styles.field}>
            <label>{t('emailLabel')}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@mail.com"
            />
          </div>

          <div className={styles.field}>
            <label>{t('passwordLabel')}</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={styles.submitBtn}
          >
            {isRegister ? <UserPlus size={18} /> : <LogIn size={18} />}
            <span>
              {loading
                ? commonT('loading')
                : isRegister
                ? `${t('registerTitle')} (${getRoleLabel(selectedRole)})`
                : `${t('loginTitle')} (${getRoleLabel(selectedRole)})`}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}

