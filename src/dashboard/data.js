export const sidebarItems = [
  { id: 'overview', label: 'Overview Cockpit', icon: 'fa-solid fa-chart-line', accent: '#3b82f6', i18nKey: 'sidebar.dashboard' },
  { id: 'users', label: 'User Directory', icon: 'fa-solid fa-users-gear', accent: '#a855f7', i18nKey: 'sidebar.users' },
  { id: 'applications', label: 'Admissions Pipeline', icon: 'fa-solid fa-folder-open', accent: '#10b981', i18nKey: 'sidebar.crm_leads' },
  { id: 'departments', label: 'Department Tracks', icon: 'fa-solid fa-network-wired', accent: '#3b82f6', i18nKey: 'sidebar.programs' },
  { id: 'tasks', label: 'Trainee Tasks', icon: 'fa-solid fa-list-check', accent: '#10b981', i18nKey: 'sidebar.activities' },
  { id: 'reports', label: 'Manage Reports', icon: 'fa-solid fa-file-invoice', accent: '#14b8a6', i18nKey: 'sidebar.reports' },
  { id: 'student-projects', label: 'Project Management', icon: 'fa-solid fa-diagram-project', accent: '#22d3ee', i18nKey: 'sidebar.student_projects' },
  { id: 'attendance', label: 'Attendance Board', icon: 'fa-solid fa-calendar-check', accent: '#8b5cf6', i18nKey: 'sidebar.conferences' },
  { id: 'messages', label: 'Messages', icon: 'fa-solid fa-comments', accent: '#22d3ee', i18nKey: 'sidebar.messages' },
  { id: 'ai', label: 'AI Copilot', icon: 'fa-solid fa-wand-magic-sparkles', accent: '#a855f7', i18nKey: 'sidebar.ai' },
  { id: 'live-classes', label: 'Schedule Webinars', icon: 'fa-solid fa-video', accent: '#0ea5e9', i18nKey: 'sidebar.live_schedule' },
  { id: 'evaluations', label: 'Skills Grading', icon: 'fa-solid fa-star-half-stroke', accent: '#ec4899', i18nKey: 'sidebar.gallery' },
  { id: 'certificates', label: 'Certificates Engine', icon: 'fa-solid fa-award', accent: '#f97316', i18nKey: 'sidebar.flyer' },
  { id: 'analytics', label: 'Analytics', icon: 'fa-solid fa-chart-pie', accent: '#38bdf8', i18nKey: 'sidebar.analytics' },
  { id: 'portfolio', label: 'Portfolio', icon: 'fa-solid fa-id-card-clip', accent: '#10b981', i18nKey: 'sidebar.portfolio' },
  { id: 'services', label: 'Corporate Services', icon: 'fa-solid fa-gears', accent: '#06b6d4', i18nKey: 'sidebar.study_languages' },
  { id: 'projects', label: 'Portfolio Showcase', icon: 'fa-solid fa-briefcase', accent: '#f59e0b', i18nKey: 'sidebar.partners' },
  { id: 'profile', label: 'My Profile', icon: 'fa-solid fa-user', accent: '#64748b', i18nKey: 'topbar.profile' },
  { id: 'system-settings', label: 'System Settings', icon: 'fa-solid fa-gears', accent: '#3b82f6', i18nKey: 'sidebar.system_settings' },
  { id: 'financial-balance', label: 'Financial Balance', icon: 'fa-solid fa-credit-card', accent: '#10b981', i18nKey: 'sidebar.financial_balance' },
];

export const sidebarGroups = [
  {
    id: 'workspace',
    label: 'Workspace',
    icon: 'fa-solid fa-layer-group',
    items: ['overview', 'users', 'applications', 'departments'],
  },
  {
    id: 'operations',
    label: 'Operational Tracking',
    icon: 'fa-solid fa-list-check',
    items: ['tasks', 'reports', 'student-projects', 'attendance', 'messages', 'ai', 'live-classes'],
  },
  {
    id: 'credentials',
    label: 'Grading & Certs',
    icon: 'fa-solid fa-award',
    items: ['evaluations', 'certificates', 'analytics', 'portfolio'],
  },
  {
    id: 'company',
    label: 'Company Assets',
    icon: 'fa-solid fa-building',
    items: ['services', 'projects'],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'fa-solid fa-sliders',
    items: ['profile', 'system-settings', 'financial-balance'],
  },
];

