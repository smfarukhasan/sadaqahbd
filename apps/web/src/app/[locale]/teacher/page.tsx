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
  Building2,
  ShieldCheck,
  GraduationCap,
  Search,
  AlertCircle,
  Loader2,
  Send,
  Clock,
  MessageSquare,
  MapPin,
  Phone,
  Mail,
  User,
  ExternalLink,
} from 'lucide-react';
import { useAuthStore, getRoleDashboardPath } from '../../../lib/auth-store';
import PortalLayout, { PortalNavItem } from '../../../components/layout/PortalLayout';
import { getApiUrl } from '../../../lib/api-config';
import { getAuthToken } from '../../../lib/auth-token';
import EReceiptModal, { ReceiptData } from '../../../components/portal/EReceiptModal';
import AffiliationApplyModal from '../../../components/portal/AffiliationApplyModal';
import VerificationStatusView from '../../../components/portal/VerificationStatusView';
import StudentDetailsModal from '../../../components/portal/StudentDetailsModal';
import InstitutionTransferModal from '../../../components/portal/InstitutionTransferModal';
import TransferStatusBanner from '../../../components/portal/TransferStatusBanner';
import MyDonationsSection from '../../../components/portal/MyDonationsSection';

export default function TeacherDashboardPage() {
  const locale = useLocale();
  const isBn = locale === 'bn';
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const loadingAuth = useAuthStore((s) => s.loading);

  const [activeTab, setActiveTab] = useState<
    'verification' | 'students' | 'student-posts' | 'transfers' | 'complaints' | 'my-donations'
  >('verification');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const tabParam = new URLSearchParams(window.location.search).get('tab');
      if (
        tabParam === 'my-donations' ||
        tabParam === 'verification' ||
        tabParam === 'students' ||
        tabParam === 'student-posts' ||
        tabParam === 'transfers' ||
        tabParam === 'complaints'
      ) {
        setActiveTab(tabParam as any);
      }
    }
  }, []);

  const [teacherPendingPosts, setTeacherPendingPosts] = useState<any[]>([]);
  const [institutionStudents, setInstitutionStudents] = useState<any[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [institutionPosts, setInstitutionPosts] = useState<any[]>([]);
  const [postSearch, setPostSearch] = useState('');
  const [postFilter, setPostFilter] = useState<'all' | 'verified' | 'pending' | 'completed'>('all');

  // Complaints State
  const [complaintsList, setComplaintsList] = useState<any[]>([]);
  const [complaintSubject, setComplaintSubject] = useState('');
  const [complaintDesc, setComplaintDesc] = useState('');
  const [complaintSubmitted, setComplaintSubmitted] = useState(false);
  const [complaintSubmitting, setComplaintSubmitting] = useState(false);

  const [affiliationData, setAffiliationData] = useState<{
    hasAffiliated: boolean;
    status: 'unapplied' | 'pending_org' | 'pending_admin' | 'verified' | 'active' | 'rejected';
    profile: any;
    organization: any;
  } | null>(null);

  const [isAffiliationModalOpen, setIsAffiliationModalOpen] = useState(false);
  const [transferData, setTransferData] = useState<{
    hasTransfer: boolean;
    isPending: boolean;
    transfer: any;
  } | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
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

      // Parallelize fetching all relevant datasets
      const [affRes, postsRes, transferRes, membersRes, instPostsRes, complaintsRes] = await Promise.all([
        fetch(`${apiUrl}/users/my-affiliation`, { headers }).catch(() => null),
        fetch(`${apiUrl}/posts/teacher-pending`, { headers }).catch(() => null),
        fetch(`${apiUrl}/users/my-institution-transfer`, { headers }).catch(() => null),
        fetch(`${apiUrl}/organizations/my-members`, { headers }).catch(() => null),
        fetch(`${apiUrl}/posts/institution-posts`, { headers }).catch(() => null),
        fetch(`${apiUrl}/complaints/my`, { headers }).catch(() => null),
      ]);

      if (affRes && affRes.ok) {
        const affData = await affRes.json().catch(() => null);
        if (affData) setAffiliationData(affData);
      }

      if (postsRes && postsRes.ok) {
        const postsData = await postsRes.json().catch(() => null);
        if (Array.isArray(postsData)) setTeacherPendingPosts(postsData);
      }

      if (transferRes && transferRes.ok) {
        const transJson = await transferRes.json().catch(() => null);
        if (transJson) setTransferData(transJson);
      }

      if (membersRes && membersRes.ok) {
        const membersData = await membersRes.json().catch(() => null);
        if (membersData && Array.isArray(membersData.students)) {
          setInstitutionStudents(membersData.students);
        }
      }

      if (instPostsRes && instPostsRes.ok) {
        const instPostsData = await instPostsRes.json().catch(() => null);
        if (Array.isArray(instPostsData)) {
          setInstitutionPosts(instPostsData);
        }
      }

      if (complaintsRes && complaintsRes.ok) {
        const compData = await complaintsRes.json().catch(() => null);
        if (Array.isArray(compData)) {
          setComplaintsList(compData);
        }
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
      if (affiliationData?.status !== 'verified' || transferData?.isPending) {
        const timer = setInterval(() => {
          loadData();
        }, 10000);
        return () => clearInterval(timer);
      }
    }
  }, [user, affiliationData?.status, transferData?.isPending]);

  const handleTeacherVerify = async (postId: string) => {
    if (!confirm(isBn ? 'আপনি কি এই শিক্ষার্থীর আবেদনটির সত্যতা সত্যায়ন করতে চান?' : 'Are you sure you want to verify this student aid request?')) return;
    try {
      const token = await getAuthToken();
      if (!token) return;
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/posts/${postId}/teacher-verify`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setFeedback(isBn ? 'আবেদনটি সফলভাবে শিক্ষক সত্যায়ন সম্পন্ন হয়েছে!' : 'Student application successfully authenticated!');
        setTimeout(() => setFeedback(''), 4000);
        setTeacherPendingPosts((prev) => prev.filter((p) => p.id !== postId));
        loadData();
      }
    } catch (err) {
      console.error('Failed to verify post', err);
    }
  };

  const handleComplaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintSubject.trim() || !complaintDesc.trim()) return;

    try {
      setComplaintSubmitting(true);
      const token = await getAuthToken();
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/complaints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subject: complaintSubject.trim(),
          description: complaintDesc.trim(),
        }),
      });

      if (res.ok) {
        setComplaintSubmitted(true);
        setComplaintSubject('');
        setComplaintDesc('');
        loadData();
        setTimeout(() => setComplaintSubmitted(false), 5000);
      }
    } catch (err) {
      console.error('Failed to submit complaint', err);
    } finally {
      setComplaintSubmitting(false);
    }
  };

  const isVerified = affiliationData?.status === 'verified';

  if (loadingAuth || !user) {
    return (
      <div className="container" style={{ paddingTop: '6rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>{isBn ? 'লোড হচ্ছে...' : 'Loading...'}</p>
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
          badge: teacherPendingPosts.length || undefined,
        },
        {
          id: 'students',
          labelBn: 'শিক্ষার্থী লিস্ট',
          labelEn: 'Student List',
          icon: GraduationCap,
          badge: institutionStudents.length || undefined,
        },
        {
          id: 'student-posts',
          labelBn: 'শিক্ষার্থীর পোষ্ট',
          labelEn: 'Student Posts',
          icon: FileText,
          badge: institutionPosts.length || undefined,
        },
        {
          id: 'transfers',
          labelBn: 'প্রতিষ্ঠান পরিবর্তন',
          labelEn: 'Institution Transfer',
          icon: Building2,
          badge: transferData?.isPending ? 1 : undefined,
        },
        {
          id: 'complaints',
          labelBn: 'অভিযোগ',
          labelEn: 'Support & Complaints',
          icon: AlertCircle,
          badge: complaintsList.length || undefined,
        },
        {
          id: 'my-donations',
          labelBn: 'আমার দান সমূহ',
          labelEn: 'My Donations',
          icon: Heart,
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

  // Filtered students for current institution
  const filteredStudents = institutionStudents.filter((s) => {
    if (!studentSearch.trim()) return true;
    const q = studentSearch.toLowerCase();
    return (
      (s.fullName && s.fullName.toLowerCase().includes(q)) ||
      (s.className && s.className.toLowerCase().includes(q)) ||
      (s.rollNumber && s.rollNumber.toLowerCase().includes(q)) ||
      (s.phone && s.phone.includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q))
    );
  });

  // Filtered posts of current institution
  const filteredPosts = institutionPosts.filter((p) => {
    if (postFilter === 'verified' && p.verificationStatus !== 'verified') return false;
    if (postFilter === 'pending' && p.verificationStatus === 'verified') return false;
    if (postFilter === 'completed' && p.status !== 'completed') return false;

    if (!postSearch.trim()) return true;
    const q = postSearch.toLowerCase();
    return (
      (p.title && p.title.toLowerCase().includes(q)) ||
      (p.studentName && p.studentName.toLowerCase().includes(q)) ||
      (p.problemDescription && p.problemDescription.toLowerCase().includes(q))
    );
  });

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
            <div style={{ height: '28px', width: '240px', backgroundColor: 'var(--surface-border)', borderRadius: '8px', marginBottom: '10px' }} />
            <div style={{ height: '16px', width: '340px', backgroundColor: 'var(--surface-border)', borderRadius: '6px', marginBottom: '2rem' }} />
            <div style={{ height: '240px', backgroundColor: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: '16px' }} />
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

            {/* TAB 1: Student Verification Queue */}
            {activeTab === 'verification' && (
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
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    {isBn ? 'শিক্ষার্থী সত্যায়নের জন্য অপেক্ষমান তালিকা' : 'Pending Student Verification Queue'}
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.35rem' }}>
                    {isBn
                      ? `আপনার বর্তমান প্রতিষ্ঠান (${affiliationData?.organization?.name || 'অনুমোদিত প্রতিষ্ঠান'}) এর শিক্ষার্থীদের আর্থিক আবেদন পরীক্ষা ও সত্যায়ন করুন।`
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
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                        {isBn ? 'বর্তমানে কোনো আবেদন অপেক্ষমান নেই' : 'No Pending Verifications'}
                      </h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        {isBn ? 'আপনার প্রতিষ্ঠানের শিক্ষার্থীরা আবেদন করলে এখানে প্রদর্শিত হবে।' : 'New aid applications will appear here.'}
                      </p>
                    </div>
                  ) : (
                    teacherPendingPosts.map((post) => (
                      <div
                        key={post.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '1.25rem',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--surface-border)',
                          backgroundColor: 'var(--background)',
                          flexWrap: 'wrap',
                          gap: '1rem',
                        }}
                      >
                        <div style={{ flex: '1 1 300px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase' }}>
                            {post.category || (isBn ? 'সাধারণ আবেদন' : 'Aid Request')}
                          </span>
                          <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: '0.2rem 0 0.4rem' }}>
                            {post.title}
                          </h4>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {post.problemDesc || post.problemDescription}
                          </p>
                          <div style={{ marginTop: '0.5rem', display: 'flex', gap: '1rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            <span>{isBn ? 'শিক্ষার্থী: ' : 'Student: '}<strong>{post.studentName}</strong></span>
                            <span>{isBn ? 'প্রয়োজনীয় অর্থ: ' : 'Target: '}<strong>৳{Number(post.targetAmount || post.totalRequiredAmount || 0).toLocaleString()}</strong></span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                          <button
                            type="button"
                            onClick={() => setSelectedStudentId(post.studentId)}
                            className="btn btn-outline"
                            style={{ padding: '0.55rem 1rem', fontSize: '0.85rem' }}
                          >
                            <Eye size={15} style={{ marginRight: '4px' }} />
                            {isBn ? 'প্রোফাইল দেখুন' : 'View Profile'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTeacherVerify(post.id)}
                            className="btn btn-primary"
                            style={{ padding: '0.55rem 1.15rem', fontSize: '0.85rem' }}
                          >
                            <CheckCircle2 size={16} style={{ marginRight: '4px' }} />
                            {isBn ? 'সত্যায়ন সম্পন্ন করুন' : 'Verify Request'}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: Students List of Current Institution */}
            {activeTab === 'students' && (
              <div
                style={{
                  padding: '1.75rem',
                  backgroundColor: 'var(--surface)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--surface-border)',
                  boxShadow: 'var(--shadow-xs)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                      {isBn ? 'বর্তমান প্রতিষ্ঠানের শিক্ষার্থী তালিকা' : 'Enrolled Students Directory'}
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.35rem' }}>
                      {isBn
                        ? `প্রতিষ্ঠান: ${affiliationData?.organization?.name || 'বর্তমান প্রতিষ্ঠান'} (মোট ${institutionStudents.length} জন)`
                        : `Institution: ${affiliationData?.organization?.name || 'Current Institution'} (${institutionStudents.length} Students)`}
                    </p>
                  </div>

                  <div style={{ position: 'relative', width: '280px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      placeholder={isBn ? 'নাম, শ্রেণি বা রোল দিয়ে খুঁজুন...' : 'Search by name, class, roll...'}
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem 0.55rem 2.2rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--surface-border)',
                        backgroundColor: 'var(--background)',
                        color: 'var(--text-main)',
                        fontSize: '0.85rem',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                {filteredStudents.length === 0 ? (
                  <div style={{ padding: '3rem 1rem', textAlign: 'center', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)' }}>
                    <GraduationCap size={40} color="var(--primary)" style={{ margin: '0 auto 0.5rem' }} />
                    <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      {isBn ? 'কোনো শিক্ষার্থী পাওয়া যায়নি' : 'No Students Found'}
                    </h4>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                    {filteredStudents.map((s) => (
                      <div
                        key={s.id || s.profileId}
                        style={{
                          padding: '1.25rem',
                          backgroundColor: 'var(--background)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--surface-border)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: '0.85rem',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
                            <div
                              style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '50%',
                                backgroundColor: 'rgba(5, 150, 105, 0.12)',
                                color: 'var(--primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                              }}
                            >
                              {(s.fullName || 'S').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <strong style={{ fontSize: '0.98rem', color: 'var(--text-main)', display: 'block' }}>
                                {s.fullName}
                              </strong>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                {s.className ? `${isBn ? 'শ্রেণি: ' : 'Class: '}${s.className}` : ''} {s.rollNumber ? `• ${isBn ? 'রোল: ' : 'Roll: '}${s.rollNumber}` : ''}
                              </span>
                            </div>
                          </div>

                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            {s.phone && <span>{isBn ? 'মোবাইল: ' : 'Phone: '}<strong>{s.phone}</strong></span>}
                            {s.guardianName && <span>{isBn ? 'অভিভাবক: ' : 'Guardian: '}{s.guardianName}</span>}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedStudentId(s.id || s.profileId)}
                          className="btn btn-outline"
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.4rem',
                          }}
                        >
                          <Eye size={14} />
                          <span>{isBn ? 'প্রোফাইল দেখুন' : 'View Profile'}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Student Posts of Current Institution */}
            {activeTab === 'student-posts' && (
              <div
                style={{
                  padding: '1.75rem',
                  backgroundColor: 'var(--surface)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--surface-border)',
                  boxShadow: 'var(--shadow-xs)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                      {isBn ? 'বর্তমান প্রতিষ্ঠানের শিক্ষার্থীদের পোষ্ট' : 'Institutional Student Campaigns'}
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.35rem' }}>
                      {isBn
                        ? 'আপনার প্রতিষ্ঠানের শিক্ষার্থীদের চলমান ও পূর্ববর্তী সকল আর্থিক সহায়তা পোষ্ট পর্যবেক্ষণ করুন।'
                        : 'Review active and historical student aid campaigns from your current institution.'}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <select
                      value={postFilter}
                      onChange={(e) => setPostFilter(e.target.value as any)}
                      style={{
                        padding: '0.55rem 0.85rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--surface-border)',
                        backgroundColor: 'var(--background)',
                        color: 'var(--text-main)',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                      }}
                    >
                      <option value="all">{isBn ? 'সকল পোষ্ট' : 'All Posts'}</option>
                      <option value="verified">{isBn ? 'অনুমোদিত / সক্রিয়' : 'Verified'}</option>
                      <option value="pending">{isBn ? 'অপেক্ষমাণ' : 'Pending'}</option>
                      <option value="completed">{isBn ? 'সম্পন্ন / ফান্ডেড' : 'Completed'}</option>
                    </select>

                    <div style={{ position: 'relative', width: '240px' }}>
                      <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input
                        type="text"
                        placeholder={isBn ? 'পোস্ট বা শিক্ষার্থী খুঁজুন...' : 'Search campaigns...'}
                        value={postSearch}
                        onChange={(e) => setPostSearch(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.55rem 0.75rem 0.55rem 2.2rem',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--surface-border)',
                          backgroundColor: 'var(--background)',
                          color: 'var(--text-main)',
                          fontSize: '0.85rem',
                          outline: 'none',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {filteredPosts.length === 0 ? (
                  <div style={{ padding: '3rem 1rem', textAlign: 'center', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)' }}>
                    <FileText size={40} color="var(--primary)" style={{ margin: '0 auto 0.5rem' }} />
                    <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      {isBn ? 'কোনো শিক্ষার্থী পোষ্ট পাওয়া যায়নি' : 'No Campaigns Found'}
                    </h4>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {filteredPosts.map((post) => {
                      const isPostVerified = post.verificationStatus === 'verified';
                      const received = Number(post.receivedAmount || 0);
                      const target = Number(post.totalRequiredAmount || post.targetAmount || 1);
                      const percent = Math.min(100, Math.round((received / target) * 100));

                      return (
                        <div
                          key={post.id}
                          style={{
                            padding: '1.25rem',
                            backgroundColor: 'var(--background)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--surface-border)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.75rem',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase' }}>
                                  {post.category || (isBn ? 'শিক্ষা অনুদান' : 'Education')}
                                </span>
                                {isPostVerified ? (
                                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#059669', backgroundColor: 'rgba(5, 150, 105, 0.1)', padding: '0.15rem 0.5rem', borderRadius: '9999px' }}>
                                    {isBn ? 'অনুমোদিত' : 'Verified'}
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#d97706', backgroundColor: 'rgba(217, 119, 6, 0.1)', padding: '0.15rem 0.5rem', borderRadius: '9999px' }}>
                                    {isBn ? 'যাচাই অপেক্ষমাণ' : 'Pending'}
                                  </span>
                                )}
                              </div>
                              <h4 style={{ fontSize: '1.08rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.25rem' }}>
                                {post.title}
                              </h4>
                              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                {isBn ? 'শিক্ষার্থী: ' : 'Student: '}<strong>{post.studentName}</strong>
                                {post.studentClass ? ` (${post.studentClass})` : ''}
                              </span>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                              <strong style={{ fontSize: '1.05rem', color: '#059669', display: 'block' }}>
                                ৳{received.toLocaleString()} / ৳{target.toLocaleString()}
                              </strong>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {percent}% {isBn ? 'সংগৃহীত' : 'Raised'}
                              </span>
                            </div>
                          </div>

                          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                            {post.problemDescription || post.problemDesc}
                          </p>

                          <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--surface-border)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${percent}%`, height: '100%', backgroundColor: '#059669', borderRadius: '3px' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: Institution Transfer Standalone Tab */}
            {activeTab === 'transfers' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* 1. Current Institution Common Data Header */}
                <div
                  style={{
                    padding: '1.75rem',
                    backgroundColor: 'var(--surface)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--surface-border)',
                    boxShadow: 'var(--shadow-xs)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '12px',
                          backgroundColor: 'rgba(5, 150, 105, 0.12)',
                          color: 'var(--primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Building2 size={24} />
                      </div>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                          {isBn ? 'আপনার বর্তমান কর্মস্থল' : 'Current Affiliated Institution'}
                        </span>
                        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', margin: '0.15rem 0 0' }}>
                          {affiliationData?.organization?.name || affiliationData?.profile?.orgName || (isBn ? 'প্রতিষ্ঠান নির্ধারিত নেই' : 'No Institution Assigned')}
                        </h2>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsTransferModalOpen(true)}
                      className="btn btn-primary"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        padding: '0.65rem 1.25rem',
                        fontSize: '0.88rem',
                        fontWeight: 700,
                      }}
                    >
                      <Building2 size={16} />
                      <span>{isBn ? 'নতুন প্রতিষ্ঠানে স্থানান্তর আবেদন' : 'Apply for Institution Transfer'}</span>
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                    <div style={{ padding: '0.85rem 1rem', backgroundColor: 'var(--background)', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                        {isBn ? 'প্রতিষ্ঠানের ধরন' : 'Institution Type'}
                      </span>
                      <strong style={{ fontSize: '0.92rem', color: 'var(--text-main)' }}>
                        {affiliationData?.organization?.type || (isBn ? 'কওমি মাদ্রাসা' : 'General')}
                      </strong>
                    </div>

                    <div style={{ padding: '0.85rem 1rem', backgroundColor: 'var(--background)', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                        {isBn ? 'আপনার পদবী' : 'Your Designation'}
                      </span>
                      <strong style={{ fontSize: '0.92rem', color: 'var(--text-main)' }}>
                        {affiliationData?.profile?.designation || (isBn ? 'শিক্ষক' : 'Teacher')} ({affiliationData?.profile?.department || 'সাধারণ'})
                      </strong>
                    </div>

                    {affiliationData?.organization?.contactPhone && (
                      <div style={{ padding: '0.85rem 1rem', backgroundColor: 'var(--background)', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                          {isBn ? 'প্রতিষ্ঠানের ফোন' : 'Contact Phone'}
                        </span>
                        <strong style={{ fontSize: '0.92rem', color: 'var(--text-main)' }}>
                          {affiliationData.organization.contactPhone}
                        </strong>
                      </div>
                    )}

                    {affiliationData?.organization?.address && (
                      <div style={{ padding: '0.85rem 1rem', backgroundColor: 'var(--background)', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                          {isBn ? 'ঠিকানা' : 'Address'}
                        </span>
                        <strong style={{ fontSize: '0.92rem', color: 'var(--text-main)' }}>
                          {affiliationData.organization.address}
                        </strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Transfer Status Banner */}
                {transferData?.hasTransfer && (
                  <TransferStatusBanner
                    transfer={transferData.transfer}
                    onRefresh={loadData}
                    onRequestNewTransfer={() => setIsTransferModalOpen(true)}
                  />
                )}

                {/* 3. Three-Stage Policy Guide */}
                <div
                  style={{
                    padding: '1.5rem',
                    backgroundColor: 'var(--surface)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--surface-border)',
                    boxShadow: 'var(--shadow-xs)',
                  }}
                >
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldCheck size={20} color="#059669" />
                    {isBn ? 'শিক্ষক প্রতিষ্ঠান পরিবর্তন ও ৩-ধাপের ছাড়পত্র নির্দেশিকা' : 'Teacher Transfer & 3-Stage Clearance Guidelines'}
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                    <div style={{ padding: '1.15rem', background: 'rgba(5, 150, 105, 0.04)', borderRadius: '8px', border: '1px solid rgba(5, 150, 105, 0.15)' }}>
                      <div style={{ fontWeight: 800, color: '#059669', fontSize: '0.95rem', marginBottom: '0.35rem' }}>
                        {isBn ? '১. বর্তমান প্রতিষ্ঠানের ছাড়পত্র' : '1. Current Institution Release'}
                      </div>
                      <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                        {isBn
                          ? 'আবেদনের পর আপনার বর্তমান প্রতিষ্ঠান পর্যালোচনা করে শিক্ষক ছাড়পত্র প্রদান করবে।'
                          : 'After submission, your current institution reviews and grants release clearance.'}
                      </p>
                    </div>
                    <div style={{ padding: '1.15rem', background: 'rgba(14, 165, 233, 0.04)', borderRadius: '8px', border: '1px solid rgba(14, 165, 233, 0.15)' }}>
                      <div style={{ fontWeight: 800, color: '#0284c7', fontSize: '0.95rem', marginBottom: '0.35rem' }}>
                        {isBn ? '২. নতুন প্রতিষ্ঠানের গ্রহণ' : '2. Target Institution Acceptance'}
                      </div>
                      <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                        {isBn
                          ? 'বর্তমান প্রতিষ্ঠান ছাড়পত্র দেওয়ার পর নির্বাচিত নতুন প্রতিষ্ঠান আবেদনটি পর্যালোচনা করে শিক্ষক হিসেবে গ্রহণ করবে।'
                          : 'Once released, your newly selected institution reviews and accepts you as teacher.'}
                      </p>
                    </div>
                    <div style={{ padding: '1.15rem', background: 'rgba(124, 58, 237, 0.04)', borderRadius: '8px', border: '1px solid rgba(124, 58, 237, 0.15)' }}>
                      <div style={{ fontWeight: 800, color: '#7c3aed', fontSize: '0.95rem', marginBottom: '0.35rem' }}>
                        {isBn ? '৩. কর্তৃপক্ষের চূড়ান্ত ছাড়পত্র' : '3. Final Authority Clearance'}
                      </div>
                      <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                        {isBn
                          ? 'উভয় প্রতিষ্ঠানের অনুমোদনের পর কর্তৃপক্ষ চূড়ান্ত অডিট যাচাই শেষে শিক্ষক প্রোফাইল আপডেট করবেন।'
                          : 'After both institutions agree, authority verifies and completes teacher profile migration.'}
                      </p>
                    </div>
                  </div>
                  <div style={{ marginTop: '1.25rem', padding: '0.85rem 1rem', background: 'var(--background)', borderRadius: '8px', border: '1px solid var(--surface-border)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    ℹ️ <strong>{isBn ? 'ডাটা সংরক্ষণ নীতি:' : 'Data Integrity Note:'}</strong>{' '}
                    {isBn
                      ? 'স্থানান্তরের পর থেকে আপনি শুধুমাত্র নতুন প্রতিষ্ঠানের শিক্ষার্থীদের ডাটা ও ক্যাম্পেইন দেখতে পারবেন। আপনার পূর্বের প্রতিষ্ঠানের সকল নিজস্ব ডাটা সুরক্ষিত ঐতিহাসিক রেকর্ড হিসেবে প্রোফাইলে প্রদর্শিত হবে।'
                      : 'Following transfer, you will exclusively manage students and campaigns of the active institution. Prior institutional records remain preserved in your profile audit history.'}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: Complaints & Support */}
            {activeTab === 'complaints' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div
                  style={{
                    padding: '1.75rem',
                    backgroundColor: 'var(--surface)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--surface-border)',
                    boxShadow: 'var(--shadow-xs)',
                  }}
                >
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.4rem' }}>
                    {isBn ? 'কর্তৃপক্ষের কাছে অভিযোগ ও সহায়তা টিকিট' : 'Support & Official Grievances'}
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0 0 1.5rem' }}>
                    {isBn
                      ? 'প্রতিষ্ঠান, শিক্ষার্থী বা প্ল্যাটফর্ম সংক্রান্ত যেকোনো সমস্যা বা অভিযোগ সরাসরি প্ল্যাটফর্ম কর্তৃপক্ষের কাছে দাখিল করুন।'
                      : 'Submit official complaints or support tickets directly to platform authorities.'}
                  </p>

                  {complaintSubmitted && (
                    <div
                      style={{
                        padding: '1rem',
                        backgroundColor: 'rgba(5, 150, 105, 0.1)',
                        border: '1px solid #059669',
                        borderRadius: 'var(--radius-md)',
                        color: '#047857',
                        fontWeight: 700,
                        marginBottom: '1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <CheckCircle2 size={18} />
                      <span>
                        {isBn
                          ? 'আপনার অভিযোগটি সফলভাবে গৃহীত হয়েছে। কর্তৃপক্ষ বিষয়টি পর্যালোচনা করে দ্রুত পদক্ষেপ গ্রহণ করবেন।'
                          : 'Complaint submitted successfully. Platform authority will review and respond shortly.'}
                      </span>
                    </div>
                  )}

                  <form onSubmit={handleComplaintSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-main)' }}>
                        {isBn ? 'অভিযোগ বা সমস্যার বিষয় *' : 'Subject *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={complaintSubject}
                        onChange={(e) => setComplaintSubject(e.target.value)}
                        placeholder={isBn ? 'যেমন: প্রতিষ্ঠান ছাড়পত্রে বিলম্ব অথবা শিক্ষার্থী তথ্যে অসঙ্গতি' : 'e.g. Clearance delay, discrepancy in student record'}
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.85rem',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--surface-border)',
                          backgroundColor: 'var(--background)',
                          color: 'var(--text-main)',
                          fontSize: '0.88rem',
                          outline: 'none',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-main)' }}>
                        {isBn ? 'বিস্তারিত বিবরণ লিখুন *' : 'Detailed Description *'}
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={complaintDesc}
                        onChange={(e) => setComplaintDesc(e.target.value)}
                        placeholder={isBn ? 'সমস্যার বিস্তারিত বিবরণ ও সংশ্লিষ্ট তথ্য উল্লেখ করুন...' : 'Describe the issue in detail...'}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--surface-border)',
                          backgroundColor: 'var(--background)',
                          color: 'var(--text-main)',
                          fontSize: '0.88rem',
                          outline: 'none',
                          resize: 'vertical',
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        type="submit"
                        disabled={complaintSubmitting}
                        className="btn btn-primary"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.45rem',
                          padding: '0.65rem 1.35rem',
                          fontSize: '0.88rem',
                          fontWeight: 700,
                        }}
                      >
                        {complaintSubmitting ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
                        <span>{isBn ? 'অভিযোগ দাখিল করুন' : 'Submit Ticket'}</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* Submitted Complaints History */}
                <div
                  style={{
                    padding: '1.75rem',
                    backgroundColor: 'var(--surface)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--surface-border)',
                    boxShadow: 'var(--shadow-xs)',
                  }}
                >
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 1rem' }}>
                    {isBn ? `আমার দাখিলকৃত অভিযোগসমূহ (${complaintsList.length})` : `My Submitted Complaints (${complaintsList.length})`}
                  </h3>

                  {complaintsList.length === 0 ? (
                    <div style={{ padding: '2.5rem 1rem', textAlign: 'center', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)' }}>
                      <MessageSquare size={36} color="var(--primary)" style={{ margin: '0 auto 0.5rem' }} />
                      <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0 }}>
                        {isBn ? 'পূর্বে কোনো অভিযোগ দাখিল করা হয়নি।' : 'No complaints filed yet.'}
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {complaintsList.map((c) => (
                        <div
                          key={c.id}
                          style={{
                            padding: '1.15rem',
                            backgroundColor: 'var(--background)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--surface-border)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.4rem' }}>
                            <strong style={{ fontSize: '1rem', color: 'var(--text-main)' }}>
                              {c.subject || c.title}
                            </strong>
                            <span
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                padding: '0.2rem 0.55rem',
                                borderRadius: '9999px',
                                backgroundColor: c.status === 'resolved' ? 'rgba(5, 150, 105, 0.1)' : 'rgba(217, 119, 6, 0.1)',
                                color: c.status === 'resolved' ? '#059669' : '#d97706',
                              }}
                            >
                              {c.status === 'resolved' ? (isBn ? 'সমাধান হয়েছে' : 'Resolved') : (isBn ? 'পর্যালোচনায় রয়েছে' : 'Under Review')}
                            </span>
                          </div>

                          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 0.5rem', lineHeight: 1.5 }}>
                            {c.description || c.desc}
                          </p>

                          {c.adminReply && (
                            <div
                              style={{
                                marginTop: '0.5rem',
                                padding: '0.75rem 1rem',
                                backgroundColor: 'rgba(37, 99, 235, 0.05)',
                                borderLeft: '3px solid #2563eb',
                                borderRadius: '0 6px 6px 0',
                                fontSize: '0.82rem',
                              }}
                            >
                              <strong style={{ color: '#2563eb', display: 'block', marginBottom: '0.2rem' }}>
                                {isBn ? 'কর্তৃপক্ষের জবাব:' : 'Authority Response:'}
                              </strong>
                              <span style={{ color: 'var(--text-main)' }}>{c.adminReply}</span>
                            </div>
                          )}

                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                            {c.createdAt ? new Date(c.createdAt).toLocaleDateString(isBn ? 'bn-BD' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 6: Personal Donations */}
            {activeTab === 'my-donations' && <MyDonationsSection />}
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

        {/* Institution Transfer Modal */}
        <InstitutionTransferModal
          isOpen={isTransferModalOpen}
          onClose={() => setIsTransferModalOpen(false)}
          role="teacher"
          currentOrg={
            affiliationData?.organization || {
              id: affiliationData?.profile?.organizationId || (user as any)?.organizationId || '',
              name: affiliationData?.profile?.orgName || 'বর্তমান প্রতিষ্ঠান',
            }
          }
          onSuccess={() => {
            loadData();
          }}
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
