'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  ShieldAlert,
  Users,
  Building2,
  GraduationCap,
  Heart,
  DollarSign,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Edit,
  FileCheck,
  HelpCircle,
  AlertTriangle,
} from 'lucide-react';
import {
  PermissionModuleKey,
  UserRole,
  ModulePermission,
} from '@sadaqahbd/schema';

// Mock active user (in production, populated via AuthContext / Firebase token claim)
const currentAdminUser: {
  id: string;
  fullName: string;
  role: string;
  permissions: ModulePermission[];
} = {
  id: 'admin-current-user',
  fullName: 'সুপার এডমিন ইউজার',
  role: UserRole.SUPER_ADMIN,
  // Simulated permissions granted to this admin:
  permissions: [
    { moduleKey: PermissionModuleKey.SUPER_ADMIN_LIST, canView: true, canEdit: true, canDelete: true, canApprove: true },
    { moduleKey: PermissionModuleKey.ADMIN_LIST, canView: true, canEdit: true, canDelete: true, canApprove: true },
    { moduleKey: PermissionModuleKey.ORG_VERIFICATION_REQUESTS, canView: true, canEdit: true, canDelete: true, canApprove: true },
    { moduleKey: PermissionModuleKey.ORG_LIST, canView: true, canEdit: true, canDelete: true, canApprove: true },
    { moduleKey: PermissionModuleKey.TEACHER_LIST, canView: true, canEdit: true, canDelete: false, canApprove: true },
    { moduleKey: PermissionModuleKey.STUDENT_LIST, canView: true, canEdit: true, canDelete: false, canApprove: true },
    { moduleKey: PermissionModuleKey.TEACHER_VERIFICATION_REQUESTS, canView: true, canEdit: false, canDelete: false, canApprove: true },
    { moduleKey: PermissionModuleKey.STUDENT_VERIFICATION_REQUESTS, canView: true, canEdit: false, canDelete: false, canApprove: true },
    { moduleKey: PermissionModuleKey.STUDENT_POST_VERIFICATION_REQUESTS, canView: true, canEdit: true, canDelete: true, canApprove: true },
    { moduleKey: PermissionModuleKey.DONOR_PROFILE, canView: true, canEdit: false, canDelete: false, canApprove: false },
    { moduleKey: PermissionModuleKey.ACCOUNTS_DONATION_APPROVAL, canView: true, canEdit: true, canDelete: false, canApprove: true },
  ],
};

