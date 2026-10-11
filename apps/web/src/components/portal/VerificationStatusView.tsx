'use client';

import React from 'react';
import { useLocale } from 'next-intl';
import {
  Clock,
  UserCheck,
  Building2,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import { getOrganizationTypeLabel } from '@sadaqahbd/schema';

export type VerificationStatusType =
  | 'unapplied'
  | 'pending'
  | 'pending_org'
  | 'pending_admin'
  | 'verified'
  | 'active'
  | 'rejected';

export interface VerificationStatusViewProps {
  status: VerificationStatusType;
  role: 'student' | 'teacher' | 'organization';
  organizationName?: string;
  rejectionReason?: string;
  onApply: () => void;
  onChangeInstitution?: () => void;
  organizationDetails?: {
    name?: string;
    type?: string;
    address?: string;
    phone?: string;
    email?: string;
    description?: string;
  };
}

export default function VerificationStatusView({
  status,
  role,
  organizationName,
  rejectionReason,
  onApply,
  onChangeInstitution,
  organizationDetails,
}: VerificationStatusViewProps) {
  const locale = useLocale();
  const isBn = locale === 'bn';

  if (status === 'verified' || status === 'active') return null;

  // ----------------------------------------------------
  // STATE 1: PENDING ORGANIZATION APPROVAL (STAGE 1)
  // ----------------------------------------------------
  if (status === 'pending_org') {
    const roleTitle =
      role === 'teacher'
        ? isBn
          ? 'শিক্ষক অন্তর্ভুক্তি আবেদন পর্যালোচনায় রয়েছে'
          : 'Teacher Affiliation Under Review'
        : isBn
        ? 'শিক্ষার্থী সংযুক্তি আবেদন পর্যালোচনায় রয়েছে'
        : 'Student Affiliation Under Review';

    const orgDisplayName = organizationName || (isBn ? 'নির্বাচিত শিক্ষা প্রতিষ্ঠান' : 'Selected Educational Institution');

    const descText = isBn
      ? `আপনার আবেদনটি "${orgDisplayName}" এর নিকট প্রেরিত হয়েছে। প্রতিষ্ঠান প্রাথমিকভাবে অনুমোদন করার পর এটি মাস্টার এডমিন ও পারমিশন প্রাপ্ত সুপার এডমিনের কাছে চূড়ান্ত ছাড়পত্রের জন্য যাবে। উভয় অনুমোদন সম্পন্ন হলে তখন আপনার প্রোফাইলের বাকি সব ফিচার আনলক হবে। অনুমোদন না হওয়া পর্যন্ত কোনো ফিচার ব্যবহার করা যাবে না।`
      : `Your affiliation request has been routed to "${orgDisplayName}". Once approved by the institution and cleared by Admins, all features will unlock.`;

    return (
      <div
        style={{
          backgroundColor: 'var(--surface, #ffffff)',
          borderRadius: 'var(--radius-xl, 16px)',
          border: '1px solid #bfdbfe',
          padding: '2.5rem 1.5rem',
          textAlign: 'center',
          marginTop: '1rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 20px -4px rgba(37, 99, 235, 0.08)',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#eff6ff',
            border: '1px solid #dbeafe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
          }}
        >
          <Clock size={32} color="#2563eb" />
        </div>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.35rem 0.85rem',
            borderRadius: '20px',
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            color: '#1d4ed8',
            fontSize: '0.8rem',
            fontWeight: 800,
            marginBottom: '0.75rem',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#2563eb',
              display: 'inline-block',
            }}
          />
          {isBn ? 'ধাপ ১: প্রতিষ্ঠান অনুমোদনের অপেক্ষায়' : 'Stage 1: Pending Organization Approval'}
        </div>
        <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main, #0f172a)', margin: 0 }}>
          {roleTitle}
        </h3>
        <p style={{ maxWidth: 580, margin: '0.75rem auto 1.5rem', color: 'var(--text-muted, #64748b)', fontSize: '0.92rem', lineHeight: 1.6 }}>
          {descText}
        </p>

        {onChangeInstitution && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <button
              type="button"
              onClick={onChangeInstitution}
              className="btn btn-outline"
            >
              <Building2 size={15} />
              <span>{isBn ? 'প্রতিষ্ঠান পরিবর্তন / তথ্য সংশোধন' : 'Change Institution'}</span>
            </button>
          </div>
        )}

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.82rem',
            color: '#059669',
            fontWeight: 700,
            backgroundColor: '#ecfdf5',
            padding: '0.45rem 1rem',
            borderRadius: '20px',
            border: '1px solid #a7f3d0',
          }}
        >
          <CheckCircle2 size={16} />
          <span>
            {isBn
              ? 'লাইভ আপডেট সক্রিয় — প্রতিষ্ঠান অনুমোদন দেওয়া মাত্রই পরবর্তী ধাপ প্রদর্শিত হবে।'
              : 'Live update active — next stage will appear automatically once approved.'}
          </span>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // STATE 2: PENDING ADMIN APPROVAL (STAGE 2 / ORG PENDING)
  // ----------------------------------------------------
  if (status === 'pending_admin' || (role === 'organization' && status === 'pending')) {
    if (role === 'organization') {
      return (
        <div
          style={{
            backgroundColor: 'var(--surface, #ffffff)',
            borderRadius: 'var(--radius-xl, 16px)',
            border: '1px solid #bfdbfe',
            padding: '2.5rem 1.5rem',
            textAlign: 'center',
            marginTop: '1rem',
            boxShadow: '0 4px 20px -4px rgba(37, 99, 235, 0.08)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#eff6ff',
              border: '1px solid #dbeafe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
            }}
          >
            <Clock size={32} color="#2563eb" />
          </div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 0.85rem',
              borderRadius: '20px',
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              color: '#1d4ed8',
              fontSize: '0.8rem',
              fontWeight: 800,
              marginBottom: '0.75rem',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#2563eb',
                display: 'inline-block',
              }}
            />
            {isBn ? 'অ্যাডমিন অনুমোদনের অপেক্ষায়' : 'Awaiting Admin Approval'}
          </div>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main, #0f172a)', margin: 0 }}>
            {isBn ? 'প্রতিষ্ঠান ভেরিফিকেশন আবেদন পর্যালোচনায় রয়েছে' : 'Organization Verification Under Review'}
          </h3>
          <p style={{ maxWidth: 580, margin: '0.75rem auto 1.5rem', color: 'var(--text-muted, #64748b)', fontSize: '0.92rem', lineHeight: 1.6 }}>
            {isBn
              ? 'আপনার প্রতিষ্ঠানের আবেদনটি সফলভাবে জমা হয়েছে এবং মাস্টার এডমিন ও পারমিশন প্রাপ্ত সুপার এডমিনের কাছে পাঠানো হয়েছে। এডমিন ভেরিফাই করে অনুমোদন প্রদান করলেই Organization প্রোফাইলের বাকি সব ফিচার আনলক হবে। অনুমোদন না হওয়া পর্যন্ত কোনো ফিচার ব্যবহার করা যাবে না।'
              : 'Your organization verification application has been submitted and is currently being reviewed by Master and Super Admins. Dashboard features will automatically unlock upon approval.'}
          </p>

          {/* Submitted Details Preview Card */}
          {organizationDetails && (
            <div
              style={{
                maxWidth: 620,
                margin: '0 auto 1.5rem',
                padding: '1.25rem',
                backgroundColor: '#f8fafc',
                borderRadius: 'var(--radius-lg, 12px)',
                border: '1px solid #e2e8f0',
                textAlign: 'left',
                fontSize: '0.88rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '0.75rem',
              }}
            >
              {organizationDetails.name && (
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'block' }}>
                    {isBn ? 'প্রতিষ্ঠানের নাম' : 'Organization Name'}
                  </span>
                  <strong style={{ color: '#0f172a' }}>{organizationDetails.name}</strong>
                </div>
              )}
              {organizationDetails.type && (
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'block' }}>
                    {isBn ? 'প্রতিষ্ঠানের ধরন' : 'Organization Type'}
                  </span>
                  <strong style={{ color: '#0f172a' }}>
                    {getOrganizationTypeLabel(organizationDetails.type, isBn)}
                  </strong>
                </div>
              )}
              {organizationDetails.address && (
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'block' }}>
                    {isBn ? 'পূর্ণাঙ্গ ঠিকানা' : 'Address'}
                  </span>
                  <strong style={{ color: '#0f172a' }}>{organizationDetails.address}</strong>
                </div>
              )}
              {organizationDetails.phone && (
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'block' }}>
                    {isBn ? 'যোগাযোগের ফোন নম্বর' : 'Phone'}
                  </span>
                  <strong style={{ color: '#0f172a' }}>{organizationDetails.phone}</strong>
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            <button
              type="button"
              onClick={onApply}
              className="btn btn-outline"
            >
              <Building2 size={16} />
              <span>{isBn ? 'আবেদনের তথ্য পরিবর্তন / সংশোধন' : 'Edit Application Details'}</span>
            </button>
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.82rem',
              color: '#059669',
              fontWeight: 700,
              backgroundColor: '#ecfdf5',
              padding: '0.45rem 1rem',
              borderRadius: '20px',
              border: '1px solid #a7f3d0',
            }}
          >
            <CheckCircle2 size={16} />
            <span>
              {isBn
                ? 'লাইভ আপডেট সক্রিয় — এডমিন অনুমোদন দেওয়া মাত্রই পৃষ্ঠা রিলোড ছাড়াই ড্যাশবোর্ড সচল হবে।'
                : 'Live update active — portal will instantly unlock once verified.'}
            </span>
          </div>
        </div>
      );
    }

    // Teacher or Student Stage 2
    return (
      <div
        style={{
          backgroundColor: 'var(--surface, #ffffff)',
          borderRadius: 'var(--radius-xl, 16px)',
          border: '1px solid #ddd6fe',
          padding: '2.5rem 1.5rem',
          textAlign: 'center',
          marginTop: '1rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 20px -4px rgba(124, 58, 237, 0.08)',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#f5f3ff',
            border: '1px solid #ede9fe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
          }}
        >
          <UserCheck size={32} color="#7c3aed" />
        </div>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.35rem 0.85rem',
            borderRadius: '20px',
            backgroundColor: '#f5f3ff',
            border: '1px solid #ddd6fe',
            color: '#6d28d9',
            fontSize: '0.8rem',
            fontWeight: 800,
            marginBottom: '0.75rem',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#7c3aed',
              display: 'inline-block',
            }}
          />
          {isBn ? 'ধাপ ২: চূড়ান্ত এডমিন অনুমোদনের অপেক্ষায়' : 'Stage 2: Pending Final Admin Review'}
        </div>
        <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main, #0f172a)', margin: 0 }}>
          {isBn ? 'প্রতিষ্ঠান অনুমোদিত! সুপার এডমিন পর্যালোচনায়' : 'Institution Approved! Final Admin Clearance Pending'}
        </h3>
        <p style={{ maxWidth: 580, margin: '0.75rem auto 1.5rem', color: 'var(--text-muted, #64748b)', fontSize: '0.92rem', lineHeight: 1.6 }}>
          {isBn
            ? `আপনার শিক্ষা প্রতিষ্ঠান (${organizationName || 'প্রতিষ্ঠান'}) আবেদনটি অনুমোদন করেছে। এখন মাস্টার এডমিন বা পারমিশন প্রাপ্ত সুপার এডমিন চূড়ান্ত ছাড়পত্র প্রদান করলেই প্রোফাইলের বাকি সব ফিচার আনলক হবে। অনুমোদন না হওয়া পর্যন্ত কোনো ফিচার ব্যবহার করা যাবে না।`
            : 'Your educational institution has approved your affiliation. Final review by Super Admin is underway. Features will unlock upon approval.'}
        </p>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.82rem',
            color: '#059669',
            fontWeight: 700,
            backgroundColor: '#ecfdf5',
            padding: '0.45rem 1rem',
            borderRadius: '20px',
            border: '1px solid #a7f3d0',
          }}
        >
          <CheckCircle2 size={16} />
          <span>
            {isBn
              ? 'লাইভ আপডেট সক্রিয় — এডমিন অনুমোদন দেওয়া মাত্রই পৃষ্ঠা রিলোড ছাড়াই সব ফিচার সচল হবে।'
              : 'Live update active — features will unlock automatically once approved.'}
          </span>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // STATE 3: REJECTED
  // ----------------------------------------------------
  if (status === 'rejected') {
    return (
      <div
        style={{
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid #fecaca',
          padding: '3rem 1.5rem',
          textAlign: 'center',
          marginTop: '1rem',
          marginBottom: '2rem',
        }}
      >
        <AlertCircle size={48} color="#dc2626" style={{ margin: '0 auto 1rem' }} />
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
          {isBn ? 'আবেদনটি প্রত্যাখ্যাত হয়েছে' : 'Affiliation / Verification Rejected'}
        </h3>
        <p style={{ maxWidth: 520, margin: '0.75rem auto 1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
          {rejectionReason
            ? (isBn ? `কারণ: ${rejectionReason}` : `Reason: ${rejectionReason}`)
            : isBn
            ? 'সঠিক প্রতিষ্ঠান ও প্রয়োজনীয় তথ্যাদি প্রদান করে পুনরায় আবেদন জমা দিন।'
            : 'Please verify your information and submit a new application.'}
        </p>
        <button
          type="button"
          onClick={onApply}
          className="btn btn-primary"
        >
          <UserCheck size={18} />
          <span>{isBn ? 'পুনরায় আবেদন করুন' : 'Re-apply Now'}</span>
        </button>
      </div>
    );
  }

  // ----------------------------------------------------
  // STATE 4: UNAPPLIED (DEFAULT ONBOARDING)
  // ----------------------------------------------------
  const unappliedTitle =
    role === 'organization'
      ? isBn
        ? 'শিক্ষা প্রতিষ্ঠান অ্যাকাউন্ট ভেরিফিকেশন আবেদন'
        : 'Organization Verification Required'
      : role === 'teacher'
      ? isBn
        ? 'প্রতিষ্ঠানের সাথে শিক্ষক সংযুক্তি আবেদন'
        : 'Teacher Affiliation Required'
      : isBn
      ? 'শিক্ষা প্রতিষ্ঠানের সাথে শিক্ষার্থী সংযুক্তি আবেদন'
      : 'Student Affiliation Required';

  const unappliedDesc =
    role === 'organization'
      ? isBn
        ? 'ড্যাশবোর্ডের সকল সুবিধা ব্যবহার করতে আপনার প্রতিষ্ঠানের তথ্যাদি লিখে আবেদন জমা দিন। এডমিন অনুমোদন করলে তখন Organization প্রোফাইলের বাকি সব ফিচার আনলক হবে।'
        : 'Please submit your organization details to verify your account. Once approved by Admin, all organization features will unlock.'
      : role === 'teacher'
      ? isBn
        ? 'আপনার শিক্ষা প্রতিষ্ঠান নির্বাচন করে শিক্ষক হিসেবে যুক্ত হতে আবেদন জমা দিন। প্রতিষ্ঠান ও এডমিন অনুমোদন করলে তখন শিক্ষক প্রোফাইলের বাকি সব ফিচার আনলক হবে।'
        : 'Please select your institution to apply as a teacher. Once approved by your institution and verified by the Super Admin, the student verification queue will unlock.'
      : isBn
      ? 'সহায়তা আবেদন ও ড্যাশবোর্ডের সব ফিচার ব্যবহারের পূর্বে আপনার শিক্ষা প্রতিষ্ঠান নির্বাচন করে শিক্ষার্থী হিসেবে যুক্ত হওয়ার আবেদন সম্পন্ন করুন।'
      : 'Select your educational institution to apply as a student. All features will unlock once verified by your institution and admin.';

  const IconComp = role === 'organization' ? Building2 : role === 'teacher' ? UserCheck : GraduationCap;

  return (
    <div
      style={{
        backgroundColor: 'var(--surface)',
        borderRadius: 'var(--radius-xl)',
        border: '1px dashed var(--surface-border)',
        padding: '3.5rem 1.5rem',
        textAlign: 'center',
        marginTop: '1rem',
        marginBottom: '2rem',
      }}
    >
      <IconComp size={48} color="#059669" style={{ margin: '0 auto 1rem' }} />
      <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
        {unappliedTitle}
      </h3>
      <p style={{ maxWidth: 580, margin: '0.75rem auto 1.75rem', color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.6 }}>
        {unappliedDesc}
      </p>
      <button
        type="button"
        onClick={onApply}
        className="btn btn-primary btn-lg"
      >
        <IconComp size={20} />
        <span>{isBn ? 'আবেদন করুন' : 'Apply Now'}</span>
      </button>
    </div>
  );
}
