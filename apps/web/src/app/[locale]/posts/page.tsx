'use client';

import React, { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '../../../i18n/routing';
import styles from './page.module.css';
import {
  CheckCircle2,
  ShieldCheck,
  Heart,
  ArrowRight,
  GraduationCap,
  Building2,
} from 'lucide-react';

import { getApiUrl } from '../../../lib/api-config';

export default function PostsPage() {
  const locale = useLocale();
  const t = useTranslations('StudentPost');
  const tCommon = useTranslations('Common');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const apiUrl = getApiUrl();
    fetch(`${apiUrl}/posts/public`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const mapped = data.map((p) => {
            const req = Number(p.totalRequiredAmount || 0);
            const rec = Number(p.receivedAmount || 0);
            const rem = Number(p.remainingAmount || (req - rec));
            return {
              id: p.id,
              title: p.title,
              titleEn: p.title,
              studentName: p.studentName || 'শিক্ষার্থী',
              studentNameEn: p.studentName || 'Student',
              avatarLetter: p.studentName ? p.studentName.charAt(0) : 'শ',
              avatarLetterEn: p.studentName ? p.studentName.charAt(0).toUpperCase() : 'S',
              category: 'general',
              institution: p.orgName || 'অনুমোদিত শিক্ষা প্রতিষ্ঠান',
              institutionEn: p.orgName || 'Approved Institution',
              description: p.problemDescription,
              descriptionEn: p.problemDescription,
              totalRequired: req,
              collectedAmount: rec,
              remainingAmount: rem,
              isDoubleVerified: p.isDoubleVerified,
            };
          });
          setPosts(mapped);
        }
      })
      .catch((err) => console.error('Failed to load posts', err))
      .finally(() => setLoading(false));
  }, []);

  const filteredPosts = posts;

  return (
    <div className={`container ${styles.container}`}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.badge}>
          <ShieldCheck size={16} />
          <span>{tCommon('verified')}</span>
        </div>
        <h1 className={styles.title}>{tCommon('explorePosts')}</h1>
        <p className={styles.subtitle}>
          {locale === 'bn'
            ? 'প্রতিটি অনুদান পৌঁছে যাক প্রকৃত অভাবী শিক্ষার্থীদের শিক্ষা জীবন সুরক্ষায়। স্বচ্ছতা ও শিক্ষক-প্রতিষ্ঠানের যাচাইকৃত তথ্যের নিশ্চয়তা।'
            : 'Ensuring your charitable aid reaches deserving students directly. Verified by institutional leadership with 100% public ledger transparency.'}
        </p>
      </div>

      {/* Filter Chips */}
      <div className={styles.filterRow}>
        {[
          { id: 'all', label: t('categoryAll') },
          { id: 'medical', label: locale === 'bn' ? 'মেডিকেল' : 'Medical' },
          { id: 'polytechnic', label: t('categoryPolytechnic') },
          { id: 'madrasa', label: t('categoryMadrasa') },
        ].map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setSelectedFilter(f.id)}
            className={`${styles.filterChip} ${
              selectedFilter === f.id ? styles.filterChipActive : ''
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Posts Grid or Empty State */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
          লোড হচ্ছে...
        </div>
      ) : filteredPosts.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            backgroundColor: 'var(--surface)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--surface-border)',
            maxWidth: '600px',
            margin: '2rem auto',
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
          <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            বর্তমানে কোনো সক্রিয় আবেদন নেই
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
            যাচাই প্রক্রিয়া সম্পন্ন হওয়ার সাথে সাথে শিক্ষার্থীদের পোস্ট এখানে দৃশ্যমান হবে।
          </p>
          <Link
            href="/donate"
            className="btn btn-primary"
            style={{ display: 'inline-flex', padding: '0.75rem 1.5rem', fontWeight: '700', textDecoration: 'none' }}
          >
            <Heart size={18} style={{ marginRight: '0.5rem' }} />
            <span>সাধারণ শিক্ষা তহবিলে দান করুন</span>
          </Link>
        </div>
      ) : (
        <div className={styles.grid}>
        {filteredPosts.map((post) => {
          const progressPercent = Math.min(
            100,
            Math.round((post.collectedAmount / post.totalRequired) * 100)
          );

          const title = locale === 'bn' ? post.title : post.titleEn;
          const studentName = locale === 'bn' ? post.studentName : post.studentNameEn;
          const avatar = locale === 'bn' ? post.avatarLetter : post.avatarLetterEn;
          const institution = locale === 'bn' ? post.institution : post.institutionEn;
          const description = locale === 'bn' ? post.description : post.descriptionEn;

          return (
            <article key={post.id} className={styles.card}>
              <div>
                {/* Header */}
                <div className={styles.cardHeader}>
                  <div className={styles.studentInfo}>
                    <div className={styles.avatar}>{avatar}</div>
                    <div className={styles.studentMeta}>
                      <span className={styles.studentName}>{studentName}</span>
                      <span className={styles.institution}>
                        <Building2 size={12} style={{ display: 'inline', marginRight: 4 }} />
                        {institution}
                      </span>
                    </div>
                  </div>

                  <div className={styles.verifiedBadge}>
                    <ShieldCheck size={13} />
                    <span>{t('doubleVerifiedBadge')}</span>
                  </div>
                </div>

                {/* Title & Excerpt */}
                <h2 className={styles.cardTitle}>{title}</h2>
                <p className={styles.cardDesc}>{description}</p>
              </div>

              {/* Progress & Financial Info */}
              <div>
                <div className={styles.progressHeader}>
                  <span className={styles.collectedText}>
                    {t('received')}: ৳{post.collectedAmount.toLocaleString()}
                  </span>
                  <span className={styles.percentageText}>{progressPercent}%</span>
                </div>

                <div className={styles.progressBarTrack}>
                  <div
                    className={styles.progressBarFill}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <div className={styles.targetRow}>
                  <span>
                    {t('totalRequired')}: ৳{post.totalRequired.toLocaleString()}
                  </span>
                  <span className={styles.remainingText}>
                    {t('remaining')}: ৳{post.remainingAmount.toLocaleString()}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className={styles.actionsRow}>
                  <Link
                    href={{
                      pathname: '/donate',
                      query: { postId: post.id, amount: post.remainingAmount },
                    }}
                    className={styles.donateBtn}
                  >
                    <Heart size={16} />
                    <span>{tCommon('donateNow')}</span>
                  </Link>

                  <Link
                    href={`/posts/${post.id}`}
                    className={styles.detailsBtn}
                    title={tCommon('view')}
                  >
                    <ArrowRight size={18} />
                  </Link>
                </div>
              </div>
            </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
