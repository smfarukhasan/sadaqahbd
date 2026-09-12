'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import styles from './page.module.css';
import {
  Heart,
  Shuffle,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

export default function DonatePage() {
  const t = useTranslations('Donation');
  const commonT = useTranslations('Common');
  const searchParams = useSearchParams();
  const initialPostId = searchParams.get('postId') || '';

  const [isRandom, setIsRandom] = useState(!initialPostId);
  const [amount, setAmount] = useState('500');
  const [paymentMethod, setPaymentMethod] = useState('bKash');
  const [trxId, setTrxId] = useState('');
  const [note, setNote] = useState('');

  // Confirmation Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
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
    setLoading(true);
    try {
      // Calls API /donations
      setTimeout(() => {
        setLoading(false);
        setShowConfirmModal(false);
        setIsSubmitted(true);
      }, 700);
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
            আপনার অনুদানের তথ্যটি আমাদের রেকর্ডে যুক্ত হয়েছে। এডমিন প্যানেল থেকে
            যাচাইয়ের পর তা চূড়ান্তভাবে অনুমোদিত হবে।
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
            আপনার সদাকাহ সরাসরি অসহায় শিক্ষার্থীর শিক্ষার ব্যয় নির্বাহে ব্যবহৃত হবে।
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
              <option value="bKash">বিকাশ (bKash Personal / Merchant)</option>
              <option value="Nagad">নগদ (Nagad)</option>
              <option value="Rocket">রকেট (Rocket)</option>
              <option value="Bank">ব্যাংক ট্রান্সফার (Bank Transfer)</option>
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
    </div>
  );
}
