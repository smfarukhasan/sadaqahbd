'use client';

import React, { useState } from 'react';
import { Building2, Search, Users, UserCheck, Eye } from 'lucide-react';
import styles from '../../admin.module.css';

interface AllOrganizationsTabProps {
  isBn: boolean;
  orgRequestsHistory: any[];
  orgVerificationRequests: any[];
  allUsers: any[];
  getOrganizationTypeLabel: (type: string, isBn: boolean) => string;
  setSelectedOrgMembersId: (id: string | null) => void;
  setSelectedOrgMembersName: (name: string) => void;
  openAssignOrgModal: (orgId: string, orgName: string) => void;
  setAdminInspectionUserId: (id: string | null) => void;
}

export function AllOrganizationsTab({
  isBn,
  orgRequestsHistory,
  orgVerificationRequests,
  allUsers,
  getOrganizationTypeLabel,
  setSelectedOrgMembersId,
  setSelectedOrgMembersName,
  openAssignOrgModal,
  setAdminInspectionUserId,
}: AllOrganizationsTabProps) {
  const [orgDirectorySearch, setOrgDirectorySearch] = useState<string>('');
  const [orgDirectoryStatusFilter, setOrgDirectoryStatusFilter] = useState<string>('all');

  const map = new Map<string, any>();
  orgRequestsHistory.forEach((o) => map.set(o.id, o));
  orgVerificationRequests.forEach((o) => map.set(o.id, o));
  const allOrgs = Array.from(map.values());
  const count = map.size;

  const filtered = allOrgs.filter((org) => {
    const matchStatus = orgDirectoryStatusFilter === 'all' || org.status === orgDirectoryStatusFilter;
    const term = orgDirectorySearch.trim().toLowerCase();
    const matchSearch =
      !term ||
      (org.name && org.name.toLowerCase().includes(term)) ||
      (org.regNo && org.regNo.toLowerCase().includes(term)) ||
      (org.registrationNumber && org.registrationNumber.toLowerCase().includes(term)) ||
      (org.email && org.email.toLowerCase().includes(term)) ||
      (org.phone && org.phone.toLowerCase().includes(term)) ||
      (org.contact && org.contact.toLowerCase().includes(term)) ||
      (org.address && org.address.toLowerCase().includes(term));
    return matchStatus && matchSearch;
  });

  return (
    <div>
      <div className={styles.contentHeader}>
        <div>
          <h1 className={styles.pageTitle}>
            <Building2 size={26} color="var(--color-primary)" />
            {isBn ? 'সকল প্রতিষ্ঠান ডিরেক্টরি' : 'All Organizations Directory'}
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            {isBn
              ? 'প্ল্যাটফর্মের নিবন্ধিত সকল শিক্ষা প্রতিষ্ঠান, মাদ্রাসা ও এতিমখানার সার্বিক তালিকা ও সদস্য ব্যবস্থাপনা।'
              : 'Universal directory of all registered educational institutions, madrasas, and orphanages.'}
          </p>
        </div>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
          {isBn ? `মোট প্রতিষ্ঠান: ${count} টি` : `Total Organizations: ${count}`}
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
              isBn
                ? 'প্রতিষ্ঠানের নাম, কোড, ঠিকানা, ইমেইল বা ফোন দিয়ে খুঁজুন...'
                : 'Search by org name, reg code, address, email, phone...'
            }
            value={orgDirectorySearch}
            onChange={(e) => setOrgDirectorySearch(e.target.value)}
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
          value={orgDirectoryStatusFilter}
          onChange={(e) => setOrgDirectoryStatusFilter(e.target.value)}
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
          <option value="pending">{isBn ? 'পেন্ডিং (Pending)' : 'Pending'}</option>
          <option value="rejected">{isBn ? 'বাতিল (Rejected)' : 'Rejected'}</option>
        </select>
      </div>

      {/* Organizations Table Card */}
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
            {isBn ? 'কোনো প্রতিষ্ঠান পাওয়া যায়নি।' : 'No organizations match your search.'}
          </div>
        ) : (
          <>
            <div className={styles.desktopTableOnly}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--color-border, #e2e8f0)', color: 'var(--color-text-muted)' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>{isBn ? 'প্রতিষ্ঠানের নাম' : 'Institution'}</th>
                      <th style={{ padding: '0.75rem 1rem' }}>{isBn ? 'ধরন ও নিবন্ধন কোড' : 'Type & Reg No'}</th>
                      <th style={{ padding: '0.75rem 1rem' }}>{isBn ? 'যোগাযোগ ও ঠিকানা' : 'Contact & Address'}</th>
                      <th style={{ padding: '0.75rem 1rem' }}>{isBn ? 'স্ট্যাটাস' : 'Status'}</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>{isBn ? 'অ্যাকশন' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((org) => {
                      const orgUser = allUsers.find((u) => u.organizationId === org.id || u.email === org.email);
                      return (
                        <tr key={org.id} style={{ borderBottom: '1px solid var(--color-border, #e2e8f0)' }}>
                          <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                              <Building2 size={16} color="var(--color-primary)" />
                              <span>{org.name}</span>
                            </div>
                            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>ID: {org.id.slice(0, 8)}</span>
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <span
                              style={{
                                padding: '0.2rem 0.6rem',
                                borderRadius: '20px',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                                color: '#2563eb',
                              }}
                            >
                              {getOrganizationTypeLabel(org.type, isBn)}
                            </span>
                            {(org.regNo || org.registrationNumber) && (
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                {isBn ? 'নিবন্ধন:' : 'Reg:'} {org.regNo || org.registrationNumber}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <div style={{ color: 'var(--text-main)' }}>{org.contact || org.email}</div>
                            <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{org.phone || org.address || '—'}</div>
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <span
                              style={{
                                padding: '0.2rem 0.55rem',
                                borderRadius: '20px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                backgroundColor:
                                  org.status === 'active'
                                    ? 'rgba(34, 197, 94, 0.12)'
                                    : org.status === 'rejected'
                                    ? 'rgba(239, 68, 68, 0.12)'
                                    : 'rgba(234, 179, 8, 0.12)',
                                color:
                                  org.status === 'active'
                                    ? '#16a34a'
                                    : org.status === 'rejected'
                                    ? '#dc2626'
                                    : '#ca8a04',
                                border: `1px solid ${
                                  org.status === 'active'
                                    ? '#86efac'
                                    : org.status === 'rejected'
                                    ? '#fca5a5'
                                    : '#fde047'
                                }`,
                              }}
                            >
                              {org.status === 'active'
                                ? isBn ? 'সক্রিয়' : 'Active'
                                : org.status === 'rejected'
                                ? isBn ? 'বাতিল' : 'Rejected'
                                : isBn ? 'পেন্ডিং' : 'Pending'}
                            </span>
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedOrgMembersId(org.id);
                                  setSelectedOrgMembersName(org.name);
                                }}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  padding: '0.35rem 0.75rem',
                                  backgroundColor: '#f0fdf4',
                                  border: '1px solid #bbf7d0',
                                  color: '#15803d',
                                  borderRadius: '8px',
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                                title={isBn ? 'প্রতিষ্ঠানের শিক্ষক ও শিক্ষার্থী তালিকা দেখুন' : 'View Members'}
                              >
                                <Users size={14} />
                                <span>{isBn ? 'সদস্য তালিকা' : 'Members'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => openAssignOrgModal(org.id, org.name)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  padding: '0.35rem 0.75rem',
                                  backgroundColor: '#fffbeb',
                                  border: '1px solid #fde68a',
                                  color: '#b45309',
                                  borderRadius: '8px',
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                                title={isBn ? 'প্রতিষ্ঠানের ইউজার একাউন্ট অর্পণ বা পরিবর্তন করুন' : 'Assign Authority User'}
                              >
                                <UserCheck size={14} />
                                <span>{isBn ? 'ইউজার এসাইন' : 'Assign User'}</span>
                              </button>

                              {orgUser && (
                                <button
                                  type="button"
                                  onClick={() => setAdminInspectionUserId(orgUser.id)}
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
                                  title={isBn ? 'অ্যাকাউন্ট ইনস্পেকশন' : 'Inspect Account'}
                                >
                                  <Eye size={14} />
                                  <span>{isBn ? 'ইনস্পেকশন' : 'Inspect'}</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className={styles.mobileCardsOnly}>
              {filtered.map((org) => {
                const orgUser = allUsers.find((u) => u.organizationId === org.id || u.email === org.email);
                return (
                  <div
                    key={org.id}
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
                        <h4 style={{ margin: 0, fontWeight: 700, color: 'var(--text-main)' }}>{org.name}</h4>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>ID: {org.id.slice(0, 8)}</span>
                      </div>
                      <span
                        style={{
                          padding: '0.15rem 0.5rem',
                          borderRadius: '20px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          backgroundColor:
                            org.status === 'active'
                              ? 'rgba(34, 197, 94, 0.12)'
                              : org.status === 'rejected'
                              ? 'rgba(239, 68, 68, 0.12)'
                              : 'rgba(234, 179, 8, 0.12)',
                          color:
                            org.status === 'active'
                              ? '#16a34a'
                              : org.status === 'rejected'
                              ? '#dc2626'
                              : '#ca8a04',
                        }}
                      >
                        {org.status === 'active'
                          ? isBn ? 'সক্রিয়' : 'Active'
                          : org.status === 'rejected'
                          ? isBn ? 'বাতিল' : 'Rejected'
                          : isBn ? 'পেন্ডিং' : 'Pending'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      <div>{getOrganizationTypeLabel(org.type, isBn)}</div>
                      <div>{org.contact || org.email}</div>
                      <div>{org.phone || org.address || '—'}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedOrgMembersId(org.id);
                          setSelectedOrgMembersName(org.name);
                        }}
                        style={{
                          padding: '0.35rem 0.65rem',
                          backgroundColor: '#f0fdf4',
                          border: '1px solid #bbf7d0',
                          color: '#15803d',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        <Users size={13} /> {isBn ? 'সদস্য তালিকা' : 'Members'}
                      </button>
                      <button
                        type="button"
                        onClick={() => openAssignOrgModal(org.id, org.name)}
                        style={{
                          padding: '0.35rem 0.65rem',
                          backgroundColor: '#fffbeb',
                          border: '1px solid #fde68a',
                          color: '#b45309',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        <UserCheck size={13} /> {isBn ? 'ইউজার এসাইন' : 'Assign User'}
                      </button>
                      {orgUser && (
                        <button
                          type="button"
                          onClick={() => setAdminInspectionUserId(orgUser.id)}
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
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AllOrganizationsTab;
