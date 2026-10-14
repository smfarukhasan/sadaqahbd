'use client';

import React from 'react';
import {
  Building2,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Edit,
  AlertTriangle,
  SlidersHorizontal,
  User,
  UserCheck,
  Check,
  X,
} from 'lucide-react';
import { getOrganizationTypeLabel } from '@sadaqahbd/schema';
import ModularAccessSelector, { ALL_MODULES } from './ModularAccessSelector';
import styles from '../admin.module.css';

export interface ActionDrawerState {
  isOpen: boolean;
  type:
    | 'org_review'
    | 'post_review'
    | 'donation_review'
    | 'item_donation_review'
    | 'add_super_admin'
    | 'edit_permissions'
    | 'affiliation_review'
    | 'transfer_review';
  itemData: any;
  reason: string;
  isReadOnly?: boolean;
}

export interface AdminActionDrawerProps {
  actionDrawer: ActionDrawerState;
  setActionDrawer: React.Dispatch<React.SetStateAction<ActionDrawerState>>;
  actionLoading: boolean;
  isBn: boolean;
  handleExecuteAction: (actionType: 'approve' | 'reject') => Promise<void>;

  // Org review props
  orgEditName: string;
  setOrgEditName: (v: string) => void;
  orgEditType: string;
  setOrgEditType: (v: string) => void;
  orgEditRegNo: string;
  setOrgEditRegNo: (v: string) => void;
  orgEditContact: string;
  setOrgEditContact: (v: string) => void;
  orgEditPhone: string;
  setOrgEditPhone: (v: string) => void;
  orgEditEmail: string;
  setOrgEditEmail: (v: string) => void;
  orgEditAddress: string;
  setOrgEditAddress: (v: string) => void;
  orgEditDesc: string;
  setOrgEditDesc: (v: string) => void;
  drawerLoadingUsers: boolean;
  drawerUnassignedUsers: any[];
  drawerSelectedUserId: string;
  setDrawerSelectedUserId: (v: string) => void;

  // Post review props
  isEditingExpenses: boolean;
  setIsEditingExpenses: React.Dispatch<React.SetStateAction<boolean>>;
  editedExpenses: { category: string; amount: number }[];
  setEditedExpenses: React.Dispatch<React.SetStateAction<{ category: string; amount: number }[]>>;
  expenseModificationReason: string;
  setExpenseModificationReason: (v: string) => void;

  // Item donation props
  itemAdminInstruction: string;
  setItemAdminInstruction: (v: string) => void;

  // Edit permissions props
  editingAdmin: any;
  editAdminRole: 'super_admin' | 'admin';
  setEditAdminRole: (r: 'super_admin' | 'admin') => void;
  editAdminPermissions: string[];
  setEditAdminPermissions: React.Dispatch<React.SetStateAction<string[]>>;
  handleSaveAdminPermissions: (e?: React.FormEvent | React.MouseEvent) => Promise<void>;
  isUpdatingPermissions: boolean;

  // Add super admin props
  newAdminRole: 'super_admin' | 'admin';
  setNewAdminRole: (r: 'super_admin' | 'admin') => void;
  newAdminName: string;
  setNewAdminName: (v: string) => void;
  newAdminEmail: string;
  setNewAdminEmail: (v: string) => void;
  newAdminPhone: string;
  setNewAdminPhone: (v: string) => void;
  selectedPermissions: string[];
  setSelectedPermissions: React.Dispatch<React.SetStateAction<string[]>>;
  handleCreateSuperAdmin: (e: React.FormEvent) => Promise<void>;
}

