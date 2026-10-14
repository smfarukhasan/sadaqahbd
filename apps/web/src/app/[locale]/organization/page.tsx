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
  ArrowLeftRight,
  Info,
  HelpCircle,
  Search,
  History,
  Receipt,
  ExternalLink,
  UserMinus,
  Loader2,
} from 'lucide-react';
import { useAuthStore, getRoleDashboardPath } from '../../../lib/auth-store';
import PortalLayout, { PortalNavItem } from '../../../components/layout/PortalLayout';
import { getApiUrl } from '../../../lib/api-config';
import { getAuthToken } from '../../../lib/auth-token';
import EReceiptModal, { ReceiptData } from '../../../components/portal/EReceiptModal';
import OrganizationApplyModal from '../../../components/portal/OrganizationApplyModal';
import VerificationStatusView from '../../../components/portal/VerificationStatusView';
import StudentDetailsModal from '../../../components/portal/StudentDetailsModal';
import TeacherDetailsModal, { TeacherData } from '../../../components/portal/TeacherDetailsModal';

import MyDonationsSection from '../../../components/portal/MyDonationsSection';

export default function OrganizationDashboardPage() {
  const locale = useLocale();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const loadingAuth = useAuthStore((s) => s.loading);

  const [activeTab, setActiveTab] = useState<
    'affiliations' | 'clearances' | 'students' | 'teachers' | 'transfers' | 'my-donations' | 'donations'
  >('affiliations');

  // Sub-tabs for History support
  const [affiliationSubTab, setAffiliationSubTab] = useState<'pending' | 'history'>('pending');
  const [clearanceSubTab, setClearanceSubTab] = useState<'pending' | 'history'>('pending');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const tabParam = new URLSearchParams(window.location.search).get('tab');
      if (
        tabParam === 'my-donations' ||
        tabParam === 'affiliations' ||
        tabParam === 'clearances' ||
        tabParam === 'students' ||
        tabParam === 'teachers' ||
        tabParam === 'transfers' ||
        tabParam === 'donations'
      ) {
        setActiveTab(tabParam as any);
      }
    }
  }, []);

  const [orgTeachers, setOrgTeachers] = useState<any[]>([]);
  const [orgStudents, setOrgStudents] = useState<any[]>([]);
  const [orgPendingPosts, setOrgPendingPosts] = useState<any[]>([]);
  const [orgHistoryPosts, setOrgHistoryPosts] = useState<any[]>([]);
  const [orgStudentDonations, setOrgStudentDonations] = useState<any[]>([]);

  // Search states
  const [studentSearch, setStudentSearch] = useState('');
  const [teacherSearch, setTeacherSearch] = useState('');
  const [donationSearch, setDonationSearch] = useState('');

  const [orgStatusData, setOrgStatusData] = useState<{
    hasApplied: boolean;
    status: 'unapplied' | 'pending' | 'active' | 'rejected';
    organization: any;
  } | null>(null);

  const [pendingAffiliations, setPendingAffiliations] = useState<{
    teachers: any[];
    students: any[];
    historyTeachers?: any[];
    historyStudents?: any[];
  }>({ teachers: [], students: [], historyTeachers: [], historyStudents: [] });

  const [transferRequests, setTransferRequests] = useState<{
    outgoing: any[];
    incoming: any[];
    history: any[];
  }>({ outgoing: [], incoming: [], history: [] });

  const [transferSubTab, setTransferSubTab] = useState<'outgoing' | 'incoming' | 'history'>('outgoing');
  const [rejectionModal, setRejectionModal] = useState<{
    isOpen: boolean;
    transferId: string;
    userName: string;
    reason: string;
  }>({ isOpen: false, transferId: '', userName: '', reason: '' });

  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherData | null>(null);

  const [removalModal, setRemovalModal] = useState<{
    isOpen: boolean;
    memberId: string;
    memberName: string;
    role: 'student' | 'teacher';
    reason: string;
    submitting: boolean;
    error: string;
  }>({
    isOpen: false,
    memberId: '',
    memberName: '',
    role: 'student',
    reason: '',
    submitting: false,
    error: '',
  });

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
      const [statusRes, affRes, membersRes, postsRes, historyPostsRes, donationsRes, transfersRes] = await Promise.all([
        fetch(`${apiUrl}/organizations/my-status`, { headers }).catch((err) => {
          console.error('Failed to load org status:', err);
          return null;
        }),
        fetch(`${apiUrl}/organizations/pending-affiliations`, { headers }).catch((err) => {
          console.error('Failed to load pending affiliations:', err);
          return null;
        }),
        fetch(`${apiUrl}/organizations/my-members`, { headers }).catch(() => null),
        fetch(`${apiUrl}/posts/org-pending`, { headers }).catch(() => null),
        fetch(`${apiUrl}/posts/org-history`, { headers }).catch(() => null),
        fetch(`${apiUrl}/organizations/students-donations`, { headers }).catch(() => null),
        fetch(`${apiUrl}/organizations/transfer-requests`, { headers }).catch((err) => {
          console.error('Failed to load transfer requests:', err);
          return null;
        }),
      ]);

      if (statusRes && statusRes.ok) {
        const sData = await statusRes.json().catch(() => null);
        if (sData) setOrgStatusData(sData);
      }
      if (affRes && affRes.ok) {
        const affData = await affRes.json().catch(() => null);
        if (affData) setPendingAffiliations(affData);
      }
      if (membersRes && membersRes.ok) {
        const mData = await membersRes.json().catch(() => null);
        if (mData) {
          if (Array.isArray(mData.students)) setOrgStudents(mData.students);
          if (Array.isArray(mData.teachers)) setOrgTeachers(mData.teachers);
        }
      }
      if (postsRes && postsRes.ok) {
        const postsData = await postsRes.json().catch(() => null);
        if (Array.isArray(postsData)) setOrgPendingPosts(postsData);
      }
      if (historyPostsRes && historyPostsRes.ok) {
        const hpData = await historyPostsRes.json().catch(() => null);
        if (Array.isArray(hpData)) setOrgHistoryPosts(hpData);
      }
      if (donationsRes && donationsRes.ok) {
        const dData = await donationsRes.json().catch(() => null);
        if (Array.isArray(dData)) setOrgStudentDonations(dData);
      }
      if (transfersRes && transfersRes.ok) {
        const tData = await transfersRes.json().catch(() => null);
        if (tData) setTransferRequests(tData);
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

  const handleRequestMemberRemoval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!removalModal.reason.trim() || removalModal.reason.trim().length < 5) {
      setRemovalModal((prev) => ({
        ...prev,
        error: locale === 'bn' ? 'অনুগ্রহ করে রিমুভ করার সুস্পষ্ট কারণ লিখুন (কমপক্ষে ৫ অক্ষর)।' : 'Please provide a clear reason (min 5 characters).',
      }));
      return;
    }

    try {
      setRemovalModal((prev) => ({ ...prev, submitting: true, error: '' }));
      const token = await getAuthToken();
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/organizations/members/${removalModal.role}/${removalModal.memberId}/remove-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: removalModal.reason.trim() }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit removal request.');
      }

      setFeedback(data.message || (locale === 'bn' ? 'সদস্য রিমুভ আবেদন সফলভাবে জমা হয়েছে।' : 'Removal request submitted successfully.'));
      setRemovalModal({
        isOpen: false,
        memberId: '',
        memberName: '',
        role: 'student',
        reason: '',
        submitting: false,
        error: '',
      });
      loadData();
    } catch (err: any) {
      setRemovalModal((prev) => ({ ...prev, submitting: false, error: err.message || 'Failed to submit request.' }));
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

  // Handle reviewing institution transfer requests (Outgoing or Incoming)
  const handleReviewTransfer = async (transferId: string, approved: boolean, reason?: string) => {
    if (!user) return;
    try {
      const token = await getAuthToken();
      if (!token) return;
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/organizations/transfers/${transferId}/review`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ approved, reason }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        setFeedback(data?.message || (locale === 'bn' ? 'কার্যক্রম সফল হয়েছে।' : 'Transfer action completed.'));
        setTimeout(() => setFeedback(''), 4000);
        setRejectionModal({ isOpen: false, transferId: '', userName: '', reason: '' });
        loadData();
      } else {
        alert(data?.message || (locale === 'bn' ? 'ব্যর্থ হয়েছে' : 'Failed'));
      }
    } catch (err) {
      console.error('Failed to review transfer:', err);
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
  const pendingTransfersCount =
    (transferRequests.outgoing?.length || 0) + (transferRequests.incoming?.length || 0);

  // Nav items only unlocked when organization is verified/active
  const navItems: PortalNavItem[] = isOrgActive
    ? [
        {
          id: 'affiliations',
          labelBn: 'শিক্ষক ও শিক্ষার্থী অনুমোদন',
          labelEn: 'Clearance Approvals',
          icon: UserCheck,
          badge: pendingAffiliationsCount,
        },
        {
          id: 'clearances',
          labelBn: 'পোস্ট ছাড়পত্র',
          labelEn: 'Student Post Clearances',
          icon: CheckCircle2,
          badge: orgPendingPosts.length,
        },
        {
          id: 'students',
          labelBn: 'সকল শিক্ষার্থী তালিকা',
          labelEn: 'All Students',
          icon: GraduationCap,
          badge: orgStudents.length,
        },
        {
          id: 'teachers',
          labelBn: 'অনুমোদিত শিক্ষক তালিকা',
          labelEn: 'Approved Teachers',
          icon: Users,
          badge: orgTeachers.length,
        },
        {
          id: 'transfers',
          labelBn: 'প্রতিষ্ঠান স্থানান্তর আবেদন',
          labelEn: 'Institution Transfers',
          icon: ArrowLeftRight,
          badge: pendingTransfersCount,
        },
        {
          id: 'my-donations',
          labelBn: 'আমার দান সমূহ',
          labelEn: 'My Donations',
          icon: Heart,
        },
        {
          id: 'donations',
          labelBn: 'শিক্ষার্থী অনুদান লেজার',
          labelEn: 'Students Donation Ledger',
          icon: FileText,
          badge: orgStudentDonations.length,
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
            {/* Tab 1: Affiliations (Two-Stage Flow with History) */}
            {activeTab === 'affiliations' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                {/* Sub Tab Navigation */}
                <div
                  style={{
                    display: 'flex',
                    gap: '0.75rem',
                    borderBottom: '1px solid var(--surface-border)',
                    paddingBottom: '0.75rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setAffiliationSubTab('pending')}
                    className={`btn ${affiliationSubTab === 'pending' ? 'btn-primary' : 'btn-outline'}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      padding: '0.6rem 1.25rem',
                      fontSize: '0.88rem',
                      fontWeight: 800,
                    }}
                  >
                    <Clock size={16} />
                    <span>{locale === 'bn' ? 'অপেক্ষমাণ অনুমোদন' : 'Pending Approvals'}</span>
                    {pendingAffiliationsCount > 0 && (
                      <span
                        style={{
                          backgroundColor: affiliationSubTab === 'pending' ? 'rgba(255,255,255,0.25)' : '#2563eb',
                          color: '#ffffff',
                          padding: '0.1rem 0.55rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                        }}
                      >
                        {pendingAffiliationsCount}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setAffiliationSubTab('history')}
                    className={`btn ${affiliationSubTab === 'history' ? 'btn-primary' : 'btn-outline'}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      padding: '0.6rem 1.25rem',
                      fontSize: '0.88rem',
                      fontWeight: 800,
                    }}
                  >
                    <History size={16} />
                    <span>{locale === 'bn' ? 'অনুমোদন হিস্টোরি' : 'Approval History'}</span>
                    {((pendingAffiliations.historyTeachers?.length || 0) + (pendingAffiliations.historyStudents?.length || 0)) > 0 && (
                      <span
                        style={{
                          backgroundColor: affiliationSubTab === 'history' ? 'rgba(255,255,255,0.25)' : 'var(--surface-border)',
                          color: affiliationSubTab === 'history' ? '#ffffff' : 'var(--text-main)',
                          padding: '0.1rem 0.55rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                        }}
                      >
                        {(pendingAffiliations.historyTeachers?.length || 0) + (pendingAffiliations.historyStudents?.length || 0)}
                      </span>
                    )}
                  </button>
                </div>

                {affiliationSubTab === 'pending' && (
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

            {/* Sub Tab: Affiliation History */}
            {affiliationSubTab === 'history' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* History Teachers */}
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
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <UserCheck size={20} color="#2563eb" />
                      {locale === 'bn' ? 'শিক্ষক অনুমোদন হিস্টোরি' : 'Teacher Clearance History'}
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                      {locale === 'bn'
                        ? 'পূর্বে প্রক্রিয়াকৃত ও অনুমোদিত শিক্ষকগণের রেকর্ড।'
                        : 'Historical record of previously processed teacher applications.'}
                    </p>
                  </div>

                  {(!pendingAffiliations.historyTeachers || pendingAffiliations.historyTeachers.length === 0) ? (
                    <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-md)' }}>
                      <CheckCircle2 size={32} color="#64748b" style={{ margin: '0 auto 0.5rem' }} />
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>
                        {locale === 'bn' ? 'কোনো পূর্ববর্তী শিক্ষক অনুমোদনের রেকর্ড পাওয়া যায়নি।' : 'No teacher approval history found.'}
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {pendingAffiliations.historyTeachers.map((tItem: any) => {
                        const isApproved = tItem.verificationStatus === 'verified' || tItem.verificationStatus === 'pending_admin';
                        const isRejected = tItem.verificationStatus === 'rejected';
                        return (
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
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <strong style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>
                                  {tItem.fullName}
                                </strong>
                                {isRejected ? (
                                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#dc2626', backgroundColor: 'rgba(220, 38, 38, 0.1)', padding: '0.2rem 0.6rem', borderRadius: '9999px' }}>
                                    {locale === 'bn' ? 'বাতিলকৃত' : 'Rejected'}
                                  </span>
                                ) : tItem.verificationStatus === 'verified' ? (
                                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#059669', backgroundColor: 'rgba(5, 150, 105, 0.1)', padding: '0.2rem 0.6rem', borderRadius: '9999px' }}>
                                    {locale === 'bn' ? 'চূড়ান্ত অনুমোদিত' : 'Verified'}
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#d97706', backgroundColor: 'rgba(217, 119, 6, 0.1)', padding: '0.2rem 0.6rem', borderRadius: '9999px' }}>
                                    {locale === 'bn' ? 'এডমিন চূড়ান্ত অপেক্ষমাণ' : 'Pending Admin'}
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                                {tItem.designation && <span>পদবী: <strong>{tItem.designation}</strong></span>}
                                {tItem.department && <span>বিভাগ: <strong>{tItem.department}</strong></span>}
                                {tItem.employeeId && <span>আইডি: <strong>{tItem.employeeId}</strong></span>}
                                <span>ইমেইল: {tItem.email}</span>
                                {tItem.phone && <span>ফোন: {tItem.phone}</span>}
                              </div>
                              {tItem.rejectionReason && (
                                <p style={{ margin: '0.35rem 0 0', fontSize: '0.8rem', color: '#dc2626' }}>
                                  {locale === 'bn' ? 'কারণ: ' : 'Reason: '}{tItem.rejectionReason}
                                </p>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => setSelectedTeacher(tItem)}
                              className="btn btn-outline"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.55rem 1rem', fontSize: '0.85rem', fontWeight: 700 }}
                            >
                              <Eye size={15} />
                              {locale === 'bn' ? 'বিস্তারিত' : 'Details'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* History Students */}
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
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <GraduationCap size={20} color="#059669" />
                      {locale === 'bn' ? 'শিক্ষার্থী অনুমোদন হিস্টোরি' : 'Student Clearance History'}
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                      {locale === 'bn'
                        ? 'পূর্বে প্রক্রিয়াকৃত ও অনুমোদিত শিক্ষার্থীদের রেকর্ড।'
                        : 'Historical record of previously processed student applications.'}
                    </p>
                  </div>

                  {(!pendingAffiliations.historyStudents || pendingAffiliations.historyStudents.length === 0) ? (
                    <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-md)' }}>
                      <CheckCircle2 size={32} color="#64748b" style={{ margin: '0 auto 0.5rem' }} />
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>
                        {locale === 'bn' ? 'কোনো পূর্ববর্তী শিক্ষার্থী অনুমোদনের রেকর্ড পাওয়া যায়নি।' : 'No student approval history found.'}
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {pendingAffiliations.historyStudents.map((sItem: any) => {
                        const isApproved = sItem.verificationStatus === 'verified' || sItem.verificationStatus === 'pending_admin';
                        const isRejected = sItem.verificationStatus === 'rejected';
                        return (
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
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <strong style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>
                                  {sItem.fullName}
                                </strong>
                                {isRejected ? (
                                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#dc2626', backgroundColor: 'rgba(220, 38, 38, 0.1)', padding: '0.2rem 0.6rem', borderRadius: '9999px' }}>
                                    {locale === 'bn' ? 'বাতিলকৃত' : 'Rejected'}
                                  </span>
                                ) : sItem.verificationStatus === 'verified' ? (
                                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#059669', backgroundColor: 'rgba(5, 150, 105, 0.1)', padding: '0.2rem 0.6rem', borderRadius: '9999px' }}>
                                    {locale === 'bn' ? 'চূড়ান্ত অনুমোদিত' : 'Verified'}
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#d97706', backgroundColor: 'rgba(217, 119, 6, 0.1)', padding: '0.2rem 0.6rem', borderRadius: '9999px' }}>
                                    {locale === 'bn' ? 'এডমিন চূড়ান্ত অপেক্ষমাণ' : 'Pending Admin'}
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                                {(sItem.className || sItem.studentClassRoll) && (
                                  <span>ক্লাস / রোল: <strong>{sItem.className ? `${sItem.className} (${sItem.rollNumber || sItem.studentClassRoll})` : sItem.studentClassRoll}</strong></span>
                                )}
                                <span>ইমেইল: {sItem.email}</span>
                                {sItem.phone && <span>ফোন: {sItem.phone}</span>}
                              </div>
                              {sItem.rejectionReason && (
                                <p style={{ margin: '0.35rem 0 0', fontSize: '0.8rem', color: '#dc2626' }}>
                                  {locale === 'bn' ? 'কারণ: ' : 'Reason: '}{sItem.rejectionReason}
                                </p>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => setSelectedStudentId(sItem.profileId || sItem.userId)}
                              className="btn btn-outline"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.55rem 1rem', fontSize: '0.85rem', fontWeight: 700 }}
                            >
                              <Eye size={15} />
                              {locale === 'bn' ? 'বিস্তারিত' : 'Details'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
              </div>
            )}

            {/* Tab: Institution Transfers (New Multi-Stage Transfer Feature) */}
            {activeTab === 'transfers' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Header & Feature Instructions Banner */}
                <div
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderRadius: 'var(--radius-xl)',
                    border: '1px solid var(--surface-border)',
                    padding: '1.75rem',
                    boxShadow: 'var(--shadow-xs)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        background: 'rgba(37, 99, 235, 0.12)',
                        color: '#2563eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <ArrowLeftRight size={22} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                        {locale === 'bn' ? 'প্রতিষ্ঠান পরিবর্তন ও স্থানান্তর আবেদন' : 'Institution Transfer Applications'}
                      </h2>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.2rem 0 0' }}>
                        {locale === 'bn'
                          ? 'শিক্ষক ও শিক্ষার্থীদের প্রতিষ্ঠান পরিবর্তনের আবেদন ছাড়পত্র, গ্রহণ ও ট্র্যাকিং ব্যবস্থাপনা।'
                          : 'Manage and review institutional release and acceptance requests for teachers and students.'}
                      </p>
                    </div>
                  </div>

                  {/* Feature Instructions Guide */}
                  <div
                    style={{
                      marginTop: '1.25rem',
                      padding: '1.15rem 1.25rem',
                      backgroundColor: 'rgba(37, 99, 235, 0.06)',
                      border: '1px solid var(--surface-border, rgba(37, 99, 235, 0.25))',
                      borderRadius: 'var(--radius-lg, 16px)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <HelpCircle size={18} color="var(--secondary, #3b82f6)" />
                      <strong style={{ fontSize: '0.94rem', color: 'var(--text-main, #1e40af)' }}>
                        {locale === 'bn' ? 'প্রতিষ্ঠান পরিবর্তন ফিচারের নিয়মাবলী ও নির্দেশিকা' : 'How Institution Transfer Works'}
                      </strong>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem', fontSize: '0.82rem' }}>
                      <div style={{ padding: '0.85rem', backgroundColor: 'var(--surface)', borderRadius: '10px', border: '1px solid var(--surface-border)', boxShadow: 'var(--shadow-xs)' }}>
                        <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '0.3rem', fontSize: '0.86rem' }}>
                          {locale === 'bn' ? '১. বর্তমান প্রতিষ্ঠানের ছাড়পত্র (Outgoing):' : '1. Release Approval (Outgoing):'}
                        </strong>
                        <span style={{ color: 'var(--text-muted)', lineHeight: 1.55 }}>
                          {locale === 'bn'
                            ? 'আপনার প্রতিষ্ঠানের শিক্ষার্থী বা শিক্ষক অন্য প্রতিষ্ঠানে যেতে চাইলে এখানে ছাড়পত্র দিন বা বাতিল করুন।'
                            : 'Grant release clearance or reject when your member requests to transfer out.'}
                        </span>
                      </div>
                      <div style={{ padding: '0.85rem', backgroundColor: 'var(--surface)', borderRadius: '10px', border: '1px solid var(--surface-border)', boxShadow: 'var(--shadow-xs)' }}>
                        <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '0.3rem', fontSize: '0.86rem' }}>
                          {locale === 'bn' ? '২. নতুন প্রতিষ্ঠানে অন্তর্ভুক্তি (Incoming):' : '2. Acceptance (Incoming):'}
                        </strong>
                        <span style={{ color: 'var(--text-muted)', lineHeight: 1.55 }}>
                          {locale === 'bn'
                            ? 'পূর্ববর্তী প্রতিষ্ঠান ছাড়পত্র দিলে আবেদন আপনার কাছে আসবে। আপনার প্রতিষ্ঠানে যুক্ত করতে গ্রহণ করুন।'
                            : 'Accept released members from other institutions who wish to join your institution.'}
                        </span>
                      </div>
                      <div style={{ padding: '0.85rem', backgroundColor: 'var(--surface)', borderRadius: '10px', border: '1px solid var(--surface-border)', boxShadow: 'var(--shadow-xs)' }}>
                        <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '0.3rem', fontSize: '0.86rem' }}>
                          {locale === 'bn' ? '৩. কর্তৃপক্ষের চূড়ান্ত ছাড়পত্র:' : '3. Final Authority Clearance:'}
                        </strong>
                        <span style={{ color: 'var(--text-muted)', lineHeight: 1.55 }}>
                          {locale === 'bn'
                            ? 'উভয় প্রতিষ্ঠান অনুমোদন করার পর কর্তৃপক্ষ চূড়ান্ত ছাড়পত্র দিলেই প্রোফাইল পরিবর্তিত হবে।'
                            : 'After both institutions consent, platform authority provides final clearance.'}
                        </span>
                      </div>
                    </div>
                    <p style={{ margin: '0.85rem 0 0', fontSize: '0.78rem', color: 'var(--primary, #059669)', fontWeight: 600 }}>
                      ℹ️ {locale === 'bn'
                        ? 'স্থায়ী ডাটা সুরক্ষা: স্থানান্তরের আগের সকল পোস্ট ও অনুদান রেকর্ড পুরাতন প্রতিষ্ঠানের নামেই অপরিবর্তিত থাকবে।'
                        : 'Data Lineage: All past campaigns and financial records remain permanently linked to the previous institution.'}
                    </p>
                  </div>

                  {/* Sub-tab switcher */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem', borderBottom: '1px solid var(--surface-border)', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setTransferSubTab('outgoing')}
                      style={{
                        padding: '0.55rem 1rem',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        backgroundColor: transferSubTab === 'outgoing' ? '#2563eb' : 'transparent',
                        color: transferSubTab === 'outgoing' ? '#ffffff' : 'var(--text-muted)',
                      }}
                    >
                      <span>{locale === 'bn' ? 'ছাড়পত্র আবেদন (আমাদের থেকে)' : 'Outgoing Requests'}</span>
                      {transferRequests.outgoing.length > 0 && (
                        <span
                          style={{
                            padding: '0.15rem 0.45rem',
                            fontSize: '0.75rem',
                            borderRadius: '999px',
                            backgroundColor: transferSubTab === 'outgoing' ? '#ffffff' : '#ef4444',
                            color: transferSubTab === 'outgoing' ? '#2563eb' : '#ffffff',
                            fontWeight: 800,
                          }}
                        >
                          {transferRequests.outgoing.length}
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setTransferSubTab('incoming')}
                      style={{
                        padding: '0.55rem 1rem',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        backgroundColor: transferSubTab === 'incoming' ? '#2563eb' : 'transparent',
                        color: transferSubTab === 'incoming' ? '#ffffff' : 'var(--text-muted)',
                      }}
                    >
                      <span>{locale === 'bn' ? 'নতুন অন্তর্ভুক্তি আবেদন (আমাদের কাছে)' : 'Incoming Requests'}</span>
                      {transferRequests.incoming.length > 0 && (
                        <span
                          style={{
                            padding: '0.15rem 0.45rem',
                            fontSize: '0.75rem',
                            borderRadius: '999px',
                            backgroundColor: transferSubTab === 'incoming' ? '#ffffff' : '#059669',
                            color: transferSubTab === 'incoming' ? '#2563eb' : '#ffffff',
                            fontWeight: 800,
                          }}
                        >
                          {transferRequests.incoming.length}
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setTransferSubTab('history')}
                      style={{
                        padding: '0.55rem 1rem',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        backgroundColor: transferSubTab === 'history' ? '#2563eb' : 'transparent',
                        color: transferSubTab === 'history' ? '#ffffff' : 'var(--text-muted)',
                      }}
                    >
                      <span>{locale === 'bn' ? 'স্থানান্তর ইতিহাস' : 'Transfer History'}</span>
                      <span
                        style={{
                          padding: '0.15rem 0.45rem',
                          fontSize: '0.75rem',
                          borderRadius: '999px',
                          backgroundColor: transferSubTab === 'history' ? '#ffffff' : '#e2e8f0',
                          color: transferSubTab === 'history' ? '#2563eb' : '#475569',
                          fontWeight: 700,
                        }}
                      >
                        {transferRequests.history.length}
                      </span>
                    </button>
                  </div>
                </div>

                {/* SUBTAB 1: OUTGOING (CURRENT ORG APPROVAL) */}
                {transferSubTab === 'outgoing' && (
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
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                        {locale === 'bn' ? 'বর্তমান প্রতিষ্ঠানের ছাড়পত্র আবেদন' : 'Pending Outgoing Releases'} ({transferRequests.outgoing.length})
                      </h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                        {locale === 'bn'
                          ? 'যেসব শিক্ষার্থী বা শিক্ষক আপনার প্রতিষ্ঠান ছেড়ে অন্য প্রতিষ্ঠানে যুক্ত হওয়ার আবেদন করেছেন।'
                          : 'Members requesting clearance to leave your institution.'}
                      </p>
                    </div>

                    {transferRequests.outgoing.length === 0 ? (
                      <div style={{ padding: '2.5rem', textAlign: 'center', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-lg)' }}>
                        <CheckCircle2 size={36} color="#059669" style={{ margin: '0 auto 0.5rem' }} />
                        <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', margin: 0, fontWeight: 600 }}>
                          {locale === 'bn' ? 'বর্তমানে কোনো ছাড়পত্র আবেদন অপেক্ষমাণ নেই।' : 'No outgoing release requests pending.'}
                        </p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {transferRequests.outgoing.map((item) => (
                          <div
                            key={item.id}
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
                            <div style={{ flex: '1 1 320px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                                <span
                                  style={{
                                    fontSize: '0.75rem',
                                    fontWeight: 800,
                                    padding: '0.2rem 0.55rem',
                                    borderRadius: '999px',
                                    backgroundColor: item.userRole === 'teacher' ? 'rgba(37, 99, 235, 0.12)' : 'rgba(5, 150, 105, 0.12)',
                                    color: item.userRole === 'teacher' ? '#2563eb' : '#059669',
                                  }}
                                >
                                  {item.userRole === 'teacher' ? (locale === 'bn' ? 'শিক্ষক' : 'Teacher') : (locale === 'bn' ? 'শিক্ষার্থী' : 'Student')}
                                </span>
                                <strong style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>
                                  {item.user?.fullName || item.userName}
                                </strong>
                              </div>

                              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
                                <span>ইমেইল: {item.user?.email || item.userEmail}</span>
                                {(item.user?.phone || item.userPhone) && <span>ফোন: {item.user?.phone || item.userPhone}</span>}
                              </div>

                              <div style={{ marginTop: '0.65rem', padding: '0.65rem 0.85rem', backgroundColor: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--surface-border)', fontSize: '0.85rem' }}>
                                <div>
                                  <span style={{ color: 'var(--text-muted)' }}>{locale === 'bn' ? 'নতুন কাঙ্ক্ষিত প্রতিষ্ঠান: ' : 'Target Institution: '}</span>
                                  <strong style={{ color: 'var(--secondary, #2563eb)' }}>{item.targetOrgName}</strong>
                                </div>
                                <div style={{ marginTop: '0.35rem' }}>
                                  <span style={{ color: 'var(--text-muted)' }}>{locale === 'bn' ? 'পরিবর্তনের কারণ: ' : 'Reason: '}</span>
                                  <span style={{ color: 'var(--text-main)', fontStyle: 'italic' }}>&quot;{item.reason}&quot;</span>
                                </div>
                              </div>

                              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.45rem' }}>
                                {locale === 'bn' ? 'আবেদনের তারিখ: ' : 'Applied on: '}
                                {new Date(item.createdAt).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US')}
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                onClick={() => handleReviewTransfer(item.id, true)}
                                className="btn btn-primary"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.6rem 1.15rem', fontSize: '0.85rem', fontWeight: 800 }}
                              >
                                <CheckCircle2 size={16} />
                                {locale === 'bn' ? 'ছাড়পত্র অনুমোদন' : 'Grant Release'}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setRejectionModal({
                                    isOpen: true,
                                    transferId: item.id,
                                    userName: item.user?.fullName || item.userName || '',
                                    reason: '',
                                  })
                                }
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  padding: '0.6rem 1rem',
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
                )}

                {/* SUBTAB 2: INCOMING (TARGET ORG APPROVAL) */}
                {transferSubTab === 'incoming' && (
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
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                        {locale === 'bn' ? 'নতুন অন্তর্ভুক্তি আবেদন (আগত শিক্ষার্থী/শিক্ষক)' : 'Pending Incoming Requests'} ({transferRequests.incoming.length})
                      </h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                        {locale === 'bn'
                          ? 'পূর্ববর্তী প্রতিষ্ঠান ছাড়পত্র দিয়েছে। আপনার প্রতিষ্ঠানে যুক্ত করার জন্য আবেদনটি গ্রহণ বা প্রত্যাখ্যান করুন।'
                          : 'Members released from another institution requesting to affiliate with your institution.'}
                      </p>
                    </div>

                    {transferRequests.incoming.length === 0 ? (
                      <div style={{ padding: '2.5rem', textAlign: 'center', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-lg)' }}>
                        <CheckCircle2 size={36} color="#059669" style={{ margin: '0 auto 0.5rem' }} />
                        <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', margin: 0, fontWeight: 600 }}>
                          {locale === 'bn' ? 'বর্তমানে কোনো নতুন অন্তর্ভুক্তি আবেদন অপেক্ষমাণ নেই।' : 'No incoming requests pending.'}
                        </p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {transferRequests.incoming.map((item) => (
                          <div
                            key={item.id}
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
                            <div style={{ flex: '1 1 320px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                                <span
                                  style={{
                                    fontSize: '0.75rem',
                                    fontWeight: 800,
                                    padding: '0.2rem 0.55rem',
                                    borderRadius: '999px',
                                    backgroundColor: item.userRole === 'teacher' ? 'rgba(37, 99, 235, 0.12)' : 'rgba(5, 150, 105, 0.12)',
                                    color: item.userRole === 'teacher' ? '#2563eb' : '#059669',
                                  }}
                                >
                                  {item.userRole === 'teacher' ? (locale === 'bn' ? 'শিক্ষক' : 'Teacher') : (locale === 'bn' ? 'শিক্ষার্থী' : 'Student')}
                                </span>
                                <strong style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>
                                  {item.user?.fullName || item.userName}
                                </strong>
                                <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '999px', backgroundColor: '#dcfce7', color: '#166534', fontWeight: 700 }}>
                                  ✓ {locale === 'bn' ? 'পূর্ববর্তী প্রতিষ্ঠান ছাড়পত্র দিয়েছে' : 'Released by previous org'}
                                </span>
                              </div>

                              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
                                <span>ইমেইল: {item.user?.email || item.userEmail}</span>
                                {(item.user?.phone || item.userPhone) && <span>ফোন: {item.user?.phone || item.userPhone}</span>}
                              </div>

                              <div style={{ marginTop: '0.65rem', padding: '0.65rem 0.85rem', backgroundColor: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--surface-border)', fontSize: '0.85rem' }}>
                                <div>
                                  <span style={{ color: 'var(--text-muted)' }}>{locale === 'bn' ? 'পূর্ববর্তী প্রতিষ্ঠান: ' : 'Previous Institution: '}</span>
                                  <strong style={{ color: 'var(--text-main)' }}>{item.currentOrgName}</strong>
                                </div>
                                <div style={{ marginTop: '0.35rem' }}>
                                  <span style={{ color: 'var(--text-muted)' }}>{locale === 'bn' ? 'স্থানান্তরের কারণ: ' : 'Reason: '}</span>
                                  <span style={{ color: 'var(--text-main)', fontStyle: 'italic' }}>&quot;{item.reason}&quot;</span>
                                </div>
                              </div>

                              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.45rem' }}>
                                {locale === 'bn' ? 'আবেদনের তারিখ: ' : 'Applied on: '}
                                {new Date(item.createdAt).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US')}
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                onClick={() => handleReviewTransfer(item.id, true)}
                                className="btn btn-primary"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.6rem 1.15rem', fontSize: '0.85rem', fontWeight: 800 }}
                              >
                                <CheckCircle2 size={16} />
                                {locale === 'bn' ? 'গ্রহণ করুন' : 'Accept Affiliation'}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setRejectionModal({
                                    isOpen: true,
                                    transferId: item.id,
                                    userName: item.user?.fullName || item.userName || '',
                                    reason: '',
                                  })
                                }
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  padding: '0.6rem 1rem',
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
                )}

                {/* SUBTAB 3: HISTORY */}
                {transferSubTab === 'history' && (
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
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                        {locale === 'bn' ? 'স্থানান্তরের পূর্ববর্তী ইতিহাস' : 'Transfer History Log'} ({transferRequests.history.length})
                      </h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                        {locale === 'bn'
                          ? 'আপনার প্রতিষ্ঠান সংশ্লিষ্ট সকল অনুমোদিত বা নিষ্পত্তিকৃত স্থানান্তর রেকর্ড।'
                          : 'All completed or processed transfers relating to your institution.'}
                      </p>
                    </div>

                    {transferRequests.history.length === 0 ? (
                      <div style={{ padding: '2.5rem', textAlign: 'center', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-lg)' }}>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>
                          {locale === 'bn' ? 'কোনো পূর্ববর্তী স্থানান্তরের রেকর্ড পাওয়া যায়নি।' : 'No transfer history records yet.'}
                        </p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {transferRequests.history.map((h) => {
                          const isApproved = h.status === 'approved';
                          const isRejected = h.status === 'rejected';
                          const isWaitingAdmin = h.status === 'target_org_approved';

                          return (
                            <div
                              key={h.id}
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
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                  <strong style={{ fontSize: '1rem', color: 'var(--text-main)' }}>
                                    {h.user?.fullName || h.userName}
                                  </strong>
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    ({h.userRole === 'teacher' ? (locale === 'bn' ? 'শিক্ষক' : 'Teacher') : (locale === 'bn' ? 'শিক্ষার্থী' : 'Student')})
                                  </span>
                                </div>
                                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                  <span>{h.currentOrgName}</span> &rarr; <strong style={{ color: '#2563eb' }}>{h.targetOrgName}</strong>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontStyle: 'italic' }}>
                                  &quot;{h.reason}&quot;
                                </div>
                                {h.status === 'rejected' && (
                                  <div style={{ marginTop: '0.35rem', fontSize: '0.8rem', color: '#dc2626' }}>
                                    ❌ কারণ: {h.currentOrgRejectionReason || h.targetOrgRejectionReason || h.finalRejectionReason || 'উল্লেখ নেই'}
                                  </div>
                                )}
                              </div>

                              <div>
                                {isApproved && (
                                  <span style={{ padding: '0.35rem 0.85rem', borderRadius: '999px', backgroundColor: '#dcfce7', color: '#166534', fontWeight: 800, fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                                    <CheckCircle2 size={14} /> {locale === 'bn' ? 'স্থানান্তর সম্পন্ন' : 'Transfer Completed'}
                                  </span>
                                )}
                                {isWaitingAdmin && (
                                  <span style={{ padding: '0.35rem 0.85rem', borderRadius: '999px', backgroundColor: '#fef3c7', color: '#92400e', fontWeight: 800, fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                                    <Clock size={14} /> {locale === 'bn' ? 'এডমিন অনুমোদনের অপেক্ষায়' : 'Awaiting Final Admin Clearance'}
                                  </span>
                                )}
                                {isRejected && (
                                  <span style={{ padding: '0.35rem 0.85rem', borderRadius: '999px', backgroundColor: '#fee2e2', color: '#991b1b', fontWeight: 800, fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                                    <XCircle size={14} /> {locale === 'bn' ? 'প্রত্যাখ্যাত' : 'Rejected'}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Student Post Clearances (With History) */}
            {activeTab === 'clearances' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                {/* Sub Tab Navigation */}
                <div
                  style={{
                    display: 'flex',
                    gap: '0.75rem',
                    borderBottom: '1px solid var(--surface-border)',
                    paddingBottom: '0.75rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setClearanceSubTab('pending')}
                    className={`btn ${clearanceSubTab === 'pending' ? 'btn-primary' : 'btn-outline'}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      padding: '0.6rem 1.25rem',
                      fontSize: '0.88rem',
                      fontWeight: 800,
                    }}
                  >
                    <Clock size={16} />
                    <span>{locale === 'bn' ? 'অপেক্ষমাণ ছাড়পত্র' : 'Pending Clearances'}</span>
                    {orgPendingPosts.length > 0 && (
                      <span
                        style={{
                          backgroundColor: clearanceSubTab === 'pending' ? 'rgba(255,255,255,0.25)' : '#2563eb',
                          color: '#ffffff',
                          padding: '0.1rem 0.55rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                        }}
                      >
                        {orgPendingPosts.length}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setClearanceSubTab('history')}
                    className={`btn ${clearanceSubTab === 'history' ? 'btn-primary' : 'btn-outline'}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      padding: '0.6rem 1.25rem',
                      fontSize: '0.88rem',
                      fontWeight: 800,
                    }}
                  >
                    <History size={16} />
                    <span>{locale === 'bn' ? 'ছাড়পত্র হিস্টোরি' : 'Clearance History'}</span>
                    {orgHistoryPosts.length > 0 && (
                      <span
                        style={{
                          backgroundColor: clearanceSubTab === 'history' ? 'rgba(255,255,255,0.25)' : 'var(--surface-border)',
                          color: clearanceSubTab === 'history' ? '#ffffff' : 'var(--text-main)',
                          padding: '0.1rem 0.55rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                        }}
                      >
                        {orgHistoryPosts.length}
                      </span>
                    )}
                  </button>
                </div>

                {clearanceSubTab === 'pending' ? (
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
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Building size={22} color="#2563eb" />
                        {locale === 'bn' ? 'শিক্ষার্থী প্রাতিষ্ঠানিক ছাড়পত্র ও পোস্ট অনুমোদন' : 'Student Institutional Clearance Queue'}
                      </h2>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.35rem' }}>
                        {locale === 'bn'
                          ? 'শিক্ষার্থীর প্রাতিষ্ঠানিক নিয়মিত ছাত্রত্ব যাচাই করে কর্তৃপক্ষের চূড়ান্ত অনুমোদনের জন্য ছাড়পত্র প্রদান করুন।'
                          : 'Verify bona fide student status to provide institutional clearance for final authority approval.'}
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
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
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
                                    fontWeight: 800,
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

                              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: '0.35rem 0' }}>
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
                                fontWeight: 700,
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
                ) : (
                  /* History Clearance Posts */
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
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <History size={22} color="#059669" />
                        {locale === 'bn' ? 'পোস্ট ছাড়পত্র হিস্টোরি' : 'Post Clearance History'}
                      </h2>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.35rem' }}>
                        {locale === 'bn'
                          ? 'আপনার প্রতিষ্ঠান কর্তৃক ইতিপূর্বে অনুমোদিত ও প্রক্রিয়াকৃত শিক্ষার্থী পোস্টসমূহের রেকর্ড।'
                          : 'Historical records of all previously cleared or processed student campaigns.'}
                      </p>
                    </div>

                    {orgHistoryPosts.length === 0 ? (
                      <div
                        style={{
                          padding: '3.5rem 1.5rem',
                          textAlign: 'center',
                          backgroundColor: 'var(--background)',
                          borderRadius: 'var(--radius-lg)',
                          border: '1px solid var(--surface-border)',
                        }}
                      >
                        <CheckCircle2 size={40} color="#64748b" style={{ margin: '0 auto 0.75rem' }} />
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                          {locale === 'bn' ? 'কোনো পূর্ববর্তী ছাড়পত্রের রেকর্ড পাওয়া যায়নি' : 'No Clearance History Found'}
                        </h3>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {orgHistoryPosts.map((item) => {
                          const isRejected = item.status === 'rejected';
                          const isDouble = item.isDoubleVerified;
                          const isOrgCleared = item.orgVerified;

                          return (
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
                              <div style={{ flex: '1 1 320px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)' }}>
                                    {item.studentName}
                                  </span>
                                  {isRejected ? (
                                    <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '9999px', backgroundColor: 'rgba(220, 38, 38, 0.1)', color: '#dc2626' }}>
                                      {locale === 'bn' ? 'বাতিলকৃত' : 'Rejected'}
                                    </span>
                                  ) : isDouble ? (
                                    <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '9999px', backgroundColor: 'rgba(5, 150, 105, 0.1)', color: '#059669' }}>
                                      {locale === 'bn' ? 'দ্বৈত ভেরিফাইড ও সক্রিয়' : 'Double Verified & Live'}
                                    </span>
                                  ) : isOrgCleared ? (
                                    <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '9999px', backgroundColor: 'rgba(37, 99, 235, 0.1)', color: '#2563eb' }}>
                                      {locale === 'bn' ? 'প্রাতিষ্ঠানিক ছাড়পত্র সম্পন্ন' : 'Org Cleared'}
                                    </span>
                                  ) : null}
                                </div>

                                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: '0.35rem 0' }}>
                                  {item.title}
                                </h3>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0.25rem 0 0.65rem' }}>
                                  {item.problemDescription || item.problemDesc}
                                </p>

                                <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                                  <span>
                                    {locale === 'bn' ? 'প্রয়োজনীয়:' : 'Required:'}{' '}
                                    <strong style={{ color: 'var(--text-main)' }}>৳{Number(item.amount || 0).toLocaleString()}</strong>
                                  </span>
                                  <span>
                                    {locale === 'bn' ? 'সংগৃহীত:' : 'Collected:'}{' '}
                                    <strong style={{ color: '#059669' }}>৳{Number(item.receivedAmount || 0).toLocaleString()}</strong>
                                  </span>
                                  <span>
                                    {locale === 'bn' ? 'তারিখ:' : 'Date:'}{' '}
                                    {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US') : '—'}
                                  </span>
                                </div>
                              </div>

                              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <button
                                  type="button"
                                  onClick={() => setSelectedStudentId(item.studentId)}
                                  className="btn btn-outline"
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.55rem 0.95rem', fontSize: '0.85rem', fontWeight: 700 }}
                                >
                                  <Eye size={15} />
                                  {locale === 'bn' ? 'শিক্ষার্থী বিবরণ' : 'Student Info'}
                                </button>
                                <Link
                                  href={`/posts/${item.id}`}
                                  className="btn btn-outline"
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.55rem 0.95rem', fontSize: '0.85rem', fontWeight: 700, textDecoration: 'none' }}
                                >
                                  <ExternalLink size={15} />
                                  {locale === 'bn' ? 'পোস্ট দেখুন' : 'View Post'}
                                </Link>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Enrolled Students Directory */}
            {activeTab === 'students' && (
              <div
                style={{
                  backgroundColor: 'var(--surface)',
                  borderRadius: 'var(--radius-xl)',
                  border: '1px solid var(--surface-border)',
                  padding: '2rem',
                  boxShadow: 'var(--shadow-xs)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <GraduationCap size={22} color="#059669" />
                      {locale === 'bn' ? 'সকল শিক্ষার্থী তালিকা' : 'Enrolled Students Directory'}
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.35rem' }}>
                      {locale === 'bn'
                        ? 'আপনার প্রতিষ্ঠানের নিবন্ধিত ও অনুমোদিত সকল শিক্ষার্থীর তালিকা ও পূর্ণাঙ্গ বিবরণ।'
                        : 'Directory of all verified and registered students in your institution.'}
                    </p>
                  </div>

                  <div style={{ position: 'relative', minWidth: '260px' }}>
                    <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      placeholder={locale === 'bn' ? 'শিক্ষার্থীর নাম, ক্লাস, রোল দিয়ে খুঁজুন...' : 'Search by name, class, roll...'}
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.85rem 0.55rem 2.25rem',
                        borderRadius: '10px',
                        border: '1px solid var(--surface-border)',
                        backgroundColor: 'var(--background)',
                        fontSize: '0.85rem',
                        color: 'var(--text-main)',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                {loadingData ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    {locale === 'bn' ? 'লোড হচ্ছে...' : 'Loading...'}
                  </div>
                ) : orgStudents.length === 0 ? (
                  <div
                    style={{
                      padding: '3.5rem 1.5rem',
                      textAlign: 'center',
                      backgroundColor: 'var(--background)',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--surface-border)',
                    }}
                  >
                    <GraduationCap size={44} color="#059669" style={{ margin: '0 auto 0.75rem' }} />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                      {locale === 'bn' ? 'কোনো শিক্ষার্থী সংযুক্ত নেই' : 'No Students Enrolled Yet'}
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                      {locale === 'bn'
                        ? 'আপনার প্রতিষ্ঠানের শিক্ষার্থীরা আবেদন করলে এবং অনুমোদিত হলে এখানে তালিকাভুক্ত হবে।'
                        : 'Enrolled students will appear here once affiliated.'}
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                    {orgStudents
                      .filter((s) => {
                        if (!studentSearch.trim()) return true;
                        const q = studentSearch.toLowerCase();
                        return (
                          (s.fullName && s.fullName.toLowerCase().includes(q)) ||
                          (s.className && s.className.toLowerCase().includes(q)) ||
                          (s.rollNumber && s.rollNumber.toLowerCase().includes(q)) ||
                          (s.studentClassRoll && s.studentClassRoll.toLowerCase().includes(q)) ||
                          (s.phone && s.phone.includes(q)) ||
                          (s.email && s.email.toLowerCase().includes(q))
                        );
                      })
                      .map((s) => {
                        const roll = s.rollNumber || s.studentClassRoll;
                        const isVerified = s.verificationStatus === 'verified' || s.status === 'active';

                        return (
                          <div
                            key={s.id || s.profileId}
                            style={{
                              padding: '1.25rem',
                              backgroundColor: 'var(--background)',
                              borderRadius: 'var(--radius-lg)',
                              border: '1px solid var(--surface-border)',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              gap: '1rem',
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                  <div
                                    style={{
                                      width: '38px',
                                      height: '38px',
                                      borderRadius: '50%',
                                      backgroundColor: 'rgba(5, 150, 105, 0.12)',
                                      color: '#059669',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontWeight: 800,
                                      fontSize: '1rem',
                                    }}
                                  >
                                    {(s.fullName || 'S').charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <strong style={{ fontSize: '1rem', color: 'var(--text-main)', display: 'block' }}>
                                      {s.fullName}
                                    </strong>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                      {s.className ? `${locale === 'bn' ? 'শ্রেণি: ' : 'Class: '}${s.className}` : ''} {roll ? `• ${locale === 'bn' ? 'রোল: ' : 'Roll: '}${roll}` : ''}
                                    </span>
                                  </div>
                                </div>

                                {isVerified ? (
                                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#059669', backgroundColor: 'rgba(5, 150, 105, 0.1)', padding: '0.2rem 0.55rem', borderRadius: '9999px' }}>
                                    {locale === 'bn' ? 'অনুমোদিত' : 'Active'}
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#d97706', backgroundColor: 'rgba(217, 119, 6, 0.1)', padding: '0.2rem 0.55rem', borderRadius: '9999px' }}>
                                    {locale === 'bn' ? 'অপেক্ষমাণ' : 'Pending'}
                                  </span>
                                )}
                              </div>

                              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.5rem' }}>
                                {s.phone && <span>{locale === 'bn' ? 'মোবাইল: ' : 'Phone: '}<strong>{s.phone}</strong></span>}
                                {s.email && <span>{locale === 'bn' ? 'ইমেইল: ' : 'Email: '}{s.email}</span>}
                                {s.department && <span>{locale === 'bn' ? 'বিভাগ: ' : 'Dept: '}{s.department}</span>}
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                              <button
                                type="button"
                                onClick={() => setSelectedStudentId(s.id || s.userId || s.profileId)}
                                className="btn btn-outline"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '0.4rem',
                                  padding: '0.55rem 0.8rem',
                                  fontSize: '0.85rem',
                                  fontWeight: 700,
                                  flex: 1,
                                }}
                              >
                                <Eye size={15} />
                                {locale === 'bn' ? 'বিস্তারিত' : 'View'}
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  setRemovalModal({
                                    isOpen: true,
                                    memberId: s.id || s.userId || s.profileId,
                                    memberName: s.fullName || '',
                                    role: 'student',
                                    reason: '',
                                    submitting: false,
                                    error: '',
                                  })
                                }
                                className="btn btn-outline"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '0.4rem',
                                  padding: '0.55rem 0.8rem',
                                  fontSize: '0.82rem',
                                  fontWeight: 700,
                                  color: '#ef4444',
                                  borderColor: 'rgba(239, 68, 68, 0.3)',
                                  backgroundColor: 'rgba(239, 68, 68, 0.04)',
                                }}
                              >
                                <UserMinus size={15} />
                                {locale === 'bn' ? 'রিমুভ আবেদন' : 'Remove'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Affiliated Teachers List */}
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Users size={22} color="#2563eb" />
                      {locale === 'bn' ? 'অনুমোদিত শিক্ষক তালিকা' : 'Affiliated Teachers Directory'}
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.35rem' }}>
                      {locale === 'bn'
                        ? 'আপনার প্রতিষ্ঠানের অনুমোদিত শিক্ষকদের প্রোফাইল ও পূর্ণাঙ্গ পরিচিতি।'
                        : 'Directory and profiles of all verified faculty members in your institution.'}
                    </p>
                  </div>

                  <div style={{ position: 'relative', minWidth: '260px' }}>
                    <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      value={teacherSearch}
                      onChange={(e) => setTeacherSearch(e.target.value)}
                      placeholder={locale === 'bn' ? 'শিক্ষকের নাম, বিষয় বা পদবী দিয়ে খুঁজুন...' : 'Search by name, subject, designation...'}
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.85rem 0.55rem 2.25rem',
                        borderRadius: '10px',
                        border: '1px solid var(--surface-border)',
                        backgroundColor: 'var(--background)',
                        fontSize: '0.85rem',
                        color: 'var(--text-main)',
                        outline: 'none',
                      }}
                    />
                  </div>
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
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                      {locale === 'bn' ? 'বর্তমানে কোনো শিক্ষক সংযুক্ত নেই' : 'No Affiliated Teachers Yet'}
                    </h3>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                    {orgTeachers
                      .filter((tItem) => {
                        if (!teacherSearch.trim()) return true;
                        const q = teacherSearch.toLowerCase();
                        return (
                          (tItem.fullName && tItem.fullName.toLowerCase().includes(q)) ||
                          (tItem.department && tItem.department.toLowerCase().includes(q)) ||
                          (tItem.designation && tItem.designation.toLowerCase().includes(q)) ||
                          (tItem.phone && tItem.phone.includes(q)) ||
                          (tItem.email && tItem.email.toLowerCase().includes(q))
                        );
                      })
                      .map((tItem) => {
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
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              gap: '1rem',
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                  <div
                                    style={{
                                      width: '38px',
                                      height: '38px',
                                      borderRadius: '50%',
                                      backgroundColor: 'rgba(37, 99, 235, 0.12)',
                                      color: '#2563eb',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontWeight: 800,
                                      fontSize: '1rem',
                                    }}
                                  >
                                    {(tItem.fullName || 'T').charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <strong style={{ fontSize: '1rem', color: 'var(--text-main)', display: 'block' }}>
                                      {tItem.fullName}
                                    </strong>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                      {tItem.designation || (locale === 'bn' ? 'শিক্ষক' : 'Teacher')} {tItem.department ? `• ${tItem.department}` : ''}
                                    </span>
                                  </div>
                                </div>

                                {isApproved ? (
                                  <span
                                    style={{
                                      fontSize: '0.72rem',
                                      color: 'var(--primary)',
                                      fontWeight: 800,
                                      padding: '0.2rem 0.55rem',
                                      borderRadius: 'var(--radius-full)',
                                      backgroundColor: 'rgba(5, 150, 105, 0.1)',
                                    }}
                                  >
                                    {locale === 'bn' ? 'অনুমোদিত' : 'Verified'}
                                  </span>
                                ) : (
                                  <span
                                    style={{
                                      fontSize: '0.72rem',
                                      color: '#d97706',
                                      fontWeight: 800,
                                      padding: '0.2rem 0.55rem',
                                      borderRadius: 'var(--radius-full)',
                                      backgroundColor: 'rgba(217, 119, 6, 0.1)',
                                    }}
                                  >
                                    {locale === 'bn' ? 'পেন্ডিং' : 'Pending'}
                                  </span>
                                )}
                              </div>

                              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.5rem' }}>
                                {tItem.phone && <span>{locale === 'bn' ? 'ফোন: ' : 'Phone: '}<strong>{tItem.phone}</strong></span>}
                                {tItem.email && <span>{locale === 'bn' ? 'ইমেইল: ' : 'Email: '}{tItem.email}</span>}
                                {tItem.employeeId && <span>{locale === 'bn' ? 'আইডি: ' : 'ID: '}{tItem.employeeId}</span>}
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                onClick={() => setSelectedTeacher(tItem)}
                                className="btn btn-outline"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '0.4rem',
                                  padding: '0.55rem 0.8rem',
                                  fontSize: '0.85rem',
                                  fontWeight: 700,
                                  flex: 1,
                                }}
                              >
                                <Eye size={15} />
                                {locale === 'bn' ? 'বিস্তারিত' : 'View'}
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  setRemovalModal({
                                    isOpen: true,
                                    memberId: tItem.id || tItem.userId || tItem.profileId,
                                    memberName: tItem.fullName || '',
                                    role: 'teacher',
                                    reason: '',
                                    submitting: false,
                                    error: '',
                                  })
                                }
                                className="btn btn-outline"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '0.4rem',
                                  padding: '0.55rem 0.8rem',
                                  fontSize: '0.82rem',
                                  fontWeight: 700,
                                  color: '#ef4444',
                                  borderColor: 'rgba(239, 68, 68, 0.3)',
                                  backgroundColor: 'rgba(239, 68, 68, 0.04)',
                                }}
                              >
                                <UserMinus size={15} />
                                {locale === 'bn' ? 'রিমুভ আবেদন' : 'Remove'}
                              </button>

                              {!isApproved && (
                                <button
                                  type="button"
                                  onClick={() => handleApproveTeacher(tItem.id)}
                                  className="btn btn-primary"
                                  style={{
                                    padding: '0.55rem 1rem',
                                    fontSize: '0.85rem',
                                    fontWeight: 700,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                  }}
                                >
                                  <CheckCircle2 size={15} />
                                  {locale === 'bn' ? 'অনুমোদন' : 'Approve'}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            )}

            {/* Tab: My Personal Donations */}
            {activeTab === 'my-donations' && <MyDonationsSection />}

            {/* Tab: Institutional Students Donation Ledger (Replaced from Global Ledger) */}
            {activeTab === 'donations' && (
              <div
                style={{
                  backgroundColor: 'var(--surface)',
                  borderRadius: 'var(--radius-xl)',
                  border: '1px solid var(--surface-border)',
                  padding: '2rem',
                  boxShadow: 'var(--shadow-xs)',
                }}
              >
                {/* Header */}
                <div style={{ marginBottom: '1.75rem' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Receipt size={22} color="#059669" />
                    {locale === 'bn' ? 'শিক্ষার্থী অনুদান হিসাব লেজার' : 'Students Donation Ledger'}
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.35rem' }}>
                    {locale === 'bn'
                      ? 'আপনার প্রতিষ্ঠানের কোন কোন শিক্ষার্থীর জন্য কবে কত অনুদান জমা হয়েছে তার স্বচ্ছ ও বিস্তারিত খতিয়ান।'
                      : 'Verified records of donations received by students of your institution.'}
                  </p>
                </div>

                {/* Metric Summary Cards */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem',
                    marginBottom: '1.75rem',
                  }}
                >
                  <div
                    style={{
                      padding: '1.25rem',
                      backgroundColor: 'var(--background)',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--surface-border)',
                    }}
                  >
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                      {locale === 'bn' ? 'মোট প্রাপ্ত অনুদান' : 'Total Funds Received'}
                    </span>
                    <strong style={{ fontSize: '1.4rem', color: '#059669', fontWeight: 800 }}>
                      ৳{orgStudentDonations.reduce((acc, curr) => acc + Number(curr.amount || 0), 0).toLocaleString()}
                    </strong>
                  </div>

                  <div
                    style={{
                      padding: '1.25rem',
                      backgroundColor: 'var(--background)',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--surface-border)',
                    }}
                  >
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                      {locale === 'bn' ? 'অনুদানের মোট এন্ট্রি' : 'Total Donation Entries'}
                    </span>
                    <strong style={{ fontSize: '1.4rem', color: '#2563eb', fontWeight: 800 }}>
                      {orgStudentDonations.length} {locale === 'bn' ? 'টি' : 'Records'}
                    </strong>
                  </div>

                  <div
                    style={{
                      padding: '1.25rem',
                      backgroundColor: 'var(--background)',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--surface-border)',
                    }}
                  >
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                      {locale === 'bn' ? 'উপকৃত শিক্ষার্থী সংখ্যা' : 'Students Benefited'}
                    </span>
                    <strong style={{ fontSize: '1.4rem', color: 'var(--text-main)', fontWeight: 800 }}>
                      {new Set(orgStudentDonations.map((d) => d.studentId || d.studentName)).size} {locale === 'bn' ? 'জন' : 'Students'}
                    </strong>
                  </div>
                </div>

                {/* Search Bar */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.25rem' }}>
                  <div style={{ position: 'relative', minWidth: '280px', width: '100%', maxWidth: '380px' }}>
                    <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      value={donationSearch}
                      onChange={(e) => setDonationSearch(e.target.value)}
                      placeholder={locale === 'bn' ? 'শিক্ষার্থী, পোস্ট বা ট্রানজেকশন আইডি...' : 'Search student, post, TrxID...'}
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.85rem 0.55rem 2.25rem',
                        borderRadius: '10px',
                        border: '1px solid var(--surface-border)',
                        backgroundColor: 'var(--background)',
                        fontSize: '0.85rem',
                        color: 'var(--text-main)',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                {/* Ledger Records Table */}
                {loadingData ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    {locale === 'bn' ? 'লোড হচ্ছে...' : 'Loading...'}
                  </div>
                ) : orgStudentDonations.length === 0 ? (
                  <div
                    style={{
                      padding: '3.5rem 1.5rem',
                      textAlign: 'center',
                      backgroundColor: 'var(--background)',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--surface-border)',
                    }}
                  >
                    <Receipt size={44} color="#059669" style={{ margin: '0 auto 0.75rem' }} />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                      {locale === 'bn' ? 'কোনো অনুদানের রেকর্ড পাওয়া যায়নি' : 'No Donation Records Found'}
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                      {locale === 'bn'
                        ? 'আপনার প্রতিষ্ঠানের শিক্ষার্থীদের আবেদনে অনুদান জমা হলে স্বয়ংক্রিয়ভাবে এখানে তালিকাভুক্ত হবে।'
                        : 'Donations received for your students will appear here automatically.'}
                    </p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--surface-border)', color: 'var(--text-muted)' }}>
                          <th style={{ padding: '0.75rem 1rem' }}>{locale === 'bn' ? 'শিক্ষার্থী' : 'Student'}</th>
                          <th style={{ padding: '0.75rem 1rem' }}>{locale === 'bn' ? 'পোস্ট / তহবিল' : 'Campaign'}</th>
                          <th style={{ padding: '0.75rem 1rem' }}>{locale === 'bn' ? 'পরিমাণ' : 'Amount'}</th>
                          <th style={{ padding: '0.75rem 1rem' }}>{locale === 'bn' ? 'মাধ্যম ও TrxID' : 'Method & TrxID'}</th>
                          <th style={{ padding: '0.75rem 1rem' }}>{locale === 'bn' ? 'অনুদানকারী' : 'Donor'}</th>
                          <th style={{ padding: '0.75rem 1rem' }}>{locale === 'bn' ? 'তারিখ' : 'Date'}</th>
                          <th style={{ padding: '0.75rem 1rem' }}>{locale === 'bn' ? 'স্ট্যাটাস' : 'Status'}</th>
                          <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>{locale === 'bn' ? 'রসিদ' : 'Receipt'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orgStudentDonations
                          .filter((d) => {
                            if (!donationSearch.trim()) return true;
                            const q = donationSearch.toLowerCase();
                            return (
                              (d.studentName && d.studentName.toLowerCase().includes(q)) ||
                              (d.postTitle && d.postTitle.toLowerCase().includes(q)) ||
                              (d.transactionReference && d.transactionReference.toLowerCase().includes(q)) ||
                              (d.donorName && d.donorName.toLowerCase().includes(q))
                            );
                          })
                          .map((d) => {
                            const isAccepted = d.status === 'accepted';
                            const isPending = d.status === 'pending';
                            const roll = d.rollNumber || d.studentClassRoll;

                            return (
                              <tr
                                key={d.id}
                                style={{
                                  borderBottom: '1px solid var(--surface-border)',
                                  backgroundColor: 'transparent',
                                }}
                              >
                                <td style={{ padding: '1rem' }}>
                                  <strong style={{ color: 'var(--text-main)', display: 'block' }}>
                                    {d.studentName}
                                  </strong>
                                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                    {d.className ? `${d.className}` : ''} {roll ? `(রোল: ${roll})` : ''}
                                  </span>
                                </td>
                                <td style={{ padding: '1rem', maxWidth: '240px' }}>
                                  <div style={{ color: 'var(--text-main)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {d.postTitle || (locale === 'bn' ? 'সাধারণ অনুদান' : 'General')}
                                  </div>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                  <strong style={{ color: '#059669', fontSize: '0.95rem' }}>
                                    ৳{Number(d.amount).toLocaleString()}
                                  </strong>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                  <div style={{ color: 'var(--text-main)' }}>{d.paymentMethod}</div>
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                    {d.transactionReference}
                                  </span>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                  <span style={{ color: 'var(--text-main)' }}>
                                    {d.donorName || (locale === 'bn' ? 'গোপন অনুদানকারী' : 'Anonymous')}
                                  </span>
                                </td>
                                <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                                  {d.createdAt ? new Date(d.createdAt).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US') : '—'}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                  {isAccepted ? (
                                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#059669', backgroundColor: 'rgba(5, 150, 105, 0.1)', padding: '0.2rem 0.55rem', borderRadius: '9999px' }}>
                                      {locale === 'bn' ? 'গৃহীত' : 'Accepted'}
                                    </span>
                                  ) : isPending ? (
                                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#d97706', backgroundColor: 'rgba(217, 119, 6, 0.1)', padding: '0.2rem 0.55rem', borderRadius: '9999px' }}>
                                      {locale === 'bn' ? 'অপেক্ষিত' : 'Pending'}
                                    </span>
                                  ) : (
                                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#dc2626', backgroundColor: 'rgba(220, 38, 38, 0.1)', padding: '0.2rem 0.55rem', borderRadius: '9999px' }}>
                                      {locale === 'bn' ? 'বাতিল' : 'Rejected'}
                                    </span>
                                  )}
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSelectedReceipt({
                                        receiptNo: (d.id || '').substring(0, 8).toUpperCase(),
                                        date: new Date(d.createdAt).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US'),
                                        amount: `৳${Number(d.amount).toLocaleString()}`,
                                        purpose: d.postTitle || (locale === 'bn' ? 'শিক্ষার্থী সহায়তা অনুদান' : 'Student Support'),
                                        method: d.paymentMethod || 'Mobile Banking',
                                        trxId: d.transactionReference || 'N/A',
                                        donorName: d.donorName || (locale === 'bn' ? 'শুভাকাঙ্ক্ষী' : 'Well-wisher'),
                                      })
                                    }
                                    className="btn btn-outline"
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.35rem',
                                      padding: '0.4rem 0.75rem',
                                      fontSize: '0.78rem',
                                      fontWeight: 700,
                                    }}
                                  >
                                    <Receipt size={14} />
                                    {locale === 'bn' ? 'মানি রিসিট' : 'Receipt'}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
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
          initialData={{
            name: orgStatusData?.organization?.name || user?.fullName || '',
            address: orgStatusData?.organization?.address || user?.address || '',
            phone: orgStatusData?.organization?.phone || user?.phone || '',
            email: orgStatusData?.organization?.email || user?.email || '',
            type: orgStatusData?.organization?.type || 'qawmi_madrasa',
            registrationNumber: orgStatusData?.organization?.registrationNumber || '',
            description: orgStatusData?.organization?.description || '',
          }}
        />

        {/* Student Details Modal */}
        <StudentDetailsModal
          isOpen={!!selectedStudentId}
          studentId={selectedStudentId}
          onClose={() => setSelectedStudentId(null)}
          isBn={locale === 'bn'}
          onStudentUpdated={loadData}
        />

        {/* Teacher Details Modal */}
        <TeacherDetailsModal
          isOpen={!!selectedTeacher}
          teacher={selectedTeacher}
          onClose={() => setSelectedTeacher(null)}
          isBn={locale === 'bn'}
        />

        {/* Transfer Rejection Modal */}
        {rejectionModal.isOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '1rem',
            }}
          >
            <div
              style={{
                backgroundColor: 'var(--surface, #ffffff)',
                borderRadius: '16px',
                padding: '1.75rem',
                maxWidth: '480px',
                width: '100%',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
                border: '1px solid var(--surface-border, #e2e8f0)',
              }}
            >
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#991b1b', margin: '0 0 0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <XCircle size={20} color="#dc2626" />
                {locale === 'bn' ? 'স্থানান্তরের আবেদন প্রত্যাখ্যান' : 'Reject Transfer Request'}
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted, #64748b)', margin: '0 0 1rem' }}>
                {locale === 'bn'
                  ? `আপনি কি নিশ্চিত যে "${rejectionModal.userName}"-এর আবেদনটি প্রত্যাখ্যান করতে চান? আবেদনকারীকে অবগত করার জন্য একটি সুস্পষ্ট কারণ লিখুন:`
                  : `Are you sure you want to reject the transfer request for "${rejectionModal.userName}"? Please provide a reason:`}
              </p>
              <textarea
                rows={3}
                value={rejectionModal.reason}
                onChange={(e) =>
                  setRejectionModal((prev) => ({ ...prev, reason: e.target.value }))
                }
                placeholder={
                  locale === 'bn'
                    ? 'প্রত্যাখ্যানের যৌক্তিক কারণ লিখুন (যেমন: নথিপত্র অসম্পূর্ণ, প্রাতিষ্ঠানিক বকেয়া ইত্যাদি)...'
                    : 'Enter rejection reason (e.g. pending dues, incomplete documents)...'
                }
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '10px',
                  border: '1px solid var(--surface-border, #cbd5e1)',
                  fontSize: '0.875rem',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  marginBottom: '1.25rem',
                  outline: 'none',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() =>
                    setRejectionModal({ isOpen: false, transferId: '', userName: '', reason: '' })
                  }
                  className="btn btn-outline"
                  style={{ padding: '0.55rem 1.15rem', fontSize: '0.85rem', fontWeight: 700 }}
                >
                  {locale === 'bn' ? 'ফিরে যান' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleReviewTransfer(rejectionModal.transferId, false, rejectionModal.reason)
                  }
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.55rem 1.25rem',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    backgroundColor: '#dc2626',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                  }}
                >
                  <XCircle size={16} />
                  {locale === 'bn' ? 'বাতিল নিশ্চিত করুন' : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Member Removal Request Modal */}
        {removalModal.isOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '1rem',
            }}
            onClick={() => !removalModal.submitting && setRemovalModal((prev) => ({ ...prev, isOpen: false }))}
          >
            <div
              style={{
                backgroundColor: 'var(--surface)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--surface-border)',
                maxWidth: '480px',
                width: '100%',
                padding: '1.75rem',
                boxShadow: 'var(--shadow-xl)',
                color: 'var(--text-main)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                    color: '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <UserMinus size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                    {locale === 'bn' ? 'প্রতিষ্ঠান থেকে রিমুভ আবেদন' : 'Request Member Removal'}
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                    {removalModal.memberName} ({removalModal.role === 'teacher' ? (locale === 'bn' ? 'শিক্ষক' : 'Teacher') : (locale === 'bn' ? 'শিক্ষার্থী' : 'Student')})
                  </p>
                </div>
              </div>

              <div
                style={{
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(239, 68, 68, 0.06)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  fontSize: '0.82rem',
                  color: 'var(--text-muted)',
                  marginBottom: '1rem',
                  lineHeight: 1.5,
                }}
              >
                {locale === 'bn'
                  ? 'এই আবেদনটি প্ল্যাটফর্ম কর্তৃপক্ষ (মাস্টার বা সুপার এডমিন) পর্যালোচনা করে অনুমোদন করলে সদস্যের প্রোফাইল থেকে আপনার প্রতিষ্ঠান রিমুভ হবে এবং তার প্রাতিষ্ঠানিক ডাটার এক্সেস প্রত্যাহার করা হবে। তার পূর্ববর্তী সকল নিজস্ব রেকর্ড সংরক্ষিত থাকবে।'
                  : 'Upon authority approval, this member will be unlinked from your institution and their access to active institutional data will be revoked. Their prior individual records remain preserved.'}
              </div>

              {removalModal.error && (
                <div
                  style={{
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
                    fontSize: '0.82rem',
                    marginBottom: '1rem',
                  }}
                >
                  {removalModal.error}
                </div>
              )}

              <form onSubmit={handleRequestMemberRemoval}>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-main)' }}>
                    {locale === 'bn' ? 'রিমুভ করার সুস্পষ্ট কারণ লিখুন *' : 'Reason for Removal *'}
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={removalModal.reason}
                    onChange={(e) => setRemovalModal((prev) => ({ ...prev, reason: e.target.value }))}
                    placeholder={
                      locale === 'bn'
                        ? 'যেমন: প্রতিষ্ঠান পরিবর্তন বা পাঠদান/অধ্যয়ন সম্পন্ন হওয়া সংক্রান্ত কারণ...'
                        : 'e.g. Completed studies, left institution, etc...'
                    }
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--surface-border)',
                      backgroundColor: 'var(--background)',
                      color: 'var(--text-main)',
                      fontSize: '0.85rem',
                      resize: 'vertical',
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button
                    type="button"
                    disabled={removalModal.submitting}
                    onClick={() => setRemovalModal((prev) => ({ ...prev, isOpen: false }))}
                    className="btn btn-outline"
                    style={{ padding: '0.55rem 1.1rem', fontSize: '0.85rem' }}
                  >
                    {locale === 'bn' ? 'বাতিল' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={removalModal.submitting}
                    className="btn btn-primary"
                    style={{
                      padding: '0.55rem 1.25rem',
                      fontSize: '0.85rem',
                      backgroundColor: '#ef4444',
                      borderColor: '#ef4444',
                      color: '#ffffff',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}
                  >
                    {removalModal.submitting && <Loader2 size={15} className="spin" />}
                    <span>{locale === 'bn' ? 'আবেদন পাঠান' : 'Submit Request'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
