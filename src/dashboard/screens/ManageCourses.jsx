import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { courseService } from '../../services/courseService';
import { studyLanguageService } from '../../services/studyLanguageService';
import CourseSetupPage from './CourseSetupPage';

const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001';
const COURSE_STATUSES = ['Published', 'Draft', 'Archived'];
const COURSE_PLANS = ['Free', 'Freemium', 'Premium'];
const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced', 'All Levels'];
const COURSE_LEVELS = ['none', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const PAGE_SIZES = [5, 10, 25, 50];

const emptyNewCourse = {
  title: '',
  plan: 'Premium',
  studyLanguage: '',
  category: 'General',
  difficulty: 'All Levels',
  level: 'none',
  price: 0,
};

const statusMeta = {
  Published: 'border-emerald-400/25 bg-emerald-500/10 text-emerald-300',
  Draft: 'border-slate-400/20 bg-slate-500/10 text-slate-300',
  Archived: 'border-amber-400/25 bg-amber-500/10 text-amber-300',
  'Pending Approval': 'border-blue-400/25 bg-blue-500/10 text-blue-300',
};

function courseId(course) {
  return course?._id || course?.id;
}

function assetUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

function courseImageUrl(course) {
  const image = course?.thumbnail || course?.image;
  if (!image) return '';
  // Already an absolute URL (e.g. Vimeo thumbnail)
  if (/^https?:\/\//i.test(image)) return image;
  // Stored as /assets/... — prefix with server URL
  if (image.startsWith('/assets/')) return `${API_URL}${image}`;
  // Stored as /images/... or any other absolute-path style
  if (image.startsWith('/')) return `${API_URL}${image}`;
  // Bare filename — use the known thumbnails folder
  return `${API_URL}/assets/images/courses/thumbnails/${image}`;
}

export default function ManageCourses() {
  const [courses, setCourses] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [setupCourse, setSetupCourse] = useState(null);
  const [previewCourse, setPreviewCourse] = useState(null);
  const [deletingCourse, setDeletingCourse] = useState(null);
  const [selectedCourses, setSelectedCourses] = useState([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterLang, setFilterLang] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortColumn, setSortColumn] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [newCourseModalOpen, setNewCourseModalOpen] = useState(false);
  const [newCourse, setNewCourse] = useState(emptyNewCourse);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterLang) params.studyLanguage = filterLang;
      if (filterCategory) params.category = filterCategory;
      if (filterStatus) params.status = filterStatus;
      if (debouncedSearch) params.search = debouncedSearch;

      const [coursesData, langsData] = await Promise.all([
        courseService.getCourses(params),
        studyLanguageService.getLanguages(true),
      ]);

      setCourses(coursesData?.courses || (Array.isArray(coursesData) ? coursesData : []));
      setLanguages(langsData);
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors du chargement des cours.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filterCategory, filterLang, filterStatus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setPage(1);
    setSelectedCourses([]);
  }, [debouncedSearch, filterCategory, filterLang, filterStatus, pageSize]);

  const categories = useMemo(() => {
    const unique = [...new Set(courses.map((course) => course.category).filter(Boolean))];
    return unique.includes('General') ? unique : ['General', ...unique];
  }, [courses]);

  const sortedCourses = useMemo(() => {
    const rows = [...courses];
    rows.sort((a, b) => {
      const aValue = a[sortColumn] ?? '';
      const bValue = b[sortColumn] ?? '';

      if (sortColumn === 'price') {
        return sortDirection === 'asc' ? Number(aValue) - Number(bValue) : Number(bValue) - Number(aValue);
      }

      if (sortColumn === 'createdAt') {
        return sortDirection === 'asc'
          ? new Date(aValue || 0) - new Date(bValue || 0)
          : new Date(bValue || 0) - new Date(aValue || 0);
      }

      return sortDirection === 'asc'
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });
    return rows;
  }, [courses, sortColumn, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sortedCourses.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedCourses = sortedCourses.slice((safePage - 1) * pageSize, safePage * pageSize);
  const pageIds = paginatedCourses.map(courseId).filter(Boolean);
  const selectedOnPage = pageIds.length > 0 && pageIds.every((id) => selectedCourses.includes(id));
  const from = paginatedCourses.length ? (safePage - 1) * pageSize + 1 : 0;
  const to = Math.min(safePage * pageSize, sortedCourses.length);

  const dashboardStats = useMemo(() => {
    return [
      { label: 'Total courses', value: courses.length, icon: 'fa-solid fa-circle-play', tone: 'from-blue-500 to-cyan-400' },
      { label: 'Published', value: courses.filter((course) => course.status === 'Published').length, icon: 'fa-solid fa-circle-check', tone: 'from-emerald-500 to-teal-400' },
      { label: 'Drafts', value: courses.filter((course) => course.status === 'Draft').length, icon: 'fa-solid fa-pen-ruler', tone: 'from-slate-500 to-slate-300' },
      { label: 'Archived', value: courses.filter((course) => course.status === 'Archived').length, icon: 'fa-solid fa-box-archive', tone: 'from-amber-500 to-orange-400' },
    ];
  }, [courses]);

  const toggleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection((direction) => (direction === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const toggleCourseSelection = (id) => {
    setSelectedCourses((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const togglePageSelection = () => {
    setSelectedCourses((current) => {
      if (selectedOnPage) return current.filter((id) => !pageIds.includes(id));
      return [...new Set([...current, ...pageIds])];
    });
  };

  const handleCreateCourseSubmit = async (event) => {
    event.preventDefault();
    if (!newCourse.title.trim()) return toast.error('Le titre du cours est requis.');
    if (!newCourse.studyLanguage) return toast.error('Veuillez sélectionner une langue d\'étude.');

    setSaving(true);
    try {
      const payload = {
        title: newCourse.title.trim(),
        plan: newCourse.plan,
        studyLanguage: newCourse.studyLanguage,
        price: Number(newCourse.price) || 0,
        status: 'Draft',
        description: '',
        category: newCourse.category || 'General',
        difficulty: newCourse.difficulty,
        level: newCourse.level || 'none',
        chapters: [],
        attachments: [],
      };

      const created = await courseService.createCourse(payload);
      toast.success(`Cours "${created.title}" créé avec succès.`);
      const fullCourse = await courseService.getCourseDetails(created._id || created.id);
      setSetupCourse(fullCourse);
      setNewCourse(emptyNewCourse);
      setNewCourseModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la création du cours.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (course, newStatus) => {
    const id = courseId(course);
    const previous = courses;
    const archivedAt = newStatus === 'Archived' ? new Date().toISOString() : null;

    setCourses((current) => current.map((item) => courseId(item) === id ? { ...item, status: newStatus, archivedAt } : item));
    try {
      await courseService.updateCourseStatus(id, { status: newStatus, archivedAt });
      toast.success(`Statut mis à jour : ${newStatus}`);
    } catch (err) {
      setCourses(previous);
      toast.error('Impossible de modifier le statut.');
    }
  };

  const handleBulkStatus = async (newStatus) => {
    const ids = [...selectedCourses];
    if (!ids.length) return;
    const previous = courses;
    const archivedAt = newStatus === 'Archived' ? new Date().toISOString() : null;

    setCourses((current) => current.map((item) => ids.includes(courseId(item)) ? { ...item, status: newStatus, archivedAt } : item));
    try {
      await Promise.all(ids.map((id) => courseService.updateCourseStatus(id, { status: newStatus, archivedAt })));
      toast.success(`${ids.length} cours mis à jour.`);
      setSelectedCourses([]);
    } catch (err) {
      setCourses(previous);
      toast.error('Erreur lors de la mise à jour groupée.');
    }
  };

  const handleEditCourse = async (course) => {
    setLoading(true);
    try {
      const fullCourse = await courseService.getCourseDetails(courseId(course));
      setSetupCourse(fullCourse);
    } catch (err) {
      toast.error('Erreur lors du chargement des détails du cours.');
    } finally {
      setLoading(false);
    }
  };

  const handleCourseSetupSave = async (formData) => {
    try {
      const id = formData.get('_id');
      if (!id) {
        toast.error('Course ID is missing.');
        return;
      }
      await courseService.updateCourseBasicInfo(id, formData);
      toast.success('Course saved successfully.');
      setSetupCourse(null);
      fetchData();
    } catch (err) {
      console.error('Course save error:', err);
      toast.error(err.response?.data?.message || 'Unable to save the course.');
      throw err;
    }
  };

  const handleDeleteConfirm = async () => {
    const ids = deletingCourse?.ids || [courseId(deletingCourse)];
    setSaving(true);
    try {
      await Promise.all(ids.map((id) => courseService.deleteCourse(id)));
      toast.success(ids.length > 1 ? `${ids.length} cours supprimés.` : 'Cours supprimé avec succès.');
      setDeletingCourse(null);
      setSelectedCourses([]);
      fetchData();
    } catch (err) {
      toast.error('Erreur lors de la suppression.');
    } finally {
      setSaving(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['id', 'title', 'category', 'level', 'plan', 'difficulty', 'price', 'status', 'studyLanguage', 'createdAt'];
    const csvRows = [headers.join(',')];
    for (const course of sortedCourses) {
      const values = [
        courseId(course) || '',
        course.title || '',
        course.category || '',
        course.level || 'none',
        course.plan || '',
        course.difficulty || '',
        course.price || 0,
        course.status || '',
        course.studyLanguage?.name || '',
        course.createdAt ? new Date(course.createdAt).toLocaleDateString() : '',
      ].map((value) => `"${String(value).replace(/"/g, '""')}"`);
      csvRows.push(values.join(','));
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'courses_export.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const SortLabel = ({ column, children }) => (
    <button
      type="button"
      onClick={() => toggleSort(column)}
      className="inline-flex items-center gap-2 text-left transition hover:text-white"
    >
      {children}
      <i className={`fa-solid ${sortColumn === column ? (sortDirection === 'asc' ? 'fa-arrow-up-short-wide' : 'fa-arrow-down-wide-short') : 'fa-sort'} text-[0.64rem] text-slate-500`} aria-hidden="true" />
    </button>
  );

  if (setupCourse) {
    return (
      <div className="min-h-[80vh] bg-transparent">
        <CourseSetupPage
          course={setupCourse}
          onClose={() => setSetupCourse(null)}
          onSave={handleCourseSetupSave}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950/45 shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
        <div className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.2),transparent_34%),rgba(255,255,255,0.035)] p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-[0.65rem] font-black uppercase tracking-[0.18em] text-blue-200">
                <i className="fa-solid fa-circle-play" aria-hidden="true" />
                Course Studio
              </span>
              <h3 className="mt-3 text-2xl font-black tracking-tight text-white">E-Learning Courses</h3>
              <p className="mt-1 max-w-2xl text-sm font-semibold text-slate-500">
                Manage course status, pricing, language, sections, videos, and resources from one clean registry.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {selectedCourses.length > 0 && (
                <>
                  <button type="button" onClick={() => handleBulkStatus('Published')} className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-xs font-black uppercase tracking-widest text-emerald-200 transition hover:bg-emerald-500/20">
                    <i className="fa-solid fa-check mr-2" aria-hidden="true" />
                    Publish {selectedCourses.length}
                  </button>
                  <button type="button" onClick={() => handleBulkStatus('Archived')} className="rounded-2xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-xs font-black uppercase tracking-widest text-amber-200 transition hover:bg-amber-500/20">
                    <i className="fa-solid fa-box-archive mr-2" aria-hidden="true" />
                    Archive
                  </button>
                  <button type="button" onClick={() => setDeletingCourse({ ids: selectedCourses })} className="rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-xs font-black uppercase tracking-widest text-red-200 transition hover:bg-red-500/20">
                    <i className="fa-solid fa-trash mr-2" aria-hidden="true" />
                    Delete
                  </button>
                </>
              )}

              <button type="button" onClick={handleExportCSV} className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm font-black text-slate-300 transition hover:-translate-y-0.5 hover:bg-white/10 hover:text-white">
                <i className="fa-solid fa-file-export mr-2" aria-hidden="true" />
                Export CSV
              </button>
              <button type="button" onClick={() => setNewCourseModalOpen(true)} className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-xl transition hover:-translate-y-0.5 hover:bg-blue-50">
                <i className="fa-solid fa-plus text-xs" aria-hidden="true" />
                New Course
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 border-b border-white/10 p-5 sm:grid-cols-2 xl:grid-cols-4">
          {dashboardStats.map((stat) => (
            <article key={stat.label} className="rounded-[1.25rem] border border-white/10 bg-white/[0.035] p-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br ${stat.tone} text-white shadow-lg`}>
                <i className={stat.icon} aria-hidden="true" />
              </div>
              <p className="mt-4 text-[0.68rem] font-black uppercase tracking-[0.16em] text-slate-500">{stat.label}</p>
              <strong className="mt-1 block text-2xl font-black text-white">{loading ? '...' : stat.value}</strong>
            </article>
          ))}
        </div>

        <div className="border-b border-white/10 bg-slate-950/35 p-5">
          <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-center 2xl:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-2 text-sm font-bold text-slate-400">
                Show
                <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))} className="h-10 rounded-xl border border-white/10 bg-slate-950 px-3 text-sm font-black text-white outline-none transition focus:border-blue-400/50">
                  {PAGE_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
                </select>
                entries
              </label>

              <select value={filterLang} onChange={(event) => setFilterLang(event.target.value)} className="h-10 rounded-xl border border-white/10 bg-slate-950 px-3 text-sm font-bold text-slate-300 outline-none focus:border-blue-400/50">
                <option value="">All languages</option>
                {languages.map((language) => <option key={language._id} value={language._id}>{language.name}</option>)}
              </select>

              <select value={filterCategory} onChange={(event) => setFilterCategory(event.target.value)} className="h-10 rounded-xl border border-white/10 bg-slate-950 px-3 text-sm font-bold text-slate-300 outline-none focus:border-blue-400/50">
                <option value="">All categories</option>
                {categories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>

              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setFilterStatus('')} className={`rounded-full border px-3 py-2 text-[0.65rem] font-black uppercase tracking-widest transition ${!filterStatus ? 'border-blue-400/50 bg-blue-500/15 text-blue-200' : 'border-white/10 bg-white/[0.03] text-slate-500 hover:bg-white/10 hover:text-white'}`}>
                  All
                </button>
                {COURSE_STATUSES.map((status) => (
                  <button key={status} type="button" onClick={() => setFilterStatus(status)} className={`rounded-full border px-3 py-2 text-[0.65rem] font-black uppercase tracking-widest transition ${filterStatus === status ? 'border-blue-400/50 bg-blue-500/15 text-blue-200' : 'border-white/10 bg-white/[0.03] text-slate-500 hover:bg-white/10 hover:text-white'}`}>
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <label className="relative w-full max-w-md">
              <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-500" aria-hidden="true" />
              <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search courses..." className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] pl-11 pr-4 text-sm font-semibold text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400/60 focus:bg-white/[0.07]" />
            </label>
          </div>
        </div>

        <div className="min-h-[480px] overflow-x-auto">
          {loading ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center gap-3">
              <div className="h-11 w-11 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
              <span className="text-sm font-bold text-slate-500">Loading courses...</span>
            </div>
          ) : sortedCourses.length === 0 ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-blue-400/20 bg-blue-500/10 text-2xl text-blue-300">
                <i className="fa-solid fa-book-open" aria-hidden="true" />
              </div>
              <h4 className="mt-5 text-xl font-black text-white">No courses found</h4>
              <p className="mt-1 text-sm font-semibold text-slate-500">Create a course or clear your filters to see the registry.</p>
            </div>
          ) : (
            <table className="w-full min-w-[1060px] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/10 bg-slate-900/80">
                  <th className="px-6 py-4">
                    <input type="checkbox" checked={selectedOnPage} onChange={togglePageSelection} className="h-4 w-4 rounded border-white/20 bg-slate-950 accent-blue-500" />
                  </th>
                  <th className="px-6 py-4 text-[0.68rem] font-black uppercase tracking-[0.18em] text-slate-400"><SortLabel column="title">Course</SortLabel></th>
                  <th className="px-6 py-4 text-[0.68rem] font-black uppercase tracking-[0.18em] text-slate-400">Language</th>
                  <th className="px-6 py-4 text-[0.68rem] font-black uppercase tracking-[0.18em] text-slate-400"><SortLabel column="plan">Plan</SortLabel></th>
                  <th className="px-6 py-4 text-[0.68rem] font-black uppercase tracking-[0.18em] text-slate-400"><SortLabel column="price">Price</SortLabel></th>
                  <th className="px-6 py-4 text-[0.68rem] font-black uppercase tracking-[0.18em] text-slate-400">Status</th>
                  <th className="px-6 py-4 text-[0.68rem] font-black uppercase tracking-[0.18em] text-slate-400"><SortLabel column="createdAt">Created</SortLabel></th>
                  <th className="px-6 py-4 text-right text-[0.68rem] font-black uppercase tracking-[0.18em] text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {paginatedCourses.map((course) => {
                  const id = courseId(course);
                  return (
                    <tr key={id} className="group odd:bg-white/[0.018] transition hover:bg-blue-500/[0.055]">
                      <td className="px-6 py-4">
                        <input type="checkbox" checked={selectedCourses.includes(id)} onChange={() => toggleCourseSelection(id)} className="h-4 w-4 rounded border-white/20 bg-slate-950 accent-blue-500" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-slate-900 text-blue-300">
                            {courseImageUrl(course) ? <img src={courseImageUrl(course)} alt={course.title || 'Course'} className="h-full w-full object-cover" /> : <i className="fa-solid fa-circle-play" aria-hidden="true" />}
                          </div>
                          <div className="min-w-0">
                            <strong className="block truncate text-sm font-black text-white">{course.title}</strong>
                            <span className="mt-1 block truncate text-xs font-semibold text-slate-500">{course.category || 'General'} · {course.level || 'none'} · {course.difficulty || 'All Levels'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded-full bg-teal-500/10 px-3 py-1 text-[0.65rem] font-black uppercase tracking-widest text-teal-300">
                          {course.studyLanguage?.name || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-300">{course.plan || 'Free'}</td>
                      <td className="px-6 py-4 text-sm font-black text-white">{Number(course.price) > 0 ? `${course.price} XAF` : 'Free'}</td>
                      <td className="px-6 py-4">
                        <select value={course.status || 'Draft'} onChange={(event) => handleStatusChange(course, event.target.value)} className={`rounded-xl border px-3 py-2 text-xs font-black outline-none ${statusMeta[course.status] || statusMeta.Draft}`}>
                          {COURSE_STATUSES.map((status) => <option key={status} value={status} className="bg-[#0f172a] text-white">{status}</option>)}
                        </select>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-400">{course.createdAt ? new Date(course.createdAt).toLocaleDateString('fr-FR') : '—'}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button type="button" onClick={() => setPreviewCourse(course)} className="dashboard-action-tooltip inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700/60 bg-slate-950/35 text-slate-400 transition hover:-translate-y-0.5 hover:border-blue-400/40 hover:bg-white/10 hover:text-blue-300" data-tooltip="Preview" aria-label="Preview course">
                            <i className="fa-solid fa-eye" aria-hidden="true" />
                          </button>
                          <button type="button" onClick={() => handleEditCourse(course)} className="dashboard-action-tooltip inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700/60 bg-slate-950/35 text-slate-400 transition hover:-translate-y-0.5 hover:border-emerald-400/40 hover:bg-white/10 hover:text-emerald-300" data-tooltip="Configure" aria-label="Configure course">
                            <i className="fa-solid fa-pen" aria-hidden="true" />
                          </button>
                          <button type="button" onClick={() => setDeletingCourse(course)} className="dashboard-action-tooltip inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700/60 bg-slate-950/35 text-slate-400 transition hover:-translate-y-0.5 hover:border-red-400/40 hover:bg-white/10 hover:text-red-300" data-tooltip="Delete" aria-label="Delete course">
                            <i className="fa-solid fa-trash" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex flex-col gap-4 border-t border-white/10 bg-slate-950/35 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-sm font-semibold text-slate-500">
            Showing <span className="font-black text-white">{from}</span> to <span className="font-black text-white">{to}</span> of <span className="font-black text-white">{sortedCourses.length}</span> entries
          </p>
          <div className="flex items-center gap-2">
            <button type="button" disabled={safePage === 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="rounded-xl border border-white/10 bg-white/[0.035] px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-400 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30">Previous</button>
            <span className="flex h-9 min-w-9 items-center justify-center rounded-xl bg-blue-500 px-3 text-sm font-black text-white shadow-lg shadow-blue-500/20">{safePage}</span>
            <span className="px-1 text-xs font-black text-slate-600">of</span>
            <span className="flex h-9 min-w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.035] px-3 text-sm font-black text-slate-300">{totalPages}</span>
            <button type="button" disabled={safePage === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} className="rounded-xl border border-white/10 bg-white/[0.035] px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-400 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30">Next</button>
          </div>
        </div>
      </section>

      {newCourseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm" onMouseDown={() => setNewCourseModalOpen(false)}>
          <div className="relative w-full max-w-2xl overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0f172a] shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
            <div className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.22),transparent_36%),rgba(255,255,255,0.035)] p-7">
              <button type="button" onClick={() => setNewCourseModalOpen(false)} className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-slate-400 transition hover:bg-white/10 hover:text-white">
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
              <span className="inline-flex rounded-full bg-blue-500/10 px-3 py-1 text-[0.62rem] font-black uppercase tracking-[0.18em] text-blue-200">Course creation</span>
              <h3 className="mt-3 text-2xl font-black tracking-tight text-white">Name and classify the new course</h3>
              <p className="mt-1 text-sm font-semibold text-slate-500">After creation, the full setup editor opens for videos, resources, and advanced details.</p>
            </div>

            <form onSubmit={handleCreateCourseSubmit} className="space-y-5 p-7">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-400">Course title</span>
                <input required value={newCourse.title} onChange={(event) => setNewCourse({ ...newCourse, title: event.target.value })} className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.045] px-4 text-sm font-bold text-white outline-none transition focus:border-blue-400/60 focus:bg-white/[0.08]" placeholder="e.g. German A1 Intensive" />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-400">Study language</span>
                  <select required value={newCourse.studyLanguage} onChange={(event) => setNewCourse({ ...newCourse, studyLanguage: event.target.value })} className="h-12 w-full rounded-2xl border border-white/10 bg-[#0f172a] px-4 text-sm font-bold text-white outline-none transition focus:border-blue-400/60">
                    <option value="">Select language...</option>
                    {languages.map((language) => <option key={language._id} value={language._id}>{language.name}</option>)}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-400">Access plan</span>
                  <select value={newCourse.plan} onChange={(event) => setNewCourse({ ...newCourse, plan: event.target.value, price: event.target.value === 'Free' ? 0 : newCourse.price })} className="h-12 w-full rounded-2xl border border-white/10 bg-[#0f172a] px-4 text-sm font-bold text-white outline-none transition focus:border-blue-400/60">
                    {COURSE_PLANS.map((plan) => <option key={plan} value={plan}>{plan}</option>)}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-400">Category</span>
                  <input value={newCourse.category} onChange={(event) => setNewCourse({ ...newCourse, category: event.target.value })} className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.045] px-4 text-sm font-bold text-white outline-none transition focus:border-blue-400/60 focus:bg-white/[0.08]" placeholder="General" />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-400">Difficulty</span>
                  <select value={newCourse.difficulty} onChange={(event) => setNewCourse({ ...newCourse, difficulty: event.target.value })} className="h-12 w-full rounded-2xl border border-white/10 bg-[#0f172a] px-4 text-sm font-bold text-white outline-none transition focus:border-blue-400/60">
                    {DIFFICULTIES.map((difficulty) => <option key={difficulty} value={difficulty}>{difficulty}</option>)}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-400">Course level</span>
                  <select value={newCourse.level} onChange={(event) => setNewCourse({ ...newCourse, level: event.target.value })} className="h-12 w-full rounded-2xl border border-white/10 bg-[#0f172a] px-4 text-sm font-bold text-white outline-none transition focus:border-blue-400/60">
                    {COURSE_LEVELS.map((level) => <option key={level} value={level}>{level === 'none' ? 'No level gate' : level}</option>)}
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-400">Base price (XAF)</span>
                <input type="number" min="0" value={newCourse.price} disabled={newCourse.plan === 'Free'} onChange={(event) => setNewCourse({ ...newCourse, price: event.target.value })} className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.045] px-4 text-sm font-bold text-white outline-none transition focus:border-blue-400/60 focus:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50" />
              </label>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setNewCourseModalOpen(false)} className="rounded-2xl border border-white/10 bg-transparent px-5 py-3 text-sm font-black text-slate-400 transition hover:bg-white/10 hover:text-white">Cancel</button>
                <button type="submit" disabled={saving} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-xl shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60">
                  {saving ? 'Creating...' : 'Create and configure'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {previewCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm" onMouseDown={() => setPreviewCourse(null)}>
          <section className="w-full max-w-3xl overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0f172a] shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
            <div className="relative h-56 bg-slate-900">
              {courseImageUrl(previewCourse) ? (
                <img src={courseImageUrl(previewCourse)} alt={previewCourse.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-5xl text-blue-300">
                  <i className="fa-solid fa-circle-play" aria-hidden="true" />
                </div>
              )}
              <button type="button" onClick={() => setPreviewCourse(null)} className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/65 text-slate-300 backdrop-blur transition hover:bg-white/10 hover:text-white">
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            </div>
            <div className="p-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <span className={`inline-flex rounded-full border px-3 py-1 text-[0.62rem] font-black uppercase tracking-[0.18em] ${statusMeta[previewCourse.status] || statusMeta.Draft}`}>{previewCourse.status || 'Draft'}</span>
                  <h3 className="mt-3 text-2xl font-black tracking-tight text-white">{previewCourse.title}</h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-400">{previewCourse.description || 'No description has been added yet.'}</p>
                </div>
                <button type="button" onClick={() => { setPreviewCourse(null); handleEditCourse(previewCourse); }} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-500">
                  Configure course
                </button>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {[
                  ['Language', previewCourse.studyLanguage?.name || '—'],
                  ['Category', previewCourse.category || 'General'],
                  ['Level', previewCourse.level && previewCourse.level !== 'none' ? previewCourse.level : '—'],
                  ['Plan', previewCourse.plan || 'Free'],
                  ['Price', Number(previewCourse.price) > 0 ? `${previewCourse.price} XAF` : 'Free'],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <span className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-slate-500">{label}</span>
                    <strong className="mt-2 block text-sm font-black text-white">{value}</strong>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}

      {deletingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onMouseDown={() => setDeletingCourse(null)}>
          <div className="relative w-full max-w-md rounded-[1.5rem] border border-red-400/20 bg-[#0f172a] p-6 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-300">
              <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />
            </div>
            <h3 className="mt-5 text-xl font-black text-white">Delete course</h3>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-400">
              {deletingCourse.ids
                ? `You are about to delete ${deletingCourse.ids.length} selected courses.`
                : <>You are about to delete <strong className="text-white">{deletingCourse.title}</strong>.</>}
              {' '}This also removes associated sections and videos, and cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setDeletingCourse(null)} className="flex-1 rounded-2xl border border-white/10 bg-transparent px-5 py-3 text-sm font-black text-slate-400 transition hover:bg-white/10 hover:text-white">Cancel</button>
              <button type="button" onClick={handleDeleteConfirm} disabled={saving} className="flex-1 rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60">
                {saving ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