export function AdminActionDrawer({
  actionDrawer,
  setActionDrawer,
  actionLoading,
  isBn,
  handleExecuteAction,

  orgEditName,
  setOrgEditName,
  orgEditType,
  setOrgEditType,
  orgEditRegNo,
  setOrgEditRegNo,
  orgEditContact,
  setOrgEditContact,
  orgEditPhone,
  setOrgEditPhone,
  orgEditEmail,
  setOrgEditEmail,
  orgEditAddress,
  setOrgEditAddress,
  orgEditDesc,
  setOrgEditDesc,
  drawerLoadingUsers,
  drawerUnassignedUsers,
  drawerSelectedUserId,
  setDrawerSelectedUserId,

  isEditingExpenses,
  setIsEditingExpenses,
  editedExpenses,
  setEditedExpenses,
  expenseModificationReason,
  setExpenseModificationReason,

  itemAdminInstruction,
  setItemAdminInstruction,

  editingAdmin,
  editAdminRole,
  setEditAdminRole,
  editAdminPermissions,
  setEditAdminPermissions,
  handleSaveAdminPermissions,
  isUpdatingPermissions,

  newAdminRole,
  setNewAdminRole,
  newAdminName,
  setNewAdminName,
  newAdminEmail,
  setNewAdminEmail,
  newAdminPhone,
  setNewAdminPhone,
  selectedPermissions,
  setSelectedPermissions,
  handleCreateSuperAdmin,
}: AdminActionDrawerProps) {
  return (
    <>
      {/* ====================================================================
          Action / Inspection Slide-Over Drawer (Right / Bottom Drawer)
          ==================================================================== */}
      <div
        className={`${styles.actionDrawerBackdrop} ${
          actionDrawer.isOpen ? styles.actionDrawerBackdropOpen : ''
        }`}
        onClick={() => setActionDrawer((prev) => ({ ...prev, isOpen: false }))}
      />

      <div className={`${styles.actionDrawer} ${actionDrawer.isOpen ? styles.actionDrawerOpen : ''}`}>
        <div className={styles.actionDrawerHeader}>
          <h3 className={styles.actionDrawerTitle}>
            <SlidersHorizontal size={18} color="var(--color-primary)" />
            {actionDrawer.type === 'org_review' && (isBn ? 'প্রতিষ্ঠান ছাড়পত্র আবেদন পর্যালোচনা' : 'Institution Clearance Review')}
            {actionDrawer.type === 'post_review' && (isBn ? 'শিক্ষার্থী আবেদনপত্র ও খরচ যাচাই' : 'Student Application & Expense Review')}
            {actionDrawer.type === 'donation_review' && (isBn ? 'অনুদান ট্রানজেকশন অনুমোদন' : 'Donation Payment Verification')}
            {actionDrawer.type === 'item_donation_review' && (isBn ? 'পণ্য অনুদান পর্যালোচনা ও ছাড়পত্র' : 'Item Donation Review & Clearance')}
            {actionDrawer.type === 'add_super_admin' &&
              (newAdminRole === 'super_admin'
                ? (isBn ? 'নতুন সুপার এডমিন তৈরি' : 'Create Super Admin')
                : (isBn ? 'নতুন এডমিন তৈরি' : 'Create Admin'))}
            {actionDrawer.type === 'edit_permissions' && (isBn ? 'পারমিশন এডিট করুন' : 'Edit Permissions')}
            {actionDrawer.type === 'affiliation_review' &&
              (actionDrawer.itemData?.role === 'teacher'
                ? (isBn ? 'শিক্ষক প্রোফাইল চূড়ান্ত অনুমোদন' : 'Teacher Clearance Review')
                : (isBn ? 'শিক্ষার্থী প্রোফাইল চূড়ান্ত অনুমোদন' : 'Student Clearance Review'))}
            {actionDrawer.type === 'transfer_review' &&
              (isBn ? 'প্রতিষ্ঠান পরিবর্তন ও স্থানান্তর চূড়ান্ত ছাড়পত্র' : 'Institution Transfer Final Clearance')}
          </h3>
          <button
            className={styles.actionDrawerCloseBtn}
            onClick={() => setActionDrawer((prev) => ({ ...prev, isOpen: false }))}
            aria-label="ড্রয়ার বন্ধ করুন"
          >
            <X size={16} />
          </button>
        </div>

        <div className={styles.actionDrawerBody}>
          {/* Organization Verification Review Body */}
          {actionDrawer.type === 'org_review' && actionDrawer.itemData && (
            <div>
              {actionDrawer.itemData.isRequestedByMember && (
                <div
                  style={{
                    padding: '0.65rem 0.85rem',
                    backgroundColor: '#fffbeb',
                    border: '1px solid #fde68a',
                    borderRadius: '8px',
                    color: '#92400e',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    marginBottom: '1rem',
                  }}
                >
                  {isBn ? 'ℹ️ সাধারণ সদস্য কর্তৃক প্রস্তাবিত প্রতিষ্ঠান' : 'ℹ️ Member-proposed institution'}
                </div>
              )}

              {actionDrawer.isReadOnly ? (
                <div>
                  {/* Status Banner */}
                  <div
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: '10px',
                      backgroundColor: actionDrawer.itemData.status === 'active' ? '#ecfdf5' : '#fef2f2',
                      border: `1px solid ${actionDrawer.itemData.status === 'active' ? '#a7f3d0' : '#fecaca'}`,
                      marginBottom: '1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block' }}>
                        {isBn ? 'ছাড়পত্র স্ট্যাটাস' : 'Clearance Status'}
                      </span>
                      <strong
                        style={{
                          color: actionDrawer.itemData.status === 'active' ? '#047857' : '#b91c1c',
                          fontSize: '0.95rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        {actionDrawer.itemData.status === 'active' ? (
                          <>
                            <CheckCircle2 size={16} /> {isBn ? 'অনুমোদিত ও সক্রিয়' : 'Approved & Active'}
                          </>
                        ) : (
                          <>
                            <XCircle size={16} /> {isBn ? 'আবেদন বাতিলকৃত' : 'Rejected'}
                          </>
                        )}
                      </strong>
                    </div>
                    {(actionDrawer.itemData.verifiedAt || actionDrawer.itemData.updatedAt) && (
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        {isBn ? 'নিষ্পত্তির তারিখ:' : 'Verified on:'}{' '}
                        {new Date(actionDrawer.itemData.verifiedAt || actionDrawer.itemData.updatedAt).toLocaleDateString(isBn ? 'bn-BD' : 'en-US')}
                      </span>
                    )}
                  </div>

                  <div className={styles.detailGroup}>
                    <div className={styles.detailLabel}>{isBn ? 'প্রতিষ্ঠানের নাম' : 'Institution Name'}</div>
                    <div className={styles.detailValue} style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main, #0f172a)' }}>
                      {actionDrawer.itemData.name}
                    </div>
                  </div>

                  <div className={styles.detailGroup}>
                    <div className={styles.detailLabel}>{isBn ? 'প্রতিষ্ঠানের ধরন' : 'Institution Type'}</div>
                    <div className={styles.detailValue}>
                      <span style={{ padding: '0.2rem 0.6rem', backgroundColor: '#f1f5f9', color: '#334155', borderRadius: '6px', fontWeight: 600, fontSize: '0.88rem' }}>
                        {getOrganizationTypeLabel(actionDrawer.itemData.type, isBn)}
                      </span>
                    </div>
                  </div>

                  <div className={styles.detailGroup}>
                    <div className={styles.detailLabel}>{isBn ? 'সরকারি / বোর্ড নিবন্ধন কোড' : 'Registration Code'}</div>
                    <div className={styles.detailValue}>
                      <code>{actionDrawer.itemData.regNo || actionDrawer.itemData.registrationNumber || (isBn ? 'নিবন্ধন কোড নেই' : 'No Reg Code')}</code>
                    </div>
                  </div>

                  <div className={styles.detailGroup}>
                    <div className={styles.detailLabel}>{isBn ? 'প্রতিনিধি / যোগাযোগ ব্যক্তি' : 'Contact Person'}</div>
                    <div className={styles.detailValue}>
                      {actionDrawer.itemData.contact || actionDrawer.itemData.contactPerson || '—'}
                    </div>
                  </div>

                  <div className={styles.detailGroup}>
                    <div className={styles.detailLabel}>{isBn ? 'যোগাযোগের ফোন নম্বর' : 'Phone Number'}</div>
                    <div className={styles.detailValue}>
                      {actionDrawer.itemData.phone || actionDrawer.itemData.contactPhone || '—'}
                    </div>
                  </div>

                  {actionDrawer.itemData.email && (
                    <div className={styles.detailGroup}>
                      <div className={styles.detailLabel}>{isBn ? 'অফিশিয়াল ইমেইল' : 'Email'}</div>
                      <div className={styles.detailValue}>{actionDrawer.itemData.email}</div>
                    </div>
                  )}

                  <div className={styles.detailGroup}>
                    <div className={styles.detailLabel}>{isBn ? 'স্থায়ী ঠিকানা' : 'Address'}</div>
                    <div className={styles.detailValue}>{actionDrawer.itemData.address || '—'}</div>
                  </div>

                  {actionDrawer.itemData.description && (
                    <div className={styles.detailGroup}>
                      <div className={styles.detailLabel}>{isBn ? 'বিবরণ' : 'Description'}</div>
                      <div className={styles.detailValue} style={{ whiteSpace: 'pre-wrap' }}>
                        {actionDrawer.itemData.description}
                      </div>
                    </div>
                  )}

                  {actionDrawer.itemData.rejectionReason && (
                    <div
                      style={{
                        marginTop: '1.25rem',
                        padding: '0.85rem 1rem',
                        backgroundColor: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        color: '#991b1b',
                      }}
                    >
                      <strong>❌ {isBn ? 'প্রত্যাখ্যানের কারণ:' : 'Rejection Reason:'}</strong> {actionDrawer.itemData.rejectionReason}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  {actionDrawer.itemData.isRequestedByMember && (
                    <div
                      style={{
                        padding: '1rem',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(13, 148, 136, 0.08)',
                        border: '1.5px solid var(--color-primary, #0d9488)',
                        marginBottom: '1.25rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                        <UserCheck size={18} color="var(--color-primary, #0d9488)" />
                        <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--color-primary-dark, #0f766e)' }}>
                          {isBn ? 'প্রতিষ্ঠানের প্রশাসনিক দায়িত্ব ও ইউজার অর্পণ (ইউজার এসাইন)' : 'Assign Institutional Authority User'}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-main, #334155)', lineHeight: 1.45, marginBottom: '0.75rem' }}>
                        {isBn
                          ? 'এই প্রতিষ্ঠানটি সাধারণ সদস্য কর্তৃক প্রস্তাবিত। অনুমোদন নিশ্চিত করতে একটি নিবন্ধিত প্রতিষ্ঠান অ্যাকাউন্ট (Role: Organization) নির্বাচন করুন, যিনি প্রতিষ্ঠানটির অফিসিয়াল দায়িত্ব পরিচালনা করবেন।'
                          : 'Proposed by a member. To complete verification, select an organization account who will hold official administrative authority.'}
                      </p>

                      {drawerLoadingUsers ? (
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                          {isBn ? 'অনির্ধারিত একাউন্ট তালিকা লোড হচ্ছে...' : 'Loading unassigned accounts...'}
                        </div>
                      ) : drawerUnassignedUsers.length === 0 ? (
                        <div
                          style={{
                            padding: '0.65rem 0.85rem',
                            backgroundColor: '#fffbeb',
                            border: '1px solid #fde68a',
                            borderRadius: '8px',
                            color: '#92400e',
                            fontSize: '0.8rem',
                            lineHeight: 1.4,
                          }}
                        >
                          <strong>⚠️ {isBn ? 'কোনো অনির্ধারিত একাউন্ট নেই:' : 'No unassigned accounts:'}</strong>{' '}
                          {isBn
                            ? 'বর্তমানে কোনো অনির্ধারিত প্রতিষ্ঠান (Organization) অ্যাকাউন্ট নেই। অনুমোদন দেওয়ার জন্য প্রথমে সংশ্লিষ্ট প্রতিষ্ঠান কর্তৃপক্ষকে "প্রতিষ্ঠান" রোল দিয়ে সাইন-আপ করতে বলুন।'
                            : 'No unassigned organization accounts available. Please have an institution register an account first.'}
                        </div>
                      ) : (
                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-main)' }}>
                            {isBn ? 'দায়িত্বপ্রাপ্ত প্রতিষ্ঠান অ্যাকাউন্ট নির্বাচন করুন *' : 'Select Authority Organization Account *'}
                          </label>
                          <select
                            value={drawerSelectedUserId}
                            onChange={(e) => setDrawerSelectedUserId(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '0.6rem 0.75rem',
                              borderRadius: '8px',
                              border: '1.5px solid var(--color-primary, #0d9488)',
                              fontSize: '0.88rem',
                              backgroundColor: 'var(--surface, #ffffff)',
                              color: 'var(--text-main, #0f172a)',
                              fontWeight: 600,
                              cursor: 'pointer',
                              outline: 'none',
                            }}
                          >
                            <option value="">
                              -- {isBn ? 'প্রতিষ্ঠান অ্যাকাউন্ট নির্বাচন করুন' : 'Select an organization account'} --
                            </option>
                            {drawerUnassignedUsers.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.fullName || u.email} — {u.email} {u.phone ? `(${u.phone})` : ''}
                              </option>
                            ))}
                          </select>
                          {drawerSelectedUserId ? (
                            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#047857', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <CheckCircle2 size={15} />
                              {isBn ? 'ইউজার নির্ধারিত হয়েছে। এখন নিচের "ইউজার এসাইন ও অনুমোদন" বাটনে ক্লিক করে অনুমোদন সম্পন্ন করুন।' : 'User selected. Now click "Assign User & Approve" below.'}
                            </div>
                          ) : (
                            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#b91c1c', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <AlertTriangle size={15} />
                              {isBn ? 'ইউজার এসাইন করা বাধ্যতামূলক। ইউজার নির্বাচন না করে অনুমোদন দেওয়া যাবে না।' : 'Assigning an authority user is mandatory. You cannot approve without assigning a user.'}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className={styles.detailGroup}>
                    <div className={styles.detailLabel}>প্রতিষ্ঠানের নাম</div>
                    <input
                      type="text"
                      value={orgEditName}
                      onChange={(e) => setOrgEditName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem',
                        borderRadius: '8px',
                        border: '1px solid var(--color-border)',
                        fontFamily: 'inherit',
                        fontSize: '0.9rem',
                        backgroundColor: 'var(--surface, #fff)',
                        color: 'var(--text-main, #0f172a)',
                      }}
                    />
                  </div>

                  <div className={styles.detailGroup}>
                    <div className={styles.detailLabel}>প্রতিষ্ঠানের ধরন</div>
                    <select
                      value={orgEditType}
                      onChange={(e) => setOrgEditType(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem',
                        borderRadius: '8px',
                        border: '1px solid var(--color-border)',
                        fontFamily: 'inherit',
                        fontSize: '0.9rem',
                        backgroundColor: 'var(--surface, #fff)',
                        color: 'var(--text-main, #0f172a)',
                      }}
                    >
                      <option value="qawmi_madrasa">{isBn ? 'কওমি মাদ্রাসা' : 'Qawmi Madrasa'}</option>
                      <option value="hafezia_madrasa">{isBn ? 'হাফেজীয়া মাদ্রাসা' : 'Hafezia Madrasa'}</option>
                      <option value="ebtedayee_madrasa">{isBn ? 'এবতেদায়ী মাদ্রাসা' : 'Ebtedayee Madrasa'}</option>
                      <option value="alia_madrasa">{isBn ? 'আলিয়া মাদ্রাসা' : 'Alia Madrasa'}</option>
                      <option value="orphanage">{isBn ? 'এতিম খানা' : 'Orphanage'}</option>
                      <option value="other">{isBn ? 'অন্যান্য' : 'Other'}</option>
                    </select>
                  </div>

                  <div className={styles.detailGroup}>
                    <div className={styles.detailLabel}>সরকারি / বোর্ড নিবন্ধন কোড</div>
                    <input
                      type="text"
                      value={orgEditRegNo}
                      onChange={(e) => setOrgEditRegNo(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem',
                        borderRadius: '8px',
                        border: '1px solid var(--color-border)',
                        fontFamily: 'inherit',
                        fontSize: '0.9rem',
                        backgroundColor: 'var(--surface, #fff)',
                        color: 'var(--text-main, #0f172a)',
                      }}
                    />
                  </div>

                  <div className={styles.detailGroup}>
                    <div className={styles.detailLabel}>প্রতিনিধি / যোগাযোগ ব্যক্তি</div>
                    <input
                      type="text"
                      value={orgEditContact}
                      onChange={(e) => setOrgEditContact(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem',
                        borderRadius: '8px',
                        border: '1px solid var(--color-border)',
                        fontFamily: 'inherit',
                        fontSize: '0.9rem',
                        backgroundColor: 'var(--surface, #fff)',
                        color: 'var(--text-main, #0f172a)',
                      }}
                    />
                  </div>

                  <div className={styles.detailGroup}>
                    <div className={styles.detailLabel}>যোগাযোগের ফোন নম্বর</div>
                    <input
                      type="tel"
                      value={orgEditPhone}
                      onChange={(e) => setOrgEditPhone(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem',
                        borderRadius: '8px',
                        border: '1px solid var(--color-border)',
                        fontFamily: 'inherit',
                        fontSize: '0.9rem',
                        backgroundColor: 'var(--surface, #fff)',
                        color: 'var(--text-main, #0f172a)',
                      }}
                    />
                  </div>

                  <div className={styles.detailGroup}>
                    <div className={styles.detailLabel}>প্রতিষ্ঠানের অফিশিয়াল ইমেইল</div>
                    <input
                      type="email"
                      value={orgEditEmail}
                      onChange={(e) => setOrgEditEmail(e.target.value)}
                      placeholder="info@institution.edu.bd"
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem',
                        borderRadius: '8px',
                        border: '1px solid var(--color-border)',
                        fontFamily: 'inherit',
                        fontSize: '0.9rem',
                        backgroundColor: 'var(--surface, #fff)',
                        color: 'var(--text-main, #0f172a)',
                      }}
                    />
                  </div>

                  <div className={styles.detailGroup}>
                    <div className={styles.detailLabel}>প্রতিষ্ঠানের স্থায়ী ঠিকানা</div>
                    <input
                      type="text"
                      value={orgEditAddress}
                      onChange={(e) => setOrgEditAddress(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem',
                        borderRadius: '8px',
                        border: '1px solid var(--color-border)',
                        fontFamily: 'inherit',
                        fontSize: '0.9rem',
                        backgroundColor: 'var(--surface, #fff)',
                        color: 'var(--text-main, #0f172a)',
                      }}
                    />
                  </div>

                  <div className={styles.detailGroup}>
                    <div className={styles.detailLabel}>বিবরণ (ঐচ্ছিক)</div>
                    <textarea
                      rows={2}
                      value={orgEditDesc}
                      onChange={(e) => setOrgEditDesc(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem',
                        borderRadius: '8px',
                        border: '1px solid var(--color-border)',
                        fontFamily: 'inherit',
                        fontSize: '0.9rem',
                        backgroundColor: 'var(--surface, #fff)',
                        color: 'var(--text-main, #0f172a)',
                      }}
                    />
                  </div>

                  <div className={styles.sealCard}>
                    <Building2 size={24} color="#166534" />
                    <div>
                      <div className={styles.sealTitle}>প্রতিষ্ঠান ছাড়পত্র আবেদন পর্যালোচনায় রয়েছে</div>
                      <div className={styles.sealDesc}>
                        অনুমোদন করলে প্রতিষ্ঠানটি সক্রিয় হবে এবং শিক্ষার্থীদের আবেদন প্রত্যয়ন করতে পারবে।
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                      প্রত্যাখ্যানের কারণ (যদি বাতিল করতে চান):
                    </label>
                    <textarea
                      rows={3}
                      value={actionDrawer.reason}
                      onChange={(e) => setActionDrawer((prev) => ({ ...prev, reason: e.target.value }))}
                      placeholder="যেমন: নিবন্ধন কোড অস্পষ্ট বা প্রাতিষ্ঠানিক সনদ সংযুক্ত নেই..."
                      style={{
                        width: '100%',
                        padding: '0.6rem',
                        borderRadius: '8px',
                        border: '1px solid var(--color-border)',
                        fontFamily: 'inherit',
                        fontSize: '0.9rem',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Affiliation Verification Review Body (Stage 2) */}
          {actionDrawer.type === 'affiliation_review' && actionDrawer.itemData && (
            <div>
              <div className={styles.detailGroup}>
                <div className={styles.detailLabel}>নাম ও ভূমিকা</div>
                <div className={styles.detailValue} style={{ fontWeight: 800 }}>
                  {actionDrawer.itemData.fullName} (
                  {actionDrawer.itemData.role === 'teacher' ? 'শিক্ষক' : 'শিক্ষার্থী'})
                </div>
              </div>

              <div className={styles.detailGroup}>
                <div className={styles.detailLabel}>শিক্ষা প্রতিষ্ঠান</div>
                <div className={styles.detailValue} style={{ color: 'var(--color-primary-dark)', fontWeight: 700 }}>
                  {actionDrawer.itemData.institutionName}
                </div>
              </div>

              <div className={styles.sealCard}>
                <CheckCircle2 size={24} color="#166534" />
                <div>
                  <div className={styles.sealTitle}>
                    {isBn ? 'প্রতিষ্ঠান কর্তৃক ছাড়পত্র প্রত্যয়ন সম্পন্ন' : 'Institutional Clearance Verified'}
                  </div>
                  <div className={styles.sealDesc}>
                    {isBn ? 'শিক্ষা প্রতিষ্ঠান কর্তৃপক্ষ আবেদনটি যাচাইপূর্বক প্রত্যয়ন প্রদান করেছে।' : 'The educational institution has reviewed and certified this applicant.'}
                  </div>
                </div>
              </div>

              {actionDrawer.itemData.role === 'teacher' ? (
                <>
                  {actionDrawer.itemData.designation && (
                    <div className={styles.detailGroup}>
                      <div className={styles.detailLabel}>পদবী</div>
                      <div className={styles.detailValue}>{actionDrawer.itemData.designation}</div>
                    </div>
                  )}
                  {actionDrawer.itemData.department && (
                    <div className={styles.detailGroup}>
                      <div className={styles.detailLabel}>বিভাগ / অনুষদ</div>
                      <div className={styles.detailValue}>{actionDrawer.itemData.department}</div>
                    </div>
                  )}
                  {actionDrawer.itemData.employeeId && (
                    <div className={styles.detailGroup}>
                      <div className={styles.detailLabel}>এমপ্লয়ী / শিক্ষক আইডি</div>
                      <div className={styles.detailValue}>
                        <code>{actionDrawer.itemData.employeeId}</code>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {actionDrawer.itemData.studentClassRoll && (
                    <div className={styles.detailGroup}>
                      <div className={styles.detailLabel}>শ্রেণি ও রোল নম্বর</div>
                      <div className={styles.detailValue}>{actionDrawer.itemData.studentClassRoll}</div>
                    </div>
                  )}
                  {actionDrawer.itemData.address && (
                    <div className={styles.detailGroup}>
                      <div className={styles.detailLabel}>শিক্ষার্থীর স্থায়ী ঠিকানা</div>
                      <div className={styles.detailValue}>{actionDrawer.itemData.address}</div>
                    </div>
                  )}
                </>
              )}

              <div className={styles.detailGroup}>
                <div className={styles.detailLabel}>যোগাযোগ</div>
                <div className={styles.detailValue}>
                  {actionDrawer.itemData.email} | {actionDrawer.itemData.phone || 'ফোন নেই'}
                </div>
              </div>

              <div style={{ marginTop: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                  প্রত্যাখ্যানের কারণ (যদি বাতিল করতে চান):
                </label>
                <textarea
                  rows={3}
                  value={actionDrawer.reason}
                  onChange={(e) => setActionDrawer((prev) => ({ ...prev, reason: e.target.value }))}
                  placeholder="যেমন: তথ্যে গরমিল বা ভুয়া পরিচয়..."
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    fontFamily: 'inherit',
                    fontSize: '0.9rem',
                  }}
                />
              </div>
            </div>
          )}

          {/* Student Post Verification Review Body */}
          {actionDrawer.type === 'post_review' && actionDrawer.itemData && (
            <div>
              <div className={styles.detailGroup}>
                <div className={styles.detailLabel}>পোস্টের শিরোনাম</div>
                <div className={styles.detailValue} style={{ color: 'var(--color-primary-dark)' }}>
                  {actionDrawer.itemData.title}
                </div>
              </div>

              <div className={styles.detailGroup}>
                <div className={styles.detailLabel}>শিক্ষার্থী ও শিক্ষাপ্রতিষ্ঠান</div>
                <div className={styles.detailValue}>
                  {actionDrawer.itemData.studentName} ({actionDrawer.itemData.institution})
                </div>
              </div>

              <div className={styles.sealCard}>
                <CheckCircle2 size={24} color="var(--primary)" />
                <div>
                  <div className={styles.sealTitle}>দ্বৈত ভেরিফিকেশন স্ট্যাটাস</div>
                  <div className={styles.sealDesc}>
                    {actionDrawer.itemData.teacherVerified ? '✓ শিক্ষক সত্যায়ন সম্পন্ন' : 'শিক্ষক সত্যায়ন অপেক্ষমান'} |{' '}
                    {actionDrawer.itemData.orgVerified ? '✓ প্রতিষ্ঠান ছাড়পত্র প্রাপ্ত' : 'প্রতিষ্ঠান ছাড়পত্র অপেক্ষমান'}
                  </div>
                </div>
              </div>

              <div className={styles.detailGroup}>
                <div className={styles.detailLabel}>পারিবারিক ও আর্থিক সংকটের বিবরণ</div>
                <div
                  style={{
                    backgroundColor: 'var(--background-alt, #f8fafc)',
                    color: 'var(--text-main, #0f172a)',
                    padding: '0.85rem',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.88rem',
                    lineHeight: 1.5,
                  }}
                >
                  {actionDrawer.itemData.problemDesc}
                </div>
              </div>

              <div className={styles.detailGroup}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <div className={styles.detailLabel} style={{ marginBottom: 0 }}>খরচের সুনির্দিষ্ট বিভাজন</div>
                  {!actionDrawer.isReadOnly && (
                  <button
                    type="button"
                    onClick={() => setIsEditingExpenses((prev) => !prev)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.3rem 0.65rem',
                      backgroundColor: isEditingExpenses ? 'var(--color-primary-dark)' : 'rgba(13, 148, 136, 0.1)',
                      color: isEditingExpenses ? '#fff' : 'var(--color-primary-dark)',
                      border: '1px solid rgba(13, 148, 136, 0.3)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                    }}
                    title="খরচ সম্পাদনা / পরিবর্তন করুন"
                  >
                    <Edit size={14} />
                    <span>{isEditingExpenses ? 'সম্পাদনা বন্ধ করুন' : 'খরচ পরিবর্তন / এডিট'}</span>
                  </button>
                  )}
                </div>

                {!isEditingExpenses ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {editedExpenses.map((exp, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '0.5rem 0.75rem',
                          backgroundColor: 'var(--background-alt, #f1f5f9)',
                          color: 'var(--text-main, #0f172a)',
                          borderRadius: '6px',
                          fontSize: '0.85rem',
                        }}
                      >
                        <span>{exp.category}</span>
                        <strong>৳{Number(exp.amount || 0).toLocaleString()}</strong>
                      </div>
                    ))}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '0.5rem 0.75rem',
                        backgroundColor: 'rgba(13, 148, 136, 0.12)',
                        borderRadius: '6px',
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        color: 'var(--color-primary-dark)',
                      }}
                    >
                      <span>সর্বমোট প্রয়োজনীয় অর্থ</span>
                      <span>
                        ৳{editedExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                      প্রতিটি খরচের খাত ও টাকার পরিমাণ পরিবর্তন করুন:
                    </div>
                    {editedExpenses.map((exp, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          gap: '0.5rem',
                          alignItems: 'center',
                          backgroundColor: 'var(--background-alt, #f8fafc)',
                          padding: '0.5rem',
                          borderRadius: '6px',
                          border: '1px solid var(--color-border)',
                        }}
                      >
                        <input
                          type="text"
                          value={exp.category}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditedExpenses((prev) =>
                              prev.map((item, idx) => (idx === i ? { ...item, category: val } : item))
                            );
                          }}
                          placeholder="খরচের খাত (যেমন: টিউশন ফি)"
                          style={{
                            flex: 2,
                            padding: '0.4rem 0.6rem',
                            borderRadius: '4px',
                            border: '1px solid var(--color-border)',
                            fontSize: '0.85rem',
                          }}
                        />
                        <div style={{ display: 'flex', alignItems: 'center', flex: 1, gap: '0.25rem' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>৳</span>
                          <input
                            type="number"
                            min="0"
                            value={exp.amount}
                            onChange={(e) => {
                              const val = Math.max(0, Number(e.target.value) || 0);
                              setEditedExpenses((prev) =>
                                prev.map((item, idx) => (idx === i ? { ...item, amount: val } : item))
                              );
                            }}
                            placeholder="টাকা"
                            style={{
                              width: '100%',
                              padding: '0.4rem 0.6rem',
                              borderRadius: '4px',
                              border: '1px solid var(--color-border)',
                              fontSize: '0.85rem',
                            }}
                          />
                        </div>
                        {editedExpenses.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditedExpenses((prev) => prev.filter((_, idx) => idx !== i));
                            }}
                            style={{
                              backgroundColor: 'transparent',
                              border: 'none',
                              color: 'var(--color-danger, #ef4444)',
                              cursor: 'pointer',
                              padding: '0.3rem',
                            }}
                            title="খাতটি বাদ দিন"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => {
                        setEditedExpenses((prev) => [...prev, { category: '', amount: 0 }]);
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        padding: '0.45rem',
                        borderRadius: '6px',
                        border: '1px dashed var(--color-primary)',
                        backgroundColor: 'transparent',
                        color: 'var(--color-primary-dark)',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        marginTop: '0.25rem',
                      }}
                    >
                      <Plus size={15} />
                      <span>নতুন খরচের খাত যুক্ত করুন</span>
                    </button>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '0.5rem 0.75rem',
                        backgroundColor: 'rgba(13, 148, 136, 0.12)',
                        borderRadius: '6px',
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        color: 'var(--color-primary-dark)',
                        marginTop: '0.25rem',
                      }}
                    >
                      <span>সংশোধিত সর্বমোট অর্থ (ফাইনাল ভ্যালু)</span>
                      <span>
                        ৳{editedExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Expense Modification Reason Input (Mandatory if expenses differ from original) */}
              {actionDrawer.isReadOnly ? (
                <>
                  {actionDrawer.itemData.adminModificationReason && (
                    <div className={styles.historyWarningBox} style={{ marginTop: '1rem' }}>
                      <strong>⚠️ {isBn ? 'এডমিন খরচের সমন্বয় নোট:' : 'Admin Modification Note:'}</strong> {actionDrawer.itemData.adminModificationReason}
                    </div>
                  )}
                  {actionDrawer.itemData.rejectionReason && (
                    <div className={styles.historyRejectionBox} style={{ marginTop: '1rem' }}>
                      <strong>✕ {isBn ? 'প্রত্যাখ্যানের কারণ:' : 'Rejection Reason:'}</strong> {actionDrawer.itemData.rejectionReason}
                    </div>
                  )}
                </>
              ) : (
                <>
              {(editedExpenses.length !== (actionDrawer.itemData.expenses?.length || 0) ||
                editedExpenses.some((e, i) => {
                  const orig = actionDrawer.itemData.expenses?.[i];
                  const origName = orig?.category || orig?.categoryName || '';
                  const origAmt = Number(orig?.amount || 0);
                  return origName !== e.category || origAmt !== Number(e.amount);
                })) && (
                <div
                  style={{
                    marginTop: '1.25rem',
                    padding: '0.85rem',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid rgba(245, 158, 11, 0.35)',
                  }}
                >
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      color: '#b45309',
                      marginBottom: '0.35rem',
                    }}
                  >
                    {isBn ? 'খরচ সমন্বয়ের সুনির্দিষ্ট কারণ *' : 'Reason for Expense Adjustment *'}
                  </label>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    {isBn ? 'খরচ পরিবর্তনের সুনির্দিষ্ট কারণ উল্লেখ করুন, যা সংশ্লিষ্ট শিক্ষার্থী ও প্রতিষ্ঠানকে অবহিত করা হবে।' : 'Specify the reason for expense adjustment to notify the student and institution.'}
                  </p>
                  <textarea
                    rows={2}
                    value={expenseModificationReason}
                    onChange={(e) => setExpenseModificationReason(e.target.value)}
                    placeholder={isBn ? 'যেমন: প্রাতিষ্ঠানিক টিউশন ফি যাচাই সাপেক্ষে সমন্বয় করা হয়েছে...' : 'e.g., Adjusted based on institutional tuition fee verification...'}
                    style={{
                      width: '100%',
                      padding: '0.6rem',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      fontFamily: 'inherit',
                      fontSize: '0.9rem',
                    }}
                  />
                </div>
              )}

              <div style={{ marginTop: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                  বাতিল / প্রত্যাখ্যানের কারণ (বাতিল করার ক্ষেত্রে আবশ্যক):
                </label>
                <textarea
                  rows={2}
                  value={actionDrawer.reason}
                  onChange={(e) => setActionDrawer((prev) => ({ ...prev, reason: e.target.value }))}
                  placeholder="পোস্ট বাতিল করা হলে কারণ লিখুন..."
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    fontFamily: 'inherit',
                    fontSize: '0.9rem',
                  }}
                />
              </div>
                </>
              )}
            </div>
          )}

          {/* Donation Payment Review Body */}
          {actionDrawer.type === 'donation_review' && actionDrawer.itemData && (
            <div>
              <div className={styles.detailGroup}>
                <div className={styles.detailLabel}>দানকারীর নাম</div>
                <div className={styles.detailValue}>{actionDrawer.itemData.donorName}</div>
              </div>

              <div className={styles.detailGroup}>
                <div className={styles.detailLabel}>অনুদান প্রকার ও প্রাপক</div>
                <div className={styles.detailValue}>
                  {actionDrawer.itemData.type === 'random'
                    ? 'সাধারণ শিক্ষা তহবিল'
                    : `সরাসরি শিক্ষার্থী: ${actionDrawer.itemData.studentName}`}
                </div>
              </div>

              <div className={styles.detailGroup}>
                <div className={styles.detailLabel}>পেমেন্ট মেথড ও লেনদেন আইডি</div>
                <div className={styles.detailValue}>
                  {actionDrawer.itemData.method} — <code>{actionDrawer.itemData.trxId}</code>
                </div>
              </div>

              <div
                style={{
                  padding: '1rem',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  borderRadius: '10px',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem',
                }}
              >
                <span style={{ fontWeight: 600, color: '#065f46' }}>মোট প্রাপ্ত অর্থ</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#047857' }}>
                  ৳{Number(actionDrawer.itemData.amount || 0).toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* Item Donation Review Drawer Body */}
          {actionDrawer.type === 'item_donation_review' && actionDrawer.itemData && (
            <div>
              <div className={styles.detailGroup}>
                <div className={styles.detailLabel}>{isBn ? 'পণ্যের নাম ও বিবরণ' : 'Item Name & Details'}</div>
                <div className={styles.detailValue} style={{ fontWeight: 800, fontSize: '1.05rem', color: '#2563eb' }}>
                  {actionDrawer.itemData.itemName}
                </div>
                {actionDrawer.itemData.description && (
                  <p style={{ margin: '0.35rem 0 0', fontSize: '0.88rem', color: 'var(--text-main, #334155)' }}>
                    {actionDrawer.itemData.description}
                  </p>
                )}
              </div>

              <div className={styles.detailGroup}>
                <div className={styles.detailLabel}>{isBn ? 'পরিমাণ (Quantity)' : 'Quantity'}</div>
                <div className={styles.detailValue}>
                  <strong>{actionDrawer.itemData.quantity}</strong>
                </div>
              </div>

              <div className={styles.detailGroup}>
                <div className={styles.detailLabel}>{isBn ? 'দাতার তথ্য' : 'Donor Information'}</div>
                <div className={styles.detailValue}>
                  {actionDrawer.itemData.donorName || (isBn ? 'অজ্ঞাত দাতা' : 'Anonymous')} | {actionDrawer.itemData.donorPhone}
                </div>
              </div>

              {actionDrawer.itemData.pickupAddress && (
                <div className={styles.detailGroup}>
                  <div className={styles.detailLabel}>{isBn ? 'পিকআপের ঠিকানা' : 'Pickup Address'}</div>
                  <div className={styles.detailValue}>{actionDrawer.itemData.pickupAddress}</div>
                </div>
              )}

              {actionDrawer.itemData.postTitle && (
                <div className={styles.detailGroup}>
                  <div className={styles.detailLabel}>{isBn ? 'নির্দিষ্ট শিক্ষার্থী ক্যাম্পেইন' : 'Student Campaign'}</div>
                  <div className={styles.detailValue}>{actionDrawer.itemData.postTitle}</div>
                </div>
              )}

              <div className={styles.detailGroup}>
                <div className={styles.detailLabel}>{isBn ? 'বর্তমান স্ট্যাটাস' : 'Status'}</div>
                <div className={styles.detailValue}>
                  <span
                    style={{
                      padding: '0.2rem 0.6rem',
                      borderRadius: '9999px',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      backgroundColor:
                        actionDrawer.itemData.status === 'accepted'
                          ? '#ecfdf5'
                          : actionDrawer.itemData.status === 'rejected'
                          ? '#fef2f2'
                          : '#fef3c7',
                      color:
                        actionDrawer.itemData.status === 'accepted'
                          ? '#047857'
                          : actionDrawer.itemData.status === 'rejected'
                          ? '#b91c1c'
                          : '#92400e',
                    }}
                  >
                    {actionDrawer.itemData.status === 'accepted'
                      ? (isBn ? 'গৃহীত / অনুমোদিত' : 'Accepted')
                      : actionDrawer.itemData.status === 'rejected'
                      ? (isBn ? 'বাতিল' : 'Rejected')
                      : (isBn ? 'অপেক্ষমাণ' : 'Pending')}
                  </span>
                </div>
              </div>

              {actionDrawer.isReadOnly ? (
                <>
                  {actionDrawer.itemData.adminInstruction && (
                    <div className={styles.detailGroup}>
                      <div className={styles.detailLabel}>{isBn ? 'অ্যাডমিন প্রদত্ত নির্দেশনা' : 'Admin Instruction'}</div>
                      <div className={styles.detailValue}>{actionDrawer.itemData.adminInstruction}</div>
                    </div>
                  )}
                  {actionDrawer.itemData.donorShipmentNote && (
                    <div className={styles.detailGroup}>
                      <div className={styles.detailLabel}>{isBn ? 'দাতার শিপমেন্ট নোট' : 'Donor Shipment Note'}</div>
                      <div className={styles.detailValue}>{actionDrawer.itemData.donorShipmentNote}</div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className={styles.detailGroup}>
                    <label className={styles.detailLabel} style={{ fontWeight: 700 }}>
                      {isBn ? 'দাতাকে প্রেরণের নির্দেশনা / কুরিয়ার ঠিকানা (বাধ্যতামূলক)' : 'Admin Dispatch Instructions / Courier Address (Required)'}
                    </label>
                    <textarea
                      rows={3}
                      value={itemAdminInstruction}
                      onChange={(e) => setItemAdminInstruction(e.target.value)}
                      placeholder={isBn ? 'যেমন: অনুগ্রহ করে পণ্যটি সুন্দরবন কুরিয়ারে ঢাকা প্রধান শাখায় পাঠিয়ে স্লিপ নম্বর যুক্ত করুন...' : 'e.g. Please courier the item to our central hub...'}
                      style={{
                        width: '100%',
                        padding: '0.6rem',
                        borderRadius: '8px',
                        border: '1.5px solid var(--color-border)',
                        fontFamily: 'inherit',
                        fontSize: '0.9rem',
                        backgroundColor: 'var(--surface, #ffffff)',
                        color: 'var(--text-main, #0f172a)',
                      }}
                    />
                  </div>

                  <div className={styles.detailGroup}>
                    <label className={styles.detailLabel} style={{ fontWeight: 700 }}>
                      {isBn ? 'প্রত্যাখ্যানের কারণ (যদি বাতিল করা হয়)' : 'Rejection Reason (if rejected)'}
                    </label>
                    <textarea
                      rows={2}
                      value={actionDrawer.reason}
                      onChange={(e) => setActionDrawer((prev) => ({ ...prev, reason: e.target.value }))}
                      placeholder={isBn ? 'বাতিলের কারণ লিখুন...' : 'Write reason if rejecting...'}
                      style={{
                        width: '100%',
                        padding: '0.6rem',
                        borderRadius: '8px',
                        border: '1.5px solid var(--color-border)',
                        fontFamily: 'inherit',
                        fontSize: '0.9rem',
                        backgroundColor: 'var(--surface, #ffffff)',
                        color: 'var(--text-main, #0f172a)',
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Add Super Admin / Admin Body */}
          {/* Edit Admin Permissions Drawer Body */}
          {actionDrawer.type === 'edit_permissions' && editingAdmin && (
            <div>
              <div className={styles.detailGroup}>
                <div className={styles.detailLabel}>{isBn ? 'কর্মকর্তা' : 'Staff Member'}</div>
                <div className={styles.detailValue} style={{ fontWeight: 800 }}>
                  {editingAdmin.fullName || editingAdmin.name}
                </div>
              </div>

              <div className={styles.detailGroup}>
                <div className={styles.detailLabel}>{isBn ? 'ইমেইল' : 'Email'}</div>
                <div className={styles.detailValue}>{editingAdmin.email}</div>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.6rem', color: 'var(--text-main, #0f172a)' }}>
                  {isBn ? 'রোল নির্ধারণ' : 'Role Selection'}
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <label
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.65rem 1rem',
                      borderRadius: '8px',
                      border: `1.5px solid ${editAdminRole === 'super_admin' ? 'var(--color-primary, #059669)' : 'var(--surface-border, #94a3b8)'}`,
                      backgroundColor: editAdminRole === 'super_admin' ? 'rgba(5, 150, 105, 0.12)' : 'var(--surface, #ffffff)',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      color: 'var(--text-main, #0f172a)',
                    }}
                  >
                    <input
                      type="radio"
                      name="editAdminRole"
                      value="super_admin"
                      checked={editAdminRole === 'super_admin'}
                      onChange={() => setEditAdminRole('super_admin')}
                      style={{ accentColor: 'var(--color-primary, #059669)', width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <span>{isBn ? 'সুপার এডমিন' : 'Super Admin'}</span>
                  </label>

                  <label
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.65rem 1rem',
                      borderRadius: '8px',
                      border: `1.5px solid ${editAdminRole === 'admin' ? 'var(--color-primary, #059669)' : 'var(--surface-border, #94a3b8)'}`,
                      backgroundColor: editAdminRole === 'admin' ? 'rgba(5, 150, 105, 0.12)' : 'var(--surface, #ffffff)',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      color: 'var(--text-main, #0f172a)',
                    }}
                  >
                    <input
                      type="radio"
                      name="editAdminRole"
                      value="admin"
                      checked={editAdminRole === 'admin'}
                      onChange={() => {
                        setEditAdminRole('admin');
                        setEditAdminPermissions((prev) =>
                          prev.filter((k) => !ALL_MODULES.find((m) => m.key === k)?.superAdminOnly)
                        );
                      }}
                      style={{ accentColor: 'var(--color-primary, #059669)', width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <span>{isBn ? 'এডমিন' : 'Admin'}</span>
                  </label>
                </div>
              </div>

              <ModularAccessSelector
                currentRole={editAdminRole}
                selectedKeys={editAdminPermissions}
                onChange={setEditAdminPermissions}
                isBn={isBn}
              />

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', alignItems: 'center', marginTop: '1.75rem' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{
                    flex: 1,
                    maxWidth: '180px',
                    height: '42px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 600,
                  }}
                  onClick={() => setActionDrawer((prev) => ({ ...prev, isOpen: false }))}
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="button"
                  disabled={isUpdatingPermissions}
                  className="btn btn-primary"
                  style={{
                    flex: 1,
                    maxWidth: '180px',
                    height: '42px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                  }}
                  onClick={handleSaveAdminPermissions}
                >
                  {isUpdatingPermissions
                    ? (isBn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...')
                    : (isBn ? 'পারমিশন সেভ করুন' : 'Save Permissions')}
                </button>
              </div>
            </div>
          )}

          {/* Institution Transfer Final Clearance Body */}
          {actionDrawer.type === 'transfer_review' && actionDrawer.itemData && (
            <div>
              <div className={styles.detailGroup}>
                <div className={styles.detailLabel}>{isBn ? 'আবেদনকারী ও ভূমিকা' : 'Applicant & Role'}</div>
                <div className={styles.detailValue} style={{ fontWeight: 800 }}>
                  {actionDrawer.itemData.userName} (
                  {actionDrawer.itemData.userRole === 'teacher' ? (isBn ? 'শিক্ষক' : 'Teacher') : (isBn ? 'শিক্ষার্থী' : 'Student')})
                </div>
              </div>

              <div className={styles.detailGroup}>
                <div className={styles.detailLabel}>{isBn ? 'প্রতিষ্ঠান স্থানান্তর পথ' : 'Transfer Route'}</div>
                <div className={styles.detailValue} style={{ fontSize: '0.95rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{actionDrawer.itemData.currentOrgName}</span>
                  {' '}➔{' '}
                  <strong style={{ color: 'var(--color-primary-dark, #059669)' }}>{actionDrawer.itemData.targetOrgName}</strong>
                </div>
              </div>

              <div className={styles.sealCard}>
                <CheckCircle2 size={24} color="#166534" />
                <div>
                  <div className={styles.sealTitle}>
                    {actionDrawer.itemData.status === 'target_org_approved'
                      ? (isBn ? 'উভয় শিক্ষা প্রতিষ্ঠান অনুমোদন করেছে' : 'Approved by Both Institutions')
                      : actionDrawer.itemData.status === 'current_org_approved'
                      ? (isBn ? 'পূর্ববর্তী প্রতিষ্ঠান ছাড়পত্র দিয়েছে (নতুন প্রতিষ্ঠানের অপেক্ষায়)' : 'Released by Current Org (Awaiting New Org)')
                      : actionDrawer.itemData.status === 'approved'
                      ? (isBn ? 'স্থানান্তর চূড়ান্তভাবে সম্পন্ন ও কার্যকর' : 'Transfer Completed & Effective')
                      : actionDrawer.itemData.status === 'rejected'
                      ? (isBn ? 'আবেদনটি বাতিল করা হয়েছে' : 'Transfer Rejected')
                      : (isBn ? 'বর্তমান প্রতিষ্ঠানের ছাড়পত্রের অপেক্ষায়' : 'Awaiting Current Org Release')}
                  </div>
                  <div className={styles.sealDesc}>
                    {actionDrawer.itemData.status === 'target_org_approved'
                      ? (isBn ? 'বর্তমান প্রতিষ্ঠান ছাড়পত্র দিয়েছে এবং নতুন প্রতিষ্ঠান গ্রহণ করেছে। এখন এডমিনের চূড়ান্ত ছাড়পত্র দেওয়া হলে মূল ডাটাবেজে প্রতিষ্ঠান পরিবর্তন সম্পন্ন হবে।' : 'Both institutions gave consent. Admin final clearance is required to execute transfer.')
                      : (isBn ? 'প্রতিষ্ঠান পরিবর্তনের বর্তমান অগ্রগতি ট্র্যাক করা হচ্ছে।' : 'Institutional transfer progress is being tracked.')}
                  </div>
                </div>
              </div>

              <div className={styles.detailGroup}>
                <div className={styles.detailLabel}>{isBn ? 'পরিবর্তনের কারণ' : 'Reason for Transfer'}</div>
                <div
                  style={{
                    backgroundColor: 'var(--background-alt, #f8fafc)',
                    color: 'var(--text-main, #0f172a)',
                    padding: '0.85rem',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.88rem',
                    lineHeight: 1.5,
                  }}
                >
                  &quot;{actionDrawer.itemData.reason}&quot;
                </div>
              </div>

              <div className={styles.detailGroup}>
                <div className={styles.detailLabel}>{isBn ? 'যোগাযোগের তথ্য' : 'Contact Details'}</div>
                <div className={styles.detailValue}>
                  {actionDrawer.itemData.userEmail} {actionDrawer.itemData.userPhone && `| ${actionDrawer.itemData.userPhone}`}
                </div>
              </div>

              <div className={styles.detailGroup}>
                <div className={styles.detailLabel}>{isBn ? 'টাইমলাইন ও অগ্রগতি' : 'Timeline Milestones'}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div>
                    {isBn ? 'আবেদনের তারিখ: ' : 'Applied: '}
                    <strong>{new Date(actionDrawer.itemData.createdAt).toLocaleString(isBn ? 'bn-BD' : 'en-US')}</strong>
                  </div>
                  {actionDrawer.itemData.currentOrgApprovedAt && (
                    <div>
                      {isBn ? 'বর্তমান প্রতিষ্ঠানের ছাড়পত্র: ' : 'Current Org Release: '}
                      <strong style={{ color: '#059669' }}>{new Date(actionDrawer.itemData.currentOrgApprovedAt).toLocaleString(isBn ? 'bn-BD' : 'en-US')}</strong>
                    </div>
                  )}
                  {actionDrawer.itemData.targetOrgApprovedAt && (
                    <div>
                      {isBn ? 'নতুন প্রতিষ্ঠানের গ্রহণ: ' : 'Target Org Acceptance: '}
                      <strong style={{ color: '#059669' }}>{new Date(actionDrawer.itemData.targetOrgApprovedAt).toLocaleString(isBn ? 'bn-BD' : 'en-US')}</strong>
                    </div>
                  )}
                  {actionDrawer.itemData.finalApprovedAt && (
                    <div>
                      {isBn ? 'এডমিন চূড়ান্ত ছাড়পত্র: ' : 'Admin Final Clearance: '}
                      <strong style={{ color: '#059669' }}>{new Date(actionDrawer.itemData.finalApprovedAt).toLocaleString(isBn ? 'bn-BD' : 'en-US')}</strong>
                    </div>
                  )}
                </div>
              </div>

              {actionDrawer.itemData.status === 'rejected' && (
                <div
                  style={{
                    padding: '0.75rem',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    color: '#991b1b',
                    fontSize: '0.85rem',
                  }}
                >
                  <strong>❌ {isBn ? 'বাতিলের কারণ:' : 'Rejection Reason:'}</strong>{' '}
                  {actionDrawer.itemData.currentOrgRejectionReason ||
                    actionDrawer.itemData.targetOrgRejectionReason ||
                    actionDrawer.itemData.finalRejectionReason ||
                    (isBn ? 'কারণ উল্লেখ নেই' : 'No reason specified')}
                </div>
              )}

              {!actionDrawer.isReadOnly && (
                <div style={{ marginTop: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                    {isBn ? 'প্রত্যাখ্যানের কারণ (যদি বাতিল করতে চান):' : 'Rejection Reason (if rejecting):'}
                  </label>
                  <textarea
                    rows={3}
                    value={actionDrawer.reason}
                    onChange={(e) => setActionDrawer((prev) => ({ ...prev, reason: e.target.value }))}
                    placeholder={isBn ? 'যেমন: স্থানান্তরের নীতিমালার ব্যত্যয় বা তথ্য গরমিল...' : 'Enter reason for rejection...'}
                    style={{
                      width: '100%',
                      padding: '0.6rem',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      fontFamily: 'inherit',
                      fontSize: '0.9rem',
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {actionDrawer.type === 'add_super_admin' && (
            <form onSubmit={handleCreateSuperAdmin}>
              {/* 1. Admin Role Radio Selector */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text, #0f172a)' }}>
                  {isBn ? 'পদবী নির্বাচন করুন' : 'Select Role'}
                </label>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <label
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.65rem 1rem',
                      borderRadius: '8px',
                      border: `1.5px solid ${newAdminRole === 'super_admin' ? 'var(--color-primary, #059669)' : '#94a3b8'}`,
                      backgroundColor: newAdminRole === 'super_admin' ? 'rgba(5, 150, 105, 0.12)' : 'var(--surface, #ffffff)',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      transition: 'all 0.2s ease',
                      color: 'var(--text-main, #0f172a)',
                    }}
                  >
                    <input
                      type="radio"
                      name="adminRole"
                      value="super_admin"
                      checked={newAdminRole === 'super_admin'}
                      onChange={() => setNewAdminRole('super_admin')}
                      style={{ accentColor: 'var(--color-primary, #059669)', width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <span>{isBn ? 'সুপার এডমিন' : 'Super Admin'}</span>
                  </label>

                  <label
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.65rem 1rem',
                      borderRadius: '8px',
                      border: `1.5px solid ${newAdminRole === 'admin' ? 'var(--color-primary, #059669)' : 'var(--surface-border, #94a3b8)'}`,
                      backgroundColor: newAdminRole === 'admin' ? 'rgba(5, 150, 105, 0.12)' : 'var(--surface, #ffffff)',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      transition: 'all 0.2s ease',
                      color: 'var(--text-main, #0f172a)',
                    }}
                  >
                    <input
                      type="radio"
                      name="adminRole"
                      value="admin"
                      checked={newAdminRole === 'admin'}
                      onChange={() => {
                        setNewAdminRole('admin');
                        setSelectedPermissions((prev) =>
                          prev.filter((k) => !ALL_MODULES.find((m) => m.key === k)?.superAdminOnly)
                        );
                      }}
                      style={{ accentColor: 'var(--color-primary, #059669)', width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <span>{isBn ? 'এডমিন' : 'Admin'}</span>
                  </label>
                </div>
              </div>

              {/* 1.1: Name with placeholder "এস. এম. ফারুক হাসান" and crisp visible border */}
              <div className={styles.detailGroup}>
                <label className={styles.detailLabel}>{isBn ? 'পূর্ণ নাম' : 'Full Name'}</label>
                <input
                  type="text"
                  required
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  placeholder={isBn ? 'এস. এম. ফারুক হাসান' : 'S. M. Faruk Hasan'}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1.5px solid var(--surface-border, #94a3b8)',
                    backgroundColor: 'var(--surface, #ffffff)',
                    color: 'var(--text-main, #0f172a)',
                    fontSize: '0.92rem',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                  }}
                />
              </div>

              {/* 1.1: Email with placeholder "hasan@sadaqahbd.com" and crisp visible border */}
              <div className={styles.detailGroup}>
                <label className={styles.detailLabel}>{isBn ? 'অফিসিয়াল ইমেইল' : 'Official Email'}</label>
                <input
                  type="email"
                  required
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="hasan@sadaqahbd.com"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1.5px solid var(--surface-border, #94a3b8)',
                    backgroundColor: 'var(--surface, #ffffff)',
                    color: 'var(--text-main, #0f172a)',
                    fontSize: '0.92rem',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                  }}
                />
              </div>

              {/* Mobile Phone with crisp visible border */}
              <div className={styles.detailGroup}>
                <label className={styles.detailLabel}>{isBn ? 'মোবাইল নম্বর' : 'Mobile Phone'}</label>
                <input
                  type="tel"
                  required
                  value={newAdminPhone}
                  onChange={(e) => setNewAdminPhone(e.target.value)}
                  placeholder="017XXXXXXXX"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1.5px solid var(--surface-border, #94a3b8)',
                    backgroundColor: 'var(--surface, #ffffff)',
                    color: 'var(--text-main, #0f172a)',
                    fontSize: '0.92rem',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                  }}
                />
              </div>

              {/* Modular Access Selector */}
              <ModularAccessSelector
                currentRole={newAdminRole}
                selectedKeys={selectedPermissions}
                onChange={setSelectedPermissions}
                isBn={isBn}
              />

              {/* 1.3 & 1.4: "বাতিল" and "সেভ করুন"/"Save" centered and equal size */}
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', alignItems: 'center', marginTop: '1.75rem' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{
                    flex: 1,
                    maxWidth: '180px',
                    height: '42px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 600,
                  }}
                  onClick={() => setActionDrawer((prev) => ({ ...prev, isOpen: false }))}
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn btn-primary"
                  style={{
                    flex: 1,
                    maxWidth: '180px',
                    height: '42px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                  }}
                >
                  {actionLoading
                    ? (isBn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...')
                    : (isBn ? 'সেভ করুন' : 'Save')}
                </button>
              </div>

              {/* 3: Centered default password notice below the two buttons */}
              <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.88rem', color: 'var(--color-text-muted, #64748b)', fontWeight: 500 }}>
                {isBn ? 'ডিফল্ট পাসওয়ার্ডঃ pass1233' : 'Default password: pass1233'}
              </div>
            </form>
          )}
        </div>

        {actionDrawer.type !== 'add_super_admin' && actionDrawer.type !== 'edit_permissions' && !actionDrawer.isReadOnly && (
          <div className={styles.actionDrawerFooter}>
            <button
              type="button"
              className="btn btn-outline"
              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
              onClick={() => setActionDrawer((prev) => ({ ...prev, isOpen: false }))}
            >
              {isBn ? 'বন্ধ করুন' : 'Close'}
            </button>

            <button
              type="button"
              className="btn btn-outline"
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.85rem',
                color: '#ef4444',
                borderColor: '#ef4444',
              }}
              disabled={actionLoading}
              onClick={() => handleExecuteAction('reject')}
            >
              <XCircle size={16} /> {isBn ? 'প্রত্যাখ্যান' : 'Reject'}
            </button>

            <button
              type="button"
              className="btn btn-primary"
              style={{
                padding: '0.5rem 1.25rem',
                fontSize: '0.85rem',
                opacity:
                  actionDrawer.type === 'org_review' &&
                  actionDrawer.itemData?.isRequestedByMember &&
                  !drawerSelectedUserId
                    ? 0.55
                    : 1,
                cursor:
                  actionDrawer.type === 'org_review' &&
                  actionDrawer.itemData?.isRequestedByMember &&
                  !drawerSelectedUserId
                    ? 'not-allowed'
                    : 'pointer',
              }}
              disabled={
                actionLoading ||
                (actionDrawer.type === 'org_review' &&
                  actionDrawer.itemData?.isRequestedByMember &&
                  !drawerSelectedUserId)
              }
              title={
                actionDrawer.type === 'org_review' &&
                actionDrawer.itemData?.isRequestedByMember &&
                !drawerSelectedUserId
                  ? (isBn
                      ? 'অনুমোদন নিশ্চিত করতে ড্রয়ার থেকে ইউজার নির্বাচন করুন'
                      : 'Select an organization user first')
                  : ''
              }
              onClick={() => handleExecuteAction('approve')}
            >
              <CheckCircle2 size={16} />
              {actionLoading
                ? (isBn ? 'প্রসেসিং হচ্ছে...' : 'Processing...')
                : actionDrawer.type === 'org_review' && actionDrawer.itemData?.isRequestedByMember
                ? !drawerSelectedUserId
                  ? (isBn ? 'ইউজার নির্বাচন আবশ্যক' : 'Select User Required')
                  : (isBn ? 'ইউজার এসাইন ও অনুমোদন' : 'Assign User & Approve')
                : (isBn ? 'অনুমোদন নিশ্চিত করুন' : 'Confirm Approval')}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default AdminActionDrawer;
