'use client';

import React, { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { Link, useRouter } from '../../../i18n/routing';
import {
  GraduationCap,
  PlusCircle,
  FileText,
  MessageSquareWarning,
  CheckCircle2,
  Clock,
  AlertCircle,
  Send,
  Building2,
} from 'lucide-react';
import { useAuthStore, getRoleDashboardPath } from '../../../lib/auth-store';
import PortalLayout, { PortalNavItem } from '../../../components/layout/PortalLayout';
import { getApiUrl } from '../../../lib/api-config';
import AffiliationApplyModal from '../../../components/portal/AffiliationApplyModal';
import VerificationStatusView from '../../../components/portal/VerificationStatusView';
import StudentApplicationForm from '../../../components/portal/StudentApplicationForm';

export default function StudentDashboardPage() {
  const locale = useLocale();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const loadingAuth = useAuthStore((s) => s.loading);

  const [activeNav, setActiveNav] = useState<'overview' | 'applications' | 'complaints'>('overview');
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [studentPosts, setStudentPosts] = useState<any[]>([]);
  const [affiliationData, setAffiliationData] = useState<{
    hasAffiliated: boolean;
    status: 'unapplied' | 'pending_org' | 'pending_admin' | 'verified' | 'rejected';
    profile: any;
    organization: any;
  } | null>(null);
  const [isAffiliationModalOpen, setIsAffiliationModalOpen] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Check URL query parameters to auto-open application creation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('tab') === 'applications') {
        setActiveNav('applications');
      }
      if (params.get('action') === 'new' || params.get('action') === 'new_post') {
        setActiveNav('applications');
        setIsCreatingPost(true);
      }
    }
  }, []);

  // Student complaint state
  const [complaintSubject, setComplaintSubject] = useState('');
  const [complaintDesc, setComplaintDesc] = useState('');
  const [complaintsList, setComplaintsList] = useState<
    Array<{ id: string; subject: string; desc: string; date: string; status: string }>
  >([]);
  const [complaintSubmitted, setComplaintSubmitted] = useState(false);

  // Role Protection Guard
  useEffect(() => {
    if (!loadingAuth) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'student') {
        router.replace(getRoleDashboardPath(user.role) as any);
      }
    }
  }, [user, loadingAuth, router]);

  const loadData = async () => {
    if (!firebaseUser || !user) return;
    try {
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
      } catch (err) {
        console.error('Failed to load student affiliation status:', err);
      }

      // 2. Fetch Student posts
      try {
        const res = await fetch(`${apiUrl}/posts/my-posts`, { headers });
        if (res.ok) {
          setStudentPosts(await res.json());
        }
      } catch (err) {
        console.error('Failed to load student posts', err);
      }
    } catch (err) {
      console.error('Failed to load student posts', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'student') {
      loadData();
      // Live polling every 6 seconds if not verified
      const timer = setInterval(() => {
        loadData();
      }, 6000);
      return () => clearInterval(timer);
    }
  }, [firebaseUser, user]);

  const handleComplaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintSubject.trim() || !complaintDesc.trim()) return;

    try {
      const token = await firebaseUser?.getIdToken();
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/complaints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          subject: complaintSubject,
          description: complaintDesc,
        }),
      });

      if (res.ok) {
        setComplaintSubmitted(true);
        setComplaintsList((prev) => [
          {
            id: Date.now().toString(),
            subject: complaintSubject,
            desc: complaintDesc,
            date: new Date().toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US'),
            status: 'অপেক্ষমান (Pending)',
          },
          ...prev,
        ]);
        setComplaintSubject('');
        setComplaintDesc('');
      }
    } catch (err) {
      console.error('Failed to submit complaint', err);
    }
  };

  if (loadingAuth || !user) {
    return (
      <div className="container" style={{ paddingTop: '6rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>লোড হচ্ছে...</p>
      </div>
    );
  }

  const totalReq = studentPosts.reduce((acc, p) => acc + Number(p.totalRequiredAmount || 0), 0);
  const totalRec = studentPosts.reduce((acc, p) => acc + Number(p.receivedAmount || 0), 0);

  const isVerified = affiliationData?.status === 'verified';

  const navItems: PortalNavItem[] = isVerified
    ? [
        {
          id: 'overview',
          labelBn: 'মূল ড্যাশবোর্ড',
          labelEn: 'Overview',
          icon: GraduationCap,
        },
        {
          id: 'applications',
          labelBn: 'আমার আবেদনসমূহ',
          labelEn: 'My Applications',
          icon: FileText,
          badge: studentPosts.length,
        },
        {
          id: 'complaints',
          labelBn: 'অভিযোগ ও সহায়তা',
          labelEn: 'Support & Complaints',
          icon: MessageSquareWarning,
          badge: complaintsList.length,
        },
      ]
    : [];

  return (
    <PortalLayout
      role="student"
      roleNameBn="শিক্ষার্থী পোর্টাল"
      roleNameEn="Student Portal"
      roleIcon={GraduationCap}
      navItems={navItems}
      activeNav={activeNav}
      onNavSelect={(id: any) => setActiveNav(id)}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {!isVerified ? (
          <VerificationStatusView
            status={affiliationData?.status || 'unapplied'}
            role="student"
            organizationName={affiliationData?.organization?.name || affiliationData?.profile?.institutionName}
            rejectionReason={affiliationData?.profile?.rejectionReason}
            onApply={() => setIsAffiliationModalOpen(true)}
            onChangeInstitution={() => setIsAffiliationModalOpen(true)}
          />
        ) : (
          <div>
            {/* VIEW 1: OVERVIEW */}
            {activeNav === 'overview' && (
              <div>
                {/* Top Action Header */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    marginBottom: '1.5rem',
                  }}
                >
                  <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                      স্বাগতম, {user.fullName}
                    </h1>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
                      আপনার শিক্ষা সহায়তা আবেদন ও অগ্রগতির সামগ্রিক চিত্র
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveNav('applications');
                      setIsCreatingPost(true);
                    }}
                    className="btn btn-primary"
                    style={{ cursor: 'pointer', border: 'none' }}
                  >
                    <PlusCircle size={18} />
                    <span>নতুন আবেদন তৈরি করুন</span>
                  </button>
                </div>
                {/* KPI Cards */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem',
              }}
            >
              <div
                style={{
                  padding: '1.25rem',
                  backgroundColor: 'var(--surface)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--surface-border, #e2e8f0)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                }}
              >
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>মোট জমাকৃত আবেদন</span>
                <h3 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', margin: '0.25rem 0 0' }}>
                  {studentPosts.length} টি
                </h3>
              </div>

              <div
                style={{
                  padding: '1.25rem',
                  backgroundColor: 'var(--surface)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--surface-border, #e2e8f0)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                }}
              >
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>প্রয়োজনীয় সহায়তার অর্থ</span>
                <h3 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#059669', margin: '0.25rem 0 0' }}>
                  ৳{totalReq.toLocaleString()}
                </h3>
              </div>

              <div
                style={{
                  padding: '1.25rem',
                  backgroundColor: 'var(--surface)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--surface-border, #e2e8f0)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                }}
              >
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>সংগৃহীত সহায়তার অর্থ</span>
                <h3 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#047857', margin: '0.25rem 0 0' }}>
                  ৳{totalRec.toLocaleString()}
                </h3>
              </div>
            </div>

            {/* Recent Applications Quick Card */}
            <div
              style={{
                padding: '1.75rem',
                backgroundColor: 'var(--surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--surface-border, #e2e8f0)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={20} color="#059669" />
                  সাম্প্রতিক আবেদনসমূহ
                </h3>
                <button
                  onClick={() => setActiveNav('applications')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#059669',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  সব দেখুন ({studentPosts.length}) →
                </button>
              </div>

              {loadingData ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>লোড হচ্ছে...</div>
              ) : studentPosts.length === 0 ? (
                <div
                  style={{
                    padding: '2.5rem 1.25rem',
                    textAlign: 'center',
                    backgroundColor: 'var(--background)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--surface-border, #e2e8f0)',
                  }}
                >
                  <GraduationCap size={36} color="#059669" style={{ margin: '0 auto 0.75rem' }} />
                  <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                    আপনার কোনো আবেদন দাখিল করা নেই
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                    শিক্ষা সহায়তার জন্য নতুন আবেদন দাখিল করুন।
                  </p>
                  <Link
                    href="/posts/create"
                    className="btn btn-primary"
                    style={{ display: 'inline-flex', padding: '0.55rem 1.25rem', fontSize: '0.85rem', fontWeight: '700', textDecoration: 'none' }}
                  >
                    <PlusCircle size={16} style={{ marginRight: '0.4rem' }} /> আবেদন তৈরি করুন
                  </Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {studentPosts.slice(0, 3).map((post) => {
                    const step2Done = !!post.isTeacherVerified;
                    const step3Done = !!post.isOrgVerified;
                    const step4Done = post.verificationStatus === 'approved';

                    return (
                      <div
                        key={post.id}
                        style={{
                          padding: '1.25rem',
                          backgroundColor: 'var(--background, #f8fafc)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--surface-border, #e2e8f0)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
                            {post.title}
                          </h4>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              padding: '0.2rem 0.6rem',
                              backgroundColor: step4Done ? 'rgba(5, 150, 105, 0.12)' : 'rgba(217, 119, 6, 0.12)',
                              color: step4Done ? '#047857' : 'var(--accent, #d97706)',
                              borderRadius: 'var(--radius-full)',
                              fontWeight: '700',
                            }}
                          >
                            {step4Done ? 'অনুমোদিত ও উন্মুক্ত' : post.verificationStatus === 'rejected' ? 'প্রত্যাখ্যাত' : 'যাচাই প্রক্রিয়াধীন'}
                          </span>
                        </div>

                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                          প্রয়োজনীয় অর্থ: <strong style={{ color: '#059669' }}>৳{Number(post.totalRequiredAmount).toLocaleString()}</strong> • সংগৃহীত: ৳{Number(post.receivedAmount).toLocaleString()}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: APPLICATIONS */}
        {activeNav === 'applications' && (
          <div>
            {isCreatingPost ? (
              <StudentApplicationForm
                affiliationData={affiliationData}
                onCancel={() => setIsCreatingPost(false)}
                onSuccess={() => {
                  setIsCreatingPost(false);
                  loadData();
                }}
              />
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                      আমার জমাকৃত আবেদনসমূহ
                    </h1>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
                      আপনার সমস্ত শিক্ষা সহায়তা আবেদনের বর্তমান অবস্থা এবং সত্যায়ন অগ্রগতি
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsCreatingPost(true)}
                    className="btn btn-primary"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.65rem 1.25rem',
                      fontWeight: '700',
                      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                      boxShadow: '0 4px 12px -2px rgba(5, 150, 105, 0.4)',
                      border: 'none',
                      borderRadius: 'var(--radius-md, 8px)',
                      color: '#ffffff',
                      cursor: 'pointer',
                    }}
                  >
                    <PlusCircle size={18} />
                    <span>নতুন আবেদন তৈরি করুন</span>
                  </button>
                </div>

                <div
                  style={{
                    padding: '1.75rem',
                    backgroundColor: 'var(--surface)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--surface-border, #e2e8f0)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  }}
                >
                  {loadingData ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>লোড হচ্ছে...</div>
                  ) : studentPosts.length === 0 ? (
                    <div
                      style={{
                        padding: '3rem 1.25rem',
                        textAlign: 'center',
                        backgroundColor: 'var(--background, #f8fafc)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--surface-border, #e2e8f0)',
                      }}
                    >
                      <GraduationCap size={42} color="#059669" style={{ margin: '0 auto 0.75rem' }} />
                      <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                        কোনো আবেদন পাওয়া যায়নি
                      </h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                        আপনার নতুন একটি শিক্ষা সহায়তার আবেদন তৈরি করে সাবমিট করুন।
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsCreatingPost(true)}
                        className="btn btn-primary"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '0.6rem 1.25rem',
                          fontSize: '0.88rem',
                          fontWeight: '700',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#ffffff',
                          borderRadius: 'var(--radius-md, 8px)',
                        }}
                      >
                        <PlusCircle size={16} style={{ marginRight: '0.4rem' }} /> নতুন আবেদন তৈরি করুন
                      </button>
                    </div>
                  ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {studentPosts.map((post) => {
                    const step2Done = !!post.isTeacherVerified;
                    const step3Done = !!post.isOrgVerified;
                    const step4Done = post.verificationStatus === 'approved';

                    return (
                      <div
                        key={post.id}
                        style={{
                          padding: '1.5rem',
                          backgroundColor: 'var(--background, #f8fafc)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--surface-border, #e2e8f0)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <h4 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
                            {post.title}
                          </h4>
                          <span
                            style={{
                              fontSize: '0.78rem',
                              padding: '0.25rem 0.75rem',
                              backgroundColor: step4Done ? 'rgba(5, 150, 105, 0.12)' : 'rgba(217, 119, 6, 0.12)',
                              color: step4Done ? '#047857' : 'var(--accent, #d97706)',
                              borderRadius: 'var(--radius-full)',
                              fontWeight: '700',
                            }}
                          >
                            {step4Done ? 'অনুমোদিত ও উন্মুক্ত' : post.verificationStatus === 'rejected' ? 'প্রত্যাখ্যাত' : 'যাচাই প্রক্রিয়াধীন'}
                          </span>
                        </div>

                        <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '0.75rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.65rem' }}>
                          <span>
                            প্রয়োজনীয় অর্থ: <strong style={{ color: '#059669' }}>৳{Number(post.totalRequiredAmount).toLocaleString()}</strong> • সংগৃহীত: ৳{Number(post.receivedAmount).toLocaleString()}
                          </span>
                          {post.durationText && (
                            <span style={{ padding: '0.2rem 0.6rem', background: 'rgba(13, 148, 136, 0.1)', color: '#0f766e', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600' }}>
                              {post.durationText}
                            </span>
                          )}
                        </div>

                        {Array.isArray(post.expenses) && post.expenses.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
                            {post.expenses.map((exp: any, i: number) => (
                              <span key={i} style={{ fontSize: '0.78rem', padding: '0.2rem 0.55rem', background: 'var(--surface, #ffffff)', border: '1px solid var(--surface-border, #e2e8f0)', borderRadius: '6px', color: 'var(--text-main)' }}>
                                {exp.categoryName || exp.category}: <strong>৳{Number(exp.amount).toLocaleString()}</strong>
                              </span>
                            ))}
                          </div>
                        )}

                        {/* 4-Step Verification Stage Tracker */}
                        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px dashed var(--surface-border, #e2e8f0)' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '0.65rem' }}>
                            যাচাইকরণ অগ্রগতি ধাপসমূহ:
                          </span>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.6rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.84rem', color: '#059669' }}>
                              <CheckCircle2 size={16} /> <span><strong>ধাপ ১:</strong> আবেদন দাখিল সম্পন্ন</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.84rem', color: step2Done ? '#059669' : 'var(--text-muted)' }}>
                              {step2Done ? <CheckCircle2 size={16} /> : <Clock size={16} />} <span><strong>ধাপ ২:</strong> শিক্ষক সত্যায়ন {step2Done ? 'সম্পন্ন' : 'অপেক্ষমান'}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.84rem', color: step3Done ? '#059669' : 'var(--text-muted)' }}>
                              {step3Done ? <CheckCircle2 size={16} /> : <Clock size={16} />} <span><strong>ধাপ ৩:</strong> প্রতিষ্ঠান ছাড়পত্র {step3Done ? 'সম্পন্ন' : 'অপেক্ষমান'}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.84rem', color: step4Done ? '#059669' : 'var(--text-muted)' }}>
                              {step4Done ? <CheckCircle2 size={16} /> : <Clock size={16} />} <span><strong>ধাপ ৪:</strong> কেন্দ্রীয় অনুমোদন {step4Done ? 'সম্পন্ন' : 'অপেক্ষমান'}</span>
                            </div>
                          </div>
                        </div>
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

        {/* VIEW 3: COMPLAINTS & SUPPORT */}
        {activeNav === 'complaints' && (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                অভিযোগ ও সহায়তা ডায়েরি
              </h1>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
                আবেদন প্রক্রিয়ায় কোনো সমস্যা বা বিলম্ব হলে কর্তৃপক্ষকে সরাসরি অবগত করুন
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.75rem' }}>
              {/* Complaints Ticket Submission Form */}
              <div
                style={{
                  padding: '1.75rem',
                  backgroundColor: 'var(--surface)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--surface-border, #e2e8f0)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
                  <MessageSquareWarning size={20} color="#059669" />
                  নতুন অভিযোগ দাখিল করুন
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                  আবেদন যাচাইয়ে অযৌক্তিক বিলম্ব হলে সরাসরি কর্তৃপক্ষ বরাবর অভিযোগ দাখিল করুন।
                </p>

                {complaintSubmitted && (
                  <div
                    style={{
                      padding: '1rem',
                      backgroundColor: 'rgba(5, 150, 105, 0.08)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid #059669',
                      color: '#047857',
                      marginBottom: '1rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '800', fontSize: '0.9rem' }}>
                      <CheckCircle2 size={16} /> অভিযোগটি সফলভাবে দাখিল হয়েছে!
                    </div>
                  </div>
                )}

                <form onSubmit={handleComplaintSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.35rem', color: 'var(--text-main)' }}>
                      বিষয়
                    </label>
                    <input
                      type="text"
                      required
                      value={complaintSubject}
                      onChange={(e) => setComplaintSubject(e.target.value)}
                      placeholder="যেমন: প্রতিষ্ঠান ছাড়পত্রে বিলম্ব"
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.85rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1.5px solid var(--surface-border, #e2e8f0)',
                        fontSize: '0.9rem',
                        backgroundColor: 'var(--surface)',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.35rem', color: 'var(--text-main)' }}>
                      পূর্ণ বিবরণ
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={complaintDesc}
                      onChange={(e) => setComplaintDesc(e.target.value)}
                      placeholder="আপনার সমস্যার বিস্তারিত বিবরণ লিখুন..."
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.85rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1.5px solid var(--surface-border, #e2e8f0)',
                        fontSize: '0.9rem',
                        backgroundColor: 'var(--surface)',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ alignSelf: 'flex-start', padding: '0.6rem 1.25rem', fontSize: '0.9rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#059669' }}
                  >
                    <Send size={15} /> অভিযোগ পাঠান
                  </button>
                </form>
              </div>

              {/* Complaints History */}
              <div
                style={{
                  padding: '1.75rem',
                  backgroundColor: 'var(--surface)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--surface-border, #e2e8f0)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                  আমার দাখিলকৃত অভিযোগসমূহ ({complaintsList.length})
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                  আপনার পূর্ববর্তী অভিযোগের তদারকি ও বর্তমান অবস্থা
                </p>

                {complaintsList.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: 'var(--background, #f8fafc)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    আপনার কোনো দাখিলকৃত অভিযোগ নেই।
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {complaintsList.map((c) => (
                      <div
                        key={c.id}
                        style={{
                          padding: '0.85rem 1rem',
                          backgroundColor: 'var(--background, #f8fafc)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--surface-border, #e2e8f0)',
                          fontSize: '0.85rem',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                          <strong style={{ color: 'var(--text-main)' }}>{c.subject}</strong>
                          <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: '700', backgroundColor: 'rgba(5, 150, 105, 0.1)', padding: '0.15rem 0.5rem', borderRadius: '9999px' }}>{c.status}</span>
                        </div>
                        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.82rem' }}>{c.desc}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    )}

        {/* Affiliation Apply Modal */}
        <AffiliationApplyModal
          isOpen={isAffiliationModalOpen}
          onClose={() => setIsAffiliationModalOpen(false)}
          role="student"
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
