'use client';

import React, { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from '../../../i18n/routing';
import {
  UserCheck,
  CheckCircle2,
  Heart,
  Eye,
  FileText,
} from 'lucide-react';
import { useAuthStore, getRoleDashboardPath } from '../../../lib/auth-store';
import PortalLayout, { PortalNavItem } from '../../../components/layout/PortalLayout';
import { getApiUrl } from '../../../lib/api-config';
import { getAuthToken } from '../../../lib/auth-token';
import EReceiptModal, { ReceiptData } from '../../../components/portal/EReceiptModal';
import AffiliationApplyModal from '../../../components/portal/AffiliationApplyModal';
import DonationLedgerTable from '../../../components/portal/DonationLedgerTable';
import VerificationStatusView from '../../../components/portal/VerificationStatusView';
import StudentDetailsModal from '../../../components/portal/StudentDetailsModal';

import MyDonationsSection from '../../../components/portal/MyDonationsSection';

export default function TeacherDashboardPage() {
  const locale = useLocale();
  const isBn = locale === 'bn';
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const loadingAuth = useAuthStore((s) => s.loading);

  const [activeTab, setActiveTab] = useState<'verification' | 'my-donations' | 'donations'>('verification');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const tabParam = new URLSearchParams(window.location.search).get('tab');
      if (tabParam === 'my-donations' || tabParam === 'verification' || tabParam === 'donations') {
        setActiveTab(tabParam as any);
      }
    }
  }, []);
  const [teacherPendingPosts, setTeacherPendingPosts] = useState<any[]>([]);
  const [affiliationData, setAffiliationData] = useState<{
    hasAffiliated: boolean;
    status: 'unapplied' | 'pending_org' | 'pending_admin' | 'verified' | 'active' | 'rejected';
    profile: any;
    organization: any;
  } | null>(null);
  const [isAffiliationModalOpen, setIsAffiliationModalOpen] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

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
    if (!user) return;
    try {
      const token = await getAuthToken();
      if (!token) return;
      const apiUrl = getApiUrl();
      const headers = { Authorization: `Bearer ${token}` };

      // Parallelize fetching affiliation status and teacher pending posts
      const [affRes, postsRes] = await Promise.all([
        fetch(`${apiUrl}/users/my-affiliation`, { headers }).catch((err) => {
          console.error('Failed to load teacher affiliation status:', err);
          return null;
        }),
        fetch(`${apiUrl}/posts/teacher-pending`, { headers }).catch((err) => {
          console.error('Failed to load teacher pending posts:', err);
          return null;
        }),
      ]);

      if (affRes && affRes.ok) {
        const affData = await affRes.json().catch(() => null);
        if (affData) setAffiliationData(affData);
      }

      if (postsRes && postsRes.ok) {
        const postsData = await postsRes.json().catch(() => null);
        if (Array.isArray(postsData)) setTeacherPendingPosts(postsData);
      }
    } catch (err) {
      console.error('Failed to load teacher dashboard data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'teacher') {
      loadData();
      // Only live poll if unverified (waiting for institution or admin review)
      if (affiliationData?.status !== 'verified') {
        const timer = setInterval(() => {
          loadData();
        }, 8000);
        return () => clearInterval(timer);
      }
    }
  }, [user, affiliationData?.status]);

  const handleTeacherVerify = async (postId: string) => {
    if (!confirm('আপনি কি এই শিক্ষার্থীর আবেদনটির সত্যতা সত্যায়ন করতে চান?')) return;
    try {
      const token = await getAuthToken();
      if (!token) return;
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

  const isVerified = affiliationData?.status === 'verified';

  if (loadingAuth || !user) {
    return (
      <div className="container" style={{ paddingTop: '6rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>লোড হচ্ছে...</p>
      </div>
    );
  }

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
          id: 'my-donations',
          labelBn: 'আমার দান সমূহ',
          labelEn: 'My Donations',
          icon: Heart,
        },
        {
          id: 'donations',
          labelBn: 'গ্লোবাল রেকর্ড',
          labelEn: 'Global Ledger',
          icon: FileText,
        },
      ]
    : [
        {
          id: 'my-donations',
          labelBn: 'আমার দান সমূহ',
          labelEn: 'My Donations',
          icon: Heart,
        },
      ];

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
        {loadingData && !affiliationData ? (
          <div style={{ padding: '1.5rem 0' }}>
            <div style={{ height: '28px', width: '240px', backgroundColor: 'var(--surface-border, #e2e8f0)', borderRadius: '8px', marginBottom: '10px' }} />
            <div style={{ height: '16px', width: '340px', backgroundColor: 'var(--surface-border-subtle, #f1f5f9)', borderRadius: '6px', marginBottom: '2rem' }} />
            <div style={{ height: '240px', backgroundColor: 'var(--surface, #ffffff)', border: '1px solid var(--surface-border, #e2e8f0)', borderRadius: '16px' }} />
          </div>
        ) : !isVerified ? (
          <VerificationStatusView
            status={affiliationData?.status || 'unapplied'}
            role="teacher"
            organizationName={affiliationData?.organization?.name || affiliationData?.profile?.orgName}
            rejectionReason={affiliationData?.profile?.rejectionReason}
            onApply={() => setIsAffiliationModalOpen(true)}
            onChangeInstitution={() => setIsAffiliationModalOpen(true)}
          />
        ) : (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                {activeTab === 'verification'
                  ? (isBn ? 'শিক্ষার্থী আবেদন সত্যায়ন' : 'Student Campaign Verification')
                  : (isBn ? 'ব্যক্তিগত অনুদান রেকর্ড' : 'Personal Donation Records')}
              </h1>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
                {activeTab === 'verification'
                  ? (isBn
                      ? 'আপনার প্রতিষ্ঠানের শিক্ষার্থীদের আর্থিক সহায়তা আবেদনের নিরীক্ষা ও ডিজিটাল সত্যায়ন সম্পন্ন করুন'
                      : 'Audit and digitally certify financial aid requests from your institution students')
                  : (isBn
                      ? 'প্ল্যাটফর্মে আপনার ব্যক্তিগত অনুদান রেকর্ড ও অডিট রসিদসমূহ'
                      : 'Your personal platform donation history and verified e-receipts')}
              </p>
            </div>

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

            {activeTab === 'verification' ? (
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
                  {isBn ? 'শিক্ষার্থী সত্যায়নের জন্য অপেক্ষমান তালিকা' : 'Pending Student Verification Queue'}
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.35rem' }}>
                  {isBn
                    ? `আপনার শিক্ষা প্রতিষ্ঠান (${affiliationData?.organization?.name || 'অনুমোদিত প্রতিষ্ঠান'}) এর শিক্ষার্থীদের আর্থিক আবেদন পরীক্ষা ও সত্যায়ন করুন।`
                    : `Review and authenticate financial aid requests from students at ${affiliationData?.organization?.name || 'your institution'}.`}
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {loadingData ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    {isBn ? 'লোড হচ্ছে...' : 'Loading...'}
                  </div>
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
                      {isBn ? 'বর্তমানে কোনো আবেদন অপেক্ষমান নেই' : 'No Pending Verifications'}
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.35rem 0 0' }}>
                      {isBn
                        ? 'আপনার প্রতিষ্ঠানের কোনো শিক্ষার্থী নতুন আবেদন দাখিল করলে এখানে তাৎক্ষণিক প্রদর্শিত হবে।'
                        : 'New student applications from your institution will appear here as soon as submitted.'}
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
                          {isBn ? 'প্রয়োজনীয় অর্থ: ' : 'Required Amount: '}
                          <strong style={{ color: 'var(--primary)' }}>৳{Number(item.amount).toLocaleString()}</strong> • {isBn ? 'ইমেইল: ' : 'Email: '}{item.studentEmail}
                        </p>
                        <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
                          {isBn ? 'বিবরণ: ' : 'Details: '}{item.problemDesc}
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedStudentId(item.studentId)}
                          style={{
                            padding: '0.65rem 1rem',
                            fontSize: '0.85rem',
                            fontWeight: '700',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            background: '#eff6ff',
                            color: '#1d4ed8',
                            border: '1px solid #bfdbfe',
                            borderRadius: '8px',
                            cursor: 'pointer',
                          }}
                        >
                          <Eye size={16} />
                          {locale === 'bn' ? 'শিক্ষার্থীর বিস্তারিত' : 'Student Details'}
                        </button>
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
                          <CheckCircle2 size={16} /> {locale === 'bn' ? 'সত্যায়ন সম্পন্ন করুন' : 'Verify'}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : activeTab === 'my-donations' ? (
            <MyDonationsSection />
          ) : (
            /* TAB 3: Global Ledger Table */
            <DonationLedgerTable
              firebaseUser={firebaseUser}
              locale={locale}
              onOpenReceipt={(r) => setSelectedReceipt(r)}
              donorDisplayName={user.fullName || 'শিক্ষক প্রতিনিধি'}
              titleBn="পাবলিক অনুদান খতিয়ান"
              titleEn="Public Donation Ledger"
              subtitleBn="সাদাকাহ প্ল্যাটফর্মে জমাকৃত সর্বমোট অনুদানের তালিকা ও রসিদসমূহ।"
              subtitleEn="Verified public records of all platform contributions."
            />
          )}
        </div>
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

        {/* Student Details Modal */}
        <StudentDetailsModal
          isOpen={!!selectedStudentId}
          studentId={selectedStudentId}
          onClose={() => setSelectedStudentId(null)}
          isBn={locale === 'bn'}
        />
      </div>
    </PortalLayout>
  );
}
