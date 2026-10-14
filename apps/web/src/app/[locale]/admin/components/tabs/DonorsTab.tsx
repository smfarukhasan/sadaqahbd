'use client';

import React, { useState } from 'react';
import { Heart, Search, Phone, Mail, Eye } from 'lucide-react';
import { formatBengaliDate, formatBengaliAmount, formatBengaliNumber } from '@/lib/format-utils';
import styles from '../../admin.module.css';

interface DonorsTabProps {
  isBn: boolean;
  donorsList: any[];
  loadingData: boolean;
  setSelectedDonorDetailsId: (id: string | null) => void;
}

export function DonorsTab({
  isBn,
  donorsList,
  loadingData,
  setSelectedDonorDetailsId,
}: DonorsTabProps) {
  const [donorListSearch, setDonorListSearch] = useState<string>('');
  const [donorRoleFilter, setDonorRoleFilter] = useState<string>('all');

  const filteredDonors = donorsList.filter((d) => {
    if (donorRoleFilter !== 'all' && d.role !== donorRoleFilter) {
      return false;
    }
    if (!donorListSearch) return true;
    const q = donorListSearch.toLowerCase();
    return (
      (d.fullName && d.fullName.toLowerCase().includes(q)) ||
      (d.email && d.email.toLowerCase().includes(q)) ||
      (d.phone && d.phone.toLowerCase().includes(q))
    );
  });

  const getDonorRoleConfig = (role: string) => {
    switch (role) {
      case 'donor':
        return { label: isBn ? 'ডোনার' : 'Donor', bg: '#fce7f3', color: '#be185d', border: '#fbcfe8' };
      case 'teacher':
        return { label: isBn ? 'শিক্ষক' : 'Teacher', bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd' };
      case 'student':
        return { label: isBn ? 'শিক্ষার্থী' : 'Student', bg: '#fef3c7', color: '#b45309', border: '#fde68a' };
      case 'organization':
        return { label: isBn ? 'প্রতিষ্ঠান' : 'Organization', bg: '#f3e8ff', color: '#7e22ce', border: '#e9d5ff' };
      case 'super_admin':
        return { label: isBn ? 'সুপার এডমিন' : 'Super Admin', bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' };
      case 'admin':
        return { label: isBn ? 'এডমিন' : 'Admin', bg: '#e0e7ff', color: '#4338ca', border: '#c7d2fe' };
      case 'master_admin':
        return { label: isBn ? 'মাস্টার এডমিন' : 'Master Admin', bg: '#fee2e2', color: '#b91c1c', border: '#fecaca' };
      default:
        return { label: role || (isBn ? 'ইউজার' : 'User'), bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' };
    }
  };

  return (
    <div>
      <div className={styles.contentHeader}>
        <div>
          <h1 className={styles.pageTitle}>
            <Heart size={26} color="#ec4899" />
            {isBn ? 'সম্মানিত ডোনার ও অনুদান হিস্টোরি তালিকা' : 'Donors & Donations Directory'} ({donorsList.length})
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            {isBn
              ? 'প্ল্যাটফর্মের সকল অনুদানকারী (ইউজার/শিক্ষক/শিক্ষার্থী/প্রতিষ্ঠান/এডমিন), মোট আর্থিক অবদান ও বিস্তারিত লেনদেন হিস্ট্রি।'
              : 'All contributing users across all roles, total monetary contributions, and transaction ledger.'}
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'center',
          marginBottom: '1rem',
          backgroundColor: 'var(--surface, #ffffff)',
          padding: '0.75rem 1rem',
          borderRadius: '12px',
          border: '1px solid var(--color-border)',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
        }}
      >
        {/* Search input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '240px' }}>
          <Search size={18} color="var(--color-text-muted)" />
          <input
            type="text"
            placeholder={isBn ? 'নাম, ফোন নম্বর অথবা ইমেইল দিয়ে দাতা খুঁজুন...' : 'Search donors by name, phone, or email...'}
            value={donorListSearch}
            onChange={(e) => setDonorListSearch(e.target.value)}
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              fontSize: '0.9rem',
              backgroundColor: 'transparent',
              color: 'var(--text-main, #0f172a)',
            }}
          />
          {donorListSearch && (
            <button
              type="button"
              onClick={() => setDonorListSearch('')}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.8rem',
                color: 'var(--text-muted, #64748b)',
              }}
            >
              {isBn ? 'মুছুন' : 'Clear'}
            </button>
          )}
        </div>

        {/* Role Filter Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginRight: '0.25rem' }}>
            {isBn ? 'রোল ফিল্টার:' : 'Filter Role:'}
          </span>
          {[
            { key: 'all', label: isBn ? 'সকল' : 'All' },
            { key: 'donor', label: isBn ? 'ডোনার' : 'Donor' },
            { key: 'teacher', label: isBn ? 'শিক্ষক' : 'Teacher' },
            { key: 'student', label: isBn ? 'শিক্ষার্থী' : 'Student' },
            { key: 'organization', label: isBn ? 'প্রতিষ্ঠান' : 'Org' },
            { key: 'super_admin', label: isBn ? 'সুপার এডমিন' : 'Super Admin' },
            { key: 'admin', label: isBn ? 'এডমিন' : 'Admin' },
          ].map((rf) => (
            <button
              key={rf.key}
              type="button"
              onClick={() => setDonorRoleFilter(rf.key)}
              style={{
                padding: '0.3rem 0.65rem',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                border: '1px solid',
                backgroundColor: donorRoleFilter === rf.key ? 'var(--primary, #059669)' : 'transparent',
                color: donorRoleFilter === rf.key ? '#ffffff' : 'var(--text-muted, #64748b)',
                borderColor: donorRoleFilter === rf.key ? 'var(--primary, #059669)' : 'var(--color-border)',
                transition: 'all 0.15s ease',
              }}
            >
              {rf.label}
            </button>
          ))}
        </div>
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
        {loadingData ? (
          <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>
            {isBn ? 'ডাটা লোড হচ্ছে...' : 'Loading data...'}
          </p>
        ) : donorsList.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>
            {isBn ? 'কোনো অনুদানকারী ব্যবহারকারী পাওয়া যায়নি।' : 'No donor users found with recorded contributions.'}
          </p>
        ) : filteredDonors.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>
            {isBn ? 'ফিল্টার ও অনুসন্ধানের সাথে কোনো দাতা মেলেনি।' : 'No donors matched your search and filter criteria.'}
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{isBn ? 'দাতা ও রোল' : 'Donor & Role'}</th>
                  <th style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{isBn ? 'যোগাযোগ' : 'Contact'}</th>
                  <th style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{isBn ? 'মোট অনুদান' : 'Total Contributed'}</th>
                  <th style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{isBn ? 'সর্বশেষ অনুদান' : 'Last Donation'}</th>
                  <th style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{isBn ? 'স্ট্যাটাস' : 'Status'}</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', color: 'var(--text-muted)' }}>{isBn ? 'অ্যাকশন' : 'Action'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredDonors.map((donor) => {
                  const roleBadge = getDonorRoleConfig(donor.role);
                  return (
                    <tr key={donor.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          {donor.avatarUrl ? (
                            <img
                              src={donor.avatarUrl}
                              alt={donor.fullName || 'Donor'}
                              style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: '2px solid rgba(236, 72, 153, 0.3)',
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '50%',
                                backgroundColor: 'rgba(236, 72, 153, 0.12)',
                                color: '#db2777',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '0.95rem',
                                flexShrink: 0,
                              }}
                            >
                              {donor.fullName ? donor.fullName[0].toUpperCase() : 'D'}
                            </div>
                          )}
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
                                {donor.fullName || (isBn ? 'অজ্ঞাত দাতা' : 'Anonymous')}
                              </span>
                              <span
                                style={{
                                  padding: '0.12rem 0.45rem',
                                  borderRadius: '4px',
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  backgroundColor: roleBadge.bg,
                                  color: roleBadge.color,
                                  border: `1px solid ${roleBadge.border}`,
                                }}
                              >
                                {roleBadge.label}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                              ID: <code>{donor.id.slice(0, 8)}</code>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.85rem' }}>
                          {donor.phone ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600, color: 'var(--text-main, #0f172a)' }}>
                              <Phone size={13} color="#059669" />
                              <span>{donor.phone}</span>
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{isBn ? 'ফোন নম্বর নেই' : 'No phone'}</span>
                          )}
                          {donor.email && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)' }}>
                              <Mail size={13} color="#64748b" />
                              <span>{donor.email}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ fontWeight: 800, color: '#059669', fontSize: '1rem' }}>
                          {formatBengaliAmount(donor.totalDonatedAmount, isBn)}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {formatBengaliNumber(donor.totalDonationsCount, isBn)} {isBn ? 'টি লেনদেন' : 'contributions'}
                          {donor.pendingDonationsCount > 0 && (
                            <span style={{ color: '#d97706', marginLeft: '0.25rem' }}>
                              ({formatBengaliNumber(donor.pendingDonationsCount, isBn)} {isBn ? 'অপেক্ষমাণ' : 'pending'})
                            </span>
                          )}
                        </div>
                      </td>

                      <td style={{ padding: '0.75rem', fontSize: '0.82rem', color: 'var(--text-main, #0f172a)', fontWeight: 700 }}>
                        {donor.lastDonatedAt ? formatBengaliDate(donor.lastDonatedAt, isBn) : '—'}
                      </td>

                      <td style={{ padding: '0.75rem' }}>
                        <span
                          style={{
                            padding: '0.2rem 0.6rem',
                            borderRadius: '9999px',
                            backgroundColor: donor.status === 'active' ? '#ecfdf5' : '#fef2f2',
                            color: donor.status === 'active' ? '#047857' : '#b91c1c',
                            border: `1px solid ${donor.status === 'active' ? '#a7f3d0' : '#fecaca'}`,
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                          }}
                        >
                          {donor.status === 'active' ? '✓ ' + (isBn ? 'সক্রিয়' : 'Active') : '✕ ' + (isBn ? 'স্থগিত' : 'Suspended')}
                        </span>
                      </td>

                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn btn-outline"
                          style={{
                            padding: '0.4rem 0.85rem',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            backgroundColor: 'rgba(236, 72, 153, 0.08)',
                            borderColor: 'rgba(236, 72, 153, 0.3)',
                            color: '#db2777',
                          }}
                          onClick={() => setSelectedDonorDetailsId(donor.id)}
                          title={isBn ? 'ইউজারের বিস্তারিত প্রোফাইল ও সকল লেনদেন হিসাব পর্যালোচনা করুন' : 'View full donor profile & itemized transactions'}
                        >
                          <Eye size={15} />
                          <span>{isBn ? 'বিস্তারিত হিসাব' : 'View Ledger'}</span>
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
    </div>
  );
}

export default DonorsTab;
