'use client';

import React, { useState, useEffect } from 'react';
import { Link } from '../../i18n/routing';
import { Heart, DollarSign, FileText } from 'lucide-react';
import { getApiUrl } from '../../lib/api-config';
import { getAuthToken } from '../../lib/auth-token';
import { formatBengaliDate, formatBengaliAmount } from '../../lib/format-utils';
import { ReceiptData } from './EReceiptModal';

export interface DonationLedgerTableProps {
  firebaseUser: any;
  locale: string;
  onOpenReceipt: (receipt: ReceiptData) => void;
  donorDisplayName?: string;
  titleBn?: string;
  titleEn?: string;
  subtitleBn?: string;
  subtitleEn?: string;
  newDonationLink?: string;
  newDonationLabelBn?: string;
  newDonationLabelEn?: string;
}

export default function DonationLedgerTable({
  firebaseUser,
  locale,
  onOpenReceipt,
  donorDisplayName = 'সম্মানিত প্রতিনিধি',
  titleBn = 'আমার অনুদান খতিয়ান',
  titleEn = 'Personal Donation Ledger',
  subtitleBn = 'সাদাকাহ প্ল্যাটফর্মে আপনার দেওয়া অনুদানের স্বচ্ছ তালিকা ও অফিসিয়াল রসিদসমূহ।',
  subtitleEn = 'Verified records and official receipts of contributions made.',
  newDonationLink = '/donate',
  newDonationLabelBn = 'নতুন অনুদান দিন',
  newDonationLabelEn = 'Donate Now',
}: DonationLedgerTableProps) {
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    getAuthToken()
      .then((token: string | null) => {
        if (!token) {
          if (isMounted) setLoading(false);
          return null;
        }
        const apiUrl = getApiUrl();
        return fetch(`${apiUrl}/donations/my-history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      })
      .then((res: any) => (res ? res.json() : null))
      .then((data: any) => {
        if (isMounted && Array.isArray(data)) {
          setDonations(data);
        }
      })
      .catch((err: any) => console.error('Failed to load donation ledger:', err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [firebaseUser]);

  const isBn = locale === 'bn';

  return (
    <div
      style={{
        backgroundColor: 'var(--surface)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--surface-border)',
        padding: '2rem',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h2
            style={{
              fontSize: '1.25rem',
              fontWeight: '800',
              color: 'var(--text-main)',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Heart size={22} color="var(--primary)" />
            {isBn ? titleBn : titleEn}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.35rem' }}>
            {isBn ? subtitleBn : subtitleEn}
          </p>
        </div>

        {newDonationLink && (
          <Link
            href={newDonationLink as any}
            className="btn btn-primary"
            style={{
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.55rem 1.15rem',
              fontWeight: '700',
            }}
          >
            <DollarSign size={16} />
            {isBn ? newDonationLabelBn : newDonationLabelEn}
          </Link>
        )}
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          {isBn ? 'লোড হচ্ছে...' : 'Loading...'}
        </div>
      ) : donations.length === 0 ? (
        <div
          style={{
            padding: '3rem 1.5rem',
            textAlign: 'center',
            backgroundColor: 'var(--background)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <FileText size={38} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem' }} />
          <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
            {isBn ? 'এখনো কোনো অনুদান জমা হয়নি' : 'No Donation History'}
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {isBn
              ? 'শিক্ষা তহবিলে অনুদান প্রদান করে শিক্ষার্থীদের পাশে দাঁড়ান।'
              : 'Support underprivileged students by making your first contribution.'}
          </p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
              fontSize: '0.88rem',
            }}
          >
            <thead>
              <tr style={{ borderBottom: '2px solid var(--surface-border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.75rem 1rem' }}>{isBn ? 'তারিখ' : 'Date'}</th>
                <th style={{ padding: '0.75rem 1rem' }}>{isBn ? 'শিক্ষার্থী / খাত' : 'Recipient'}</th>
                <th style={{ padding: '0.75rem 1rem' }}>{isBn ? 'মাধ্যম' : 'Method'}</th>
                <th style={{ padding: '0.75rem 1rem' }}>{isBn ? 'পরিমাণ' : 'Amount'}</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>{isBn ? 'অ্যাকশন' : 'Action'}</th>
              </tr>
            </thead>
            <tbody>
              {donations.map((d) => (
                <tr key={d.id} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                  <td style={{ padding: '1rem', color: 'var(--text-main)', fontWeight: '700' }}>
                    {formatBengaliDate(d.createdAt, isBn)}
                  </td>
                  <td style={{ padding: '1rem', fontWeight: '700', color: 'var(--text-main)' }}>
                    {d.studentName || (isBn ? 'সাধারণ শিক্ষা তহবিল' : 'General Fund')}
                  </td>
                  <td style={{ padding: '1rem', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: '700' }}>
                    {d.paymentMethod}
                  </td>
                  <td style={{ padding: '1rem', fontWeight: '800', color: 'var(--primary)' }}>
                    {formatBengaliAmount(d.amount, isBn)}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() =>
                        onOpenReceipt({
                          receiptNo: d.receiptNumber || `REC-${d.id?.slice(0, 8).toUpperCase()}`,
                          donorName: d.donorName || donorDisplayName,
                          amount: `৳${Number(d.amount).toLocaleString(isBn ? 'bn-BD' : 'en-US')}`,
                          method: d.paymentMethod,
                          trxId: d.transactionId || 'TXN-DIRECT',
                          date: new Date(d.createdAt).toLocaleDateString(isBn ? 'bn-BD' : 'en-US'),
                          purpose: d.studentName
                            ? `${d.studentName}-এর শিক্ষা সহায়তা`
                            : isBn
                            ? 'সাধারণ শিক্ষা অনুদান'
                            : 'General Educational Grant',
                        })
                      }
                      style={{
                        padding: '0.4rem 0.85rem',
                        fontSize: '0.78rem',
                        fontWeight: '700',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--surface-border)',
                        background: 'var(--surface)',
                        cursor: 'pointer',
                        color: 'var(--text-main)',
                      }}
                    >
                      {isBn ? 'রসিদ' : 'Receipt'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
