'use client';

import React, { useState } from 'react';
import { useLocale } from 'next-intl';
import {
  X,
  Building2,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { getApiUrl } from '../../lib/api-config';
import { getAuthToken } from '../../lib/auth-token';
import SearchableOrgSelect from './SearchableOrgSelect';
import RequestNewOrgModal from './RequestNewOrgModal';
import styles from './InstitutionTransferModal.module.css';

interface InstitutionTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: 'teacher' | 'student';
  currentOrg: {
    id: string;
    name: string;
    address?: string;
  } | null;
  onSuccess?: () => void;
}

export default function InstitutionTransferModal({
  isOpen,
  onClose,
  role,
  currentOrg,
  onSuccess,
}: InstitutionTransferModalProps) {
  const locale = useLocale();
  const isBn = locale === 'bn';

  const [targetOrgId, setTargetOrgId] = useState('');
  const [targetOrgName, setTargetOrgName] = useState('');
  const [reason, setReason] = useState('');
  const [isNewOrgModalOpen, setIsNewOrgModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetOrgId) {
      setError(
        isBn
          ? 'অনুগ্রহ করে তালিকা থেকে আপনার কাঙ্ক্ষিত নতুন প্রতিষ্ঠানটি নির্বাচন করুন।'
          : 'Please select your target new institution from the list.'
      );
      return;
    }

    if (currentOrg && targetOrgId === currentOrg.id) {
      setError(
        isBn
          ? 'বর্তমান প্রতিষ্ঠান এবং নতুন প্রতিষ্ঠান একই হতে পারবে না।'
          : 'Current and new institution cannot be the same.'
      );
      return;
    }

    const cleanReason = reason.trim();
    if (!cleanReason || cleanReason.length < 5) {
      setError(
        isBn
          ? 'অনুগ্রহ করে প্রতিষ্ঠান পরিবর্তনের সুনির্দিষ্ট কারণ লিখুন (কমপক্ষে ৫ অক্ষর)।'
          : 'Please specify the exact reason for changing institutions (at least 5 characters).'
      );
      return;
    }

    try {
      setLoading(true);
      setError('');
      const token = await getAuthToken();
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/users/institution-transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          targetOrgId,
          reason: cleanReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || (isBn ? 'আবেদন জমা দিতে সমস্যা হয়েছে।' : 'Failed to submit request.'));
      }

      setIsSuccess(true);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || (isBn ? 'একটি অপ্রত্যাশিত ত্রুটি ঘটেছে।' : 'An unexpected error occurred.'));
    } finally {
      setLoading(false);
    }
  };

  const roleLabel = role === 'teacher' ? (isBn ? 'শিক্ষক' : 'Teacher') : (isBn ? 'শিক্ষার্থী' : 'Student');

  return (
    <>
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className={styles.modalHeader}>
            <div className={styles.modalTitleGroup}>
              <div className={styles.modalIcon}>
                <Building2 size={22} />
              </div>
              <div>
                <div className={styles.modalTitle}>
                  {isBn ? `${roleLabel} প্রতিষ্ঠান পরিবর্তন আবেদন` : `${roleLabel} Institution Transfer Request`}
                </div>
                <div className={styles.modalSubtitle}>
                  {isBn
                    ? 'অন্য প্রতিষ্ঠানে স্থানান্তরের জন্য আবেদন ও ছাড়পত্র প্রক্রিয়া'
                    : 'Apply for release clearance and transfer to a new institution'}
                </div>
              </div>
            </div>
            <button type="button" onClick={onClose} className={styles.closeBtn} aria-label="Close">
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className={styles.modalBody}>
            {/* Instruction Card */}
            <div className={styles.instructionCard}>
              <div className={styles.instructionTitle}>
                <HelpCircle size={16} />
                <span>{isBn ? 'প্রতিষ্ঠান পরিবর্তনের নিয়মাবলী ও নির্দেশিকা' : 'Transfer Guidelines & Instructions'}</span>
              </div>
              <ol className={styles.instructionList}>
                <li>
                  <strong>{isBn ? 'নতুন প্রতিষ্ঠান নির্বাচন:' : 'Select Institution:'}</strong>{' '}
                  {isBn
                    ? 'ড্রপডাউন থেকে আপনার নতুন শিক্ষা প্রতিষ্ঠান নির্বাচন করুন এবং পরিবর্তনের সুস্পষ্ট কারণ লিখুন।'
                    : 'Select your target institution from the list and provide a clear reason.'}
                </li>
                <li>
                  <strong>{isBn ? 'ধাপ ১ (বর্তমান প্রতিষ্ঠানের ছাড়পত্র):' : 'Stage 1 (Current Org Release):'}</strong>{' '}
                  {isBn
                    ? 'আবেদন সাবমিট করলে আপনার বর্তমান প্রতিষ্ঠানের নিকট নোটিফিকেশন যাবে এবং তারা ছাড়পত্র দেবে।'
                    : 'Current institution will be notified to grant release clearance.'}
                </li>
                <li>
                  <strong>{isBn ? 'ধাপ ২ (নতুন প্রতিষ্ঠানের সম্মতি):' : 'Stage 2 (New Org Acceptance):'}</strong>{' '}
                  {isBn
                    ? 'বর্তমান প্রতিষ্ঠান ছাড়পত্র দিলে নতুন প্রতিষ্ঠানের কাছে আবেদন যাবে এবং তারা এটি গ্রহণ করবে।'
                    : 'Once released, your new institution will receive and accept the request.'}
                </li>
                <li>
                  <strong>{isBn ? 'ধাপ ৩ (কর্তৃপক্ষের চূড়ান্ত অনুমোদন):' : 'Stage 3 (Authority Clearance):'}</strong>{' '}
                  {isBn
                    ? 'উভয় প্রতিষ্ঠান সম্মত হলে কর্তৃপক্ষের চূড়ান্ত অনুমোদনের মাধ্যমে আপনার প্রোফাইল স্থানান্তরিত হবে।'
                    : 'With both institutions agreeing, platform authority grants final clearance.'}
                </li>
                <li>
                  <strong>{isBn ? 'ডাটা ট্র্যাকিং:' : 'Data Integrity:'}</strong>{' '}
                  {isBn
                    ? 'পূর্বের সকল আবেদন ও রেকর্ড পূর্বের প্রতিষ্ঠানের অধীনে সুরক্ষিত থাকবে এবং নতুন আবেদনসমূহ নতুন প্রতিষ্ঠানের নামে হবে।'
                    : 'Past records remain preserved under previous institution, new records under new.'}
                </li>
              </ol>
            </div>

            {isSuccess ? (
              <div className={styles.successBanner}>
                <CheckCircle2 size={42} color="#059669" />
                <div className={styles.successTitle}>
                  {isBn ? 'স্থানান্তর আবেদন সফলভাবে জমা হয়েছে!' : 'Transfer Request Submitted Successfully!'}
                </div>
                <p className={styles.successDesc}>
                  {isBn
                    ? `আপনার বর্তমান প্রতিষ্ঠান "${currentOrg?.name || 'পূর্বের প্রতিষ্ঠান'}"-এর নিকট ছাড়পত্রের আবেদন পাঠানো হয়েছে। ছাড়পত্র ও এডমিন অনুমোদন সম্পন্ন না হওয়া পর্যন্ত আপনার অ্যাকাউন্টটি স্থানান্তর প্রক্রিয়ার অপেক্ষায় থাকবে।`
                    : `Release request sent to "${currentOrg?.name || 'current institution'}". Your profile remains in transition until final clearance.`}
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className={styles.submitBtn}
                  style={{ marginTop: '0.5rem' }}
                >
                  {isBn ? 'ঠিক আছে' : 'OK, Got it'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {error && (
                  <div className={styles.errorBanner}>
                    <AlertCircle size={18} />
                    <span>{error}</span>
                  </div>
                )}

                {/* Current Org Display */}
                <div className={styles.currentOrgBadge}>
                  <div>
                    <div className={styles.currentOrgLabel}>
                      {isBn ? 'বর্তমান শিক্ষা প্রতিষ্ঠান' : 'Current Institution'}
                    </div>
                    <div className={styles.currentOrgName}>
                      {currentOrg?.name || (isBn ? 'অনির্ধারিত' : 'Unassigned')}
                    </div>
                    {currentOrg?.address && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)', marginTop: '2px' }}>
                        {currentOrg.address}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted, #94a3b8)' }}>
                    <ArrowRight size={20} />
                  </div>
                </div>

                {/* Target Org Selection */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    <span>{isBn ? 'কাঙ্ক্ষিত নতুন প্রতিষ্ঠান নির্বাচন করুন' : 'Select Target New Institution'}</span>
                    <span className={styles.requiredStar}>*</span>
                  </label>
                  <SearchableOrgSelect
                    selectedOrgId={targetOrgId}
                    onChange={(id, name) => {
                      setTargetOrgId(id);
                      setTargetOrgName(name || '');
                      setError('');
                    }}
                    onRequestNewOrg={() => setIsNewOrgModalOpen(true)}
                    excludeOrgId={currentOrg?.id}
                  />
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted, #94a3b8)', marginTop: '2px' }}>
                    {isBn
                      ? 'তালিকায় আপনার কাঙ্ক্ষিত নতুন প্রতিষ্ঠান খুঁজে না পেলে "নতুন প্রতিষ্ঠান যুক্ত করার আবেদন" করতে পারেন।'
                      : 'If your target institution is not in the list, you can request to add it.'}
                  </div>
                </div>

                {/* Reason Textarea */}
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="transfer-reason">
                    <span>{isBn ? 'প্রতিষ্ঠান পরিবর্তনের কারণ' : 'Reason for Transfer'}</span>
                    <span className={styles.requiredStar}>*</span>
                  </label>
                  <textarea
                    id="transfer-reason"
                    className={styles.textarea}
                    placeholder={
                      isBn
                        ? 'স্থানান্তর, নতুন ক্লাসে বা বিভাগে ভর্তি, বাসস্থান পরিবর্তন বা অন্য কোনো নির্দিষ্ট কারণ বিস্তারিত লিখুন...'
                        : 'Explain reason (transfer, admission change, relocation, etc.)...'
                    }
                    value={reason}
                    onChange={(e) => {
                      setReason(e.target.value);
                      if (error) setError('');
                    }}
                    required
                  />
                </div>

                {/* Footer Buttons */}
                <div className={styles.modalFooter} style={{ padding: '0.75rem 0 0', background: 'transparent' }}>
                  <button type="button" onClick={onClose} className={styles.cancelBtn} disabled={loading}>
                    {isBn ? 'বাতিল' : 'Cancel'}
                  </button>
                  <button type="submit" className={styles.submitBtn} disabled={loading || !targetOrgId || !reason.trim()}>
                    {loading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>{isBn ? 'জমা দেওয়া হচ্ছে...' : 'Submitting...'}</span>
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        <span>{isBn ? 'স্থানান্তর আবেদন জমা দিন' : 'Submit Transfer Request'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Modal for requesting adding a missing organization */}
      <RequestNewOrgModal
        isOpen={isNewOrgModalOpen}
        onClose={() => setIsNewOrgModalOpen(false)}
        onSubmitted={() => {
          setIsNewOrgModalOpen(false);
        }}
      />
    </>
  );
}
