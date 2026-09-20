'use client';

import React, { useState } from 'react';
import { useLocale } from 'next-intl';
import { X, Building2, Send, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react';
import { auth } from '../../lib/firebase';
import { getApiUrl } from '../../lib/api-config';
import styles from './RequestNewOrgModal.module.css';

interface OrganizationApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialData?: {
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
    type?: string;
    description?: string;
  };
}

export default function OrganizationApplyModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: OrganizationApplyModalProps) {
  const locale = useLocale();
  const isBn = locale === 'bn';

  const [name, setName] = useState(initialData?.name || '');
  const [address, setAddress] = useState(initialData?.address || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [type, setType] = useState(initialData?.type || 'school');
  const [description, setDescription] = useState(initialData?.description || '');

  React.useEffect(() => {
    if (initialData) {
      if (initialData.name) setName(initialData.name);
      if (initialData.address) setAddress(initialData.address);
      if (initialData.phone) setPhone(initialData.phone);
      if (initialData.email) setEmail(initialData.email);
      if (initialData.type) setType(initialData.type);
      if (initialData.description) setDescription(initialData.description);
    }
  }, [initialData]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim() || !phone.trim()) {
      setError(isBn ? 'প্রতিষ্ঠানের নাম, ঠিকানা ও ফোন নম্বর আবশ্যক।' : 'Organization name, address, and phone number are required.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const token = await auth.currentUser?.getIdToken();
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/organizations/apply`, {
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
          description: description.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to submit verification application.');
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
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitleGroup}>
            <div className={styles.modalIcon}>
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 className={styles.modalTitle}>
                {isBn ? 'প্রতিষ্ঠান ভেরিফিকেশন আবেদন' : 'Organization Verification Application'}
              </h3>
              <p className={styles.modalSubtitle}>
                {isBn ? 'সুপার এডমিন ভেরিফাই করলে সকল ফিচার আনলক হবে' : 'Unlock portal features upon admin approval'}
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
              {isBn ? 'ভেরিফিকেশন আবেদন জমা হয়েছে!' : 'Verification Application Submitted!'}
            </h4>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              {isBn
                ? 'আপনার আবেদনটি মাস্টার এডমিন ও সুপার এডমিনের কাছে পাঠানো হয়েছে। অনুমোদন হওয়া মাত্রই ড্যাশবোর্ড স্বয়ংক্রিয়ভাবে আনলক হয়ে যাবে।'
                : 'Your verification request has been routed to master/super admins. Portal features will unlock upon approval.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className={styles.modalBody}>
              <div className={styles.infoBanner}>
                {isBn
                  ? 'নিচের ফিল্ডগুলো নির্ভুলভাবে পূরণ করে আবেদন জমা দিন। তথ্য যাচাই করে অনুমোদন সম্পন্ন হলে আপনি শিক্ষক যুক্ত করা, ছাড়পত্র প্রদান ও অন্যান্য কার্যক্রম পরিচালনা করতে পারবেন।'
                  : 'Please complete all required fields. Once verified by administrators, all clearance and management features will be unlocked.'}
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
                  placeholder={isBn ? 'যেমন: আল-হেরা একাডেমী ও এতিমখানা' : 'e.g., Al-Hera Academy & Orphanage'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  {isBn ? 'প্রতিষ্ঠানের ধরন *' : 'Organization Type *'}
                </label>
                <select
                  className={styles.formSelect}
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="school">{isBn ? 'স্কুল / বিদ্যালয়' : 'School'}</option>
                  <option value="college">{isBn ? 'কলেজ' : 'College'}</option>
                  <option value="madrasa">{isBn ? 'মাদ্রাসা' : 'Madrasa'}</option>
                  <option value="orphanage">{isBn ? 'এতিমখানা' : 'Orphanage'}</option>
                  <option value="university">{isBn ? 'বিশ্ববিদ্যালয়' : 'University'}</option>
                  <option value="technical">{isBn ? 'কারিগরি প্রতিষ্ঠান' : 'Technical Institute'}</option>
                  <option value="other">{isBn ? 'অন্যান্য' : 'Other'}</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  {isBn ? 'পূর্ণাঙ্গ ঠিকানা *' : 'Complete Physical Address *'}
                </label>
                <input
                  type="text"
                  required
                  className={styles.formInput}
                  placeholder={isBn ? 'গ্রাম/মহল্লা, ডাকঘর, উপজেলা, জেলা' : 'Village/Street, Post, Upazila, District'}
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
                  {isBn ? 'প্রতিষ্ঠানের অফিসিয়াল ইমেইল (যদি থাকে)' : 'Official Organization Email (Optional)'}
                </label>
                <input
                  type="email"
                  className={styles.formInput}
                  placeholder="info@institution.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  {isBn ? 'প্রতিষ্ঠানের সংক্ষিপ্ত বর্ণনা' : 'Organization Description'}
                </label>
                <textarea
                  className={styles.formTextarea}
                  placeholder={isBn ? 'প্রতিষ্ঠানের লক্ষ্য, শিক্ষার্থী সংখ্যা বা কার্যক্রম সংক্রান্ত তথ্য...' : 'Brief overview of the institution, students, mission...'}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
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
  );
}
