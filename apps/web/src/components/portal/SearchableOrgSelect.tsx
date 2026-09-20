'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useLocale } from 'next-intl';
import { Search, ChevronDown, Plus, Check, Building2 } from 'lucide-react';
import { getApiUrl } from '../../lib/api-config';
import styles from './SearchableOrgSelect.module.css';

export interface OrgOption {
  id: string;
  name: string;
  address: string;
  phone?: string;
  type?: string;
}

interface SearchableOrgSelectProps {
  selectedOrgId: string;
  onChange: (orgId: string, orgName?: string) => void;
  onRequestNewOrg: () => void;
  disabled?: boolean;
}

export default function SearchableOrgSelect({
  selectedOrgId,
  onChange,
  onRequestNewOrg,
  disabled = false,
}: SearchableOrgSelectProps) {
  const locale = useLocale();
  const isBn = locale === 'bn';

  const [organizations, setOrganizations] = useState<OrgOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        setLoading(true);
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/organizations/active`);
        if (res.ok) {
          const data = await res.json();
          setOrganizations(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Failed to load organizations', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrgs();
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const selectedOrg = organizations.find((o) => o.id === selectedOrgId);

  const filteredOrgs = organizations.filter(
    (o) =>
      o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (org: OrgOption) => {
    onChange(org.id, org.name);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.selectContainer} ref={containerRef}>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className={`${styles.triggerBtn} ${isOpen ? styles.triggerBtnActive : ''}`}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          {selectedOrg ? (
            <div className={styles.selectedOrgInfo}>
              <span className={styles.selectedOrgName}>{selectedOrg.name}</span>
              <span className={styles.selectedOrgAddress}>{selectedOrg.address}</span>
            </div>
          ) : (
            <span className={styles.placeholder}>
              {isBn ? 'প্রতিষ্ঠান নির্বাচন করুন...' : 'Select organization...'}
            </span>
          )}
          <ChevronDown size={16} color="#64748b" />
        </button>

        {isOpen && (
          <div className={styles.dropdownPanel}>
            <div className={styles.searchBox}>
              <Search size={16} color="#94a3b8" />
              <input
                ref={searchInputRef}
                type="text"
                className={styles.searchInput}
                placeholder={isBn ? 'নাম বা ঠিকানা লিখে খুঁজুন...' : 'Search by name or address...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className={styles.optionsList}>
              {loading ? (
                <div className={styles.emptyMsg}>
                  {isBn ? 'প্রতিষ্ঠান লোড হচ্ছে...' : 'Loading organizations...'}
                </div>
              ) : filteredOrgs.length > 0 ? (
                filteredOrgs.map((org) => {
                  const isSelected = org.id === selectedOrgId;
                  return (
                    <button
                      key={org.id}
                      type="button"
                      onClick={() => handleSelect(org)}
                      className={`${styles.optionItem} ${isSelected ? styles.optionSelected : ''}`}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                        <span className={styles.orgItemName}>{org.name}</span>
                        <span className={styles.orgItemAddr}>{org.address}</span>
                      </div>
                      {isSelected && <Check size={16} color="#059669" />}
                    </button>
                  );
                })
              ) : (
                <div className={styles.emptyMsg}>
                  <p>{isBn ? 'কোনো প্রতিষ্ঠান পাওয়া যায়নি।' : 'No organization found.'}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onRequestNewOrg();
                    }}
                    className={styles.suggestLink}
                  >
                    {isBn ? '+ নতুন প্রতিষ্ঠান প্রস্তাব করুন' : '+ Suggest new organization'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* "+" button to request adding an unlisted organization */}
      <button
        type="button"
        disabled={disabled}
        onClick={onRequestNewOrg}
        className={styles.addOrgBtn}
        title={isBn ? 'তালিকায় না থাকলে নতুন প্রতিষ্ঠানের তথ্য জমা দিন' : 'Suggest new organization'}
        aria-label="Suggest new organization"
      >
        <Plus size={20} />
      </button>
    </div>
  );
}
