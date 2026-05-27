import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import axiosInstance from '../../config/axiosConfig';
import Loader from '../components/Loader';

export default function ManageActivities({ dashboardRoles }) {
  const { t } = useTranslation();

  // Resolve active role
  const reduxRoles = useSelector((state) => state.auth.userRoles);
  const userProfile = useSelector((state) => state.auth.userProfile);
  const userRoles = useMemo(() => {
    if (Array.isArray(dashboardRoles) && dashboardRoles.length) return dashboardRoles;
    if (Array.isArray(reduxRoles) && reduxRoles.length) return reduxRoles;
    try {
      return JSON.parse(sessionStorage.getItem('userRoles') || localStorage.getItem('userRoles') || '[]');
    } catch {
      return [];
    }
  }, [dashboardRoles, reduxRoles]);

  const normalizeRole = (r) => String(r || '').toLowerCase();
  const roles = useMemo(() => (Array.isArray(userRoles) ? userRoles : []).map(normalizeRole), [userRoles]);
  const isStudent = roles.includes('student') || (!roles.includes('supervisor') && !roles.includes('admin') && !roles.includes('superadmin') && !roles.includes('manager') && !roles.includes('teacher') && !roles.includes('advisor'));
  const isSupervisor = roles.includes('supervisor') || roles.includes('teacher') || roles.includes('advisor');
  const isAdmin = roles.includes('admin') || roles.includes('superadmin') || roles.includes('manager');

  // Shared state
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('roster'); // 'roster', 'allocate', 'review' (Supervisors/Admins only)

  // Modals & Popovers
  const [selectedTask, setSelectedTask] = useState(null); // Detail modal
  const [submissionTask, setSubmissionTask] = useState(null); // Task being submitted (Student only)
  const [gradingTask, setGradingTask] = useState(null); // Task being graded (Supervisor/Admin only)

  // Form states
  const [submitForm, setSubmitForm] = useState({ submissionNotes: '', submissionUrl: '' });
  const [submitSaving, setSubmitSaving] = useState(false);
  const [gradeForm, setGradeForm] = useState({ score: 90, feedback: '' });
  const [gradeSaving, setGradeSaving] = useState(false);

  // Supervisor allocate task form state
  const [allocateForm, setAllocateForm] = useState({
    title: '',
    description: '',
    internId: '',
    priority: 'medium',
    deadline: '',
  });
  const [allocateSaving, setAllocateSaving] = useState(false);

  // Roster dropdown options
  const [students, setStudents] = useState([]);
  
  // Roster search / filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      const res = await axiosInstance.get('/tasks');
      setTasks(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load tasks.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch student roster (Supervisor/Admin only)
  const fetchStudents = async () => {
    if (isStudent) return;
    try {
      const res = await axiosInstance.get('/users?role=student');
      setStudents(res.data || []);
    } catch (err) {
      console.warn('Failed to load students roster.', err);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchStudents();
  }, [isStudent]);

  // Handle student starting a task
  const handleStartTask = async (taskId) => {
    try {
      setLoading(true);
      const res = await axiosInstance.patch(`/tasks/${taskId}/start`);
      toast.success(res.data?.message || 'Task started! Happy coding.');
      await fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start task.');
    } finally {
      setLoading(false);
    }
  };

  // Handle student task submission
  const handleOpenSubmission = (task) => {
    setSubmissionTask(task);
    setSubmitForm({
      submissionNotes: task.submissionNotes || '',
      submissionUrl: task.submissionUrl || '',
    });
  };

  const handleSubmitDeliverable = async (e) => {
    e.preventDefault();
    if (!submissionTask) return;
    setSubmitSaving(true);
    try {
      const res = await axiosInstance.patch(`/tasks/${submissionTask._id}/submit`, submitForm);
      toast.success(res.data?.message || 'Deliverable submitted successfully.');
      setSubmissionTask(null);
      await fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit deliverable.');
    } finally {
      setSubmitSaving(false);
    }
  };

  // Handle supervisor allocating new task
  const handleAllocateTask = async (e) => {
    e.preventDefault();
    if (!allocateForm.internId) {
      toast.warning('Please select a target trainee.');
      return;
    }
    setAllocateSaving(true);
    try {
      await axiosInstance.post('/tasks', allocateForm);
      toast.success('Technical task successfully allocated!');
      setAllocateForm({
        title: '',
        description: '',
        internId: '',
        priority: 'medium',
        deadline: '',
      });
      setActiveTab('roster');
      await fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to allocate task.');
    } finally {
      setAllocateSaving(false);
    }
  };

  // Handle supervisor grading submission
  const handleOpenGrading = (task) => {
    setGradingTask(task);
    setGradeForm({
      score: task.score || 90,
      feedback: task.feedback || '',
    });
  };

  const handleGradeApprove = async () => {
    if (!gradingTask) return;
    setGradeSaving(true);
    try {
      await axiosInstance.patch(`/tasks/${gradingTask._id}/approve`, gradeForm);
      toast.success('Deliverable successfully approved and graded!');
      setGradingTask(null);
      await fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve deliverable.');
    } finally {
      setGradeSaving(false);
    }
  };

  const handleGradeReject = async () => {
    if (!gradingTask) return;
    if (!gradeForm.feedback.trim()) {
      toast.warning('Please enter revision feedback comments explaining the rejection.');
      return;
    }
    setGradeSaving(true);
    try {
      await axiosInstance.patch(`/tasks/${gradingTask._id}/reject`, { feedback: gradeForm.feedback });
      toast.success('Task marked for revision. Feedback logs transmitted.');
      setGradingTask(null);
      await fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject deliverable.');
    } finally {
      setGradeSaving(false);
    }
  };

  // Delete task helper (Admins only)
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      setLoading(true);
      await axiosInstance.patch(`/tasks/${taskId}`, { status: 'deleted' }); // or direct delete
      // Just filter it out or fetch again
      toast.success('Task deleted successfully.');
      await fetchTasks();
    } catch (err) {
      toast.error('Failed to delete task.');
    } finally {
      setLoading(false);
    }
  };

  // Trainee Kanban lane helpers
  const kanbanLanes = useMemo(() => {
    const lanes = {
      pending: [],
      in_progress: [],
      submitted: [],
      completed: [],
      rejected: [],
    };
    tasks.forEach((t) => {
      if (lanes[t.status]) {
        lanes[t.status].push(t);
      }
    });
    return lanes;
  }, [tasks]);

  // Supervisor metrics calculations
  const supervisorMetrics = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const submitted = tasks.filter((t) => t.status === 'submitted').length;
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
    const overdue = tasks.filter((t) => {
      if (['completed', 'submitted'].includes(t.status)) return false;
      return t.deadline && new Date(t.deadline) < new Date();
    }).length;

    return { total, completed, submitted, inProgress, overdue };
  }, [tasks]);

  // Filtered supervisor tasks
  const filteredSupervisorTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchSearch =
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.intern &&
          `${t.intern.firstName} ${t.intern.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus = statusFilter === 'all' || t.status === statusFilter;
      const matchPriority = priorityFilter === 'all' || t.priority === priorityFilter;

      return matchSearch && matchStatus && matchPriority;
    });
  }, [tasks, searchQuery, statusFilter, priorityFilter]);

  // Review Queue Tasks (status === 'submitted')
  const reviewQueueTasks = useMemo(() => {
    return tasks.filter((t) => t.status === 'submitted');
  }, [tasks]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'No deadline';
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      case 'medium':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'low':
      default:
        return 'bg-sky-500/10 text-sky-400 border border-sky-500/20';
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'rejected':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      case 'submitted':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'in_progress':
        return 'bg-violet-500/10 text-violet-400 border border-violet-500/20';
      case 'pending':
      default:
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };

  if (loading && tasks.length === 0) return <Loader />;

  // -------------------------------------------------------------
  // STUDENT VIEW (KANBAN BOARD)
  // -------------------------------------------------------------
  if (isStudent) {
    return (
      <div className="space-y-8">
        {/* Kanban Board Container */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-5">
          {/* Lane Column Component */}
          {[
            { id: 'pending', title: 'Pending Backlog', color: 'text-slate-400', icon: 'fa-regular fa-clipboard', bg: 'bg-slate-950/20' },
            { id: 'in_progress', title: 'In Progress', color: 'text-violet-400', icon: 'fa-solid fa-person-running', bg: 'bg-violet-950/5' },
            { id: 'submitted', title: 'Awaiting Grading', color: 'text-blue-400', icon: 'fa-solid fa-spinner fa-spin-pulse', bg: 'bg-blue-950/5' },
            { id: 'completed', title: 'Completed', color: 'text-emerald-400', icon: 'fa-solid fa-circle-check', bg: 'bg-emerald-950/5' },
            { id: 'rejected', title: 'Revision Requested', color: 'text-rose-400', icon: 'fa-solid fa-triangle-exclamation', bg: 'bg-rose-950/5' },
          ].map((lane) => {
            const laneTasks = kanbanLanes[lane.id] || [];
            return (
              <div
                key={lane.id}
                className={`flex flex-col rounded-3xl border border-white/5 p-4 min-h-[450px] ${lane.bg} backdrop-blur-xl`}
              >
                {/* Lane Header */}
                <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-2">
                  <div className="flex items-center gap-2">
                    <i className={`${lane.icon} ${lane.color} text-sm`} />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">{lane.title}</h3>
                  </div>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[0.65rem] font-bold text-white">
                    {laneTasks.length}
                  </span>
                </div>

                {/* Card Container */}
                <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar">
                  {laneTasks.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center py-12 text-center">
                      <i className="fa-solid fa-folder-open text-slate-700 text-xl mb-2" />
                      <p className="text-[0.7rem] text-slate-600 font-medium">Empty Lane</p>
                    </div>
                  ) : (
                    laneTasks.map((task) => {
                      const isOverdue = task.deadline && new Date(task.deadline) < new Date() && !['completed', 'submitted'].includes(task.status);
                      return (
                        <div
                          key={task._id}
                          className="group relative flex flex-col rounded-2xl border border-white/10 bg-slate-900/60 p-4 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-cyan-500/5 hover:bg-slate-900/80"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className={`rounded-full px-2 py-0.5 text-[0.55rem] font-black uppercase tracking-widest ${getPriorityStyle(task.priority)}`}>
                              {task.priority}
                            </span>
                            {isOverdue && (
                              <span className="rounded-full bg-rose-600/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 text-[0.55rem] font-black uppercase tracking-wider animate-pulse">
                                Overdue
                              </span>
                            )}
                          </div>

                          <h4 className="mt-3 text-sm font-bold text-white line-clamp-1">{task.title}</h4>
                          <p className="mt-1 text-xs text-slate-400 line-clamp-2">{task.description}</p>

                          {/* Detail Footer */}
                          <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                            <div className="flex items-center gap-1.5 text-slate-500">
                              <i className="fa-regular fa-calendar text-[0.7rem]" />
                              <span className="text-[0.65rem] font-medium">{formatDate(task.deadline)}</span>
                            </div>
                            
                            {task.score !== undefined && (
                              <strong className="text-xs font-black text-emerald-400">
                                {task.score}/100
                              </strong>
                            )}
                          </div>

                          {/* Quick Interactive Hover Actions Overlay */}
                          <div className="mt-4 flex gap-2">
                            <button
                              onClick={() => setSelectedTask(task)}
                              className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2 text-[0.68rem] font-bold text-white transition hover:bg-white/10 cursor-pointer"
                            >
                              Details
                            </button>

                            {task.status === 'pending' && (
                              <button
                                onClick={() => handleStartTask(task._id)}
                                className="flex-1 rounded-xl bg-violet-600 py-2 text-[0.68rem] font-bold text-white transition hover:bg-violet-500 cursor-pointer"
                              >
                                Start Work
                              </button>
                            )}

                            {task.status === 'in_progress' && (
                              <button
                                onClick={() => handleOpenSubmission(task)}
                                className="flex-1 rounded-xl bg-blue-600 py-2 text-[0.68rem] font-bold text-white transition hover:bg-blue-500 cursor-pointer"
                              >
                                Submit
                              </button>
                            )}

                            {task.status === 'rejected' && (
                              <button
                                onClick={() => handleOpenSubmission(task)}
                                className="flex-1 rounded-xl bg-amber-600 py-2 text-[0.68rem] font-bold text-white transition hover:bg-amber-500 cursor-pointer"
                              >
                                Resubmit
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* =================================--------- */}
        {/* STUDENT ACTION MODALS */}
        {/* =================================--------- */}
        
        {/* Detail Modal */}
        {selectedTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4" onClick={() => setSelectedTask(null)}>
            <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900/95 p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)]" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setSelectedTask(null)} className="absolute top-5 right-5 text-slate-400 hover:text-white text-xl cursor-pointer bg-transparent border-none">×</button>
              
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-black uppercase tracking-wider ${getPriorityStyle(selectedTask.priority)}`}>
                  {selectedTask.priority} Priority
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-black uppercase tracking-wider ${getStatusStyle(selectedTask.status)}`}>
                  {selectedTask.status.replace('_', ' ')}
                </span>
              </div>

              <h3 className="text-xl font-black text-white">{selectedTask.title}</h3>
              <p className="mt-3 text-sm text-slate-300 leading-relaxed max-h-[150px] overflow-y-auto pr-2">{selectedTask.description}</p>

              <div className="mt-6 space-y-3 border-t border-white/10 pt-4 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Allocated Deadline:</span>
                  <span className="text-white font-bold">{formatDate(selectedTask.deadline)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Assigned Track:</span>
                  <span className="text-blue-300 font-bold">{selectedTask.department}</span>
                </div>
                {selectedTask.supervisor && (
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold">Supervisor:</span>
                    <span className="text-white font-bold">{selectedTask.supervisor.firstName} {selectedTask.supervisor.lastName}</span>
                  </div>
                )}
              </div>

              {/* Feedback Section (if completed or rejected) */}
              {(selectedTask.status === 'completed' || selectedTask.status === 'rejected') && selectedTask.feedback && (
                <div className="mt-6 rounded-2xl border border-white/5 bg-white/[0.03] p-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-2">
                    <i className="fa-solid fa-comment-dots text-cyan-400" />
                    Supervisor Feedback Logs
                  </h4>
                  {selectedTask.score !== undefined && (
                    <div className="mb-2 text-sm font-black text-white">
                      Score Rated: <span className="text-emerald-400">{selectedTask.score}/100</span>
                    </div>
                  )}
                  <p className="text-xs text-slate-300 italic leading-relaxed">"{selectedTask.feedback}"</p>
                </div>
              )}

              {/* Submissions Section */}
              {selectedTask.submissionNotes && (
                <div className="mt-4 rounded-2xl border border-white/5 bg-slate-950/40 p-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Your Submission Details</h4>
                  <p className="text-xs text-slate-300 leading-relaxed mb-2">"{selectedTask.submissionNotes}"</p>
                  {selectedTask.submissionUrl && (
                    <a
                      href={selectedTask.submissionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:underline"
                    >
                      <i className="fa-solid fa-arrow-up-right-from-square" />
                      View solution URL link
                    </a>
                  )}
                </div>
              )}

              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => setSelectedTask(null)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-xs font-bold text-white hover:bg-white/10 cursor-pointer"
                >
                  Close View
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Solution Submission Modal */}
        {submissionTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4" onClick={() => setSubmissionTask(null)}>
            <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900/95 p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)]" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setSubmissionTask(null)} className="absolute top-5 right-5 text-slate-400 hover:text-white text-xl cursor-pointer bg-transparent border-none">×</button>
              
              <h3 className="text-lg font-black text-white flex items-center gap-2 mb-2">
                <i className="fa-solid fa-paper-plane text-blue-400 animate-pulse" />
                Submit Task Deliverable
              </h3>
              <p className="text-xs text-slate-400 mb-6">Explain your implementation and attach your solution files or code URLs.</p>

              <form onSubmit={handleSubmitDeliverable} className="space-y-4">
                <label className="flex flex-col gap-2">
                  <span className="text-xs text-slate-400 font-bold">Solution URL / Repository Link</span>
                  <input
                    type="url"
                    required
                    value={submitForm.submissionUrl}
                    onChange={(e) => setSubmitForm({ ...submitForm, submissionUrl: e.target.value })}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-blue-500/60 transition-colors placeholder:text-slate-600"
                    placeholder="https://github.com/yourprofile/repo-link"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-xs text-slate-400 font-bold">Submission Notes / Summary</span>
                  <textarea
                    required
                    rows={4}
                    value={submitForm.submissionNotes}
                    onChange={(e) => setSubmitForm({ ...submitForm, submissionNotes: e.target.value })}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-blue-500/60 transition-colors placeholder:text-slate-600 resize-none"
                    placeholder="Brief description of how you implemented the task specifications..."
                  />
                </label>

                <div className="flex gap-3 mt-8">
                  <button
                    type="button"
                    onClick={() => setSubmissionTask(null)}
                    className="flex-1 py-3.5 rounded-2xl border border-white/10 text-slate-300 hover:bg-white/5 cursor-pointer bg-transparent text-xs font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitSaving}
                    className="flex-1 py-3.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-black cursor-pointer border-none text-xs transition-colors disabled:opacity-60"
                  >
                    {submitSaving ? 'Uploading logs...' : 'Transmit Deliverable'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // SUPERVISOR / ADMIN VIEW (ALLOCATION & ROSTER BOARD)
  // -------------------------------------------------------------
  return (
    <div className="space-y-8">
      {/* Top Level Metric Dashboard */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {[
          { label: 'Total Allocations', value: supervisorMetrics.total, icon: 'fa-solid fa-clipboard-list', color: 'text-blue-300' },
          { label: 'Completed Deliverables', value: supervisorMetrics.completed, icon: 'fa-solid fa-check-double', color: 'text-emerald-300' },
          { label: 'In Review Queue', value: supervisorMetrics.submitted, icon: 'fa-solid fa-clock-rotate-left', color: 'text-amber-300 animate-pulse' },
          { label: 'Active Workloads', value: supervisorMetrics.inProgress, icon: 'fa-solid fa-person-running', color: 'text-violet-300' },
          { label: 'Overdue Slippages', value: supervisorMetrics.overdue, icon: 'fa-solid fa-circle-exclamation', color: 'text-rose-300' },
        ].map((met) => (
          <article key={met.label} className="rounded-3xl border border-white/10 bg-slate-900/40 p-5 backdrop-blur-md flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[0.62rem] font-black uppercase tracking-[0.18em] text-slate-400">{met.label}</span>
              <i className={`${met.icon} ${met.color} text-sm`} />
            </div>
            <strong className="mt-4 block text-2xl font-black text-white">{met.value}</strong>
          </article>
        ))}
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-white/10">
        {[
          { id: 'roster', label: '📋 Roster & Tasks', icon: 'fa-solid fa-table-list' },
          { id: 'allocate', label: '➕ Allocate New Task', icon: 'fa-solid fa-calendar-plus' },
          { id: 'review', label: `📥 Review Submissions (${reviewQueueTasks.length})`, icon: 'fa-solid fa-inbox' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 border-b-2 px-6 py-4 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer bg-transparent ${
              activeTab === tab.id
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <i className={tab.icon} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* =================================--------- */}
      {/* TAB PANEL 1: ROSTER & ACTIVE TASKS */}
      {/* =================================--------- */}
      {activeTab === 'roster' && (
        <div className="space-y-6">
          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-4 rounded-3xl border border-white/10 bg-slate-950/20 p-5 backdrop-blur">
            <div className="flex-1 min-w-[200px] relative">
              <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search allocations, trainee names, or tracks..."
                className="w-full bg-white/5 border border-white/15 rounded-2xl pl-10 pr-4 py-3 text-xs text-white outline-none focus:border-blue-500/60 placeholder:text-slate-600 transition"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-900 border border-white/15 rounded-2xl px-4 py-3 text-xs text-white outline-none focus:border-blue-500/60"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="submitted">Submitted</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>

              {/* Priority Filter */}
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-slate-900 border border-white/15 rounded-2xl px-4 py-3 text-xs text-white outline-none focus:border-blue-500/60"
              >
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* Roster list grid */}
          {filteredSupervisorTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center rounded-[2rem] border border-white/10 bg-slate-900/20">
              <i className="fa-solid fa-clipboard text-slate-700 text-3xl mb-3" />
              <h3 className="text-white font-bold">No Allocations Found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">No assignments match your search or filter configuration. Allocate a task to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSupervisorTasks.map((task) => {
                const isOverdue = task.deadline && new Date(task.deadline) < new Date() && !['completed', 'submitted'].includes(task.status);
                return (
                  <div
                    key={task._id}
                    className="relative flex flex-col rounded-3xl border border-white/10 bg-slate-900/50 p-6 shadow-xl backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-white/20"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className={`rounded-full px-2 py-0.5 text-[0.55rem] font-black uppercase tracking-wider ${getPriorityStyle(task.priority)}`}>
                        {task.priority} Priority
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[0.55rem] font-black uppercase tracking-wider ${getStatusStyle(task.status)}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>

                    <h4 className="mt-4 text-sm font-black text-white line-clamp-1">{task.title}</h4>
                    <p className="mt-2 text-xs text-slate-400 line-clamp-3 flex-1">{task.description}</p>

                    {/* Intern details card */}
                    {task.intern && (
                      <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white/[0.03] border border-white/5 p-3">
                        {task.intern.avatar ? (
                          <img src={task.intern.avatar} alt="avatar" className="h-8 w-8 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-600/20 text-[0.7rem] font-bold text-cyan-400">
                            {task.intern.firstName?.[0]}{task.intern.lastName?.[0]}
                          </div>
                        )}
                        <div className="min-w-0">
                          <strong className="block text-xs text-white truncate">
                            {task.intern.firstName} {task.intern.lastName}
                          </strong>
                          <span className="block text-[0.62rem] text-slate-500 truncate">
                            {task.intern.email}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4 text-[0.68rem] text-slate-500">
                      <div className="flex items-center gap-1">
                        <i className="fa-regular fa-calendar" />
                        <span>{formatDate(task.deadline)}</span>
                      </div>
                      {isOverdue && (
                        <span className="text-rose-400 font-bold flex items-center gap-1">
                          <i className="fa-solid fa-circle-exclamation" /> Overdue
                        </span>
                      )}
                      {task.score !== undefined && (
                        <strong className="text-xs text-emerald-400 font-black">Score: {task.score}/100</strong>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="mt-4 flex gap-2 border-t border-white/5 pt-4">
                      <button
                        onClick={() => setSelectedTask(task)}
                        className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2 text-[0.68rem] font-bold text-white transition hover:bg-white/10 cursor-pointer"
                      >
                        Inspect
                      </button>

                      {task.status === 'submitted' && (
                        <button
                          onClick={() => handleOpenGrading(task)}
                          className="flex-1 rounded-xl bg-emerald-600 py-2 text-[0.68rem] font-bold text-white transition hover:bg-emerald-500 shadow-[0_4px_15px_rgba(16,185,129,0.2)] cursor-pointer"
                        >
                          Grade Submission
                        </button>
                      )}

                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteTask(task._id)}
                          className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-2 text-[0.68rem] text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
                          title="Delete assignment"
                        >
                          <i className="fa-solid fa-trash-can" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =================================--------- */}
      {/* TAB PANEL 2: ALLOCATE TASK FORM */}
      {/* =================================--------- */}
      {activeTab === 'allocate' && (
        <div className="max-w-2xl mx-auto rounded-[2rem] border border-white/10 bg-slate-900/40 p-8 shadow-2xl backdrop-blur-md">
          <div className="mb-6 flex items-center gap-3 border-b border-white/5 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-600/10 text-cyan-400 text-sm font-bold shadow-inner">
              <i className="fa-solid fa-calendar-plus" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Allocate Daily Operational Task</h3>
              <p className="text-xs text-slate-400">Deploy technical workloads, priorities, and deadlines directly to candidate trainee boards.</p>
            </div>
          </div>

          <form onSubmit={handleAllocateTask} className="space-y-5 text-xs">
            {/* Target Intern Dropdown */}
            <label className="flex flex-col gap-2">
              <span className="text-slate-300 font-bold">Assign Deliverable To (Trainee Intern)</span>
              <select
                required
                value={allocateForm.internId}
                onChange={(e) => setAllocateForm({ ...allocateForm, internId: e.target.value })}
                className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3.5 text-white outline-none focus:border-blue-500/60"
              >
                <option value="">-- Choose active intern candidate --</option>
                {students.map((stud) => (
                  <option key={stud._id} value={stud._id}>
                    {stud.firstName} {stud.lastName} ({stud.department || 'No department'}) - {stud.email}
                  </option>
                ))}
              </select>
            </label>

            {/* Task Title */}
            <label className="flex flex-col gap-2">
              <span className="text-slate-300 font-bold">Task Title / Operation Heading</span>
              <input
                type="text"
                required
                value={allocateForm.title}
                onChange={(e) => setAllocateForm({ ...allocateForm, title: e.target.value })}
                className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white outline-none focus:border-blue-500/60 transitionplaceholder:text-slate-600"
                placeholder="ex: Design RESTful authorization controller endpoints"
              />
            </label>

            {/* Task Description */}
            <label className="flex flex-col gap-2">
              <span className="text-slate-300 font-bold">Detailed Requirements & Specifications</span>
              <textarea
                required
                rows={5}
                value={allocateForm.description}
                onChange={(e) => setAllocateForm({ ...allocateForm, description: e.target.value })}
                className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white outline-none focus:border-blue-500/60 transition placeholder:text-slate-600 resize-none leading-relaxed"
                placeholder="List clear constraints, technical specs, libraries to use, or API designs..."
              />
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Priority Selector */}
              <label className="flex flex-col gap-2">
                <span className="text-slate-300 font-bold">Priority Status Allocation</span>
                <div className="flex gap-2">
                  {['low', 'medium', 'high'].map((prio) => (
                    <button
                      key={prio}
                      type="button"
                      onClick={() => setAllocateForm({ ...allocateForm, priority: prio })}
                      className={`flex-1 py-3.5 rounded-2xl font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                        allocateForm.priority === prio
                          ? prio === 'high'
                            ? 'bg-rose-500/20 text-rose-400 border-rose-500/55 shadow-[0_4px_15px_rgba(244,63,94,0.15)]'
                            : prio === 'medium'
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/55 shadow-[0_4px_15px_rgba(245,158,11,0.15)]'
                            : 'bg-sky-500/20 text-sky-400 border-sky-500/55 shadow-[0_4px_15px_rgba(14,165,233,0.15)]'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      {prio}
                    </button>
                  ))}
                </div>
              </label>

              {/* Due Date Calendar */}
              <label className="flex flex-col gap-2">
                <span className="text-slate-300 font-bold">Target Delivery Deadline Date</span>
                <input
                  type="date"
                  required
                  value={allocateForm.deadline}
                  onChange={(e) => setAllocateForm({ ...allocateForm, deadline: e.target.value })}
                  className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3.5 text-white outline-none focus:border-blue-500/60"
                />
              </label>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={() => setActiveTab('roster')}
                className="rounded-2xl border border-white/10 bg-transparent px-6 py-3.5 font-bold text-slate-300 hover:bg-white/5 hover:text-white transition cursor-pointer"
              >
                Abort Allocation
              </button>
              <button
                type="submit"
                disabled={allocateSaving}
                className="rounded-2xl bg-cyan-600 px-8 py-3.5 font-black text-white hover:bg-cyan-500 transition shadow-[0_4px_20px_rgba(6,182,212,0.3)] disabled:opacity-60 cursor-pointer border-none"
              >
                {allocateSaving ? 'Deploying Deliverable...' : 'Deploy Allocation'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =================================--------- */}
      {/* TAB PANEL 3: REVIEW QUEUE SUBMISSIONS */}
      {/* =================================--------- */}
      {activeTab === 'review' && (
        <div className="space-y-6">
          {reviewQueueTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center rounded-[2rem] border border-white/10 bg-slate-900/20">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 text-lg mb-3 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                <i className="fa-solid fa-circle-check animate-pulse" />
              </div>
              <h3 className="text-white font-bold">Review Queue Empty</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">Flawless operations! All student deliverable logs are fully reviewed and graded.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {reviewQueueTasks.map((task) => (
                <div
                  key={task._id}
                  className="rounded-3xl border border-white/10 bg-slate-900/40 p-6 shadow-2xl backdrop-blur-md grid gap-6 md:grid-cols-[1fr_260px] items-center"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className={`rounded-full px-2 py-0.5 text-[0.55rem] font-black uppercase tracking-wider ${getPriorityStyle(task.priority)}`}>
                        {task.priority} Priority
                      </span>
                      <span className="rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 text-[0.55rem] font-black uppercase tracking-wider flex items-center gap-1 animate-pulse">
                        <i className="fa-solid fa-spinner fa-spin-pulse" /> Awaiting Score
                      </span>
                    </div>

                    <h3 className="text-base font-black text-white">{task.title}</h3>
                    
                    {/* Student attribution */}
                    {task.intern && (
                      <div className="mt-2 text-xs text-cyan-300 font-semibold flex items-center gap-1.5">
                        <i className="fa-solid fa-user-graduate" />
                        <span>{task.intern.firstName} {task.intern.lastName}</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-400">{task.intern.department}</span>
                      </div>
                    )}

                    <p className="mt-3 text-xs text-slate-400 leading-relaxed line-clamp-2">{task.description}</p>
                    
                    {/* Submission metadata info */}
                    <div className="mt-4 rounded-2xl bg-slate-950/40 border border-white/5 p-4 text-xs">
                      <strong className="block text-slate-300 font-bold mb-1">Trainee Submission Notes:</strong>
                      <p className="text-slate-400 italic">"{task.submissionNotes || 'No notes left'}"</p>
                      {task.submissionUrl && (
                        <div className="mt-3">
                          <a
                            href={task.submissionUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-2 font-bold text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300 transition"
                          >
                            <i className="fa-solid fa-arrow-up-right-from-square" />
                            Open Deliverable URL / Solution Link
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submission scorecard grading triggers */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleOpenGrading(task)}
                      className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-500 py-3.5 text-xs font-black text-white shadow-[0_4px_15px_rgba(16,185,129,0.2)] transition hover:-translate-y-0.5 cursor-pointer"
                    >
                      <i className="fa-solid fa-square-poll-vertical mr-1.5" />
                      Grade Deliverable
                    </button>
                    <button
                      onClick={() => setSelectedTask(task)}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 text-xs font-bold text-slate-300 hover:bg-white/10 hover:text-white transition cursor-pointer"
                    >
                      Inspect Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =================================--------- */}
      {/* SUPERVISOR / ADMIN MODALS */}
      {/* =================================--------- */}
      
      {/* Inspect Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4" onClick={() => setSelectedTask(null)}>
          <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900/95 p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)]" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelectedTask(null)} className="absolute top-5 right-5 text-slate-400 hover:text-white text-xl cursor-pointer bg-transparent border-none">×</button>
            
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-black uppercase tracking-wider ${getPriorityStyle(selectedTask.priority)}`}>
                {selectedTask.priority} Priority
              </span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-black uppercase tracking-wider ${getStatusStyle(selectedTask.status)}`}>
                {selectedTask.status.replace('_', ' ')}
              </span>
            </div>

            <h3 className="text-xl font-black text-white">{selectedTask.title}</h3>
            <p className="mt-3 text-sm text-slate-300 leading-relaxed max-h-[150px] overflow-y-auto pr-2">{selectedTask.description}</p>

            <div className="mt-6 space-y-3 border-t border-white/10 pt-4 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Trainee Candidate:</span>
                <span className="text-white font-bold">{selectedTask.intern?.firstName} {selectedTask.intern?.lastName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Track/Department:</span>
                <span className="text-blue-300 font-bold">{selectedTask.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Scheduled Due Date:</span>
                <span className="text-white font-bold">{formatDate(selectedTask.deadline)}</span>
              </div>
              {selectedTask.score !== undefined && (
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Performance Score:</span>
                  <span className="text-emerald-400 font-black">{selectedTask.score}/100</span>
                </div>
              )}
            </div>

            {/* Submission Notes */}
            {selectedTask.submissionNotes && (
              <div className="mt-6 rounded-2xl border border-white/5 bg-slate-950/40 p-4 text-xs">
                <h4 className="font-bold text-slate-300 mb-1">Trainee Solution Submissions:</h4>
                <p className="text-slate-400 italic">"{selectedTask.submissionNotes}"</p>
                {selectedTask.submissionUrl && (
                  <a
                    href={selectedTask.submissionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-cyan-400 hover:underline"
                  >
                    <i className="fa-solid fa-arrow-up-right-from-square" />
                    Open submission URL
                  </a>
                )}
              </div>
            )}

            {/* Supervisor Feedback */}
            {selectedTask.feedback && (
              <div className="mt-4 rounded-2xl border border-white/5 bg-white/[0.03] p-4 text-xs">
                <h4 className="font-bold text-slate-300 mb-1">Supervisor Grading Comments:</h4>
                <p className="text-slate-400">"{selectedTask.feedback}"</p>
              </div>
            )}

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setSelectedTask(null)}
                className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-xs font-bold text-white hover:bg-white/10 cursor-pointer"
              >
                Close Inspect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scorecard Grading Popover Modal */}
      {gradingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4" onClick={() => setGradingTask(null)}>
          <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900/95 p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)]" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setGradingTask(null)} className="absolute top-5 right-5 text-slate-400 hover:text-white text-xl cursor-pointer bg-transparent border-none">×</button>
            
            <h3 className="text-lg font-black text-white flex items-center gap-2 mb-1">
              <i className="fa-solid fa-star-half-stroke text-emerald-400 animate-pulse" />
              Technical Deliverable Scorecard
            </h3>
            {gradingTask.intern && (
              <p className="text-xs text-slate-400 mb-6">
                Evaluating work log of <strong className="text-white">{gradingTask.intern.firstName} {gradingTask.intern.lastName}</strong>.
              </p>
            )}

            <div className="mb-6 rounded-2xl bg-slate-950/40 p-4 border border-white/5 text-xs">
              <strong className="text-slate-300 font-bold block mb-1">Trainee Deliverable link:</strong>
              <a
                href={gradingTask.submissionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:underline inline-flex items-center gap-1 mb-3 truncate w-full"
              >
                <i className="fa-solid fa-arrow-up-right-from-square" />
                {gradingTask.submissionUrl || 'No submission URL link'}
              </a>

              <strong className="text-slate-300 font-bold block mb-1">Trainee notes:</strong>
              <p className="text-slate-400 italic">"{gradingTask.submissionNotes || 'No notes left'}"</p>
            </div>

            <div className="space-y-4 text-xs">
              {/* Score slider/input */}
              <label className="flex flex-col gap-2">
                <div className="flex justify-between font-bold">
                  <span className="text-slate-300">Performance Score (0 - 100)</span>
                  <span className="text-emerald-400 font-black text-sm">{gradeForm.score}/100</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={gradeForm.score}
                  onChange={(e) => setGradeForm({ ...gradeForm, score: Number(e.target.value) })}
                  className="w-full accent-cyan-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                />
              </label>

              {/* Feedback Comment */}
              <label className="flex flex-col gap-2">
                <span className="text-slate-300 font-bold">Performance Feedback & Action Logs</span>
                <textarea
                  required
                  rows={4}
                  value={gradeForm.feedback}
                  onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
                  className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white outline-none focus:border-blue-500/60 transition placeholder:text-slate-600 resize-none leading-relaxed"
                  placeholder="Provide constructive assessment comments, technical observations, or revision specifications..."
                />
              </label>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={handleGradeReject}
                disabled={gradeSaving}
                className="flex-1 py-3.5 rounded-2xl border border-rose-500/25 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold transition cursor-pointer text-xs"
              >
                Reject / Revise Task
              </button>
              <button
                type="button"
                onClick={handleGradeApprove}
                disabled={gradeSaving}
                className="flex-1 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black transition shadow-[0_4px_15px_rgba(16,185,129,0.3)] disabled:opacity-60 border-none cursor-pointer text-xs"
              >
                {gradeSaving ? 'Filing Score...' : 'Approve & Score Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
