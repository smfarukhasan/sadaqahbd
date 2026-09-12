'use client';

import React from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { ShieldCheck, CheckCircle2, User, Building, Heart, ArrowLeft } from "lucide-react";

// Mock post detail for demonstration
const mockPostDetail = {
  id: "post-1",
  title: "মেডিকেল ৪র্থ বর্ষের টিউশন ও হোস্টেল ফি",
  studentName: "রাফিয়া আক্তার",
  institution: "ময়মনসিংহ মেডিকেল কলেজ",
  department: "এমবিবিএস (৪র্থ বর্ষ)",
  session: "২০২১-২০২২",
  description:
    "আমার বাবা একজন ক্ষুদ্র কৃষক। গত মাসে স্ট্রোক করার পর থেকে তিনি সম্পূর্ণ শয্যাশায়ী এবং পরিবারের একমাত্র উপার্জন বন্ধ হয়ে গেছে। পরিবারে ছোট দুটি ভাই-বোন রয়েছে। আমার ৪র্থ বর্ষের চূড়ান্ত পরীক্ষা সন্নিকটে, যার জন্য বিশ্ববিদ্যালয়ের বকেয়া টিউশন ফি ও হোস্টেল চার্জ পরিশোধ করা জরুরি। আপনাদের সাদাকাহ ও জাকাত ফান্ড থেকে সহায়তা পেলে আমার শিক্ষা জীবন রক্ষা পাবে।",
  totalRequired: 45000,
  collectedAmount: 28000,
  remainingAmount: 17000,
  isDoubleVerified: true,
  verifiedByTeacher: "ড. মো. রফিকুল ইসলাম (সহযোগী অধ্যাপক)",
  verifiedByOrg: "ময়মনসিংহ মেডিকেল কলেজ প্রশাসন",
  expenses: [
    { id: "exp-1", category: "বিশ্ববিদ্যালয় সেমিস্টার ও পরীক্ষা ফি", amount: 24000 },
    { id: "exp-2", category: "হোস্টেল বকেয়া ও মিল চার্জ", amount: 14000 },
    { id: "exp-3", category: "মেডিকেল ক্লিনিক্যাল বই ও সরঞ্জাম", amount: 7000 },
  ],
};

export default function PostDetailPage() {
  const locale = useLocale();
  const t = useTranslations("StudentPost");
  const tCommon = useTranslations("Common");
  const tDonation = useTranslations("Donation");

  const post = mockPostDetail;
  const progressPercent = Math.min(
    100,
    Math.round((post.collectedAmount / post.totalRequired) * 100)
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
                    backgroundColor: "rgba(13, 148, 136, 0.12)",
                    color: "var(--color-primary)",
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

            <h1 style={{ fontSize: "1.85rem", fontWeight: "800", color: "var(--color-primary-dark)", lineHeight: "1.3" }}>
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
              {post.expenses.map((expense, idx) => (
                <div
                  key={expense.id}
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
