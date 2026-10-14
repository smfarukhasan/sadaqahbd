'use client';

import React, { useState } from 'react';
import { GraduationCap, Search, Eye, UserCheck, UserX } from 'lucide-react';
import { formatBengaliDate } from '@/lib/format-utils';
import styles from '../../admin.module.css';

interface AllStudentsTabProps {
  isBn: boolean;
  allUsers: any[];
  setAdminInspectionUserId: (id: string | null) => void;
  handleToggleUserStatus: (id: string, status: 'active' | 'suspended', name: string) => void;
}

export function AllStudentsTab({
  isBn,
  allUsers,
  setAdminInspectionUserId,
  handleToggleUserStatus,
}: AllStudentsTabProps) {
  const [studentDirectorySearch, setStudentDirectorySearch] = useState<string>('');
  const [studentStatusFilter, setStudentStatusFilter] = useState<string>('all');

  const students = allUsers.filter((u) => u.role === 'student');
  const filtered = students.filter((u) => {
    const matchStatus = studentStatusFilter === 'all' || u.status === studentStatusFilter;
    const term = studentDirectorySearch.trim().toLowerCase();
    const matchSearch =
      !term ||
      (u.fullName && u.fullName.toLowerCase().includes(term)) ||
      (u.email && u.email.toLowerCase().includes(term)) ||
      (u.phone && u.phone.toLowerCase().includes(term));
    return matchStatus && matchSearch;
  });

  return (
    <div>
      <div className={styles.contentHeader}>
        <div>
          <h1 className={styles.pageTitle}>
            <GraduationCap size={26} color="var(--color-primary)" />
            {isBn ? 'সকল শিক্ষার্থী ডিরেক্টরি' : 'All Students Directory'}
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            {isBn
              ? 'প্ল্যাটফর্মের নিবন্ধিত সকল শিক্ষার্থীর শিক্ষা তথ্য, ক্যাম্পেইন ও প্রাতিষ্ঠানিক ছাড়পত্রের সার্বিক চিত্র।'
              : 'Universal directory of all registered and verified students across institutions.'}
          </p>
        </div>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
          {isBn
            ? `মোট শিক্ষার্থী: ${students.length} জন`
            : `Total Students: ${students.length}`}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          marginBottom: '1.25rem',
          alignItems: 'center',
        }}
      >
        <div style={{ flex: '1 1 280px', position: 'relative' }}>
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: '0.85rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8',
            }}
          />
          <input
            type="text"
            placeholder={
              isBn ? 'শিক্ষার্থীর নাম, ইমেইল বা ফোন দিয়ে খুঁজুন...' : 'Search by student name, email, or phone...'
            }
            value={studentDirectorySearch}
            onChange={(e) => setStudentDirectorySearch(e.target.value)}
            style={{
              width: '100%',
              padding: '0.6rem 1rem 0.6rem 2.5rem',
              borderRadius: '10px',
              border: '1px solid var(--surface-border, #e2e8f0)',
              fontSize: '0.88rem',
              backgroundColor: 'var(--surface, #ffffff)',
              color: 'var(--text-main, #0f172a)',
              outline: 'none',
            }}
          />
        </div>

        <select
          value={studentStatusFilter}
          onChange={(e) => setStudentStatusFilter(e.target.value)}
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: '10px',
            border: '1px solid var(--surface-border, #e2e8f0)',
            fontSize: '0.88rem',
            backgroundColor: 'var(--surface, #ffffff)',
            color: 'var(--text-main, #0f172a)',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <option value="all">{isBn ? 'সকল স্ট্যাটাস (All Status)' : 'All Status'}</option>
          <option value="active">{isBn ? 'সক্রিয় (Active)' : 'Active'}</option>
          <option value="suspended">{isBn ? 'স্থগিত (Suspended)' : 'Suspended'}</option>
        </select>
      </div>

      {/* Students Table */}
      <div
        className="card"
        style={{
          padding: '1.5rem',
          backgroundColor: 'var(--surface, #ffffff)',
          borderRadius: '12px',
          border: '1px solid var(--color-border, #e2e8f0)',
        }}
      >
        {filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            {isBn ? 'কোনো শিক্ষার্থী পাওয়া যায়নি।' : 'No students match your search criteria.'}
          </div>
        ) : (
          <>
            <div className={styles.desktopTableOnly}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--color-border, #e2e8f0)', color: 'var(--color-text-muted)' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>{isBn ? 'শিক্ষার্থীর নাম' : 'Student'}</th>
                      <th style={{ padding: '0.75rem 1rem' }}>{isBn ? 'যোগাযোগ' : 'Contact'}</th>
                      <th style={{ padding: '0.75rem 1rem' }}>{isBn ? 'স্ট্যাটাস' : 'Status'}</th>
                      <th style={{ padding: '0.75rem 1rem' }}>{isBn ? 'তারিখ' : 'Joined'}</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>{isBn ? 'অ্যাকশন' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((u) => (
                      <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border, #e2e8f0)' }}>
                        <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            <GraduationCap size={16} color="#2563eb" />
                            <span>{u.fullName || 'Unnamed'}</span>
                          </div>
                          <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>ID: {u.id.slice(0, 8)}</span>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ color: 'var(--text-main)' }}>{u.email}</div>
                          <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{u.phone || 'No phone'}</span>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span
                            style={{
                              padding: '0.2rem 0.55rem',
                              borderRadius: '20px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              backgroundColor:
                                u.status === 'suspended'
                                  ? 'rgba(239, 68, 68, 0.12)'
                                  : 'rgba(34, 197, 94, 0.12)',
                              color: u.status === 'suspended' ? '#dc2626' : '#16a34a',
                              border: `1px solid ${
                                u.status === 'suspended' ? '#fca5a5' : '#86efac'
                              }`,
                            }}
                          >
                            {u.status === 'suspended' ? (isBn ? 'স্থগিত' : 'Suspended') : (isBn ? 'সক্রিয়' : 'Active')}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', color: 'var(--text-main, #0f172a)', fontSize: '0.82rem', fontWeight: 700 }}>
                          {formatBengaliDate(u.createdAt, isBn)}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
                            <button
                              type="button"
                              onClick={() => setAdminInspectionUserId(u.id)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                padding: '0.35rem 0.75rem',
                                backgroundColor: '#eff6ff',
                                border: '1px solid #bfdbfe',
                                color: '#1d4ed8',
                                borderRadius: '8px',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                              title={isBn ? 'শিক্ষার্থীর বিস্তারিত প্রোফাইল ও ইতিহাস দেখুন' : 'Inspect Student'}
                            >
                              <Eye size={14} />
                              <span>{isBn ? 'ইনস্পেকশন' : 'Inspect'}</span>
                            </button>

                            {u.status === 'suspended' ? (
                              <button
                                type="button"
                                onClick={() => handleToggleUserStatus(u.id, 'active', u.fullName || u.email)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  padding: '0.35rem 0.75rem',
                                  backgroundColor: '#ecfdf5',
                                  border: '1px solid #a7f3d0',
                                  color: '#047857',
                                  borderRadius: '8px',
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                                title={isBn ? 'সক্রিয় করুন' : 'Activate User'}
                              >
                                <UserCheck size={14} />
                                <span>{isBn ? 'সক্রিয়' : 'Activate'}</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleToggleUserStatus(u.id, 'suspended', u.fullName || u.email)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  padding: '0.35rem 0.75rem',
                                  backgroundColor: '#fef2f2',
                                  border: '1px solid #fecaca',
                                  color: '#dc2626',
                                  borderRadius: '8px',
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                                title={isBn ? 'স্থগিত করুন' : 'Suspend User'}
                              >
                                <UserX size={14} />
                                <span>{isBn ? 'স্থগিত' : 'Suspend'}</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className={styles.mobileCardsOnly}>
              {filtered.map((u) => (
                <div
                  key={u.id}
                  style={{
                    padding: '1rem',
                    borderBottom: '1px solid var(--color-border, #e2e8f0)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ margin: 0, fontWeight: 700, color: 'var(--text-main)' }}>{u.fullName || 'Unnamed'}</h4>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>ID: {u.id.slice(0, 8)}</span>
                    </div>
                    <span
                      style={{
                        padding: '0.15rem 0.5rem',
                        borderRadius: '20px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        backgroundColor:
                          u.status === 'suspended' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(34, 197, 94, 0.12)',
                        color: u.status === 'suspended' ? '#dc2626' : '#16a34a',
                      }}
                    >
                      {u.status === 'suspended' ? (isBn ? 'স্থগিত' : 'Suspended') : (isBn ? 'সক্রিয়' : 'Active')}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    <div>{u.email}</div>
                    <div>{u.phone || 'No phone'}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setAdminInspectionUserId(u.id)}
                      style={{
                        padding: '0.35rem 0.65rem',
                        backgroundColor: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        color: '#1d4ed8',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <Eye size={13} /> {isBn ? 'ইনস্পেকশন' : 'Inspect'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AllStudentsTab;