export const admin = {
  name: 'InterLink Cockpit',
  role: 'System Administrator',
  email: 'admin@interlink.com',
  phone: '+237 690 000 000',
  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=240&q=80&auto=format&fit=crop',
};

export const moduleCopy = {
  users: ['User Directory', 'Manage candidate user credentials, security statuses, and access roles.', 'New User'],
  applications: ['Admissions Pipeline', 'Review visitor submissions, upload resumes/CVs, and approve candidate registrations.', 'New Application'],
  departments: ['Department Tracks', 'Configure system-wide active tech tracks and department paths.', 'Create Track'],
  tasks: ['Trainee Tasks Kanban', 'Assign daily operations tasks, describe requirements, and monitor student Kanban cards.', 'Assign Task'],
  reports: ['Manage Reports', 'Review trainees daily or weekly activity submissions. Post rating feedback.', 'New Report'],
  'student-projects': ['Project Management', 'Students submit project documents, admins validate them, and InterLink tracks school report milestones.', 'Submit Project'],
  attendance: ['Attendance Tracker Log', 'Supervise student check-in/check-out timestamps and status markers.', 'Log Clockin'],
  messages: ['Messages', 'Direct chat between students, supervisors, and administrators with attachments.', 'New Message'],
  ai: ['AI Copilot', 'Generate reports, review drafts, suggest tasks, analyze performance, and prepare final summaries.', 'Ask AI'],
  'live-classes': ['Schedule Webinars', 'Program live webinars, video conference slots, and online presentations.', 'Schedule Session'],
  evaluations: ['Skills Grading', 'Evaluate trainees technical skills, performance levels, and general behavior.', 'Grade Trainee'],
  certificates: ['Certificates Engine', 'Generate custom, QR-verified InterLink digital diplomas and completion assets.', 'Generate Diploma'],
  analytics: ['Analytics', 'Track department, attendance, report, task, performance, and completion metrics.', 'Refresh'],
  portfolio: ['Digital Portfolio', 'Aggregate completed work, reports, skills, feedback, and certificate links.', 'Share'],
  services: ['Corporate Services', 'Manage public catalog of software engineering and tech consultancy modules.', 'Add Service'],
  projects: ['Portfolio Showcase', 'Highlight completed platform engineering, IoT, and AI showcase projects.', 'Add Project'],
  profile: ['Profile Settings', 'Update account parameters, secure credentials, and platform preferences.', 'Save Profile'],
  'system-settings': ['System Configurations', 'Manage registration fees, requirements, and payment gateway keys.', 'Save Settings'],
  'financial-balance': ['Financial Balance & Audit', 'Audit live gateway balances and view onboarding paid student log ledger.', 'Refresh Ledger'],
};

export const users = [
  { id: '#1', name: 'Agbor', fullName: 'Agbor Anderson', email: 'agboranderson2000@gmail.com', role: 'ADMIN', status: 'Active', date: '14 May 2026', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80&auto=format&fit=crop' },
  { id: '#2', name: 'Somo Rean', fullName: 'Rean Giggs', email: 'somorean433@gmail.com', role: 'ADMIN', status: 'Active', date: '12 May 2026', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80&auto=format&fit=crop' },
];

export const overviewStats = [
  { label: 'Users', value: '2,408', detail: '186 new this month', tone: 'blue' },
  { label: 'Upcoming Webinars', value: '12', detail: '5 published this week', tone: 'green' },
  { label: 'Pending Reviews', value: '27', detail: 'Reports, certifications, portfolios', tone: 'gold' },
  { label: 'Media Assets', value: '624', detail: 'Images, video, resumes', tone: 'red' },
];
