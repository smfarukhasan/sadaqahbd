'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Building2,
  GraduationCap,
  History,
  FileText,
  AlertCircle,
  CheckCircle2,
  XCircle,
  MapPin,
  Phone,
  Mail,
  Calendar,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  DollarSign,
  UserMinus,
  MessageSquare,
} from 'lucide-react';
import { getApiUrl } from '../../lib/api-config';
import { getAuthToken } from '../../lib/auth-token';

interface AdminUserDetailsModalProps {
  isOpen: boolean;
  userId: string | null;
  onClose: () => void;
  isBn?: boolean;
  onStatusUpdated?: () => void;
}

export default function AdminUserDetailsModal({
  isOpen,
  userId,
  onClose,
  isBn = true,
  onStatusUpdated,
}: AdminUserDetailsModalProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'posts' | 'complaints' | 'history'>('overview');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      loadDetails();
    } else {
      setData(null);
      setError('');
    }
  }, [isOpen, userId]);

  const loadDetails = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      setError('');
      const token = await getAuthToken();
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/users/admin/details/${userId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to load user details');
      }

      const resData = await res.json();
      setData(resData);
    } catch (err: any) {
      setError(err.message || 'Error fetching user details');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!data?.user) return;
    const currentStatus = data.user.status;
    const targetStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    const confirmMsg = isBn
      ? `আপনি কি নিশ্চিত যে "${data.user.fullName}"-এর অ্যাকাউন্ট ${targetStatus === 'suspended' ? 'স্থগিত (Suspend)' : 'সক্রিয় (Activate)'} করতে চান?`
      : `Are you sure you want to ${targetStatus === 'suspended' ? 'suspend' : 'activate'} "${data.user.fullName}"?`;

    if (!confirm(confirmMsg)) return;

    try {
      setActionLoading(true);
      const token = await getAuthToken();
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/masteradmin/users/${data.user.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: targetStatus }),
      });

      if (!res.ok) throw new Error('Status update failed');
      setData((prev: any) => ({
        ...prev,
        user: { ...prev.user, status: targetStatus },
      }));
      if (onStatusUpdated) onStatusUpdated();
    } catch (err: any) {
      alert(err.message || 'Error updating user status');
    } finally {
      setActionLoading(false);
    }
  };

  if (!isOpen) return null;

  const user = data?.user;
  const currentOrg = data?.currentOrganization;
  const previousInstitutions = data?.previousInstitutions || [];
  const sp = data?.studentProfile;
  const tp = data?.teacherProfile;
  const posts = data?.posts || [];
  const complaints = data?.complaints || [];
  const removalHistory = data?.removalHistory || [];

  const roleNameMap: Record<string, { bn: string; en: string }> = {
    master_admin: { bn: 'মাস্টার এডমিন', en: 'Master Admin' },
    super_admin: { bn: 'সুপার এডমিন', en: 'Super Admin' },
    admin: { bn: 'এডমিন কর্মকর্তা', en: 'Admin Officer' },
    organization: { bn: 'প্রতিষ্ঠান কর্তৃপক্ষ', en: 'Organization Admin' },
    teacher: { bn: 'শিক্ষক', en: 'Teacher' },
    student: { bn: 'শিক্ষার্থী', en: 'Student' },
    donor: { bn: 'ডোনার', en: 'Donor' },
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--surface)',
          borderRadius: '16px',
          border: '1px solid var(--surface-border)',
          maxWidth: '680px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 30px -5px rgba(0, 0, 0, 0.3)',
          color: 'var(--text-main)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--surface-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--background)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
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
              }}
            >
              <User size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                {isBn ? 'ইউজার পূর্ণাঙ্গ ইনস্পেকশন' : 'User Detailed Inspection'}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                {user ? `${user.fullName} (${roleNameMap[user.role]?.[isBn ? 'bn' : 'en'] || user.role})` : (isBn ? 'তথ্য লোড হচ্ছে...' : 'Loading details...')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: '0.35rem',
              borderRadius: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Loader2 size={32} className="spin" style={{ margin: '0 auto 0.75rem' }} />
              <p style={{ fontSize: '0.9rem', margin: 0 }}>
                {isBn ? 'ব্যবহারকারীর পূর্ণাঙ্গ ডাটা ও হিস্টোরি লোড হচ্ছে...' : 'Loading comprehensive user data and history...'}
              </p>
            </div>
          ) : error ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: '#ef4444' }}>
              <AlertCircle size={32} style={{ margin: '0 auto 0.5rem' }} />
              <p style={{ margin: 0 }}>{error}</p>
            </div>
          ) : user ? (
            <div>
              {/* User Identity Top Card */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1.25rem',
                  backgroundColor: 'var(--background)',
                  borderRadius: '12px',
                  border: '1px solid var(--surface-border)',
                  marginBottom: '1.25rem',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  {user.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatarUrl}
                      alt={user.fullName}
                      style={{ width: '52px', height: '52px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(5, 150, 105, 0.15)',
                        color: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '1.25rem',
                      }}
                    >
                      {(user.fullName || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div>
                    <h4 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 0.2rem', color: 'var(--text-main)' }}>
                      {user.fullName}
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.55rem',
                          borderRadius: '9999px',
                          backgroundColor: 'rgba(5, 150, 105, 0.1)',
                          color: 'var(--primary)',
                        }}
                      >
                        {roleNameMap[user.role]?.[isBn ? 'bn' : 'en'] || user.role}
                      </span>
                      <span
                        style={{
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.55rem',
                          borderRadius: '9999px',
                          backgroundColor: user.status === 'active' ? 'rgba(5, 150, 105, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: user.status === 'active' ? '#059669' : '#ef4444',
                        }}
                      >
                        {user.status === 'active' ? (isBn ? 'সক্রিয়' : 'Active') : (isBn ? 'স্থগিত' : 'Suspended')}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleToggleStatus}
                  className="btn btn-outline"
                  style={{
                    padding: '0.45rem 0.95rem',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    borderColor: user.status === 'active' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(5, 150, 105, 0.3)',
                    color: user.status === 'active' ? '#ef4444' : '#059669',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  {user.status === 'active' ? <ShieldAlert size={14} /> : <ShieldCheck size={14} />}
                  <span>{user.status === 'active' ? (isBn ? 'অ্যাকাউন্ট স্থগিত করুন' : 'Suspend Account') : (isBn ? 'সক্রিয় করুন' : 'Activate Account')}</span>
                </button>
              </div>

              {/* Sub Navigation Tabs */}
              <div
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  borderBottom: '1px solid var(--surface-border)',
                  marginBottom: '1.25rem',
                  paddingBottom: '0.5rem',
                  flexWrap: 'wrap',
                }}
              >
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  style={{
                    padding: '0.45rem 0.85rem',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: activeTab === 'overview' ? 'var(--primary)' : 'transparent',
                    color: activeTab === 'overview' ? '#fff' : 'var(--text-muted)',
                  }}
                >
                  {isBn ? 'সারসংক্ষেপ ও প্রোফাইল' : 'Overview & Profile'}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('history')}
                  style={{
                    padding: '0.45rem 0.85rem',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: activeTab === 'history' ? 'var(--primary)' : 'transparent',
                    color: activeTab === 'history' ? '#fff' : 'var(--text-muted)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <History size={14} />
                  <span>{isBn ? 'প্রতিষ্ঠান পরিবর্তন হিস্টোরি' : 'Institution History'}</span>
                  {previousInstitutions.length > 0 && (
                    <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '9999px', backgroundColor: activeTab === 'history' ? '#fff' : 'var(--primary)', color: activeTab === 'history' ? 'var(--primary)' : '#fff' }}>
                      {previousInstitutions.length}
                    </span>
                  )}
                </button>

                {user.role === 'student' && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('posts')}
                    style={{
                      padding: '0.45rem 0.85rem',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: activeTab === 'posts' ? 'var(--primary)' : 'transparent',
                      color: activeTab === 'posts' ? '#fff' : 'var(--text-muted)',
                    }}
                  >
                    {isBn ? `পোস্ট ও আবেদন (${posts.length})` : `Campaigns (${posts.length})`}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setActiveTab('complaints')}
                  style={{
                    padding: '0.45rem 0.85rem',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: activeTab === 'complaints' ? 'var(--primary)' : 'transparent',
                    color: activeTab === 'complaints' ? '#fff' : 'var(--text-muted)',
                  }}
                >
                  {isBn ? `অভিযোগ টিকিট (${complaints.length})` : `Tickets (${complaints.length})`}
                </button>
              </div>

              {/* TAB 1: OVERVIEW & PROFILE */}
              {activeTab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Current Institution Card */}
                  <div
                    style={{
                      padding: '1rem',
                      backgroundColor: 'var(--background)',
                      borderRadius: '10px',
                      border: '1px solid var(--surface-border)',
                    }}
                  >
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
                      {isBn ? 'বর্তমান শিক্ষা প্রতিষ্ঠান' : 'Current Affiliated Institution'}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <Building2 size={20} color="var(--primary)" />
                      <div>
                        <strong style={{ fontSize: '1rem', color: 'var(--text-main)', display: 'block' }}>
                          {currentOrg?.name || (isBn ? 'কোনো প্রতিষ্ঠানের সাথে সংযুক্ত নেই' : 'Not affiliated with any institution')}
                        </strong>
                        {currentOrg?.address && (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {currentOrg.address} {currentOrg.type ? `• (${currentOrg.type})` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
                    <div style={{ padding: '0.85rem', backgroundColor: 'var(--background)', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block' }}>{isBn ? 'ইমেইল' : 'Email'}</span>
                      <strong style={{ fontSize: '0.88rem', color: 'var(--text-main)' }}>{user.email || '—'}</strong>
                    </div>

                    <div style={{ padding: '0.85rem', backgroundColor: 'var(--background)', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block' }}>{isBn ? 'মোবাইল নম্বর' : 'Phone'}</span>
                      <strong style={{ fontSize: '0.88rem', color: 'var(--text-main)' }}>{user.phone || '—'}</strong>
                    </div>

                    {user.address && (
                      <div style={{ padding: '0.85rem', backgroundColor: 'var(--background)', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block' }}>{isBn ? 'ঠিকানা' : 'Address'}</span>
                        <strong style={{ fontSize: '0.88rem', color: 'var(--text-main)' }}>{user.address}</strong>
                      </div>
                    )}

                    <div style={{ padding: '0.85rem', backgroundColor: 'var(--background)', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block' }}>{isBn ? 'নিবন্ধনের তারিখ' : 'Registered On'}</span>
                      <strong style={{ fontSize: '0.88rem', color: 'var(--text-main)' }}>
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString(isBn ? 'bn-BD' : 'en-US') : '—'}
                      </strong>
                    </div>
                  </div>

                  {/* Platform Integrity & Audit Trail Status Card */}
                  <div
                    style={{
                      padding: '1rem',
                      borderRadius: '10px',
                      backgroundColor: data.deletionEligibility?.hasPlatformData ? 'rgba(239, 68, 68, 0.05)' : 'rgba(5, 150, 105, 0.05)',
                      border: `1px solid ${data.deletionEligibility?.hasPlatformData ? 'rgba(239, 68, 68, 0.25)' : 'rgba(5, 150, 105, 0.25)'}`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 800, fontSize: '0.86rem', color: data.deletionEligibility?.hasPlatformData ? '#b91c1c' : '#047857' }}>
                        {data.deletionEligibility?.hasPlatformData ? <ShieldAlert size={16} /> : <ShieldCheck size={16} />}
                        <span>
                          {data.deletionEligibility?.hasPlatformData
                            ? (isBn ? 'প্ল্যাটফর্ম অডিট রেকর্ড সংরক্ষিত (ডিলিট নিষিদ্ধ)' : 'Audit Trail Preserved (Deletion Prohibited)')
                            : (isBn ? 'খালি অ্যাকাউন্ট (ব্যক্তিগত তথ্য বিদ্যমান)' : 'Empty Account (Personal Info Only)')}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '6px',
                          backgroundColor: data.deletionEligibility?.hasPlatformData ? '#fee2e2' : '#ecfdf5',
                          color: data.deletionEligibility?.hasPlatformData ? '#991b1b' : '#065f46',
                        }}
                      >
                        {data.deletionEligibility?.hasPlatformData
                          ? (isBn ? 'সততা নীতি প্রযোজ্য' : 'Integrity Guard Active')
                          : (isBn ? 'ডিলিটযোগ্য' : 'Eligible for Deletion')}
                      </span>
                    </div>

                    <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      {data.deletionEligibility?.hasPlatformData
                        ? (isBn
                            ? 'এই ব্যবহারকারীর সাথে প্ল্যাটফর্মের গুরুত্বপূর্ণ রেকর্ড (যেমন: অনুদান, পোস্ট, প্রাতিষ্ঠানিক তথ্য বা অভিযোগ) জড়িত রয়েছে। প্ল্যাটফর্মের স্বচ্ছতার স্বার্থে এই অ্যাকাউন্ট ড্যাশবোর্ড থেকে ডিলিট করা সম্পূর্ণ নিষিদ্ধ। বিশেষ প্রয়োজনে সফটওয়্যার কোম্পানির সাথে যোগাযোগ করতে হবে।'
                            : 'This user is linked to critical platform records (donations, posts, institution activity, or complaints). For platform transparency, deletion via dashboard is strictly prohibited. Contact the software company for extraordinary requests.')
                        : (isBn
                            ? 'এই ব্যবহারকারীর কোনো সক্রিয় অনুদান, পোস্ট বা অভিযোগ নেই (শুধুমাত্র ব্যক্তিগত প্রোফাইল তথ্য বিদ্যমান)। নীতিমালা অনুযায়ী খালি অ্যাকাউন্ট অপসারণ করা সম্ভব।'
                            : 'This user has no active donations, posts, or complaints (solely personal profile info). Empty accounts may be removed.')}
                    </p>

                    {data.deletionEligibility?.reasonsBn && data.deletionEligibility.reasonsBn.length > 0 && (
                      <div style={{ marginTop: '0.6rem', display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        {(isBn ? data.deletionEligibility.reasonsBn : data.deletionEligibility.reasonsEn).map((r: string, i: number) => (
                          <span
                            key={i}
                            style={{
                              fontSize: '0.72rem',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                              backgroundColor: '#ffffff',
                              border: '1px solid #fca5a5',
                              color: '#7f1d1d',
                              fontWeight: 600,
                            }}
                          >
                            • {r}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Specific Role Profile Details */}
                  {user.role === 'teacher' && tp && (
                    <div
                      style={{
                        padding: '1rem',
                        backgroundColor: 'var(--background)',
                        borderRadius: '10px',
                        border: '1px solid var(--surface-border)',
                      }}
                    >
                      <h5 style={{ fontSize: '0.88rem', fontWeight: 800, margin: '0 0 0.5rem', color: 'var(--text-main)' }}>
                        {isBn ? 'শিক্ষক প্রোফাইল বিবরণ' : 'Teacher Profile Details'}
                      </h5>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem', fontSize: '0.82rem' }}>
                        <div>{isBn ? 'পদবী: ' : 'Designation: '}<strong>{tp.designation || 'শিক্ষক'}</strong></div>
                        <div>{isBn ? 'বিভাগ: ' : 'Department: '}<strong>{tp.department || 'সাধারণ'}</strong></div>
                        {tp.employeeId && <div>{isBn ? 'এমপ্লয়ি আইডি: ' : 'Employee ID: '}<strong>{tp.employeeId}</strong></div>}
                      </div>
                    </div>
                  )}

                  {user.role === 'student' && sp && (
                    <div
                      style={{
                        padding: '1rem',
                        backgroundColor: 'var(--background)',
                        borderRadius: '10px',
                        border: '1px solid var(--surface-border)',
                      }}
                    >
                      <h5 style={{ fontSize: '0.88rem', fontWeight: 800, margin: '0 0 0.5rem', color: 'var(--text-main)' }}>
                        {isBn ? 'শিক্ষার্থী প্রোফাইল বিবরণ' : 'Student Profile Details'}
                      </h5>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem', fontSize: '0.82rem' }}>
                        <div>{isBn ? 'শ্রেণি: ' : 'Class: '}<strong>{sp.className || '—'}</strong></div>
                        <div>{isBn ? 'রোল: ' : 'Roll: '}<strong>{sp.rollNumber || '—'}</strong></div>
                        {sp.fatherName && <div>{isBn ? 'পিতা: ' : 'Father: '}<strong>{sp.fatherName}</strong></div>}
                        {sp.guardianName && <div>{isBn ? 'অভিভাবক: ' : 'Guardian: '}<strong>{sp.guardianName}</strong></div>}
                        {sp.guardianPhone && <div>{isBn ? 'অভিভাবকের ফোন: ' : 'Guardian Phone: '}<strong>{sp.guardianPhone}</strong></div>}
                        {sp.bloodGroup && <div>{isBn ? 'রক্তের গ্রুপ: ' : 'Blood Group: '}<strong>{sp.bloodGroup}</strong></div>}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: PREVIOUS INSTITUTIONS HISTORY */}
              {activeTab === 'history' && (
                <div>
                  <h4 style={{ fontSize: '0.98rem', fontWeight: 800, margin: '0 0 0.75rem', color: 'var(--text-main)' }}>
                    {isBn ? 'পূর্বের শিক্ষা প্রতিষ্ঠান ও স্থানান্তর রেকর্ড' : 'Prior Institutions & Transfer Records'}
                  </h4>

                  {previousInstitutions.length === 0 ? (
                    <div style={{ padding: '2.5rem 1rem', textAlign: 'center', backgroundColor: 'var(--background)', borderRadius: '10px', border: '1px solid var(--surface-border)' }}>
                      <History size={36} color="var(--primary)" style={{ margin: '0 auto 0.5rem' }} />
                      <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0 }}>
                        {isBn ? 'কোনো পূর্ববর্তী প্রতিষ্ঠান রেকর্ড নেই (ব্যবহারকারী প্রথম থেকেই বর্তমান প্রতিষ্ঠানে যুক্ত)।' : 'No previous institution history found.'}
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {previousInstitutions.map((item: any, idx: number) => (
                        <div
                          key={idx}
                          style={{
                            padding: '1rem',
                            backgroundColor: 'var(--background)',
                            borderRadius: '10px',
                            border: '1px solid var(--surface-border)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.35rem' }}>
                            <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>
                              {item.orgName || (isBn ? 'প্রতিষ্ঠান' : 'Institution')}
                            </strong>
                            <span
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                padding: '0.15rem 0.55rem',
                                borderRadius: '9999px',
                                backgroundColor: item.type === 'transfer' ? 'rgba(37, 99, 235, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                color: item.type === 'transfer' ? '#2563eb' : '#ef4444',
                              }}
                            >
                              {item.type === 'transfer' ? (isBn ? 'স্থানান্তর' : 'Transfer') : (isBn ? 'রিমুভ' : 'Removal')}
                            </span>
                          </div>
                          {item.orgAddress && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                              <MapPin size={12} style={{ display: 'inline', marginRight: '4px' }} />
                              {item.orgAddress}
                            </div>
                          )}
                          {item.reason && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.25rem' }}>
                              {isBn ? 'স্থানান্তরের কারণ: ' : 'Reason: '} {item.reason}
                            </div>
                          )}
                          {item.transferredAt && (
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                              {new Date(item.transferredAt).toLocaleDateString(isBn ? 'bn-BD' : 'en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Removal History Section if present */}
                  {removalHistory.length > 0 && (
                    <div style={{ marginTop: '1.5rem' }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: '0 0 0.5rem', color: '#ef4444' }}>
                        {isBn ? 'প্রতিষ্ঠান রিমুভ আবেদন রেকর্ড' : 'Member Removal Audit Records'}
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {removalHistory.map((rem: any) => (
                          <div
                            key={rem.id}
                            style={{
                              padding: '0.85rem',
                              backgroundColor: 'rgba(239, 68, 68, 0.04)',
                              borderRadius: '8px',
                              border: '1px solid rgba(239, 68, 68, 0.2)',
                              fontSize: '0.82rem',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                              <strong>{rem.orgName}</strong>
                              <span style={{ fontWeight: 800, color: rem.status === 'approved' ? '#059669' : rem.status === 'pending' ? '#d97706' : '#ef4444' }}>
                                {rem.status}
                              </span>
                            </div>
                            <div>{isBn ? 'কারণ: ' : 'Reason: '}{rem.reason}</div>
                            {rem.adminRejectionReason && (
                              <div style={{ color: '#ef4444', marginTop: '0.2rem' }}>
                                {isBn ? 'বাতিলের কারণ: ' : 'Rejection Reason: '}{rem.adminRejectionReason}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: STUDENT CAMPAIGNS / POSTS */}
              {activeTab === 'posts' && (
                <div>
                  <h4 style={{ fontSize: '0.98rem', fontWeight: 800, margin: '0 0 0.75rem', color: 'var(--text-main)' }}>
                    {isBn ? 'শিক্ষার্থীর আবেদনকৃত পোস্টসমূহ' : 'Student Aid Campaigns'}
                  </h4>
                  {posts.length === 0 ? (
                    <div style={{ padding: '2.5rem 1rem', textAlign: 'center', backgroundColor: 'var(--background)', borderRadius: '10px', border: '1px solid var(--surface-border)' }}>
                      <FileText size={36} color="var(--primary)" style={{ margin: '0 auto 0.5rem' }} />
                      <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0 }}>
                        {isBn ? 'কোনো পোস্ট পাওয়া যায়নি।' : 'No aid campaigns submitted.'}
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {posts.map((post: any) => (
                        <div
                          key={post.id}
                          style={{
                            padding: '1rem',
                            backgroundColor: 'var(--background)',
                            borderRadius: '10px',
                            border: '1px solid var(--surface-border)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.35rem' }}>
                            <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>{post.title}</strong>
                            <span
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                padding: '0.15rem 0.5rem',
                                borderRadius: '9999px',
                                backgroundColor: post.verificationStatus === 'verified' ? 'rgba(5, 150, 105, 0.1)' : 'rgba(217, 119, 6, 0.1)',
                                color: post.verificationStatus === 'verified' ? '#059669' : '#d97706',
                              }}
                            >
                              {post.verificationStatus}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 0.4rem', lineClamp: 2 }}>
                            {post.problemDescription}
                          </p>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem' }}>
                            <span>{isBn ? 'লক্ষ্যমাত্রা: ' : 'Target: '}<strong>৳{Number(post.totalRequiredAmount || 0).toLocaleString()}</strong></span>
                            <span>{isBn ? 'গৃহীত: ' : 'Received: '}<strong>৳{Number(post.receivedAmount || 0).toLocaleString()}</strong></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: COMPLAINTS & TICKETS */}
              {activeTab === 'complaints' && (
                <div>
                  <h4 style={{ fontSize: '0.98rem', fontWeight: 800, margin: '0 0 0.75rem', color: 'var(--text-main)' }}>
                    {isBn ? 'দাখিলকৃত অভিযোগ ও সাপোর্ট টিকিট' : 'Submitted Grievances & Tickets'}
                  </h4>
                  {complaints.length === 0 ? (
                    <div style={{ padding: '2.5rem 1rem', textAlign: 'center', backgroundColor: 'var(--background)', borderRadius: '10px', border: '1px solid var(--surface-border)' }}>
                      <MessageSquare size={36} color="var(--primary)" style={{ margin: '0 auto 0.5rem' }} />
                      <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0 }}>
                        {isBn ? 'কোনো অভিযোগ টিকিট পাওয়া যায়নি।' : 'No tickets filed.'}
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {complaints.map((c: any) => (
                        <div
                          key={c.id}
                          style={{
                            padding: '1rem',
                            backgroundColor: 'var(--background)',
                            borderRadius: '10px',
                            border: '1px solid var(--surface-border)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.35rem' }}>
                            <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>{c.subject}</strong>
                            <span
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                padding: '0.15rem 0.5rem',
                                borderRadius: '9999px',
                                backgroundColor: c.status === 'resolved' ? 'rgba(5, 150, 105, 0.1)' : 'rgba(217, 119, 6, 0.1)',
                                color: c.status === 'resolved' ? '#059669' : '#d97706',
                              }}
                            >
                              {c.status}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 0.4rem' }}>
                            {c.description}
                          </p>
                          {c.adminReply && (
                            <div style={{ padding: '0.5rem 0.75rem', backgroundColor: 'rgba(37, 99, 235, 0.05)', borderLeft: '3px solid #2563eb', borderRadius: '4px', fontSize: '0.8rem' }}>
                              <strong style={{ color: '#2563eb' }}>{isBn ? 'কর্তৃপক্ষের জবাব: ' : 'Reply: '}</strong>
                              {c.adminReply}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--surface-border)',
            display: 'flex',
            justifyContent: 'flex-end',
            backgroundColor: 'var(--background)',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="btn btn-outline"
            style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem', fontWeight: 700 }}
          >
            {isBn ? 'বন্ধ করুন' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
