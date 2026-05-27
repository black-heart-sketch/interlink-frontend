import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import { admin, moduleCopy, sidebarGroups, sidebarItems } from './data';
import GateLock from './components/GateLock';
import axiosInstance from '../config/axiosConfig';
import DashboardHome from './screens/DashboardHome';
import ManageActivities from './screens/ManageActivities';
import ManageConferences from './screens/ManageConferences';
import ManageEvents from './screens/ManageEvents';
import ManageFlyer from './screens/ManageFlyer';
import ManageGallery from './screens/ManageGallery';
import ManageAttendance from './screens/ManageAttendance';
import ManageMessages from './screens/ManageMessages';
import ManageAI from './screens/ManageAI';
import ManageEvaluations from './screens/ManageEvaluations';
import ManageCertificates from './screens/ManageCertificates';
import ManageContent from './screens/ManageContent';
import ManageAnalytics from './screens/ManageAnalytics';
import ManagePortfolio from './screens/ManagePortfolio';
import ManageStudentProjects from './screens/ManageStudentProjects';
import ManageMembers from './screens/ManageMembers';
import ManageProfile from './screens/ManageProfile';
import ManageSettings from './screens/ManageSettings';
import ManageFinancialBalance from './screens/ManageFinancialBalance';
import ManageTestimonials from './screens/ManageTestimonials';
import ManageUsers from './screens/ManageUsers';
import ManageLeads from './screens/ManageLeads';
import ManagePrograms from './screens/ManagePrograms';
import ManageReports from './screens/ManageReports';
import ManagePartners from './screens/ManagePartners';
import ManageCourses from './screens/ManageCourses';
import ManageLiveClasses from './screens/ManageLiveClasses';
import {
  AICorrectionReviewScreen,
  AIMockGeneratorScreen,
  ExamBlueprintsScreen,
  ExamSessionSchedulerScreen,
  GeneratedMockReviewScreen,
  LiveExamMonitorScreen,
  ResultsReleaseScreen,
  StudentExamSessionsScreen,
} from './screens/ManageExamSessions';
// import AllCourses from '../pages/learning/AllCourses';
// import MyLearning from '../pages/learning/MyLearning';
// import CourseDetail from '../pages/learning/CourseDetail';
// import CoursePlayer from '../pages/learning/CoursePlayer';

const screenMap = {
  users: ManageUsers,
  applications: ManageLeads,
  departments: ManagePrograms,
  tasks: ManageActivities,
  reports: ManageReports,
  attendance: ManageAttendance,
  messages: ManageMessages,
  ai: ManageAI,
  'live-classes': ManageLiveClasses,
  evaluations: ManageEvaluations,
  certificates: ManageCertificates,
  analytics: ManageAnalytics,
  portfolio: ManagePortfolio,
  'student-projects': ManageStudentProjects,
  services: (props) => <ManageContent {...props} type="services" />,
  projects: (props) => <ManageContent {...props} type="projects" />,
  profile: ManageProfile,
  'system-settings': ManageSettings,
  'financial-balance': ManageFinancialBalance,
};

