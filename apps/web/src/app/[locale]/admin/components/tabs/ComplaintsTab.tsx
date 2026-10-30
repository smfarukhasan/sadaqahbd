'use client';

import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  Search,
  Filter,
  User,
  RefreshCw,
  X,
  Mail,
  Shield,
} from 'lucide-react';
import { getApiUrl } from '@/lib/api-config';
import { getAuthToken } from '@/lib/auth-token';
import { formatBengaliDate } from '@/lib/format-utils';

interface ComplaintItem {
  id: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  senderRole: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved';
  adminReply?: string | null;
  createdAt: string;
}

interface ComplaintsTabProps {
  isBn: boolean;
  user: any;
}

export default function ComplaintsTab({ isBn, user }: ComplaintsTabProps) {
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Reply modal state
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintItem | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState<'in_progress' | 'resolved'>('resolved');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadComplaints = async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      const res = await fetch(`${getApiUrl()}/complaints/admin-list`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
      if (res.ok) {
        const data = await res.json();
        setComplaints(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, []);

  const handleOpenReplyModal = (c: ComplaintItem) => {
    setSelectedComplaint(c);
    setReplyText(c.adminReply || '');
    setReplyStatus(c.status === 'resolved' ? 'resolved' : 'in_progress');
    setFeedback(null);
  };

  const handleSendReply = async () => {
    if (!selectedComplaint) return;
    if (!replyText.trim() || replyText.trim().length < 5) {
      setFeedback({
        type: 'error',
        text: isBn
          ? 'উত্তরের বার্তা কমপক্ষে ৫ অক্ষরের হতে হবে।'
          : 'Reply message must be at least 5 characters.',
      });
      return;
    }

    try {
      setSubmittingReply(true);
      setFeedback(null);
      const token = await getAuthToken();

      const res = await fetch(`${getApiUrl()}/complaints/admin-reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: JSON.stringify({
          complaintId: selectedComplaint.id,
          adminReply: replyText.trim(),
          status: replyStatus,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setFeedback({
          type: 'success',
          text: data.message || (isBn ? 'উত্তর সফলভাবে প্রেরণ করা হয়েছে।' : 'Reply sent successfully.'),
        });
        setTimeout(() => {
          setSelectedComplaint(null);
          loadComplaints();
        }, 800);
      } else {
        setFeedback({
          type: 'error',
          text: data.message || (isBn ? 'উত্তর প্রেরণে সমস্যা হয়েছে।' : 'Failed to send reply.'),
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err?.message || (isBn ? 'সার্ভার সংযোগে সমস্যা।' : 'Connection error.'),
      });
    } finally {
      setSubmittingReply(false);
    }
  };

  const filteredList = complaints
    .filter((c) => {
      if (filterStatus === 'all') return true;
      return c.status === filterStatus;
    })
    .filter((c) => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        c.senderName?.toLowerCase().includes(term) ||
        c.senderEmail?.toLowerCase().includes(term) ||
        c.subject?.toLowerCase().includes(term) ||
        c.message?.toLowerCase().includes(term)
      );
    });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return {
          label: isBn ? 'নতুন / অপেক্ষমান' : 'Open / Pending',
          bg: '#fef3c7',
          color: '#92400e',
          icon: Clock,
        };
      case 'in_progress':
        return {
          label: isBn ? 'প্রক্রিয়াধীন' : 'In Progress',
          bg: '#e0f2fe',
          color: '#075985',
          icon: AlertCircle,
        };
      case 'resolved':
        return {
          label: isBn ? 'সমাধানকৃত' : 'Resolved',
          bg: '#ecfdf5',
          color: '#065f46',
          icon: CheckCircle2,
        };
      default:
        return {
          label: status,
          bg: '#f1f5f9',
          color: '#475569',
          icon: Clock,
        };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
          borderRadius: '16px',
          padding: '1.5rem 1.75rem',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                padding: '0.25rem 0.75rem',
                borderRadius: '20px',
                fontSize: '0.78rem',
                fontWeight: 600,
                marginBottom: '0.75rem',
                backdropFilter: 'blur(6px)',
              }}
            >
              <MessageSquare size={14} color="#38bdf8" />
              <span>{isBn ? 'ব্যবহারকারী সহায়তা ও অভিযোগ' : 'User Complaints & Support'}</span>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.4rem', color: '#ffffff' }}>
              {isBn ? 'অভিযোগ ও সহায়তা ড্যাশবোর্ড' : 'Complaints & Support Dashboard'}
            </h2>
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'rgba(255, 255, 255, 0.85)', maxWidth: '640px', lineHeight: 1.5 }}>
              {isBn
                ? 'শিক্ষার্থী ও শিক্ষকদের জমা দেওয়া অভিযোগ ও মতামত পর্যালোচনা করুন, উত্তর প্রদান করুন এবং প্ল্যাটফর্মের স্বচ্ছতা বজায় রাখুন।'
                : 'Review complaints and feedback submitted by students and teachers, reply directly, and resolve issues.'}
            </p>
          </div>

          <button
            type="button"
            onClick={loadComplaints}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              padding: '0.55rem 1rem',
              borderRadius: '8px',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
            <span>{isBn ? 'রিফ্রেশ' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          backgroundColor: 'var(--surface, #ffffff)',
          padding: '1rem 1.25rem',
          borderRadius: '12px',
          border: '1px solid var(--surface-border, #e2e8f0)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {(['all', 'open', 'in_progress', 'resolved'] as const).map((st) => {
            const count = st === 'all' ? complaints.length : complaints.filter((c) => c.status === st).length;
            const labels: Record<string, string> = {
              all: isBn ? 'সকল অভিযোগ' : 'All',
              open: isBn ? 'নতুন / ওপেন' : 'Open',
              in_progress: isBn ? 'প্রক্রিয়াধীন' : 'In Progress',
              resolved: isBn ? 'সমাধানকৃত' : 'Resolved',
            };
            const isActive = filterStatus === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() => setFilterStatus(st)}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: '20px',
                  border: isActive ? '1.5px solid #0284c7' : '1px solid var(--surface-border, #cbd5e1)',
                  backgroundColor: isActive ? '#0284c7' : 'var(--background-alt, #f8fafc)',
                  color: isActive ? '#ffffff' : 'var(--text-main, #334155)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{labels[st]}</span>
                <span
                  style={{
                    fontSize: '0.72rem',
                    padding: '0.05rem 0.4rem',
                    borderRadius: '10px',
                    backgroundColor: isActive ? 'rgba(255, 255, 255, 0.25)' : 'var(--surface-border, #e2e8f0)',
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', minWidth: '240px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted, #94a3b8)',
            }}
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isBn ? 'নাম, বিষয় বা বার্তা খুঁজুন...' : 'Search name, subject...'}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem 0.5rem 2.25rem',
              borderRadius: '8px',
              border: '1.5px solid var(--surface-border, #cbd5e1)',
              backgroundColor: 'var(--surface, #ffffff)',
              fontSize: '0.84rem',
              color: 'var(--text-main, #0f172a)',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Complaints List */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted, #64748b)' }}>
          <RefreshCw className="spin" size={24} style={{ margin: '0 auto 0.75rem' }} />
          <p style={{ margin: 0, fontSize: '0.9rem' }}>{isBn ? 'অভিযোগ লোড হচ্ছে...' : 'Loading complaints...'}</p>
        </div>
      ) : filteredList.length === 0 ? (
        <div
          style={{
            padding: '3rem 2rem',
            textAlign: 'center',
            backgroundColor: 'var(--surface, #ffffff)',
            borderRadius: '12px',
            border: '1px solid var(--surface-border, #e2e8f0)',
            color: 'var(--text-muted, #64748b)',
          }}
        >
          <MessageSquare size={36} color="#94a3b8" style={{ margin: '0 auto 0.75rem' }} />
          <h4 style={{ margin: '0 0 0.35rem', fontSize: '1rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
            {isBn ? 'কোনো অভিযোগ পাওয়া যায়নি' : 'No complaints found'}
          </h4>
          <p style={{ margin: 0, fontSize: '0.84rem' }}>
            {filterStatus !== 'all'
              ? (isBn ? 'এই ক্যাটাগরিতে বর্তমানে কোনো অভিযোগ নেই।' : 'No complaints under this filter.')
              : (isBn ? 'বর্তমানে শিক্ষার্থীদের বা শিক্ষকদের পক্ষ থেকে কোনো অভিযোগ জমা নেই।' : 'No active complaints registered.')}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredList.map((c) => {
            const badge = getStatusBadge(c.status);
            const BadgeIcon = badge.icon;
            return (
              <div
                key={c.id}
                style={{
                  backgroundColor: 'var(--surface, #ffffff)',
                  borderRadius: '12px',
                  border: '1px solid var(--surface-border, #e2e8f0)',
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                }}
              >
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>
                        {c.senderName || (isBn ? 'ব্যবহারকারী' : 'User')}
                      </span>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '0.1rem 0.5rem',
                          borderRadius: '12px',
                          backgroundColor: c.senderRole === 'student' ? 'rgba(5, 150, 105, 0.1)' : 'rgba(2, 132, 199, 0.1)',
                          color: c.senderRole === 'student' ? '#059669' : '#0284c7',
                        }}
                      >
                        {c.senderRole === 'student' ? (isBn ? 'শিক্ষার্থী' : 'Student') : (isBn ? 'শিক্ষক' : 'Teacher')}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.78rem', color: 'var(--text-muted, #64748b)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Mail size={13} /> {c.senderEmail}
                      </span>
                      <span>•</span>
                      <span>{formatBengaliDate(c.createdAt, isBn)}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        padding: '0.25rem 0.65rem',
                        borderRadius: '20px',
                        backgroundColor: badge.bg,
                        color: badge.color,
                      }}
                    >
                      <BadgeIcon size={14} />
                      {badge.label}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleOpenReplyModal(c)}
                      style={{
                        padding: '0.4rem 0.85rem',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: '#0284c7',
                        color: '#ffffff',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <Send size={13} />
                      <span>{c.adminReply ? (isBn ? 'উত্তর পরিবর্তন' : 'Edit Reply') : (isBn ? 'উত্তর দিন' : 'Reply')}</span>
                    </button>
                  </div>
                </div>

                {/* Subject & Message */}
                <div style={{ backgroundColor: 'var(--background-alt, #f8fafc)', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid var(--surface-border, #f1f5f9)' }}>
                  <h4 style={{ margin: '0 0 0.35rem', fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>
                    {isBn ? 'বিষয়: ' : 'Subject: '}{c.subject}
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-main, #334155)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                    {c.message}
                  </p>
                </div>

                {/* Admin Reply Section if present */}
                {c.adminReply && (
                  <div
                    style={{
                      backgroundColor: 'rgba(2, 132, 199, 0.05)',
                      borderLeft: '4px solid #0284c7',
                      padding: '0.75rem 1rem',
                      borderRadius: '4px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', fontWeight: 700, color: '#0369a1', marginBottom: '0.25rem' }}>
                      <Shield size={14} />
                      <span>{isBn ? 'এডমিন উত্তর (Admin Reply):' : 'Admin Reply:'}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-main, #0f172a)', lineHeight: 1.45 }}>
                      {c.adminReply}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Reply Modal */}
      {selectedComplaint && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--surface, #ffffff)',
              borderRadius: '16px',
              maxWidth: '560px',
              width: '100%',
              padding: '1.75rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
              position: 'relative',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(2, 132, 199, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
                  <Send size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>
                    {isBn ? 'অভিযোগের উত্তর প্রদান' : 'Reply to Complaint'}
                  </h3>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted, #64748b)' }}>
                    {selectedComplaint.senderName} ({selectedComplaint.senderEmail})
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedComplaint(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.2rem' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Original Complaint summary */}
            <div style={{ backgroundColor: 'var(--background-alt, #f8fafc)', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.25rem', border: '1px solid var(--surface-border, #e2e8f0)' }}>
              <p style={{ margin: '0 0 0.25rem', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
                {isBn ? 'বিষয়: ' : 'Subject: '}{selectedComplaint.subject}
              </p>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted, #64748b)', lineHeight: 1.4 }}>
                {selectedComplaint.message}
              </p>
            </div>

            {feedback && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  backgroundColor: feedback.type === 'success' ? '#ecfdf5' : '#fef2f2',
                  border: `1px solid ${feedback.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
                  color: feedback.type === 'success' ? '#065f46' : '#991b1b',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  marginBottom: '1rem',
                }}
              >
                {feedback.text}
              </div>
            )}

            {/* Reply Textarea */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main, #0f172a)', marginBottom: '0.35rem' }}>
                {isBn ? 'উত্তরের বিস্তারিত বার্তা *' : 'Reply Message *'}
              </label>
              <textarea
                rows={4}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={isBn ? 'অভিযোগের সমাধান বা নির্দেশনা লিখুন...' : 'Write your official response...'}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  border: '1.5px solid var(--surface-border, #cbd5e1)',
                  backgroundColor: 'var(--surface, #ffffff)',
                  fontSize: '0.88rem',
                  color: 'var(--text-main, #0f172a)',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            {/* Status selection */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main, #0f172a)', marginBottom: '0.35rem' }}>
                {isBn ? 'অভিযোগের স্ট্যাটাস পরিবর্তন' : 'Update Complaint Status'}
              </label>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="replyStatus"
                    value="resolved"
                    checked={replyStatus === 'resolved'}
                    onChange={() => setReplyStatus('resolved')}
                  />
                  <span>{isBn ? 'সমাধানকৃত (Resolved)' : 'Resolved'}</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="replyStatus"
                    value="in_progress"
                    checked={replyStatus === 'in_progress'}
                    onChange={() => setReplyStatus('in_progress')}
                  />
                  <span>{isBn ? 'প্রক্রিয়াধীন (In Progress)' : 'In Progress'}</span>
                </label>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
              <button
                type="button"
                onClick={() => setSelectedComplaint(null)}
                style={{
                  padding: '0.55rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid var(--surface-border, #cbd5e1)',
                  backgroundColor: 'transparent',
                  color: 'var(--text-muted, #64748b)',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>

              <button
                type="button"
                onClick={handleSendReply}
                disabled={submittingReply || !replyText.trim()}
                style={{
                  padding: '0.55rem 1.25rem',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: submittingReply ? 'not-allowed' : 'pointer',
                  opacity: submittingReply ? 0.7 : 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                {submittingReply ? (
                  <>
                    <RefreshCw className="spin" size={14} />
                    <span>{isBn ? 'পাঠানো হচ্ছে...' : 'Sending...'}</span>
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    <span>{isBn ? 'উত্তর নিশ্চিত করুন' : 'Submit Reply'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

