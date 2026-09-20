'use client';

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useAuthStore } from '../../lib/auth-store';

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
          const storedMaster = localStorage.getItem('sadaqahbd_master_admin');
          if (storedMaster) {
            try {
              const parsed = JSON.parse(storedMaster);
              if (parsed && parsed.role === 'master_admin') {
                // Ensure auth token is cached for API requests
                if (!localStorage.getItem('sadaqahbd_auth_token')) {
                  fetch('http://127.0.0.1:4000/api/v1/auth/master-login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: 'admin@sadaqahbd.com', password: '12331233' }),
                  })
                    .then((r) => r.json())
                    .then((d) => {
                      if (d.token) {
                        localStorage.setItem('sadaqahbd_auth_token', d.token);
                      }
                    })
                    .catch(() => {});
                }
                setUser(parsed);
                return;
              }
            } catch {}
          }
        }
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, [syncProfile, setUser]);

  return null;
}
