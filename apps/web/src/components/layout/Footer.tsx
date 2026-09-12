'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '../../i18n/routing';
import styles from './Footer.module.css';
import {
  HeartHandshake,
  ShieldCheck,
  CheckCircle2,
  Heart,
  Mail,
  Phone,
  FileCheck,
} from 'lucide-react';

export default function Footer() {
  const t = useTranslations('Common');
  const navT = useTranslations('Nav');

  return (
    <footer className={`${styles.footer} desktop-only`}>
      <div className={`container ${styles.footerContainer}`}>
        <div className={styles.grid}>
          {/* Column 1: Brand & Mission */}
          <div className={styles.colBrand}>
            <Link href="/" className={styles.brand}>
              <div className={styles.brandIconWrapper}>
                <HeartHandshake size={24} />
              </div>
              <span className={styles.brandTitle}>{t('siteName')}</span>
            </Link>
            <p className={styles.brandDesc}>
              {t('siteTagline')}। শিক্ষক ও শিক্ষা প্রতিষ্ঠান কর্তৃক সরাসরি
              যাচাইকৃত এবং ১০০% উন্মুক্ত লেজারে পরিচালিত।
            </p>

            <div className={styles.trustPill}>
              <ShieldCheck size={16} className={styles.trustIcon} />
              <span>দ্বৈত ভেরিফিকেশন ও জিরো হিডেন চার্জ</span>
            </div>
          </div>

          {/* Column 2: Quick Navigation */}
          <div className={styles.col}>
            <h4 className={styles.colTitle}>প্রয়োজনীয় লিংক</h4>
            <ul className={styles.linkList}>
              <li>
                <Link href="/" className={styles.link}>
                  {navT('home')}
                </Link>
              </li>
              <li>
                <Link href="/posts" className={styles.link}>
                  {navT('posts')}
                </Link>
              </li>
              <li>
                <Link href="/ledger" className={styles.link}>
                  {navT('ledger')}
                </Link>
              </li>
              <li>
                <Link href="/donate" className={styles.link}>
                  {t('donateNow')}
                </Link>
              </li>
              <li>
                <Link href="/complaint" className={styles.link}>
                  {navT('complaint')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Portals & Roles */}
          <div className={styles.col}>
            <h4 className={styles.colTitle}>অ্যাকাউন্ট ও পোর্টাল</h4>
            <ul className={styles.linkList}>
              <li>
                <Link href="/login" className={styles.link}>
                  ডোনার একাউন্ট
                </Link>
              </li>
              <li>
                <Link href="/login" className={styles.link}>
                  শিক্ষার্থী আবেদন পোর্টাল
                </Link>
              </li>
              <li>
                <Link href="/login" className={styles.link}>
                  শিক্ষক ও প্রতিষ্ঠান লগইন
                </Link>
              </li>
              <li>
                <Link href="/login" className={styles.link}>
                  এডমিন ও সুপার এডমিন
                </Link>
              </li>
              <li>
                <Link href="/portal" className={styles.link}>
                  {navT('portal')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Transparency & Guarantee */}
          <div className={styles.col}>
            <h4 className={styles.colTitle}>স্বচ্ছতার নিশ্চয়তা</h4>
            <div className={styles.guaranteeBox}>
              <div className={styles.guaranteeItem}>
                <CheckCircle2 size={16} className={styles.checkIcon} />
                <span>প্রতিটি টাকার হিসাব ডিজিটাল লেজারে দৃশ্যমান</span>
              </div>
              <div className={styles.guaranteeItem}>
                <CheckCircle2 size={16} className={styles.checkIcon} />
                <span>সরাসরি শিক্ষার্থীর অ্যাকাউন্টে অর্থ পৌঁছায়</span>
              </div>
              <div className={styles.guaranteeItem}>
                <CheckCircle2 size={16} className={styles.checkIcon} />
                <span>প্রতিষ্ঠান ও শিক্ষক কর্তৃক ডাবল ভেরিফিকেশন</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={styles.bottomBar}>
          <p className={styles.copyright}>
            © ২০২৬ {t('siteName')} (Sadaqahbd) • সার্বিক সহযোগিতায় শিক্ষানুরাগী
            সমাজ
          </p>
          <div className={styles.bottomLinks}>
            <span>১০০% নিরাপদ ও সুরক্ষিত</span>
            <span>•</span>
            <span>ওপেন সোর্স অডিট সমর্থিত</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
