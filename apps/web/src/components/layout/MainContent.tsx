'use client';

import React from 'react';
import { usePathname } from '../../i18n/routing';
import { isPanelRoute } from '../../lib/is-panel-route';

/**
 * Wrapper for <main> that conditionally applies the safe-bottom-padding class.
 * On panel routes (student, admin, donor, etc.) the padding is skipped
 * because those pages have their own dedicated PortalLayout header.
 */
export default function MainContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPanel = isPanelRoute(pathname);

  return (
    <main className={isPanel ? undefined : 'safe-bottom-padding'}>
      {children}
    </main>
  );
}
