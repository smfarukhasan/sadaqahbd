'use client';

import React, { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import FinancialDonationModal from '@/components/portal/FinancialDonationModal';

export default function DonatePage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(true);

  const handleClose = () => {
    setIsModalOpen(false);
    router.replace('/posts');
  };

  return (
    <div
      style={{
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
      }}
    >
      <FinancialDonationModal
        isOpen={isModalOpen}
        onClose={handleClose}
        onSuccess={handleClose}
      />
    </div>
  );
}
