'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  Calendar,
  CreditCard,
  ExternalLink,
  Sparkles,
  History,
  AlertTriangle,
  RefreshCw,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { getApiUrl } from '@/lib/api-config';
import { getAuthToken } from '@/lib/auth-token';
import styles from '../../admin.module.css';

interface AppsPrivilegeTabProps {
  isBn: boolean;
  user: any;
}

export default function AppsPrivilegeTab({ isBn, user }: AppsPrivilegeTabProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<{
    currentValidUntil: string;
    daysRemaining: number;
    isExpired: boolean;
    monthlyPrice: number;
    yearlyPrice: number;
    regularMonthlyPrice: number;
    regularYearlyPrice: number;
    payments: any[];
  } | null>(null);

  const [selectedPlan, setSelectedPlan] = useState<'yearly' | 'monthly'>('yearly');
  const [initiatingPayment, setInitiatingPayment] = useState<boolean>(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [paymentMsg, setPaymentMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      const res = await fetch(`${getApiUrl()}/maintenance/apps-privilege`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load apps privilege status:', err);
    } finally {
      setLoading(false);
    }
  };

  // Silent live background polling every 6 seconds when tab is open so validity updates instantly
  useEffect(() => {
    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        loadStatus();
      }
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Check URL query parameters for return callback from Khub Soja payment gateway
  useEffect(() => {
    loadStatus();

    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const trxId = urlParams.get('transaction_id') || urlParams.get('order_id') || urlParams.get('client_order_id');
      const statusParam = urlParams.get('status') || '';
      const orderIdParam = urlParams.get('order_id') || urlParams.get('client_order_id') || '';

      if (trxId || statusParam === 'SUCCESS' || orderIdParam) {
        setPaymentMsg({
          type: 'info',
          text: isBn
            ? 'খুব সোজা গেটওয়ে থেকে পেমেন্ট যাচাই করা হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...'
            : 'Verifying payment from Khub Soja gateway, please wait...',
        });

        // Verify with backend
        (async () => {
          try {
            const token = await getAuthToken();
            const verifyParam = encodeURIComponent(trxId || orderIdParam);
            const queryParams = new URLSearchParams();
            if (statusParam) queryParams.set('status', statusParam);
            if (orderIdParam) queryParams.set('orderId', orderIdParam);
            const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

            const verifyRes = await fetch(
              `${getApiUrl()}/maintenance/apps-privilege/verify-payment/${verifyParam}${queryString}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  Accept: 'application/json',
                },
              }
            );
            const contentType = verifyRes.headers.get('content-type') || '';
            const verifyData = contentType.includes('application/json')
              ? await verifyRes.json()
              : { message: isBn ? 'সার্ভার থেকে ত্রুটিপূর্ণ উত্তর এসেছে।' : 'Invalid server response.' };

            if (verifyRes.ok && verifyData.status === 'SUCCESS') {
              setPaymentMsg({
                type: 'success',
                text: isBn
                  ? 'আলহামদুলিল্লাহ! আপনার পেমেন্ট সফলভাবে সম্পন্ন হয়েছে এবং সাবস্ক্রিপশন মেয়াদ বৃদ্ধি করা হয়েছে।'
                  : 'Payment successful! Subscription validity has been extended.',
              });
              await loadStatus();
            } else {
              setPaymentMsg({
                type: 'error',
                text: verifyData.message || (isBn ? 'পেমেন্ট যাচাই ব্যর্থ হয়েছে।' : 'Payment verification failed.'),
              });
            }
          } catch (e: any) {
            setPaymentMsg({
              type: 'error',
              text: isBn ? 'পেমেন্ট যাচাইয়ের সময় সমস্যা হয়েছে।' : 'Error verifying payment.',
            });
          } finally {
            // Clean URL query parameters
            const cleanUrl = window.location.pathname + '?tab=apps_privilege';
            window.history.replaceState({}, document.title, cleanUrl);
          }
        })();
      }
    }
  }, [isBn]);

  const handleManualVerify = async (paymentRecord: any) => {
    try {
      setVerifyingId(paymentRecord.id);
      setPaymentMsg(null);
      const token = await getAuthToken();
      const verifyParam = encodeURIComponent(paymentRecord.transactionId || paymentRecord.orderId);
      const queryParams = new URLSearchParams();
      queryParams.set('status', 'SUCCESS');
      if (paymentRecord.orderId) queryParams.set('orderId', paymentRecord.orderId);

      const res = await fetch(
        `${getApiUrl()}/maintenance/apps-privilege/verify-payment/${verifyParam}?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        }
      );
      const contentType = res.headers.get('content-type') || '';
      const data = contentType.includes('application/json')
        ? await res.json()
        : { message: isBn ? 'সার্ভার থেকে ত্রুটিপূর্ণ উত্তর এসেছে।' : 'Invalid server response.' };

      if (res.ok && data.status === 'SUCCESS') {
        setPaymentMsg({
          type: 'success',
          text: isBn
            ? 'আলহামদুলিল্লাহ! আপনার পেমেন্ট সফলভাবে সম্পন্ন হয়েছে এবং সাবস্ক্রিপশন মেয়াদ বৃদ্ধি করা হয়েছে।'
            : 'Payment successful! Subscription validity has been extended.',
        });
        await loadStatus();
      } else {
        setPaymentMsg({
          type: 'error',
          text: data.message || (isBn ? 'পেমেন্ট যাচাই করা সম্ভব হয়নি।' : 'Could not verify payment.'),
        });
      }
    } catch (err: any) {
      setPaymentMsg({
        type: 'error',
        text: err?.message || (isBn ? 'যাচাইকালে সমস্যা হয়েছে।' : 'Verification error.'),
      });
    } finally {
      setVerifyingId(null);
    }
  };

  const handleInitiatePayment = async () => {
    try {
      setInitiatingPayment(true);
      setPaymentMsg(null);
      const token = await getAuthToken();

      const returnUrl = `${window.location.origin}${window.location.pathname}?tab=apps_privilege`;

      const res = await fetch(`${getApiUrl()}/maintenance/apps-privilege/create-payment-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: JSON.stringify({
          planType: selectedPlan,
          returnUrl,
          cancelUrl: returnUrl,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      let result: any = null;
      if (contentType.includes('application/json')) {
        result = await res.json();
      } else {
        const text = await res.text();
        console.warn('Non-JSON response from create-payment-session:', text.slice(0, 200));
        throw new Error(isBn ? 'সার্ভার সংযোগে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।' : 'Server connection error.');
      }

      if (res.ok && result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else {
        setPaymentMsg({
          type: 'error',
          text: result?.message || (isBn ? 'পেমেন্ট সেশন শুরু করা সম্ভব হয়নি।' : 'Could not initiate checkout.'),
        });
      }
    } catch (err: any) {
      setPaymentMsg({
        type: 'error',
        text: err?.message || (isBn ? 'পেমেন্ট গেটওয়েতে সংযোগে সমস্যা।' : 'Connection error.'),
      });
    } finally {
      setInitiatingPayment(false);
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

  if (loading && !data) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted, #64748b)' }}>
        <RefreshCw className={styles.spin} size={28} style={{ margin: '0 auto 1rem' }} />
        <p>{isBn ? 'Apps Privilege তথ্য লোড হচ্ছে...' : 'Loading Apps Privilege status...'}</p>
      </div>
    );
  }

  const validUntilStr = data?.currentValidUntil ? formatDate(data.currentValidUntil) : '০১/০৯/২০২৭';
  const daysLeft = data?.daysRemaining ?? 320;
  const isExpired = data?.isExpired ?? false;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f766e 100%)',
          borderRadius: '16px',
          padding: '1.5rem 1.75rem',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', backgroundColor: 'rgba(255, 255, 255, 0.12)', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.75rem', backdropFilter: 'blur(6px)' }}>
              <ShieldAlert size={14} color="#f43f5e" />
              <span>{isBn ? 'সিস্টেম সাবস্ক্রিপশন ও রক্ষণাবেক্ষণ' : 'System Subscription & Privilege'}</span>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.4rem', color: '#ffffff' }}>
              Apps Privilege
            </h2>
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'rgba(255, 255, 255, 0.85)', maxWidth: '600px', lineHeight: 1.5 }}>
              {isBn
                ? 'সাদাকাহ বিডি প্ল্যাটফর্মের ক্লাউড ডোমেইন, লাইটস্পিড হোস্টিং, ডাটাবেজ সিকিউরিটি ও সিস্টেম রক্ষণাবেক্ষণ সাবস্ক্রিপশন ব্যবস্থাপনা।'
                : 'Manage domain, LiteSpeed hosting, database security, and system maintenance subscription for Sadaqahbd.'}
            </p>
          </div>

          <a
            href="https://khubsoja.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              padding: '0.45rem 0.9rem',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 600,
              textDecoration: 'none',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              transition: 'background 0.2s',
            }}
          >
            <span>{isBn ? 'সার্ভিস প্রোভাইডার: খুব সোজা' : 'Powered by Khub Soja'}</span>
            <ExternalLink size={13} />
          </a>
        </div>
      </div>

      {/* Feedback Alert */}
      {paymentMsg && (
        <div
          style={{
            padding: '1rem 1.25rem',
            borderRadius: '10px',
            backgroundColor:
              paymentMsg.type === 'success'
                ? '#ecfdf5'
                : paymentMsg.type === 'error'
                ? '#fef2f2'
                : '#f0f9ff',
            border: `1px solid ${
              paymentMsg.type === 'success'
                ? '#a7f3d0'
                : paymentMsg.type === 'error'
                ? '#fecaca'
                : '#bae6fd'
            }`,
            color:
              paymentMsg.type === 'success'
                ? '#065f46'
                : paymentMsg.type === 'error'
                ? '#991b1b'
                : '#0369a1',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            fontSize: '0.88rem',
            fontWeight: 600,
          }}
        >
          {paymentMsg.type === 'success' ? (
            <CheckCircle2 size={18} />
          ) : paymentMsg.type === 'error' ? (
            <AlertTriangle size={18} />
          ) : (
            <RefreshCw className={styles.spin} size={18} />
          )}
          <span>{paymentMsg.text}</span>
        </div>
      )}

      {/* Subscription Status Card */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1rem',
        }}
      >
        {/* Valid Until Card */}
        <div
          style={{
            backgroundColor: 'var(--surface, #ffffff)',
            borderRadius: '12px',
            border: '1px solid var(--color-border, #e2e8f0)',
            padding: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '10px',
              backgroundColor: isExpired ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
              color: isExpired ? '#ef4444' : '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Calendar size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-muted, #64748b)' }}>
              {isBn ? 'বর্তমান সাবস্ক্রিপশন মেয়াদ (লাস্ট ডেট)' : 'Current Valid Until (Due Date)'}
            </span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main, #0f172a)', marginTop: '0.2rem' }}>
              {validUntilStr}
            </div>
            <span
              style={{
                display: 'inline-block',
                marginTop: '0.3rem',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '0.15rem 0.55rem',
                borderRadius: '12px',
                backgroundColor: isExpired ? '#fee2e2' : '#d1fae5',
                color: isExpired ? '#b91c1c' : '#047857',
              }}
            >
              {isExpired ? (isBn ? 'মেয়াদ উত্তীর্ণ (জরুরি রিনিউ প্রয়োজন)' : 'Expired') : (isBn ? 'সক্রিয় ও সুরক্ষিত' : 'Active & Protected')}
            </span>
          </div>
        </div>

        {/* Days Remaining Card */}
        <div
          style={{
            backgroundColor: 'var(--surface, #ffffff)',
            borderRadius: '12px',
            border: '1px solid var(--color-border, #e2e8f0)',
            padding: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
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
            <Clock size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-muted, #64748b)' }}>
              {isBn ? 'অবশিষ্ট দিন' : 'Days Remaining'}
            </span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main, #0f172a)', marginTop: '0.2rem' }}>
              {isBn ? `${daysLeft} দিন` : `${daysLeft} Days`}
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted, #64748b)', marginTop: '0.3rem', display: 'block' }}>
              {isBn ? 'মেয়াদ শেষের আগে রিনিউ করলে মেয়াদকাল যোগ হবে' : 'Renewing early extends existing validity'}
            </span>
          </div>
        </div>
      </div>

      {/* Renewal Plan Selection & Khub Soja Payment Gateway Card */}
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
              {isBn ? 'সাবস্ক্রিপশন রিনিউ ও পেমেন্ট' : 'Subscription Renewal & Payment'}
            </h3>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-text-muted, #64748b)' }}>
              {isBn
                ? 'মাসিক বা বাৎসরিক প্যাকেজ বেছে নিয়ে খুব সোজা পেমেন্ট গেটওয়ের মাধ্যমে পরিশোধ করুন।'
                : 'Select monthly or yearly plan to pay securely via Khub Soja payment gateway.'}
            </p>
          </div>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.25rem 0.65rem',
              borderRadius: '20px',
              backgroundColor: 'rgba(234, 88, 12, 0.1)',
              color: '#ea580c',
              border: '1px solid rgba(234, 88, 12, 0.25)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
            }}
          >
            <Sparkles size={12} />
            <span>{isBn ? 'স্পেশাল ৫০% ডিসকাউন্ট সক্রিয়' : 'Special 50% Discount Active'}</span>
          </span>
        </div>

        {/* Plan Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          {/* Yearly Plan Card (Recommended) */}
          <div
            onClick={() => setSelectedPlan('yearly')}
            style={{
              borderRadius: '12px',
              border: `2px solid ${selectedPlan === 'yearly' ? 'var(--color-primary, #059669)' : 'var(--color-border, #cbd5e1)'}`,
              backgroundColor: selectedPlan === 'yearly' ? 'rgba(5, 150, 105, 0.05)' : 'var(--background-alt, #fafbfc)',
              padding: '1.25rem',
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <div>
                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>
                  {isBn ? 'বাৎসরিক সাবস্ক্রিপশন (১ বছর)' : 'Yearly Subscription (1 Year)'}
                </span>
                <span
                  style={{
                    display: 'block',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: '#059669',
                    marginTop: '0.2rem',
                  }}
                >
                  {isBn ? '★ সর্বাধিক সাশ্রয়ী ও সুপারিশকৃত' : '★ Most Popular & Economical'}
                </span>
              </div>
              <input
                type="radio"
                name="planType"
                checked={selectedPlan === 'yearly'}
                onChange={() => setSelectedPlan('yearly')}
                style={{ accentColor: 'var(--color-primary, #059669)', width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </div>

            <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'baseline', gap: '0.6rem' }}>
              <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>
                ৳৫,০০০
              </span>
              <span style={{ fontSize: '0.92rem', color: 'var(--color-text-muted, #94a3b8)', textDecoration: 'line-through' }}>
                ৳১০,০০০
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted, #64748b)' }}>
                / {isBn ? 'বছর' : 'year'}
              </span>
            </div>

            <ul style={{ margin: '0.85rem 0 0', paddingLeft: '1.1rem', fontSize: '0.76rem', color: 'var(--color-text-muted, #64748b)', lineHeight: 1.5 }}>
              <li>{isBn ? 'সম্পূর্ণ ৩৬৫ দিনের সিস্টেম ও সার্ভার সুবিধা' : 'Full 365 days cloud server privilege'}</li>
              <li>{isBn ? 'ক্লাউড ব্যাকআপ ও সার্বক্ষণিক টেক সাপোর্ট' : 'Cloud backups & priority support'}</li>
              <li>{isBn ? 'বর্তমান মেয়াদের পর থেকে অতিরিক্ত ১ বছর যুক্ত হবে' : '+1 Year extended from current due date'}</li>
            </ul>
          </div>

          {/* Monthly Plan Card */}
          <div
            onClick={() => setSelectedPlan('monthly')}
            style={{
              borderRadius: '12px',
              border: `2px solid ${selectedPlan === 'monthly' ? 'var(--color-primary, #059669)' : 'var(--color-border, #cbd5e1)'}`,
              backgroundColor: selectedPlan === 'monthly' ? 'rgba(5, 150, 105, 0.05)' : 'var(--background-alt, #fafbfc)',
              padding: '1.25rem',
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <div>
                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>
                  {isBn ? 'মাসিক সাবস্ক্রিপশন (১ মাস)' : 'Monthly Subscription (1 Month)'}
                </span>
                <span
                  style={{
                    display: 'block',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    color: 'var(--color-text-muted, #64748b)',
                    marginTop: '0.2rem',
                  }}
                >
                  {isBn ? 'প্রতি মাসের জন্য ফ্লেক্সিবল রিনিউয়াল' : 'Flexible monthly renewal'}
                </span>
              </div>
              <input
                type="radio"
                name="planType"
                checked={selectedPlan === 'monthly'}
                onChange={() => setSelectedPlan('monthly')}
                style={{ accentColor: 'var(--color-primary, #059669)', width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </div>

            <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'baseline', gap: '0.6rem' }}>
              <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>
                ৳৫০০
              </span>
              <span style={{ fontSize: '0.92rem', color: 'var(--color-text-muted, #94a3b8)', textDecoration: 'line-through' }}>
                ৳১,০০০
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted, #64748b)' }}>
                / {isBn ? 'মাস' : 'month'}
              </span>
            </div>

            <ul style={{ margin: '0.85rem 0 0', paddingLeft: '1.1rem', fontSize: '0.76rem', color: 'var(--color-text-muted, #64748b)', lineHeight: 1.5 }}>
              <li>{isBn ? '৩০ দিনের জন্য অ্যাপ ও হোস্টিং সক্রিয়তা' : '30 days app & hosting activity'}</li>
              <li>{isBn ? 'বর্তমান মেয়াদের পর থেকে ৩০ দিন মেয়াদ বৃদ্ধি' : '+30 Days extended from current due date'}</li>
            </ul>
          </div>
        </div>

        {/* Action Button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border, #e2e8f0)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--color-text-muted, #64748b)' }}>
            <CreditCard size={16} />
            <span>
              {isBn
                ? 'বিকাশ, নগদ, রকেট, ডেবিট/ক্রেডিট কার্ডের মাধ্যমে তাত্ক্ষণিক পেমেন্ট'
                : 'Instant payment via bKash, Nagad, Rocket, or Cards'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleInitiatePayment}
            disabled={initiatingPayment}
            style={{
              padding: '0.65rem 1.4rem',
              borderRadius: '8px',
              backgroundColor: 'var(--color-primary, #059669)',
              color: '#ffffff',
              fontSize: '0.92rem',
              fontWeight: 700,
              border: 'none',
              cursor: initiatingPayment ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
              opacity: initiatingPayment ? 0.7 : 1,
            }}
          >
            {initiatingPayment ? (
              <>
                <RefreshCw className={styles.spin} size={16} />
                <span>{isBn ? 'গেটওয়ে প্রস্তুত হচ্ছে...' : 'Opening Gateway...'}</span>
              </>
            ) : (
              <>
                <span>
                  {isBn
                    ? `${selectedPlan === 'yearly' ? 'বাৎসরিক (৳৫,০০০)' : 'মাসিক (৳৫০০)'} রিনিউ পেমেন্ট করুন`
                    : `Pay ${selectedPlan === 'yearly' ? '৳5,000 (Yearly)' : '৳500 (Monthly)'}`}
                </span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Payment History List */}
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
            {isBn ? 'পেমেন্ট ও রিনিউয়াল ইতিহাস' : 'Payment & Renewal History'}
          </h3>
        </div>

        {(!data?.payments || data.payments.length === 0) ? (
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted, #64748b)', padding: '1rem 0' }}>
            {isBn ? 'কোনো পূর্ববর্তী পেমেন্ট পাওয়া যায়নি।' : 'No payment records found.'}
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border, #e2e8f0)', color: 'var(--color-text-muted, #64748b)' }}>
                  <th style={{ padding: '0.6rem 0.75rem' }}>{isBn ? 'তারিখ' : 'Date'}</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>{isBn ? 'প্ল্যান' : 'Plan'}</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>{isBn ? 'পরিমাণ (টাকা)' : 'Amount (BDT)'}</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>{isBn ? 'ট্রানজেকশন আইডি' : 'Transaction ID'}</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>{isBn ? 'স্ট্যাটাস' : 'Status'}</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>{isBn ? 'বর্ধিত মেয়াদকাল' : 'Extended Until'}</th>
                </tr>
              </thead>
              <tbody>
                {data.payments.map((p: any) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--color-border, #f1f5f9)' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 600, color: 'var(--text-main, #0f172a)' }}>
                      {formatDate(p.paidAt || p.createdAt)}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '0.12rem 0.45rem',
                          borderRadius: '6px',
                          backgroundColor: p.planType === 'yearly' ? 'rgba(5, 150, 105, 0.1)' : 'rgba(2, 132, 199, 0.1)',
                          color: p.planType === 'yearly' ? '#059669' : '#0284c7',
                        }}
                      >
                        {p.planType === 'yearly' ? (isBn ? 'বাৎসরিক' : 'Yearly') : (isBn ? 'মাসিক' : 'Monthly')}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
                      ৳{Number(p.amount).toLocaleString(isBn ? 'bn-BD' : 'en-US')}
                    </td>
                    <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.76rem', color: 'var(--color-text-muted, #64748b)' }}>
                      {p.transactionId}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {p.status === 'success' ? (
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '0.12rem 0.45rem',
                            borderRadius: '6px',
                            backgroundColor: '#d1fae5',
                            color: '#047857',
                          }}
                        >
                          {isBn ? 'সফল' : 'Success'}
                        </span>
                      ) : (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              padding: '0.12rem 0.45rem',
                              borderRadius: '6px',
                              backgroundColor: '#fee2e2',
                              color: '#b91c1c',
                            }}
                          >
                            {p.status}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleManualVerify(p)}
                            disabled={verifyingId === p.id}
                            style={{
                              padding: '0.2rem 0.55rem',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              borderRadius: '5px',
                              border: '1px solid #059669',
                              backgroundColor: '#059669',
                              color: '#ffffff',
                              cursor: verifyingId === p.id ? 'not-allowed' : 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            {verifyingId === p.id ? (isBn ? 'সিঙ্ক হচ্ছে...' : 'Syncing...') : (isBn ? '⚡ লাইভ সিঙ্ক' : '⚡ Sync Now')}
                          </button>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem', fontWeight: 600, color: '#059669' }}>
                      {p.extendedValidUntil ? formatDate(p.extendedValidUntil) : '-'}
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
