'use client';

import React from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { PermissionModuleKey } from '@sadaqahbd/schema';
import OverviewTab from './tabs/OverviewTab';
import SuperAdminsTab from './tabs/SuperAdminsTab';
import AllUsersTab from './tabs/AllUsersTab';
import AllOrganizationsTab from './tabs/AllOrganizationsTab';
import AllStudentsTab from './tabs/AllStudentsTab';
import AllTeachersTab from './tabs/AllTeachersTab';
import OrgRequestsTab from './tabs/OrgRequestsTab';
import StudentPostsTab from './tabs/StudentPostsTab';
import AffiliationRequestsTab from './tabs/AffiliationRequestsTab';
import TransferRequestsTab from './tabs/TransferRequestsTab';
import DonorsTab from './tabs/DonorsTab';
import PendingDonationsTab from './tabs/PendingDonationsTab';
import ItemDonationsTab from './tabs/ItemDonationsTab';
import FundAllocationTab from './tabs/FundAllocationTab';
import AppsPrivilegeTab from './tabs/AppsPrivilegeTab';
import SmsPackagesTab from './tabs/SmsPackagesTab';
import StudentPhoneExemptionsTab from './tabs/StudentPhoneExemptionsTab';
import MyDonationsSection from '@/components/portal/MyDonationsSection';
import styles from '../admin.module.css';

export interface AdminTabRouterProps {
  activeNav: string;
  setActiveNav: (nav: string) => void;
  feedbackMsg: string;
  setFeedbackMsg: (msg: string) => void;
  isBn: boolean;
  loadingData: boolean;
  loadAdminData: (isSilent?: boolean) => void;
  t: any;
  user: any;
  canAccessFundAllocation?: boolean;
  canEditFundAllocation?: boolean;
  ledgerStats?: any;
  superAdmins: any[];
  allUsers: any[];
  orgVerificationRequests: any[];
  orgRequestsHistory: any[];
  studentPostRequests: any[];
  studentPostHistory: any[];
  pendingDonations: any[];
  donationsHistory: any[];
  itemDonationsList: any[];
  adminPendingAffiliations: { teachers: any[]; students: any[] };
  adminAffiliationsHistory: { teachers: any[]; students: any[] };
  adminTransferRequests: { actionable: any[]; monitoring: any[]; history: any[] };
  donorsList: any[];
  removalRequests: any[];
  actionLoading: boolean;

  getPermission: (key: string) => { canView: boolean; canEdit: boolean };
  resetAdminForm: () => void;
  setActionDrawer: React.Dispatch<React.SetStateAction<any>>;
  handleOpenEditPermissions: (adminUser: any) => void;
  handleDeleteSuperAdmin: (id: string, name: string) => Promise<void>;
  setAdminInspectionUserId: (id: string | null) => void;
  handleToggleUserStatus: (userId: string, targetStatus: 'active' | 'suspended', userName: string) => Promise<void>;
  handleDeleteUser: (userId: string, userName: string) => Promise<void>;
  openAssignOrgModal: (orgId: string, orgName: string) => Promise<void>;
  setSelectedOrgMembersId: (id: string | null) => void;
  setSelectedOrgMembersName: (name: string) => void;
  setSelectedStudentDetailsId: (id: string | null) => void;
  setSelectedDonorDetailsId: (id: string | null) => void;
  getOrganizationTypeLabel: (type: string, isBn: boolean) => string;
  handleOpenOrgReview: (org: any, isReadOnly?: boolean) => Promise<void>;
  handleOpenPostReview: (post: any, isReadOnly?: boolean) => void;
  handleOpenDonationReview: (don: any, isReadOnly?: boolean) => void;
  handleOpenItemDonationReview: (item: any, isReadOnly?: boolean) => void;
  handleReviewMemberRemoval: (removalId: string, approved: boolean, reason?: string) => Promise<void>;
}

