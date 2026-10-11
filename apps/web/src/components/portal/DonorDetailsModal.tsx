'use client';

import React, { useState, useEffect } from 'react';
import styles from './DonorDetailsModal.module.css';
import { getApiUrl } from '../../lib/api-config';
import { getAuthToken } from '../../lib/auth-token';
import {
  Heart,
  X,
  User,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  Copy,
  Check,
  Package,
  DollarSign,
  TrendingUp,
  MapPin,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

interface DonorDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  donorId: string | null;
  isBn?: boolean;
}

export default function DonorDetailsModal({
  isOpen,
  onClose,
  donorId,
  isBn = true,
}: DonorDetailsModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<{
    donor: any;
    stats: {
      totalDonated: number;
      totalCount: number;
      verifiedCount: number;
      itemDonationsCount: number;
    };
    donations: any[];
    itemDonations: any[];
  } | null>(null);

  const [activeTab, setActiveTab] = useState<'monetary' | 'items'>('monetary');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  useEffect(() => {
    if (!isOpen || !donorId) {
      setData(null);
      setError('');
      return;
    }

    const fetchDonorDetails = async () => {
      setLoading(true);
      setError('');
      try {
        const token = await getAuthToken();
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/users/donors/${donorId}/details`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error(isBn ? 'ডোনার তথ্য লোড করতে ব্যর্থ হয়েছে।' : 'Failed to load donor profile.');
        }

        const resData = await res.json();
        setData(resData);
      } catch (err: any) {
        setError(err.message || (isBn ? 'ত্রুটি ঘটেছে।' : 'An error occurred.'));
      } finally {
        setLoading(false);
      }
    };

    fetchDonorDetails();
  }, [isOpen, donorId, isBn]);

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerTitleWrapper}>
            <div className={styles.headerIcon}>
              <Heart size={22} />
            </div>
            <div>
              <h2 className={styles.modalTitle}>
                {isBn ? 'সম্মানিত ডোনার প্রোফাইল ও অনুদান হিস্টোরি' : 'Donor Profile & Donation Records'}
              </h2>
              <p className={styles.modalSubtitle}>
                {isBn
                  ? 'ডোনারের পূর্ণ বিবরণ, মোট অনুদান পরিমাণ ও অতীত লেনদেন হিস্ট্রি'
                  : 'Complete donor details, aggregate donation volume, and itemized transaction history'}
              </p>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label={isBn ? 'বন্ধ করুন' : 'Close'}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          {loading ? (
            <div className={styles.emptyState}>
              <Clock size={32} className={styles.emptyIcon} />
              <p>{isBn ? 'ডোনারের তথ্য ও অনুদান হিস্ট্রি লোড হচ্ছে...' : 'Loading donor records...'}</p>
            </div>
          ) : error ? (
            <div className={styles.emptyState} style={{ color: '#ef4444' }}>
              <XCircle size={32} className={styles.emptyIcon} />
              <p>{error}</p>
            </div>
          ) : data ? (
            <>
              {/* Donor Summary Card */}
              <div className={styles.donorProfileCard}>
                <div className={styles.avatarCircle}>
                  {data.donor.fullName ? data.donor.fullName[0].toUpperCase() : 'D'}
                </div>
                <div className={styles.donorInfo}>
                  <div className={styles.donorNameRow}>
                    <span className={styles.donorName}>{data.donor.fullName || (isBn ? 'অজ্ঞাত দাতা' : 'Anonymous Donor')}</span>
                    <span
                      className={`${styles.statusBadge} ${data.donor.status === 'active' ? styles.statusActive : styles.statusSuspended}`}
                    >
                      <ShieldCheck size={13} />
                      {data.donor.status === 'active'
                        ? isBn ? 'সক্রিয় দাতা' : 'Active Donor'
                        : isBn ? 'স্থগিত' : 'Suspended'}
                    </span>
                  </div>

                  <div className={styles.contactList}>
                    {data.donor.email && (
                      <div className={styles.contactItem}>
                        <Mail size={14} color="#64748b" />
                        <span>{data.donor.email}</span>
                        <button
                          type="button"
                          className={`${styles.copyBtn} ${copiedKey === 'email' ? styles.copyBtnSuccess : ''}`}
                          onClick={() => handleCopy(data.donor.email, 'email')}
                          title={isBn ? 'ইমেইল কপি করুন' : 'Copy Email'}
                        >
                          {copiedKey === 'email' ? <Check size={12} /> : <Copy size={12} />}
                          <span>{copiedKey === 'email' ? (isBn ? 'কপি হয়েছে' : 'Copied') : (isBn ? 'কপি' : 'Copy')}</span>
                        </button>
                      </div>
                    )}

                    {data.donor.phone && (
                      <div className={styles.contactItem}>
                        <Phone size={14} color="#64748b" />
                        <span>{data.donor.phone}</span>
                        <button
                          type="button"
                          className={`${styles.copyBtn} ${copiedKey === 'phone' ? styles.copyBtnSuccess : ''}`}
                          onClick={() => handleCopy(data.donor.phone, 'phone')}
                          title={isBn ? 'ফোন কপি করুন' : 'Copy Phone'}
                        >
                          {copiedKey === 'phone' ? <Check size={12} /> : <Copy size={12} />}
                          <span>{copiedKey === 'phone' ? (isBn ? 'কপি হয়েছে' : 'Copied') : (isBn ? 'কপি' : 'Copy')}</span>
                        </button>
                      </div>
                    )}

                    {data.donor.address && (
                      <div className={styles.contactItem}>
                        <MapPin size={14} color="#64748b" />
                        <span>{data.donor.address}</span>
                      </div>
                    )}

                    {data.donor.createdAt && (
                      <div className={styles.contactItem} style={{ fontSize: '0.8rem', color: 'var(--text-muted, #64748b)' }}>
                        <Calendar size={14} />
                        <span>
                          {isBn ? 'যোগদানের তারিখ: ' : 'Member since: '}
                          {new Date(data.donor.createdAt).toLocaleDateString(isBn ? 'bn-BD' : 'en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats Metrics Row */}
              <div className={styles.statsRow}>
                <div className={styles.statCard}>
                  <div className={styles.statIconGreen}>
                    <TrendingUp size={22} />
                  </div>
                  <div>
                    <div className={styles.statLabel}>
                      {isBn ? 'মোট প্রদত্ত অর্থ (যাচাইকৃত)' : 'Total Verified Donations'}
                    </div>
                    <div className={styles.statValue}>
                      ৳{Number(data.stats.totalDonated || 0).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statIconPink}>
                    <DollarSign size={22} />
                  </div>
                  <div>
                    <div className={styles.statLabel}>
                      {isBn ? 'আর্থিক অনুদান সংখ্যা' : 'Monetary Contributions'}
                    </div>
                    <div className={styles.statValue}>
                      {data.stats.verifiedCount} / {data.stats.totalCount} {isBn ? 'টি' : ''}
                    </div>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statIconBlue}>
                    <Package size={22} />
                  </div>
                  <div>
                    <div className={styles.statLabel}>
                      {isBn ? 'পণ্য অনুদান সংখ্যা' : 'Item Donations'}
                    </div>
                    <div className={styles.statValue}>
                      {data.stats.itemDonationsCount} {isBn ? 'টি' : ''}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sub-tabs: Monetary vs Items */}
              <div className={styles.modalTabs}>
                <button
                  type="button"
                  className={`${styles.modalTabBtn} ${activeTab === 'monetary' ? styles.modalTabBtnActive : ''}`}
                  onClick={() => setActiveTab('monetary')}
                >
                  <DollarSign size={16} />
                  <span>{isBn ? 'আর্থিক অনুদান হিস্টোরি' : 'Monetary Donations'}</span>
                  <span className={styles.tabBadge}>{data.donations.length}</span>
                </button>

                <button
                  type="button"
                  className={`${styles.modalTabBtn} ${activeTab === 'items' ? styles.modalTabBtnActive : ''}`}
                  onClick={() => setActiveTab('items')}
                >
                  <Package size={16} />
                  <span>{isBn ? 'পণ্য অনুদান হিস্টোরি' : 'Item Donations'}</span>
                  <span className={styles.tabBadge}>{data.itemDonations.length}</span>
                </button>
              </div>

              {/* Tab 1: Monetary Donations */}
              {activeTab === 'monetary' && (
                <div>
                  {data.donations.length === 0 ? (
                    <div className={styles.emptyState}>
                      <DollarSign size={32} className={styles.emptyIcon} />
                      <p>{isBn ? 'এই ডোনারের কোনো আর্থিক অনুদান পাওয়া যায়নি।' : 'No monetary donations found for this donor.'}</p>
                    </div>
                  ) : (
                    data.donations.map((don) => (
                      <div key={don.id} className={styles.historyCard}>
                        <div className={styles.historyTopRow}>
                          <div>
                            <span className={styles.historyTitle}>{don.studentName}</span>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #64748b)', marginTop: '0.2rem' }}>
                              {don.isRandom
                                ? isBn ? 'প্রকার: সাধারণ শিক্ষা তহবিল (General Fund)' : 'Type: General Education Fund'
                                : isBn ? 'প্রকার: সরাসরি শিক্ষার্থী ক্যাম্পেইন' : 'Type: Direct Student Campaign'}
                            </div>
                          </div>
                          <span className={styles.historyAmount}>৳{Number(don.amount || 0).toLocaleString()}</span>
                        </div>

                        <div className={styles.historyMetaRow}>
                          <span>{isBn ? 'মেথড: ' : 'Method: '}<strong>{don.paymentMethod}</strong></span>
                          {don.transactionReference && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                              <span>TrxID: <code>{don.transactionReference}</code></span>
                              <button
                                type="button"
                                className={styles.copyBtn}
                                onClick={() => handleCopy(don.transactionReference, don.id)}
                                title={isBn ? 'TrxID কপি করুন' : 'Copy TrxID'}
                              >
                                {copiedKey === don.id ? <Check size={12} color="#059669" /> : <Copy size={12} />}
                              </button>
                            </span>
                          )}
                          <span>
                            {isBn ? 'স্ট্যাটাস: ' : 'Status: '}
                            {don.status === 'accepted' ? (
                              <span style={{ color: '#059669', fontWeight: 700 }}>✓ {isBn ? 'অনুমোদিত ও ভেরিফাইড' : 'Verified'}</span>
                            ) : don.status === 'rejected' ? (
                              <span style={{ color: '#dc2626', fontWeight: 700 }}>✕ {isBn ? 'প্রত্যাখ্যাত' : 'Rejected'}</span>
                            ) : (
                              <span style={{ color: '#d97706', fontWeight: 700 }}>⏳ {isBn ? 'অপেক্ষমাণ' : 'Pending'}</span>
                            )}
                          </span>
                          <span>{isBn ? 'তারিখ: ' : 'Date: '}{don.time || new Date(don.createdAt).toLocaleDateString(isBn ? 'bn-BD' : 'en-US')}</span>
                        </div>

                        {don.rejectionReason && (
                          <div className={styles.rejectionNote}>
                            <strong>{isBn ? 'বাতিলের কারণ: ' : 'Rejection Reason: '}</strong>
                            {don.rejectionReason}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 2: Item Donations */}
              {activeTab === 'items' && (
                <div>
                  {data.itemDonations.length === 0 ? (
                    <div className={styles.emptyState}>
                      <Package size={32} className={styles.emptyIcon} />
                      <p>{isBn ? 'এই ডোনারের কোনো পণ্য অনুদান পাওয়া যায়নি।' : 'No item donations recorded for this donor.'}</p>
                    </div>
                  ) : (
                    data.itemDonations.map((item) => (
                      <div key={item.id} className={styles.historyCard}>
                        <div className={styles.historyTopRow}>
                          <div>
                            <span className={styles.historyTitle}>{item.itemName}</span>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #64748b)', marginTop: '0.2rem' }}>
                              {item.postTitle ? `${isBn ? 'ক্যাম্পেইন: ' : 'Campaign: '} ${item.postTitle}` : (isBn ? 'সাধারণ বরাদ্দ পুল' : 'General Item Pool')}
                            </div>
                          </div>
                          <span className={styles.historyAmount} style={{ color: '#2563eb', fontSize: '1rem' }}>
                            {isBn ? 'পরিমাণ: ' : 'Qty: '}{item.quantity}
                          </span>
                        </div>

                        {item.description && (
                          <p style={{ fontSize: '0.82rem', color: 'var(--text-main, #334155)', margin: '0.35rem 0' }}>
                            {item.description}
                          </p>
                        )}

                        <div className={styles.historyMetaRow}>
                          <span>
                            {isBn ? 'যাচাই স্ট্যাটাস: ' : 'Status: '}
                            {item.status === 'accepted' ? (
                              <span style={{ color: '#059669', fontWeight: 700 }}>✓ {isBn ? 'গৃহীত' : 'Accepted'}</span>
                            ) : item.status === 'rejected' ? (
                              <span style={{ color: '#dc2626', fontWeight: 700 }}>✕ {isBn ? 'প্রত্যাখ্যাত' : 'Rejected'}</span>
                            ) : (
                              <span style={{ color: '#d97706', fontWeight: 700 }}>⏳ {isBn ? 'অপেক্ষমাণ' : 'Pending'}</span>
                            )}
                          </span>
                          <span>
                            {isBn ? 'ডেলিভারি অবস্থা: ' : 'Delivery: '}
                            <strong>
                              {item.deliveryStatus === 'delivered'
                                ? (isBn ? 'পৌঁছেছে' : 'Delivered')
                                : item.deliveryStatus === 'in_transit'
                                ? (isBn ? 'পথিমধ্যে' : 'In Transit')
                                : item.deliveryStatus === 'shipped'
                                ? (isBn ? 'প্রেরিত' : 'Shipped')
                                : item.deliveryStatus === 'pending'
                                ? (isBn ? 'অপেক্ষমাণ' : 'Pending')
                                : item.deliveryStatus}
                            </strong>
                          </span>
                          <span>{isBn ? 'তারিখ: ' : 'Date: '}{item.time || new Date(item.createdAt).toLocaleDateString(isBn ? 'bn-BD' : 'en-US')}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button
            type="button"
            className="btn btn-outline"
            style={{ padding: '0.55rem 1.5rem', fontSize: '0.88rem' }}
            onClick={onClose}
          >
            {isBn ? 'বন্ধ করুন' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
