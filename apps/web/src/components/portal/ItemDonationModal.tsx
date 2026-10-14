'use client';

import React, { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from '../../i18n/routing';
import { useAuthStore } from '../../lib/auth-store';
import { getApiUrl } from '../../lib/api-config';
import { getAuthToken } from '../../lib/auth-token';
import {
  Package,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  UserCheck,
  Building,
  Phone,
  MapPin,
  FileText,
} from 'lucide-react';

interface ItemDonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPostId?: string;
  defaultPostTitle?: string;
}

export default function ItemDonationModal({
  isOpen,
  onClose,
  defaultPostId,
  defaultPostTitle,
}: ItemDonationModalProps) {
  const locale = useLocale();
  const isBn = locale === 'bn';
  const router = useRouter();

  const user = useAuthStore((s) => s.user);
  const firebaseUser = useAuthStore((s) => s.firebaseUser);

  const [itemName, setItemName] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('১ টি');
  const [isRandom, setIsRandom] = useState(!defaultPostId);
  const [postId, setPostId] = useState(defaultPostId || '');
  const [donorPhone, setDonorPhone] = useState(user?.phone || '');
  const [pickupAddress, setPickupAddress] = useState(user?.address || '');
  const [isAnonymous, setIsAnonymous] = useState(false);

  const [publicPosts, setPublicPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setSuccessMsg('');
      if (defaultPostId) {
        setPostId(defaultPostId);
        setIsRandom(false);
      }
      if (user?.phone) setDonorPhone(user.phone);
      if (user?.address) setPickupAddress(user.address);
    }
  }, [isOpen, defaultPostId, user]);

  useEffect(() => {
    if (isOpen && !isRandom) {
      setLoadingPosts(true);
      const apiUrl = getApiUrl();
      fetch(`${apiUrl}/posts/public`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setPublicPosts(data);
          }
        })
        .catch(() => {})
        .finally(() => setLoadingPosts(false));
    }
  }, [isOpen, isRandom]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push(`/login?redirect=/donate` as any);
      return;
    }

    if (!itemName.trim() || !description.trim() || !donorPhone.trim()) {
      setErrorMsg(
        isBn
          ? 'অনুগ্রহ করে পণ্যের নাম, বিবরণ এবং ফোন নম্বর পূরণ করুন।'
          : 'Please fill in item name, description and phone number.'
      );
      return;
    }

    if (!isRandom && !postId.trim()) {
      setErrorMsg(
        isBn
          ? 'নির্দিষ্ট শিক্ষার্থীর পোস্ট নির্বাচন করুন।'
          : 'Please select a specific student post.'
      );
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const token = await getAuthToken();
      const apiUrl = getApiUrl();

      const res = await fetch(`${apiUrl}/donations/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          itemName: itemName.trim(),
          description: description.trim(),
          quantity: quantity.trim() || '১ টি',
          isRandom,
          postId: isRandom ? undefined : postId.trim(),
          donorPhone: donorPhone.trim(),
          pickupAddress: pickupAddress.trim(),
          isAnonymous,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || (isBn ? 'আবেদন ব্যর্থ হয়েছে' : 'Submission failed'));
      }

      setSuccessMsg(
        isBn
          ? 'আপনার পণ্য অনুদানের আবেদনটি সফলভাবে জমা হয়েছে! এটি কর্তৃপক্ষের ভেরিফিকেশনের জন্য অপেক্ষমান থাকবে।'
          : 'Item donation request submitted! Pending verification by platform authority.'
      );
      setTimeout(() => {
        onClose();
      }, 2500);
    } catch (err: any) {
      setErrorMsg(err.message || (isBn ? 'ত্রুটি দেখা দিয়েছে' : 'An error occurred'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          backgroundColor: 'var(--surface, #ffffff)',
          border: '1px solid var(--surface-border, #e2e8f0)',
          borderRadius: 'var(--radius-xl, 24px)',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
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
            backgroundColor: 'var(--background-alt, #f8fafc)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '10px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981',
              }}
            >
              <Package size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                {isBn ? 'অর্থ ছাড়া পণ্য/সামগ্রী দান করুন' : 'Donate Physical Items / Goods'}
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                {isBn
                  ? 'ল্যাপটপ, সাইকেল, বই-খাতা, পোশাক ইত্যাদি সরাসরি শিক্ষার্থীদের জন্য প্রদান করুন'
                  : 'Donate laptops, bicycles, books, clothes directly to students'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.4rem',
              borderRadius: '8px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          {errorMsg && (
            <div
              style={{
                padding: '0.85rem 1rem',
                backgroundColor: 'var(--danger-light, #fef2f2)',
                color: '#ef4444',
                borderRadius: 'var(--radius-md, 12px)',
                marginBottom: '1.25rem',
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div
              style={{
                padding: '1rem 1.25rem',
                backgroundColor: 'var(--success-light, #ecfdf5)',
                color: '#10b981',
                borderRadius: 'var(--radius-md, 12px)',
                marginBottom: '1.25rem',
                fontSize: '0.9rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
              }}
            >
              <CheckCircle2 size={22} />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {/* Target Selection */}
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.5rem' }}>
                {isBn ? 'দানের লক্ষ্য / উদ্দেশ্য' : 'Donation Purpose / Target'}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setIsRandom(true)}
                  style={{
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md, 12px)',
                    border: isRandom ? '2px solid #10b981' : '1px solid var(--surface-border, #cbd5e1)',
                    backgroundColor: isRandom ? 'var(--primary-light, rgba(16,185,129,0.1))' : 'var(--background, #f8fafc)',
                    color: isRandom ? '#10b981' : 'var(--text-main)',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  {isBn ? 'কর্তৃপক্ষের সিদ্ধান্ত অনুসারে (রেন্ডম)' : 'Authority Decision (Random Pool)'}
                </button>

                <button
                  type="button"
                  onClick={() => setIsRandom(false)}
                  style={{
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md, 12px)',
                    border: !isRandom ? '2px solid #10b981' : '1px solid var(--surface-border, #cbd5e1)',
                    backgroundColor: !isRandom ? 'var(--primary-light, rgba(16,185,129,0.1))' : 'var(--background, #f8fafc)',
                    color: !isRandom ? '#10b981' : 'var(--text-main)',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  {isBn ? 'নির্দিষ্ট শিক্ষার্থী' : 'Specific Student Post'}
                </button>
              </div>

              {!isRandom && (
                <div style={{ marginTop: '0.75rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.35rem' }}>
                    {isBn ? 'নির্দিষ্ট শিক্ষার্থী ও আবেদন পোস্ট সিলেক্ট করুন *' : 'Select Specific Student Post *'}
                  </label>
                  {loadingPosts ? (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0' }}>
                      <Loader2 size={16} className="animate-spin" />
                      <span>{isBn ? 'শিক্ষার্থীদের পোস্ট তালিকা লোড হচ্ছে...' : 'Loading student posts...'}</span>
                    </div>
                  ) : (
                    <select
                      value={postId}
                      onChange={(e) => setPostId(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '0.7rem 0.9rem',
                        borderRadius: 'var(--radius-md, 10px)',
                        border: '1px solid var(--surface-border, #cbd5e1)',
                        backgroundColor: 'var(--background, #ffffff)',
                        color: 'var(--text-main)',
                        fontSize: '0.9rem',
                      }}
                    >
                      <option value="">{isBn ? '-- আবেদনকারী শিক্ষার্থী নির্বাচন করুন --' : '-- Select Student Post --'}</option>
                      {publicPosts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.studentName ? `${p.studentName} — ${p.title} (${p.orgName || 'অনুমোদিত প্রতিষ্ঠান'})` : p.title}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>

            {/* Item Name */}
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.35rem' }}>
                {isBn ? 'পণ্যের নাম *' : 'Item Name *'}
              </label>
              <input
                type="text"
                placeholder={isBn ? 'যেমন: HP Core i5 ল্যাপটপ, হিরো সাইকেল, ৫ম শ্রেণির বই সেট' : 'e.g. HP Laptop, Bicycle, Book Set'}
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.7rem 0.9rem',
                  borderRadius: 'var(--radius-md, 10px)',
                  border: '1px solid var(--surface-border, #cbd5e1)',
                  backgroundColor: 'var(--background, #ffffff)',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem',
                }}
              />
            </div>

            {/* Quantity */}
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.35rem' }}>
                {isBn ? 'পরিমাণ *' : 'Quantity *'}
              </label>
              <input
                type="text"
                placeholder={isBn ? 'যেমন: ১ টি / ২ জোড়া / ৫ সেট' : 'e.g. 1 PC / 2 Sets'}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.7rem 0.9rem',
                  borderRadius: 'var(--radius-md, 10px)',
                  border: '1px solid var(--surface-border, #cbd5e1)',
                  backgroundColor: 'var(--background, #ffffff)',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem',
                }}
              />
            </div>

            {/* Description */}
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.35rem' }}>
                {isBn ? 'পণ্যের বিস্তারিত বিবরণ ও কন্ডিশন *' : 'Item Description & Condition *'}
              </label>
              <textarea
                rows={3}
                placeholder={isBn ? 'পণ্যটির রানিং অবস্থা, স্পেসিফিকেশন এবং কোনো বিশেষ নির্দেশনা লিখুন...' : 'Write specifications, condition and notes...'}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.7rem 0.9rem',
                  borderRadius: 'var(--radius-md, 10px)',
                  border: '1px solid var(--surface-border, #cbd5e1)',
                  backgroundColor: 'var(--background, #ffffff)',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Donor Phone & Pickup Address */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.35rem' }}>
                  {isBn ? 'যোগাযোগের মোবাইল *' : 'Contact Phone *'}
                </label>
                <input
                  type="text"
                  placeholder="01700000000"
                  value={donorPhone}
                  onChange={(e) => setDonorPhone(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.7rem 0.9rem',
                    borderRadius: 'var(--radius-md, 10px)',
                    border: '1px solid var(--surface-border, #cbd5e1)',
                    backgroundColor: 'var(--background, #ffffff)',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.35rem' }}>
                  {isBn ? 'পিকআপ/কুরিয়ার ঠিকানা' : 'Pickup Address'}
                </label>
                <input
                  type="text"
                  placeholder={isBn ? 'থানা, জেলা ও ঠিকানা' : 'Thana, District & Address'}
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.7rem 0.9rem',
                    borderRadius: 'var(--radius-md, 10px)',
                    border: '1px solid var(--surface-border, #cbd5e1)',
                    backgroundColor: 'var(--background, #ffffff)',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem',
                  }}
                />
              </div>
            </div>

            {/* Anonymous / Privacy Checkbox */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.65rem',
                padding: '0.85rem',
                backgroundColor: isAnonymous ? 'rgba(245, 158, 11, 0.08)' : 'var(--surface-border-subtle, rgba(0,0,0,0.03))',
                borderRadius: 'var(--radius-md, 10px)',
                border: isAnonymous ? '1.5px solid #f59e0b' : '1px solid var(--surface-border, #cbd5e1)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onClick={() => setIsAnonymous(!isAnonymous)}
            >
              <input
                type="checkbox"
                id="isAnonymousItem"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                style={{
                  width: '18px',
                  height: '18px',
                  accentColor: '#f59e0b',
                  cursor: 'pointer',
                  marginTop: '2px',
                }}
              />
              <label
                htmlFor="isAnonymousItem"
                style={{
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  color: 'var(--text-main)',
                  userSelect: 'none',
                }}
              >
                <strong style={{ display: 'block', color: isAnonymous ? '#b45309' : 'var(--text-main)' }}>
                  {isBn ? 'পরিচয় গোপন রাখতে চাই (পাবলিক তালিকায় বেনামী)' : 'Keep identity anonymous in public list'}
                </strong>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                  {isBn
                    ? 'টিক দিলে পাবলিক হিসাবে আপনার নাম "গোপন রাখা হয়েছে" হিসেবে প্রদর্শিত হবে। তবে কর্তৃপক্ষ স্বচ্ছতার জন্য যাচাই করতে পারবে।'
                    : 'Your name will show as anonymous publicly. Authorities can verify internally.'}
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                marginTop: '0.5rem',
                padding: '0.85rem',
                borderRadius: 'var(--radius-md, 12px)',
                fontWeight: 700,
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                backgroundColor: '#10b981',
                border: 'none',
                color: '#ffffff',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>{isBn ? 'জমা হচ্ছে...' : 'Submitting...'}</span>
                </>
              ) : (
                <>
                  <Send size={18} />
                  <span>{isBn ? 'পণ্য অনুদান আবেদন সাবমিট করুন' : 'Submit Item Donation Request'}</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
