'use client';

import React, { useState } from 'react';
import { useLocale } from 'next-intl';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Building2,
  ArrowRight,
  AlertTriangle,
  RotateCcw,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import { getApiUrl } from '../../lib/api-config';
import { getAuthToken } from '../../lib/auth-token';
import styles from './TransferStatusBanner.module.css';

export interface TransferRecord {
  id: string;
  userId: string;
  userRole: 'student' | 'teacher';
  currentOrgId: string;
  targetOrgId: string;
  currentOrgName: string;
  currentOrgAddress?: string;
  targetOrgName: string;
  targetOrgAddress?: string;
  reason: string;
  status: 'pending_current_org' | 'current_org_approved' | 'target_org_approved' | 'approved' | 'rejected';
  currentOrgApprovedAt?: string | null;
  currentOrgRejectionReason?: string | null;
  targetOrgApprovedAt?: string | null;
  targetOrgRejectionReason?: string | null;
  finalApprovedAt?: string | null;
  finalRejectionReason?: string | null;
  rejectionStage?: 'current_org' | 'target_org' | 'admin' | null;
  createdAt: string;
}

interface TransferStatusBannerProps {
  transfer: TransferRecord;
  onRefresh: () => void;
  onRequestNewTransfer?: () => void;
}

export default function TransferStatusBanner({
  transfer,
  onRefresh,
  onRequestNewTransfer,
}: TransferStatusBannerProps) {
  const locale = useLocale();
  const isBn = locale === 'bn';

  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');

  const isPending = [
    'pending_current_org',
    'current_org_approved',
    'target_org_approved',
  ].includes(transfer.status);

  const isRejected = transfer.status === 'rejected';
  const isApproved = transfer.status === 'approved';

  const handleCancel = async () => {
    if (
      !confirm(
        isBn
          ? 'আপনি কি নিশ্চিতভাবে এই প্রতিষ্ঠান পরিবর্তনের আবেদনটি প্রত্যাহার করতে চান?'
          : 'Are you sure you want to cancel this transfer request?'
      )
    ) {
      return;
    }

    try {
      setCancelling(true);
      setCancelError('');
      const token = await getAuthToken();
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/users/institution-transfer/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || (isBn ? 'বাতিল করতে সমস্যা হয়েছে।' : 'Failed to cancel request.'));
      }

      onRefresh();
    } catch (err: any) {
      setCancelError(err.message || (isBn ? 'ত্রুটি ঘটেছে।' : 'Error occurred.'));
    } finally {
      setCancelling(false);
    }
  };

  // Step calculations
  let step1Class = styles.stepPending;
  let step2Class = styles.stepPending;
  let step3Class = styles.stepPending;

  if (transfer.status === 'pending_current_org') {
    step1Class = styles.stepActive;
  } else if (transfer.status === 'current_org_approved') {
    step1Class = styles.stepDone;
    step2Class = styles.stepActive;
  } else if (transfer.status === 'target_org_approved') {
    step1Class = styles.stepDone;
    step2Class = styles.stepDone;
    step3Class = styles.stepActive;
  } else if (transfer.status === 'approved') {
    step1Class = styles.stepDone;
    step2Class = styles.stepDone;
    step3Class = styles.stepDone;
  } else if (transfer.status === 'rejected') {
    if (transfer.rejectionStage === 'current_org') {
      step1Class = styles.stepFailed;
    } else if (transfer.rejectionStage === 'target_org') {
      step1Class = styles.stepDone;
      step2Class = styles.stepFailed;
    } else {
      step1Class = styles.stepDone;
      step2Class = styles.stepDone;
      step3Class = styles.stepFailed;
    }
  }

  return (
    <div className={styles.card}>
      {/* Top Header */}
      <div className={styles.topRow}>
        <div className={styles.headerLeft}>
          <div className={styles.iconWrapper}>
            {isRejected ? (
              <XCircle size={26} color="#ef4444" />
            ) : isApproved ? (
              <CheckCircle2 size={26} color="#10b981" />
            ) : (
              <Clock size={26} />
            )}
          </div>
          <div>
            <h3 className={styles.title}>
              {isRejected
                ? isBn
                  ? 'প্রতিষ্ঠান পরিবর্তনের আবেদন প্রত্যাখ্যাত হয়েছে'
                  : 'Transfer Request Rejected'
                : isApproved
                ? isBn
                  ? 'প্রতিষ্ঠান স্থানান্তর সফলভাবে সম্পন্ন হয়েছে!'
                  : 'Transfer Successfully Completed!'
                : isBn
                ? 'প্রতিষ্ঠান পরিবর্তনের আবেদন প্রক্রিয়াধীন রয়েছে'
                : 'Institution Transfer In Progress'}
            </h3>
            <div className={styles.subtitle}>
              {isPending
                ? isBn
                  ? 'চূড়ান্ত অনুমোদন সম্পন্ন না হওয়া পর্যন্ত আপনার অ্যাকাউন্টটি স্থানান্তরের অপেক্ষায় রাখা হয়েছে।'
                  : 'Your account is on hold pending completion of the multi-stage transfer verification.'
                : isBn
                ? `আবেদনের তারিখ: ${new Date(transfer.createdAt).toLocaleDateString('bn-BD')}`
                : `Applied: ${new Date(transfer.createdAt).toLocaleDateString()}`}
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div>
          {isPending && (
            <div className={`${styles.badge} ${styles.badgeWaiting}`}>
              <Clock size={14} />
              <span>
                {transfer.status === 'pending_current_org'
                  ? isBn
                    ? 'ধাপ ১: বর্তমান প্রতিষ্ঠানের ছাড়পত্রের অপেক্ষায়'
                    : 'Stage 1: Pending Current Org Release'
                  : transfer.status === 'current_org_approved'
                  ? isBn
                    ? 'ধাপ ২: নতুন প্রতিষ্ঠানের সম্মতির অপেক্ষায়'
                    : 'Stage 2: Pending Target Org Acceptance'
                  : isBn
                  ? 'ধাপ ৩: এডমিনের চূড়ান্ত ছাড়পত্রের অপেক্ষায়'
                  : 'Stage 3: Pending Final Admin Clearance'}
              </span>
            </div>
          )}
          {isRejected && (
            <div className={`${styles.badge} ${styles.badgeRejected}`}>
              <XCircle size={14} />
              <span>{isBn ? 'আবেদন বাতিল হয়েছে' : 'Request Rejected'}</span>
            </div>
          )}
          {isApproved && (
            <div className={`${styles.badge} ${styles.badgeCompleted}`}>
              <CheckCircle2 size={14} />
              <span>{isBn ? 'স্থানান্তর সম্পন্ন' : 'Transfer Approved'}</span>
            </div>
          )}
        </div>
      </div>

      {/* 3-Step Interactive Timeline */}
      <div className={styles.stepperContainer}>
        {/* Step 1 */}
        <div className={styles.stepItem}>
          <div className={`${styles.stepIconCircle} ${step1Class}`}>
            {step1Class === styles.stepDone ? (
              <CheckCircle2 size={18} />
            ) : step1Class === styles.stepFailed ? (
              <XCircle size={18} />
            ) : (
              '১'
            )}
          </div>
          <div className={styles.stepTitle}>
            {isBn ? 'বর্তমান প্রতিষ্ঠানের ছাড়পত্র' : 'Current Org Release'}
          </div>
          <div className={styles.stepDesc}>
            {step1Class === styles.stepDone
              ? isBn
                ? 'ছাড়পত্র অনুমোদিত'
                : 'Released'
              : step1Class === styles.stepFailed
              ? isBn
                ? 'ছাড়পত্র বাতিল'
                : 'Rejected'
              : isBn
                ? 'অনুমোদনের অপেক্ষায়'
                : 'Waiting clearance'}
          </div>
        </div>

        {/* Step 2 */}
        <div className={styles.stepItem}>
          <div className={`${styles.stepIconCircle} ${step2Class}`}>
            {step2Class === styles.stepDone ? (
              <CheckCircle2 size={18} />
            ) : step2Class === styles.stepFailed ? (
              <XCircle size={18} />
            ) : (
              '২'
            )}
          </div>
          <div className={styles.stepTitle}>
            {isBn ? 'নতুন প্রতিষ্ঠানের সম্মতি' : 'New Org Acceptance'}
          </div>
          <div className={styles.stepDesc}>
            {step2Class === styles.stepDone
              ? isBn
                ? 'সম্মতি প্রদান করেছে'
                : 'Accepted'
              : step2Class === styles.stepFailed
              ? isBn
                ? 'গ্রহণ করেনি'
                : 'Rejected'
              : isBn
                ? 'গ্রহণের অপেক্ষায়'
                : 'Waiting review'}
          </div>
        </div>

        {/* Step 3 */}
        <div className={styles.stepItem}>
          <div className={`${styles.stepIconCircle} ${step3Class}`}>
            {step3Class === styles.stepDone ? (
              <CheckCircle2 size={18} />
            ) : step3Class === styles.stepFailed ? (
              <XCircle size={18} />
            ) : (
              '৩'
            )}
          </div>
          <div className={styles.stepTitle}>
            {isBn ? 'এডমিনের চূড়ান্ত ছাড়পত্র' : 'Final Admin Clearance'}
          </div>
          <div className={styles.stepDesc}>
            {step3Class === styles.stepDone
              ? isBn
                ? 'চূড়ান্ত অনুমোদন সম্পন্ন'
                : 'Verified'
              : step3Class === styles.stepFailed
              ? isBn
                ? 'এডমিন কর্তৃক বাতিল'
                : 'Rejected'
              : isBn
                ? 'চূড়ান্ত অনুমোদনের অপেক্ষায়'
                : 'Pending admin review'}
          </div>
        </div>
      </div>

      {/* Details Box */}
      <div className={styles.detailsBox}>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>{isBn ? 'বর্তমান প্রতিষ্ঠান' : 'Current Institution'}</span>
          <span className={styles.detailValue}>{transfer.currentOrgName}</span>
        </div>

        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>{isBn ? 'কাঙ্ক্ষিত নতুন প্রতিষ্ঠান' : 'Target New Institution'}</span>
          <span className={styles.detailValue} style={{ color: '#2563eb' }}>
            {transfer.targetOrgName}
          </span>
        </div>

        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>{isBn ? 'আবেদনের তারিখ' : 'Submission Date'}</span>
          <span className={styles.detailValue}>
            {new Date(transfer.createdAt).toLocaleString(isBn ? 'bn-BD' : 'en-US')}
          </span>
        </div>

        {/* Reason */}
        <div className={styles.reasonBox}>
          <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#475569', marginBottom: '3px' }}>
            {isBn ? 'পরিবর্তনের কারণ:' : 'Reason for Transfer:'}
          </div>
          <p className={styles.reasonText}>&ldquo;{transfer.reason}&rdquo;</p>
        </div>

        {/* Rejection Reason if any */}
        {isRejected && (
          <div
            style={{
              gridColumn: '1 / -1',
              backgroundColor: '#fef2f2',
              borderRadius: '8px',
              padding: '0.75rem 0.85rem',
              border: '1px solid #fecaca',
            }}
          >
            <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#b91c1c', marginBottom: '3px' }}>
              {isBn ? 'বাতিলকরণের কারণ:' : 'Rejection Reason:'}
            </div>
            <p style={{ margin: 0, fontSize: '0.84rem', color: '#991b1b', lineHeight: 1.5 }}>
              {transfer.finalRejectionReason ||
                transfer.targetOrgRejectionReason ||
                transfer.currentOrgRejectionReason ||
                (isBn ? 'নির্দিষ্ট কোনো কারণ উল্লেখ করা হয়নি।' : 'No reason provided.')}
            </p>
          </div>
        )}
      </div>

      {/* Bottom Alert / Action Row */}
      {isPending && (
        <div className={styles.bottomAlert}>
          <div className={styles.bottomAlertText}>
            <AlertTriangle size={16} color="#d97706" />
            <span>
              {isBn
                ? 'আবেদনটি অনুমোদিত হওয়া পর্যন্ত দয়া করে অপেক্ষা করুন। কোনো ভুল হলে বর্তমান প্রতিষ্ঠানের পর্যালোচনার পূর্বে প্রত্যাহার করতে পারেন।'
                : 'Please wait until verification completes. You may withdraw while under initial review.'}
            </span>
          </div>

          {transfer.status === 'pending_current_org' && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={cancelling}
              className={styles.cancelBtn}
            >
              {cancelling ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>{isBn ? 'প্রত্যাহার হচ্ছে...' : 'Cancelling...'}</span>
                </>
              ) : (
                <span>{isBn ? 'আবেদন প্রত্যাহার করুন' : 'Withdraw Request'}</span>
              )}
            </button>
          )}
        </div>
      )}

      {/* If Rejected, offer Re-apply button */}
      {isRejected && onRequestNewTransfer && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
          <button
            type="button"
            onClick={onRequestNewTransfer}
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.84rem' }}
          >
            <RotateCcw size={15} />
            <span>{isBn ? 'পুনরায় স্থানান্তর আবেদন করুন' : 'Submit New Transfer Request'}</span>
          </button>
        </div>
      )}

      {cancelError && (
        <div style={{ fontSize: '0.8rem', color: '#dc2626', marginTop: '4px' }}>
          {cancelError}
        </div>
      )}
    </div>
  );
}
