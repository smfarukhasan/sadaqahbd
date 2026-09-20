'use client';

import React from 'react';
import { useLocale } from 'next-intl';
import { AlertCircle, Clock, ShieldCheck, XCircle, ArrowRight } from 'lucide-react';
import styles from './VerificationBanner.module.css';

export type VerificationState = 'unapplied' | 'pending' | 'pending_org' | 'pending_admin' | 'verified' | 'rejected';

interface VerificationBannerProps {
  status: VerificationState;
  role: 'organization' | 'teacher' | 'student';
  onApply: () => void;
  orgName?: string;
}

export default function VerificationBanner({
  status,
  role,
  onApply,
  orgName,
}: VerificationBannerProps) {
  const locale = useLocale();
  const isBn = locale === 'bn';

  if (status === 'verified') {
    return null;
  }

  if (status === 'unapplied') {
    return (
      <div className={`${styles.bannerCard} ${styles.bannerCardUnapplied}`}>
        <div className={styles.bannerLeft}>
          <div className={styles.bannerIconWrapper}>
            <AlertCircle size={24} color="#d97706" />
          </div>
          <div className={styles.bannerTextGroup}>
            <div className={styles.bannerTitle}>
              {role === 'organization'
                ? isBn
                  ? 'প্রতিষ্ঠান ভেরিফিকেশন আবেদন বাকি রয়েছে'
                  : 'Organization Verification Required'
                : role === 'teacher'
                ? isBn
                  ? 'প্রতিষ্ঠানের সাথে শিক্ষক সংযুক্তি আবেদন বাকি'
                  : 'Teacher Affiliation Required'
                : isBn
                ? 'প্রতিষ্ঠানের সাথে শিক্ষার্থী সংযুক্তি আবেদন বাকি'
                : 'Student Affiliation Required'}
            </div>
            <div className={styles.bannerDesc}>
              {role === 'organization'
                ? isBn
                  ? 'ড্যাশবোর্ডের সকল সুবিধা ও ফিচার আনলক করতে আপনার প্রতিষ্ঠানের তথ্যাদি জমা দিয়ে আবেদন করুন।'
                  : 'Please submit your organization details to verify your account and unlock all dashboard features.'
                : isBn
                ? 'আপনার শিক্ষা প্রতিষ্ঠান নির্বাচন করে আবেদন জমা দিন। অনুমোদন সম্পন্ন হলে সব ফিচার সচল হবে।'
                : 'Please select your educational institution and submit your application to unlock full portal features.'}
            </div>
          </div>
        </div>
        <button type="button" className={styles.actionBtn} onClick={onApply}>
          <span>{isBn ? 'এখনই আবেদন করুন' : 'Apply Now'}</span>
          <ArrowRight size={16} />
        </button>
      </div>
    );
  }

  if (status === 'pending' || status === 'pending_org') {
    return (
      <div className={`${styles.bannerCard} ${styles.bannerCardPending}`}>
        <div className={styles.bannerLeft}>
          <div className={styles.bannerIconWrapper}>
            <Clock size={24} color="#2563eb" />
          </div>
          <div className={styles.bannerTextGroup}>
            <div className={styles.bannerTitle}>
              {role === 'organization'
                ? isBn
                  ? 'ভেরিফিকেশন আবেদন পর্যালোচনায় রয়েছে'
                  : 'Application Under Review'
                : isBn
                ? `প্রতিষ্ঠান অনুমোদনের অপেক্ষায় (${orgName || (isBn ? 'আপনার প্রতিষ্ঠান' : 'Your Organization')})`
                : `Pending Organization Approval (${orgName || 'Your Organization'})`}
            </div>
            <div className={styles.bannerDesc}>
              {role === 'organization'
                ? isBn
                  ? 'আপনার আবেদনটি অ্যাডমিন কর্তৃক পর্যালোচনায় রয়েছে। এপ্রুভ হওয়ার সাথে সাথে নোটিফিকেশন পাবেন এবং সব ফিচার আনলক হবে।'
                  : 'Your organization profile is under review by Master/Super Admin. Features will unlock once approved.'
                : isBn
                ? 'আপনার প্রতিষ্ঠান আবেদনটি পর্যালোচনা করছে। প্রতিষ্ঠান এপ্রুভ করার পর অ্যাডমিন চূড়ান্ত অনুমোদন প্রদান করবেন।'
                : 'Your institution is reviewing your affiliation. Once approved, it will proceed to admin review.'}
            </div>
          </div>
        </div>
        <div className={styles.statusBadge}>
          <Clock size={14} color="#2563eb" />
          <span>{isBn ? 'অপেক্ষমাণ' : 'Pending'}</span>
        </div>
      </div>
    );
  }

  if (status === 'pending_admin') {
    return (
      <div className={`${styles.bannerCard} ${styles.bannerCardPendingAdmin}`}>
        <div className={styles.bannerLeft}>
          <div className={styles.bannerIconWrapper}>
            <ShieldCheck size={24} color="#7c3aed" />
          </div>
          <div className={styles.bannerTextGroup}>
            <div className={styles.bannerTitle}>
              {isBn
                ? 'প্রতিষ্ঠান অনুমোদিত! সুপার অ্যাডমিনের চূড়ান্ত পর্যালোচনায়'
                : 'Institution Approved! Awaiting Final Admin Review'}
            </div>
            <div className={styles.bannerDesc}>
              {isBn
                ? 'আপনার প্রতিষ্ঠান আবেদনটি এপ্রুভ করেছে। এখন মাস্টার বা সুপার অ্যাডমিন চূড়ান্ত অনুমোদন দিলেই আপনার প্রোফাইল সম্পূর্ণ ভেরিফাইড হবে।'
                : 'Your organization has verified your application. Master or Super Admin final approval is in progress.'}
            </div>
          </div>
        </div>
        <div className={styles.statusBadge}>
          <ShieldCheck size={14} color="#7c3aed" />
          <span>{isBn ? 'এডমিন অনুমোদন অপেক্ষমাণ' : 'Admin Pending'}</span>
        </div>
      </div>
    );
  }

  if (status === 'rejected') {
    return (
      <div className={`${styles.bannerCard} ${styles.bannerCardRejected}`}>
        <div className={styles.bannerLeft}>
          <div className={styles.bannerIconWrapper}>
            <XCircle size={24} color="#dc2626" />
          </div>
          <div className={styles.bannerTextGroup}>
            <div className={styles.bannerTitle}>
              {isBn ? 'আবেদনটি প্রত্যাখ্যাত হয়েছে' : 'Application Rejected'}
            </div>
            <div className={styles.bannerDesc}>
              {isBn
                ? 'আপনার তথ্যাদি সঠিকভাবে প্রদান করে পুনরায় নতুন করে আবেদন করুন।'
                : 'Your application was rejected. Please verify your details and apply again.'}
            </div>
          </div>
        </div>
        <button type="button" className={styles.actionBtn} onClick={onApply}>
          <span>{isBn ? 'পুনরায় আবেদন করুন' : 'Re-apply'}</span>
          <ArrowRight size={16} />
        </button>
      </div>
    );
  }

  return null;
}
