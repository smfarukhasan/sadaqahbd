'use client';

import React from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import {
  ShieldCheck,
  CheckCircle2,
  User,
  Building,
  Heart,
  ArrowLeft,
  PlusCircle,
  MapPin,
  History,
  Calendar,
  ChevronDown,
  ChevronUp,
  FileText,
  BadgeCheck,
  Sparkles,
  Award,
  GraduationCap,
} from "lucide-react";
import { useAuthStore } from "../../../../lib/auth-store";
import { getApiUrl } from '../../../../lib/api-config';
import styles from './page.module.css';

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const locale = useLocale();
  const isBn = locale === 'bn';
  const t = useTranslations("StudentPost");
  const tCommon = useTranslations("Common");
  const tDonation = useTranslations("Donation");
  const user = useAuthStore((s: any) => s.user);

  const [post, setPost] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [expandedPrevious, setExpandedPrevious] = React.useState<Record<string, boolean>>({});

  const toggleExpandPrevious = (prevId: string) => {
    setExpandedPrevious((prev) => ({
      ...prev,
      [prevId]: !prev[prevId],
    }));
  };

  React.useEffect(() => {
    if (!id) return;
    const apiUrl = getApiUrl();
    const donorQuery = user?.id ? `?donorId=${user.id}` : '';
    fetch(`${apiUrl}/posts/${id}${donorQuery}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        const req = Number(data.totalRequiredAmount || 0);
        const rec = Number(data.receivedAmount || 0);
        const rem = Number(data.remainingAmount || Math.max(0, req - rec));
        setPost({
          id: data.id,
          title: data.title,
          studentName: data.studentFullName || data.studentName || (isBn ? "শিক্ষার্থী" : "Student"),
          studentPhotoUrl: data.studentPhotoUrl || null,
          institution: data.orgName || data.studentInstitutionName || (isBn ? "অনুমোদিত শিক্ষা প্রতিষ্ঠান" : "Approved Educational Institution"),
          orgAddress: data.orgAddress || null,
          className: data.studentClassName || "",
          department: data.studentDepartment || "",
          rollNumber: data.studentRoll || data.studentClassRoll || "",
          fatherName: data.studentFatherName || data.fatherName || "",
          bloodGroup: data.studentBloodGroup || "",
          dateOfBirth: data.studentDateOfBirth || "",
          permanentAddress: data.studentPermanentAddress || "",
          presentAddress: data.studentPresentAddress || data.studentAddress || data.address || "",
          classDepartment: data.studentClassDepartment || "",
          session: data.durationText || "",
          description: data.problemDescription,
          totalRequired: req,
          collectedAmount: rec,
          remainingAmount: rem,
          isDoubleVerified: data.isDoubleVerified,
          isTeacherVerified: data.isTeacherVerified,
          isOrgVerified: data.isOrgVerified,
          teacherVerifierName: data.teacherVerifierName,
          orgVerifierName: data.orgVerifierName,
          adminModificationReason: data.adminModificationReason,
          fundingBreakdown: data.fundingBreakdown || {
            directDonationsTotal: 0,
            directDonationsCount: 0,
            randomPoolAllocationsTotal: 0,
            randomPoolAllocationsCount: 0,
          },
          myDonations: Array.isArray(data.myDonations) ? data.myDonations : [],
          expenses: Array.isArray(data.expenses)
            ? data.expenses.map((e: any, idx: number) => ({
                id: `exp-${idx}`,
                category: e.categoryName,
                amount: Number(e.amount),
              }))
            : [],
          previousPosts: Array.isArray(data.previousPosts) ? data.previousPosts : [],
        });
      })
      .catch((err) => {
        console.error("Failed to load post", err);
        setPost(null);
      })
      .finally(() => setLoading(false));
  }, [id, isBn, user?.id]);

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: "6rem", paddingBottom: "6rem", textAlign: "center", color: "var(--text-muted)" }}>
        <p style={{ fontSize: "1.1rem", fontWeight: 600 }}>{isBn ? "আবেদনের বিস্তারিত লোড হচ্ছে..." : "Loading application details..."}</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container" style={{ paddingTop: "5rem", paddingBottom: "5rem", textAlign: "center" }}>
        <h2 style={{ fontSize: "1.6rem", fontWeight: "800", marginBottom: "1rem" }}>
          {isBn ? "আবেদনটি খুঁজে পাওয়া যায়নি" : "Application Not Found"}
        </h2>
        <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
          {isBn
            ? "অনুরোধকৃত আবেদনটি মুছে ফেলা হয়েছে অথবা এখনো জনসাধারণের জন্য অনুমোদিত হয়নি।"
            : "The requested campaign may have been removed or is pending verification."}
        </p>
        <Link
          href={`/${locale}/posts`}
          className="btn btn-primary"
          style={{ display: "inline-flex", padding: "0.65rem 1.35rem", textDecoration: "none" }}
        >
          {isBn ? "সব দেখুন" : "See all"}
        </Link>
      </div>
    );
  }

  const progressPercent = Math.min(
    100,
    post.totalRequired > 0 ? Math.round((post.collectedAmount / post.totalRequired) * 100) : 0
  );

  return (
    <div className={`container ${styles.detailsPageContainer}`}>
      {/* Top Back Row */}
      <div className={styles.backNavRow}>
        <Link href={`/${locale}/posts`} className={styles.backLink}>
          <ArrowLeft size={16} />
          <span>{isBn ? "সব দেখুন" : "See all"}</span>
        </Link>

        <div className={styles.topBadgeGroup}>
          <span className={styles.statusLivePill}>
            <span className={styles.livePulseDot} />
            <span>{isBn ? "চলমান শিক্ষা সহায়তা" : "Active Campaign"}</span>
          </span>
          {post.isDoubleVerified && (
            <span className={styles.verifiedBadgeSmall}>
              <ShieldCheck size={14} />
              <span>{isBn ? "দ্বৈত ভেরিফাইড" : "Double Verified"}</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className={styles.layoutGrid}>
        {/* Left Column: Full Details */}
        <div className={styles.mainColumn}>
          {/* 1. Student Profile Card */}
          <div className={styles.heroCard}>
            <div className={styles.studentProfileBox}>
              {post.studentPhotoUrl ? (
                <img
                  src={post.studentPhotoUrl}
                  alt={post.studentName}
                  className={styles.studentPhotoFrame}
                />
              ) : (
                <div className={styles.studentPhotoFallback}>
                  {post.studentName ? post.studentName.charAt(0) : "শ"}
                </div>
              )}

              <div className={styles.studentInfo} style={{ flex: 1 }}>
                <div className={styles.studentNameRow}>
                  <span className={styles.studentName}>{post.studentName}</span>
                  {post.isDoubleVerified ? (
                    <span className={styles.verifiedBadgeSmall}>
                      <BadgeCheck size={13} />
                      <span>{isBn ? "দ্বৈত ভেরিফাইড শিক্ষার্থী" : "Double Verified Student"}</span>
                    </span>
                  ) : post.isOrgVerified ? (
                    <span className={styles.verifiedBadgeSmall}>
                      <ShieldCheck size={13} />
                      <span>{isBn ? "প্রতিষ্ঠান সত্যায়িত" : "Org Verified"}</span>
                    </span>
                  ) : null}
                </div>

                <div className={styles.institutionRow}>
                  <Building size={16} className={styles.institutionIcon} />
                  <span>{post.institution}</span>
                </div>

                {post.orgAddress && (
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
                    <MapPin size={13} />
                    <span>{post.orgAddress}</span>
                  </div>
                )}

                {/* Profile Meta Badges */}
                <div className={styles.profileMetaChips}>
                  {(post.className || post.classDepartment) && (
                    <span className={styles.profileChip}>
                      <GraduationCap size={13} color="#059669" />
                      <span>{isBn ? "শ্রেণি: " : "Class: "}<strong>{post.className || post.classDepartment}</strong></span>
                    </span>
                  )}
                  {post.department && (
                    <span className={styles.profileChip}>
                      <span>{isBn ? "বিভাগ: " : "Dept: "}<strong>{post.department}</strong></span>
                    </span>
                  )}
                  {post.rollNumber && (
                    <span className={styles.profileChip}>
                      <span>{isBn ? "রোল: " : "Roll: "}<strong>{post.rollNumber}</strong></span>
                    </span>
                  )}
                  {post.fatherName && (
                    <span className={styles.profileChip}>
                      <span>{isBn ? "পিতা: " : "Father: "}<strong>{post.fatherName}</strong></span>
                    </span>
                  )}
                  {post.bloodGroup && (
                    <span className={styles.profileChip} style={{ color: '#e11d48', borderColor: '#fecdd3', background: '#fff1f2' }}>
                      <Heart size={12} fill="#e11d48" />
                      <span><strong>{post.bloodGroup}</strong></span>
                    </span>
                  )}
                  {post.presentAddress && (
                    <span className={styles.profileChip}>
                      <MapPin size={12} color="#64748b" />
                      <span>{post.presentAddress}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Active Application: Post Title, Story & Itemized Expenses */}
          <div className={styles.contentCard}>
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.65rem', background: '#ecfdf5', color: '#059669', borderRadius: '12px', border: '1px solid #a7f3d0' }}>
                  {isBn ? 'সক্রিয় শিক্ষা সহায়তা আবেদন' : 'Active Assistance Campaign'}
                </span>
                {post.session && (
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Calendar size={13} color="#059669" />
                    <strong>{post.session}</strong>
                  </span>
                )}
              </div>
              <h1 className={styles.postMainTitle} style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>
                {post.title}
              </h1>
            </div>

            <div className={styles.cardSectionHeader}>
              <FileText size={18} color="var(--primary, #059669)" />
              <h2 className={styles.cardSectionTitle}>
                {isBn ? "আবেদনের বিবরণ ও পারিবারিক সংকট" : "Application Details & Hardship Story"}
              </h2>
            </div>
            <p className={styles.problemText}>{post.description}</p>

            <div className={styles.cardSectionHeader} style={{ marginTop: '1.5rem' }}>
              <Sparkles size={18} color="var(--primary, #059669)" />
              <h2 className={styles.cardSectionTitle}>
                {isBn ? "প্রয়োজনীয় খরচের সুনির্দিষ্ট খাত ও হিসাব" : "Itemized Expense Breakdown"}
              </h2>
            </div>

            <div className={styles.expensesList}>
              {post.expenses.map((expense: any, idx: number) => (
                <div key={expense.id || idx} className={styles.expenseRow}>
                  <div className={styles.expenseCategory}>
                    <span className={styles.expenseSerial}>{idx + 1}</span>
                    <span>{expense.category}</span>
                  </div>
                  <span className={styles.expenseAmount}>
                    ৳{expense.amount.toLocaleString(isBn ? 'bn-BD' : 'en-US')}
                  </span>
                </div>
              ))}
            </div>

            <div className={styles.totalRequiredRow}>
              <span className={styles.totalLabel}>
                {isBn ? "মোট প্রয়োজনীয় সহায়তা বাজেট:" : "Total Budget Required:"}
              </span>
              <span className={styles.totalValue}>
                ৳{post.totalRequired.toLocaleString(isBn ? 'bn-BD' : 'en-US')}
              </span>
            </div>
          </div>

          {/* 3. Double Verification & Institutional Audit Trail */}
          <div className={styles.contentCard}>
            <div className={styles.cardSectionHeader}>
              <ShieldCheck size={20} color="var(--primary, #059669)" />
              <h2 className={styles.cardSectionTitle}>
                {isBn ? "দ্বৈত ভেরিফিকেশন ও প্রাতিষ্ঠানিক অডিট ট্রেইল" : "Double Verification & Audit Trail"}
              </h2>
            </div>

            <div className={styles.auditGrid}>
              <div className={styles.auditCard}>
                <div className={styles.auditIconBox}>
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <div className={styles.auditTitle}>
                    {isBn ? "১. শিক্ষক সরেজমিনে যাচাই" : "1. Faculty In-Person Verification"}
                  </div>
                  <div className={styles.auditText}>
                    {post.teacherVerifierName
                      ? (isBn ? `যাচাইকারী শিক্ষক: ${post.teacherVerifierName}` : `Verified by Teacher: ${post.teacherVerifierName}`)
                      : post.isTeacherVerified
                      ? (isBn ? "সংশ্লিষ্ট শিক্ষক দ্বারা সরেজমিনে যাচাইকৃত" : "Verified in-person by faculty teacher")
                      : (isBn ? "যাচাই প্রক্রিয়াধীন" : "Verification in progress")}
                  </div>
                </div>
              </div>

              <div className={styles.auditCard}>
                <div className={styles.auditIconBox}>
                  <Award size={20} />
                </div>
                <div>
                  <div className={styles.auditTitle}>
                    {isBn ? "২. প্রতিষ্ঠান প্রধান অনুমোদন" : "2. Institutional Head Approval"}
                  </div>
                  <div className={styles.auditText}>
                    {post.orgVerifierName
                      ? (isBn ? `অনুমোদনকারী প্রধান: ${post.orgVerifierName} (${post.institution})` : `Approved by: ${post.orgVerifierName} (${post.institution})`)
                      : post.isOrgVerified
                      ? (isBn ? `${post.institution} প্রধান কর্তৃক প্রত্যয়িত` : `Certified by Head of ${post.institution}`)
                      : (isBn ? "প্রতিষ্ঠান অনুমোদনের অপেক্ষায়" : "Awaiting institutional approval")}
                  </div>
                </div>
              </div>
            </div>

            {post.adminModificationReason && (
              <div style={{ marginTop: '1rem', padding: '0.85rem 1rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', fontSize: '0.82rem', color: '#92400e' }}>
                <strong>{isBn ? "এডমিন কর্তৃক খরচের খাত সমন্বয় নোট: " : "Admin Adjustment Note: "}</strong>
                {post.adminModificationReason}
              </div>
            )}
          </div>

          {/* 4. Student's Previous Aid Applications & Progress Accordion */}
          <div className={styles.contentCard}>
            <div className={styles.cardSectionHeader}>
              <History size={20} color="var(--primary, #059669)" />
              <h2 className={styles.cardSectionTitle}>
                {isBn ? "শিক্ষার্থীর পূর্ববর্তী সহায়তা ও অগ্রগতির বিবরণ" : "Previous Aid Requests & Progress"}
              </h2>
            </div>

            {post.previousPosts && post.previousPosts.length > 0 ? (
              <div className={styles.previousPostsContainer}>
                {post.previousPosts.map((prev: any, idx: number) => {
                  const isExpanded = !!expandedPrevious[prev.id];
                  const prevReq = Number(prev.totalRequiredAmount || 0);
                  const prevRec = Number(prev.receivedAmount || 0);
                  const prevPct = prevReq > 0 ? Math.min(100, Math.round((prevRec / prevReq) * 100)) : 0;
                  return (
                    <div key={prev.id || idx} className={styles.previousPostCard}>
                      <div
                        className={styles.prevHeader}
                        onClick={() => toggleExpandPrevious(prev.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                          <div>
                            <h4 className={styles.prevTitle} style={{ margin: '0 0 0.25rem', color: '#0f172a' }}>{prev.title}</h4>
                            <div className={styles.prevMeta}>
                              <Calendar size={13} />
                              <span>{new Date(prev.createdAt).toLocaleDateString(isBn ? "bn-BD" : "en-US")}</span>
                              <span style={{ fontWeight: 700, color: "var(--primary-dark, #047857)" }}>
                                • বাজেট ৳{prevReq.toLocaleString(isBn ? "bn-BD" : "en-US")} (সংগৃহীত ৳{prevRec.toLocaleString(isBn ? "bn-BD" : "en-US")} — {prevPct}%)
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            className={styles.prevExpandBtn}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          >
                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px dashed #e2e8f0' }}>
                          <p style={{ fontSize: '0.88rem', color: '#475569', lineHeight: 1.6, margin: '0 0 0.75rem' }}>
                            {prev.problemDescription}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#047857', fontWeight: 600 }}>
                            <CheckCircle2 size={14} />
                            <span>
                              {prev.verificationStatus === 'approved'
                                ? (isBn ? 'এই আবেদনটির সহায়তা সফলভাবে সম্পন্ন হয়েছিল।' : 'Aid disbursement completed.')
                                : (isBn ? 'পূর্ববর্তী আবেদন স্থিতি: যাচাইকৃত' : 'Previous campaign status: Verified')}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", fontStyle: "italic", margin: 0 }}>
                {isBn
                  ? "এই প্ল্যাটফর্মে এটিই এই শিক্ষার্থীর প্রথম আবেদন। পূর্ববর্তী কোনো বকেয়া আবেদন নেই।"
                  : "This is the student's first application on the platform."}
              </p>
            )}
          </div>

          {/* 5. Donor Contribution Log */}
          <div className={styles.contentCard}>
            <div className={styles.cardSectionHeader}>
              <Heart size={20} color="#e11d48" />
              <h2 className={styles.cardSectionTitle}>
                {isBn ? "আপনার ব্যক্তিগত অনুদান ইতিহাস" : "Your Personal Contribution History"}
              </h2>
            </div>

            {user ? (
              post.myDonations && post.myDonations.length > 0 ? (
                <div className={styles.donorHistoryList}>
                  {post.myDonations.map((d: any) => (
                    <div key={d.id} className={styles.donorHistoryItem}>
                      <div className={styles.donorHistoryLeft}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Calendar size={13} color="#64748b" />
                          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>
                            {new Date(d.createdAt).toLocaleDateString(isBn ? 'bn-BD' : 'en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '10px', background: d.status === 'accepted' ? '#ecfdf5' : '#fffbeb', color: d.status === 'accepted' ? '#047857' : '#b45309', fontWeight: 700 }}>
                            {d.status === 'accepted' ? (isBn ? 'গৃহীত' : 'Accepted') : (isBn ? 'অপেক্ষমাণ' : 'Pending')}
                          </span>
                        </div>
                        <span className={styles.donorTrxId}>
                          {isBn ? 'মাধ্যম: ' : 'Method: '}<strong>{d.paymentMethod}</strong> • {isBn ? 'ট্রানজেকশন আইডি: ' : 'Trx ID: '}<strong>{d.transactionReference}</strong>
                        </span>
                      </div>
                      <div className={styles.donorHistoryRight}>
                        <span className={styles.donorAmountBadge}>
                          ৳{d.amount.toLocaleString(isBn ? 'bn-BD' : 'en-US')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '1rem', background: 'var(--background, #f8fafc)', borderRadius: '10px', border: '1px dashed #cbd5e1', textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                    {isBn
                      ? "আপনি এই শিক্ষা তহবিলে এখনো অনুদান দেননি। আপনার ক্ষুদ্র সহযোগিতাই হতে পারে এই শিক্ষার্থীর পড়াশোনা অব্যাহত রাখার চাবিকাঠি।"
                      : "You have not donated to this campaign yet. Every small contribution helps."}
                  </p>
                </div>
              )
            ) : (
              <div style={{ padding: '1rem', background: 'var(--background, #f8fafc)', borderRadius: '10px', border: '1px dashed #cbd5e1', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                  {isBn
                    ? "অনুদান দিয়ে আপনার ব্যক্তিগত অনুদান রেকর্ড দেখতে অনুগ্রহ করে লগইন করুন।"
                    : "Log in to track your personal contribution history."}
                </p>
              </div>
            )}
          </div>

          {/* 6. Transparent Fund Source Breakdown: Direct vs Random Pool */}
          <div className={styles.contentCard}>
            <div className={styles.cardSectionHeader}>
              <BadgeCheck size={20} color="var(--primary, #059669)" />
              <h2 className={styles.cardSectionTitle}>
                {isBn ? "অনুদানের স্বচ্ছ উৎস বিভাজন ও ফান্ডিং রেকর্ড" : "Transparent Fund Source Breakdown"}
              </h2>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 1rem', lineHeight: 1.5 }}>
              {isBn
                ? "সাদাকাহ বিডি-র সম্পূর্ণ স্বচ্ছ হিসাব নীতি অনুযায়ী এই ক্যাম্পেইনে সরাসরি ডোনারদের অনুদান এবং সাধারণ র‍্যান্ডম অনুদান পুল থেকে প্রাপ্ত সহায়তার পৃথক হিসাব:"
                : "Audited transparent breakdown showing direct donor gifts vs allocations disbursed from the general random pool:"}
            </p>

            <div className={styles.fundBreakdownGrid}>
              <div className={`${styles.fundBreakdownCard} ${styles.fundBreakdownCardPrimary}`}>
                <div className={styles.fundCardHeader}>
                  <Heart size={16} color="#059669" />
                  <span>{isBn ? "১. সরাসরি ডোনারদের অনুদান" : "1. Direct Public Donations"}</span>
                </div>
                <div className={styles.fundCardAmount} style={{ color: '#059669' }}>
                  ৳{(post.fundingBreakdown?.directDonationsTotal || 0).toLocaleString(isBn ? 'bn-BD' : 'en-US')}
                </div>
                <div className={styles.fundCardSubtitle}>
                  {isBn
                    ? `মোট ${post.fundingBreakdown?.directDonationsCount || 0} জন শুভাকাঙ্ক্ষী সরাসরি দিয়েছেন`
                    : `${post.fundingBreakdown?.directDonationsCount || 0} individual direct donors`}
                </div>
              </div>

              <div className={`${styles.fundBreakdownCard} ${styles.fundBreakdownCardSecondary}`}>
                <div className={styles.fundCardHeader}>
                  <Sparkles size={16} color="#3b82f6" />
                  <span>{isBn ? "২. র‍্যান্ডম ডোনেশন পুল থেকে প্রাপ্ত" : "2. Random Donation Pool Allocation"}</span>
                </div>
                <div className={styles.fundCardAmount} style={{ color: '#2563eb' }}>
                  ৳{(post.fundingBreakdown?.randomPoolAllocationsTotal || 0).toLocaleString(isBn ? 'bn-BD' : 'en-US')}
                </div>
                <div className={styles.fundCardSubtitle}>
                  {isBn
                    ? `সুপার এডমিন কর্তৃক সাধারণ জরুরি ফান্ড থেকে ${post.fundingBreakdown?.randomPoolAllocationsCount || 0} কিস্তিতে বরাদ্দ`
                    : `Disbursed from unearmarked random donation pool`}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Donation Action Box */}
        <div>
          <div className={styles.donationStickyCard}>
            <h3 className={styles.stickyTitle}>
              {isBn ? "তহবিল সংগ্রহ অগ্রগতি" : "Campaign Progress"}
            </h3>

            {/* Progress Bar */}
            <div className={styles.progressContainer}>
              <div className={styles.progressBarTrack}>
                <div
                  className={styles.progressBarFill}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className={styles.progressNumbers}>
                <span className={styles.percentBadge}>{progressPercent}% অর্জিত</span>
                <span style={{ color: "var(--text-muted)" }}>
                  {post.remainingAmount <= 0
                    ? (isBn ? "সম্পূর্ণ সংগৃহীত 🎉" : "Fully Funded 🎉")
                    : (isBn ? `বাকি ৳${post.remainingAmount.toLocaleString('bn-BD')}` : `Remaining ৳${post.remainingAmount.toLocaleString('en-US')}`)}
                </span>
              </div>
            </div>

            {/* Financial Stats */}
            <div className={styles.statsRow}>
              <div className={styles.statBlock}>
                <span className={styles.statLabel}>{isBn ? "সংগৃহীত" : "Received"}</span>
                <span className={styles.statValueReceived}>
                  ৳{post.collectedAmount.toLocaleString(isBn ? "bn-BD" : "en-US")}
                </span>
              </div>

              <div className={styles.statBlock} style={{ textAlign: "right" }}>
                <span className={styles.statLabel}>{isBn ? "অবশিষ্ট প্রয়োজন" : "Remaining"}</span>
                <span className={styles.statValueRemaining}>
                  ৳{post.remainingAmount.toLocaleString(isBn ? "bn-BD" : "en-US")}
                </span>
              </div>
            </div>

            {/* Action Button */}
            {user?.role === "student" ? (
              <div
                style={{
                  padding: "1.25rem",
                  backgroundColor: "rgba(5, 150, 105, 0.08)",
                  borderRadius: "var(--radius-md, 10px)",
                  border: "1px solid rgba(5, 150, 105, 0.25)",
                  textAlign: "center",
                }}
              >
                <p style={{ fontSize: "0.88rem", color: "var(--primary-dark, #047857)", fontWeight: "700", marginBottom: "0.75rem" }}>
                  {isBn
                    ? "শিক্ষার্থী অ্যাকাউন্ট থেকে অনুদান দেওয়া যাবে না। আপনি নিজের জন্য শিক্ষা সহায়তার আবেদন করতে পারেন।"
                    : "Students cannot donate to aid campaigns. You may apply for student aid."}
                </p>
                <Link
                  href={{ pathname: "/student", query: { tab: "applications", action: "new" } }}
                  className="btn btn-primary"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    padding: "0.55rem 1.15rem",
                    fontSize: "0.88rem",
                    textDecoration: "none",
                    fontWeight: "700",
                  }}
                >
                  <PlusCircle size={15} />
                  <span>{isBn ? "নতুন আবেদন তৈরি করুন" : "Create New Request"}</span>
                </Link>
              </div>
            ) : (
              <Link
                href={`/${locale}/donate?postId=${post.id}&amount=${post.remainingAmount}`}
                className={styles.donateActionBtn}
              >
                <Heart size={20} fill="currentColor" />
                <span>{isBn ? "এখনই এই শিক্ষার্থীকে সহায়তা করুন" : "Donate to this Student"}</span>
              </Link>
            )}

            {/* Trust Assurance Bullets */}
            <div className={styles.trustPointsList}>
              <div className={styles.trustPointItem}>
                <ShieldCheck size={16} className={styles.trustPointIcon} />
                <span>{isBn ? "১০০% অর্থ সরাসরি এই শিক্ষার্থীর মেস/টিউশনে যাবে" : "100% direct student distribution"}</span>
              </div>
              <div className={styles.trustPointItem}>
                <CheckCircle2 size={16} className={styles.trustPointIcon} />
                <span>{isBn ? "কোনো প্রকার মধ্যস্বত্বভোগী বা হিডেন চার্জ নেই" : "0% platform fee, zero middlemen"}</span>
              </div>
              <div className={styles.trustPointItem}>
                <BadgeCheck size={16} className={styles.trustPointIcon} />
                <span>{isBn ? "প্রতিটি অনুদানের স্বচ্ছ হিসাব উন্মুক্ত লেজারে সংরক্ষিত" : "Live entry in transparent public ledger"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
