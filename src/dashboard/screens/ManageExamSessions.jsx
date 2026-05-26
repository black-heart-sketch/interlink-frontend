import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { aiExamService } from '../../services/aiExamService';
import { studyLanguageService } from '../../services/studyLanguageService';
import { userService } from '../../services/userService';

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const DEFAULT_SECTIONS = [
  { key: 'ascolto', title: 'Ascolto', type: 'listening', durationMinutes: 30, maxScore: 25, instructions: 'Listening comprehension section.' },
  { key: 'lettura', title: 'Lettura', type: 'reading', durationMinutes: 45, maxScore: 25, instructions: 'Reading comprehension section.' },
  { key: 'scritta', title: 'Scritta', type: 'writing', durationMinutes: 45, maxScore: 25, instructions: 'Written production section.' },
  { key: 'orale', title: 'Orale', type: 'speaking', durationMinutes: 20, maxScore: 25, instructions: 'Speaking production section.' },
];

const emptyBlueprint = {
  studyLanguage: '',
  examFamily: 'CERT.IT',
  level: 'B1',
  title: '',
  description: '',
  totalDurationMinutes: 140,
  passScore: 60,
  status: 'active',
  generationPrompt: '',
};

const emptySession = {
  generatedExamId: '',
  title: '',
  startsAt: '',
  endsAt: '',
  accessMode: 'language_level',
  eligibleStudents: [],
  allowLateJoin: false,
  strictSectionOrder: true,
  noRetake: true,
  autoSubmitAtClose: true,
  speakingUploadRequired: false,
  antiCheatEnabled: true,
  resultReleaseMode: 'manual',
};

const inputCls = 'h-12 w-full rounded-2xl border border-white/10 bg-slate-950/45 px-4 text-sm font-bold text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/60';
const selectCls = 'h-12 w-full rounded-2xl border border-white/10 bg-[#0f172a] px-4 text-sm font-bold text-white outline-none transition focus:border-blue-400/60';
const cardCls = 'rounded-[1.6rem] border border-white/10 bg-white/[0.045] p-5 shadow-[0_22px_70px_rgba(0,0,0,0.22)]';

function Spinner() {
  return <i className="fa-solid fa-spinner fa-spin" aria-hidden="true" />;
}

function ButtonContent({ loading, children }) {
  return (
    <span className="inline-flex items-center justify-center gap-2">
      {loading && <Spinner />}
      {children}
    </span>
  );
}

function getRoles() {
  try {
    return JSON.parse(sessionStorage.getItem('userRoles') || localStorage.getItem('userRoles') || '[]').map((role) => String(role).toLowerCase());
  } catch {
    return [];
  }
}

function toIsoDateTime(value) {
  return value ? new Date(value).toISOString() : undefined;
}

