'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '../../../../i18n/routing';
import styles from './page.module.css';
import { Plus, Trash2, Send, Calculator, AlertCircle, CheckCircle } from 'lucide-react';

interface ExpenseItem {
  id: string;
  categoryName: string;
  amount: string;
}

export default function CreatePostPage() {
  const t = useTranslations('StudentPost');
  const commonT = useTranslations('Common');
  const router = useRouter();

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
      // API call to POST /posts
      setTimeout(() => {
        setLoading(false);
        setSuccess(
          'আপনার আবেদনটি সফলভাবে জমা হয়েছে! এটি এখন প্রতিষ্ঠান ও শিক্ষকের ভেরিফিকেশনের জন্য অপেক্ষমান।'
        );
        setTimeout(() => router.push('/posts'), 1500);
      }, 800);
    } catch (err: any) {
      setError(err.message || 'পোস্ট জমা দিতে সমস্যা হয়েছে');
      setLoading(false);
    }
  };

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
          {/* Post Title */}
          <div className={styles.field}>
            <label>{t('titleLabel')}</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="যেমন: ৩য় বর্ষের সেমিস্টার পরীক্ষা ও মেস ভাড়ার জন্য অনুদান"
            />
          </div>

          {/* Problem Description */}
          <div className={styles.field}>
            <label>{t('problemLabel')}</label>
            <textarea
              required
              rows={4}
              value={problemDescription}
              onChange={(e) => setProblemDescription(e.target.value)}
              placeholder="আপনার পারিবারিক আর্থিক অবস্থা এবং কেন এই অনুদান প্রয়োজন তা বিস্তারিত তুলে ধরুন..."
            />
          </div>

          {/* Itemized Expenses Breakdown */}
          <div className={styles.expensesSection}>
            <div className={styles.expensesHeader}>
              <Calculator size={20} className={styles.calcIcon} />
              <h3>{t('expensesTitle')}</h3>
            </div>

            <div className={styles.expenseList}>
              {expenses.map((expense, idx) => (
                <div key={expense.id} className={styles.expenseRow}>
                  <div className={styles.categoryInput}>
                    <input
                      type="text"
                      required
                      placeholder={`খাত #${idx + 1} (যেমন: টিউশন ফি)`}
                      value={expense.categoryName}
                      onChange={(e) =>
                        updateExpenseRow(
                          expense.id,
                          'categoryName',
                          e.target.value
                        )
                      }
                    />
                  </div>
                  <div className={styles.amountInput}>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="টাকা (৳)"
                      value={expense.amount}
                      onChange={(e) =>
                        updateExpenseRow(expense.id, 'amount', e.target.value)
                      }
                    />
                  </div>
                  {expenses.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeExpenseRow(expense.id)}
                      className={styles.removeBtn}
                      title="খাতটি বাদ দিন"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addExpenseRow}
              className={styles.addBtn}
            >
              <Plus size={16} />
              <span>{t('addExpense')}</span>
            </button>

            {/* Total Calculation Display */}
            <div className={styles.totalBar}>
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
              {loading ? commonT('loading') : 'আবেদন জমা দিন'}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
