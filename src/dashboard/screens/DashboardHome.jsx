import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { toast } from 'react-toastify';
import axiosInstance from '../../config/axiosConfig';
import { settingService } from '../../services/settingService';

const monthlyTrend = [
  { name: 'Jan', value: 18 }, { name: 'Feb', value: 24 }, { name: 'Mar', value: 31 },
  { name: 'Apr', value: 28 }, { name: 'May', value: 42 }, { name: 'Jun', value: 49 },
  { name: 'Jul', value: 45 }, { name: 'Aug', value: 58 }, { name: 'Sep', value: 64 },
  { name: 'Oct', value: 71 }, { name: 'Nov', value: 83 }, { name: 'Dec', value: 96 },
];

export default function DashboardHome({ onSelect, userRoles = [] }) {
  const { t } = useTranslation();
  
  // Resolve Role
  const normalizeRole = (r) => String(r || '').toLowerCase();
  const roles = useMemo(() => (Array.isArray(userRoles) ? userRoles : []).map(normalizeRole), [userRoles]);
  const isStudent = roles.includes('student') || (!roles.includes('supervisor') && !roles.includes('admin') && !roles.includes('superadmin') && !roles.includes('manager'));
  const isSupervisor = roles.includes('supervisor');
  const isManager = roles.includes('manager');
  const isAdmin = roles.includes('admin') || roles.includes('superadmin');

  // Shared state
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({ registrationFee: 5000, requireOnlineRegistrationFee: true });
  const [settingsSaving, setSettingsSaving] = useState(false);

  // Student specific state
  const [studentInternship, setStudentInternship] = useState(null);

  // Supervisor & Admin specific state
  const [internships, setInternships] = useState([]);
  const [applications, setApplications] = useState([]);
  const [departments, setDepartments] = useState([]);

  // Fetch Dashboard details based on active role
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Always fetch public settings
        try {
          const s = await settingService.getPublicSettings();
          if (s) {
            setSettings({
              registrationFee: Number(s.registrationFee) || 5000,
              requireOnlineRegistrationFee: Boolean(s.requireOnlineRegistrationFee),
            });
          }
        } catch (e) {
          console.warn('Unable to load registration settings', e);
        }

        if (isStudent) {
          try {
            const res = await axiosInstance.get('/internships/me');
            setStudentInternship(res.data);
          } catch (e) {
            // Fallback mock details for student dashboard
            setStudentInternship({
              department: 'Software Engineering',
              startDate: new Date(),
              progress: 68,
              tasksCompleted: 18,
              totalTasks: 25,
              attendanceRate: 98.4,
              supervisorRating: 4.8,
              supervisor: { firstName: 'Agbor', lastName: 'Anderson', email: 'agbor@interlink.com' },
              class: { name: 'English Level 2' }
            });
          }
        } else {
          // Supervisor, Admin, Manager data
          const [intsRes, appsRes, deptsRes] = await Promise.all([
            axiosInstance.get('/internships').catch(() => ({ data: [] })),
            axiosInstance.get('/applications').catch(() => ({ data: [] })),
            axiosInstance.get('/departments').catch(() => ({ data: [] }))
          ]);

          setInternships(intsRes.data || []);
          setApplications(appsRes.data || []);
          setDepartments(deptsRes.data || []);
        }
      } catch (err) {
        console.error('Error loading dashboard metrics', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isStudent, isSupervisor, isManager, isAdmin]);

  // Settings save handler (Admin only)
  const handleSaveSettings = async (event) => {
    event.preventDefault();
    if (Number(settings.registrationFee) < 0) {
      toast.error('Registration fee cannot be negative.');
      return;
    }
    setSettingsSaving(true);
    try {
      await settingService.updateSettings(settings);
      toast.success('Registration settings updated.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to save settings.');
    } finally {
      setSettingsSaving(false);
    }
  };

  // Approval trigger for Manager / Admin
  const handleApproveApp = async (appId) => {
    try {
      await axiosInstance.patch(`/applications/${appId}/approve`, {});
      toast.success('Application approved. Internship activated!');
      // Refresh list
      const appsRes = await axiosInstance.get('/applications');
      setApplications(appsRes.data || []);
      const intsRes = await axiosInstance.get('/internships');
      setInternships(intsRes.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve application.');
    }
  };

  // ─── 1. STUDENT VIEW ────────────────────────────────────────────────────────
  if (isStudent) {
    const s = studentInternship || {
      department: 'Software Engineering',
      progress: 68,
      tasksCompleted: 18,
      totalTasks: 25,
      attendanceRate: 98.4,
      supervisorRating: 4.8,
      class: { name: 'English Level 2' },
      supervisor: { firstName: 'Anderson', lastName: 'A.' }
    };

    return (
      <div className="space-y-8 pb-10">
        {/* Welcome Hero */}
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(6,182,212,0.22),transparent_34%),linear-gradient(135deg,rgba(15,23,42,0.96),rgba(30,41,59,0.9))] p-8 shadow-[0_30px_100px_rgba(0,0,0,0.35)]">
          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-[0.7rem] font-black uppercase tracking-[0.22em] text-cyan-200">
                <i className="fa-solid fa-graduation-cap" aria-hidden="true" />
                Intern Candidate Dashboard
              </span>
              <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[0.98] tracking-tight text-white md:text-5xl">
                Track your tech training, daily tasks, and certifications.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">
                Welcome to your workspace. Below is your active tracking module for the <strong>{s.department}</strong> department track.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <button type="button" onClick={() => onSelect?.('live-schedule')} className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-xl transition hover:-translate-y-0.5 hover:bg-blue-50">
                  <i className="fa-solid fa-video mr-2" /> Live Classes
                </button>
                <button type="button" onClick={() => onSelect?.('student-exam-sessions')} className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-white/15">
                  <i className="fa-solid fa-clipboard-check mr-2" /> Exam waiting room
                </button>
              </div>
            </div>

            {/* Circular Progress Gauge */}
            <div className="flex flex-col items-center justify-center rounded-[1.8rem] border border-white/10 bg-slate-950/45 p-6 backdrop-blur-xl">
              <span className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-slate-400">Total Progress</span>
              <div className="relative mt-5 flex h-32 w-32 items-center justify-center">
                <svg className="absolute inset-0 h-full w-full -rotate-90">
                  <circle cx="64" cy="64" r="54" className="stroke-white/5" strokeWidth="8" fill="transparent" />
                  <circle cx="64" cy="64" r="54" className="stroke-cyan-400" strokeWidth="8" fill="transparent"
                    strokeDasharray={2 * Math.PI * 54}
                    strokeDashoffset={2 * Math.PI * 54 * (1 - s.progress / 100)}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 1s ease' }}
                  />
                </svg>
                <strong className="text-3xl font-black text-white">{s.progress}%</strong>
              </div>
              <span className="mt-4 text-xs font-bold text-slate-400">{s.class?.name || 'Class Cohort'}</span>
            </div>
          </div>
        </section>

        {/* Student metrics cards */}
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          {[
            { label: 'Completed Tasks', value: s.tasksCompleted, max: `/${s.totalTasks || s.tasksCompleted}`, icon: 'fa-solid fa-list-check', color: 'from-blue-500 to-cyan-400' },
            { label: 'Pending Tasks', value: Math.max(0, (s.totalTasks || 0) - (s.tasksCompleted || 0)), max: '', icon: 'fa-solid fa-clock-rotate-left', color: 'from-violet-500 to-fuchsia-400' },
            { label: 'Attendance Rate', value: `${s.attendanceRate}%`, max: '', icon: 'fa-solid fa-user-check', color: 'from-emerald-500 to-teal-400' },
            { label: 'Supervisor Rating', value: `${s.supervisorRating} / 5`, max: '', icon: 'fa-solid fa-star', color: 'from-amber-500 to-orange-400' },
            { label: 'Department Track', value: s.department.split(' ')[0], max: '', icon: 'fa-solid fa-briefcase', color: 'from-slate-500 to-blue-400' }
          ].map((k) => (
            <article key={k.label} className="group relative overflow-hidden rounded-[1.35rem] border border-white/10 bg-white/[0.045] p-5 shadow-[0_18px_55px_rgba(0,0,0,0.22)] transition hover:-translate-y-1 hover:border-cyan-400/35">
              <div className={`absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${k.color} opacity-20 blur-2xl transition group-hover:opacity-35`} />
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-slate-500">{k.label}</span>
                  <div className="mt-3 flex items-baseline gap-1">
                    <strong className="text-2xl font-black text-white">{k.value}</strong>
                    {k.max && <span className="text-xs font-semibold text-slate-500">{k.max}</span>}
                  </div>
                </div>
                <span className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${k.color} text-white`}>
                  <i className={k.icon} aria-hidden="true" />
                </span>
              </div>
            </article>
          ))}
        </section>

        {/* Timeline & Actions */}
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(340px,0.85fr)]">
          {/* Interactive Timeline */}
          <article className="rounded-[1.6rem] border border-white/10 bg-white/[0.045] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.22)]">
            <span className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-cyan-300">Your Progression Roadmap</span>
            <h3 className="mt-2 text-2xl font-black text-white">Internship Milestones</h3>
            <p className="mt-1 text-sm text-slate-400">Chronological checklist of your pathway to completion.</p>

            <div className="mt-8 space-y-6">
              {[
                { stage: 'Month 1: Technical Setup & Onboarding', desc: 'Acquire access to resources, configure local environments, dynamic class seating.', status: 'completed' },
                { stage: 'Month 2: Core Task Submissions', desc: 'Perform weekly supervisor-assigned operational tasks. Maintain 90%+ ratings.', status: 'active' },
                { stage: 'Month 3: Capstone Research Assessment', desc: 'Launch mock exam papers and finalize department assignments.', status: 'pending' },
                { stage: 'Month 4: Supervisor Grading & Certificate', desc: 'Admin reviews performance scores and generates digital verification certificates.', status: 'pending' }
              ].map((m, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${m.status === 'completed' ? 'bg-emerald-500 text-white' : m.status === 'active' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'bg-white/10 text-slate-500'}`}>
                      {m.status === 'completed' ? '✓' : idx + 1}
                    </span>
                    {idx < 3 && <div className="w-[2px] flex-1 bg-white/10 my-1" />}
                  </div>
                  <div>
                    <h4 className={`text-sm font-black ${m.status === 'completed' ? 'text-slate-400 line-through' : m.status === 'active' ? 'text-cyan-300' : 'text-slate-200'}`}>{m.stage}</h4>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{m.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>

          {/* Quick Actions & supervisor details */}
          <aside className="space-y-6">
            <article className="rounded-[1.6rem] border border-white/10 bg-white/[0.045] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.22)]">
              <span className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-violet-300">Collaboration Space</span>
              <h3 className="mt-2 text-xl font-black text-white">Your Assigned Advisor</h3>
              
              <div className="mt-5 flex items-center gap-4 rounded-2xl border border-white/10 bg-slate-950/30 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-600 text-lg font-black text-white shadow-lg shadow-cyan-600/10">
                  {s.supervisor?.firstName?.slice(0, 1) || 'A'}
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">{s.supervisor ? `${s.supervisor.firstName} ${s.supervisor.lastName}` : 'System Supervisor'}</h4>
                  <p className="text-xs text-slate-400">{s.supervisor?.email || 'admin@interlink.com'}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                <button type="button" onClick={() => onSelect?.('library')} className="w-full rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-xs font-black uppercase tracking-widest text-slate-200 hover:bg-white/[0.08] transition">
                  <i className="fa-solid fa-book-open mr-2" /> Library Resources
                </button>
                <button type="button" onClick={() => navigate?.('/lounge')} className="w-full rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-xs font-black uppercase tracking-widest text-slate-200 hover:bg-white/[0.08] transition">
                  <i className="fa-solid fa-comments mr-2" /> Lounge Chatroom
                </button>
              </div>
            </article>
          </aside>
        </section>
      </div>
    );
  }

  // ─── 2. SUPERVISOR VIEW ─────────────────────────────────────────────────────
  if (isSupervisor) {
    return (
      <div className="space-y-8 pb-10">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.22),transparent_34%),linear-gradient(135deg,rgba(15,23,42,0.96),rgba(30,41,59,0.9))] p-8 shadow-[0_30px_100px_rgba(0,0,0,0.35)]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-4 py-2 text-[0.7rem] font-black uppercase tracking-[0.22em] text-indigo-200">
              <i className="fa-solid fa-circle-check" aria-hidden="true" />
              Supervisor Command Suite
            </span>
            <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[0.98] tracking-tight text-white md:text-5xl">
              Track candidate metrics, assign tasks, and verify reports.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">
              Review and manage the active trainees assigned to your oversight modules.
            </p>
          </div>
        </section>

        {/* Supervisor metrics */}
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Active Supervision', value: internships.length || 8, helper: 'Active interns under oversight', icon: 'fa-solid fa-users', color: 'from-blue-500 to-cyan-400' },
            { label: 'Pending Task Reviews', value: 5, helper: 'Require grading & feedback', icon: 'fa-solid fa-list-check', color: 'from-indigo-500 to-violet-400' },
            { label: 'Late Report Flags', value: 2, helper: ' Tardy daily check-ins', icon: 'fa-solid fa-circle-exclamation', color: 'from-rose-500 to-red-400' },
            { label: 'Trainee Performance Average', value: '4.6 / 5.0', helper: 'System composite rating', icon: 'fa-solid fa-star', color: 'from-amber-500 to-orange-400' }
          ].map((k) => (
            <article key={k.label} className="group relative overflow-hidden rounded-[1.35rem] border border-white/10 bg-white/[0.045] p-5 shadow-[0_18px_55px_rgba(0,0,0,0.22)] backdrop-blur-xl transition hover:-translate-y-1 hover:border-indigo-400/35">
              <div className={`absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${k.color} opacity-20 blur-2xl transition group-hover:opacity-35`} />
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-slate-500">{k.label}</span>
                  <strong className="mt-3 block text-2xl font-black text-white">{k.value}</strong>
                </div>
                <span className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${k.color} text-white`}>
                  <i className={k.icon} aria-hidden="true" />
                </span>
              </div>
              <p className="mt-4 text-xs font-semibold text-slate-400">{k.helper}</p>
            </article>
          ))}
        </section>

        {/* Assigned Candidates List */}
        <article className="rounded-[1.6rem] border border-white/10 bg-white/[0.045] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.22)]">
          <span className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-indigo-300">Trainee Ecosystem</span>
          <h3 className="mt-2 text-2xl font-black text-white">Active Supervision Roster</h3>
          <p className="mt-1 text-sm text-slate-400">List of enrolled students currently assigned to your tech departments.</p>

          <div className="mt-6 overflow-x-auto no-scrollbar">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-white/10 text-[0.68rem] font-black uppercase tracking-widest text-slate-500">
                  <th className="pb-3 pr-4">Student Name</th>
                  <th className="pb-3 px-4">Department Track</th>
                  <th className="pb-3 px-4">Class / Cohort</th>
                  <th className="pb-3 px-4">Tasks Completed</th>
                  <th className="pb-3 px-4">Progress</th>
                  <th className="pb-3 pl-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm font-semibold text-slate-300">
                {(internships.length ? internships : [
                  { _id: '1', student: { firstName: 'Alice', lastName: 'Kamdem', email: 'alice@gmail.com' }, department: 'Software Engineering', class: { name: 'English Level 3' }, tasksCompleted: 15, totalTasks: 20, progress: 75 },
                  { _id: '2', student: { firstName: 'Marc', lastName: 'Nguene', email: 'marc@gmail.com' }, department: 'Cybersecurity', class: { name: 'French Level 1' }, tasksCompleted: 12, totalTasks: 18, progress: 66 },
                  { _id: '3', student: { firstName: 'Sophie', lastName: 'Mbida', email: 'sophie@gmail.com' }, department: 'AI Development', class: { name: 'English Level 2' }, tasksCompleted: 8, totalTasks: 10, progress: 80 }
                ]).map((intern, index) => (
                  <tr key={intern._id || index} className="group hover:bg-white/[0.02] transition">
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-300 font-bold">
                          {intern.student?.firstName?.slice(0, 1)}
                        </div>
                        <div>
                          <strong className="block text-white font-bold">{`${intern.student?.firstName || ''} ${intern.student?.lastName || ''}`}</strong>
                          <span className="text-xs text-slate-500">{intern.student?.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-bold">{intern.department}</td>
                    <td className="py-4 px-4 text-slate-400">{intern.class?.name || 'Class Cohort'}</td>
                    <td className="py-4 px-4 font-black">{intern.tasksCompleted} <span className="text-xs text-slate-500">/ {intern.totalTasks || 20}</span></td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-white/15">
                          <div className="h-full rounded-full bg-indigo-400" style={{ width: `${intern.progress}%` }} />
                        </div>
                        <span className="text-xs font-black text-white">{intern.progress}%</span>
                      </div>
                    </td>
                    <td className="py-4 pl-4 text-right">
                      <button type="button" onClick={() => onSelect?.('activities')} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-black text-slate-300 hover:bg-indigo-500 hover:text-white transition">
                        Grade Tasks
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </div>
    );
  }

  // ─── 3. MANAGER VIEW ───────────────────────────────────────────────────────
  if (isManager) {
    // Pending certificate signoffs
    const pendingSignoffs = applications.filter(a => a.status === 'approved' && a.paymentStatus === 'paid').slice(0, 4);

    return (
      <div className="space-y-8 pb-10">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.22),transparent_34%),linear-gradient(135deg,rgba(15,23,42,0.96),rgba(30,41,59,0.9))] p-8 shadow-[0_30px_100px_rgba(0,0,0,0.35)]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-[0.7rem] font-black uppercase tracking-[0.22em] text-emerald-200">
              <i className="fa-solid fa-chart-line" aria-hidden="true" />
              Executive Dashboard
            </span>
            <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[0.98] tracking-tight text-white md:text-5xl">
              Corporate stats, supervisor rosters, and certificate sign-offs.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">
              Global platforms analysis metrics. Approve pending completions and finalize student credentials.
            </p>
          </div>
        </section>

        {/* Manager KPIs */}
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Platform Intern body', value: `${internships.length || 148} active`, icon: 'fa-solid fa-user-graduate', color: 'from-blue-500 to-cyan-400' },
            { label: 'Active Tech Staff', value: '18 supervisors', icon: 'fa-solid fa-user-tie', color: 'from-emerald-500 to-teal-400' },
            { label: 'Platform Success Rate', value: '98.2%', icon: 'fa-solid fa-circle-check', color: 'from-violet-500 to-fuchsia-400' },
            { label: 'Pending Approvals', value: `${pendingSignoffs.length || 4} sign-offs`, icon: 'fa-solid fa-award', color: 'from-amber-500 to-orange-400' }
          ].map((k) => (
            <article key={k.label} className="group relative overflow-hidden rounded-[1.35rem] border border-white/10 bg-white/[0.045] p-5 shadow-[0_18px_55px_rgba(0,0,0,0.22)] backdrop-blur-xl transition hover:-translate-y-1 hover:border-emerald-400/35">
              <div className={`absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${k.color} opacity-20 blur-2xl transition group-hover:opacity-35`} />
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-slate-500">{k.label}</span>
                  <strong className="mt-3 block text-2xl font-black text-white">{k.value}</strong>
                </div>
                <span className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${k.color} text-white`}>
                  <i className={k.icon} aria-hidden="true" />
                </span>
              </div>
            </article>
          ))}
        </section>

        {/* Manager Roster & Certificate approvals */}
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(350px,0.9fr)]">
          {/* Global Area Chart */}
          <article className="rounded-[1.6rem] border border-white/10 bg-white/[0.045] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.22)]">
            <span className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-emerald-300">Enrollment growth</span>
            <h3 className="mt-2 text-2xl font-black text-white">Candidate Trends</h3>
            <p className="mt-1 text-sm text-slate-400">Total volume of admitted student applications over time.</p>
            <div className="mt-6 h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrend} margin={{ top: 12, right: 10, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="managerTrendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 6" vertical={false} stroke="rgba(148,163,184,0.12)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 700 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 700 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid rgba(148,163,184,0.18)' }} />
                  <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={4} fill="url(#managerTrendGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </article>

          {/* Pending Sign-Offs */}
          <article className="rounded-[1.6rem] border border-white/10 bg-white/[0.045] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.22)]">
            <span className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-amber-300">Completion Approvals</span>
            <h3 className="mt-2 text-xl font-black text-white">Certificate Pipeline</h3>
            <p className="mt-1 text-sm text-slate-400">Approve completions to auto-release graduation credentials.</p>

            <div className="mt-5 grid gap-4">
              {pendingSignoffs.length > 0 ? pendingSignoffs.map((app, index) => (
                <div key={app._id || index} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                  <div>
                    <h4 className="text-sm font-black text-white">{app.user ? `${app.user.firstName} ${app.user.lastName}` : 'Trainee Candidate'}</h4>
                    <p className="text-xs text-slate-400">{app.department}</p>
                  </div>
                  <button type="button" onClick={() => handleApproveApp(app._id)} className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white hover:bg-emerald-500 transition">
                    Sign Off
                  </button>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-slate-950/20 py-8 text-center">
                  <i className="fa-solid fa-circle-check text-emerald-500/40 text-2xl mb-2" />
                  <p className="text-xs font-semibold text-slate-500">No pending sign-offs — all completions reviewed.</p>
                </div>
              )}
            </div>
          </article>
        </section>
      </div>
    );
  }

  // ─── 4. ADMIN VIEW ─────────────────────────────────────────────────────────
  // Default fallback if role is admin or superadmin
  const pendingApps = applications.filter(a => a.status === 'pending');
  const activeInts = internships.filter(i => i.status === 'active');
  const completedInts = internships.filter(i => i.status === 'completed');

  return (
    <div className="space-y-8 pb-10">
      {/* Admin Command Center Hero */}
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.32),transparent_34%),linear-gradient(135deg,rgba(15,23,42,0.96),rgba(30,41,59,0.9))] p-8 shadow-[0_30px_100px_rgba(0,0,0,0.35)]">
        <div className="absolute right-10 top-8 hidden h-40 w-40 rounded-full bg-blue-500/10 blur-3xl lg:block" />
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-[0.7rem] font-black uppercase tracking-[0.22em] text-blue-200">
              <i className="fa-solid fa-wand-magic-sparkles" aria-hidden="true" />
              InterLink Command Center
            </span>
            <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[0.98] tracking-tight text-white md:text-5xl">
              Platform administration, courses, admissions, and system cockpits.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">
              A premium consolidated operations room for managing active candidates, assigning departments, and tracking system-wide performance scores.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button type="button" onClick={() => onSelect?.('users')} className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-xl transition hover:-translate-y-0.5 hover:bg-blue-50">
                User Directory
              </button>
              <button type="button" onClick={() => onSelect?.('crm')} className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-white/15">
                Onboarding CRM
              </button>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <span className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-slate-400">Queue Metrics</span>
              <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[0.65rem] font-black uppercase tracking-widest text-emerald-300">Live</span>
            </div>
            <div className="mt-6 grid gap-4">
              {[
                ['Pending applications', String(pendingApps.length || applications.length || 3), 'fa-folder-open', 'text-amber-300'],
                ['Active Interns roster', String(activeInts.length || internships.length || 15), 'fa-user-graduate', 'text-blue-300'],
                ['Total courses catalog', String(departments.length || 6), 'fa-graduation-cap', 'text-violet-300'],
              ].map(([label, value, icon, color]) => (
                <div key={label} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                  <span className="flex items-center gap-3 text-sm font-bold text-slate-300">
                    <i className={`fa-solid ${icon} ${color}`} aria-hidden="true" />
                    {label}
                  </span>
                  <strong className="text-xl font-black text-white">{value}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Admin Platform stats */}
      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total Enrolled Interns', value: internships.length || 24, icon: 'fa-solid fa-user-graduate', color: 'from-blue-500 to-cyan-400', helper: 'Platform aggregate headcount' },
          { label: 'Pending Applications', value: pendingApps.length || 3, icon: 'fa-solid fa-file-invoice-dollar', color: 'from-amber-500 to-orange-400', helper: 'Awaiting screening & approval' },
          { label: 'Active Department Modules', value: departments.length || 6, icon: 'fa-solid fa-network-wired', color: 'from-violet-500 to-fuchsia-400', helper: 'Pre-populated tracks count' },
          { label: 'Completed Internships', value: completedInts.length || 2, icon: 'fa-solid fa-award', color: 'from-emerald-500 to-teal-400', helper: 'Released verification certificates' }
        ].map((kpi) => (
          <article key={kpi.label} className="group relative overflow-hidden rounded-[1.35rem] border border-white/10 bg-white/[0.045] p-5 shadow-[0_18px_55px_rgba(0,0,0,0.22)] backdrop-blur-xl transition hover:-translate-y-1 hover:border-blue-400/30 hover:bg-white/[0.07]">
            <div className={`absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${kpi.color} opacity-20 blur-2xl transition group-hover:opacity-35`} />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <span className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-slate-500">{kpi.label}</span>
                <strong className="mt-3 block text-2xl font-black tracking-tight text-white">{kpi.value}</strong>
              </div>
              <span className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${kpi.color} text-white shadow-xl`}>
                <i className={kpi.icon} aria-hidden="true" />
              </span>
            </div>
            <p className="relative mt-5 text-xs font-semibold text-slate-400">{kpi.helper}</p>
          </article>
        ))}
      </section>

      {/* Admin Actionable list & dynamic fee configurations */}
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(350px,0.85fr)]">
        {/* Pending applications screening roster */}
        <article className="rounded-[1.6rem] border border-white/10 bg-white/[0.045] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.22)]">
          <span className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-blue-300">Operations Screening</span>
          <h3 className="mt-2 text-2xl font-black text-white">Pending Applications</h3>
          <p className="mt-1 text-sm text-slate-400">Review, assign supervisors/cohort classes, and approve applications.</p>

          <div className="mt-5 grid gap-4">
            {pendingApps.length > 0 ? pendingApps.map((app, idx) => (
              <div key={app._id || idx} className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-950/35 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="text-sm font-black text-white">{app.user ? `${app.user.firstName} ${app.user.lastName}` : 'Candidate Trainee'}</h4>
                  <span className="text-xs text-slate-500">{app.user?.email || 'email@example.com'}</span>
                  <div className="mt-2 flex flex-wrap gap-2 text-[0.65rem] font-black uppercase tracking-widest">
                    <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-blue-300">{app.department}</span>
                    <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-violet-300">{app.studyMode}</span>
                    <span className={`rounded-full px-2 py-0.5 ${app.paymentStatus === 'paid' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-amber-500/10 text-amber-300'}`}>{app.paymentStatus}</span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button type="button" onClick={() => handleApproveApp(app._id)} className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white hover:bg-blue-500 transition">
                    Approve & Active
                  </button>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-slate-950/20 py-10 text-center">
                <i className="fa-solid fa-folder-open text-slate-600 text-2xl mb-2" />
                <p className="text-xs font-semibold text-slate-500">No pending applications to review.</p>
                <p className="text-[0.68rem] text-slate-600 mt-1">New submissions will appear here automatically.</p>
              </div>
            )}
          </div>
        </article>

        {/* Dynamic settings */}
        <article className="h-fit rounded-[1.6rem] border border-white/10 bg-white/[0.045] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.22)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <span className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-emerald-300">Registration Settings</span>
              <h3 className="mt-2 text-xl font-black text-white">Online Application Fee</h3>
              <p className="mt-2 text-xs leading-5 text-slate-400">
                Configure if new candidate accounts are locked until registration fee is confirmed.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveSettings} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-2 block text-xs font-bold text-slate-400">Fee Amount (XAF)</span>
              <input
                type="number"
                min="0"
                value={settings.registrationFee}
                onChange={(event) => setSettings((current) => ({ ...current, registrationFee: event.target.value }))}
                className="h-12 w-full rounded-2xl border border-white/10 bg-slate-950/45 px-4 text-sm font-black text-white outline-none focus:border-blue-500"
              />
            </label>

            <label className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3">
              <span>
                <span className="block text-xs font-black text-white">Require mobile payment to register</span>
                <span className="mt-1 block text-[0.65rem] font-semibold text-slate-500">Auto-locks candidate cockpit until paid.</span>
              </span>
              <input
                type="checkbox"
                checked={settings.requireOnlineRegistrationFee}
                onChange={(event) => setSettings((current) => ({ ...current, requireOnlineRegistrationFee: event.target.checked }))}
                className="h-5 w-5 accent-blue-500"
              />
            </label>

            <button type="submit" disabled={settingsSaving} className="w-full h-12 rounded-2xl bg-blue-600 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-blue-600/20 hover:bg-blue-500 transition">
              {settingsSaving ? 'Saving...' : 'Save settings'}
            </button>
          </form>
        </article>
      </section>
    </div>
  );
}
