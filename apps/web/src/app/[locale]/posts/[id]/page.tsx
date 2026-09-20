'use client';

import React from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { ShieldCheck, CheckCircle2, User, Building, Heart, ArrowLeft, PlusCircle } from "lucide-react";
import { useAuthStore } from "../../../../lib/auth-store";

import { useParams } from "next/navigation";

import { getApiUrl } from '../../../../lib/api-config';

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const locale = useLocale();
  const t = useTranslations("StudentPost");
  const tCommon = useTranslations("Common");
  const tDonation = useTranslations("Donation");
  const user = useAuthStore((s: any) => s.user);

  const [post, setPost] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

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
          studentName: data.studentName || "শিক্ষার্থী",
          institution: data.orgName || "অনুমোদিত শিক্ষা প্রতিষ্ঠান",
          department: "শিক্ষার্থী",
          session: "",
          description: data.problemDescription,
          totalRequired: req,
          collectedAmount: rec,
          remainingAmount: rem,
          isDoubleVerified: data.isDoubleVerified,
          verifiedByTeacher: data.isTeacherVerified ? "সংশ্লিষ্ট শিক্ষক দ্বারা সত্যায়িত" : null,
          verifiedByOrg: data.isOrgVerified ? (data.orgName || "অনুমোদিত প্রতিষ্ঠান") : null,
          expenses: Array.isArray(data.expenses)
            ? data.expenses.map((e: any, idx: number) => ({
                id: `exp-${idx}`,
                category: e.categoryName,
                amount: Number(e.amount),
              }))
            : [],
        });
      })
      .catch((err) => {
        console.error("Failed to load post", err);
        setPost(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: "5rem", textAlign: "center", color: "var(--text-muted)" }}>
        লোড হচ্ছে...
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container" style={{ paddingTop: "5rem", textAlign: "center" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "800", marginBottom: "1rem" }}>
          আবেদনটি খুঁজে পাওয়া যায়নি
        </h2>
        <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
          অনুরোধকৃত আবেদনটি মুছে ফেলা হয়েছে অথবা এখনো জনসাধারণের জন্য অনুমোদিত হয়নি।
        </p>
        <Link
          href={`/${locale}/posts`}
          className="btn btn-primary"
          style={{ display: "inline-flex", padding: "0.65rem 1.25rem", textDecoration: "none" }}
        >
          সব পোস্ট দেখুন
        </Link>
      </div>
    );
  }

  const progressPercent = Math.min(
    100,
    post.totalRequired > 0 ? Math.round((post.collectedAmount / post.totalRequired) * 100) : 0
  );

  return (
    <div className="container" style={{ paddingTop: "2rem", paddingBottom: "5rem" }}>
      {/* Back Link */}
      <div style={{ marginBottom: "1.5rem" }}>
        <Link
          href={`/${locale}/posts`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            color: "var(--color-primary)",
            textDecoration: "none",
            fontWeight: "600",
            fontSize: "0.95rem",
          }}
        >
          <ArrowLeft size={18} />
          {tCommon("explorePosts")}
        </Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2rem" }}>
        {/* Main Details Column */}
        <div>
          {/* Post Header & Verification */}
          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.85rem" }}>
              {post.isDoubleVerified && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    padding: "0.35rem 0.75rem",
                    backgroundColor: "var(--primary-light)",
                    color: "var(--primary-dark)",
                    border: "1px solid rgba(5, 150, 105, 0.28)",
                    borderRadius: "var(--radius-full)",
                    fontSize: "0.85rem",
                    fontWeight: "600",
                  }}
                >
                  <ShieldCheck size={18} />
                  {t("doubleVerifiedBadge")}
                </span>
              )}
            </div>

            <h1 style={{ fontSize: "1.85rem", fontWeight: "800", color: "var(--text-main)", lineHeight: "1.3" }}>
              {post.title}
            </h1>
          </div>

          {/* Student & Institution Box */}
          <div
            className="card"
            style={{
              padding: "1.25rem",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--color-surface)",
              marginBottom: "1.75rem",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-text-muted)", fontSize: "0.85rem", marginBottom: "0.2rem" }}>
                <User size={16} />
                <span>শিক্ষার্থী</span>
              </div>
              <p style={{ fontWeight: "700", color: "var(--color-text)", fontSize: "1rem" }}>
                {post.studentName}
              </p>
              <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>{post.department}</p>
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-text-muted)", fontSize: "0.85rem", marginBottom: "0.2rem" }}>
                <Building size={16} />
                <span>শিক্ষা প্রতিষ্ঠান</span>
              </div>
              <p style={{ fontWeight: "700", color: "var(--color-text)", fontSize: "1rem" }}>
                {post.institution}
              </p>
              <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>সেশন: {post.session}</p>
            </div>
          </div>

          {/* Problem Statement */}
          <div className="card" style={{ padding: "1.5rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", marginBottom: "1.75rem" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: "700", marginBottom: "0.75rem", color: "var(--color-text)" }}>
              {t("problemLabel")}
            </h2>
            <p style={{ fontSize: "1rem", color: "var(--color-text)", lineHeight: "1.7", whiteSpace: "pre-line" }}>
              {post.description}
            </p>
          </div>

          {/* Itemized Expenses Breakdown */}
          <div className="card" style={{ padding: "1.5rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", marginBottom: "1.75rem" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: "700", marginBottom: "1rem", color: "var(--color-text)" }}>
              {t("expensesTitle")}
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {post.expenses.map((expense: any, idx: number) => (
                <div
                  key={expense.id || idx}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.85rem 1rem",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "var(--color-bg)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <span style={{ fontWeight: "500", color: "var(--color-text)" }}>
                    {idx + 1}. {expense.category}
                  </span>
                  <span style={{ fontWeight: "700", color: "var(--color-primary)" }}>
                    ৳{expense.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: "1.25rem",
                paddingTop: "1rem",
                borderTop: "2px dashed var(--color-border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontWeight: "800",
                fontSize: "1.1rem",
              }}
            >
              <span>{t("totalRequired")}:</span>
              <span style={{ color: "var(--color-primary-dark)" }}>৳{post.totalRequired.toLocaleString()}</span>
            </div>
          </div>

          {/* Verification Audit Trail */}
          <div className="card" style={{ padding: "1.25rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", backgroundColor: "rgba(13, 148, 136, 0.04)" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: "700", color: "var(--color-primary-dark)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <ShieldCheck size={20} color="var(--color-primary)" />
              যাচাইকরণ নিশ্চিতকরণ ও সনদ
            </h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.9rem", color: "var(--color-text-muted)" }}>
              <li style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <CheckCircle2 size={16} color="var(--color-primary)" />
                <strong>শিক্ষক অনুমোদন:</strong> {post.verifiedByTeacher}
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <CheckCircle2 size={16} color="var(--color-primary)" />
                <strong>প্রতিষ্ঠান অনুমোদন:</strong> {post.verifiedByOrg}
              </li>
            </ul>
          </div>
        </div>

        {/* Sidebar / Donation Action Card */}
        <div>
          <div
            className="card"
            style={{
              position: "sticky",
              top: "90px",
              padding: "2rem",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--color-surface)",
              boxShadow: "var(--shadow-md)",
            }}
          >
            <h3 style={{ fontSize: "1.35rem", fontWeight: "700", marginBottom: "1.25rem", color: "var(--color-text)" }}>
              তহবিল অগ্রগতি
            </h3>

            {/* Progress Bar */}
            <div style={{ width: "100%", height: "12px", backgroundColor: "var(--color-border)", borderRadius: "var(--radius-full)", overflow: "hidden", marginBottom: "1rem" }}>
              <div
                style={{
                  width: `${progressPercent}%`,
                  height: "100%",
                  backgroundColor: "var(--color-primary)",
                  borderRadius: "var(--radius-full)",
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem", fontSize: "0.95rem" }}>
              <div>
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", marginBottom: "0.2rem" }}>{t("received")}</p>
                <p style={{ fontWeight: "800", color: "var(--color-primary)", fontSize: "1.25rem" }}>
                  ৳{post.collectedAmount.toLocaleString()}
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", marginBottom: "0.2rem" }}>{t("remaining")}</p>
                <p style={{ fontWeight: "800", color: "var(--color-accent)", fontSize: "1.25rem" }}>
                  ৳{post.remainingAmount.toLocaleString()}
                </p>
              </div>
            </div>

            {user?.role === 'student' ? (
              <div
                style={{
                  padding: '1.25rem',
                  backgroundColor: 'rgba(13, 148, 136, 0.08)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(13, 148, 136, 0.3)',
                  textAlign: 'center',
                }}
              >
                <p style={{ fontSize: '0.9rem', color: 'var(--color-primary-dark)', fontWeight: '700', marginBottom: '0.75rem' }}>
                  শিক্ষার্থী অ্যাকাউন্ট থেকে অনুদান প্রদান প্রযোজ্য নয়। আপনি শিক্ষা সহায়তার আবেদন করতে পারেন।
                </p>
                <Link
                  href="/posts/create"
                  className="btn btn-primary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.6rem 1.25rem',
                    fontSize: '0.9rem',
                    textDecoration: 'none',
                    fontWeight: '700',
                  }}
                >
                  <PlusCircle size={16} />
                  নতুন আবেদন তৈরি করুন
                </Link>
              </div>
            ) : (
              <Link
                href={`/${locale}/donate?postId=${post.id}&amount=${post.remainingAmount}`}
                className="btn btn-primary"
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "0.5rem",
                  width: "100%",
                  padding: "0.9rem",
                  fontSize: "1.1rem",
                  fontWeight: "700",
                  textDecoration: "none",
                  borderRadius: "var(--radius-md)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <Heart size={20} fill="currentColor" />
                {tDonation("title")}
              </Link>
            )}

            <div style={{ marginTop: "1.25rem", textAlign: "center" }}>
              <p style={{ fontSize: "0.825rem", color: "var(--color-text-muted)" }}>
                ১০০% অর্থ সরাসরি এই শিক্ষার্থীর শিক্ষাব্যয় নির্বাহে ব্যবহৃত হবে।
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
