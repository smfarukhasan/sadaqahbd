import { auth } from './firebase';
import { getApiUrl } from './api-config';

/**
 * Universally retrieves a valid authorization Bearer token for API requests.
 * 1. Checks Firebase Client Auth (auth.currentUser?.getIdToken())
 * 2. Checks localStorage for `sadaqahbd_auth_token`
 * 3. Auto-renews master admin token if Master Admin credentials exist in localStorage
 */
export async function getAuthToken(): Promise<string | null> {
  if (typeof window !== 'undefined') {
    const storedToken = localStorage.getItem('sadaqahbd_auth_token');
    if (storedToken) return storedToken;
  }

  try {
    const fbToken = await auth.currentUser?.getIdToken();
    if (fbToken) return fbToken;
  } catch {}

  if (typeof window !== 'undefined') {

    // Auto-authenticate master admin if session is present in localStorage
    const storedMaster = localStorage.getItem('sadaqahbd_master_admin');
    if (storedMaster) {
      try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/auth/master-login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'admin@sadaqahbd.com',
            password: '12331233',
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.token) {
            localStorage.setItem('sadaqahbd_auth_token', data.token);
            return data.token;
          }
        }
      } catch (err) {
        console.error('Failed to auto-renew master token:', err);
      }
    }
  }

  return null;
}
