'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import {
  GraduationCap,
  Building,
  UserCheck,
  Heart,
  MessageSquareWarning,
  PlusCircle,
  FileCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
} from 'lucide-react';
import { UserRole } from '@sadaqahbd/schema';

export default function UserPortalPage() {
  const locale = useLocale();
  const t = useTranslations('Portal');
  const tPost = useTranslations('StudentPost');
  const tCommon = useTranslations('Common');

  // Active simulated user role for portal viewing (Student, Teacher, Org, Donor)
  const [currentRole, setCurrentRole] = useState<string>(UserRole.STUDENT);

  // Student complaint form state
  const [complaintSubject, setComplaintSubject] = useState('');
  const [complaintDesc, setComplaintDesc] = useState('');
  const [complaintSubmitted, setComplaintSubmitted] = useState(false);

  // Student profile mock verification state
  const [studentVerificationStatus, setStudentVerificationStatus] = useState<
    'unsubmitted' | 'pending' | 'verified'
  >('verified');

  const handleComplaintSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintSubject || !complaintDesc) return;
    setComplaintSubmitted(true);
    setComplaintSubject('');
    setComplaintDesc('');
  };

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '5rem' }}>
      {/* Role Switcher for demonstration/testing */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          backgroundColor: 'var(--color-surface)',
          padding: '0.75rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          marginBottom: '2rem',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--color-text-muted)' }}>
          পোর্টাল ভিউ পরিবর্তন করুন:
        </span>
        {[
          { label: 'শিক্ষার্থী (Student)', role: UserRole.STUDENT },
          { label: 'শিক্ষক (Teacher)', role: UserRole.TEACHER },
          { label: 'প্রতিষ্ঠান (Organization)', role: UserRole.ORGANIZATION },
          { label: 'ডোনার (Donor)', role: UserRole.DONOR },
        ].map((item) => (
          <button
            key={item.role}
            onClick={() => {
              setCurrentRole(item.role);
              setComplaintSubmitted(false);
            }}
            className={`btn ${currentRole === item.role ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* ---------------- 1. STUDENT VIEW ---------------- */}
      {currentRole === UserRole.STUDENT && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--color-primary-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <GraduationCap size={28} /> শিক্ষার্থী ড্যাশবোর্ড
              </h1>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
                প্রতিষ্ঠান: <strong>ঢাকা পলিটেকনিক ইনস্টিটিউট</strong> | স্ট্যাটাস:
                <span style={{ color: 'var(--color-primary)', fontWeight: '700', marginLeft: '0.35rem' }}>
                  {studentVerificationStatus === 'verified' ? '✓ ভেরিফাইড শিক্ষার্থী' : 'অনুমোদন প্রক্রিয়াধীন'}
                </span>
              </p>
            </div>

            {studentVerificationStatus === 'verified' ? (
              <Link href={`/${locale}/posts/create`} className="btn btn-primary" style={{ textDecoration: 'none' }}>
                <PlusCircle size={18} /> {t('newPost')}
              </Link>
            ) : (
              <button disabled className="btn btn-outline" style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                ভেরিফিকেশন সম্পন্ন হলে পোস্ট দিতে পারবেন
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.75rem' }}>
            {/* My Posts Card */}
            <div className="card" style={{ padding: '1.5rem', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '1rem' }}>
                {t('myPosts')}
              </h2>

              <div style={{ padding: '1rem', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>ডিপ্লোমা ইন কম্পিউটার ল্যাব ফি</h3>
                  <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', backgroundColor: 'rgba(13, 148, 136, 0.15)', color: 'var(--color-primary)', borderRadius: '4px', fontWeight: '600' }}>
                    লাইভ (চলমান)
                  </span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
                  প্রয়োজন: ৳২২,০০০ | সংগৃহীত: ৳১৫,৫০০ | বাকি: ৳৬,৫০০
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--color-primary)' }}>
                  <span>✓ শিক্ষক অনুমোদিত</span>
                  <span>•</span>
                  <span>✓ প্রতিষ্ঠান অনুমোদিত</span>
                </div>
              </div>
            </div>

            {/* Direct Super Admin Complaint Ticket Box */}
            <div className="card" style={{ padding: '1.5rem', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MessageSquareWarning size={20} color="var(--color-accent)" />
                {t('submitComplaint')}
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                প্রতিষ্ঠান বা শিক্ষকদের কোনো অনিয়ম বা সাহায্য প্রাপ্তির সমস্যা সরাসরি প্ল্যাটফর্মের সুপার এডমিনের নজরে আনুন।
              </p>

              {complaintSubmitted ? (
                <div style={{ padding: '1rem', backgroundColor: 'rgba(13, 148, 136, 0.1)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-primary)', color: 'var(--color-primary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', fontWeight: '700' }}>
                    <CheckCircle2 size={18} /> অভিযোগ সফলভাবে দাখিল হয়েছে!
                  </div>
                  <p style={{ fontSize: '0.85rem' }}>{t('complaintAutoReply')}</p>
                </div>
              ) : (
                <form onSubmit={handleComplaintSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                      {t('complaintSubject')}
                    </label>
                    <input
                      type="text"
                      required
                      value={complaintSubject}
                      onChange={(e) => setComplaintSubject(e.target.value)}
                      placeholder="যেমন: অনুদানের অর্থ প্রাপ্তিতে বিলম্ব বা প্রতিষ্ঠানের সহায়তা না পাওয়া"
                      style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.9rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                      {t('complaintDesc')}
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={complaintDesc}
                      onChange={(e) => setComplaintDesc(e.target.value)}
                      placeholder="ঘটনার পূর্ণ বিবরণ লিখুন..."
                      style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.9rem' }}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                    <Send size={16} /> অভিযোগ পাঠান
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 2. TEACHER VIEW ---------------- */}
      {currentRole === UserRole.TEACHER && (
        <div>
          <div style={{ marginBottom: '1.75rem' }}>
            <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--color-primary-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserCheck size={28} /> শিক্ষক প্যানেল
            </h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
              দায়িত্বপ্রাপ্ত শিক্ষা প্রতিষ্ঠান: <strong>ঢাকা পলিটেকনিক ইনস্টিটিউট</strong>
            </p>
          </div>

          <div className="card" style={{ padding: '1.5rem', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '1rem' }}>
              শিক্ষার্থীর আবেদন যাচাই ও অনুমোদন (Double Verification)
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
              আপনার প্রত্যয়নের পর পোস্টটি "ডাবল ভেরিফাইড" হিসেবে সুপার এডমিনের চূড়ান্ত রিভিউতে প্রেরিত হবে।
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>তানভীর আহমেদ (রোল: ৪৫০১২১)</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  পোস্ট: ডিপ্লোমা ইন কম্পিউটার ল্যাব ফি (টাকা: ৳২২,০০০)
                </p>
              </div>
              <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                <CheckCircle2 size={16} /> {t('verifyPost')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 3. ORGANIZATION VIEW ---------------- */}
      {currentRole === UserRole.ORGANIZATION && (
        <div>
          <div style={{ marginBottom: '1.75rem' }}>
            <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--color-primary-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Building size={28} /> শিক্ষা প্রতিষ্ঠান ড্যাশবোর্ড
            </h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
              প্রতিষ্ঠান: <strong>ঢাকা পলিটেকনিক ইনস্টিটিউট</strong> | স্ট্যাটাস: <strong style={{ color: 'var(--color-primary)' }}>✓ ভেরিফাইড প্রতিষ্ঠান</strong>
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            <div className="card" style={{ padding: '1.5rem', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.75rem' }}>
                শিক্ষক নিবন্ধন আবেদন (২)
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                প্রতিষ্ঠানের শিক্ষক হিসেবে আবেদনকারী তালিকা যাচাই করে অনুমোদন করুন।
              </p>
            </div>

            <div className="card" style={{ padding: '1.5rem', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.75rem' }}>
                শিক্ষার্থী NID ও প্রোফাইল ভেরিফিকেশন (৪)
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                শিক্ষার্থীদের জমাকৃত জন্মনিবন্ধন/এনআইডি ও ছবি যাচাই করে ছাড়পত্র প্রদান করুন।
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 4. DONOR VIEW ---------------- */}
      {currentRole === UserRole.DONOR && (
        <div>
          <div style={{ marginBottom: '1.75rem' }}>
            <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--color-primary-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Heart size={28} color="var(--color-primary)" /> {t('donationHistory')}
            </h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
              আপনার প্রতিটি দানের বিস্তারিত ট্র্যাকিং ও হিসাব বিবরণী।
            </p>
          </div>

          <div className="card" style={{ padding: '1.5rem', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem' }}>তারিখ</th>
                    <th style={{ padding: '0.75rem' }}>সহায়তাপ্রাপ্ত</th>
                    <th style={{ padding: '0.75rem' }}>পরিমাণ</th>
                    <th style={{ padding: '0.75rem' }}>মাধ্যম ও ট্রানজেকশন</th>
                    <th style={{ padding: '0.75rem' }}>স্ট্যাটাস</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '0.75rem' }}>১২ সেপ্টেম্বর ২০২৬</td>
                    <td style={{ padding: '0.75rem', fontWeight: '600' }}>রাফিয়া আক্তার (মেডিকেল ফি)</td>
                    <td style={{ padding: '0.75rem', color: 'var(--color-primary)', fontWeight: '700' }}>৳৫,০০০</td>
                    <td style={{ padding: '0.75rem' }}>bKash (<code>TRX987214</code>)</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{ padding: '0.2rem 0.5rem', backgroundColor: 'rgba(13, 148, 136, 0.15)', color: 'var(--color-primary)', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600' }}>
                        সফল (Approved)
                      </span>
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '0.75rem' }}>০৫ সেপ্টেম্বর ২০২৬</td>
                    <td style={{ padding: '0.75rem', fontWeight: '600' }}>সাধারণ ফান্ড (র্যান্ডম অনুদান)</td>
                    <td style={{ padding: '0.75rem', color: 'var(--color-primary)', fontWeight: '700' }}>৳২,৫০০</td>
                    <td style={{ padding: '0.75rem' }}>Nagad (<code>TRX332145</code>)</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{ padding: '0.2rem 0.5rem', backgroundColor: 'rgba(13, 148, 136, 0.15)', color: 'var(--color-primary)', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600' }}>
                        সফল (Approved)
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
