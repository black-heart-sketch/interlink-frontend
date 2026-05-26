import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { courseService } from '../../services/courseService';
import CourseCard from '../../components/learning/CourseCard';
import { getCourseId } from '../../utils/courseUtils';

const planFilters = ['All', 'Free', 'Freemium', 'Premium'];

export default function AllCourses() {
  const { t } = useTranslation();
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [search, setSearch] = useState('');
  const [plan, setPlan] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [courseData, enrollmentData] = await Promise.all([
          courseService.getCourses({ status: 'Published' }),
          (sessionStorage.getItem('token') || localStorage.getItem('token'))
            ? courseService.getMyEnrolledCourses().catch(() => [])
            : Promise.resolve([])
        ]);

        const list = courseData?.courses || (Array.isArray(courseData) ? courseData : []);
        if (!mounted) return;
        setCourses(list.filter(course => course.status === 'Published'));
        setEnrollments(Array.isArray(enrollmentData) ? enrollmentData : []);
      } catch (err) {
        if (mounted) setError(err.response?.data?.message || 'Unable to load courses right now.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, []);

  const enrollmentByCourse = useMemo(() => {
    const map = new Map();
    enrollments.forEach((enrollment) => {
      if (enrollment.course?._id) map.set(enrollment.course._id, enrollment);
    });
    return map;
  }, [enrollments]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return courses.filter((course) => {
      const matchesSearch = !needle || [course.title, course.description, course.category, course.difficulty, course.studyLanguage?.name]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(needle);
      const matchesPlan = plan === 'All' || course.plan === plan;
      return matchesSearch && matchesPlan;
    });
  }, [courses, search, plan]);

  return (
    <section className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <h2 className="font-display text-2xl font-black text-white">{t('learning.all_courses', 'All Courses')}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              {t('learning.all_courses_desc', 'Choose from published courses. Free courses open immediately, freemium courses unlock preview chapters, and premium courses request payment access.')}
            </p>
          </div>

          <div className="flex rounded-2xl border border-white/10 bg-white/[0.035] p-1">
            {planFilters.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setPlan(item)}
                className={`rounded-xl border-none px-3 py-2 text-xs font-black transition sm:px-4 ${plan === item ? 'bg-white text-slate-950' : 'bg-transparent text-slate-400 hover:bg-white/10 hover:text-white'}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('learning.search_placeholder', 'Search by title, level, category, or language...')}
              className="h-12 w-full rounded-xl border border-white/10 bg-black/20 pl-11 pr-4 text-sm font-semibold text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400/60"
            />
          </div>
          <div className="rounded-xl bg-black/20 px-4 py-3 text-sm font-bold text-slate-400">
            {filtered.length} {t('learning.of', 'of')} {courses.length} {t('learning.courses_count', 'courses')}
          </div>
        </div>

        {loading && (
          <div className="flex min-h-80 items-center justify-center text-slate-400">
            <i className="fa-solid fa-circle-notch mr-3 animate-spin" aria-hidden="true" />
            {t('learning.loading_courses_catalog', 'Loading courses...')}
          </div>
        )}

        {!loading && error && (
          <div className="mt-8 rounded-2xl border border-red-400/20 bg-red-500/10 p-5 text-sm font-bold text-red-200">{error}</div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.035] p-10 text-center">
            <i className="fa-solid fa-book-open text-4xl text-slate-600" aria-hidden="true" />
            <h3 className="mt-4 text-xl font-black text-white">{t('learning.no_courses_title', 'No courses found')}</h3>
            <p className="mt-2 text-sm text-slate-400">{t('learning.no_courses_desc', 'Try a different search term or plan filter.')}</p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((course) => (
              <CourseCard key={getCourseId(course)} course={course} enrollment={enrollmentByCourse.get(getCourseId(course))} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
