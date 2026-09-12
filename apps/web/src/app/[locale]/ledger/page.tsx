import React from 'react';
import { useTranslations } from 'next-intl';
import styles from './page.module.css';
import {
  BarChart3,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  PieChart,
} from 'lucide-react';

export default function LedgerPage() {
  const t = useTranslations('Ledger');
  const commonT = useTranslations('Common');

  // Simulated live metrics matching transparency ledger engine
  const ledgerData = {
    totalDonated: '১,৪৫,০০০',
    totalRandomPool: '৪৫,০০০',
    totalDirect: '১,০০,০০০',
    allocatedFromRandom: '২৫,০০০',
    remainingGeneralPool: '২০,০০০',
    totalDisbursedToStudents: '১,২৫,০০০',
  };

  const recentTransactions = [
    {
      id: 'trx-1',
      date: '১২ সেপ্টেম্বর, ২০২৬',
      type: 'সরাসরি অনুদান',
      studentName: 'রাকিবুল হাসান',
      institution: 'ঢাকা বিশ্ববিদ্যালয়',
      amount: '৳ ২,০০০',
      method: 'bKash',
      status: 'অনুমোদিত',
    },
    {
      id: 'trx-2',
      date: '১১ সেপ্টেম্বর, ২০২৬',
      type: 'র্যান্ডম ফান্ড অনুদান',
      studentName: 'সাধারণ ফান্ড পুল',
      institution: 'কেন্দ্রীয় ফান্ড',
      amount: '৳ ৫,০০০',
      method: 'Nagad',
      status: 'অনুমোদিত',
    },
    {
      id: 'trx-3',
      date: '১০ সেপ্টেম্বর, ২০২৬',
      type: 'ফান্ড বণ্টন (সুপার এডমিন)',
      studentName: 'সাদিয়া তাসনিম',
      institution: 'রাজশাহী কলেজ',
      amount: '৳ ৩,২০০',
      method: 'সুপার এডমিন বণ্টন',
      status: 'বিতরিত',
    },
  ];

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
            ৳ {ledgerData.totalDonated}
          </div>
          <span className={styles.statSub}>সর্বমোট সংগৃহীত সাদাকাহ</span>
        </div>

        <div className={styles.statCard}>
          <div className={styles.cardTop}>
            <span className={styles.statTitle}>{t('totalDirect')}</span>
            <CheckCircle2 size={20} className={styles.iconBlue} />
          </div>
          <div className={styles.statNumber}>
            ৳ {ledgerData.totalDirect}
          </div>
          <span className={styles.statSub}>শিক্ষার্থীদের নির্দিষ্ট অনুদান</span>
        </div>

        <div className={styles.statCard}>
          <div className={styles.cardTop}>
            <span className={styles.statTitle}>{t('totalRandom')}</span>
            <PieChart size={20} className={styles.iconAmber} />
          </div>
          <div className={styles.statNumber}>
            ৳ {ledgerData.totalRandomPool}
          </div>
          <span className={styles.statSub}>সাধারণ ফান্ড পুল অনুদান</span>
        </div>

        <div className={styles.statCard}>
          <div className={styles.cardTop}>
            <span className={styles.statTitle}>{t('allocatedToStudents')}</span>
            <ShieldCheck size={20} className={styles.iconGreen} />
          </div>
          <div className={`${styles.statNumber} ${styles.iconGreen}`}>
            ৳ {ledgerData.totalDisbursedToStudents}
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
              {recentTransactions.map((trx) => (
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
                    <strong className={styles.amountText}>{trx.amount}</strong>
                  </td>
                  <td>{trx.method}</td>
                  <td>
                    <span className={styles.badgeSuccess}>{trx.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