const moduleMeta = {
  users: { metric: 'Accounts', value: 'Directory', tone: 'from-violet-500 to-fuchsia-400', helper: 'Trainee, supervisor, and operational accounts control.' },
  applications: { metric: 'Pipeline', value: 'Admissions', tone: 'from-emerald-500 to-teal-400', helper: 'Visitor submissions, resume screening, and onboarding.' },
  departments: { metric: 'Tracks', value: 'Tech Sectors', tone: 'from-blue-500 to-cyan-400', helper: 'Manage active engineering tracks and student seating.' },
  tasks: { metric: 'Tasks', value: 'Kanban', tone: 'from-emerald-500 to-lime-400', helper: 'Track daily training deliverables and supervisor assignments.' },
  reports: { metric: 'Checkins', value: 'Performance', tone: 'from-teal-500 to-emerald-400', helper: 'Grade daily trainee logs and review feedback.' },
  attendance: { metric: 'Logsheet', value: 'Attendance', tone: 'from-purple-500 to-indigo-400', helper: 'Clock-in/Clock-out timestamps monitoring.' },
  'live-classes': { metric: 'Webinars', value: 'Calendar', tone: 'from-sky-500 to-blue-400', helper: 'Schedule video conferences and online tech presentations.' },
  evaluations: { metric: 'Scores', value: 'Grading', tone: 'from-pink-500 to-rose-400', helper: 'Technical capability ratings and behavior checklists.' },
  certificates: { metric: 'Diplomas', value: 'Verification', tone: 'from-orange-500 to-red-400', helper: 'Generate verified QR code certificate assets.' },
  services: { metric: 'Services', value: 'Corporate', tone: 'from-cyan-500 to-sky-400', helper: 'Manage software development solutions catalog.' },
  projects: { metric: 'Projects', value: 'Showcase', tone: 'from-yellow-500 to-amber-400', helper: 'Display completed platform engineering showcase projects.' },
  'student-projects': { metric: 'Projects', value: 'Timeline', tone: 'from-cyan-500 to-blue-400', helper: 'Validate student project documents and follow school report milestones.' },
  profile: { metric: 'Preferences', value: 'Security', tone: 'from-slate-500 to-blue-400', helper: 'Configure account security and platform settings.' },
  'system-settings': { metric: 'Admissions', value: 'System Settings', tone: 'from-blue-500 to-indigo-400', helper: 'Manage registration fees and API credentials.' },
  'financial-balance': { metric: 'Treasury', value: 'Financial Balance', tone: 'from-emerald-500 to-teal-400', helper: 'Audit real-time payment gateway ledger.' },
};

const studentViews = new Set(['overview', 'tasks', 'reports', 'student-projects', 'attendance', 'messages', 'ai', 'live-classes', 'evaluations', 'portfolio', 'profile']);
const supervisorViews = new Set(['overview', 'tasks', 'reports', 'student-projects', 'attendance', 'messages', 'ai', 'live-classes', 'evaluations', 'analytics', 'portfolio', 'profile']);
const managerViews = new Set(['overview', 'applications', 'student-projects', 'ai', 'analytics', 'certificates', 'portfolio', 'profile']);

const roleModes = [
  { id: 'superadmin', label: 'Super Admin', icon: 'fa-user-shield', helper: 'All modules' },
  { id: 'admin', label: 'Admin', icon: 'fa-user-gear', helper: 'Operations' },
  { id: 'supervisor', label: 'Supervisor', icon: 'fa-user-check', helper: 'Reviews' },
  { id: 'student', label: 'Student', icon: 'fa-user-graduate', helper: 'Intern view' },
  { id: 'manager', label: 'Manager', icon: 'fa-briefcase', helper: 'Approvals' },
];

const normalizeRole = (role) => String(role || '').toLowerCase();

const canAccessView = (viewId, roles = []) => {
  const normalizedRoles = roles.map(normalizeRole);
  const isSuperAdmin = normalizedRoles.includes('superadmin');
  const isAdmin = normalizedRoles.includes('admin') || isSuperAdmin;
  
  if (viewId === 'financial-balance') {
    return isSuperAdmin;
  }
  if (viewId === 'system-settings') {
    return isAdmin;
  }
  
  if (isAdmin) return true;
  if (normalizedRoles.includes('student')) return studentViews.has(viewId);
  if (normalizedRoles.includes('supervisor')) return supervisorViews.has(viewId);
  if (normalizedRoles.includes('manager')) return managerViews.has(viewId);
  return studentViews.has(viewId);
};

