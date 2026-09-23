'use client';

import React, { useState } from 'react';
import Image from 'next/image';
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
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { getApiUrl } from '../../lib/api-config';

interface SahihHadithItem {
  id: string;
  category: 'jariya' | 'barakah' | 'protection' | 'akhirah';
  arabic: string;
  matnBn: string;
  matnEn: string;
  sourceBn: string;
  sourceEn: string;
  sourceUrl: string;
  tagBn: string;
  tagEn: string;
  benefitBn: string;
  benefitEn: string;
}

const SAHIH_HADITHS: SahihHadithItem[] = [
  {
    id: 'hadith-1',
    category: 'jariya',
    arabic: 'إِذَا مَاتَ الإِنْسَانُ انْقَطَعَ عَنْهُ عَمَلُهُ إِلاَّ مِنْ ثَلاَثَةٍ: إِلاَّ مِنْ صَدَقَةٍ جَارِيَةٍ، أَوْ عِلْمٍ يُنْتَفَعُ بِهِ، أَوْ وَلَدٍ صَالِحٍ يَدْعُو لَهُ',
    matnBn: 'মানুষ যখন মৃত্যুবরণ করে তখন তার সমস্ত আমল বন্ধ হয়ে যায়, কেবল তিনটি আমল ছাড়া—সাদাকায়ে জারিয়া (অবিচ্ছিন্ন দান), এমন জ্ঞান যা দ্বারা মানুষ উপকৃত হয়, এবং সৎ সন্তান যে তার জন্য দোয়া করে।',
    matnEn: 'When a human being dies, all their deeds cease except three: a continuing charity (Sadaqah Jariyah), beneficial knowledge, or a righteous child who prays for them.',
    sourceBn: 'সহিহ মুসলিম: ১৬৩১',
    sourceEn: 'Sahih Muslim: 1631',
    sourceUrl: 'https://sunnah.com/muslim:1631',
    tagBn: 'সাদাকায়ে জারিয়া',
    tagEn: 'Perpetual Charity',
    benefitBn: 'মৃত্যুর পরও কবরে নিরবচ্ছিন্ন সাওয়াব পৌঁছায়। একজন দরিদ্র শিক্ষার্থীর পড়াশোনায় সহায়তা হলো জ্ঞান অর্জন ও সাদাকায়ে জারিয়ার অপূর্ব সমন্বয়।',
    benefitEn: 'Continuous reward flows into the grave. Supporting a student fuses both beneficial knowledge and ongoing charity.',
  },
  {
    id: 'hadith-2',
    category: 'barakah',
    arabic: 'مَا نَقَصَتْ صَدَقَةٌ مِنْ مَالٍ، وَمَا زَادَ اللَّهُ عَبْدًا بِعَفْوٍ إِلاَّ عِزًّا، وَمَا تَوَاضَعَ أَحَدٌ لِلَّهِ إِلاَّ رَفَعَهُ اللَّهُ',
    matnBn: 'সাদাকাহ প্রদানে সম্পদে কোনো ঘাটতি হয় না; ক্ষমা প্রদর্শনের মাধ্যমে আল্লাহ বান্দার সম্মান বৃদ্ধি করেন এবং যে ব্যক্তি আল্লাহর জন্য বিনয়ী হয়, আল্লাহ তাকে উচ্চ মর্যাদায় আসীন করেন।',
    matnEn: 'Charity does not decrease wealth, no one forgives another except that Allah increases his honor, and no one humbles himself for the sake of Allah except that Allah elevates him.',
    sourceBn: 'সহিহ মুসলিম: ২৫৮৮',
    sourceEn: 'Sahih Muslim: 2588',
    sourceUrl: 'https://sunnah.com/muslim:2588',
    tagBn: 'সম্পদে বরকত',
    tagEn: 'Barakah in Wealth',
    benefitBn: 'বাহ্যিকভাবে সম্পদ হাতছাড়া হচ্ছে মনে হলেও মহান আল্লাহ তাতে অদৃশ্য বরকত ও প্রাচুর্য দান করেন যা ক্ষতি ও বিপদাপদ থেকে রক্ষা করে।',
    benefitEn: 'What outwardly departs your wealth is replenished by Allah with divine prosperity, protection, and peace.',
  },
  {
    id: 'hadith-3',
    category: 'akhirah',
    arabic: 'سَبْعَةٌ يُظِلُّهُمُ اللَّهُ فِي ظِلِّهِ يَوْمَ لاَ ظِلَّ إِلاَّ ظِلُّهُ... وَرَجُلٌ تَصَدَّقَ بِصَدَقَةٍ فَأَخْفَاهَا حَتَّى لاَ تَعْلَمَ شِمَالُهُ مَا تُنْفِقُ يَمِينُهُ',
    matnBn: 'যেদিন আল্লাহর আরশের ছায়া ছাড়া আর কোনো ছায়া থাকবে না, সেদিন সাত শ্রেণির মানুষ আরশের নিচে ছায়া পাবে... তাদের মধ্যে একজন হলো—যে ব্যক্তি এত গোপনে দান করে যে তার বাম হাতও জানতে পারে না ডান হাত কী খরচ করেছে।',
    matnEn: 'There are seven whom Allah will shade under His shade on the Day when there is no shade except His... among them is a person who gives in charity so secretly that his left hand does not know what his right hand spent.',
    sourceBn: 'সহিহ বুখারি: ১৪২৩, সহিহ মুসলিম: ১০৩১',
    sourceEn: 'Sahih al-Bukhari: 1423, Sahih Muslim: 1031',
    sourceUrl: 'https://sunnah.com/bukhari:1423',
    tagBn: 'আরশের শীতল ছায়া',
    tagEn: 'Divine Throne Shade',
    benefitBn: 'কিয়ামতের অসহনীয় উত্তাপ ও মহাবিপদের দিনে পরম স্বস্তি ও নিরাপত্তা লাভ। ইখলাসের সাথে গোপনে দানকারী আল্লাহর বিশেষ মেহমান হবে।',
    benefitEn: 'Grants shelter from the scorching trials of Judgment Day. Sincere and confidential charity secures eternal divine cover.',
  },
  {
    id: 'hadith-4',
    category: 'protection',
    arabic: 'إِنَّ الصَّدَقَةَ لَتُطْفِئُ غَضَبَ الرَّبِّ وَتَدْفَعُ مِيتَةَ السُّوءِ',
    matnBn: 'নিশ্চয়ই গোপন দান প্রতিপালকের ক্রোধ প্রশমিত করে এবং অপমৃত্যু বা অনিষ্টকর মৃত্যু থেকে রক্ষা করে।',
    matnEn: 'Indeed, secret charity appeases the wrath of the Lord and averts an evil, calamitous death.',
    sourceBn: 'জামে আত-তিরমিজি: ৬৬৪ (হাসান/সহিহ)',
    sourceEn: 'Jami` at-Tirmidhi: 664',
    sourceUrl: 'https://sunnah.com/tirmidhi:664',
    tagBn: 'অপমৃত্যু রোধক',
    tagEn: 'Shield from Calamity',
    benefitBn: 'অসুস্থতা, দুর্ঘটনা ও জীবনের নানা সংকট ও অনিষ্টকর বিপদাপদ থেকে আত্মরক্ষায় সাদাকাহ সবচেয়ে শক্তিশালী আধ্যাত্মিক সুরক্ষা কবচ।',
    benefitEn: 'Charity serves as an impenetrable shield against sudden tragedies, ailments, and devastating misfortunes.',
  },
  {
    id: 'hadith-5',
    category: 'akhirah',
    arabic: 'اتَّقُوا النَّارَ وَلَوْ بِشِقِّ تَمْرَةٍ، فَمَنْ لَمْ يَجِدْ فَبِكَلِمَةٍ طَيِّبَةٍ',
    matnBn: 'তোমরা জাহান্নামের আগুন থেকে নিজেকে বাঁচাও, তা একটি খেজুরের অর্ধেক টুকরো দান করে হলেও। আর যার সে সামর্থ্যও নেই, সে যেন একটি উত্তম মিষ্টি কথার মাধ্যমে আত্মরক্ষা করে।',
    matnEn: 'Guard yourselves against the Fire, even with half a date given in charity; and whoever cannot find even that, then with a kind word.',
    sourceBn: 'সহিহ বুখারি: ১৪১৭, সহিহ মুসলিম: ১০১৬',
    sourceEn: 'Sahih al-Bukhari: 1417, Sahih Muslim: 1016',
    sourceUrl: 'https://sunnah.com/bukhari:1417',
    tagBn: 'জাহান্নাম থেকে মুক্তি',
    tagEn: 'Freedom from Hellfire',
    benefitBn: 'সাদাকাহর পরিমাণ বড় হওয়া জরুরি নয়; নিয়তের সততা থাকলে অতি সামান্য দানও জাহান্নামের শাস্তি থেকে নাজাতের স্থায়ী উসিলা হতে পারে।',
    benefitEn: 'No humble gift is small in the sight of Allah. Even a tiny offering given with pure devotion acts as an enduring shield.',
  },
  {
    id: 'hadith-6',
    category: 'barakah',
    arabic: 'مَا مِنْ يَوْمٍ يُصْبِحُ الْعِبَادُ فِيهِ إِلاَّ مَلَكَانِ يَنْزِلاَنِ فَيَقُولُ أَحَدُهُمَا: اللَّهُمَّ أَعْطِ مُنْفِقًا خَلَفًا، وَيَقُولُ الآخَرُ: اللَّهُمَّ أَعْطِ مُمْسِكًا تَلَفًا',
    matnBn: 'প্রতিদিন সকালে যখন বান্দাগণ জাগ্রত হয়, দুজন ফেরেশতা নেমে আসেন। একজন দোয়া করেন: "হে আল্লাহ! যে দান করে তাকে এর উত্তম প্রতিদান দাও।" আর অপরজন বলেন: "হে আল্লাহ! যে কৃপণতা করে তার সম্পদ বিনষ্ট করে দাও।"',
    matnEn: 'Every morning when servants wake up, two angels descend. One supplicates: "O Allah, give recompense to the one who spends," while the other says: "O Allah, bring destruction upon the one who withholds."',
    sourceBn: 'সহিহ বুখারি: ১৪৪২, সহিহ মুসলিম: ১০১০',
    sourceEn: 'Sahih al-Bukhari: 1442, Sahih Muslim: 1010',
    sourceUrl: 'https://sunnah.com/bukhari:1442',
    tagBn: 'ফেরেশতাদের দোয়া',
    tagEn: 'Angels\' Supplication',
    benefitBn: 'দানকারীর জন্য প্রতিদিন নিষ্পাপ ফেরেশতাগণ সরাসরি বৃদ্ধি ও প্রতিদানের দোয়া করেন, যা কখনো আল্লাহর দরবার থেকে বিমুখ হয় না।',
    benefitEn: 'Donors wake up every dawn embraced by the infallible supplications of angels beseeching divine replenishment.',
  },
  {
    id: 'hadith-7',
    category: 'protection',
    arabic: 'وَالصَّدَقَةُ تُطْفِئُ الْخَطِيئَةَ كَمَا يُطْفِئُ الْمَاءُ النَّارَ',
    matnBn: 'পানি যেমন আগুনকে নিভিয়ে ধ্বংস করে দেয়, তেমনি সাদাকাহ মানুষের গুনাহ বা পাপকে নিভিয়ে বিলীন করে দেয়।',
    matnEn: 'Charity extinguishes sins just as water extinguishes fire.',
    sourceBn: 'জামে আত-তিরমিজি: ৬১৪, সুনান ইবনে মাজাহ: ৪২১০',
    sourceEn: 'Jami` at-Tirmidhi: 614',
    sourceUrl: 'https://sunnah.com/tirmidhi:614',
    tagBn: 'পাপ মোচনকারী',
    tagEn: 'Expiation of Sins',
    benefitBn: 'জীবনের ফেলে আসা ভুলত্রুটি, পাপ ও গোনাহের বোঝা থেকে আত্মাকে পুতপবিত্র ও কলুষমুক্ত করার সেরা প্রতিষেধক সাদাকাহ।',
    benefitEn: 'Sincere charity neutralizes transgressions, lifting spiritual burdens and revitalizing the purity of the heart.',
  },
  {
    id: 'hadith-8',
    category: 'akhirah',
    arabic: 'الطُّهُورُ شَطْرُ الإِيمَانِ، وَالْحَمْدُ لِلَّهِ تَمْلأُ الْمِيزَانَ... وَالصَّدَقَةُ بُرْهَانٌ، وَالصَّبْرُ ضِيَاءٌ',
    matnBn: 'পবিত্রতা ঈমানের অর্ধেক, আলহামদুলিল্লাহ মিজানের পাল্লাকে ভরিয়ে দেয়... আর সাদাকাহ হলো (প্রকৃত ঈমানের) এক সুস্পষ্ট প্রমাণ এবং ধৈর্য হলো এক জ্যোতি।',
    matnEn: 'Purity is half of faith, "Alhamdulillah" fills the scale... and charity is a proof (of authentic faith), and patience is illumination.',
    sourceBn: 'সহিহ মুসলিম: ২২৩',
    sourceEn: 'Sahih Muslim: 223',
    sourceUrl: 'https://sunnah.com/muslim:223',
    tagBn: 'ঈমানের প্রমাণ',
    tagEn: 'Proof of Faith',
    benefitBn: 'মানুষ স্বভাবতই সম্পদকে ভালোবাসে; সেই প্রিয় সম্পদ আল্লাহর সন্তুষ্টিতে অকাতরে দান করাই হলো অন্তরের অকৃত্রিম ঈমানের সবচেয়ে বড় প্রমাণ।',
    benefitEn: 'Wealth is intuitively cherished; willingly parting with it demonstrates unequivocal devotion to the Almighty Creator.',
  },
];

