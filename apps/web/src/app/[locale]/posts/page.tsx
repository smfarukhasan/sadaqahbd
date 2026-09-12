'use client';

import React from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { CheckCircle2, ShieldCheck, Heart, ArrowRight } from "lucide-react";

// Mock/Initial verified posts data for demonstration before DB connection
const mockPosts = [
  {
    id: "post-1",
    title: "মেডিকেল ৪র্থ বর্ষের টিউশন ও হোস্টেল ফি",
    studentName: "রাফিয়া আক্তার",
    institution: "ময়মনসিংহ মেডিকেল কলেজ",
    description: "পিতার আকস্মিক অসুস্থতার কারণে পরিবারের আর্থিক অবস্থা ভেঙে পড়েছে। আগামী পরীক্ষার ফি এবং হোস্টেল খরচের জন্য সহায়তা প্রয়োজন।",
    totalRequired: 45000,
    collectedAmount: 28000,
    remainingAmount: 17000,
    isDoubleVerified: true,
  },
  {
    id: "post-2",
    title: "ডিপ্লোমা ইন কম্পিউটার ইঞ্জিনিয়ারিং সেমিস্টার ও ল্যাব ফি",
    studentName: "তানভীর আহমেদ",
    institution: "ঢাকা পলিটেকনিক ইনস্টিটিউট",
    description: "পিতা দিনমজুর, সেমিস্টার পরীক্ষার রেজিস্ট্রেশন ও ব্যবহারিক খাতা কেনার ফি প্রদানে অক্ষম।",
    totalRequired: 22000,
    collectedAmount: 15500,
    remainingAmount: 6500,
    isDoubleVerified: true,
  },
  {
    id: "post-3",
    title: "অনার্স শেষ বর্ষের সেমিস্টার ও গবেষণা ফি",
    studentName: "আব্দুল্লাহ আল মামুন",
    institution: "রাজশাহী বিশ্ববিদ্যালয়",
    description: "পরিবারে একমাত্র উপার্জনক্ষম ব্যক্তি বড় ভাই কর্মহীন হয়ে পড়ায় শেষ বর্ষের সেমিস্টার ফি আটকে আছে।",
    totalRequired: 18000,
    collectedAmount: 6000,
    remainingAmount: 12000,
    isDoubleVerified: false,
  }
];

export default function PostsPage() {
  const locale = useLocale();
  const t = useTranslations("StudentPost");
  const tCommon = useTranslations("Common");

  return (
    <div className="container" style={{ paddingTop: "2.5rem", paddingBottom: "5rem" }}>
      {/* Page Header */}
      <div style={{ textAlign: "center", maxWidth: "700px", margin: "0 auto 3rem auto" }}>
        <h1 style={{ fontSize: "2.25rem", fontWeight: "800", color: "var(--color-primary-dark)", marginBottom: "0.75rem" }}>
          {tCommon("explorePosts")}
        </h1>
        <p style={{ color: "var(--color-text-muted)", fontSize: "1.05rem", lineHeight: "1.6" }}>
          প্রতিটি অনুদান পৌঁছে যাক প্রকৃত অভাবী শিক্ষার্থীদের শিক্ষা জীবন সুরক্ষায়। স্বচ্ছতা ও শিক্ষক-প্রতিষ্ঠানের যাচাইকৃত তথ্যের নিশ্চয়তা।
        </p>
      </div>

      {/* Posts Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.75rem" }}>
        {mockPosts.map((post) => {
          const progressPercent = Math.min(100, Math.round((post.collectedAmount / post.totalRequired) * 100));

          return (
            <div
              key={post.id}
              className="card"
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                padding: "1.5rem",
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-surface)",
                boxShadow: "var(--shadow-sm)",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
              }}
            >
              <div>
                {/* Verification Badge */}
                <div style={{ marginBottom: "0.85rem" }}>
                  {post.isDoubleVerified ? (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        padding: "0.3rem 0.65rem",
                        backgroundColor: "rgba(13, 148, 136, 0.12)",
                        color: "var(--color-primary)",
                        borderRadius: "var(--radius-full)",
                        fontSize: "0.8rem",
                        fontWeight: "600",
                      }}
                    >
                      <ShieldCheck size={16} />
                      {t("doubleVerifiedBadge")}
                    </span>
                  ) : (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        padding: "0.3rem 0.65rem",
                        backgroundColor: "rgba(59, 130, 246, 0.12)",
                        color: "#2563eb",
                        borderRadius: "var(--radius-full)",
                        fontSize: "0.8rem",
                        fontWeight: "600",
                      }}
                    >
                      <CheckCircle2 size={16} />
                      {t("orgVerifiedBadge")}
                    </span>
                  )}
                </div>

                {/* Post Title */}
                <h2 style={{ fontSize: "1.25rem", fontWeight: "700", marginBottom: "0.4rem", color: "var(--color-text)" }}>
                  <Link href={`/${locale}/posts/${post.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                    {post.title}
                  </Link>
                </h2>

                {/* Student details */}
                <p style={{ fontSize: "0.9rem", color: "var(--color-primary-dark)", fontWeight: "600", marginBottom: "0.75rem" }}>
                  {post.studentName} • <span style={{ color: "var(--color-text-muted)", fontWeight: "400" }}>{post.institution}</span>
                </p>

                {/* Description excerpt */}
                <p style={{ fontSize: "0.925rem", color: "var(--color-text-muted)", lineHeight: "1.55", marginBottom: "1.5rem" }}>
                  {post.description}
                </p>
              </div>

              {/* Progress & Financial Breakdown */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", marginBottom: "0.35rem", fontWeight: "600" }}>
                  <span style={{ color: "var(--color-primary)" }}>{t("received")}: ৳{post.collectedAmount.toLocaleString()}</span>
                  <span style={{ color: "var(--color-text-muted)" }}>{progressPercent}%</span>
                </div>

                {/* Progress Bar */}
                <div style={{ width: "100%", height: "8px", backgroundColor: "var(--color-border)", borderRadius: "var(--radius-full)", overflow: "hidden", marginBottom: "0.85rem" }}>
                  <div
                    style={{
                      width: `${progressPercent}%`,
                      height: "100%",
                      backgroundColor: "var(--color-primary)",
                      borderRadius: "var(--radius-full)",
                      transition: "width 0.5s ease",
                    }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.825rem", color: "var(--color-text-muted)", marginBottom: "1.25rem" }}>
                  <span>{t("totalRequired")}: ৳{post.totalRequired.toLocaleString()}</span>
                  <span style={{ color: "var(--color-accent)", fontWeight: "600" }}>
                    {t("remaining")}: ৳{post.remainingAmount.toLocaleString()}
                  </span>
                </div>

                {/* Action Buttons */}
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <Link
                    href={`/${locale}/donate?postId=${post.id}&amount=${post.remainingAmount}`}
                    className="btn btn-primary"
                    style={{
                      flex: 1,
                      justifyContent: "center",
                      textDecoration: "none",
                      padding: "0.65rem 1rem",
                      fontSize: "0.95rem",
                    }}
                  >
                    <Heart size={16} fill="currentColor" />
                    {tCommon("donateNow")}
                  </Link>
                  <Link
                    href={`/${locale}/posts/${post.id}`}
                    className="btn btn-outline"
                    style={{
                      padding: "0.65rem 0.85rem",
                      textDecoration: "none",
                      color: "var(--color-text)",
                    }}
                  >
                    <ArrowRight size={18} />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
