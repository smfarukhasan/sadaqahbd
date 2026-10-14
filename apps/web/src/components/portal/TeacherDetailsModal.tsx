'use client';

import React from 'react';
import {
  UserCheck,
  X,
  Mail,
  Phone,
  Building2,
  Briefcase,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Award,
} from 'lucide-react';

export interface TeacherData {
  id?: string;
  profileId?: string;
  fullName: string;
  email: string;
  phone?: string;
  status?: string;
  department?: string;
  designation?: string;
  employeeId?: string;
  verificationStatus?: string;
  rejectionReason?: string;
  createdAt?: string;
  orgApprovedAt?: string;
  adminApprovedAt?: string;
  institutionName?: string;
}

interface TeacherDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: TeacherData | null;
  isBn?: boolean;
}

export default function TeacherDetailsModal({
  isOpen,
  onClose,
  teacher,
  isBn = true,
}: TeacherDetailsModalProps) {
  if (!isOpen || !teacher) return null;

  const isVerified =
    teacher.verificationStatus === 'verified' ||
    teacher.status === 'active';
  const isPendingOrg = teacher.verificationStatus === 'pending_org';
  const isPendingAdmin = teacher.verificationStatus === 'pending_admin';
  const isRejected = teacher.verificationStatus === 'rejected';

  const getStatusBadge = () => {
    if (isVerified) {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.25rem 0.75rem',
            borderRadius: '9999px',
            fontSize: '0.8rem',
            fontWeight: 800,
            backgroundColor: 'rgba(5, 150, 105, 0.12)',
            color: '#059669',
            border: '1px solid rgba(5, 150, 105, 0.25)',
          }}
        >
          <CheckCircle2 size={14} />
          {isBn ? 'অনুমোদিত ও সক্রিয়' : 'Verified & Active'}
        </span>
      );
    }
    if (isPendingAdmin) {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.25rem 0.75rem',
            borderRadius: '9999px',
            fontSize: '0.8rem',
            fontWeight: 800,
            backgroundColor: 'rgba(217, 119, 6, 0.12)',
            color: '#d97706',
            border: '1px solid rgba(217, 119, 6, 0.25)',
          }}
        >
          <Clock size={14} />
          {isBn ? 'এডমিন চূড়ান্ত অনুমোদনের অপেক্ষায়' : 'Pending Admin Verification'}
        </span>
      );
    }
    if (isPendingOrg) {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.25rem 0.75rem',
            borderRadius: '9999px',
            fontSize: '0.8rem',
            fontWeight: 800,
            backgroundColor: 'rgba(37, 99, 235, 0.12)',
            color: '#2563eb',
            border: '1px solid rgba(37, 99, 235, 0.25)',
          }}
        >
          <Clock size={14} />
          {isBn ? 'প্রতিষ্ঠান অনুমোদনের অপেক্ষায়' : 'Pending Org Approval'}
        </span>
      );
    }
    if (isRejected) {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.25rem 0.75rem',
            borderRadius: '9999px',
            fontSize: '0.8rem',
            fontWeight: 800,
            backgroundColor: 'rgba(220, 38, 38, 0.12)',
            color: '#dc2626',
            border: '1px solid rgba(220, 38, 38, 0.25)',
          }}
        >
          <AlertCircle size={14} />
          {isBn ? 'বাতিলকৃত' : 'Rejected'}
        </span>
      );
    }
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          padding: '0.25rem 0.75rem',
          borderRadius: '9999px',
          fontSize: '0.8rem',
          fontWeight: 800,
          backgroundColor: 'rgba(100, 116, 139, 0.12)',
          color: 'var(--text-muted)',
        }}
      >
        {teacher.verificationStatus || teacher.status || 'Active'}
      </span>
    );
  };

  const initialLetter = (teacher.fullName || 'T').charAt(0).toUpperCase();

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--surface, #ffffff)',
          color: 'var(--text-main, #1e293b)',
          borderRadius: 'var(--radius-xl, 20px)',
          border: '1px solid var(--surface-border, #e2e8f0)',
          maxWidth: '560px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--surface-border, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            backgroundColor: 'var(--surface, #ffffff)',
            zIndex: 1,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <UserCheck size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
                {isBn ? 'শিক্ষক প্রোফাইল বিবরণ' : 'Teacher Profile Details'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {isBn ? 'প্রতিষ্ঠানের অনুমোদিত শিক্ষকের তথ্য' : 'Verified Faculty Member Information'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.4rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Hero Teacher Identity Card */}
          <div
            style={{
              padding: '1.25rem',
              backgroundColor: 'var(--background-alt, #f8fafc)',
              borderRadius: 'var(--radius-lg, 16px)',
              border: '1px solid var(--surface-border, #e2e8f0)',
              display: 'flex',
              alignItems: 'center',
              gap: '1.25rem',
            }}
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.6rem',
                fontWeight: 800,
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
              }}
            >
              {initialLetter}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {teacher.fullName}
                </h4>
                {getStatusBadge()}
              </div>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Briefcase size={14} color="#2563eb" />
                <span>{teacher.designation || (isBn ? 'শিক্ষক' : 'Teacher')}</span>
                <span>•</span>
                <span>{teacher.department || (isBn ? 'সাধারণ বিভাগ' : 'General')}</span>
              </p>
            </div>
          </div>

          {/* Details Section Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
            }}
          >
            {/* Designation */}
            <div
              style={{
                padding: '0.9rem 1rem',
                backgroundColor: 'var(--background, #ffffff)',
                borderRadius: 'var(--radius-md, 12px)',
                border: '1px solid var(--surface-border, #e2e8f0)',
              }}
            >
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                {isBn ? 'পদবী / দায়িত্ব' : 'Designation'}
              </span>
              <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>
                {teacher.designation || '—'}
              </strong>
            </div>

            {/* Department */}
            <div
              style={{
                padding: '0.9rem 1rem',
                backgroundColor: 'var(--background, #ffffff)',
                borderRadius: 'var(--radius-md, 12px)',
                border: '1px solid var(--surface-border, #e2e8f0)',
              }}
            >
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                {isBn ? 'বিভাগ / বিষয়' : 'Department / Subject'}
              </span>
              <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>
                {teacher.department || '—'}
              </strong>
            </div>

            {/* Employee ID */}
            <div
              style={{
                padding: '0.9rem 1rem',
                backgroundColor: 'var(--background, #ffffff)',
                borderRadius: 'var(--radius-md, 12px)',
                border: '1px solid var(--surface-border, #e2e8f0)',
              }}
            >
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                {isBn ? 'শিক্ষক পরিচিতি নম্বর (ID)' : 'Employee / Teacher ID'}
              </span>
              <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>
                {teacher.employeeId || '—'}
              </strong>
            </div>

            {/* Account Status */}
            <div
              style={{
                padding: '0.9rem 1rem',
                backgroundColor: 'var(--background, #ffffff)',
                borderRadius: 'var(--radius-md, 12px)',
                border: '1px solid var(--surface-border, #e2e8f0)',
              }}
            >
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                {isBn ? 'অ্যাকাউন্ট স্ট্যাটাস' : 'Account Status'}
              </span>
              <strong style={{ fontSize: '0.95rem', color: teacher.status === 'active' ? '#059669' : 'var(--text-main)' }}>
                {teacher.status === 'active' ? (isBn ? 'সক্রিয় (Active)' : 'Active') : teacher.status || '—'}
              </strong>
            </div>
          </div>

          {/* Contact Information Box */}
          <div
            style={{
              padding: '1.1rem 1.25rem',
              backgroundColor: 'var(--background-alt, #f8fafc)',
              borderRadius: 'var(--radius-lg, 14px)',
              border: '1px solid var(--surface-border, #e2e8f0)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            <h5 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {isBn ? 'যোগাযোগের তথ্য' : 'Contact Information'}
            </h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.9rem' }}>
                <Mail size={16} color="#64748b" />
                <span style={{ color: 'var(--text-muted)' }}>{isBn ? 'ইমেইল:' : 'Email:'}</span>
                <strong style={{ color: 'var(--text-main)' }}>{teacher.email || '—'}</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.9rem' }}>
                <Phone size={16} color="#64748b" />
                <span style={{ color: 'var(--text-muted)' }}>{isBn ? 'ফোন / মোবাইল:' : 'Phone:'}</span>
                <strong style={{ color: 'var(--text-main)' }}>{teacher.phone || (isBn ? 'প্রদান করা হয়নি' : 'Not provided')}</strong>
              </div>
            </div>
          </div>

          {/* Joining / Verification Dates */}
          {(teacher.createdAt || teacher.orgApprovedAt || teacher.adminApprovedAt) && (
            <div
              style={{
                padding: '0.9rem 1.25rem',
                backgroundColor: 'rgba(5, 150, 105, 0.05)',
                borderRadius: 'var(--radius-md, 12px)',
                border: '1px solid rgba(5, 150, 105, 0.15)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
              }}
            >
              <Calendar size={16} color="#059669" />
              <span>
                {isBn ? 'সংযুক্তির তারিখ:' : 'Affiliation Date:'}{' '}
                <strong style={{ color: 'var(--text-main)' }}>
                  {teacher.createdAt ? new Date(teacher.createdAt).toLocaleDateString(isBn ? 'bn-BD' : 'en-US') : '—'}
                </strong>
              </span>
            </div>
          )}

          {/* Rejection notice if any */}
          {teacher.rejectionReason && (
            <div
              style={{
                padding: '0.9rem 1.25rem',
                backgroundColor: 'rgba(220, 38, 38, 0.08)',
                borderRadius: 'var(--radius-md, 12px)',
                border: '1px solid rgba(220, 38, 38, 0.2)',
                color: '#dc2626',
                fontSize: '0.85rem',
              }}
            >
              <strong>{isBn ? 'বাতিলের কারণ:' : 'Rejection Reason:'}</strong> {teacher.rejectionReason}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--surface-border, #e2e8f0)',
            display: 'flex',
            justifyContent: 'flex-end',
            backgroundColor: 'var(--surface, #ffffff)',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="btn btn-outline"
            style={{
              padding: '0.55rem 1.5rem',
              fontSize: '0.88rem',
              fontWeight: 700,
              borderRadius: '10px',
              cursor: 'pointer',
            }}
          >
            {isBn ? 'বন্ধ করুন' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
