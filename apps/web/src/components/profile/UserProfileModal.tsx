'use client';

import React, { useState, useRef, useEffect } from 'react';
import styles from './UserProfileModal.module.css';
import { useAuthStore } from '../../lib/auth-store';
import { getApiUrl } from '../../lib/api-config';
import ImageCropperModal3x4 from './ImageCropperModal3x4';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { getAuthToken } from '../../lib/auth-token';
import {
  User,
  X,
  KeyRound,
  FileEdit,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Camera,
  GraduationCap,
  Home,
  MapPin,
  HeartHandshake,
  Heart,
  Calendar,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  isBn?: boolean;
  initialTab?: 'profile' | 'password';
}

// Date Conversion Helpers
const formatForDateInput = (dob: string): string => {
  if (!dob) return '';
  const trimmed = dob.trim();
  if (trimmed.includes('/')) {
    const parts = trimmed.split('/');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }
  }
  if (trimmed.includes('-')) {
    const parts = trimmed.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) return trimmed;
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }
  }
  return '';
};

const formatForDisplay = (isoDate: string): string => {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
  }
  return isoDate;
};

// Bengali to English Digit Auto-Converter
const toEnglishDigits = (str: string): string => {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return str.replace(/[০-৯]/g, (ch) => String(bnDigits.indexOf(ch)));
};

