'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { useRouter } from '@/i18n/routing';
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
  AlertTriangle,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  ShieldCheck,
  Globe,
  ArrowUpRight,
  SlidersHorizontal,
  RefreshCw,
  LogOut,
  User,
  UserCheck,
  UserX,
  Search,
  Lock,
  Mail,
  Phone,
  Clock,
  History as HistoryIcon,
  Package,
  TrendingUp,
  Check,
  Copy,
} from 'lucide-react';
import {
  PermissionModuleKey,
  UserRole,
  ModulePermission,
  getOrganizationTypeLabel,
} from '@sadaqahbd/schema';
import { useAuthStore, getRoleDashboardPath } from '@/lib/auth-store';
import { auth } from '@/lib/firebase';
import { getAuthToken } from '@/lib/auth-token';
import { getApiUrl } from '@/lib/api-config';
import PanelHeader from '@/components/layout/PanelHeader';
import UserMenuDropdown from '@/components/profile/UserMenuDropdown';
import AdminNotificationDropdown from '@/components/layout/AdminNotificationDropdown';
import StudentDetailsModal from '@/components/portal/StudentDetailsModal';
import OrgMembersModal from '@/components/portal/OrgMembersModal';
import DonorDetailsModal from '@/components/portal/DonorDetailsModal';
import MyDonationsSection from '@/components/portal/MyDonationsSection';
import styles from './admin.module.css';


const ALL_MODULES = [
  { key: PermissionModuleKey.SUPER_ADMIN_LIST, name: 'সুপার এডমিন তদারকি', nameEn: 'Super Admin Oversight', superAdminOnly: true },
  { key: PermissionModuleKey.ADMIN_LIST, name: 'সাধারণ এডমিন ম্যানেজমেন্ট', nameEn: 'General Admin Management', superAdminOnly: true },
  { key: PermissionModuleKey.ORG_VERIFICATION_REQUESTS, name: 'শিক্ষা প্রতিষ্ঠান অনুমোদন', nameEn: 'Institution Approvals', superAdminOnly: false },
  { key: PermissionModuleKey.ORG_LIST, name: 'প্রতিষ্ঠান তালিকা', nameEn: 'Institution Directory', superAdminOnly: false },
  { key: PermissionModuleKey.TEACHER_LIST, name: 'শিক্ষক তালিকা', nameEn: 'Teacher Directory', superAdminOnly: false },
  { key: PermissionModuleKey.STUDENT_LIST, name: 'শিক্ষার্থী তালিকা', nameEn: 'Student Directory', superAdminOnly: false },
  { key: PermissionModuleKey.STUDENT_POST_VERIFICATION_REQUESTS, name: 'শিক্ষার্থী পোস্ট ছাড়পত্র', nameEn: 'Student Campaign Clearances', superAdminOnly: false },
  { key: PermissionModuleKey.DONOR_PROFILE, name: 'দাতা প্রোফাইল ও অনুদান হিস্টোরি', nameEn: 'Donor Profile & History', superAdminOnly: false },
  { key: PermissionModuleKey.DONATION_AMOUNT, name: 'অনুদানের পরিমাণ ও পরিসংখ্যান', nameEn: 'Donation Amounts & Stats', superAdminOnly: false },
  { key: PermissionModuleKey.ACCOUNTS_DONATION_APPROVAL, name: 'অনুদান পেমেন্ট যাচাই ও অনুমোদন', nameEn: 'Accounts & Donation Approval', superAdminOnly: true },
  { key: PermissionModuleKey.ITEM_DONATION_APPROVAL, name: 'পণ্য অনুদান অনুমোদন ও ছাড়পত্র', nameEn: 'Item Donation Verification', superAdminOnly: false },
  { key: PermissionModuleKey.ACCOUNTS_FUND_ALLOCATION, name: 'তহবিল বরাদ্দকরণ', nameEn: 'Fund Allocation', superAdminOnly: true },
];

