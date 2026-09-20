'use client';

import React, { useState } from 'react';
import { useAuthStore } from '../../lib/auth-store';
import { auth, logoutUser } from '../../lib/firebase';
import { ShieldAlert, RefreshCw, LogOut, Mail, Lock } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function SuspendedAccountGuard() {
  const user = useAuthStore((s) => s.user);
  const syncProfile = useAuthStore((s) => s.syncProfile);
  const logout = useAuthStore((s) => s.logout);
  const params = useParams();
  const currentLocale = params?.locale === 'en' ? 'en' : 'bn';

  const [checking, setChecking] = useState(false);
  const [feedback, setFeedback] = useState('');

  // Only show if user is logged in, their status is 'suspended', and not master_admin
  if (!user || user.status !== 'suspended' || user.role === 'master_admin') {
    return null;
  }

  const handleRefreshStatus = async () => {
    setChecking(true);
    setFeedback('');
    try {
      if (auth.currentUser) {
        const updatedUser = await syncProfile(auth.currentUser);
        if (updatedUser && updatedUser.status === 'active') {
          setFeedback(
            currentLocale === 'en'
              ? 'Your account has been reactivated! Welcome back.'
              : 'আপনার একাউন্ট পুনরায় সচল করা হয়েছে! স্বাগতম।'
          );
          return;
        }
      }
      setFeedback(
        currentLocale === 'en'
          ? 'Account is still deactivated by administration.'
          : 'একাউন্টটি এখনো অ্যাডমিনিস্ট্রেশন কর্তৃক স্থগিত রয়েছে।'
      );
    } catch {
      setFeedback(
        currentLocale === 'en'
          ? 'Failed to verify status. Please check your connection.'
          : 'স্ট্যাটাস যাচাই করতে সমস্যা হয়েছে। ইন্টারনেট সংযোগ পরীক্ষা করুন।'
      );
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      await logout();
      window.location.href = `/${currentLocale}/login`;
    } catch {
      window.location.reload();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        backgroundColor: 'rgba(11, 15, 25, 0.94)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          backgroundColor: '#0f172a',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          borderRadius: '1.25rem',
          padding: '2.5rem 2rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 35px -5px rgba(239, 68, 68, 0.2)',
          textAlign: 'center',
          color: '#f8fafc',
          position: 'relative',
        }}
      >
        {/* Warning Icon Badge */}
        <div
          style={{
            width: '74px',
            height: '74px',
            borderRadius: '50%',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            border: '2px solid rgba(239, 68, 68, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            color: '#ef4444',
            boxShadow: '0 0 20px rgba(239, 68, 68, 0.25)',
          }}
        >
          <ShieldAlert size={42} />
        </div>

        {/* Title */}
        <h2
          style={{
            fontSize: '1.35rem',
            fontWeight: 800,
            color: '#ffffff',
            marginBottom: '0.65rem',
          }}
        >
          {currentLocale === 'en'
            ? 'Account Deactivated by Administration'
            : 'আপনার অ্যাকাউন্টটি স্থগিত (Deactivated) করা হয়েছে'}
        </h2>

        {/* Description */}
        <p
          style={{
            fontSize: '0.9rem',
            color: '#94a3b8',
            lineHeight: '1.6',
            marginBottom: '1.5rem',
          }}
        >
          {currentLocale === 'en'
            ? 'Platform administration has temporarily deactivated your account. All operations are restricted. Once reactivated by administration, full access will be restored immediately.'
            : 'প্ল্যাটফর্মের নিরাপত্তা বা নীতিমালার কারণে অ্যাডমিনিস্ট্রেশন আপনার অ্যাকাউন্টটি সাময়িকভাবে স্থগিত করেছে। পুনরায় সচল (Active) না করা পর্যন্ত কার্যক্রম বন্ধ থাকবে। অ্যাডমিন এক্টিভ করলে সাথে সাথে এক্সেস ফিরে পাবেন।'}
        </p>

        {/* User Info Capsule */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '2rem',
            fontSize: '0.82rem',
            color: '#cbd5e1',
            marginBottom: '1.75rem',
          }}
        >
          <Lock size={14} style={{ color: '#ef4444' }} />
          <span>{user.email}</span>
          <span
            style={{
              padding: '0.15rem 0.5rem',
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              color: '#ef4444',
              borderRadius: '1rem',
              fontSize: '0.72rem',
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            {currentLocale === 'en' ? 'Deactivated' : 'স্থগিত'}
          </span>
        </div>

        {feedback && (
          <div
            style={{
              padding: '0.75rem',
              backgroundColor: feedback.includes('reactivated') || feedback.includes('সচল')
                ? 'rgba(34, 197, 94, 0.15)'
                : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${feedback.includes('reactivated') || feedback.includes('সচল') ? '#22c55e' : '#ef4444'}`,
              borderRadius: '0.5rem',
              fontSize: '0.85rem',
              color: feedback.includes('reactivated') || feedback.includes('সচল') ? '#4ade80' : '#fca5a5',
              marginBottom: '1.5rem',
            }}
          >
            {feedback}
          </div>
        )}

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '0.85rem',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={handleRefreshStatus}
            disabled={checking}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.4rem',
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              transition: 'opacity 0.2s',
            }}
          >
            <RefreshCw
              size={16}
              style={{
                animation: checking ? 'spin 1s linear infinite' : 'none',
              }}
            />
            <span>
              {checking
                ? currentLocale === 'en'
                  ? 'Verifying...'
                  : 'যাচাই করা হচ্ছে...'
                : currentLocale === 'en'
                ? 'Check Status'
                : 'স্ট্যাটাস যাচাই করুন'}
            </span>
          </button>

          <button
            onClick={handleLogout}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.4rem',
              backgroundColor: '#1e293b',
              color: '#cbd5e1',
              border: '1px solid #334155',
              borderRadius: '0.5rem',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
            }}
          >
            <LogOut size={16} />
            <span>{currentLocale === 'en' ? 'Sign Out' : 'লগআউট'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
