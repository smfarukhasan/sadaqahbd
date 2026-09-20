'use client';

import React from 'react';
import { ShieldCheck, X, Printer } from 'lucide-react';

export interface ReceiptData {
  receiptNo: string;
  date: string;
  amount: string;
  purpose: string;
  method: string;
  trxId: string;
  donorName: string;
}

export default function EReceiptModal({
  receipt,
  onClose,
}: {
  receipt: ReceiptData | null;
  onClose: () => void;
}) {
  if (!receipt) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          color: '#1f2937',
          borderRadius: 'var(--radius-xl)',
          maxWidth: '540px',
          width: '100%',
          padding: '2.25rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: '#6b7280',
          }}
          aria-label="Close receipt"
        >
          <X size={20} />
        </button>

        {/* Receipt Header */}
        <div
          style={{
            textAlign: 'center',
            borderBottom: '2px dashed #e5e7eb',
            paddingBottom: '1.5rem',
            marginBottom: '1.5rem',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: '#059669',
              fontWeight: '800',
              fontSize: '1.25rem',
              marginBottom: '0.25rem',
            }}
          >
            <ShieldCheck size={24} /> সাদাকাহ বিডি অফিসিয়াল ই-রশিদ
          </div>
          <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: 0 }}>
            স্বচ্ছতা সনদ ও ইলেকট্রনিক ডোনেশন স্বীকৃতিপত্র
          </p>
          <span
            style={{
              display: 'inline-block',
              marginTop: '0.5rem',
              padding: '0.2rem 0.65rem',
              backgroundColor: 'rgba(5, 150, 105, 0.1)',
              color: '#047857',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: '700',
            }}
          >
            রশিদ নম্বর: {receipt.receiptNo}
          </span>
        </div>

        {/* Receipt Details Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
            fontSize: '0.875rem',
            marginBottom: '1.5rem',
          }}
        >
          <div>
            <span style={{ display: 'block', color: '#6b7280', fontSize: '0.78rem' }}>দাতার নাম:</span>
            <strong>{receipt.donorName}</strong>
          </div>
          <div>
            <span style={{ display: 'block', color: '#6b7280', fontSize: '0.78rem' }}>তারিখ:</span>
            <strong>{receipt.date}</strong>
          </div>
          <div>
            <span style={{ display: 'block', color: '#6b7280', fontSize: '0.78rem' }}>সহায়তার খাত:</span>
            <strong>{receipt.purpose}</strong>
          </div>
          <div>
            <span style={{ display: 'block', color: '#6b7280', fontSize: '0.78rem' }}>পেমেন্ট পদ্ধতি:</span>
            <strong>{receipt.method}</strong>
          </div>
          <div>
            <span style={{ display: 'block', color: '#6b7280', fontSize: '0.78rem' }}>ট্রানজেকশন আইডি:</span>
            <code>{receipt.trxId}</code>
          </div>
          <div>
            <span style={{ display: 'block', color: '#6b7280', fontSize: '0.78rem' }}>অনুদানের স্ট্যাটাস:</span>
            <span style={{ color: '#059669', fontWeight: '800' }}>১০০% সফল ও অডিটভুক্ত</span>
          </div>
        </div>

        {/* Amount Banner */}
        <div
          style={{
            backgroundColor: 'rgba(5, 150, 105, 0.08)',
            border: '1.5px solid #059669',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            textAlign: 'center',
            marginBottom: '1.5rem',
          }}
        >
          <span
            style={{
              fontSize: '0.8rem',
              color: '#047857',
              fontWeight: '700',
              textTransform: 'uppercase',
            }}
          >
            পরিশোধিত অনুদানের পরিমাণ
          </span>
          <h3 style={{ fontSize: '2rem', fontWeight: '800', color: '#059669', margin: '0.25rem 0 0' }}>
            {receipt.amount}
          </h3>
        </div>

        {/* Print button */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={() => window.print()}
            className="btn btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.65rem 1.5rem',
              fontWeight: '700',
              cursor: 'pointer',
            }}
          >
            <Printer size={16} /> রশিদ প্রিন্ট / ডাউনলোড
          </button>
        </div>
      </div>
    </div>
  );
}
