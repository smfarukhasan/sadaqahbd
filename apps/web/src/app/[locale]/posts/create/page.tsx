'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '../../../../i18n/routing';
import styles from './page.module.css';
import {
  Plus,
  Trash2,
  Send,
  Calculator,
  AlertCircle,
  CheckCircle,
  GraduationCap,
} from 'lucide-react';
import { useAuthStore } from '../../../../lib/auth-store';
import { auth } from '../../../../lib/firebase';
import { getApiUrl } from '../../../../lib/api-config';

interface ExpenseItem {
  id: string;
  categoryName: string;
  amount: string;
}

export default function CreatePostPage() {
  const t = useTranslations('StudentPost');
  const commonT = useTranslations('Common');
  const router = useRouter();

  const user = useAuthStore((s) => s.user);
  const loadingAuth = useAuthStore((s) => s.loading);

  const [title, setTitle] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [expenses, setExpenses] = useState<ExpenseItem[]>([
    { id: '1', categoryName: 'সেমিস্টার / টিউশন ফি', amount: '' },
    { id: '2', categoryName: 'বইপত্র ও স্টেশনারি', amount: '' },
  ]);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const addExpenseRow = () => {
    setExpenses([
      ...expenses,
      { id: Date.now().toString(), categoryName: '', amount: '' },
    ]);
  };

  const removeExpenseRow = (id: string) => {
    if (expenses.length <= 1) return;
    setExpenses(expenses.filter((e) => e.id !== id));
  };

  const updateExpenseRow = (
    id: string,
    field: 'categoryName' | 'amount',
    val: string
  ) => {
    setExpenses(
      expenses.map((e) => (e.id === id ? { ...e, [field]: val } : e))
    );
  };

  const totalRequired = expenses.reduce((sum, item) => {
    const val = parseFloat(item.amount);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (totalRequired <= 0) {
      setError('অনুদানের টাকার পরিমাণ অবশ্যই ০ এর বেশি হতে হবে।');
      return;
    }

    const hasEmptyFields = expenses.some(
      (item) => !item.categoryName || !item.amount
    );
    if (hasEmptyFields) {
      setError('সকল খরচের খাত এবং টাকার পরিমাণ সঠিকভাবে পূরণ করুন।');
      return;
    }

    setLoading(true);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error('আপনার সেশন মেয়াদোত্তীর্ণ হয়েছে। পুনরায় লগইন করুন।');
      }

      const apiUrl = getApiUrl();

      const res = await fetch(`${apiUrl}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          problemDescription,
          expenses: expenses.map((e) => ({
            categoryName: e.categoryName,
            amount: parseFloat(e.amount),
          })),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'পোস্ট জমা দিতে সমস্যা হয়েছে');
      }

      setLoading(false);
      setSuccess(
        'আপনার আবেদনটি সফলভাবে জমা হয়েছে! এটি এখন প্রতিষ্ঠান ও শিক্ষকের ভেরিফিকেশনের জন্য অপেক্ষমান।'
      );
      setTimeout(() => router.push('/portal'), 1600);
    } catch (err: any) {
      setError(err.message || 'পোস্ট জমা দিতে সমস্যা হয়েছে');
      setLoading(false);
    }
  };

  // Role Protection Check: Must be logged in as a student
  if (!loadingAuth && !user) {
    return (
      <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <div
          style={{
            maxWidth: '480px',
            margin: '0 auto',
            padding: '2.5rem 2rem',
            backgroundColor: 'var(--surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--surface-border)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <GraduationCap
            size={44}
            color="var(--primary)"
            style={{ marginBottom: '1rem' }}
          />
          <h2
            style={{
              fontSize: '1.4rem',
              fontWeight: '800',
              marginBottom: '0.5rem',
              color: 'var(--text-main)',
            }}
          >
            শিক্ষার্থী লগইন আবশ্যক
          </h2>
          <p
            style={{
              color: 'var(--text-muted)',
              marginBottom: '1.5rem',
              fontSize: '0.9rem',
              lineHeight: '1.5',
            }}
          >
            আর্থিক সহায়তার আবেদন তৈরি করার জন্য অনুগ্রহ করে আপনার শিক্ষার্থী অ্যাকাউন্ট দিয়ে লগইন করুন।
          </p>
          <Link
            href="/login"
            className={styles.submitBtn}
            style={{ textDecoration: 'none', display: 'inline-flex' }}
          >
            লগইন পেজে যান
          </Link>
        </div>
      </div>
    );
  }

  if (!loadingAuth && user && user.role !== 'student') {
    const roleTitle =
      user.role === 'donor'
        ? 'দাতা (Donor)'
        : user.role === 'teacher'
        ? 'শিক্ষক (Teacher)'
        : user.role === 'organization'
        ? 'শিক্ষা প্রতিষ্ঠান (Organization)'
        : 'এডমিন (Admin)';

    return (
      <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <div
          style={{
            maxWidth: '520px',
            margin: '0 auto',
            padding: '2.5rem 2rem',
            backgroundColor: 'var(--surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--surface-border)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <AlertCircle
            size={44}
            color="var(--accent)"
            style={{ marginBottom: '1rem' }}
          />
          <h2
            style={{
              fontSize: '1.35rem',
              fontWeight: '800',
              marginBottom: '0.5rem',
              color: 'var(--text-main)',
            }}
          >
            শিক্ষার্থী অ্যাকাউন্ট প্রয়োজন
          </h2>
          <p
            style={{
              color: 'var(--text-muted)',
              marginBottom: '1.5rem',
              fontSize: '0.9rem',
              lineHeight: '1.5',
            }}
          >
            আপনি বর্তমানে <strong>{user.fullName}</strong> হিসেবে {roleTitle} অ্যাকাউন্টে লগইন আছেন। শুধুমাত্র শিক্ষার্থীদের অ্যাকাউন্টের মাধ্যমে আর্থিক সহায়তার আবেদন পোস্ট করা যায়।
          </p>
          <Link
            href="/portal"
            className={styles.submitBtn}
            style={{ textDecoration: 'none', display: 'inline-flex' }}
          >
            আমার ড্যাশবোর্ডে যান
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <h1>{t('createTitle')}</h1>
          <p>
            আপনার প্রকৃত শিক্ষাগত ও জীবনযাত্রার খরচের বিবরণ প্রদান করুন। তথ্য
            সঠিক হলে আপনার প্রতিষ্ঠান ও শিক্ষক দ্রুত ভেরিফাই করতে পারবেন।
          </p>
        </div>

        {error && (
          <div className={styles.errorBox}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className={styles.successBox}>
            <CheckCircle size={18} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label>{t('titleLabel')}</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="যেমন: ৩য় সেমিস্টার ডিপ্লোমা ইঞ্জিনিয়ারিং টিউশন ফি ও মেস চার্জ"
            />
          </div>

          <div className={styles.field}>
            <label>{t('problemLabel')}</label>
            <textarea
              required
              rows={4}
              value={problemDescription}
              onChange={(e) => setProblemDescription(e.target.value)}
              placeholder="আপনার আর্থিক সমস্যা এবং কেন এই অনুদান প্রয়োজন তা বিস্তারিত উল্লেখ করুন..."
            />
          </div>

          <div className={styles.expenseSection}>
            <div className={styles.expenseHeader}>
              <div className={styles.calcIcon}>
                <Calculator size={18} />
                <span>{t('expensesTitle')}</span>
              </div>
              <button
                type="button"
                onClick={addExpenseRow}
                className={styles.addBtn}
              >
                <Plus size={16} /> {t('addExpenseRow')}
              </button>
            </div>

            <div className={styles.expenseList}>
              {expenses.map((item, idx) => (
                <div key={item.id} className={styles.expenseRow}>
                  <div className={styles.rowInputs}>
                    <input
                      type="text"
                      required
                      placeholder={`খাত #${idx + 1} (যেমন: টিউশন ফি, হোস্টেল চার্জ)`}
                      value={item.categoryName}
                      onChange={(e) =>
                        updateExpenseRow(item.id, 'categoryName', e.target.value)
                      }
                    />
                    <div className={styles.amountInputWrapper}>
                      <span>৳</span>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="পরিমাণ"
                        value={item.amount}
                        onChange={(e) =>
                          updateExpenseRow(item.id, 'amount', e.target.value)
                        }
                      />
                    </div>
                  </div>
                  {expenses.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeExpenseRow(item.id)}
                      className={styles.removeBtn}
                      title="মুছে ফেলুন"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className={styles.totalRow}>
              <span>{t('totalRequired')}:</span>
              <strong>৳ {totalRequired.toLocaleString('bn-BD')}</strong>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={styles.submitBtn}
          >
            <Send size={18} />
            <span>
              {loading ? commonT('loading') : t('submitForVerification')}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
