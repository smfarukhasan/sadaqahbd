'use client';

import React, { useState } from 'react';
import { Building2, Clock, History as HistoryIcon, UserCheck, Users, Eye, Search, CheckCircle2, XCircle } from 'lucide-react';
import styles from '../../admin.module.css';

interface OrgRequestsTabProps {
  isBn: boolean;
  loadingData: boolean;
  orgVerificationRequests: any[];
  orgRequestsHistory: any[];
  getOrganizationTypeLabel: (type: string, isBn: boolean) => string;
  setSelectedOrgMembersId: (id: string | null) => void;
  setSelectedOrgMembersName: (name: string) => void;
  handleOpenOrgReview: (org: any, isReadOnly?: boolean) => void;
}

export function OrgRequestsTab({
  isBn,
  loadingData,
  orgVerificationRequests,
  orgRequestsHistory,
  getOrganizationTypeLabel,
  setSelectedOrgMembersId,
  setSelectedOrgMembersName,
  handleOpenOrgReview,
}: OrgRequestsTabProps) {
  const [orgVerificationTab, setOrgVerificationTab] = useState<'pending' | 'history'>('pending');
  const [orgHistorySearch, setOrgHistorySearch] = useState<string>('');
  const [orgHistoryStatusFilter, setOrgHistoryStatusFilter] = useState<'all' | 'active' | 'rejected'>('all');

  return (
    <div>
      <div className={styles.contentHeader}>
        <div>
          <h1 className={styles.pageTitle}>
            <Building2 size={26} color="var(--color-primary)" />
            {isBn ? 'প্রতিষ্ঠান ছাড়পত্র ও অনুমোদন' : 'Institution Clearances & Governance'}
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            {isBn
              ? 'শিক্ষা প্রতিষ্ঠানসমূহের প্রাতিষ্ঠানিক ছাড়পত্র আবেদন, পর্যালোচনা ও নিষ্পত্তির পূর্বের ইতিহাস।'
              : 'Institutional verification requests, review drawer, and full historical records.'}
          </p>
        </div>
      </div>

      {/* Sub-tabs: Pending vs History */}
      <div className={styles.verificationTabs}>
        <button
          type="button"
          className={`${styles.verificationTabBtn} ${orgVerificationTab === 'pending' ? styles.verificationTabBtnActive : ''}`}
          onClick={() => setOrgVerificationTab('pending')}
        >
          <Clock size={16} />
          <span>{isBn ? 'পেন্ডিং আবেদন' : 'Pending Requests'}</span>
          <span className={styles.tabBadge}>{orgVerificationRequests.length}</span>
        </button>

        <button
          type="button"
          className={`${styles.verificationTabBtn} ${orgVerificationTab === 'history' ? styles.verificationTabBtnActive : ''}`}
          onClick={() => setOrgVerificationTab('history')}
        >
          <HistoryIcon size={16} />
          <span>{isBn ? 'অনুমোদন ও বাতিলের ইতিহাস' : 'Clearance History'}</span>
          <span className={styles.tabBadge}>{orgRequestsHistory.length}</span>
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
        {orgVerificationTab === 'pending' ? (
          <>
            {loadingData ? (
              <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>
                {isBn ? 'ডাটা লোড হচ্ছে...' : 'Loading data...'}
              </p>
            ) : orgVerificationRequests.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>
                {isBn ? 'কোনো প্রতিষ্ঠান ছাড়পত্র রিকোয়েস্ট পেন্ডিং নেই।' : 'No pending institution clearance requests.'}
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {orgVerificationRequests.map((org) => (
                  <div
                    key={org.id}
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                        <h4 style={{ fontWeight: '700', fontSize: '1.05rem', margin: 0, color: 'var(--text-main, #0f172a)' }}>
                          {org.name}
                        </h4>
                        {org.isRequestedByMember && (
                          <span
                            style={{
                              padding: '0.2rem 0.55rem',
                              backgroundColor: '#fffbeb',
                              border: '1px solid #fde68a',
                              color: '#b45309',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                            }}
                          >
                            <UserCheck size={12} />
                            {isBn ? 'সদস্য প্রস্তাবিত (ইউজার অর্পণ আবশ্যক)' : 'Member Proposed (Assign Required)'}
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: 0 }}>
                        {isBn ? 'রেজিস্ট্রেশন কোড:' : 'Reg Code:'} <strong>{org.regNo}</strong> | {isBn ? 'প্রতিনিধি:' : 'Contact:'} {org.contact} ({org.phone || (isBn ? 'ফোন নেই' : 'No phone')})
                      </p>
                      {org.address && (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted, #64748b)', marginTop: '0.2rem', marginBottom: 0 }}>
                          {isBn ? 'ঠিকানা:' : 'Address:'} {org.address}
                        </p>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className={styles.orgMembersBtn}
                        onClick={() => {
                          setSelectedOrgMembersId(org.id);
                          setSelectedOrgMembersName(org.name);
                        }}
                      >
                        <Users size={15} /> {isBn ? 'শিক্ষক ও শিক্ষার্থী' : 'Teachers & Students'}
                      </button>

                      <button
                        className="btn btn-primary"
                        style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
                        onClick={() => handleOpenOrgReview(org)}
                      >
                        <Eye size={16} /> {isBn ? 'ড্রয়ারে যাচাই করুন' : 'Review in Drawer'}
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
                  placeholder={isBn ? 'প্রতিষ্ঠান নাম, কোড বা যোগাযোগ দিয়ে খুঁজুন...' : 'Search by name, code, contact...'}
                  value={orgHistorySearch}
                  onChange={(e) => setOrgHistorySearch(e.target.value)}
                />
              </div>

              <select
                className={styles.historyFilterSelect}
                value={orgHistoryStatusFilter}
                onChange={(e) => setOrgHistoryStatusFilter(e.target.value as any)}
              >
                <option value="all">{isBn ? 'সকল স্ট্যাটাস (All)' : 'All Statuses'}</option>
                <option value="active">{isBn ? 'অনুমোদিত ও সক্রিয়' : 'Approved'}</option>
                <option value="rejected">{isBn ? 'আবেদন বাতিলকৃত' : 'Rejected'}</option>
              </select>
            </div>

            {(() => {
              const term = orgHistorySearch.toLowerCase().trim();
              const filtered = orgRequestsHistory.filter((org) => {
                const matchStatus =
                  orgHistoryStatusFilter === 'all' || org.status === orgHistoryStatusFilter;
                const matchSearch =
                  !term ||
                  (org.name && org.name.toLowerCase().includes(term)) ||
                  (org.regNo && org.regNo.toLowerCase().includes(term)) ||
                  (org.contact && org.contact.toLowerCase().includes(term)) ||
                  (org.phone && org.phone.includes(term)) ||
                  (org.email && org.email.toLowerCase().includes(term));
                return matchStatus && matchSearch;
              });

              if (filtered.length === 0) {
                return (
                  <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2.5rem' }}>
                    {isBn ? 'কোনো পূর্বের রেকর্ড পাওয়া যায়নি।' : 'No historical organization records found.'}
                  </p>
                );
              }

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {filtered.map((org) => {
                    const isApproved = org.status === 'active';
                    return (
                      <div key={org.id} className={styles.historyCard}>
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
                              <h4 style={{ fontWeight: 800, fontSize: '1.1rem', margin: 0, color: 'var(--text-main, #0f172a)' }}>
                                {org.name}
                              </h4>
                              {org.type && (
                                <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', backgroundColor: '#f1f5f9', color: '#475569', borderRadius: '6px', fontWeight: 600 }}>
                                  {getOrganizationTypeLabel(org.type, isBn)}
                                </span>
                              )}
                              {org.isRequestedByMember && (
                                <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', backgroundColor: '#fef3c7', color: '#92400e', borderRadius: '6px', fontWeight: 700 }}>
                                  {isBn ? 'সদস্য প্রস্তাবিত' : 'Member Suggested'}
                                </span>
                              )}
                            </div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.35rem', marginBottom: 0 }}>
                              {isBn ? 'রেজিস্ট্রেশন কোড:' : 'Reg Code:'} <strong>{org.regNo || (isBn ? 'নেই' : 'None')}</strong> | {isBn ? 'প্রতিনিধি:' : 'Contact:'} {org.contact} ({org.phone || (isBn ? 'ফোন নেই' : 'No phone')})
                              {org.email && ` | ${isBn ? 'ইমেইল:' : 'Email:'} ${org.email}`}
                            </p>
                            {org.address && (
                              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted, #64748b)', margin: '0.25rem 0 0' }}>
                                {isBn ? 'ঠিকানা:' : 'Address:'} {org.address}
                              </p>
                            )}
                            {org.description && (
                              <p style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic', margin: '0.25rem 0 0' }}>
                                &ldquo;{org.description}&rdquo;
                              </p>
                            )}
                          </div>

                          <div>
                            {isApproved ? (
                              <span className={styles.historyBadgeApproved}>
                                <CheckCircle2 size={13} /> {isBn ? 'অনুমোদিত ও সক্রিয়' : 'Approved & Active'}
                              </span>
                            ) : (
                              <span className={styles.historyBadgeRejected}>
                                <XCircle size={13} /> {isBn ? 'আবেদন বাতিলকৃত' : 'Rejected'}
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
                            flexWrap: 'wrap',
                            gap: '0.75rem',
                            fontSize: '0.8rem',
                            color: 'var(--text-muted, #64748b)',
                          }}
                        >
                          <div>
                            <span>{isBn ? 'নিষ্পত্তির তারিখ:' : 'Verified on:'} </span>
                            <strong>
                              {org.verifiedAt
                                ? new Date(org.verifiedAt).toLocaleString(isBn ? 'bn-BD' : 'en-US')
                                : org.updatedAt
                                ? new Date(org.updatedAt).toLocaleString(isBn ? 'bn-BD' : 'en-US')
                                : '—'}
                            </strong>
                            {org.verifierName && (
                              <span style={{ marginLeft: '0.5rem' }}>
                                | {isBn ? 'যাচাইকারী:' : 'Verified by:'} <strong>{org.verifierName}</strong>
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              className={styles.orgMembersBtn}
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                              onClick={() => {
                                setSelectedOrgMembersId(org.id);
                                setSelectedOrgMembersName(org.name);
                              }}
                            >
                              <Users size={14} /> {isBn ? 'শিক্ষক ও শিক্ষার্থী' : 'Teachers & Students'}
                            </button>

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
                              onClick={() => handleOpenOrgReview(org, true)}
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

export default OrgRequestsTab;
