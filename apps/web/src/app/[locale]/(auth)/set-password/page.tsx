'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '../../../../i18n/routing';
import styles from './page.module.css';
import { Lock, ShieldCheck, AlertCircle } from 'lucide-react';

export default function SetPasswordPage() {
  const t = useTranslations('Auth');
  const commonT = useTranslations('Common');
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('পাসওয়ার্ড ন্যূনতম ৮ অক্ষরের হতে হবে।');
      return;
    }
    if (password !== confirmPassword) {
      setError('উভয় পাসওয়ার্ড হুবহু এক হতে হবে।');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Calls API /auth/set-password
      // Simulated response for client interaction:
      setTimeout(() => {
        setLoading(false);
        router.push('/');
      }, 800);
    } catch (err: any) {
      setError(err.message || 'পাসওয়ার্ড সেট করতে সমস্যা হয়েছে');
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.iconCircle}>
            <Lock size={32} />
          </div>
          <h1>{t('setPasswordTitle')}</h1>
          <p>{t('setPasswordDesc')}</p>
        </div>

        {error && (
          <div className={styles.errorBox}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
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

          <div className={styles.field}>
            <label>{t('confirmPasswordLabel')}</label>
            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={styles.submitBtn}
          >
            <ShieldCheck size={20} />
            <span>
              {loading ? commonT('loading') : t('setPasswordBtn')}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
