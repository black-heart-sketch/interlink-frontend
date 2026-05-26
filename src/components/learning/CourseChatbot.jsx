import { useEffect, useRef, useState } from 'react';
import { courseService } from '../../services/courseService';

const starterQuestions = [
  'Summarize chapter',
  'Key notions',
  'Practice plan'
];

const formatTime = (seconds = 0) => {
  const safe = Number(seconds) || 0;
  const minutes = Math.floor(safe / 60);
  const rest = Math.floor(safe % 60).toString().padStart(2, '0');
  return `${minutes}:${rest}`;
};

const renderInlineMarkdown = (text) => {
  const parts = String(text || '').split(/(`[^`]+`|\*\*[^*]+\*\*)/g).filter(Boolean);

  return parts.map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={index} className="rounded bg-black/30 px-1.5 py-0.5 text-[0.82em] text-blue-100">{part.slice(1, -1)}</code>;
    }

    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-black text-white">{part.slice(2, -2)}</strong>;
    }

    return <span key={index}>{part}</span>;
  });
};

const renderInlineMarkdownLight = (text) => {
  const parts = String(text || '').split(/(`[^`]+`|\*\*[^*]+\*\*)/g).filter(Boolean);

  return parts.map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={index} className="rounded bg-slate-100 px-1.5 py-0.5 text-[0.82em] font-bold text-sky-700">{part.slice(1, -1)}</code>;
    }

    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-black text-slate-950">{part.slice(2, -2)}</strong>;
    }

    return <span key={index}>{part}</span>;
  });
};

function AssistantResponse({ text }) {
  const lines = String(text || '').split('\n');
  const nodes = [];
  let listItems = [];
  let orderedItems = [];
  let codeLines = [];
  let inCodeBlock = false;

  const flushList = () => {
    if (listItems.length) {
      nodes.push(
        <ul key={`ul-${nodes.length}`} className="ml-4 list-disc space-y-1 marker:text-blue-300">
          {listItems.map((item, index) => <li key={index}>{renderInlineMarkdown(item)}</li>)}
        </ul>
      );
      listItems = [];
    }

    if (orderedItems.length) {
      nodes.push(
        <ol key={`ol-${nodes.length}`} className="ml-4 list-decimal space-y-1 marker:text-blue-300">
          {orderedItems.map((item, index) => <li key={index}>{renderInlineMarkdown(item)}</li>)}
        </ol>
      );
      orderedItems = [];
    }
  };

  const flushCode = () => {
    if (codeLines.length) {
      nodes.push(
        <pre key={`code-${nodes.length}`} className="overflow-x-auto rounded-xl border border-white/10 bg-black/35 p-3 text-xs leading-5 text-blue-100">
          <code>{codeLines.join('\n')}</code>
        </pre>
      );
      codeLines = [];
    }
  };

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        inCodeBlock = false;
        flushCode();
      } else {
        flushList();
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      return;
    }

    if (!trimmed) {
      flushList();
      return;
    }

    const heading = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      flushList();
      nodes.push(
        <h4 key={`h-${nodes.length}`} className="mt-3 text-sm font-black text-white">
          {renderInlineMarkdown(heading[2])}
        </h4>
      );
      return;
    }

    const bullet = trimmed.match(/^[-*•]\s+(.+)$/);
    if (bullet) {
      orderedItems = [];
      listItems.push(bullet[1]);
      return;
    }

    const numbered = trimmed.match(/^\d+[.)]\s+(.+)$/);
    if (numbered) {
      listItems = [];
      orderedItems.push(numbered[1]);
      return;
    }

    flushList();
    nodes.push(<p key={`p-${nodes.length}`}>{renderInlineMarkdown(trimmed)}</p>);
  });

  flushList();
  flushCode();

  return <div className="space-y-2 text-[0.86rem] leading-6 text-slate-200">{nodes}</div>;
}

function CanvasNote({ text }) {
  const lines = String(text || '').split('\n');
  const nodes = [];
  let bullets = [];
  let numbers = [];

  const flush = () => {
    if (bullets.length) {
      nodes.push(
        <ul key={`ul-${nodes.length}`} className="ml-5 list-disc space-y-1.5 text-sm leading-6 text-slate-700 marker:text-sky-500">
          {bullets.map((item, index) => <li key={index}>{renderInlineMarkdownLight(item)}</li>)}
        </ul>
      );
      bullets = [];
    }
    if (numbers.length) {
      nodes.push(
        <ol key={`ol-${nodes.length}`} className="ml-5 list-decimal space-y-1.5 text-sm leading-6 text-slate-700 marker:font-black marker:text-sky-600">
          {numbers.map((item, index) => <li key={index}>{renderInlineMarkdownLight(item)}</li>)}
        </ol>
      );
      numbers = [];
    }
  };

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flush();
      return;
    }

    const heading = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      flush();
      nodes.push(<h5 key={`h-${nodes.length}`} className="pt-2 text-sm font-black text-slate-950">{renderInlineMarkdownLight(heading[2])}</h5>);
      return;
    }

    const bullet = trimmed.match(/^[-*•]\s+(.+)$/);
    if (bullet) {
      numbers = [];
      bullets.push(bullet[1]);
      return;
    }

    const numbered = trimmed.match(/^\d+[.)]\s+(.+)$/);
    if (numbered) {
      bullets = [];
      numbers.push(numbered[1]);
      return;
    }

    flush();
    nodes.push(<p key={`p-${nodes.length}`} className="text-sm leading-6 text-slate-700">{renderInlineMarkdownLight(trimmed)}</p>);
  });

  flush();
  return <div className="mt-3 space-y-2">{nodes}</div>;
}

const parseCanvasAnswer = (value) => {
  if (!value) return null;
  if (typeof value === 'object') return value;

  try {
    return JSON.parse(String(value).replace(/```(?:json)?\s*([\s\S]*?)\s*```/, '$1').trim());
  } catch (error) {
    return null;
  }
};

const isValidAssessment = (item) => (
  item &&
  Array.isArray(item.options) &&
  item.options.length === 4 &&
  ['0', '1', '2', '3'].includes(String(item.correctAnswer))
);

