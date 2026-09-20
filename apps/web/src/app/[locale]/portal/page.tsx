'use client';

import { useEffect } from 'react';
import { useRouter } from '../../../i18n/routing';
import { useAuthStore, getRoleDashboardPath } from '../../../lib/auth-store';

export default function SmartPortalRedirectPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else {
        const destination = getRoleDashboardPath(user.role);
        router.replace(destination as any);
      }
    }
  }, [user, loading, router]);

  return (
    <div className="container" style={{ padding: '6rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
      ড্যাশবোর্ডে নিয়ে যাওয়া হচ্ছে...
    </div>
  );
}
