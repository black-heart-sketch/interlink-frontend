import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCourseId, getCourseImageUrl, getCourseStats, getPlanMeta, stripHtml } from '../../utils/courseUtils';

export default function CourseCard({ course, enrollment }) {
  const { t } = useTranslation();
  const location = useLocation();
  const inDashboard = location.pathname.startsWith('/dashboard');
  const searchParams = new URLSearchParams(location.search);
  const currentView = searchParams.get('view') || 'learner-my-learning';
  const id = getCourseId(course);
  const image = getCourseImageUrl(course);
  const stats = getCourseStats(course);
  const plan = getPlanMeta(course?.plan);
  const progress = enrollment?.progress?.overallPercentage || 0;
  const description = stripHtml(course?.description || '').slice(0, 130);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] shadow-2xl shadow-black/10 transition duration-300 hover:-translate-y-1 hover:border-blue-400/35 hover:bg-white/[0.055]">
      <Link to={inDashboard ? `/dashboard?view=course-detail&courseId=${id}&from=${currentView}` : `/learning/courses/${id}`} className="relative block aspect-[16/10] overflow-hidden bg-slate-900 no-underline">
        {image ? (
          <img src={image} alt={course?.title || t('learning.course')} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-950 via-slate-950 to-emerald-950">
            <i className="fa-solid fa-circle-play text-5xl text-blue-300/80" aria-hidden="true" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
        <span className={`absolute left-4 top-4 rounded-full border px-3 py-1 text-xs font-black ${plan.tone}`}>
          {plan.label}
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-400">
          <span className="rounded-full bg-white/5 px-2.5 py-1">{course?.category || t('learning.general')}</span>
          <span className="rounded-full bg-white/5 px-2.5 py-1">{course?.difficulty || t('learning.all_levels')}</span>
        </div>

        <Link to={inDashboard ? `/dashboard?view=course-detail&courseId=${id}&from=${currentView}` : `/learning/courses/${id}`} className="mt-4 text-lg font-black leading-tight text-white no-underline transition hover:text-blue-200">
          {course?.title || t('learning.untitled_course')}
        </Link>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-400">
          {description || t('learning.default_course_description')}
        </p>

        <div className="mt-5 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl border border-white/10 bg-black/15 p-2">
            <strong className="block text-sm text-white">{stats.sections}</strong>
            <span className="text-[11px] font-bold text-slate-500">{t('learning.chapters')}</span>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/15 p-2">
            <strong className="block text-sm text-white">{stats.videos}</strong>
            <span className="text-[11px] font-bold text-slate-500">{t('learning.videos')}</span>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/15 p-2">
            <strong className="block text-sm text-white">{Number(course?.price) > 0 ? `${course.price}` : t('learning.free')}</strong>
            <span className="text-[11px] font-bold text-slate-500">XAF</span>
          </div>
        </div>

        {enrollment && (
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-xs font-black text-slate-400">
              <span>{t('learning.progress')}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400" style={{ width: `${Math.min(100, progress)}%` }} />
            </div>
          </div>
        )}

        <div className="mt-auto pt-5">
          <Link 
            to={
              inDashboard 
                ? (enrollment 
                    ? `/dashboard?view=course-player&courseId=${id}&from=${currentView}` 
                    : `/dashboard?view=course-detail&courseId=${id}&from=${currentView}`)
                : (enrollment 
                    ? `/learning/learn/${id}` 
                    : `/learning/courses/${id}`)
            } 
            className="btn-primary w-full justify-center !rounded-xl !py-3 !text-sm"
          >
            {enrollment ? t('learning.continue_learning') : plan.action}
          </Link>
        </div>
      </div>
    </article>
  );
}