function Dashboard() {
  const { i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const reduxRoles = useSelector((state) => state.auth.userRoles);
  const user = useSelector((state) => state.auth.user);
  
  const userRoles = useMemo(() => {
    if (Array.isArray(reduxRoles) && reduxRoles.length) return reduxRoles;
    try {
      return JSON.parse(sessionStorage.getItem('userRoles') || localStorage.getItem('userRoles') || '[]');
    } catch {
      return [];
    }
  }, [reduxRoles]);
  const isSuperAdmin = useMemo(() => userRoles.map(normalizeRole).includes('superadmin'), [userRoles]);
  const [roleMode, setRoleMode] = useState(() => localStorage.getItem('dashboard-role-mode') || 'superadmin');

  const [application, setApplication] = useState(null);
  const [appLoading, setAppLoading] = useState(false);

  const fetchApplicationStatus = async () => {
    const normalizedRoles = userRoles.map(normalizeRole);
    if (!normalizedRoles.includes('student')) {
      return;
    }
    setAppLoading(true);
    try {
      const res = await axiosInstance.get('/applications/me');
      setApplication(res.data || null);
    } catch (err) {
      console.error('Error fetching application status:', err);
    } finally {
      setAppLoading(false);
    }
  };

  useEffect(() => {
    if (userRoles.length) {
      fetchApplicationStatus();
    }
  }, [userRoles]);

  const effectiveUserRoles = useMemo(() => {
    if (!isSuperAdmin) return userRoles;
    return [roleMode];
  }, [isSuperAdmin, roleMode, userRoles]);

  const isStudentLocked = useMemo(() => {
    const normalizedRoles = effectiveUserRoles.map(normalizeRole);
    if (!normalizedRoles.includes('student')) return false;
    
    if (!application) return true;
    if (application.status !== 'approved' || application.paymentStatus !== 'paid') return true;
    
    return false;
  }, [effectiveUserRoles, application]);

  const visibleSidebarItems = useMemo(() => {
    return sidebarItems.filter((item) => canAccessView(item.id, effectiveUserRoles));
  }, [effectiveUserRoles]);

  const visibleSidebarGroups = useMemo(() => {
    const visibleIds = new Set(visibleSidebarItems.map((item) => item.id));
    return sidebarGroups
      .map((group) => ({ ...group, items: group.items.filter((id) => visibleIds.has(id)) }))
      .filter((group) => group.items.length > 0);
  }, [visibleSidebarItems]);

  const activeView = searchParams.get('view') || (() => {
    const savedView = localStorage.getItem('dashboard-active-view');
    return visibleSidebarItems.some((item) => item.id === savedView) ? savedView : visibleSidebarItems[0]?.id || 'overview';
  })();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('dashboard-theme') || 'dark');
  const [fullscreen, setFullscreen] = useState(Boolean(document.fullscreenElement));

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('dashboard-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (activeView !== 'course-detail' && activeView !== 'course-player') {
      localStorage.setItem('dashboard-active-view', activeView);
    }
  }, [activeView]);

  useEffect(() => {
    if (isSuperAdmin) {
      localStorage.setItem('dashboard-role-mode', roleMode);
    }
  }, [isSuperAdmin, roleMode]);

  useEffect(() => {
    if (!canAccessView(activeView, effectiveUserRoles)) {
      setSearchParams({ view: visibleSidebarItems[0]?.id || 'overview' }, { replace: true });
    }
  }, [activeView, effectiveUserRoles, setSearchParams, visibleSidebarItems]);

  useEffect(() => {
    const syncFullscreen = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', syncFullscreen);
    return () => document.removeEventListener('fullscreenchange', syncFullscreen);
  }, []);

  const currentItem = useMemo(() => sidebarItems.find((item) => item.id === activeView) || visibleSidebarItems[0] || sidebarItems[0], [activeView, visibleSidebarItems]);
  const currentCopy = moduleCopy[activeView] || [currentItem.label, '', 'Create'];
  const currentMeta = moduleMeta[activeView] || { metric: 'Module', value: 'Ready', tone: 'from-blue-500 to-cyan-400', helper: 'Administrative workspace' };
  const ActiveScreen = screenMap[activeView];

  const selectView = (id, extraParams = {}) => {
    const newParams = { view: id, ...extraParams };
    setSearchParams(newParams);
    setSidebarOpen(false);
    setProfileOpen(false);
  };

  const switchRoleMode = (nextRole) => {
    setRoleMode(nextRole);
    const nextRoles = [nextRole];
    if (!canAccessView(activeView, nextRoles)) {
      const fallback = sidebarItems.find((item) => canAccessView(item.id, nextRoles))?.id || 'overview';
      setSearchParams({ view: fallback }, { replace: true });
    }
  };

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch (error) {
      console.warn('Fullscreen mode could not be changed.', error);
    }
  };

  return (
    <div className={`dashboard-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`} style={{ '--sidebar-width': sidebarCollapsed ? '90px' : '310px' }}>
      <Sidebar 
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        sidebarItems={visibleSidebarItems}
        sidebarGroups={visibleSidebarGroups}
        activeView={activeView}
        selectView={selectView}
      />

      {sidebarOpen && <button className="dashboard-scrim" type="button" aria-label="Close sidebar" onClick={() => setSidebarOpen(false)} />}

      <main className="dashboard-main no-scrollbar overflow-x-hidden pt-[100px]">
        <Topbar 
          theme={theme}
          setTheme={setTheme}
          fullscreen={fullscreen}
          toggleFullscreen={toggleFullscreen}
          profileOpen={profileOpen}
          setProfileOpen={setProfileOpen}
          admin={admin}
          setSidebarOpen={setSidebarOpen}
          selectView={selectView}
          sidebarCollapsed={sidebarCollapsed}
        />

        <section className="dashboard-content">
          {isSuperAdmin && (
            <section className="mb-6 rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-3 shadow-[0_18px_60px_rgba(0,0,0,0.16)]">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="px-2">
                  <span className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-blue-300">Dashboard Role</span>
                  <p className="mt-1 text-sm font-semibold text-slate-400">Switch dashboard mode without signing out.</p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                  {roleModes.map((mode) => {
                    const active = roleMode === mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => switchRoleMode(mode.id)}
                        className={`flex min-w-[150px] items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                          active
                            ? 'border-cyan-300/40 bg-cyan-400 text-slate-950 shadow-[0_18px_45px_rgba(34,211,238,0.18)]'
                            : 'border-white/10 bg-slate-950/35 text-slate-300 hover:border-cyan-300/25 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <i className={`fa-solid ${mode.icon} text-base`} aria-hidden="true" />
                        <span className="min-w-0">
                          <strong className="block truncate text-sm font-black">{mode.label}</strong>
                          <small className={`block truncate text-[0.68rem] font-bold ${active ? 'text-slate-700' : 'text-slate-500'}`}>{mode.helper}</small>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          <div className="relative min-h-[600px] w-full">
            <div className={isStudentLocked ? 'pointer-events-none filter blur-[6px] select-none opacity-60 transition-all duration-300' : ''}>
              {activeView === 'overview' ? (
                <DashboardHome onSelect={selectView} userRoles={effectiveUserRoles} key={`overview-${i18n.language}-${roleMode}`} />
              ) : activeView === 'course-detail' || activeView === 'course-player' ? (
                <ActiveScreen key={`${activeView}-${i18n.language}`} />
              ) : (
                <>
                  <div className="dashboard-breadcrumb">
                    <span>Home</span>
                    <strong>/</strong>
                    <span>{currentItem.label}</span>
                  </div>
                  <section className="mb-8 overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_32%),linear-gradient(135deg,rgba(15,23,42,0.94),rgba(30,41,59,0.88))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-center">
                      <div className="min-w-0">
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-[0.68rem] font-black uppercase tracking-[0.22em] text-blue-200">
                          <i className={currentItem.icon} aria-hidden="true" />
                          {currentMeta.metric}
                        </span>
                        <h1 className="mt-5 text-3xl font-black leading-tight tracking-tight text-white md:text-4xl">
                          {currentCopy[0] || currentItem.label}
                        </h1>
                        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
                          {currentCopy[1] || currentMeta.helper}
                        </p>
                        <div className="mt-6 flex flex-wrap gap-3">
                          <button type="button" className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-xl transition hover:-translate-y-0.5 hover:bg-blue-50">
                            {currentCopy[2] || 'Create'}
                          </button>
                          <button type="button" className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-white/15">
                            Export View
                          </button>
                          <button type="button" className="rounded-2xl border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-black text-slate-300 transition hover:-translate-y-0.5 hover:bg-white/10 hover:text-white">
                            Audit Log
                          </button>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                        {[
                          ['Status', 'Operational', 'fa-circle-check', 'text-emerald-300'],
                          [currentMeta.metric, currentMeta.value, 'fa-chart-simple', 'text-blue-300'],
                          ['Last Sync', 'Just now', 'fa-rotate', 'text-violet-300'],
                        ].map(([label, value, icon, color]) => (
                          <article key={label} className="rounded-2xl border border-white/10 bg-slate-950/35 p-4 backdrop-blur">
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-slate-500">{label}</span>
                              <i className={`fa-solid ${icon} ${color}`} aria-hidden="true" />
                            </div>
                            <strong className="mt-2 block text-lg font-black text-white">{value}</strong>
                          </article>
                        ))}
                      </div>
                    </div>
                  </section>
                  <ActiveScreen key={`${activeView}-${i18n.language}-${roleMode}`} dashboardRoles={effectiveUserRoles} />
                </>
              )}
            </div>

            {isStudentLocked && (
              <GateLock 
                user={user}
                application={application}
                onRefresh={fetchApplicationStatus}
              />
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
