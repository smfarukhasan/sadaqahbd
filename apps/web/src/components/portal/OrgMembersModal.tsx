'use client';

import React, { useState, useEffect } from 'react';
import styles from './OrgMembersModal.module.css';
import { getApiUrl } from '../../lib/api-config';
import { getAuthToken } from '../../lib/auth-token';
import {
  Building2,
  X,
  Search,
  Users,
  GraduationCap,
  Copy,
  Check,
  Mail,
  Phone,
  User,
  ShieldCheck,
  Loader2,
  AlertCircle,
  MapPin,
  FileText,
} from 'lucide-react';

interface TeacherItem {
  id: string;
  profileId: string;
  fullName: string;
  email: string;
  phone: string;
  status: string;
  department: string;
  designation: string;
  employeeId?: string;
  verificationStatus: string;
}

interface StudentItem {
  id: string;
  profileId: string;
  fullName: string;
  email: string;
  phone: string;
  status: string;
  className: string;
  department: string;
  rollNumber: string;
  fatherName?: string;
  guardianName?: string;
  guardianPhone?: string;
  bloodGroup?: string;
  presentAddress?: string;
  verificationStatus: string;
}

interface OrgData {
  organization: {
    id: string;
    name: string;
    contactPhone: string;
    contactPerson: string;
    email?: string;
    address: string;
    type?: string;
    status: string;
    registrationNumber?: string;
  };
  teachers: TeacherItem[];
  students: StudentItem[];
}

interface OrgMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string | null;
  orgName?: string;
  isBn?: boolean;
}

