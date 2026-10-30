'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from '../../i18n/routing';
import { useAuthStore } from '../../lib/auth-store';

export default function MandatorySetupGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);

  useEffect(() => {
    if (!loading && user) {
      const isAdmin =
        user.role === 'master_admin' ||
        user.role === 'super_admin' ||
        user.role === 'admin';

      // Administrative roles must NEVER see /set-password setup flow
      if (isAdmin) {
        if (pathname.includes('/set-password')) {
          router.replace('/admin');
        }
        return;
      }

      // If regular user has not completed mandatory password & role setup:
      if (!user.isPasswordSet) {
        if (!pathname.startsWith('/set-password')) {
          router.replace('/set-password');
        }
      }
    }
  }, [user, loading, pathname, router]);

  return null;
}
