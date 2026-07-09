import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import Loader from '../components/Loader';
import { studentProjectService } from '../../services/studentProjectService';
import { API_ORIGIN } from '../../config/apiConfig';

const EMPTY_FORM = {
  title: '',
  theme: '',
  abstract: '',
  problemStatement: '',
  objectives: '',
  methodology: '2TUP / UML',
  technologies: '',
  academicSupervisor: '',
  companySupervisor: '',
  attachments: [],
};

const normalizeRole = (role) => String(role || '').toLowerCase();
const fullName = (user) => [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'Student';
const formatDate = (value) => value ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not set';

const getAssetUrl = (url) => {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_ORIGIN}${url}`;
};

const statusStyles = {
  submitted: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
  approved: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-300',
  rejected: 'border-rose-500/20 bg-rose-500/10 text-rose-300',
  in_progress: 'border-blue-500/20 bg-blue-500/10 text-blue-300',
  completed: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
};

const timelineStyles = {
  pending: 'border-slate-500/20 bg-slate-500/10 text-slate-300',
  in_progress: 'border-blue-500/20 bg-blue-500/10 text-blue-300',
  submitted: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
  completed: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
};

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function Badge({ value, styles = statusStyles }) {
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-[0.68rem] font-black uppercase tracking-[0.14em] ${styles[value] || styles.submitted}`}>
      {String(value || 'submitted').replace('_', ' ')}
    </span>
  );
}