const RELATIONSHIPS_BN = ['পিতা', 'মাতা', 'বড় ভাই', 'বড় বোন', 'চাচা / মামা', 'খালা / ফুফু', 'আইনগত অভিভাবক', 'অন্যান্য'];
const RELATIONSHIPS_EN = ['Father', 'Mother', 'Brother', 'Sister', 'Uncle', 'Aunt', 'Legal Guardian', 'Other'];

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

  // Common Profile Form States
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [fetchingStudent, setFetchingStudent] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Extended Student Profile States
  const isStudent = user?.role === 'student';
  const [fatherName, setFatherName] = useState('');
  const [className, setClassName] = useState('');
  const [department, setDepartment] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [nidNumber, setNidNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [presentAddress, setPresentAddress] = useState('');
  const [permanentAddress, setPermanentAddress] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianRelationship, setGuardianRelationship] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [guardianAddress, setGuardianAddress] = useState('');
  const [isProfileLocked, setIsProfileLocked] = useState(false);

  // Photo Upload States
  const [cropperFile, setCropperFile] = useState<File | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const openDatePicker = () => {
    if (isStudent && isProfileLocked) return;
    if (dateInputRef.current) {
      try {
        dateInputRef.current.showPicker();
      } catch {
        dateInputRef.current.focus();
      }
    }
  };

  // Password Form States
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setFullName(user?.fullName || '');
      setPhone(user?.phone || '');
      setAddress(user?.address || '');
      setProfileSuccess('');
      setProfileError('');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowOldPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setPasswordSuccess('');
      setPasswordError('');

      if (user?.role === 'student') {
        loadStudentProfile();
      }
    }
  }, [isOpen, initialTab, user]);

  const loadStudentProfile = async () => {
    try {
      setFetchingStudent(true);
      const token = await getAuthToken();
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/users/my-student-profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setIsProfileLocked(!!data.isLocked);
        if (data.profile) {
          const p = data.profile;
          setFatherName(p.fatherName || '');
          setClassName(p.className || '');
          setDepartment(p.department || '');
          setRollNumber(p.rollNumber || p.studentClassRoll || '');
          setNidNumber(p.nidOrBirthCertificateNumber || '');
          setBloodGroup(p.bloodGroup || '');
          setPresentAddress(p.presentAddress || p.address || user?.address || '');
          setPermanentAddress(p.permanentAddress || '');
          setGuardianName(p.guardianName || '');
          setGuardianRelationship(p.guardianRelationship || '');
          setGuardianPhone(p.guardianPhone || '');
          setGuardianAddress(p.guardianAddress || '');

          // Parse Date of Birth into YYYY-MM-DD for date picker
          if (p.dateOfBirth) {
            setDateOfBirth(formatForDateInput(p.dateOfBirth));
          }
        }
      }
    } catch (err) {
      console.error('Failed to load student profile:', err);
    } finally {
      setFetchingStudent(false);
    }
  };

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

  const handleFileSelected = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setCropperFile(file);
  };

  const handleAvatarUpload = async (croppedDataUrl: string) => {
    setCropperFile(null);
    setAvatarUploading(true);
    setProfileError('');
    try {
      const token = await getAuthToken();
      const apiUrl = getApiUrl();
      const endpoint = isStudent ? `${apiUrl}/users/my-student-profile` : `${apiUrl}/auth/profile`;
      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ avatarUrl: croppedDataUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload failed');
      if (data.user) setUser(data.user);
      else if (user) setUser({ ...user, avatarUrl: croppedDataUrl });
      setProfileSuccess(isBn ? 'প্রোফাইল ছবি সফলভাবে আপলোড হয়েছে!' : 'Profile photo uploaded successfully!');
    } catch (err: any) {
      setProfileError(err.message || (isBn ? 'ছবি আপলোড করতে সমস্যা হয়েছে।' : 'Error uploading photo.'));
    } finally {
      setAvatarUploading(false);
    }
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
      const token = await getAuthToken();
      const apiUrl = getApiUrl();

      let res: Response;

      if (isStudent) {
        const dobStr = dateOfBirth ? formatForDisplay(dateOfBirth) : undefined;

        res = await fetch(`${apiUrl}/users/my-student-profile`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            fullName: fullName.trim(),
            phone: phone.trim() || undefined,
            address: presentAddress.trim() || address.trim() || undefined,
            fatherName: fatherName.trim() || undefined,
            className: className.trim() || undefined,
            department: department.trim() || undefined,
            rollNumber: rollNumber.trim() || undefined,
            nidOrBirthCertificateNumber: nidNumber.trim() || undefined,
            dateOfBirth: dobStr || undefined,
            bloodGroup: bloodGroup.trim() || undefined,
            presentAddress: presentAddress.trim() || undefined,
            permanentAddress: permanentAddress.trim() || undefined,
            guardianName: guardianName.trim() || undefined,
            guardianRelationship: guardianRelationship.trim() || undefined,
            guardianPhone: guardianPhone.trim() || undefined,
            guardianAddress: guardianAddress.trim() || undefined,
          }),
        });
      } else {
        res = await fetch(`${apiUrl}/auth/profile`, {
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
      }

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
          address: (presentAddress || address).trim() || null,
        });
      }

      setProfileSuccess(isBn ? 'প্রোফাইল তথ্য সফলভাবে আপডেট হয়েছে!' : 'Profile updated successfully!');
    } catch (err: any) {
      setProfileError(err.message || (isBn ? 'প্রোফাইল আপডেট করতে সমস্যা হয়েছে।' : 'Error updating profile.'));
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!oldPassword.trim()) {
      setPasswordError(isBn ? 'আপনার পুরাতন পাসওয়ার্ড দিন।' : 'Please enter your current password.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError(isBn ? 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' : 'New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(isBn ? 'নতুন পাসওয়ার্ড দুটি মিলছে না।' : 'Passwords do not match.');
      return;
    }

    if (oldPassword === newPassword) {
      setPasswordError(isBn ? 'নতুন পাসওয়ার্ড পুরাতন পাসওয়ার্ডের চেয়ে ভিন্ন হতে হবে।' : 'New password must be different from current password.');
      return;
    }

    try {
      setPasswordLoading(true);

      // 1. If logged in with Firebase client SDK, verify old password directly
      if (firebaseUser && firebaseUser.email) {
        try {
          const credential = EmailAuthProvider.credential(firebaseUser.email, oldPassword);
          await reauthenticateWithCredential(firebaseUser, credential);
        } catch (fbErr: any) {
          const code = fbErr?.code || '';
          if (
            code === 'auth/wrong-password' ||
            code === 'auth/invalid-credential' ||
            code === 'auth/invalid-login-credentials'
          ) {
            setPasswordError(isBn ? 'আপনার পুরাতন পাসওয়ার্ড সঠিক না' : 'Your current password is not correct.');
            return;
          }
        }
      }

      // 2. Call backend /auth/change-password with universal auth token
      const token = await getAuthToken();
      const apiUrl = getApiUrl();

      const res = await fetch(`${apiUrl}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          oldPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        const msg = data.message || '';
        if (
          msg.includes('পুরাতন পাসওয়ার্ড') ||
          msg.toLowerCase().includes('current password') ||
          msg.toLowerCase().includes('invalid')
        ) {
          setPasswordError(isBn ? 'আপনার পুরাতন পাসওয়ার্ড সঠিক না' : 'Your current password is not correct.');
          return;
        }
        throw new Error(msg || (isBn ? 'পাসওয়ার্ড পরিবর্তন করতে সমস্যা হয়েছে।' : 'Failed to change password.'));
      }

      // 3. Update password in Firebase user instance if logged in
      if (firebaseUser) {
        try {
          await updatePassword(firebaseUser, newPassword);
        } catch {}
      }

      setPasswordSuccess(isBn ? 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!' : 'Password changed successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowOldPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
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

  /* Hidden file inputs */
  const hiddenInputs = (
    <>
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="user"
        style={{ display: 'none' }}
        onChange={(e) => e.target.files?.[0] && handleFileSelected(e.target.files[0])}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => e.target.files?.[0] && handleFileSelected(e.target.files[0])}
      />
    </>
  );

  return (
    <>
      {hiddenInputs}
      {cropperFile && (
        <ImageCropperModal3x4
          imageFile={cropperFile}
          isBn={isBn}
          onConfirm={handleAvatarUpload}
          onCancel={() => setCropperFile(null)}
        />
      )}
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
              <div className={styles.avatarWrapper}>
                {user?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatarUrl}
                    alt={currentUser.fullName}
                    className={styles.avatarPhoto}
                  />
                ) : (
                  <div className={styles.avatarCircle}>
                    {(currentUser.fullName || currentUser.email).charAt(0).toUpperCase()}
                  </div>
                )}
                <button
                  type="button"
                  className={styles.cameraBadge}
                  title={isBn ? 'ছবি পরিবর্তন করুন' : 'Change photo'}
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={avatarUploading}
                >
                  {avatarUploading ? <Loader2 size={12} className="spin" /> : <Camera size={12} />}
                </button>
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

                {fetchingStudent && (
                  <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)' }}>
                    <Loader2 size={18} className="spin" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }} />
                    <span style={{ fontSize: '0.85rem' }}>{isBn ? 'শিক্ষার্থীর তথ্য লোড হচ্ছে...' : 'Loading student profile...'}</span>
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

                <div className={styles.gridCol2}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      {isBn ? 'পূর্ণ নাম' : 'Full Name'} *
                      {isStudent && isProfileLocked && (
                        <span style={{ fontSize: '0.72rem', color: '#059669', marginLeft: '0.4rem', fontWeight: 700 }}>
                          (🔒 প্রতিষ্ঠান অনুমোদিত)
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={isBn ? 'আপনার পূর্ণ নাম' : 'Enter full name'}
                      className={`${styles.input} ${isStudent && isProfileLocked ? styles.inputReadonly : ''}`}
                      disabled={isStudent && isProfileLocked}
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
                </div>

                {/* If user is a student: Show full student-specific fields */}
                {isStudent && (
                  <>
                    {isProfileLocked && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.6rem',
                          background: '#ecfdf5',
                          border: '1px solid #6ee7b7',
                          color: '#065f46',
                          borderRadius: '10px',
                          padding: '0.75rem 1rem',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          marginBottom: '1rem',
                        }}
                      >
                        <ShieldCheck size={18} color="#059669" />
                        <span>
                          {isBn
                            ? 'আপনার প্রোফাইল প্রতিষ্ঠান কর্তৃক অনুমোদিত হয়েছে। পূর্ণ নাম, পিতার নাম, জন্মনিবন্ধন, জন্ম তারিখ ও স্থায়ী ঠিকানা অপরিবর্তনযোগ্য।'
                            : 'Your profile is approved by your institution. Core identity fields are locked and immutable.'}
                        </span>
                      </div>
                    )}
                    {/* Section: Academic Info */}
                    <div className={styles.sectionDivider}>
                      <span className={styles.sectionTitle}>
                        <GraduationCap size={16} />
                        {isBn ? 'প্রাতিষ্ঠানিক ও একাডেমিক তথ্য' : 'Academic Information'}
                      </span>
                    </div>

                    <div className={styles.gridCol3}>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>{isBn ? 'ক্লাস / শ্রেণি' : 'Class / Grade'}</label>
                        <input
                          type="text"
                          value={className}
                          onChange={(e) => setClassName(e.target.value)}
                          placeholder={isBn ? 'যেমন: মিজান ও মুনশিয়াব' : 'e.g. Mizan & Munshiab'}
                          list="class-suggestions"
                          className={styles.input}
                        />
                        <datalist id="class-suggestions">
                          <option value="মিজান ও মুনশিয়াব" />
                          <option value="নাহবেমীর" />
                          <option value="হেদায়াতুন্নাহু" />
                          <option value="কাফিয়া" />
                          <option value="শরহে বেকায়া" />
                          <option value="জালালাইন" />
                          <option value="মেশকাত" />
                          <option value="দাওরায়ে হাদিস" />
                          <option value="হিফজুল কুরআন" />
                          <option value="একাদশ শ্রেণি" />
                          <option value="দ্বাদশ শ্রেণি" />
                        </datalist>
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.label}>{isBn ? 'বিভাগ / গ্রুপ' : 'Department / Group'}</label>
                        <input
                          type="text"
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          placeholder={isBn ? 'যেমন: নূরানী / নাজেরা বিভাগ' : 'e.g. Noorani / Nazera'}
                          list="dept-suggestions"
                          className={styles.input}
                        />
                        <datalist id="dept-suggestions">
                          <option value="নূরানী / নাজেরা বিভাগ" />
                          <option value="কিতাব বিভাগ" />
                          <option value="হিফজ বিভাগ" />
                          <option value="বিজ্ঞান বিভাগ" />
                          <option value="মানবিক বিভাগ" />
                          <option value="ব্যবসায় শিক্ষা বিভাগ" />
                          <option value="সাধারণ বিভাগ" />
                        </datalist>
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.label}>{isBn ? 'রোল নম্বর (English)' : 'Roll Number'}</label>
                        <input
                          type="text"
                          value={rollNumber}
                          onChange={(e) => setRollNumber(toEnglishDigits(e.target.value))}
                          placeholder={isBn ? 'যেমন: 101' : 'e.g. 101'}
                          className={styles.input}
                        />
                      </div>
                    </div>

                    {/* Section: Personal & Identity Info */}
                    <div className={styles.sectionDivider}>
                      <span className={styles.sectionTitle}>
                        <User size={16} />
                        {isBn ? 'ব্যক্তিগত ও পরিচিতি তথ্য' : 'Personal & Identity Details'}
                      </span>
                    </div>

                    <div className={styles.gridCol2}>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>
                          {isBn ? 'পিতার নাম' : "Father's Name"}
                          {isProfileLocked && (
                            <span style={{ fontSize: '0.72rem', color: '#059669', marginLeft: '0.4rem', fontWeight: 700 }}>
                              (🔒 প্রতিষ্ঠান অনুমোদিত)
                            </span>
                          )}
                        </label>
                        <input
                          type="text"
                          value={fatherName}
                          onChange={(e) => setFatherName(e.target.value)}
                          placeholder={isBn ? 'পিতার পূর্ণ নাম লিখুন' : "Enter father's full name"}
                          className={`${styles.input} ${isProfileLocked ? styles.inputReadonly : ''}`}
                          disabled={isProfileLocked}
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.label}>
                          {isBn ? 'জন্মনিবন্ধন নম্বর' : 'Birth Certificate No'}
                          {isProfileLocked && (
                            <span style={{ fontSize: '0.72rem', color: '#059669', marginLeft: '0.4rem', fontWeight: 700 }}>
                              (🔒 প্রতিষ্ঠান অনুমোদিত)
                            </span>
                          )}
                        </label>
                        <input
                          type="text"
                          value={nidNumber}
                          onChange={(e) => setNidNumber(e.target.value)}
                          placeholder={isBn ? '১৭ ডিজিটের জন্মনিবন্ধন নম্বর' : 'Birth certificate or NID number'}
                          className={`${styles.input} ${isProfileLocked ? styles.inputReadonly : ''}`}
                          disabled={isProfileLocked}
                        />
                      </div>
                    </div>

                    {/* Date of Birth Picker & Blood Group in One Row */}
                    <div className={styles.gridCol2}>
                      <div className={styles.formGroup}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                          <label
                            className={styles.label}
                            style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: isProfileLocked ? 'default' : 'pointer' }}
                            onClick={openDatePicker}
                          >
                            <Calendar size={15} color="#059669" />
                            {isBn ? 'জন্ম তারিখ (ডেট পিকার)' : 'Date of Birth (Date Picker)'}
                            {isProfileLocked && (
                              <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700 }}>
                                (🔒 অপরিবর্তনযোগ্য)
                              </span>
                            )}
                          </label>
                          {dateOfBirth && (
                            <span
                              style={{
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                color: '#059669',
                                backgroundColor: '#ecfdf5',
                                border: '1px solid #a7f3d0',
                                padding: '0.1rem 0.45rem',
                                borderRadius: '6px',
                              }}
                            >
                              {formatForDisplay(dateOfBirth)}
                            </span>
                          )}
                        </div>
                        <div className={styles.dateInputWrapper} onClick={openDatePicker}>
                          <input
                            ref={dateInputRef}
                            type="date"
                            value={dateOfBirth}
                            onChange={(e) => setDateOfBirth(e.target.value)}
                            onClick={(e) => {
                              if (isProfileLocked) return;
                              try {
                                e.currentTarget.showPicker();
                              } catch {}
                            }}
                            onFocus={(e) => {
                              if (isProfileLocked) return;
                              try {
                                e.currentTarget.showPicker();
                              } catch {}
                            }}
                            onKeyDown={(e) => {
                              if (isProfileLocked) return;
                              if (e.key === 'Tab' || e.key === 'Escape') return;
                              e.preventDefault();
                              try {
                                e.currentTarget.showPicker();
                              } catch {}
                            }}
                            max={new Date().toISOString().split('T')[0]}
                            min="1960-01-01"
                            disabled={isProfileLocked}
                            className={`${styles.input} ${styles.datePickerInput} ${isProfileLocked ? styles.inputReadonly : ''}`}
                            style={{
                              fontSize: '0.88rem',
                              fontWeight: 600,
                            }}
                          />
                        </div>
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Heart size={14} color="#dc2626" />
                          {isBn ? 'রক্তের গ্রুপ' : 'Blood Group'}
                        </label>
                        <select
                          value={bloodGroup}
                          onChange={(e) => setBloodGroup(e.target.value)}
                          className={styles.selectInput}
                        >
                          <option value="">{isBn ? 'রক্তের গ্রুপ সিলেক্ট করুন' : 'Select blood group'}</option>
                          {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                            <option key={bg} value={bg}>
                              {bg}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Section: Addresses */}
                    <div className={styles.sectionDivider}>
                      <span className={styles.sectionTitle}>
                        <MapPin size={16} />
                        {isBn ? 'ঠিকানা সংক্রান্ত তথ্য' : 'Address Details'}
                      </span>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>{isBn ? 'বর্তমান ঠিকানা' : 'Present Address'}</label>
                      <input
                        type="text"
                        value={presentAddress}
                        onChange={(e) => setPresentAddress(e.target.value)}
                        placeholder={isBn ? 'বাসা/রোড, এলাকা, ডাকঘর, উপজেলা, জেলা' : 'House, Road, City, District'}
                        className={styles.input}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        {isBn ? 'স্থায়ী ঠিকানা' : 'Permanent Address'}
                        {isProfileLocked && (
                          <span style={{ fontSize: '0.72rem', color: '#059669', marginLeft: '0.4rem', fontWeight: 700 }}>
                            (🔒 প্রতিষ্ঠান অনুমোদিত)
                          </span>
                        )}
                      </label>
                      <input
                        type="text"
                        value={permanentAddress}
                        onChange={(e) => setPermanentAddress(e.target.value)}
                        placeholder={isBn ? 'গ্রাম/মহল্লা, ডাকঘর, উপজেলা, জেলা' : 'Village, Post Office, Upazila, District'}
                        className={`${styles.input} ${isProfileLocked ? styles.inputReadonly : ''}`}
                        disabled={isProfileLocked}
                      />
                    </div>

                    {/* Section: Guardian Information */}
                    <div className={styles.sectionDivider}>
                      <span className={styles.sectionTitle}>
                        <HeartHandshake size={16} />
                        {isBn ? 'অভিভাবকের তথ্য' : 'Guardian Details'}
                      </span>
                    </div>

                    <div className={styles.gridCol2}>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>{isBn ? 'অভিভাবকের নাম' : "Guardian's Name"}</label>
                        <input
                          type="text"
                          value={guardianName}
                          onChange={(e) => setGuardianName(e.target.value)}
                          placeholder={isBn ? 'অভিভাবকের পূর্ণ নাম' : "Guardian's full name"}
                          className={styles.input}
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.label}>{isBn ? 'শিক্ষার্থীর সাথে সম্পর্ক' : 'Relationship'}</label>
                        <select
                          value={guardianRelationship}
                          onChange={(e) => setGuardianRelationship(e.target.value)}
                          className={styles.selectInput}
                        >
                          <option value="">{isBn ? 'সম্পর্ক সিলেক্ট করুন' : 'Select relationship'}</option>
                          {(isBn ? RELATIONSHIPS_BN : RELATIONSHIPS_EN).map((r, idx) => (
                            <option key={r} value={RELATIONSHIPS_BN[idx]}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className={styles.gridCol2}>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>{isBn ? 'অভিভাবকের ফোন নম্বর' : "Guardian's Phone"}</label>
                        <input
                          type="tel"
                          value={guardianPhone}
                          onChange={(e) => setGuardianPhone(e.target.value)}
                          placeholder={isBn ? '০১৭১২XXXXXX' : '01712XXXXXX'}
                          className={styles.input}
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.label}>{isBn ? 'অভিভাবকের ঠিকানা' : "Guardian's Address"}</label>
                        <input
                          type="text"
                          value={guardianAddress}
                          onChange={(e) => setGuardianAddress(e.target.value)}
                          placeholder={isBn ? 'অভিভাবকের বর্তমান অবস্থান' : "Guardian's location/address"}
                          className={styles.input}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* For non-students: Regular address */}
                {!isStudent && (
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
                )}

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

                {/* 1. Old / Current Password */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    {isBn ? 'পুরাতন পাসওয়ার্ড' : 'Current Password'} *
                  </label>
                  <div className={styles.passwordInputWrapper}>
                    <input
                      type={showOldPassword ? 'text' : 'password'}
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder={isBn ? 'আপনার বর্তমান পাসওয়ার্ড লিখুন' : 'Enter current password'}
                      className={`${styles.input} ${styles.passwordInput}`}
                      required
                    />
                    <button
                      type="button"
                      className={styles.eyeToggleBtn}
                      onClick={() => setShowOldPassword((prev) => !prev)}
                      tabIndex={-1}
                      title={showOldPassword ? (isBn ? 'লুকান' : 'Hide') : (isBn ? 'দেখান' : 'Show')}
                    >
                      {showOldPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* 2. New Password */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    {isBn ? 'নতুন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)' : 'New Password (Min 6 chars)'} *
                  </label>
                  <div className={styles.passwordInputWrapper}>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={isBn ? 'নতুন পাসওয়ার্ড লিখুন' : 'Enter new password'}
                      className={`${styles.input} ${styles.passwordInput}`}
                      required
                    />
                    <button
                      type="button"
                      className={styles.eyeToggleBtn}
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      tabIndex={-1}
                      title={showNewPassword ? (isBn ? 'লুকান' : 'Hide') : (isBn ? 'দেখান' : 'Show')}
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {newPassword.length > 0 && newPassword.length < 6 && (
                    <span className={`${styles.liveHint} ${styles.liveHintError}`}>
                      <AlertCircle size={13} />
                      {isBn
                        ? `কমপক্ষে ৬ অক্ষর প্রয়োজন (এখন ${newPassword.length}টি)`
                        : `At least 6 characters required (currently ${newPassword.length})`}
                    </span>
                  )}
                  {newPassword.length >= 6 && (
                    <span className={`${styles.liveHint} ${styles.liveHintSuccess}`}>
                      <CheckCircle2 size={13} />
                      {isBn ? 'পাসওয়ার্ডের দৈর্ঘ্য গ্রহণযোগ্য' : 'Password length is acceptable'}
                    </span>
                  )}
                </div>

                {/* 3. Confirm New Password */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    {isBn ? 'নতুন পাসওয়ার্ড নিশ্চিতকরণ' : 'Confirm New Password'} *
                  </label>
                  <div className={styles.passwordInputWrapper}>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={isBn ? 'নতুন পাসওয়ার্ড পুনরায় লিখুন' : 'Re-enter new password'}
                      className={`${styles.input} ${styles.passwordInput} ${
                        confirmPassword.length > 0
                          ? confirmPassword === newPassword
                            ? styles.passwordMatchSuccess
                            : styles.passwordMatchError
                          : ''
                      }`}
                      required
                    />
                    <button
                      type="button"
                      className={styles.eyeToggleBtn}
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      tabIndex={-1}
                      title={showConfirmPassword ? (isBn ? 'লুকান' : 'Hide') : (isBn ? 'দেখান' : 'Show')}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Live match feedback */}
                  {confirmPassword.length > 0 && (
                    confirmPassword === newPassword ? (
                      <span className={`${styles.liveHint} ${styles.liveHintSuccess}`}>
                        <CheckCircle2 size={13} />
                        {isBn ? 'নতুন পাসওয়ার্ড দুটি মিলেছে ✓' : 'Passwords match ✓'}
                      </span>
                    ) : (
                      <span className={`${styles.liveHint} ${styles.liveHintError}`}>
                        <AlertCircle size={13} />
                        {isBn ? 'নতুন পাসওয়ার্ড দুটি মিলছে না ✕' : 'Passwords do not match ✕'}
                      </span>
                    )
                  )}
                </div>

                <button
                  type="submit"
                  disabled={
                    passwordLoading ||
                    !oldPassword ||
                    !newPassword ||
                    newPassword.length < 6 ||
                    newPassword !== confirmPassword
                  }
                  className={styles.submitBtn}
                >
                  {passwordLoading ? (
                    <>
                      <Loader2 size={16} className="spin" />
                      <span>{isBn ? 'পাসওয়ার্ড আপডেট হচ্ছে...' : 'Updating Password...'}</span>
                    </>
                  ) : (
                    <span>{isBn ? 'পাসওয়ার্ড পরিবর্তন করুন' : 'Change Password'}</span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
