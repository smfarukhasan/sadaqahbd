'use client';

import React from 'react';
import { Users, Plus, Edit, Trash2 } from 'lucide-react';
import { UserRole } from '@sadaqahbd/schema';
import styles from '../../admin.module.css';

interface SuperAdminsTabProps {
  superAdmins: any[];
  loadingData: boolean;
  isBn: boolean;
  t: (key: string) => string;
  user: any;
  canEdit: boolean;
  onOpenAddAdmin: () => void;
  onOpenEditPermissions: (admin: any) => void;
  onDeleteAdmin: (id: string, name: string) => void;
}

export default function SuperAdminsTab({
  superAdmins,
  loadingData,
  isBn,
  t,
  user,
  canEdit,
  onOpenAddAdmin,
  onOpenEditPermissions,
  onDeleteAdmin,
}: SuperAdminsTabProps) {
  return (
    <div>
      <div className={styles.contentHeader}>
        <div>
          <h1 className={styles.pageTitle}>
            <Users size={26} color="var(--color-primary)" />
            {t('superAdminList')}
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            {isBn
              ? 'সিস্টেমের সক্রিয় সুপার এডমিন কর্মকর্তা এবং তাদের অনুমতি পরিচালনা।'
              : 'Manage active super admins and their system permissions.'}
          </p>
        </div>
        {(user?.role === UserRole.MASTER_ADMIN || canEdit) && (
          <button
            type="button"
            className="btn btn-primary"
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
            onClick={onOpenAddAdmin}
          >
            <Plus size={16} /> {isBn ? 'নতুন এডমিন যোগ করুন' : 'Add Admin'}
          </button>
        )}
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
          <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
            {isBn ? 'ডাটা লোড হচ্ছে...' : 'Loading data...'}
          </p>
        ) : superAdmins.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
            {isBn ? 'কোনো সুপার এডমিন পাওয়া যায়নি।' : 'No super admins found.'}
          </p>
        ) : (
          <>
            {/* Desktop Data Table (>= 768px) */}
            <div className={styles.desktopTableOnly}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                      <th style={{ padding: '0.75rem' }}>{isBn ? 'নাম' : 'Name'}</th>
                      <th style={{ padding: '0.75rem' }}>{isBn ? 'ইমেইল' : 'Email'}</th>
                      <th style={{ padding: '0.75rem' }}>{isBn ? 'ফোন' : 'Phone'}</th>
                      <th style={{ padding: '0.75rem' }}>{isBn ? 'রোল' : 'Role'}</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right' }}>{isBn ? 'অ্যাকশন' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {superAdmins.map((admin) => (
                      <tr key={admin.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '0.75rem', fontWeight: '600' }}>{admin.fullName || admin.name}</td>
                        <td style={{ padding: '0.75rem' }}>{admin.email}</td>
                        <td style={{ padding: '0.75rem' }}>{admin.phone || '—'}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <span
                            style={{
                              padding: '0.15rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              backgroundColor:
                                admin.role === 'super_admin' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                              color: admin.role === 'super_admin' ? '#7c3aed' : '#2563eb',
                            }}
                          >
                            {admin.role === 'super_admin'
                              ? isBn
                                ? 'সুপার এডমিন'
                                : 'Super Admin'
                              : isBn
                              ? 'এডমিন'
                              : 'Admin'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          {user?.role === UserRole.MASTER_ADMIN && (
                            <button
                              type="button"
                              className="btn btn-outline"
                              style={{
                                padding: '0.3rem 0.6rem',
                                fontSize: '0.8rem',
                                marginRight: '0.5rem',
                                color: 'var(--color-primary)',
                                borderColor: 'var(--color-primary)',
                              }}
                              onClick={() => onOpenEditPermissions(admin)}
                              title={isBn ? 'পারমিশন এডিট' : 'Edit Permissions'}
                            >
                              <Edit size={14} /> {isBn ? 'পারমিশন' : 'Edit'}
                            </button>
                          )}
                          {user?.role === UserRole.MASTER_ADMIN && (
                            <button
                              type="button"
                              className="btn btn-outline"
                              style={{
                                padding: '0.3rem 0.5rem',
                                color: 'var(--color-accent, #ef4444)',
                                borderColor: 'var(--color-accent, #ef4444)',
                              }}
                              onClick={() => onDeleteAdmin(admin.id, admin.fullName || admin.name)}
                              title={isBn ? 'এডমিন মুছুন' : 'Delete Admin'}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Touch Cards (< 768px) */}
            <div className={styles.mobileCardOnly}>
              {superAdmins.map((admin) => (
                <div key={admin.id} className={styles.mobileCard}>
                  <div className={styles.mobileCardHeader}>
                    <div>
                      <div className={styles.mobileCardTitle}>{admin.fullName || admin.name}</div>
                      <div className={styles.mobileCardSubtitle}>{admin.email}</div>
                    </div>
                    <span
                      style={{
                        padding: '0.2rem 0.55rem',
                        borderRadius: '20px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        backgroundColor:
                          admin.role === 'super_admin' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                        color: admin.role === 'super_admin' ? '#7c3aed' : '#2563eb',
                      }}
                    >
                      {admin.role === 'super_admin'
                        ? isBn
                          ? 'সুপার এডমিন'
                          : 'Super Admin'
                        : isBn
                        ? 'এডমিন'
                        : 'Admin'}
                    </span>
                  </div>

                  <div className={styles.mobileCardRow}>
                    <span style={{ color: 'var(--color-text-muted)' }}>{isBn ? 'ফোন:' : 'Phone:'}</span>
                    <span style={{ fontWeight: 600 }}>{admin.phone || '—'}</span>
                  </div>

                  {user?.role === UserRole.MASTER_ADMIN && (
                    <div className={styles.mobileCardActions}>
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{
                          padding: '0.45rem 0.85rem',
                          fontSize: '0.82rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          color: 'var(--color-primary)',
                          borderColor: 'var(--color-primary)',
                        }}
                        onClick={() => onOpenEditPermissions(admin)}
                      >
                        <Edit size={14} /> <span>{isBn ? 'পারমিশন এডিট' : 'Edit'}</span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{
                          padding: '0.45rem 0.75rem',
                          color: 'var(--color-accent, #ef4444)',
                          borderColor: 'var(--color-accent, #ef4444)',
                        }}
                        onClick={() => onDeleteAdmin(admin.id, admin.fullName || admin.name)}
                        title={isBn ? 'এডমিন মুছুন' : 'Delete'}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
