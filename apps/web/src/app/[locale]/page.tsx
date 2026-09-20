'use client';

import React, { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
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
  BookOpen,
  UserCheck,
  FileText,
  BadgeCheck,
} from 'lucide-react';
import { getApiUrl } from '../../lib/api-config';

export default function HomePage() {
  const t = useTranslations('Common');
  const tHero = useTranslations('Hero');
  const tLedger = useTranslations('Ledger');
  const tPost = useTranslations('StudentPost');
  const tHow = useTranslations('HowItWorks');
  const locale = useLocale();

  // Quick donation widget state
  const [quickAmount, setQuickAmount] = useState<number>(500);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [donationCategory, setDonationCategory] = useState<'direct' | 'general'>('general');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const formatNumber = (num: number) => {
    return locale === 'bn' ? num.toLocaleString('bn-BD') : num.toLocaleString('en-US');
  };

  const [stats, setStats] = useState({
    totalDonated: locale === 'bn' ? '০' : '0',
    totalGeneral: locale === 'bn' ? '০' : '0',
    totalDirect: locale === 'bn' ? '০' : '0',
    generalFundBalance: locale === 'bn' ? '০' : '0',
    directPercent: 0,
    generalPercent: 0,
  });

  const [posts, setPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  React.useEffect(() => {
    const apiUrl = getApiUrl();
    // 1. Fetch live ledger stats
    fetch(`${apiUrl}/donations/ledger-stats`)
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.totalDonated === 'number') {
          const donated = data.totalDonated;
          const random = data.totalRandom;
          const direct = data.totalDirect;
          const poolBalance = data.randomFundPoolBalance;
          const directPct = donated > 0 ? Math.round((direct / donated) * 100) : 0;
          const generalPct = donated > 0 ? 100 - directPct : 0;
          setStats({
            totalDonated: formatNumber(donated),
            totalGeneral: formatNumber(random),
            totalDirect: formatNumber(direct),
            generalFundBalance: formatNumber(poolBalance),
            directPercent: directPct,
            generalPercent: generalPct,
          });
        }
      })
      .catch((err) => console.error('Failed to load ledger stats', err));

    // 2. Fetch live public verified posts
    fetch(`${apiUrl}/posts/public`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const mapped = data.map((p) => {
            const req = Number(p.totalRequiredAmount || 0);
            const rec = Number(p.receivedAmount || 0);
            const pct = req > 0 ? Math.min(100, Math.round((rec / req) * 100)) : 0;
            return {
              id: p.id,
              studentName: p.studentName || 'শিক্ষার্থী',
              avatarLetter: p.studentName ? p.studentName.charAt(0) : 'শ',
              institution: p.orgName || 'অনুমোদিত শিক্ষা প্রতিষ্ঠান',
              title: p.title,
              problemExcerpt: p.problemDescription,
              breakdown: Array.isArray(p.expenses)
                ? p.expenses.map((e: any) => ({
                    label: e.categoryName,
                    amount: formatNumber(Number(e.amount)),
                  }))
                : [],
              requiredAmount: formatNumber(req),
              collectedAmount: formatNumber(rec),
              progressPercent: pct,
              isDoubleVerified: p.isDoubleVerified,
            };
          });
          setPosts(mapped);
        }
      })
      .catch((err) => console.error('Failed to load public posts', err))
      .finally(() => setLoadingPosts(false));
  }, [locale]);

  const filteredPosts = posts;

  const getEffectiveAmount = () => {
    if (customAmount && Number(customAmount) > 0) {
      return Number(customAmount);
    }
    return quickAmount;
  };

  const getImpactDescription = (amt: number) => {
    if (amt <= 300) return tHero('impact200');
    if (amt <= 800) return tHero('impact500');
    if (amt <= 1500) return tHero('impact1000');
    if (amt <= 3500) return tHero('impact2500');
    return tHero('impact5000');
  };

  const currentImpact = getImpactDescription(getEffectiveAmount());

  return (
    <div className={styles.homeContainer}>
      {/* ----------------------------------------------------
          1. HERO SECTION
      ---------------------------------------------------- */}
      <section className={styles.heroSection}>
        <div className={`container ${styles.heroContainer}`}>
          {/* Left Column: Mission, Headlines & Trust Markers */}
          <div className={styles.heroLeft}>
            <div className={styles.badgePill}>
              <span className={styles.pulseDot} />
              <Sparkles size={16} />
              <span>{tHero('badge')}</span>
            </div>

            <h1 className={styles.heroTitle}>
              {tHero('titlePrefix')}{' '}
              <span className={styles.highlightText}>
                {tHero('titleHighlight')}
              </span>
            </h1>

            <p className={styles.heroSubtitle}>{tHero('description')}</p>

            <div className={styles.ctaGroup}>
              <Link href="/posts" className={styles.primaryCta}>
                <GraduationCap size={20} />
                <span>{t('explorePosts')}</span>
                <ArrowRight size={18} />
              </Link>
              <Link href="/donate" className={styles.secondaryCta}>
                <Heart size={18} />
                <span>{t('generalDonate')}</span>
              </Link>
            </div>

            {/* Quick Micro-Metrics & Trust Guarantee */}
            <div className={styles.heroTrustBar}>
              <div className={styles.trustItem}>
                <div className={styles.trustItemIcon}>
                  <CheckCircle2 size={18} />
                </div>
                <div className={styles.trustTextGroup}>
                  <span className={styles.trustHighlight}>১০০%</span>
                  <span className={styles.trustSub}>{t('directAid')}</span>
                </div>
              </div>

              <div className={styles.trustItem}>
                <div className={styles.trustItemIcon}>
                  <ShieldCheck size={18} />
                </div>
                <div className={styles.trustTextGroup}>
                  <span className={styles.trustHighlight}>০%</span>
                  <span className={styles.trustSub}>{t('zeroFee')}</span>
                </div>
              </div>

              <div className={styles.trustItem}>
                <div className={styles.trustItemIcon}>
                  <Users size={18} />
                </div>
                <div className={styles.trustTextGroup}>
                  <span className={styles.trustHighlight}>২৮+</span>
                  <span className={styles.trustSub}>{t('studentsHelpedCount')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Giving Widget */}
          <div className={styles.heroRight}>
            <div className={styles.givingWidget}>
              <div className={styles.widgetHeader}>
                <div className={styles.liveIndicator}>
                  <span className={styles.pulseDot} />
                  <span>রিয়েলটাইম ফান্ড</span>
                </div>
                <div className={styles.balancePill}>
                  ব্যালেন্স: ৳ {stats.generalFundBalance}
                </div>
              </div>

              <h3 className={styles.widgetTitle}>{tHero('widgetTitle')}</h3>
              <p className={styles.widgetDesc}>{tHero('widgetDesc')}</p>

              {/* Category Selector */}
              <div className={styles.categorySelector}>
                <button
                  type="button"
                  onClick={() => setDonationCategory('general')}
                  className={`${styles.categoryTab} ${
                    donationCategory === 'general' ? styles.categoryTabActive : ''
                  }`}
                >
                  {tHero('tabGeneral')}
                </button>
                <button
                  type="button"
                  onClick={() => setDonationCategory('direct')}
                  className={`${styles.categoryTab} ${
                    donationCategory === 'direct' ? styles.categoryTabActive : ''
                  }`}
                >
                  {tHero('tabDirect')}
                </button>
              </div>

              {/* Quick Amount Chips */}
              <div className={styles.amountGrid}>
                {[200, 500, 1000, 2500].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      setQuickAmount(amt);
                      setCustomAmount('');
                    }}
                    className={`${styles.amountChip} ${
                      !customAmount && quickAmount === amt
                        ? styles.amountChipActive
                        : ''
                    }`}
                  >
                    ৳{amt}
                  </button>
                ))}
              </div>

              {/* Custom Amount Input */}
              <div className={styles.customInputWrapper}>
                <span className={styles.currencySymbol}>৳</span>
                <input
                  type="number"
                  placeholder={tHero('otherAmountPlaceholder')}
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className={styles.customInput}
                />
              </div>

              {/* Dynamic Impact Projection */}
              <div className={styles.impactBox}>
                <Sparkles size={18} className={styles.impactIcon} />
                <div className={styles.impactContent}>
                  <span className={styles.impactTitle}>{tHero('impactLabel')}</span>
                  <span className={styles.impactText}>{currentImpact}</span>
                </div>
              </div>

              {/* Action Button */}
              <Link
                href={{
                  pathname: '/donate',
                  query: {
                    amount: getEffectiveAmount(),
                    type: donationCategory,
                  },
                }}
                className={styles.widgetSubmitBtn}
              >
                <Heart size={20} />
                <span>
                  {tHero('donateAction', {
                    amount: getEffectiveAmount().toLocaleString(),
                  })}
                </span>
              </Link>

              <div className={styles.widgetTrustNote}>
                <ShieldCheck size={14} />
                <span>{tHero('securePaymentNotice')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
          2. PUBLIC TRANSPARENCY LEDGER CARD
      ---------------------------------------------------- */}
      <section className={`container ${styles.ledgerSection}`}>
        <div className={styles.ledgerCard}>
          <div className={styles.ledgerHeader}>
            <div className={styles.ledgerHeaderLeft}>
              <div className={styles.ledgerBadge}>
                <TrendingUp size={16} />
                <span>উন্মুক্ত হিসাব ও ১০০% স্বচ্ছতা</span>
              </div>
              <h2 className={styles.ledgerTitle}>{tLedger('title')}</h2>
              <p className={styles.ledgerSubtitle}>{tLedger('subtitle')}</p>
            </div>
            <Link href="/ledger" className={styles.ledgerLink}>
              <span>{t('fullLedger')}</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <div className={styles.statItemTop}>
                <span className={styles.statLabel}>{tLedger('totalDonated')}</span>
                <div className={`${styles.statIconSquare} ${styles.statIconPrimary}`}>
                  <Heart size={20} />
                </div>
              </div>
              <div className={styles.statValue}>৳ {stats.totalDonated}</div>
              <div className={styles.statSub}>সর্বমোট প্রাপ্ত সহায়তা</div>
            </div>

            <div className={styles.statItem}>
              <div className={styles.statItemTop}>
                <span className={styles.statLabel}>{tLedger('totalRandom')}</span>
                <div className={`${styles.statIconSquare} ${styles.statIconAccent}`}>
                  <Sparkles size={20} />
                </div>
              </div>
              <div className={styles.statValue}>৳ {stats.totalGeneral}</div>
              <div className={styles.statSub}>কেন্দ্রীয় জরুরি ফান্ড পুল</div>
            </div>

            <div className={styles.statItem}>
              <div className={styles.statItemTop}>
                <span className={styles.statLabel}>{tLedger('totalDirect')}</span>
                <div className={`${styles.statIconSquare} ${styles.statIconSecondary}`}>
                  <Users size={20} />
                </div>
              </div>
              <div className={styles.statValue}>৳ {stats.totalDirect}</div>
              <div className={styles.statSub}>সরাসরি নির্বাচিত ছাত্রে বিতরণ</div>
            </div>

            <div className={styles.statItem}>
              <div className={styles.statItemTop}>
                <span className={styles.statLabel}>{tLedger('generalFundBalance')}</span>
                <div className={`${styles.statIconSquare} ${styles.statIconDark}`}>
                  <ShieldCheck size={20} />
                </div>
              </div>
              <div className={styles.statValue}>৳ {stats.generalFundBalance}</div>
              <div className={styles.statSub}>জরুরি সহায়তার জন্য সংরক্ষিত</div>
            </div>
          </div>

          {/* Real-time Allocation Ratio Bar */}
          <div className={styles.ratioContainer}>
            <div className={styles.ratioHeader}>
              <span className={styles.ratioTitle}>{tLedger('ratioTitle')}</span>
              <div className={styles.ratioLegend}>
                <span className={styles.legendDirect}>
                  <span className={styles.legendDotDirect} />
                  {tLedger('directPercentLabel', { percent: stats.directPercent })}
                </span>
                <span className={styles.legendGeneral}>
                  <span className={styles.legendDotGeneral} />
                  {tLedger('generalPercentLabel', { percent: stats.generalPercent })}
                </span>
              </div>
            </div>
            <div className={styles.splitBar}>
              <div
                className={styles.splitDirect}
                style={{ width: `${stats.directPercent}%` }}
              />
              <div
                className={styles.splitGeneral}
                style={{ width: `${stats.generalPercent}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
          3. VERIFIED CAMPAIGNS (Student Posts)
      ---------------------------------------------------- */}
      <section className={`container ${styles.campaignsSection}`}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionHeaderLeft}>
            <div className={styles.sectionTag}>
              <BadgeCheck size={16} />
              <span>যাচাইকৃত আবেদনসমূহ</span>
            </div>
            <h2 className={styles.sectionTitle}>সহায়তাপ্রার্থী শিক্ষার্থীদের বর্তমান পোস্ট</h2>
            <p className={styles.sectionDesc}>
              প্রতিটি আবেদন সংশ্লিষ্ট শিক্ষা প্রতিষ্ঠান ও দায়িত্বপ্রাপ্ত শিক্ষক দ্বারা সরাসরি সত্যায়িত।
            </p>
          </div>
          <Link href="/posts" className={styles.secondaryCta}>
            <span>{t('viewAll')}</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* Category Filters */}
        <div className={styles.categoryFilterRow}>
          {[
            { id: 'all', label: tPost('categoryAll') },
            { id: 'university', label: tPost('categoryUniversity') },
            { id: 'college', label: tPost('categoryCollege') },
            { id: 'madrasa', label: tPost('categoryMadrasa') },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`${styles.filterBtn} ${
                activeCategory === cat.id ? styles.filterBtnActive : ''
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Campaign Cards Grid or Clean Empty State */}
        {loadingPosts ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            লোড হচ্ছে...
          </div>
        ) : filteredPosts.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '3.5rem 1.5rem',
              backgroundColor: 'var(--surface)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--surface-border)',
              maxWidth: '680px',
              margin: '0 auto',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'rgba(5, 150, 105, 0.1)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
              }}
            >
              <GraduationCap size={32} />
            </div>
            <h3
              style={{
                fontSize: '1.25rem',
                fontWeight: '800',
                color: 'var(--text-main)',
                marginBottom: '0.5rem',
              }}
            >
              বর্তমানে কোনো সক্রিয় আবেদন নেই
            </h3>
            <p
              style={{
                color: 'var(--text-muted)',
                fontSize: '0.925rem',
                lineHeight: '1.6',
                marginBottom: '1.5rem',
              }}
            >
              শিক্ষা প্রতিষ্ঠান ও সুপার এডমিন কর্তৃক নতুন শিক্ষার্থীদের আবেদন যাচাই শেষ হলে এখানে সরাসরি উন্মুক্ত হবে।
            </p>
            <Link
              href="/donate"
              className={styles.primaryCta}
              style={{ display: 'inline-flex', padding: '0.75rem 1.5rem', textDecoration: 'none' }}
            >
              <Heart size={18} />
              <span>সাধারণ শিক্ষা তহবিলে দান করুন</span>
            </Link>
          </div>
        ) : (
          <div className={styles.cardsGrid}>
            {filteredPosts.map((post) => (
              <article key={post.id} className={styles.campaignCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.studentAvatarRow}>
                    <div className={styles.studentAvatar}>{post.avatarLetter}</div>
                    <div className={styles.studentMeta}>
                      <span className={styles.studentName}>{post.studentName}</span>
                      <span className={styles.institutionTag}>
                        <Building2 size={13} />
                        {post.institution}
                      </span>
                    </div>
                  </div>
                  {post.isDoubleVerified && (
                    <div className={styles.verifiedPill} title="শিক্ষক ও প্রতিষ্ঠান অনুমোদিত">
                      <ShieldCheck size={13} />
                      <span>{t('verified')}</span>
                    </div>
                  )}
                </div>

                <h3 className={styles.cardTitle}>{post.title}</h3>
                <p className={styles.cardExcerpt}>{post.problemExcerpt}</p>

                {/* Itemized Expenses Breakdown */}
                <div className={styles.breakdownRow}>
                  {post.breakdown.map((item: any, idx: number) => (
                    <span key={idx} className={styles.breakdownChip}>
                      {item.label}: ৳{item.amount}
                    </span>
                  ))}
                </div>

                {/* Progress Section */}
                <div className={styles.progressSection}>
                  <div className={styles.progressHeader}>
                    <span className={styles.collectedAmount}>
                      {tPost('received')}: ৳{post.collectedAmount} ({post.progressPercent}%)
                    </span>
                    <span className={styles.targetAmount}>
                      {tPost('totalRequired')}: ৳{post.requiredAmount}
                    </span>
                  </div>
                  <div className={styles.progressBarContainer}>
                    <div
                      className={styles.progressBarFill}
                      style={{ width: `${Math.min(post.progressPercent, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Card Footer */}
                <div className={styles.cardFooter}>
                  <div className={styles.completedBadge}>
                    <CheckCircle2 size={14} />
                    <span>যাচাইকৃত</span>
                  </div>

                  <Link
                    href={{
                      pathname: '/donate',
                      query: { postId: post.id },
                    }}
                    className={styles.cardDonateBtn}
                  >
                    <Heart size={15} />
                    <span>{tPost('supportNow')}</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ----------------------------------------------------
          4. HOW IT WORKS (Transparency Workflow)
      ---------------------------------------------------- */}
      <section className={`container ${styles.howSection}`}>
        <div className={styles.howHeader}>
          <h2 className={styles.howTitle}>{tHow('title')}</h2>
          <p className={styles.howSubtitle}>{tHow('subtitle')}</p>
        </div>

        <div className={styles.stepsGrid}>
          <div className={styles.stepCard}>
            <div className={styles.stepIconContainer}>
              <FileText size={24} />
            </div>
            <h3 className={styles.stepTitle}>{tHow('step1Title')}</h3>
            <p className={styles.stepDesc}>{tHow('step1Desc')}</p>
          </div>

          <div className={styles.stepCard}>
            <div className={styles.stepIconContainer}>
              <UserCheck size={24} />
            </div>
            <h3 className={styles.stepTitle}>{tHow('step2Title')}</h3>
            <p className={styles.stepDesc}>{tHow('step2Desc')}</p>
          </div>

          <div className={styles.stepCard}>
            <div className={styles.stepIconContainer}>
              <Building2 size={24} />
            </div>
            <h3 className={styles.stepTitle}>{tHow('step3Title')}</h3>
            <p className={styles.stepDesc}>{tHow('step3Desc')}</p>
          </div>

          <div className={styles.stepCard}>
            <div className={styles.stepIconContainer}>
              <Heart size={24} />
            </div>
            <h3 className={styles.stepTitle}>{tHow('step4Title')}</h3>
            <p className={styles.stepDesc}>{tHow('step4Desc')}</p>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
          5. CTA BANNER
      ---------------------------------------------------- */}
      <section className="container">
        <div className={styles.ctaBanner}>
          <h2 className={styles.ctaBannerTitle}>
            একটি শিক্ষার্থীর ভবিষ্যৎ বদলে দিতে আপনার সামান্য সাদাকাহই যথেষ্ট
          </h2>
          <p className={styles.ctaBannerText}>
            টাকার অভাবে যাতে কোনো মেধাবী শিক্ষার্থীর পড়াশোনা বন্ধ না হয়ে যায়। আজই যেকোনো পরিমাণ সাদাকাহ প্রদান করে শিক্ষার আলো ছড়াতে অংশীদার হোন।
          </p>
          <Link href="/donate" className={styles.ctaBannerBtn}>
            <Heart size={20} />
            <span>এখনই সাধারণ তহবিলে দান করুন</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