export function AdminTabRouter({
  activeNav,
  setActiveNav,
  feedbackMsg,
  setFeedbackMsg,
  isBn,
  loadingData,
  loadAdminData,
  t,
  user,
  canAccessFundAllocation = false,
  canEditFundAllocation = false,
  ledgerStats,
  superAdmins,
  allUsers,
  orgVerificationRequests,
  orgRequestsHistory,
  studentPostRequests,
  studentPostHistory,
  pendingDonations,
  donationsHistory,
  itemDonationsList,
  adminPendingAffiliations,
  adminAffiliationsHistory,
  adminTransferRequests,
  donorsList,
  removalRequests,
  actionLoading,

  getPermission,
  resetAdminForm,
  setActionDrawer,
  handleOpenEditPermissions,
  handleDeleteSuperAdmin,
  setAdminInspectionUserId,
  handleToggleUserStatus,
  handleDeleteUser,
  openAssignOrgModal,
  setSelectedOrgMembersId,
  setSelectedOrgMembersName,
  setSelectedStudentDetailsId,
  setSelectedDonorDetailsId,
  getOrganizationTypeLabel,
  handleOpenOrgReview,
  handleOpenPostReview,
  handleOpenDonationReview,
  handleOpenItemDonationReview,
  handleReviewMemberRemoval,
}: AdminTabRouterProps) {
  return (
    <main className={styles.mainContent}>
      {/* Feedback Alert */}
      {feedbackMsg && (
        <div
          style={{
            padding: '0.85rem 1.25rem',
            backgroundColor: '#ecfdf5',
            border: '1px solid #10b981',
            color: '#047857',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontWeight: 600,
            fontSize: '0.9rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={18} />
            <span>{feedbackMsg}</span>
          </div>
          <button
            onClick={() => setFeedbackMsg('')}
            style={{ background: 'none', border: 'none', color: '#047857', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* VIEW 1: Overview Dashboard */}
      {activeNav === 'overview' && (
        <OverviewTab
          isBn={isBn}
          loadingData={loadingData}
          loadAdminData={loadAdminData}
          setActiveNav={setActiveNav}
          orgVerificationRequests={orgVerificationRequests}
          adminPendingAffiliations={adminPendingAffiliations}
          studentPostRequests={studentPostRequests}
          pendingDonations={pendingDonations}
          itemDonationsList={itemDonationsList}
          superAdmins={superAdmins}
          ledgerStats={ledgerStats}
          adminTransferRequests={adminTransferRequests}
          allUsers={allUsers}
          donorsList={donorsList}
          donationsHistory={donationsHistory}
          canAccessFundAllocation={canAccessFundAllocation}
          canEditFundAllocation={canEditFundAllocation}
          currentUser={user}
        />
      )}

      {/* VIEW 2: Super Admin List */}
      {activeNav === 'super_admins' && (
        <SuperAdminsTab
          superAdmins={superAdmins}
          loadingData={loadingData}
          isBn={isBn}
          t={t}
          user={user}
          canEdit={getPermission(PermissionModuleKey.SUPER_ADMIN_LIST).canEdit}
          onOpenAddAdmin={() => {
            resetAdminForm();
            setActionDrawer({
              isOpen: true,
              type: 'add_super_admin',
              itemData: {},
              reason: '',
            });
          }}
          onOpenEditPermissions={handleOpenEditPermissions}
          onDeleteAdmin={handleDeleteSuperAdmin}
        />
      )}

      {/* VIEW 2.5: Universal Users Directory & Audit */}
      {activeNav === 'all_users' && (
        <AllUsersTab
          allUsers={allUsers}
          loadingData={loadingData}
          isBn={isBn}
          currentUser={user}
          onInspectUser={setAdminInspectionUserId}
          onToggleUserStatus={handleToggleUserStatus}
          onDeleteUser={handleDeleteUser}
          loadAdminData={loadAdminData}
        />
      )}

      {/* VIEW: All Organizations Directory */}
      {activeNav === 'all_organizations' && (
        <AllOrganizationsTab
          isBn={isBn}
          orgRequestsHistory={orgRequestsHistory}
          orgVerificationRequests={orgVerificationRequests}
          allUsers={allUsers}
          getOrganizationTypeLabel={getOrganizationTypeLabel}
          setSelectedOrgMembersId={setSelectedOrgMembersId}
          setSelectedOrgMembersName={setSelectedOrgMembersName}
          openAssignOrgModal={openAssignOrgModal}
          setAdminInspectionUserId={setAdminInspectionUserId}
        />
      )}

      {/* VIEW: All Students Directory */}
      {activeNav === 'all_students' && (
        <AllStudentsTab
          isBn={isBn}
          allUsers={allUsers}
          setAdminInspectionUserId={setAdminInspectionUserId}
          handleToggleUserStatus={handleToggleUserStatus}
        />
      )}

      {/* VIEW: All Teachers Directory */}
      {activeNav === 'all_teachers' && (
        <AllTeachersTab
          isBn={isBn}
          allUsers={allUsers}
          setAdminInspectionUserId={setAdminInspectionUserId}
          handleToggleUserStatus={handleToggleUserStatus}
        />
      )}

      {/* VIEW 3: Org Verification Requests */}
      {activeNav === 'org_requests' && (
        <OrgRequestsTab
          isBn={isBn}
          loadingData={loadingData}
          orgVerificationRequests={orgVerificationRequests}
          orgRequestsHistory={orgRequestsHistory}
          getOrganizationTypeLabel={getOrganizationTypeLabel}
          setSelectedOrgMembersId={setSelectedOrgMembersId}
          setSelectedOrgMembersName={setSelectedOrgMembersName}
          handleOpenOrgReview={handleOpenOrgReview}
        />
      )}

      {/* VIEW 4: Student Posts Verification */}
      {activeNav === 'student_posts' && (
        <StudentPostsTab
          isBn={isBn}
          loadingData={loadingData}
          studentPostRequests={studentPostRequests}
          studentPostHistory={studentPostHistory}
          handleOpenPostReview={handleOpenPostReview}
          setSelectedStudentDetailsId={setSelectedStudentDetailsId}
        />
      )}

      {/* VIEW: Affiliation Final Clearances */}
      {activeNav === 'affiliation_requests' && (
        <AffiliationRequestsTab
          isBn={isBn}
          adminPendingAffiliations={adminPendingAffiliations}
          adminAffiliationsHistory={adminAffiliationsHistory}
          removalRequests={removalRequests}
          actionLoading={actionLoading}
          onOpenAffiliationReview={(itemData) =>
            setActionDrawer({
              isOpen: true,
              type: 'affiliation_review',
              itemData,
              reason: '',
            })
          }
          setSelectedStudentDetailsId={setSelectedStudentDetailsId}
          setAdminInspectionUserId={setAdminInspectionUserId}
          handleReviewMemberRemoval={handleReviewMemberRemoval}
        />
      )}

      {/* VIEW: Institution Transfer Requests */}
      {activeNav === 'transfer_requests' && (
        <TransferRequestsTab
          isBn={isBn}
          adminTransferRequests={adminTransferRequests}
          onOpenTransferReview={(itemData, isReadOnly) =>
            setActionDrawer({
              isOpen: true,
              type: 'transfer_review',
              itemData,
              reason: '',
              isReadOnly,
            })
          }
        />
      )}

      {/* VIEW 5: Donors & Donations Directory */}
      {(activeNav === 'donors' || activeNav === 'all_donors') && (
        <DonorsTab
          isBn={isBn}
          donorsList={donorsList}
          loadingData={loadingData}
          setSelectedDonorDetailsId={setSelectedDonorDetailsId}
        />
      )}

      {/* VIEW 6: Financial Donations Verification & Clearance History */}
      {activeNav === 'pending_donations' && (
        <PendingDonationsTab
          isBn={isBn}
          loadingData={loadingData}
          pendingDonations={pendingDonations}
          donationsHistory={donationsHistory}
          handleOpenDonationReview={handleOpenDonationReview}
        />
      )}

      {/* VIEW 7: Item Donations Verification & Clearance History */}
      {activeNav === 'item_donations' && (
        <ItemDonationsTab
          isBn={isBn}
          loadingData={loadingData}
          itemDonationsList={itemDonationsList}
          handleOpenItemDonationReview={handleOpenItemDonationReview}
        />
      )}

      {/* VIEW 8: Fund Allocation (Master Admin & Super Admins with permission) */}
      {activeNav === 'fund_allocation' && canAccessFundAllocation && (
        <FundAllocationTab
          isBn={isBn}
          canEdit={canEditFundAllocation}
          setFeedbackMsg={setFeedbackMsg}
        />
      )}

      {/* VIEW 9: My Donations (Personal Activity) */}
      {(activeNav === 'my_donations' || activeNav === 'my-donations') && (
        <div style={{ marginTop: '0.5rem' }}>
          <MyDonationsSection />
        </div>
      )}

      {/* VIEW 10: Apps Privilege (Master Admin & Permitted Super Admins) */}
      {activeNav === 'apps_privilege' && (
        <AppsPrivilegeTab isBn={isBn} user={user} />
      )}

      {/* VIEW 11: SMS Packages & Meter (Master Admin & Permitted Super Admins) */}
      {activeNav === 'sms_packages' && (
        <SmsPackagesTab isBn={isBn} user={user} />
      )}

      {/* VIEW 12: Student Phone Exemption Clearances */}
      {activeNav === 'phone_exemptions' && (
        <StudentPhoneExemptionsTab
          isBn={isBn}
          user={user}
          onRefreshCount={() => loadAdminData(true)}
        />
      )}
    </main>
  );
}

export default AdminTabRouter;
