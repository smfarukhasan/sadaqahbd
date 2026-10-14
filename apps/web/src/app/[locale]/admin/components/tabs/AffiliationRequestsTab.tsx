'use client';

import React, { useState } from 'react';
import {
  UserCheck,
  GraduationCap,
  Clock,
  History as HistoryIcon,
  UserMinus,
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
} from 'lucide-react';
import styles from '../../admin.module.css';

interface AffiliationRequestsTabProps {
  isBn: boolean;
  adminPendingAffiliations: { teachers: any[]; students: any[] };
  adminAffiliationsHistory: { teachers: any[]; students: any[] };
  removalRequests: any[];
  actionLoading: boolean;
  onOpenAffiliationReview: (itemData: any) => void;
  setSelectedStudentDetailsId: (id: string | null) => void;
  setAdminInspectionUserId: (id: string | null) => void;
  handleReviewMemberRemoval: (id: string, approve: boolean) => void;
}

export function AffiliationRequestsTab({
  isBn,
  adminPendingAffiliations,
  adminAffiliationsHistory,
  removalRequests,
  actionLoading,
  onOpenAffiliationReview,
  setSelectedStudentDetailsId,
  setAdminInspectionUserId,
  handleReviewMemberRemoval,
}: AffiliationRequestsTabProps) {
  const [affiliationVerificationTab, setAffiliationVerificationTab] = useState<'pending' | 'history' | 'removals'>('pending');
  const [affHistorySearch, setAffHistorySearch] = useState<string>('');
  const [affHistoryRoleFilter, setAffHistoryRoleFilter] = useState<'all' | 'teacher' | 'student'>('all');
  const [affHistoryStatusFilter, setAffHistoryStatusFilter] = useState<'all' | 'verified' | 'rejected'>('all');
  const [removalRequestsSearch, setRemovalRequestsSearch] = useState<string>('');
  const [removalRequestsStatusFilter, setRemovalRequestsStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [copiedFieldKey, setCopiedFieldKey] = useState<string | null>(null);

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFieldKey(key);
    setTimeout(() => setCopiedFieldKey(null), 2000);
  };

  return (
    <div>
      <div className={styles.contentHeader}>
        <div>
          <h1 className={styles.pageTitle}>
            <UserCheck size={26} color="var(--color-primary)" />
            {isBn ? 'শিক্ষক ও শিক্ষার্থী ছাড়পত্র ও অনুমোদন' : 'Teacher & Student Clearances'}
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            {isBn
              ? 'প্রতিষ্ঠান কর্তৃক প্রাথমিকভাবে অনুমোদিত শিক্ষক ও শিক্ষার্থীদের চূড়ান্ত অনুমোদন ও নিষ্পত্তির পূর্বের ইতিহাস।'
              : 'Institutional affiliation clearance requests and historical verification records.'}
          </p>
        </div>
      </div>

      {/* Sub-tabs: Pending vs History vs Removals */}
      <div className={styles.verificationTabs}>
        <button
          type="button"
          className={`${styles.verificationTabBtn} ${affiliationVerificationTab === 'pending' ? styles.verificationTabBtnActive : ''}`}
          onClick={() => setAffiliationVerificationTab('pending')}
        >
          <Clock size={16} />
          <span>{isBn ? 'পেন্ডিং ছাড়পত্র' : 'Pending Clearances'}</span>
          <span className={styles.tabBadge}>
            {adminPendingAffiliations.teachers.length + adminPendingAffiliations.students.length}
          </span>
        </button>

        <button
          type="button"
          className={`${styles.verificationTabBtn} ${affiliationVerificationTab === 'history' ? styles.verificationTabBtnActive : ''}`}
          onClick={() => setAffiliationVerificationTab('history')}
        >
          <HistoryIcon size={16} />
          <span>{isBn ? 'ছাড়পত্রের পূর্বের ইতিহাস' : 'Clearance History'}</span>
          <span className={styles.tabBadge}>
            {adminAffiliationsHistory.teachers.length + adminAffiliationsHistory.students.length}
          </span>
        </button>

        <button
          type="button"
          className={`${styles.verificationTabBtn} ${affiliationVerificationTab === 'removals' ? styles.verificationTabBtnActive : ''}`}
          onClick={() => setAffiliationVerificationTab('removals')}
        >
          <UserMinus size={16} />
          <span>{isBn ? 'সদস্য রিমুভ আবেদন' : 'Member Removal Requests'}</span>
          <span className={styles.tabBadge}>
            {removalRequests.filter((r) => r.status === 'pending').length}
          </span>
        </button>
      </div>

      {affiliationVerificationTab === 'pending' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Teacher Approvals */}
          <div
            className="card"
            style={{
              padding: '1.5rem',
              backgroundColor: 'var(--surface, #ffffff)',
              borderRadius: '12px',
              border: '1px solid var(--color-border)',
            }}
          >
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main, #0f172a)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserCheck size={20} color="#2563eb" />
              {isBn ? 'প্রতিষ্ঠান অনুমোদিত শিক্ষক তালিকা' : 'Institute-Approved Teacher List'} ({adminPendingAffiliations.teachers.length})
            </h3>

            {adminPendingAffiliations.teachers.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '1.5rem', margin: 0 }}>
                {isBn ? 'কোনো শিক্ষক চূড়ান্ত অনুমোদনের জন্য অপেক্ষমাণ নেই।' : 'No teachers pending final approval.'}
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {adminPendingAffiliations.teachers.map((t) => (
                  <div
                    key={t.profileId}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '1.25rem',
                      backgroundColor: 'var(--background-alt, #f8fafc)',
                      borderRadius: '10px',
                      border: '1px solid var(--color-border)',
                      flexWrap: 'wrap',
                      gap: '1rem',
                    }}
                  >
                    <div>
                      <h4 style={{ fontWeight: '700', fontSize: '1.05rem', margin: 0, color: 'var(--text-main, #0f172a)' }}>
                        {t.fullName}
                      </h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted, #64748b)', margin: '0.25rem 0 0' }}>
                        {isBn ? 'প্রতিষ্ঠান: ' : 'Institution: '}<strong style={{ color: 'var(--text-main, #0f172a)' }}>{t.institutionName}</strong>
                        {t.designation && ` | ${isBn ? 'পদবী: ' : 'Designation: '}${t.designation}`}
                        {t.department && ` | ${isBn ? 'বিভাগ: ' : 'Dept: '}${t.department}`}
                        {t.employeeId && ` | ${isBn ? 'আইডি: ' : 'ID: '}${t.employeeId}`}
                      </p>
                      <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0.2rem 0 0' }}>
                        {isBn ? 'ইমেইল: ' : 'Email: '}{t.email} | {isBn ? 'ফোন: ' : 'Phone: '}{t.phone || (isBn ? 'নেই' : 'N/A')}
                      </p>
                    </div>

                    <button
                      className="btn btn-primary"
                      style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
                      onClick={() => onOpenAffiliationReview({ ...t, role: 'teacher' })}
                    >
                      <Eye size={16} /> {isBn ? 'যাচাই ও চূড়ান্ত অনুমোদন' : 'Verify & Approve'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Student Approvals */}
          <div
            className="card"
            style={{
              padding: '1.5rem',
              backgroundColor: 'var(--surface, #ffffff)',
              borderRadius: '12px',
              border: '1px solid var(--color-border)',
            }}
          >
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main, #0f172a)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <GraduationCap size={20} color="#059669" />
              {isBn ? 'প্রতিষ্ঠান অনুমোদিত শিক্ষার্থী তালিকা' : 'Institute-Approved Student List'} ({adminPendingAffiliations.students.length})
            </h3>

            {adminPendingAffiliations.students.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '1.5rem', margin: 0 }}>
                {isBn ? 'কোনো শিক্ষার্থী চূড়ান্ত অনুমোদনের জন্য অপেক্ষমাণ নেই।' : 'No students pending final approval.'}
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {adminPendingAffiliations.students.map((s) => (
                  <div
                    key={s.profileId}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '1.25rem',
                      backgroundColor: 'var(--background-alt, #f8fafc)',
                      borderRadius: '10px',
                      border: '1px solid var(--color-border)',
                      flexWrap: 'wrap',
                      gap: '1rem',
                    }}
                  >
                    <div>
                      <h4 style={{ fontWeight: '700', fontSize: '1.05rem', margin: 0, color: 'var(--text-main, #0f172a)' }}>
                        {s.fullName}
                      </h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted, #64748b)', margin: '0.25rem 0 0' }}>
                        {isBn ? 'প্রতিষ্ঠান: ' : 'Institution: '}<strong style={{ color: 'var(--text-main, #0f172a)' }}>{s.institutionName}</strong>
                        {s.studentClassRoll && ` | ${isBn ? 'ক্লাস/রোল: ' : 'Class/Roll: '}${s.studentClassRoll}`}
                        {s.address && ` | ${isBn ? 'ঠিকানা: ' : 'Address: '}${s.address}`}
                      </p>
                      <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0.2rem 0 0' }}>
                        {isBn ? 'ইমেইল: ' : 'Email: '}{s.email} | {isBn ? 'ফোন: ' : 'Phone: '}{s.phone || (isBn ? 'নেই' : 'N/A')}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.45rem 0.85rem',
                          fontSize: '0.85rem',
                          color: '#1d4ed8',
                          borderColor: '#bfdbfe',
                          backgroundColor: '#eff6ff',
                          borderRadius: '8px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                        onClick={() => setSelectedStudentDetailsId(s.profileId || s.userId)}
                      >
                        <Eye size={15} />
                        {isBn ? 'বিস্তারিত' : 'Details'}
                      </button>
                      <button
                        className="btn btn-primary"
                        style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
                        onClick={() => onOpenAffiliationReview({ ...s, role: 'student' })}
                      >
                        <Eye size={16} /> {isBn ? 'যাচাই ও চূড়ান্ত অনুমোদন' : 'Verify & Approve'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* History Tab View */}
      {affiliationVerificationTab === 'history' && (
        <div
          className="card"
          style={{
            padding: '1.5rem',
            backgroundColor: 'var(--surface, #ffffff)',
            borderRadius: '12px',
            border: '1px solid var(--color-border)',
          }}
        >
          {/* Search & Filter Bar */}
          <div className={styles.historyFilterBar}>
            <div style={{ flex: '1 1 240px', position: 'relative' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                }}
              />
              <input
                type="text"
                className={styles.historySearchInput}
                placeholder={isBn ? 'নাম, ইমেইল, ফোন, বিভাগ, রোল বা প্রতিষ্ঠান দিয়ে খুঁজুন...' : 'Search by name, email, roll, org...'}
                value={affHistorySearch}
                onChange={(e) => setAffHistorySearch(e.target.value)}
              />
            </div>

            <select
              className={styles.historyFilterSelect}
              value={affHistoryRoleFilter}
              onChange={(e) => setAffHistoryRoleFilter(e.target.value as any)}
            >
              <option value="all">
                {isBn ? 'সকল সদস্য' : 'All Members'} ({adminAffiliationsHistory.teachers.length + adminAffiliationsHistory.students.length})
              </option>
              <option value="teacher">
                {isBn ? 'শিক্ষক' : 'Teachers'} ({adminAffiliationsHistory.teachers.length})
              </option>
              <option value="student">
                {isBn ? 'শিক্ষার্থী' : 'Students'} ({adminAffiliationsHistory.students.length})
              </option>
            </select>

            <select
              className={styles.historyFilterSelect}
              value={affHistoryStatusFilter}
              onChange={(e) => setAffHistoryStatusFilter(e.target.value as any)}
            >
              <option value="all">{isBn ? 'সকল স্ট্যাটাস' : 'All Statuses'}</option>
              <option value="verified">{isBn ? 'চূড়ান্ত অনুমোদিত' : 'Verified'}</option>
              <option value="rejected">{isBn ? 'আবেদন বাতিলকৃত' : 'Rejected'}</option>
            </select>
          </div>

          {(() => {
            const term = affHistorySearch.toLowerCase().trim();
            const combined = [
              ...adminAffiliationsHistory.teachers.map((t) => ({ ...t, role: 'teacher' as const })),
              ...adminAffiliationsHistory.students.map((s) => ({ ...s, role: 'student' as const })),
            ].filter((item) => {
              const matchRole =
                affHistoryRoleFilter === 'all' || item.role === affHistoryRoleFilter;
              const matchStatus =
                affHistoryStatusFilter === 'all' || item.verificationStatus === affHistoryStatusFilter;
              const matchSearch =
                !term ||
                (item.fullName && item.fullName.toLowerCase().includes(term)) ||
                (item.email && item.email.toLowerCase().includes(term)) ||
                (item.phone && item.phone.includes(term)) ||
                (item.institutionName && item.institutionName.toLowerCase().includes(term)) ||
                (item.orgName && item.orgName.toLowerCase().includes(term)) ||
                (item.department && item.department.toLowerCase().includes(term)) ||
                (item.studentClassRoll && item.studentClassRoll.toLowerCase().includes(term));
              return matchRole && matchStatus && matchSearch;
            });

            if (combined.length === 0) {
              return (
                <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2.5rem' }}>
                  {isBn ? 'কোনো পূর্বের ছাড়পত্র রেকর্ড পাওয়া যায়নি।' : 'No historical affiliation records found.'}
                </p>
              );
            }

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {combined.map((item) => {
                  const isVerified = item.verificationStatus === 'verified';
                  const isTeacher = item.role === 'teacher';

                  return (
                    <div key={item.profileId} className={styles.historyCard}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          flexWrap: 'wrap',
                          gap: '0.75rem',
                          marginBottom: '0.75rem',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <h4 style={{ fontWeight: 800, fontSize: '1.05rem', margin: 0, color: 'var(--text-main, #0f172a)' }}>
                              {item.fullName}
                            </h4>

                            {isTeacher ? (
                              <span
                                style={{
                                  backgroundColor: '#eff6ff',
                                  color: '#1d4ed8',
                                  border: '1px solid #bfdbfe',
                                  padding: '0.15rem 0.55rem',
                                  borderRadius: '999px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                }}
                              >
                                <UserCheck size={12} /> {isBn ? 'শিক্ষক' : 'Teacher'}
                              </span>
                            ) : (
                              <span
                                style={{
                                  backgroundColor: '#f0fdf4',
                                  color: '#15803d',
                                  border: '1px solid #bbf7d0',
                                  padding: '0.15rem 0.55rem',
                                  borderRadius: '999px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                }}
                              >
                                <GraduationCap size={12} /> {isBn ? 'শিক্ষার্থী' : 'Student'}
                              </span>
                            )}
                          </div>

                          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted, #64748b)', margin: '0.3rem 0 0' }}>
                            প্রতিষ্ঠান: <strong style={{ color: 'var(--text-main, #0f172a)' }}>{item.institutionName || item.orgName}</strong>
                            {isTeacher && item.designation && ` | পদবী: ${item.designation}`}
                            {isTeacher && item.department && ` | বিভাগ: ${item.department}`}
                            {isTeacher && item.employeeId && ` | আইডি: ${item.employeeId}`}
                            {!isTeacher && item.studentClassRoll && ` | ক্লাস ও রোল: ${item.studentClassRoll}`}
                            {!isTeacher && item.className && ` | শ্রেণি: ${item.className}`}
                            {!isTeacher && item.department && ` | বিভাগ: ${item.department}`}
                            {!isTeacher && item.fatherName && ` | পিতা: ${item.fatherName}`}
                          </p>

                          {!isTeacher && item.guardianName && (
                            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.2rem 0 0' }}>
                              অভিভাবক: {item.guardianName} ({item.guardianPhone || 'ফোন নেই'})
                            </p>
                          )}

                          {item.address && (
                            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.2rem 0 0' }}>
                              ঠিকানা: {item.address}
                            </p>
                          )}

                          {/* Contact info with copy action */}
                          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', marginTop: '0.4rem', fontSize: '0.8rem', color: '#475569' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                              ইমেইল: <strong>{item.email}</strong>
                              <button
                                type="button"
                                onClick={() => handleCopyText(item.email, `aff-email-${item.profileId}`)}
                                style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, color: '#059669' }}
                                title={isBn ? 'ইমেইল কপি করুন' : 'Copy Email'}
                              >
                                {copiedFieldKey === `aff-email-${item.profileId}` ? <Check size={12} color="#059669" /> : <Copy size={12} />}
                              </button>
                            </span>

                            {item.phone && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                | ফোন: <strong>{item.phone}</strong>
                                <button
                                  type="button"
                                  onClick={() => handleCopyText(item.phone, `aff-phone-${item.profileId}`)}
                                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, color: '#059669' }}
                                  title={isBn ? 'ফোন নম্বর কপি করুন' : 'Copy Phone'}
                                >
                                  {copiedFieldKey === `aff-phone-${item.profileId}` ? <Check size={12} color="#059669" /> : <Copy size={12} />}
                                </button>
                              </span>
                            )}
                          </div>

                          {item.rejectionReason && (
                            <div
                              style={{
                                marginTop: '0.5rem',
                                padding: '0.5rem 0.75rem',
                                backgroundColor: '#fef2f2',
                                border: '1px solid #fecaca',
                                borderRadius: '8px',
                                fontSize: '0.8rem',
                                color: '#991b1b',
                              }}
                            >
                              <strong>❌ প্রত্যাখ্যানের কারণ:</strong> {item.rejectionReason}
                            </div>
                          )}
                        </div>

                        <div>
                          {isVerified ? (
                            <span className={styles.historyBadgeApproved}>
                              <CheckCircle2 size={13} /> {isBn ? 'চূড়ান্ত অনুমোদিত' : 'Verified'}
                            </span>
                          ) : (
                            <span className={styles.historyBadgeRejected}>
                              <XCircle size={13} /> {isBn ? 'আবেদন বাতিল' : 'Rejected'}
                            </span>
                          )}
                        </div>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          paddingTop: '0.75rem',
                          borderTop: '1px solid var(--color-border, #e2e8f0)',
                          marginTop: '0.75rem',
                          flexWrap: 'wrap',
                          gap: '0.75rem',
                          fontSize: '0.8rem',
                          color: 'var(--text-muted, #64748b)',
                        }}
                      >
                        <div>
                          <span>{isBn ? 'নিষ্পত্তির তারিখ:' : 'Reviewed on:'} </span>
                          <strong>
                            {item.adminApprovedAt
                              ? new Date(item.adminApprovedAt).toLocaleString(isBn ? 'bn-BD' : 'en-US')
                              : item.updatedAt
                              ? new Date(item.updatedAt).toLocaleString(isBn ? 'bn-BD' : 'en-US')
                              : '—'}
                          </strong>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {!isTeacher && (
                            <button
                              type="button"
                              className="btn btn-outline"
                              style={{
                                padding: '0.35rem 0.75rem',
                                backgroundColor: '#eff6ff',
                                borderColor: '#bfdbfe',
                                color: '#1d4ed8',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                              }}
                              onClick={() => setSelectedStudentDetailsId(item.profileId || item.userId)}
                            >
                              <Eye size={14} /> {isBn ? 'বিস্তারিত প্রোফাইল ও পোস্ট' : 'Student Profile'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* Removals Tab View */}
      {affiliationVerificationTab === 'removals' && (
        <div
          className="card"
          style={{
            padding: '1.5rem',
            backgroundColor: 'var(--surface, #ffffff)',
            borderRadius: '12px',
            border: '1px solid var(--color-border)',
          }}
        >
          {/* Search & Filter Bar */}
          <div className={styles.historyFilterBar}>
            <div style={{ flex: '1 1 240px', position: 'relative' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                }}
              />
              <input
                type="text"
                className={styles.historySearchInput}
                placeholder={isBn ? 'সদস্যের নাম, ইমেইল, ফোন, প্রতিষ্ঠান বা কারণ দিয়ে খুঁজুন...' : 'Search by member, email, phone, org, reason...'}
                value={removalRequestsSearch}
                onChange={(e) => setRemovalRequestsSearch(e.target.value)}
              />
            </div>

            <select
              className={styles.historyFilterSelect}
              value={removalRequestsStatusFilter}
              onChange={(e) => setRemovalRequestsStatusFilter(e.target.value as any)}
            >
              <option value="all">
                {isBn ? 'সকল আবেদন' : 'All Requests'} ({removalRequests.length})
              </option>
              <option value="pending">
                {isBn ? 'পেন্ডিং আবেদন' : 'Pending'} ({removalRequests.filter((r) => r.status === 'pending').length})
              </option>
              <option value="approved">
                {isBn ? 'অনুমোদিত' : 'Approved'} ({removalRequests.filter((r) => r.status === 'approved').length})
              </option>
              <option value="rejected">
                {isBn ? 'বাতিল' : 'Rejected'} ({removalRequests.filter((r) => r.status === 'rejected').length})
              </option>
            </select>
          </div>

          {(() => {
            const filtered = removalRequests.filter((item) => {
              const matchStatus =
                removalRequestsStatusFilter === 'all' || item.status === removalRequestsStatusFilter;
              const term = removalRequestsSearch.trim().toLowerCase();
              const matchSearch =
                !term ||
                (item.orgName && item.orgName.toLowerCase().includes(term)) ||
                (item.targetName && item.targetName.toLowerCase().includes(term)) ||
                (item.targetEmail && item.targetEmail.toLowerCase().includes(term)) ||
                (item.targetPhone && item.targetPhone.toLowerCase().includes(term)) ||
                (item.reason && item.reason.toLowerCase().includes(term));
              return matchStatus && matchSearch;
            });

            if (filtered.length === 0) {
              return (
                <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2.5rem' }}>
                  {isBn ? 'কোনো সদস্য রিমুভ আবেদন পাওয়া যায়নি।' : 'No member removal requests found.'}
                </p>
              );
            }

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filtered.map((item) => {
                  const isTeacher = item.targetRole === 'teacher';
                  const isPending = item.status === 'pending';
                  const isApproved = item.status === 'approved';
                  const isRejected = item.status === 'rejected';

                  return (
                    <div key={item.id} className={styles.historyCard}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          flexWrap: 'wrap',
                          gap: '0.75rem',
                          marginBottom: '0.75rem',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <h4 style={{ fontWeight: 800, fontSize: '1.05rem', margin: 0, color: 'var(--text-main, #0f172a)' }}>
                              {item.targetName || 'Unnamed'}
                            </h4>

                            {isTeacher ? (
                              <span
                                style={{
                                  backgroundColor: '#eff6ff',
                                  color: '#1d4ed8',
                                  border: '1px solid #bfdbfe',
                                  padding: '0.15rem 0.55rem',
                                  borderRadius: '999px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                }}
                              >
                                <UserCheck size={12} /> {isBn ? 'শিক্ষক' : 'Teacher'}
                              </span>
                            ) : (
                              <span
                                style={{
                                  backgroundColor: '#f0fdf4',
                                  color: '#15803d',
                                  border: '1px solid #bbf7d0',
                                  padding: '0.15rem 0.55rem',
                                  borderRadius: '999px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                }}
                              >
                                <GraduationCap size={12} /> {isBn ? 'শিক্ষার্থী' : 'Student'}
                              </span>
                            )}
                          </div>

                          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted, #64748b)', margin: '0.3rem 0 0' }}>
                            {isBn ? 'আবেদনকারী প্রতিষ্ঠান:' : 'Requesting Institution:'} <strong style={{ color: 'var(--text-main, #0f172a)' }}>{item.orgName}</strong>
                          </p>

                          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.4rem', fontSize: '0.82rem', color: 'var(--text-muted, #64748b)' }}>
                            {item.targetEmail && (
                              <span>
                                {isBn ? 'ইমেইল:' : 'Email:'} <strong>{item.targetEmail}</strong>
                              </span>
                            )}
                            {item.targetPhone && (
                              <span>
                                {isBn ? 'ফোন:' : 'Phone:'} <strong>{item.targetPhone}</strong>
                              </span>
                            )}
                          </div>

                          <div
                            style={{
                              marginTop: '0.6rem',
                              padding: '0.6rem 0.85rem',
                              backgroundColor: 'rgba(239, 68, 68, 0.05)',
                              border: '1px solid rgba(239, 68, 68, 0.2)',
                              borderRadius: '8px',
                              fontSize: '0.85rem',
                              color: 'var(--text-main, #0f172a)',
                            }}
                          >
                            <strong style={{ color: '#dc2626' }}>{isBn ? 'রিমুভ করার কারণ:' : 'Removal Reason:'}</strong> {item.reason}
                          </div>

                          {item.rejectionReason && (
                            <div
                              style={{
                                marginTop: '0.5rem',
                                padding: '0.5rem 0.75rem',
                                backgroundColor: '#fef2f2',
                                border: '1px solid #fecaca',
                                borderRadius: '8px',
                                fontSize: '0.8rem',
                                color: '#991b1b',
                              }}
                            >
                              <strong>❌ {isBn ? 'বাতিলের কারণ:' : 'Rejection Reason:'}</strong> {item.rejectionReason}
                            </div>
                          )}
                        </div>

                        <div>
                          {isPending && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '999px',
                                fontSize: '0.78rem',
                                fontWeight: 800,
                                backgroundColor: '#fef3c7',
                                color: '#92400e',
                                border: '1px solid #fde68a',
                              }}
                            >
                              <Clock size={13} /> {isBn ? 'পর্যালোচনা অপেক্ষমাণ' : 'Pending Review'}
                            </span>
                          )}
                          {isApproved && (
                            <span className={styles.historyBadgeApproved}>
                              <CheckCircle2 size={13} /> {isBn ? 'রিমুভ কার্যকর' : 'Removal Approved'}
                            </span>
                          )}
                          {isRejected && (
                            <span className={styles.historyBadgeRejected}>
                              <XCircle size={13} /> {isBn ? 'আবেদন বাতিল' : 'Rejected'}
                            </span>
                          )}
                        </div>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          paddingTop: '0.75rem',
                          borderTop: '1px solid var(--color-border, #e2e8f0)',
                          marginTop: '0.75rem',
                          flexWrap: 'wrap',
                          gap: '0.75rem',
                          fontSize: '0.8rem',
                          color: 'var(--text-muted, #64748b)',
                        }}
                      >
                        <div>
                          <span>{isBn ? 'আবেদনের তারিখ:' : 'Requested on:'} </span>
                          <strong>
                            {item.createdAt ? new Date(item.createdAt).toLocaleString(isBn ? 'bn-BD' : 'en-US') : '—'}
                          </strong>
                          {item.requesterName && (
                            <span style={{ marginLeft: '0.75rem' }}>
                              ({isBn ? 'আবেদনকারী:' : 'By:'} <strong>{item.requesterName}</strong>)
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            className="btn btn-outline"
                            style={{
                              padding: '0.35rem 0.75rem',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                            }}
                            onClick={() => setAdminInspectionUserId(item.targetUserId)}
                          >
                            <Eye size={14} /> {isBn ? 'ইউজার ইনস্পেকশন' : 'Inspect User'}
                          </button>

                          {isPending && (
                            <>
                              <button
                                type="button"
                                className="btn btn-primary"
                                style={{
                                  padding: '0.35rem 0.85rem',
                                  fontSize: '0.8rem',
                                  fontWeight: 700,
                                  backgroundColor: '#dc2626',
                                  borderColor: '#dc2626',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                }}
                                disabled={actionLoading}
                                onClick={() => handleReviewMemberRemoval(item.id, true)}
                              >
                                <CheckCircle2 size={14} /> {isBn ? 'রিমুভ অনুমোদন' : 'Approve Removal'}
                              </button>

                              <button
                                type="button"
                                className="btn btn-outline"
                                style={{
                                  padding: '0.35rem 0.75rem',
                                  fontSize: '0.8rem',
                                  fontWeight: 700,
                                  borderColor: '#fca5a5',
                                  color: '#dc2626',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                }}
                                disabled={actionLoading}
                                onClick={() => handleReviewMemberRemoval(item.id, false)}
                              >
                                <XCircle size={14} /> {isBn ? 'বাতিল' : 'Reject'}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

export default AffiliationRequestsTab;
