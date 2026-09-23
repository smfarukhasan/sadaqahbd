'use client';

import { useEffect } from 'react';
import { useRouter } from '../../../../i18n/routing';

export default function CreatePostRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace({ pathname: '/student', query: { tab: 'applications', action: 'new' } });
  }, [router]);

  return (
    <div style={{ padding: '4rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
      শিক্ষার্থী আবেদন ড্যাশবোর্ডে স্থানান্তরিত করা হচ্ছে...
    </div>
  );
}