function formatDateTime(value) {
  if (!value) return 'Not scheduled';
  return new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

function statusTone(status) {
  const map = {
    draft: 'bg-slate-500/10 text-slate-200',
    scheduled: 'bg-sky-500/10 text-sky-200',
    open: 'bg-emerald-500/10 text-emerald-200',
    closed: 'bg-amber-500/10 text-amber-200',
    grading: 'bg-violet-500/10 text-violet-200',
    results_released: 'bg-blue-500/10 text-blue-200',
    approved: 'bg-emerald-500/10 text-emerald-200',
    active: 'bg-emerald-500/10 text-emerald-200',
  };
  return map[status] || 'bg-slate-500/10 text-slate-200';
}

function StatusPill({ value }) {
  return (
    <span className={`rounded-full px-3 py-1 text-[0.65rem] font-black uppercase tracking-widest ${statusTone(value)}`}>
      {String(value || 'draft').replace(/_/g, ' ')}
    </span>
  );
}

function contentList(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function renderContentBlock(item, fallbackTitle) {
  if (typeof item === 'string') {
    return <p className="text-sm font-semibold leading-7 text-slate-300">{item}</p>;
  }

  return (
    <div>
      {(item.title || fallbackTitle) && <h6 className="text-sm font-black text-white">{item.title || fallbackTitle}</h6>}
      <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-7 text-slate-300">{item.text || item.prompt || item.content || ''}</p>
    </div>
  );
}

function SectionSourceContent({ section }) {
  const passages = contentList(section.content?.passages);
  const scripts = contentList(section.content?.listeningScripts);
  const prompts = contentList(section.content?.prompts);
  const blocks = [
    ...scripts.map((item) => ({ type: 'Listening Script', item })),
    ...passages.map((item) => ({ type: 'Reading Passage', item })),
    ...prompts.map((item) => ({ type: 'Prompt', item })),
  ];

  if (!blocks.length) return null;

  return (
    <div className="mt-4 grid gap-3">
      {blocks.map((block, index) => (
        <article key={`${block.type}-${index}`} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
          <span className="mb-2 block text-[0.62rem] font-black uppercase tracking-[0.18em] text-blue-200">{block.type}</span>
          {renderContentBlock(block.item, block.type)}
        </article>
      ))}
    </div>
  );
}

function QuestionAnswer({ question, value, onChange }) {
  const options = Array.isArray(question.options) ? question.options : [];
  const type = String(question.type || '').toLowerCase();
  const usesChoices = options.length > 0 && ['mcq', 'multiple_choice', 'true_false'].includes(type);
  const textareaTypes = ['essay', 'writing', 'speaking_prompt', 'speaking', 'oral'];
  const questionId = question.id || question.prompt || 'question';

  if (usesChoices) {
    return (
      <div className="mt-4 grid gap-2">
        {options.map((option) => (
          <label key={option} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm font-bold text-slate-200 transition hover:border-blue-400/50">
            <input
              type="radio"
              name={questionId}
              checked={value === option}
              onChange={() => onChange(option)}
              className="h-4 w-4 accent-blue-500"
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    );
  }

  if (textareaTypes.includes(type)) {
    return (
      <textarea
        value={value || ''}
        onChange={(event) => onChange(event.target.value)}
        rows={7}
        className={`${inputCls} mt-4 h-auto resize-y py-3 leading-7`}
        placeholder={type.includes('speaking') ? 'Type your spoken response notes or transcript here...' : 'Write your answer here...'}
      />
    );
  }

  return (
    <input
      value={value || ''}
      onChange={(event) => onChange(event.target.value)}
      className={`${inputCls} mt-4`}
      placeholder="Your answer..."
    />
  );
}

function ExamWriter({ payload, actionLoading, onAnswerChange, onSave, onSubmit, onBack }) {
  const { session, attempt, exam } = payload;
  const sections = exam?.sections || [];
  const [activeSectionKey, setActiveSectionKey] = useState(attempt.currentSectionKey || sections[0]?.key || '');
  const activeSection = sections.find((section) => section.key === activeSectionKey) || sections[0];
  const sectionAnswers = attempt.sectionAnswers || {};
  const activeAnswers = activeSection ? sectionAnswers[activeSection.key] || {} : {};
  const answeredCount = sections.reduce((total, section) => {
    const answers = sectionAnswers[section.key] || {};
    return total + (section.questions || []).filter((question) => String(answers[question.id] || '').trim()).length;
  }, 0);
  const questionCount = sections.reduce((total, section) => total + (section.questions?.length || 0), 0);

  const updateAnswer = (sectionKey, questionId, value) => {
    onAnswerChange({
      sectionAnswers: {
        ...sectionAnswers,
        [sectionKey]: {
          ...(sectionAnswers[sectionKey] || {}),
          [questionId]: value,
        },
      },
      currentSectionKey: sectionKey,
    });
  };

  const goToSection = (sectionKey) => {
    setActiveSectionKey(sectionKey);
    onAnswerChange({ currentSectionKey: sectionKey });
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
      <aside className={`${cardCls} h-fit xl:sticky xl:top-28`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-blue-200">{session.examFamily} {session.level}</span>
            <h4 className="mt-2 text-lg font-black text-white">{exam.title || session.title}</h4>
          </div>
          <StatusPill value={attempt.status} />
        </div>
        <p className="mt-3 text-xs font-bold leading-6 text-slate-500">{answeredCount}/{questionCount} answered</p>
        <div className="mt-5 grid gap-2">
          {sections.map((section, index) => {
            const isActive = section.key === activeSection?.key;
            const answered = (section.questions || []).filter((question) => String((sectionAnswers[section.key] || {})[question.id] || '').trim()).length;
            return (
              <button
                key={section.key}
                type="button"
                onClick={() => goToSection(section.key)}
                className={`rounded-2xl border px-4 py-3 text-left transition ${isActive ? 'border-blue-400/60 bg-blue-500/15' : 'border-white/10 bg-slate-950/35 hover:border-white/20'}`}
              >
                <span className="block text-[0.62rem] font-black uppercase tracking-[0.16em] text-slate-500">Section {index + 1}</span>
                <strong className="mt-1 block text-sm font-black text-white">{section.title}</strong>
                <span className="mt-1 block text-xs font-bold text-slate-500">{answered}/{section.questions?.length || 0} answered</span>
              </button>
            );
          })}
        </div>
        <div className="mt-5 grid gap-2">
          <button type="button" onClick={() => onSave(activeSection?.key)} disabled={actionLoading === 'save-attempt'} className="rounded-2xl border border-blue-400/30 bg-blue-500/10 px-4 py-3 text-xs font-black uppercase tracking-widest text-blue-200 hover:bg-blue-500/20 disabled:opacity-60">
            <ButtonContent loading={actionLoading === 'save-attempt'}>Save Progress</ButtonContent>
          </button>
          <button type="button" onClick={onSubmit} disabled={actionLoading === 'submit-attempt'} className="rounded-2xl bg-emerald-500 px-4 py-3 text-xs font-black uppercase tracking-widest text-white hover:bg-emerald-400 disabled:opacity-60">
            <ButtonContent loading={actionLoading === 'submit-attempt'}>Submit Exam</ButtonContent>
          </button>
          <button type="button" onClick={onBack} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-300 hover:bg-white/10">
            Back to Sessions
          </button>
        </div>
      </aside>

      <section className={cardCls}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <span className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-slate-500">{activeSection?.type || 'Exam'} · {activeSection?.durationMinutes || 0} min · {activeSection?.maxScore || 0} pts</span>
            <h4 className="mt-2 text-2xl font-black text-white">{activeSection?.title || 'Exam Section'}</h4>
            {activeSection?.instructions && <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-slate-400">{activeSection.instructions}</p>}
          </div>
          <span className="rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-400">
            Ends {formatDateTime(session.endsAt)}
          </span>
        </div>

        {activeSection && <SectionSourceContent section={activeSection} />}

        <div className="mt-6 grid gap-4">
          {(activeSection?.questions || []).length === 0 ? (
            <p className="rounded-2xl border border-white/10 bg-slate-950/35 p-6 text-center text-sm font-bold text-slate-400">No questions in this section.</p>
          ) : activeSection.questions.map((question, index) => (
            <article key={question.id || question.prompt || index} className="rounded-2xl border border-white/10 bg-slate-950/35 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white/[0.06] px-3 py-1 text-[0.62rem] font-black uppercase tracking-widest text-slate-400">Question {index + 1}</span>
                {question.type && <span className="rounded-full bg-blue-500/10 px-3 py-1 text-[0.62rem] font-black uppercase tracking-widest text-blue-200">{String(question.type).replace(/_/g, ' ')}</span>}
              </div>
              <p className="mt-4 whitespace-pre-wrap text-base font-bold leading-8 text-white">{question.prompt}</p>
              <QuestionAnswer
                question={question}
                value={activeAnswers[question.id || `q${index + 1}`]}
                onChange={(value) => updateAnswer(activeSection.key, question.id || `q${index + 1}`, value)}
              />
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function RuleToggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3">
      <span className="text-sm font-bold text-slate-300">{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-5 w-5 accent-blue-500" />
    </label>
  );
}

export default function ManageExamSessions({ initialTab }) {
  const roles = useMemo(() => getRoles(), []);
  const isAdmin = roles.includes('admin') || roles.includes('superadmin');
  const [tab, setTab] = useState(initialTab || (isAdmin ? 'sessions' : 'available'));
  const [languages, setLanguages] = useState([]);
  const [students, setStudents] = useState([]);
  const [blueprints, setBlueprints] = useState([]);
  const [generatedExams, setGeneratedExams] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [availableSessions, setAvailableSessions] = useState([]);
  const [blueprintForm, setBlueprintForm] = useState(emptyBlueprint);
  const [generateForm, setGenerateForm] = useState({ blueprintId: '', adminPrompt: '' });
  const [sessionForm, setSessionForm] = useState(emptySession);
  const [activeAttemptPayload, setActiveAttemptPayload] = useState(null);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState('');
  const [loading, setLoading] = useState(true);

  const approvedExams = useMemo(() => generatedExams.filter((exam) => exam.status === 'approved'), [generatedExams]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [langs, blueprintRows, examRows, sessionRows, availableRows, studentRows] = await Promise.all([
        studyLanguageService.getLanguages(true).catch(() => []),
        isAdmin ? aiExamService.getBlueprints() : Promise.resolve([]),
        isAdmin ? aiExamService.getGeneratedExams() : Promise.resolve([]),
        isAdmin ? aiExamService.getSessions() : Promise.resolve([]),
        aiExamService.getAvailableSessions().catch(() => []),
        isAdmin ? userService.getUsers({ role: 'student' }).catch(() => []) : Promise.resolve([]),
      ]);
      setLanguages(Array.isArray(langs) ? langs : []);
      setBlueprints(Array.isArray(blueprintRows) ? blueprintRows : []);
      setGeneratedExams(Array.isArray(examRows) ? examRows : []);
      setSessions(Array.isArray(sessionRows) ? sessionRows : []);
      setAvailableSessions(Array.isArray(availableRows) ? availableRows : []);
      setStudents(Array.isArray(studentRows) ? studentRows : []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to load exam sessions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const createBlueprint = async (event) => {
    event.preventDefault();
    if (!blueprintForm.studyLanguage) return toast.error('Select a study language.');
    setSaving(true);
    try {
      await aiExamService.createBlueprint({
        ...blueprintForm,
        totalDurationMinutes: Number(blueprintForm.totalDurationMinutes) || 1,
        passScore: Number(blueprintForm.passScore) || 60,
        sections: DEFAULT_SECTIONS,
      });
      toast.success('Exam blueprint created.');
      setBlueprintForm(emptyBlueprint);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to create blueprint.');
    } finally {
      setSaving(false);
    }
  };

  const generateExam = async (event) => {
    event.preventDefault();
    if (!generateForm.blueprintId) return toast.error('Select a blueprint.');
    setSaving(true);
    try {
      await aiExamService.generateExam(generateForm);
      toast.success('AI mock exam generated.');
      setGenerateForm({ blueprintId: '', adminPrompt: '' });
      setTab('mocks');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to generate mock exam.');
    } finally {
      setSaving(false);
    }
  };

  const approveExam = async (exam) => {
    setActionLoading(`approve-${exam._id}`);
    try {
      await aiExamService.approveGeneratedExam(exam._id);
      toast.success('Mock exam approved.');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to approve exam.');
    } finally {
      setActionLoading('');
    }
  };

  const createSession = async (event) => {
    event.preventDefault();
    if (!sessionForm.generatedExamId) return toast.error('Select an approved mock exam.');
    if (!sessionForm.startsAt || !sessionForm.endsAt) return toast.error('Start and end time are required.');
    setSaving(true);
    try {
      await aiExamService.createSession({
        ...sessionForm,
        startsAt: toIsoDateTime(sessionForm.startsAt),
        endsAt: toIsoDateTime(sessionForm.endsAt),
      });
      toast.success('Exam session scheduled.');
      setSessionForm(emptySession);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to schedule session.');
    } finally {
      setSaving(false);
    }
  };

  const sessionAction = async (session, action) => {
    const labels = {
      launch: 'Exam launched.',
      close: 'Exam closed.',
      correction: 'AI correction started.',
      release: 'Results released.',
    };
    setActionLoading(`${action}-${session._id}`);
    try {
      if (action === 'launch') await aiExamService.launchSession(session._id);
      if (action === 'close') await aiExamService.closeSession(session._id);
      if (action === 'correction') await aiExamService.runCorrection(session._id);
      if (action === 'release') await aiExamService.releaseResults(session._id);
      toast.success(labels[action]);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to update session.');
    } finally {
      setActionLoading('');
    }
  };

  const startSession = async (session) => {
    setActionLoading(`start-${session._id}`);
    try {
      const result = await aiExamService.startSession(session._id);
      setActiveAttemptPayload(result);
      toast.success('Exam ready.');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to start exam.');
    } finally {
      setActionLoading('');
    }
  };

  const updateActiveAttempt = (updates) => {
    setActiveAttemptPayload((current) => {
      if (!current) return current;
      return {
        ...current,
        attempt: {
          ...current.attempt,
          ...updates,
        },
      };
    });
  };

  const saveActiveAttempt = async (currentSectionKey) => {
    if (!activeAttemptPayload?.attempt?._id) return;
    setActionLoading('save-attempt');
    try {
      const saved = await aiExamService.saveAttempt(activeAttemptPayload.attempt._id, {
        sectionAnswers: activeAttemptPayload.attempt.sectionAnswers || {},
        currentSectionKey: currentSectionKey || activeAttemptPayload.attempt.currentSectionKey,
      });
      updateActiveAttempt(saved);
      toast.success('Progress saved.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to save progress.');
    } finally {
      setActionLoading('');
    }
  };

  const submitActiveAttempt = async () => {
    if (!activeAttemptPayload?.attempt?._id) return;
    setActionLoading('submit-attempt');
    try {
      await aiExamService.submitAttempt(activeAttemptPayload.attempt._id, {
        sectionAnswers: activeAttemptPayload.attempt.sectionAnswers || {},
      });
      toast.success('Exam submitted.');
      setActiveAttemptPayload(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to submit exam.');
    } finally {
      setActionLoading('');
    }
  };

  return (
    <div className="space-y-6">
      {loading ? (
        <section className={cardCls}>
          <p className="text-center text-sm font-bold text-slate-400">Loading exam session workspace...</p>
        </section>
      ) : activeAttemptPayload ? (
        <ExamWriter
          payload={activeAttemptPayload}
          actionLoading={actionLoading}
          onAnswerChange={updateActiveAttempt}
          onSave={saveActiveAttempt}
          onSubmit={submitActiveAttempt}
          onBack={() => setActiveAttemptPayload(null)}
        />
      ) : (
        <>
          {isAdmin && tab === 'blueprints' && (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
              <section className={cardCls}>
                <h4 className="text-xl font-black text-white">Exam Blueprints</h4>
                <div className="mt-5 grid gap-4">
                  {blueprints.length === 0 ? <p className="rounded-2xl border border-white/10 bg-slate-950/35 p-6 text-center text-sm font-bold text-slate-400">No blueprints yet.</p> : blueprints.map((blueprint) => (
                    <article key={blueprint._id} className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill value={blueprint.status} />
                        <span className="rounded-full bg-blue-500/10 px-3 py-1 text-[0.65rem] font-black uppercase tracking-widest text-blue-200">{blueprint.examFamily} {blueprint.level}</span>
                      </div>
                      <h5 className="mt-3 text-lg font-black text-white">{blueprint.title}</h5>
                      <p className="mt-2 text-sm font-semibold text-slate-500">{blueprint.studyLanguage?.name || blueprint.languageName || 'Language'} · {blueprint.sections?.length || 0} sections · {blueprint.totalDurationMinutes || 0} min</p>
                    </article>
                  ))}
                </div>
              </section>

              <aside className={`${cardCls} h-fit`}>
                <h4 className="text-xl font-black text-white">Create Blueprint</h4>
                <form onSubmit={createBlueprint} className="mt-5 space-y-4">
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-400">Study language</span>
                    <select required value={blueprintForm.studyLanguage} onChange={(event) => setBlueprintForm({ ...blueprintForm, studyLanguage: event.target.value })} className={selectCls}>
                      <option value="">Select language...</option>
                      {languages.map((language) => <option key={language._id} value={language._id}>{language.name}</option>)}
                    </select>
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-sm font-bold text-slate-400">Exam family</span>
                      <input required value={blueprintForm.examFamily} onChange={(event) => setBlueprintForm({ ...blueprintForm, examFamily: event.target.value })} className={inputCls} />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-bold text-slate-400">Level</span>
                      <select value={blueprintForm.level} onChange={(event) => setBlueprintForm({ ...blueprintForm, level: event.target.value })} className={selectCls}>
                        {LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}
                      </select>
                    </label>
                  </div>
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-400">Title</span>
                    <input required value={blueprintForm.title} onChange={(event) => setBlueprintForm({ ...blueprintForm, title: event.target.value })} className={inputCls} placeholder="CERT.IT B1 official structure" />
                  </label>
                  <textarea value={blueprintForm.generationPrompt} onChange={(event) => setBlueprintForm({ ...blueprintForm, generationPrompt: event.target.value })} rows={4} className={`${inputCls} h-auto py-3`} placeholder="AI generation instructions..." />
                  <button disabled={saving} type="submit" className="w-full rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-blue-50 disabled:opacity-60">
                    <ButtonContent loading={saving}>Create Blueprint</ButtonContent>
                  </button>
                </form>
              </aside>
            </div>
          )}

          {isAdmin && tab === 'mocks' && (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
              <section className={cardCls}>
                <h4 className="text-xl font-black text-white">Generated Mock Review</h4>
                <div className="mt-5 grid gap-4">
                  {generatedExams.length === 0 ? <p className="rounded-2xl border border-white/10 bg-slate-950/35 p-6 text-center text-sm font-bold text-slate-400">No generated mock exams yet.</p> : generatedExams.map((exam) => (
                    <article key={exam._id} className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusPill value={exam.status} />
                            <span className="rounded-full bg-blue-500/10 px-3 py-1 text-[0.65rem] font-black uppercase tracking-widest text-blue-200">{exam.examFamily} {exam.level}</span>
                          </div>
                          <h5 className="mt-3 text-lg font-black text-white">{exam.title}</h5>
                          <p className="mt-2 text-sm font-semibold text-slate-500">{exam.studyLanguage?.name || 'Language'} · {exam.sections?.length || 0} sections</p>
                        </div>
                        {exam.status !== 'approved' && (
                          <button type="button" disabled={actionLoading === `approve-${exam._id}`} onClick={() => approveExam(exam)} className="rounded-2xl bg-emerald-500 px-4 py-3 text-xs font-black uppercase tracking-widest text-white hover:bg-emerald-400 disabled:opacity-60">
                            <ButtonContent loading={actionLoading === `approve-${exam._id}`}>Approve</ButtonContent>
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <aside className={`${cardCls} h-fit`}>
                <h4 className="text-xl font-black text-white">Generate With AI</h4>
                <form onSubmit={generateExam} className="mt-5 space-y-4">
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-400">Blueprint</span>
                    <select required value={generateForm.blueprintId} onChange={(event) => setGenerateForm({ ...generateForm, blueprintId: event.target.value })} className={selectCls}>
                      <option value="">Select blueprint...</option>
                      {blueprints.map((blueprint) => <option key={blueprint._id} value={blueprint._id}>{blueprint.title} · {blueprint.examFamily} {blueprint.level}</option>)}
                    </select>
                  </label>
                  <textarea value={generateForm.adminPrompt} onChange={(event) => setGenerateForm({ ...generateForm, adminPrompt: event.target.value })} rows={5} className={`${inputCls} h-auto py-3`} placeholder="Optional admin instructions for this mock..." />
                  <button disabled={saving} type="submit" className="w-full rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-blue-50 disabled:opacity-60">
                    <ButtonContent loading={saving}>Generate Mock Exam</ButtonContent>
                  </button>
                </form>
              </aside>
            </div>
          )}

          {isAdmin && tab === 'sessions' && (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_460px]">
              <section className={cardCls}>
                <h4 className="text-xl font-black text-white">Live Exam Monitor</h4>
                <div className="mt-5 grid gap-4">
                  {sessions.length === 0 ? <p className="rounded-2xl border border-white/10 bg-slate-950/35 p-6 text-center text-sm font-bold text-slate-400">No scheduled exam sessions yet.</p> : sessions.map((session) => (
                    <article key={session._id} className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusPill value={session.status} />
                            <span className="rounded-full bg-blue-500/10 px-3 py-1 text-[0.65rem] font-black uppercase tracking-widest text-blue-200">{session.examFamily} {session.level}</span>
                          </div>
                          <h5 className="mt-3 text-lg font-black text-white">{session.title}</h5>
                          <p className="mt-2 text-sm font-semibold text-slate-500">{session.studyLanguage?.name || 'Language'} · {formatDateTime(session.startsAt)} - {formatDateTime(session.endsAt)}</p>
                          <div className="mt-3 flex flex-wrap gap-2 text-[0.65rem] font-black uppercase tracking-widest text-slate-500">
                            <span className="rounded-full bg-white/[0.05] px-3 py-1">Access: {String(session.accessMode).replace(/_/g, ' ')}</span>
                            <span className="rounded-full bg-white/[0.05] px-3 py-1">{session.antiCheatEnabled ? 'Anti-cheat on' : 'Anti-cheat off'}</span>
                            <span className="rounded-full bg-white/[0.05] px-3 py-1">{session.noRetake ? 'No retake' : 'Retake allowed'}</span>
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-2">
                          {session.status === 'scheduled' && <button type="button" disabled={actionLoading === `launch-${session._id}`} onClick={() => sessionAction(session, 'launch')} className="rounded-2xl bg-emerald-500 px-4 py-3 text-xs font-black uppercase tracking-widest text-white hover:bg-emerald-400 disabled:opacity-60"><ButtonContent loading={actionLoading === `launch-${session._id}`}>Launch</ButtonContent></button>}
                          {session.status === 'open' && <button type="button" disabled={actionLoading === `close-${session._id}`} onClick={() => sessionAction(session, 'close')} className="rounded-2xl bg-amber-500 px-4 py-3 text-xs font-black uppercase tracking-widest text-white hover:bg-amber-400 disabled:opacity-60"><ButtonContent loading={actionLoading === `close-${session._id}`}>Close</ButtonContent></button>}
                          {session.status === 'closed' && <button type="button" disabled={actionLoading === `correction-${session._id}`} onClick={() => sessionAction(session, 'correction')} className="rounded-2xl bg-violet-500 px-4 py-3 text-xs font-black uppercase tracking-widest text-white hover:bg-violet-400 disabled:opacity-60"><ButtonContent loading={actionLoading === `correction-${session._id}`}>Run AI Correction</ButtonContent></button>}
                          {['closed', 'grading'].includes(session.status) && <button type="button" disabled={actionLoading === `release-${session._id}`} onClick={() => sessionAction(session, 'release')} className="rounded-2xl border border-blue-400/30 bg-blue-500/10 px-4 py-3 text-xs font-black uppercase tracking-widest text-blue-200 hover:bg-blue-500/20 disabled:opacity-60"><ButtonContent loading={actionLoading === `release-${session._id}`}>Release Results</ButtonContent></button>}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <aside className={`${cardCls} h-fit`}>
                <h4 className="text-xl font-black text-white">Schedule Session</h4>
                <form onSubmit={createSession} className="mt-5 space-y-4">
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-400">Approved mock exam</span>
                    <select required value={sessionForm.generatedExamId} onChange={(event) => setSessionForm({ ...sessionForm, generatedExamId: event.target.value })} className={selectCls}>
                      <option value="">Select approved mock...</option>
                      {approvedExams.map((exam) => <option key={exam._id} value={exam._id}>{exam.title} · {exam.examFamily} {exam.level}</option>)}
                    </select>
                  </label>
                  <input value={sessionForm.title} onChange={(event) => setSessionForm({ ...sessionForm, title: event.target.value })} className={inputCls} placeholder="Session title (optional)" />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-sm font-bold text-slate-400">Starts</span>
                      <input required type="datetime-local" value={sessionForm.startsAt} onChange={(event) => setSessionForm({ ...sessionForm, startsAt: event.target.value })} className={inputCls} />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-bold text-slate-400">Ends</span>
                      <input required type="datetime-local" value={sessionForm.endsAt} onChange={(event) => setSessionForm({ ...sessionForm, endsAt: event.target.value })} className={inputCls} />
                    </label>
                  </div>
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-400">Access mode</span>
                    <select value={sessionForm.accessMode} onChange={(event) => setSessionForm({ ...sessionForm, accessMode: event.target.value })} className={selectCls}>
                      <option value="language_level">Language and level</option>
                      <option value="language_all_levels">All levels for language</option>
                      <option value="selected_students">Selected students</option>
                    </select>
                  </label>
                  {sessionForm.accessMode === 'selected_students' && (
                    <select multiple value={sessionForm.eligibleStudents} onChange={(event) => setSessionForm({ ...sessionForm, eligibleStudents: Array.from(event.target.selectedOptions).map((option) => option.value) })} className={`${selectCls} h-32 py-3`}>
                      {students.map((student) => <option key={student._id} value={student._id}>{`${student.firstName || ''} ${student.lastName || ''}`.trim() || student.email}</option>)}
                    </select>
                  )}
                  <div className="grid gap-3">
                    <RuleToggle label="Strict section order" checked={sessionForm.strictSectionOrder} onChange={(value) => setSessionForm({ ...sessionForm, strictSectionOrder: value })} />
                    <RuleToggle label="No retake" checked={sessionForm.noRetake} onChange={(value) => setSessionForm({ ...sessionForm, noRetake: value })} />
                    <RuleToggle label="Auto-submit at close" checked={sessionForm.autoSubmitAtClose} onChange={(value) => setSessionForm({ ...sessionForm, autoSubmitAtClose: value })} />
                    <RuleToggle label="Anti-cheat enabled" checked={sessionForm.antiCheatEnabled} onChange={(value) => setSessionForm({ ...sessionForm, antiCheatEnabled: value })} />
                  </div>
                  <button disabled={saving} type="submit" className="w-full rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-blue-50 disabled:opacity-60">
                    <ButtonContent loading={saving}>Schedule Session</ButtonContent>
                  </button>
                </form>
              </aside>
            </div>
          )}

          {tab === 'available' && (
            <section className={cardCls}>
              <h4 className="text-xl font-black text-white">Available Exam Sessions</h4>
              <div className="mt-5 grid gap-4">
                {availableSessions.length === 0 ? <p className="rounded-2xl border border-white/10 bg-slate-950/35 p-6 text-center text-sm font-bold text-slate-400">No available exam sessions.</p> : availableSessions.map((session) => (
                  <article key={session._id} className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusPill value={session.status} />
                          <span className="rounded-full bg-blue-500/10 px-3 py-1 text-[0.65rem] font-black uppercase tracking-widest text-blue-200">{session.examFamily} {session.level}</span>
                        </div>
                        <h5 className="mt-3 text-lg font-black text-white">{session.title}</h5>
                        <p className="mt-2 text-sm font-semibold text-slate-500">{session.studyLanguage?.name || 'Language'} · {formatDateTime(session.startsAt)} - {formatDateTime(session.endsAt)}</p>
                        <div className="mt-3 flex flex-wrap gap-2 text-[0.65rem] font-black uppercase tracking-widest text-slate-500">
                          <span className="rounded-full bg-white/[0.05] px-3 py-1">{session.strictSectionOrder ? 'Locked order' : 'Flexible order'}</span>
                          <span className="rounded-full bg-white/[0.05] px-3 py-1">{session.autoSubmitAtClose ? 'Auto-submit' : 'Manual submit'}</span>
                          {session.attemptStatus && <span className="rounded-full bg-white/[0.05] px-3 py-1">Attempt: {session.attemptStatus}</span>}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => startSession(session)}
                        disabled={!session.canStart || actionLoading === `start-${session._id}`}
                        className="rounded-2xl bg-blue-600 px-4 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <ButtonContent loading={actionLoading === `start-${session._id}`}>
                          {session.canStart ? (session.attemptStatus === 'in_progress' ? 'Resume Exam' : 'Start Exam') : (session.attemptStatus === 'submitted' ? 'Submitted' : 'Waiting Room')}
                        </ButtonContent>
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

export function ExamBlueprintsScreen() {
  return <ManageExamSessions initialTab="blueprints" />;
}

export function AIMockGeneratorScreen() {
  return <ManageExamSessions initialTab="mocks" />;
}

export function GeneratedMockReviewScreen() {
  return <ManageExamSessions initialTab="mocks" />;
}

export function ExamSessionSchedulerScreen() {
  return <ManageExamSessions initialTab="sessions" />;
}

export function LiveExamMonitorScreen() {
  return <ManageExamSessions initialTab="sessions" />;
}

export function AICorrectionReviewScreen() {
  return <ManageExamSessions initialTab="sessions" />;
}

export function ResultsReleaseScreen() {
  return <ManageExamSessions initialTab="sessions" />;
}

export function StudentExamSessionsScreen() {
  return <ManageExamSessions initialTab="available" />;
}
