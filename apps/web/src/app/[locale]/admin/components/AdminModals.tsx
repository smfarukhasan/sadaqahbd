'use client';

import React from 'react';
import StudentDetailsModal from '@/components/portal/StudentDetailsModal';
import OrgMembersModal from '@/components/portal/OrgMembersModal';
import DonorDetailsModal from '@/components/portal/DonorDetailsModal';
import AdminUserDetailsModal from '@/components/portal/AdminUserDetailsModal';
import AssignOrgModal from './AssignOrgModal';

export interface AssignOrgModalState {
  isOpen: boolean;
  orgId: string;
  orgName: string;
  unassignedUsers: any[];
  selectedUserId: string;
  loading: boolean;
  confirmPopup: boolean;
}

export interface AdminModalsProps {
  selectedStudentDetailsId: string | null;
  setSelectedStudentDetailsId: (id: string | null) => void;
  selectedOrgMembersId: string | null;
  selectedOrgMembersName: string;
  setSelectedOrgMembersId: (id: string | null) => void;
  setSelectedOrgMembersName: (name: string) => void;
  selectedDonorDetailsId: string | null;
  setSelectedDonorDetailsId: (id: string | null) => void;
  adminInspectionUserId: string | null;
  setAdminInspectionUserId: (id: string | null) => void;
  loadAdminData: (isSilent?: boolean) => void;
  assignOrgModal: AssignOrgModalState;
  setAssignOrgModal: React.Dispatch<React.SetStateAction<AssignOrgModalState>>;
  handleConfirmAssignOrg: () => Promise<void>;
  isBn: boolean;
}

export function AdminModals({
  selectedStudentDetailsId,
  setSelectedStudentDetailsId,
  selectedOrgMembersId,
  selectedOrgMembersName,
  setSelectedOrgMembersId,
  setSelectedOrgMembersName,
  selectedDonorDetailsId,
  setSelectedDonorDetailsId,
  adminInspectionUserId,
  setAdminInspectionUserId,
  loadAdminData,
  assignOrgModal,
  setAssignOrgModal,
  handleConfirmAssignOrg,
  isBn,
}: AdminModalsProps) {
  return (
    <>
      {/* Student Details Modal */}
      <StudentDetailsModal
        isOpen={!!selectedStudentDetailsId}
        studentId={selectedStudentDetailsId}
        onClose={() => setSelectedStudentDetailsId(null)}
        isBn={isBn}
      />

      {/* Org Members Modal */}
      <OrgMembersModal
        isOpen={!!selectedOrgMembersId}
        orgId={selectedOrgMembersId}
        orgName={selectedOrgMembersName}
        onClose={() => {
          setSelectedOrgMembersId(null);
          setSelectedOrgMembersName('');
        }}
        isBn={isBn}
      />

      {/* Donor Details Modal */}
      <DonorDetailsModal
        isOpen={!!selectedDonorDetailsId}
        donorId={selectedDonorDetailsId}
        onClose={() => setSelectedDonorDetailsId(null)}
        isBn={isBn}
      />

      {/* Universal Admin User Details Modal */}
      <AdminUserDetailsModal
        isOpen={!!adminInspectionUserId}
        userId={adminInspectionUserId}
        onClose={() => setAdminInspectionUserId(null)}
        isBn={isBn}
        onStatusUpdated={() => loadAdminData(true)}
      />

      {/* Member-Proposed Organization Authority Binding Modal */}
      <AssignOrgModal
        isOpen={assignOrgModal.isOpen}
        loading={assignOrgModal.loading}
        confirmPopup={assignOrgModal.confirmPopup}
        orgName={assignOrgModal.orgName}
        selectedUserId={assignOrgModal.selectedUserId}
        unassignedUsers={assignOrgModal.unassignedUsers}
        isBn={isBn}
        onClose={() => setAssignOrgModal((prev) => ({ ...prev, isOpen: false, confirmPopup: false }))}
        onSelectUser={(userId) => setAssignOrgModal((prev) => ({ ...prev, selectedUserId: userId }))}
        onNextStep={() => setAssignOrgModal((prev) => ({ ...prev, confirmPopup: true }))}
        onBackStep={() => setAssignOrgModal((prev) => ({ ...prev, confirmPopup: false }))}
        onConfirm={handleConfirmAssignOrg}
      />
    </>
  );
}

export default AdminModals;
