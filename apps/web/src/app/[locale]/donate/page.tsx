'use client';

import React, { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import FinancialDonationModal from '@/components/portal/FinancialDonationModal';
import ItemDonationModal from '@/components/portal/ItemDonationModal';
import { DollarSign, Package, Heart } from 'lucide-react';

export default function DonatePage() {
  const router = useRouter();
  const locale = useLocale();
  const isBn = locale === 'bn';

  const [donationType, setDonationType] = useState<'financial' | 'item'>('financial');
  const [isFinancialModalOpen, setIsFinancialModalOpen] = useState(true);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);

  const handleFinancialClose = () => {
    setIsFinancialModalOpen(false);
  };

  const handleItemClose = () => {
    setIsItemModalOpen(false);
  };

  return (
    <div
      style={{
        minHeight: '75vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2.5rem 1rem',
        maxWidth: '800px',
        margin: '0 auto',
      }}
    >
      {/* Switcher Card */}
      <div
        style={{
          width: '100%',
          backgroundColor: 'var(--surface, #ffffff)',
          borderRadius: '16px',
          border: '1px solid var(--color-border, #e2e8f0)',
          padding: '1.75rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
          marginBottom: '2rem',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 0.85rem',
            borderRadius: '20px',
            backgroundColor: 'rgba(5, 150, 105, 0.1)',
            color: 'var(--color-primary, #059669)',
            fontSize: '0.85rem',
            fontWeight: 700,
            marginBottom: '0.75rem',
          }}
        >
          <Heart size={16} />
          <span>{isBn ? 'সাদাকাহ বিডি অনুদান পোর্টাল' : 'Sadaqahbd Donation Portal'}</span>
        </div>

        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.5rem', color: 'var(--text-main, #0f172a)' }}>
          {isBn ? 'অনুদান মাধ্যম নির্বাচন করুন' : 'Choose Your Donation Type'}
        </h1>
        <p style={{ margin: '0 0 1.5rem', fontSize: '0.92rem', color: 'var(--color-text-muted, #64748b)' }}>
          {isBn
            ? 'আপনি সরাসরি আর্থিক সাহায্য পাঠাতে পারেন অথবা শিক্ষার্থীদের জন্য ব্যবহৃত বা নতুন পণ্য দান করতে পারেন।'
            : 'You can contribute directly through monetary support or donate physical items/study equipment to students.'}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          {/* Option 1: Financial Donation */}
          <button
            type="button"
            onClick={() => {
              setDonationType('financial');
              setIsFinancialModalOpen(true);
              setIsItemModalOpen(false);
            }}
            style={{
              padding: '1.25rem',
              borderRadius: '12px',
              border: donationType === 'financial' ? '2px solid var(--color-primary, #059669)' : '1px solid var(--color-border, #e2e8f0)',
              backgroundColor: donationType === 'financial' ? 'rgba(5, 150, 105, 0.05)' : 'var(--background-alt, #f8fafc)',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '10px',
                  backgroundColor: 'rgba(5, 150, 105, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-primary, #059669)',
                }}
              >
                <DollarSign size={22} />
              </div>
              {donationType === 'financial' && (
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary, #059669)' }}>
                  {isBn ? 'সক্রিয়' : 'Selected'}
                </span>
              )}
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>
              {isBn ? 'আর্থিক অনুদান' : 'Financial Donation'}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted, #64748b)', lineHeight: 1.4 }}>
              {isBn
                ? 'বিকাশ, নগদ, রকেট বা ব্যাংকের মাধ্যমে আর্থিক সাহায্য প্রদান করুন।'
                : 'Send funds directly via mobile banking or direct bank transfer.'}
            </div>
          </button>

          {/* Option 2: Item Donation */}
          <button
            type="button"
            onClick={() => {
              setDonationType('item');
              setIsItemModalOpen(true);
              setIsFinancialModalOpen(false);
            }}
            style={{
              padding: '1.25rem',
              borderRadius: '12px',
              border: donationType === 'item' ? '2px solid #ec4899' : '1px solid var(--color-border, #e2e8f0)',
              backgroundColor: donationType === 'item' ? 'rgba(236, 72, 153, 0.05)' : 'var(--background-alt, #f8fafc)',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '10px',
                  backgroundColor: 'rgba(236, 72, 153, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ec4899',
                }}
              >
                <Package size={22} />
              </div>
              {donationType === 'item' && (
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ec4899' }}>
                  {isBn ? 'সক্রিয়' : 'Selected'}
                </span>
              )}
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>
              {isBn ? 'পণ্য বা সামগ্রী অনুদান' : 'Physical Item Donation'}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted, #64748b)', lineHeight: 1.4 }}>
              {isBn
                ? 'বই, ল্যাপটপ, বাইসাইকেল বা শিক্ষাসামগ্রী দান করে শিক্ষার্থীর স্বপ্ন পূরণ করুন।'
                : 'Donate study equipment, books, computers, bicycles or educational items.'}
            </div>
          </button>
        </div>
      </div>

      {/* Financial Donation Modal */}
      <FinancialDonationModal
        isOpen={isFinancialModalOpen}
        onClose={handleFinancialClose}
        onSuccess={handleFinancialClose}
      />

      {/* Item Donation Modal */}
      <ItemDonationModal
        isOpen={isItemModalOpen}
        onClose={handleItemClose}
      />
    </div>
  );
}
