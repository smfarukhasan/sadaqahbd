'use client';

import React, { useState } from 'react';
import styles from './page.module.css';
import {
  ShieldAlert,
  Key,
  Users,
  UserPlus,
  Trash2,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { PermissionModuleKey } from '@sadaqahbd/schema';

export default function MasterAdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Super Admin creation form
  const [superAdminName, setSuperAdminName] = useState('');
  const [superAdminEmail, setSuperAdminEmail] = useState('');
  const [superAdminPhone, setSuperAdminPhone] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Sample managed super admins
  const [superAdmins, setSuperAdmins] = useState([
    {
      id: 'sa-1',
      name: 'ফারুক হাসান',
      email: 'faruk@sadaqahbd.com',
      phone: '+8801712345678',
      role: 'super_admin',
      status: 'active',
      createdAt: '2026-09-10',
    },
  ]);

  const handleMasterLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'admin@sadaqahbd.com' && password === '12331233') {
      setIsAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('Invalid Master Admin Credentials. Access Denied.');
    }
  };

  const handleCreateSuperAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!superAdminName || !superAdminEmail || !superAdminPhone) return;

    const newSA = {
      id: `sa-${Date.now()}`,
      name: superAdminName,
      email: superAdminEmail,
      phone: superAdminPhone,
      role: 'super_admin',
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
    };

    setSuperAdmins([newSA, ...superAdmins]);
    setSuccessMsg(
      `সুপার এডমিন তৈরি সম্পন্ন হয়েছে! ডিফল্ট পাসওয়ার্ড: "pass1233"`
    );
    setSuperAdminName('');
    setSuperAdminEmail('');
    setSuperAdminPhone('');
  };

  const handleDeleteSuperAdmin = (id: string) => {
    if (confirm('আপনি কি নিশ্চিতভাবে এই সুপার এডমিনকে মুছে ফেলতে চান?')) {
      setSuperAdmins(superAdmins.filter((s) => s.id !== id));
      setSuccessMsg('সুপার এডমিন একাউন্ট সফলভাবে মুছে ফেলা হয়েছে।');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className={styles.loginWrapper}>
        <div className={styles.loginCard}>
          <div className={styles.lockHeader}>
            <ShieldAlert size={48} className={styles.lockIcon} />
            <h1>মাস্টার এডমিন সুরক্ষিত প্রবেশদ্বার</h1>
            <p>সাদাকাহ বিডি — প্রধান নিয়ন্ত্রক পোর্টাল (/masteradmin)</p>
          </div>

          {loginError && (
            <div className={styles.errorAlert}>
              <AlertTriangle size={18} />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleMasterLogin} className={styles.form}>
            <div className={styles.field}>
              <label>মাস্টার ইমেইল</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@sadaqahbd.com"
              />
            </div>

            <div className={styles.field}>
              <label>মাস্টার সিক্রেট পাসওয়ার্ড</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <button type="submit" className={styles.submitBtn}>
              <Key size={18} />
              <span>মাস্টার কনসোলে প্রবেশ করুন</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.topBanner}>
        <div className={styles.bannerContent}>
          <div className={styles.bannerLeft}>
            <ShieldAlert size={28} />
            <div>
              <h2>মাস্টার এডমিন কন্ট্রোল সেন্টার</h2>
              <span>স্বত্বাধিকারী: admin@sadaqahbd.com (অপরিবর্তনীয় রুট ক্ষমতা)</span>
            </div>
          </div>
          <button
            onClick={() => setIsAuthenticated(false)}
            className={styles.logoutBtn}
          >
            লগআউট
          </button>
        </div>
      </header>

      <main className="container" style={{ padding: '2rem 1rem' }}>
        {successMsg && (
          <div className={styles.successBanner}>
            <CheckCircle size={20} />
            <span>{successMsg}</span>
          </div>
        )}

        <div className={styles.grid}>
          {/* Create Super Admin Section */}
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <UserPlus size={22} />
              <h3>সুপার এডমিন তৈরি করুন</h3>
            </div>
            <p className={styles.cardDesc}>
              সুপার এডমিন তৈরি করলে তারা প্ল্যাটফর্মের কার্যক্রম তদারকি করতে
              পারবে। নতুন অ্যাকাউন্টের জন্য ডিফল্ট পাসওয়ার্ড হবে: <strong>pass1233</strong>
            </p>

            <form onSubmit={handleCreateSuperAdmin} className={styles.createForm}>
              <div className={styles.inputGroup}>
                <label>পূর্ণ নাম</label>
                <input
                  type="text"
                  required
                  value={superAdminName}
                  onChange={(e) => setSuperAdminName(e.target.value)}
                  placeholder="সুপার এডমিনের নাম"
                />
              </div>

              <div className={styles.inputGroup}>
                <label>অফিসিয়াল ইমেইল</label>
                <input
                  type="email"
                  required
                  value={superAdminEmail}
                  onChange={(e) => setSuperAdminEmail(e.target.value)}
                  placeholder="name@sadaqahbd.com"
                />
              </div>

              <div className={styles.inputGroup}>
                <label>ফোন নম্বর</label>
                <input
                  type="tel"
                  required
                  value={superAdminPhone}
                  onChange={(e) => setSuperAdminPhone(e.target.value)}
                  placeholder="+8801XXXXXXXXX"
                />
              </div>

              <button type="submit" className={styles.createBtn}>
                + সুপার এডমিন যুক্ত করুন
              </button>
            </form>
          </section>

          {/* Super Admin List Section */}
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <Users size={22} />
              <h3>বর্তমান সুপার এডমিন তালিকা</h3>
            </div>

            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>নাম</th>
                    <th>ইমেইল ও ফোন</th>
                    <th>স্ট্যাটাস</th>
                    <th>অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody>
                  {superAdmins.map((sa) => (
                    <tr key={sa.id}>
                      <td>
                        <strong>{sa.name}</strong>
                      </td>
                      <td>
                        <div>{sa.email}</div>
                        <small>{sa.phone}</small>
                      </td>
                      <td>
                        <span className={styles.statusActive}>সক্রিয়</span>
                      </td>
                      <td>
                        <button
                          onClick={() => handleDeleteSuperAdmin(sa.id)}
                          className={styles.deleteBtn}
                          title="মুছে ফেলুন"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
