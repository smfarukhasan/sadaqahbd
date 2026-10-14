'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import styles from './page.module.css';
import {
  BarChart3,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  PieChart,
  User,
  EyeOff,
  Search,
  Heart,
  Building2,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { getApiUrl } from '@/lib/api-config';

export default function LedgerPage() {
  const t = useTranslations('Ledger');
  const locale = useLocale();
  const isBn = locale === 'bn';

  const [ledgerStats, setLedgerStats] = useState({
    totalDonated: 0,
    totalRandom: 0,
    totalDirect: 0,
    totalAllocated: 0,
    randomFundPoolBalance: 0,
    totalDirectlyToStudents: 0,
  });

  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const apiUrl = getApiUrl();
    Promise.all([
      fetch(`${apiUrl}/donations/ledger-stats`)
        .then((res) => res.json())
        .catch(() => null),
      fetch(`${apiUrl}/donations/public-feed`)
        .then((res) => res.json())
        .catch(() => null),
    ])
      .then(([statsData, feedData]) => {
        if (statsData && typeof statsData.totalDonated === 'number') {
          setLedgerStats(statsData);
        }
        if (Array.isArray(feedData)) {
          setRecentTransactions(feedData);
        }
      })
      .catch((err) => console.error('Failed to load ledger data:', err))
      .finally(() => setLoading(false));
  }, []);

  const formatAmount = (num: number) => {
    return locale === 'bn' ? num.toLocaleString('bn-BD') : num.toLocaleString('en-US');
  };

  const getRoleBadge = (role?: string | null) => {
    if (!role) return null;
    switch (role) {
      case 'donor':
        return { label: isBn ? 'দাতা' : 'Donor', bg: 'rgba(16, 185, 129, 0.1)', color: '#059669' };
      case 'teacher':
        return { label: isBn ? 'শিক্ষক' : 'Teacher', bg: 'rgba(37, 99, 235, 0.1)', color: '#2563eb' };
      case 'student':
        return { label: isBn ? 'শিক্ষার্থী' : 'Student', bg: 'rgba(217, 119, 6, 0.1)', color: '#d97706' };
      case 'organization':
        return { label: isBn ? 'প্রতিষ্ঠান' : 'Org', bg: 'rgba(139, 92, 246, 0.1)', color: '#7c3aed' };
      case 'super_admin':
      case 'admin':
      case 'master_admin':
        return { label: isBn ? 'কর্তৃপক্ষ' : 'Admin', bg: 'rgba(220, 38, 38, 0.1)', color: '#dc2626' };
      default:
        return { label: role, bg: 'rgba(100, 116, 139, 0.1)', color: '#475569' };
    }
  };

  const filteredTransactions = recentTransactions.filter((trx) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      (trx.donorName && trx.donorName.toLowerCase().includes(q)) ||
      (trx.targetLabel && trx.targetLabel.toLowerCase().includes(q)) ||
      (trx.paymentMethod && trx.paymentMethod.toLowerCase().includes(q)) ||
      String(trx.amount).includes(q)
    );
  });

  return (
    <div className="container" style={{ padding: '2.5rem 1rem' }}>
      <div className={styles.header}>
        <div className={styles.iconCircle}>
          <BarChart3 size={32} />
        </div>
        <h1>{t('title')}</h1>
        <p>
          {isBn
            ? 'সাদাকাহ বিডি-র প্রতিটি টাকার হিসাব জনগণের জন্য উন্মুক্ত। কত টাকা অনুদান হয়েছে এবং কোথায় ব্যয় হয়েছে তার পূর্ণাঙ্গ স্বচ্ছ হিসাব বিবরণী।'
            : 'Complete and transparent public financial ledger of all platform donations and allocations.'}
        </p>
      </div>

      {/* Main Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.cardTop}>
            <span className={styles.statTitle}>{t('totalDonated')}</span>
            <TrendingUp size={20} className={styles.iconGreen} />
          </div>
          <div className={`${styles.statNumber} ${styles.iconGreen}`}>
            ৳ {formatAmount(ledgerStats.totalDonated)}
          </div>
          <span className={styles.statSub}>{isBn ? 'সর্বমোট সংগৃহীত সাদাকাহ' : 'Total Collected Sadaqah'}</span>
        </div>

        <div className={styles.statCard}>
          <div className={styles.cardTop}>
            <span className={styles.statTitle}>{t('totalDirect')}</span>
            <CheckCircle2 size={20} className={styles.iconBlue} />
          </div>
          <div className={styles.statNumber}>
            ৳ {formatAmount(ledgerStats.totalDirect)}
          </div>
          <span className={styles.statSub}>{isBn ? 'শিক্ষার্থীদের নির্দিষ্ট অনুদান' : 'Direct Student Grants'}</span>
        </div>

        <div className={styles.statCard}>
          <div className={styles.cardTop}>
            <span className={styles.statTitle}>{t('totalRandom')}</span>
            <PieChart size={20} className={styles.iconAmber} />
          </div>
          <div className={styles.statNumber}>
            ৳ {formatAmount(ledgerStats.totalRandom)}
          </div>
          <span className={styles.statSub}>{isBn ? 'সাধারণ ফান্ড পুল অনুদান' : 'General Fund Pool'}</span>
        </div>

        <div className={styles.statCard}>
          <div className={styles.cardTop}>
            <span className={styles.statTitle}>{t('allocatedToStudents')}</span>
            <ShieldCheck size={20} className={styles.iconGreen} />
          </div>
          <div className={`${styles.statNumber} ${styles.iconGreen}`}>
            ৳ {formatAmount(ledgerStats.totalDirectlyToStudents)}
          </div>
          <span className={styles.statSub}>{isBn ? 'সরাসরি + সাধারণ ফান্ড থেকে প্রাপ্ত' : 'Direct + Allocated to Students'}</span>
        </div>
      </div>

      {/* Public Donations Ledger Feed */}
      <div className={styles.tableCard} style={{ marginTop: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', fontWeight: 800 }}>
              <Heart size={22} color="#10b981" />
              {isBn ? 'উন্মুক্ত ডোনার ও অনুদান খতিয়ান (পাবলিক লেজার)' : 'Public Donors & Donations Ledger'}
            </h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {isBn
                ? 'প্লাটফর্মে জমাকৃত সাম্প্রতিক প্রতিটি অনুদানের স্বচ্ছ বিবরণ। গোপন রাখা অনুদানসমূহ "গোপন রাখা হয়েছে" হিসেবে প্রদর্শিত।'
                : 'Real-time record of all verified contributions. Anonymous gifts are shown without personal details.'}
            </p>
          </div>

          <div style={{ position: 'relative', minWidth: '260px' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isBn ? 'দাতা, ক্ষেত্র বা মাধ্যম খুঁজুন...' : 'Search donor, target, method...'}
              style={{
                width: '100%',
                padding: '0.55rem 0.85rem 0.55rem 2.25rem',
                borderRadius: '10px',
                border: '1px solid var(--surface-border)',
                backgroundColor: 'var(--background)',
                fontSize: '0.85rem',
                color: 'var(--text-main)',
                outline: 'none',
              }}
            />
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ padding: '0.85rem 0.75rem' }}>{isBn ? 'তারিখ ও সময়' : 'Date & Time'}</th>
                <th style={{ padding: '0.85rem 0.75rem' }}>{isBn ? 'সম্মানিত দাতা' : 'Contributor / Donor'}</th>
                <th style={{ padding: '0.85rem 0.75rem' }}>{isBn ? 'দানের ক্ষেত্র / লক্ষ্য' : 'Target / Purpose'}</th>
                <th style={{ padding: '0.85rem 0.75rem' }}>{isBn ? 'পদ্ধতি' : 'Method'}</th>
                <th style={{ padding: '0.85rem 0.75rem', textAlign: 'right' }}>{isBn ? 'পরিমাণ' : 'Amount'}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>
                    {isBn ? 'লেজার লোড হচ্ছে...' : 'Loading public ledger...'}
                  </td>
                </tr>
              ) : filteredTransactions.length > 0 ? (
                filteredTransactions.map((trx) => {
                  const roleBadge = getRoleBadge(trx.donorRole);
                  const isAnon = trx.isAnonymous;

                  return (
                    <tr key={trx.id} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                      <td style={{ whiteSpace: 'nowrap', padding: '1rem 0.75rem' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>
                          {new Date(trx.createdAt).toLocaleDateString(isBn ? 'bn-BD' : 'en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {new Date(trx.createdAt).toLocaleTimeString(isBn ? 'bn-BD' : 'en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>

                      <td style={{ padding: '1rem 0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          {/* Avatar Thumbnail or Fallback Icon */}
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              backgroundColor: isAnon ? 'rgba(124, 58, 237, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                              color: isAnon ? '#7c3aed' : '#10b981',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              overflow: 'hidden',
                              fontWeight: 800,
                              fontSize: '0.85rem',
                            }}
                          >
                            {trx.donorAvatarUrl && !isAnon ? (
                              <img
                                src={trx.donorAvatarUrl}
                                alt={trx.donorName}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : isAnon ? (
                              <EyeOff size={16} />
                            ) : (
                              <User size={16} />
                            )}
                          </div>

                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                              <strong style={{ fontSize: '0.92rem', color: isAnon ? 'var(--text-muted)' : 'var(--text-main)' }}>
                                {trx.donorName}
                              </strong>
                              {isAnon ? (
                                <span
                                  style={{
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    padding: '0.15rem 0.45rem',
                                    borderRadius: '9999px',
                                    backgroundColor: 'rgba(124, 58, 237, 0.1)',
                                    color: '#7c3aed',
                                  }}
                                >
                                  {isBn ? 'পরিচয় গোপন' : 'Confidential'}
                                </span>
                              ) : (
                                roleBadge && (
                                  <span
                                    style={{
                                      fontSize: '0.7rem',
                                      fontWeight: 800,
                                      padding: '0.15rem 0.45rem',
                                      borderRadius: '9999px',
                                      backgroundColor: roleBadge.bg,
                                      color: roleBadge.color,
                                    }}
                                  >
                                    {roleBadge.label}
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '1rem 0.75rem' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                          {trx.targetLabel}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {trx.targetType === 'general_fund'
                            ? isBn
                              ? 'সাধারণ শিক্ষা তহবিল'
                              : 'General Education Fund'
                            : isBn
                            ? 'নির্দিষ্ট শিক্ষার্থী'
                            : 'Direct Student Grant'}
                        </div>
                      </td>

                      <td style={{ padding: '1rem 0.75rem', fontSize: '0.85rem' }}>
                        <span
                          style={{
                            padding: '0.2rem 0.55rem',
                            borderRadius: '6px',
                            backgroundColor: 'var(--background)',
                            border: '1px solid var(--surface-border)',
                            fontWeight: 600,
                            fontSize: '0.78rem',
                          }}
                        >
                          {trx.paymentMethod}
                        </span>
                      </td>

                      <td style={{ padding: '1rem 0.75rem', textAlign: 'right' }}>
                        <strong className={styles.amountText} style={{ fontSize: '1.05rem', color: '#10b981' }}>
                          ৳ {formatAmount(trx.amount)}
                        </strong>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>
                    {isBn ? 'অনুসন্ধানের সাথে কোনো অনুদান মেলেনি।' : 'No donation records matched your query.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

