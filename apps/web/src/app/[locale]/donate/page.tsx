'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import styles from './page.module.css';
import { useRouter } from '@/i18n/routing';
import { useAuthStore } from '@/lib/auth-store';
import { getApiUrl } from '@/lib/api-config';
import { getAuthToken } from '@/lib/auth-token';
import {
  Heart,
  Shuffle,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Package,
} from 'lucide-react';
import ItemDonationModal from '@/components/portal/ItemDonationModal';

export default function DonatePage() {
  const t = useTranslations('Donation');
  const commonT = useTranslations('Common');
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPostId = searchParams.get('postId') || '';
  const initialAmount = searchParams.get('amount') || '500';
  const initialType = searchParams.get('type') || '';

  const user = useAuthStore((s) => s.user);
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const loadingAuth = useAuthStore((s) => s.loading);

  const [isRandom, setIsRandom] = useState(initialType === 'general' || !initialPostId);
  const [selectedPostId, setSelectedPostId] = useState(initialPostId);
  const [publicPosts, setPublicPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [amount, setAmount] = useState(initialAmount);
  const [paymentMethod, setPaymentMethod] = useState('Mobile Banking');
  const [trxId, setTrxId] = useState('');
  const [note, setNote] = useState('');

  // Fetch active student posts if user wants direct donation
  React.useEffect(() => {
    if (!isRandom) {
      setLoadingPosts(true);
      const apiUrl = getApiUrl();
      fetch(`${apiUrl}/posts/public`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setPublicPosts(data);
            if (!selectedPostId && data.length > 0) {
              setSelectedPostId(data[0].id);
            }
          }
        })
        .catch(() => {})
        .finally(() => setLoadingPosts(false));
    }
  }, [isRandom, selectedPostId]);

  // Confirmation Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Enforce auth requirement for donations
  React.useEffect(() => {
    if (!loadingAuth && !user) {
      const currentQuery = typeof window !== 'undefined' ? window.location.search : '';
      const redirectPath = `/donate${currentQuery}`;
      router.push(`/login?redirect=${encodeURIComponent(redirectPath)}` as any);
    }
  }, [user, loadingAuth, router]);

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      const currentQuery = typeof window !== 'undefined' ? window.location.search : '';
      router.push(`/login?redirect=${encodeURIComponent('/donate' + currentQuery)}` as any);
      return;
    }
    if (!isRandom && !selectedPostId) {
      setError('অনুগ্রহ করে সহায়তার জন্য একজন শিক্ষার্থী নির্বাচন করুন।');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setError('সঠিক অনুদানের পরিমাণ প্রদান করুন।');
      return;
    }
    if (!trxId) {
      setError('পেমেন্ট ট্রানজেকশন আইডি / রেফারেন্স প্রদান করুন।');
      return;
    }
    setError('');
    setShowConfirmModal(true);
  };

  const handleFinalSubmit = async () => {
    if (!user) {
      setError('অনুদানের জন্য আপনাকে অবশ্যই লগইন করতে হবে।');
      router.push('/login' as any);
      return;
    }
    setLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) {
        setError('লগইন সেশন পাওয়া যায়নি। অনুগ্রহ করে পুনরায় লগইন করুন।');
        router.push('/login' as any);
        return;
      }
      const apiUrl = getApiUrl();
      const payload: any = {
        amount: Number(amount),
        paymentMethod: paymentMethod.toLowerCase(),
        transactionReference: trxId,
        donorNote: note || undefined,
        isRandom: isRandom,
        postId: !isRandom ? (selectedPostId || initialPostId) : undefined,
      };

      const res = await fetch(`${apiUrl}/donations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'অনুদানের তথ্য সাবমিট করতে সমস্যা হয়েছে।');
      }

      setLoading(false);
      setShowConfirmModal(false);
      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'অনুদানের আবেদন জমা দিতে সমস্যা হয়েছে');
      setLoading(false);
      setShowConfirmModal(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="container" style={{ padding: '3rem 1rem' }}>
        <div className={styles.successCard}>
          <CheckCircle size={64} className={styles.successIcon} />
          <h2>{t('thankYouMsg')}</h2>
          <p>
            আপনার অনুদানের আবেদনটি সফলভাবে জমা হয়েছে! এটি মাস্টার এডমিন ও সুপার এডমিনের ভেরিফিকেশনের জন্য অপেক্ষমান থাকবে।
          </p>
          <div className={styles.detailsBadge}>
            <span>পরিমাণ: <strong>৳{amount}</strong></span>
            <span>মাধ্যম: <strong>{paymentMethod}</strong></span>
            <span>TrxID: <strong>{trxId}</strong></span>
          </div>
          <button
            onClick={() => {
              setIsSubmitted(false);
              setTrxId('');
              setNote('');
            }}
            className={styles.newDonateBtn}
          >
            আরেকটি অনুদান করুন
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <h1>{t('title')}</h1>
          <p>
            আপনার অনুদান সবচেয়ে জরুরি ও পিছিয়ে থাকা শিক্ষার্থীদের জন্য কর্তৃপক্ষের সিদ্ধান্ত অনুসারে যুক্ত করা হবে।
          </p>
        </div>

        {/* Donation Mode Switch */}
        <div className={styles.modeSwitch}>
          <button
            type="button"
            onClick={() => setIsRandom(false)}
            className={`${styles.modeBtn} ${!isRandom ? styles.modeActive : ''}`}
          >
            <Heart size={18} />
            <span>নির্দিষ্ট শিক্ষার্থীর জন্য</span>
          </button>
          <button
            type="button"
            onClick={() => setIsRandom(true)}
            className={`${styles.modeBtn} ${isRandom ? styles.modeActive : ''}`}
          >
            <Shuffle size={18} />
            <span>{commonT('randomDonate')} (সাধারণ ফান্ড)</span>
          </button>
        </div>

        {/* Target Student Campaign Picker if !isRandom */}
        {!isRandom && (
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
              সহায়তাপ্রাপ্ত শিক্ষার্থী নির্বাচন করুন *
            </label>
            {loadingPosts ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>শিক্ষার্থী তালিকা লোড হচ্ছে...</p>
            ) : publicPosts.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--danger, #ef4444)' }}>কোনো সক্রিয় শিক্ষার্থী আবেদন পাওয়া যায়নি।</p>
            ) : (
              <select
                value={selectedPostId}
                onChange={(e) => setSelectedPostId(e.target.value)}
                className={styles.select}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '10px' }}
              >
                {publicPosts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} — {p.studentName || p.studentFullName || 'শিক্ষার্থী'} (প্রয়োজন বাকি: ৳{Number(p.remainingAmount || 0).toLocaleString()})
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {error && (
          <div className={styles.errorBox}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleOpenConfirm} className={styles.form}>
          {/* Amount presets */}
          <div className={styles.field}>
            <label>{t('amount')}</label>
            <div className={styles.presetGrid}>
              {['200', '500', '1000', '2000', '5000'].map((val) => (
                <button
                  type="button"
                  key={val}
                  onClick={() => setAmount(val)}
                  className={`${styles.presetBtn} ${amount === val ? styles.presetActive : ''}`}
                >
                  ৳{val}
                </button>
              ))}
            </div>
            <input
              type="number"
              required
              min="10"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="কাস্টম টাকার পরিমাণ লিখুন"
              className={styles.amountInput}
            />
          </div>

          {/* Payment Method */}
          <div className={styles.field}>
            <label>{t('paymentMethod')}</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className={styles.select}
            >
              <option value="Mobile Banking">মোবাইল ব্যাংকিং (Mobile Banking)</option>
              <option value="Online Banking">অনলাইন ব্যাংকিং (Online Banking)</option>
              <option value="Handcash">হ্যান্ডক্যাশ (Handcash)</option>
              <option value="Others">অন্যান্য (Others)</option>
            </select>
          </div>

          {/* Transaction ID */}
          <div className={styles.field}>
            <label>{t('trxId')}</label>
            <input
              type="text"
              required
              value={trxId}
              onChange={(e) => setTrxId(e.target.value)}
              placeholder="যেমন: 9J87X1K2"
            />
          </div>

          {/* Note */}
          <div className={styles.field}>
            <label>{t('note')}</label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="শিক্ষার্থীর জন্য কোনো দোয়া বা পরামর্শ লিখতে পারেন..."
            />
          </div>

          <button type="submit" className={styles.submitBtn}>
            <Heart size={20} />
            <span>{t('submit')}</span>
          </button>
        </form>
      </div>

      {/* Confirmation Dialog / Bottom Sheet Modal */}
      {showConfirmModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <ShieldCheck size={28} className={styles.modalIcon} />
              <h3>{t('confirmModalTitle')}</h3>
            </div>
            <p className={styles.modalDesc}>{t('confirmModalDesc')}</p>

            <div className={styles.summaryList}>
              <div>
                <span>ধরণ:</span>
                <strong>{isRandom ? 'র্যান্ডম ফান্ড' : 'নির্দিষ্ট শিক্ষার্থী'}</strong>
              </div>
              <div>
                <span>পরিমাণ:</span>
                <strong>৳{amount}</strong>
              </div>
              <div>
                <span>মাধ্যম:</span>
                <strong>{paymentMethod}</strong>
              </div>
              <div>
                <span>TrxID:</span>
                <strong>{trxId}</strong>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className={styles.cancelBtn}
              >
                {commonT('cancel')}
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={loading}
                className={styles.confirmBtn}
              >
                {loading ? commonT('loading') : commonT('confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Item Donation Modal */}
      <ItemDonationModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        defaultPostId={!isRandom ? initialPostId : undefined}
      />
    </div>
  );
}
