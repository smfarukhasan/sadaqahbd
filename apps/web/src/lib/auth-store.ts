import { create } from 'zustand';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { auth, logoutUser } from './firebase';

export interface AppUser {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  address?: string | null;
  avatarUrl?: string | null;
  role: 'master_admin' | 'super_admin' | 'admin' | 'organization' | 'teacher' | 'student' | 'donor';
  status: 'pending' | 'active' | 'suspended' | 'rejected';
  isPasswordSet: boolean;
  mustChangePassword?: boolean;
  permissions?: any[];
}

import { getApiUrl } from './api-config';

interface AuthState {
  user: AppUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  initialized: boolean;
  isAuthActionInProgress: boolean;
  setAuthActionInProgress: (inProgress: boolean) => void;
  setUser: (user: AppUser | null) => void;
  setFirebaseUser: (fbUser: FirebaseUser | null) => void;
  logout: () => Promise<void>;
  syncProfile: (fbUser: FirebaseUser) => Promise<AppUser | null>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  firebaseUser: null,
  loading: true,
  initialized: false,
  isAuthActionInProgress: false,

  setAuthActionInProgress: (isAuthActionInProgress) => set({ isAuthActionInProgress }),
  setUser: (user) => set({ user, loading: false }),
  setFirebaseUser: (firebaseUser) => set({ firebaseUser }),

  syncProfile: async (fbUser: FirebaseUser) => {
    try {
      const token = await fbUser.getIdToken();
      const apiUrl = getApiUrl();

      const res = await fetch(`${apiUrl}/auth/sync-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      if (res.ok) {
        const userData: AppUser = await res.json();
        if ((userData as any).token && typeof window !== 'undefined') {
          localStorage.setItem('sadaqahbd_auth_token', (userData as any).token);
          localStorage.setItem('sadaqahbd_local_user', JSON.stringify(userData));
        }
        set({ user: userData, firebaseUser: fbUser, loading: false, initialized: true });
        return userData;
      }
    } catch (err) {
      console.error('Error syncing profile in auth store:', err);
    }
    set({ loading: false, initialized: true });
    return null;
  },

  logout: async () => {
    set({ loading: true });
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('sadaqahbd_master_admin');
        localStorage.removeItem('sadaqahbd_local_user');
        localStorage.removeItem('sadaqahbd_auth_token');
      }
      try {
        await logoutUser();
      } catch {}
      set({ user: null, firebaseUser: null, loading: false });
    } catch (err) {
      console.error('Error logging out:', err);
      set({ loading: false });
    }
  },
}));

export function getRoleDashboardPath(role?: string): string {
  switch (role) {
    case 'student':
      return '/student';
    case 'teacher':
      return '/teacher';
    case 'organization':
      return '/organization';
    case 'donor':
      return '/donor';
    case 'master_admin':
    case 'super_admin':
    case 'admin':
      return '/admin';
    default:
      return '/login';
  }
}
