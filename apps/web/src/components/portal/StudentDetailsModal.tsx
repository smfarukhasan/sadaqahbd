'use client';

import React, { useState, useEffect } from 'react';
import styles from './StudentDetailsModal.module.css';
import { useAuthStore } from '../../lib/auth-store';
import { getApiUrl } from '../../lib/api-config';
import { getAuthToken } from '../../lib/auth-token';
import {
  GraduationCap,
  X,
  User,
  MapPin,
  HeartHandshake,
  Heart,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  FileText,
  Phone,
  Mail,
  Building,
  ShieldCheck,
  ExternalLink,
  Edit3,
  Save,
  RotateCcw,
} from 'lucide-react';

interface StudentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string | null;
  isBn?: boolean;
  onStudentUpdated?: () => void;
}

export default function StudentDetailsModal({
  isOpen,
  onClose,
  studentId,
  isBn = true,
  onStudentUpdated,
}: StudentDetailsModalProps) {
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const currentUser = useAuthStore((s) => s.user);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<{
    user: any;
    profile: any;
    organization: any;
    posts: any[];
  } | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [savingCorrection, setSavingCorrection] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [editFormData, setEditFormData] = useState({
    fullName: '',
    className: '',
    department: '',
    rollNumber: '',
    fatherName: '',
    dateOfBirth: '',
    bloodGroup: '',
    nidOrBirthCertificateNumber: '',
    presentAddress: '',
    permanentAddress: '',
    guardianName: '',
    guardianRelationship: '',
    guardianPhone: '',
    guardianAddress: '',
  });

  useEffect(() => {
    if (isOpen && studentId) {
      setIsEditing(false);
      setSuccessMessage('');
      fetchStudentDetails(studentId);
    } else {
      setData(null);
      setError('');
      setIsEditing(false);
      setSuccessMessage('');
    }
  }, [isOpen, studentId]);

  const initEditForm = (userData: any, profileData: any) => {
    setEditFormData({
      fullName: userData?.fullName || '',
      className: profileData?.className || '',
      department: profileData?.department || '',
      rollNumber: profileData?.rollNumber || profileData?.studentClassRoll || '',
      fatherName: profileData?.fatherName || '',
      dateOfBirth: profileData?.dateOfBirth || '',
      bloodGroup: profileData?.bloodGroup || '',
      nidOrBirthCertificateNumber: profileData?.nidOrBirthCertificateNumber || '',
      presentAddress: profileData?.presentAddress || userData?.address || '',
      permanentAddress: profileData?.permanentAddress || '',
      guardianName: profileData?.guardianName || '',
      guardianRelationship: profileData?.guardianRelationship || '',
      guardianPhone: profileData?.guardianPhone || '',
      guardianAddress: profileData?.guardianAddress || '',
    });
  };

  const fetchStudentDetails = async (id: string) => {
    try {
      setLoading(true);
      setError('');
      const token = await getAuthToken();
      if (!token) {
        throw new Error(isBn ? 'লগইন সেশন পাওয়া যায়নি। অনুগ্রহ করে পুনরায় লগইন করুন।' : 'Authentication required. Please log in again.');
      }
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/users/students/${id}/details`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.message || (isBn ? 'শিক্ষার্থীর তথ্য লোড করতে ব্যর্থ হয়েছে।' : 'Failed to load student details.'));
      }

      const json = await res.json();
      setData(json);
      initEditForm(json.user, json.profile);
    } catch (err: any) {
      console.error('Error fetching student details:', err);
      setError(err.message || (isBn ? 'নেটওয়ার্ক বা সার্ভার ত্রুটি।' : 'Network or server error.'));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCorrection = async () => {
    if (!profile?.id) return;
    try {
      setSavingCorrection(true);
      setError('');
      setSuccessMessage('');
      const token = await getAuthToken();
      if (!token) {
        throw new Error(isBn ? 'লগইন সেশন পাওয়া যায়নি। অনুগ্রহ করে পুনরায় লগইন করুন।' : 'Authentication required. Please log in again.');
      }
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/organizations/affiliations/student/${profile.id}/correct`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editFormData),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.message || (isBn ? 'তথ্য সংশোধন করতে ব্যর্থ হয়েছে।' : 'Failed to update student profile.'));
      }

      setSuccessMessage(isBn ? 'শিক্ষার্থীর তথ্য সফলভাবে সংশোধন করা হয়েছে।' : 'Student information corrected successfully.');
      setIsEditing(false);
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          user: {
            ...prev.user,
            fullName: editFormData.fullName,
            address: editFormData.presentAddress,
          },
          profile: {
            ...prev.profile,
            ...editFormData,
          },
        };
      });
      if (onStudentUpdated) {
        onStudentUpdated();
      }
    } catch (err: any) {
      console.error('Error saving student correction:', err);
      setError(err.message || (isBn ? 'তথ্য সংশোধন করতে ব্যর্থ হয়েছে।' : 'Failed to save correction.'));
    } finally {
      setSavingCorrection(false);
    }
  };

  if (!isOpen) return null;

  const user = data?.user;
  const profile = data?.profile;
  const org = data?.organization;
  const posts = data?.posts || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <span className={`${styles.statusBadge} ${styles.badgeVerified}`}>
            <CheckCircle2 size={13} />
            {isBn ? 'ভেরিফাইড শিক্ষার্থী' : 'Verified Student'}
          </span>
        );
      case 'pending_admin':
        return (
          <span className={`${styles.statusBadge} ${styles.badgePending}`}>
            <Clock size={13} />
            {isBn ? 'এডমিন অনুমোদনের অপেক্ষায়' : 'Pending Admin Clearance'}
          </span>
        );
      case 'pending_org':
        return (
          <span className={`${styles.statusBadge} ${styles.badgePending}`}>
            <Clock size={13} />
            {isBn ? 'প্রতিষ্ঠান অনুমোদনের অপেক্ষায়' : 'Pending Org Verification'}
          </span>
        );
      default:
        return (
          <span className={`${styles.statusBadge} ${styles.badgePending}`}>
            <Clock size={13} />
            {isBn ? 'অপেক্ষমাণ' : 'Pending'}
          </span>
        );
    }
  };

  const getPostStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className={`${styles.statusBadge} ${styles.badgeVerified}`}>
            <CheckCircle2 size={12} />
            {isBn ? 'অনুমোদিত' : 'Approved'}
          </span>
        );
      case 'rejected':
        return (
          <span className={`${styles.statusBadge}`} style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' }}>
            {isBn ? 'বাতিল' : 'Rejected'}
          </span>
        );
      default:
        return (
          <span className={`${styles.statusBadge} ${styles.badgePending}`}>
            <Clock size={12} />
            {isBn ? 'যাচাইাধীন' : 'Under Review'}
          </span>
        );
    }
  };

  return (
    <div className={styles.backdrop} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <GraduationCap size={22} />
            </div>
            <div>
              <h3 className={styles.headerTitle}>
                {isBn ? 'শিক্ষার্থীর বিস্তারিত প্রোফাইল' : 'Student Full Profile'}
              </h3>
              <p className={styles.headerSubtitle}>
                {isBn ? 'ব্যক্তিগত তথ্য, অভিভাবকের বিবরণ ও আর্থিক আবেদনসমূহ' : 'Personal information, guardian details & campaigns'}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {currentUser?.role === 'organization' && profile?.verificationStatus === 'pending_org' && (
              <>
                {isEditing ? (
                  <>
                    <button
                      type="button"
                      className={`${styles.editActionBtn} ${styles.editActionBtnSecondary}`}
                      onClick={() => {
                        initEditForm(user, profile);
                        setIsEditing(false);
                      }}
                      disabled={savingCorrection}
                    >
                      <RotateCcw size={14} />
                      {isBn ? 'বাতিল' : 'Cancel'}
                    </button>
                    <button
                      type="button"
                      className={`${styles.editActionBtn} ${styles.editActionBtnPrimary}`}
                      onClick={handleSaveCorrection}
                      disabled={savingCorrection}
                    >
                      {savingCorrection ? <Loader2 size={14} className="spin" /> : <Save size={14} />}
                      {isBn ? 'সংরক্ষণ' : 'Save'}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className={`${styles.editActionBtn} ${styles.editActionBtnSecondary}`}
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit3 size={14} />
                    {isBn ? 'তথ্য সংশোধন' : 'Edit Info'}
                  </button>
                )}
              </>
            )}
            {(profile?.verificationStatus === 'verified' || profile?.verificationStatus === 'pending_admin') && (
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#047857', background: '#ecfdf5', padding: '0.25rem 0.65rem', borderRadius: '14px', border: '1px solid #a7f3d0' }}>
                🔒 {isBn ? 'প্রতিষ্ঠান অনুমোদিত (অপরিবর্তনযোগ্য)' : 'Org Verified (Locked)'}
              </span>
            )}
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className={styles.body}>
          {loading && (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Loader2 size={32} className="spin" style={{ margin: '0 auto 0.75rem', color: '#059669' }} />
              <p style={{ margin: 0, fontWeight: 600 }}>
                {isBn ? 'শিক্ষার্থীর বিস্তারিত তথ্য লোড হচ্ছে...' : 'Loading student profile details...'}
              </p>
            </div>
          )}

          {error && !loading && (
            <div style={{ padding: '1rem', textAlign: 'center', color: '#dc2626', background: '#fef2f2', borderRadius: '8px', marginBottom: '1rem' }}>
              <AlertCircle size={24} style={{ margin: '0 auto 0.35rem' }} />
              <p style={{ margin: 0, fontWeight: 700 }}>{error}</p>
            </div>
          )}

          {successMessage && !loading && (
            <div style={{ padding: '0.85rem 1rem', textAlign: 'center', color: '#065f46', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', marginBottom: '1rem', fontWeight: 600, fontSize: '0.88rem' }}>
              <CheckCircle2 size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.4rem' }} />
              {successMessage}
            </div>
          )}

          {data && !loading && (
            <>
              {/* Top Hero Card */}
              <div className={styles.studentHero}>
                <div className={styles.photoWrapper}>
                  {profile?.photoUrl || user?.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile?.photoUrl || user?.avatarUrl}
                      alt={user?.fullName}
                      className={styles.photo}
                    />
                  ) : (
                    <div className={styles.photoPlaceholder}>
                      {(user?.fullName || 'S').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className={styles.heroInfo}>
                  {isEditing ? (
                    <div style={{ marginBottom: '0.5rem' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                        {isBn ? 'শিক্ষার্থীর পূর্ণ নাম' : 'Student Full Name'}
                      </label>
                      <input
                        type="text"
                        className={styles.editInput}
                        value={editFormData.fullName}
                        onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                        style={{ marginTop: '0.2rem' }}
                      />
                    </div>
                  ) : (
                    <h2 className={styles.heroName}>{user?.fullName || (isBn ? 'শিক্ষার্থী' : 'Student')}</h2>
                  )}
                  
                  <div className={styles.heroMeta}>
                    {user?.email && (
                      <span className={styles.heroMetaItem}>
                        <Mail size={14} color="#64748b" />
                        {user.email}
                      </span>
                    )}
                    {user?.phone && (
                      <span className={styles.heroMetaItem}>
                        <Phone size={14} color="#64748b" />
                        {user.phone}
                      </span>
                    )}
                  </div>

                  <div className={styles.badgesRow}>
                    {getStatusBadge(profile?.verificationStatus || 'pending_org')}
                    {(org?.name || profile?.institutionName) && (
                      <span className={`${styles.statusBadge} ${styles.badgeOrg}`}>
                        <Building size={13} />
                        {org?.name || profile?.institutionName}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 1. Academic & Institutional Information */}
              <div className={styles.sectionCard}>
                <div className={styles.cardHeader}>
                  <GraduationCap size={18} color="#059669" />
                  <h4 className={styles.cardTitle}>
                    {isBn ? 'প্রাতিষ্ঠানিক ও একাডেমিক তথ্য' : 'Academic & Institutional Details'}
                  </h4>
                </div>

                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>{isBn ? 'শিক্ষা প্রতিষ্ঠান' : 'Educational Institution'}</span>
                    <span className={styles.infoValue}>
                      {org?.name || profile?.institutionName || <span className={styles.infoValueMuted}>—</span>}
                    </span>
                  </div>

                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>{isBn ? 'শ্রেণি / ক্লাস' : 'Class / Grade'}</span>
                    <span className={styles.infoValue}>
                      {isEditing ? (
                        <input
                          type="text"
                          className={styles.editInput}
                          value={editFormData.className}
                          onChange={(e) => setEditFormData({ ...editFormData, className: e.target.value })}
                        />
                      ) : (
                        profile?.className || <span className={styles.infoValueMuted}>—</span>
                      )}
                    </span>
                  </div>

                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>{isBn ? 'বিভাগ / গ্রুপ' : 'Department / Group'}</span>
                    <span className={styles.infoValue}>
                      {isEditing ? (
                        <input
                          type="text"
                          className={styles.editInput}
                          value={editFormData.department}
                          onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                        />
                      ) : (
                        profile?.department || <span className={styles.infoValueMuted}>—</span>
                      )}
                    </span>
                  </div>

                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>{isBn ? 'রোল নম্বর' : 'Roll Number'}</span>
                    <span className={styles.infoValue}>
                      {isEditing ? (
                        <input
                          type="text"
                          className={styles.editInput}
                          value={editFormData.rollNumber}
                          onChange={(e) => setEditFormData({ ...editFormData, rollNumber: e.target.value })}
                        />
                      ) : (
                        profile?.rollNumber || profile?.studentClassRoll || <span className={styles.infoValueMuted}>—</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Personal & Identity Details */}
              <div className={styles.sectionCard}>
                <div className={styles.cardHeader}>
                  <User size={18} color="#059669" />
                  <h4 className={styles.cardTitle}>
                    {isBn ? 'ব্যক্তিগত ও পরিচিতি তথ্য' : 'Personal & Identity Details'}
                  </h4>
                </div>

                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>{isBn ? 'পিতার নাম' : "Father's Name"}</span>
                    <span className={styles.infoValue}>
                      {isEditing ? (
                        <input
                          type="text"
                          className={styles.editInput}
                          value={editFormData.fatherName}
                          onChange={(e) => setEditFormData({ ...editFormData, fatherName: e.target.value })}
                        />
                      ) : (
                        profile?.fatherName || <span className={styles.infoValueMuted}>—</span>
                      )}
                    </span>
                  </div>

                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>{isBn ? 'জন্ম তারিখ' : 'Date of Birth'}</span>
                    <span className={styles.infoValue}>
                      {isEditing ? (
                        <input
                          type="date"
                          className={styles.editInput}
                          value={editFormData.dateOfBirth}
                          onChange={(e) => setEditFormData({ ...editFormData, dateOfBirth: e.target.value })}
                        />
                      ) : profile?.dateOfBirth ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Calendar size={14} color="#059669" />
                          {profile.dateOfBirth.includes('-')
                            ? profile.dateOfBirth.split('-').reverse().join('/')
                            : profile.dateOfBirth}
                        </span>
                      ) : (
                        <span className={styles.infoValueMuted}>—</span>
                      )}
                    </span>
                  </div>

                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>{isBn ? 'রক্তের গ্রুপ' : 'Blood Group'}</span>
                    <span className={styles.infoValue}>
                      {isEditing ? (
                        <select
                          className={styles.editInput}
                          value={editFormData.bloodGroup}
                          onChange={(e) => setEditFormData({ ...editFormData, bloodGroup: e.target.value })}
                        >
                          <option value="">{isBn ? 'রক্তের গ্রুপ নির্বাচন করুন' : 'Select Blood Group'}</option>
                          {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                            <option key={bg} value={bg}>{bg}</option>
                          ))}
                        </select>
                      ) : profile?.bloodGroup ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#e11d48', fontWeight: 700 }}>
                          <Heart size={14} fill="#e11d48" color="#e11d48" />
                          {profile.bloodGroup}
                        </span>
                      ) : (
                        <span className={styles.infoValueMuted}>—</span>
                      )}
                    </span>
                  </div>

                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>{isBn ? 'জন্মনিবন্ধন নম্বর' : 'Birth Certificate / NID No'}</span>
                    <span className={styles.infoValue}>
                      {isEditing ? (
                        <input
                          type="text"
                          className={styles.editInput}
                          value={editFormData.nidOrBirthCertificateNumber}
                          onChange={(e) => setEditFormData({ ...editFormData, nidOrBirthCertificateNumber: e.target.value })}
                        />
                      ) : (
                        profile?.nidOrBirthCertificateNumber || <span className={styles.infoValueMuted}>—</span>
                      )}
                    </span>
                  </div>

                  {profile?.nidOrBirthCertificateUrl && (
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>{isBn ? 'জন্মনিবন্ধন ডকুমেন্ট' : 'Verification Document'}</span>
                      <a
                        href={profile.nidOrBirthCertificateUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          color: '#059669',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          textDecoration: 'none',
                        }}
                      >
                        <ExternalLink size={14} />
                        {isBn ? 'ডকুমেন্ট দেখুন' : 'View Document'}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Address Details */}
              <div className={styles.sectionCard}>
                <div className={styles.cardHeader}>
                  <MapPin size={18} color="#059669" />
                  <h4 className={styles.cardTitle}>
                    {isBn ? 'ঠিকানা সংক্রান্ত তথ্য' : 'Address Information'}
                  </h4>
                </div>

                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>{isBn ? 'বর্তমান ঠিকানা' : 'Present Address'}</span>
                    <span className={styles.infoValue}>
                      {isEditing ? (
                        <input
                          type="text"
                          className={styles.editInput}
                          value={editFormData.presentAddress}
                          onChange={(e) => setEditFormData({ ...editFormData, presentAddress: e.target.value })}
                        />
                      ) : (
                        profile?.presentAddress || user?.address || <span className={styles.infoValueMuted}>—</span>
                      )}
                    </span>
                  </div>

                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>{isBn ? 'স্থায়ী ঠিকানা' : 'Permanent Address'}</span>
                    <span className={styles.infoValue}>
                      {isEditing ? (
                        <input
                          type="text"
                          className={styles.editInput}
                          value={editFormData.permanentAddress}
                          onChange={(e) => setEditFormData({ ...editFormData, permanentAddress: e.target.value })}
                        />
                      ) : (
                        profile?.permanentAddress || <span className={styles.infoValueMuted}>—</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. Guardian Details */}
              <div className={styles.sectionCard}>
                <div className={styles.cardHeader}>
                  <HeartHandshake size={18} color="#059669" />
                  <h4 className={styles.cardTitle}>
                    {isBn ? 'অভিভাবকের বিবরণ' : 'Guardian Details'}
                  </h4>
                </div>

                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>{isBn ? 'অভিভাবকের নাম' : "Guardian's Name"}</span>
                    <span className={styles.infoValue}>
                      {isEditing ? (
                        <input
                          type="text"
                          className={styles.editInput}
                          value={editFormData.guardianName}
                          onChange={(e) => setEditFormData({ ...editFormData, guardianName: e.target.value })}
                        />
                      ) : (
                        profile?.guardianName || <span className={styles.infoValueMuted}>—</span>
                      )}
                    </span>
                  </div>

                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>{isBn ? 'শিক্ষার্থীর সাথে সম্পর্ক' : 'Relationship'}</span>
                    <span className={styles.infoValue}>
                      {isEditing ? (
                        <input
                          type="text"
                          className={styles.editInput}
                          value={editFormData.guardianRelationship}
                          onChange={(e) => setEditFormData({ ...editFormData, guardianRelationship: e.target.value })}
                        />
                      ) : (
                        profile?.guardianRelationship || <span className={styles.infoValueMuted}>—</span>
                      )}
                    </span>
                  </div>

                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>{isBn ? 'অভিভাবকের ফোন' : "Guardian's Phone"}</span>
                    <span className={styles.infoValue}>
                      {isEditing ? (
                        <input
                          type="tel"
                          className={styles.editInput}
                          value={editFormData.guardianPhone}
                          onChange={(e) => setEditFormData({ ...editFormData, guardianPhone: e.target.value })}
                        />
                      ) : profile?.guardianPhone ? (
                        <a href={`tel:${profile.guardianPhone}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                          {profile.guardianPhone}
                        </a>
                      ) : (
                        <span className={styles.infoValueMuted}>—</span>
                      )}
                    </span>
                  </div>

                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>{isBn ? 'অভিভাবকের ঠিকানা' : "Guardian's Address"}</span>
                    <span className={styles.infoValue}>
                      {isEditing ? (
                        <input
                          type="text"
                          className={styles.editInput}
                          value={editFormData.guardianAddress}
                          onChange={(e) => setEditFormData({ ...editFormData, guardianAddress: e.target.value })}
                        />
                      ) : (
                        profile?.guardianAddress || <span className={styles.infoValueMuted}>—</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* 5. All Student Posts / Campaigns */}
              <div className={styles.sectionCard}>
                <div className={styles.cardHeader}>
                  <FileText size={18} color="#059669" />
                  <h4 className={styles.cardTitle}>
                    {isBn
                      ? `শিক্ষার্থীর আবেদন ও অনুদান পোস্টসমূহ (${posts.length}টি)`
                      : `Student Assistance Campaigns (${posts.length})`}
                  </h4>
                </div>

                {posts.length === 0 ? (
                  <div className={styles.emptyPosts}>
                    <CheckCircle2 size={28} color="#059669" style={{ margin: '0 auto 0.4rem' }} />
                    <p style={{ margin: 0 }}>
                      {isBn
                        ? 'এই শিক্ষার্থীর এখনো কোনো আর্থিক সহায়তার পোস্ট নেই।'
                        : 'No financial assistance posts submitted by this student yet.'}
                    </p>
                  </div>
                ) : (
                  <div className={styles.postsContainer}>
                    {posts.map((post) => {
                      const totalReq = Number(post.totalRequiredAmount) || 0;
                      const received = Number(post.receivedAmount) || 0;
                      const percent = totalReq > 0 ? Math.min(100, Math.round((received / totalReq) * 100)) : 0;

                      return (
                        <div key={post.id} className={styles.postItem}>
                          <div className={styles.postTop}>
                            <h5 className={styles.postTitle}>{post.title}</h5>
                            {getPostStatusBadge(post.verificationStatus)}
                          </div>

                          {post.problemDescription && (
                            <p className={styles.postDesc}>{post.problemDescription}</p>
                          )}

                          <div className={styles.progressContainer}>
                            <div className={styles.progressBar} style={{ width: `${percent}%` }} />
                          </div>

                          <div className={styles.postAmounts}>
                            <span>
                              {isBn ? 'সংগৃহীত: ' : 'Raised: '}
                              <strong>৳{received.toLocaleString()}</strong> ({percent}%)
                            </span>
                            <span>
                              {isBn ? 'লক্ষ্যমাত্রা: ' : 'Target: '}
                              ৳{totalReq.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
