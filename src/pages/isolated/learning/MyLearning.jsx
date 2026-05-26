import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { courseService } from '../../services/courseService';
import CourseCard from '../../components/learning/CourseCard';

export default function MyLearning() {
  const { t } = useTranslation();
  const location = useLocation();
  const inDashboard = location.pathname.startsWith('/dashboard');

  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isLoggedIn = !!(sessionStorage.getItem('token') || localStorage.getItem('token'));

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!isLoggedIn) {
        setLoading(false);
        return;
      }

      try {
        const data = await courseService.getMyEnrolledCourses();
        if (mounted) setEnrollments(Array.isArray(data) ? data : []);
      } catch (err) {
        if (mounted) setError(err.response?.data?.message || 'Unable to load your learning list.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [isLoggedIn]);

  const stats = useMemo(() => {
    const active = enrollments.filter(item => item.status === 'active').length;
    const completed = enrollments.filter(item => item.status === 'completed').length;
    const average = enrollments.length
      ? Math.round(enrollments.reduce((sum, item) => sum + (item.progress?.overallPercentage || 0), 0) / enrollments.length)
      : 0;
    return { active, completed, average };
  }, [enrollments]);

  // Dashboard-aware link for exploring courses
  const exploreLink = inDashboard ? '/dashboard?view=learner-courses' : '/learning';

  if (!isLoggedIn) {
    return (
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/[0.035] p-8 text-center shadow-2xl">
          <i className="fa-solid fa-lock text-5xl text-blue-300" aria-hidden="true" />
          <h2 className="mt-5 text-2xl font-black text-white">{t('learning.sign_in_title', 'Sign in to see My Learning')}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">{t('learning.sign_in_desc', 'Your enrolled courses, progress, and continue buttons are connected to your account.')}</p>
          <Link to="/login" className="btn-primary mt-6 !rounded-xl">{t('learning.sign_in', 'Sign in')}</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            [t('learning.active_courses', 'Active courses'), stats.active, 'fa-solid fa-bolt', 'from-blue-500 to-cyan-400'],
            [t('learning.completed', 'Completed'), stats.completed, 'fa-solid fa-circle-check', 'from-emerald-500 to-teal-400'],
            [t('learning.average_progress', 'Average progress'), `${stats.average}%`, 'fa-solid fa-chart-line', 'from-amber-500 to-orange-400']
          ].map(([label, value, icon, tone]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${tone} text-white shadow-lg`}>
                <i className={icon} aria-hidden="true" />
              </div>
              <p className="mt-4 text-sm font-bold text-slate-500">{label}</p>
              <strong className="mt-1 block text-3xl font-black text-white">{value}</strong>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-black text-white">{t('learning.my_learning', 'My Learning')}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">{t('learning.my_learning_desc', 'Resume a course, review completed work, or go back to the catalogue for something new.')}</p>
          </div>
          <Link to={exploreLink} className="btn-ghost justify-center !rounded-xl !py-3">
            <i className="fa-solid fa-compass" aria-hidden="true" />
            {t('learning.explore_courses', 'Explore courses')}
          </Link>
        </div>

        {loading && (
          <div className="flex min-h-80 items-center justify-center text-slate-400">
            <i className="fa-solid fa-circle-notch mr-3 animate-spin" aria-hidden="true" />
            {t('learning.loading_courses', 'Loading your courses...')}
          </div>
        )}

        {!loading && error && (
          <div className="mt-8 rounded-2xl border border-red-400/20 bg-red-500/10 p-5 text-sm font-bold text-red-200">{error}</div>
        )}

        {!loading && !error && enrollments.length === 0 && (
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.035] p-10 text-center">
            <i className="fa-solid fa-seedling text-4xl text-emerald-300" aria-hidden="true" />
            <h3 className="mt-4 text-xl font-black text-white">{t('learning.no_enrolled_title', 'No enrolled courses yet')}</h3>
            <p className="mt-2 text-sm text-slate-400">{t('learning.no_enrolled_desc', 'Start with a free course or preview a freemium course from the catalogue.')}</p>
            <Link to={exploreLink} className="btn-primary mt-6 !rounded-xl">{t('learning.browse_all', 'Browse all courses')}</Link>
          </div>
        )}

        {!loading && !error && enrollments.length > 0 && (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {enrollments.map((enrollment) => (
              enrollment.course ? <CourseCard key={enrollment._id || enrollment.course._id} course={enrollment.course} enrollment={enrollment} /> : null
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
