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
  MapPin,
  Search,
  X,
} from 'lucide-react';

import { getApiUrl } from '../../../lib/api-config';
import FinancialDonationModal from '../../../components/portal/FinancialDonationModal';
import { useAuthStore } from '../../../lib/auth-store';

export default function PostsPage() {
  const locale = useLocale();
  const t = useTranslations('StudentPost');
  const tCommon = useTranslations('Common');
  const user = useAuthStore((s) => s.user);
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFinancialModalOpen, setIsFinancialModalOpen] = useState(false);

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
              studentPhotoUrl: p.studentPhotoUrl || null,
              avatarLetter: p.studentName ? p.studentName.charAt(0) : 'শ',
              avatarLetterEn: p.studentName ? p.studentName.charAt(0).toUpperCase() : 'S',
              category: 'general',
              institution: p.orgName || 'অনুমোদিত শিক্ষা প্রতিষ্ঠান',
              institutionEn: p.orgName || 'Approved Institution',
              orgAddress: p.orgAddress || null,
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

  const filteredPosts = posts.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (p.studentName && p.studentName.toLowerCase().includes(q)) ||
      (p.studentNameEn && p.studentNameEn.toLowerCase().includes(q)) ||
      (p.title && p.title.toLowerCase().includes(q)) ||
      (p.titleEn && p.titleEn.toLowerCase().includes(q)) ||
      (p.institution && p.institution.toLowerCase().includes(q)) ||
      (p.institutionEn && p.institutionEn.toLowerCase().includes(q)) ||
      (p.orgAddress && p.orgAddress.toLowerCase().includes(q)) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
  });

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

      {/* Search Input Bar (Filter feature hidden, live search active) */}
      <div className={styles.searchWrapper}>
        <Search size={18} className={styles.searchIcon} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={
            locale === 'bn'
              ? 'শিক্ষার্থীর নাম, শিক্ষা প্রতিষ্ঠান, জেলা বা শিরোনাম দিয়ে খুঁজুন...'
              : 'Search by student name, institution, district or title...'
          }
          className={styles.searchInput}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className={styles.searchClearBtn}
            title={locale === 'bn' ? 'মুছে ফেলুন' : 'Clear search'}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Posts Grid or Empty State */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
          লোড হচ্ছে...
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className={styles.emptyState}>
          {searchQuery ? (
            <>
              <Search size={44} className={styles.emptyIcon} />
              <h3>{locale === 'bn' ? 'কোনো ফলাফল পাওয়া যায়নি' : 'No results found'}</h3>
              <p>
                {locale === 'bn'
                  ? `"${searchQuery}" এর সাথে মিলে এমন কোনো সহায়তাপ্রার্থী শিক্ষার্থীর আবেদন পাওয়া যায়নি।`
                  : `No student campaigns match "${searchQuery}".`}
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className={styles.emptyResetBtn}
              >
                {locale === 'bn' ? 'সার্চ রিসেট করুন' : 'Reset Search'}
              </button>
            </>
          ) : (
            <>
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
                  marginBottom: '1.25rem',
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
            </>
          )}
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
                {/* Header: Photo beside Name, Institution Name, and Institution Address */}
                <div className={styles.cardHeader}>
                  <div className={styles.studentInfo}>
                    {post.studentPhotoUrl ? (
                      <img
                        src={post.studentPhotoUrl}
                        alt={studentName}
                        className={styles.avatarImg}
                      />
                    ) : (
                      <div className={styles.avatar}>{avatar}</div>
                    )}
                    <div className={styles.studentMeta}>
                      <span className={styles.studentName}>{studentName}</span>
                      <span className={styles.institution}>
                        <Building2 size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: 'text-bottom' }} />
                        {institution}
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
                <h2 className={styles.cardTitle}>{title}</h2>
                <p className={styles.cardDesc}>{description}</p>
              </div>

              {/* Progress & Financial Info */}
              <div>
                <div className={styles.progressHeader}>
                  <span className={styles.collectedText}>
                    সংগৃহীত: ৳{post.collectedAmount.toLocaleString()} ({progressPercent}%) ও মোট প্রয়োজন: ৳{post.totalRequired.toLocaleString()}
                  </span>
                </div>

                <div className={styles.progressBarTrack}>
                  <div
                    className={styles.progressBarFill}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* Below Progress Bar: দ্বৈত ভেরিফাইড, বিস্তারিত, সহায়তা বাটন */}
                <div className={styles.cardFooterActions}>
                  <div className={styles.verifiedBadge}>
                    <ShieldCheck size={14} />
                    <span>দ্বৈত ভেরিফাইড</span>
                  </div>

                  <div className={styles.actionButtonsGroup}>
                    <Link
                      href={`/posts/${post.id}`}
                      className={styles.detailsBtn}
                    >
                      <span>বিস্তারিত</span>
                    </Link>

                    <button
                      onClick={() => setIsFinancialModalOpen(true)}
                      className={styles.donateBtn}
                    >
                      <Heart size={14} />
                      <span>সহায়তা</span>
                    </button>
                  </div>
                </div>
              </div>
            </article>
            );
          })}
        </div>
      )}

      <FinancialDonationModal
        isOpen={isFinancialModalOpen}
        onClose={() => setIsFinancialModalOpen(false)}
      />
    </div>
  );
}
