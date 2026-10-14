'use client';

import React, { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import {
  Heart,
  DollarSign,
  FileText,
  ShieldCheck,
  PlusCircle,
  ExternalLink,
  Calendar,
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  Package,
  Eye,
  EyeOff,
  Info,
  User,
  Send,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { getApiUrl } from '@/lib/api-config';
import { getAuthToken } from '@/lib/auth-token';
import EReceiptModal, { ReceiptData } from './EReceiptModal';
import ItemDonationModal from './ItemDonationModal';
import FinancialDonationModal from './FinancialDonationModal';
import StudentDetailsModal from './StudentDetailsModal';
import styles from './MyDonationsSection.module.css';

export default function MyDonationsSection() {
  const locale = useLocale();
  const isBn = locale === 'bn';
  const user = useAuthStore((s) => s.user);
  const firebaseUser = useAuthStore((s) => s.firebaseUser);

  const [activeTab, setActiveTab] = useState<'money' | 'items'>('money');
  const [donations, setDonations] = useState<any[]>([]);
  const [itemDonationsList, setItemDonationsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isFinancialModalOpen, setIsFinancialModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Item Shipment Reply state
  const [shipmentModalItem, setShipmentModalItem] = useState<any | null>(null);
  const [shipmentNote, setShipmentNote] = useState('');
  const [submittingShipment, setSubmittingShipment] = useState(false);
  const [shipmentError, setShipmentError] = useState('');

  const handleTogglePrivacy = async (donationId: string, isAnonymous: boolean) => {
    try {
      const token = await getAuthToken();
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/donations/${donationId}/privacy`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isAnonymous }),
      });
      if (res.ok) {
        setDonations((prev) =>
          prev.map((d) => (d.id === donationId ? { ...d, isAnonymous } : d))
        );
      }
    } catch (e) {
      console.error('Failed to toggle privacy:', e);
    }
  };

  const handleToggleItemPrivacy = async (itemDonationId: string, isAnonymous: boolean) => {
    try {
      const token = await getAuthToken();
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/donations/items/${itemDonationId}/privacy`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isAnonymous }),
      });
      if (res.ok) {
        setItemDonationsList((prev) =>
          prev.map((item) => (item.id === itemDonationId ? { ...item, isAnonymous } : item))
        );
      }
    } catch (e) {
      console.error('Failed to toggle item privacy:', e);
    }
  };

  const handleShipmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shipmentModalItem || !shipmentNote.trim()) return;
    setSubmittingShipment(true);
    setShipmentError('');
    try {
      const token = await getAuthToken();
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/donations/items/ship`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          itemDonationId: shipmentModalItem.id,
          shipmentNote: shipmentNote.trim(),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'পণ্য পাঠানোর তথ্য জমা দিতে সমস্যা হয়েছে');
      }
      setShipmentModalItem(null);
      setShipmentNote('');
      loadData();
    } catch (err: any) {
      setShipmentError(err.message || 'ত্রুটি দেখা দিয়েছে');
    } finally {
      setSubmittingShipment(false);
    }
  };

  const loadData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const token = await getAuthToken();
      const apiUrl = getApiUrl();
      const headers = { Authorization: `Bearer ${token}` };

      const [resMoney, resItems] = await Promise.all([
        fetch(`${apiUrl}/donations/my-history`, { headers }).catch(() => null),
        fetch(`${apiUrl}/donations/items/my-history`, { headers }).catch(() => null),
      ]);

      if (resMoney && resMoney.ok) {
        const data = await resMoney.json();
        if (Array.isArray(data)) {
          const mapped = data.map((d: any) => ({
            id: d.id,
            trxId: d.trxId || d.transactionReference || 'N/A',
            date: new Date(d.createdAt).toLocaleDateString(
              isBn ? 'bn-BD' : 'en-US',
              { year: 'numeric', month: 'short', day: 'numeric' }
            ),
            time: new Date(d.createdAt).toLocaleTimeString(
              isBn ? 'bn-BD' : 'en-US',
              { hour: '2-digit', minute: '2-digit' }
            ),
            target: d.isRandom
              ? isBn
                ? 'সাধারণ শিক্ষা তহবিল (General Pool)'
                : 'General Fund Pool'
              : d.postTitle || (isBn ? 'শিক্ষা সহায়তা অনুদান' : 'Education Grant'),
            amount: isBn
              ? `৳${Number(d.amount).toLocaleString('bn-BD')}`
              : `৳${Number(d.amount).toLocaleString('en-US')}`,
            rawAmount: Number(d.amount),
            paymentMethod: d.paymentMethod?.toUpperCase() || 'BKASH',
            senderPhone: d.senderPhone || 'N/A',
            isAnonymous: !!d.isAnonymous,
            status:
              d.status === 'accepted'
                ? isBn
                  ? 'অনুমোদিত ও গ্রহণকৃত'
                  : 'Verified & Accepted'
                : d.status === 'pending'
                ? isBn
                  ? 'যাচাই প্রক্রিয়াধীন'
                  : 'Under Verification'
                : isBn
                ? 'বাতিলকৃত'
                : 'Declined',
            rawStatus: d.status,
            rejectionReason: d.rejectionReason,
            isRandom: d.isRandom,
            receiptNo: `REC-${d.id.slice(0, 8).toUpperCase()}`,
            studentUserId: d.studentUserId,
            postId: d.postId,
          }));
          setDonations(mapped);
        }
      }

      if (resItems && resItems.ok) {
        const items = await resItems.json();
        if (Array.isArray(items)) {
          setItemDonationsList(items);
        }
      }
    } catch (err) {
      console.error('Failed to load my donations history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user, isBn]);

  const totalAcceptedAmount = donations.reduce(
    (sum, d) => sum + (d.rawStatus === 'accepted' ? d.rawAmount : 0),
    0
  );

  return (
    <div style={{ width: '100%' }}>
      {/* Top Header & Actions Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              color: 'var(--text-main)',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
            }}
          >
            <Heart size={26} color="#10b981" />
            {isBn ? 'আমার অনুদানের তালিকা ও হিসাব খতিয়ান' : 'My Donation History'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0.25rem 0 0' }}>
            {isBn
              ? 'আপনার প্রতিটি আর্থিক দান ও পণ্য সামগ্রী অনুদানের স্বচ্ছ বিবরণ এবং ডিজিটাল ই-রশিদ।'
              : 'Complete records of your monetary and item contributions with verified e-receipts.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setIsItemModalOpen(true)}
            className="btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.6rem 1.15rem',
              fontWeight: 700,
              borderRadius: 'var(--radius-md, 12px)',
              backgroundColor: 'var(--accent, #f59e0b)',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px -2px rgba(245, 158, 11, 0.4)',
            }}
          >
            <Package size={18} />
            <span>{isBn ? 'অর্থ ছাড়া পণ্য দান করুন' : 'Donate Items/Goods'}</span>
          </button>

          <button
            onClick={() => setIsFinancialModalOpen(true)}
            className="btn btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.6rem 1.15rem',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              borderRadius: 'var(--radius-md, 12px)',
              backgroundColor: '#10b981',
              color: '#ffffff',
            }}
          >
            <PlusCircle size={18} />
            <span>{isBn ? 'নতুন আর্থিক অনুদান' : 'Make Donation'}</span>
          </button>
        </div>
      </div>

      {/* Summary Cards (Responsive Layout) */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statTextCol}>
            <span className={styles.statLabel}>
              {isBn ? 'মোট সফল আর্থিক অনুদান' : 'Total Accepted Money'}
            </span>
          </div>
          <div className={styles.statAmountCol}>
            <h2 className={styles.statAmount}>
              {isBn ? `৳${totalAcceptedAmount.toLocaleString('bn-BD')}` : `৳${totalAcceptedAmount.toLocaleString('en-US')}`}
            </h2>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statTextCol}>
            <span className={styles.statLabel}>
              {isBn ? 'মোট অর্থ লেনদেন সংখ্যা' : 'Total Monetary Transactions'}
            </span>
          </div>
          <div className={styles.statAmountCol}>
            <h2 className={styles.statAmountMain}>
              {isBn ? `${donations.length.toLocaleString('bn-BD')} টি` : `${donations.length}`}
            </h2>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statTextCol}>
            <span className={styles.statLabel}>
              {isBn ? 'পণ্য/সামগ্রী অনুদান আবেদন' : 'Item Donation Requests'}
            </span>
          </div>
          <div className={styles.statAmountCol}>
            <h2 className={styles.statAmountAmber}>
              {isBn ? `${itemDonationsList.length.toLocaleString('bn-BD')} টি` : `${itemDonationsList.length}`}
            </h2>
          </div>
        </div>
      </div>

      {/* Main Content Card with Navigation Tabs */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-xl, 24px)',
          border: '1px solid var(--surface-border)',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            borderBottom: '1px solid var(--surface-border)',
            paddingBottom: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          <button
            onClick={() => setActiveTab('money')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.25rem',
              borderRadius: 'var(--radius-md, 12px)',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              border: 'none',
              backgroundColor: activeTab === 'money' ? 'var(--primary-light, rgba(16,185,129,0.15))' : 'transparent',
              color: activeTab === 'money' ? '#10b981' : 'var(--text-muted)',
            }}
          >
            <DollarSign size={18} />
            <span>{isBn ? `আর্থিক দান (${donations.length})` : `Monetary (${donations.length})`}</span>
          </button>

          <button
            onClick={() => setActiveTab('items')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.25rem',
              borderRadius: 'var(--radius-md, 12px)',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              border: 'none',
              backgroundColor: activeTab === 'items' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
              color: activeTab === 'items' ? '#f59e0b' : 'var(--text-muted)',
            }}
          >
            <Package size={18} />
            <span>{isBn ? `পণ্য/সামগ্রী দান (${itemDonationsList.length})` : `Items (${itemDonationsList.length})`}</span>
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            {isBn ? 'তথ্য লোড হচ্ছে...' : 'Loading donation records...'}
          </div>
        ) : activeTab === 'money' ? (
          /* TAB 1: MONETARY DONATIONS */
          donations.length === 0 ? (
            <div
              style={{
                padding: '3.5rem 1.5rem',
                textAlign: 'center',
                backgroundColor: 'var(--background-alt, #f8fafc)',
                borderRadius: 'var(--radius-lg, 16px)',
                border: '1px solid var(--surface-border)',
              }}
            >
              <Heart size={44} color="#10b981" style={{ margin: '0 auto 0.75rem' }} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                {isBn ? 'কোনো পূর্ববর্তী আর্থিক অনুদান পাওয়া যায়নি' : 'No Monetary Donations Found'}
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: '0.35rem auto 1.5rem', maxWidth: '420px' }}>
                {isBn
                  ? 'আপনার কোনো অর্থ অনুদানের রেকর্ড এখনো নেই। সুবিধাবঞ্চিত শিক্ষার্থীদের সাহায্য করতে আজই এগিয়ে আসুন।'
                  : 'You have not made any monetary donations yet. Support underprivileged students today.'}
              </p>
              <button
                type="button"
                onClick={() => setIsFinancialModalOpen(true)}
                className="btn btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.65rem 1.35rem',
                  fontWeight: 700,
                  backgroundColor: '#10b981',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#ffffff',
                  cursor: 'pointer',
                }}
              >
                <PlusCircle size={18} /> {isBn ? 'এখনই দান করুন' : 'Donate Now'}
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1.5px solid var(--surface-border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.85rem 0.75rem' }}>{isBn ? 'তারিখ ও সময়' : 'Date & Time'}</th>
                    <th style={{ padding: '0.85rem 0.75rem' }}>{isBn ? 'দানের ক্ষেত্র / লক্ষ্য' : 'Donation Target'}</th>
                    <th style={{ padding: '0.85rem 0.75rem' }}>{isBn ? 'পেমেন্ট মেথড ও TrxID' : 'Method & TrxID'}</th>
                    <th style={{ padding: '0.85rem 0.75rem' }}>{isBn ? 'পরিমাণ' : 'Amount'}</th>
                    <th style={{ padding: '0.85rem 0.75rem' }}>{isBn ? 'স্ট্যাটাস' : 'Status'}</th>
                    <th style={{ padding: '0.85rem 0.75rem' }}>{isBn ? 'পাবলিক তথ্য' : 'Public Info'}</th>
                    <th style={{ padding: '0.85rem 0.75rem', textAlign: 'right' }}>{isBn ? 'ই-রশিদ / একশন' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody>
                  {donations.map((item) => (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: '1px solid var(--surface-border)',
                        color: 'var(--text-main)',
                      }}
                    >
                      <td style={{ padding: '1rem 0.75rem', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 700 }}>{item.date}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{item.time}</div>
                      </td>

                      <td style={{ padding: '1rem 0.75rem' }}>
                        <div style={{ fontWeight: 700 }}>{item.target}</div>
                        {item.studentUserId ? (
                          <button
                            type="button"
                            onClick={() => setSelectedStudentId(item.studentUserId)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#10b981',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              padding: 0,
                              marginTop: '0.2rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                            }}
                          >
                            <User size={13} />
                            <span>{isBn ? 'শিক্ষার্থীর প্রোফাইল দেখুন →' : 'View Student Profile →'}</span>
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {isBn ? 'রেন্ডম/সাধারণ পুল' : 'General Pool'}
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '1rem 0.75rem' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{item.paymentMethod}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          TrxID: {item.trxId}
                        </div>
                      </td>

                      <td style={{ padding: '1rem 0.75rem', fontWeight: 800, color: '#10b981', fontSize: '1.05rem' }}>
                        {item.amount}
                      </td>

                      <td style={{ padding: '1rem 0.75rem' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.3rem 0.75rem',
                            borderRadius: '20px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            backgroundColor:
                              item.rawStatus === 'accepted'
                                ? 'rgba(16, 185, 129, 0.15)'
                                : item.rawStatus === 'pending'
                                ? 'rgba(245, 158, 11, 0.15)'
                                : 'rgba(239, 68, 68, 0.15)',
                            color:
                              item.rawStatus === 'accepted'
                                ? '#10b981'
                                : item.rawStatus === 'pending'
                                ? '#f59e0b'
                                : '#ef4444',
                          }}
                        >
                          {item.rawStatus === 'accepted' && <CheckCircle2 size={14} />}
                          {item.rawStatus === 'pending' && <Clock size={14} />}
                          {item.rawStatus === 'rejected' && <XCircle size={14} />}
                          {item.status}
                        </span>
                      </td>

                      <td style={{ padding: '1rem 0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              padding: '0.25rem 0.55rem',
                              borderRadius: '9999px',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              backgroundColor: item.isAnonymous ? 'rgba(124, 58, 237, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                              color: item.isAnonymous ? '#7c3aed' : '#059669',
                            }}
                          >
                            {item.isAnonymous ? <EyeOff size={12} /> : <Eye size={12} />}
                            {item.isAnonymous ? (isBn ? 'গোপন' : 'Anonymous') : (isBn ? 'পাবলিক' : 'Public')}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleTogglePrivacy(item.id, !item.isAnonymous)}
                            title={item.isAnonymous ? (isBn ? 'পাবলিকে পরিচয় প্রকাশ করুন' : 'Make Public') : (isBn ? 'পাবলিকে পরিচয় গোপন করুন' : 'Make Anonymous')}
                            style={{
                              background: 'none',
                              border: '1px solid var(--surface-border, #cbd5e1)',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              padding: '0.2rem 0.45rem',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              color: 'var(--text-muted)',
                            }}
                          >
                            {item.isAnonymous ? (isBn ? 'উন্মুক্ত করুন' : 'Unhide') : (isBn ? 'গোপন করুন' : 'Hide')}
                          </button>
                        </div>
                      </td>

                      <td style={{ padding: '1rem 0.75rem', textAlign: 'right' }}>
                        {item.rawStatus === 'accepted' ? (
                          <button
                            onClick={() =>
                              setSelectedReceipt({
                                receiptNo: item.receiptNo,
                                date: item.date,
                                amount: item.amount,
                                purpose: item.target,
                                method: item.paymentMethod,
                                trxId: item.trxId,
                                donorName: user?.fullName || 'সাদাকাহ দাতা',
                              })
                            }
                            className="btn btn-outline"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              padding: '0.45rem 0.85rem',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              borderRadius: '8px',
                            }}
                          >
                            <FileText size={14} /> {isBn ? 'ই-রশিদ' : 'E-Receipt'}
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* TAB 2: ITEM / GOODS DONATIONS */
          itemDonationsList.length === 0 ? (
            <div
              style={{
                padding: '3.5rem 1.5rem',
                textAlign: 'center',
                backgroundColor: 'var(--background-alt, #f8fafc)',
                borderRadius: 'var(--radius-lg, 16px)',
                border: '1px solid var(--surface-border)',
              }}
            >
              <Package size={44} color="#f59e0b" style={{ margin: '0 auto 0.75rem' }} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                {isBn ? 'কোনো পণ্য অনুদানের আবেদন পাওয়া যায়নি' : 'No Item Donation Requests'}
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: '0.35rem auto 1.5rem', maxWidth: '420px' }}>
                {isBn
                  ? 'আপনি ল্যাপটপ, সাইকেল, বই বা অন্যান্য সামগ্রী দান করতে চাইলে ওপরের বোতামে ক্লিক করুন।'
                  : 'Donate laptops, books, clothing or bicycles for underprivileged students.'}
              </p>
              <button
                onClick={() => setIsItemModalOpen(true)}
                className="btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.65rem 1.35rem',
                  fontWeight: 700,
                  backgroundColor: '#f59e0b',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--radius-md, 12px)',
                }}
              >
                <Package size={18} /> {isBn ? 'পণ্য অনুদান আবেদন করুন' : 'Donate Items'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {itemDonationsList.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-lg, 16px)',
                    backgroundColor: 'var(--background-alt, #f8fafc)',
                    border: '1px solid var(--surface-border)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Package size={18} color="#f59e0b" />
                        {item.itemName} ({item.quantity})
                      </h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
                        {item.description}
                      </p>
                      {item.postTitle ? (
                        <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 700, marginTop: '0.35rem' }}>
                          {isBn ? `লক্ষ্য শিক্ষার্থী: ${item.postTitle}` : `Target: ${item.postTitle}`}
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                          {isBn ? 'লক্ষ্য: সাধারণ শিক্ষা তহবিল (কর্তৃপক্ষের সিদ্ধান্ত)' : 'Target: General Pool'}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '9999px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            backgroundColor: item.isAnonymous ? 'rgba(124, 58, 237, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                            color: item.isAnonymous ? '#7c3aed' : '#059669',
                          }}
                        >
                          {item.isAnonymous ? <EyeOff size={12} /> : <Eye size={12} />}
                          {item.isAnonymous ? (isBn ? 'গোপন' : 'Anon') : (isBn ? 'পাবলিক' : 'Public')}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleItemPrivacy(item.id, !item.isAnonymous)}
                          style={{
                            background: 'none',
                            border: '1px solid var(--surface-border, #cbd5e1)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            padding: '0.2rem 0.45rem',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            color: 'var(--text-muted)',
                          }}
                        >
                          {item.isAnonymous ? (isBn ? 'উন্মুক্ত' : 'Unhide') : (isBn ? 'গোপন' : 'Hide')}
                        </button>
                      </div>

                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.35rem 0.85rem',
                          borderRadius: '20px',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          backgroundColor:
                            item.status === 'accepted'
                              ? 'rgba(16, 185, 129, 0.15)'
                              : item.status === 'pending'
                              ? 'rgba(245, 158, 11, 0.15)'
                              : 'rgba(239, 68, 68, 0.15)',
                          color:
                            item.status === 'accepted'
                              ? '#10b981'
                              : item.status === 'pending'
                              ? '#f59e0b'
                              : '#ef4444',
                        }}
                      >
                        {item.status === 'accepted' && <CheckCircle2 size={14} />}
                        {item.status === 'pending' && <Clock size={14} />}
                        {item.status === 'rejected' && <XCircle size={14} />}
                        {item.status === 'accepted'
                          ? isBn ? 'গৃহীত ও অনুমোদিত' : 'Accepted'
                          : item.status === 'pending'
                          ? isBn ? 'যাচাই প্রক্রিয়াধীন' : 'Pending Review'
                          : isBn ? 'বাতিলকৃত' : 'Rejected'}
                      </span>
                    </div>
                  </div>

                  {/* Admin Instruction Box */}
                  {item.adminInstruction && (
                    <div
                      style={{
                        marginTop: '1rem',
                        padding: '0.85rem 1rem',
                        borderRadius: 'var(--radius-md, 12px)',
                        backgroundColor:
                          item.status === 'accepted'
                            ? 'var(--primary-light, rgba(16, 185, 129, 0.1))'
                            : 'var(--danger-light, rgba(239, 68, 68, 0.1))',
                        border:
                          item.status === 'accepted'
                            ? '1px solid rgba(16, 185, 129, 0.3)'
                            : '1px solid rgba(239, 68, 68, 0.3)',
                        color: item.status === 'accepted' ? '#10b981' : '#ef4444',
                        fontSize: '0.88rem',
                      }}
                    >
                      <strong style={{ display: 'block', marginBottom: '0.2rem', fontWeight: 800 }}>
                        {item.status === 'accepted'
                          ? isBn ? 'কর্তৃপক্ষের গ্রহণ নির্দেশনা / কুরিয়ার ঠিকানা:' : 'Admin Instruction / Logistics:'
                          : isBn ? 'বাতিলকরণের কারণ / নির্দেশনা:' : 'Rejection Reason / Note:'}
                      </strong>
                      <span>{item.adminInstruction}</span>
                    </div>
                  )}

                  {/* Donor Shipment Status or Action Button (Only if Accepted) */}
                  {item.status === 'accepted' && (
                    <div style={{ marginTop: '0.85rem' }}>
                      {item.donorShipmentNote ? (
                        <div
                          style={{
                            padding: '0.85rem 1rem',
                            borderRadius: '10px',
                            backgroundColor: 'rgba(59, 130, 246, 0.08)',
                            border: '1px solid rgba(59, 130, 246, 0.25)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#2563eb', fontWeight: 700, fontSize: '0.85rem' }}>
                            <CheckCircle2 size={16} />
                            <span>{isBn ? 'পণ্য পাঠানো নিশ্চিত করা হয়েছে' : 'Item Dispatched by Donor'}</span>
                          </div>
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-main)', marginTop: '0.3rem' }}>
                            {item.donorShipmentNote}
                          </div>
                          {item.donorShippedAt && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                              {new Date(item.donorShippedAt).toLocaleString(isBn ? 'bn-BD' : 'en-US')}
                            </div>
                          )}

                          {/* Admin Follow-Up Reply */}
                          {item.adminFollowUpReply && (
                            <div style={{ marginTop: '0.6rem', padding: '0.5rem 0.75rem', borderRadius: '8px', backgroundColor: 'var(--background, #fff)', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}>
                              <strong style={{ color: '#047857' }}>{isBn ? 'কর্তৃপক্ষের রিপ্লাই: ' : 'Admin Reply: '}</strong>
                              <span>{item.adminFollowUpReply}</span>
                            </div>
                          )}

                          {/* Assigned Student Card & Link */}
                          {(item.assignedStudentName || item.assignedStudentId) && (
                            <div style={{ marginTop: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                              <div style={{ fontSize: '0.82rem', color: '#065f46', fontWeight: 700 }}>
                                <span>{isBn ? 'উপহার প্রাপ্ত শিক্ষার্থী: ' : 'Allocated Student: '}</span>
                                <strong>{item.assignedStudentName || (isBn ? 'শিক্ষার্থী' : 'Student')}</strong>
                              </div>
                              {item.assignedStudentId && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedStudentId(item.assignedStudentId)}
                                  style={{
                                    padding: '0.25rem 0.65rem',
                                    borderRadius: '6px',
                                    backgroundColor: '#059669',
                                    color: '#fff',
                                    border: 'none',
                                    fontSize: '0.78rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                  }}
                                >
                                  {isBn ? 'শিক্ষার্থীর প্রোফাইল দেখুন' : 'View Student Profile'}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            {isBn ? 'পণ্য কুরিয়ার বা পাঠানোর পর এখানে চালান/রশিদ জমা দিন:' : 'Submit dispatch/courier info once sent:'}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setShipmentModalItem(item);
                              setShipmentNote('');
                              setShipmentError('');
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              padding: '0.45rem 0.9rem',
                              borderRadius: '8px',
                              backgroundColor: '#059669',
                              color: '#ffffff',
                              border: 'none',
                              fontSize: '0.85rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            <Send size={14} />
                            <span>{isBn ? 'পণ্য পাঠানো হয়েছে (রিপ্লাই দিন)' : 'Mark as Sent / Reply'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Shipment Reply Modal */}
      {shipmentModalItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => setShipmentModalItem(null)}
        >
          <div
            style={{
              backgroundColor: 'var(--surface, #ffffff)',
              borderRadius: '16px',
              maxWidth: '500px',
              width: '100%',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-xl)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {isBn ? 'পণ্য পাঠানো নিশ্চিতকরণ ও চালান রিপ্লাই' : 'Confirm Shipment & Tracking'}
              </h3>
              <button
                type="button"
                onClick={() => setShipmentModalItem(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '0.65rem 0.85rem', borderRadius: '8px', backgroundColor: 'var(--background-alt, #f8fafc)', border: '1px solid var(--surface-border)', marginBottom: '1rem', fontSize: '0.88rem' }}>
              <strong>{shipmentModalItem.itemName}</strong> ({shipmentModalItem.quantity})
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                {isBn ? 'কর্তৃপক্ষের নির্দেশনা: ' : 'Admin note: '} {shipmentModalItem.adminInstruction}
              </div>
            </div>

            <form onSubmit={handleShipmentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-main)' }}>
                  {isBn ? 'কুরিয়ার/পার্সেল বিবরণ ও চালান নম্বর *' : 'Courier / Tracking Info *'}
                </label>
                <textarea
                  rows={3}
                  required
                  value={shipmentNote}
                  onChange={(e) => setShipmentNote(e.target.value)}
                  placeholder={isBn ? 'যেমন: সুন্দরবন কুরিয়ারে পাঠিয়েছি, চালান নং ১২৩৪৫৬, প্রেরণের তারিখ: ১০ অক্টোবর' : 'e.g., Shipped via Courier, Tracking #123456'}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid var(--surface-border)',
                    fontSize: '0.88rem',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              {shipmentError && (
                <div style={{ color: '#ef4444', fontSize: '0.85rem' }}>{shipmentError}</div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShipmentModalItem(null)}
                  style={{
                    padding: '0.6rem 1rem',
                    borderRadius: '8px',
                    backgroundColor: 'var(--background-alt)',
                    border: '1px solid var(--surface-border)',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submittingShipment}
                  style={{
                    padding: '0.6rem 1.25rem',
                    borderRadius: '8px',
                    backgroundColor: '#059669',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 700,
                    cursor: submittingShipment ? 'not-allowed' : 'pointer',
                  }}
                >
                  {submittingShipment ? (isBn ? 'জমা হচ্ছে...' : 'Submitting...') : (isBn ? 'চালান নিশ্চিত করুন' : 'Confirm Shipment')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* E-Receipt Modal */}
      {selectedReceipt && (
        <EReceiptModal
          receipt={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}

      {/* Item Donation Modal */}
      <ItemDonationModal
        isOpen={isItemModalOpen}
        onClose={() => {
          setIsItemModalOpen(false);
          loadData();
        }}
      />

      {/* Financial Donation Modal */}
      <FinancialDonationModal
        isOpen={isFinancialModalOpen}
        onClose={() => {
          setIsFinancialModalOpen(false);
          loadData();
        }}
      />

      {/* Student Details Modal */}
      <StudentDetailsModal
        isOpen={!!selectedStudentId}
        onClose={() => setSelectedStudentId(null)}
        studentId={selectedStudentId}
        isBn={isBn}
      />
    </div>
  );
}
