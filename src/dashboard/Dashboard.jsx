import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import { admin, moduleCopy, sidebarGroups, sidebarItems } from './data';
import DashboardHome from './screens/DashboardHome';
import ManageActivities from './screens/ManageActivities';
import ManageConferences from './screens/ManageConferences';
import ManageEvents from './screens/ManageEvents';
import ManageFlyer from './screens/ManageFlyer';
import ManageGallery from './screens/ManageGallery';
import ManageMembers from './screens/ManageMembers';
import ManageProfile from './screens/ManageProfile';
import ManageTestimonials from './screens/ManageTestimonials';
import ManageUsers from './screens/ManageUsers';
import ManageLeads from './screens/ManageLeads';
import ManagePrograms from './screens/ManagePrograms';
import ManagePartners from './screens/ManagePartners';
import ManageStudyLanguages from './screens/ManageStudyLanguages';
import ManageLibrary from './screens/ManageLibrary';
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
  reports: ManageTestimonials,
  attendance: ManageConferences,
  'live-classes': ManageLiveClasses,
  evaluations: ManageGallery,
  certificates: ManageFlyer,
  services: ManageStudyLanguages,
  projects: ManagePartners,
  profile: ManageProfile,
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
  profile: { metric: 'Preferences', value: 'Security', tone: 'from-slate-500 to-blue-400', helper: 'Configure account security and platform settings.' },
};

const studentViews = new Set(['overview', 'tasks', 'reports', 'attendance', 'live-classes', 'evaluations', 'profile']);
const supervisorViews = new Set(['overview', 'tasks', 'reports', 'attendance', 'evaluations', 'profile']);
const managerViews = new Set(['overview', 'applications', 'certificates', 'profile']);

const normalizeRole = (role) => String(role || '').toLowerCase();

const canAccessView = (viewId, roles = []) => {
  const normalizedRoles = roles.map(normalizeRole);
  const isAdmin = normalizedRoles.includes('admin') || normalizedRoles.includes('superadmin');
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
  const userRoles = useMemo(() => {
    if (Array.isArray(reduxRoles) && reduxRoles.length) return reduxRoles;
    try {
      return JSON.parse(sessionStorage.getItem('userRoles') || localStorage.getItem('userRoles') || '[]');
    } catch {
      return [];
    }
  }, [reduxRoles]);

  const visibleSidebarItems = useMemo(() => {
    return sidebarItems.filter((item) => canAccessView(item.id, userRoles));
  }, [userRoles]);

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
    if (!canAccessView(activeView, userRoles)) {
      setSearchParams({ view: visibleSidebarItems[0]?.id || 'overview' }, { replace: true });
    }
  }, [activeView, setSearchParams, userRoles, visibleSidebarItems]);

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
          {activeView === 'overview' ? (
            <DashboardHome onSelect={selectView} userRoles={userRoles} key={`overview-${i18n.language}`} />
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
              <ActiveScreen key={`${activeView}-${i18n.language}`} />
            </>
          )}
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
