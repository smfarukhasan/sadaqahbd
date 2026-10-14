'use client';

import React, { useState } from 'react';
import { GraduationCap, Clock, History as HistoryIcon, Eye, Search, CheckCircle2, XCircle } from 'lucide-react';
import styles from '../../admin.module.css';

interface StudentPostsTabProps {
  isBn: boolean;
  loadingData: boolean;
  studentPostRequests: any[];
  studentPostHistory: any[];
  handleOpenPostReview: (post: any, isReadOnly?: boolean) => void;
  setSelectedStudentDetailsId: (id: string | null) => void;
}

export function StudentPostsTab({
  isBn,
  loadingData,
  studentPostRequests,
  studentPostHistory,
  handleOpenPostReview,
  setSelectedStudentDetailsId,
}: StudentPostsTabProps) {
  const [postVerificationTab, setPostVerificationTab] = useState<'pending' | 'history'>('pending');
  const [postHistorySearch, setPostHistorySearch] = useState<string>('');
  const [postHistoryStatusFilter, setPostHistoryStatusFilter] = useState<'all' | 'approved' | 'rejected'>('all');

  return (
    <div>
      <div className={styles.contentHeader}>
        <div>
          <h1 className={styles.pageTitle}>
            <GraduationCap size={26} color="var(--color-primary)" />
            {isBn ? 'শিক্ষার্থী পোস্ট যাচাই ও ছাড়পত্র' : 'Student Campaign Verifications'}
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            {isBn
              ? 'শিক্ষক ও প্রতিষ্ঠান প্রধান কর্তৃক ডাবল ভেরিফাইড আবেদনসমূহ, বাজেট সমন্বয় ও চূড়ান্ত অনুমোদনের ইতিহাস।'
              : 'Double-verified student campaigns, budget adjustment, and final approval records.'}
          </p>
        </div>
      </div>

      {/* Sub-tabs: Pending vs History */}
      <div className={styles.verificationTabs}>
        <button
          type="button"
          className={`${styles.verificationTabBtn} ${postVerificationTab === 'pending' ? styles.verificationTabBtnActive : ''}`}
          onClick={() => setPostVerificationTab('pending')}
        >
          <Clock size={16} />
          <span>{isBn ? 'পেন্ডিং অনুমোদন' : 'Pending Clearances'}</span>
          <span className={styles.tabBadge}>{studentPostRequests.length}</span>
        </button>

        <button
          type="button"
          className={`${styles.verificationTabBtn} ${postVerificationTab === 'history' ? styles.verificationTabBtnActive : ''}`}
          onClick={() => setPostVerificationTab('history')}
        >
          <HistoryIcon size={16} />
          <span>{isBn ? 'পোস্ট যাচাই ইতিহাস' : 'Clearance History'}</span>
          <span className={styles.tabBadge}>{studentPostHistory.length}</span>
        </button>
      </div>

      <div
        className="card"
        style={{
          padding: '1.5rem',
          backgroundColor: 'var(--surface, #ffffff)',
          borderRadius: '12px',
          border: '1px solid var(--color-border)',
        }}
      >
        {postVerificationTab === 'pending' ? (
          <>
            {loadingData ? (
              <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>
                {isBn ? 'ডাটা লোড হচ্ছে...' : 'Loading data...'}
              </p>
            ) : studentPostRequests.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>
                {isBn ? 'কোনো শিক্ষার্থী পোস্ট অনুমোদনের অপেক্ষায় নেই।' : 'No student posts pending approval.'}
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {studentPostRequests.map((post) => (
                  <div
                    key={post.id}
                    style={{
                      padding: '1.25rem',
                      backgroundColor: 'var(--background-alt, #f8fafc)',
                      borderRadius: '12px',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '0.5rem',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                      }}
                    >
                      <div>
                        <h4 style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--color-primary-dark)' }}>
                          {post.title}
                        </h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: '0.2rem 0 0' }}>
                          {isBn ? 'শিক্ষার্থী:' : 'Student:'} <strong>{post.studentName}</strong> | {isBn ? 'প্রতিষ্ঠান:' : 'Institution:'} <strong>{post.institution}</strong>
                        </p>
                      </div>
                      <span style={{ fontWeight: '800', color: 'var(--color-primary)', fontSize: '1.2rem' }}>
                        ৳{Number(post.amount || 0).toLocaleString()}
                      </span>
                    </div>

                    {post.expenses && post.expenses.length > 0 && (
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                        {post.expenses.map((exp: any, i: number) => (
                          <span key={i} className={styles.expenseChip}>
                            <span className={styles.expenseChipCat}>{exp.category}:</span>
                            <span className={styles.expenseChipAmt}>৳{Number(exp.amount || 0).toLocaleString()}</span>
                          </span>
                        ))}
                      </div>
                    )}

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '1rem',
                        flexWrap: 'wrap',
                        gap: '0.75rem',
                      }}
                    >
                      <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem', flexWrap: 'wrap' }}>
                        {post.teacherVerified && (
                          <span
                            style={{
                              padding: '0.2rem 0.6rem',
                              backgroundColor: 'rgba(13, 148, 136, 0.12)',
                              color: 'var(--color-primary)',
                              borderRadius: '6px',
                              fontWeight: 600,
                            }}
                          >
                            ✓ {isBn ? 'শিক্ষক যাচাইকৃত' : 'Teacher Verified'}
                          </span>
                        )}
                        {post.orgVerified && (
                          <span
                            style={{
                              padding: '0.2rem 0.6rem',
                              backgroundColor: 'rgba(13, 148, 136, 0.12)',
                              color: 'var(--color-primary)',
                              borderRadius: '6px',
                              fontWeight: 600,
                            }}
                          >
                            ✓ {isBn ? 'প্রতিষ্ঠান সিলমোহর' : 'Institution Stamped'}
                          </span>
                        )}
                      </div>

                      <button
                        className="btn btn-primary"
                        style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
                        onClick={() => handleOpenPostReview(post)}
                      >
                        <Eye size={16} /> {isBn ? 'ড্রয়ারে বিস্তারিত দেখুন ও অনুমোদন করুন' : 'Review & Approve'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          /* History Tab View */
          <>
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
                  placeholder={isBn ? 'পোস্টের শিরোনাম, শিক্ষার্থী বা প্রতিষ্ঠান দিয়ে খুঁজুন...' : 'Search by title, student, institution...'}
                  value={postHistorySearch}
                  onChange={(e) => setPostHistorySearch(e.target.value)}
                />
              </div>

              <select
                className={styles.historyFilterSelect}
                value={postHistoryStatusFilter}
                onChange={(e) => setPostHistoryStatusFilter(e.target.value as any)}
              >
                <option value="all">{isBn ? 'সকল স্ট্যাটাস (All)' : 'All Statuses'}</option>
                <option value="approved">{isBn ? 'অনুমোদিত ও লাইভ' : 'Approved'}</option>
                <option value="rejected">{isBn ? 'পোস্ট বাতিলকৃত' : 'Rejected'}</option>
              </select>
            </div>

            {(() => {
              const term = postHistorySearch.toLowerCase().trim();
              const filtered = studentPostHistory.filter((post) => {
                const matchStatus =
                  postHistoryStatusFilter === 'all' || post.status === postHistoryStatusFilter;
                const matchSearch =
                  !term ||
                  (post.title && post.title.toLowerCase().includes(term)) ||
                  (post.studentName && post.studentName.toLowerCase().includes(term)) ||
                  (post.institution && post.institution.toLowerCase().includes(term));
                return matchStatus && matchSearch;
              });

              if (filtered.length === 0) {
                return (
                  <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2.5rem' }}>
                    {isBn ? 'কোনো পূর্বের পোস্ট রেকর্ড পাওয়া যায়নি।' : 'No historical student post records found.'}
                  </p>
                );
              }

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {filtered.map((post) => {
                    const isApproved = post.status === 'approved';
                    return (
                      <div key={post.id} className={styles.historyCard}>
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
                          <div style={{ flex: '1 1 300px' }}>
                            <h4 style={{ fontWeight: 800, fontSize: '1.1rem', margin: 0, color: 'var(--text-main, #0f172a)' }}>
                              {post.title}
                            </h4>
                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: '0.35rem 0 0' }}>
                              {isBn ? 'শিক্ষার্থী:' : 'Student:'} <strong>{post.studentName}</strong> | {isBn ? 'প্রতিষ্ঠান:' : 'Institution:'} <strong>{post.institution}</strong>
                              {post.studentPhone && ` | ${isBn ? 'ফোন:' : 'Phone:'} ${post.studentPhone}`}
                              {post.studentEmail && ` | ${isBn ? 'ইমেইল:' : 'Email:'} ${post.studentEmail}`}
                            </p>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{isBn ? 'প্রয়োজনীয় অনুদান' : 'Target Amount'}</div>
                              <div style={{ fontWeight: 800, color: 'var(--color-primary)', fontSize: '1.15rem' }}>
                                ৳{Number(post.amount || 0).toLocaleString()}
                              </div>
                            </div>
                            <div>
                              {isApproved ? (
                                <span className={styles.historyBadgeApproved}>
                                  <CheckCircle2 size={13} /> {isBn ? 'অনুমোদিত ও লাইভ' : 'Approved & Live'}
                                </span>
                              ) : (
                                <span className={styles.historyBadgeRejected}>
                                  <XCircle size={13} /> {isBn ? 'পোস্ট বাতিলকৃত' : 'Rejected'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Problem Description Preview */}
                        {post.problemDesc && (
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-main, #334155)', margin: '0.5rem 0', lineHeight: 1.5 }}>
                            {post.problemDesc.length > 200 ? `${post.problemDesc.slice(0, 200)}...` : post.problemDesc}
                          </p>
                        )}

                        {/* Itemized Expenses Breakdown */}
                        {post.expenses && post.expenses.length > 0 && (
                          <div style={{ margin: '0.65rem 0' }}>
                            <div className={styles.expenseBreakdownLabel}>
                              {isBn ? 'খরচের ক্যাটাগরি ও বিভাজন:' : 'Expense Breakdown:'}
                            </div>
                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                              {post.expenses.map((exp: any, i: number) => (
                                <span key={i} className={styles.expenseChip}>
                                  <span className={styles.expenseChipCat}>{exp.category}:</span>
                                  <span className={styles.expenseChipAmt}>৳{Number(exp.amount || 0).toLocaleString()}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Admin Notes */}
                        {post.adminModificationReason && (
                          <div
                            style={{
                              marginTop: '0.65rem',
                              padding: '0.6rem 0.85rem',
                              backgroundColor: '#fffbeb',
                              border: '1px solid #fde68a',
                              borderRadius: '8px',
                              fontSize: '0.82rem',
                              color: '#92400e',
                            }}
                          >
                            <strong>⚠️ {isBn ? 'এডমিন খরচের বিভাজন সমন্বয় নোট:' : 'Admin Modification Note:'}</strong> {post.adminModificationReason}
                          </div>
                        )}

                        {post.rejectionReason && (
                          <div className={styles.historyRejectionBox}>
                            <strong>❌ {isBn ? 'প্রত্যাখ্যানের কারণ:' : 'Rejection Reason:'}</strong> {post.rejectionReason}
                          </div>
                        )}

                        {/* Footer Action & Dates */}
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
                              {post.updatedAt
                                ? new Date(post.updatedAt).toLocaleString(isBn ? 'bn-BD' : 'en-US')
                                : post.createdAt
                                ? new Date(post.createdAt).toLocaleString(isBn ? 'bn-BD' : 'en-US')
                                : '—'}
                            </strong>
                          </div>

                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {post.studentId && (
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
                                onClick={() => setSelectedStudentDetailsId(post.studentId)}
                              >
                                <GraduationCap size={14} /> {isBn ? 'শিক্ষার্থীর প্রোফাইল' : 'Student Profile'}
                              </button>
                            )}

                            <button
                              type="button"
                              className="btn btn-outline"
                              style={{
                                padding: '0.35rem 0.75rem',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                              }}
                              onClick={() => handleOpenPostReview(post, true)}
                            >
                              <Eye size={14} /> {isBn ? 'বিস্তারিত ড্রয়ার' : 'Review Details'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </>
        )}
      </div>
    </div>
  );
}

export default StudentPostsTab;
