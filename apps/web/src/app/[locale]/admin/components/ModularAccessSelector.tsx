'use client';

import React from 'react';
import {
  ShieldCheck,
  Building2,
  GraduationCap,
  DollarSign,
  Check,
  X,
} from 'lucide-react';
import { PermissionModuleKey } from '@sadaqahbd/schema';

export interface ModuleDefinition {
  key: string;
  name: string;
  nameEn: string;
  descBn: string;
  descEn: string;
  superAdminOnly: boolean;
  badge?: string;
  badgeEn?: string;
}

export interface ModuleGroup {
  id: string;
  titleBn: string;
  titleEn: string;
  icon: any;
  color: string;
  modules: ModuleDefinition[];
}

export const MODULE_GROUPS: ModuleGroup[] = [
  {
    id: 'admin_governance',
    titleBn: 'প্রশাসনিক ও স্টাফ ব্যবস্থাপনা',
    titleEn: 'Staff & Governance',
    icon: ShieldCheck,
    color: '#7c3aed',
    modules: [
      {
        key: PermissionModuleKey.SUPER_ADMIN_LIST,
        name: 'সুপার এডমিন তদারকি',
        nameEn: 'Super Admin Oversight',
        descBn: 'সুপার এডমিন কর্মকর্তাদের তালিকা নিরীক্ষা ও স্টাফ তদারকি',
        descEn: 'View super admins and oversee administrative permissions',
        superAdminOnly: true,
        badge: 'উচ্চ ক্ষমতা',
        badgeEn: 'Super Admin Only',
      },
      {
        key: PermissionModuleKey.ADMIN_LIST,
        name: 'সাধারণ এডমিন ব্যবস্থাপনা',
        nameEn: 'General Admin Management',
        descBn: 'সাধারণ এডমিনদের তালিকা ও প্রশাসনিক দায়িত্ব পর্যবেক্ষণ',
        descEn: 'Manage regular admin staff accounts and duties',
        superAdminOnly: true,
        badge: 'স্টাফ তদারকি',
        badgeEn: 'Staff Control',
      },
    ],
  },
  {
    id: 'institutions_clearances',
    titleBn: 'প্রতিষ্ঠান ও শিক্ষক-শিক্ষার্থী ছাড়পত্র',
    titleEn: 'Institutes & Clearances',
    icon: Building2,
    color: '#0284c7',
    modules: [
      {
        key: PermissionModuleKey.ORG_VERIFICATION_REQUESTS,
        name: 'শিক্ষা প্রতিষ্ঠান অনুমোদন',
        nameEn: 'Institution Approvals',
        descBn: 'মাদরাসা ও শিক্ষা প্রতিষ্ঠানের নিবন্ধন আবেদন যাচাই ও চূড়ান্ত অনুমোদন',
        descEn: 'Verify and grant clearances to new institutional applications',
        superAdminOnly: false,
      },
      {
        key: PermissionModuleKey.ORG_LIST,
        name: 'প্রতিষ্ঠান ডিরেক্টরি',
        nameEn: 'Institution Directory',
        descBn: 'প্ল্যাটফর্মে নিবন্ধিত সকল প্রতিষ্ঠানের বিস্তারিত প্রোফাইল ও অডিট',
        descEn: 'Audit all registered and verified educational institutions',
        superAdminOnly: false,
      },
      {
        key: PermissionModuleKey.TEACHER_VERIFICATION_REQUESTS,
        name: 'শিক্ষক অনুমোদন ছাড়পত্র',
        nameEn: 'Teacher Clearances',
        descBn: 'প্রতিষ্ঠান থেকে প্রেরিত শিক্ষকদের অ্যাফিলিয়েশন আবেদন চূড়ান্ত অনুমোদন',
        descEn: 'Approve teacher affiliations endorsed by institutions',
        superAdminOnly: false,
      },
      {
        key: PermissionModuleKey.STUDENT_VERIFICATION_REQUESTS,
        name: 'শিক্ষার্থী ও স্থানান্তর ছাড়পত্র',
        nameEn: 'Student & Transfer Clearances',
        descBn: 'শিক্ষার্থীদের চূড়ান্ত অনুমোদন এবং এক প্রতিষ্ঠান থেকে অন্য প্রতিষ্ঠানে মাইগ্রেশন',
        descEn: 'Final student verification and institution transfer approvals',
        superAdminOnly: false,
      },
      {
        key: PermissionModuleKey.TEACHER_LIST,
        name: 'শিক্ষক ডিরেক্টরি',
        nameEn: 'Teacher Directory',
        descBn: 'সকল অনুমোদিত শিক্ষকদের প্রোফাইল ও প্রাতিষ্ঠানিক তথ্য',
        descEn: 'View and audit all verified teacher profiles',
        superAdminOnly: false,
      },
      {
        key: PermissionModuleKey.STUDENT_LIST,
        name: 'শিক্ষার্থী ডিরেক্টরি',
        nameEn: 'Student Directory',
        descBn: 'সকল অনুমোদিত শিক্ষার্থীদের শিক্ষা ও আর্থিক তথ্যাদি অডিট',
        descEn: 'View and audit all verified student profiles and history',
        superAdminOnly: false,
      },
      {
        key: PermissionModuleKey.STUDENT_PHONE_EXEMPTIONS,
        name: 'শিক্ষার্থী ফোন ভেরিফিকেশন অব্যাহতি',
        nameEn: 'Student Phone Exemptions',
        descBn: 'ফোন নম্বর না থাকা শিক্ষার্থীদের বিশেষ ব্যবহারের আবেদন যাচাই, অনুমোদন ও মেয়াদ নির্ধারণ',
        descEn: 'Review, approve, and set validity for student phone verification exemption requests',
        superAdminOnly: false,
      },
    ],
  },
  {
    id: 'campaigns_aid',
    titleBn: 'শিক্ষার্থী সাহায্য আবেদন ও ক্যাম্পেইন',
    titleEn: 'Student Aid Campaigns',
    icon: GraduationCap,
    color: '#059669',
    modules: [
      {
        key: PermissionModuleKey.STUDENT_POST_VERIFICATION_REQUESTS,
        name: 'শিক্ষার্থী পোস্ট চূড়ান্ত ছাড়পত্র',
        nameEn: 'Student Campaign Approvals',
        descBn: 'শিক্ষকদের প্রত্যয়ন করা সাহায্য আবেদনের বাজেট যাচাই ও লাইভ পাবলিশ',
        descEn: 'Review expenses and publish endorsed student aid requests',
        superAdminOnly: false,
      },
    ],
  },
  {
    id: 'donations_accounts',
    titleBn: 'অনুদান, পণ্য ও অর্থ ব্যবস্থাপনা',
    titleEn: 'Donations & Accounts',
    icon: DollarSign,
    color: '#d97706',
    modules: [
      {
        key: PermissionModuleKey.ACCOUNTS_DONATION_APPROVAL,
        name: 'অনুদান পেমেন্ট যাচাই ও অনুমোদন',
        nameEn: 'Donation Approvals',
        descBn: 'বিকাশ, নগদ, ব্যাংক ট্রানজেকশন যাচাই ও অনুদান রসিদ অনুমোদন',
        descEn: 'Verify incoming financial donations, TrxIDs, and receipts',
        superAdminOnly: true,
        badge: 'অ্যাকাউন্টস',
        badgeEn: 'Accounts Only',
      },
      {
        key: PermissionModuleKey.ITEM_DONATION_APPROVAL,
        name: 'পণ্য অনুদান অনুমোদন ও ছাড়পত্র',
        nameEn: 'Item Donation Clearances',
        descBn: 'বই, খাদ্য, পোশাক ইত্যাদি পণ্য অনুদান আবেদন যাচাই ও ডেলিভারি ছাড়পত্র',
        descEn: 'Approve physical item donations and logistics dispatch',
        superAdminOnly: false,
      },
      {
        key: PermissionModuleKey.ACCOUNTS_FUND_ALLOCATION,
        name: 'তহবিল বরাদ্দকরণ',
        nameEn: 'Fund Allocation',
        descBn: 'সাধারণ সাদাকাহ ফান্ড থেকে শিক্ষার্থী ক্যাম্পেইনে অর্থ ছাড় ও বণ্টন',
        descEn: 'Allocate general Sadaqah funds to eligible verified campaigns',
        superAdminOnly: true,
        badge: 'আর্থিক ক্ষমতা',
        badgeEn: 'Fund Release',
      },
      {
        key: PermissionModuleKey.DONOR_PROFILE,
        name: 'দাতা প্রোফাইল ও ইতিহাস',
        nameEn: 'Donor Profiles & History',
        descBn: 'সম্মানিত দাতাদের তালিকা, অনুদান ইতিহাস ও ডোনার লেজার',
        descEn: 'View donor profiles, donation ledger, and contribution stats',
        superAdminOnly: false,
      },
      {
        key: PermissionModuleKey.DONATION_AMOUNT,
        name: 'অনুদানের পরিমাণ ও পরিসংখ্যান',
        nameEn: 'Donation Stats & Analytics',
        descBn: 'মোট অনুদান সংগ্রহ, ক্যাশ ব্যালেন্স ও আর্থিক পরিসংখ্যান অডিট',
        descEn: 'Review financial statistics, donation aggregates, and charts',
        superAdminOnly: false,
      },
    ],
  },
  {
    id: 'maintenance_services',
    titleBn: 'মেইন্টেনেন্স ও সার্ভিস ব্যবস্থাপনা',
    titleEn: 'Maintenance & Services',
    icon: ShieldCheck,
    color: '#e11d48',
    modules: [
      {
        key: PermissionModuleKey.MAINTENANCE_APPS_PRIVILEGE,
        name: 'Apps Privilege (অ্যাপস প্রিভিলেজ)',
        nameEn: 'Apps Privilege & Renewals',
        descBn: 'ডোমেইন, হোস্টিং ও সিস্টেম মেইন্টেনেন্স সাবস্ক্রিপশন এবং খুব সোজা পেমেন্ট গেটওয়ে',
        descEn: 'Domain, hosting, maintenance subscription and Khub Soja payment gateway',
        superAdminOnly: true,
        badge: 'উচ্চ ক্ষমতা',
        badgeEn: 'Super Admin Only',
      },
      {
        key: PermissionModuleKey.MAINTENANCE_SMS_PACKAGES,
        name: 'SMS Packages (এসএমএস প্যাকেজ)',
        nameEn: 'SMS Packages & Meter',
        descBn: 'ওটিপি এসএমএস মিটার পর্যবেক্ষণ এবং খুব সোজা থেকে নতুন এসএমএস প্যাকেজ ক্রয়',
        descEn: 'Monitor OTP SMS balance meter and purchase packages via Khub Soja',
        superAdminOnly: true,
        badge: 'উচ্চ ক্ষমতা',
        badgeEn: 'Super Admin Only',
      },
    ],
  },
];