export default function ManageStudentProjects({ dashboardRoles }) {
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
  const isAdmin = roles.includes('admin') || roles.includes('superadmin') || roles.includes('manager');
  const isStudent = roles.includes('student') || !roles.length;

  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [activeTab, setActiveTab] = useState(isStudent ? 'submit' : 'validation');
  const [statusFilter, setStatusFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [validationForm, setValidationForm] = useState({ feedback: '', startDate: '', endDate: '' });

  const inputCls = 'w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/60';
  const areaCls = `${inputCls} min-h-[115px] resize-y leading-6`;

  const fetchProjects = async () => {
    try {
      const data = await studentProjectService.getProjects();
      setProjects(data || []);
      if (selectedProject) {
        const fresh = (data || []).find((item) => item._id === selectedProject._id);
        if (fresh) setSelectedProject(fresh);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load projects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const metrics = useMemo(() => ({
    total: projects.length,
    submitted: projects.filter((project) => project.status === 'submitted').length,
    approved: projects.filter((project) => project.status === 'approved' || project.status === 'in_progress').length,
    completed: projects.filter((project) => project.status === 'completed').length,
  }), [projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const haystack = [project.title, project.theme, project.abstract, fullName(project.student), project.student?.email].filter(Boolean).join(' ').toLowerCase();
      return (statusFilter === 'all' || project.status === statusFilter) && haystack.includes(query.toLowerCase());
    });
  }, [projects, query, statusFilter]);

  const validationQueue = useMemo(() => filteredProjects.filter((project) => project.status === 'submitted'), [filteredProjects]);

  const handleFormChange = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.title.trim() || !form.theme.trim()) {
      toast.warning('Project title and theme are required.');
      return;
    }

    setSaving(true);
    try {
      await studentProjectService.createProject(form);
      toast.success('Project submitted for admin validation.');
      setForm(EMPTY_FORM);
      setActiveTab('history');
      await fetchProjects();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit project.');
    } finally {
      setSaving(false);
    }
  };

  const handleValidate = async (project, action) => {
    if (action === 'reject' && !validationForm.feedback.trim()) {
      toast.warning('Feedback is required when rejecting a project.');
      return;
    }

    setSaving(true);
    try {
      const updated = await studentProjectService.validateProject(project._id, { ...validationForm, action });
      toast.success(action === 'approve' ? 'Project validated and timeline created.' : 'Project rejected with feedback.');
      setSelectedProject(updated);
      setValidationForm({ feedback: '', startDate: '', endDate: '' });
      await fetchProjects();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to validate project.');
    } finally {
      setSaving(false);
    }
  };

  const updateTimeline = async (projectId, itemId, status) => {
    setSaving(true);
    try {
      const updated = await studentProjectService.updateTimelineItem(projectId, itemId, { status });
      setSelectedProject(updated);
      setProjects((current) => current.map((project) => project._id === updated._id ? updated : project));
      toast.success('Timeline updated.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update timeline.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6 pb-12">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Projects', metrics.total, 'fa-folder-tree', 'text-cyan-300'],
          ['Awaiting validation', metrics.submitted, 'fa-clock', 'text-amber-300'],
          ['Active timelines', metrics.approved, 'fa-timeline', 'text-blue-300'],
          ['Completed', metrics.completed, 'fa-circle-check', 'text-emerald-300'],
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

      <div className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-white/[0.035] p-2">
        {(isStudent ? [['submit', 'Submit Project'], ['history', 'My Projects']] : [['validation', 'Validation Queue'], ['history', 'All Projects']]).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`rounded-xl px-4 py-2 text-sm font-black transition ${activeTab === id ? 'bg-cyan-400 text-slate-950' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'submit' && (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <div className="grid gap-4 lg:grid-cols-2">
            <Field label="Project title">
              <input className={inputCls} value={form.title} onChange={(event) => handleFormChange('title', event.target.value)} placeholder="Conception and implementation of..." />
            </Field>
            <Field label="Theme / case study">
              <input className={inputCls} value={form.theme} onChange={(event) => handleFormChange('theme', event.target.value)} placeholder="School communication and scheduling system" />
            </Field>
            <Field label="Academic supervisor">
              <input className={inputCls} value={form.academicSupervisor} onChange={(event) => handleFormChange('academicSupervisor', event.target.value)} />
            </Field>
            <Field label="Company supervisor">
              <input className={inputCls} value={form.companySupervisor} onChange={(event) => handleFormChange('companySupervisor', event.target.value)} />
            </Field>
            <Field label="Methodology">
              <input className={inputCls} value={form.methodology} onChange={(event) => handleFormChange('methodology', event.target.value)} />
            </Field>
            <Field label="Technologies">
              <input className={inputCls} value={form.technologies} onChange={(event) => handleFormChange('technologies', event.target.value)} placeholder="Node.js, MongoDB, Flutter, IoT" />
            </Field>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Field label="Abstract">
              <textarea className={areaCls} value={form.abstract} onChange={(event) => handleFormChange('abstract', event.target.value)} />
            </Field>
            <Field label="Problem statement">
              <textarea className={areaCls} value={form.problemStatement} onChange={(event) => handleFormChange('problemStatement', event.target.value)} />
            </Field>
          </div>

          <div className="mt-4">
            <Field label="Objectives">
              <textarea className={areaCls} value={form.objectives} onChange={(event) => handleFormChange('objectives', event.target.value)} />
            </Field>
          </div>

          <div className="mt-4">
            <Field label="Project document">
              <input className={inputCls} type="file" multiple onChange={(event) => handleFormChange('attachments', event.target.files)} />
            </Field>
          </div>

          <div className="mt-5 flex justify-end">
            <button type="submit" disabled={saving} className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60">
              {saving ? 'Submitting...' : 'Submit Project'}
            </button>
          </div>
        </form>
      )}

      {(activeTab === 'validation' || activeTab === 'history') && (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)]">
          <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="mb-4 grid gap-3 md:grid-cols-[1fr_190px]">
              <input className={inputCls} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by student, title, or theme" />
              <select className={inputCls} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                {['all', 'submitted', 'approved', 'in_progress', 'completed', 'rejected'].map((status) => (
                  <option key={status} value={status}>{status.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div className="space-y-3">
              {(activeTab === 'validation' ? validationQueue : filteredProjects).map((project) => (
                <button
                  key={project._id}
                  type="button"
                  onClick={() => setSelectedProject(project)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${selectedProject?._id === project._id ? 'border-cyan-300/40 bg-cyan-400/10' : 'border-white/10 bg-slate-950/35 hover:border-white/20 hover:bg-white/[0.06]'}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-black text-white">{project.title}</h3>
                      <p className="mt-1 text-sm text-slate-400">{project.theme}</p>
                      <p className="mt-2 text-xs font-bold text-slate-500">{fullName(project.student)} • {formatDate(project.createdAt)}</p>
                    </div>
                    <Badge value={project.status} />
                  </div>
                </button>
              ))}
              {(activeTab === 'validation' ? validationQueue : filteredProjects).length === 0 && (
                <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm font-semibold text-slate-500">No projects found.</div>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            {!selectedProject ? (
              <div className="grid min-h-[360px] place-items-center rounded-2xl border border-dashed border-white/10 text-center">
                <div>
                  <i className="fa-solid fa-diagram-project text-3xl text-slate-600" aria-hidden="true" />
                  <p className="mt-3 text-sm font-bold text-slate-500">Select a project to review its document, validation state, and timeline.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-black text-white">{selectedProject.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{selectedProject.theme}</p>
                  </div>
                  <Badge value={selectedProject.status} />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {[
                    ['Student', fullName(selectedProject.student)],
                    ['Academic supervisor', selectedProject.academicSupervisor || 'Not set'],
                    ['Company supervisor', selectedProject.companySupervisor || 'Not set'],
                    ['Methodology', selectedProject.methodology || 'Not set'],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl border border-white/10 bg-slate-950/35 p-3">
                      <span className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-slate-500">{label}</span>
                      <strong className="mt-1 block text-sm text-white">{value}</strong>
                    </div>
                  ))}
                </div>

                {(selectedProject.abstract || selectedProject.problemStatement || selectedProject.objectives) && (
                  <div className="space-y-3">
                    {[
                      ['Abstract', selectedProject.abstract],
                      ['Problem statement', selectedProject.problemStatement],
                      ['Objectives', selectedProject.objectives],
                    ].filter(([, value]) => value).map(([label, value]) => (
                      <article key={label} className="rounded-xl border border-white/10 bg-slate-950/35 p-4">
                        <h4 className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</h4>
                        <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-300">{value}</p>
                      </article>
                    ))}
                  </div>
                )}

                {selectedProject.attachments?.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-black text-white">Documents</h3>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {selectedProject.attachments.map((file) => (
                        <a key={file.url} href={getAssetUrl(file.url)} target="_blank" rel="noreferrer" className="rounded-xl border border-white/10 bg-slate-950/35 p-3 text-sm font-bold text-cyan-200 hover:border-cyan-300/30">
                          <i className="fa-solid fa-paperclip mr-2" aria-hidden="true" />
                          {file.name}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {isAdmin && selectedProject.status === 'submitted' && (
                  <div className="rounded-2xl border border-cyan-300/15 bg-cyan-400/5 p-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      <Field label="Timeline start">
                        <input className={inputCls} type="date" value={validationForm.startDate} onChange={(event) => setValidationForm((current) => ({ ...current, startDate: event.target.value }))} />
                      </Field>
                      <Field label="Timeline end">
                        <input className={inputCls} type="date" value={validationForm.endDate} onChange={(event) => setValidationForm((current) => ({ ...current, endDate: event.target.value }))} />
                      </Field>
                    </div>
                    <div className="mt-3">
                      <Field label="Validation feedback">
                        <textarea className={`${areaCls} min-h-[90px]`} value={validationForm.feedback} onChange={(event) => setValidationForm((current) => ({ ...current, feedback: event.target.value }))} />
                      </Field>
                    </div>
                    <div className="mt-4 flex flex-wrap justify-end gap-2">
                      <button type="button" disabled={saving} onClick={() => handleValidate(selectedProject, 'reject')} className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm font-black text-rose-200 disabled:opacity-60">Reject</button>
                      <button type="button" disabled={saving} onClick={() => handleValidate(selectedProject, 'approve')} className="rounded-xl bg-cyan-400 px-4 py-3 text-sm font-black text-slate-950 disabled:opacity-60">Validate & Create Timeline</button>
                    </div>
                  </div>
                )}

                {selectedProject.timeline?.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-sm font-black uppercase tracking-[0.16em] text-slate-500">School project timeline</h3>
                    <div className="space-y-3">
                      {selectedProject.timeline.sort((a, b) => a.order - b.order).map((item) => (
                        <article key={item._id} className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <h4 className="font-black text-white">{item.order}. {item.title}</h4>
                              <p className="mt-1 text-sm leading-6 text-slate-400">{item.description}</p>
                              <p className="mt-2 text-xs font-bold text-slate-500">Due {formatDate(item.dueDate)}</p>
                            </div>
                            <Badge value={item.status} styles={timelineStyles} />
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {['pending', 'in_progress', 'submitted', 'completed'].map((status) => (
                              <button
                                key={status}
                                type="button"
                                disabled={saving || item.status === status}
                                onClick={() => updateTimeline(selectedProject._id, item._id, status)}
                                className="rounded-lg border border-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-slate-300 transition hover:border-cyan-300/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                {status.replace('_', ' ')}
                              </button>
                            ))}
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
