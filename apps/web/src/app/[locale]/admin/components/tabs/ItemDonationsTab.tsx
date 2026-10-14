'use client';

import React, { useState } from 'react';
import { Package, Clock, History as HistoryIcon, Search, Eye } from 'lucide-react';
import styles from '../../admin.module.css';

interface ItemDonationsTabProps {
  isBn: boolean;
  loadingData: boolean;
  itemDonationsList: any[];
  handleOpenItemDonationReview: (item: any, isReadOnly?: boolean) => void;
}

export function ItemDonationsTab({
  isBn,
  loadingData,
  itemDonationsList,
  handleOpenItemDonationReview,
}: ItemDonationsTabProps) {
  const [itemDonationsTab, setItemDonationsTab] = useState<'pending' | 'history'>('pending');
  const [itemHistorySearch, setItemHistorySearch] = useState<string>('');
  const [itemHistoryStatusFilter, setItemHistoryStatusFilter] = useState<'all' | 'accepted' | 'rejected'>('all');

  return (
    <div>
      <div className={styles.contentHeader}>
        <div>
          <h1 className={styles.pageTitle}>
            <Package size={26} color="#2563eb" />
            {isBn ? 'পণ্য অনুদান যাচাই ও ছাড়পত্র' : 'Item Donations Verification'}
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            {isBn
              ? 'শিক্ষার্থীদের জন্য বই, ল্যাপটপ, সাইকেল ও শিক্ষা উপকরণ অনুদানের যাচাই, কুরিয়ার নির্দেশনা ও হিস্টোরি।'
              : 'Books, laptops, cycles, and educational goods verification, shipment guidance, and clearance history.'}
          </p>
        </div>
      </div>

      {/* Sub-tabs: Pending vs History */}
      <div className={styles.verificationTabs}>
        <button
          type="button"
          className={`${styles.verificationTabBtn} ${itemDonationsTab === 'pending' ? styles.verificationTabBtnActive : ''}`}
          onClick={() => setItemDonationsTab('pending')}
        >
          <Clock size={16} />
          <span>{isBn ? 'পেন্ডিং পণ্য যাচাই' : 'Pending Items'}</span>
          <span className={styles.tabBadge}>
            {itemDonationsList.filter((i) => i.status === 'pending').length}
          </span>
        </button>

        <button
          type="button"
          className={`${styles.verificationTabBtn} ${itemDonationsTab === 'history' ? styles.verificationTabBtnActive : ''}`}
          onClick={() => setItemDonationsTab('history')}
        >
          <HistoryIcon size={16} />
          <span>{isBn ? 'অনুমোদন ও বাতিলের ইতিহাস' : 'Clearance History'}</span>
          <span className={styles.tabBadge}>
            {itemDonationsList.filter((i) => i.status !== 'pending').length}
          </span>
        </button>
      </div>

      {/* TAB 1: Pending Item Donations */}
      {itemDonationsTab === 'pending' && (
        <div
          className="card"
          style={{
            padding: '1.5rem',
            backgroundColor: 'var(--surface, #ffffff)',
            borderRadius: '12px',
            border: '1px solid var(--color-border)',
          }}
        >
          {loadingData ? (
            <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>
              {isBn ? 'ডাটা লোড হচ্ছে...' : 'Loading data...'}
            </p>
          ) : itemDonationsList.filter((i) => i.status === 'pending').length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>
              {isBn ? 'কোনো পণ্য অনুদান আবেদন অপেক্ষমাণ নেই।' : 'No pending item donations waiting for verification.'}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {itemDonationsList
                .filter((i) => i.status === 'pending')
                .map((item) => (
                  <div
                    key={item.id}
                    style={{
                      padding: '1.25rem',
                      backgroundColor: 'var(--background-alt, #f8fafc)',
                      borderRadius: '10px',
                      border: '1px solid var(--color-border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      flexWrap: 'wrap',
                      gap: '1rem',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#2563eb' }}>
                          {item.itemName}
                        </span>
                        <span
                          style={{
                            fontSize: '0.8rem',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '6px',
                            fontWeight: 700,
                            backgroundColor: 'rgba(37, 99, 235, 0.1)',
                            color: '#2563eb',
                          }}
                        >
                          {isBn ? 'পরিমাণ: ' : 'Qty: '}{item.quantity}
                        </span>
                      </div>

                      <p style={{ fontSize: '0.85rem', color: 'var(--text-main, #334155)', margin: '0.35rem 0' }}>
                        {item.description}
                      </p>

                      <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
                        <span>দাতা: <strong>{item.donorName || (isBn ? 'অজ্ঞাত' : 'Anonymous')}</strong> ({item.donorPhone})</span>
                        {item.pickupAddress && <span>পিকআপ ঠিকানা: {item.pickupAddress}</span>}
                        {item.postTitle && <span>ক্যাম্পেইন: <strong>{item.postTitle}</strong></span>}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ padding: '0.45rem 1rem', fontSize: '0.85rem', alignSelf: 'center' }}
                      onClick={() => handleOpenItemDonationReview(item)}
                    >
                      <Eye size={16} /> {isBn ? 'ড্রয়ারে যাচাই ও নির্দেশনা দিন' : 'Review & Instruct'}
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Item Clearance History */}
      {itemDonationsTab === 'history' && (
        <div>
          {/* Search & Filter Toolbar */}
          <div
            style={{
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'center',
              marginBottom: '1rem',
              backgroundColor: 'var(--surface, #ffffff)',
              padding: '0.75rem 1rem',
              borderRadius: '12px',
              border: '1px solid var(--color-border)',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '220px' }}>
              <Search size={18} color="var(--color-text-muted)" />
              <input
                type="text"
                placeholder={isBn ? 'পণ্য, দাতা নাম বা ফোন দিয়ে খুঁজুন...' : 'Search items by name, donor, or phone...'}
                value={itemHistorySearch}
                onChange={(e) => setItemHistorySearch(e.target.value)}
                style={{
                  width: '100%',
                  border: 'none',
                  outline: 'none',
                  fontSize: '0.9rem',
                  backgroundColor: 'transparent',
                  color: 'var(--text-main, #0f172a)',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <select
                value={itemHistoryStatusFilter}
                onChange={(e) => setItemHistoryStatusFilter(e.target.value as any)}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.85rem',
                  backgroundColor: 'var(--surface, #ffffff)',
                  color: 'var(--text-main, #0f172a)',
                  cursor: 'pointer',
                }}
              >
                <option value="all">{isBn ? 'সকল হিস্টোরি (All)' : 'All Records'}</option>
                <option value="accepted">{isBn ? 'অনুমোদিত / গৃহীত (Accepted)' : 'Accepted Only'}</option>
                <option value="rejected">{isBn ? 'প্রত্যাখ্যাত (Rejected)' : 'Rejected Only'}</option>
              </select>

              {(itemHistorySearch || itemHistoryStatusFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setItemHistorySearch('');
                    setItemHistoryStatusFilter('all');
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    color: 'var(--text-muted, #64748b)',
                  }}
                >
                  {isBn ? 'রিসেট' : 'Clear'}
                </button>
              )}
            </div>
          </div>

          <div
            className="card"
            style={{
              padding: '1.5rem',
              backgroundColor: 'var(--surface, #ffffff)',
              borderRadius: '12px',
              border: '1px solid var(--color-border)',
            }}
          >
            {itemDonationsList.filter((i) => i.status !== 'pending').length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>
                {isBn ? 'কোনো পণ্য অনুদানের হিস্টোরি পাওয়া যায়নি।' : 'No historical item donation records found.'}
              </p>
            ) : (
              (() => {
                const filteredHistory = itemDonationsList
                  .filter((i) => i.status !== 'pending')
                  .filter((item) => {
                    if (itemHistoryStatusFilter !== 'all' && item.status !== itemHistoryStatusFilter) {
                      return false;
                    }
                    if (itemHistorySearch) {
                      const q = itemHistorySearch.toLowerCase();
                      return (
                        (item.itemName && item.itemName.toLowerCase().includes(q)) ||
                        (item.donorName && item.donorName.toLowerCase().includes(q)) ||
                        (item.donorPhone && item.donorPhone.toLowerCase().includes(q)) ||
                        (item.description && item.description.toLowerCase().includes(q))
                      );
                    }
                    return true;
                  });

                if (filteredHistory.length === 0) {
                  return (
                    <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>
                      {isBn ? 'ফিল্টারের সাথে কোনো হিস্টোরি মেলেনি।' : 'No item donation history matches the filter.'}
                    </p>
                  );
                }

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {filteredHistory.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          padding: '1.25rem',
                          backgroundColor: 'var(--background-alt, #f8fafc)',
                          borderRadius: '10px',
                          border: '1px solid var(--color-border)',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            flexWrap: 'wrap',
                            gap: '0.75rem',
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                              <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#2563eb' }}>
                                {item.itemName}
                              </span>
                              <span
                                style={{
                                  fontSize: '0.78rem',
                                  padding: '0.15rem 0.5rem',
                                  borderRadius: '6px',
                                  fontWeight: 700,
                                  backgroundColor: 'rgba(37, 99, 235, 0.1)',
                                  color: '#2563eb',
                                }}
                              >
                                {isBn ? 'পরিমাণ: ' : 'Qty: '}{item.quantity}
                              </span>
                            </div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-main, #334155)', margin: '0.25rem 0' }}>
                              {item.description}
                            </p>
                          </div>

                          <button
                            type="button"
                            className="btn btn-outline"
                            style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
                            onClick={() => handleOpenItemDonationReview(item, true)}
                            title={isBn ? 'বিস্তারিত পর্যালোচনা (রিড-অনলি)' : 'Review Details (View Only)'}
                          >
                            <Eye size={15} /> {isBn ? 'বিস্তারিত দেখুন' : 'View Details'}
                          </button>
                        </div>

                        <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap', fontSize: '0.82rem' }}>
                          <span
                            style={{
                              padding: '0.2rem 0.6rem',
                              borderRadius: '9999px',
                              fontWeight: 700,
                              backgroundColor: item.status === 'accepted' ? '#ecfdf5' : '#fef2f2',
                              color: item.status === 'accepted' ? '#047857' : '#b91c1c',
                              border: `1px solid ${item.status === 'accepted' ? '#a7f3d0' : '#fecaca'}`,
                            }}
                          >
                            {item.status === 'accepted' ? '✓ ' + (isBn ? 'অনুমোদিত' : 'Accepted') : '✕ ' + (isBn ? 'প্রত্যাখ্যাত' : 'Rejected')}
                          </span>

                          <span style={{ color: 'var(--text-muted)' }}>
                            দাতা: <strong>{item.donorName || (isBn ? 'অজ্ঞাত' : 'Anonymous')}</strong> ({item.donorPhone})
                          </span>
                          <span style={{ color: 'var(--text-muted)' }}>
                            | ডেলিভারি: <strong>{item.deliveryStatus}</strong>
                          </span>
                        </div>

                        {item.adminInstruction && (
                          <div className={styles.historyWarningBox}>
                            <strong>📋 {isBn ? 'অ্যাডমিন নির্দেশনা:' : 'Admin Instruction:'}</strong> {item.adminInstruction}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ItemDonationsTab;
