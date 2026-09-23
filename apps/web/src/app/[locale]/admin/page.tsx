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
} from 'lucide-react';
import {
  PermissionModuleKey,
  UserRole,
  ModulePermission,
} from '@sadaqahbd/schema';
import { useAuthStore, getRoleDashboardPath } from '@/lib/auth-store';
import { auth } from '@/lib/firebase';
import { getAuthToken } from '@/lib/auth-token';
import { getApiUrl } from '@/lib/api-config';
import PanelHeader from '@/components/layout/PanelHeader';
import UserMenuDropdown from '@/components/profile/UserMenuDropdown';
import AdminNotificationDropdown from '@/components/layout/AdminNotificationDropdown';
import StudentDetailsModal from '@/components/portal/StudentDetailsModal';
import styles from './admin.module.css';


const ALL_MODULES = [
  { key: PermissionModuleKey.SUPER_ADMIN_LIST, name: 'সুপার এডমিন তদারকি', nameEn: 'Super Admin Oversight', superAdminOnly: true },
  { key: PermissionModuleKey.ADMIN_LIST, name: 'সাধারণ এডমিন ম্যানেজমেন্ট', nameEn: 'General Admin Management', superAdminOnly: true },
  { key: PermissionModuleKey.ORG_VERIFICATION_REQUESTS, name: 'শিক্ষা প্রতিষ্ঠান অনুমোদন', nameEn: 'Institution Approvals', superAdminOnly: false },
  { key: PermissionModuleKey.ORG_LIST, name: 'প্রতিষ্ঠান তালিকা', nameEn: 'Institution Directory', superAdminOnly: false },
  { key: PermissionModuleKey.TEACHER_LIST, name: 'শিক্ষক তালিকা', nameEn: 'Teacher Directory', superAdminOnly: false },
  { key: PermissionModuleKey.STUDENT_LIST, name: 'শিক্ষার্থী তালিকা', nameEn: 'Student Directory', superAdminOnly: false },
  { key: PermissionModuleKey.STUDENT_POST_VERIFICATION_REQUESTS, name: 'শিক্ষার্থী পোস্ট ছাড়পত্র', nameEn: 'Student Campaign Clearances', superAdminOnly: false },
  { key: PermissionModuleKey.ACCOUNTS_DONATION_APPROVAL, name: 'অ্যাকাউন্টস ও অনুদান অনুমোদন', nameEn: 'Accounts & Donation Approval', superAdminOnly: true },
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

  // Action / Inspection Slide-Over Drawer State
  const [actionDrawer, setActionDrawer] = useState<{
    isOpen: boolean;
    type: 'org_review' | 'post_review' | 'donation_review' | 'add_super_admin' | 'affiliation_review' | 'edit_permissions';
    itemData: any;
    reason: string;
  }>({
    isOpen: false,
    type: 'org_review',
    itemData: null,
    reason: '',
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
  const [orgEditType, setOrgEditType] = useState('school');
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

  const handleOpenPostReview = (post: any) => {
    setIsEditingExpenses(false);
    setEditedExpenses(
      Array.isArray(post.expenses)
        ? post.expenses.map((e: any) => ({
            category: e.category || e.categoryName || '',
            amount: Number(e.amount || 0),
          }))
        : []
    );
    setExpenseModificationReason('');
    setActionDrawer({
      isOpen: true,
      type: 'post_review',
      itemData: post,
      reason: '',
    });
  };

  const handleOpenOrgReview = (org: any) => {
    setOrgEditName(org.name || '');
    setOrgEditType(org.type || 'school');
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
      reason: '',
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

      // 3. Org Verification Requests
      try {
        const res = await fetch(`${apiUrl}/users/org-requests`, { headers });
        if (res.ok) {
          setOrgVerificationRequests(await res.json());
        }
      } catch (e) {}

      // 4. Student Post Approvals
      try {
        const res = await fetch(`${apiUrl}/posts/pending-approvals`, { headers });
        if (res.ok) {
          setStudentPostRequests(await res.json());
        }
      } catch (e) {}

      // 5. Pending Donations
      try {
        const res = await fetch(`${apiUrl}/donations/pending`, { headers });
        if (res.ok) {
          setPendingDonations(await res.json());
        }
      } catch (e) {}

      // 6. Pending Teacher & Student Final Affiliations
      try {
        const res = await fetch(`${apiUrl}/users/pending-affiliations`, { headers });
        if (res.ok) {
          const affData = await res.json();
          setAdminPendingAffiliations(affData || { teachers: [], students: [] });
        }
      } catch (e) {}

      // 7. Donors List
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
        loadAdminData();
      }

      setActionDrawer({ isOpen: false, type: 'org_review', itemData: null, reason: '' });
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
          ? `${newAdminRole === 'super_admin' ? 'সুপার এডমিন' : 'এডমিন'} "${newAdminName}" সফলভাবে তৈরি হয়েছে। ডিফল্ট পাসওয়ার্ড: pass1233`
          : `${newAdminRole === 'super_admin' ? 'Super Admin' : 'Admin'} "${newAdminName}" created successfully. Default password: pass1233`
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

  const displayName = user?.fullName || 'এডমিন কর্মকর্তা';
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
            aria-label="এডমিন মেনু ড্রয়ার খুলুন"
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
              সাদাকাহ বিডি
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
            aria-label="ড্রয়ার বন্ধ করুন"
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
            allUsers.length
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
            <span>লগআউট</span>
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
            title={isSidebarCollapsed ? 'ড্রয়ার প্রসারিত করুন' : 'ড্রয়ার সংকুচিত করুন'}
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
            allUsers.length
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
            title="লগআউট"
          >
            <LogOut size={18} />
            {!isSidebarCollapsed && <span>লগআউট</span>}
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
                  এডমিন ড্যাশবোর্ড ওভারভিউ
                </h1>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
                  সাদাকাহ বিডি কেন্দ্রীয় অ্যাডমিনিস্ট্রেশন ও দ্রুত সিদ্ধান্ত কেন্দ্র।
                </p>
              </div>

              <button
                onClick={() => loadAdminData()}
                className="btn btn-outline"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.5rem 1rem' }}
              >
                <RefreshCw size={14} className={loadingData ? 'spin' : ''} />
                <span>রিফ্রেশ</span>
              </button>
            </div>

            {/* Quick KPI Stat Cards (Real Live Data) */}
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
                  প্রতিষ্ঠান আবেদন (পেন্ডিং)
                </span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                  <span className={styles.kpiValue} style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f59e0b' }}>
                    {loadingData ? '...' : orgVerificationRequests.length}
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
                  যাচাই করুন →
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
                  শিক্ষার্থী পোস্ট (পেন্ডিং)
                </span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                  <span className={styles.kpiValue} style={{ fontSize: '1.75rem', fontWeight: 800, color: '#3b82f6' }}>
                    {loadingData ? '...' : studentPostRequests.length}
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
                  পোস্ট যাচাই করুন →
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
                  অনুদান পেমেন্ট যাচাই
                </span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                  <span className={styles.kpiValue} style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981' }}>
                    {loadingData ? '...' : pendingDonations.length}
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
                  অনুদান যাচাই করুন →
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
                  সক্রিয় সুপার এডমিন
                </span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                  <span className={styles.kpiValue} style={{ fontSize: '1.75rem', fontWeight: 800, color: '#8b5cf6' }}>
                    {loadingData ? '...' : superAdmins.length}
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
                  স্টাফ পরিচালনা →
                </button>
              </div>
            </div>

            {/* Quick action helper guide */}
            <div
              className="card"
              style={{
                padding: '1.5rem',
                backgroundColor: 'var(--surface, #ffffff)',
                borderRadius: '12px',
                border: '1px solid var(--color-border)',
              }}
            >
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main, #0f172a)' }}>
                সরাসরি ডাটাবেজ তথ্য ও ড্রয়ার অ্যাকশন
              </h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                এখানে প্রদর্শিত সকল তথ্য সরাসরি MySQL ডাটাবেজ ও ক্লাউড সার্ভার থেকে লোড হচ্ছে। ড্রয়ারের যেকোনো অপশনে ক্লিক করে বাস্তব আবেদনপত্র পর্যালোচনা ও সরাসরি অ্যাকশন নিতে পারবেন।
              </p>
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
                  {t('orgVerificationReq')} ({orgVerificationRequests.length})
                </h1>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                  শিক্ষা প্রতিষ্ঠানসমূহ কর্তৃক প্রেরিত প্রাতিষ্ঠানিক ছাড়পত্র ও নিবন্ধন অনুমোদন ড্রয়ার।
                </p>
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
                <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>ডাটা লোড হচ্ছে...</p>
              ) : orgVerificationRequests.length === 0 ? (
                <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>
                  কোনো প্রতিষ্ঠান ছাড়পত্র রিকোয়েস্ট পেন্ডিং নেই।
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
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                          রেজিস্ট্রেশন কোড: <strong>{org.regNo}</strong> | প্রতিনিধি: {org.contact} ({org.phone || 'ফোন নেই'})
                        </p>
                        {org.address && (
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted, #64748b)', marginTop: '0.2rem' }}>
                            ঠিকানা: {org.address}
                          </p>
                        )}
                      </div>

                      <button
                        className="btn btn-primary"
                        style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
                        onClick={() => handleOpenOrgReview(org)}
                      >
                        <Eye size={16} /> ড্রয়ারে যাচাই করুন
                      </button>
                    </div>
                  ))}
                </div>
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
                  {t('postVerificationReq')} ({studentPostRequests.length})
                </h1>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                  শিক্ষক ও প্রতিষ্ঠান প্রধান কর্তৃক ডাবল ভেরিফাইড আবেদন। চূড়ান্ত অনুমোদন পেলে লাইভ হবে।
                </p>
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
                <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>ডাটা লোড হচ্ছে...</p>
              ) : studentPostRequests.length === 0 ? (
                <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>
                  কোনো শিক্ষার্থী পোস্ট অনুমোদনের অপেক্ষায় নেই।
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
                          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                            শিক্ষার্থী: <strong>{post.studentName}</strong> | প্রতিষ্ঠান: <strong>{post.institution}</strong>
                          </p>
                        </div>
                        <span style={{ fontWeight: '800', color: 'var(--color-primary)', fontSize: '1.2rem' }}>
                          ৳{Number(post.amount || 0).toLocaleString()}
                        </span>
                      </div>

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
                          <Eye size={16} /> ড্রয়ারে বিস্তারিত দেখুন ও অনুমোদন করুন
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
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
                  শিক্ষক ও শিক্ষার্থী চূড়ান্ত অনুমোদন (স্টেজ ২)
                </h1>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                  শিক্ষা প্রতিষ্ঠান কর্তৃক প্রাথমিকভাবে অনুমোদিত আবেদনসমূহ। মাস্টার বা সুপার এডমিন চূড়ান্ত ছাড়পত্র দিলে অ্যাকাউন্ট সক্রিয় ও ফিচার উন্মুক্ত হবে।
                </p>
              </div>
            </div>

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
                  প্রতিষ্ঠান অনুমোদিত শিক্ষক তালিকা ({adminPendingAffiliations.teachers.length})
                </h3>

                {adminPendingAffiliations.teachers.length === 0 ? (
                  <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '1.5rem', margin: 0 }}>
                    কোনো শিক্ষক চূড়ান্ত অনুমোদনের জন্য অপেক্ষমাণ নেই।
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
                            প্রতিষ্ঠান: <strong style={{ color: 'var(--text-main, #0f172a)' }}>{t.institutionName}</strong>
                            {t.designation && ` | পদবী: ${t.designation}`}
                            {t.department && ` | বিভাগ: ${t.department}`}
                            {t.employeeId && ` | আইডি: ${t.employeeId}`}
                          </p>
                          <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0.2rem 0 0' }}>
                            ইমেইল: {t.email} | ফোন: {t.phone || 'নেই'}
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
                          <Eye size={16} /> যাচাই ও চূড়ান্ত অনুমোদন
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
                  প্রতিষ্ঠান অনুমোদিত শিক্ষার্থী তালিকা ({adminPendingAffiliations.students.length})
                </h3>

                {adminPendingAffiliations.students.length === 0 ? (
                  <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '1.5rem', margin: 0 }}>
                    কোনো শিক্ষার্থী চূড়ান্ত অনুমোদনের জন্য অপেক্ষমাণ নেই।
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
                            প্রতিষ্ঠান: <strong style={{ color: 'var(--text-main, #0f172a)' }}>{s.institutionName}</strong>
                            {s.studentClassRoll && ` | ক্লাস/রোল: ${s.studentClassRoll}`}
                            {s.address && ` | ঠিকানা: ${s.address}`}
                          </p>
                          <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0.2rem 0 0' }}>
                            ইমেইল: {s.email} | ফোন: {s.phone || 'নেই'}
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
                            <Eye size={16} /> যাচাই ও চূড়ান্ত অনুমোদন
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 5: Donor List */}
        {activeNav === 'donors' && (
          <div>
            <div className={styles.contentHeader}>
              <div>
                <h1 className={styles.pageTitle}>
                  <Heart size={26} color="#ec4899" />
                  {t('donorList')} ({donorsList.length})
                </h1>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                  প্ল্যাটফর্মের নিবন্ধিত সম্মানিত দাতা ও তাদের সামগ্রিক অবদানের তালিকা।
                </p>
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
                <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>ডাটা লোড হচ্ছে...</p>
              ) : donorsList.length === 0 ? (
                <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>
                  কোনো নিবন্ধিত দাতা পাওয়া যায়নি।
                </p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                        <th style={{ padding: '0.75rem' }}>নাম</th>
                        <th style={{ padding: '0.75rem' }}>ইমেইল</th>
                        <th style={{ padding: '0.75rem' }}>ফোন</th>
                        <th style={{ padding: '0.75rem' }}>স্ট্যাটাস</th>
                      </tr>
                    </thead>
                    <tbody>
                      {donorsList.map((donor) => (
                        <tr key={donor.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: '0.75rem', fontWeight: 600 }}>{donor.fullName}</td>
                          <td style={{ padding: '0.75rem' }}>{donor.email}</td>
                          <td style={{ padding: '0.75rem' }}>{donor.phone || '—'}</td>
                          <td style={{ padding: '0.75rem' }}>
                            <span style={{ padding: '0.15rem 0.5rem', borderRadius: '4px', backgroundColor: '#dcfce7', color: '#166534', fontSize: '0.8rem', fontWeight: 700 }}>
                              {donor.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 6: Pending Donations */}
        {activeNav === 'pending_donations' && (
          <div>
            <div className={styles.contentHeader}>
              <div>
                <h1 className={styles.pageTitle}>
                  <DollarSign size={26} color="#10b981" />
                  {t('accountsManagement')} ({pendingDonations.length})
                </h1>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                  অনুদান পেমেন্ট ট্রানজেকশন যাচাই ও চূড়ান্ত পাবলিক লেজারে পোস্টিং।
                </p>
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
                <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>ডাটা লোড হচ্ছে...</p>
              ) : pendingDonations.length === 0 ? (
                <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>
                  কোনো অনুদান ভেরিফিকেশন অপেক্ষমান নেই।
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
                            {don.type === 'random' ? 'সাধারণ তহবিল' : `সরাসরি: ${don.studentName}`}
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
                          onClick={() =>
                            setActionDrawer({
                              isOpen: true,
                              type: 'donation_review',
                              itemData: don,
                              reason: '',
                            })
                          }
                        >
                          <Eye size={16} /> ড্রয়ারে যাচাই ও ছাড়
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
            {actionDrawer.type === 'org_review' && 'প্রতিষ্ঠান ছাড়পত্র আবেদন পর্যালোচনা'}
            {actionDrawer.type === 'post_review' && 'শিক্ষার্থী আবেদনপত্র ও খরচ যাচাই'}
            {actionDrawer.type === 'donation_review' && 'অনুদান ট্রানজেকশন অনুমোদন'}
            {actionDrawer.type === 'add_super_admin' &&
              (newAdminRole === 'super_admin'
                ? (isBn ? 'নতুন সুপার এডমিন তৈরি' : 'Create Super Admin')
                : (isBn ? 'নতুন এডমিন তৈরি' : 'Create Admin'))}
            {actionDrawer.type === 'edit_permissions' && (isBn ? 'পারমিশন এডিট করুন' : 'Edit Permissions')}
            {actionDrawer.type === 'affiliation_review' &&
              (actionDrawer.itemData?.role === 'teacher'
                ? 'শিক্ষক প্রোফাইল চূড়ান্ত অনুমোদন'
                : 'শিক্ষার্থী প্রোফাইল চূড়ান্ত অনুমোদন')}
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
                  ℹ️ সাধারণ সদস্য কর্তৃক প্রস্তাবিত — সরেজমিনে যাচাই করে অ্যাকাউন্ট তৈরির ব্যবস্থা গ্রহণ করুন।
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
                  <option value="school">স্কুল (School)</option>
                  <option value="college">কলেজ (College)</option>
                  <option value="madrasah">মাদ্রাসা (Madrasah)</option>
                  <option value="university">বিশ্ববিদ্যালয় (University)</option>
                  <option value="others">অন্যান্য (Others)</option>
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
                  <div className={styles.sealTitle}>প্রতিষ্ঠান কর্তৃক স্টেজ-১ অনুমোদন সম্পন্ন</div>
                  <div className={styles.sealDesc}>
                    শিক্ষা প্রতিষ্ঠান কর্তৃপক্ষ এই আবেদন যাচাই করে ছাড়পত্র প্রদান করেছে। এখন এডমিন হিসেবে আপনার চূড়ান্ত ছাড়পত্র প্রয়োজন।
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
                    খরচ সমন্বয়ের সুনির্দিষ্ট কারণ (শিক্ষার্থী ও প্রতিষ্ঠানের কাছে নোটিফিকেশন যাবে) *
                  </label>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    খরচ বৃদ্ধি বা হ্রাসের কারণ ব্যাখ্যা করুন। সাদাকাহ বিডি শতভাগ স্বচ্ছতা বজায় রাখতে শিক্ষার্থী ও প্রতিষ্ঠানকে এই নোটিফিকেশন পাঠাবে। (পাবলিক পোস্টে এই কারণ প্রকাশিত হবে না)
                  </p>
                  <textarea
                    rows={2}
                    value={expenseModificationReason}
                    onChange={(e) => setExpenseModificationReason(e.target.value)}
                    placeholder="যেমন: প্রতিষ্ঠানের টিউশন ফি যাচাই করে সমন্বয় করা হয়েছে..."
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

        {actionDrawer.type !== 'add_super_admin' && actionDrawer.type !== 'edit_permissions' && (
          <div className={styles.actionDrawerFooter}>
            <button
              className="btn btn-outline"
              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
              onClick={() => setActionDrawer((prev) => ({ ...prev, isOpen: false }))}
            >
              বন্ধ করুন
            </button>

            <button
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
              <XCircle size={16} /> প্রত্যাখ্যান
            </button>

            <button
              className="btn btn-primary"
              style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
              disabled={actionLoading}
              onClick={() => handleExecuteAction('approve')}
            >
              <CheckCircle2 size={16} />
              {actionLoading ? 'প্রসেসিং হচ্ছে...' : 'অনুমোদন নিশ্চিত করুন'}
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
              {orgVerificationRequests.length +
                studentPostRequests.length +
                pendingDonations.length +
                (adminPendingAffiliations?.teachers?.length || 0) +
                (adminPendingAffiliations?.students?.length || 0)}
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
  allUsersCount: number = 0
) {
  return (
    <>
      {/* 1. Overview */}
      <div className={styles.navSection}>
        {!isCollapsed && <div className={styles.navSectionTitle}>মূল কন্ট্রোল</div>}
        <button
          className={`${styles.navItem} ${activeNav === 'overview' ? styles.navItemActive : ''}`}
          onClick={() => onSelect('overview')}
          title="ড্যাশবোর্ড ওভারভিউ"
        >
          <div className={styles.navItemContent}>
            <ShieldCheck size={18} />
            {!isCollapsed && <span className={styles.navItemText}>ড্যাশবোর্ড ওভারভিউ</span>}
          </div>
        </button>
      </div>

      {/* 2. User Management (Unified Staff & All Users) */}
      <div className={styles.navSection}>
        {!isCollapsed && <div className={styles.navSectionTitle}>ইউজার ব্যবস্থাপনা</div>}
        <button
          className={`${styles.navItem} ${activeNav === 'super_admins' ? styles.navItemActive : ''}`}
          onClick={() => onSelect('super_admins')}
          title="সুপার এডমিন ও স্টাফ তালিকা"
        >
          <div className={styles.navItemContent}>
            <Users size={18} />
            {!isCollapsed && (
              <span className={styles.navItemText}>সুপার এডমিন ও স্টাফ তালিকা</span>
            )}
          </div>
        </button>

        <button
          className={`${styles.navItem} ${activeNav === 'all_users' ? styles.navItemActive : ''}`}
          onClick={() => onSelect('all_users')}
          title="সকল ব্যবহারকারী অডিট"
        >
          <div className={styles.navItemContent}>
            <SlidersHorizontal size={18} />
            {!isCollapsed && <span className={styles.navItemText}>সকল ইউজার অডিট</span>}
          </div>
          {!isCollapsed && allUsersCount > 0 && <span className={styles.navBadge}>{allUsersCount}</span>}
        </button>
      </div>

      {/* 3. Verifications & Approvals */}
      <div className={styles.navSection}>
        {!isCollapsed && <div className={styles.navSectionTitle}>যাচাই ও অনুমোদন কেন্দ্র</div>}
        <button
          className={`${styles.navItem} ${activeNav === 'org_requests' ? styles.navItemActive : ''}`}
          onClick={() => onSelect('org_requests')}
          title="প্রতিষ্ঠান ভেরিফিকেশন"
        >
          <div className={styles.navItemContent}>
            <Building2 size={18} />
            {!isCollapsed && <span className={styles.navItemText}>প্রতিষ্ঠান ছাড়পত্র</span>}
          </div>
          {!isCollapsed && orgCount > 0 && <span className={styles.navBadge}>{orgCount}</span>}
        </button>

        <button
          className={`${styles.navItem} ${activeNav === 'affiliation_requests' ? styles.navItemActive : ''}`}
          onClick={() => onSelect('affiliation_requests')}
          title="শিক্ষক ও শিক্ষার্থী অনুমোদন"
        >
          <div className={styles.navItemContent}>
            <UserCheck size={18} />
            {!isCollapsed && <span className={styles.navItemText}>শিক্ষক ও শিক্ষার্থী ছাড়পত্র</span>}
          </div>
          {!isCollapsed && affiliationCount > 0 && <span className={styles.navBadge}>{affiliationCount}</span>}
        </button>

        <button
          className={`${styles.navItem} ${activeNav === 'student_posts' ? styles.navItemActive : ''}`}
          onClick={() => onSelect('student_posts')}
          title="শিক্ষার্থী পোস্ট যাচাই"
        >
          <div className={styles.navItemContent}>
            <GraduationCap size={18} />
            {!isCollapsed && <span className={styles.navItemText}>শিক্ষার্থী পোস্ট যাচাই</span>}
          </div>
          {!isCollapsed && postCount > 0 && <span className={styles.navBadge}>{postCount}</span>}
        </button>
      </div>

      {/* 4. Donors & Community */}
      <div className={styles.navSection}>
        {!isCollapsed && <div className={styles.navSectionTitle}>দাতা ও অনুদান</div>}
        <button
          className={`${styles.navItem} ${activeNav === 'donors' ? styles.navItemActive : ''}`}
          onClick={() => onSelect('donors')}
          title="ডোনার তালিকা"
        >
          <div className={styles.navItemContent}>
            <Heart size={18} />
            {!isCollapsed && <span className={styles.navItemText}>ডোনার তালিকা</span>}
          </div>
        </button>

        <button
          className={`${styles.navItem} ${activeNav === 'pending_donations' ? styles.navItemActive : ''}`}
          onClick={() => onSelect('pending_donations')}
          title="অনুদান পেমেন্ট যাচাই"
        >
          <div className={styles.navItemContent}>
            <DollarSign size={18} />
            {!isCollapsed && <span className={styles.navItemText}>অনুদান পেমেন্ট যাচাই</span>}
          </div>
          {!isCollapsed && donationCount > 0 && <span className={styles.navBadge}>{donationCount}</span>}
        </button>
      </div>
    </>
  );
}