export default function OrgMembersModal({
  isOpen,
  onClose,
  orgId,
  orgName,
  isBn = true,
}: OrgMembersModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<OrgData | null>(null);
  const [activeTab, setActiveTab] = useState<'teachers' | 'students'>('teachers');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !orgId) {
      setData(null);
      setError('');
      setSearchTerm('');
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError('');

    const fetchMembers = async () => {
      try {
        const token = await getAuthToken();
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/organizations/${orgId}/members`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || (isBn ? 'সদস্য তালিকা লোড করতে ব্যর্থ হয়েছে।' : 'Failed to load organization members.'));
        }

        const json = await res.json();
        if (isMounted) {
          setData(json);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || (isBn ? 'সার্ভার ত্রুটি দেখা দিয়েছে।' : 'Server error occurred.'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchMembers();

    return () => {
      isMounted = false;
    };
  }, [isOpen, orgId, isBn]);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string, labelBn: string, labelEn: string) => {
    if (!text || text.trim() === '') return;
    navigator.clipboard.writeText(text.trim());
    setCopiedKey(key);
    setToastMsg(isBn ? `${labelBn} কপি করা হয়েছে!` : `${labelEn} copied!`);

    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 1500);

    setTimeout(() => {
      setToastMsg((prev) => (prev ? null : prev));
    }, 2200);
  };

  const teachers = data?.teachers || [];
  const students = data?.students || [];

  const filterText = searchTerm.trim().toLowerCase();

  const filteredTeachers = teachers.filter((t) => {
    if (!filterText) return true;
    return (
      t.fullName?.toLowerCase().includes(filterText) ||
      t.email?.toLowerCase().includes(filterText) ||
      t.phone?.includes(filterText) ||
      t.department?.toLowerCase().includes(filterText) ||
      t.designation?.toLowerCase().includes(filterText) ||
      t.employeeId?.toLowerCase().includes(filterText)
    );
  });

  const filteredStudents = students.filter((s) => {
    if (!filterText) return true;
    return (
      s.fullName?.toLowerCase().includes(filterText) ||
      s.email?.toLowerCase().includes(filterText) ||
      s.phone?.includes(filterText) ||
      s.guardianPhone?.includes(filterText) ||
      s.className?.toLowerCase().includes(filterText) ||
      s.department?.toLowerCase().includes(filterText) ||
      s.rollNumber?.toLowerCase().includes(filterText) ||
      s.fatherName?.toLowerCase().includes(filterText)
    );
  });

  const getStatusBadge = (status: string) => {
    if (status === 'verified') {
      return (
        <span className={`${styles.statusBadge} ${styles.statusVerified}`}>
          {isBn ? 'অনুমোদিত' : 'Verified'}
        </span>
      );
    }
    if (status === 'rejected') {
      return (
        <span className={`${styles.statusBadge} ${styles.statusRejected}`}>
          {isBn ? 'বাতিলকৃত' : 'Rejected'}
        </span>
      );
    }
    return (
      <span className={`${styles.statusBadge} ${styles.statusPending}`}>
        {isBn ? 'অপেক্ষমাণ' : 'Pending'}
      </span>
    );
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Mobile Pull Handle (Bottom Sheet Drawer Indicator) */}
        <div className={styles.pullHandle} />

        {/* Modal Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <Building2 size={22} />
            </div>
            <div>
              <h2 className={styles.headerTitle}>
                {data?.organization?.name || orgName || (isBn ? 'প্রতিষ্ঠানের সদস্য তালিকা' : 'Organization Directory')}
              </h2>
              <div className={styles.headerSubtitle}>
                <span>
                  {isBn ? 'সংশ্লিষ্ট শিক্ষক ও শিক্ষার্থীদের যোগাযোগ তালিকা' : 'Affiliated Teachers & Students Directory'}
                </span>
                {data?.organization?.type && (
                  <>
                    <span>•</span>
                    <span style={{ textTransform: 'capitalize' }}>{data.organization.type}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            title={isBn ? 'বন্ধ করুন' : 'Close'}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Organization Summary Bar with quick copy */}
        {data?.organization && (
          <div className={styles.orgSummaryBar}>
            {data.organization.address && (
              <div className={styles.orgMetaItem}>
                <MapPin size={14} color="#059669" />
                <span>{data.organization.address}</span>
              </div>
            )}
            {data.organization.contactPerson && (
              <div className={styles.orgMetaItem}>
                <User size={14} color="#6366f1" />
                <span>
                  {isBn ? 'প্রতিনিধি:' : 'Contact:'} <strong>{data.organization.contactPerson}</strong>
                </span>
              </div>
            )}
            {data.organization.contactPhone && (
              <div className={styles.orgMetaItem}>
                <Phone size={14} color="#0284c7" />
                <div className={styles.copyField}>
                  <span>{data.organization.contactPhone}</span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(data.organization.contactPhone, 'org-phone', 'প্রতিষ্ঠানের ফোন', 'Org Phone')
                    }
                    className={`${styles.copyBtn} ${copiedKey === 'org-phone' ? styles.copyBtnSuccess : ''}`}
                    title={isBn ? 'ফোন নম্বর কপি করুন' : 'Copy Phone'}
                  >
                    {copiedKey === 'org-phone' ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>
            )}
            {data.organization.email && (
              <div className={styles.orgMetaItem}>
                <Mail size={14} color="#8b5cf6" />
                <div className={styles.copyField}>
                  <span>{data.organization.email}</span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(data.organization.email!, 'org-email', 'প্রতিষ্ঠানের ইমেইল', 'Org Email')
                    }
                    className={`${styles.copyBtn} ${copiedKey === 'org-email' ? styles.copyBtnSuccess : ''}`}
                    title={isBn ? 'ইমেইল কপি করুন' : 'Copy Email'}
                  >
                    {copiedKey === 'org-email' ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab Selection & Search Row */}
        <div className={styles.filterControls}>
          <div className={styles.tabButtons}>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'teachers' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('teachers')}
            >
              <Users size={16} />
              <span>{isBn ? 'শিক্ষক তালিকা' : 'Teachers'}</span>
              <span className={styles.countPill}>{teachers.length}</span>
            </button>

            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'students' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('students')}
            >
              <GraduationCap size={16} />
              <span>{isBn ? 'শিক্ষার্থী তালিকা' : 'Students'}</span>
              <span className={styles.countPill}>{students.length}</span>
            </button>
          </div>

          <div className={styles.searchBox}>
            <Search size={15} className={styles.searchIcon} />
            <input
              type="text"
              placeholder={
                isBn
                  ? 'নাম, ইমেইল, ফোন বা পদবী দিয়ে খুঁজুন...'
                  : 'Search by name, email, phone...'
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        {/* Modal Main Content */}
        <div className={styles.contentBody}>
          {loading ? (
            <div className={styles.centerState}>
              <Loader2 size={32} className="animate-spin" color="#059669" />
              <span>{isBn ? 'সদস্য তালিকা লোড হচ্ছে...' : 'Loading members directory...'}</span>
            </div>
          ) : error ? (
            <div className={styles.centerState}>
              <AlertCircle size={36} color="#ef4444" />
              <span style={{ color: '#ef4444', fontWeight: 600 }}>{error}</span>
            </div>
          ) : activeTab === 'teachers' ? (
            /* =================== TEACHERS VIEW =================== */
            filteredTeachers.length === 0 ? (
              <div className={styles.centerState}>
                <Users size={36} color="#94a3b8" />
                <span>
                  {searchTerm
                    ? isBn
                      ? 'সার্চের সাথে কোনো শিক্ষক মেলেনি।'
                      : 'No teachers match your search.'
                    : isBn
                    ? 'এই প্রতিষ্ঠানে কোনো শিক্ষক যুক্ত নেই।'
                    : 'No affiliated teachers found for this organization.'}
                </span>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className={styles.tableWrapper}>
                  <table className={styles.membersTable}>
                    <thead>
                      <tr>
                        <th>{isBn ? 'শিক্ষকের নাম' : 'Teacher Name'}</th>
                        <th>{isBn ? 'পদবী ও বিভাগ' : 'Designation & Dept'}</th>
                        <th>{isBn ? 'ইমেইল এড্রেস' : 'Email Address'}</th>
                        <th>{isBn ? 'মোবাইল নম্বর' : 'Phone Number'}</th>
                        <th>{isBn ? 'স্ট্যাটাস' : 'Status'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTeachers.map((t) => (
                        <tr key={t.id}>
                          <td>
                            <div className={styles.copyField}>
                              <span className={styles.copyTextName}>{t.fullName}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(t.fullName, `t-name-${t.id}`, 'শিক্ষকের নাম', 'Teacher Name')}
                                className={`${styles.copyBtn} ${copiedKey === `t-name-${t.id}` ? styles.copyBtnSuccess : ''}`}
                                title={isBn ? 'নাম কপি করুন' : 'Copy Name'}
                              >
                                {copiedKey === `t-name-${t.id}` ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                              </button>
                            </div>
                            {t.employeeId && (
                              <div className={styles.copyTextSub}>আইডি: {t.employeeId}</div>
                            )}
                          </td>
                          <td>
                            <div className={styles.primaryInfo}>{t.designation || 'শিক্ষক'}</div>
                            <div className={styles.copyTextSub}>{t.department || 'সাধারণ'}</div>
                          </td>
                          <td>
                            <div className={styles.copyField}>
                              <span className={styles.copyTextSub}>{t.email}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(t.email, `t-email-${t.id}`, 'ইমেইল', 'Email')}
                                className={`${styles.copyBtn} ${copiedKey === `t-email-${t.id}` ? styles.copyBtnSuccess : ''}`}
                                title={isBn ? 'ইমেইল কপি করুন' : 'Copy Email'}
                              >
                                {copiedKey === `t-email-${t.id}` ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                              </button>
                            </div>
                          </td>
                          <td>
                            {t.phone ? (
                              <div className={styles.copyField}>
                                <span className={styles.phoneText}>{t.phone}</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(t.phone, `t-phone-${t.id}`, 'ফোন নম্বর', 'Phone')}
                                  className={`${styles.copyBtn} ${copiedKey === `t-phone-${t.id}` ? styles.copyBtnSuccess : ''}`}
                                  title={isBn ? 'ফোন নম্বর কপি করুন' : 'Copy Phone'}
                                >
                                  {copiedKey === `t-phone-${t.id}` ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                                </button>
                              </div>
                            ) : (
                              <span style={{ color: '#94a3b8' }}>—</span>
                            )}
                          </td>
                          <td>{getStatusBadge(t.verificationStatus)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Touch Cards View */}
                <div className={styles.mobileCardsGrid}>
                  {filteredTeachers.map((t) => (
                    <div key={t.id} className={styles.memberCard}>
                      <div className={styles.cardHeader}>
                        <div className={styles.cardHeaderMain}>
                          <div className={styles.copyField}>
                            <span className={styles.copyTextName}>{t.fullName}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(t.fullName, `m-t-name-${t.id}`, 'শিক্ষকের নাম', 'Teacher Name')}
                              className={`${styles.copyBtn} ${copiedKey === `m-t-name-${t.id}` ? styles.copyBtnSuccess : ''}`}
                              title={isBn ? 'নাম কপি করুন' : 'Copy Name'}
                            >
                              {copiedKey === `m-t-name-${t.id}` ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                            </button>
                          </div>
                          <div className={styles.copyTextSub}>
                            {t.designation} • {t.department}
                          </div>
                        </div>
                        {getStatusBadge(t.verificationStatus)}
                      </div>

                      <div className={styles.cardFieldRow}>
                        <span className={styles.fieldLabel}>{isBn ? 'ইমেইল:' : 'Email:'}</span>
                        <div className={styles.copyField}>
                          <span className={styles.cardEmailText}>{t.email}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(t.email, `m-t-email-${t.id}`, 'ইমেইল', 'Email')}
                            className={`${styles.copyBtn} ${copiedKey === `m-t-email-${t.id}` ? styles.copyBtnSuccess : ''}`}
                            title={isBn ? 'ইমেইল কপি করুন' : 'Copy Email'}
                          >
                            {copiedKey === `m-t-email-${t.id}` ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>

                      {t.phone && (
                        <div className={styles.cardFieldRow}>
                          <span className={styles.fieldLabel}>{isBn ? 'ফোন:' : 'Phone:'}</span>
                          <div className={styles.copyField}>
                            <span className={styles.phoneText}>{t.phone}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(t.phone, `m-t-phone-${t.id}`, 'ফোন নম্বর', 'Phone')}
                              className={`${styles.copyBtn} ${copiedKey === `m-t-phone-${t.id}` ? styles.copyBtnSuccess : ''}`}
                              title={isBn ? 'ফোন কপি করুন' : 'Copy Phone'}
                            >
                              {copiedKey === `m-t-phone-${t.id}` ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )
          ) : (
            /* =================== STUDENTS VIEW =================== */
            filteredStudents.length === 0 ? (
              <div className={styles.centerState}>
                <GraduationCap size={36} color="#94a3b8" />
                <span>
                  {searchTerm
                    ? isBn
                    ? 'সার্চের সাথে কোনো শিক্ষার্থী মেলেনি।'
                    : 'No students match your search.'
                    : isBn
                    ? 'এই প্রতিষ্ঠানে কোনো শিক্ষার্থী যুক্ত নেই।'
                    : 'No affiliated students found for this organization.'}
                </span>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className={styles.tableWrapper}>
                  <table className={styles.membersTable}>
                    <thead>
                      <tr>
                        <th>{isBn ? 'শিক্ষার্থীর নাম' : 'Student Name'}</th>
                        <th>{isBn ? 'শ্রেণি / রোল' : 'Class / Roll'}</th>
                        <th>{isBn ? 'ইমেইল এড্রেস' : 'Email Address'}</th>
                        <th>{isBn ? 'শিক্ষার্থীর ফোন' : 'Student Phone'}</th>
                        <th>{isBn ? 'অভিভাবকের ফোন' : 'Guardian Phone'}</th>
                        <th>{isBn ? 'স্ট্যাটাস' : 'Status'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((s) => (
                        <tr key={s.id}>
                          <td>
                            <div className={styles.copyField}>
                              <span className={styles.copyTextName}>{s.fullName}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(s.fullName, `s-name-${s.id}`, 'শিক্ষার্থীর নাম', 'Student Name')}
                                className={`${styles.copyBtn} ${copiedKey === `s-name-${s.id}` ? styles.copyBtnSuccess : ''}`}
                                title={isBn ? 'নাম কপি করুন' : 'Copy Name'}
                              >
                                {copiedKey === `s-name-${s.id}` ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                              </button>
                            </div>
                            {s.fatherName && (
                              <div className={styles.copyTextSub}>পিতা: {s.fatherName}</div>
                            )}
                          </td>
                          <td>
                            <div className={styles.primaryInfo}>{s.className || 'শিক্ষার্থী'}</div>
                            <div className={styles.copyTextSub}>
                              {s.rollNumber ? `রোল: ${s.rollNumber}` : ''} {s.department ? `(${s.department})` : ''}
                            </div>
                          </td>
                          <td>
                            <div className={styles.copyField}>
                              <span className={styles.copyTextSub}>{s.email}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(s.email, `s-email-${s.id}`, 'ইমেইল', 'Email')}
                                className={`${styles.copyBtn} ${copiedKey === `s-email-${s.id}` ? styles.copyBtnSuccess : ''}`}
                                title={isBn ? 'ইমেইল কপি করুন' : 'Copy Email'}
                              >
                                {copiedKey === `s-email-${s.id}` ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                              </button>
                            </div>
                          </td>
                          <td>
                            {s.phone ? (
                              <div className={styles.copyField}>
                                <span className={styles.phoneText}>{s.phone}</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(s.phone, `s-phone-${s.id}`, 'শিক্ষার্থীর ফোন', 'Student Phone')}
                                  className={`${styles.copyBtn} ${copiedKey === `s-phone-${s.id}` ? styles.copyBtnSuccess : ''}`}
                                  title={isBn ? 'ফোন কপি করুন' : 'Copy Phone'}
                                >
                                  {copiedKey === `s-phone-${s.id}` ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                                </button>
                              </div>
                            ) : (
                              <span style={{ color: '#94a3b8' }}>—</span>
                            )}
                          </td>
                          <td>
                            {s.guardianPhone ? (
                              <div className={styles.copyField}>
                                <span className={styles.guardianPhone}>{s.guardianPhone}</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(s.guardianPhone!, `s-gphone-${s.id}`, 'অভিভাবকের ফোন', 'Guardian Phone')}
                                  className={`${styles.copyBtn} ${copiedKey === `s-gphone-${s.id}` ? styles.copyBtnSuccess : ''}`}
                                  title={isBn ? 'অভিভাবকের ফোন কপি করুন' : 'Copy Guardian Phone'}
                                >
                                  {copiedKey === `s-gphone-${s.id}` ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                                </button>
                              </div>
                            ) : (
                              <span style={{ color: '#94a3b8' }}>—</span>
                            )}
                          </td>
                          <td>{getStatusBadge(s.verificationStatus)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Touch Cards View */}
                <div className={styles.mobileCardsGrid}>
                  {filteredStudents.map((s) => (
                    <div key={s.id} className={styles.memberCard}>
                      <div className={styles.cardHeader}>
                        <div className={styles.cardHeaderMain}>
                          <div className={styles.copyField}>
                            <span className={styles.copyTextName}>{s.fullName}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(s.fullName, `m-s-name-${s.id}`, 'শিক্ষার্থীর নাম', 'Student Name')}
                              className={`${styles.copyBtn} ${copiedKey === `m-s-name-${s.id}` ? styles.copyBtnSuccess : ''}`}
                              title={isBn ? 'নাম কপি করুন' : 'Copy Name'}
                            >
                              {copiedKey === `m-s-name-${s.id}` ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                            </button>
                          </div>
                          <div className={styles.copyTextSub}>
                            {s.className} {s.rollNumber ? `• রোল: ${s.rollNumber}` : ''}
                          </div>
                        </div>
                        {getStatusBadge(s.verificationStatus)}
                      </div>

                      <div className={styles.cardFieldRow}>
                        <span className={styles.fieldLabel}>{isBn ? 'ইমেইল:' : 'Email:'}</span>
                        <div className={styles.copyField}>
                          <span className={styles.cardEmailText}>{s.email}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(s.email, `m-s-email-${s.id}`, 'ইমেইল', 'Email')}
                            className={`${styles.copyBtn} ${copiedKey === `m-s-email-${s.id}` ? styles.copyBtnSuccess : ''}`}
                            title={isBn ? 'ইমেইল কপি করুন' : 'Copy Email'}
                          >
                            {copiedKey === `m-s-email-${s.id}` ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>

                      {s.phone && (
                        <div className={styles.cardFieldRow}>
                          <span className={styles.fieldLabel}>{isBn ? 'শিক্ষার্থীর ফোন:' : 'Student Phone:'}</span>
                          <div className={styles.copyField}>
                            <span className={styles.phoneText}>{s.phone}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(s.phone, `m-s-phone-${s.id}`, 'শিক্ষার্থীর ফোন', 'Student Phone')}
                              className={`${styles.copyBtn} ${copiedKey === `m-s-phone-${s.id}` ? styles.copyBtnSuccess : ''}`}
                              title={isBn ? 'ফোন কপি করুন' : 'Copy Phone'}
                            >
                              {copiedKey === `m-s-phone-${s.id}` ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                            </button>
                          </div>
                        </div>
                      )}

                      {s.guardianPhone && (
                        <div className={styles.cardFieldRow}>
                          <span className={styles.fieldLabel}>{isBn ? 'অভিভাবকের ফোন:' : 'Guardian Phone:'}</span>
                          <div className={styles.copyField}>
                            <span className={styles.guardianPhone}>{s.guardianPhone}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(s.guardianPhone!, `m-s-gphone-${s.id}`, 'অভিভাবকের ফোন', 'Guardian Phone')}
                              className={`${styles.copyBtn} ${copiedKey === `m-s-gphone-${s.id}` ? styles.copyBtnSuccess : ''}`}
                              title={isBn ? 'অভিভাবকের ফোন কপি করুন' : 'Copy Guardian Phone'}
                            >
                              {copiedKey === `m-s-gphone-${s.id}` ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )
          )}
        </div>

        {/* Floating Copied Toast Alert */}
        {toastMsg && (
          <div className={styles.floatingToast}>
            <Check size={16} color="#10b981" />
            <span>{toastMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
}
