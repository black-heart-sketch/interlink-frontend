import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import axiosInstance from '../../config/axiosConfig';
import { reportService } from '../../services/reportService';
import Loader from '../components/Loader';

const EMPTY_FORM = {
  type: 'daily',
  title: '',
  content: '',
  challenges: '',
  nextSteps: '',
  periodStart: '',
  periodEnd: '',
  week: '',
  attachments: [],
};

const EMPTY_AI = {
  type: 'daily',
  notes: '',
  achievements: '',
  blockers: '',
  nextSteps: '',
};

const normalizeRole = (role) => String(role || '').toLowerCase();
const fullName = (user) => [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'Unassigned';
const formatDate = (value) => value ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not set';

const getAssetUrl = (url) => {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  return `${apiBase.replace(/\/api\/?$/, '')}${url}`;
};

const statusStyles = {
  pending: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
  reviewed: 'border-sky-500/20 bg-sky-500/10 text-sky-300',
  approved: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
  rejected: 'border-rose-500/20 bg-rose-500/10 text-rose-300',
};

const typeStyles = {
  daily: 'border-blue-500/20 bg-blue-500/10 text-blue-300',
  weekly: 'border-violet-500/20 bg-violet-500/10 text-violet-300',
  final: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-300',
};

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function ReportBadge({ value, styles }) {
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-[0.68rem] font-black uppercase tracking-[0.14em] ${styles[value] || styles.pending}`}>
      {String(value || 'pending').replace('_', ' ')}
    </span>
  );
}

export default function ManageReports({ dashboardRoles }) {
  const reduxRoles = useSelector((state) => state.auth.userRoles);
  const userRoles = useMemo(() => {
    if (Array.isArray(dashboardRoles) && dashboardRoles.length) return dashboardRoles;
    if (Array.isArray(reduxRoles) && reduxRoles.length) return reduxRoles;
    try {
      return JSON.parse(sessionStorage.getItem('userRoles') || localStorage.getItem('userRoles') || '[]');
    } catch {
      return [];
    }
  }, [dashboardRoles, reduxRoles]);

  const roles = useMemo(() => userRoles.map(normalizeRole), [userRoles]);
  const isSupervisor = roles.includes('supervisor') || roles.includes('teacher') || roles.includes('advisor');
  const isAdmin = roles.includes('admin') || roles.includes('superadmin') || roles.includes('manager');
  const isStudent = roles.includes('student') || (!isSupervisor && !isAdmin);

  const [reports, setReports] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(isStudent ? 'submit' : 'review');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [reviewReport, setReviewReport] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [aiForm, setAiForm] = useState(EMPTY_AI);
  const [reviewForm, setReviewForm] = useState({ score: 85, feedback: '' });

  const inputCls = 'w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/60';
  const areaCls = `${inputCls} min-h-[120px] resize-y leading-6`;

  const fetchReports = async () => {
    try {
      const data = await reportService.getReports();
      setReports(data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load reports.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    if (isStudent) return;
    try {
      const response = await axiosInstance.get('/users', { params: { role: 'student' } });
      setStudents(response.data || []);
    } catch (error) {
      console.warn('Student roster could not be loaded.', error);
    }
  };

  useEffect(() => {
    fetchReports();
    fetchStudents();
  }, [isStudent]);

  const metrics = useMemo(() => {
    const total = reports.length;
    const pending = reports.filter((report) => report.status === 'pending').length;
    const approved = reports.filter((report) => report.status === 'approved').length;
    const rejected = reports.filter((report) => report.status === 'rejected').length;
    const avgScoreReports = reports.filter((report) => Number.isFinite(Number(report.score)));
    const averageScore = avgScoreReports.length
      ? Math.round(avgScoreReports.reduce((sum, report) => sum + Number(report.score || 0), 0) / avgScoreReports.length)
      : 0;
    return { total, pending, approved, rejected, averageScore };
  }, [reports]);

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const haystack = [
        report.title,
        report.content,
        report.challenges,
        report.nextSteps,
        fullName(report.intern),
        report.intern?.email,
      ].filter(Boolean).join(' ').toLowerCase();

      const matchesSearch = haystack.includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === 'all' || report.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [reports, searchQuery, statusFilter, typeFilter]);

  const reviewQueue = useMemo(() => reports.filter((report) => report.status === 'pending' || report.status === 'reviewed'), [reports]);

  const historyReports = isSupervisor || isAdmin ? filteredReports : reports;

  const handleChange = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      toast.warning('Title and progress summary are required.');
      return;
    }

    setSaving(true);
    try {
      await reportService.createReport(form);
      toast.success('Report submitted for supervisor review.');
      setForm(EMPTY_FORM);
      setActiveTab('history');
      await fetchReports();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit report.');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateAi = async (event) => {
    event.preventDefault();
    if (!aiForm.notes.trim() && !aiForm.achievements.trim()) {
      toast.warning('Add a few notes or achievements first.');
      return;
    }

    setAiLoading(true);
    try {
      const result = await reportService.generateAiReport(aiForm);
      const generated = result.report || {};
      setForm((current) => ({
        ...current,
        type: aiForm.type,
        title: generated.title || current.title,
        content: generated.content || current.content,
        challenges: generated.challenges || current.challenges,
        nextSteps: generated.nextSteps || current.nextSteps,
      }));
      setActiveTab('submit');
      toast.success(result.source === 'ai' ? 'AI draft generated.' : 'Draft generated with fallback assistant.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate report draft.');
    } finally {
      setAiLoading(false);
    }
  };

  const openReview = (report) => {
    setReviewReport(report);
    setReviewForm({ score: report.score || 85, feedback: report.feedback || '' });
  };

  const handleReview = async (action) => {
    if (!reviewReport) return;
    if ((action === 'reject' || action === 'review') && !reviewForm.feedback.trim()) {
      toast.warning('Feedback is required for revisions and rejections.');
      return;
    }

    setSaving(true);
    try {
      await reportService.reviewReport(reviewReport._id, { ...reviewForm, action });
      toast.success(action === 'approve' ? 'Report approved.' : action === 'reject' ? 'Report rejected.' : 'Report marked reviewed.');
      setReviewReport(null);
      await fetchReports();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to review report.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6 pb-12">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ['Total Reports', metrics.total, 'fa-file-lines', 'text-cyan-300'],
          ['Pending Review', metrics.pending, 'fa-clock', 'text-amber-300'],
          ['Approved', metrics.approved, 'fa-circle-check', 'text-emerald-300'],
          ['Rejected', metrics.rejected, 'fa-circle-xmark', 'text-rose-300'],
          ['Average Score', `${metrics.averageScore}%`, 'fa-chart-line', 'text-blue-300'],
        ].map(([label, value, icon, color]) => (
          <article key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-slate-500">{label}</span>
              <i className={`fa-solid ${icon} ${color}`} aria-hidden="true" />
            </div>
            <strong className="mt-2 block text-2xl font-black text-white">{value}</strong>
          </article>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-2">
        {[
          ...(isStudent ? [{ id: 'submit', label: 'Submit Report', icon: 'fa-pen-to-square' }, { id: 'ai', label: 'AI Draft', icon: 'fa-wand-magic-sparkles' }] : []),
          ...(!isStudent ? [{ id: 'review', label: 'Review Queue', icon: 'fa-user-check' }] : []),
          { id: 'history', label: isStudent ? 'My History' : 'Report History', icon: 'fa-clock-rotate-left' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-black uppercase tracking-[0.14em] transition ${
              activeTab === tab.id ? 'bg-cyan-500 text-slate-950' : 'bg-transparent text-slate-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            <i className={`fa-solid ${tab.icon}`} aria-hidden="true" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'submit' && isStudent && (
        <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="space-y-5 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Report Type">
                <select className={inputCls} value={form.type} onChange={(e) => handleChange('type', e.target.value)}>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="final">Final</option>
                </select>
              </Field>
              <Field label="Period Start">
                <input className={inputCls} type="date" value={form.periodStart} onChange={(e) => handleChange('periodStart', e.target.value)} />
              </Field>
              <Field label="Period End">
                <input className={inputCls} type="date" value={form.periodEnd} onChange={(e) => handleChange('periodEnd', e.target.value)} />
              </Field>
            </div>

            {form.type === 'weekly' && (
              <Field label="Week Number">
                <input className={inputCls} type="number" min="1" max="52" value={form.week} onChange={(e) => handleChange('week', e.target.value)} />
              </Field>
            )}

            <Field label="Title">
              <input className={inputCls} value={form.title} onChange={(e) => handleChange('title', e.target.value)} placeholder="Frontend auth flow implementation report" />
            </Field>

            <Field label="Progress Summary">
              <textarea className={areaCls} value={form.content} onChange={(e) => handleChange('content', e.target.value)} placeholder="Summarize completed tasks, technical decisions, and outcomes." />
            </Field>

            <div className="grid gap-4 lg:grid-cols-2">
              <Field label="Challenges">
                <textarea className={areaCls} value={form.challenges} onChange={(e) => handleChange('challenges', e.target.value)} placeholder="Mention blockers, dependencies, or areas where support is needed." />
              </Field>
              <Field label="Next Steps">
                <textarea className={areaCls} value={form.nextSteps} onChange={(e) => handleChange('nextSteps', e.target.value)} placeholder="List the next actions for the following period." />
              </Field>
            </div>
          </section>

          <aside className="space-y-4 rounded-3xl border border-white/10 bg-slate-950/35 p-5">
            <Field label="Attachments">
              <input
                className={inputCls}
                type="file"
                multiple
                onChange={(e) => handleChange('attachments', e.target.files)}
              />
            </Field>
            <p className="text-sm leading-6 text-slate-400">
              Attach screenshots, documents, spreadsheets, PDFs, or supporting evidence for the reporting period.
            </p>
            <button disabled={saving} className="w-full rounded-xl bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60">
              {saving ? 'Submitting...' : 'Submit Report'}
            </button>
          </aside>
        </form>
      )}

      {activeTab === 'ai' && isStudent && (
        <form onSubmit={handleGenerateAi} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="space-y-5 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <Field label="Report Type">
              <select className={inputCls} value={aiForm.type} onChange={(e) => setAiForm((current) => ({ ...current, type: e.target.value }))}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="final">Final</option>
              </select>
            </Field>
            <Field label="Raw Notes">
              <textarea className={areaCls} value={aiForm.notes} onChange={(e) => setAiForm((current) => ({ ...current, notes: e.target.value }))} placeholder="Paste rough notes or bullet points from your work session." />
            </Field>
            <Field label="Achievements">
              <textarea className={areaCls} value={aiForm.achievements} onChange={(e) => setAiForm((current) => ({ ...current, achievements: e.target.value }))} placeholder="What shipped, improved, or got clarified?" />
            </Field>
          </section>
          <aside className="space-y-5 rounded-3xl border border-white/10 bg-slate-950/35 p-5">
            <Field label="Blockers">
              <textarea className={areaCls} value={aiForm.blockers} onChange={(e) => setAiForm((current) => ({ ...current, blockers: e.target.value }))} />
            </Field>
            <Field label="Planned Next Steps">
              <textarea className={areaCls} value={aiForm.nextSteps} onChange={(e) => setAiForm((current) => ({ ...current, nextSteps: e.target.value }))} />
            </Field>
            <button disabled={aiLoading} className="w-full rounded-xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-60">
              {aiLoading ? 'Generating...' : 'Generate Draft'}
            </button>
          </aside>
        </form>
      )}

      {activeTab === 'review' && !isStudent && (
        <section className="space-y-4">
          {reviewQueue.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center text-slate-400">No reports are waiting for review.</div>
          ) : reviewQueue.map((report) => (
            <ReportRow
              key={report._id}
              report={report}
              onOpen={setSelectedReport}
              onReview={openReview}
            />
          ))}
        </section>
      )}

      {activeTab === 'history' && (
        <section className="space-y-5">
          {!isStudent && (
            <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 md:grid-cols-[minmax(0,1fr)_180px_180px]">
              <input className={inputCls} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by student, title, or report content" />
              <select className={inputCls} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="all">All Types</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="final">Final</option>
              </select>
              <select className={inputCls} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="reviewed">Reviewed</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          )}

          {historyReports.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center text-slate-400">No reports found.</div>
          ) : historyReports.map((report) => (
            <ReportRow
              key={report._id}
              report={report}
              onOpen={setSelectedReport}
              onReview={!isStudent && (report.status === 'pending' || report.status === 'reviewed') ? openReview : null}
            />
          ))}
        </section>
      )}

      {selectedReport && (
        <ReportDetailModal report={selectedReport} onClose={() => setSelectedReport(null)} />
      )}

      {reviewReport && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <section className="w-full max-w-xl rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-white">Review Report</h2>
                <p className="mt-1 text-sm text-slate-400">{reviewReport.title}</p>
              </div>
              <button type="button" onClick={() => setReviewReport(null)} className="rounded-xl border border-white/10 px-3 py-2 text-slate-300 hover:bg-white/10">
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            </div>
            <div className="space-y-4">
              <Field label="Score">
                <input className={inputCls} type="number" min="0" max="100" value={reviewForm.score} onChange={(e) => setReviewForm((current) => ({ ...current, score: e.target.value }))} />
              </Field>
              <Field label="Feedback">
                <textarea className={areaCls} value={reviewForm.feedback} onChange={(e) => setReviewForm((current) => ({ ...current, feedback: e.target.value }))} placeholder="Write actionable feedback for the student." />
              </Field>
              <div className="grid gap-3 sm:grid-cols-3">
                <button disabled={saving} type="button" onClick={() => handleReview('review')} className="rounded-xl border border-sky-400/20 bg-sky-500/10 px-4 py-3 text-sm font-black text-sky-200 hover:bg-sky-500/20">Reviewed</button>
                <button disabled={saving} type="button" onClick={() => handleReview('reject')} className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm font-black text-rose-200 hover:bg-rose-500/20">Reject</button>
                <button disabled={saving} type="button" onClick={() => handleReview('approve')} className="rounded-xl bg-emerald-400 px-4 py-3 text-sm font-black text-slate-950 hover:bg-emerald-300">Approve</button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function ReportRow({ report, onOpen, onReview }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 transition hover:border-cyan-400/25">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <ReportBadge value={report.type} styles={typeStyles} />
            <ReportBadge value={report.status} styles={statusStyles} />
            {Number.isFinite(Number(report.score)) && (
              <span className="rounded-full border border-white/10 bg-slate-950/40 px-3 py-1 text-[0.68rem] font-black uppercase tracking-[0.14em] text-slate-300">
                {report.score}%
              </span>
            )}
          </div>
          <h3 className="mt-3 text-lg font-black text-white">{report.title}</h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">{report.content}</p>
          <div className="mt-4 flex flex-wrap gap-4 text-xs font-bold text-slate-500">
            <span><i className="fa-solid fa-user mr-2" aria-hidden="true" />{fullName(report.intern)}</span>
            <span><i className="fa-solid fa-calendar mr-2" aria-hidden="true" />{formatDate(report.periodStart)} - {formatDate(report.periodEnd)}</span>
            <span><i className="fa-solid fa-paperclip mr-2" aria-hidden="true" />{report.attachments?.length || 0} attachments</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => onOpen(report)} className="rounded-xl border border-white/10 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-300 hover:bg-white/10 hover:text-white">
            View
          </button>
          {onReview && (
            <button type="button" onClick={() => onReview(report)} className="rounded-xl bg-cyan-400 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-950 hover:bg-cyan-300">
              Review
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function ReportDetailModal({ report, onClose }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <section className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap gap-2">
              <ReportBadge value={report.type} styles={typeStyles} />
              <ReportBadge value={report.status} styles={statusStyles} />
            </div>
            <h2 className="mt-3 text-2xl font-black text-white">{report.title}</h2>
            <p className="mt-1 text-sm text-slate-400">{fullName(report.intern)} submitted on {formatDate(report.createdAt)}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-white/10 px-3 py-2 text-slate-300 hover:bg-white/10">
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>

        {[
          ['Progress Summary', report.content],
          ['Challenges', report.challenges || 'No challenges recorded.'],
          ['Next Steps', report.nextSteps || 'No next steps recorded.'],
          ['Supervisor Feedback', report.feedback || 'No feedback yet.'],
        ].map(([label, value]) => (
          <section key={label} className="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <h3 className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</h3>
            <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-300">{value}</p>
          </section>
        ))}

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <h3 className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Attachments</h3>
          {report.attachments?.length ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {report.attachments.map((file) => (
                <a
                  key={`${file.url}-${file.name}`}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950/40 p-3 text-sm font-bold text-slate-200 hover:border-cyan-400/30 hover:text-cyan-200"
                  href={getAssetUrl(file.url)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <i className="fa-solid fa-paperclip text-cyan-300" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate">{file.name}</span>
                </a>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-400">No attachments were added.</p>
          )}
        </section>
      </section>
    </div>
  );
}
