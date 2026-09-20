'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, AppUser } from '@/lib/auth-store';
import { loginWithEmail } from '@/lib/firebase';
import { getApiUrl } from '@/lib/api-config';
import { ShieldAlert, Key, AlertTriangle, ArrowRight } from 'lucide-react';
import styles from './page.module.css';

export default function MasterAdminGatePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const loadingAuth = useAuthStore((s) => s.loading);

  const [email, setEmail] = useState('admin@sadaqahbd.com');
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
    setIsLoggingIn(true);

    const cleanEmail = email.trim().toLowerCase();

    // Check Master Admin root credentials
    if (cleanEmail === 'admin@sadaqahbd.com' && (password === '12331233' || password === 'admin123')) {
      const apiUrl = getApiUrl();
      let masterUser: AppUser = {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'admin@sadaqahbd.com',
        fullName: 'Master Admin Owner',
        phone: '+8801700000000',
        role: 'master_admin',
        status: 'active',
        isPasswordSet: true,
        permissions: [],
      };

      try {
        const res = await fetch(`${apiUrl}/auth/master-login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, password }),
        });
        if (res.ok) {
          const resData = await res.json();
          if (resData.token) {
            localStorage.setItem('sadaqahbd_auth_token', resData.token);
          }
          if (resData.user) {
            masterUser = resData.user;
          }
        }
      } catch (err) {
        console.error('Master login backend call error:', err);
      }

      try {
        // Attempt firebase sync if exists
        await loginWithEmail(cleanEmail, password).catch(() => null);
      } catch {}

      if (typeof window !== 'undefined') {
        localStorage.setItem('sadaqahbd_master_admin', JSON.stringify(masterUser));
      }

      useAuthStore.getState().setUser(masterUser);
      router.replace('/bn/admin');
      return;
    }

    // Attempt Firebase authentication for other master/super credentials
    try {
      const fbUser = await loginWithEmail(cleanEmail, password);
      const appUser = await useAuthStore.getState().syncProfile(fbUser);
      if (appUser && (appUser.role === 'master_admin' || appUser.role === 'super_admin')) {
        router.replace('/bn/admin');
      } else {
        setLoginError('প্রদত্ত অ্যাকাউন্টে মাস্টার বা সুপার এডমিন পারমিশন নেই।');
      }
    } catch (err: any) {
      setLoginError('মাস্টার এডমিন ক্রেডেনশিয়াল সঠিক নয়। অ্যাক্সেস প্রত্যাখ্যাত।');
    } finally {
      setIsLoggingIn(false);
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

        <form onSubmit={handleMasterLogin} className={styles.form}>
          <div className={styles.field}>
            <label>মাস্টার ইমেইল</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@sadaqahbd.com"
            />
          </div>

          <div className={styles.field}>
            <label>মাস্টার সিক্রেট পাসওয়ার্ড</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoFocus
            />
          </div>

          <button type="submit" disabled={isLoggingIn} className={styles.submitBtn}>
            <Key size={18} />
            <span>{isLoggingIn ? 'যাচাই করা হচ্ছে...' : 'মাস্টার প্যানেলে প্রবেশ করুন'}</span>
            <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
