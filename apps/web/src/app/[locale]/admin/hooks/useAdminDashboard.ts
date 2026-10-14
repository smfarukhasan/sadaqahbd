'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import {
  Building2,
  GraduationCap,
  DollarSign,
  Package,
  UserCheck,
  ArrowLeftRight,
} from 'lucide-react';
import {
  PermissionModuleKey,
  UserRole,
  getOrganizationTypeLabel,
} from '@sadaqahbd/schema';
import { useAuthStore, getRoleDashboardPath } from '@/lib/auth-store';
import { getAuthToken } from '@/lib/auth-token';
import { getApiUrl } from '@/lib/api-config';
import { ActionDrawerState } from '../components/AdminActionDrawer';

export function useAdminDashboard() {
  const locale = useLocale();
  const isBn = locale === 'bn';
  const t = useTranslations('Admin');
  const tCommon = useTranslations('Common');
  const user = useAuthStore((s) => s.user);
  const loadingAuth = useAuthStore((s) => s.loading);
  const router = useRouter();

  // Role Protection Guard
  useEffect(() => {
    if (!loadingAuth) {
      if (!user) {
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('sadaqahbd_master_admin');
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              if (parsed && (parsed.role === 'master_admin' || parsed.role === 'super_admin')) {
                useAuthStore.getState().setUser(parsed);
                return;
              }
            } catch {}
          }
        }
        router.push('/login');
      } else if (
        user.role !== UserRole.MASTER_ADMIN &&
        user.role !== UserRole.SUPER_ADMIN &&
        user.role !== UserRole.ADMIN
      ) {
        router.replace(getRoleDashboardPath(user.role) as any);
      }
    }
  }, [user, loadingAuth, router]);

  // Active navigation view in drawer
  const [activeNav, setActiveNav] = useState<string>('overview');

  // Sidebar Drawer state (Desktop collapse & Mobile off-canvas)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);

  // Real Database Datasets (Zero Demo Data)
  const [superAdmins, setSuperAdmins] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState<string>('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [orgVerificationRequests, setOrgVerificationRequests] = useState<any[]>([]);
  const [studentPostRequests, setStudentPostRequests] = useState<any[]>([]);
  const [pendingDonations, setPendingDonations] = useState<any[]>([]);
  const [donorsList, setDonorsList] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string>('');
  const [selectedStudentDetailsId, setSelectedStudentDetailsId] = useState<string | null>(null);
  const [selectedOrgMembersId, setSelectedOrgMembersId] = useState<string | null>(null);
  const [selectedOrgMembersName, setSelectedOrgMembersName] = useState<string>('');
  const [selectedDonorDetailsId, setSelectedDonorDetailsId] = useState<string | null>(null);
  const [adminInspectionUserId, setAdminInspectionUserId] = useState<string | null>(null);

  // Member Removal Requests
  const [removalRequests, setRemovalRequests] = useState<any[]>([]);

  // Phone Exemption Requests Count
  const [phoneExemptionCount, setPhoneExemptionCount] = useState<number>(0);

  // Transparency Ledger Stats
  const [ledgerStats, setLedgerStats] = useState<{
    totalDonated: number;
    totalRandom: number;
    totalDirect: number;
    totalAllocated: number;
    randomFundPoolBalance: number;
    totalDirectlyToStudents: number;
  }>({
    totalDonated: 0,
    totalRandom: 0,
    totalDirect: 0,
    totalAllocated: 0,
    randomFundPoolBalance: 0,
    totalDirectlyToStudents: 0,
  });

  // Assign Organization Account Modal (for member-proposed organizations)
  const [assignOrgModal, setAssignOrgModal] = useState<{
    isOpen: boolean;
    orgId: string;
    orgName: string;
    unassignedUsers: any[];
    selectedUserId: string;
    loading: boolean;
    confirmPopup: boolean;
  }>({
    isOpen: false,
    orgId: '',
    orgName: '',
    unassignedUsers: [],
    selectedUserId: '',
    loading: false,
    confirmPopup: false,
  });

  // In-drawer Assign Organization User States
  const [drawerUnassignedUsers, setDrawerUnassignedUsers] = useState<any[]>([]);
  const [drawerSelectedUserId, setDrawerSelectedUserId] = useState<string>('');
  const [drawerLoadingUsers, setDrawerLoadingUsers] = useState<boolean>(false);

  // Financial Donations History & Sub-tab State
  const [donationsHistory, setDonationsHistory] = useState<any[]>([]);

  // Item Donations Verification & History State
  const [itemDonationsList, setItemDonationsList] = useState<any[]>([]);
  const [itemAdminInstruction, setItemAdminInstruction] = useState<string>('');

  // ----------------------------------------------------
  // Verification Center Histories & Sub-tabs State
  // ----------------------------------------------------
  const [orgRequestsHistory, setOrgRequestsHistory] = useState<any[]>([]);
  const [adminAffiliationsHistory, setAdminAffiliationsHistory] = useState<{ teachers: any[]; students: any[] }>({
    teachers: [],
    students: [],
  });
  const [studentPostHistory, setStudentPostHistory] = useState<any[]>([]);

  // Action / Inspection Slide-Over Drawer State
  const [actionDrawer, setActionDrawer] = useState<ActionDrawerState>({
    isOpen: false,
    type: 'org_review',
    itemData: null,
    reason: '',
    isReadOnly: false,
  });

  // Institution Transfer Requests (Actionable, Live Monitoring, History)
  const [adminTransferRequests, setAdminTransferRequests] = useState<{
    actionable: any[];
    monitoring: any[];
    history: any[];
  }>({ actionable: [], monitoring: [], history: [] });

  // Pending Teacher & Student Final Approvals (Stage 2)
  const [adminPendingAffiliations, setAdminPendingAffiliations] = useState<{
    teachers: any[];
    students: any[];
  }>({ teachers: [], students: [] });

  // Create Super Admin / Admin Form State
  const [newAdminRole, setNewAdminRole] = useState<'super_admin' | 'admin'>('super_admin');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPhone, setNewAdminPhone] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([
    PermissionModuleKey.ORG_VERIFICATION_REQUESTS,
    PermissionModuleKey.STUDENT_POST_VERIFICATION_REQUESTS,
    PermissionModuleKey.ACCOUNTS_DONATION_APPROVAL,
  ]);

  const resetAdminForm = () => {
    setNewAdminRole('super_admin');
    setNewAdminName('');
    setNewAdminEmail('');
    setNewAdminPhone('');
    setSelectedPermissions([
      PermissionModuleKey.ORG_VERIFICATION_REQUESTS,
      PermissionModuleKey.STUDENT_POST_VERIFICATION_REQUESTS,
      PermissionModuleKey.ACCOUNTS_DONATION_APPROVAL,
    ]);
  };

  // Edit Admin Permissions & Role State
  const [editingAdmin, setEditingAdmin] = useState<any>(null);
  const [editAdminRole, setEditAdminRole] = useState<'super_admin' | 'admin'>('super_admin');
  const [editAdminPermissions, setEditAdminPermissions] = useState<string[]>([]);
  const [isUpdatingPermissions, setIsUpdatingPermissions] = useState(false);

  // Edit Organization Request State (allows Master/Super Admin to correct details prior to approving)
  const [orgEditName, setOrgEditName] = useState('');
  const [orgEditType, setOrgEditType] = useState('qawmi_madrasa');
  const [orgEditRegNo, setOrgEditRegNo] = useState('');
  const [orgEditContact, setOrgEditContact] = useState('');
  const [orgEditPhone, setOrgEditPhone] = useState('');
  const [orgEditEmail, setOrgEditEmail] = useState('');
  const [orgEditAddress, setOrgEditAddress] = useState('');
  const [orgEditDesc, setOrgEditDesc] = useState('');

  // Expense Modification in Student Post Review
  const [isEditingExpenses, setIsEditingExpenses] = useState(false);
  const [editedExpenses, setEditedExpenses] = useState<{ category: string; amount: number }[]>([]);
  const [expenseModificationReason, setExpenseModificationReason] = useState('');

  const handleOpenPostReview = (post: any, isReadOnly = false) => {
    setIsEditingExpenses(false);
    setEditedExpenses(
      Array.isArray(post.expenses)
        ? post.expenses.map((e: any) => ({
            category: e.category || e.categoryName || '',
            amount: Number(e.amount || 0),
          }))
        : []
    );
    setExpenseModificationReason(post.adminModificationReason || '');
    setActionDrawer({
      isOpen: true,
      type: 'post_review',
      itemData: post,
      reason: post.rejectionReason || '',
      isReadOnly,
    });
  };

  const handleOpenOrgReview = async (org: any, isReadOnly = false) => {
    setOrgEditName(org.name || '');
    setOrgEditType(org.type || 'qawmi_madrasa');
    setOrgEditRegNo(org.regNo || org.registrationNumber || '');
    setOrgEditContact(org.contact || org.contactPerson || '');
    setOrgEditPhone(org.phone || org.contactPhone || '');
    setOrgEditEmail(org.email || '');
    setOrgEditAddress(org.address || '');
    setOrgEditDesc(org.description || '');
    setDrawerSelectedUserId('');
    setActionDrawer({
      isOpen: true,
      type: 'org_review',
      itemData: org,
      reason: org.rejectionReason || '',
      isReadOnly,
    });

    if (org.isRequestedByMember && !isReadOnly) {
      setDrawerLoadingUsers(true);
      try {
        const token = await getAuthToken();
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/users/unassigned-organizations`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const list = await res.json();
          setDrawerUnassignedUsers(Array.isArray(list) ? list : []);
        } else {
          setDrawerUnassignedUsers([]);
        }
      } catch (err) {
        console.error('Failed to load unassigned org users for drawer', err);
        setDrawerUnassignedUsers([]);
      } finally {
        setDrawerLoadingUsers(false);
      }
    } else {
      setDrawerUnassignedUsers([]);
    }
  };

  const handleOpenDonationReview = (don: any, isReadOnly = false) => {
    setActionDrawer({
      isOpen: true,
      type: 'donation_review',
      itemData: don,
      reason: don.rejectionReason || '',
      isReadOnly,
    });
  };

  const handleOpenItemDonationReview = (item: any, isReadOnly = false) => {
    setItemAdminInstruction(item.adminInstruction || '');
    setActionDrawer({
      isOpen: true,
      type: 'item_donation_review',
      itemData: item,
      reason: item.rejectionReason || '',
      isReadOnly,
    });
  };

  const handleOpenEditPermissions = (adminUser: any) => {
    setEditingAdmin(adminUser);
    setEditAdminRole(adminUser.role === 'admin' ? 'admin' : 'super_admin');
    const existingPermKeys = (adminUser.permissions || []).map((p: any) => p.moduleKey);
    setEditAdminPermissions(existingPermKeys);
    setActionDrawer({
      isOpen: true,
      type: 'edit_permissions',
      itemData: adminUser,
      reason: '',
    });
  };

  const toggleEditPermission = (key: string) => {
    if (editAdminPermissions.includes(key)) {
      setEditAdminPermissions(editAdminPermissions.filter((k) => k !== key));
    } else {
      setEditAdminPermissions([...editAdminPermissions, key]);
    }
  };

  const handleSaveAdminPermissions = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!editingAdmin) return;
    setIsUpdatingPermissions(true);
    const apiUrl = getApiUrl();
    try {
      const token = await getAuthToken();
      const res = await fetch(`${apiUrl}/masteradmin/super-admins/${editingAdmin.id}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          role: editAdminRole,
          moduleKeys: editAdminPermissions,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'পারমিশন আপডেট করতে সমস্যা হয়েছে');
      }

      setFeedbackMsg(
        isBn
          ? `"${editingAdmin.fullName || editingAdmin.name}"-এর পারমিশন ও রোল সফলভাবে আপডেট করা হয়েছে।`
          : `Permissions for "${editingAdmin.fullName || editingAdmin.name}" updated successfully.`
      );
      setActionDrawer((prev) => ({ ...prev, isOpen: false }));
      loadAdminData(true);
    } catch (err: any) {
      alert(err.message || 'Error updating permissions');
    } finally {
      setIsUpdatingPermissions(false);
    }
  };

  // Load Real Data from Backend (isSilent = true prevents flicker on interval refresh)
  const loadAdminData = async (isSilent = false) => {
    if (!isSilent) setLoadingData(true);
    const apiUrl = getApiUrl();

    try {
      const token = await getAuthToken();
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

      // 1. Super Admins
      try {
        const res = await fetch(`${apiUrl}/masteradmin/super-admins`, { headers });
        if (res.ok) {
          setSuperAdmins(await res.json());
        }
      } catch (e) {}

      // 2. All Users (Universal User Directory for Master Admin & authorized staff)
      try {
        const res = await fetch(`${apiUrl}/masteradmin/all-users`, { headers });
        if (res.ok) {
          setAllUsers(await res.json());
        }
      } catch (e) {}

      // 3. Org Verification Requests & History
      try {
        const res = await fetch(`${apiUrl}/users/org-requests`, { headers });
        if (res.ok) {
          setOrgVerificationRequests(await res.json());
        }
      } catch (e) {}

      try {
        const res = await fetch(`${apiUrl}/users/org-requests/history`, { headers });
        if (res.ok) {
          setOrgRequestsHistory(await res.json());
        }
      } catch (e) {}

      // 4. Student Post Approvals & History
      try {
        const res = await fetch(`${apiUrl}/posts/pending-approvals`, { headers });
        if (res.ok) {
          setStudentPostRequests(await res.json());
        }
      } catch (e) {}

      try {
        const res = await fetch(`${apiUrl}/posts/approvals-history`, { headers });
        if (res.ok) {
          setStudentPostHistory(await res.json());
        }
      } catch (e) {}

      // 5. Pending Donations & History
      try {
        const res = await fetch(`${apiUrl}/donations/pending`, { headers });
        if (res.ok) {
          setPendingDonations(await res.json());
        }
      } catch (e) {}

      try {
        const res = await fetch(`${apiUrl}/donations/history`, { headers });
        if (res.ok) {
          setDonationsHistory(await res.json());
        }
      } catch (e) {}

      // 6. Pending Teacher & Student Final Affiliations & History
      try {
        const res = await fetch(`${apiUrl}/users/pending-affiliations`, { headers });
        if (res.ok) {
          const affData = await res.json();
          setAdminPendingAffiliations(affData || { teachers: [], students: [] });
        }
      } catch (e) {}

      try {
        const res = await fetch(`${apiUrl}/users/affiliations-history`, { headers });
        if (res.ok) {
          const affHist = await res.json();
          setAdminAffiliationsHistory(affHist || { teachers: [], students: [] });
        }
      } catch (e) {}

      // 7. Item Donations List & History
      try {
        const res = await fetch(`${apiUrl}/donations/items/requests`, { headers });
        if (res.ok) {
          setItemDonationsList(await res.json());
        }
      } catch (e) {}

      // 8. Donors & Donations Comprehensive Directory
      try {
        const res = await fetch(`${apiUrl}/donations/admin-donors-ledger`, { headers });
        if (res.ok) {
          setDonorsList(await res.json());
        }
      } catch (e) {}

      // 9. Institution Transfer Requests
      try {
        const res = await fetch(`${apiUrl}/users/admin-transfer-requests`, { headers });
        if (res.ok) {
          const tData = await res.json();
          setAdminTransferRequests(tData || { actionable: [], monitoring: [], history: [] });
        }
      } catch (e) {}

      // 10. Member Removal Requests
      try {
        const res = await fetch(`${apiUrl}/organizations/removal-requests`, { headers });
        if (res.ok) {
          setRemovalRequests(await res.json());
        }
      } catch (e) {}

      // 11. Transparency Ledger Stats
      try {
        const res = await fetch(`${apiUrl}/donations/ledger-stats`);
        if (res.ok) {
          setLedgerStats(await res.json());
        }
      } catch (e) {}

      // 12. Student Phone Exemption Clearances
      try {
        const res = await fetch(`${apiUrl}/sms/admin/exemptions`, { headers });
        if (res.ok) {
          const exData = await res.json();
          const pendingEx = (exData || []).filter((e: any) => e.status === 'pending');
          setPhoneExemptionCount(pendingEx.length);
        }
      } catch (e) {}
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      if (!isSilent) setLoadingData(false);
    }
  };

  useEffect(() => {
    loadAdminData(false);
    if (typeof window !== 'undefined') {
      const tabParam = new URLSearchParams(window.location.search).get('tab');
      if (tabParam) {
        setActiveNav(tabParam);
      }
    }

    // Silent background live polling every 12 seconds
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadAdminData(true);
      }
    }, 12000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadAdminData(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [user]);

  const handleReviewMemberRemoval = async (removalId: string, approved: boolean, reason?: string) => {
    const finalReason = reason || (approved ? '' : prompt(isBn ? 'বাতিলের কারণ লিখুন:' : 'Enter rejection reason:'));
    if (!approved && !finalReason) return;

    try {
      setActionLoading(true);
      const token = await getAuthToken();
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/organizations/removal-requests/${removalId}/review`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ approved, rejectionReason: finalReason || undefined }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed to review request');

      setFeedbackMsg(data.message || (isBn ? 'আবেদন সফলভাবে নিষ্পত্তি করা হয়েছে।' : 'Request reviewed successfully.'));
      setTimeout(() => setFeedbackMsg(''), 4000);
      loadAdminData(true);
    } catch (err: any) {
      alert(err.message || 'Error reviewing removal request');
    } finally {
      setActionLoading(false);
    }
  };

  // Permissions helper
  const getPermission = (key: string) => {
    if (user?.role === UserRole.MASTER_ADMIN) {
      return { canView: true, canEdit: true, canDelete: true, canApprove: true };
    }
    return (
      user?.permissions?.find((p: any) => p.moduleKey === key) || {
        canView: false,
        canEdit: false,
        canDelete: false,
        canApprove: false,
      }
    );
  };

  // Filtered Users List for universal directory
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

  // Toggle user active / suspended status
  const handleToggleUserStatus = async (userId: string, targetStatus: 'active' | 'suspended', userName: string) => {
    if (
      !confirm(
        isBn
          ? `আপনি কি নিশ্চিত যে "${userName}"-এর অ্যাকাউন্ট ${targetStatus === 'suspended' ? 'স্থগিত (Suspend)' : 'সক্রিয় (Activate)'} করতে চান?`
          : `Are you sure you want to ${targetStatus === 'suspended' ? 'suspend' : 'activate'} "${userName}"?`
      )
    ) {
      return;
    }
    const apiUrl = getApiUrl();
    try {
      const token = await getAuthToken();
      const res = await fetch(`${apiUrl}/masteradmin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: targetStatus }),
      });
      if (res.ok) {
        setFeedbackMsg(
          isBn ? 'ব্যবহারকারীর স্ট্যাটাস সফলভাবে আপডেট করা হয়েছে।' : 'User status updated successfully.'
        );
        setTimeout(() => setFeedbackMsg(''), 4000);
        loadAdminData();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to update user status');
      }
    } catch (e: any) {
      alert(e.message || 'Network error');
    }
  };

  // Delete user account permanently
  const handleDeleteUser = async (userId: string, userName: string) => {
    if (
      !confirm(
        isBn
          ? `সতর্কতা: আপনি কি নিশ্চিত যে "${userName}"-কে প্ল্যাটফর্ম থেকে স্থায়ীভাবে মুছে ফেলতে চান?`
          : `Warning: Are you sure you want to permanently delete user "${userName}"?`
      )
    ) {
      return;
    }
    const apiUrl = getApiUrl();
    try {
      const token = await getAuthToken();
      const res = await fetch(`${apiUrl}/users/${userId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        setFeedbackMsg(isBn ? 'ব্যবহারকারী সফলভাবে ডিলিট করা হয়েছে।' : 'User deleted successfully.');
        setTimeout(() => setFeedbackMsg(''), 4000);
        loadAdminData();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to delete user');
      }
    } catch (e: any) {
      alert(e.message || 'Network error');
    }
  };

  const openAssignOrgModal = async (orgId: string, orgName: string) => {
    try {
      setAssignOrgModal({
        isOpen: true,
        orgId,
        orgName,
        unassignedUsers: [],
        selectedUserId: '',
        loading: true,
        confirmPopup: false,
      });

      const token = await getAuthToken();
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/users/unassigned-organizations`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const usersList = await res.json();
        setAssignOrgModal((prev) => ({
          ...prev,
          unassignedUsers: Array.isArray(usersList) ? usersList : [],
          loading: false,
        }));
      } else {
        setAssignOrgModal((prev) => ({ ...prev, loading: false }));
      }
    } catch (err) {
      console.error('Failed to load unassigned org users', err);
      setAssignOrgModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleConfirmAssignOrg = async () => {
    if (!assignOrgModal.selectedUserId || !assignOrgModal.orgId) return;

    try {
      setAssignOrgModal((prev) => ({ ...prev, loading: true }));
      const token = await getAuthToken();
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/users/org/${assignOrgModal.orgId}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          approved: true,
          assignedUserId: assignOrgModal.selectedUserId,
          reason: actionDrawer.reason,
          name: orgEditName,
          type: orgEditType,
          registrationNumber: orgEditRegNo,
          contactPerson: orgEditContact,
          contactPhone: orgEditPhone,
          email: orgEditEmail,
          address: orgEditAddress,
          description: orgEditDesc,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'প্রতিষ্ঠান যাচাইকরণ ব্যর্থ হয়েছে');

      setFeedbackMsg(isBn ? 'প্রতিষ্ঠান সফলভাবে অনুমোদিত হয়েছে এবং দায়িত্বপ্রাপ্ত ইউজার সক্রিয় হয়েছে।' : 'Organization verified and assigned user account activated.');
      setOrgVerificationRequests((prev) => prev.filter((item) => item.id !== assignOrgModal.orgId));
      setAssignOrgModal({
        isOpen: false,
        orgId: '',
        orgName: '',
        unassignedUsers: [],
        selectedUserId: '',
        loading: false,
        confirmPopup: false,
      });
      setActionDrawer((prev) => ({ ...prev, isOpen: false }));
      loadAdminData(true);
    } catch (err: any) {
      alert(err.message || 'Error assigning organization');
      setAssignOrgModal((prev) => ({ ...prev, loading: false, confirmPopup: false }));
    }
  };

  // Handle Real Drawer action execution (Approve or Reject)
  const handleExecuteAction = async (actionType: 'approve' | 'reject') => {
    if (!actionDrawer.itemData) return;

    const id = actionDrawer.itemData.id;
    setActionLoading(true);
    setFeedbackMsg('');
    const apiUrl = getApiUrl();

    try {
      const token = await getAuthToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      if (actionDrawer.type === 'org_review') {
        if (actionType === 'approve' && actionDrawer.itemData.isRequestedByMember) {
          if (!drawerSelectedUserId) {
            setActionLoading(false);
            alert(
              isBn
                ? 'সদস্য প্রস্তাবিত প্রতিষ্ঠানের ক্ষেত্রে অনুমোদন নিশ্চিত করার জন্য ড্রয়ার থেকে একজন দায়িত্বপ্রাপ্ত প্রতিষ্ঠান অ্যাকাউন্ট (ইউজার) নির্বাচন করা আবশ্যক।'
                : 'For member-proposed institutions, you must select an authority organization account in the drawer before approving.'
            );
            return;
          }

          const res = await fetch(`${apiUrl}/users/org/${id}/verify`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              approved: true,
              assignedUserId: drawerSelectedUserId,
              reason: actionDrawer.reason,
              name: orgEditName,
              type: orgEditType,
              registrationNumber: orgEditRegNo,
              contactPerson: orgEditContact,
              contactPhone: orgEditPhone,
              email: orgEditEmail,
              address: orgEditAddress,
              description: orgEditDesc,
            }),
          });

          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data.message || (isBn ? 'প্রতিষ্ঠান যাচাইকরণ ব্যর্থ হয়েছে' : 'Verification failed'));
          setFeedbackMsg(isBn ? 'প্রতিষ্ঠান সফলভাবে অনুমোদিত হয়েছে এবং দায়িত্বপ্রাপ্ত ইউজার সক্রিয় হয়েছে।' : 'Organization verified and assigned user account activated.');
          setOrgVerificationRequests((prev) => prev.filter((item) => item.id !== id));
          setActionDrawer((prev) => ({ ...prev, isOpen: false }));
          loadAdminData(true);
          setActionLoading(false);
          return;
        }

        const res = await fetch(`${apiUrl}/users/org/${id}/verify`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            approved: actionType === 'approve',
            reason: actionDrawer.reason,
            name: orgEditName,
            type: orgEditType,
            registrationNumber: orgEditRegNo,
            contactPerson: orgEditContact,
            contactPhone: orgEditPhone,
            email: orgEditEmail,
            address: orgEditAddress,
            description: orgEditDesc,
          }),
        });

        if (!res.ok) throw new Error('প্রতিষ্ঠান যাচাইকরণ ব্যর্থ হয়েছে');
        setFeedbackMsg(actionType === 'approve' ? 'প্রতিষ্ঠান সফলভাবে অনুমোদিত হয়েছে।' : 'প্রতিষ্ঠান আবেদন বাতিল করা হয়েছে।');
        setOrgVerificationRequests((prev) => prev.filter((item) => item.id !== id));
        setActionDrawer((prev) => ({ ...prev, isOpen: false }));
        loadAdminData(true);
      } else if (actionDrawer.type === 'post_review') {
        const origExpenses = actionDrawer.itemData.expenses || [];
        const hasExpensesChanged =
          editedExpenses.length !== origExpenses.length ||
          editedExpenses.some((e, i) => {
            const orig = origExpenses[i];
            const origName = orig?.category || orig?.categoryName || '';
            const origAmt = Number(orig?.amount || 0);
            return origName !== e.category || origAmt !== Number(e.amount);
          });

        if (actionType === 'approve' && hasExpensesChanged && !expenseModificationReason.trim()) {
          alert('খরচ পরিবর্তন করা হয়েছে। পরিবর্তনের কারণ উল্লেখ করা বাধ্যতামূলক যাতে শিক্ষার্থী ও প্রতিষ্ঠান অবহিত হতে পারে।');
          return;
        }

        const res = await fetch(`${apiUrl}/posts/${id}/super-admin-approve`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            approved: actionType === 'approve',
            rejectionReason: actionDrawer.reason,
            modifiedExpenses: hasExpensesChanged
              ? editedExpenses.map((e) => ({
                  categoryName: e.category,
                  amount: Number(e.amount),
                }))
              : undefined,
            modificationReason: hasExpensesChanged ? expenseModificationReason.trim() : undefined,
          }),
        });

        if (!res.ok) throw new Error('পোস্ট যাচাইকরণ সম্পন্ন করা সম্ভব হয়নি');
        setFeedbackMsg(actionType === 'approve' ? 'শিক্ষার্থী পোস্ট সফলভাবে লাইভ করা হয়েছে।' : 'শিক্ষার্থী পোস্ট বাতিল করা হয়েছে।');
        setStudentPostRequests((prev) => prev.filter((item) => item.id !== id));
      } else if (actionDrawer.type === 'donation_review') {
        const res = await fetch(`${apiUrl}/donations/review`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            donationId: id,
            status: actionType === 'approve' ? 'accepted' : 'rejected',
            rejectionReason: actionDrawer.reason,
          }),
        });

        if (!res.ok) throw new Error('অনুদান যাচাই সম্পন্ন হয়নি');
        setFeedbackMsg(actionType === 'approve' ? 'অনুদান সফলভাবে লেজারে অনুমোদিত হয়েছে।' : 'অনুদান বাতিল করা হয়েছে।');
        setPendingDonations((prev) => prev.filter((item) => item.id !== id));
      } else if (actionDrawer.type === 'affiliation_review') {
        const { role, profileId } = actionDrawer.itemData;
        const res = await fetch(`${apiUrl}/users/affiliations/${role}/${profileId}/review`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            approved: actionType === 'approve',
            reason: actionDrawer.reason,
          }),
        });

        if (!res.ok) throw new Error('এফিলিয়েশন যাচাই সম্পন্ন হয়নি');
        setFeedbackMsg(
          actionType === 'approve'
            ? `${role === 'teacher' ? 'শিক্ষক' : 'শিক্ষার্থী'} চূড়ান্তভাবে অনুমোদিত ও সক্রিয় করা হয়েছে।`
            : `${role === 'teacher' ? 'শিক্ষক' : 'শিক্ষার্থী'} আবেদন বাতিল করা হয়েছে।`
        );
        if (role === 'teacher') {
          setAdminPendingAffiliations((prev) => ({
            ...prev,
            teachers: (prev.teachers || []).filter(
              (t: any) => (t.profileId || t.id) !== profileId && t.id !== id
            ),
          }));
        } else {
          setAdminPendingAffiliations((prev) => ({
            ...prev,
            students: (prev.students || []).filter(
              (s: any) => (s.profileId || s.id) !== profileId && s.id !== id
            ),
          }));
        }
      } else if (actionDrawer.type === 'item_donation_review') {
        if (actionType === 'approve' && !itemAdminInstruction.trim()) {
          alert(isBn ? 'অনুগ্রহ করে দাতাকে প্রেরণের নির্দেশনা বা কুরিয়ার ঠিকানা উল্লেখ করুন।' : 'Please provide dispatch instructions or courier address.');
          return;
        }
        const res = await fetch(`${apiUrl}/donations/items/review`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            itemDonationId: id,
            status: actionType === 'approve' ? 'accepted' : 'rejected',
            adminInstruction: actionType === 'approve' ? itemAdminInstruction.trim() : (actionDrawer.reason.trim() || 'আবেদন বাতিল করা হয়েছে।'),
          }),
        });

        if (!res.ok) throw new Error('পণ্য অনুদান পর্যালোচনা ব্যর্থ হয়েছে');
        setFeedbackMsg(actionType === 'approve' ? 'পণ্য অনুদান সফলভাবে অনুমোদিত হয়েছে।' : 'পণ্য অনুদান বাতিল করা হয়েছে।');
        setItemDonationsList((prev) =>
          prev.map((item: any) =>
            item.id === id
              ? { ...item, status: actionType === 'approve' ? 'accepted' : 'rejected' }
              : item
          )
        );
      } else if (actionDrawer.type === 'transfer_review') {
        const res = await fetch(`${apiUrl}/users/transfers/${id}/admin-review`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            approved: actionType === 'approve',
            reason: actionDrawer.reason,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.message || 'প্রতিষ্ঠান স্থানান্তর পর্যালোচনা ব্যর্থ হয়েছে');
        }

        setFeedbackMsg(
          actionType === 'approve'
            ? (isBn ? 'প্রতিষ্ঠান স্থানান্তর চূড়ান্তভাবে অনুমোদিত ও সফল হয়েছে।' : 'Institution transfer approved successfully.')
            : (isBn ? 'প্রতিষ্ঠান স্থানান্তরের আবেদন বাতিল করা হয়েছে।' : 'Institution transfer rejected.')
        );
        setAdminTransferRequests((prev) => ({
          ...prev,
          actionable: (prev.actionable || []).filter((tr: any) => tr.id !== id),
        }));
      }

      setActionDrawer({ isOpen: false, type: 'org_review', itemData: null, reason: '' });
      loadAdminData(true);
    } catch (err: any) {
      alert(err.message || 'অপারেশন সম্পন্ন করতে সমস্যা হয়েছে');
    } finally {
      setActionLoading(false);
    }
  };

  // Real Super Admin Creation
  const handleCreateSuperAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    const apiUrl = getApiUrl();

    try {
      const token = await getAuthToken();
      const res = await fetch(`${apiUrl}/masteradmin/super-admins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          fullName: newAdminName,
          email: newAdminEmail,
          phone: newAdminPhone,
          role: newAdminRole,
          moduleKeys: selectedPermissions,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          errData.message ||
            (isBn
              ? `${newAdminRole === 'super_admin' ? 'সুপার এডমিন' : 'এডমিন'} তৈরিতে ব্যর্থ হয়েছে`
              : `Failed to create ${newAdminRole === 'super_admin' ? 'Super Admin' : 'Admin'}`)
        );
      }

      setFeedbackMsg(
        isBn
          ? `${newAdminRole === 'super_admin' ? 'সুপার এডমিন' : 'এডমিন'} "${newAdminName}" সফলভাবে তৈরি হয়েছে।`
          : `${newAdminRole === 'super_admin' ? 'Super Admin' : 'Admin'} "${newAdminName}" created successfully.`
      );
      setActionDrawer((prev) => ({ ...prev, isOpen: false }));
      resetAdminForm();
      loadAdminData();
    } catch (err: any) {
      alert(err.message || (isBn ? 'ত্রুটি দেখা দিয়েছে' : 'An error occurred'));
    } finally {
      setActionLoading(false);
    }
  };

  // Real Super Admin Deletion
  const handleDeleteSuperAdmin = async (id: string, name: string) => {
    if (!confirm(`আপনি কি নিশ্চিতভাবে "${name}" একাউন্টটি মুছে ফেলতে চান?`)) return;

    const apiUrl = getApiUrl();
    try {
      const token = await getAuthToken();
      const res = await fetch(`${apiUrl}/masteradmin/super-admins/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || (isBn ? 'ডিলিট করা সম্ভব হয়নি' : 'Failed to delete super admin'));
      }

      setFeedbackMsg(`সুপার এডমিন "${name}" সফলভাবে মুছে ফেলা হয়েছে।`);
      setSuperAdmins((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      alert(err.message || 'ত্রুটি দেখা দিয়েছে');
    }
  };

  const togglePermission = (key: string) => {
    if (selectedPermissions.includes(key)) {
      setSelectedPermissions(selectedPermissions.filter((k) => k !== key));
    } else {
      setSelectedPermissions([...selectedPermissions, key]);
    }
  };

  // Switch navigation and auto-close mobile drawer
  const handleNavSelect = (navKey: string) => {
    setActiveNav(navKey);
    setIsMobileDrawerOpen(false);
  };

  const displayName = user?.fullName || (isBn ? 'এডমিন কর্মকর্তা' : 'Admin Officer');
  const displayRole = user?.role || UserRole.ADMIN;

  // Scoped Counts based on role & permissions
  const canApproveOrEdit = (modKey: string) => {
    if (user?.role === UserRole.MASTER_ADMIN) return true;
    const perm = getPermission(modKey);
    return Boolean(perm?.canApprove || perm?.canEdit);
  };

  const effectiveOrgCount = canApproveOrEdit(PermissionModuleKey.ORG_VERIFICATION_REQUESTS)
    ? orgVerificationRequests.length
    : 0;

  const effectivePostCount = canApproveOrEdit(PermissionModuleKey.STUDENT_POST_VERIFICATION_REQUESTS)
    ? studentPostRequests.length
    : 0;

  const effectiveDonationCount = canApproveOrEdit(PermissionModuleKey.ACCOUNTS_DONATION_APPROVAL)
    ? pendingDonations.length
    : 0;

  const effectiveTeacherAffiliationCount = canApproveOrEdit(PermissionModuleKey.TEACHER_VERIFICATION_REQUESTS)
    ? adminPendingAffiliations?.teachers?.length || 0
    : 0;

  const effectiveStudentAffiliationCount = canApproveOrEdit(PermissionModuleKey.STUDENT_VERIFICATION_REQUESTS)
    ? adminPendingAffiliations?.students?.length || 0
    : 0;

  const effectiveAffiliationCount = effectiveTeacherAffiliationCount + effectiveStudentAffiliationCount;

  const effectiveTransferCount = canApproveOrEdit(PermissionModuleKey.STUDENT_VERIFICATION_REQUESTS)
    ? adminTransferRequests.actionable.length
    : 0;

  const effectiveItemDonationCount = canApproveOrEdit(PermissionModuleKey.ITEM_DONATION_APPROVAL)
    ? itemDonationsList.filter((i: any) => i.status === 'pending').length
    : 0;

  const notificationCategories = [
    {
      id: 'org_requests',
      titleBn: 'প্রতিষ্ঠান অনুমোদন আবেদন',
      titleEn: 'Institute Verifications',
      count: effectiveOrgCount,
      icon: Building2,
      navKey: 'org_requests',
      permissionKey: PermissionModuleKey.ORG_VERIFICATION_REQUESTS,
    },
    {
      id: 'post_requests',
      titleBn: 'শিক্ষার্থী পোস্ট ছাড়পত্র',
      titleEn: 'Student Post Approvals',
      count: effectivePostCount,
      icon: GraduationCap,
      navKey: 'student_posts',
      permissionKey: PermissionModuleKey.STUDENT_POST_VERIFICATION_REQUESTS,
    },
    {
      id: 'donation_approval',
      titleBn: 'অনুদান পেমেন্ট যাচাই',
      titleEn: 'Donation Verifications',
      count: effectiveDonationCount,
      icon: DollarSign,
      navKey: 'pending_donations',
      permissionKey: PermissionModuleKey.ACCOUNTS_DONATION_APPROVAL,
    },
    {
      id: 'item_donation_approval',
      titleBn: 'পণ্য অনুদান অনুমোদন',
      titleEn: 'Item Donation Clearances',
      count: effectiveItemDonationCount,
      icon: Package,
      navKey: 'item_donations',
      permissionKey: PermissionModuleKey.ITEM_DONATION_APPROVAL,
    },
    {
      id: 'affiliation_requests',
      titleBn: 'শিক্ষক ও শিক্ষার্থী চূড়ান্ত অনুমোদন',
      titleEn: 'Teacher & Student Clearances',
      count: effectiveAffiliationCount,
      icon: UserCheck,
      navKey: 'affiliation_requests',
      permissionKey: [
        PermissionModuleKey.TEACHER_VERIFICATION_REQUESTS,
        PermissionModuleKey.STUDENT_VERIFICATION_REQUESTS,
      ],
    },
    {
      id: 'transfer_requests',
      titleBn: 'প্রতিষ্ঠান স্থানান্তর চূড়ান্ত অনুমোদন',
      titleEn: 'Institution Transfer Clearances',
      count: effectiveTransferCount,
      icon: ArrowLeftRight,
      navKey: 'transfer_requests',
      permissionKey: PermissionModuleKey.STUDENT_VERIFICATION_REQUESTS,
    },
  ].filter((cat) => {
    if (user?.role === UserRole.MASTER_ADMIN) return true;
    if (Array.isArray(cat.permissionKey)) {
      return cat.permissionKey.some((k) => canApproveOrEdit(k));
    }
    return canApproveOrEdit(cat.permissionKey);
  });



  const canAccessFundAllocation =
    user?.role === UserRole.MASTER_ADMIN ||
    getPermission(PermissionModuleKey.ACCOUNTS_FUND_ALLOCATION).canView ||
    getPermission(PermissionModuleKey.ACCOUNTS_FUND_ALLOCATION).canApprove ||
    getPermission(PermissionModuleKey.ACCOUNTS_FUND_ALLOCATION).canEdit;

  const canEditFundAllocation =
    user?.role === UserRole.MASTER_ADMIN ||
    getPermission(PermissionModuleKey.ACCOUNTS_FUND_ALLOCATION).canApprove ||
    getPermission(PermissionModuleKey.ACCOUNTS_FUND_ALLOCATION).canEdit;

  const canAccessAppsPrivilege =
    user?.role === UserRole.MASTER_ADMIN ||
    (user?.role === UserRole.SUPER_ADMIN &&
      (getPermission(PermissionModuleKey.MAINTENANCE_APPS_PRIVILEGE).canView ||
        getPermission(PermissionModuleKey.MAINTENANCE_APPS_PRIVILEGE).canEdit ||
        getPermission(PermissionModuleKey.MAINTENANCE_APPS_PRIVILEGE).canApprove));

  const canAccessSmsPackages =
    user?.role === UserRole.MASTER_ADMIN ||
    (user?.role === UserRole.SUPER_ADMIN &&
      (getPermission(PermissionModuleKey.MAINTENANCE_SMS_PACKAGES).canView ||
        getPermission(PermissionModuleKey.MAINTENANCE_SMS_PACKAGES).canEdit ||
        getPermission(PermissionModuleKey.MAINTENANCE_SMS_PACKAGES).canApprove));

  const canAccessStudentExemptions =
    user?.role === UserRole.MASTER_ADMIN ||
    getPermission(PermissionModuleKey.STUDENT_PHONE_EXEMPTIONS).canView ||
    getPermission(PermissionModuleKey.STUDENT_PHONE_EXEMPTIONS).canEdit ||
    getPermission(PermissionModuleKey.STUDENT_PHONE_EXEMPTIONS).canApprove;

  return {
    user,
    loadingAuth,
    isBn,
    sidebarProps: {
      isMobileDrawerOpen,
      setIsMobileDrawerOpen,
      isSidebarCollapsed,
      setIsSidebarCollapsed,
      displayName,
      displayRole,
      user,
      activeNav,
      handleNavSelect,
      effectiveOrgCount,
      effectivePostCount,
      effectiveDonationCount,
      effectiveAffiliationCount,
      effectiveItemDonationCount,
      effectiveTransferCount,
      canAccessFundAllocation,
      canAccessAppsPrivilege,
      canAccessSmsPackages,
      canAccessStudentExemptions,
      phoneExemptionCount,
      isBn,
    },
    headerProps: {
      isBn,
      user,
      displayName,
      displayRole,
      notificationCategories,
      handleNavSelect,
      setIsMobileDrawerOpen,
    },
    tabRouterProps: {
      activeNav,
      setActiveNav,
      feedbackMsg,
      setFeedbackMsg,
      isBn,
      loadingData,
      loadAdminData,
      t,
      user,
      canAccessFundAllocation,
      canEditFundAllocation,
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
    },
    actionDrawerProps: {
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
    },
    bottomNavProps: {
      activeNav,
      setActiveNav,
      setIsMobileDrawerOpen,
      approvalBadgeCount:
        orgVerificationRequests.length +
        studentPostRequests.length +
        pendingDonations.length +
        (adminPendingAffiliations?.teachers?.length || 0) +
        (adminPendingAffiliations?.students?.length || 0),
      isBn,
    },
    modalsProps: {
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
    },
  };
};

export default useAdminDashboard;
