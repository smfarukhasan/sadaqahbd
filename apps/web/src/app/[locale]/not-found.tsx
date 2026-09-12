'use client';

import React from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { FileQuestion, Home } from 'lucide-react';

export default function NotFound() {
  const locale = useLocale();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        padding: '2rem',
      }}
    >
      <FileQuestion size={64} color="var(--color-primary)" style={{ marginBottom: '1rem' }} />
      <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem', color: 'var(--color-primary-dark)' }}>
        {locale === 'bn' ? 'পৃষ্ঠাটি পাওয়া যায়নি (৪০৪)' : 'Page Not Found (404)'}
      </h1>
      <p style={{ color: 'var(--color-text-muted)', maxWidth: '450px', marginBottom: '1.5rem', lineHeight: '1.6' }}>
        {locale === 'bn'
          ? 'আপনি যে পৃষ্ঠাটি খুঁজছেন তা হয়তো সরানো হয়েছে অথবা লিংকটি ভুল।'
          : 'The page you are looking for might have been removed or the link is incorrect.'}
      </p>
      <Link href={`/${locale}`} className="btn btn-primary" style={{ textDecoration: 'none' }}>
        <Home size={18} />
        {locale === 'bn' ? 'হোমপেজে ফিরে যান' : 'Back to Home'}
      </Link>
    </div>
  );
}
