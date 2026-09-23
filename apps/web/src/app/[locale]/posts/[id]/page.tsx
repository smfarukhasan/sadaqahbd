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
    fetch(`${apiUrl}/posts/${id}`)
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
          studentName: data.studentName || (isBn ? "শিক্ষার্থী" : "Student"),
          studentPhotoUrl: data.studentPhotoUrl || null,
          institution: data.orgName || data.studentInstitutionName || (isBn ? "অনুমোদিত শিক্ষা প্রতিষ্ঠান" : "Approved Educational Institution"),
          orgAddress: data.orgAddress || null,
          department: data.studentClassDepartment || data.studentRoll || (isBn ? "শিক্ষার্থী" : "Student"),
          session: data.durationText || "",
          description: data.problemDescription,
          totalRequired: req,
          collectedAmount: rec,
          remainingAmount: rem,
          isDoubleVerified: data.isDoubleVerified,
          verifiedByTeacher: data.isTeacherVerified ? (isBn ? "সংশ্লিষ্ট শিক্ষক দ্বারা সরেজমিনে সত্যায়িত" : "Verified by Department Teacher") : null,
          verifiedByOrg: data.isOrgVerified ? (data.orgName || (isBn ? "অনুমোদিত শিক্ষা প্রতিষ্ঠান" : "Approved Institution")) : null,
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
  }, [id, isBn]);

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
          {/* 1. Hero Title & Student Profile Card */}
          <div className={styles.heroCard}>
            <div className={styles.titleArea}>
              <h1 className={styles.postMainTitle}>{post.title}</h1>
            </div>

            {/* Student & Institution Profile Card */}
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

              <div className={styles.studentInfo}>
                <div className={styles.studentNameRow}>
                  <span className={styles.studentName}>{post.studentName}</span>
                  {post.isDoubleVerified && (
                    <span className={styles.verifiedBadgeSmall}>
                      <BadgeCheck size={13} />
                      <span>{isBn ? "শিক্ষক ও প্রতিষ্ঠান সত্যায়িত" : "Teacher & Org Verified"}</span>
                    </span>
                  )}
                </div>

                <div className={styles.institutionRow}>
                  <Building size={16} className={styles.institutionIcon} />
                  <span>{post.institution}</span>
                </div>

                <div className={styles.metaSubRow}>
                  {post.orgAddress && (
                    <span className={styles.metaItem}>
                      <MapPin size={13} />
                      <span>{post.orgAddress}</span>
                    </span>
                  )}
                  {post.department && (
                    <span className={styles.metaItem}>
                      <User size={13} />
                      <span>{isBn ? `শ্রেণি/বিভাগ/রোল: ${post.department}` : `Class/Dept/Roll: ${post.department}`}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Detailed Problem Statement */}
          <div className={styles.contentCard}>
            <div className={styles.cardSectionHeader}>
              <FileText size={20} color="var(--primary, #059669)" />
              <h2 className={styles.cardSectionTitle}>
                {isBn ? "আবেদনের প্রেক্ষাপট ও সম্পূর্ণ বিবরণ" : "Detailed Context & Problem Description"}
              </h2>
            </div>
            <p className={styles.problemText}>{post.description}</p>
          </div>

          {/* 3. Itemized Expenses Breakdown */}
          <div className={styles.contentCard}>
            <div className={styles.cardSectionHeader}>
              <Sparkles size={20} color="var(--primary, #059669)" />
              <h2 className={styles.cardSectionTitle}>
                {isBn ? "প্রয়োজনীয় খরচের সুনির্দিষ্ট হিসাব" : "Itemized Expense Breakdown"}
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

          {/* 4. Verification Audit Trail */}
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
                    {post.verifiedByTeacher || (isBn ? "সংশ্লিষ্ট শিক্ষক দ্বারা যাচাইকৃত" : "Verified by faculty member")}
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
                    {post.verifiedByOrg || (isBn ? "অনুমোদিত শিক্ষা প্রতিষ্ঠান প্রধান কর্তৃক প্রত্যয়িত" : "Certified by principal/head of institution")}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Previous Applications & Historical Log */}
          <div className={styles.contentCard}>
            <div className={styles.cardSectionHeader}>
              <History size={20} color="var(--primary, #059669)" />
              <h2 className={styles.cardSectionTitle}>
                {isBn ? "শিক্ষার্থীর পূর্ববর্তী আবেদন ও অগ্রগতির বিবরণ" : "Previous Aid Requests & History"}
              </h2>
            </div>

            {post.previousPosts && post.previousPosts.length > 0 ? (
              <div className={styles.previousPostsContainer}>
                {post.previousPosts.map((prev: any, idx: number) => {
                  const isExpanded = !!expandedPrevious[prev.id];
                  return (
                    <div key={prev.id || idx} className={styles.previousPostCard}>
                      <div className={styles.prevHeader}>
                        <h4 className={styles.prevTitle}>{prev.title}</h4>
                        <div className={styles.prevMeta}>
                          <Calendar size={13} />
                          <span>{new Date(prev.createdAt).toLocaleDateString(isBn ? "bn-BD" : "en-US")}</span>
                          <span style={{ fontWeight: 700, color: "var(--primary-dark, #047857)" }}>
                            • ৳{Number(prev.totalRequiredAmount).toLocaleString(isBn ? "bn-BD" : "en-US")}
                          </span>
                        </div>
                      </div>

                      <div
                        onClick={() => toggleExpandPrevious(prev.id)}
                        className={styles.prevText}
                        style={{
                          display: isExpanded ? "block" : "-webkit-box",
                          WebkitLineClamp: isExpanded ? undefined : 2,
                          WebkitBoxOrient: "vertical",
                          overflow: isExpanded ? "visible" : "hidden",
                        }}
                      >
                        {prev.problemDescription}
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleExpandPrevious(prev.id)}
                        className={styles.prevExpandBtn}
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp size={14} />
                            <span>{isBn ? "সংক্ষিপ্ত করুন" : "Collapse"}</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown size={14} />
                            <span>{isBn ? "সম্পূর্ণ বর্ণনা পড়ুন" : "Read full description"}</span>
                          </>
                        )}
                      </button>
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
