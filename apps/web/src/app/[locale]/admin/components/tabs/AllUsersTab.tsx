'use client';

import React, { useState } from 'react';
import {
  Users,
  Search,
  Eye,
  Lock,
  CheckCircle2,
  Trash2,
  UserCheck,
  UserX,
  ShieldCheck,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { UserRole } from '@sadaqahbd/schema';
import styles from '../../admin.module.css';
import UserDeletionGuardModal from '@/components/portal/UserDeletionGuardModal';

interface AllUsersTabProps {
  allUsers: any[];
  loadingData: boolean;
  isBn: boolean;
  currentUser: any;
  onInspectUser: (userId: string) => void;
  onToggleUserStatus: (userId: string, targetStatus: 'active' | 'suspended', userName: string) => void;
  onDeleteUser: (userId: string, userName: string) => void;
  loadAdminData?: (isSilent?: boolean) => void;
}

export default function AllUsersTab({
  allUsers,
  loadingData,
  isBn,
  currentUser,
  onInspectUser,
  onToggleUserStatus,
  onDeleteUser,
  loadAdminData,
}: AllUsersTabProps) {
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [guardModalUser, setGuardModalUser] = useState<any | null>(null);

  const filteredUsers = allUsers.filter((u) => {
    const term = userSearchTerm.trim().toLowerCase();
    const matchesSearch =
      !term ||
      (u.fullName && u.fullName.toLowerCase().includes(term)) ||
      (u.email && u.email.toLowerCase().includes(term)) ||
      (u.phone && u.phone.includes(term));
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  return (
<div>
            <div className={styles.contentHeader}>
              <div>
                <h1 className={styles.pageTitle}>
                  <Users size={26} color="var(--color-primary)" />
                  {isBn ? 'সকল ব্যবহারকারী অডিট ও ডিরেক্টরি' : 'Universal User Directory & Governance'}
                </h1>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                  {isBn
                    ? 'প্ল্যাটফর্মের সকল অ্যাকাউন্টের তদারকি, স্থগিতা/পুনঃসক্রিয়করণ ও সার্বিক নিরাপত্তা পরিচালনা।'
                    : 'Audit platform accounts, toggle suspension/activation status, and manage platform safety.'}
                </p>
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                {isBn ? `মোট রেজিস্টার্ড ইউজার: ${allUsers.length} জন` : `Total Registered Users: ${allUsers.length}`}
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
                  placeholder={isBn ? 'নাম, ইমেইল বা ফোন দিয়ে খুঁজুন...' : 'Search by name, email, or phone...'}
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
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
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
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
                <option value="all">{isBn ? 'সকল রোল (All Roles)' : 'All Roles'}</option>
                <option value="donor">{isBn ? 'দাতা (Donor)' : 'Donor'}</option>
                <option value="student">{isBn ? 'শিক্ষার্থী (Student)' : 'Student'}</option>
                <option value="teacher">{isBn ? 'শিক্ষক (Teacher)' : 'Teacher'}</option>
                <option value="organization">{isBn ? 'প্রতিষ্ঠান (Organization)' : 'Organization'}</option>
                <option value="admin">{isBn ? 'স্টাফ এডমিন (Admin)' : 'Staff Admin'}</option>
                <option value="super_admin">{isBn ? 'সুপার এডমিন (Super Admin)' : 'Super Admin'}</option>
              </select>
            </div>

            {/* Users Table */}
            <div
              className="card"
              style={{
                padding: '1.5rem',
                backgroundColor: 'var(--surface, #ffffff)',
                borderRadius: '12px',
                border: '1px solid var(--color-border, #e2e8f0)',
              }}
            >
              {loadingData ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  {isBn ? 'ডাটা লোড হচ্ছে...' : 'Loading Users...'}
                </div>
              ) : filteredUsers.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  {isBn ? 'কোনো ব্যবহারকারী পাওয়া যায়নি।' : 'No users match your search criteria.'}
                </div>
              ) : (
                <>
                  {/* Desktop Table View (>= 768px) */}
                  <div className={styles.desktopTableOnly}>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid var(--color-border, #e2e8f0)', color: 'var(--color-text-muted)' }}>
                            <th style={{ padding: '0.75rem 1rem' }}>{isBn ? 'ব্যবহারকারীর নাম' : 'User'}</th>
                            <th style={{ padding: '0.75rem 1rem' }}>{isBn ? 'রোল' : 'Role'}</th>
                            <th style={{ padding: '0.75rem 1rem' }}>{isBn ? 'যোগাযোগ' : 'Contact'}</th>
                            <th style={{ padding: '0.75rem 1rem' }}>{isBn ? 'স্ট্যাটাস' : 'Status'}</th>
                            <th style={{ padding: '0.75rem 1rem' }}>{isBn ? 'তারিখ' : 'Joined'}</th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>{isBn ? 'অ্যাকশন' : 'Action'}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUsers.map((u) => {
                            const isRootMaster =
                              u.role === UserRole.MASTER_ADMIN || u.email?.toLowerCase() === 'admin@sadaqahbd.com';
                            return (
                              <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border, #e2e8f0)' }}>
                                <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                    <span>{u.fullName || 'Unnamed'}</span>
                                    {u.hasPlatformData ? (
                                      <span
                                        title={isBn ? 'প্ল্যাটফর্ম অডিট রেকর্ড সংরক্ষিত (সততা নীতি অনুযায়ী ডিলিট নিষিদ্ধ)' : 'Platform audit records exist (Integrity Guard Active)'}
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '2px',
                                          fontSize: '0.68rem',
                                          color: '#059669',
                                          backgroundColor: 'rgba(5, 150, 105, 0.08)',
                                          padding: '0.1rem 0.4rem',
                                          borderRadius: '4px',
                                          border: '1px solid rgba(5, 150, 105, 0.25)',
                                          fontWeight: 700,
                                        }}
                                      >
                                        <ShieldCheck size={11} />
                                        {isBn ? 'অডিট সংরক্ষিত' : 'Audit Trail'}
                                      </span>
                                    ) : (
                                      <span
                                        title={isBn ? 'ব্যক্তিগত তথ্যসম্পন্ন খালি অ্যাকাউন্ট' : 'Personal info only (Empty account)'}
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '2px',
                                          fontSize: '0.68rem',
                                          color: '#64748b',
                                          backgroundColor: '#f1f5f9',
                                          padding: '0.1rem 0.4rem',
                                          borderRadius: '4px',
                                          border: '1px solid #e2e8f0',
                                          fontWeight: 600,
                                        }}
                                      >
                                        <Info size={11} />
                                        {isBn ? 'খালি অ্যাকাউন্ট' : 'Personal'}
                                      </span>
                                    )}
                                  </div>
                                  <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>ID: {u.id.slice(0, 8)}</span>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                  <span
                                    style={{
                                      padding: '0.2rem 0.6rem',
                                      borderRadius: '20px',
                                      fontSize: '0.75rem',
                                      fontWeight: 800,
                                      textTransform: 'uppercase',
                                      backgroundColor:
                                        u.role === 'master_admin'
                                          ? '#fef3c7'
                                          : u.role === 'super_admin'
                                          ? '#ede9fe'
                                          : u.role === 'admin'
                                          ? '#e0e7ff'
                                          : u.role === 'donor'
                                          ? '#fce7f3'
                                          : u.role === 'student'
                                          ? '#eff6ff'
                                          : u.role === 'teacher'
                                          ? '#ecfdf5'
                                          : '#fef3c7',
                                      color:
                                        u.role === 'master_admin'
                                          ? '#b45309'
                                          : u.role === 'super_admin'
                                          ? '#6d28d9'
                                          : u.role === 'admin'
                                          ? '#4338ca'
                                          : u.role === 'donor'
                                          ? '#be185d'
                                          : u.role === 'student'
                                          ? '#1d4ed8'
                                          : u.role === 'teacher'
                                          ? '#047857'
                                          : '#b45309',
                                    }}
                                  >
                                    {u.role}
                                  </span>
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
                                <td style={{ padding: '1rem', color: '#94a3b8', fontSize: '0.82rem' }}>
                                  {u.createdAt ? new Date(u.createdAt).toLocaleDateString(isBn ? 'bn-BD' : 'en-US') : '—'}
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                  {isRootMaster ? (
                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic', fontWeight: 600 }}>
                                      🛡️ {isBn ? 'রুট সুরক্ষিত' : 'Root Protected'}
                                    </span>
                                  ) : (
                                    <div style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
                                      <button
                                        type="button"
                                        onClick={() => onInspectUser(u.id)}
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
                                        title={isBn ? 'ব্যবহারকারীর বিস্তারিত প্রোফাইল ও অডিট' : 'Inspect User Details & History'}
                                      >
                                        <Eye size={14} />
                                        <span>{isBn ? 'ইনস্পেকশন' : 'Inspect'}</span>
                                      </button>
                                      {u.status === 'suspended' ? (
                                        <button
                                          type="button"
                                          onClick={() => onToggleUserStatus(u.id, 'active', u.fullName || u.email)}
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
                                          onClick={() => onToggleUserStatus(u.id, 'suspended', u.fullName || u.email)}
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

                                      {currentUser?.role === UserRole.MASTER_ADMIN && (
                                        <button
                                          type="button"
                                          onClick={() => setGuardModalUser(u)}
                                          style={{
                                            padding: '0.35rem 0.65rem',
                                            backgroundColor: u.hasPlatformData ? '#fff1f2' : '#ffffff',
                                            border: `1px solid ${u.hasPlatformData ? '#fecdd3' : '#fecaca'}`,
                                            color: '#dc2626',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.3rem',
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                          }}
                                          title={
                                            u.hasPlatformData
                                              ? (isBn ? 'প্ল্যাটফর্ম অডিট রেকর্ড সংরক্ষিত (ডিলিট যাচাই ও সততা নীতি)' : 'Platform Records Preserved (Integrity Check)')
                                              : (isBn ? 'খালি অ্যাকাউন্ট ডিলিট করুন' : 'Delete Empty Account')
                                          }
                                        >
                                          {u.hasPlatformData ? <Lock size={13} /> : <Trash2 size={13} />}
                                          <span>{u.hasPlatformData ? (isBn ? 'লকড' : 'Locked') : (isBn ? 'ডিলিট' : 'Delete')}</span>
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Mobile Touch Cards (< 768px) */}
                  <div className={styles.mobileCardOnly}>
                    {filteredUsers.map((u) => {
                      const isRootMaster =
                        u.role === UserRole.MASTER_ADMIN || u.email?.toLowerCase() === 'admin@sadaqahbd.com';
                      return (
                        <div key={u.id} className={styles.mobileCard}>
                          <div className={styles.mobileCardHeader}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                <div className={styles.mobileCardTitle}>{u.fullName || 'Unnamed'}</div>
                                {u.hasPlatformData ? (
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '2px',
                                      fontSize: '0.65rem',
                                      color: '#059669',
                                      backgroundColor: 'rgba(5, 150, 105, 0.08)',
                                      padding: '0.1rem 0.35rem',
                                      borderRadius: '4px',
                                      border: '1px solid rgba(5, 150, 105, 0.25)',
                                      fontWeight: 700,
                                    }}
                                  >
                                    <ShieldCheck size={10} />
                                    {isBn ? 'সংরক্ষিত' : 'Audit'}
                                  </span>
                                ) : (
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '2px',
                                      fontSize: '0.65rem',
                                      color: '#64748b',
                                      backgroundColor: '#f1f5f9',
                                      padding: '0.1rem 0.35rem',
                                      borderRadius: '4px',
                                      border: '1px solid #e2e8f0',
                                      fontWeight: 600,
                                    }}
                                  >
                                    <Info size={10} />
                                    {isBn ? 'খালি' : 'Personal'}
                                  </span>
                                )}
                              </div>
                              <div className={styles.mobileCardSubtitle}>{u.email}</div>
                              {u.phone && <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '2px' }}>{u.phone}</div>}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                              <span
                                style={{
                                  padding: '0.2rem 0.55rem',
                                  borderRadius: '20px',
                                  fontSize: '0.72rem',
                                  fontWeight: 800,
                                  textTransform: 'uppercase',
                                  backgroundColor:
                                    u.role === 'master_admin'
                                      ? '#fef3c7'
                                      : u.role === 'super_admin'
                                      ? '#ede9fe'
                                      : u.role === 'admin'
                                      ? '#e0e7ff'
                                      : u.role === 'donor'
                                      ? '#fce7f3'
                                      : u.role === 'student'
                                      ? '#eff6ff'
                                      : u.role === 'teacher'
                                      ? '#ecfdf5'
                                      : '#fef3c7',
                                  color:
                                    u.role === 'master_admin'
                                      ? '#b45309'
                                      : u.role === 'super_admin'
                                      ? '#6d28d9'
                                      : u.role === 'admin'
                                      ? '#4338ca'
                                      : u.role === 'donor'
                                      ? '#be185d'
                                      : u.role === 'student'
                                      ? '#1d4ed8'
                                      : u.role === 'teacher'
                                      ? '#047857'
                                      : '#b45309',
                                }}
                              >
                                {u.role}
                              </span>
                              <span
                                style={{
                                  padding: '0.15rem 0.45rem',
                                  borderRadius: '12px',
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  backgroundColor:
                                    u.status === 'suspended'
                                      ? 'rgba(239, 68, 68, 0.12)'
                                      : 'rgba(34, 197, 94, 0.12)',
                                  color: u.status === 'suspended' ? '#dc2626' : '#16a34a',
                                }}
                              >
                                {u.status === 'suspended' ? (isBn ? 'স্থগিত' : 'Suspended') : (isBn ? 'সক্রিয়' : 'Active')}
                              </span>
                            </div>
                          </div>

                          <div className={styles.mobileCardRow}>
                            <span style={{ color: 'var(--color-text-muted)' }}>{isBn ? 'তারিখ:' : 'Joined:'}</span>
                            <span>{u.createdAt ? new Date(u.createdAt).toLocaleDateString(isBn ? 'bn-BD' : 'en-US') : '—'}</span>
                          </div>

                          <div className={styles.mobileCardActions}>
                            {isRootMaster ? (
                              <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic', fontWeight: 600 }}>
                                🛡️ {isBn ? 'রুট সুরক্ষিত' : 'Root Protected'}
                              </span>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => onInspectUser(u.id)}
                                  className="btn btn-outline"
                                  style={{
                                    padding: '0.45rem 0.85rem',
                                    backgroundColor: '#eff6ff',
                                    borderColor: '#bfdbfe',
                                    color: '#1d4ed8',
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                  }}
                                >
                                  <Eye size={14} />
                                  <span>{isBn ? 'ইনস্পেকশন' : 'Inspect'}</span>
                                </button>
                                {u.status === 'suspended' ? (
                                  <button
                                    type="button"
                                    onClick={() => onToggleUserStatus(u.id, 'active', u.fullName || u.email)}
                                    className="btn btn-outline"
                                    style={{
                                      padding: '0.45rem 0.85rem',
                                      backgroundColor: '#ecfdf5',
                                      borderColor: '#a7f3d0',
                                      color: '#047857',
                                      fontSize: '0.8rem',
                                      fontWeight: 700,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.35rem',
                                    }}
                                  >
                                    <UserCheck size={14} />
                                    <span>{isBn ? 'সক্রিয় করুন' : 'Activate'}</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => onToggleUserStatus(u.id, 'suspended', u.fullName || u.email)}
                                    className="btn btn-outline"
                                    style={{
                                      padding: '0.45rem 0.85rem',
                                      backgroundColor: '#fef2f2',
                                      borderColor: '#fecaca',
                                      color: '#dc2626',
                                      fontSize: '0.8rem',
                                      fontWeight: 700,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.35rem',
                                    }}
                                  >
                                    <UserX size={14} />
                                    <span>{isBn ? 'স্থগিত করুন' : 'Suspend'}</span>
                                  </button>
                                )}

                                {currentUser?.role === UserRole.MASTER_ADMIN && (
                                  <button
                                    type="button"
                                    onClick={() => setGuardModalUser(u)}
                                    className="btn btn-outline"
                                    style={{
                                      padding: '0.45rem 0.75rem',
                                      color: '#dc2626',
                                      borderColor: u.hasPlatformData ? '#fecdd3' : '#fecaca',
                                      backgroundColor: u.hasPlatformData ? '#fff1f2' : '#ffffff',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.3rem',
                                      fontSize: '0.78rem',
                                      fontWeight: 700,
                                    }}
                                    title={
                                      u.hasPlatformData
                                        ? (isBn ? 'প্ল্যাটফর্ম অডিট রেকর্ড সংরক্ষিত (ডিলিট যাচাই ও সততা নীতি)' : 'Platform Records Preserved (Integrity Check)')
                                        : (isBn ? 'খালি অ্যাকাউন্ট ডিলিট করুন' : 'Delete Empty Account')
                                    }
                                  >
                                    {u.hasPlatformData ? <Lock size={13} /> : <Trash2 size={13} />}
                                    <span>{u.hasPlatformData ? (isBn ? 'লকড' : 'Locked') : (isBn ? 'ডিলিট' : 'Delete')}</span>
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Platform Integrity & Deletion Governance Modal */}
            <UserDeletionGuardModal
              isOpen={!!guardModalUser}
              user={guardModalUser}
              onClose={() => setGuardModalUser(null)}
              onDeleted={() => {
                setGuardModalUser(null);
                if (loadAdminData) loadAdminData(true);
              }}
              isBn={isBn}
            />
          </div>
  );
}
