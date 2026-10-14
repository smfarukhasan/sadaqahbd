'use client';

import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  History,
  RefreshCw,
  Send,
  Sparkles,
  ShoppingBag,
  Zap,
} from 'lucide-react';
import { getApiUrl } from '@/lib/api-config';
import { getAuthToken } from '@/lib/auth-token';
import styles from '../../admin.module.css';

interface SmsPackagesTabProps {
  isBn: boolean;
  user: any;
}

export default function SmsPackagesTab({ isBn, user }: SmsPackagesTabProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [meter, setMeter] = useState<{
    totalCredited: number;
    totalUsed: number;
    remainingSms: number;
  }>({ totalCredited: 0, totalUsed: 0, remainingSms: 0 });

  const [packages, setPackages] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [paymentMsg, setPaymentMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();

      const [meterRes, pkgsRes, historyRes] = await Promise.all([
        fetch(`${getApiUrl()}/maintenance/sms/meter`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        }),
        fetch(`${getApiUrl()}/maintenance/sms/packages`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        }),
        fetch(`${getApiUrl()}/maintenance/sms/purchase-history`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        }),
      ]);

      if (meterRes.ok) setMeter(await meterRes.json());
      if (pkgsRes.ok) setPackages(await pkgsRes.json());
      if (historyRes.ok) setPurchases(await historyRes.json());
    } catch (err) {
      console.error('Failed to load SMS data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Check URL query parameters for return callback from Khub Soja payment gateway
  useEffect(() => {
    loadData();

    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const trxId = urlParams.get('transaction_id');

      if (trxId) {
        setPaymentMsg({
          type: 'info',
          text: isBn
            ? 'খুব সোজা গেটওয়ে থেকে এসএমএস প্যাকেজ পেমেন্ট যাচাই করা হচ্ছে...'
            : 'Verifying SMS package payment from Khub Soja gateway...',
        });

        (async () => {
          try {
            const token = await getAuthToken();
            const res = await fetch(
              `${getApiUrl()}/maintenance/sms/verify-purchase/${encodeURIComponent(trxId)}`,
              {
                headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
              }
            );
            const data = await res.json();
            if (res.ok && data.status === 'SUCCESS') {
              setPaymentMsg({
                type: 'success',
                text: data.message || (isBn ? 'পেমেন্ট সফল! এসএমএস ক্রেডিট সম্পন্ন হয়েছে।' : 'SMS package purchased successfully!'),
              });
              loadData();
            } else {
              setPaymentMsg({
                type: 'error',
                text: data.message || (isBn ? 'পেমেন্ট যাচাই ব্যর্থ হয়েছে।' : 'Verification failed.'),
              });
            }
          } catch (e) {
            setPaymentMsg({
              type: 'error',
              text: isBn ? 'এসএমএস প্যাকেজ ভেরিফিকেশনে সমস্যা হয়েছে।' : 'Verification error.',
            });
          } finally {
            const cleanUrl = window.location.pathname + '?tab=sms_packages';
            window.history.replaceState({}, document.title, cleanUrl);
          }
        })();
      }
    }
  }, [isBn]);

  const handleBuyPackage = async (pkg: any) => {
    try {
      setBuyingId(pkg.id);
      setPaymentMsg(null);
      const token = await getAuthToken();

      const returnUrl = `${window.location.origin}${window.location.pathname}?tab=sms_packages`;

      const res = await fetch(`${getApiUrl()}/maintenance/sms/buy-package`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: JSON.stringify({
          packageId: pkg.id,
          returnUrl,
          cancelUrl: returnUrl,
        }),
      });

      const result = await res.json();
      if (res.ok && result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else {
        setPaymentMsg({
          type: 'error',
          text: result.message || (isBn ? 'পেমেন্ট সেশন শুরু করা সম্ভব হয়নি।' : 'Could not initiate checkout.'),
        });
      }
    } catch (err: any) {
      setPaymentMsg({
        type: 'error',
        text: err?.message || (isBn ? 'পেমেন্ট গেটওয়েতে সংযোগে সমস্যা।' : 'Connection error.'),
      });
    } finally {
      setBuyingId(null);
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString(isBn ? 'bn-BD' : 'en-US', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  if (loading && packages.length === 0) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted, #64748b)' }}>
        <RefreshCw className={styles.spin} size={28} style={{ margin: '0 auto 1rem' }} />
        <p>{isBn ? 'এসএমএস প্যাকেজ ও ব্যালেন্স তথ্য লোড হচ্ছে...' : 'Loading SMS meter and packages...'}</p>
      </div>
    );
  }

  const isLowBalance = meter.remainingSms <= 10 && meter.remainingSms > 0;
  const isZeroBalance = meter.remainingSms === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0369a1 0%, #0284c7 50%, #0d9488 100%)',
          borderRadius: '16px',
          padding: '1.5rem 1.75rem',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 10px 25px -5px rgba(2, 132, 199, 0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', backgroundColor: 'rgba(255, 255, 255, 0.15)', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.75rem', backdropFilter: 'blur(6px)' }}>
              <Zap size={14} color="#fef08a" />
              <span>{isBn ? 'ওটিপি এসএমএস মিটার ও প্যাকেজ' : 'OTP SMS Balance & Meter'}</span>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.4rem', color: '#ffffff' }}>
              SMS Packages
            </h2>
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'rgba(255, 255, 255, 0.88)', maxWidth: '600px', lineHeight: 1.5 }}>
              {isBn
                ? 'সাদাকাহ বিডি ইউজারের ফোন নম্বর ভেরিফিকেশন ও ওটিপি প্রেরণের এসএমএস ব্যালেন্স মিটার ও খুব সোজা থেকে নতুন প্যাকেজ ক্রয়।'
                : 'Monitor OTP balance meter for user phone verifications and purchase new packages directly via Khub Soja.'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={loadData}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={13} />
              <span>{isBn ? 'রিফ্রেশ' : 'Refresh'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Low / Zero Balance Warnings */}
      {isZeroBalance ? (
        <div
          style={{
            padding: '1rem 1.25rem',
            borderRadius: '12px',
            backgroundColor: '#fee2e2',
            border: '1.5px solid #ef4444',
            color: '#991b1b',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: '0.9rem',
            fontWeight: 700,
          }}
        >
          <AlertTriangle size={24} color="#dc2626" />
          <div>
            <div style={{ fontSize: '0.95rem' }}>
              {isBn ? 'গুরুতর সতর্কতা: ওটিপি এসএমএস ব্যালেন্স শূন্য (০)!' : 'CRITICAL ALERT: OTP SMS Balance is Zero!'}
            </div>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', fontWeight: 500, color: '#b91c1c' }}>
              {isBn
                ? 'এসএমএস ব্যালেন্স শূন্য হওয়ায় ইউজার রেজিস্ট্রেশন ও ফোন ভেরিফিকেশনের ওটিপি পাঠানো বন্ধ রয়েছে। অনুগ্রহ করে দ্রুত নিচে থেকে একটি এসএমএস প্যাকেজ রিচার্জ করুন।'
                : 'OTP sending is blocked due to zero balance. Please recharge an SMS package immediately below.'}
            </p>
          </div>
        </div>
      ) : isLowBalance ? (
        <div
          style={{
            padding: '1rem 1.25rem',
            borderRadius: '12px',
            backgroundColor: '#fef3c7',
            border: '1.5px solid #f59e0b',
            color: '#92400e',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: '0.88rem',
            fontWeight: 600,
          }}
        >
          <AlertTriangle size={20} color="#d97706" />
          <span>
            {isBn
              ? `সতর্কতা: আপনার একাউন্টে আর মাত্র ${meter.remainingSms} টি এসএমএস রয়েছে। ব্যালেন্স শূন্য হওয়ার আগেই রিচার্জ করুন।`
              : `Low Balance: Only ${meter.remainingSms} SMS remaining. Please recharge before it expires.`}
          </span>
        </div>
      ) : null}

      {/* Payment Feedback */}
      {paymentMsg && (
        <div
          style={{
            padding: '0.9rem 1.2rem',
            borderRadius: '10px',
            backgroundColor: paymentMsg.type === 'success' ? '#ecfdf5' : '#fef2f2',
            border: `1px solid ${paymentMsg.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
            color: paymentMsg.type === 'success' ? '#065f46' : '#991b1b',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            fontSize: '0.88rem',
            fontWeight: 600,
          }}
        >
          {paymentMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{paymentMsg.text}</span>
        </div>
      )}

      {/* SMS Meter KPI Stats (Mobile & Desktop Adaptive) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
        }}
      >
        {/* Remaining SMS (Main Metric) */}
        <div
          style={{
            backgroundColor: 'var(--surface, #ffffff)',
            borderRadius: '12px',
            border: `2px solid ${isZeroBalance ? '#ef4444' : isLowBalance ? '#f59e0b' : 'var(--color-primary, #059669)'}`,
            padding: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '10px',
              backgroundColor: isZeroBalance ? '#fee2e2' : isLowBalance ? '#fef3c7' : 'rgba(5, 150, 105, 0.12)',
              color: isZeroBalance ? '#dc2626' : isLowBalance ? '#d97706' : '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <MessageSquare size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-muted, #64748b)' }}>
              {isBn ? 'অবশিষ্ট ওটিপি এসএমএস' : 'Remaining SMS'}
            </span>
            <div
              style={{
                fontSize: '1.6rem',
                fontWeight: 800,
                color: isZeroBalance ? '#dc2626' : isLowBalance ? '#d97706' : 'var(--text-main, #0f172a)',
                marginTop: '0.2rem',
              }}
            >
              {meter.remainingSms.toLocaleString(isBn ? 'bn-BD' : 'en-US')}
            </div>
            <span style={{ fontSize: '0.72rem', color: isZeroBalance ? '#dc2626' : '#059669', fontWeight: 700 }}>
              {isZeroBalance
                ? (isBn ? 'রিচার্জ আবশ্যক' : 'Recharge Required')
                : (isBn ? 'ওটিপি প্রেরণ সচল' : 'OTP Active')}
            </span>
          </div>
        </div>

        {/* Total Used SMS */}
        <div
          style={{
            backgroundColor: 'var(--surface, #ffffff)',
            borderRadius: '12px',
            border: '1px solid var(--color-border, #e2e8f0)',
            padding: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '10px',
              backgroundColor: 'rgba(2, 132, 199, 0.12)',
              color: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Send size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-muted, #64748b)' }}>
              {isBn ? 'মোট প্রেরিত/ব্যবহৃত' : 'Total Used'}
            </span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main, #0f172a)', marginTop: '0.2rem' }}>
              {meter.totalUsed.toLocaleString(isBn ? 'bn-BD' : 'en-US')}
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted, #64748b)' }}>
              {isBn ? 'ইউজার ভেরিফিকেশনে ডেলিভার্ড' : 'Delivered to users'}
            </span>
          </div>
        </div>

        {/* Total Credited SMS */}
        <div
          style={{
            backgroundColor: 'var(--surface, #ffffff)',
            borderRadius: '12px',
            border: '1px solid var(--color-border, #e2e8f0)',
            padding: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '10px',
              backgroundColor: 'rgba(124, 58, 237, 0.12)',
              color: '#7c3aed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ShoppingBag size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-muted, #64748b)' }}>
              {isBn ? 'সর্বমোট সংগৃহীত এসএমএস' : 'Total Purchased'}
            </span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main, #0f172a)', marginTop: '0.2rem' }}>
              {meter.totalCredited.toLocaleString(isBn ? 'bn-BD' : 'en-US')}
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted, #64748b)' }}>
              {isBn ? 'সকল প্যাকেজ যোগফল' : 'Sum of all recharges'}
            </span>
          </div>
        </div>
      </div>

      {/* Available Packages Grid */}
      <div
        style={{
          backgroundColor: 'var(--surface, #ffffff)',
          borderRadius: '14px',
          border: '1px solid var(--color-border, #e2e8f0)',
          padding: '1.5rem',
          boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
              {isBn ? 'এসএমএস প্যাকেজ রিচার্জ করুন' : 'Purchase SMS Packages'}
            </h3>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-text-muted, #64748b)' }}>
              {isBn
                ? 'আপনার প্রয়োজন অনুযায়ী প্যাকেজ বেছে নিয়ে খুব সোজা পেমেন্ট গেটওয়ের মাধ্যমে রিচার্জ করুন।'
                : 'Select an SMS package to recharge instantly via Khub Soja payment gateway.'}
            </p>
          </div>
          <span
            style={{
              fontSize: '0.74rem',
              fontWeight: 700,
              padding: '0.25rem 0.65rem',
              borderRadius: '20px',
              backgroundColor: 'rgba(2, 132, 199, 0.1)',
              color: '#0284c7',
              border: '1px solid rgba(2, 132, 199, 0.25)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
            }}
          >
            <Sparkles size={12} />
            <span>{isBn ? 'তাত্ক্ষণিক স্বয়ংক্রিয় ক্রেডিট' : 'Instant Auto Credit'}</span>
          </span>
        </div>

        {/* Packages Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
            gap: '1rem',
          }}
        >
          {packages.map((pkg) => {
            const isBuying = buyingId === pkg.id;
            return (
              <div
                key={pkg.id}
                style={{
                  borderRadius: '12px',
                  border: '1.5px solid var(--color-border, #e2e8f0)',
                  backgroundColor: 'var(--background-alt, #fafbfc)',
                  padding: '1.15rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  position: 'relative',
                  transition: 'transform 0.15s ease, border-color 0.15s ease',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>
                      {pkg.name}
                    </span>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.12rem 0.45rem',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(5, 150, 105, 0.1)',
                        color: 'var(--color-primary, #059669)',
                      }}
                    >
                      {pkg.smsCount} SMS
                    </span>
                  </div>

                  {/* Clean Total Price in BDT (No Paisa Displayed) */}
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary, #059669)' }}>
                    ৳{Number(pkg.amount).toLocaleString(isBn ? 'bn-BD' : 'en-US')}
                  </div>

                  <p style={{ margin: '0.4rem 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted, #64748b)' }}>
                    {isBn ? `${pkg.smsCount} টি ইউজার ওটিপি পাঠানোর সুবিধা` : `Quota for ${pkg.smsCount} verification OTPs`}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleBuyPackage(pkg)}
                  disabled={Boolean(buyingId)}
                  style={{
                    width: '100%',
                    padding: '0.55rem',
                    borderRadius: '8px',
                    backgroundColor: 'var(--color-primary, #059669)',
                    color: '#ffffff',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: buyingId ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    transition: 'background 0.15s',
                    opacity: buyingId ? 0.7 : 1,
                  }}
                >
                  {isBuying ? (
                    <>
                      <RefreshCw className={styles.spin} size={14} />
                      <span>{isBn ? 'লোড হচ্ছে...' : 'Processing...'}</span>
                    </>
                  ) : (
                    <span>{isBn ? 'প্যাকেজ কিনুন' : 'Buy Package'}</span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Purchase History Table */}
      <div
        style={{
          backgroundColor: 'var(--surface, #ffffff)',
          borderRadius: '14px',
          border: '1px solid var(--color-border, #e2e8f0)',
          padding: '1.5rem',
          boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <History size={18} color="var(--color-primary, #059669)" />
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
            {isBn ? 'এসএমএস প্যাকেজ ক্রয়ের ইতিহাস' : 'SMS Package Purchase History'}
          </h3>
        </div>

        {purchases.length === 0 ? (
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted, #64748b)', padding: '1rem 0' }}>
            {isBn ? 'এখনও কোনো প্যাকেজ ক্রয় করা হয়নি।' : 'No package purchases found.'}
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border, #e2e8f0)', color: 'var(--color-text-muted, #64748b)' }}>
                  <th style={{ padding: '0.6rem 0.75rem' }}>{isBn ? 'তারিখ' : 'Date'}</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>{isBn ? 'প্যাকেজের নাম' : 'Package'}</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>{isBn ? 'এসএমএস সংখ্যা' : 'SMS Count'}</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>{isBn ? 'মূল্য (টাকা)' : 'Amount'}</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>{isBn ? 'ট্রানজেকশন আইডি' : 'Transaction ID'}</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>{isBn ? 'স্ট্যাটাস' : 'Status'}</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((pur: any) => (
                  <tr key={pur.id} style={{ borderBottom: '1px solid var(--color-border, #f1f5f9)' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 600, color: 'var(--text-main, #0f172a)' }}>
                      {formatDate(pur.purchasedAt || pur.createdAt)}
                    </td>
                    <td style={{ padding: '0.75rem', fontWeight: 700 }}>
                      {pur.packageName}
                    </td>
                    <td style={{ padding: '0.75rem', color: 'var(--color-primary, #059669)', fontWeight: 700 }}>
                      +{pur.smsCount} SMS
                    </td>
                    <td style={{ padding: '0.75rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
                      ৳{Number(pur.amount).toLocaleString(isBn ? 'bn-BD' : 'en-US')}
                    </td>
                    <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.76rem', color: 'var(--color-text-muted, #64748b)' }}>
                      {pur.transactionId}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '0.12rem 0.45rem',
                          borderRadius: '6px',
                          backgroundColor: pur.status === 'success' ? '#d1fae5' : '#fee2e2',
                          color: pur.status === 'success' ? '#047857' : '#b91c1c',
                        }}
                      >
                        {pur.status === 'success' ? (isBn ? 'সফল' : 'Success') : pur.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
