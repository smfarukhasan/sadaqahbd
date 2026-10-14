'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { loginWithEmail } from '@/lib/firebase';
import { getApiUrl } from '@/lib/api-config';
import { ShieldAlert, Key, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';
import styles from './page.module.css';

export default function MasterAdminGatePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const loadingAuth = useAuthStore((s) => s.loading);

  // Security: Inputs start completely empty with zero suggestions or pre-filled data
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // If already authenticated with root/super admin access, route directly to unified dashboard
  useEffect(() => {
    if (!loadingAuth && user) {
      if (user.role === 'master_admin' || user.role === 'super_admin' || user.role === 'admin') {
        router.replace('/bn/admin');
      }
    }
  }, [user, loadingAuth, router]);

  const handleMasterLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier) {
      setLoginError('অনুগ্রহ করে আপনার অ্যাডমিন ইমেইল বা ইউজারনেম প্রদান করুন।');
      return;
    }
    if (!password) {
      setLoginError('অনুগ্রহ করে পাসওয়ার্ড প্রদান করুন।');
      return;
    }

    setIsLoggingIn(true);
    const apiUrl = getApiUrl();
    const cleanEmail = cleanIdentifier.toLowerCase();

    try {
      // 1. Authenticate via direct API database endpoint
      const res = await fetch(`${apiUrl}/auth/local-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: cleanIdentifier,
          password,
        }),
      });

      const resData = await res.json().catch(() => ({}));

      if (res.ok && resData.user) {
        const loggedUser = resData.user;
        // Verify administrative authorization
        if (
          loggedUser.role !== 'master_admin' &&
          loggedUser.role !== 'super_admin' &&
          loggedUser.role !== 'admin'
        ) {
          setLoginError('অ্যাক্সেস প্রত্যাখ্যাত: এই অ্যাকাউন্টে অ্যাডমিনিস্ট্রেটিভ পারমিশন নেই।');
          setIsLoggingIn(false);
          // Field values preserved
          return;
        }

        if (resData.token && typeof window !== 'undefined') {
          localStorage.setItem('sadaqahbd_auth_token', resData.token);
        }
        if (typeof window !== 'undefined') {
          localStorage.setItem('sadaqahbd_local_user', JSON.stringify(loggedUser));
          if (loggedUser.role === 'master_admin') {
            localStorage.setItem('sadaqahbd_master_admin', JSON.stringify(loggedUser));
          }
        }

        // Firebase background session sync if exists
        try {
          await loginWithEmail(cleanEmail, password).catch(() => null);
        } catch {}

        useAuthStore.getState().setUser(loggedUser);
        router.replace('/bn/admin');
        return;
      }

      // 2. If API returned a specific failure reason, display clear warning
      if (!res.ok && resData.message) {
        const msg = String(resData.message).toLowerCase();
        if (msg.includes('কোনো অ্যাকাউন্ট পাওয়া যায়নি') || msg.includes('not found') || msg.includes('user')) {
          setLoginError('প্রদত্ত ইমেইল বা ইউজারনেমে কোনো অ্যাডমিন অ্যাকাউন্ট পাওয়া যায়নি।');
        } else if (msg.includes('পাসওয়ার্ড') || msg.includes('password') || msg.includes('ম্যাচ')) {
          setLoginError('প্রদত্ত পাসওয়ার্ডটি সঠিক নয়। অনুগ্রহ করে পুনরায় চেক করুন।');
        } else if (msg.includes('স্থগিত') || msg.includes('suspended')) {
          setLoginError('আপনার অ্যাকাউন্টটি সাময়িকভাবে স্থগিত (Suspended) রয়েছে।');
        } else {
          setLoginError(resData.message);
        }
        setIsLoggingIn(false);
        // Field values are preserved (not cleared)
        return;
      }

      // 3. Fallback: Firebase Authentication verification
      try {
        const fbUser = await loginWithEmail(cleanEmail, password);
        const appUser = await useAuthStore.getState().syncProfile(fbUser);
        if (
          appUser &&
          (appUser.role === 'master_admin' || appUser.role === 'super_admin' || appUser.role === 'admin')
        ) {
          router.replace('/bn/admin');
          return;
        } else {
          setLoginError('অ্যাক্সেস প্রত্যাখ্যাত: এই অ্যাকাউন্টে অ্যাডমিনিস্ট্রেটিভ পারমিশন নেই।');
        }
      } catch (fbErr: any) {
        const code = fbErr?.code || '';
        if (code === 'auth/user-not-found' || code === 'auth/invalid-email') {
          setLoginError('প্রদত্ত ইমেইল বা ইউজারনেমে কোনো অ্যাডমিন অ্যাকাউন্ট পাওয়া যায়নি।');
        } else if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
          setLoginError('প্রদত্ত পাসওয়ার্ডটি সঠিক নয়। অনুগ্রহ করে পুনরায় চেক করুন।');
        } else if (code === 'auth/too-many-requests') {
          setLoginError('অতিরিক্ত ভুল প্রচেষ্টার কারণে সাময়িক স্থগিত। কিছুক্ষণ পর পুনরায় চেষ্টা করুন।');
        } else {
          setLoginError('লগইন যাচাই ব্যর্থ হয়েছে। আপনার ইমেইল ও পাসওয়ার্ড চেক করুন।');
        }
      }
    } catch (networkErr: any) {
      setLoginError('সার্ভারের সাথে সংযোগ স্থাপন করা সম্ভব হয়নি। ইন্টারনেট কানেকশন চেক করুন।');
    } finally {
      setIsLoggingIn(false);
      // Field values (identifier, password) are NOT cleared so user can fix typos
    }
  };

  return (
    <div className={styles.loginWrapper}>
      <div className={styles.loginCard}>
        <div className={styles.lockHeader}>
          <div className={styles.lockIconWrapper}>
            <ShieldAlert size={36} />
          </div>
          <h1>মাস্টার এডমিন সুরক্ষিত প্রবেশদ্বার</h1>
          <p>সাদাকাহ বিডি — একক নিয়ন্ত্রক ড্যাশবোর্ড অ্যাক্সেস পোর্টাল</p>
        </div>

        {loginError && (
          <div className={styles.errorAlert}>
            <AlertTriangle size={18} />
            <span>{loginError}</span>
          </div>
        )}

        <form onSubmit={handleMasterLogin} className={styles.form} autoComplete="off">
          <div className={styles.field}>
            <label>অ্যাডমিন ইমেইল বা ইউজারনেম</label>
            <input
              type="text"
              name="admin_user_identifier"
              id="admin_user_identifier"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="আপনার ইউজারনেম বা ইমেইল লিখুন"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              data-lpignore="true"
            />
          </div>

          <div className={styles.field}>
            <label>মাস্টার সিক্রেট পাসওয়ার্ড</label>
            <input
              type="password"
              name="admin_secret_key"
              id="admin_secret_key"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="পাসওয়ার্ড লিখুন"
              autoComplete="new-password"
              data-lpignore="true"
            />
          </div>

          <button type="submit" disabled={isLoggingIn} className={styles.submitBtn}>
            {isLoggingIn ? <Loader2 size={18} className="animate-spin" /> : <Key size={18} />}
            <span>{isLoggingIn ? 'যাচাই করা হচ্ছে...' : 'মাস্টার প্যানেলে প্রবেশ করুন'}</span>
            {!isLoggingIn && <ArrowRight size={16} />}
          </button>
        </form>
      </div>
    </div>
  );
}
