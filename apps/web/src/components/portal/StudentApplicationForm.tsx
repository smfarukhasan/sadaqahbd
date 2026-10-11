'use client';

import React, { useState, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  ArrowLeft,
  Calendar,
  Building2,
  FileText,
  DollarSign,
  Plus,
  Trash2,
  Send,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useAuthStore } from '../../lib/auth-store';
import { auth } from '../../lib/firebase';
import { getApiUrl } from '../../lib/api-config';
import { getAuthToken } from '../../lib/auth-token';
import styles from './StudentApplicationForm.module.css';

interface ExpenseItem {
  id: string;
  categoryName: string;
  amount: string;
}

interface StudentApplicationFormProps {
  affiliationData: {
    hasApplied?: boolean;
    status?: string;
    profile?: any;
    organization?: any;
  } | null;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function StudentApplicationForm({
  affiliationData,
  onCancel,
  onSuccess,
}: StudentApplicationFormProps) {
  const locale = useLocale();
  const t = useTranslations('StudentPost');
  const user = useAuthStore((s) => s.user);

  // Post details
  const [title, setTitle] = useState('');
  const [problemDescription, setProblemDescription] = useState('');

  // Date Range selection
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Expense table rows
  const [expenses, setExpenses] = useState<ExpenseItem[]>([
    {
      id: '1',
      categoryName: locale === 'bn' ? 'সেমিস্টার / টিউশন ফি' : 'Semester / Tuition Fee',
      amount: '',
    },
    {
      id: '2',
      categoryName: locale === 'bn' ? 'বইপত্র ও শিক্ষাউপকরণ' : 'Books & Stationery',
      amount: '',
    },
  ]);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-calculate Duration formatted as: dd/mmm/yyyy to dd/mmm/yyyy = ['total' Month ('total' Days)]
  const durationSummary = useMemo(() => {
    if (!startDate || !endDate) return '';
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
      return '';
    }

    const diffMs = end.getTime() - start.getTime();
    const totalDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1);
    const totalMonths = Math.max(1, Math.round(totalDays / 30));

    const monthNamesEn = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    const monthNamesBn = [
      'জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
      'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে',
    ];

    const toBnDigits = (n: number | string) => {
      return n.toString().replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[parseInt(d, 10)]);
    };

