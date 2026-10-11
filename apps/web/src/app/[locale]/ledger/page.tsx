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
} from 'lucide-react';
import { getApiUrl } from '@/lib/api-config';

export default function LedgerPage() {
  const t = useTranslations('Ledger');
  const locale = useLocale();

  const [ledgerStats, setLedgerStats] = useState({
    totalDonated: 0,
    totalRandom: 0,
    totalDirect: 0,
    totalAllocated: 0,
    randomFundPoolBalance: 0,
    totalDirectlyToStudents: 0,
  });

  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const apiUrl = getApiUrl();
    fetch(`${apiUrl}/donations/ledger-stats`)
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.totalDonated === 'number') {
          setLedgerStats(data);
        }
      })
      .catch((err) => console.error('Failed to load ledger stats:', err))
      .finally(() => setLoading(false));
  }, []);

  const formatAmount = (num: number) => {
    return locale === 'bn' ? num.toLocaleString('bn-BD') : num.toLocaleString('en-US');
  };

  return (
    <div className="container" style={{ padding: '2.5rem 1rem' }}>
      <div className={styles.header}>
        <div className={styles.iconCircle}>
          <BarChart3 size={32} />
        </div>
        <h1>{t('title')}</h1>
        <p>
          সাদাকাহ বিডি-র প্রতিটি টাকার হিসাব জনগণের জন্য উন্মুক্ত। কত টাকা অনুদান
          হয়েছে এবং কোথায় ব্যয় হয়েছে তার পূর্ণাঙ্গ হিসাব বিবরণী।
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
          <span className={styles.statSub}>সর্বমোট সংগৃহীত সাদাকাহ</span>
        </div>

        <div className={styles.statCard}>
          <div className={styles.cardTop}>
            <span className={styles.statTitle}>{t('totalDirect')}</span>
            <CheckCircle2 size={20} className={styles.iconBlue} />
          </div>
          <div className={styles.statNumber}>
            ৳ {formatAmount(ledgerStats.totalDirect)}
          </div>
          <span className={styles.statSub}>শিক্ষার্থীদের নির্দিষ্ট অনুদান</span>
        </div>

        <div className={styles.statCard}>
          <div className={styles.cardTop}>
            <span className={styles.statTitle}>{t('totalRandom')}</span>
            <PieChart size={20} className={styles.iconAmber} />
          </div>
          <div className={styles.statNumber}>
            ৳ {formatAmount(ledgerStats.totalRandom)}
          </div>
          <span className={styles.statSub}>সাধারণ ফান্ড পুল অনুদান</span>
        </div>

        <div className={styles.statCard}>
          <div className={styles.cardTop}>
            <span className={styles.statTitle}>{t('allocatedToStudents')}</span>
            <ShieldCheck size={20} className={styles.iconGreen} />
          </div>
          <div className={`${styles.statNumber} ${styles.iconGreen}`}>
            ৳ {formatAmount(ledgerStats.totalDirectlyToStudents)}
          </div>
          <span className={styles.statSub}>সরাসরি + সাধারণ ফান্ড থেকে প্রাপ্ত</span>
        </div>
      </div>

      {/* Transactions Table */}
      <div className={styles.tableCard}>
        <h3>সাম্প্রতিক স্বচ্ছতার লেনদেন তালিকা</h3>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>তারিখ</th>
                <th>লেনদেনের ধরন</th>
                <th>প্রাপক / ফান্ড</th>
                <th>পরিমাণ</th>
                <th>পদ্ধতি</th>
                <th>অবস্থা</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.length > 0 ? (
                recentTransactions.map((trx) => (
                  <tr key={trx.id}>
                    <td>{trx.date}</td>
                    <td>
                      <strong>{trx.type}</strong>
                    </td>
                    <td>
                      <div>{trx.studentName}</div>
                      <small>{trx.institution}</small>
                    </td>
                    <td>
                      <strong className={styles.amountText}>৳ {formatAmount(trx.amount)}</strong>
                    </td>
                    <td>{trx.method}</td>
                    <td>
                      <span className={styles.badgeSuccess}>{trx.status}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                    এখনো কোনো অনুদানের রেকর্ড নেই। আপনার প্রথম অনুদান দিন!
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
