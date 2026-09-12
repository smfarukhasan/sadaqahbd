'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '../../i18n/routing';
import styles from './page.module.css';
import {
  Heart,
  TrendingUp,
  ShieldCheck,
  Users,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

export default function HomePage() {
  const t = useTranslations('Common');
  const ledgerT = useTranslations('Ledger');
  const postT = useTranslations('StudentPost');

  // Simulated live transparency data (will bind to API)
  const stats = {
    totalDonated: '১,৪৫,০০০',
    totalRandom: '৪৫,০০০',
    totalDirect: '১,০০,০০০',
    generalFundBalance: '২০,০০০',
    studentsHelped: '২৮',
  };

  const samplePosts = [
    {
      id: 'post-1',
      studentName: 'রাকিবুল হাসান',
      institution: 'ঢাকা বিশ্ববিদ্যালয়',
      title: 'সেমিস্টার ফি ও মেস খরচের জন্য জরুরি সহায়তা প্রয়োজন',
      requiredAmount: '৮,৫০০',
      collectedAmount: '৫,০০০',
      remainingAmount: '৩,৫০০',
      progressPercent: 58,
      isDoubleVerified: true,
    },
    {
      id: 'post-2',
      studentName: 'সাদিয়া তাসনিম',
      institution: 'রাজশাহী কলেজ',
      title: 'অনার্স ফাইনাল পরীক্ষার বই ও চিকিৎসা ব্যয়ের অনুদান',
      requiredAmount: '৬,২০০',
      collectedAmount: '৬,২০০',
      remainingAmount: '০',
      progressPercent: 100,
      isDoubleVerified: true,
    },
    {
      id: 'post-3',
      studentName: 'আব্দুল্লাহ আল মামুন',
      institution: 'চট্টগ্রাম পলিটেকনিক ইনস্টিটিউট',
      title: 'ব্যবহারিক ক্লাসের ইন্সট্রুমেন্ট ও হোস্টেল খরচের আবেদন',
      requiredAmount: '১০,০০০',
      collectedAmount: '৪,২০০',
      remainingAmount: '৫,৮০০',
      progressPercent: 42,
      isDoubleVerified: false,
    },
  ];

  return (
    <div className={styles.homeContainer}>
      {/* 1. Hero Section */}
      <section className={styles.heroSection}>
        <div className="container">
          <div className={styles.heroContent}>
            <div className={styles.badge}>
              <Sparkles size={16} />
              <span>১০০% বিশ্বস্ত ও ভেরিফাইড প্ল্যাটফর্ম</span>
            </div>
            <h1 className={styles.heroTitle}>{t('siteName')}</h1>
            <p className={styles.heroSubtitle}>{t('siteTagline')}</p>

            <div className={styles.ctaGroup}>
              <Link href="/posts" className={styles.primaryCta}>
                <GraduationCap size={20} />
                <span>{t('explorePosts')}</span>
              </Link>
              <Link href="/donate" className={styles.secondaryCta}>
                <Heart size={20} />
                <span>{t('randomDonate')}</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Live Transparency Ledger Card */}
      <section className={styles.ledgerSection}>
        <div className="container">
          <div className={styles.ledgerCard}>
            <div className={styles.ledgerHeader}>
              <TrendingUp className={styles.ledgerIcon} size={24} />
              <h2>{ledgerT('title')}</h2>
            </div>
            <div className={styles.statsGrid}>
              <div className={styles.statBox}>
                <span className={styles.statLabel}>
                  {ledgerT('totalDonated')}
                </span>
                <span className={`${styles.statValue} ${styles.highlightGreen}`}>
                  ৳ {stats.totalDonated}
                </span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statLabel}>{ledgerT('totalRandom')}</span>
                <span className={styles.statValue}>৳ {stats.totalRandom}</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statLabel}>{ledgerT('totalDirect')}</span>
                <span className={styles.statValue}>৳ {stats.totalDirect}</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statLabel}>
                  {ledgerT('generalFundBalance')}
                </span>
                <span className={`${styles.statValue} ${styles.highlightAmber}`}>
                  ৳ {stats.generalFundBalance}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Verified Student Posts Feed */}
      <section className={styles.postsSection}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <div>
              <h2>{t('explorePosts')}</h2>
              <p>শিক্ষক ও প্রতিষ্ঠান কর্তৃক ডাবল-ভেরিফাইড আবেদনসমূহ</p>
            </div>
            <Link href="/posts" className={styles.viewAllLink}>
              {t('view')} &rarr;
            </Link>
          </div>

          <div className={styles.postsGrid}>
            {samplePosts.map((post) => (
              <div key={post.id} className={styles.postCard}>
                <div className={styles.postTop}>
                  <span className={styles.studentName}>
                    {post.studentName}
                  </span>
                  {post.isDoubleVerified && (
                    <span className={styles.verifiedBadge}>
                      <ShieldCheck size={14} />
                      <span>ভেরিফাইড</span>
                    </span>
                  )}
                </div>
                <div className={styles.institution}>
                  {post.institution}
                </div>

                <h3 className={styles.postTitle}>{post.title}</h3>

                {/* Progress bar */}
                <div className={styles.progressContainer}>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${post.progressPercent}%` }}
                    />
                  </div>
                  <div className={styles.progressDetails}>
                    <span>
                      {postT('received')}: <strong>৳{post.collectedAmount}</strong>
                    </span>
                    <span>
                      {postT('remaining')}: <strong>৳{post.remainingAmount}</strong>
                    </span>
                  </div>
                </div>

                <div className={styles.cardFooter}>
                  <Link
                    href={`/posts/${post.id}`}
                    className={styles.detailsBtn}
                  >
                    {t('view')}
                  </Link>
                  <Link
                    href={`/donate?postId=${post.id}`}
                    className={styles.donateBtn}
                  >
                    <Heart size={16} />
                    <span>{t('donateNow')}</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