    if (locale === 'bn') {
      const sDay = toBnDigits(start.getDate().toString().padStart(2, '0'));
      const sMonth = monthNamesBn[start.getMonth()];
      const sYear = toBnDigits(start.getFullYear());

      const eDay = toBnDigits(end.getDate().toString().padStart(2, '0'));
      const eMonth = monthNamesBn[end.getMonth()];
      const eYear = toBnDigits(end.getFullYear());

      const mText = `${toBnDigits(totalMonths)} মাস`;
      const dText = `${toBnDigits(totalDays)} দিন`;

      return `${sDay}/${sMonth}/${sYear} থেকে ${eDay}/${eMonth}/${eYear} = [${mText} (${dText})]`;
    } else {
      const sDay = start.getDate().toString().padStart(2, '0');
      const sMonth = monthNamesEn[start.getMonth()];
      const sYear = start.getFullYear();

      const eDay = end.getDate().toString().padStart(2, '0');
      const eMonth = monthNamesEn[end.getMonth()];
      const eYear = end.getFullYear();

      const mText = `${totalMonths} ${totalMonths > 1 ? 'Months' : 'Month'}`;
      const dText = `${totalDays} ${totalDays > 1 ? 'Days' : 'Day'}`;

      return `${sDay}/${sMonth}/${sYear} to ${eDay}/${eMonth}/${eYear} = [${mText} (${dText})]`;
    }
  }, [startDate, endDate, locale]);

  // Expenses management
  const addExpenseRow = () => {
    setExpenses((prev) => [
      ...prev,
      { id: Date.now().toString(), categoryName: '', amount: '' },
    ]);
  };

  const removeExpenseRow = (id: string) => {
    if (expenses.length <= 1) return;
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const updateExpenseRow = (
    id: string,
    field: 'categoryName' | 'amount',
    value: string
  ) => {
    setExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  };

  const totalRequired = useMemo(() => {
    return expenses.reduce((sum, item) => {
      const val = parseFloat(item.amount);
      return sum + (isNaN(val) ? 0 : val);
    }, 0);
  }, [expenses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!title.trim()) {
      setError(locale === 'bn' ? 'পোস্টের শিরোনাম পূরণ করুন।' : 'Please enter post title.');
      return;
    }

    if (!problemDescription.trim()) {
      setError(
        locale === 'bn'
          ? 'পারিবারিক ও আর্থিক সমস্যার বিবরণ উল্লেখ করুন।'
          : 'Please describe the family & financial hardship.'
      );
      return;
    }

    if (totalRequired <= 0) {
      setError(
        locale === 'bn'
          ? 'অনুদানের মোট টাকার পরিমাণ অবশ্যই ০ এর বেশি হতে হবে।'
          : 'Total required amount must be greater than 0.'
      );
      return;
    }

    const hasEmpty = expenses.some((item) => !item.categoryName.trim() || !item.amount);
    if (hasEmpty) {
      setError(
        locale === 'bn'
          ? 'সকল খরচের খাত এবং টাকার পরিমাণ সঠিকভাবে পূরণ করুন।'
          : 'Please fill in all expense categories and amounts.'
      );
      return;
    }

    setLoading(true);

    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error(
          locale === 'bn'
            ? 'আপনার সেশন মেয়াদোত্তীর্ণ হয়েছে। পুনরায় লগইন করুন।'
            : 'Session expired. Please log in again.'
        );
      }

      const apiUrl = getApiUrl();
      const payload = {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        durationText: durationSummary || undefined,
        title: title.trim(),
        problemDescription: problemDescription.trim(),
        expenses: expenses.map((e) => ({
          categoryName: e.categoryName.trim(),
          amount: parseFloat(e.amount),
        })),
      };

      const res = await fetch(`${apiUrl}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          errData.message ||
            (locale === 'bn'
              ? 'আবেদন জমা দিতে সমস্যা হয়েছে।'
              : 'Failed to submit application.')
        );
      }

      setSuccess(
        t('createSuccessMsg') ||
          (locale === 'bn'
            ? 'আপনার আবেদনটি সফলভাবে জমা হয়েছে! এটি এখন প্রতিষ্ঠান ও শিক্ষকের ভেরিফিকেশনের জন্য অপেক্ষমান।'
            : 'Application submitted successfully!')
      );

      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      setError(err.message || (locale === 'bn' ? 'আবেদন জমা দিতে সমস্যা হয়েছে।' : 'Submission failed.'));
    } finally {
      setLoading(false);
    }
  };

  const orgName =
    affiliationData?.organization?.name ||
    affiliationData?.profile?.institutionName ||
    (locale === 'bn' ? 'অনুমোদিত শিক্ষা প্রতিষ্ঠান' : 'Approved Institution');

  return (
    <div className={styles.container}>
      {/* Header / Back Action */}
      <div className={styles.headerCard}>
        <div className={styles.titleGroup}>
          <h2>{t('createTitle')}</h2>
          <p>
            {locale === 'bn'
              ? 'শিক্ষা সহায়তা প্রাপ্তির জন্য আপনার সঠিক তথ্য ও খরচের খাতসমূহ সাবমিট করুন।'
              : 'Submit your accurate verification details and itemized monthly expenses.'}
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className={styles.backBtn}
        >
          <ArrowLeft size={16} />
          <span>{t('backToApplications')}</span>
        </button>
      </div>

      {error && (
        <div className={styles.errorAlert}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className={styles.successAlert}>
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.formCard}>
        {/* SECTION 1: Problem Description */}
        <div className={styles.sectionBlock}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIcon}>
              <FileText size={18} />
            </div>
            <h3 className={styles.sectionTitle}>
              {locale === 'bn' ? '১. আবেদনের বিবরণ ও কারণ' : '1. Application Details & Hardship Reason'}
            </h3>
          </div>

          <div className={styles.institutionBadge} style={{ marginBottom: '1.25rem' }}>
            <Building2 size={16} />
            <span>
              {t('institutionLabel')}: <strong>{orgName}</strong>
            </span>
          </div>

          {/* Post Title */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              {t('titleLabel')} <span className={styles.requiredStar}>*</span>
            </label>
            <input
              type="text"
              required
              className={styles.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                locale === 'bn'
                  ? 'যেমন: ৪র্থ সেমিস্টার ডিপ্লোমা ইঞ্জিনিয়ারিং টিউশন ফি ও মেস চার্জ'
                  : 'e.g. 4th Semester Tuition & Boarding Support'
              }
            />
          </div>

          {/* Problem Description */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              {t('problemLabel')} <span className={styles.requiredStar}>*</span>
            </label>
            <textarea
              required
              rows={4}
              className={styles.textarea}
              value={problemDescription}
              onChange={(e) => setProblemDescription(e.target.value)}
              placeholder={
                locale === 'bn'
                  ? 'আপনার পরিবারের আর্থিক অবস্থা এবং কেন এই শিক্ষা সহায়তা প্রয়োজন তা বিস্তারিত লিখুন...'
                  : 'Describe your family background and why this educational financial aid is needed...'
              }
            />
          </div>
        </div>

        {/* SECTION 3: Monthly Expenses Breakdown & Date Selection */}
        <div className={styles.sectionBlock}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIcon}>
              <DollarSign size={18} />
            </div>
            <h3 className={styles.sectionTitle}>{t('expensesTitle')}</h3>
          </div>

          {/* Date Selection Box */}
          <div className={styles.dateRangeWrapper}>
            <label className={styles.label} style={{ marginBottom: '0.65rem' }}>
              <Calendar size={16} />
              <span>{t('dateRangeLabel')}</span>
            </label>

            <div className={styles.grid2}>
              <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {t('startDate')}
                </span>
                <input
                  type="date"
                  className={styles.dateInput}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  onClick={(e) => {
                    try {
                      e.currentTarget.showPicker();
                    } catch {}
                  }}
                />
              </div>

              <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {t('endDate')}
                </span>
                <input
                  type="date"
                  className={styles.dateInput}
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(e) => setEndDate(e.target.value)}
                  onClick={(e) => {
                    try {
                      e.currentTarget.showPicker();
                    } catch {}
                  }}
                />
              </div>
            </div>

            {/* Calculated live duration summary */}
            {durationSummary && (
              <div className={styles.durationBadge}>
                <span>{durationSummary}</span>
              </div>
            )}
          </div>

          {/* Expenses Table */}
          <div className={styles.expenseTableWrapper}>
            <table className={styles.expenseTable}>
              <thead>
                <tr>
                  <th style={{ width: '55%' }}>{t('tableDescription')}</th>
                  <th style={{ width: '35%' }}>{t('tableAmount')}</th>
                  <th style={{ width: '10%', textAlign: 'center' }}>
                    {t('tableAction')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((item, idx) => (
                  <tr key={item.id}>
                    <td>
                      <input
                        type="text"
                        required
                        className={styles.tableInput}
                        placeholder={
                          locale === 'bn'
                            ? `খাত #${idx + 1} (যেমন: টিউশন ফি, হোস্টেল চার্জ)`
                            : `Item #${idx + 1} (e.g. Tuition, Hostel)`
                        }
                        value={item.categoryName}
                        onChange={(e) =>
                          updateExpenseRow(item.id, 'categoryName', e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <div className={styles.amountColWrapper}>
                        <span className={styles.currencySign}>৳</span>
                        <input
                          type="number"
                          required
                          min="1"
                          className={styles.tableInput}
                          placeholder={locale === 'bn' ? 'পরিমাণ' : 'Amount'}
                          value={item.amount}
                          onChange={(e) =>
                            updateExpenseRow(item.id, 'amount', e.target.value)
                          }
                        />
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {expenses.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeExpenseRow(item.id)}
                          className={styles.removeBtn}
                          title={locale === 'bn' ? 'মুছে ফেলুন' : 'Remove'}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className={styles.tableFooter}>
                  <td>{t('totalRequired')}</td>
                  <td colSpan={2}>
                    <span className={styles.totalAmountText}>
                      ৳ {totalRequired.toLocaleString(locale === 'bn' ? 'bn-BD' : 'en-US')}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Add expense details button */}
          <button
            type="button"
            onClick={addExpenseRow}
            className={styles.addExpenseBtn}
          >
            <Plus size={16} />
            <span>{t('addExpenseDetails')}</span>
          </button>
        </div>

        {/* SUBMIT BUTTON */}
        <div className={styles.submitSection}>
          <button
            type="button"
            onClick={onCancel}
            className={styles.backBtn}
            style={{ padding: '0.72rem 1.25rem' }}
          >
            {locale === 'bn' ? 'বাতিল' : 'Cancel'}
          </button>

          <button
            type="submit"
            disabled={loading}
            className={styles.submitBtn}
          >
            {loading ? (
              <span>{t('submitting')}</span>
            ) : (
              <>
                <Send size={18} />
                <span>{t('submitForVerification')}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