export const ALL_MODULES = MODULE_GROUPS.flatMap((group) => group.modules);

export interface ModularAccessSelectorProps {
  currentRole: 'super_admin' | 'admin';
  selectedKeys: string[];
  onChange: (keys: string[]) => void;
  isBn: boolean;
}

export function ModularAccessSelector({
  currentRole,
  selectedKeys,
  onChange,
  isBn,
}: ModularAccessSelectorProps) {
  const isSuperAdmin = currentRole === 'super_admin';
  const availableModules = ALL_MODULES.filter(
    (mod) => isSuperAdmin || !mod.superAdminOnly
  );
  const totalAvailable = availableModules.length;
  const activeSelected = selectedKeys.filter((k) =>
    availableModules.some((m) => m.key === k)
  ).length;

  const handleSelectAll = () => {
    onChange(availableModules.map((m) => m.key));
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const toggleGroup = (groupKeys: string[]) => {
    const allGroupSelected = groupKeys.every((k) => selectedKeys.includes(k));
    if (allGroupSelected) {
      onChange(selectedKeys.filter((k) => !groupKeys.includes(k)));
    } else {
      const newKeys = Array.from(new Set([...selectedKeys, ...groupKeys]));
      onChange(newKeys);
    }
  };

  const toggleSingle = (key: string) => {
    if (selectedKeys.includes(key)) {
      onChange(selectedKeys.filter((k) => k !== key));
    } else {
      onChange([...selectedKeys, key]);
    }
  };

  return (
    <div style={{ marginTop: '1.25rem' }}>
      {/* Top Header & Bulk Action Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.6rem',
          marginBottom: '0.85rem',
          paddingBottom: '0.65rem',
          borderBottom: '1px solid var(--color-border, #e2e8f0)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
              {isBn ? 'মডিউলার অ্যাক্সেস নির্বাচন করুন' : 'Select Modular Access'}
            </span>
            <span
              style={{
                fontSize: '0.74rem',
                fontWeight: 700,
                padding: '0.15rem 0.55rem',
                borderRadius: '12px',
                backgroundColor: activeSelected > 0 ? 'rgba(5, 150, 105, 0.12)' : 'var(--background-alt, #f1f5f9)',
                color: activeSelected > 0 ? 'var(--color-primary, #059669)' : 'var(--color-text-muted, #64748b)',
                border: `1px solid ${activeSelected > 0 ? 'rgba(5, 150, 105, 0.3)' : 'var(--color-border, #cbd5e1)'}`,
              }}
            >
              {isBn
                ? `${activeSelected} / ${totalAvailable} টি সক্রিয়`
                : `${activeSelected} / ${totalAvailable} Active`}
            </span>
          </div>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--color-text-muted, #64748b)' }}>
            {isBn
              ? 'কর্মকর্তার দায়িত্ব অনুযায়ী প্রযোজ্য মডিউলসমূহের অনুমোদন ও নিয়ন্ত্রণ অধিকার দিন।'
              : 'Grant approval and management access according to official duties.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.45rem' }}>
          <button
            type="button"
            onClick={handleSelectAll}
            style={{
              padding: '0.35rem 0.7rem',
              fontSize: '0.76rem',
              fontWeight: 600,
              borderRadius: '6px',
              border: '1px solid var(--color-primary, #059669)',
              backgroundColor: 'rgba(5, 150, 105, 0.08)',
              color: 'var(--color-primary, #059669)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
            }}
          >
            <Check size={13} />
            <span>{isBn ? 'সবগুলো বাছুন' : 'Select All'}</span>
          </button>

          <button
            type="button"
            onClick={handleClearAll}
            style={{
              padding: '0.35rem 0.7rem',
              fontSize: '0.76rem',
              fontWeight: 600,
              borderRadius: '6px',
              border: '1px solid var(--color-border, #cbd5e1)',
              backgroundColor: 'var(--surface, #ffffff)',
              color: 'var(--color-text-muted, #64748b)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
            }}
          >
            <X size={13} />
            <span>{isBn ? 'সব মুছুন' : 'Clear All'}</span>
          </button>
        </div>
      </div>

      {/* Categorized Groups */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {MODULE_GROUPS.map((group) => {
          const groupAvailableModules = group.modules.filter(
            (mod) => isSuperAdmin || !mod.superAdminOnly
          );
          if (groupAvailableModules.length === 0) return null;

          const groupKeys = groupAvailableModules.map((m) => m.key);
          const groupSelectedCount = groupKeys.filter((k) => selectedKeys.includes(k)).length;
          const isGroupAllSelected = groupSelectedCount === groupKeys.length;
          const GroupIcon = group.icon;

          return (
            <div
              key={group.id}
              style={{
                borderRadius: '10px',
                border: '1px solid var(--color-border, #e2e8f0)',
                backgroundColor: 'var(--background-alt, #fafbfc)',
                padding: '0.75rem',
              }}
            >
              {/* Category Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.6rem',
                  paddingBottom: '0.4rem',
                  borderBottom: '1px dashed var(--color-border, #e2e8f0)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      backgroundColor: `${group.color}15`,
                      color: group.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <GroupIcon size={14} />
                  </div>
                  <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
                    {isBn ? group.titleBn : group.titleEn}
                  </span>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: groupSelectedCount > 0 ? group.color : 'var(--color-text-muted, #94a3b8)',
                      backgroundColor: groupSelectedCount > 0 ? `${group.color}12` : 'transparent',
                      padding: '0.1rem 0.4rem',
                      borderRadius: '8px',
                    }}
                  >
                    ({groupSelectedCount}/{groupKeys.length})
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => toggleGroup(groupKeys)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '0.2rem 0.4rem',
                    fontSize: '0.73rem',
                    fontWeight: 600,
                    color: group.color,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  {isGroupAllSelected
                    ? (isBn ? 'সব বাদ দিন' : 'Deselect')
                    : (isBn ? 'বিভাগ নির্বাচন' : 'Select Group')}
                </button>
              </div>

              {/* Module Cards in Group */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {groupAvailableModules.map((mod) => {
                  const isChecked = selectedKeys.includes(mod.key);
                  return (
                    <label
                      key={mod.key}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.65rem',
                        padding: '0.6rem 0.75rem',
                        borderRadius: '8px',
                        border: `1.5px solid ${isChecked ? 'var(--color-primary, #059669)' : 'var(--surface-border, #cbd5e1)'}`,
                        backgroundColor: isChecked ? 'rgba(5, 150, 105, 0.08)' : 'var(--surface, #ffffff)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease-in-out',
                        boxShadow: isChecked ? '0 1px 3px rgba(5, 150, 105, 0.12)' : 'none',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSingle(mod.key)}
                        style={{
                          accentColor: 'var(--color-primary, #059669)',
                          width: '16px',
                          height: '16px',
                          marginTop: '2px',
                          cursor: 'pointer',
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              fontSize: '0.85rem',
                              fontWeight: isChecked ? 700 : 600,
                              color: isChecked ? 'var(--color-primary-dark, #065f46)' : 'var(--text-main, #0f172a)',
                            }}
                          >
                            {isBn ? mod.name : mod.nameEn}
                          </span>
                          {mod.badge && (
                            <span
                              style={{
                                fontSize: '0.67rem',
                                fontWeight: 700,
                                padding: '0.12rem 0.45rem',
                                borderRadius: '10px',
                                backgroundColor: mod.superAdminOnly ? 'rgba(124, 58, 237, 0.12)' : 'rgba(217, 119, 6, 0.12)',
                                color: mod.superAdminOnly ? '#7c3aed' : '#b45309',
                                border: `1px solid ${mod.superAdminOnly ? 'rgba(124, 58, 237, 0.25)' : 'rgba(217, 119, 6, 0.25)'}`,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {isBn ? mod.badge : (mod.badgeEn || mod.badge)}
                            </span>
                          )}
                        </div>
                        <p
                          style={{
                            margin: '0.2rem 0 0',
                            fontSize: '0.76rem',
                            color: 'var(--color-text-muted, #64748b)',
                            lineHeight: 1.35,
                          }}
                        >
                          {isBn ? mod.descBn : mod.descEn}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ModularAccessSelector;
