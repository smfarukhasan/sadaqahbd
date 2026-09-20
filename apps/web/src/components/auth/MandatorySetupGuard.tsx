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
      // If user has not completed mandatory password & role setup:
      if (!user.isPasswordSet) {
        if (!pathname.startsWith('/set-password')) {
          router.replace('/set-password');
        }
      }
    }
  }, [user, loading, pathname, router]);

  return null;
}
