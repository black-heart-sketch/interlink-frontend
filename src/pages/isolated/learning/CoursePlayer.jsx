import { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import { Link, useNavigate, useParams, useLocation, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Player from '@vimeo/player';
import { toast } from 'react-toastify';
import { courseService } from '../../services/courseService';
import { canAccessSection, getVideoId } from '../../utils/courseUtils';
import McqQuizModal from '../../components/modals/McqQuizModal';
import CourseChatbot from '../../components/learning/CourseChatbot';

export default function CoursePlayer() {
  const { courseId: routeCourseId, sectionId: routeSectionId, videoId: routeVideoId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const inDashboard = location.pathname.startsWith('/dashboard');
  const fromView = searchParams.get('from') || 'learner-my-learning';

  const courseId = routeCourseId || searchParams.get('courseId');
  const paramSectionId = routeSectionId || searchParams.get('sectionId');
  const paramVideoId = routeVideoId || searchParams.get('videoId');

  const playVideo = (sectionId, videoId) => {
    setShowExam(false);
    if (inDashboard) {
      setSearchParams({
        view: 'course-player',
        courseId,
        sectionId,
        videoId,
        from: fromView
      });
    } else {
      navigate(`/learning/learn/${courseId}/section/${sectionId}/video/${videoId}`);
    }
  };
  
  const [course, setCourse] = useState(null);
  const [theme, setTheme] = useState(() => {
    return document.documentElement.getAttribute('data-theme') || 'dark';
  });

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      setTheme(currentTheme);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });

    return () => observer.disconnect();
  }, []);

  const isDark = theme === 'dark';
  const [status, setStatus] = useState({ isEnrolled: false, isPaid: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [currentSection, setCurrentSection] = useState(null);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [openSections, setOpenSections] = useState({});
  
  const playerContainerRef = useRef(null);
  const playerRef = useRef(null);

  // Video State Tracking
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);
  const [isCompletingVideo, setIsCompletingVideo] = useState(false);
  const [isRequestingChapterAccess, setIsRequestingChapterAccess] = useState(false);
  const [courseExam, setCourseExam] = useState(null);
  const [showExam, setShowExam] = useState(false);
  const [isLoadingExam, setIsLoadingExam] = useState(false);
  const [examAnswers, setExamAnswers] = useState({ mcqAnswers: {}, structuredAnswers: {} });
  const [isSubmittingExam, setIsSubmittingExam] = useState(false);
  const [examRemainingSeconds, setExamRemainingSeconds] = useState(null);
  const [examSubmittedResult, setExamSubmittedResult] = useState(null);

  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds) || timeInSeconds === null || timeInSeconds === undefined) return '0:00';
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  const formatExamTime = (seconds) => {
    const safeSeconds = Math.max(0, Number(seconds || 0));
    const minutes = Math.floor(safeSeconds / 60);
    const rest = safeSeconds % 60;
    return `${minutes}:${rest < 10 ? '0' : ''}${rest}`;
  };

  // Notion / Quiz State
  const [activeNotion, setActiveNotion] = useState(null);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [allQuizQuestions, setAllQuizQuestions] = useState([]);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);
  const [quizAttempt, setQuizAttempt] = useState(0);
  const [usedQuestions, setUsedQuestions] = useState([]);

  const [notionsPassedThisSession, setNotionsPassedThisSession] = useState(new Set());
  const [nextNotionTimeToReach, setNextNotionTimeToReach] = useState(Infinity);
  
  const timeUpdateIntervalRef = useRef(null);
  const seekRestrictedRef = useRef(false);
  const autoCompleteRef = useRef(new Set());

  const isLoggedIn = !!(sessionStorage.getItem('token') || localStorage.getItem('token'));

  const completedVideoIds = useMemo(() => (
    new Set((status.progress?.completedVideos || []).map(id => String(id?._id || id)))
  ), [status.progress?.completedVideos]);

  const allCourseVideos = useMemo(() => (
    (course?.sections || []).flatMap(section => section.videos || [])
  ), [course?.sections]);

  const allCourseNotions = useMemo(() => (
    allCourseVideos.flatMap(video => video.notions || video.markers || [])
  ), [allCourseVideos]);

  const completedNotionIds = useMemo(() => (
    new Set((status.progress?.completedNotions || []).map(id => String(id?._id || id)))
  ), [status.progress?.completedNotions]);

  const allVideosCompleted = allCourseVideos.length > 0 && allCourseVideos.every(video => completedVideoIds.has(String(video._id)));
  const allNotionsCompleted = allCourseNotions.every(notion => completedNotionIds.has(String(notion._id)));
  const finalExamPublished = courseExam?.status === 'published';
  const canAccessFinalExam = !!courseExam && finalExamPublished && allVideosCompleted && allNotionsCompleted;

  const overallProgress = useMemo(() => {
    const sections = course?.sections || [];
    if (sections.length === 0) return 0;
    let totalProgressSum = 0;
    sections.forEach(section => {
      const sectionVideos = section.videos || [];
      if (sectionVideos.length > 0) {
        const completedInSection = sectionVideos.filter(v => completedVideoIds.has(String(v._id))).length;
        totalProgressSum += (completedInSection / sectionVideos.length) * 100;
      }
    });
    return Math.round(totalProgressSum / sections.length);
  }, [course?.sections, completedVideoIds]);

  // Load Course
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (!isLoggedIn) {
        const targetPath = inDashboard 
          ? `/dashboard?view=course-player&courseId=${courseId}&from=${fromView}`
          : `/learning/learn/${courseId}`;
        navigate('/login', { state: { from: targetPath } });
        return;
      }
      
      const [courseData, enrollmentData] = await Promise.all([
        courseService.getCourseDetails(courseId),
        courseService.getMyCourseEnrollmentStatus(courseId).catch(() => ({ isEnrolled: false, isPaid: false }))
      ]);
      
      if (!enrollmentData.isEnrolled) {
        if (inDashboard) {
          setSearchParams({
            view: 'course-detail',
            courseId,
            from: fromView
          });
        } else {
          navigate(`/learning/courses/${courseId}`);
        }
        return;
      }
      
      if (courseData && courseData.sections) {
        courseData.sections = courseData.sections.filter(s => s.published);
      }
      
      setCourse(courseData);
      setStatus(enrollmentData);
      
      let activeSection = null;
      let activeVideo = null;
      
      if (courseData.sections && courseData.sections.length > 0) {
        if (paramSectionId && paramVideoId) {
          activeSection = courseData.sections.find(s => s._id === paramSectionId);
          if (activeSection) {
            activeVideo = activeSection.videos?.find(v => v._id === paramVideoId);
          }
        }
        
        if (!activeVideo) {
          for (const section of courseData.sections) {
            if (canAccessSection(courseData, section, enrollmentData)) {
              if (section.videos && section.videos.length > 0) {
                activeSection = section;
                activeVideo = section.videos[0];
                break;
              }
            }
          }
        }
      }
      
      if (activeSection && activeVideo) {
        setCurrentSection(activeSection);
        setCurrentVideo(activeVideo);
        setOpenSections({ [activeSection._id]: true });
        
        if (!paramSectionId || !paramVideoId) {
          if (inDashboard) {
            setSearchParams({
              view: 'course-player',
              courseId,
              sectionId: activeSection._id,
              videoId: activeVideo._id,
              from: fromView
            }, { replace: true });
          } else {
            navigate(`/learning/learn/${courseId}/section/${activeSection._id}/video/${activeVideo._id}`, { replace: true });
          }
        }
      }
      
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load this course.');
    } finally {
      setLoading(false);
    }
  }, [courseId, paramSectionId, paramVideoId, isLoggedIn, navigate]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!courseId || !isLoggedIn) return;
    setIsLoadingExam(true);
    courseService.getCourseExam(courseId)
      .then(data => setCourseExam(data.exam || null))
      .catch(() => {})
      .finally(() => setIsLoadingExam(false));
  }, [courseId, isLoggedIn]);

  useEffect(() => {
    if (!showExam || !canAccessFinalExam || !courseExam || examSubmittedResult) return;
    setExamRemainingSeconds(prev => prev ?? Number(courseExam.durationMinutes || 60) * 60);
  }, [showExam, canAccessFinalExam, courseExam, examSubmittedResult]);

  useEffect(() => {
    if (!showExam || !canAccessFinalExam || examSubmittedResult || examRemainingSeconds === null) return;
    if (examRemainingSeconds <= 0) {
      handleSubmitCourseExam();
      return;
    }

    const timer = setInterval(() => {
      setExamRemainingSeconds(prev => {
        if (prev === null) return prev;
        return Math.max(0, prev - 1);
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showExam, canAccessFinalExam, examRemainingSeconds, examSubmittedResult]);

  // Compute Notions
  const sortedMarkers = useCallback(() => {
    const notions = currentVideo?.notions || currentVideo?.markers || [];
    return [...notions].sort((a, b) => a.time - b.time);
  }, [currentVideo]);

  // Recompute next notion time
  useEffect(() => {
    const markers = sortedMarkers();
    if (!markers.length) {
      setNextNotionTimeToReach(Infinity);
      return;
    }
    
    let maxTime = 0;
    const combined = new Set([
      ...(status?.progress?.completedNotions || []),
      ...notionsPassedThisSession
    ]);
    
    combined.forEach(id => {
      const m = markers.find(x => x._id?.toString() === id.toString());
      if (m && m.time > maxTime) maxTime = m.time;
    });

    let nextT = Infinity;
    for (let m of markers) {
      if (m.time > maxTime && !combined.has(m._id?.toString())) {
        nextT = m.time;
        break;
      }
    }
    setNextNotionTimeToReach(nextT);
  }, [status, sortedMarkers, notionsPassedThisSession]);

  // Handle Vimeo Player initialization
  useEffect(() => {
    if (playerContainerRef.current && currentVideo) {
      const vimeoId = getVideoId(currentVideo);
      if (!vimeoId) return;

      if (playerRef.current) {
        playerRef.current.destroy();
      }

      const isLocked = !canAccessSection(course, currentSection, status) && !currentVideo.isPreviewable;

      if (!isLocked) {
        setDuration(0);
        setCurrentTime(0);
        playerRef.current = new Player(playerContainerRef.current, {
          id: vimeoId,
          responsive: false,
          width: playerContainerRef.current.clientWidth,
          dnt: true
        });

        playerRef.current.getDuration().then(setDuration).catch(err => console.error("Error fetching duration:", err));

        playerRef.current.on('play', () => setIsPlaying(true));
        playerRef.current.on('pause', () => setIsPlaying(false));
        playerRef.current.on('ended', () => {
          setIsPlaying(false);
          checkVideoCompletion();
        });
        
        // Use a strict seek handle event
        playerRef.current.on('seeked', async (e) => {
          const seekedToTime = e.seconds;
          if (nextNotionTimeToReach !== Infinity && seekedToTime > nextNotionTimeToReach) {
            if (!seekRestrictedRef.current) {
              seekRestrictedRef.current = true;
              try {
                await playerRef.current.pause();
                setIsPlaying(false);
                const backTo = Math.max(0, nextNotionTimeToReach - 2);
                await playerRef.current.setCurrentTime(backTo);
                toast.warn('You cannot skip ahead past an uncompleted checkpoint.');
                setTimeout(() => { seekRestrictedRef.current = false; }, 1000);
              } catch (error) {
                seekRestrictedRef.current = false;
              }
            }
          }
        });
        
        const resizeObserver = new ResizeObserver(entries => {
          for (let entry of entries) {
            if (playerRef.current && playerRef.current.element) {
              const width = entry.contentRect.width;
              playerRef.current.element.width = width;
              playerRef.current.element.height = width * (9/16);
            }
          }
        });
        resizeObserver.observe(playerContainerRef.current);
        
        return () => {
          resizeObserver.disconnect();
          if (playerRef.current) {
            playerRef.current.destroy().catch(() => {});
          }
          if (timeUpdateIntervalRef.current) {
            clearInterval(timeUpdateIntervalRef.current);
          }
        };
      }
    }
  }, [currentVideo, currentSection, course, status, nextNotionTimeToReach]); // added nextNotionTimeToReach dependency for seek check update

  // Check Notion Timestamps Loop
  const checkNotionTimestamps = useCallback(async () => {
    if (!playerRef.current || isQuizModalOpen || activeNotion) return;
    
    try {
      const paused = await playerRef.current.getPaused();
      if (paused) return;
      
      const t = await playerRef.current.getCurrentTime();
      setCurrentTime(t);
      
      const markers = sortedMarkers();
      for (let m of markers) {
        const done = notionsPassedThisSession.has(m._id) ||
                     (status?.progress?.completedNotions || []).includes(m._id);
        
        // Strict timestamp boundary: pause as soon as they cross it
        // Check a 2-second window to ensure we don't miss it
        if (t >= m.time && t <= m.time + 2.0 && !done) {
          await playerRef.current.pause();
          setIsPlaying(false);
          setActiveNotion(m);
          setQuizAttempt(1);
          break;
        }
      }
    } catch (error) {
      console.error('Error in checkNotionTimestamps:', error);
    }
  }, [sortedMarkers, isQuizModalOpen, activeNotion, notionsPassedThisSession, status]);

  // Interval loop setup
  useEffect(() => {
    if (playerRef.current && !isQuizModalOpen && !activeNotion) {
      timeUpdateIntervalRef.current = setInterval(async () => {
        if (!playerRef.current) return;
        try {
          const paused = await playerRef.current.getPaused();
          const currentPlayerTime = await playerRef.current.getCurrentTime();
          const actuallyPlaying = !paused;
          
          if (actuallyPlaying !== isPlaying) {
            setIsPlaying(actuallyPlaying);
          }
          setCurrentTime(currentPlayerTime);

          if (
            actuallyPlaying &&
            duration > 0 &&
            currentPlayerTime >= duration * 0.95 &&
            !currentVideoCompleted
          ) {
            await handleAutoCompleteVideo();
          }
          
          // Double check bypasses. Ensure we allow enough buffer for the notion trigger to fire first.
          // The notion trigger fires between [m.time, m.time + 1.5].
          // Seek bypass should only trigger if they skipped significantly past the notion.
          if (actuallyPlaying && nextNotionTimeToReach !== Infinity && currentPlayerTime > nextNotionTimeToReach + 1.5) {
            if (!seekRestrictedRef.current) {
              seekRestrictedRef.current = true;
              await playerRef.current.pause();
              setIsPlaying(false);
              const backTo = Math.max(0, nextNotionTimeToReach - 2);
              await playerRef.current.setCurrentTime(backTo);
              toast.warn('Please complete the checkpoint before proceeding.');
              setTimeout(() => { seekRestrictedRef.current = false; }, 1000);
            }
            return;
          }
          
          if (actuallyPlaying && !seekRestrictedRef.current) {
            await checkNotionTimestamps();
          }
        } catch (error) {
           // ignore
        }
      }, 500);
      
      return () => {
        if (timeUpdateIntervalRef.current) {
          clearInterval(timeUpdateIntervalRef.current);
          timeUpdateIntervalRef.current = null;
        }
      };
    }
  }, [playerRef.current, isQuizModalOpen, activeNotion, checkNotionTimestamps, nextNotionTimeToReach, isPlaying]);

  const shuffle = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Fetch Quiz logic
  const fetchAndShowQuiz = async (notion, attempt) => {
    setIsLoadingQuiz(true);
    setIsQuizModalOpen(true);
    
    try {
      let pool = [];
      const needsNewQuestions = attempt === 1 || allQuizQuestions.length === 0;
      
      if (needsNewQuestions) {
        const resp = await courseService.generateNotionQuizApi({
          notionId: notion._id,
          notionDescription: notion.description,
          notionTitle: notion.title,
          videoId: currentVideo?._id,
          courseContext: courseId,
          courseTitle: course?.title,
          courseDescription: course?.description,
          attempt,
          questionCount: 24,
          lang: localStorage.getItem('i18nextLng') || 'en'
        });
        
        pool = resp.questions || [];
        setAllQuizQuestions(pool);
        setUsedQuestions([]);
      } else {
        pool = allQuizQuestions;
      }
      
      const usedQuestionIds = usedQuestions || [];
      const remainingQuestions = pool.filter(q => !usedQuestionIds.includes(q._id));
      
      if (remainingQuestions.length === 0) {
        return await fetchAndShowQuiz(notion, 1);
      }
      
      const questionsToShow = shuffle(remainingQuestions).slice(0, 8);
      setQuizQuestions(questionsToShow);
      
      const newUsedQuestions = [...usedQuestionIds, ...questionsToShow.map(q => q._id)];
      setUsedQuestions(newUsedQuestions);
      
    } catch (err) {
      console.error('Quiz error:', err);
      toast.error(`Failed to load quiz for "${notion.title}".`);
      setIsQuizModalOpen(false);
      setActiveNotion(null);
    } finally {
      setIsLoadingQuiz(false);
    }
  };

  useEffect(() => {
    if (activeNotion && quizAttempt > 0) {
      fetchAndShowQuiz(activeNotion, quizAttempt);
    }
  }, [activeNotion, quizAttempt]);

  const findPreviousMarkerTime = (cTime) => {
    const markers = sortedMarkers();
    let prev = 0;
    for (let i = markers.length - 1; i >= 0; i--) {
      if (markers[i].time < cTime) {
        prev = markers[i].time;
        break;
      }
    }
    return prev;
  };

  const handleSubmitQuiz = async (answers) => {
    let correct = 0;
    quizQuestions.forEach(q => {
      const sel = answers[q._id];
      const right = q.options.find(o => o.isCorrect);
      if (right && (right._id === sel || right.text === sel)) correct++;
    });
    const pct = (correct / quizQuestions.length) * 100;

    if (pct >= 60) {
      toast.success(`Passed "${activeNotion.title}"!`);
      const passedSet = new Set([...notionsPassedThisSession, activeNotion._id]);
      setNotionsPassedThisSession(passedSet);
      
      setIsQuizModalOpen(false);
      setActiveNotion(null);
      setQuizAttempt(0);
      
      setTimeout(() => playerRef.current?.play(), 500);
      
      // Update backend
      try {
        if (status.enrollmentId) {
          const response = await courseService.updateProgressApi(status.enrollmentId, {
            notionId: activeNotion._id
          });
          setStatus(prev => ({
            ...prev,
            progress: response.enrollment?.progress || prev.progress
          }));
        }
      } catch (err) {
        // ignore
      }
    } else if (quizAttempt < 3) {
      toast.info(`You scored ${pct.toFixed(0)}%. Retrying next set of questions...`);
      setQuizAttempt(quizAttempt + 1);
    } else {
      toast.error(`Final attempt failed. Please review the video and try again.`);
      setIsQuizModalOpen(false);
      const rewindTo = findPreviousMarkerTime(activeNotion.time);
      playerRef.current?.setCurrentTime(rewindTo).then(() => playerRef.current.play());
      setActiveNotion(null);
      setQuizAttempt(0);
    }
  };

  const handleCloseQuiz = async () => {
    setIsQuizModalOpen(false);

    if (activeNotion?.time !== undefined) {
      const rewindTo = Math.max(0, activeNotion.time - 2);
      try {
        await playerRef.current?.pause();
        await playerRef.current?.setCurrentTime(rewindTo);
      } catch (err) {
        // The player may not be ready yet; closing should still be allowed.
      }
      toast.info('Quiz closed. Pass this checkpoint before continuing past the notion.');
    }

    setActiveNotion(null);
    setQuizAttempt(0);
  };

  const checkVideoCompletion = () => {
    const markers = sortedMarkers();
    const allIds = markers.map(m => m._id?.toString() || m.title);
    const passed = new Set([
      ...(status?.progress?.completedNotions || []).map(String),
      ...[...notionsPassedThisSession].map(String)
    ]);
    
    // Check if every notion has been passed
    const allDone = allIds.every(id => passed.has(id));
    if (allDone) {
      // mark video complete logic would go here
    }
  };

  const handleSeekClick = async (e) => {
    if (!playerRef.current || duration === 0) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const clickPercent = clickX / width;
    const targetTime = clickPercent * duration;

    // Enforce strict seek restrictions on the custom seeker bar too
    if (nextNotionTimeToReach !== Infinity && targetTime > nextNotionTimeToReach) {
      toast.warn('You cannot skip ahead past an uncompleted checkpoint.');
      return;
    }

    try {
      await playerRef.current.setCurrentTime(targetTime);
      setCurrentTime(targetTime);
    } catch (err) {
      console.error('Failed to seek:', err);
    }
  };

  const seekToNotion = async (notion) => {
    if (playerRef.current) {
      const combined = new Set([
        ...(status?.progress?.completedNotions || []),
        ...notionsPassedThisSession
      ]);
      
      // If jumping forward to an uncompleted notion, it's allowed ONLY to just before it.
      // But we shouldn't allow bypassing the current restriction
      if (notion.time > nextNotionTimeToReach + 0.5) {
        toast.warn("You cannot jump to future checkpoints yet.");
        return;
      }
      
      await playerRef.current.setCurrentTime(notion.time);
      playerRef.current.play();
    }
  };

  const isVideoLocked = currentSection && currentVideo && !canAccessSection(course, currentSection, status) && !currentVideo.isPreviewable;

  if (loading) {
    return <div className={`flex ${inDashboard ? 'min-h-[50vh]' : 'min-h-screen bg-[#06091a]'} items-center justify-center text-slate-400`}><i className="fa-solid fa-circle-notch mr-3 animate-spin text-2xl" /> {t('learning.loading_player', 'Loading course player...')}</div>;
  }

  if (error || !course) {
    return (
      <div className={`flex ${inDashboard ? 'min-h-[55vh]' : 'min-h-screen bg-[#06091a]'} items-center justify-center p-4`}>
        <div className="w-full max-w-lg rounded-3xl border border-red-400/20 bg-red-500/10 p-8 text-center shadow-2xl">
          <i className="fa-solid fa-triangle-exclamation text-4xl text-red-400"></i>
          <h2 className="mt-4 text-xl font-black text-white">Oops!</h2>
          <p className="mt-2 text-sm text-red-200">{error || 'Course not found.'}</p>
          <button 
            type="button" 
            onClick={() => inDashboard ? setSearchParams({ view: fromView }) : navigate('/learning')} 
            className="btn-primary mt-6 justify-center !rounded-xl mx-auto"
          >
            {inDashboard ? t('learning.back', 'Back') : t('learning.go_to_courses', 'Go to Courses')}
          </button>
        </div>
      </div>
    );
  }

  const currentVideoDescription = currentVideo?.description || 'No description available for this video.';
  const currentTranscript = currentVideo?.transcript || currentVideo?.videoTranscript || currentSection?.videoTranscript;
  const totalSections = course.sections?.length || 0;
  const totalVideos = (course.sections || []).reduce((sum, section) => sum + (section.videos?.length || 0), 0);
  const coursePrice = course.price ? `${course.price}` : (String(course.plan).toLowerCase() === 'premium' ? 'Premium' : 'Free');
  const sectionResources = currentSection?.resources || currentVideo?.resources || [];
  const currentVideoId = currentVideo?._id ? String(currentVideo._id) : '';
  const currentVideoCompleted = currentVideoId ? completedVideoIds.has(currentVideoId) : false;
  const isPerChapterPayment = String(course.paymentType || '').toLowerCase() === 'per_chapter';
  const paidLockedSections = (course.sections || []).filter(section => section.isLocked && !section.isPreviewable).length || totalSections || 1;
  const currentChapterPrice = Number(currentSection?.priceIfLocked || 0) > 0
    ? Number(currentSection.priceIfLocked)
    : Number(course.price || 0) > 0
      ? Number((Number(course.price) / paidLockedSections).toFixed(2))
      : 0;
  const pendingChapterPayment = (status.pendingSectionPayments || []).find(item => (
    String(item.section?._id || item.section) === String(currentSection?._id) && item.status === 'pending'
  ));
  const transcriptText = typeof currentTranscript === 'string'
    ? currentTranscript
    : currentTranscript
      ? JSON.stringify(currentTranscript, null, 2)
      : '';
  const findNextContent = () => {
    if (!currentSection || !currentVideo) return null;
    const sections = course.sections || [];
    const currentSectionIndex = sections.findIndex(section => section._id === currentSection._id);
    const videos = currentSection.videos || [];
    const currentVideoIndex = videos.findIndex(video => video._id === currentVideo._id);
    const nextVideo = videos[currentVideoIndex + 1];

    if (nextVideo) {
      return { section: currentSection, video: nextVideo };
    }

    const nextSection = sections.slice(currentSectionIndex + 1).find(section => section.videos?.length);
    return nextSection ? { section: nextSection, video: nextSection.videos[0] } : null;
  };
  const handleMarkVideoComplete = async () => {
    if (!status.enrollmentId || !currentSection || !currentVideo || isVideoLocked) return;

    setIsCompletingVideo(true);
    try {
      const nextCompletedVideos = new Set([...completedVideoIds, String(currentVideo._id)]);
      const sectionVideoIds = (currentSection.videos || []).map(video => String(video._id));
      const sectionComplete = sectionVideoIds.length > 0 && sectionVideoIds.every(id => nextCompletedVideos.has(id));
      
      const sections = course?.sections || [];
      let totalProgressSum = 0;
      sections.forEach(section => {
        const sectionVideos = section.videos || [];
        if (sectionVideos.length > 0) {
          const completedInSection = sectionVideos.filter(v => nextCompletedVideos.has(String(v._id))).length;
          totalProgressSum += (completedInSection / sectionVideos.length) * 100;
        }
      });
      const completedPercentage = sections.length > 0 ? Math.round(totalProgressSum / sections.length) : 0;

      const response = await courseService.updateProgressApi(status.enrollmentId, {
        videoId: currentVideo._id,
        sectionId: sectionComplete ? currentSection._id : undefined,
        completedPercentage
      });

      setStatus(prev => ({
        ...prev,
        status: response.enrollment?.status || prev.status,
        progress: response.enrollment?.progress || {
          ...prev.progress,
          completedVideos: Array.from(nextCompletedVideos),
          overallPercentage: Math.max(prev.progress?.overallPercentage || 0, completedPercentage)
        }
      }));
      toast.success(t('learning.video_marked_complete', 'Video marked as complete.'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('learning.video_complete_failed', 'Unable to mark this video as complete.'));
    } finally {
      setIsCompletingVideo(false);
    }
  };
  const handleAutoCompleteVideo = async () => {
    if (!currentVideo?._id || currentVideoCompleted || autoCompleteRef.current.has(String(currentVideo._id))) return;
    const markers = sortedMarkers();
    const combinedNotions = new Set([
      ...(status?.progress?.completedNotions || []).map(id => String(id?._id || id)),
      ...[...notionsPassedThisSession].map(id => String(id))
    ]);
    const allVideoNotionsPassed = markers.every(marker => combinedNotions.has(String(marker._id)));
    if (!allVideoNotionsPassed) return;

    autoCompleteRef.current.add(String(currentVideo._id));
    await handleMarkVideoComplete();
  };
  const handleRequestChapterAccess = async () => {
    if (!status.enrollmentId || !currentSection) {
      toast.info(t('learning.enroll_before_payment', 'Please enroll before requesting chapter access.'));
      return;
    }

    if (!isPerChapterPayment) {
      if (inDashboard) {
        setSearchParams({ view: 'course-detail', courseId, from: fromView });
      } else {
        navigate(`/learning/courses/${courseId}`);
      }
      return;
    }

    setIsRequestingChapterAccess(true);
    try {
      const response = await courseService.requestSectionAccess(status.enrollmentId, currentSection._id);
      setStatus(prev => ({
        ...prev,
        paidSections: response.enrollment?.paidSections || prev.paidSections || [],
        pendingSectionPayments: response.enrollment?.pendingSectionPayments || prev.pendingSectionPayments || []
      }));
      toast.success(response.message || t('learning.chapter_payment_requested', 'Chapter payment request created.'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('learning.chapter_payment_failed', 'Unable to request chapter access.'));
    } finally {
      setIsRequestingChapterAccess(false);
    }
  };
  const handleSubmitCourseExam = async () => {
    if (!canAccessFinalExam || examSubmittedResult || isSubmittingExam) return;
    setIsSubmittingExam(true);
    try {
      const response = await courseService.submitCourseExam(courseId, examAnswers);
      setExamSubmittedResult(response);
      setExamRemainingSeconds(0);
      toast.success(`Exam submitted. Score: ${response.totalScore}/${response.totalMarks}.`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to submit the exam.');
    } finally {
      setIsSubmittingExam(false);
    }
  };
  const goToNextVideo = () => {
    const next = findNextContent();
    if (!next) {
      toast.info(t('learning.no_next_content', 'You have reached the last content in this course.'));
      return;
    }

    const nextLocked = !canAccessSection(course, next.section, status) && !next.video.isPreviewable;
    playVideo(next.section._id, next.video._id);
    if (nextLocked) {
      toast.info(t('learning.next_content_locked', 'The next content is locked. Choose the payment option to continue.'));
    }
  };

  return (
    <div className={inDashboard ? "p-0" : `min-h-screen ${isDark ? 'bg-[#06091a] text-slate-100' : 'bg-white text-slate-900'} pt-[80px]`}>
      <div className={inDashboard ? `overflow-hidden rounded-[1.5rem] border ${isDark ? 'border-slate-800 bg-[#0d1526] shadow-sm' : 'border-slate-200 bg-white shadow-sm'}` : `min-h-[calc(100vh-80px)] ${isDark ? 'bg-[#06091a]' : 'bg-white'}`}>
        <div className="grid min-h-[calc(100vh-80px)] lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className={`border-r ${isDark ? 'border-slate-800 bg-[#0b1329]' : 'border-slate-200 bg-white'}`}>
            <div className="sticky top-[80px] flex max-h-[calc(100vh-80px)] flex-col">
              <div className={`flex h-20 items-center justify-between border-b ${isDark ? 'border-slate-800' : 'border-slate-200'} px-5`}>
                <h2 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('learning.course_content', 'Course Content')}</h2>
                <Link
                  to={inDashboard ? `/dashboard?view=course-detail&courseId=${courseId}&from=${fromView}` : `/learning/courses/${courseId}`}
                  className={`flex h-10 w-10 items-center justify-center rounded-full transition ${isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-blue-700'}`}
                  title={t('learning.back', 'Back')}
                >
                  <i className="fa-solid fa-arrow-left"></i>
                </Link>
              </div>

              <div className={`border-b ${isDark ? 'border-slate-800' : 'border-slate-200'} px-5 py-4`}>
                <div className={`flex items-center justify-between text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  <span>{t('learning.overall_progress', 'Overall Progress')}</span>
                  <span>{overallProgress}%</span>
                </div>
                <div className={`mt-2 h-2 overflow-hidden rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-600 to-sky-500 transition-all duration-500"
                    style={{ width: `${overallProgress}%` }}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto py-3">
                {(course.sections || []).map((section, index) => {
                  const accessible = canAccessSection(course, section, status);
                  const isOpen = openSections[section._id] || currentSection?._id === section._id;

                  return (
                    <div key={section._id} className={`border-b ${isDark ? 'border-slate-800/60' : 'border-slate-100'} last:border-b-0`}>
                      <button
                        type="button"
                        onClick={() => setOpenSections(prev => ({ ...prev, [section._id]: !prev[section._id] }))}
                        className={`flex w-full cursor-pointer items-center gap-3 px-5 py-4 text-left transition ${isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}`}
                      >
                        <i className={`fa-solid ${isOpen ? 'fa-chevron-up' : 'fa-chevron-down'} text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                        <span className="min-w-0 flex-1">
                          <span className={`block truncate text-sm font-black ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{section.title || `Section ${index + 1}`}</span>
                          <span className={`mt-0.5 block text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{section.videos?.length || 0} item(s)</span>
                        </span>
                        {!accessible && <i className={`fa-solid fa-lock text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`} title="Locked"></i>}
                      </button>

                      {isOpen && (
                        <div className="pb-2">
                          {section.videos?.length ? section.videos.map((video, vIndex) => {
                            const isActive = currentVideo?._id === video._id;
                            const isVidLocked = !accessible && !video.isPreviewable;

                            return (
                              <button
                                key={video._id}
                                type="button"
                                onClick={() => {
                                  playVideo(section._id, video._id);
                                }}
                                className={`flex w-full items-center gap-3 px-5 py-3 text-left transition ${
                                  isActive 
                                    ? (isDark ? 'bg-blue-950/40 text-blue-200' : 'bg-blue-50 text-blue-950') 
                                    : (isDark ? 'text-slate-300 hover:bg-slate-800/30' : 'text-slate-700 hover:bg-slate-50')
                                } cursor-pointer ${isVidLocked ? 'opacity-70' : ''}`}
                              >
                                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                                  isActive 
                                    ? 'border-blue-500 text-blue-500' 
                                    : (isDark ? 'border-slate-800 text-slate-400' : 'border-blue-200 text-blue-600')
                                }`}>
                                  <i className={`fa-solid ${isVidLocked ? 'fa-lock' : 'fa-play'} text-[10px] ${isVidLocked ? '' : 'ml-0.5'}`}></i>
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className={`block truncate text-sm ${isActive ? 'font-black' : 'font-semibold'}`}>
                                    {video.title || `Video ${getVideoId(video) || vIndex + 1}`}
                                  </span>
                                  {video.duration && <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{video.duration}m</span>}
                                </span>
                                {video.isPreviewable && !accessible && (
                                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-black uppercase text-blue-700">Free</span>
                                )}
                              </button>
                            );
                          }) : (
                            <p className={`px-12 pb-4 text-xs font-semibold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No videos in this section.</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                <div className={`border-t ${isDark ? 'border-slate-800' : 'border-slate-200'} px-3 py-4`}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowExam(true);
                      if (!canAccessFinalExam) {
                        toast.info(t('learning.exam_locked_until_complete', 'Complete all videos and notion checkpoints before taking the final exam.'));
                      }
                    }}
                    className={`flex w-full cursor-pointer items-center gap-3 rounded-2xl px-4 py-4 text-left transition ${
                      showExam 
                        ? (isDark ? 'bg-blue-950/40 text-blue-200' : 'bg-blue-50 text-blue-950') 
                        : (isDark ? 'text-slate-300 hover:bg-slate-800/30' : 'text-slate-700 hover:bg-slate-50')
                    }`}
                  >
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      canAccessFinalExam 
                        ? 'bg-blue-100 text-blue-700' 
                        : (isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500')
                    }`}>
                      <i className={`fa-solid ${canAccessFinalExam ? 'fa-award' : 'fa-lock'}`}></i>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-black">{courseExam?.title || 'Final Exam'}</span>
                      <span className={`mt-0.5 block text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {!courseExam || !finalExamPublished ? 'Not published yet' : canAccessFinalExam ? 'Ready after course completion' : 'Locked until all lessons are complete'}
                      </span>
                    </span>
                    {isLoadingExam && <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />}
                  </button>
                </div>
              </div>
            </div>
          </aside>

          <main className={`min-w-0 overflow-y-auto ${isDark ? 'bg-[#06091a]' : 'bg-white'} px-5 py-5 sm:px-7 lg:px-8`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className={`flex min-w-0 items-center gap-2 text-sm font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                <i className={`fa-solid fa-house text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}></i>
                <Link to={inDashboard ? `/dashboard?view=${fromView}` : '/learning'} className="hover:text-blue-700">
                  {t('learning.my_learning', 'My Learning')}
                </Link>
                <span>/</span>
                <span className={`truncate ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{course.title}</span>
              </div>
              <span className={`rounded-full border px-3 py-1 text-sm font-bold shadow-sm ${
                isDark ? 'border-slate-800 bg-[#0d1526] text-slate-300' : 'border-slate-300 bg-white text-slate-600'
              }`}>
                {overallProgress}% {t('learning.complete', 'Complete')}
              </span>
            </div>

            {showExam ? (
              <section className={`mt-6 rounded-[1.5rem] border p-6 shadow-sm ${
                isDark ? 'border-slate-800 bg-[#0d1526]' : 'border-slate-200 bg-white'
              }`}>
                <div className={`flex flex-wrap items-start justify-between gap-4 border-b pb-5 ${
                  isDark ? 'border-slate-800' : 'border-slate-200'
                }`}>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-blue-600">Final assessment</p>
                    <h1 className={`mt-2 text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{courseExam?.title || 'Final Course Exam'}</h1>
                    <p className={`mt-2 max-w-3xl text-sm leading-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {canAccessFinalExam
                        ? (courseExam?.instructions || 'Answer all questions carefully.')
                        : !finalExamPublished
                          ? 'The final exam has not been published by the instructor yet.'
                          : 'This exam unlocks after all videos are completed and every notion checkpoint has been passed.'}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-black ${canAccessFinalExam ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                    {canAccessFinalExam ? 'Unlocked' : !finalExamPublished ? 'Not Published' : 'Locked'}
                  </span>
                </div>
                {canAccessFinalExam && (
                  <div className={`mt-5 grid gap-3 rounded-2xl border p-4 md:grid-cols-3 ${
                    isDark ? 'border-slate-800 bg-[#0b1329]' : 'border-slate-200 bg-slate-50'
                  }`}>
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-slate-500">Time remaining</span>
                      <strong className={`mt-1 block text-2xl font-black ${examRemainingSeconds <= 300 ? 'text-red-500' : isDark ? 'text-white' : 'text-slate-900'}`}>
                        {formatExamTime(examRemainingSeconds ?? Number(courseExam.durationMinutes || 60) * 60)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-slate-500">Total marks</span>
                      <strong className={`mt-1 block text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{courseExam.totalMarks || 100}</strong>
                    </div>
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-slate-500">Status</span>
                      <strong className={`mt-1 block text-sm font-black ${examSubmittedResult ? 'text-emerald-500' : 'text-blue-500'}`}>
                        {examSubmittedResult ? `Submitted: ${examSubmittedResult.totalScore}/${examSubmittedResult.totalMarks}` : 'In progress'}
                      </strong>
                    </div>
                  </div>
                )}

                {!courseExam ? (
                  <div className="py-14 text-center">
                    <i className={`fa-solid fa-file-circle-question text-4xl ${isDark ? 'text-slate-700' : 'text-slate-300'}`}></i>
                    <p className={`mt-4 text-sm font-semibold ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>No final exam has been published for this course yet.</p>
                  </div>
                ) : !finalExamPublished ? (
                  <div className="py-14 text-center">
                    <i className={`fa-solid fa-file-shield text-4xl ${isDark ? 'text-slate-700' : 'text-slate-300'}`}></i>
                    <p className={`mt-4 text-sm font-semibold ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>The instructor has not published this final exam yet.</p>
                  </div>
                ) : !canAccessFinalExam ? (
                  <div className="mt-6 grid gap-4 md:grid-cols-3">
                    <div className={`rounded-2xl p-5 ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
                      <div className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{completedVideoIds.size}/{allCourseVideos.length}</div>
                      <div className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">Videos completed</div>
                    </div>
                    <div className={`rounded-2xl p-5 ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
                      <div className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{completedNotionIds.size}/{allCourseNotions.length}</div>
                      <div className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">Notions passed</div>
                    </div>
                    <div className={`rounded-2xl p-5 ${isDark ? 'bg-amber-950/40 text-amber-300' : 'bg-amber-50 text-amber-800'}`}>
                      <i className="fa-solid fa-lock mr-2"></i>
                      <span className="text-sm font-black">Keep learning to unlock the exam.</span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 space-y-8">
                    <section>
                      <h2 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>MCQ Questions</h2>
                      <div className="mt-4 space-y-4">
                        {(courseExam.mcqs || []).map((question, index) => (
                          <div key={question._id || index} className={`rounded-2xl border p-5 ${
                            isDark ? 'border-slate-800 bg-[#0b1329]' : 'border-slate-200 bg-slate-50'
                          }`}>
                            <p className={`font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{index + 1}. {question.questionText}</p>
                            <span className="mt-2 inline-flex rounded-full bg-blue-500/10 px-3 py-1 text-xs font-black text-blue-500">{question.points || 0} marks</span>
                            <div className="mt-3 grid gap-2 md:grid-cols-2">
                              {(question.options || []).map((option, optionIndex) => (
                                <label key={option._id || optionIndex} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                                  isDark 
                                    ? 'border-slate-800 bg-[#0d1526] text-slate-300 hover:border-slate-700' 
                                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                                }`}>
                                  <input
                                    type="radio"
                                    name={`exam-${question._id || index}`}
                                    disabled={!!examSubmittedResult || examRemainingSeconds === 0}
                                    checked={examAnswers.mcqAnswers[String(question._id)] === String(option._id)}
                                    onChange={() => setExamAnswers(prev => ({
                                      ...prev,
                                      mcqAnswers: { ...prev.mcqAnswers, [String(question._id)]: String(option._id) }
                                    }))}
                                  />
                                  <span>{option.text}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section>
                      <h2 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Structured Questions</h2>
                      <div className="mt-4 space-y-4">
                        {(courseExam.structuredQuestions || []).map((question, index) => (
                          <div key={question._id || index} className={`rounded-2xl border p-5 shadow-sm ${
                            isDark ? 'border-slate-800 bg-[#0b1329]' : 'border-slate-200 bg-white'
                          }`}>
                            <p className={`font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{index + 1}. {question.prompt}</p>
                            <span className="mt-2 inline-flex rounded-full bg-blue-500/10 px-3 py-1 text-xs font-black text-blue-500">{question.points || 0} marks</span>
                            <textarea
                              rows={5}
                              disabled={!!examSubmittedResult || examRemainingSeconds === 0}
                              className={`mt-3 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-blue-400 ${
                                isDark ? 'border-slate-800 bg-[#0d1526] text-slate-200' : 'border-slate-200 bg-slate-50 text-slate-700'
                              }`}
                              placeholder="Write your answer here..."
                              value={examAnswers.structuredAnswers[String(question._id)] || ''}
                              onChange={e => setExamAnswers(prev => ({
                                ...prev,
                                structuredAnswers: { ...prev.structuredAnswers, [String(question._id)]: e.target.value }
                              }))}
                            />
                            {examSubmittedResult?.gradedStructured?.find(item => String(item.question) === String(question._id)) && (
                              <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-700">
                                <strong>
                                  Score: {examSubmittedResult.gradedStructured.find(item => String(item.question) === String(question._id)).score}/{examSubmittedResult.gradedStructured.find(item => String(item.question) === String(question._id)).maxScore}
                                </strong>
                                <p className="mt-1">{examSubmittedResult.gradedStructured.find(item => String(item.question) === String(question._id)).feedback}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </section>

                    <div className={`flex justify-end border-t pt-5 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                      <button
                        type="button"
                        onClick={handleSubmitCourseExam}
                        disabled={isSubmittingExam || !!examSubmittedResult}
                        className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
                      >
                        {isSubmittingExam ? <i className="fa-solid fa-circle-notch animate-spin"></i> : <i className="fa-solid fa-paper-plane"></i>}
                        {examSubmittedResult ? 'Exam Submitted' : 'Submit Exam'}
                      </button>
                    </div>
                  </div>
                )}
              </section>
            ) : (
              <>
            <section className={`mt-6 overflow-hidden rounded-[1.5rem] border shadow-sm ${
              isDark ? 'border-slate-800 bg-[#0d1526]' : 'border-slate-200 bg-white'
            }`}>
              {isVideoLocked ? (
                <div className={`flex aspect-video min-h-[280px] flex-col items-center justify-center border border-dashed p-8 text-center ${
                  isDark ? 'border-amber-950 bg-amber-950/20' : 'border-amber-300 bg-amber-50/30'
                }`}>
                  <div className={`flex h-16 w-16 items-center justify-center rounded-full shadow-sm ${
                    isDark ? 'bg-slate-900 text-slate-400' : 'bg-white text-slate-500'
                  }`}>
                    <i className="fa-solid fa-lock text-3xl"></i>
                  </div>
                  <h2 className={`mt-5 text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('learning.content_locked', 'Content Locked')}</h2>
                  <p className={`mt-2 text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('learning.video_requires_enrollment', 'This video requires enrollment or purchase.')}</p>
                  {isPerChapterPayment ? (
                    <div className="mt-6 flex flex-col items-center gap-3">
                      <span className={`rounded-full border px-4 py-2 text-sm font-black ${
                        isDark ? 'border-amber-950 bg-slate-900 text-slate-300' : 'border-amber-200 bg-white text-slate-700'
                      }`}>
                        {pendingChapterPayment
                          ? t('learning.chapter_payment_pending', 'Payment request pending')
                          : `${t('learning.pay_this_chapter', 'Pay this chapter')} ${currentChapterPrice ? `- ${currentChapterPrice}` : ''}`}
                      </span>
                      <button
                        type="button"
                        onClick={handleRequestChapterAccess}
                        disabled={isRequestingChapterAccess || !!pendingChapterPayment}
                        className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isRequestingChapterAccess && <i className="fa-solid fa-circle-notch animate-spin"></i>}
                        {pendingChapterPayment ? t('learning.awaiting_confirmation', 'Awaiting Confirmation') : t('learning.request_chapter_access', 'Request Chapter Access')}
                      </button>
                    </div>
                  ) : (
                    <Link
                      to={inDashboard ? `/dashboard?view=course-detail&courseId=${courseId}&from=${fromView}` : `/learning/courses/${courseId}`}
                      className="mt-6 text-sm font-black text-blue-600 transition hover:text-blue-800"
                    >
                      {t('learning.view_course_details', 'View Course Details')}
                    </Link>
                  )}
                </div>
              ) : (
                <>
                  <div
                    ref={playerContainerRef}
                    className="relative aspect-video w-full bg-black"
                    style={{ minHeight: '300px' }}
                  >
                    {!currentVideo && (
                      <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                        No video selected
                      </div>
                    )}
                  </div>

                  {duration > 0 && (
                    <div className={`border-t px-5 py-4 ${isDark ? 'border-slate-800 bg-[#0d1526]' : 'border-slate-200 bg-white'}`}>
                      <div className={`flex items-center justify-between text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${isPlaying ? 'bg-blue-600' : 'bg-slate-300'}`} />
                          <span>{isPlaying ? 'Playing' : 'Paused'}</span>
                        </div>
                        <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
                      </div>

                      <div className="group/seeker relative mt-3 cursor-pointer py-2" onClick={handleSeekClick}>
                        <div className={`relative h-2 rounded-full transition-all group-hover/seeker:h-3 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                          <div
                            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-blue-600 to-sky-500"
                            style={{ width: `${(currentTime / duration) * 100}%` }}
                          />
                        </div>

                        {sortedMarkers().map((notion) => {
                          const isPassed = notionsPassedThisSession.has(notion._id) || (status?.progress?.completedNotions || []).includes(notion._id);
                          const isNext = notion.time === nextNotionTimeToReach;
                          const isFuture = notion.time > nextNotionTimeToReach;
                          const position = (notion.time / duration) * 100;

                          return (
                            <div
                              key={notion._id}
                              className={`group/checkpoint absolute top-1/2 z-20 h-4 w-2 -translate-y-1/2 cursor-pointer rounded-full transition hover:scale-125 ${
                                isPassed ? 'bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.55)]' :
                                isNext ? 'animate-pulse bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.8)]' :
                                'bg-amber-300'
                              }`}
                              style={{ left: `${position}%` }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isFuture) {
                                  seekToNotion(notion);
                                } else {
                                  toast.warn("You cannot jump to future checkpoints yet.");
                                }
                              }}
                            >
                              <div className={`pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 hidden w-52 -translate-x-1/2 rounded-xl border p-3 text-xs shadow-xl group-hover/checkpoint:block ${
                                isDark ? 'border-slate-800 bg-[#0d1526] text-slate-300 shadow-black/40' : 'border-slate-200 bg-white text-slate-900 shadow-xl'
                              }`}>
                                <div className={`truncate font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{notion.title}</div>
                                <div className="mt-1 flex items-center justify-between text-slate-500">
                                  <span>{formatTime(notion.time)}</span>
                                  <span className={`font-bold ${isPassed ? 'text-blue-600' : isNext ? 'text-amber-600' : 'text-slate-400'}`}>
                                    {isPassed ? 'Completed' : isNext ? 'Next Up' : 'Locked'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </section>

            {currentVideo && (
              <>
                <section className="mt-6">
                  <h1 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{currentVideo.title || `Video ${getVideoId(currentVideo)}`}</h1>
                  <p className={`mt-2 max-w-4xl text-sm leading-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{currentVideoDescription}</p>
                  <button
                    type="button"
                    onClick={() => setShowTranscript(prev => !prev)}
                    className={`mt-6 inline-flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm font-black transition ${
                      isDark 
                        ? 'border-blue-500 bg-[#0d1526] text-blue-400 hover:bg-blue-950/30' 
                        : 'border-blue-600 bg-white text-blue-700 hover:bg-blue-50'
                    }`}
                  >
                    <i className="fa-solid fa-eye"></i>
                    {showTranscript ? t('learning.hide_transcript', 'Hide Transcript') : t('learning.show_transcript', 'Show Transcript')}
                  </button>
                  {showTranscript && (
                    <div className={`mt-4 rounded-2xl border p-5 text-sm leading-7 shadow-sm ${
                      isDark ? 'border-slate-800 bg-[#0d1526] text-slate-300' : 'border-slate-200 bg-white text-slate-600'
                    }`}>
                      {transcriptText ? (
                        <pre className="whitespace-pre-wrap font-sans">{transcriptText}</pre>
                      ) : (
                        <p>{t('learning.no_transcript_available', 'No transcript available for this video.')}</p>
                      )}
                    </div>
                  )}
                </section>

                <section className={`mt-6 rounded-[1.25rem] border p-6 shadow-sm ${
                  isDark ? 'border-slate-800 bg-[#0d1526]' : 'border-slate-200 bg-white'
                }`}>
                  <div className={`flex flex-wrap items-center justify-between gap-3 border-b pb-5 ${
                    isDark ? 'border-slate-800' : 'border-slate-200'
                  }`}>
                    <h2 className={`text-base font-black ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{currentSection?.title || course.title}</h2>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled
                        className={`inline-flex cursor-default items-center gap-2 rounded-lg border px-4 py-2 text-sm font-black opacity-80 ${
                          isDark ? 'border-blue-500/30 bg-blue-950/20 text-blue-400' : 'border-blue-600 bg-white text-blue-700'
                        }`}
                      >
                        <i className={`fa-solid ${isCompletingVideo ? 'fa-circle-notch animate-spin' : currentVideoCompleted ? 'fa-check-double' : 'fa-circle-check'}`}></i>
                        {currentVideoCompleted ? t('learning.completed', 'Completed') : t('learning.completes_automatically', 'Completes Automatically')}
                      </button>
                      <button
                        type="button"
                        onClick={goToNextVideo}
                        className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-blue-700"
                      >
                        {t('learning.next_content', 'Next Content')}
                        <i className="fa-solid fa-chevron-right text-xs"></i>
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-8 py-6 lg:grid-cols-[1fr_280px]">
                    <div className="space-y-6">
                      <div>
                        <h3 className={`text-sm font-black ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{t('learning.objectives', 'Objectives')}:</h3>
                        <p className={`mt-2 text-sm leading-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{currentVideoDescription}</p>
                      </div>
                      <div>
                        <h3 className={`text-sm font-black ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{t('learning.resources', 'Resources')}:</h3>
                        {sectionResources.length ? (
                          <div className="mt-3 grid gap-2">
                            {sectionResources.map((resource, index) => (
                              <a
                                key={`${resource._id || resource.name || index}`}
                                href={resource.url || resource.fileUrl || '#'}
                                target="_blank"
                                rel="noreferrer"
                                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-bold transition ${
                                  isDark 
                                    ? 'border-slate-800 bg-slate-900/50 text-slate-300 hover:border-blue-500 hover:bg-blue-950/20' 
                                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-200 hover:bg-blue-50'
                                }`}
                              >
                                <i className="fa-solid fa-file-lines text-blue-600"></i>
                                <span className="truncate">{resource.name || resource.title || resource.originalName || `Resource ${index + 1}`}</span>
                              </a>
                            ))}
                          </div>
                        ) : (
                          <p className={`mt-4 rounded-xl p-4 text-sm font-semibold ${
                            isDark ? 'bg-slate-900/50 text-slate-500' : 'bg-slate-50 text-slate-500'
                          }`}>
                            {t('learning.no_resources_available', 'No resources available for this section.')}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className={`rounded-2xl border p-5 ${
                      isDark ? 'border-slate-800 bg-slate-900/40 text-slate-300' : 'border-slate-200 bg-slate-50'
                    }`}>
                      <h3 className={`text-sm font-black ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{t('learning.course_details', 'Course Details')}:</h3>
                      <dl className={`mt-4 space-y-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        <div><dt className={`inline font-black ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('learning.instructor', 'Instructor')}:</dt> <dd className="inline">{course.instructor?.name || course.instructorName || 'N/A'}</dd></div>
                        <div><dt className={`inline font-black ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('learning.duration', 'Duration')}:</dt> <dd className="inline">{course.duration || `${totalVideos} videos`}</dd></div>
                        <div><dt className={`inline font-black ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('learning.sections', 'Sections')}:</dt> <dd className="inline">{totalSections}</dd></div>
                        <div><dt className={`inline font-black ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('learning.price', 'Price')}:</dt> <dd className="inline">{coursePrice}</dd></div>
                      </dl>
                    </div>
                  </div>
                </section>

                <section className={`my-6 rounded-[1.25rem] border p-6 shadow-sm ${
                  isDark ? 'border-slate-800 bg-[#0d1526]' : 'border-slate-200 bg-white'
                }`}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('learning.key_moments_notions', 'Key Moments & Notions')}</h2>
                      <p className={`mt-1 text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('learning.key_moments_helper', 'Use these checkpoints to review important ideas and unlock quiz moments.')}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${
                      isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'
                    }`}>{sortedMarkers().length} notions</span>
                  </div>

                  {sortedMarkers().length > 0 ? (
                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                      {sortedMarkers().map((notion, i) => {
                        const isPassed = notionsPassedThisSession.has(notion._id) || (status?.progress?.completedNotions || []).includes(notion._id);
                        const isNext = notion.time === nextNotionTimeToReach;
                        const isFuture = notion.time > nextNotionTimeToReach;

                        return (
                          <button
                            key={notion._id || i}
                            type="button"
                            onClick={() => {
                              if (!isFuture) {
                                seekToNotion(notion);
                              } else {
                                toast.warn("You cannot jump to future checkpoints yet.");
                              }
                            }}
                            className={`group flex cursor-pointer items-start gap-3 rounded-2xl border p-4 text-left transition ${
                              isPassed 
                                ? (isDark ? 'border-blue-900/60 bg-blue-950/20 text-blue-200' : 'border-blue-200 bg-blue-50') :
                              isNext 
                                ? (isDark ? 'border-amber-900/60 bg-amber-950/20 text-amber-200' : 'border-amber-200 bg-amber-50') :
                              (isDark 
                                ? 'border-slate-800 bg-slate-900/35 text-slate-300 hover:border-slate-700 hover:bg-slate-900/50' 
                                : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300')
                            } ${isFuture ? 'opacity-70' : 'hover:-translate-y-0.5 hover:shadow-sm'}`}
                          >
                            <span className={`mt-0.5 rounded-lg px-2 py-1 font-mono text-xs font-black ${
                              isPassed ? 'bg-blue-100 text-blue-700' :
                              isNext ? 'bg-amber-100 text-amber-700' :
                              (isDark ? 'bg-slate-800 text-slate-400' : 'bg-white text-slate-500')
                            }`}>
                              {formatTime(notion.time)}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className={`block font-black ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{notion.title}</span>
                              {notion.description && <span className={`mt-1 line-clamp-2 block text-sm leading-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{notion.description}</span>}
                            </span>
                            <i className={`fa-solid ${isFuture ? 'fa-lock' : isPassed ? 'fa-circle-check' : 'fa-play'} mt-1 text-sm ${
                              isPassed ? 'text-blue-600' : isNext ? 'text-amber-600' : 'text-slate-400'
                            }`}></i>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className={`mt-5 rounded-2xl p-5 text-sm font-semibold ${
                      isDark ? 'bg-slate-900/40 text-slate-500' : 'bg-slate-50 text-slate-500'
                    }`}>
                      {t('learning.no_key_moments', 'No key moments or notions have been added for this video yet.')}
                    </p>
                  )}
                </section>
              </>
            )}
              </>
            )}
          </main>
        </div>
      </div>
      
      <McqQuizModal 
        open={isQuizModalOpen}
        onClose={handleCloseQuiz}
        notionTitle={activeNotion?.title || ''}
        questions={quizQuestions}
        onSubmitQuiz={handleSubmitQuiz}
        isLoadingQuiz={isLoadingQuiz}
      />
      {!isQuizModalOpen && (
        <CourseChatbot
          course={course}
          currentSection={currentSection}
          currentVideo={currentVideo}
          markers={sortedMarkers()}
        />
      )}
    </div>
  );
}
