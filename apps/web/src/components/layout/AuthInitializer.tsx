'use client';

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useAuthStore } from '../../lib/auth-store';
import { getApiUrl } from '../../lib/api-config';

export default function AuthInitializer() {
  const syncProfile = useAuthStore((s) => s.syncProfile);
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      // If user is actively performing an explicit registration or Google auth flow in LoginPage,
      // skip auto-sync here; LoginPage will explicitly call syncProfile with the chosen role!
      if (useAuthStore.getState().isAuthActionInProgress) {
        return;
      }

      if (fbUser) {
        await syncProfile(fbUser);
      } else {
        if (typeof window !== 'undefined') {
          // 1. Check local session token (local MySQL user or master admin)
          const storedToken = localStorage.getItem('sadaqahbd_auth_token');
          const storedLocalUser = localStorage.getItem('sadaqahbd_local_user');
          const storedMaster = localStorage.getItem('sadaqahbd_master_admin');

          if (storedLocalUser) {
            try {
              const parsed = JSON.parse(storedLocalUser);
              if (parsed && parsed.id) {
                setUser(parsed);
              }
            } catch {}
          } else if (storedMaster) {
            try {
              const parsedMaster = JSON.parse(storedMaster);
              if (parsedMaster && parsedMaster.role === 'master_admin') {
                setUser(parsedMaster);
              }
            } catch {}
          }

          if (storedToken) {
            const apiUrl = getApiUrl();
            fetch(`${apiUrl}/auth/me`, {
              headers: {
                Authorization: `Bearer ${storedToken}`,
              },
            })
              .then(async (res) => {
                if (res.ok) {
                  const meData = await res.json();
                  if (meData && meData.id) {
                    setUser(meData);
                    localStorage.setItem('sadaqahbd_local_user', JSON.stringify(meData));
                  }
                } else if (res.status === 401 || res.status === 403) {
                  localStorage.removeItem('sadaqahbd_auth_token');
                  localStorage.removeItem('sadaqahbd_local_user');
                  setUser(null);
                }
              })
              .catch(() => {
                // Offline fallback retains storedLocalUser
              });
            return;
          }
        }
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, [syncProfile, setUser]);

  return null;
}
