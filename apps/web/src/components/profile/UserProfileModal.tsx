'use client';

import React, { useState } from 'react';
import styles from './UserProfileModal.module.css';
import { useAuthStore } from '../../lib/auth-store';
import { getApiUrl } from '../../lib/api-config';
import {
  User,
  X,
  KeyRound,
  FileEdit,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  isBn?: boolean;
  initialTab?: 'profile' | 'password';
}

export default function UserProfileModal({
  isOpen,
  onClose,
  isBn = true,
  initialTab = 'profile',
}: UserProfileModalProps) {
  const user = useAuthStore((s) => s.user);
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const setUser = useAuthStore((s) => s.setUser);

  const [activeTab, setActiveTab] = useState<'profile' | 'password'>(initialTab);

  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Profile Form States
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password Form States
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  if (!isOpen) return null;

  const currentUser = user || {
    id: 'admin_local',
    email: 'admin@sadaqahbd.com',
    fullName: isBn ? 'এডমিন কর্মকর্তা' : 'Admin Officer',
    phone: '',
    address: '',
    role: 'admin',
    status: 'active',
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (!fullName.trim()) {
      setProfileError(isBn ? 'অনুগ্রহ করে আপনার পুরো নাম লিখুন।' : 'Please enter your full name.');
      return;
    }

    try {
      setProfileLoading(true);
      const token = await firebaseUser?.getIdToken();
      const apiUrl = getApiUrl();

      const res = await fetch(`${apiUrl}/auth/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      if (data.user) {
        setUser(data.user);
      } else if (user) {
        setUser({
          ...user,
          fullName: fullName.trim(),
          phone: phone.trim() || null,
          address: address.trim() || null,
        });
      }

      setProfileSuccess(isBn ? 'প্রোফাইল তথ্য সফলভাবে আপডেট হয়েছে!' : 'Profile updated successfully!');
    } catch (err: any) {
      setProfileError(err.message || (isBn ? 'প্রোফাইল আপডেট করতে সমস্যা হয়েছে।' : 'Error updating profile.'));
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 6) {
      setPasswordError(isBn ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' : 'Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(isBn ? 'নতুন পাসওয়ার্ড দুটি মিলছে না।' : 'Passwords do not match.');
      return;
    }

    try {
      setPasswordLoading(true);
      const token = await firebaseUser?.getIdToken();
      const apiUrl = getApiUrl();

      const res = await fetch(`${apiUrl}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to change password');
      }

      setPasswordSuccess(isBn ? 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!' : 'Password changed successfully!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.message || (isBn ? 'পাসওয়ার্ড পরিবর্তন করতে সমস্যা হয়েছে।' : 'Error changing password.'));
    } finally {
      setPasswordLoading(false);
    }
  };

  const roleNameMap: Record<string, { bn: string; en: string }> = {
    master_admin: { bn: 'মাস্টার এডমিন', en: 'Master Admin' },
    super_admin: { bn: 'সুপার এডমিন', en: 'Super Admin' },
    admin: { bn: 'এডমিন কর্মকর্তা', en: 'Admin Officer' },
    organization: { bn: 'প্রতিষ্ঠান কর্তৃপক্ষ', en: 'Organization Admin' },
    teacher: { bn: 'যাচাইকারী শিক্ষক', en: 'Teacher' },
    student: { bn: 'শিক্ষার্থী', en: 'Student' },
    donor: { bn: 'সম্মানিত দাতা', en: 'Donor' },
  };

  const roleDisplay = roleNameMap[currentUser.role]
    ? isBn
      ? roleNameMap[currentUser.role].bn
      : roleNameMap[currentUser.role].en
    : currentUser.role;

  return (
    <div className={styles.backdrop} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerTitleBox}>
            <div className={styles.headerIcon}>
              <User size={20} />
            </div>
            <div>
              <h3 className={styles.headerTitle}>
                {isBn ? 'ব্যবহারকারীর প্রোফাইল' : 'User Profile'}
              </h3>
              <p className={styles.headerSubtitle}>
                {isBn ? 'আপনার ব্যক্তিগত তথ্য ও নিরাপত্তা সেটিংস' : 'Manage your information & security'}
              </p>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className={styles.modalBody}>
          {/* User Top Card */}
          <div className={styles.userOverview}>
            <div className={styles.avatarCircle}>
              {(currentUser.fullName || currentUser.email).charAt(0).toUpperCase()}
            </div>
            <div className={styles.overviewInfo}>
              <span className={styles.overviewName}>{currentUser.fullName}</span>
              <span className={styles.overviewEmail}>{currentUser.email}</span>
              <div className={styles.roleBadge}>
                <ShieldCheck size={13} />
                <span>{roleDisplay}</span>
              </div>
            </div>
          </div>

          {/* Nav Tabs */}
          <div className={styles.tabs}>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'profile' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <FileEdit size={16} />
              <span>{isBn ? 'প্রোফাইল তথ্য' : 'Profile Details'}</span>
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'password' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('password')}
            >
              <KeyRound size={16} />
              <span>{isBn ? 'পাসওয়ার্ড পরিবর্তন' : 'Change Password'}</span>
            </button>
          </div>

          {/* Tab 1: Profile Information */}
          {activeTab === 'profile' && (
            <form onSubmit={handleUpdateProfile}>
              {profileSuccess && (
                <div className={`${styles.alert} ${styles.alertSuccess}`}>
                  <CheckCircle2 size={16} />
                  <span>{profileSuccess}</span>
                </div>
              )}
              {profileError && (
                <div className={`${styles.alert} ${styles.alertError}`}>
                  <AlertCircle size={16} />
                  <span>{profileError}</span>
                </div>
              )}

              <div className={styles.formGroup}>
                <label className={styles.label}>{isBn ? 'ইমেইল ঠিকানা (পরিবর্তনযোগ্য নয়)' : 'Email Address (Readonly)'}</label>
                <input
                  type="email"
                  value={currentUser.email}
                  disabled
                  className={`${styles.input} ${styles.inputReadonly}`}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>{isBn ? 'পূর্ণ নাম' : 'Full Name'} *</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={isBn ? 'আপনার পূর্ণ নাম লিখুন' : 'Enter full name'}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>{isBn ? 'ফোন নম্বর' : 'Phone Number'}</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={isBn ? '০১৭১২XXXXXX' : '01712XXXXXX'}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>{isBn ? 'ঠিকানা' : 'Address'}</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={isBn ? 'বাসা, রোড, এলাকা, জেলা' : 'House, Road, City'}
                  className={styles.input}
                />
              </div>

              <button
                type="submit"
                disabled={profileLoading}
                className={styles.submitBtn}
              >
                {profileLoading ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    <span>{isBn ? 'সংরক্ষণ করা হচ্ছে...' : 'Saving...'}</span>
                  </>
                ) : (
                  <span>{isBn ? 'তথ্য পরিবর্তন সংরক্ষণ করুন' : 'Save Changes'}</span>
                )}
              </button>
            </form>
          )}

          {/* Tab 2: Change Password */}
          {activeTab === 'password' && (
            <form onSubmit={handleChangePassword}>
              {passwordSuccess && (
                <div className={`${styles.alert} ${styles.alertSuccess}`}>
                  <CheckCircle2 size={16} />
                  <span>{passwordSuccess}</span>
                </div>
              )}
              {passwordError && (
                <div className={`${styles.alert} ${styles.alertError}`}>
                  <AlertCircle size={16} />
                  <span>{passwordError}</span>
                </div>
              )}

              <div className={styles.formGroup}>
                <label className={styles.label}>{isBn ? 'নতুন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)' : 'New Password (Min 6 chars)'} *</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>{isBn ? 'পাসওয়ার্ড নিশ্চিতকরণ' : 'Confirm New Password'} *</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className={styles.input}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={passwordLoading}
                className={styles.submitBtn}
              >
                {passwordLoading ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    <span>{isBn ? 'পাসওয়ার্ড আপডেট হচ্ছে...' : 'Updating Password...'}</span>
                  </>
                ) : (
                  <span>{isBn ? 'নতুন পাসওয়ার্ড সেট করুন' : 'Update Password'}</span>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
