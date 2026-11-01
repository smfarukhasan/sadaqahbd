'use client';

import React, { useState } from 'react';
import { useLocale } from 'next-intl';
import { X, GraduationCap, UserCheck, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { auth } from '../../lib/firebase';
import { getApiUrl } from '../../lib/api-config';
import { useAuthStore } from '../../lib/auth-store';
import { getAuthToken } from '../../lib/auth-token';
import SearchableOrgSelect from './SearchableOrgSelect';
import RequestNewOrgModal from './RequestNewOrgModal';
import styles from './RequestNewOrgModal.module.css';
import { extract11DigitPhone, isValid11DigitPhone, formatPhoneForDb } from '@sadaqahbd/schema';

interface AffiliationApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: 'teacher' | 'student';
  onSuccess?: () => void;
  initialData?: any;
}

export default function AffiliationApplyModal({
  isOpen,
  onClose,
  role,
  onSuccess,
  initialData,
}: AffiliationApplyModalProps) {
  const locale = useLocale();
  const isBn = locale === 'bn';
  const currentUser = useAuthStore((s) => s.user);

  const [orgId, setOrgId] = useState(initialData?.organizationId || '');
  const [department, setDepartment] = useState(initialData?.department || '');
  const [designation, setDesignation] = useState(initialData?.designation || '');
  const [employeeId, setEmployeeId] = useState(initialData?.employeeId || '');
  const [studentClassRoll, setStudentClassRoll] = useState(initialData?.studentClassRoll || '');
  const [address, setAddress] = useState(initialData?.address || '');
  const [phone, setPhone] = useState(initialData?.phone || currentUser?.phone || '');

  React.useEffect(() => {
    if (initialData) {
      if (initialData.organizationId) setOrgId(initialData.organizationId);
      if (initialData.department) setDepartment(initialData.department);
      if (initialData.designation) setDesignation(initialData.designation);
      if (initialData.employeeId) setEmployeeId(initialData.employeeId);
      if (initialData.studentClassRoll) setStudentClassRoll(initialData.studentClassRoll);
      if (initialData.address) setAddress(initialData.address);
      if (initialData.phone) setPhone(initialData.phone);
    }
  }, [initialData]);

  React.useEffect(() => {
    if (currentUser?.phone && !phone) {
      setPhone(extract11DigitPhone(currentUser.phone) || currentUser.phone);
    }
  }, [currentUser?.phone]);

  const [isNewOrgModalOpen, setIsNewOrgModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) {
      setError(isBn ? 'অনুগ্রহ করে ড্রপডাউন থেকে একটি প্রতিষ্ঠান নির্বাচন করুন।' : 'Please select an organization from the list.');
      return;
    }

    const cleanNational = extract11DigitPhone(phone);
    if (!cleanNational || !isValid11DigitPhone(cleanNational)) {
      setError(isBn ? 'অনুগ্রহ করে ১১ ডিজিটের সঠিক মোবাইল নম্বর প্রদান করুন (যেমন: 01XXXXXXXXX)।' : 'Please enter a valid 11-digit mobile number (e.g. 01XXXXXXXXX).');
      return;
    }
    const cleanPhone = formatPhoneForDb(cleanNational);

    try {
      setLoading(true);
      setError('');
      const token = await getAuthToken();
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/users/affiliate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          organizationId: orgId,
          phone: cleanPhone,
          department: role === 'teacher' ? department.trim() : undefined,
          designation: role === 'teacher' ? designation.trim() : undefined,
          employeeId: role === 'teacher' ? employeeId.trim() : undefined,
          studentClassRoll: role === 'student' ? studentClassRoll.trim() : undefined,
          address: address.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to submit affiliation request.');
      }

      if (currentUser) {
        useAuthStore.getState().setUser({ ...currentUser, phone: cleanPhone });
      }

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
        if (onSuccess) onSuccess();
      }, 1800);
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <div className={styles.modalTitleGroup}>
              <div className={styles.modalIcon}>
                {role === 'teacher' ? <UserCheck size={22} /> : <GraduationCap size={22} />}
              </div>
              <div>
                <h3 className={styles.modalTitle}>
                  {role === 'teacher'
                    ? isBn
                      ? 'শিক্ষক হিসেবে প্রতিষ্ঠানে যুক্ত হন'
                      : 'Teacher Affiliation Application'
                    : isBn
                    ? 'শিক্ষার্থী হিসেবে প্রতিষ্ঠানে যুক্ত হন'
                    : 'Student Affiliation Application'}
                </h3>
                <p className={styles.modalSubtitle}>
                  {isBn ? 'প্রতিষ্ঠান ও এডমিন অনুমোদনে ফিচার আনলক হবে' : 'Unlock portal features upon approvals'}
                </p>
              </div>
            </div>
            <button type="button" onClick={onClose} className={styles.closeBtn} aria-label="Close">
              <X size={18} />
            </button>
          </div>

          {isSuccess ? (
            <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
              <CheckCircle2 size={44} color="#059669" style={{ margin: '0 auto 1rem' }} />
              <h4 style={{ fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                {isBn ? 'আবেদন সফলভাবে জমা হয়েছে!' : 'Affiliation Submitted Successfully!'}
              </h4>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                {isBn
                  ? 'আপনার আবেদনটি সংশ্লিষ্ট প্রতিষ্ঠানের কাছে পাঠানো হয়েছে। প্রতিষ্ঠান অনুমোদন করার পর এডমিন চূড়ান্ত অনুমোদন দিলে অ্যাকাউন্ট আনলক হবে।'
                  : 'Your application has been routed to the institution. Once the organization approves, super admin will perform final verification.'}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className={styles.modalBody}>
                <div className={styles.infoBanner}>
                  {isBn
                    ? 'নিচের ড্রপডাউন থেকে আপনার শিক্ষা প্রতিষ্ঠান বেছে নিন।'
                    : 'Select your educational institution from the dropdown below.'}
                </div>

                {error && <div className={styles.errorMsg}>{error}</div>}

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    {isBn ? 'প্রতিষ্ঠান নির্বাচন করুন *' : 'Select Organization *'}
                  </label>
                  <SearchableOrgSelect
                    selectedOrgId={orgId}
                    onChange={(id) => setOrgId(id)}
                    onRequestNewOrg={() => setIsNewOrgModalOpen(true)}
                    disabled={loading}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    {isBn ? 'মোবাইল নম্বর (জরুরি যোগাযোগ ও ভেরিফিকেশন)' : 'Mobile Phone (Contact & Verification)'}{' '}
                    <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', alignItems: 'stretch' }}>
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0.65rem 0.85rem',
                        borderTopLeftRadius: '8px',
                        borderBottomLeftRadius: '8px',
                        border: '1.5px solid var(--surface-border, #cbd5e1)',
                        borderRight: 'none',
                        backgroundColor: 'var(--background-alt, #f1f5f9)',
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        color: 'var(--text-main, #334155)',
                        userSelect: 'none',
                      }}
                    >
                      +88
                    </span>
                    <input
                      type="tel"
                      required
                      className={styles.formInput}
                      placeholder="01XXXXXXXXX"
                      value={phone}
                      maxLength={11}
                      onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, ''))}
                      style={{
                        flex: 1,
                        borderTopLeftRadius: 0,
                        borderBottomLeftRadius: 0,
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', marginTop: '0.25rem', display: 'block' }}>
                    {currentUser?.phone
                      ? isBn
                        ? 'আপনার অ্যাকাউন্টের বর্তমান নম্বর। প্রয়োজনে পরিবর্তন করতে পারেন।'
                        : 'Your current account phone. You can edit if needed.'
                      : isBn
                      ? 'ভেরিফিকেশন ও যোগাযোগের জন্য অবশ্যই আপনার মোবাইল নম্বর যুক্ত করুন।'
                      : 'Please provide an active mobile number for verification.'}
                  </span>
                </div>

                {role === 'teacher' ? (
                  <>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>
                        {isBn ? 'পদবী (Designation)' : 'Designation'}
                      </label>
                      <input
                        type="text"
                        className={styles.formInput}
                        placeholder={isBn ? 'যেমন: সহকারী শিক্ষক / প্রভাষক' : 'e.g., Assistant Teacher / Lecturer'}
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>
                        {isBn ? 'বিভাগ / বিষয় (Department / Subject)' : 'Department / Subject'}
                      </label>
                      <input
                        type="text"
                        className={styles.formInput}
                        placeholder={isBn ? 'যেমন: গণিত / ইংরেজি / ইসলাম শিক্ষা' : 'e.g., Mathematics, English'}
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>
                        {isBn ? 'শিক্ষক আইডি / স্টাফ নম্বর (ঐচ্ছিক)' : 'Teacher / Staff ID (Optional)'}
                      </label>
                      <input
                        type="text"
                        className={styles.formInput}
                        placeholder="ID / Staff No."
                        value={employeeId}
                        onChange={(e) => setEmployeeId(e.target.value)}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>
                        {isBn ? 'শ্রেণি ও রোল নম্বর (ঐচ্ছিক)' : 'Class & Roll Number (Optional)'}
                      </label>
                      <input
                        type="text"
                        className={styles.formInput}
                        placeholder={isBn ? 'যেমন: দশম শ্রেণি, রোল: ১২' : 'e.g., Class 10, Roll: 12'}
                        value={studentClassRoll}
                        onChange={(e) => setStudentClassRoll(e.target.value)}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>
                        {isBn ? 'স্থায়ী/বর্তমান ঠিকানা' : 'Current/Permanent Address'}
                      </label>
                      <input
                        type="text"
                        className={styles.formInput}
                        placeholder={isBn ? 'উপজেলা, জেলা' : 'Upazila, District'}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                      />
                    </div>
                  </>
                )}
              </div>

              <div className={styles.modalFooter}>
                <button type="button" onClick={onClose} className={styles.cancelBtn} disabled={loading}>
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button type="submit" className={styles.submitBtn} disabled={loading}>
                  {loading ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
                  <span>{isBn ? 'আবেদন জমা দিন' : 'Submit Application'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Sub-modal to request adding a new organization */}
      <RequestNewOrgModal
        isOpen={isNewOrgModalOpen}
        onClose={() => setIsNewOrgModalOpen(false)}
      />
    </>
  );
}
