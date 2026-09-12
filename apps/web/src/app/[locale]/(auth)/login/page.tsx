'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '../../../../i18n/routing';
import styles from './page.module.css';
import { loginWithGoogle, loginWithEmail, registerWithEmail } from '../../../../lib/firebase';
import { LogIn, UserPlus, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const t = useTranslations('Auth');
  const commonT = useTranslations('Common');
  const router = useRouter();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('donor');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const user = await loginWithGoogle();
      // Check backend profile sync
      // If first-time google user, forward to set password
      router.push('/set-password');
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
        await registerWithEmail(email, password);
        router.push('/');
      } else {
        await loginWithEmail(email, password);
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || 'অথেনটিকেশনে ত্রুটি দেখা দিয়েছে');
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.tabHeader}>
          <button
            onClick={() => setIsRegister(false)}
            className={`${styles.tabBtn} ${!isRegister ? styles.tabActive : ''}`}
          >
            {t('loginTitle')}
          </button>
          <button
            onClick={() => setIsRegister(true)}
            className={`${styles.tabBtn} ${isRegister ? styles.tabActive : ''}`}
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

        {/* 1. Google 1-Click Login Button */}
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
          <span>{t('googleLogin')}</span>
        </button>

        <div className={styles.divider}>
          <span>অথবা ইমেইল দিয়ে</span>
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

              <div className={styles.field}>
                <label>{t('roleLabel')}</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className={styles.select}
                >
                  <option value="donor">ডোনার (সহায়তা প্রদানকারী)</option>
                  <option value="student">শিক্ষার্থী (সহায়তা গ্রহণকারী)</option>
                  <option value="teacher">শিক্ষক (যাচাইকারী)</option>
                  <option value="organization">প্রতিষ্ঠান (অর্গানাইজেশন)</option>
                </select>
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
                ? t('registerTitle')
                : t('loginTitle')}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
