import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useLocation, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { courseService } from '../../services/courseService';
import { canAccessSection, getCourseImageUrl, getCourseStats, getPlanMeta, getVideoId, stripHtml } from '../../utils/courseUtils';

export default function CourseDetail() {
  const { t } = useTranslation();
  const { courseId: paramCourseId } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const courseId = paramCourseId || searchParams.get('courseId');
  const inDashboard = location.pathname.startsWith('/dashboard');
  const fromView = searchParams.get('from') || 'learner-my-learning';
  const [course, setCourse] = useState(null);
  const [status, setStatus] = useState({ isEnrolled: false, isPaid: false });
  const [openSections, setOpenSections] = useState({});
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [paymentPhone, setPaymentPhone] = useState(sessionStorage.getItem('phone') || localStorage.getItem('phone') || '');
  const [error, setError] = useState('');

  const isLoggedIn = !!(sessionStorage.getItem('token') || localStorage.getItem('token'));

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [courseData, enrollmentData] = await Promise.all([
        courseService.getCourseDetails(courseId),
        isLoggedIn ? courseService.getMyCourseEnrollmentStatus(courseId).catch(() => ({ isEnrolled: false, isPaid: false })) : Promise.resolve({ isEnrolled: false, isPaid: false })
      ]);
      if (courseData && courseData.sections) {
        courseData.sections = courseData.sections.filter(s => s.published);
      }
      setCourse(courseData);
      setStatus(enrollmentData);
      const firstSection = courseData?.sections?.[0]?._id;
      if (firstSection) setOpenSections({ [firstSection]: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load this course.');
    } finally {
      setLoading(false);
    }
  }, [courseId, isLoggedIn]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => getCourseStats(course), [course]);
  const plan = getPlanMeta(course?.plan);
  const image = getCourseImageUrl(course);
  const description = stripHtml(course?.description || '');

  const handleEnroll = async () => {
    if (!isLoggedIn) {
      const targetPath = inDashboard 
        ? `/dashboard?view=course-detail&courseId=${courseId}&from=${fromView}`
        : `/learning/courses/${courseId}`;
      navigate('/login', { state: { from: targetPath } });
      return;
    }

    setEnrolling(true);
    try {
      const result = await courseService.enrollInCourse(courseId);
      toast.success(result.message || 'Enrollment updated.');
      await load();

      if (course?.plan === 'Free' || course?.plan === 'Freemium') {
        if (inDashboard) {
          navigate(`/dashboard?view=course-player&courseId=${courseId}&from=${fromView}`);
        } else {
          navigate(`/learning/learn/${courseId}`);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Enrollment failed.');
    } finally {
      setEnrolling(false);
    }
  };

  const handleCoursePayment = async () => {
    if (!isLoggedIn) {
      const targetPath = inDashboard
        ? `/dashboard?view=course-detail&courseId=${courseId}&from=${fromView}`
        : `/learning/courses/${courseId}`;
      navigate('/login', { state: { from: targetPath } });
      return;
    }

    if (!paymentPhone.trim()) {
      toast.error('Enter your Mobile Money phone number.');
      return;
    }

    setEnrolling(true);
    try {
      const result = await courseService.initiateCoursePayment(courseId, { phone: paymentPhone.trim() });

      if (result.alreadyPaid) {
        toast.success(result.message || 'Course access unlocked.');
        await load();
        navigate(inDashboard ? `/dashboard?view=course-player&courseId=${courseId}&from=${fromView}` : `/learning/learn/${courseId}`);
        return;
      }

      const paymentContext = {
        kind: 'course',
        transactionId: result.transactionId,
        amount: result.amount || course.price,
        currency: result.currency || 'XAF',
        customerPhone: paymentPhone.trim(),
        courseId,
        description: `Confirm the Mobile Money payment to unlock ${result.courseTitle || course.title}.`,
        cancelPath: inDashboard ? `/dashboard?view=course-detail&courseId=${courseId}&from=${fromView}` : `/learning/courses/${courseId}`,
      };

      sessionStorage.setItem('pendingPaymentContext', JSON.stringify(paymentContext));
      navigate('/payment/status', { state: { paymentContext } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to initiate course payment.');
    } finally {
      setEnrolling(false);
    }
  };

  const primaryAction = () => {
    if (status.isEnrolled && (course?.plan !== 'Premium' || status.isPaid)) {
      return (
        <Link 
          to={inDashboard ? `/dashboard?view=course-player&courseId=${courseId}&from=${fromView}` : `/learning/learn/${courseId}`} 
          className="btn-primary w-full justify-center !rounded-xl"
        >
          {t('learning.continue_learning', 'Continue learning')}
        </Link>
      );
    }

    if (status.isEnrolled && course?.plan === 'Premium' && !status.isPaid) {
      return (
        <div className="space-y-3">
          <input
            type="tel"
            value={paymentPhone}
            onChange={(event) => setPaymentPhone(event.target.value)}
            placeholder="+237 6XX XXX XXX"
            className="h-12 w-full rounded-xl border border-white/10 bg-slate-950/45 px-4 text-sm font-bold text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/60"
          />
          <button type="button" onClick={handleCoursePayment} disabled={enrolling} className="btn-primary w-full justify-center !rounded-xl disabled:opacity-60">
            {enrolling ? 'Starting payment...' : 'Pay with Mobile Money'}
          </button>
        </div>
      );
    }

    if ((course?.plan === 'Premium' || (course?.plan === 'Freemium' && Number(course?.price) > 0)) && status.isEnrolled && !status.isPaid) {
      return (
        <div className="space-y-3">
          <input
            type="tel"
            value={paymentPhone}
            onChange={(event) => setPaymentPhone(event.target.value)}
            placeholder="+237 6XX XXX XXX"
            className="h-12 w-full rounded-xl border border-white/10 bg-slate-950/45 px-4 text-sm font-bold text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/60"
          />
          <button type="button" onClick={handleCoursePayment} disabled={enrolling} className="btn-primary w-full justify-center !rounded-xl disabled:opacity-60">
            {enrolling ? 'Starting payment...' : 'Pay for full access'}
          </button>
        </div>
      );
    }

    if (course?.plan === 'Premium' && Number(course?.price) > 0) {
      return (
        <div className="space-y-3">
          <input
            type="tel"
            value={paymentPhone}
            onChange={(event) => setPaymentPhone(event.target.value)}
            placeholder="+237 6XX XXX XXX"
            className="h-12 w-full rounded-xl border border-white/10 bg-slate-950/45 px-4 text-sm font-bold text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/60"
          />
          <button type="button" onClick={handleCoursePayment} disabled={enrolling} className="btn-primary w-full justify-center !rounded-xl disabled:opacity-60">
            {enrolling ? 'Starting payment...' : 'Pay with Mobile Money'}
          </button>
        </div>
      );
    }

    return (
      <button type="button" onClick={handleEnroll} disabled={enrolling} className="btn-primary w-full justify-center !rounded-xl disabled:opacity-60">
        {enrolling ? 'Processing...' : plan.action}
      </button>
    );
  };

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center text-slate-400"><i className="fa-solid fa-circle-notch mr-3 animate-spin" /> Loading course...</div>;
  }

  if (error || !course) {
    return (
      <section className="px-4 py-10">
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-400/20 bg-red-500/10 p-6 text-red-100">{error || 'Course not found.'}</div>
      </section>
    );
  }

  return (
    <section className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Link 
          to={inDashboard ? `/dashboard?view=${fromView}` : `/learning`} 
          className="inline-flex items-center gap-2 text-sm font-black text-slate-400 no-underline hover:text-white"
        >
          <i className="fa-solid fa-arrow-left" aria-hidden="true" /> {t('learning.back_to_courses', 'Back to courses')}
        </Link>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035]">
            <div className="relative aspect-[16/8] bg-slate-900">
              {image ? <img src={image} alt={course.title} className="h-full w-full object-cover" /> : null}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-full border px-3 py-1 text-xs font-black ${plan.tone}`}>{plan.label}</span>
                  <span className="rounded-full border border-white/10 bg-black/35 px-3 py-1 text-xs font-black text-white">{course.category || 'General'}</span>
                </div>
                <h1 className="mt-4 max-w-3xl font-display text-3xl font-black tracking-tight text-white sm:text-5xl">{course.title}</h1>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  [t('learning.chapters', 'Chapters'), stats.sections, 'fa-solid fa-list-check'],
                  [t('learning.videos', 'Videos'), stats.videos, 'fa-solid fa-circle-play'],
                  [t('learning.preview_chapters', 'Preview chapters'), stats.freeSections, 'fa-solid fa-unlock']
                ].map(([label, value, icon]) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-black/15 p-4">
                    <i className={`${icon} text-blue-300`} aria-hidden="true" />
                    <strong className="mt-2 block text-2xl font-black text-white">{value}</strong>
                    <span className="text-xs font-bold text-slate-500">{label}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <h2 className="text-xl font-black text-white">{t('learning.about_course', 'About this course')}</h2>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-400">{description || t('learning.no_description', 'No description provided yet.')}</p>
              </div>
            </div>
          </div>

          <aside className="h-fit rounded-3xl border border-white/10 bg-white/[0.035] p-5 shadow-2xl">
            <p className="text-sm font-bold text-slate-500">{t('learning.course_access', 'Course access')}</p>
            <div className="mt-3 flex items-baseline gap-2">
              <strong className="text-3xl font-black text-white">{Number(course.price) > 0 ? `${course.price}` : t('learning.free', 'Free')}</strong>
              {Number(course.price) > 0 && <span className="text-sm font-bold text-slate-500">XAF</span>}
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              {course.plan === 'Free' && t('learning.plan_free_desc', 'Enroll and access every chapter immediately.')}
              {course.plan === 'Freemium' && t('learning.plan_freemium_desc', 'Start with free preview chapters. Paid chapters unlock after full access is approved.')}
              {course.plan === 'Premium' && t('learning.plan_premium_desc', 'Enrollment creates a payment request before the course content is unlocked.')}
            </p>
            <div className="mt-5">{primaryAction()}</div>
          </aside>
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.035] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-white">{t('learning.curriculum', 'Curriculum')}</h2>
              <p className="mt-1 text-sm text-slate-500">{t('learning.locked_chapters_helper', 'Locked chapters need full course access.')}</p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {(course.sections || []).map((section, index) => {
              const accessible = canAccessSection(course, section, status);
              const isOpen = openSections[section._id];
              return (
                <div key={section._id} className="overflow-hidden rounded-2xl border border-white/10 bg-black/15">
                  <button
                    type="button"
                    onClick={() => setOpenSections(prev => ({ ...prev, [section._id]: !prev[section._id] }))}
                    className="flex w-full items-center justify-between gap-3 border-none bg-transparent p-4 text-left"
                  >
                    <span className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-sm font-black text-white">{index + 1}</span>
                      <span>
                        <strong className="block text-sm font-black text-white">{section.title}</strong>
                        <small className="text-xs font-bold text-slate-500">{section.videos?.length || 0} videos</small>
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${accessible ? 'bg-emerald-500/10 text-emerald-300' : 'bg-amber-500/10 text-amber-300'}`}>
                        {accessible ? 'Accessible' : 'Locked'}
                      </span>
                      <i className={`fa-solid ${isOpen ? 'fa-chevron-up' : 'fa-chevron-down'} text-slate-500`} aria-hidden="true" />
                    </span>
                  </button>
                  {isOpen && (
                    <div className="border-t border-white/10 p-3">
                      {section.videos?.length ? section.videos.map((video) => (
                        <div key={video._id} className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm">
                          <span className="flex items-center gap-3 text-slate-300">
                            <i className={`fa-solid ${accessible || video.isPreviewable ? 'fa-circle-play text-blue-300' : 'fa-lock text-slate-600'}`} aria-hidden="true" />
                            {video.title || `Video ${getVideoId(video)}`}
                          </span>
                          {(accessible || video.isPreviewable) && status.isEnrolled ? (
                            <Link 
                              to={inDashboard ? `/dashboard?view=course-player&courseId=${courseId}&sectionId=${section._id}&videoId=${video._id}&from=${fromView}` : `/learning/learn/${courseId}/section/${section._id}/video/${video._id}`} 
                              className="text-xs font-black text-blue-300 no-underline hover:text-blue-100"
                            >
                              {t('learning.play', 'Play')}
                            </Link>
                          ) : null}
                        </div>
                      )) : <p className="px-3 py-2 text-sm text-slate-500">No video has been added yet.</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
