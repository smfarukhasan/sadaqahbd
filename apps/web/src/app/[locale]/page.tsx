'use client';

import React, { useState } from 'react';
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
  ArrowRight,
  CheckCircle2,
  Building2,
  Clock,
  Layers,
  Search,
} from 'lucide-react';

export default function HomePage() {
  const t = useTranslations('Common');
  const ledgerT = useTranslations('Ledger');
  const postT = useTranslations('StudentPost');

  // Quick donation state
  const [quickAmount, setQuickAmount] = useState<number>(500);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Simulated live transparency data
  const stats = {
    totalDonated: '১,৪৫,০০০',
    totalRandom: '৪৫,০০০',
    totalDirect: '১,০০,০০০',
    generalFundBalance: '২০,০০০',
    studentsHelped: '২৮',
    activeCampaigns: '১২',
    directPercent: 69,
    randomPercent: 31,
  };

  const samplePosts = [
    {
      id: 'post-1',
      studentName: 'রাকিবুল হাসান',
      institution: 'ঢাকা বিশ্ববিদ্যালয় (রসায়ন বিভাগ)',
      category: 'university',
      title: 'সেমিস্টার ফি ও মেস খরচের জন্য জরুরি সহায়তা প্রয়োজন',
      problemExcerpt:
        'বাবার অসুস্থতার কারণে পরিবারের উপার্জন বন্ধ। চলতি সেমিস্টার ফি জমা না দিলে পরীক্ষায় বসা অনিশ্চিত।',
      breakdown: [
        { label: 'সেমিস্টার ফি', amount: '৫,০০০' },
        { label: 'মেস খরচ', amount: '৩,৫০০' },
      ],
      requiredAmount: '৮,৫০০',
      collectedAmount: '৫,০০০',
      remainingAmount: '৩,৫০০',
      progressPercent: 58,
      isDoubleVerified: true,
      urgent: true,
      daysLeft: 5,
    },
    {
      id: 'post-2',
      studentName: 'সাদিয়া তাসনিম',
      institution: 'রাজশাহী কলেজ (অর্থনীতি)',
      category: 'college',
      title: 'অনার্স ফাইনাল পরীক্ষার বই ও চিকিৎসা ব্যয়ের জন্য অনুদান',
      problemExcerpt:
        'পড়াশোনার পাশাপাশি টিউশনি করতাম, বর্তমানে টাইফয়েড আক্রান্ত হওয়ায় টিউশনি ও পড়াশোনা বাধাগ্রস্ত।',
      breakdown: [
        { label: 'চিকিৎসা ওষুধ', amount: '৩,২০০' },
        { label: 'পরীক্ষার ফরম পূরণ', amount: '৩,০০০' },
      ],
      requiredAmount: '৬,২০০',
      collectedAmount: '৬,২০০',
      remainingAmount: '০',
      progressPercent: 100,
      isDoubleVerified: true,
      urgent: false,
      daysLeft: 0,
    },
    {
      id: 'post-3',
      studentName: 'আব্দুল্লাহ আল মামুন',
      institution: 'দারুন্নাজাত সিদ্দিকিয়া কামিল মাদ্রাসা',
      category: 'madrasa',
      title: 'দাওরায়ে হাদিস পরীক্ষার কিতাব ও মেস খরচের আবেদন',
      problemExcerpt:
        'এতিম শিক্ষার্থী, কিতাবপত্র ক্রয় ও মেসের মাসিক খাবারের ফি বাবদ সাহায্য একান্ত কাম্য।',
      breakdown: [
        { label: 'কিতাবপত্র', amount: '৪,০০০' },
        { label: 'মেস খাবার খরচ', amount: '৬,০০০' },
      ],
      requiredAmount: '১০,০০০',
      collectedAmount: '৪,২০০',
      remainingAmount: '৫,৮০০',
      progressPercent: 42,
      isDoubleVerified: true,
      urgent: true,
      daysLeft: 8,
    },
    {
      id: 'post-4',
      studentName: 'তাসলিমা আক্তার',
      institution: 'চট্টগ্রাম পলিটেকনিক ইনস্টিটিউট',
      category: 'university',
      title: 'কম্পিউটার ল্যাব প্রজেক্ট ফি ও হোস্টেল চার্জ',
      problemExcerpt:
        '৬ষ্ঠ পর্বের ফাইনাল প্রজেক্টের হার্ডওয়্যার উপাদান ও হোস্টেলের ২ মাসের বকেয়া পরিশোধ প্রয়োজন।',
      breakdown: [
        { label: 'প্রজেক্ট কম্পোনেন্ট', amount: '৪,৫০০' },
        { label: 'হোস্টেল বকেয়া', amount: '৩,০০০' },
      ],
      requiredAmount: '৭,৫০০',
      collectedAmount: '৩,০০০',
      remainingAmount: '৪,৫০০',
      progressPercent: 40,
      isDoubleVerified: true,
      urgent: false,
      daysLeft: 12,
    },
  ];

  const filteredPosts =
    activeCategory === 'all'
      ? samplePosts
      : samplePosts.filter((p) => p.category === activeCategory);

  const getEffectiveDonationAmount = () => {
    if (customAmount && Number(customAmount) > 0) {
      return Number(customAmount);
    }
    return quickAmount;
  };

  return (
    <div className={styles.homeContainer}>
      {/* ----------------------------------------------------
          1. HERO SECTION (Device-Adaptive: 2-Col Desktop / Rich Mobile)
      ---------------------------------------------------- */}
      <section className={styles.heroSection}>
        <div className={`container ${styles.heroContainer}`}>
          {/* Left Column: Mission, Headlines & Trust Markers */}
          <div className={styles.heroLeft}>
            <div className={styles.badgePill}>
              <Sparkles size={15} className={styles.sparkleIcon} />
              <span>১০০% বিশ্বস্ত ও শিক্ষক-প্রতিষ্ঠান ডাবল-ভেরিফাইড</span>
            </div>

            <h1 className={styles.heroTitle}>
              অসহায় শিক্ষার্থীর উচ্চশিক্ষা নিশ্চিত হোক{' '}
              <span className={styles.highlightText}>
                আপনার পবিত্র সাদাকাহে
              </span>
            </h1>

            <p className={styles.heroSubtitle}>
              সরাসরি শিক্ষক ও প্রতিষ্ঠান দ্বারা যাচাইকৃত শিক্ষার্থীদের পড়াশোনা,
              টিউশন ও মেস খরচে সরাসরি অনুদান দিন। প্রতিটি টাকার হিসাব সম্পূর্ণ
              উন্মুক্ত লেজারে দৃশ্যমান।
            </p>

            <div className={styles.ctaGroup}>
              <Link href="/posts" className={styles.primaryCta}>
                <GraduationCap size={20} />
                <span>{t('explorePosts')}</span>
                <ArrowRight size={18} />
              </Link>
              <Link href="/donate" className={styles.secondaryCta}>
                <Heart size={20} className={styles.heartPulse} />
                <span>{t('randomDonate')}</span>
              </Link>
            </div>

            {/* Micro Trust Indicators */}
            <div className={styles.trustGrid}>
              <div className={styles.trustItem}>
                <CheckCircle2 size={18} className={styles.trustIcon} />
                <div>
                  <span className={styles.trustValue}>১০০%</span>
                  <span className={styles.trustLabel}>সরাসরি ছাত্রপ্রাপ্তি</span>
                </div>
              </div>
              <div className={styles.trustItem}>
                <ShieldCheck size={18} className={styles.trustIcon} />
                <div>
                  <span className={styles.trustValue}>০%</span>
                  <span className={styles.trustLabel}>প্ল্যাটফর্ম ফি</span>
                </div>
              </div>
              <div className={styles.trustItem}>
                <Users size={18} className={styles.trustIcon} />
                <div>
                  <span className={styles.trustValue}>২৮+</span>
                  <span className={styles.trustLabel}>সহায়তাপ্রাপ্ত শিক্ষার্থী</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (Desktop & Tablet): Interactive Live Quick Donation Card */}
          <div className={`${styles.heroRight} desktop-only`}>
            <div className={styles.quickDonateCard}>
              <div className={styles.cardGlow} />

              <div className={styles.quickDonateHeader}>
                <div className={styles.headerLeft}>
                  <div className={styles.livePulseDot} />
                  <span className={styles.quickDonateTag}>রিয়েলটাইম ফান্ড</span>
                </div>
                <span className={styles.ledgerShortcut}>
                  ব্যালেন্স: ৳{stats.generalFundBalance}
                </span>
              </div>

              <h3 className={styles.quickDonateTitle}>
                তাত্ক্ষণিক সাধারণ দান (General Fund)
              </h3>
              <p className={styles.quickDonateDesc}>
                আপনার দেওয়া অনুদান স্বয়ংক্রিয়ভাবে সবচেয়ে জরুরি ও পিছিয়ে থাকা
                শিক্ষার্থীদের ফি পরিশোধে যুক্ত হবে।
              </p>

              {/* Amount Preset Buttons */}
              <div className={styles.presetGrid}>
                {[100, 500, 1000, 2000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      setQuickAmount(amt);
                      setCustomAmount('');
                    }}
                    className={`${styles.presetBtn} ${
                      quickAmount === amt && !customAmount
                        ? styles.presetBtnActive
                        : ''
                    }`}
                  >
                    ৳{amt}
                  </button>
                ))}
              </div>

              {/* Custom Amount Input */}
              <div className={styles.customInputWrapper}>
                <span className={styles.currencyPrefix}>৳</span>
                <input
                  type="number"
                  placeholder="অন্য পরিমাণ লিখুন (যেমন: ২৫০০)"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                  }}
                  className={styles.customInput}
                />
              </div>

              <Link
                href={`/donate?amount=${getEffectiveDonationAmount()}`}
                className={styles.quickDonateAction}
              >
                <Heart size={18} />
                <span>৳{getEffectiveDonationAmount()} সাদাকাহ প্রদান করুন</span>
              </Link>

              <div className={styles.quickDonateFooter}>
                <ShieldCheck size={14} />
                <span>নিরাপদ পেমেন্ট গেটওয়ে ও তাত্ক্ষণিক রসিদ</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
          2. LIVE TRANSPARENCY LEDGER (Visual Gauge & Counters)
      ---------------------------------------------------- */}
      <section className={styles.ledgerSection}>
        <div className="container">
          <div className={styles.ledgerCard}>
            <div className={styles.ledgerHeaderRow}>
              <div>
                <div className={styles.sectionBadge}>
                  <TrendingUp size={16} />
                  <span>উন্মুক্ত হিসাব ও স্বচ্ছতা</span>
                </div>
                <h2 className={styles.ledgerMainTitle}>{ledgerT('title')}</h2>
              </div>
              <Link href="/ledger" className={styles.viewLedgerLink}>
                <span>সম্পূর্ণ অডিট লেজার</span>
                <ArrowRight size={16} />
              </Link>
            </div>

            {/* 4 Stat Cards */}
            <div className={styles.statsGrid}>
              <div className={`${styles.statTile} ${styles.statTileTeal}`}>
                <div className={styles.statIconBadge}>
                  <TrendingUp size={22} />
                </div>
                <span className={styles.statLabel}>{ledgerT('totalDonated')}</span>
                <span className={styles.statValue}>৳ {stats.totalDonated}</span>
                <span className={styles.statSub}>সর্বমোট প্রাপ্ত সাহায্য</span>
              </div>

              <div className={`${styles.statTile} ${styles.statTileBlue}`}>
                <div className={styles.statIconBadge}>
                  <Sparkles size={22} />
                </div>
                <span className={styles.statLabel}>{ledgerT('totalRandom')}</span>
                <span className={styles.statValue}>৳ {stats.totalRandom}</span>
                <span className={styles.statSub}>র্যান্ডম পুল থেকে বণ্টন</span>
              </div>

              <div className={`${styles.statTile} ${styles.statTileIndigo}`}>
                <div className={styles.statIconBadge}>
                  <Users size={22} />
                </div>
                <span className={styles.statLabel}>{ledgerT('totalDirect')}</span>
                <span className={styles.statValue}>৳ {stats.totalDirect}</span>
                <span className={styles.statSub}>সরাসরি নির্বাচিত ছাত্রে</span>
              </div>

              <div className={`${styles.statTile} ${styles.statTileAmber}`}>
                <div className={styles.statIconBadge}>
                  <ShieldCheck size={22} />
                </div>
                <span className={styles.statLabel}>
                  {ledgerT('generalFundBalance')}
                </span>
                <span className={styles.statValue}>
                  ৳ {stats.generalFundBalance}
                </span>
                <span className={styles.statSub}>জরুরি সহায়তার জন্য সংরক্ষিত</span>
              </div>
            </div>

            {/* Dual Distribution Visual Gauge Bar */}
            <div className={styles.distributionBox}>
              <div className={styles.distributionHeader}>
                <span className={styles.distributionTitle}>
                  অনুদানের বণ্টন অনুপাত (Distribution Ratio)
                </span>
                <div className={styles.distributionLegend}>
                  <span className={styles.legendDirect}>
                    ● সরাসরি দান ({stats.directPercent}%)
                  </span>
                  <span className={styles.legendRandom}>
                    ● সাধারণ র্যান্ডম ফান্ড ({stats.randomPercent}%)
                  </span>
                </div>
              </div>

              <div className={styles.dualProgressBar}>
                <div
                  className={styles.directFill}
                  style={{ width: `${stats.directPercent}%` }}
                  title={`সরাসরি দান ${stats.directPercent}%`}
                />
                <div
                  className={styles.randomFill}
                  style={{ width: `${stats.randomPercent}%` }}
                  title={`র্যান্ডম দান ${stats.randomPercent}%`}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
          3. VERIFIED STUDENT AID REQUESTS (Filterable Cards)
      ---------------------------------------------------- */}
      <section className={styles.postsSection}>
        <div className="container">
          <div className={styles.sectionTopBar}>
            <div>
              <div className={styles.sectionBadge}>
                <GraduationCap size={16} />
                <span>যাচাইকৃত আবেদনসমূহ</span>
              </div>
              <h2 className={styles.sectionTitle}>
                সহায়তাপ্রার্থী শিক্ষার্থীদের বর্তমান পোস্ট
              </h2>
              <p className={styles.sectionSubtitle}>
                প্রতিটি আবেদন সংশ্লিষ্ট শিক্ষা প্রতিষ্ঠান ও দায়িত্বপ্রাপ্ত শিক্ষক
                দ্বারা সত্যতা নিশ্চিতকৃত।
              </p>
            </div>

            <Link href="/posts" className={styles.seeAllBtn}>
              <span>সকল আবেদন দেখুন</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Filter Tabs */}
          <div className={styles.filterPillBar}>
            <button
              onClick={() => setActiveCategory('all')}
              className={`${styles.filterPill} ${
                activeCategory === 'all' ? styles.filterPillActive : ''
              }`}
            >
              সকল আবেদন ({samplePosts.length})
            </button>
            <button
              onClick={() => setActiveCategory('university')}
              className={`${styles.filterPill} ${
                activeCategory === 'university' ? styles.filterPillActive : ''
              }`}
            >
              বিশ্ববিদ্যালয়
            </button>
            <button
              onClick={() => setActiveCategory('college')}
              className={`${styles.filterPill} ${
                activeCategory === 'college' ? styles.filterPillActive : ''
              }`}
            >
              কলেজ
            </button>
            <button
              onClick={() => setActiveCategory('madrasa')}
              className={`${styles.filterPill} ${
                activeCategory === 'madrasa' ? styles.filterPillActive : ''
              }`}
            >
              মাদ্রাসা
            </button>
          </div>

          {/* Posts Grid */}
          <div className={styles.postsGrid}>
            {filteredPosts.map((post) => (
              <div key={post.id} className={styles.postCard}>
                {/* Header: Student Info & Badges */}
                <div className={styles.postCardHeader}>
                  <div className={styles.studentAvatar}>
                    {post.studentName.charAt(0)}
                  </div>
                  <div className={styles.studentMeta}>
                    <div className={styles.studentNameRow}>
                      <span className={styles.studentName}>
                        {post.studentName}
                      </span>
                      {post.isDoubleVerified && (
                        <span
                          className={styles.verifiedTag}
                          title="শিক্ষক ও প্রতিষ্ঠান প্রধান দ্বারা ভেরিফাইড"
                        >
                          <ShieldCheck size={13} />
                          <span>ভেরিফাইড</span>
                        </span>
                      )}
                    </div>
                    <span className={styles.institutionName}>
                      <Building2 size={13} />
                      <span>{post.institution}</span>
                    </span>
                  </div>
                </div>

                {/* Post Title & Excerpt */}
                <h3 className={styles.postCardTitle}>{post.title}</h3>
                <p className={styles.postExcerpt}>{post.problemExcerpt}</p>

                {/* Expense Breakdown Tags */}
                <div className={styles.breakdownList}>
                  {post.breakdown.map((item, idx) => (
                    <span key={idx} className={styles.breakdownTag}>
                      {item.label}: <strong>৳{item.amount}</strong>
                    </span>
                  ))}
                </div>

                {/* Progress Bar & Amount Breakdown */}
                <div className={styles.progressBlock}>
                  <div className={styles.progressBarWrapper}>
                    <div
                      className={styles.progressBarFill}
                      style={{ width: `${Math.min(post.progressPercent, 100)}%` }}
                    />
                  </div>
                  <div className={styles.amountDetailsRow}>
                    <div>
                      <span className={styles.amountLabel}>সংগৃহীত: </span>
                      <span className={styles.amountValueCollected}>
                        ৳{post.collectedAmount}
                      </span>
                    </div>
                    <div className={styles.percentBadge}>
                      {post.progressPercent}%
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className={styles.amountLabel}>বাকি: </span>
                      <span className={styles.amountValueRemaining}>
                        ৳{post.remainingAmount}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className={styles.postActions}>
                  <Link
                    href={`/posts/${post.id}`}
                    className={styles.btnDetails}
                  >
                    বিবরণ দেখুন
                  </Link>
                  <Link
                    href={`/donate?postId=${post.id}`}
                    className={styles.btnDonate}
                  >
                    <Heart size={16} />
                    <span>সহায়তা দিন</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
          4. WHY SADAQAHBD / 3 PILLARS OF TRUST
      ---------------------------------------------------- */}
      <section className={styles.pillarsSection}>
        <div className="container">
          <div className={styles.pillarsHeader}>
            <div className={styles.sectionBadge}>
              <ShieldCheck size={16} />
              <span>নিরাপত্তা ও বিশ্বাসযোগ্যতা</span>
            </div>
            <h2 className={styles.pillarsTitle}>
              কেন সাদাকাহ বিডি শতভাগ বিশ্বস্ত ও স্বচ্ছ?
            </h2>
            <p className={styles.pillarsSubtitle}>
              প্রথাগত অনুদানের অনিশ্চয়তা দূর করে আধুনিক প্রযুক্তি ও জবাবদিহিতার
              সমন্বয়।
            </p>
          </div>

          <div className={styles.pillarsGrid}>
            <div className={styles.pillarCard}>
              <div className={styles.pillarIconCircle}>
                <ShieldCheck size={28} />
              </div>
              <h3 className={styles.pillarTitle}>১. দ্বৈত স্তর ভেরিফিকেশন</h3>
              <p className={styles.pillarDesc}>
                কোনো মধ্যস্বত্বভোগী নয়। প্রতিটি শিক্ষার্থীর আবেদন সংশ্লিষ্ট শিক্ষা
                প্রতিষ্ঠানের শিক্ষক ও প্রশাসন দ্বারা সরাসরি যাচাইপূর্বক অনুমোদন
                পেলে তবেই পোস্ট লাইভ হয়।
              </p>
            </div>

            <div className={styles.pillarCard}>
              <div className={styles.pillarIconCircle}>
                <CheckCircle2 size={28} />
              </div>
              <h3 className={styles.pillarTitle}>২. জিরো হিডেন চার্জ (০%)</h3>
              <p className={styles.pillarDesc}>
                আপনার অনুদানের ১০০% অর্থই সরাসরি শিক্ষার্থীর নির্দিষ্ট খরচে
                হস্তান্তরিত হয়। প্ল্যাটফর্ম পরিচালনা বাবদ কোনো প্রকার কমিশন বা
                হিডেন ফি কাটা হয় না।
              </p>
            </div>

            <div className={styles.pillarCard}>
              <div className={styles.pillarIconCircle}>
                <TrendingUp size={28} />
              </div>
              <h3 className={styles.pillarTitle}>৩. উন্মুক্ত রিয়েলটাইম লেজার</h3>
              <p className={styles.pillarDesc}>
                প্রতিটি দানকারী নিজের অনুদানের টাকার অবস্থান ট্র্যাক করতে পারেন।
                কার জন্য কত টাকা এসেছে এবং কখন তা শিক্ষার্থীকে দেওয়া হয়েছে — সবই
                লেজারে স্পষ্ট।
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