export default function AdminDashboardPage() {
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

  // Financial Donations History & Sub-tab State
  const [donationsHistory, setDonationsHistory] = useState<any[]>([]);
  const [pendingDonationsTab, setPendingDonationsTab] = useState<'pending' | 'history'>('pending');
  const [donationHistorySearch, setDonationHistorySearch] = useState<string>('');
  const [donationHistoryStatusFilter, setDonationHistoryStatusFilter] = useState<'all' | 'accepted' | 'rejected'>('all');

  // Item Donations Verification & History State
  const [itemDonationsList, setItemDonationsList] = useState<any[]>([]);
  const [itemDonationsTab, setItemDonationsTab] = useState<'pending' | 'history'>('pending');
  const [itemHistorySearch, setItemHistorySearch] = useState<string>('');
  const [itemHistoryStatusFilter, setItemHistoryStatusFilter] = useState<'all' | 'accepted' | 'rejected'>('all');
  const [itemAdminInstruction, setItemAdminInstruction] = useState<string>('');

  // Donor List Search
  const [donorListSearch, setDonorListSearch] = useState<string>('');

  // ----------------------------------------------------
  // Verification Center Histories & Sub-tabs State
  // ----------------------------------------------------
  const [orgRequestsHistory, setOrgRequestsHistory] = useState<any[]>([]);
  const [adminAffiliationsHistory, setAdminAffiliationsHistory] = useState<{ teachers: any[]; students: any[] }>({
    teachers: [],
    students: [],
  });
  const [studentPostHistory, setStudentPostHistory] = useState<any[]>([]);

  // Active sub-tabs ('pending' vs 'history')
  const [orgVerificationTab, setOrgVerificationTab] = useState<'pending' | 'history'>('pending');
  const [affiliationVerificationTab, setAffiliationVerificationTab] = useState<'pending' | 'history'>('pending');
  const [postVerificationTab, setPostVerificationTab] = useState<'pending' | 'history'>('pending');

  // Search & Filters for History
  const [orgHistorySearch, setOrgHistorySearch] = useState<string>('');
  const [orgHistoryStatusFilter, setOrgHistoryStatusFilter] = useState<'all' | 'active' | 'rejected'>('all');

  const [affHistorySearch, setAffHistorySearch] = useState<string>('');
  const [affHistoryRoleFilter, setAffHistoryRoleFilter] = useState<'all' | 'teacher' | 'student'>('all');
  const [affHistoryStatusFilter, setAffHistoryStatusFilter] = useState<'all' | 'verified' | 'rejected'>('all');

  const [postHistorySearch, setPostHistorySearch] = useState<string>('');
  const [postHistoryStatusFilter, setPostHistoryStatusFilter] = useState<'all' | 'approved' | 'rejected'>('all');

  // One-click copy toast feedback state
  const [copiedFieldKey, setCopiedFieldKey] = useState<string | null>(null);
  const handleCopyText = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedFieldKey(key);
    setTimeout(() => setCopiedFieldKey(null), 2000);
  };

  // Action / Inspection Slide-Over Drawer State
  const [actionDrawer, setActionDrawer] = useState<{
    isOpen: boolean;
    type: 'org_review' | 'post_review' | 'donation_review' | 'item_donation_review' | 'add_super_admin' | 'affiliation_review' | 'edit_permissions';
    itemData: any;
    reason: string;
    isReadOnly?: boolean;
  }>({
    isOpen: false,
    type: 'org_review',
    itemData: null,
    reason: '',
    isReadOnly: false,
  });

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

  const handleOpenOrgReview = (org: any, isReadOnly = false) => {
    setOrgEditName(org.name || '');
    setOrgEditType(org.type || 'qawmi_madrasa');
    setOrgEditRegNo(org.regNo || org.registrationNumber || '');
    setOrgEditContact(org.contact || org.contactPerson || '');
    setOrgEditPhone(org.phone || org.contactPhone || '');
    setOrgEditEmail(org.email || '');
    setOrgEditAddress(org.address || '');
    setOrgEditDesc(org.description || '');
    setActionDrawer({
      isOpen: true,
      type: 'org_review',
      itemData: org,
      reason: org.rejectionReason || '',
      isReadOnly,
    });
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

      // 8. Donors List
      try {
        const res = await fetch(`${apiUrl}/users/by-role/donor`, { headers });
        if (res.ok) {
          setDonorsList(await res.json());
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
  }, [user]);

  // Permissions helper
  const getPermission = (key: string) => {
    if (user?.role === UserRole.MASTER_ADMIN || user?.role === UserRole.SUPER_ADMIN) {
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

      if (!res.ok) throw new Error('ডিলিট করা সম্ভব হয়নি');

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

  const notificationCategories = [
    {
      id: 'org_requests',
      titleBn: 'প্রতিষ্ঠান অনুমোদন আবেদন',
      titleEn: 'Institute Verifications',
      count: orgVerificationRequests.length,
      icon: Building2,
      navKey: 'org_requests',
    },
    {
      id: 'post_requests',
      titleBn: 'শিক্ষার্থী পোস্ট ছাড়পত্র',
      titleEn: 'Student Post Approvals',
      count: studentPostRequests.length,
      icon: GraduationCap,
      navKey: 'post_requests',
    },
    {
      id: 'donation_approval',
      titleBn: 'অনুদান পেমেন্ট যাচাই',
      titleEn: 'Donation Verifications',
      count: pendingDonations.length,
      icon: DollarSign,
      navKey: 'donation_approval',
    },
    {
      id: 'affiliation_requests',
      titleBn: 'শিক্ষক ও শিক্ষার্থী চূড়ান্ত অনুমোদন',
      titleEn: 'Teacher & Student Clearances',
      count: (adminPendingAffiliations?.teachers?.length || 0) + (adminPendingAffiliations?.students?.length || 0),
      icon: UserCheck,
      navKey: 'affiliation_requests',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg, #f8fafc)', color: 'var(--color-text, #0f172a)' }}>
      {/* Top Clean Executive Bar (Unified Desktop & Mobile) */}
      <header className={styles.adminHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {/* Mobile Drawer Trigger (Small screens only) */}
          <button
            type="button"
            className={styles.mobileMenuTrigger}
            onClick={() => setIsMobileDrawerOpen(true)}
            aria-label={isBn ? 'এডমিন মেনু ড্রয়ার খুলুন' : 'Open Admin Menu Drawer'}
          >
            <Menu size={22} color="#34d399" />
          </button>

          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: '#059669',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={20} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
            <span style={{ fontWeight: 800, fontSize: '0.98rem', color: '#ffffff', whiteSpace: 'nowrap' }}>
              {isBn ? 'সাদাকাহ বিডি' : 'Sadaqahbd'}
            </span>
            <span className={styles.adminHeaderSubtitle}>
              {user?.role === UserRole.MASTER_ADMIN
                ? (isBn ? 'মাস্টার এডমিন কন্ট্রোল সেন্টার' : 'Master Admin Control Center')
                : user?.role === UserRole.SUPER_ADMIN
                ? (isBn ? 'সুপার এডমিন কন্ট্রোল সেন্টার' : 'Super Admin Control Center')
                : (isBn ? 'এডমিন প্যানেল' : 'Admin Panel')}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Link
            href="/"
            className={styles.publicSiteBtn}
            title={isBn ? 'পাবলিক ওয়েবসাইট দেখুন' : 'Visit Public Website'}
            aria-label={isBn ? 'পাবলিক ওয়েবসাইট' : 'Public Site'}
          >
            <Globe size={16} className={styles.publicSiteIcon} />
            <span className={styles.publicSiteText}>
              {isBn ? 'পাবলিক ওয়েবসাইট' : 'Public Site'}
            </span>
          </Link>

          {/* Admin Notifications Dropdown (small & large screens) */}
          <AdminNotificationDropdown
            categories={notificationCategories}
            onSelectNav={handleNavSelect}
          />

          {/* Profile Dropdown with Name & Actions */}
          <UserMenuDropdown customDisplayName={displayName} customRole={displayRole} />
        </div>
      </header>

      <div className={styles.adminLayout}>

      {/* ====================================================================
          Mobile Off-Canvas Drawer Backdrop & Drawer
          ==================================================================== */}
      <div
        className={`${styles.drawerOverlay} ${isMobileDrawerOpen ? styles.drawerOverlayOpen : ''}`}
        onClick={() => setIsMobileDrawerOpen(false)}
      />

      <aside className={`${styles.mobileDrawer} ${isMobileDrawerOpen ? styles.mobileDrawerOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.userProfileCard}>
            <div className={styles.userAvatar}>{displayName.charAt(0)}</div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{displayName}</span>
              <span className={styles.userRole}>{user?.email || displayRole}</span>
            </div>
          </div>
          <button
            className={styles.collapseBtn}
            onClick={() => setIsMobileDrawerOpen(false)}
            aria-label={isBn ? 'ড্রয়ার বন্ধ করুন' : 'Close Drawer'}
          >
            <X size={18} />
          </button>
        </div>

        {/* Mobile Navigation Links */}
        <div style={{ flex: 1, paddingBottom: '1rem' }}>
          {renderNavSections(
            activeNav,
            handleNavSelect,
            orgVerificationRequests.length,
            studentPostRequests.length,
            pendingDonations.length,
            user?.role,
            false,
            (adminPendingAffiliations?.teachers?.length || 0) + (adminPendingAffiliations?.students?.length || 0),
            allUsers.length,
            itemDonationsList.filter((i: any) => i.status === 'pending').length,
            isBn
          )}
        </div>

        {/* Mobile Drawer Bottom Logout */}
        <div className={styles.drawerFooter}>
          <button
            type="button"
            onClick={async () => {
              await useAuthStore.getState().logout();
              window.location.href = '/login';
            }}
            className={styles.drawerLogoutBtn}
          >
            <LogOut size={18} />
            <span>{isBn ? 'লগআউট' : 'Logout'}</span>
          </button>
        </div>
      </aside>

      {/* ====================================================================
          Desktop Sidebar Navigation Drawer (Collapsible)
          ==================================================================== */}
      <aside
        className={`${styles.sidebarDrawer} ${
          isSidebarCollapsed ? styles.sidebarDrawerCollapsed : ''
        }`}
      >
        <div className={styles.sidebarHeader}>
          {!isSidebarCollapsed && (
            <div className={styles.userProfileCard}>
              <div className={styles.userAvatar}>{displayName.charAt(0)}</div>
              <div className={styles.userInfo}>
                <span className={styles.userName}>{displayName}</span>
                <span className={styles.userRole}>{user?.email || displayRole}</span>
              </div>
            </div>
          )}

          <button
            className={styles.collapseBtn}
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            title={isSidebarCollapsed ? (isBn ? 'ড্রয়ার প্রসারিত করুন' : 'Expand Sidebar') : (isBn ? 'ড্রয়ার সংকুচিত করুন' : 'Collapse Sidebar')}
          >
            {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Desktop Navigation Links */}
        <div style={{ flex: 1 }}>
          {renderNavSections(
            activeNav,
            handleNavSelect,
            orgVerificationRequests.length,
            studentPostRequests.length,
            pendingDonations.length,
            user?.role,
            isSidebarCollapsed,
            (adminPendingAffiliations?.teachers?.length || 0) + (adminPendingAffiliations?.students?.length || 0),
            allUsers.length,
            itemDonationsList.filter((i: any) => i.status === 'pending').length,
            isBn
          )}
        </div>

        {/* Desktop Drawer Bottom Logout */}
        <div className={styles.drawerFooter}>
          <button
            type="button"
            onClick={async () => {
              await useAuthStore.getState().logout();
              window.location.href = '/login';
            }}
            className={styles.drawerLogoutBtn}
            title={isBn ? 'লগআউট' : 'Logout'}
          >
            <LogOut size={18} />
            {!isSidebarCollapsed && <span>{isBn ? 'লগআউট' : 'Logout'}</span>}
          </button>
        </div>
      </aside>

      {/* ====================================================================
          Main Content Workspace
          ==================================================================== */}
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
          <div>
            <div className={styles.contentHeader}>
              <div>
                <h1 className={styles.pageTitle}>
                  <ShieldCheck size={28} color="var(--color-primary)" />
                  {isBn ? 'এডমিন ড্যাশবোর্ড ওভারভিউ' : 'Admin Dashboard Overview'}
                </h1>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
                  {isBn
                    ? 'সাদাকাহ বিডি কেন্দ্রীয় অ্যাডমিনিস্ট্রেশন ও নির্বাহী সিদ্ধান্ত কেন্দ্র।'
                    : 'Sadaqahbd Central Administration & Executive Control Center.'}
                </p>
              </div>

              <button
                onClick={() => loadAdminData()}
                className="btn btn-outline"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.5rem 1rem' }}
              >
                <RefreshCw size={14} className={loadingData ? 'spin' : ''} />
                <span>{isBn ? 'রিফ্রেশ' : 'Refresh'}</span>
              </button>
            </div>

            {/* Quick KPI Stat Cards */}
            <div className={styles.kpiGrid}>
              <div
                className={`${styles.kpiCard} card`}
                style={{
                  padding: '1.25rem',
                  backgroundColor: 'var(--surface, #ffffff)',
                  borderRadius: '12px',
                  border: '1px solid var(--color-border)',
                }}
              >
                <span className={styles.kpiTitle} style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                  {isBn ? 'প্রতিষ্ঠান আবেদন (অপেক্ষমাণ)' : 'Institute Applications (Pending)'}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                  <span className={styles.kpiValue} style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f59e0b' }}>
                    {loadingData ? '...' : (isBn ? orgVerificationRequests.length.toLocaleString('bn-BD') : orgVerificationRequests.length)}
                  </span>
                  <Building2 size={28} color="#f59e0b" opacity={0.6} />
                </div>
                <button
                  onClick={() => setActiveNav('org_requests')}
                  style={{
                    marginTop: '0.75rem',
                    fontSize: '0.8rem',
                    color: 'var(--color-primary)',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {isBn ? 'যাচাই করুন →' : 'Review →'}
                </button>
              </div>

              <div
                className={`${styles.kpiCard} card`}
                style={{
                  padding: '1.25rem',
                  backgroundColor: 'var(--surface, #ffffff)',
                  borderRadius: '12px',
                  border: '1px solid var(--color-border)',
                }}
              >
                <span className={styles.kpiTitle} style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                  {isBn ? 'শিক্ষক ও শিক্ষার্থী ছাড়পত্র' : 'Teacher & Student Clearances'}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                  <span className={styles.kpiValue} style={{ fontSize: '1.75rem', fontWeight: 800, color: '#06b6d4' }}>
                    {loadingData
                      ? '...'
                      : (isBn
                          ? ((adminPendingAffiliations?.teachers?.length || 0) + (adminPendingAffiliations?.students?.length || 0)).toLocaleString('bn-BD')
                          : (adminPendingAffiliations?.teachers?.length || 0) + (adminPendingAffiliations?.students?.length || 0))}
                  </span>
                  <UserCheck size={28} color="#06b6d4" opacity={0.6} />
                </div>
                <button
                  onClick={() => setActiveNav('affiliation_requests')}
                  style={{
                    marginTop: '0.75rem',
                    fontSize: '0.8rem',
                    color: 'var(--color-primary)',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {isBn ? 'ছাড়পত্র দিন →' : 'Clearances →'}
                </button>
              </div>

              <div
                className={`${styles.kpiCard} card`}
                style={{
                  padding: '1.25rem',
                  backgroundColor: 'var(--surface, #ffffff)',
                  borderRadius: '12px',
                  border: '1px solid var(--color-border)',
                }}
              >
                <span className={styles.kpiTitle} style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                  {isBn ? 'শিক্ষার্থী পোস্ট (অপেক্ষমাণ)' : 'Student Campaigns (Pending)'}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                  <span className={styles.kpiValue} style={{ fontSize: '1.75rem', fontWeight: 800, color: '#3b82f6' }}>
                    {loadingData ? '...' : (isBn ? studentPostRequests.length.toLocaleString('bn-BD') : studentPostRequests.length)}
                  </span>
                  <GraduationCap size={28} color="#3b82f6" opacity={0.6} />
                </div>
                <button
                  onClick={() => setActiveNav('student_posts')}
                  style={{
                    marginTop: '0.75rem',
                    fontSize: '0.8rem',
                    color: 'var(--color-primary)',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {isBn ? 'পোস্ট যাচাই করুন →' : 'Review Campaigns →'}
                </button>
              </div>

              <div
                className={`${styles.kpiCard} card`}
                style={{
                  padding: '1.25rem',
                  backgroundColor: 'var(--surface, #ffffff)',
                  borderRadius: '12px',
                  border: '1px solid var(--color-border)',
                }}
              >
                <span className={styles.kpiTitle} style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                  {isBn ? 'অনুদান পেমেন্ট যাচাই' : 'Donation Verifications'}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                  <span className={styles.kpiValue} style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981' }}>
                    {loadingData ? '...' : (isBn ? pendingDonations.length.toLocaleString('bn-BD') : pendingDonations.length)}
                  </span>
                  <DollarSign size={28} color="#10b981" opacity={0.6} />
                </div>
                <button
                  onClick={() => setActiveNav('pending_donations')}
                  style={{
                    marginTop: '0.75rem',
                    fontSize: '0.8rem',
                    color: 'var(--color-primary)',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {isBn ? 'অনুদান যাচাই করুন →' : 'Verify Donations →'}
                </button>
              </div>

              <div
                className={`${styles.kpiCard} card`}
                style={{
                  padding: '1.25rem',
                  backgroundColor: 'var(--surface, #ffffff)',
                  borderRadius: '12px',
                  border: '1px solid var(--color-border)',
                }}
              >
                <span className={styles.kpiTitle} style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                  {isBn ? 'পণ্য অনুদান যাচাই' : 'Item Donations (Pending)'}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                  <span className={styles.kpiValue} style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ec4899' }}>
                    {loadingData
                      ? '...'
                      : (isBn
                          ? itemDonationsList.filter((i: any) => i.status === 'pending').length.toLocaleString('bn-BD')
                          : itemDonationsList.filter((i: any) => i.status === 'pending').length)}
                  </span>
                  <Package size={28} color="#ec4899" opacity={0.6} />
                </div>
                <button
                  onClick={() => setActiveNav('item_donations')}
                  style={{
                    marginTop: '0.75rem',
                    fontSize: '0.8rem',
                    color: 'var(--color-primary)',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {isBn ? 'পণ্য যাচাই করুন →' : 'Verify Items →'}
                </button>
              </div>

              <div
                className={`${styles.kpiCard} card`}
                style={{
                  padding: '1.25rem',
                  backgroundColor: 'var(--surface, #ffffff)',
                  borderRadius: '12px',
                  border: '1px solid var(--color-border)',
                }}
              >
                <span className={styles.kpiTitle} style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                  {isBn ? 'সক্রিয় সুপার এডমিন' : 'Active Super Admins'}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                  <span className={styles.kpiValue} style={{ fontSize: '1.75rem', fontWeight: 800, color: '#8b5cf6' }}>
                    {loadingData ? '...' : (isBn ? superAdmins.length.toLocaleString('bn-BD') : superAdmins.length)}
                  </span>
                  <Users size={28} color="#8b5cf6" opacity={0.6} />
                </div>
                <button
                  onClick={() => setActiveNav('super_admins')}
                  style={{
                    marginTop: '0.75rem',
                    fontSize: '0.8rem',
                    color: 'var(--color-primary)',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {isBn ? 'স্টাফ পরিচালনা →' : 'Manage Staff →'}
                </button>
              </div>
            </div>

            {/* Quick Action Approval Queues Overview Card */}
            <div
              className="card"
              style={{
                padding: '1.5rem',
                backgroundColor: 'var(--surface, #ffffff)',
                borderRadius: '12px',
                border: '1px solid var(--color-border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                <SlidersHorizontal size={20} color="var(--color-primary)" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-main, #0f172a)' }}>
                  {isBn ? 'অপেক্ষমাণ ছাড়পত্র ও সিদ্ধান্ত সারসংক্ষেপ' : 'Pending Clearances & Action Queue Summary'}
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* Queue 1: Institute Requests */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    backgroundColor: 'var(--background-alt, #f8fafc)',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Building2 size={18} color="#f59e0b" />
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      {isBn ? 'শিক্ষা প্রতিষ্ঠান অনুমোদন আবেদন' : 'Institution Verification Requests'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <span
                      style={{
                        padding: '0.2rem 0.65rem',
                        borderRadius: '9999px',
                        backgroundColor: orgVerificationRequests.length > 0 ? '#fef3c7' : '#ecfdf5',
                        color: orgVerificationRequests.length > 0 ? '#92400e' : '#047857',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                      }}
                    >
                      {isBn
                        ? `${orgVerificationRequests.length.toLocaleString('bn-BD')} টি অপেক্ষমাণ`
                        : `${orgVerificationRequests.length} Pending`}
                    </span>
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem', fontWeight: 600 }}
                      onClick={() => setActiveNav('org_requests')}
                    >
                      {isBn ? 'যাচাই করুন' : 'Review'}
                    </button>
                  </div>
                </div>

                {/* Queue 2: Teacher & Student Affiliations */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    backgroundColor: 'var(--background-alt, #f8fafc)',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <UserCheck size={18} color="#06b6d4" />
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      {isBn ? 'শিক্ষক ও শিক্ষার্থী চূড়ান্ত ছাড়পত্র' : 'Teacher & Student Clearances'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <span
                      style={{
                        padding: '0.2rem 0.65rem',
                        borderRadius: '9999px',
                        backgroundColor:
                          ((adminPendingAffiliations?.teachers?.length || 0) + (adminPendingAffiliations?.students?.length || 0)) > 0
                            ? '#e0f2fe'
                            : '#ecfdf5',
                        color:
                          ((adminPendingAffiliations?.teachers?.length || 0) + (adminPendingAffiliations?.students?.length || 0)) > 0
                            ? '#0369a1'
                            : '#047857',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                      }}
                    >
                      {isBn
                        ? `${((adminPendingAffiliations?.teachers?.length || 0) + (adminPendingAffiliations?.students?.length || 0)).toLocaleString('bn-BD')} টি অপেক্ষমাণ`
                        : `${(adminPendingAffiliations?.teachers?.length || 0) + (adminPendingAffiliations?.students?.length || 0)} Pending`}
                    </span>
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem', fontWeight: 600 }}
                      onClick={() => setActiveNav('affiliation_requests')}
                    >
                      {isBn ? 'ছাড়পত্র দিন' : 'Clearances'}
                    </button>
                  </div>
                </div>

                {/* Queue 3: Student Campaigns */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    backgroundColor: 'var(--background-alt, #f8fafc)',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <GraduationCap size={18} color="#3b82f6" />
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      {isBn ? 'শিক্ষার্থী পোস্ট ও আর্থিক খরচ যাচাই' : 'Student Campaign & Expense Verifications'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <span
                      style={{
                        padding: '0.2rem 0.65rem',
                        borderRadius: '9999px',
                        backgroundColor: studentPostRequests.length > 0 ? '#dbeafe' : '#ecfdf5',
                        color: studentPostRequests.length > 0 ? '#1d4ed8' : '#047857',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                      }}
                    >
                      {isBn
                        ? `${studentPostRequests.length.toLocaleString('bn-BD')} টি অপেক্ষমাণ`
                        : `${studentPostRequests.length} Pending`}
                    </span>
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem', fontWeight: 600 }}
                      onClick={() => setActiveNav('student_posts')}
                    >
                      {isBn ? 'যাচাই করুন' : 'Review'}
                    </button>
                  </div>
                </div>

                {/* Queue 4: Monetary Donations */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    backgroundColor: 'var(--background-alt, #f8fafc)',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <DollarSign size={18} color="#10b981" />
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      {isBn ? 'আর্থিক অনুদান পেমেন্ট যাচাই' : 'Financial Donation Verifications'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <span
                      style={{
                        padding: '0.2rem 0.65rem',
                        borderRadius: '9999px',
                        backgroundColor: pendingDonations.length > 0 ? '#ecfdf5' : '#f1f5f9',
                        color: pendingDonations.length > 0 ? '#047857' : '#64748b',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                      }}
                    >
                      {isBn
                        ? `${pendingDonations.length.toLocaleString('bn-BD')} টি অপেক্ষমাণ`
                        : `${pendingDonations.length} Pending`}
                    </span>
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem', fontWeight: 600 }}
                      onClick={() => setActiveNav('pending_donations')}
                    >
                      {isBn ? 'অনুমোদন করুন' : 'Verify'}
                    </button>
                  </div>
                </div>

                {/* Queue 5: Item Donations */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    backgroundColor: 'var(--background-alt, #f8fafc)',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Package size={18} color="#ec4899" />
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      {isBn ? 'পণ্য অনুদান গ্রহণ ও ছাড়পত্র' : 'Item Donations Verification'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <span
                      style={{
                        padding: '0.2rem 0.65rem',
                        borderRadius: '9999px',
                        backgroundColor:
                          itemDonationsList.filter((i: any) => i.status === 'pending').length > 0
                            ? '#fce7f3'
                            : '#f1f5f9',
                        color:
                          itemDonationsList.filter((i: any) => i.status === 'pending').length > 0
                            ? '#9d174d'
                            : '#64748b',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                      }}
                    >
                      {isBn
                        ? `${itemDonationsList.filter((i: any) => i.status === 'pending').length.toLocaleString('bn-BD')} টি অপেক্ষমাণ`
                        : `${itemDonationsList.filter((i: any) => i.status === 'pending').length} Pending`}
                    </span>
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem', fontWeight: 600 }}
                      onClick={() => setActiveNav('item_donations')}
                    >
                      {isBn ? 'তদারকি করুন' : 'Review'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: Super Admin List */}
        {activeNav === 'super_admins' && (
          <div>
            <div className={styles.contentHeader}>
              <div>
                <h1 className={styles.pageTitle}>
                  <Users size={26} color="var(--color-primary)" />
                  {t('superAdminList')}
                </h1>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                  সিস্টেমের সক্রিয় সুপার এডমিন কর্মকর্তা এবং তাদের অনুমতি পরিচালনা।
                </p>
              </div>
              {(user?.role === UserRole.MASTER_ADMIN || getPermission(PermissionModuleKey.SUPER_ADMIN_LIST).canEdit) && (
                <button
                  className="btn btn-primary"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                  onClick={() => {
                    resetAdminForm();
                    setActionDrawer({
                      isOpen: true,
                      type: 'add_super_admin',
                      itemData: {},
                      reason: '',
                    });
                  }}
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
                <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>ডাটা লোড হচ্ছে...</p>
              ) : superAdmins.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                  কোনো সুপার এডমিন পাওয়া যায়নি।
                </p>
              ) : (
                <>
                  {/* Desktop Data Table (>= 768px) */}
                  <div className={styles.desktopTableOnly}>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                            <th style={{ padding: '0.75rem' }}>নাম</th>
                            <th style={{ padding: '0.75rem' }}>ইমেইল</th>
                            <th style={{ padding: '0.75rem' }}>ফোন</th>
                            <th style={{ padding: '0.75rem' }}>রোল</th>
                            <th style={{ padding: '0.75rem', textAlign: 'right' }}>অ্যাকশন</th>
                          </tr>
                        </thead>
                        <tbody>
                          {superAdmins.map((admin) => (
                            <tr key={admin.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                              <td style={{ padding: '0.75rem', fontWeight: '600' }}>{admin.fullName || admin.name}</td>
                              <td style={{ padding: '0.75rem' }}>{admin.email}</td>
                              <td style={{ padding: '0.75rem' }}>{admin.phone || '—'}</td>
                              <td style={{ padding: '0.75rem' }}>
                                <span style={{
                                  padding: '0.15rem 0.5rem',
                                  borderRadius: '4px',
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  backgroundColor: admin.role === 'super_admin' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                                  color: admin.role === 'super_admin' ? '#7c3aed' : '#2563eb',
                                }}>
                                  {admin.role === 'super_admin' ? (isBn ? 'সুপার এডমিন' : 'Super Admin') : (isBn ? 'এডমিন' : 'Admin')}
                                </span>
                              </td>
                              <td style={{ padding: '0.75rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                {user?.role === UserRole.MASTER_ADMIN && (
                                  <button
                                    className="btn btn-outline"
                                    style={{
                                      padding: '0.3rem 0.6rem',
                                      fontSize: '0.8rem',
                                      marginRight: '0.5rem',
                                      color: 'var(--color-primary)',
                                      borderColor: 'var(--color-primary)',
                                    }}
                                    onClick={() => handleOpenEditPermissions(admin)}
                                    title={isBn ? 'পারমিশন এডিট' : 'Edit Permissions'}
                                  >
                                    <Edit size={14} /> {isBn ? 'পারমিশন' : 'Edit'}
                                  </button>
                                )}
                                {user?.role === UserRole.MASTER_ADMIN && (
                                  <button
                                    className="btn btn-outline"
                                    style={{
                                      padding: '0.3rem 0.5rem',
                                      color: 'var(--color-accent, #ef4444)',
                                      borderColor: 'var(--color-accent, #ef4444)',
                                    }}
                                    onClick={() => handleDeleteSuperAdmin(admin.id, admin.fullName || admin.name)}
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
                          <span style={{
                            padding: '0.2rem 0.55rem',
                            borderRadius: '20px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            backgroundColor: admin.role === 'super_admin' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                            color: admin.role === 'super_admin' ? '#7c3aed' : '#2563eb',
                          }}>
                            {admin.role === 'super_admin' ? (isBn ? 'সুপার এডমিন' : 'Super Admin') : (isBn ? 'এডমিন' : 'Admin')}
                          </span>
                        </div>

                        <div className={styles.mobileCardRow}>
                          <span style={{ color: 'var(--color-text-muted)' }}>ফোন:</span>
                          <span style={{ fontWeight: 600 }}>{admin.phone || '—'}</span>
                        </div>

                        {user?.role === UserRole.MASTER_ADMIN && (
                          <div className={styles.mobileCardActions}>
                            <button
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
                              onClick={() => handleOpenEditPermissions(admin)}
                            >
                              <Edit size={14} /> <span>{isBn ? 'পারমিশন এডিট' : 'Edit'}</span>
                            </button>
                            <button
                              className="btn btn-outline"
                              style={{
                                padding: '0.45rem 0.75rem',
                                color: 'var(--color-accent, #ef4444)',
                                borderColor: 'var(--color-accent, #ef4444)',
                              }}
                              onClick={() => handleDeleteSuperAdmin(admin.id, admin.fullName || admin.name)}
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
        )}

        {/* VIEW 2.5: Universal Users Directory & Audit (Master Admin & Super Admin) */}
        {activeNav === 'all_users' && (
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
                                  <div>{u.fullName || 'Unnamed'}</div>
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
                                      {u.role === 'student' && (
                                        <button
                                          type="button"
                                          onClick={() => setSelectedStudentDetailsId(u.id)}
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
                                          title={isBn ? 'শিক্ষার্থীর বিস্তারিত প্রোফাইল ও পোস্ট দেখুন' : 'View Student Profile & Posts'}
                                        >
                                          <Eye size={14} />
                                          <span>{isBn ? 'বিস্তারিত' : 'Details'}</span>
                                        </button>
                                      )}
                                      {u.status === 'suspended' ? (
                                        <button
                                          type="button"
                                          onClick={() => handleToggleUserStatus(u.id, 'active', u.fullName || u.email)}
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
                                          onClick={() => handleToggleUserStatus(u.id, 'suspended', u.fullName || u.email)}
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

                                      {user?.role === UserRole.MASTER_ADMIN && (
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteUser(u.id, u.fullName || u.email)}
                                          style={{
                                            padding: '0.35rem 0.6rem',
                                            backgroundColor: '#fff',
                                            border: '1px solid #fecaca',
                                            color: '#dc2626',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                          }}
                                          title={isBn ? 'ডিলিট করুন' : 'Delete User'}
                                        >
                                          <Trash2 size={14} />
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
                              <div className={styles.mobileCardTitle}>{u.fullName || 'Unnamed'}</div>
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
                                {u.role === 'student' && (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedStudentDetailsId(u.id)}
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
                                    <span>{isBn ? 'বিস্তারিত' : 'Details'}</span>
                                  </button>
                                )}
                                {u.status === 'suspended' ? (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleUserStatus(u.id, 'active', u.fullName || u.email)}
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
                                    onClick={() => handleToggleUserStatus(u.id, 'suspended', u.fullName || u.email)}
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

                                {user?.role === UserRole.MASTER_ADMIN && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteUser(u.id, u.fullName || u.email)}
                                    className="btn btn-outline"
                                    style={{
                                      padding: '0.45rem 0.75rem',
                                      color: '#dc2626',
                                      borderColor: '#fecaca',
                                    }}
                                    title={isBn ? 'ডিলিট করুন' : 'Delete'}
                                  >
                                    <Trash2 size={14} />
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
          </div>
        )}

        {/* VIEW 3: Org Verification Requests */}
        {activeNav === 'org_requests' && (
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
                    <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>ডাটা লোড হচ্ছে...</p>
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
                            <h4 style={{ fontWeight: '700', fontSize: '1.05rem', marginBottom: '0.25rem', color: 'var(--text-main, #0f172a)' }}>
                              {org.name}
                            </h4>
                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: 0 }}>
                              {isBn ? 'রেজিস্ট্রেশন কোড:' : 'Reg Code:'} <strong>{org.regNo}</strong> | {isBn ? 'প্রতিনিধি:' : 'Contact:'} {org.contact} ({org.phone || 'ফোন নেই'})
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
                                    {isBn ? 'রেজিস্ট্রেশন কোড:' : 'Reg Code:'} <strong>{org.regNo || 'নেই'}</strong> | {isBn ? 'প্রতিনিধি:' : 'Contact:'} {org.contact} ({org.phone || 'ফোন নেই'})
                                    {org.email && ` | ইমেইল: ${org.email}`}
                                  </p>
                                  {org.address && (
                                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted, #64748b)', margin: '0.25rem 0 0' }}>
                                      {isBn ? 'ঠিকানা:' : 'Address:'} {org.address}
                                    </p>
                                  )}
                                  {org.description && (
                                    <p style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic', margin: '0.25rem 0 0' }}>
                                      "{org.description}"
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
        )}

        {/* VIEW 4: Student Posts Verification */}
        {activeNav === 'student_posts' && (
          <div>
            <div className={styles.contentHeader}>
              <div>
                <h1 className={styles.pageTitle}>
                  <GraduationCap size={26} color="var(--color-primary)" />
                  {isBn ? 'শিক্ষার্থী পোস্ট যাচাই ও ছাড়পত্র' : 'Student Campaign Verifications'}
                </h1>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                  {isBn
                    ? 'শিক্ষক ও প্রতিষ্ঠান প্রধান কর্তৃক ডাবল ভেরিফাইড আবেদনসমূহ, বাজেট সমন্বয় ও চূড়ান্ত অনুমোদনের ইতিহাস।'
                    : 'Double-verified student campaigns, budget adjustment, and final approval records.'}
                </p>
              </div>
            </div>

            {/* Sub-tabs: Pending vs History */}
            <div className={styles.verificationTabs}>
              <button
                type="button"
                className={`${styles.verificationTabBtn} ${postVerificationTab === 'pending' ? styles.verificationTabBtnActive : ''}`}
                onClick={() => setPostVerificationTab('pending')}
              >
                <Clock size={16} />
                <span>{isBn ? 'পেন্ডিং অনুমোদন' : 'Pending Clearances'}</span>
                <span className={styles.tabBadge}>{studentPostRequests.length}</span>
              </button>

              <button
                type="button"
                className={`${styles.verificationTabBtn} ${postVerificationTab === 'history' ? styles.verificationTabBtnActive : ''}`}
                onClick={() => setPostVerificationTab('history')}
              >
                <HistoryIcon size={16} />
                <span>{isBn ? 'পোস্ট যাচাই ইতিহাস' : 'Clearance History'}</span>
                <span className={styles.tabBadge}>{studentPostHistory.length}</span>
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
              {postVerificationTab === 'pending' ? (
                <>
                  {loadingData ? (
                    <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>ডাটা লোড হচ্ছে...</p>
                  ) : studentPostRequests.length === 0 ? (
                    <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>
                      {isBn ? 'কোনো শিক্ষার্থী পোস্ট অনুমোদনের অপেক্ষায় নেই।' : 'No student posts pending approval.'}
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      {studentPostRequests.map((post) => (
                        <div
                          key={post.id}
                          style={{
                            padding: '1.25rem',
                            backgroundColor: 'var(--background-alt, #f8fafc)',
                            borderRadius: '12px',
                            border: '1px solid var(--color-border)',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              marginBottom: '0.5rem',
                              flexWrap: 'wrap',
                              gap: '0.5rem',
                            }}
                          >
                            <div>
                              <h4 style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--color-primary-dark)' }}>
                                {post.title}
                              </h4>
                              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: '0.2rem 0 0' }}>
                                শিক্ষার্থী: <strong>{post.studentName}</strong> | প্রতিষ্ঠান: <strong>{post.institution}</strong>
                              </p>
                            </div>
                            <span style={{ fontWeight: '800', color: 'var(--color-primary)', fontSize: '1.2rem' }}>
                              ৳{Number(post.amount || 0).toLocaleString()}
                            </span>
                          </div>

                          {post.expenses && post.expenses.length > 0 && (
                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                              {post.expenses.map((exp: any, i: number) => (
                                <span key={i} className={styles.expenseChip}>
                                        <span className={styles.expenseChipCat}>{exp.category}:</span>
                                        <span className={styles.expenseChipAmt}>৳{Number(exp.amount || 0).toLocaleString()}</span>
                                      </span>
                              ))}
                            </div>
                          )}

                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginTop: '1rem',
                              flexWrap: 'wrap',
                              gap: '0.75rem',
                            }}
                          >
                            <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem', flexWrap: 'wrap' }}>
                              {post.teacherVerified && (
                                <span
                                  style={{
                                    padding: '0.2rem 0.6rem',
                                    backgroundColor: 'rgba(13, 148, 136, 0.12)',
                                    color: 'var(--color-primary)',
                                    borderRadius: '6px',
                                    fontWeight: 600,
                                  }}
                                >
                                  ✓ শিক্ষক যাচাইকৃত
                                </span>
                              )}
                              {post.orgVerified && (
                                <span
                                  style={{
                                    padding: '0.2rem 0.6rem',
                                    backgroundColor: 'rgba(13, 148, 136, 0.12)',
                                    color: 'var(--color-primary)',
                                    borderRadius: '6px',
                                    fontWeight: 600,
                                  }}
                                >
                                  ✓ প্রতিষ্ঠান সিলমোহর
                                </span>
                              )}
                            </div>

                            <button
                              className="btn btn-primary"
                              style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
                              onClick={() => handleOpenPostReview(post)}
                            >
                              <Eye size={16} /> {isBn ? 'ড্রয়ারে বিস্তারিত দেখুন ও অনুমোদন করুন' : 'Review & Approve'}
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
                        placeholder={isBn ? 'পোস্টের শিরোনাম, শিক্ষার্থী বা প্রতিষ্ঠান দিয়ে খুঁজুন...' : 'Search by title, student, institution...'}
                        value={postHistorySearch}
                        onChange={(e) => setPostHistorySearch(e.target.value)}
                      />
                    </div>

                    <select
                      className={styles.historyFilterSelect}
                      value={postHistoryStatusFilter}
                      onChange={(e) => setPostHistoryStatusFilter(e.target.value as any)}
                    >
                      <option value="all">{isBn ? 'সকল স্ট্যাটাস (All)' : 'All Statuses'}</option>
                      <option value="approved">{isBn ? 'অনুমোদিত ও লাইভ' : 'Approved'}</option>
                      <option value="rejected">{isBn ? 'পোস্ট বাতিলকৃত' : 'Rejected'}</option>
                    </select>
                  </div>

                  {(() => {
                    const term = postHistorySearch.toLowerCase().trim();
                    const filtered = studentPostHistory.filter((post) => {
                      const matchStatus =
                        postHistoryStatusFilter === 'all' || post.status === postHistoryStatusFilter;
                      const matchSearch =
                        !term ||
                        (post.title && post.title.toLowerCase().includes(term)) ||
                        (post.studentName && post.studentName.toLowerCase().includes(term)) ||
                        (post.institution && post.institution.toLowerCase().includes(term));
                      return matchStatus && matchSearch;
                    });

                    if (filtered.length === 0) {
                      return (
                        <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2.5rem' }}>
                          {isBn ? 'কোনো পূর্বের পোস্ট রেকর্ড পাওয়া যায়নি।' : 'No historical student post records found.'}
                        </p>
                      );
                    }

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {filtered.map((post) => {
                          const isApproved = post.status === 'approved';
                          return (
                            <div key={post.id} className={styles.historyCard}>
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
                                <div style={{ flex: '1 1 300px' }}>
                                  <h4 style={{ fontWeight: 800, fontSize: '1.1rem', margin: 0, color: 'var(--text-main, #0f172a)' }}>
                                    {post.title}
                                  </h4>
                                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: '0.35rem 0 0' }}>
                                    শিক্ষার্থী: <strong>{post.studentName}</strong> | প্রতিষ্ঠান: <strong>{post.institution}</strong>
                                    {post.studentPhone && ` | ফোন: ${post.studentPhone}`}
                                    {post.studentEmail && ` | ইমেইল: ${post.studentEmail}`}
                                  </p>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                                  <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>প্রয়োজনীয় অনুদান</div>
                                    <div style={{ fontWeight: 800, color: 'var(--color-primary)', fontSize: '1.15rem' }}>
                                      ৳{Number(post.amount || 0).toLocaleString()}
                                    </div>
                                  </div>
                                  <div>
                                    {isApproved ? (
                                      <span className={styles.historyBadgeApproved}>
                                        <CheckCircle2 size={13} /> {isBn ? 'অনুমোদিত ও লাইভ' : 'Approved & Live'}
                                      </span>
                                    ) : (
                                      <span className={styles.historyBadgeRejected}>
                                        <XCircle size={13} /> {isBn ? 'পোস্ট বাতিলকৃত' : 'Rejected'}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Problem Description Preview */}
                              {post.problemDesc && (
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-main, #334155)', margin: '0.5rem 0', lineHeight: 1.5 }}>
                                  {post.problemDesc.length > 200 ? `${post.problemDesc.slice(0, 200)}...` : post.problemDesc}
                                </p>
                              )}

                              {/* Itemized Expenses Breakdown */}
                              {post.expenses && post.expenses.length > 0 && (
                                <div style={{ margin: '0.65rem 0' }}>
                                  <div className={styles.expenseBreakdownLabel}>
                                    {isBn ? 'খরচের ক্যাটাগরি ও বিভাজন:' : 'Expense Breakdown:'}
                                  </div>
                                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                    {post.expenses.map((exp: any, i: number) => (
                                      <span key={i} className={styles.expenseChip}>
                                        <span className={styles.expenseChipCat}>{exp.category}:</span>
                                        <span className={styles.expenseChipAmt}>৳{Number(exp.amount || 0).toLocaleString()}</span>
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Admin Notes */}
                              {post.adminModificationReason && (
                                <div
                                  style={{
                                    marginTop: '0.65rem',
                                    padding: '0.6rem 0.85rem',
                                    backgroundColor: '#fffbeb',
                                    border: '1px solid #fde68a',
                                    borderRadius: '8px',
                                    fontSize: '0.82rem',
                                    color: '#92400e',
                                  }}
                                >
                                  <strong>⚠️ {isBn ? 'এডমিন খরচের বিভাজন সমন্বয় নোট:' : 'Admin Modification Note:'}</strong> {post.adminModificationReason}
                                </div>
                              )}

                              {post.rejectionReason && (
                                <div
                                  className={styles.historyRejectionBox}
                                >
                                  <strong>❌ {isBn ? 'প্রত্যাখ্যানের কারণ:' : 'Rejection Reason:'}</strong> {post.rejectionReason}
                                </div>
                              )}

                              {/* Footer Action & Dates */}
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  paddingTop: '0.75rem',
                                  borderTop: '1px solid var(--color-border, #e2e8f0)',
                                  marginTop: '0.75rem',
                                  flexWrap: 'wrap',
                                  gap: '0.75rem',
                                  fontSize: '0.8rem',
                                  color: 'var(--text-muted, #64748b)',
                                }}
                              >
                                <div>
                                  <span>{isBn ? 'নিষ্পত্তির তারিখ:' : 'Reviewed on:'} </span>
                                  <strong>
                                    {post.updatedAt
                                      ? new Date(post.updatedAt).toLocaleString(isBn ? 'bn-BD' : 'en-US')
                                      : post.createdAt
                                      ? new Date(post.createdAt).toLocaleString(isBn ? 'bn-BD' : 'en-US')
                                      : '—'}
                                  </strong>
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                  {post.studentId && (
                                    <button
                                      type="button"
                                      className="btn btn-outline"
                                      style={{
                                        padding: '0.35rem 0.75rem',
                                        backgroundColor: '#eff6ff',
                                        borderColor: '#bfdbfe',
                                        color: '#1d4ed8',
                                        fontSize: '0.8rem',
                                        fontWeight: 700,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.35rem',
                                      }}
                                      onClick={() => setSelectedStudentDetailsId(post.studentId)}
                                    >
                                      <GraduationCap size={14} /> {isBn ? 'শিক্ষার্থীর প্রোফাইল' : 'Student Profile'}
                                    </button>
                                  )}

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
                                    onClick={() => handleOpenPostReview(post, true)}
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
        )}

        {/* VIEW: Affiliation Final Clearances (Teachers & Students Stage 2) */}
        {activeNav === 'affiliation_requests' && (
          <div>
            <div className={styles.contentHeader}>
              <div>
                <h1 className={styles.pageTitle}>
                  <UserCheck size={26} color="var(--color-primary)" />
                  {isBn ? 'শিক্ষক ও শিক্ষার্থী ছাড়পত্র ও অনুমোদন' : 'Teacher & Student Clearances'}
                </h1>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                  {isBn
                    ? 'প্রতিষ্ঠান কর্তৃক প্রাথমিকভাবে অনুমোদিত শিক্ষক ও শিক্ষার্থীদের চূড়ান্ত অনুমোদন ও নিষ্পত্তির পূর্বের ইতিহাস।'
                    : 'Institutional affiliation clearance requests and historical verification records.'}
                </p>
              </div>
            </div>

            {/* Sub-tabs: Pending vs History */}
            <div className={styles.verificationTabs}>
              <button
                type="button"
                className={`${styles.verificationTabBtn} ${affiliationVerificationTab === 'pending' ? styles.verificationTabBtnActive : ''}`}
                onClick={() => setAffiliationVerificationTab('pending')}
              >
                <Clock size={16} />
                <span>{isBn ? 'পেন্ডিং ছাড়পত্র' : 'Pending Clearances'}</span>
                <span className={styles.tabBadge}>
                  {adminPendingAffiliations.teachers.length + adminPendingAffiliations.students.length}
                </span>
              </button>

              <button
                type="button"
                className={`${styles.verificationTabBtn} ${affiliationVerificationTab === 'history' ? styles.verificationTabBtnActive : ''}`}
                onClick={() => setAffiliationVerificationTab('history')}
              >
                <HistoryIcon size={16} />
                <span>{isBn ? 'ছাড়পত্রের পূর্বের ইতিহাস' : 'Clearance History'}</span>
                <span className={styles.tabBadge}>
                  {adminAffiliationsHistory.teachers.length + adminAffiliationsHistory.students.length}
                </span>
              </button>
            </div>

            {affiliationVerificationTab === 'pending' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Teacher Approvals */}
                <div
                  className="card"
                  style={{
                    padding: '1.5rem',
                    backgroundColor: 'var(--surface, #ffffff)',
                    borderRadius: '12px',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main, #0f172a)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <UserCheck size={20} color="#2563eb" />
                    {isBn ? 'প্রতিষ্ঠান অনুমোদিত শিক্ষক তালিকা' : 'Institute-Approved Teacher List'} ({adminPendingAffiliations.teachers.length})
                  </h3>

                  {adminPendingAffiliations.teachers.length === 0 ? (
                    <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '1.5rem', margin: 0 }}>
                      {isBn ? 'কোনো শিক্ষক চূড়ান্ত অনুমোদনের জন্য অপেক্ষমাণ নেই।' : 'No teachers pending final approval.'}
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {adminPendingAffiliations.teachers.map((t) => (
                        <div
                          key={t.profileId}
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
                            <h4 style={{ fontWeight: '700', fontSize: '1.05rem', margin: 0, color: 'var(--text-main, #0f172a)' }}>
                              {t.fullName}
                            </h4>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted, #64748b)', margin: '0.25rem 0 0' }}>
                              {isBn ? 'প্রতিষ্ঠান: ' : 'Institution: '}<strong style={{ color: 'var(--text-main, #0f172a)' }}>{t.institutionName}</strong>
                              {t.designation && ` | ${isBn ? 'পদবী: ' : 'Designation: '}${t.designation}`}
                              {t.department && ` | ${isBn ? 'বিভাগ: ' : 'Dept: '}${t.department}`}
                              {t.employeeId && ` | ${isBn ? 'আইডি: ' : 'ID: '}${t.employeeId}`}
                            </p>
                            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0.2rem 0 0' }}>
                              {isBn ? 'ইমেইল: ' : 'Email: '}{t.email} | {isBn ? 'ফোন: ' : 'Phone: '}{t.phone || (isBn ? 'নেই' : 'N/A')}
                            </p>
                          </div>

                          <button
                            className="btn btn-primary"
                            style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
                            onClick={() =>
                              setActionDrawer({
                                isOpen: true,
                                type: 'affiliation_review',
                                itemData: { ...t, role: 'teacher' },
                                reason: '',
                              })
                            }
                          >
                            <Eye size={16} /> {isBn ? 'যাচাই ও চূড়ান্ত অনুমোদন' : 'Verify & Approve'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Student Approvals */}
                <div
                  className="card"
                  style={{
                    padding: '1.5rem',
                    backgroundColor: 'var(--surface, #ffffff)',
                    borderRadius: '12px',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main, #0f172a)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <GraduationCap size={20} color="#059669" />
                    {isBn ? 'প্রতিষ্ঠান অনুমোদিত শিক্ষার্থী তালিকা' : 'Institute-Approved Student List'} ({adminPendingAffiliations.students.length})
                  </h3>

                  {adminPendingAffiliations.students.length === 0 ? (
                    <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '1.5rem', margin: 0 }}>
                      {isBn ? 'কোনো শিক্ষার্থী চূড়ান্ত অনুমোদনের জন্য অপেক্ষমাণ নেই।' : 'No students pending final approval.'}
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {adminPendingAffiliations.students.map((s) => (
                        <div
                          key={s.profileId}
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
                            <h4 style={{ fontWeight: '700', fontSize: '1.05rem', margin: 0, color: 'var(--text-main, #0f172a)' }}>
                              {s.fullName}
                            </h4>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted, #64748b)', margin: '0.25rem 0 0' }}>
                              {isBn ? 'প্রতিষ্ঠান: ' : 'Institution: '}<strong style={{ color: 'var(--text-main, #0f172a)' }}>{s.institutionName}</strong>
                              {s.studentClassRoll && ` | ${isBn ? 'ক্লাস/রোল: ' : 'Class/Roll: '}${s.studentClassRoll}`}
                              {s.address && ` | ${isBn ? 'ঠিকানা: ' : 'Address: '}${s.address}`}
                            </p>
                            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0.2rem 0 0' }}>
                              {isBn ? 'ইমেইল: ' : 'Email: '}{s.email} | {isBn ? 'ফোন: ' : 'Phone: '}{s.phone || (isBn ? 'নেই' : 'N/A')}
                            </p>
                          </div>

                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                            <button
                              type="button"
                              className="btn btn-outline"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                padding: '0.45rem 0.85rem',
                                fontSize: '0.85rem',
                                color: '#1d4ed8',
                                borderColor: '#bfdbfe',
                                backgroundColor: '#eff6ff',
                                borderRadius: '8px',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                              onClick={() => setSelectedStudentDetailsId(s.profileId || s.userId)}
                            >
                              <Eye size={15} />
                              {isBn ? 'বিস্তারিত' : 'Details'}
                            </button>
                            <button
                              className="btn btn-primary"
                              style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
                              onClick={() =>
                                setActionDrawer({
                                  isOpen: true,
                                  type: 'affiliation_review',
                                  itemData: { ...s, role: 'student' },
                                  reason: '',
                                })
                              }
                            >
                              <Eye size={16} /> {isBn ? 'যাচাই ও চূড়ান্ত অনুমোদন' : 'Verify & Approve'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* History Tab View */
              <div
                className="card"
                style={{
                  padding: '1.5rem',
                  backgroundColor: 'var(--surface, #ffffff)',
                  borderRadius: '12px',
                  border: '1px solid var(--color-border)',
                }}
              >
                {/* Search & Filter Bar */}
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
                      placeholder={isBn ? 'নাম, ইমেইল, ফোন, বিভাগ, রোল বা প্রতিষ্ঠান দিয়ে খুঁজুন...' : 'Search by name, email, roll, org...'}
                      value={affHistorySearch}
                      onChange={(e) => setAffHistorySearch(e.target.value)}
                    />
                  </div>

                  <select
                    className={styles.historyFilterSelect}
                    value={affHistoryRoleFilter}
                    onChange={(e) => setAffHistoryRoleFilter(e.target.value as any)}
                  >
                    <option value="all">
                      {isBn ? 'সকল সদস্য' : 'All Members'} ({adminAffiliationsHistory.teachers.length + adminAffiliationsHistory.students.length})
                    </option>
                    <option value="teacher">
                      {isBn ? 'শিক্ষক' : 'Teachers'} ({adminAffiliationsHistory.teachers.length})
                    </option>
                    <option value="student">
                      {isBn ? 'শিক্ষার্থী' : 'Students'} ({adminAffiliationsHistory.students.length})
                    </option>
                  </select>

                  <select
                    className={styles.historyFilterSelect}
                    value={affHistoryStatusFilter}
                    onChange={(e) => setAffHistoryStatusFilter(e.target.value as any)}
                  >
                    <option value="all">{isBn ? 'সকল স্ট্যাটাস' : 'All Statuses'}</option>
                    <option value="verified">{isBn ? 'চূড়ান্ত অনুমোদিত' : 'Verified'}</option>
                    <option value="rejected">{isBn ? 'আবেদন বাতিলকৃত' : 'Rejected'}</option>
                  </select>
                </div>

                {(() => {
                  const term = affHistorySearch.toLowerCase().trim();
                  const combined = [
                    ...adminAffiliationsHistory.teachers.map((t) => ({ ...t, role: 'teacher' as const })),
                    ...adminAffiliationsHistory.students.map((s) => ({ ...s, role: 'student' as const })),
                  ].filter((item) => {
                    const matchRole =
                      affHistoryRoleFilter === 'all' || item.role === affHistoryRoleFilter;
                    const matchStatus =
                      affHistoryStatusFilter === 'all' || item.verificationStatus === affHistoryStatusFilter;
                    const matchSearch =
                      !term ||
                      (item.fullName && item.fullName.toLowerCase().includes(term)) ||
                      (item.email && item.email.toLowerCase().includes(term)) ||
                      (item.phone && item.phone.includes(term)) ||
                      (item.institutionName && item.institutionName.toLowerCase().includes(term)) ||
                      (item.orgName && item.orgName.toLowerCase().includes(term)) ||
                      (item.department && item.department.toLowerCase().includes(term)) ||
                      (item.studentClassRoll && item.studentClassRoll.toLowerCase().includes(term));
                    return matchRole && matchStatus && matchSearch;
                  });

                  if (combined.length === 0) {
                    return (
                      <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2.5rem' }}>
                        {isBn ? 'কোনো পূর্বের ছাড়পত্র রেকর্ড পাওয়া যায়নি।' : 'No historical affiliation records found.'}
                      </p>
                    );
                  }

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {combined.map((item) => {
                        const isVerified = item.verificationStatus === 'verified';
                        const isTeacher = item.role === 'teacher';

                        return (
                          <div key={item.profileId} className={styles.historyCard}>
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
                                  <h4 style={{ fontWeight: 800, fontSize: '1.05rem', margin: 0, color: 'var(--text-main, #0f172a)' }}>
                                    {item.fullName}
                                  </h4>

                                  {isTeacher ? (
                                    <span
                                      style={{
                                        backgroundColor: '#eff6ff',
                                        color: '#1d4ed8',
                                        border: '1px solid #bfdbfe',
                                        padding: '0.15rem 0.55rem',
                                        borderRadius: '999px',
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.25rem',
                                      }}
                                    >
                                      <UserCheck size={12} /> {isBn ? 'শিক্ষক' : 'Teacher'}
                                    </span>
                                  ) : (
                                    <span
                                      style={{
                                        backgroundColor: '#f0fdf4',
                                        color: '#15803d',
                                        border: '1px solid #bbf7d0',
                                        padding: '0.15rem 0.55rem',
                                        borderRadius: '999px',
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.25rem',
                                      }}
                                    >
                                      <GraduationCap size={12} /> {isBn ? 'শিক্ষার্থী' : 'Student'}
                                    </span>
                                  )}
                                </div>

                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted, #64748b)', margin: '0.3rem 0 0' }}>
                                  প্রতিষ্ঠান: <strong style={{ color: 'var(--text-main, #0f172a)' }}>{item.institutionName || item.orgName}</strong>
                                  {isTeacher && item.designation && ` | পদবী: ${item.designation}`}
                                  {isTeacher && item.department && ` | বিভাগ: ${item.department}`}
                                  {isTeacher && item.employeeId && ` | আইডি: ${item.employeeId}`}
                                  {!isTeacher && item.studentClassRoll && ` | ক্লাস ও রোল: ${item.studentClassRoll}`}
                                  {!isTeacher && item.className && ` | শ্রেণি: ${item.className}`}
                                  {!isTeacher && item.department && ` | বিভাগ: ${item.department}`}
                                  {!isTeacher && item.fatherName && ` | পিতা: ${item.fatherName}`}
                                </p>

                                {!isTeacher && item.guardianName && (
                                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.2rem 0 0' }}>
                                    অভিভাবক: {item.guardianName} ({item.guardianPhone || 'ফোন নেই'})
                                  </p>
                                )}

                                {item.address && (
                                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.2rem 0 0' }}>
                                    ঠিকানা: {item.address}
                                  </p>
                                )}

                                {/* Contact info with copy action */}
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', marginTop: '0.4rem', fontSize: '0.8rem', color: '#475569' }}>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                    ইমেইল: <strong>{item.email}</strong>
                                    <button
                                      type="button"
                                      onClick={() => handleCopyText(item.email, `aff-email-${item.profileId}`)}
                                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, color: '#059669' }}
                                      title={isBn ? 'ইমেইল কপি করুন' : 'Copy Email'}
                                    >
                                      {copiedFieldKey === `aff-email-${item.profileId}` ? <Check size={12} color="#059669" /> : <Copy size={12} />}
                                    </button>
                                  </span>

                                  {item.phone && (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                      | ফোন: <strong>{item.phone}</strong>
                                      <button
                                        type="button"
                                        onClick={() => handleCopyText(item.phone, `aff-phone-${item.profileId}`)}
                                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, color: '#059669' }}
                                        title={isBn ? 'ফোন নম্বর কপি করুন' : 'Copy Phone'}
                                      >
                                        {copiedFieldKey === `aff-phone-${item.profileId}` ? <Check size={12} color="#059669" /> : <Copy size={12} />}
                                      </button>
                                    </span>
                                  )}
                                </div>

                                {item.rejectionReason && (
                                  <div
                                    style={{
                                      marginTop: '0.5rem',
                                      padding: '0.5rem 0.75rem',
                                      backgroundColor: '#fef2f2',
                                      border: '1px solid #fecaca',
                                      borderRadius: '8px',
                                      fontSize: '0.8rem',
                                      color: '#991b1b',
                                    }}
                                  >
                                    <strong>❌ প্রত্যাখ্যানের কারণ:</strong> {item.rejectionReason}
                                  </div>
                                )}
                              </div>

                              <div>
                                {isVerified ? (
                                  <span className={styles.historyBadgeApproved}>
                                    <CheckCircle2 size={13} /> {isBn ? 'চূড়ান্ত অনুমোদিত' : 'Verified'}
                                  </span>
                                ) : (
                                  <span className={styles.historyBadgeRejected}>
                                    <XCircle size={13} /> {isBn ? 'আবেদন বাতিল' : 'Rejected'}
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
                                marginTop: '0.75rem',
                                flexWrap: 'wrap',
                                gap: '0.75rem',
                                fontSize: '0.8rem',
                                color: 'var(--text-muted, #64748b)',
                              }}
                            >
                              <div>
                                <span>{isBn ? 'নিষ্পত্তির তারিখ:' : 'Reviewed on:'} </span>
                                <strong>
                                  {item.adminApprovedAt
                                    ? new Date(item.adminApprovedAt).toLocaleString(isBn ? 'bn-BD' : 'en-US')
                                    : item.updatedAt
                                    ? new Date(item.updatedAt).toLocaleString(isBn ? 'bn-BD' : 'en-US')
                                    : '—'}
                                </strong>
                              </div>

                              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {!isTeacher && (
                                  <button
                                    type="button"
                                    className="btn btn-outline"
                                    style={{
                                      padding: '0.35rem 0.75rem',
                                      backgroundColor: '#eff6ff',
                                      borderColor: '#bfdbfe',
                                      color: '#1d4ed8',
                                      fontSize: '0.8rem',
                                      fontWeight: 700,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.35rem',
                                    }}
                                    onClick={() => setSelectedStudentDetailsId(item.profileId || item.userId)}
                                  >
                                    <Eye size={14} /> {isBn ? 'বিস্তারিত প্রোফাইল ও পোস্ট' : 'Student Profile'}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* VIEW 5: Donor List & Profiles */}
        {activeNav === 'donors' && (
          <div>
            <div className={styles.contentHeader}>
              <div>
                <h1 className={styles.pageTitle}>
                  <Heart size={26} color="#ec4899" />
                  {isBn ? 'সম্মানিত ডোনার তালিকা ও প্রোফাইল' : 'Donor Directory & Profiles'} ({donorsList.length})
                </h1>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                  {isBn
                    ? 'প্ল্যাটফর্মের নিবন্ধিত দাতা, তাদের মোট আর্থিক অবদান ও বিস্তারিত লেনদেন হিস্ট্রি পর্যালোচনা।'
                    : 'Registered donors, total contributions, and detailed donation activity oversight.'}
                </p>
              </div>
            </div>

            {/* Donor Search Bar */}
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
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '240px' }}>
                <Search size={18} color="var(--color-text-muted)" />
                <input
                  type="text"
                  placeholder={isBn ? 'নাম, ইমেইল অথবা ফোন নম্বর দিয়ে দাতা খুঁজুন...' : 'Search donors by name, email, or phone...'}
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
              </div>

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
                  {isBn ? 'রিসেট' : 'Clear'}
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
                <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>
                  {isBn ? 'ডাটা লোড হচ্ছে...' : 'Loading data...'}
                </p>
              ) : donorsList.length === 0 ? (
                <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>
                  {isBn ? 'কোনো নিবন্ধিত দাতা পাওয়া যায়নি।' : 'No registered donors found.'}
                </p>
              ) : (
                (() => {
                  const filteredDonors = donorsList.filter((d) => {
                    if (!donorListSearch) return true;
                    const q = donorListSearch.toLowerCase();
                    return (
                      (d.fullName && d.fullName.toLowerCase().includes(q)) ||
                      (d.email && d.email.toLowerCase().includes(q)) ||
                      (d.phone && d.phone.toLowerCase().includes(q))
                    );
                  });

                  if (filteredDonors.length === 0) {
                    return (
                      <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>
                        {isBn ? 'অনুসন্ধানের সাথে কোনো দাতা মেলেনি।' : 'No donors matched your search query.'}
                      </p>
                    );
                  }

                  return (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                            <th style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{isBn ? 'দাতা' : 'Donor'}</th>
                            <th style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{isBn ? 'যোগাযোগ' : 'Contact'}</th>
                            <th style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{isBn ? 'স্ট্যাটাস' : 'Status'}</th>
                            <th style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{isBn ? 'নিবন্ধন' : 'Joined'}</th>
                            <th style={{ padding: '0.75rem', textAlign: 'right', color: 'var(--text-muted)' }}>{isBn ? 'অ্যাকশন' : 'Action'}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredDonors.map((donor) => (
                            <tr key={donor.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                              <td style={{ padding: '0.75rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                  <div
                                    style={{
                                      width: '36px',
                                      height: '36px',
                                      borderRadius: '50%',
                                      backgroundColor: 'rgba(236, 72, 153, 0.12)',
                                      color: '#db2777',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontWeight: 700,
                                      fontSize: '0.95rem',
                                    }}
                                  >
                                    {donor.fullName ? donor.fullName[0].toUpperCase() : 'D'}
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
                                      {donor.fullName || (isBn ? 'অজ্ঞাত দাতা' : 'Anonymous')}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                      ID: <code>{donor.id.slice(0, 8)}</code>
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td style={{ padding: '0.75rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.85rem' }}>
                                  {donor.email && (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                      <Mail size={13} color="#64748b" />
                                      <span>{donor.email}</span>
                                    </span>
                                  )}
                                  {donor.phone && (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)' }}>
                                      <Phone size={13} color="#64748b" />
                                      <span>{donor.phone}</span>
                                    </span>
                                  )}
                                </div>
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

                              <td style={{ padding: '0.75rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                {donor.createdAt
                                  ? new Date(donor.createdAt).toLocaleDateString(isBn ? 'bn-BD' : 'en-US')
                                  : '—'}
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
                                  title={isBn ? 'বিস্তারিত প্রোফাইল ও অনুদান হিস্টোরি দেখুন' : 'View Profile & Donation History'}
                                >
                                  <Eye size={15} />
                                  <span>{isBn ? 'প্রোফাইল ও হিস্টোরি' : 'Profile & History'}</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        )}

        {/* VIEW 6: Financial Donations Verification & Clearance History */}
        {activeNav === 'pending_donations' && (
          <div>
            <div className={styles.contentHeader}>
              <div>
                <h1 className={styles.pageTitle}>
                  <DollarSign size={26} color="#10b981" />
                  {isBn ? 'অনুদান পেমেন্ট যাচাই ও ছাড়পত্র' : 'Donation Payment Verifications'}
                </h1>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                  {isBn
                    ? 'দাতাদের প্রেরিত লেনদেন আইডি যাচাই, পাবলিক লেজারে পোস্টিং ও অনুমোদনের অতীত ইতিহাস।'
                    : 'Verify transaction references, post to the public ledger, and review clearance history.'}
                </p>
              </div>
            </div>

            {/* Sub-tabs: Pending vs History */}
            <div className={styles.verificationTabs}>
              <button
                type="button"
                className={`${styles.verificationTabBtn} ${pendingDonationsTab === 'pending' ? styles.verificationTabBtnActive : ''}`}
                onClick={() => setPendingDonationsTab('pending')}
              >
                <Clock size={16} />
                <span>{isBn ? 'পেন্ডিং পেমেন্ট অনুমোদন' : 'Pending Approvals'}</span>
                <span className={styles.tabBadge}>{pendingDonations.length}</span>
              </button>

              <button
                type="button"
                className={`${styles.verificationTabBtn} ${pendingDonationsTab === 'history' ? styles.verificationTabBtnActive : ''}`}
                onClick={() => setPendingDonationsTab('history')}
              >
                <HistoryIcon size={16} />
                <span>{isBn ? 'অনুমোদন ও বাতিলের ইতিহাস' : 'Clearance History'}</span>
                <span className={styles.tabBadge}>{donationsHistory.length}</span>
              </button>
            </div>

            {/* TAB 1: Pending Donations */}
            {pendingDonationsTab === 'pending' && (
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
                ) : pendingDonations.length === 0 ? (
                  <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>
                    {isBn ? 'কোনো অনুদান ভেরিফিকেশন অপেক্ষমান নেই।' : 'No pending donations waiting for verification.'}
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {pendingDonations.map((don) => (
                      <div
                        key={don.id}
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <span style={{ fontWeight: '700', fontSize: '1.05rem', color: 'var(--text-main, #0f172a)' }}>
                              {don.donorName}
                            </span>
                            <span
                              style={{
                                fontSize: '0.75rem',
                                padding: '0.15rem 0.5rem',
                                borderRadius: '4px',
                                fontWeight: 600,
                                backgroundColor: don.type === 'random' ? 'rgba(13, 148, 136, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                                color: don.type === 'random' ? '#0d9488' : '#2563eb',
                              }}
                            >
                              {don.type === 'random' ? (isBn ? 'সাধারণ শিক্ষা তহবিল' : 'General Fund') : `সরাসরি: ${don.studentName}`}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                            মাধ্যম: <strong>{don.method}</strong> | ট্রানজেকশন আইডি: <code>{don.trxId}</code> {don.time && `| সময়: ${don.time}`}
                          </p>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                          <span style={{ fontWeight: '800', color: 'var(--color-primary)', fontSize: '1.25rem' }}>
                            ৳{Number(don.amount || 0).toLocaleString()}
                          </span>

                          <button
                            className="btn btn-primary"
                            style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
                            onClick={() => handleOpenDonationReview(don)}
                          >
                            <Eye size={16} /> {isBn ? 'ড্রয়ারে যাচাই ও ছাড়' : 'Review & Verify'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Clearance History */}
            {pendingDonationsTab === 'history' && (
              <div>
                {/* Search & Filter Toolbar */}
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
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '220px' }}>
                    <Search size={18} color="var(--color-text-muted)" />
                    <input
                      type="text"
                      placeholder={isBn ? 'দাতা, TrxID বা ক্যাম্পেইন নাম দিয়ে খুঁজুন...' : 'Search by donor, TrxID, or campaign...'}
                      value={donationHistorySearch}
                      onChange={(e) => setDonationHistorySearch(e.target.value)}
                      style={{
                        width: '100%',
                        border: 'none',
                        outline: 'none',
                        fontSize: '0.9rem',
                        backgroundColor: 'transparent',
                        color: 'var(--text-main, #0f172a)',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <select
                      value={donationHistoryStatusFilter}
                      onChange={(e) => setDonationHistoryStatusFilter(e.target.value as any)}
                      style={{
                        padding: '0.4rem 0.75rem',
                        borderRadius: '8px',
                        border: '1px solid var(--color-border)',
                        fontSize: '0.85rem',
                        backgroundColor: 'var(--surface, #ffffff)',
                        color: 'var(--text-main, #0f172a)',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="all">{isBn ? 'সকল হিস্টোরি (All)' : 'All Records'}</option>
                      <option value="accepted">{isBn ? 'অনুমোদিত (Verified)' : 'Verified Only'}</option>
                      <option value="rejected">{isBn ? 'প্রত্যাখ্যাত (Rejected)' : 'Rejected Only'}</option>
                    </select>

                    {(donationHistorySearch || donationHistoryStatusFilter !== 'all') && (
                      <button
                        type="button"
                        onClick={() => {
                          setDonationHistorySearch('');
                          setDonationHistoryStatusFilter('all');
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          color: 'var(--text-muted, #64748b)',
                        }}
                      >
                        {isBn ? 'রিসেট' : 'Clear'}
                      </button>
                    )}
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
                  {donationsHistory.length === 0 ? (
                    <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>
                      {isBn ? 'কোনো অনুদানের পূর্ববর্তী হিস্টোরি পাওয়া যায়নি।' : 'No historical donation clearance records found.'}
                    </p>
                  ) : (
                    (() => {
                      const filteredHistory = donationsHistory.filter((don) => {
                        if (donationHistoryStatusFilter !== 'all' && don.status !== donationHistoryStatusFilter) {
                          return false;
                        }
                        if (donationHistorySearch) {
                          const q = donationHistorySearch.toLowerCase();
                          return (
                            (don.donorName && don.donorName.toLowerCase().includes(q)) ||
                            (don.trxId && don.trxId.toLowerCase().includes(q)) ||
                            (don.studentName && don.studentName.toLowerCase().includes(q)) ||
                            (don.method && don.method.toLowerCase().includes(q))
                          );
                        }
                        return true;
                      });

                      if (filteredHistory.length === 0) {
                        return (
                          <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>
                            {isBn ? 'ফিল্টারের সাথে কোনো হিস্টোরি রেকর্ড মেলেনি।' : 'No history matches the selected filters.'}
                          </p>
                        );
                      }

                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          {filteredHistory.map((don) => (
                            <div
                              key={don.id}
                              style={{
                                padding: '1.25rem',
                                backgroundColor: 'var(--background-alt, #f8fafc)',
                                borderRadius: '10px',
                                border: '1px solid var(--color-border)',
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'flex-start',
                                  flexWrap: 'wrap',
                                  gap: '0.75rem',
                                }}
                              >
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                    <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main, #0f172a)' }}>
                                      {don.donorName}
                                    </span>
                                    <span
                                      style={{
                                        fontSize: '0.75rem',
                                        padding: '0.15rem 0.5rem',
                                        borderRadius: '4px',
                                        fontWeight: 600,
                                        backgroundColor: don.type === 'random' ? 'rgba(13, 148, 136, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                                        color: don.type === 'random' ? '#0d9488' : '#2563eb',
                                      }}
                                    >
                                      {don.type === 'random' ? (isBn ? 'সাধারণ শিক্ষা তহবিল' : 'General Fund') : `সরাসরি: ${don.studentName}`}
                                    </span>
                                  </div>
                                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                    মাধ্যম: <strong>{don.method}</strong> | ট্রানজেকশন আইডি: <code>{don.trxId}</code> {don.time && `| সময়: ${don.time}`}
                                  </p>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                  <span style={{ fontWeight: 800, color: 'var(--color-primary)', fontSize: '1.25rem' }}>
                                    ৳{Number(don.amount || 0).toLocaleString()}
                                  </span>

                                  <button
                                    type="button"
                                    className="btn btn-outline"
                                    style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
                                    onClick={() => handleOpenDonationReview(don, true)}
                                    title={isBn ? 'বিস্তারিত পর্যালোচনা (রিড-অনলি)' : 'Review Details (View Only)'}
                                  >
                                    <Eye size={15} /> {isBn ? 'বিস্তারিত দেখুন' : 'View Details'}
                                  </button>
                                </div>
                              </div>

                              <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                <span
                                  style={{
                                    padding: '0.2rem 0.6rem',
                                    borderRadius: '9999px',
                                    fontSize: '0.78rem',
                                    fontWeight: 700,
                                    backgroundColor: don.status === 'accepted' ? '#ecfdf5' : '#fef2f2',
                                    color: don.status === 'accepted' ? '#047857' : '#b91c1c',
                                    border: `1px solid ${don.status === 'accepted' ? '#a7f3d0' : '#fecaca'}`,
                                  }}
                                >
                                  {don.status === 'accepted' ? '✓ ' + (isBn ? 'অনুমোদিত ও ভেরিফাইড' : 'Verified') : '✕ ' + (isBn ? 'প্রত্যাখ্যাত' : 'Rejected')}
                                </span>

                                {don.donorEmail && (
                                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    ইমেইল: {don.donorEmail}
                                  </span>
                                )}
                                {don.donorPhone && (
                                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    | ফোন: {don.donorPhone}
                                  </span>
                                )}
                              </div>

                              {don.rejectionReason && (
                                <div className={styles.historyRejectionBox}>
                                  <strong>✕ {isBn ? 'প্রত্যাখ্যানের কারণ:' : 'Rejection Reason:'}</strong> {don.rejectionReason}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    })()
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 7: Item Donations Verification & Clearance History */}
        {activeNav === 'item_donations' && (
          <div>
            <div className={styles.contentHeader}>
              <div>
                <h1 className={styles.pageTitle}>
                  <Package size={26} color="#2563eb" />
                  {isBn ? 'পণ্য অনুদান যাচাই ও ছাড়পত্র' : 'Item Donations Verification'}
                </h1>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                  {isBn
                    ? 'শিক্ষার্থীদের জন্য বই, ল্যাপটপ, সাইকেল ও শিক্ষা উপকরণ অনুদানের যাচাই, কুরিয়ার নির্দেশনা ও হিস্টোরি।'
                    : 'Books, laptops, cycles, and educational goods verification, shipment guidance, and clearance history.'}
                </p>
              </div>
            </div>

            {/* Sub-tabs: Pending vs History */}
            <div className={styles.verificationTabs}>
              <button
                type="button"
                className={`${styles.verificationTabBtn} ${itemDonationsTab === 'pending' ? styles.verificationTabBtnActive : ''}`}
                onClick={() => setItemDonationsTab('pending')}
              >
                <Clock size={16} />
                <span>{isBn ? 'পেন্ডিং পণ্য যাচাই' : 'Pending Items'}</span>
                <span className={styles.tabBadge}>
                  {itemDonationsList.filter((i) => i.status === 'pending').length}
                </span>
              </button>

              <button
                type="button"
                className={`${styles.verificationTabBtn} ${itemDonationsTab === 'history' ? styles.verificationTabBtnActive : ''}`}
                onClick={() => setItemDonationsTab('history')}
              >
                <HistoryIcon size={16} />
                <span>{isBn ? 'অনুমোদন ও বাতিলের ইতিহাস' : 'Clearance History'}</span>
                <span className={styles.tabBadge}>
                  {itemDonationsList.filter((i) => i.status !== 'pending').length}
                </span>
              </button>
            </div>

            {/* TAB 1: Pending Item Donations */}
            {itemDonationsTab === 'pending' && (
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
                ) : itemDonationsList.filter((i) => i.status === 'pending').length === 0 ? (
                  <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>
                    {isBn ? 'কোনো পণ্য অনুদান আবেদন অপেক্ষমাণ নেই।' : 'No pending item donations waiting for verification.'}
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {itemDonationsList
                      .filter((i) => i.status === 'pending')
                      .map((item) => (
                        <div
                          key={item.id}
                          style={{
                            padding: '1.25rem',
                            backgroundColor: 'var(--background-alt, #f8fafc)',
                            borderRadius: '10px',
                            border: '1px solid var(--color-border)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            flexWrap: 'wrap',
                            gap: '1rem',
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                              <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#2563eb' }}>
                                {item.itemName}
                              </span>
                              <span
                                style={{
                                  fontSize: '0.8rem',
                                  padding: '0.15rem 0.5rem',
                                  borderRadius: '6px',
                                  fontWeight: 700,
                                  backgroundColor: 'rgba(37, 99, 235, 0.1)',
                                  color: '#2563eb',
                                }}
                              >
                                {isBn ? 'পরিমাণ: ' : 'Qty: '}{item.quantity}
                              </span>
                            </div>

                            <p style={{ fontSize: '0.85rem', color: 'var(--text-main, #334155)', margin: '0.35rem 0' }}>
                              {item.description}
                            </p>

                            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
                              <span>দাতা: <strong>{item.donorName || (isBn ? 'অজ্ঞাত' : 'Anonymous')}</strong> ({item.donorPhone})</span>
                              {item.pickupAddress && <span>পিকআপ ঠিকানা: {item.pickupAddress}</span>}
                              {item.postTitle && <span>ক্যাম্পেইন: <strong>{item.postTitle}</strong></span>}
                            </div>
                          </div>

                          <button
                            type="button"
                            className="btn btn-primary"
                            style={{ padding: '0.45rem 1rem', fontSize: '0.85rem', alignSelf: 'center' }}
                            onClick={() => handleOpenItemDonationReview(item)}
                          >
                            <Eye size={16} /> {isBn ? 'ড্রয়ারে যাচাই ও নির্দেশনা দিন' : 'Review & Instruct'}
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Item Clearance History */}
            {itemDonationsTab === 'history' && (
              <div>
                {/* Search & Filter Toolbar */}
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
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '220px' }}>
                    <Search size={18} color="var(--color-text-muted)" />
                    <input
                      type="text"
                      placeholder={isBn ? 'পণ্য, দাতা নাম বা ফোন দিয়ে খুঁজুন...' : 'Search items by name, donor, or phone...'}
                      value={itemHistorySearch}
                      onChange={(e) => setItemHistorySearch(e.target.value)}
                      style={{
                        width: '100%',
                        border: 'none',
                        outline: 'none',
                        fontSize: '0.9rem',
                        backgroundColor: 'transparent',
                        color: 'var(--text-main, #0f172a)',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <select
                      value={itemHistoryStatusFilter}
                      onChange={(e) => setItemHistoryStatusFilter(e.target.value as any)}
                      style={{
                        padding: '0.4rem 0.75rem',
                        borderRadius: '8px',
                        border: '1px solid var(--color-border)',
                        fontSize: '0.85rem',
                        backgroundColor: 'var(--surface, #ffffff)',
                        color: 'var(--text-main, #0f172a)',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="all">{isBn ? 'সকল হিস্টোরি (All)' : 'All Records'}</option>
                      <option value="accepted">{isBn ? 'অনুমোদিত / গৃহীত (Accepted)' : 'Accepted Only'}</option>
                      <option value="rejected">{isBn ? 'প্রত্যাখ্যাত (Rejected)' : 'Rejected Only'}</option>
                    </select>

                    {(itemHistorySearch || itemHistoryStatusFilter !== 'all') && (
                      <button
                        type="button"
                        onClick={() => {
                          setItemHistorySearch('');
                          setItemHistoryStatusFilter('all');
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          color: 'var(--text-muted, #64748b)',
                        }}
                      >
                        {isBn ? 'রিসেট' : 'Clear'}
                      </button>
                    )}
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
                  {itemDonationsList.filter((i) => i.status !== 'pending').length === 0 ? (
                    <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>
                      {isBn ? 'কোনো পণ্য অনুদানের হিস্টোরি পাওয়া যায়নি।' : 'No historical item donation records found.'}
                    </p>
                  ) : (
                    (() => {
                      const filteredHistory = itemDonationsList
                        .filter((i) => i.status !== 'pending')
                        .filter((item) => {
                          if (itemHistoryStatusFilter !== 'all' && item.status !== itemHistoryStatusFilter) {
                            return false;
                          }
                          if (itemHistorySearch) {
                            const q = itemHistorySearch.toLowerCase();
                            return (
                              (item.itemName && item.itemName.toLowerCase().includes(q)) ||
                              (item.donorName && item.donorName.toLowerCase().includes(q)) ||
                              (item.donorPhone && item.donorPhone.toLowerCase().includes(q)) ||
                              (item.description && item.description.toLowerCase().includes(q))
                            );
                          }
                          return true;
                        });

                      if (filteredHistory.length === 0) {
                        return (
                          <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>
                            {isBn ? 'ফিল্টারের সাথে কোনো হিস্টোরি মেলেনি।' : 'No item donation history matches the filter.'}
                          </p>
                        );
                      }

                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          {filteredHistory.map((item) => (
                            <div
                              key={item.id}
                              style={{
                                padding: '1.25rem',
                                backgroundColor: 'var(--background-alt, #f8fafc)',
                                borderRadius: '10px',
                                border: '1px solid var(--color-border)',
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'flex-start',
                                  flexWrap: 'wrap',
                                  gap: '0.75rem',
                                }}
                              >
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                    <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#2563eb' }}>
                                      {item.itemName}
                                    </span>
                                    <span
                                      style={{
                                        fontSize: '0.78rem',
                                        padding: '0.15rem 0.5rem',
                                        borderRadius: '6px',
                                        fontWeight: 700,
                                        backgroundColor: 'rgba(37, 99, 235, 0.1)',
                                        color: '#2563eb',
                                      }}
                                    >
                                      {isBn ? 'পরিমাণ: ' : 'Qty: '}{item.quantity}
                                    </span>
                                  </div>
                                  <p style={{ fontSize: '0.85rem', color: 'var(--text-main, #334155)', margin: '0.25rem 0' }}>
                                    {item.description}
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  className="btn btn-outline"
                                  style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
                                  onClick={() => handleOpenItemDonationReview(item, true)}
                                  title={isBn ? 'বিস্তারিত পর্যালোচনা (রিড-অনলি)' : 'Review Details (View Only)'}
                                >
                                  <Eye size={15} /> {isBn ? 'বিস্তারিত দেখুন' : 'View Details'}
                                </button>
                              </div>

                              <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap', fontSize: '0.82rem' }}>
                                <span
                                  style={{
                                    padding: '0.2rem 0.6rem',
                                    borderRadius: '9999px',
                                    fontWeight: 700,
                                    backgroundColor: item.status === 'accepted' ? '#ecfdf5' : '#fef2f2',
                                    color: item.status === 'accepted' ? '#047857' : '#b91c1c',
                                    border: `1px solid ${item.status === 'accepted' ? '#a7f3d0' : '#fecaca'}`,
                                  }}
                                >
                                  {item.status === 'accepted' ? '✓ ' + (isBn ? 'অনুমোদিত' : 'Accepted') : '✕ ' + (isBn ? 'প্রত্যাখ্যাত' : 'Rejected')}
                                </span>

                                <span style={{ color: 'var(--text-muted)' }}>
                                  দাতা: <strong>{item.donorName || (isBn ? 'অজ্ঞাত' : 'Anonymous')}</strong> ({item.donorPhone})
                                </span>
                                <span style={{ color: 'var(--text-muted)' }}>
                                  | ডেলিভারি: <strong>{item.deliveryStatus}</strong>
                                </span>
                              </div>

                              {item.adminInstruction && (
                                <div className={styles.historyWarningBox}>
                                  <strong>📋 {isBn ? 'অ্যাডমিন নির্দেশনা:' : 'Admin Instruction:'}</strong> {item.adminInstruction}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    })()
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 9: My Donations (Personal Activity) */}
        {(activeNav === 'my_donations' || activeNav === 'my-donations') && (
          <div style={{ marginTop: '0.5rem' }}>
            <MyDonationsSection />
          </div>
        )}
      </main>

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
                          prev.filter(
                            (key) =>
                              key !== PermissionModuleKey.SUPER_ADMIN_LIST &&
                              key !== PermissionModuleKey.ADMIN_LIST &&
                              key !== PermissionModuleKey.ACCOUNTS_DONATION_APPROVAL
                          )
                        );
                      }}
                      style={{ accentColor: 'var(--color-primary, #059669)', width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <span>{isBn ? 'এডমিন' : 'Admin'}</span>
                  </label>
                </div>
              </div>

              <div style={{ marginTop: '1.25rem' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.6rem', color: 'var(--text-main, #0f172a)' }}>
                  {isBn ? 'মডিউল পারমিশন' : 'Module Permissions'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {ALL_MODULES.filter(
                    (mod) => editAdminRole === 'super_admin' || !mod.superAdminOnly
                  ).map((mod) => (
                    <label
                      key={mod.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.6rem 0.85rem',
                        backgroundColor: 'var(--background-alt, #f8fafc)',
                        color: 'var(--text-main, #0f172a)',
                        borderRadius: '6px',
                        border: '1.5px solid var(--surface-border, #cbd5e1)',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        userSelect: 'none',
                      }}
                    >
                      <span style={{ fontWeight: 500 }}>{isBn ? mod.name : (mod.nameEn || mod.name)}</span>
                      <input
                        type="checkbox"
                        checked={editAdminPermissions.includes(mod.key)}
                        onChange={() => toggleEditPermission(mod.key)}
                        style={{ accentColor: 'var(--color-primary, #059669)', width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                    </label>
                  ))}
                </div>
              </div>

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
                          prev.filter(
                            (key) =>
                              key !== PermissionModuleKey.SUPER_ADMIN_LIST &&
                              key !== PermissionModuleKey.ADMIN_LIST &&
                              key !== PermissionModuleKey.ACCOUNTS_DONATION_APPROVAL
                          )
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

              {/* 1.2: Modular Access - full single section scroll, no internal scrollbar */}
              <div style={{ marginTop: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.6rem' }}>
                  {isBn ? 'মডিউলার অ্যাক্সেস নির্বাচন করুন' : 'Select Modular Access'} (
                  {selectedPermissions.filter((k) => newAdminRole === 'super_admin' || !ALL_MODULES.find((m) => m.key === k)?.superAdminOnly).length}/
                  {ALL_MODULES.filter((m) => newAdminRole === 'super_admin' || !m.superAdminOnly).length})
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {ALL_MODULES.filter((mod) => newAdminRole === 'super_admin' || !mod.superAdminOnly).map((mod) => (
                    <label
                      key={mod.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.6rem 0.85rem',
                        backgroundColor: 'var(--background-alt, #f8fafc)',
                        color: 'var(--text-main, #0f172a)',
                        borderRadius: '6px',
                        border: '1.5px solid var(--surface-border, #cbd5e1)',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        userSelect: 'none',
                      }}
                    >
                      <span style={{ fontWeight: 500 }}>{isBn ? mod.name : (mod.nameEn || mod.name)}</span>
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(mod.key)}
                        onChange={() => togglePermission(mod.key)}
                        style={{ accentColor: 'var(--color-primary, #059669)', width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                    </label>
                  ))}
                </div>
              </div>

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
              style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
              disabled={actionLoading}
              onClick={() => handleExecuteAction('approve')}
            >
              <CheckCircle2 size={16} />
              {actionLoading
                ? (isBn ? 'প্রসেসিং হচ্ছে...' : 'Processing...')
                : (isBn ? 'অনুমোদন নিশ্চিত করুন' : 'Confirm Approval')}
            </button>
          </div>
        )}
      </div>
      </div>

      {/* ====================================================================
          Mobile Bottom Navigation Bar (< 768px - Adaptive App Experience)
          ==================================================================== */}
      <nav className={styles.adminBottomNav} aria-label={isBn ? 'মোবাইল নেভিগেশন' : 'Mobile Admin Navigation'}>
        <button
          type="button"
          className={`${styles.bottomNavItem} ${activeNav === 'overview' ? styles.bottomNavItemActive : ''}`}
          onClick={() => setActiveNav('overview')}
        >
          <ShieldCheck size={20} />
          <span>{isBn ? 'ওভারভিউ' : 'Overview'}</span>
        </button>

        <button
          type="button"
          className={`${styles.bottomNavItem} ${
            ['org_requests', 'student_posts', 'affiliation_requests', 'pending_donations'].includes(activeNav)
              ? styles.bottomNavItemActive
              : ''
          }`}
          onClick={() => setActiveNav('org_requests')}
        >
          <Building2 size={20} />
          <span>{isBn ? 'ছাড়পত্র' : 'Approvals'}</span>
          {(orgVerificationRequests.length +
            studentPostRequests.length +
            pendingDonations.length +
            (adminPendingAffiliations?.teachers?.length || 0) +
            (adminPendingAffiliations?.students?.length || 0)) > 0 && (
            <span className={styles.bottomNavBadge}>
              {(
                orgVerificationRequests.length +
                studentPostRequests.length +
                pendingDonations.length +
                (adminPendingAffiliations?.teachers?.length || 0) +
                (adminPendingAffiliations?.students?.length || 0)
              ).toLocaleString(isBn ? 'bn-BD' : 'en-US')}
            </span>
          )}
        </button>

        <button
          type="button"
          className={`${styles.bottomNavItem} ${
            ['super_admins', 'all_users'].includes(activeNav) ? styles.bottomNavItemActive : ''
          }`}
          onClick={() => setActiveNav(user?.role === UserRole.MASTER_ADMIN ? 'super_admins' : 'all_users')}
        >
          <Users size={20} />
          <span>{isBn ? 'ইউজার' : 'Users'}</span>
        </button>

        <button
          type="button"
          className={styles.bottomNavItem}
          onClick={() => setIsMobileDrawerOpen(true)}
        >
          <Menu size={20} />
          <span>{isBn ? 'মেনু' : 'Menu'}</span>
        </button>
      </nav>

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
    </div>
  );
}

// Helper to render grouped navigation items in Drawer
function renderNavSections(
  activeNav: string,
  onSelect: (key: string) => void,
  orgCount: number,
  postCount: number,
  donationCount: number,
  userRole?: string,
  isCollapsed?: boolean,
  affiliationCount: number = 0,
  allUsersCount: number = 0,
  itemDonationCount: number = 0,
  isBn: boolean = true
) {
  return (
    <>
      {/* 1. Overview */}
      <div className={styles.navSection}>
        {!isCollapsed && <div className={styles.navSectionTitle}>{isBn ? 'মূল কন্ট্রোল' : 'Main Controls'}</div>}
        <button
          className={`${styles.navItem} ${activeNav === 'overview' ? styles.navItemActive : ''}`}
          onClick={() => onSelect('overview')}
          title={isBn ? 'ড্যাশবোর্ড ওভারভিউ' : 'Dashboard Overview'}
        >
          <div className={styles.navItemContent}>
            <ShieldCheck size={18} />
            {!isCollapsed && <span className={styles.navItemText}>{isBn ? 'ড্যাশবোর্ড ওভারভিউ' : 'Dashboard Overview'}</span>}
          </div>
        </button>
      </div>

      {/* 2. User Management (Unified Staff & All Users) */}
      <div className={styles.navSection}>
        {!isCollapsed && <div className={styles.navSectionTitle}>{isBn ? 'ইউজার ব্যবস্থাপনা' : 'User Management'}</div>}
        <button
          className={`${styles.navItem} ${activeNav === 'super_admins' ? styles.navItemActive : ''}`}
          onClick={() => onSelect('super_admins')}
          title={isBn ? 'সুপার এডমিন ও স্টাফ তালিকা' : 'Super Admins & Staff'}
        >
          <div className={styles.navItemContent}>
            <Users size={18} />
            {!isCollapsed && (
              <span className={styles.navItemText}>{isBn ? 'সুপার এডমিন ও স্টাফ তালিকা' : 'Super Admins & Staff'}</span>
            )}
          </div>
        </button>

        <button
          className={`${styles.navItem} ${activeNav === 'all_users' ? styles.navItemActive : ''}`}
          onClick={() => onSelect('all_users')}
          title={isBn ? 'সকল ব্যবহারকারী অডিট' : 'All Users Audit'}
        >
          <div className={styles.navItemContent}>
            <SlidersHorizontal size={18} />
            {!isCollapsed && <span className={styles.navItemText}>{isBn ? 'সকল ইউজার অডিট' : 'All Users Audit'}</span>}
          </div>
          {!isCollapsed && allUsersCount > 0 && (
            <span className={styles.navBadge}>{allUsersCount.toLocaleString(isBn ? 'bn-BD' : 'en-US')}</span>
          )}
        </button>
      </div>

      {/* 3. Verifications & Approvals */}
      <div className={styles.navSection}>
        {!isCollapsed && <div className={styles.navSectionTitle}>{isBn ? 'যাচাই ও অনুমোদন কেন্দ্র' : 'Verification & Clearances'}</div>}
        <button
          className={`${styles.navItem} ${activeNav === 'org_requests' ? styles.navItemActive : ''}`}
          onClick={() => onSelect('org_requests')}
          title={isBn ? 'প্রতিষ্ঠান ভেরিফিকেশন' : 'Institute Verification'}
        >
          <div className={styles.navItemContent}>
            <Building2 size={18} />
            {!isCollapsed && <span className={styles.navItemText}>{isBn ? 'প্রতিষ্ঠান ছাড়পত্র' : 'Institute Clearance'}</span>}
          </div>
          {!isCollapsed && orgCount > 0 && (
            <span className={styles.navBadge}>{orgCount.toLocaleString(isBn ? 'bn-BD' : 'en-US')}</span>
          )}
        </button>

        <button
          className={`${styles.navItem} ${activeNav === 'affiliation_requests' ? styles.navItemActive : ''}`}
          onClick={() => onSelect('affiliation_requests')}
          title={isBn ? 'শিক্ষক ও শিক্ষার্থী অনুমোদন' : 'Teacher & Student Clearances'}
        >
          <div className={styles.navItemContent}>
            <UserCheck size={18} />
            {!isCollapsed && <span className={styles.navItemText}>{isBn ? 'শিক্ষক ও শিক্ষার্থী ছাড়পত্র' : 'Teacher & Student Clearances'}</span>}
          </div>
          {!isCollapsed && affiliationCount > 0 && (
            <span className={styles.navBadge}>{affiliationCount.toLocaleString(isBn ? 'bn-BD' : 'en-US')}</span>
          )}
        </button>

        <button
          className={`${styles.navItem} ${activeNav === 'student_posts' ? styles.navItemActive : ''}`}
          onClick={() => onSelect('student_posts')}
          title={isBn ? 'শিক্ষার্থী পোস্ট যাচাই' : 'Student Campaign Verification'}
        >
          <div className={styles.navItemContent}>
            <GraduationCap size={18} />
            {!isCollapsed && <span className={styles.navItemText}>{isBn ? 'শিক্ষার্থী পোস্ট যাচাই' : 'Student Campaign Verification'}</span>}
          </div>
          {!isCollapsed && postCount > 0 && (
            <span className={styles.navBadge}>{postCount.toLocaleString(isBn ? 'bn-BD' : 'en-US')}</span>
          )}
        </button>
      </div>

      {/* 4. Donors & Community */}
      <div className={styles.navSection}>
        {!isCollapsed && <div className={styles.navSectionTitle}>{isBn ? 'দাতা ও অনুদান' : 'Donors & Donations'}</div>}
        <button
          className={`${styles.navItem} ${activeNav === 'donors' ? styles.navItemActive : ''}`}
          onClick={() => onSelect('donors')}
          title={isBn ? 'ডোনার তালিকা' : 'Donor Directory'}
        >
          <div className={styles.navItemContent}>
            <Heart size={18} />
            {!isCollapsed && <span className={styles.navItemText}>{isBn ? 'ডোনার তালিকা' : 'Donor Directory'}</span>}
          </div>
        </button>

        <button
          className={`${styles.navItem} ${activeNav === 'pending_donations' ? styles.navItemActive : ''}`}
          onClick={() => onSelect('pending_donations')}
          title={isBn ? 'অনুদান পেমেন্ট যাচাই' : 'Donation Payment Verification'}
        >
          <div className={styles.navItemContent}>
            <DollarSign size={18} />
            {!isCollapsed && <span className={styles.navItemText}>{isBn ? 'অনুদান পেমেন্ট যাচাই' : 'Donation Verification'}</span>}
          </div>
          {!isCollapsed && donationCount > 0 && (
            <span className={styles.navBadge}>{donationCount.toLocaleString(isBn ? 'bn-BD' : 'en-US')}</span>
          )}
        </button>

        <button
          className={`${styles.navItem} ${activeNav === 'item_donations' ? styles.navItemActive : ''}`}
          onClick={() => onSelect('item_donations')}
          title={isBn ? 'পণ্য অনুদান যাচাই' : 'Item Donations Verification'}
        >
          <div className={styles.navItemContent}>
            <Package size={18} />
            {!isCollapsed && <span className={styles.navItemText}>{isBn ? 'পণ্য অনুদান যাচাই' : 'Item Donations'}</span>}
          </div>
          {!isCollapsed && itemDonationCount > 0 && (
            <span className={styles.navBadge}>
              {itemDonationCount.toLocaleString(isBn ? 'bn-BD' : 'en-US')}
            </span>
          )}
        </button>
      </div>

      {/* 5. Personal Activity (ব্যক্তিগত কার্যক্রম) */}
      <div className={styles.navSection}>
        {!isCollapsed && <div className={styles.navSectionTitle}>{isBn ? 'ব্যক্তিগত কার্যক্রম' : 'Personal Activity'}</div>}
        <button
          className={`${styles.navItem} ${(activeNav === 'my_donations' || activeNav === 'my-donations') ? styles.navItemActive : ''}`}
          onClick={() => onSelect('my_donations')}
          title={isBn ? 'আমার দান সমূহ' : 'My Donations'}
        >
          <div className={styles.navItemContent}>
            <Heart size={18} color="#10b981" />
            {!isCollapsed && <span className={styles.navItemText}>{isBn ? 'আমার দান সমূহ' : 'My Donations'}</span>}
          </div>
        </button>
      </div>
    </>
  );
}
