'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from '../../i18n/routing';
import {
  Bell,
  LucideIcon,
  CheckCircle2,
  Building2,
  GraduationCap,
  DollarSign,
  UserCheck,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { auth } from '../../lib/firebase';
import { getApiUrl } from '../../lib/api-config';
import { getAuthToken } from '../../lib/auth-token';
import styles from './AdminNotificationDropdown.module.css';

export interface NotificationCategory {
  id: string;
  titleBn: string;
  titleEn: string;
  count: number;
  icon: LucideIcon;
  navKey?: string;
}

interface NotificationItem {
  id: string;
  titleBn: string;
  titleEn: string;
  messageBn: string;
  messageEn: string;
  type: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

interface AdminNotificationDropdownProps {
  categories?: NotificationCategory[];
  totalCount?: number;
  onSelectNav?: (navKey: string) => void;
}

export default function AdminNotificationDropdown({
  categories = [],
  totalCount,
  onSelectNav,
}: AdminNotificationDropdownProps) {
  const locale = useLocale();
  const isBn = locale === 'bn';
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [liveNotifications, setLiveNotifications] = useState<NotificationItem[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const fetchLiveNotifications = async () => {
    try {
      const token = await getAuthToken();
      if (!token) return;
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setLiveNotifications(data);
        }
      }
    } catch (err) {
      // Quiet fail on network hiccups
    }
  };

  useEffect(() => {
    fetchLiveNotifications();
    const interval = setInterval(fetchLiveNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const unreadLiveCount = liveNotifications.filter((n) => !n.isRead).length;
  const categoriesTotal = categories.reduce((sum, c) => sum + (c.count || 0), 0);
  const effectiveTotal =
    totalCount !== undefined
      ? totalCount
      : categories.length > 0
      ? categoriesTotal + unreadLiveCount
      : unreadLiveCount;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleCategoryClick = (navKey?: string) => {
    setIsOpen(false);
    if (navKey && onSelectNav) {
      onSelectNav(navKey);
    }
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    setIsOpen(false);
    // Mark as read in backend
    try {
      const token = await getAuthToken();
      if (token && !notif.isRead) {
        const apiUrl = getApiUrl();
        await fetch(`${apiUrl}/notifications/${notif.id}/read`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
        });
        setLiveNotifications((prev) =>
          prev.map((item) => (item.id === notif.id ? { ...item, isRead: true } : item))
        );
      }
    } catch (e) {}

    if (notif.link) {
      if (notif.link.includes('tab=') && onSelectNav) {
        const tabMatch = notif.link.match(/tab=([^&]+)/);
        if (tabMatch && tabMatch[1]) {
          onSelectNav(tabMatch[1]);
          return;
        }
      }
      router.push(notif.link as any);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'org_verification':
      case 'member_org_suggestion':
        return <Building2 size={16} />;
      case 'student_affiliation':
      case 'student_verification_result':
        return <GraduationCap size={16} />;
      case 'teacher_affiliation':
      case 'teacher_verification_result':
      case 'teacher_affiliation_approved':
        return <UserCheck size={16} />;
      case 'donation_verification':
        return <DollarSign size={16} />;
      default:
        return <Bell size={16} />;
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const diffSec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
      if (diffSec < 60) return isBn ? 'এইমাত্র' : 'just now';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return isBn ? `${diffMin} মিনিট আগে` : `${diffMin}m ago`;
      const diffHour = Math.floor(diffMin / 60);
      if (diffHour < 24) return isBn ? `${diffHour} ঘণ্টা আগে` : `${diffHour}h ago`;
      const diffDay = Math.floor(diffHour / 24);
      return isBn ? `${diffDay} দিন আগে` : `${diffDay}d ago`;
    } catch {
      return '';
    }
  };

  return (
    <div className={styles.notifWrapper} ref={wrapperRef}>
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchLiveNotifications();
        }}
        className={`${styles.notifBtn} ${isOpen ? styles.notifBtnOpen : ''}`}
        title={isBn ? `নোটিফিকেশন (${effectiveTotal})` : `Notifications (${effectiveTotal})`}
        aria-label="Admin notifications"
        aria-expanded={isOpen}
      >
        <Bell size={18} />
        {effectiveTotal > 0 ? (
          <span className={styles.badge}>{effectiveTotal > 99 ? '99+' : effectiveTotal}</span>
        ) : null}
      </button>

      {isOpen && (
        <div className={styles.dropdownMenu}>
          <div className={styles.menuHeader}>
            <span className={styles.menuHeaderTitle}>
              {isBn ? 'নোটিফিকেশন ও অ্যালার্ট' : 'Notifications & Alerts'}
            </span>
            <span className={styles.menuHeaderBadge}>
              {isBn ? `${effectiveTotal} টি অপেক্ষমাণ` : `${effectiveTotal} pending`}
            </span>
          </div>

          <div className={styles.menuBody}>
            {/* 1. Category Quick Links (If provided in Admin Panel) */}
            {categories.length > 0 && categories.some((c) => c.count > 0) && (
              <div style={{ marginBottom: '0.5rem' }}>
                <div className={styles.sectionHeading}>
                  {isBn ? 'বিভাগভিত্তিক অপেক্ষমাণ' : 'Pending by Category'}
                </div>
                {categories
                  .filter((c) => c.count > 0)
                  .map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleCategoryClick(cat.navKey)}
                        className={styles.notifItem}
                      >
                        <div className={styles.notifItemLeft}>
                          <Icon size={16} className={styles.notifItemIcon} />
                          <span>{isBn ? cat.titleBn : cat.titleEn}</span>
                        </div>
                        <span className={styles.notifItemCount}>{cat.count}</span>
                      </button>
                    );
                  })}
              </div>
            )}

            {/* 2. Real Incoming Notifications Feed */}
            {liveNotifications.length > 0 && (
              <div>
                {categories.length > 0 && categories.some((c) => c.count > 0) && (
                  <div className={styles.sectionHeading}>
                    {isBn ? 'সাম্প্রতিক নোটিফিকেশন' : 'Recent Notifications'}
                  </div>
                )}
                {liveNotifications.slice(0, 8).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNotificationClick(item)}
                    className={`${styles.feedItem} ${!item.isRead ? styles.feedItemUnread : ''}`}
                  >
                    <div className={styles.feedItemIcon}>{getNotificationIcon(item.type)}</div>
                    <div className={styles.feedItemContent}>
                      <div className={styles.feedItemTitle}>
                        {isBn ? item.titleBn : item.titleEn}
                      </div>
                      <div className={styles.feedItemMessage}>
                        {isBn ? item.messageBn : item.messageEn}
                      </div>
                      <div className={styles.feedItemTime}>{formatTimeAgo(item.createdAt)}</div>
                    </div>
                    {!item.isRead && <div className={styles.feedItemDot} />}
                  </button>
                ))}
              </div>
            )}

            {/* 3. Empty State if nothing pending and no feed */}
            {categories.every((c) => (c.count || 0) === 0) && liveNotifications.length === 0 && (
              <div className={styles.emptyState}>
                <CheckCircle2 size={24} className={styles.emptyIcon} />
                <p>
                  {isBn
                    ? 'বর্তমানে কোনো অপেক্ষমাণ নোটিফিকেশন নেই।'
                    : 'No pending alerts or notifications.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