export default function AdminDashboardPage() {
  const t = useTranslations('Admin');
  const tCommon = useTranslations('Common');

  const [activeTab, setActiveTab] = useState<string>('users');
  const [activeSubTab, setActiveSubTab] = useState<string>('super_admins');

  // Confirmation Modal state for Accept / Reject
  const [modalAction, setModalAction] = useState<{
    isOpen: boolean;
    type: 'accept' | 'reject';
    targetId: string;
    targetTitle: string;
    reason: string;
  }>({
    isOpen: false,
    type: 'accept',
    targetId: '',
    targetTitle: '',
    reason: '',
  });

  // Check user permission helper
  const getPermission = (key: string) => {
    return (
      currentAdminUser.permissions.find((p) => p.moduleKey === key) || {
        canView: false,
        canEdit: false,
        canDelete: false,
        canApprove: false,
      }
    );
  };

  // Mock initial dataset for Admin operations
  const [superAdmins, setSuperAdmins] = useState([
    { id: 'sa-1', name: 'আব্দুল করিম', email: 'karim@sadaqahbd.com', phone: '01711000001', role: 'super_admin' },
    { id: 'sa-2', name: 'তাসলিমা জাহান', email: 'taslima@sadaqahbd.com', phone: '01811000002', role: 'super_admin' },
  ]);

  const [orgVerificationRequests, setOrgVerificationRequests] = useState([
    { id: 'org-req-1', name: 'ঢাকা রেসিডেন্সিয়াল মডেল কলেজ', regNo: 'REG-5481', contact: 'প্রিন্সিপাল অফিস', phone: '01911000003', status: 'pending' },
    { id: 'org-req-2', name: 'কুমিল্লা ভিক্টোরিয়া সরকারি কলেজ', regNo: 'REG-8921', contact: 'প্রফেসর ড. আহমেদ', phone: '01611000004', status: 'pending' },
  ]);

  const [studentPostRequests, setStudentPostRequests] = useState([
    {
      id: 'post-req-1',
      studentName: 'রাফিয়া আক্তার',
      institution: 'ময়মনসিংহ মেডিকেল কলেজ',
      title: 'মেডিকেল ৪র্থ বর্ষের টিউশন ও হোস্টেল ফি',
      amount: 45000,
      teacherVerified: true,
      orgVerified: true,
      status: 'pending_super_admin',
    },
    {
      id: 'post-req-2',
      studentName: 'মো. ফাহিম হাসান',
      institution: 'বুয়েট',
      title: 'কম্পিউটার সায়েন্স ৩য় বর্ষের বই ও ল্যাপটপ মেরামত খরচ',
      amount: 18000,
      teacherVerified: true,
      orgVerified: true,
      status: 'pending_super_admin',
    },
  ]);

  const [pendingDonations, setPendingDonations] = useState([
    { id: 'don-1', donorName: 'রেহানা পারভীন', amount: 5000, type: 'random', method: 'bKash', trxId: 'TRX987214', status: 'pending' },
    { id: 'don-2', donorName: 'মুহাম্মদ শাকিল', amount: 15000, type: 'direct', studentName: 'রাফিয়া আক্তার', method: 'Bank', trxId: 'TRX451298', status: 'pending' },
  ]);

  // Handle confirmation modal submission
  const handleConfirmAction = () => {
    if (modalAction.type === 'accept') {
      // Approve item
      if (modalAction.targetId.startsWith('org-req-')) {
        setOrgVerificationRequests((prev) => prev.filter((item) => item.id !== modalAction.targetId));
      } else if (modalAction.targetId.startsWith('post-req-')) {
        setStudentPostRequests((prev) => prev.filter((item) => item.id !== modalAction.targetId));
      } else if (modalAction.targetId.startsWith('don-')) {
        setPendingDonations((prev) => prev.filter((item) => item.id !== modalAction.targetId));
      }
    } else {
      // Reject item with reason
      if (modalAction.targetId.startsWith('org-req-')) {
        setOrgVerificationRequests((prev) => prev.filter((item) => item.id !== modalAction.targetId));
      } else if (modalAction.targetId.startsWith('post-req-')) {
        setStudentPostRequests((prev) => prev.filter((item) => item.id !== modalAction.targetId));
      } else if (modalAction.targetId.startsWith('don-')) {
        setPendingDonations((prev) => prev.filter((item) => item.id !== modalAction.targetId));
      }
    }

    setModalAction({ isOpen: false, type: 'accept', targetId: '', targetTitle: '', reason: '' });
  };

  return (
    <div className="container" style={{ paddingTop: "2rem", paddingBottom: "5rem" }}>
      {/* Page Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.85rem", fontWeight: "800", color: "var(--color-primary-dark)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <ShieldAlert size={28} color="var(--color-primary)" />
          {t("title")}
        </h1>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.95rem" }}>
          লগইনকৃত এডমিন: <strong>{currentAdminUser.fullName}</strong> ({currentAdminUser.role})
        </p>
      </div>

      {/* Main Module Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", borderBottom: "1px solid var(--color-border)", paddingBottom: "0.75rem", marginBottom: "1.75rem" }}>
        {getPermission(PermissionModuleKey.SUPER_ADMIN_LIST).canView && (
          <button
            onClick={() => { setActiveTab('users'); setActiveSubTab('super_admins'); }}
            className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: "0.5rem 1rem", fontSize: "0.9rem" }}
          >
            <Users size={16} /> ১. ইউজার ম্যানেজমেন্ট (এডমিন)
          </button>
        )}

        {getPermission(PermissionModuleKey.TEACHER_LIST).canView && (
          <button
            onClick={() => { setActiveTab('orgs'); setActiveSubTab('posts_verify'); }}
            className={`btn ${activeTab === 'orgs' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: "0.5rem 1rem", fontSize: "0.9rem" }}
          >
            <Building2 size={16} /> ২. অর্গানাইজেশন ম্যানেজমেন্ট (সাধারণ)
          </button>
        )}

        {getPermission(PermissionModuleKey.DONOR_PROFILE).canView && (
          <button
            onClick={() => { setActiveTab('donors'); setActiveSubTab('donor_list'); }}
            className={`btn ${activeTab === 'donors' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: "0.5rem 1rem", fontSize: "0.9rem" }}
          >
            <Heart size={16} /> ৩. ডোনার তালিকা
          </button>
        )}

        {getPermission(PermissionModuleKey.ACCOUNTS_DONATION_APPROVAL).canView && currentAdminUser.role !== UserRole.ADMIN && (
          <button
            onClick={() => { setActiveTab('accounts'); setActiveSubTab('donations_verify'); }}
            className={`btn ${activeTab === 'accounts' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: "0.5rem 1rem", fontSize: "0.9rem" }}
          >
            <DollarSign size={16} /> ৪. একাউন্টস ও ফান্ড ম্যানেজমেন্ট
          </button>
        )}
      </div>

      {/* Tab 1: User Management */}
      {activeTab === 'users' && (
        <div>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
            <button
              onClick={() => setActiveSubTab('super_admins')}
              style={{
                padding: "0.4rem 0.8rem",
                borderRadius: "var(--radius-sm)",
                border: "none",
                backgroundColor: activeSubTab === 'super_admins' ? 'var(--color-primary)' : 'var(--color-surface)',
                color: activeSubTab === 'super_admins' ? 'white' : 'var(--color-text)',
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "0.85rem",
              }}
            >
              ১.১ {t("superAdminList")}
            </button>
            <button
              onClick={() => setActiveSubTab('org_requests')}
              style={{
                padding: "0.4rem 0.8rem",
                borderRadius: "var(--radius-sm)",
                border: "none",
                backgroundColor: activeSubTab === 'org_requests' ? 'var(--color-primary)' : 'var(--color-surface)',
                color: activeSubTab === 'org_requests' ? 'white' : 'var(--color-text)',
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "0.85rem",
              }}
            >
              ১.৩ {t("orgVerificationReq")} ({orgVerificationRequests.length})
            </button>
          </div>

          {activeSubTab === 'super_admins' && (
            <div className="card" style={{ padding: "1.5rem", backgroundColor: "var(--color-surface)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h3 style={{ fontSize: "1.15rem", fontWeight: "700" }}>{t("superAdminList")}</h3>
                {getPermission(PermissionModuleKey.SUPER_ADMIN_LIST).canEdit && (
                  <button className="btn btn-primary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}>
                    <Plus size={16} /> নতুন সুপার এডমিন যোগ করুন
                  </button>
                )}
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--color-border)", textAlign: "left" }}>
                      <th style={{ padding: "0.75rem" }}>নাম</th>
                      <th style={{ padding: "0.75rem" }}>ইমেইল</th>
                      <th style={{ padding: "0.75rem" }}>ফোন</th>
                      <th style={{ padding: "0.75rem", textAlign: "right" }}>অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody>
                    {superAdmins.map((admin) => (
                      <tr key={admin.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                        <td style={{ padding: "0.75rem", fontWeight: "600" }}>{admin.name}</td>
                        <td style={{ padding: "0.75rem" }}>{admin.email}</td>
                        <td style={{ padding: "0.75rem" }}>{admin.phone}</td>
                        <td style={{ padding: "0.75rem", textAlign: "right" }}>
                          {getPermission(PermissionModuleKey.SUPER_ADMIN_LIST).canEdit && (
                            <button className="btn btn-outline" style={{ padding: "0.3rem 0.5rem", marginRight: "0.5rem" }}>
                              <Edit size={14} />
                            </button>
                          )}
                          {getPermission(PermissionModuleKey.SUPER_ADMIN_LIST).canDelete && (
                            <button
                              className="btn btn-outline"
                              style={{ padding: "0.3rem 0.5rem", color: "var(--color-accent)", borderColor: "var(--color-accent)" }}
                              onClick={() => setSuperAdmins((prev) => prev.filter((a) => a.id !== admin.id))}
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
          )}

          {activeSubTab === 'org_requests' && (
            <div className="card" style={{ padding: "1.5rem", backgroundColor: "var(--color-surface)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
              <h3 style={{ fontSize: "1.15rem", fontWeight: "700", marginBottom: "1rem" }}>{t("orgVerificationReq")}</h3>
              {orgVerificationRequests.length === 0 ? (
                <p style={{ color: "var(--color-text-muted)" }}>কোনো নতুন রিকোয়েস্ট পেন্ডিং নেই।</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {orgVerificationRequests.map((org) => (
                    <div
                      key={org.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "1rem",
                        backgroundColor: "var(--color-bg)",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--color-border)",
                      }}
                    >
                      <div>
                        <h4 style={{ fontWeight: "700", fontSize: "1rem", marginBottom: "0.2rem" }}>{org.name}</h4>
                        <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                          রেজিস্ট্রেশন: {org.regNo} | যোগাযোগ: {org.contact} ({org.phone})
                        </p>
                      </div>

                      {getPermission(PermissionModuleKey.ORG_VERIFICATION_REQUESTS).canApprove && (
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button
                            className="btn btn-primary"
                            style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}
                            onClick={() =>
                              setModalAction({
                                isOpen: true,
                                type: 'accept',
                                targetId: org.id,
                                targetTitle: org.name,
                                reason: '',
                              })
                            }
                          >
                            <CheckCircle2 size={16} /> {tCommon("accept")}
                          </button>
                          <button
                            className="btn btn-outline"
                            style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem", color: "var(--color-accent)", borderColor: "var(--color-accent)" }}
                            onClick={() =>
                              setModalAction({
                                isOpen: true,
                                type: 'reject',
                                targetId: org.id,
                                targetTitle: org.name,
                                reason: '',
                              })
                            }
                          >
                            <XCircle size={16} /> {tCommon("reject")}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Organization Management (Student Posts Approval) */}
      {activeTab === 'orgs' && (
        <div>
          <div className="card" style={{ padding: "1.5rem", backgroundColor: "var(--color-surface)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
            <h3 style={{ fontSize: "1.15rem", fontWeight: "700", marginBottom: "0.5rem" }}>
              ২.৫ {t("postVerificationReq")}
            </h3>
            <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", marginBottom: "1.25rem" }}>
              প্রতিষ্ঠান ও শিক্ষক কর্তৃক ডাবল ভেরিফাইড পোস্টসমূহ। সুপার এডমিনের চূড়ান্ত অনুমোদন পেলে পোস্ট লাইভ হবে।
            </p>

            {studentPostRequests.length === 0 ? (
              <p style={{ color: "var(--color-text-muted)" }}>কোনো পোস্ট অনুমোদনের অপেক্ষায় নেই।</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {studentPostRequests.map((post) => (
                  <div
                    key={post.id}
                    style={{
                      padding: "1.25rem",
                      backgroundColor: "var(--color-bg)",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                      <div>
                        <h4 style={{ fontWeight: "700", fontSize: "1.05rem", color: "var(--color-primary-dark)" }}>
                          {post.title}
                        </h4>
                        <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                          শিক্ষার্থী: <strong>{post.studentName}</strong> | প্রতিষ্ঠান: <strong>{post.institution}</strong>
                        </p>
                      </div>
                      <span style={{ fontWeight: "800", color: "var(--color-primary)", fontSize: "1.1rem" }}>
                        ৳{post.amount.toLocaleString()}
                      </span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem" }}>
                      <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.8rem" }}>
                        <span style={{ padding: "0.2rem 0.5rem", backgroundColor: "rgba(13, 148, 136, 0.12)", color: "var(--color-primary)", borderRadius: "4px" }}>
                          ✓ শিক্ষক কর্তৃক যাচাইকৃত
                        </span>
                        <span style={{ padding: "0.2rem 0.5rem", backgroundColor: "rgba(13, 148, 136, 0.12)", color: "var(--color-primary)", borderRadius: "4px" }}>
                          ✓ প্রতিষ্ঠান কর্তৃক যাচাইকৃত
                        </span>
                      </div>

                      {getPermission(PermissionModuleKey.STUDENT_POST_VERIFICATION_REQUESTS).canApprove && (
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button
                            className="btn btn-primary"
                            style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}
                            onClick={() =>
                              setModalAction({
                                isOpen: true,
                                type: 'accept',
                                targetId: post.id,
                                targetTitle: `${post.title} (${post.studentName})`,
                                reason: '',
                              })
                            }
                          >
                            <CheckCircle2 size={16} /> পোস্ট লাইভ করুন
                          </button>
                          <button
                            className="btn btn-outline"
                            style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem", color: "var(--color-accent)", borderColor: "var(--color-accent)" }}
                            onClick={() =>
                              setModalAction({
                                isOpen: true,
                                type: 'reject',
                                targetId: post.id,
                                targetTitle: post.title,
                                reason: '',
                              })
                            }
                          >
                            <XCircle size={16} /> প্রত্যাখ্যান
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Donor List */}
      {activeTab === 'donors' && (
        <div className="card" style={{ padding: "1.5rem", backgroundColor: "var(--color-surface)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
          <h3 style={{ fontSize: "1.15rem", fontWeight: "700", marginBottom: "1rem" }}>{t("donorList")}</h3>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
            প্ল্যাটফর্মের নিবন্ধিত ডোনারদের প্রোফাইল ও সর্বমোট প্রদত্ত অনুদানের বিবরণ।
          </p>
        </div>
      )}

      {/* Tab 4: Accounts & Donation Approvals */}
      {activeTab === 'accounts' && (
        <div className="card" style={{ padding: "1.5rem", backgroundColor: "var(--color-surface)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
          <h3 style={{ fontSize: "1.15rem", fontWeight: "700", marginBottom: "0.5rem" }}>{t("accountsManagement")}</h3>
          <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", marginBottom: "1.25rem" }}>
            সরাসরি ও র্যান্ডম অনুদানের ট্রানজেকশন যাচাই ও অনুমোদন। (সাধারণ এডমিনের জন্য অ্যাক্সেস প্রযোজ্য নয়)
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {pendingDonations.map((don) => (
              <div
                key={don.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "1rem",
                  backgroundColor: "var(--color-bg)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.2rem" }}>
                    <span style={{ fontWeight: "700", fontSize: "1rem" }}>{don.donorName}</span>
                    <span style={{ fontSize: "0.75rem", padding: "0.15rem 0.4rem", borderRadius: "4px", backgroundColor: don.type === 'random' ? 'rgba(13, 148, 136, 0.15)' : 'rgba(59, 130, 246, 0.15)' }}>
                      {don.type === 'random' ? 'র্যান্ডম ফান্ড' : `সরাসরি: ${don.studentName}`}
                    </span>
                  </div>
                  <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                    মাধ্যম: {don.method} | ট্রানজেকশন আইডি: <code>{don.trxId}</code>
                  </p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
                  <span style={{ fontWeight: "800", color: "var(--color-primary)", fontSize: "1.15rem" }}>
                    ৳{don.amount.toLocaleString()}
                  </span>

                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      className="btn btn-primary"
                      style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}
                      onClick={() =>
                        setModalAction({
                          isOpen: true,
                          type: 'accept',
                          targetId: don.id,
                          targetTitle: `অনুদান: ৳${don.amount} (${don.donorName})`,
                          reason: '',
                        })
                      }
                    >
                      <CheckCircle2 size={16} /> অনুমোদন
                    </button>
                    <button
                      className="btn btn-outline"
                      style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem", color: "var(--color-accent)", borderColor: "var(--color-accent)" }}
                      onClick={() =>
                        setModalAction({
                          isOpen: true,
                          type: 'reject',
                          targetId: don.id,
                          targetTitle: `অনুদান: ৳${don.amount}`,
                          reason: '',
                        })
                      }
                    >
                      <XCircle size={16} /> বাতিল
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation & Rejection Reason Modal */}
      {modalAction.isOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "1rem",
          }}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: "500px",
              padding: "2rem",
              borderRadius: "var(--radius-lg)",
              backgroundColor: "var(--color-surface)",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
              {modalAction.type === 'accept' ? (
                <CheckCircle2 size={24} color="var(--color-primary)" />
              ) : (
                <AlertTriangle size={24} color="var(--color-accent)" />
              )}
              <h3 style={{ fontSize: "1.25rem", fontWeight: "700" }}>
                {modalAction.type === 'accept' ? 'অনুমোদন নিশ্চিতকরণ' : 'প্রত্যাখ্যান নিশ্চিতকরণ'}
              </h3>
            </div>

            <p style={{ color: "var(--color-text)", marginBottom: "1rem", fontSize: "0.95rem" }}>
              আপনি কি নিশ্চিতভাবে <strong>"{modalAction.targetTitle}"</strong> {modalAction.type === 'accept' ? 'অনুমোদন' : 'প্রত্যাখ্যান'} করতে চান?
            </p>

            {modalAction.type === 'reject' && (
              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "0.4rem" }}>
                  {t("rejectReason")} (বাধ্যতামূলক):
                </label>
                <textarea
                  rows={3}
                  value={modalAction.reason}
                  onChange={(e) => setModalAction((prev) => ({ ...prev, reason: e.target.value }))}
                  placeholder="যেমন: তথ্যের অসংগতি অথবা অস্পষ্ট সংযুক্তি..."
                  style={{
                    width: "100%",
                    padding: "0.6rem",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--color-border)",
                    fontFamily: "inherit",
                    fontSize: "0.9rem",
                  }}
                />
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button
                className="btn btn-outline"
                onClick={() => setModalAction({ isOpen: false, type: 'accept', targetId: '', targetTitle: '', reason: '' })}
              >
                {tCommon("cancel")}
              </button>
              <button
                className={`btn ${modalAction.type === 'accept' ? 'btn-primary' : 'btn-outline'}`}
                style={modalAction.type === 'reject' ? { color: "var(--color-accent)", borderColor: "var(--color-accent)" } : {}}
                onClick={handleConfirmAction}
              >
                {tCommon("confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
