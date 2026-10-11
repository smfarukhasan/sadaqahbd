'use client';

import React, { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { Link, useRouter } from '../../../i18n/routing';
import {
  Building,
  UserCheck,
  CheckCircle2,
  Clock,
  Heart,
  DollarSign,
  FileText,
  Building2,
  Users,
  GraduationCap,
  XCircle,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { useAuthStore, getRoleDashboardPath } from '../../../lib/auth-store';
import PortalLayout, { PortalNavItem } from '../../../components/layout/PortalLayout';
import { getApiUrl } from '../../../lib/api-config';
import { getAuthToken } from '../../../lib/auth-token';
import EReceiptModal, { ReceiptData } from '../../../components/portal/EReceiptModal';
import OrganizationApplyModal from '../../../components/portal/OrganizationApplyModal';
import DonationLedgerTable from '../../../components/portal/DonationLedgerTable';
import VerificationStatusView from '../../../components/portal/VerificationStatusView';
import StudentDetailsModal from '../../../components/portal/StudentDetailsModal';

import MyDonationsSection from '../../../components/portal/MyDonationsSection';

export default function OrganizationDashboardPage() {
  const locale = useLocale();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const loadingAuth = useAuthStore((s) => s.loading);

  const [activeTab, setActiveTab] = useState<'affiliations' | 'clearances' | 'teachers' | 'my-donations' | 'donations'>('affiliations');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const tabParam = new URLSearchParams(window.location.search).get('tab');
      if (tabParam === 'my-donations' || tabParam === 'affiliations' || tabParam === 'clearances' || tabParam === 'teachers' || tabParam === 'donations') {
        setActiveTab(tabParam as any);
      }
    }
  }, []);
  const [orgTeachers, setOrgTeachers] = useState<any[]>([]);
  const [orgPendingPosts, setOrgPendingPosts] = useState<any[]>([]);
  const [orgStatusData, setOrgStatusData] = useState<{
    hasApplied: boolean;
    status: 'unapplied' | 'pending' | 'active' | 'rejected';
    organization: any;
  } | null>(null);
  const [pendingAffiliations, setPendingAffiliations] = useState<{
    teachers: any[];
    students: any[];
  }>({ teachers: [], students: [] });
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Role Protection Guard
  useEffect(() => {
    if (!loadingAuth) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'organization') {
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

      // Parallelize fetching all organization datasets for maximum speed
      const [statusRes, affRes, teachersRes, postsRes] = await Promise.all([
        fetch(`${apiUrl}/organizations/my-status`, { headers }).catch((err) => {
          console.error('Failed to load org status:', err);
          return null;
        }),
        fetch(`${apiUrl}/organizations/pending-affiliations`, { headers }).catch((err) => {
          console.error('Failed to load pending affiliations:', err);
          return null;
        }),
        fetch(`${apiUrl}/users/org-teachers`, { headers }).catch(() => null),
        fetch(`${apiUrl}/posts/org-pending`, { headers }).catch(() => null),
      ]);

      if (statusRes && statusRes.ok) {
        const sData = await statusRes.json().catch(() => null);
        if (sData) setOrgStatusData(sData);
      }
      if (affRes && affRes.ok) {
        const affData = await affRes.json().catch(() => null);
        if (affData) setPendingAffiliations(affData);
      }
      if (teachersRes && teachersRes.ok) {
        const teachersData = await teachersRes.json().catch(() => null);
        if (Array.isArray(teachersData)) setOrgTeachers(teachersData);
      }
      if (postsRes && postsRes.ok) {
        const postsData = await postsRes.json().catch(() => null);
        if (Array.isArray(postsData)) setOrgPendingPosts(postsData);
      }
    } catch (err) {
      console.error('Failed to load organization data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'organization') {
      loadData();
      // Live polling every 8 seconds only if organization is not yet active
      if (orgStatusData?.status !== 'active') {
        const timer = setInterval(() => {
          loadData();
        }, 8000);
        return () => clearInterval(timer);
      }
    }
  }, [user, orgStatusData?.status]);

  // Handle reviewing pending teacher/student affiliation (Stage 1)
  const handleReviewAffiliation = async (role: 'teacher' | 'student', id: string, approved: boolean) => {
    if (!user) return;
    try {
      const token = await getAuthToken();
      if (!token) return;
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/organizations/affiliations/${role}/${id}/review`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ approved }),
      });

      if (res.ok) {
        setFeedback(
          locale === 'bn'
            ? approved
              ? 'আবেদনটি অনুমোদিত হয়েছে এবং এডমিন অনুমোদনের জন্য প্রেরণ করা হয়েছে।'
              : 'আবেদনটি প্রত্যাখ্যান করা হয়েছে।'
            : approved
            ? 'Affiliation approved and forwarded to Super Admin for final review.'
            : 'Affiliation rejected.'
        );
        setTimeout(() => setFeedback(''), 4000);
        loadData();
      }
    } catch (err) {
      console.error('Failed to review affiliation:', err);
    }
  };

  // Handle approving teacher affiliation (legacy)
  const handleApproveTeacher = async (teacherId: string) => {
    if (!user) return;
    try {
      const token = await getAuthToken();
      if (!token) return;
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/users/teacher/${teacherId}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ approved: true }),
      });

      if (res.ok) {
        setFeedback(locale === 'bn' ? 'শিক্ষক প্রোফাইল সফলভাবে অনুমোদিত হয়েছে।' : 'Teacher profile verified successfully.');
        setTimeout(() => setFeedback(''), 4000);
        loadData();
      }
    } catch (err) {
      console.error('Failed to verify teacher:', err);
    }
  };

  // Handle granting institutional clearance to student post
  const handleApproveStudentPost = async (postId: string) => {
    if (!user) return;
    try {
      const token = await getAuthToken();
      if (!token) return;
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/posts/${postId}/org-verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ approved: true }),
      });

      if (res.ok) {
        setFeedback(locale === 'bn' ? 'শিক্ষার্থীর আবেদনে প্রাতিষ্ঠানিক ছাড়পত্র প্রদান সম্পন্ন হয়েছে।' : 'Institutional clearance granted successfully.');
        setTimeout(() => setFeedback(''), 4000);
        loadData();
      }
    } catch (err) {
      console.error('Failed to approve student post:', err);
    }
  };

  const isOrgActive = orgStatusData?.status === 'active';

  if (loadingAuth || !user) {
    return (
      <div className="container" style={{ padding: '6rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        {locale === 'bn' ? 'লোড হচ্ছে...' : 'Loading...'}
      </div>
    );
  }
  const pendingAffiliationsCount =
    (pendingAffiliations.teachers?.length || 0) + (pendingAffiliations.students?.length || 0);

  // Nav items only unlocked when organization is verified/active
  const navItems: PortalNavItem[] = isOrgActive
    ? [
        {
          id: 'affiliations',
          labelBn: 'শিক্ষক ও শিক্ষার্থী অনুমোদন',
          labelEn: 'Teacher & Student Clearances',
          icon: UserCheck,
          badge: pendingAffiliationsCount,
        },
        {
          id: 'clearances',
          labelBn: 'পোস্ট ছাড়পত্র',
          labelEn: 'Student Clearances',
          icon: CheckCircle2,
          badge: orgPendingPosts.length,
        },
        {
          id: 'teachers',
          labelBn: 'অনুমোদিত শিক্ষক তালিকা',
          labelEn: 'Affiliated Teachers',
          icon: Users,
          badge: orgTeachers.length,
        },
        {
          id: 'my-donations',
          labelBn: 'আমার দান সমূহ',
          labelEn: 'My Donations',
          icon: Heart,
        },
        {
          id: 'donations',
          labelBn: 'গ্লোবাল অনুদান লেজার',
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
      role="organization"
      roleNameBn="প্রতিষ্ঠান প্যানেল"
      roleNameEn="Institution Portal"
      roleIcon={Building2}
      navItems={navItems}
      activeNav={activeTab}
      onNavSelect={(id: any) => setActiveTab(id)}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {loadingData && !orgStatusData ? (
          <div style={{ padding: '1.5rem 0' }}>
            <div style={{ height: '28px', width: '260px', backgroundColor: 'var(--surface-border, #e2e8f0)', borderRadius: '8px', marginBottom: '10px' }} />
            <div style={{ height: '16px', width: '360px', backgroundColor: 'var(--surface-border-subtle, #f1f5f9)', borderRadius: '6px', marginBottom: '2rem' }} />
            <div style={{ height: '260px', backgroundColor: 'var(--surface, #ffffff)', border: '1px solid var(--surface-border, #e2e8f0)', borderRadius: '16px' }} />
          </div>
        ) : (
          <>
            {feedback && (
          <div
            style={{
              padding: '1rem 1.25rem',
              backgroundColor: 'rgba(5, 150, 105, 0.08)',
              border: '1px solid #059669',
              borderRadius: 'var(--radius-md)',
              color: '#047857',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: '700',
              fontSize: '0.9rem',
            }}
          >
            <CheckCircle2 size={18} /> {feedback}
          </div>
        )}

        {/* Locked State if not verified */}
        {!isOrgActive ? (
          <VerificationStatusView
            status={orgStatusData?.status || 'unapplied'}
            role="organization"
            organizationName={orgStatusData?.organization?.name}
            rejectionReason={orgStatusData?.organization?.rejectionReason}
            organizationDetails={orgStatusData?.organization}
            onApply={() => setIsApplyModalOpen(true)}
          />
        ) : (
          <>
            {/* Tab 1: Affiliations (New Two-Stage Flow) */}
            {activeTab === 'affiliations' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Teachers Queue */}
                <div
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderRadius: 'var(--radius-xl)',
                    border: '1px solid var(--surface-border)',
                    padding: '1.75rem',
                    boxShadow: 'var(--shadow-xs)',
                  }}
                >
                  <div style={{ marginBottom: '1.25rem' }}>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <UserCheck size={20} color="#2563eb" />
                      {locale === 'bn' ? 'শিক্ষক অন্তর্ভুক্তি আবেদন' : 'Teacher Affiliation Requests'}
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                      {locale === 'bn'
                        ? 'আপনার প্রতিষ্ঠানে নিযুক্ত শিক্ষকগণের আবেদন পরীক্ষা করে অনুমোদন দিন। প্রতিষ্ঠান অনুমোদনের পর চূড়ান্ত যাচাইয়ের জন্য এডমিনের নিকট যাবে।'
                        : 'Review teacher affiliation applications. After institutional approval, it forwards to Admin for final clearance.'}
                    </p>
                  </div>

                  {pendingAffiliations.teachers.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-md)' }}>
                      <CheckCircle2 size={32} color="#059669" style={{ margin: '0 auto 0.5rem' }} />
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>
                        {locale === 'bn' ? 'বর্তমানে কোনো শিক্ষক আবেদন অপেক্ষমাণ নেই।' : 'No teacher affiliation requests pending.'}
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {pendingAffiliations.teachers.map((tItem) => (
                        <div
                          key={tItem.profileId}
                          style={{
                            padding: '1.25rem',
                            backgroundColor: 'var(--background)',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid var(--surface-border)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '1rem',
                          }}
                        >
                          <div>
                            <strong style={{ fontSize: '1.05rem', color: 'var(--text-main)', display: 'block' }}>
                              {tItem.fullName}
                            </strong>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                              {tItem.designation && <span>পদবী: <strong>{tItem.designation}</strong></span>}
                              {tItem.department && <span>বিভাগ: <strong>{tItem.department}</strong></span>}
                              {tItem.employeeId && <span>আইডি: <strong>{tItem.employeeId}</strong></span>}
                              <span>ইমেইল: {tItem.email}</span>
                              {tItem.phone && <span>ফোন: {tItem.phone}</span>}
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              type="button"
                              onClick={() => handleReviewAffiliation('teacher', tItem.profileId, true)}
                              className="btn btn-primary"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.55rem 1rem', fontSize: '0.85rem', fontWeight: 800 }}
                            >
                              <CheckCircle2 size={16} />
                              {locale === 'bn' ? 'অনুমোদন দিন' : 'Approve'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReviewAffiliation('teacher', tItem.profileId, false)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                padding: '0.55rem 1rem',
                                fontSize: '0.85rem',
                                fontWeight: 800,
                                background: '#fee2e2',
                                color: '#991b1b',
                                border: '1px solid #fca5a5',
                                borderRadius: '10px',
                                cursor: 'pointer',
                              }}
                            >
                              <XCircle size={16} />
                              {locale === 'bn' ? 'প্রত্যাখ্যান' : 'Reject'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Students Queue */}
                <div
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderRadius: 'var(--radius-xl)',
                    border: '1px solid var(--surface-border)',
                    padding: '1.75rem',
                    boxShadow: 'var(--shadow-xs)',
                  }}
                >
                  <div style={{ marginBottom: '1.25rem' }}>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <GraduationCap size={20} color="#059669" />
                      {locale === 'bn' ? 'শিক্ষার্থী অন্তর্ভুক্তি আবেদন' : 'Student Affiliation Requests'}
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                      {locale === 'bn'
                        ? 'আপনার প্রতিষ্ঠানে অধ্যয়নরত শিক্ষার্থীদের রোল ও পরিচিতি নিশ্চিত করে অনুমোদন প্রদান করুন।'
                        : 'Verify students enrolled in your institution before forwarding for final Admin clearance.'}
                    </p>
                  </div>

                  {pendingAffiliations.students.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-md)' }}>
                      <CheckCircle2 size={32} color="#059669" style={{ margin: '0 auto 0.5rem' }} />
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>
                        {locale === 'bn' ? 'বর্তমানে কোনো শিক্ষার্থী আবেদন অপেক্ষমাণ নেই।' : 'No student affiliation requests pending.'}
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {pendingAffiliations.students.map((sItem) => (
                        <div
                          key={sItem.profileId}
                          style={{
                            padding: '1.25rem',
                            backgroundColor: 'var(--background)',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid var(--surface-border)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '1rem',
                          }}
                        >
                          <div>
                            <strong style={{ fontSize: '1.05rem', color: 'var(--text-main)', display: 'block' }}>
                              {sItem.fullName}
                            </strong>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                              {sItem.studentClassRoll && <span>ক্লাস / রোল: <strong>{sItem.studentClassRoll}</strong></span>}
                              {sItem.address && <span>ঠিকানা: <strong>{sItem.address}</strong></span>}
                              <span>ইমেইল: {sItem.email}</span>
                              {sItem.phone && <span>ফোন: {sItem.phone}</span>}
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              onClick={() => setSelectedStudentId(sItem.profileId || sItem.userId)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                padding: '0.55rem 0.95rem',
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                background: '#eff6ff',
                                color: '#1d4ed8',
                                border: '1px solid #bfdbfe',
                                borderRadius: '10px',
                                cursor: 'pointer',
                              }}
                            >
                              <Eye size={16} />
                              {locale === 'bn' ? 'বিস্তারিত' : 'Details'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReviewAffiliation('student', sItem.profileId, true)}
                              className="btn btn-primary"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.55rem 1rem', fontSize: '0.85rem', fontWeight: 800 }}
                            >
                              <CheckCircle2 size={16} />
                              {locale === 'bn' ? 'অনুমোদন দিন' : 'Approve'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReviewAffiliation('student', sItem.profileId, false)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                padding: '0.55rem 1rem',
                                fontSize: '0.85rem',
                                fontWeight: 800,
                                background: '#fee2e2',
                                color: '#991b1b',
                                border: '1px solid #fca5a5',
                                borderRadius: '10px',
                                cursor: 'pointer',
                              }}
                            >
                              <XCircle size={16} />
                              {locale === 'bn' ? 'প্রত্যাখ্যান' : 'Reject'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: Student Post Clearances */}
            {activeTab === 'clearances' && (
              <div
                style={{
                  backgroundColor: 'var(--surface)',
                  borderRadius: 'var(--radius-xl)',
                  border: '1px solid var(--surface-border)',
                  padding: '2rem',
                  boxShadow: 'var(--shadow-xs)',
                }}
              >
                <div style={{ marginBottom: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Building size={22} color="#2563eb" />
                    {locale === 'bn' ? 'শিক্ষার্থী প্রাতিষ্ঠানিক ছাড়পত্র ও পোস্ট অনুমোদন' : 'Student Institutional Clearance Queue'}
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.35rem' }}>
                    {locale === 'bn'
                      ? 'শিক্ষার্থীর প্রাতিষ্ঠানিক নিয়মিত ছাত্রত্ব যাচাই করে সুপার এডমিন অনুমোদনের জন্য ছাড়পত্র প্রদান করুন।'
                      : 'Verify bona fide student status to provide institutional clearance for Super Admin approval.'}
                  </p>
                </div>

                {loadingData ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    {locale === 'bn' ? 'লোড হচ্ছে...' : 'Loading...'}
                  </div>
                ) : orgPendingPosts.length === 0 ? (
                  <div
                    style={{
                      padding: '3.5rem 1.5rem',
                      textAlign: 'center',
                      backgroundColor: 'var(--background)',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--surface-border)',
                    }}
                  >
                    <CheckCircle2 size={40} color="#2563eb" style={{ margin: '0 auto 0.75rem' }} />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
                      {locale === 'bn' ? 'কোনো আবেদন ছাড়পত্রের জন্য অপেক্ষমান নেই' : 'No Clearances Pending'}
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                      {locale === 'bn'
                        ? 'আপনার শিক্ষা প্রতিষ্ঠানের কোনো শিক্ষার্থী নতুন আবেদন দাখিল করলে এখানে প্রদর্শিত হবে।'
                        : 'Student clearance requests will appear here as soon as they are submitted.'}
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {orgPendingPosts.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          backgroundColor: 'var(--background)',
                          borderRadius: 'var(--radius-lg)',
                          border: '1px solid var(--surface-border)',
                          padding: '1.5rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '1.25rem',
                        }}
                      >
                        <div style={{ flex: '1 1 300px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                            <span
                              style={{
                                fontSize: '0.75rem',
                                fontWeight: '800',
                                padding: '0.2rem 0.55rem',
                                borderRadius: 'var(--radius-full)',
                                backgroundColor: 'rgba(37, 99, 235, 0.12)',
                                color: '#2563eb',
                              }}
                            >
                              {item.studentName || (locale === 'bn' ? 'শিক্ষার্থী' : 'Student')}
                            </span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              {item.studentEmail}
                            </span>
                          </div>

                          <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)', margin: '0.35rem 0' }}>
                            {item.title}
                          </h3>
                          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0.25rem 0 0.65rem' }}>
                            {item.problemDescription || item.problemDesc}
                          </p>

                          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            <span>
                              {locale === 'bn' ? 'প্রয়োজনীয় অর্থ:' : 'Required:'}{' '}
                              <strong style={{ color: 'var(--primary)' }}>৳{Number(item.totalRequiredAmount || item.amount).toLocaleString()}</strong>
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleApproveStudentPost(item.id)}
                          className="btn btn-primary"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            padding: '0.65rem 1.35rem',
                            fontWeight: '700',
                          }}
                        >
                          <CheckCircle2 size={16} />
                          {locale === 'bn' ? 'ছাড়পত্র প্রদান করুন' : 'Grant Clearance'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Affiliated Teachers List */}
            {activeTab === 'teachers' && (
              <div
                style={{
                  backgroundColor: 'var(--surface)',
                  borderRadius: 'var(--radius-xl)',
                  border: '1px solid var(--surface-border)',
                  padding: '2rem',
                  boxShadow: 'var(--shadow-xs)',
                }}
              >
                <div style={{ marginBottom: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users size={22} color="#2563eb" />
                    {locale === 'bn' ? 'অনুমোদিত শিক্ষক তালিকা' : 'Affiliated Teachers'}
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.35rem' }}>
                    {locale === 'bn'
                      ? 'আপনার প্রতিষ্ঠানের অনুমোদিত শিক্ষকদের প্রোফাইল ও পরিচিতি।'
                      : 'List of all approved teachers affiliated with your institution.'}
                  </p>
                </div>

                {loadingData ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    {locale === 'bn' ? 'লোড হচ্ছে...' : 'Loading...'}
                  </div>
                ) : orgTeachers.length === 0 ? (
                  <div
                    style={{
                      padding: '3.5rem 1.5rem',
                      textAlign: 'center',
                      backgroundColor: 'var(--background)',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--surface-border)',
                    }}
                  >
                    <UserCheck size={40} color="#2563eb" style={{ margin: '0 auto 0.75rem' }} />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
                      {locale === 'bn' ? 'বর্তমানে কোনো শিক্ষক সংযুক্ত নেই' : 'No Affiliated Teachers Yet'}
                    </h3>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {orgTeachers.map((tItem) => {
                      const isApproved = tItem.status === 'active';
                      return (
                        <div
                          key={tItem.id}
                          style={{
                            padding: '1.25rem',
                            backgroundColor: 'var(--background)',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid var(--surface-border)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '1rem',
                          }}
                        >
                          <div>
                            <strong style={{ fontSize: '1rem', color: 'var(--text-main)', display: 'block' }}>
                              {tItem.fullName}
                            </strong>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                              {tItem.email} {tItem.phone && `• ${tItem.phone}`}
                            </span>
                          </div>

                          {isApproved ? (
                            <span
                              style={{
                                fontSize: '0.85rem',
                                color: 'var(--primary)',
                                fontWeight: '800',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                padding: '0.35rem 0.85rem',
                                borderRadius: 'var(--radius-full)',
                                backgroundColor: 'rgba(5, 150, 105, 0.1)',
                              }}
                            >
                              <CheckCircle2 size={16} /> {locale === 'bn' ? 'অনুমোদিত শিক্ষক' : 'Verified Teacher'}
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleApproveTeacher(tItem.id)}
                              className="btn btn-primary"
                              style={{
                                padding: '0.55rem 1.15rem',
                                fontSize: '0.85rem',
                                fontWeight: '700',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                              }}
                            >
                              <CheckCircle2 size={15} /> {locale === 'bn' ? 'অনুমোদন দিন' : 'Approve Teacher'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Tab 4: My Personal Donations */}
            {activeTab === 'my-donations' && <MyDonationsSection />}

            {/* Tab 5: Institutional Donations */}
            {activeTab === 'donations' && (
              <DonationLedgerTable
                firebaseUser={firebaseUser}
                locale={locale}
                onOpenReceipt={(r) => setSelectedReceipt(r)}
                donorDisplayName={user.fullName || 'প্রতিষ্ঠান প্রতিনিধি'}
                titleBn="প্রাতিষ্ঠানিক অনুদান হিসাব খতিয়ান"
                titleEn="Institutional Donation Ledger"
                subtitleBn="শিক্ষা প্রতিষ্ঠানের পক্ষ থেকে সরাসরি শিক্ষা সহায়তা ও অনুদানের রেকর্ড।"
                subtitleEn="Verified records of all contributions made by this institution."
                newDonationLabelBn="নতুন অনুদান প্রদান"
                newDonationLabelEn="Make a Grant"
              />
            )}
          </>
        )}
      </>
    )}

        {/* E-Receipt Modal */}
        {selectedReceipt && (
          <EReceiptModal receipt={selectedReceipt} onClose={() => setSelectedReceipt(null)} />
        )}

        {/* Organization Apply Modal */}
        <OrganizationApplyModal
          isOpen={isApplyModalOpen}
          onClose={() => setIsApplyModalOpen(false)}
          onSuccess={() => {
            setIsApplyModalOpen(false);
            loadData();
          }}
          initialData={orgStatusData?.organization}
        />

        {/* Student Details Modal */}
        <StudentDetailsModal
          isOpen={!!selectedStudentId}
          studentId={selectedStudentId}
          onClose={() => setSelectedStudentId(null)}
          isBn={locale === 'bn'}
          onStudentUpdated={loadData}
        />
      </div>
    </PortalLayout>
  );
}
