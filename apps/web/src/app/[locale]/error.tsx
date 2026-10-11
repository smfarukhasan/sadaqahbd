'use client';

import React, { useEffect } from 'react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled UI error:', error);
  }, [error]);

  return (
    <div
      style={{
        padding: '4rem 1.5rem',
        textAlign: 'center',
        maxWidth: '560px',
        margin: '0 auto',
      }}
    >
      <div
        style={{
          padding: '2rem',
          backgroundColor: 'var(--surface, #ffffff)',
          borderRadius: 'var(--radius-xl, 20px)',
          border: '1px solid var(--surface-border, #e2e8f0)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
          একটি সাময়িক সমস্যা দেখা দিয়েছে
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          {error?.message || 'পেজটি লোড করার সময় অপ্রত্যাশিত ত্রুটি ঘটেছে।'}
        </p>
        <button
          onClick={() => reset()}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#10b981',
            color: '#ffffff',
            border: 'none',
            borderRadius: 'var(--radius-md, 12px)',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
          }}
        >
          পুনরায় চেষ্টা করুন
        </button>
      </div>
    </div>
  );
}