export default function CourseChatbot({ course, currentSection, currentVideo, markers = [] }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [chapterCourse, setChapterCourse] = useState(null);
  const [courseUpdating, setCourseUpdating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [expandedStages, setExpandedStages] = useState({
    foundations: true,
    notions: true,
    resources: false,
    quiz: false
  });
  const [completedItems, setCompletedItems] = useState([]);
  const [selectedCanvasFocus, setSelectedCanvasFocus] = useState(null);
  const [practiceQuiz, setPracticeQuiz] = useState(null);
  const [practiceQuizAnswers, setPracticeQuizAnswers] = useState({});
  const [practiceQuizStep, setPracticeQuizStep] = useState(0);
  const [practiceQuizResult, setPracticeQuizResult] = useState(null);
  const [quizLimitInfo, setQuizLimitInfo] = useState({ count: 0, limit: 2, nextResetAt: null });
  const [savedFocusCanvases, setSavedFocusCanvases] = useState({});
  const [canvasLoading, setCanvasLoading] = useState({ active: false, label: '' });
  const [personalCanvasUpdates, setPersonalCanvasUpdates] = useState([]);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi. I can help you understand this course, chapter, video notions, and resources. Ask me anything about the lesson.'
    }
  ]);
  const [loading, setLoading] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    if (open) listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading, open]);

  const chapterVideos = currentSection?.videos || [];
  const chapterMarkers = chapterVideos.flatMap((video) => (video.markers || video.notions || []).map((marker) => ({
    ...marker,
    videoTitle: video.title,
    videoId: video._id
  })));
  const allChapterMarkers = chapterMarkers.length ? chapterMarkers : markers.map((marker) => ({
    ...marker,
    videoTitle: currentVideo?.title,
    videoId: currentVideo?._id
  }));
  const chapterResources = currentSection?.resources || [];

  const moduleTitle = currentSection?.title || currentVideo?.title || course?.title || 'Current chapter';
  const progressStorageKey = `course-chatbot-progress:${course?._id || 'course'}:${currentSection?._id || currentVideo?._id || 'chapter'}`;
  const canUsePersistedCanvas = Boolean(course?._id && currentSection?._id);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(progressStorageKey) || '[]');
      setCompletedItems(Array.isArray(saved) ? saved : []);
    } catch (error) {
      setCompletedItems([]);
    }
  }, [progressStorageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(progressStorageKey, JSON.stringify(completedItems));
    } catch (error) {
      // Local progress should never block the assistant UI.
    }
  }, [completedItems, progressStorageKey]);

  useEffect(() => {
    if (!open || !canUsePersistedCanvas) return;

    let cancelled = false;
    setCanvasLoading({ active: true, label: 'Preparing your saved learning canvas...' });
    courseService.getChapterCanvas({ courseId: course._id, sectionId: currentSection._id })
      .then((data) => {
        if (cancelled) return;
        if (data.canvas) {
          setChapterCourse(current => ({
            ...(current || generateChapterCourse()),
            canvas: data.canvas,
            subtitle: data.canvas.overview || current?.subtitle,
            outcomes: Array.isArray(data.canvas.professionalChecklist) ? data.canvas.professionalChecklist : current?.outcomes || [],
            modules: Array.isArray(data.canvas.concepts)
              ? data.canvas.concepts.map((concept) => ({ title: concept.title, description: concept.explanation, points: [] }))
              : current?.modules || []
          }));
          setLastUpdated(data.updatedAt ? new Date(data.updatedAt) : null);
        }
        if (Array.isArray(data.completedItems)) setCompletedItems(data.completedItems);
        if (data.focusCanvases) setSavedFocusCanvases(data.focusCanvases);
        const latestQuiz = data.quizGenerations?.[data.quizGenerations.length - 1];
        if (latestQuiz) {
          setPracticeQuiz({ generationId: latestQuiz._id, questions: latestQuiz.questions || [] });
        }
        setQuizLimitInfo({
          count: data.quizGenerationCount || 0,
          limit: data.quizGenerationLimit || 2,
          nextResetAt: data.nextQuizResetAt || null
        });
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) {
          setTimeout(() => {
            if (!cancelled) setCanvasLoading({ active: false, label: '' });
          }, 700);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, canUsePersistedCanvas, course?._id, currentSection?._id]);

  useEffect(() => {
    if (!canUsePersistedCanvas || !completedItems.length) return;
    const timeout = setTimeout(() => {
      courseService.saveChapterCanvasProgress({
        courseId: course._id,
        sectionId: currentSection._id,
        completedItems
      }).catch(() => {});
    }, 700);

    return () => clearTimeout(timeout);
  }, [completedItems, canUsePersistedCanvas, course?._id, currentSection?._id]);

  const markItemComplete = (id) => {
    if (!id) return;
    setCompletedItems(current => (current.includes(id) ? current : [...current, id]));
  };

  const buildContext = (focus = selectedCanvasFocus) => ({
    course: {
      id: course?._id,
      title: course?.title,
      description: course?.description,
      category: course?.category,
      plan: course?.plan,
      studyLanguage: course?.studyLanguage?.name || course?.studyLanguage
    },
    currentChapter: {
      id: currentSection?._id,
      title: currentSection?.title,
      description: currentSection?.description,
      isLocked: currentSection?.isLocked,
      isPreviewable: currentSection?.isPreviewable,
      resources: currentSection?.resources || [],
      transcript: currentSection?.videoTranscript || null
    },
    currentVideo: {
      id: currentVideo?._id,
      title: currentVideo?.title,
      description: currentVideo?.description,
      duration: currentVideo?.duration,
      vimeoVideoId: currentVideo?.vimeoVideoId
    },
    chapterVideos: chapterVideos.map((video) => ({
      id: video._id,
      title: video.title,
      description: video.description,
      duration: video.duration,
      markers: (video.markers || video.notions || []).map((marker) => ({
        id: marker._id,
        time: marker.time,
        title: marker.title,
        description: marker.description
      }))
    })),
    notionsOrMarkers: allChapterMarkers.map((marker) => ({
      id: marker._id,
      time: marker.time,
      title: marker.title,
      description: marker.description,
      videoTitle: marker.videoTitle
    })),
    courseAttachments: course?.attachments || [],
    selectedFocus: focus
  });

  const generateChapterCourse = (focus = selectedCanvasFocus) => {
    const modules = chapterVideos.length ? chapterVideos.map((video, index) => {
      const videoMarkers = video.markers || video.notions || [];
      return {
        title: video.title || `Lesson ${index + 1}`,
        description: video.description || 'Watch this lesson and complete its notion checkpoints.',
        duration: video.duration,
        points: videoMarkers.length
          ? videoMarkers.slice(0, 5).map((marker) => `${formatTime(marker.time)} - ${marker.title}`)
          : ['Watch the complete video.', 'Write down difficult points.', 'Ask the assistant for examples.']
      };
    }) : [
      {
        title: currentVideo?.title || 'Current lesson',
        description: currentVideo?.description || 'Watch this lesson and complete its notion checkpoints.',
        duration: currentVideo?.duration,
        points: markers.slice(0, 5).map((marker) => `${formatTime(marker.time)} - ${marker.title}`)
      }
    ];

    return {
      title: focus?.title || currentSection?.title || course?.title || 'Generated chapter course',
      subtitle: focus?.description || currentSection?.description || 'A focused mini-course generated from this chapter videos, notions, resources, and attachments.',
      focus,
      canvas: null,
      modules,
      resources: [
        ...chapterResources.map((resource) => resource.name?.name || resource.name || resource.url || 'Chapter resource'),
        ...(course?.attachments || []).map((attachment) => attachment.name || attachment.url || 'Course attachment')
      ],
      outcomes: [
        `Understand the main ideas in "${currentSection?.title || course?.title || 'this chapter'}".`,
        'Complete every notion checkpoint without skipping.',
        'Use resources to review and consolidate the lesson.',
        'Ask precise questions when a concept is unclear.'
      ],
      updatedAt: new Date()
    };
  };

  useEffect(() => {
    if (expanded && !chapterCourse) {
      const generated = generateChapterCourse();
      setChapterCourse(generated);
      setLastUpdated(generated.updatedAt);
    }
  }, [expanded, chapterCourse, currentSection?._id, currentVideo?._id]);

  const refreshChapterCourse = async (focus = selectedCanvasFocus) => {
    setCourseUpdating(true);
    setCanvasLoading({
      active: true,
      label: focus ? `Generating a fresh canvas for ${focus.title}...` : 'Updating the chapter learning canvas...'
    });
    const generated = generateChapterCourse(focus);
    setChapterCourse(generated);
    setLastUpdated(generated.updatedAt);
    if (focus) {
      setSelectedCanvasFocus(focus);
      markItemComplete(focus.id);
    }

    try {
      const data = await courseService.generateChapterCanvas({
        courseId: course?._id,
        sectionId: currentSection?._id,
        focus,
        context: buildContext(focus),
        lang: localStorage.getItem('i18nextLng') || 'en'
      });
      const aiCanvas = parseCanvasAnswer(data.canvas || data.answer);

      if (aiCanvas) {
        if (focus?.id) {
          setSavedFocusCanvases(current => ({ ...current, [focus.id]: aiCanvas }));
        }
        setChapterCourse(current => ({
          ...(current || generated),
          title: generated.title,
          subtitle: aiCanvas.overview || generated.subtitle,
          focus,
          canvas: aiCanvas,
          outcomes: Array.isArray(aiCanvas.professionalChecklist) && aiCanvas.professionalChecklist.length
            ? aiCanvas.professionalChecklist
            : generated.outcomes,
          modules: Array.isArray(aiCanvas.concepts) && aiCanvas.concepts.length
            ? aiCanvas.concepts.map((concept) => ({
              title: concept.title,
              description: concept.explanation,
              points: []
            }))
            : generated.modules,
          updatedAt: new Date()
        }));
      }

      setMessages(current => [...current, {
        role: 'assistant',
        content: aiCanvas?.mentorPrompt || 'The chapter course canvas has been refreshed. Click any item in the canvas and I will explain it.'
      }]);
    } catch (error) {
      setMessages(current => [...current, {
        role: 'assistant',
        content: 'I refreshed the local chapter course view, but I could not fetch the latest AI-generated update right now.'
      }]);
    } finally {
      setCourseUpdating(false);
      setCanvasLoading({ active: false, label: '' });
    }
  };

  const presentationCards = [
    {
      title: 'Chapter focus',
      icon: 'fa-solid fa-bullseye',
      tone: 'from-blue-500 to-cyan-400',
      body: currentSection?.description || 'Use every video, notion, and resource in this chapter as one connected course.',
      points: [
        currentSection?.title && `Chapter: ${currentSection.title}`,
        `${chapterVideos.length || 1} video lesson${(chapterVideos.length || 1) > 1 ? 's' : ''}`,
        course?.studyLanguage?.name && `Study language: ${course.studyLanguage.name}`
      ].filter(Boolean)
    },
    {
      title: 'Generated notion path',
      icon: 'fa-solid fa-route',
      tone: 'from-emerald-500 to-teal-400',
      body: allChapterMarkers.length ? 'Follow these checkpoints across the chapter videos.' : 'No notion markers are available yet for this chapter.',
      points: allChapterMarkers.slice(0, 8).map((marker) => `${marker.videoTitle ? `${marker.videoTitle}: ` : ''}${formatTime(marker.time)} - ${marker.title}`)
    },
    {
      title: 'Resources to review',
      icon: 'fa-solid fa-folder-open',
      tone: 'from-amber-500 to-orange-400',
      body: (chapterResources.length || course?.attachments?.length)
        ? 'Use these supporting materials after the chapter videos to reinforce the lesson.'
        : 'No chapter resources have been attached yet.',
      points: [
        ...chapterResources.slice(0, 5).map((resource) => resource.name?.name || resource.name || resource.url || 'Resource'),
        ...(course?.attachments || []).slice(0, 3).map((attachment) => attachment.name || attachment.url || 'Attachment')
      ]
    },
    {
      title: 'Practice sequence',
      icon: 'fa-solid fa-list-check',
      tone: 'from-violet-500 to-fuchsia-400',
      body: 'A compact plan generated from this chapter context.',
      points: [
        '1. Watch the video without skipping notion checkpoints.',
        '2. Answer each notion quiz until you pass.',
        '3. Review the resources and transcript after the video.',
        '4. Ask the assistant for examples or corrections.'
      ]
    }
  ];

  const aiCanvas = chapterCourse?.canvas;
  const totalLessons = chapterVideos.length || 1;
  const totalResources = chapterResources.length + (course?.attachments?.length || 0);
  const lessonItems = chapterVideos.length
    ? chapterVideos.map((video, index) => ({
      id: `video:${video._id || index}`,
      type: 'video lesson',
      number: String(index + 1).padStart(2, '0'),
      title: video.title || `Lesson ${index + 1}`,
      description: video.description || 'Watch this lesson and complete its checkpoints.',
      meta: `${(video.markers || video.notions || []).length} notion checkpoints`,
      active: video._id === currentVideo?._id
    }))
    : [{
      id: `video:${currentVideo?._id || 'current'}`,
      type: 'video lesson',
      number: '01',
      title: currentVideo?.title || 'Current lesson',
      description: currentVideo?.description || 'Watch this lesson and complete its checkpoints.',
      meta: `${markers.length} notion checkpoints`,
      active: true
    }];
  const notionItems = allChapterMarkers.length
    ? allChapterMarkers.map((marker, index) => ({
      id: `notion:${marker._id || marker.videoId || index}`,
      type: 'notion',
      number: String(index + 1).padStart(2, '0'),
      title: marker.title || `Notion ${index + 1}`,
      description: marker.description || 'Review this notion checkpoint and ask for examples.',
      meta: `${marker.videoTitle ? `${marker.videoTitle} - ` : ''}${formatTime(marker.time)}`,
      active: selectedCanvasFocus?.id === `notion:${marker._id || marker.videoId || index}`
    }))
    : [{
      id: 'notion:empty',
      type: 'notion',
      number: '01',
      title: 'No notions yet',
      description: 'No notion markers are available for this chapter yet.',
      meta: 'Waiting for markers',
      active: false,
      disabled: true
    }];
  const resourceItems = [
    ...chapterResources.map((resource, index) => ({
      id: `resource:${resource._id || resource.url || index}`,
      type: 'resource',
      number: String(index + 1).padStart(2, '0'),
      title: resource.name?.name || resource.name || resource.url || `Chapter resource ${index + 1}`,
      description: resource.description || resource.url || 'Use this chapter resource to support your review.',
      meta: 'Chapter resource',
      active: false
    })),
    ...(course?.attachments || []).map((attachment, index) => ({
      id: `attachment:${attachment._id || attachment.url || index}`,
      type: 'resource',
      number: String(chapterResources.length + index + 1).padStart(2, '0'),
      title: attachment.name || attachment.url || `Course attachment ${index + 1}`,
      description: attachment.description || attachment.url || 'Use this course attachment as supporting material.',
      meta: 'Course attachment',
      active: false
    }))
  ];
  const quizItems = [{
    id: `quiz:${currentSection?._id || currentVideo?._id || 'chapter'}`,
    type: 'chapter quiz',
    number: '01',
    title: 'Chapter practice quiz',
    description: 'Generate 24 questions from every video, notion, marker, resource, and attachment in this chapter.',
    meta: `${Math.max(0, (quizLimitInfo.limit || 2) - (quizLimitInfo.count || 0))} generation${Math.max(0, (quizLimitInfo.limit || 2) - (quizLimitInfo.count || 0)) === 1 ? '' : 's'} left today`,
    active: selectedCanvasFocus?.type === 'chapter quiz',
    disabled: (quizLimitInfo.count || 0) >= (quizLimitInfo.limit || 2)
  }];
  const allTrackableItems = [...lessonItems, ...notionItems.filter(item => !item.disabled), ...resourceItems];
  const progressPercent = allTrackableItems.length
    ? Math.round((completedItems.filter(id => allTrackableItems.some(item => item.id === id)).length / allTrackableItems.length) * 100)
    : 0;
  const generatedStats = [
    { label: 'Lessons', value: totalLessons },
    { label: 'Notions', value: allChapterMarkers.length },
    { label: 'Resources', value: totalResources }
  ];
  const curriculumStages = [
    {
      key: 'foundations',
      label: 'Stage 01',
      title: 'Chapter Foundations',
      progress: lessonItems.length ? Math.round((lessonItems.filter(item => completedItems.includes(item.id)).length / lessonItems.length) * 100) : 0,
      lessons: lessonItems
    },
    {
      key: 'notions',
      label: 'Stage 02',
      title: 'Notions & Checkpoints',
      progress: notionItems.filter(item => !item.disabled).length ? Math.round((notionItems.filter(item => completedItems.includes(item.id)).length / notionItems.filter(item => !item.disabled).length) * 100) : 0,
      lessons: notionItems
    },
    {
      key: 'resources',
      label: 'Stage 03',
      title: 'Resource Review',
      progress: resourceItems.length ? Math.round((resourceItems.filter(item => completedItems.includes(item.id)).length / resourceItems.length) * 100) : 0,
      lessons: resourceItems.length ? resourceItems : [{
        id: 'resource:empty',
        type: 'resource',
        number: '01',
        title: 'No resources yet',
        description: 'No resources are available for this chapter yet.',
        meta: 'Waiting for files',
        disabled: true
      }]
    },
    {
      key: 'quiz',
      label: 'Stage 04',
      title: 'Practice Quiz',
      progress: practiceQuizResult ? 100 : 0,
      lessons: quizItems
    }
  ];
  const professionalWorkflow = [
    `Restate the chapter objective: ${moduleTitle}.`,
    'Watch each video and pause on every notion or marker checkpoint.',
    'Turn each notion into one short explanation, one example, and one question.',
    'Review the chapter resources and connect them to the video lesson sequence.',
    'Complete the quiz checkpoints, then ask the assistant to test weak areas.'
  ];
  const failureModes = [
    'Skipping notion checkpoints and treating the video as passive watching.',
    'Memorizing examples without explaining the concept in your own words.',
    'Ignoring resources that clarify the chapter after the video ends.',
    'Moving to the next chapter before passing the required quiz flow.'
  ];
  const readinessChecklist = [
    'I can explain the objective of this chapter in two sentences.',
    'I reviewed every notion marker connected to the videos.',
    'I used the attached resources to clarify difficult parts.',
    'I can answer practice questions without depending on hints.',
    'I know which concept to ask the assistant about next.'
  ];
  const canvasConcepts = Array.isArray(aiCanvas?.concepts) && aiCanvas.concepts.length
    ? aiCanvas.concepts
    : presentationCards.slice(0, 3).map((card) => ({ title: card.title, explanation: card.body, icon: card.icon, tone: card.tone }));
  const canvasWorkflow = Array.isArray(aiCanvas?.workflow) && aiCanvas.workflow.length ? aiCanvas.workflow : professionalWorkflow;
  const canvasPitfalls = Array.isArray(aiCanvas?.pitfalls) && aiCanvas.pitfalls.length ? aiCanvas.pitfalls : failureModes;
  const canvasChecklist = Array.isArray(aiCanvas?.professionalChecklist) && aiCanvas.professionalChecklist.length ? aiCanvas.professionalChecklist : readinessChecklist;
  const canvasAssessment = Array.isArray(aiCanvas?.assessment) ? aiCanvas.assessment.filter(isValidAssessment).slice(0, 5) : [];
  const practiceQuizQuestions = practiceQuiz?.questions || [];
  const currentPracticeQuestions = practiceQuizQuestions.slice(practiceQuizStep * 8, practiceQuizStep * 8 + 8);
  const practiceQuizAnsweredCount = practiceQuizQuestions.filter(question => practiceQuizAnswers[question._id]).length;
  const nextResetLabel = quizLimitInfo.nextResetAt
    ? new Date(quizLimitInfo.nextResetAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null;
  const isQuizMode = selectedCanvasFocus?.type === 'chapter quiz';
  const isSandboxMode = selectedCanvasFocus?.type === 'practice sandbox';
  const sandboxTasks = [
    {
      title: 'Chapter recall',
      tag: 'Warm up',
      prompt: `Ask me to explain "${currentSection?.title || moduleTitle}" in my own words, then correct my explanation.`
    },
    {
      title: 'Video sequence review',
      tag: `${chapterVideos.length || 1} lesson${(chapterVideos.length || 1) === 1 ? '' : 's'}`,
      prompt: 'Walk me through the videos in this chapter in the best study order, with one practice task per video.'
    },
    {
      title: 'Notion drill',
      tag: `${allChapterMarkers.length} notion${allChapterMarkers.length === 1 ? '' : 's'}`,
      prompt: 'Quiz me orally on the main notions in this chapter. Ask one question at a time and wait for my answer.'
    },
    {
      title: 'Resource application',
      tag: `${totalResources} file${totalResources === 1 ? '' : 's'}`,
      prompt: 'Turn the chapter resources into a practical review checklist with examples.'
    },
    ...allChapterMarkers.slice(0, 4).map((marker, index) => ({
      title: marker.title || `Notion practice ${index + 1}`,
      tag: marker.videoTitle || formatTime(marker.time),
      prompt: `Create a short practice drill for this notion: ${marker.title}. ${marker.description || ''}`
    })),
    {
      title: 'Self-check before next chapter',
      tag: 'Checkpoint',
      prompt: 'Create a pass/fail self-check for this chapter and tell me what to review if I fail.'
    }
  ];

  const ask = async (value = question) => {
    const clean = value.trim();
    if (!clean || loading) return;

    const nextMessages = [...messages, { role: 'user', content: clean }];
    setMessages(nextMessages);
    setQuestion('');
    setLoading(true);

    try {
      const data = await courseService.askCourseAssistant({
        question: clean,
        context: buildContext(),
        history: nextMessages.slice(-8),
        lang: localStorage.getItem('i18nextLng') || 'en'
      });

      const answer = data.answer || 'I could not generate an answer right now.';
      setMessages(current => [...current, { role: 'assistant', content: answer }]);
    } catch (error) {
      setMessages(current => [...current, {
        role: 'assistant',
        content: 'I could not reach the AI assistant right now. Please try again in a moment.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const explainCanvasItem = (label, detail = '') => {
    ask(`Explain this course canvas item in simple steps: ${label}${detail ? ` - ${detail}` : ''}. Use bullets, examples, and tell me how it connects to this chapter.`);
  };

  const updatePersonalCanvasFromAnswer = (answer) => {
    if (!answer) return;
    const note = {
      id: `personal-${Date.now()}`,
      title: isSandboxMode ? 'Sandbox update from AI' : 'Personal canvas update',
      body: answer,
      createdAt: new Date()
    };
    setPersonalCanvasUpdates(current => {
      const withoutDuplicate = current.filter(item => item.body !== answer);
      return [note, ...withoutDuplicate].slice(0, 5);
    });
    setCanvasLoading({ active: true, label: 'Updating your personal canvas...' });
    setTimeout(() => setCanvasLoading({ active: false, label: '' }), 700);
  };

  const openCurriculumItem = (item) => {
    if (item.disabled) return;
    if (item.type === 'chapter quiz') {
      generatePracticeQuiz();
      return;
    }
    const focus = {
      id: item.id,
      type: item.type,
      title: item.title,
      description: item.description,
      meta: item.meta
    };
    const savedCanvas = savedFocusCanvases[item.id];
    if (savedCanvas) {
      setCanvasLoading({ active: true, label: `Opening saved canvas for ${item.title}...` });
      setSelectedCanvasFocus(focus);
      markItemComplete(focus.id);
      setTimeout(() => {
        setChapterCourse(current => ({
          ...(current || generateChapterCourse(focus)),
          title: focus.title,
          subtitle: savedCanvas.overview || focus.description,
          focus,
          canvas: savedCanvas,
          outcomes: Array.isArray(savedCanvas.professionalChecklist) ? savedCanvas.professionalChecklist : current?.outcomes || [],
          modules: Array.isArray(savedCanvas.concepts)
            ? savedCanvas.concepts.map((concept) => ({ title: concept.title, description: concept.explanation, points: [] }))
            : current?.modules || []
        }));
        setCanvasLoading({ active: false, label: '' });
      }, 900);
      return;
    }
    refreshChapterCourse(focus);
  };

  const generatePracticeQuiz = async () => {
    if (!canUsePersistedCanvas || courseUpdating) return;
    setCourseUpdating(true);
    setCanvasLoading({ active: true, label: 'Generating 24 chapter practice questions...' });
    setPracticeQuizResult(null);
    setPracticeQuizAnswers({});
    setPracticeQuizStep(0);
    const focus = {
      id: `quiz:${currentSection?._id || 'chapter'}`,
      type: 'chapter quiz',
      title: 'Chapter practice quiz',
      description: 'A 24-question practice quiz generated from the whole chapter.'
    };
    setSelectedCanvasFocus(focus);

    try {
      const data = await courseService.generateChapterPracticeQuiz({
        courseId: course._id,
        sectionId: currentSection._id,
        context: buildContext(focus),
        lang: localStorage.getItem('i18nextLng') || 'en'
      });
      setPracticeQuiz({ generationId: data.generationId, questions: data.questions || [] });
      setQuizLimitInfo({
        count: data.quizGenerationCount || 0,
        limit: data.quizGenerationLimit || 2,
        nextResetAt: data.nextQuizResetAt || null
      });
      setChapterCourse(current => ({
        ...(current || generateChapterCourse(focus)),
        title: 'Chapter practice quiz',
        subtitle: 'Practice the whole chapter in three steps of eight questions each.',
        focus,
        canvas: null
      }));
      markItemComplete(focus.id);
    } catch (error) {
      const data = error?.response?.data;
      if (data?.nextQuizResetAt) {
        setQuizLimitInfo({
          count: data.quizGenerationCount || 2,
          limit: data.quizGenerationLimit || 2,
          nextResetAt: data.nextQuizResetAt
        });
      }
      setMessages(current => [...current, {
        role: 'assistant',
        content: data?.message || 'The daily quiz generation limit has been reached. Use the countdown and return when it resets.'
      }]);
    } finally {
      setCourseUpdating(false);
      setCanvasLoading({ active: false, label: '' });
    }
  };

  const submitPracticeQuiz = async () => {
    if (!practiceQuiz?.questions?.length || !practiceQuiz.generationId) return;
    const total = practiceQuiz.questions.length;
    const answered = practiceQuiz.questions.filter(q => practiceQuizAnswers[q._id]).length;
    if (answered < total) return;

    const localCorrect = practiceQuiz.questions.filter((question) => {
      const selected = practiceQuizAnswers[question._id];
      const right = question.options.find(option => option.isCorrect);
      return right && (selected === right._id || selected === right.text);
    }).length;

    try {
      const result = await courseService.submitChapterPracticeQuiz({
        courseId: course._id,
        sectionId: currentSection._id,
        generationId: practiceQuiz.generationId,
        answers: practiceQuizAnswers
      });
      setPracticeQuizResult(result);
    } catch (error) {
      setPracticeQuizResult({
        score: Math.round((localCorrect / total) * 100),
        passed: (localCorrect / total) * 100 >= 60,
        correct: localCorrect,
        total
      });
    }
  };

  const openPracticeSandbox = () => {
    const focus = {
      id: `sandbox:${currentSection?._id || currentVideo?._id || 'chapter'}`,
      type: 'practice sandbox',
      title: 'Practice Sandbox',
      description: 'A focused workspace for applying the chapter before moving on.'
    };
    setCanvasLoading({ active: true, label: 'Opening the practice sandbox...' });
    setSelectedCanvasFocus(focus);
    markItemComplete(focus.id);
    setTimeout(() => {
      setChapterCourse(current => ({
        ...(current || generateChapterCourse(focus)),
        title: 'Practice Sandbox',
        subtitle: 'Apply this chapter with short drills, examples, and assistant-guided correction.',
        focus,
        canvas: null
      }));
      setCanvasLoading({ active: false, label: '' });
    }, 700);
  };

  const exportCanvasAsPdf = () => {
    markItemComplete(`export:${currentSection?._id || currentVideo?._id || 'chapter'}`);
    window.print();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-[90] flex h-16 w-16 items-center justify-center rounded-[1.35rem] border border-blue-200/30 bg-gradient-to-br from-blue-600 via-sky-500 to-emerald-400 text-2xl text-white shadow-[0_22px_60px_rgba(37,99,235,0.45)] ring-4 ring-blue-500/10 transition hover:-translate-y-1 hover:shadow-[0_28px_72px_rgba(16,185,129,0.35)]"
        aria-label="Open course AI assistant"
        title="Course AI assistant"
      >
        <i className="fa-solid fa-comments" aria-hidden="true" />
      </button>

      {open && (
        <div className={`fixed inset-0 z-[160] bg-slate-950/60 p-3 backdrop-blur-md sm:p-6 ${expanded ? 'flex items-center justify-center' : 'flex items-end justify-end'}`}>
          <div className={`flex h-[min(880px,94vh)] w-full flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,#111827_0%,#0f172a_48%,#07111f_100%)] shadow-[0_28px_100px_rgba(0,0,0,0.55)] ring-1 ring-white/5 transition-all duration-300 ${expanded ? 'max-w-[1780px]' : 'max-w-[430px]'}`}>
            <div className="relative overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.24),transparent_34%),rgba(255,255,255,0.035)] p-4">
              <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl" />
              <div className="relative flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setExpanded(prev => !prev)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-blue-300/20 bg-blue-500/10 text-blue-100 transition hover:bg-blue-500/20 hover:text-white"
                  aria-label={expanded ? 'Collapse assistant' : 'Expand assistant'}
                  title={expanded ? 'Collapse assistant' : 'Expand assistant'}
                >
                  <i className={`fa-solid ${expanded ? 'fa-down-left-and-up-right-to-center' : 'fa-up-right-and-down-left-from-center'}`} aria-hidden="true" />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(52,211,153,0.9)]" />
                    <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-blue-200">AI learning assistant</p>
                  </div>
                  <h3 className="mt-1 line-clamp-1 text-base font-black text-white">{currentVideo?.title || currentSection?.title || 'Course helper'}</h3>
                  <p className="mt-0.5 text-xs font-semibold text-slate-500">{expanded ? 'Chapter workspace' : 'Course-aware chat'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-400 transition hover:bg-white/10 hover:text-white"
                aria-label="Close assistant"
              >
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
              </div>
            </div>

            {expanded ? (
              <div className="grid min-h-0 flex-1 bg-slate-100 text-slate-900 lg:grid-cols-[320px_minmax(0,1fr)_390px]">
                <aside className="min-h-0 overflow-y-auto border-b border-slate-200 bg-white/95 p-3 lg:border-b-0 lg:border-r">
                  <div className="border-t-4 border-emerald-700 bg-slate-50 px-3 py-2">
                    <p className="text-[0.62rem] font-black uppercase tracking-[0.16em] text-slate-500">Active module</p>
                    <h4 className="mt-1 line-clamp-2 text-sm font-black text-slate-800">{moduleTitle}</h4>
                  </div>

                  <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50/70 p-3 shadow-sm">
                    <p className="flex items-center gap-2 text-[0.64rem] font-black uppercase tracking-[0.14em] text-emerald-700">
                      <i className="fa-solid fa-layer-group" aria-hidden="true" />
                      Course curriculum
                    </p>
                    <p className="mt-2 text-xs leading-5 text-slate-600">
                      Follow the chapter path. Click a lesson or checkpoint to ask the assistant about it from the chat panel.
                    </p>
                  </div>

                  <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-black text-slate-900">Academic Curriculum</h4>
                        <p className="mt-0.5 text-[0.68rem] font-bold text-slate-400">{progressPercent}% completed</p>
                      </div>
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-xs font-black text-emerald-700">
                        {completedItems.filter(id => allTrackableItems.some(item => item.id === id)).length}
                      </div>
                    </div>
                    <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progressPercent}%` }} />
                    </div>

                    <div className="space-y-3">
                      {curriculumStages.map((stage) => (
                        <div key={stage.label} className="rounded-xl border border-slate-200 p-3">
                          <button
                            type="button"
                            onClick={() => setExpandedStages(current => ({ ...current, [stage.key]: !current[stage.key] }))}
                            className="flex w-full cursor-pointer items-start justify-between gap-3 rounded-lg text-left transition hover:bg-slate-50"
                          >
                            <div>
                              <span className="rounded-full bg-emerald-50 px-2 py-1 text-[0.58rem] font-black uppercase tracking-[0.12em] text-emerald-700">{stage.label}</span>
                              <h5 className="mt-2 text-xs font-black text-slate-900">{stage.title}</h5>
                            </div>
                            <span className="flex items-center gap-2 text-xs font-black text-emerald-700">
                              {stage.progress}%
                              <i className={`fa-solid fa-chevron-${expandedStages[stage.key] ? 'up' : 'down'} text-[0.65rem] text-slate-400`} aria-hidden="true" />
                            </span>
                          </button>
                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${stage.progress}%` }} />
                          </div>
                          {expandedStages[stage.key] && (
                          <div className="mt-3 space-y-1.5">
                            {stage.lessons.map((lesson) => (
                              <button
                                key={`${stage.label}-${lesson.number}-${lesson.title}`}
                                type="button"
                                onClick={() => openCurriculumItem(lesson)}
                                disabled={lesson.disabled || courseUpdating}
                                className={`flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${lesson.active || selectedCanvasFocus?.id === lesson.id ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100' : 'hover:bg-slate-50'}`}
                              >
                                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[0.65rem] font-black ${completedItems.includes(lesson.id) ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                  {completedItems.includes(lesson.id) ? <i className="fa-solid fa-check text-[0.62rem]" aria-hidden="true" /> : lesson.number}
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-xs font-black text-slate-900">{lesson.title}</span>
                                  <span className="block truncate text-[0.68rem] font-semibold text-slate-500">{lesson.meta}</span>
                                </span>
                                <i className={`fa-solid ${selectedCanvasFocus?.id === lesson.id ? 'fa-circle-dot text-emerald-600' : 'fa-chevron-right text-slate-300'} text-xs`} aria-hidden="true" />
                              </button>
                            ))}
                          </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </aside>

                <main className="relative min-h-0 overflow-y-auto bg-[#f7fafc] p-4 sm:p-5">
                  {canvasLoading.active && (
                    <div className="absolute inset-0 z-30 flex items-start justify-center bg-slate-50/80 px-4 py-20 backdrop-blur-sm">
                      <div className="w-full max-w-xl overflow-hidden rounded-[1.5rem] border border-emerald-100 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.16)]">
                        <div className="relative p-6">
                          <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-300/20 blur-3xl" />
                          <div className="relative flex items-start gap-4">
                            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                              <span className="absolute inset-0 rounded-2xl border-2 border-emerald-200" />
                              <span className="absolute inset-1 animate-ping rounded-2xl bg-emerald-300/25" />
                              <i className="fa-solid fa-wand-magic-sparkles relative text-xl" aria-hidden="true" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-emerald-700">Generated Course Canvas</p>
                              <h3 className="mt-1 text-lg font-black text-slate-950">{canvasLoading.label || 'Preparing your learning canvas...'}</h3>
                              <p className="mt-2 text-sm leading-6 text-slate-500">
                                Building the view from chapter videos, notions, resources, and saved learning progress.
                              </p>
                              <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
                                <div className="h-full w-1/2 animate-[pulse_1.2s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-emerald-500 via-sky-400 to-emerald-500" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="mb-4 flex flex-col gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-emerald-800 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-black">
                        <i className="fa-solid fa-circle-check mr-2" aria-hidden="true" />
                        A freshly generated curriculum and server-trained assessment is ready.
                      </p>
                      {selectedCanvasFocus && (
                        <p className="mt-1 text-xs font-bold text-emerald-700">
                          Active focus: {selectedCanvasFocus.type} - {selectedCanvasFocus.title}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={exportCanvasAsPdf}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-white px-4 py-2 text-xs font-black text-emerald-700 shadow-sm transition hover:bg-emerald-50"
                      >
                        <i className="fa-solid fa-file-pdf" aria-hidden="true" />
                        Generate PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => refreshChapterCourse(selectedCanvasFocus)}
                        disabled={courseUpdating}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-black text-white shadow-lg shadow-emerald-100 transition hover:bg-emerald-700 disabled:opacity-60"
                      >
                        <i className={`fa-solid ${courseUpdating ? 'fa-circle-notch animate-spin' : 'fa-rotate'}`} aria-hidden="true" />
                        Update to Fresh Version
                      </button>
                    </div>
                  </div>

                  <section>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-emerald-700">Generated course canvas</p>
                        <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">{chapterCourse?.title || moduleTitle}</h2>
                        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
                          {aiCanvas?.overview || chapterCourse?.subtitle || currentSection?.description || 'This canvas turns the current chapter into a focused study path with evidence, workflow, assessment, and resources.'}
                        </p>
                      </div>
                      <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        {generatedStats.map((stat) => (
                          <div key={stat.label} className="border-r border-slate-100 px-4 py-3 text-center last:border-r-0">
                            <strong className="block text-lg font-black text-slate-950">{stat.value}</strong>
                            <span className="text-[0.62rem] font-black uppercase tracking-[0.12em] text-slate-400">{stat.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {isQuizMode && (
                      <div className="mt-5 rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h3 className="text-base font-black text-slate-950">Chapter Practice Quiz</h3>
                            <p className="mt-1 text-xs font-semibold text-slate-500">
                              24 questions, split into 3 steps of 8. You can generate this quiz only 2 times per day.
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700">
                              {quizLimitInfo.count || 0}/{quizLimitInfo.limit || 2} generated today
                            </span>
                            {nextResetLabel && (quizLimitInfo.count || 0) >= (quizLimitInfo.limit || 2) && (
                              <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-black text-amber-700">
                                Resets {nextResetLabel}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={generatePracticeQuiz}
                              disabled={courseUpdating || (quizLimitInfo.count || 0) >= (quizLimitInfo.limit || 2)}
                              className="cursor-pointer rounded-lg bg-emerald-600 px-4 py-2 text-xs font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {practiceQuizQuestions.length ? 'Generate new set' : 'Generate quiz'}
                            </button>
                          </div>
                        </div>

                        {practiceQuizQuestions.length > 0 && (
                          <div className="mt-4">
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                              <div className="flex gap-2">
                                {[0, 1, 2].map((step) => (
                                  <button
                                    key={step}
                                    type="button"
                                    onClick={() => setPracticeQuizStep(step)}
                                    className={`cursor-pointer rounded-lg px-3 py-2 text-xs font-black transition ${practiceQuizStep === step ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                  >
                                    Step {step + 1}
                                  </button>
                                ))}
                              </div>
                              <span className="text-xs font-black text-slate-500">
                                {practiceQuizAnsweredCount}/{practiceQuizQuestions.length} answered
                              </span>
                            </div>

                            <div className="grid gap-3">
                              {currentPracticeQuestions.map((question, index) => (
                                <article key={question._id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                  <h4 className="text-sm font-black text-slate-950">
                                    {practiceQuizStep * 8 + index + 1}. {question.questionText}
                                  </h4>
                                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                    {question.options.map((option) => {
                                      const selected = practiceQuizAnswers[question._id] === (option._id || option.text);
                                      return (
                                        <button
                                          key={option._id || option.text}
                                          type="button"
                                          onClick={() => setPracticeQuizAnswers(current => ({ ...current, [question._id]: option._id || option.text }))}
                                          className={`cursor-pointer rounded-lg border px-3 py-2 text-left text-xs font-bold transition ${selected ? 'border-emerald-400 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200'}`}
                                        >
                                          {option.text}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </article>
                              ))}
                            </div>

                            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              {practiceQuizResult ? (
                                <div className={`rounded-xl px-4 py-3 text-sm font-black ${practiceQuizResult.passed ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                  Score: {practiceQuizResult.score}% ({practiceQuizResult.correct}/{practiceQuizResult.total}) - {practiceQuizResult.passed ? 'Passed' : 'Keep practicing'}
                                </div>
                              ) : <span className="text-xs font-bold text-slate-500">Finish all 24 questions before submitting.</span>}
                              <button
                                type="button"
                                onClick={submitPracticeQuiz}
                                disabled={practiceQuizAnsweredCount < practiceQuizQuestions.length}
                                className="cursor-pointer rounded-lg bg-slate-950 px-4 py-2 text-xs font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Submit Practice Quiz
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {isSandboxMode && (
                      <div className="mt-5 rounded-xl border border-sky-100 bg-white p-4 shadow-sm">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h3 className="text-base font-black text-slate-950">Practice Sandbox</h3>
                            <p className="mt-1 text-xs font-semibold text-slate-500">
                              A personal practice workspace for this chapter. Nothing here is saved globally.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => ask('Create a guided practice plan for this chapter. Include warm-up, notion drills, resource review, correction steps, and a final self-check.')}
                            className="cursor-pointer rounded-lg bg-sky-600 px-4 py-2 text-xs font-black text-white transition hover:bg-sky-700"
                          >
                            Ask for guided practice
                          </button>
                        </div>

                        {personalCanvasUpdates.length > 0 && (
                          <div className="mt-4 rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 to-white p-4">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-[0.65rem] font-black uppercase tracking-[0.14em] text-sky-700">Personal only</p>
                                <h4 className="mt-1 text-base font-black text-slate-950">Sandbox Updates From AI</h4>
                              </div>
                              <span className="rounded-full bg-white px-3 py-1 text-[0.68rem] font-black text-slate-500 shadow-sm">
                                {personalCanvasUpdates.length}
                              </span>
                            </div>
                            <div className="mt-3 grid gap-3">
                              {personalCanvasUpdates.map((item) => (
                                <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                  <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                                    <div>
                                      <h5 className="text-sm font-black text-slate-950">{item.title}</h5>
                                      <p className="mt-1 text-xs font-semibold text-slate-500">Added from the latest AI response. This is not saved globally.</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[0.65rem] font-bold text-slate-400">
                                        {item.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => setPersonalCanvasUpdates(current => current.filter(update => update.id !== item.id))}
                                        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                                        aria-label="Remove canvas update"
                                        title="Remove canvas update"
                                      >
                                        <i className="fa-solid fa-xmark text-xs" aria-hidden="true" />
                                      </button>
                                    </div>
                                  </div>
                                  <CanvasNote text={item.body} />
                                </article>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          {sandboxTasks.map((task, index) => (
                            <button
                              key={task.title}
                              type="button"
                              onClick={() => ask(task.prompt)}
                              className="group cursor-pointer rounded-xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:-translate-y-0.5 hover:border-sky-200 hover:bg-white hover:shadow-md"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-xs font-black text-sky-700">{index + 1}</span>
                                <span className="rounded-full bg-white px-2 py-1 text-[0.62rem] font-black uppercase tracking-[0.1em] text-slate-500">{task.tag}</span>
                              </div>
                              <h4 className="mt-3 text-sm font-black text-slate-950">{task.title}</h4>
                              <p className="mt-2 text-xs leading-5 text-slate-600">{task.prompt}</p>
                              <span className="mt-3 inline-flex items-center gap-1 text-[0.66rem] font-black uppercase tracking-[0.12em] text-sky-600 opacity-0 transition group-hover:opacity-100">
                                Practice with AI
                                <i className="fa-solid fa-arrow-right" aria-hidden="true" />
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {!isQuizMode && !isSandboxMode && (
                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                      {canvasConcepts.map((card, index) => (
                        <button
                          key={card.title}
                          type="button"
                          onClick={() => explainCanvasItem(card.title, card.explanation || card.body)}
                          className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
                        >
                          <div className="flex items-start gap-3">
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${card.tone || ['from-blue-500 to-cyan-400', 'from-emerald-500 to-teal-400', 'from-amber-500 to-orange-400'][index % 3]} text-white shadow-sm`}>
                              <i className={card.icon || ['fa-solid fa-book-open-reader', 'fa-solid fa-lightbulb', 'fa-solid fa-list-check'][index % 3]} aria-hidden="true" />
                            </div>
                            <div>
                              <h3 className="text-sm font-black text-slate-950">{card.title}</h3>
                              <p className="mt-1 text-xs leading-5 text-slate-600">{card.explanation || card.body}</p>
                              <span className="mt-3 inline-flex items-center gap-1 text-[0.66rem] font-black uppercase tracking-[0.12em] text-emerald-600 opacity-0 transition group-hover:opacity-100">
                                Ask AI
                                <i className="fa-solid fa-arrow-right" aria-hidden="true" />
                              </span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                    )}
                  </section>

                  {!isQuizMode && !isSandboxMode && (
                  <>
                  <section className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.78fr)]">
                    <article className="rounded-xl border-l-4 border-emerald-500 bg-white p-4 shadow-sm">
                      <h3 className="text-base font-black text-slate-950">Professional Workflow</h3>
                      <ol className="mt-3 space-y-3">
                        {canvasWorkflow.map((item, index) => (
                          <li key={item}>
                            <button type="button" onClick={() => explainCanvasItem(`Workflow step ${index + 1}`, item)} className="group flex w-full cursor-pointer gap-3 rounded-lg p-1 text-left text-sm leading-6 text-slate-700 transition hover:bg-emerald-50">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-xs font-black text-emerald-700">{index + 1}</span>
                            <span>{item}</span>
                            </button>
                          </li>
                        ))}
                      </ol>
                    </article>

                    <article className="rounded-xl border-l-4 border-sky-500 bg-white p-4 shadow-sm">
                      <h3 className="text-base font-black text-slate-950">Failure Modes</h3>
                      <ul className="mt-3 space-y-3">
                        {canvasPitfalls.map((item) => (
                          <li key={item}>
                            <button type="button" onClick={() => explainCanvasItem('Failure mode', item)} className="group flex w-full cursor-pointer gap-3 rounded-lg p-1 text-left text-sm leading-6 text-slate-700 transition hover:bg-sky-50">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
                            <span>{item}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </article>
                  </section>

                  {chapterCourse && (
                    <section className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
                      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <h3 className="text-base font-black text-slate-950">Chapter Course</h3>
                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                          {chapterCourse.modules.map((module, index) => (
                            <button key={`${module.title}-${index}`} type="button" onClick={() => explainCanvasItem(module.title, module.description)} className="group cursor-pointer rounded-xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-white hover:shadow-md">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-[0.62rem] font-black uppercase tracking-[0.14em] text-emerald-700">Lesson {index + 1}</p>
                                  <h4 className="mt-1 text-sm font-black text-slate-950">{module.title}</h4>
                                </div>
                                {module.duration && <span className="rounded-full bg-white px-2 py-1 text-[0.65rem] font-black text-slate-500">{module.duration}m</span>}
                              </div>
                              <p className="mt-2 text-xs leading-5 text-slate-600">{module.description}</p>
                              <span className="mt-3 inline-flex items-center gap-1 text-[0.66rem] font-black uppercase tracking-[0.12em] text-emerald-600 opacity-0 transition group-hover:opacity-100">
                                Explain
                                <i className="fa-solid fa-arrow-right" aria-hidden="true" />
                              </span>
                              <ul className="mt-3 space-y-2">
                                {module.points.slice(0, 4).map((point, pointIndex) => (
                                  <li key={`${module.title}-${pointIndex}`} className="flex gap-2 text-xs leading-5 text-slate-700">
                                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                                    <span>{point}</span>
                                  </li>
                                ))}
                              </ul>
                            </button>
                          ))}
                        </div>
                      </article>

                      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <h3 className="text-base font-black text-slate-950">Learning Outcomes</h3>
                        <ul className="mt-3 space-y-2">
                          {chapterCourse.outcomes.map((outcome, index) => (
                            <li key={outcome}>
                              <button type="button" onClick={() => explainCanvasItem(`Learning outcome ${index + 1}`, outcome)} className="group flex w-full cursor-pointer gap-3 rounded-lg p-1 text-left text-sm leading-6 text-slate-700 transition hover:bg-emerald-50">
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-xs font-black text-emerald-700">{index + 1}</span>
                              <span>{outcome}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </article>
                    </section>
                  )}

                  <section className="mt-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <h3 className="flex items-center gap-2 text-base font-black text-emerald-700">
                      <i className="fa-regular fa-circle-check" aria-hidden="true" />
                      Readiness Checklist
                    </h3>
                    <ul className="mt-3 divide-y divide-slate-100">
                      {canvasChecklist.map((item) => (
                        <li key={item}>
                          <button type="button" onClick={() => explainCanvasItem('Readiness checklist', item)} className="group flex w-full cursor-pointer gap-3 py-3 text-left text-sm leading-6 text-slate-700 transition hover:bg-emerald-50">
                          <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-[0.6rem] text-emerald-700">
                            <i className="fa-solid fa-check" aria-hidden="true" />
                          </span>
                          <span>{item}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>

                  {aiCanvas?.mentorPrompt && (
                    <section className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50 p-4 shadow-sm">
                      <h3 className="flex items-center gap-2 text-base font-black text-emerald-800">
                        <i className="fa-solid fa-user-graduate" aria-hidden="true" />
                        Mentor Prompt
                      </h3>
                      <button type="button" onClick={() => ask(aiCanvas.mentorPrompt)} className="group mt-3 w-full cursor-pointer rounded-xl border border-emerald-100 bg-white p-3 text-left text-sm font-semibold leading-6 text-slate-700 transition hover:border-emerald-300 hover:shadow-sm">
                        {aiCanvas.mentorPrompt}
                      </button>
                    </section>
                  )}

                  {canvasAssessment.length > 0 && (
                    <section className="mt-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                      <h3 className="flex items-center gap-2 text-base font-black text-slate-950">
                        <i className="fa-solid fa-clipboard-question text-emerald-600" aria-hidden="true" />
                        Chapter Assessment
                      </h3>
                      <div className="mt-3 grid gap-3">
                        {canvasAssessment.map((item, index) => (
                          <button
                            key={item.id || `${item.prompt}-${index}`}
                            type="button"
                            onClick={() => explainCanvasItem(`Assessment question ${index + 1}`, `${item.prompt} Correct answer: ${item.options[Number(item.correctAnswer)]}. Rationale: ${item.rationale}`)}
                            className="group cursor-pointer rounded-xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-emerald-200 hover:bg-white hover:shadow-sm"
                          >
                            <p className="text-sm font-black text-slate-900">{index + 1}. {item.prompt}</p>
                            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                              {item.options.map((option, optionIndex) => (
                                <span key={`${item.id}-${option}`} className={`cursor-pointer rounded-lg border px-3 py-2 text-xs font-bold ${String(optionIndex) === String(item.correctAnswer) ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-600'}`}>
                                  {optionIndex + 1}. {option}
                                </span>
                              ))}
                            </div>
                          </button>
                        ))}
                      </div>
                    </section>
                  )}

                  <div className="mt-5 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-sm font-black text-slate-950">Ready to convert this chapter into practice?</h3>
                      <p className="mt-1 text-xs font-semibold text-slate-500">Generate questions, examples, and a compact practice plan from the current course canvas.</p>
                    </div>
                    <button type="button" onClick={openPracticeSandbox} className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-black text-white transition hover:bg-emerald-800">
                      Go to Practice Sandbox
                      <i className="fa-solid fa-arrow-right" aria-hidden="true" />
                    </button>
                  </div>
                  </>
                  )}
                </main>

                <aside className="flex min-h-0 flex-col border-t border-slate-200 bg-slate-950 text-white lg:border-l lg:border-t-0">
                  <div className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_34%),rgba(255,255,255,0.04)] p-4">
                    <p className="flex items-center gap-2 text-[0.64rem] font-black uppercase tracking-[0.16em] text-emerald-300">
                      <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(52,211,153,0.9)]" />
                      AI chat area
                    </p>
                    <h3 className="mt-2 text-base font-black">Ask about this canvas</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-400">Click anything in the middle canvas or type your own question here.</p>
                  </div>

                  <div ref={listRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
                    {messages.map((message, index) => (
                      <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[92%] rounded-2xl px-3.5 py-3 shadow-lg ${message.role === 'user' ? 'bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-emerald-950/20' : 'border border-white/10 bg-white/[0.06] shadow-black/10'}`}>
                          {message.role === 'assistant' ? (
                            <>
                              <AssistantResponse text={message.content} />
                              {index > 0 && (
                                <button
                                  type="button"
                                  onClick={() => updatePersonalCanvasFromAnswer(message.content)}
                                  className="mt-3 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-emerald-300/20 bg-emerald-500/10 px-3 py-2 text-xs font-black text-emerald-100 transition hover:border-emerald-300/40 hover:bg-emerald-500/20"
                                >
                                  <i className="fa-solid fa-pen-to-square" aria-hidden="true" />
                                  Update my canvas with this answer
                                </button>
                              )}
                            </>
                          ) : <p className="text-sm font-semibold leading-6">{message.content}</p>}
                        </div>
                      </div>
                    ))}

                    {loading && (
                      <div className="flex justify-start">
                        <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-bold text-slate-400">
                          <i className="fa-solid fa-circle-notch mr-2 animate-spin" aria-hidden="true" />
                          Studying the canvas...
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-white/10 bg-[#08111f]/95 p-4">
                    <div className="mb-3 flex flex-wrap gap-2">
                      {starterQuestions.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => ask(item)}
                          className="rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5 text-xs font-bold text-slate-300 transition hover:border-emerald-300/30 hover:bg-emerald-500/10 hover:text-emerald-100"
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        ask();
                      }}
                      className="flex gap-2"
                    >
                      <input
                        value={question}
                        onChange={(event) => setQuestion(event.target.value)}
                        placeholder="Ask from this canvas..."
                        className="h-11 min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/[0.055] px-4 text-sm font-semibold text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400/60 focus:bg-white/[0.08]"
                      />
                      <button type="submit" disabled={loading || !question.trim()} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-950/20 transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50">
                        <i className="fa-solid fa-paper-plane" aria-hidden="true" />
                      </button>
                    </form>
                  </div>
                </aside>
              </div>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col bg-slate-950/20">
                <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
                  {messages.map((message, index) => (
                    <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[90%] rounded-2xl px-4 py-3 shadow-lg ${message.role === 'user' ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-blue-950/20' : 'border border-white/10 bg-white/[0.055] shadow-black/10'}`}>
                        {message.role === 'assistant' ? <AssistantResponse text={message.content} /> : <p className="text-sm font-semibold leading-6">{message.content}</p>}
                      </div>
                    </div>
                  ))}

                  {loading && (
                    <div className="flex justify-start">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3 text-sm font-bold text-slate-400">
                        <i className="fa-solid fa-circle-notch mr-2 animate-spin" aria-hidden="true" />
                        Analyzing this course context...
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-white/10 bg-[#08111f]/95 p-4">
                  <div className="mb-3 flex flex-wrap gap-2">
                    {starterQuestions.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => ask(item)}
                        className="rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5 text-xs font-bold text-slate-300 transition hover:border-blue-300/30 hover:bg-blue-500/10 hover:text-blue-100"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      ask();
                    }}
                    className="flex gap-2"
                  >
                    <input
                      value={question}
                      onChange={(event) => setQuestion(event.target.value)}
                      placeholder="Ask about this course, chapter, or notion..."
                      className="h-12 min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/[0.055] px-4 text-sm font-semibold text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400/60 focus:bg-white/[0.08]"
                    />
                    <button type="submit" disabled={loading || !question.trim()} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-emerald-500 text-white shadow-lg shadow-blue-950/20 transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50">
                      <i className="fa-solid fa-paper-plane" aria-hidden="true" />
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
