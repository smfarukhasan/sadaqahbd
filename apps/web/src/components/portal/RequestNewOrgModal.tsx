'use client';

import React, { useState } from 'react';
import { useLocale } from 'next-intl';
import { X, Building2, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { auth } from '../../lib/firebase';
import { getApiUrl } from '../../lib/api-config';
import { getAuthToken } from '../../lib/auth-token';
import styles from './RequestNewOrgModal.module.css';

interface RequestNewOrgModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
}

export default function RequestNewOrgModal({
  isOpen,
  onClose,
  onSubmitted,
}: RequestNewOrgModalProps) {
  const locale = useLocale();
  const isBn = locale === 'bn';

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [type, setType] = useState('qawmi_madrasa');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim() || !phone.trim()) {
      setError(isBn ? 'দয়া করে প্রতিষ্ঠানের নাম, ঠিকানা ও ফোন নম্বর পূরণ করুন।' : 'Please fill in organization name, address, and phone number.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const token = await getAuthToken();
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/organizations/request-new`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: name.trim(),
          address: address.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          type,
          notes: notes.trim(),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to submit organization request.');
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        if (onSubmitted) onSubmitted();
      }, 1800);
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitleGroup}>
            <div className={styles.modalIcon}>
              <Building2 size={20} />
            </div>
            <div>
              <h3 className={styles.modalTitle}>
                {isBn ? 'নতুন প্রতিষ্ঠানের আবেদন' : 'Suggest New Organization'}
              </h3>
              <p className={styles.modalSubtitle}>
                {isBn ? 'কর্তৃপক্ষ সরেজমিনে ভেরিফাই করে যুক্ত করবেন' : 'Authority will physically verify and onboard'}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className={styles.closeBtn} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {success ? (
          <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
            <CheckCircle2 size={44} color="#059669" style={{ margin: '0 auto 1rem' }} />
            <h4 style={{ fontWeight: 800, color: 'var(--text-main, #f8fafc)', marginBottom: '0.5rem' }}>
              {isBn ? 'আবেদনটি সফলভাবে জমা হয়েছে!' : 'Request Submitted Successfully!'}
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted, #94a3b8)' }}>
              {isBn
                ? 'কর্তৃপক্ষ প্রদত্ত ঠিকানা অনুসারে প্রতিষ্ঠানটি সরেজমিনে যাচাই করে সিস্টেমে যুক্ত করবেন।'
                : 'Platform authority will physically inspect this organization and onboard it to the platform.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className={styles.modalBody}>
              <div className={styles.infoBanner}>
                {isBn
                  ? 'আপনার প্রতিষ্ঠান ড্রপডাউনে না থাকলে বিস্তারিত তথ্য জমা দিন। কর্তৃপক্ষ সরেজমিনে গিয়ে প্রতিষ্ঠানের ঠিকানা যাচাই করবেন এবং একাউন্ট তৈরির ব্যবস্থা নিবেন।'
                  : 'If your institution is not found, submit details below. Platform authority will physically verify the address and assist onboarding.'}
              </div>

              {error && <div className={styles.errorMsg}>{error}</div>}

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  {isBn ? 'প্রতিষ্ঠানের নাম *' : 'Organization Name *'}
                </label>
                <input
                  type="text"
                  required
                  className={styles.formInput}
                  placeholder={isBn ? 'যেমন: জামিয়া ইসলামিয়া / বায়তুল কুরআন মাদ্রাসা' : 'e.g., Jamia Islamia / Baitul Quran Madrasa'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  {isBn ? 'প্রতিষ্ঠানের ধরন' : 'Organization Type'}
                </label>
                <select
                  className={styles.formSelect}
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="qawmi_madrasa">{isBn ? 'কওমি মাদ্রাসা' : 'Qawmi Madrasa'}</option>
                  <option value="hafezia_madrasa">{isBn ? 'হাফেজীয়া মাদ্রাসা' : 'Hafezia Madrasa'}</option>
                  <option value="ebtedayee_madrasa">{isBn ? 'এবতেদায়ী মাদ্রাসা' : 'Ebtedayee Madrasa'}</option>
                  <option value="alia_madrasa">{isBn ? 'আলিয়া মাদ্রাসা' : 'Alia Madrasa'}</option>
                  <option value="orphanage">{isBn ? 'এতিম খানা' : 'Orphanage'}</option>
                  <option value="other">{isBn ? 'অন্যান্য' : 'Other'}</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  {isBn ? 'পূর্ণাঙ্গ ঠিকানা (উপজেলা, জেলা সহ) *' : 'Complete Physical Address *'}
                </label>
                <input
                  type="text"
                  required
                  className={styles.formInput}
                  placeholder={isBn ? 'গ্রাম/রোড, পোস্ট, উপজেলা, জেলা' : 'Village/Road, Post, Upazila, District'}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  {isBn ? 'যোগাযোগের ফোন নম্বর *' : 'Contact Phone Number *'}
                </label>
                <input
                  type="tel"
                  required
                  className={styles.formInput}
                  placeholder="01XXXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  {isBn ? 'প্রতিষ্ঠানের অফিশিয়াল ইমেইল (ঐচ্ছিক)' : 'Official Email (Optional)'}
                </label>
                <input
                  type="email"
                  className={styles.formInput}
                  placeholder={isBn ? 'info@institution.edu.bd' : 'info@institution.edu.bd'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  {isBn ? 'অতিরিক্ত তথ্য / নোট (ঐচ্ছিক)' : 'Additional Notes (Optional)'}
                </label>
                <textarea
                  className={styles.formTextarea}
                  placeholder={isBn ? 'প্রতিষ্ঠানের প্রধানের নাম বা যোগাযোগের বিশেষ নির্দেশনা...' : 'Principal name, landmark, etc.'}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button type="button" onClick={onClose} className={styles.cancelBtn} disabled={loading}>
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
                <span>{isBn ? 'আবেদন জমা দিন' : 'Submit Request'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