export default function HomePage() {
  const t = useTranslations('Common');
  const tHero = useTranslations('Hero');
  const tLedger = useTranslations('Ledger');
  const tPost = useTranslations('StudentPost');
  const tHow = useTranslations('HowItWorks');
  const tHadith = useTranslations('HadithVirtues');
  const locale = useLocale();
  const isBn = locale === 'bn';

  // Quick donation widget state
  const [quickAmount, setQuickAmount] = useState<number>(500);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [donationCategory, setDonationCategory] = useState<'direct' | 'general'>('general');
  const [hadithCategory, setHadithCategory] = useState<string>('all');

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
            const rem = Number(p.remainingAmount || (req - rec));
            const pct = req > 0 ? Math.min(100, Math.round((rec / req) * 100)) : 0;
            return {
              id: p.id,
              studentName: p.studentName || 'শিক্ষার্থী',
              studentPhotoUrl: p.studentPhotoUrl || null,
              avatarLetter: p.studentName ? p.studentName.charAt(0) : 'শ',
              institution: p.orgName || 'অনুমোদিত শিক্ষা প্রতিষ্ঠান',
              orgAddress: p.orgAddress || null,
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
              remainingAmount: rem,
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
          1. HERO SECTION (Full Background Image with Left Text)
      ---------------------------------------------------- */}
      <section className={styles.heroSection}>
        {/* Full-bleed Hero Background Image & Atmospheric Overlays */}
        <div className={styles.heroBgWrapper}>
          <Image
            src="/images/Boys_studying.jpeg"
            alt={locale === 'bn' ? 'সাদাকাহ বিডি - শিক্ষার্থীদের শিক্ষা ও মানবিক সহায়তা' : 'Sadaqah BD - Student Education & Aid'}
            fill
            priority
            quality={90}
            className={styles.heroBgImage}
            sizes="100vw"
          />
          <div className={styles.heroOverlayGradient} />
          <div className={styles.heroBottomFade} />
        </div>

        <div className={`container ${styles.heroContainer}`}>
          {/* Content Column: Mission, Headlines & Trust Markers directly over the background */}
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
        </div>
      </section>

      {/* ----------------------------------------------------
          2. INSTANT GIVING & PUBLIC TRANSPARENCY LEDGER
      ---------------------------------------------------- */}
      <section className={`container ${styles.actionLedgerSection}`}>
        {/* Left Column: Instant Giving (General Fund) Widget */}
        <div className={styles.givingWidgetWrapper}>
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

        {/* Right Column: Public Transparency Ledger Card */}
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

          <div className={styles.statsGrid2x2}>
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
          3. HOW IT WORKS (Transparency Workflow)
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
          4. VERIFIED CAMPAIGNS (Student Posts)
      ---------------------------------------------------- */}
      <section className={styles.campaignsParallaxSection}>
        <div className={`container ${styles.campaignsSection}`}>
          {/* Frosted Glass Header Box with Soft Blur */}
          <div className={styles.sectionHeaderCard}>
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
                {/* Header: Photo beside Name, Institution Name, and Institution Address */}
                <div className={styles.cardHeader}>
                  <div className={styles.studentAvatarRow}>
                    {post.studentPhotoUrl ? (
                      <img
                        src={post.studentPhotoUrl}
                        alt={post.studentName}
                        className={styles.studentAvatarImg}
                      />
                    ) : (
                      <div className={styles.studentAvatar}>{post.avatarLetter}</div>
                    )}
                    <div className={styles.studentMeta}>
                      <span className={styles.studentName}>{post.studentName}</span>
                      <span className={styles.institutionTag}>
                        <Building2 size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: 'text-bottom' }} />
                        {post.institution}
                      </span>
                      {post.orgAddress && (
                        <span className={styles.institutionAddress}>
                          <MapPin size={12} style={{ display: 'inline', marginRight: 3, verticalAlign: 'text-bottom' }} />
                          {post.orgAddress}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Title & 2-Line Description */}
                <h3 className={styles.cardTitle}>{post.title}</h3>
                <p className={styles.cardExcerpt}>{post.problemExcerpt}</p>

                {/* Progress Section: সংগৃহীত ও মোট প্রয়োজন */}
                <div className={styles.progressSection}>
                  <div className={styles.progressHeader}>
                    <span className={styles.collectedAmount}>
                      সংগৃহীত: ৳{post.collectedAmount} ({post.progressPercent}%) ও মোট প্রয়োজন: ৳{post.requiredAmount}
                    </span>
                  </div>
                  <div className={styles.progressBarContainer}>
                    <div
                      className={styles.progressBarFill}
                      style={{ width: `${Math.min(post.progressPercent, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Card Footer: দ্বৈত ভেরিফাইড, বিস্তারিত বাটন, সহায়তা বাটন */}
                <div className={styles.cardFooter}>
                  <div className={styles.verifiedPill}>
                    <ShieldCheck size={14} />
                    <span>দ্বৈত ভেরিফাইড</span>
                  </div>

                  <div className={styles.actionButtonsGroup}>
                    <Link
                      href={`/posts/${post.id}`}
                      className={styles.cardDetailsBtn}
                    >
                      <span>বিস্তারিত</span>
                    </Link>

                    <Link
                      href={{
                        pathname: '/donate',
                        query: { postId: post.id, amount: post.remainingAmount },
                      }}
                      className={styles.cardDonateBtn}
                    >
                      <Heart size={14} />
                      <span>সহায়তা</span>
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
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

      {/* ----------------------------------------------------
          6. SAHIH HADITHS & VIRTUES OF CHARITY (সহিহ হাদিস ও ফজিলত)
      ---------------------------------------------------- */}
      <section className={`container ${styles.hadithSection}`}>
        {/* Section Header */}
        <div className={styles.hadithHeader}>
          <div className={styles.hadithBadge}>
            <Sparkles size={16} />
            <span>{tHadith('badge')}</span>
          </div>
          <h2 className={styles.hadithTitle}>{tHadith('title')}</h2>
          <p className={styles.hadithSubtitle}>{tHadith('subtitle')}</p>
        </div>

        {/* 4 Core Pillars of Virtues */}
        <div className={styles.virtuesGrid}>
          <div className={styles.virtueCard}>
            <div className={styles.virtueIconWrapper}>
              <CheckCircle2 size={22} />
            </div>
            <h3 className={styles.virtueTitle}>{tHadith('virtue1Title')}</h3>
            <p className={styles.virtueDesc}>{tHadith('virtue1Desc')}</p>
          </div>

          <div className={styles.virtueCard}>
            <div className={styles.virtueIconWrapper}>
              <ShieldCheck size={22} />
            </div>
            <h3 className={styles.virtueTitle}>{tHadith('virtue2Title')}</h3>
            <p className={styles.virtueDesc}>{tHadith('virtue2Desc')}</p>
          </div>

          <div className={styles.virtueCard}>
            <div className={styles.virtueIconWrapper}>
              <TrendingUp size={22} />
            </div>
            <h3 className={styles.virtueTitle}>{tHadith('virtue3Title')}</h3>
            <p className={styles.virtueDesc}>{tHadith('virtue3Desc')}</p>
          </div>

          <div className={styles.virtueCard}>
            <div className={styles.virtueIconWrapper}>
              <BookOpen size={22} />
            </div>
            <h3 className={styles.virtueTitle}>{tHadith('virtue4Title')}</h3>
            <p className={styles.virtueDesc}>{tHadith('virtue4Desc')}</p>
          </div>
        </div>

        {/* Filter Category Tabs */}
        <div className={styles.hadithFilterTabs}>
          {[
            { id: 'all', label: tHadith('tabAll') },
            { id: 'jariya', label: tHadith('tabJariya') },
            { id: 'barakah', label: tHadith('tabBarakah') },
            { id: 'protection', label: tHadith('tabProtection') },
            { id: 'akhirah', label: tHadith('tabAkhirah') },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`${styles.hadithFilterBtn} ${
                hadithCategory === tab.id ? styles.hadithFilterBtnActive : ''
              }`}
              onClick={() => setHadithCategory(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Hadith Cards Grid */}
        <div className={styles.hadithCardsGrid}>
          {SAHIH_HADITHS.filter((h) =>
            hadithCategory === 'all' ? true : h.category === hadithCategory
          ).map((h) => (
            <div key={h.id} className={styles.hadithCard}>
              <div className={styles.hadithCardMeta}>
                <span className={styles.hadithTag}>
                  {isBn ? h.tagBn : h.tagEn}
                </span>
                <a
                  href={h.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.hadithSourceBadge}
                  title={
                    isBn
                      ? 'সরাসরি সোর্স ওয়েবসাইট (Sunnah.com) থেকে এই হাদিসটি যাচাই করুন'
                      : 'Verify this hadith directly on the authentic source (Sunnah.com)'
                  }
                >
                  <BadgeCheck size={14} color="#059669" />
                  <span>{isBn ? h.sourceBn : h.sourceEn}</span>
                  <span className={styles.hadithVerifyPill}>
                    {tHadith('verifySource')}
                    <ExternalLink size={11} />
                  </span>
                </a>
              </div>

              {/* Arabic Matn */}
              <div className={styles.hadithArabicBox}>
                « {h.arabic} »
              </div>

              {/* Translation */}
              <p className={styles.hadithMatn}>
                {isBn ? h.matnBn : h.matnEn}
              </p>

              {/* Benefit & Lesson Callout */}
              <div className={styles.hadithBenefitBox}>
                <Sparkles size={16} className={styles.hadithBenefitIcon} />
                <div className={styles.hadithBenefitText}>
                  <strong>{tHadith('coreLesson')}</strong>{' '}
                  {isBn ? h.benefitBn : h.benefitEn}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA Strip */}
        <div className={styles.hadithCtaStrip}>
          <div className={styles.hadithCtaTitle}>
            <Heart size={22} color="#059669" />
            <span>{tHadith('ctaText')}</span>
          </div>
          <Link href="/donate" className={styles.hadithCtaBtn}>
            <span>{tHadith('donateNow')}</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
