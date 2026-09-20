'use client';

import React, { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from '../../../i18n/routing';
import {
  UserCheck,
  CheckCircle2,
  Heart,
} from 'lucide-react';
import { useAuthStore, getRoleDashboardPath } from '../../../lib/auth-store';
import PortalLayout, { PortalNavItem } from '../../../components/layout/PortalLayout';
import { getApiUrl } from '../../../lib/api-config';
import EReceiptModal, { ReceiptData } from '../../../components/portal/EReceiptModal';
import AffiliationApplyModal from '../../../components/portal/AffiliationApplyModal';
import DonationLedgerTable from '../../../components/portal/DonationLedgerTable';
import VerificationStatusView from '../../../components/portal/VerificationStatusView';

export default function TeacherDashboardPage() {
  const locale = useLocale();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const loadingAuth = useAuthStore((s) => s.loading);

  const [activeTab, setActiveTab] = useState<'verification' | 'donations'>('verification');
  const [teacherPendingPosts, setTeacherPendingPosts] = useState<any[]>([]);
  const [affiliationData, setAffiliationData] = useState<{
    hasAffiliated: boolean;
    status: 'unapplied' | 'pending_org' | 'pending_admin' | 'verified' | 'rejected';
    profile: any;
    organization: any;
  } | null>(null);
  const [isAffiliationModalOpen, setIsAffiliationModalOpen] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);

  // Role Protection Guard
  useEffect(() => {
    if (!loadingAuth) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'teacher') {
        router.replace(getRoleDashboardPath(user.role) as any);
      }
    }
  }, [user, loadingAuth, router]);

  const loadData = async () => {
    if (!firebaseUser || !user) return;
    try {
      setLoadingData(true);
      const token = await firebaseUser.getIdToken();
      const apiUrl = getApiUrl();
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Fetch Affiliation status
      try {
        const affRes = await fetch(`${apiUrl}/users/my-affiliation`, { headers });
        if (affRes.ok) {
          const affData = await affRes.json();
          setAffiliationData(affData);
        }
      } catch (e) {
        console.error('Failed to load teacher affiliation status:', e);
      }

      // 2. Fetch posts pending teacher review
      try {
        const res = await fetch(`${apiUrl}/posts/teacher-pending`, { headers });
        if (res.ok) {
          setTeacherPendingPosts(await res.json());
        }
      } catch (err) {
        console.error('Failed to load teacher pending posts', err);
      }
    } catch (err) {
      console.error('Failed to load teacher dashboard data', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'teacher') {
      loadData();
      // Live polling every 6 seconds if not verified
      const timer = setInterval(() => {
        loadData();
      }, 6000);
      return () => clearInterval(timer);
    }
  }, [firebaseUser, user]);

  const handleTeacherVerify = async (postId: string) => {
    if (!confirm('আপনি কি এই শিক্ষার্থীর আবেদনটির সত্যতা সত্যায়ন করতে চান?')) return;
    try {
      const token = await firebaseUser?.getIdToken();
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/posts/${postId}/teacher-verify`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setFeedback('আবেদনটি সফলভাবে শিক্ষক সত্যায়ন সম্পন্ন হয়েছে!');
        setTeacherPendingPosts((prev) => prev.filter((p) => p.id !== postId));
      }
    } catch (err) {
      console.error('Failed to verify post', err);
    }
  };

  if (loadingAuth || !user) {
    return (
      <div className="container" style={{ paddingTop: '6rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>লোড হচ্ছে...</p>
      </div>
    );
  }

  const isVerified = affiliationData?.status === 'verified';

  // Navigation tabs unlock ONLY when teacher is verified
  const navItems: PortalNavItem[] = isVerified
    ? [
        {
          id: 'verification',
          labelBn: 'শিক্ষার্থী সত্যায়ন',
          labelEn: 'Student Verification',
          icon: UserCheck,
          badge: teacherPendingPosts.length,
        },
        {
          id: 'donations',
          labelBn: 'অনুদান রেকর্ড',
          labelEn: 'Donations Record',
          icon: Heart,
        },
      ]
    : [];

  return (
    <PortalLayout
      role="teacher"
      roleNameBn="শিক্ষক প্যানেল"
      roleNameEn="Teacher Portal"
      roleIcon={UserCheck}
      navItems={navItems}
      activeNav={activeTab}
      onNavSelect={(id: any) => setActiveTab(id)}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Section Header (Only shown when teacher is verified/unlocked) */}
        {isVerified && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              {activeTab === 'verification' ? 'শিক্ষার্থী আবেদন সত্যায়ন' : 'ব্যক্তিগত অনুদান রেকর্ড'}
            </h1>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
              {activeTab === 'verification'
                ? 'আপনার প্রতিষ্ঠানের শিক্ষার্থীদের আর্থিক সহায়তা আবেদনের নিরীক্ষা ও ডিজিটাল সত্যায়ন সম্পন্ন করুন'
                : 'প্ল্যাটফর্মে আপনার ব্যক্তিগত অনুদান রেকর্ড ও অডিট রসিদসমূহ'}
            </p>
          </div>
        )}

        {feedback && (
          <div
            style={{
              padding: '1rem',
              backgroundColor: 'rgba(5, 150, 105, 0.1)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid #059669',
              color: '#047857',
              fontWeight: 700,
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <CheckCircle2 size={18} />
            <span>{feedback}</span>
          </div>
        )}

        {/* Verification / Locked State Check via Unified Component */}
        {!isVerified ? (
          <VerificationStatusView
            status={affiliationData?.status || 'unapplied'}
            role="teacher"
            organizationName={affiliationData?.organization?.name || affiliationData?.profile?.orgName}
            rejectionReason={affiliationData?.profile?.rejectionReason}
            onApply={() => setIsAffiliationModalOpen(true)}
            onChangeInstitution={() => setIsAffiliationModalOpen(true)}
          />
        ) : (
          activeTab === 'verification' ? (
            <div
              style={{
                padding: '1.75rem',
                backgroundColor: 'var(--surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--surface-border)',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
                  শিক্ষার্থী সত্যায়নের জন্য অপেক্ষমান তালিকা
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.35rem' }}>
                  আপনার শিক্ষা প্রতিষ্ঠান ({affiliationData?.organization?.name || 'অনুমোদিত প্রতিষ্ঠান'}) এর শিক্ষার্থীদের আর্থিক আবেদন পরীক্ষা ও সত্যায়ন করুন।
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {loadingData ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>লোড হচ্ছে...</div>
                ) : teacherPendingPosts.length === 0 ? (
                  <div
                    style={{
                      padding: '3rem 1rem',
                      textAlign: 'center',
                      backgroundColor: 'var(--background)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--surface-border)',
                    }}
                  >
                    <CheckCircle2 size={36} color="var(--primary)" style={{ margin: '0 auto 0.5rem' }} />
                    <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
                      বর্তমানে কোনো আবেদন অপেক্ষমান নেই
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.35rem 0 0' }}>
                      আপনার প্রতিষ্ঠানের কোনো শিক্ষার্থী নতুন আবেদন দাখিল করলে এখানে তাৎক্ষণিক প্রদর্শিত হবে।
                    </p>
                  </div>
                ) : (
                  teacherPendingPosts.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '1.25rem',
                        backgroundColor: 'var(--background)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--surface-border)',
                        flexWrap: 'wrap',
                        gap: '1rem',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: '280px' }}>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
                          {item.studentName} • {item.title}
                        </h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.3rem 0 0' }}>
                          প্রয়োজনীয় অর্থ: <strong style={{ color: 'var(--primary)' }}>৳{Number(item.amount).toLocaleString()}</strong> • ইমেইল: {item.studentEmail}
                        </p>
                        <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
                          বিবরণ: {item.problemDesc}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleTeacherVerify(item.id)}
                        className="btn btn-primary"
                        style={{
                          padding: '0.65rem 1.35rem',
                          fontSize: '0.88rem',
                          fontWeight: '700',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          cursor: 'pointer',
                        }}
                      >
                        <CheckCircle2 size={16} /> সত্যায়ন সম্পন্ন করুন
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* TAB 2: Personal Donations via Centralized Component */
            <DonationLedgerTable
              firebaseUser={firebaseUser}
              locale={locale}
              onOpenReceipt={(r) => setSelectedReceipt(r)}
              donorDisplayName={user.fullName || 'শিক্ষক প্রতিনিধি'}
              titleBn="আমার অনুদান খতিয়ান"
              titleEn="Personal Donation Ledger"
              subtitleBn="সাদাকাহ প্ল্যাটফর্মে আপনার দেওয়া অনুদানের তালিকা ও রসিদসমূহ।"
              subtitleEn="Verified records of contributions you made."
            />
          )
        )}

        {/* E-Receipt Modal */}
        {selectedReceipt && (
          <EReceiptModal receipt={selectedReceipt} onClose={() => setSelectedReceipt(null)} />
        )}

        {/* Affiliation Apply Modal */}
        <AffiliationApplyModal
          isOpen={isAffiliationModalOpen}
          onClose={() => setIsAffiliationModalOpen(false)}
          role="teacher"
          onSuccess={() => {
            setIsAffiliationModalOpen(false);
            loadData();
          }}
          initialData={affiliationData?.profile}
        />
      </div>
    </PortalLayout>
  );
}
