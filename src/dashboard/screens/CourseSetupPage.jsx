import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import { courseService } from '../../services/courseService';
import { studyLanguageService } from '../../services/studyLanguageService';
import EditChapterModal from './EditChapterModal';

const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001';
const COURSE_LEVELS = ['none', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

/* ─── Tiny helpers ─────────────────────────────────────── */

function FieldCard({ label, value, onEdit, editLabel = 'Edit', action, children }) {
  return (
    <div className="mb-4 overflow-hidden rounded-[8px] border border-white/10 bg-slate-900/50 shadow-xl">
      <div className="flex min-h-[58px] items-center justify-between gap-4 bg-white/[0.03] border-b border-white/5 px-5 py-3">
        <span className="text-[0.92rem] font-black text-white">{label}</span>
        {onEdit && (
          <button
            onClick={onEdit}
            className="flex items-center gap-2 border-none bg-transparent text-sm font-black text-slate-400 transition hover:text-blue-400 cursor-pointer"
          >
            <i className="fa-solid fa-pen text-xs" aria-hidden="true" /> {editLabel}
          </button>
        )}
        {action}
      </div>
      <div className="flex min-h-[62px] items-center px-5 py-4 text-[0.95rem] font-medium text-slate-200">
        {children || <span className="text-slate-500">{value || '—'}</span>}
      </div>
    </div>
  );
}

function ModalDialog({ open, title, onClose, onSave, saveLabel = 'Save', saving = false, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <div className="w-full max-w-lg overflow-hidden rounded-[12px] border border-white/10 bg-[#0d1526] shadow-2xl" onMouseDown={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-6 py-4">
          <h3 className="text-base font-black text-white">{title}</h3>
          <button onClick={onClose} className="cursor-pointer border-none bg-transparent text-2xl leading-none text-slate-500 hover:text-white transition-colors">×</button>
        </div>
        <div className="px-6 py-5 text-slate-300">{children}</div>
        <div className="flex justify-end gap-3 border-t border-white/10 bg-white/[0.03] px-6 py-4">
          <button onClick={onClose} className="cursor-pointer rounded-[8px] border border-white/10 bg-transparent px-5 py-2.5 text-sm font-bold text-slate-300 transition hover:bg-white/5">Cancel</button>
          <button
            onClick={onSave}
            disabled={saving}
            className="flex cursor-pointer items-center gap-2 rounded-[8px] border-none bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-500 disabled:opacity-60"
          >
            {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {saving ? 'Saving…' : saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionMarker({ icon, label }) {
  return (
    <div className="mb-5 mt-6 flex items-center gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-base text-blue-400">
        <i className={icon} aria-hidden="true" />
      </div>
      <span className="text-sm font-black text-white">{label}</span>
    </div>
  );
}

function CourseExamModal({
  open,
  exam,
  loading,
  saving,
  aiPrompt,
  setAiPrompt,
  onClose,
  onGenerate,
  onSave,
  onChange
}) {
  if (!open) return null;

  const draft = exam || {
    title: 'Final Course Exam',
    instructions: '',
    durationMinutes: 60,
    totalMarks: 100,
    mcqs: [],
    structuredQuestions: [],
    status: 'draft'
  };
  const computedMarks = (draft.mcqs || []).reduce((sum, question) => sum + Number(question.points || 0), 0)
    + (draft.structuredQuestions || []).reduce((sum, question) => sum + Number(question.points || 0), 0);

  const updateMcq = (index, patch) => {
    const mcqs = [...(draft.mcqs || [])];
    mcqs[index] = { ...mcqs[index], ...patch };
    onChange({ ...draft, mcqs });
  };

  const updateOption = (questionIndex, optionIndex, patch) => {
    const mcqs = [...(draft.mcqs || [])];
    const options = [...(mcqs[questionIndex]?.options || [])];
    options[optionIndex] = { ...options[optionIndex], ...patch };
    if (patch.isCorrect) {
      options.forEach((option, idx) => {
        option.isCorrect = idx === optionIndex;
      });
    }
    mcqs[questionIndex] = { ...mcqs[questionIndex], options };
    onChange({ ...draft, mcqs });
  };

  const updateStructured = (index, patch) => {
    const structuredQuestions = [...(draft.structuredQuestions || [])];
    structuredQuestions[index] = { ...structuredQuestions[index], ...patch };
    onChange({ ...draft, structuredQuestions });
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[14px] border border-white/10 bg-[#0d1526] shadow-2xl" onMouseDown={e => e.stopPropagation()}>
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-white/[0.03] px-6 py-4">
          <div>
            <h3 className="text-lg font-black text-white">Course Final Exam</h3>
            <p className="mt-1 text-xs font-semibold text-slate-500">Generate, revise, and manually edit the exam learners take after completing the course.</p>
          </div>
          <button onClick={onClose} className="cursor-pointer border-none bg-transparent text-2xl leading-none text-slate-500 hover:text-white transition-colors">×</button>
        </div>

        <div className="grid min-h-0 flex-1 gap-0 overflow-hidden lg:grid-cols-[1fr_320px]">
          <div className="min-h-0 overflow-y-auto p-6">
            {loading ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
                <span className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
                <h4 className="mt-5 text-lg font-black text-white">Generating exam...</h4>
                <p className="mt-2 max-w-md text-sm text-slate-400">AI is reading the full course, chapters, videos, resources, transcripts, and notions to prepare a balanced exam.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-[1fr_160px_160px_180px]">
                  <input
                    value={draft.title || ''}
                    onChange={e => onChange({ ...draft, title: e.target.value })}
                    className={INPUT}
                    placeholder="Exam title"
                  />
                  <input
                    type="number"
                    min="1"
                    value={draft.durationMinutes || 60}
                    onChange={e => onChange({ ...draft, durationMinutes: Number(e.target.value) })}
                    className={INPUT}
                    placeholder="Minutes"
                    title="Duration in minutes"
                  />
                  <input
                    type="number"
                    min="1"
                    value={draft.totalMarks || 100}
                    onChange={e => onChange({ ...draft, totalMarks: Number(e.target.value) })}
                    className={INPUT}
                    placeholder="Total marks"
                    title="Total marks"
                  />
                  <select
                    value={draft.status || 'draft'}
                    onChange={e => onChange({ ...draft, status: e.target.value })}
                    className={SELECT}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
                <textarea
                  value={draft.instructions || ''}
                  onChange={e => onChange({ ...draft, instructions: e.target.value })}
                  rows={3}
                  className={INPUT}
                  placeholder="Exam instructions..."
                />
                <div className={`rounded-xl border px-4 py-3 text-sm font-bold ${computedMarks === Number(draft.totalMarks || 0) ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300' : 'border-amber-500/20 bg-amber-500/10 text-amber-300'}`}>
                  Duration: {draft.durationMinutes || 60} minutes · Mark allocation: {computedMarks}/{draft.totalMarks || 100}
                </div>

                <section>
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-sm font-black uppercase tracking-wider text-blue-200">MCQ Questions</h4>
                    <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-black text-blue-300">{draft.mcqs?.length || 0}</span>
                  </div>
                  <div className="space-y-4">
                    {(draft.mcqs || []).map((question, qIndex) => (
                      <div key={question._id || qIndex} className="rounded-[10px] border border-white/10 bg-white/[0.03] p-4">
                        <label className="mb-2 block text-xs font-black text-slate-500">Question {qIndex + 1}</label>
                        <input
                          type="number"
                          min="0"
                          value={question.points ?? 2}
                          onChange={e => updateMcq(qIndex, { points: Number(e.target.value) })}
                          className={`${INPUT} mb-3 max-w-[160px]`}
                          placeholder="Points"
                        />
                        <textarea
                          value={question.questionText || ''}
                          onChange={e => updateMcq(qIndex, { questionText: e.target.value })}
                          rows={2}
                          className={INPUT}
                        />
                        <div className="mt-3 grid gap-2 md:grid-cols-2">
                          {(question.options || []).map((option, optionIndex) => (
                            <label key={option._id || optionIndex} className="flex items-center gap-2 rounded-[8px] border border-white/10 bg-black/20 px-3 py-2">
                              <input
                                type="radio"
                                name={`correct-${qIndex}`}
                                checked={!!option.isCorrect}
                                onChange={() => updateOption(qIndex, optionIndex, { isCorrect: true })}
                              />
                              <input
                                value={option.text || ''}
                                onChange={e => updateOption(qIndex, optionIndex, { text: e.target.value })}
                                className="min-w-0 flex-1 border-none bg-transparent text-sm text-white outline-none"
                                placeholder={`Option ${optionIndex + 1}`}
                              />
                            </label>
                          ))}
                        </div>
                        <input
                          value={question.explanation || ''}
                          onChange={e => updateMcq(qIndex, { explanation: e.target.value })}
                          className={`${INPUT} mt-3`}
                          placeholder="Explanation or marking note..."
                        />
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-sm font-black uppercase tracking-wider text-blue-200">Structured Questions</h4>
                    <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-black text-blue-300">{draft.structuredQuestions?.length || 0}</span>
                  </div>
                  <div className="space-y-4">
                    {(draft.structuredQuestions || []).map((question, index) => (
                      <div key={question._id || index} className="rounded-[10px] border border-white/10 bg-white/[0.03] p-4">
                        <label className="mb-2 block text-xs font-black text-slate-500">Structured Question {index + 1}</label>
                        <input
                          type="number"
                          min="0"
                          value={question.points ?? 10}
                          onChange={e => updateStructured(index, { points: Number(e.target.value) })}
                          className={`${INPUT} mb-3 max-w-[160px]`}
                          placeholder="Points"
                        />
                        <textarea value={question.prompt || ''} onChange={e => updateStructured(index, { prompt: e.target.value })} rows={2} className={INPUT} />
                        <textarea value={question.expectedAnswer || ''} onChange={e => updateStructured(index, { expectedAnswer: e.target.value })} rows={3} className={`${INPUT} mt-3`} placeholder="Expected answer..." />
                        <textarea value={question.gradingGuide || ''} onChange={e => updateStructured(index, { gradingGuide: e.target.value })} rows={2} className={`${INPUT} mt-3`} placeholder="Grading guide..." />
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}
          </div>

          <aside className="border-t border-white/10 bg-black/20 p-5 lg:border-l lg:border-t-0">
            <h4 className="text-sm font-black text-white">Ask AI to revise</h4>
            <p className="mt-2 text-xs leading-5 text-slate-500">Tell AI what to change, then generate again. You can still edit everything manually after.</p>
            <textarea
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              rows={8}
              className={`${INPUT} mt-4`}
              placeholder="Example: Make questions harder, add more oral expression questions, and reduce grammar questions..."
            />
            <button
              onClick={() => onGenerate(aiPrompt)}
              disabled={loading}
              className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-[8px] border-none bg-blue-600 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-500 disabled:opacity-60"
            >
              <i className="fa-solid fa-wand-magic-sparkles" /> {exam ? 'Revise with AI' : 'Generate Exam'}
            </button>
            <button
              onClick={onSave}
              disabled={saving || loading || !draft.mcqs?.length}
              className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-[8px] border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white transition hover:bg-white/10 disabled:opacity-60"
            >
              {saving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <i className="fa-solid fa-floppy-disk" />}
              Save Exam
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
}

const INPUT = 'w-full rounded-[8px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500/50 focus:bg-white/10';
const SELECT = 'w-full rounded-[8px] border border-white/10 bg-[#0d1526] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500/50 focus:bg-white/5';

function getChapterFree(index, plan) {
  if (plan === 'Free') return true;
  if (plan === 'Freemium' && index === 0) return true;
  return false;
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */
export default function CourseSetupPage({ course, onClose, onSave }) {

  /* ── Core course data ── */
  const buildImageUrl = (thumbnail) => {
    if (!thumbnail) return '';
    // Already a full URL or /assets/ path
    if (thumbnail.startsWith('http') || thumbnail.startsWith('/assets/') || thumbnail.startsWith('/course/images/')) {
      return thumbnail.startsWith('http') ? thumbnail : `${API_URL}${thumbnail}`;
    }
    // Backend stores course thumbnail filenames under /course/images/:courseId/:filename.
    return course?._id ? `${API_URL}/course/images/${course._id}/${thumbnail}` : `${API_URL}/${thumbnail}`;
  };

  const [courseData, setCourseData] = useState({
    _id: course?._id || null,
    title: course?.title || '',
    description: course?.description || '',
    price: course?.price ?? 0,
    category: course?.category || 'General',
    level: course?.level || 'none',
    plan: course?.plan || 'Premium',
    paymentType: course?.paymentType || 'full',
    status: course?.status || 'Draft',
    studyLanguage: course?.studyLanguage?._id || course?.studyLanguage || '',
    image: buildImageUrl(course?.thumbnail),
  });

  const [imageFile, setImageFile] = useState(null);

  /* ── Attachments ── */
  const [attachments, setAttachments] = useState(
    (course?.attachments || []).map((a, i) => ({ ...a, id: a.id ?? i, url: a.url || a.content }))
  );
  const [newAttachments, setNewAttachments] = useState([]);

  /* ── Chapters ── */
  const [chapters, setChapters] = useState(
    (course?.sections || [])
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map((s, i) => ({
        _id: s._id,
        title: s.title || '',
        description: s.description || '',
        published: s.published || false,
        free: getChapterFree(i, course?.plan || 'Premium'),
        videoUrl: s.videoUrl || null,
        videoName: s.videoName || '',
        resources: s.resources || [],
        order: s.order ?? i + 1,
      }))
  );

  /* ── Languages ── */
  const [languages, setLanguages] = useState([]);

  /* ── Edit dialogs ── */
  const [editDialog, setEditDialog] = useState(null); // null | 'title'|'description'|'image'|'category'|'plan'|'price'|'status'|'studyLanguage'|'attachment'|'chapter'
  const [editValue, setEditValue] = useState('');

  /* ── Chapter-level ── */
  const [chapterMenuOpen, setChapterMenuOpen] = useState(null); // chapter object
  const [editChapter, setEditChapter] = useState(null);
  const [isSavingChapter, setIsSavingChapter] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [newChapterDesc, setNewChapterDesc] = useState('');

  /* ── Attachment dialog ── */
  const [attFile, setAttFile] = useState(null);
  const [attName, setAttName] = useState('');
  const [editingAttachment, setEditingAttachment] = useState(null);
  const [attTranscript, setAttTranscript] = useState('');

  /* ── Save ── */
  const [isSaving, setIsSaving] = useState(false);

  /* ── Final exam ── */
  const [courseExam, setCourseExam] = useState(null);
  const [examModalOpen, setExamModalOpen] = useState(false);
  const [isLoadingExam, setIsLoadingExam] = useState(false);
  const [isSavingExam, setIsSavingExam] = useState(false);
  const [examAiPrompt, setExamAiPrompt] = useState('');

  /* ── Drag ── */
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const dragFrom = useRef(null);
  const dragTitle = useRef(null);

  /* ── Refs ── */
  const imgRef = useRef(null);
  const attFileRef = useRef(null);

  /* ── Complete progress ── */
  const fields = {
    title: !!courseData.title.trim(),
    description: !!courseData.description.trim(),
    image: !!courseData.image,
    category: !!courseData.category,
    level: !!courseData.level,
    plan: !!courseData.plan,
    paymentType: !!courseData.paymentType,
  };
  const completed = Object.values(fields).filter(Boolean).length;
  const total = Object.keys(fields).length;

  useEffect(() => {
    studyLanguageService.getLanguages(true)
      .then(d => setLanguages(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!courseData._id) return;
    courseService.getCourseExam(courseData._id)
      .then(data => setCourseExam(data.exam || null))
      .catch(() => {});
  }, [courseData._id]);

  /* plan sync to chapters */
  useEffect(() => {
    if (courseData.plan === 'Premium') {
      setChapters(prev => prev.map(c => c.free ? { ...c, free: false } : c));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseData.plan]);

  /* ── Open dialog helpers ── */
  const openEdit = (field, val = '') => {
    setEditDialog(field);
    setEditValue(val !== undefined ? val : '');
  };
  const closeEdit = () => setEditDialog(null);

  /* ── Save field ── */
  const saveField = (field, value) => {
    if (field === 'price') {
      const v = parseFloat(value) || 0;
      if (courseData.plan === 'Free' && v !== 0) { toast.error('Free courses must have a price of 0.'); return; }
      setCourseData(p => ({ ...p, price: v }));
    } else if (field === 'plan') {
      setCourseData(p => ({ ...p, plan: value, price: value === 'Free' ? 0 : p.price }));
      setChapters(prev => prev.map((c, i) => ({ ...c, free: getChapterFree(i, value) })));
      toast.success(`Course type changed to ${value}.`);
    } else if (field === 'status') {
      const previousStatus = courseData.status;
      const archivedAt = value === 'Archived' ? new Date().toISOString() : null;
      setCourseData(p => ({ ...p, status: value }));
      if (courseData._id) {
        courseService.updateCourseStatus(courseData._id, { status: value, archivedAt })
          .then(() => toast.success(`Course status updated: ${value}`))
          .catch((err) => {
            setCourseData(p => ({ ...p, status: previousStatus }));
            toast.error(err?.response?.data?.message || 'Unable to update the status.');
          });
      }
    } else {
      setCourseData(p => ({ ...p, [field]: value }));
    }
    closeEdit();
  };

  /* ── Image ── */
  const handleImageChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { toast.error('Image must be 5 MB or smaller.'); return; }
    setImageFile(f);
    const reader = new FileReader();
    reader.onload = ev => setCourseData(p => ({ ...p, image: ev.target.result }));
    reader.readAsDataURL(f);
    closeEdit();
    toast.success('Image updated.');
  };

  /* ── Publish toggle ── */
  const handlePublish = async () => {
    if (!courseData._id) { toast.error('Save the course before publishing it.'); return; }
    const next = courseData.status === 'Published' ? 'Draft' : 'Published';
    const archivedAt = next === 'Archived' ? new Date().toISOString() : null;
    try {
      await courseService.updateCourseStatus(courseData._id, { status: next, archivedAt });
      setCourseData(p => ({ ...p, status: next }));
      toast.success(`Course ${next === 'Published' ? 'published' : 'unpublished'}.`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Unable to update the status.');
    }
  };

  /* ── Chapters ── */
  const handleAddChapter = async () => {
    if (!newChapterTitle.trim()) { toast.error('Chapter title is required.'); return; }
    if (!courseData._id) { toast.error('Save the course before adding chapters.'); return; }
    setIsSavingChapter(true);
    try {
      const saved = await courseService.createSection(courseData._id, {
        title: newChapterTitle.trim(),
        description: newChapterDesc.trim(),
        isLocked: !getChapterFree(chapters.length, courseData.plan),
        isPreviewable: getChapterFree(chapters.length, courseData.plan),
        order: chapters.length + 1,
      });
      setChapters(prev => [...prev, {
        _id: saved._id, title: saved.title, description: saved.description || '',
        published: false, free: getChapterFree(prev.length, courseData.plan),
        videoUrl: null, videoName: '', resources: [], order: saved.order || prev.length + 1,
      }]);
      toast.success(`Chapter "${saved.title}" added.`);
      setNewChapterTitle(''); setNewChapterDesc('');
      closeEdit();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to create the chapter.');
    } finally {
      setIsSavingChapter(false);
    }
  };

  const handleTogglePublish = async (ch) => {
    const next = !ch.published;
    try {
      await courseService.publishSection(ch._id, next);
      setChapters(prev => prev.map(c => c._id === ch._id ? { ...c, published: next } : c));
      toast.success(`Chapter ${next ? 'published' : 'unpublished'}.`);
    } catch { toast.error('Unable to update the chapter.'); }
    setChapterMenuOpen(null);
  };

  const handleToggleFree = async (ch) => {
    if (courseData.plan === 'Free') { toast.error('All chapters are free in a Free course.'); setChapterMenuOpen(null); return; }
    if (courseData.plan === 'Premium') { toast.error('All chapters are paid in a Premium course.'); setChapterMenuOpen(null); return; }
    if (courseData.plan === 'Freemium' && ch._id === chapters[0]._id) { toast.error('The first chapter must remain free.'); setChapterMenuOpen(null); return; }
    const next = !ch.free;
    try {
      await courseService.updateSection(ch._id, { isLocked: !next, isPreviewable: next });
      setChapters(prev => prev.map(c => c._id === ch._id ? { ...c, free: next } : c));
      toast.success(`Chapter marked as ${next ? 'free' : 'paid'}.`);
    } catch { toast.error('Unable to update the chapter.'); }
    setChapterMenuOpen(null);
  };

  const handleDeleteChapter = async (ch) => {
    try {
      await courseService.deleteSection(ch._id);
      setChapters(prev => {
        const updated = prev.filter(c => c._id !== ch._id);
        if (courseData.plan === 'Freemium' && updated.length > 0) updated[0].free = true;
        return updated;
      });
      toast.success(`Chapter "${ch.title}" deleted.`);
    } catch { toast.error('Unable to delete the chapter.'); }
    setChapterMenuOpen(null);
  };

  /* ── Drag ── */
  const reorderChapters = (fromIndex, toIndex) => {
    if (fromIndex === null || toIndex === null || fromIndex === toIndex) return chapters;
    const reordered = [...chapters];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    return courseData.plan === 'Freemium'
      ? reordered.map((chapter, index) => ({ ...chapter, free: index === 0 }))
      : reordered;
  };

  const persistChapterOrder = async (orderedChapters) => {
    const reordered = orderedChapters.map((chapter, index) => ({ ...chapter, order: index + 1 }));
    for (const chapter of reordered) await courseService.updateSection(chapter._id, { order: chapter.order });
    setChapters(reordered);
  };

  const handleDragStart = (i) => { dragFrom.current = i; dragTitle.current = chapters[i].title; setDragOverIndex(i); };
  const handleDragEnter = (i) => {
    if (dragFrom.current === null) return;
    setDragOverIndex(i);
  };
  const handleDropChapter = async (i) => {
    if (dragFrom.current === null || dragFrom.current === i) {
      setDragOverIndex(null);
      return;
    }
    const nextChapters = reorderChapters(dragFrom.current, i);
    const movedTitle = dragTitle.current;
    setChapters(nextChapters);
    dragFrom.current = null;
    dragTitle.current = null;
    setDragOverIndex(null);
    if (movedTitle) toast.info(`"${movedTitle}" reordered.`);
    try {
      await persistChapterOrder(nextChapters);
    } catch { toast.error('Unable to update chapter order.'); }
  };
  const handleDragEnd = () => {
    dragFrom.current = null; dragTitle.current = null; setDragOverIndex(null);
  };

  /* ── Attachments ── */
  const handleAddFile = () => {
    if (!attFile) { toast.error('Select a file.'); return; }
    if (attFile.size > 10 * 1024 * 1024) { toast.error('File must be 10 MB or smaller.'); return; }
    const type = attFile.type.includes('image') ? 'image' : attFile.type.includes('video') ? 'video' : 'document';
    const att = { id: `new_${Date.now()}`, name: attName.trim() || attFile.name, type, file: attFile, size: attFile.size, transcript: type === 'video' ? attTranscript : undefined };
    setNewAttachments(prev => [...prev, att]);
    toast.success(`"${att.name}" added.`);
    setAttFile(null); setAttName(''); setAttTranscript('');
    closeEdit();
  };

  const handleSaveAttachmentEdit = () => {
    if (!editingAttachment) return;
    setAttachments(prev => prev.map(a => a.id === editingAttachment.id ? { ...a, transcript: attTranscript } : a));
    toast.success('Transcript updated.');
    setEditingAttachment(null); setAttTranscript(''); closeEdit();
  };

  const handleDeleteFile = (id) => {
    const isNew = typeof id === 'string' && id.startsWith('new_');
    if (isNew) setNewAttachments(prev => prev.filter(a => a.id !== id));
    else setAttachments(prev => prev.filter(a => a.id !== id));
  };

  /* ── Save ── */
  const handleSave = async () => {
    if (!courseData.title.trim()) { toast.error('Course title is required.'); return; }
    setIsSaving(true);
    try {
      const fd = new FormData();
      fd.append('_id', courseData._id);
      fd.append('title', courseData.title);
      fd.append('description', courseData.description);
      fd.append('price', courseData.price);
      fd.append('category', courseData.category);
      fd.append('level', courseData.level || 'none');
      fd.append('plan', courseData.plan);
      fd.append('paymentType', courseData.paymentType);
      fd.append('status', courseData.status);
      fd.append('archivedAt', courseData.status === 'Archived' ? new Date().toISOString() : '');
      if (courseData.studyLanguage) fd.append('studyLanguage', courseData.studyLanguage);
      // Send existing attachment metadata (without file objects)
      const attachmentsToSend = attachments.map(a => ({
        id: a.id, name: a.name, type: a.type, size: a.size || 0,
        thumbnailName: a.thumbnailName || '', url: a.url || '',
      }));
      fd.append('attachments', JSON.stringify(attachmentsToSend));
      // Send chapter IDs for section ordering
      fd.append('chapters', JSON.stringify(chapters.map((c, i) => ({ _id: c._id, order: i + 1 }))));
      if (imageFile) fd.append('thumbnail', imageFile);
      newAttachments.forEach(a => fd.append('newAttachments', a.file, a.name));
      await onSave(fd);
    } catch (err) {
      console.error('Save error:', err);
      toast.error(err?.response?.data?.message || 'Unable to save the course.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateExam = async (revisionPrompt = '') => {
    if (!courseData._id) {
      toast.error('Save the course before generating an exam.');
      return;
    }

    setIsLoadingExam(true);
    try {
      const response = await courseService.generateCourseExam({
        courseId: courseData._id,
        lang: localStorage.getItem('i18nextLng') || 'en',
        revisionPrompt,
        existingExam: courseExam
      });
      setCourseExam(response.exam);
      setExamAiPrompt('');
      toast.success('Course exam generated.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to generate the exam.');
    } finally {
      setIsLoadingExam(false);
    }
  };

  const handleSaveExam = async () => {
    if (!courseData._id || !courseExam) return;
    setIsSavingExam(true);
    try {
      const response = await courseService.updateCourseExam(courseData._id, courseExam);
      setCourseExam(response.exam);
      toast.success('Course exam saved.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to save the exam.');
    } finally {
      setIsSavingExam(false);
    }
  };

  const handleToggleExamPublish = async () => {
    if (!courseData._id || !courseExam) return;
    const nextStatus = courseExam.status === 'published' ? 'draft' : 'published';
    setIsLoadingExam(true);
    try {
      const updated = { ...courseExam, status: nextStatus };
      const response = await courseService.updateCourseExam(courseData._id, updated);
      setCourseExam(response.exam);
      toast.success(`Exam ${nextStatus === 'published' ? 'published' : 'unpublished'}.`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to update the exam status.');
    } finally {
      setIsLoadingExam(false);
    }
  };

  const formatSize = (b) => b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`;
  const allAttachments = [...attachments, ...newAttachments];
  const langName = languages.find(l => l._id === courseData.studyLanguage)?.name || '—';
  const fileIcon = (type) => type === 'image' ? 'fa-regular fa-image' : type === 'video' ? 'fa-solid fa-film' : 'fa-regular fa-file-lines';
  const paymentLabel = courseData.paymentType === 'per_chapter' ? 'Per Chapter Payment' : 'Full Payment';

  /* ════════════════ RENDER ════════════════ */
  return (
    <div
      className="-m-6 min-h-screen bg-[#0f172a] px-5 py-6 text-slate-300 lg:px-8"
      style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
    >
      {/* ── Top bar ── */}
      <div className="mb-9 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex items-center gap-3 border-none bg-transparent text-base font-black text-slate-400 transition hover:text-white cursor-pointer"
          >
            <i className="fa-solid fa-arrow-left text-lg" aria-hidden="true" /> Back to course setup
          </button>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex h-10 items-center rounded-[8px] border px-3 text-xs font-black uppercase tracking-[0.14em] ${courseData.status === 'Published' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' : courseData.status === 'Archived' ? 'border-amber-500/20 bg-amber-500/10 text-amber-400' : 'border-white/10 bg-white/5 text-slate-400'}`}>
            {courseData.status}
          </span>
          <button
            onClick={handlePublish}
            className={`h-10 rounded-[4px] border-none px-4 text-sm font-black text-white shadow-[0_3px_8px_rgba(15,23,42,0.16)] transition ${courseData.status === 'Published' ? 'bg-[#b72b25] hover:bg-[#9f241f]' : 'bg-[#4d83ee] hover:bg-[#356de0]'}`}
          >
            {courseData.status === 'Published' ? 'Unpublish' : 'Publish'}
          </button>
        </div>
      </div>

      {/* ── Page title ── */}
      <div className="mb-8">
        <h2 className="text-xl font-black text-white">Course creation</h2>
        <p className="mt-1 text-sm font-medium text-slate-400">Complete all fields ({completed}/{total})</p>
      </div>

      {/* ── Two-column layout ── */}
      <div className="grid gap-8 xl:grid-cols-2">

        {/* ══ LEFT COLUMN ══ */}
        <div>
          {/* Section header */}
          <SectionMarker icon="fa-solid fa-border-all" label="Customize your course" />

          {/* TITLE */}
          <FieldCard label="Course Title" onEdit={() => openEdit('title', courseData.title)} editLabel="Edit title">
            <span>{courseData.title || <span className="text-slate-400">Not set</span>}</span>
          </FieldCard>

          {/* DESCRIPTION */}
          <FieldCard label="Course Description" onEdit={() => openEdit('description', courseData.description)} editLabel="Edit description">
            <span className="line-clamp-3 whitespace-pre-wrap">{courseData.description || <span className="text-slate-400">Not set</span>}</span>
          </FieldCard>

          {/* IMAGE */}
          <FieldCard label="Course Image" onEdit={() => imgRef.current?.click()} editLabel="Edit image">
            <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            {courseData.image ? (
              <img src={courseData.image} alt="Course thumbnail" className="h-56 w-full rounded-[8px] object-cover md:h-64" />
            ) : (
              <div className="flex h-16 w-full items-center text-slate-500">
                Course thumbnail
              </div>
            )}
          </FieldCard>

          {/* CATEGORY */}
          <FieldCard label="Course Category" onEdit={() => openEdit('category', courseData.category)} editLabel="Edit category">
            <span>{courseData.category || '—'}</span>
          </FieldCard>

          <FieldCard label="Course Level" onEdit={() => openEdit('level', courseData.level)} editLabel="Edit level">
            <span>{courseData.level && courseData.level !== 'none' ? courseData.level : 'No level gate'}</span>
          </FieldCard>

          {/* PLAN */}
          <FieldCard label="Course Type" onEdit={() => openEdit('plan', courseData.plan)} editLabel="Edit course type">
            <span>{courseData.plan === 'Free' ? 'Free' : courseData.plan}</span>
          </FieldCard>

          <FieldCard label="Payment Type" onEdit={() => openEdit('paymentType', courseData.paymentType)} editLabel="Edit payment type">
            <span>{paymentLabel}</span>
          </FieldCard>
        </div>

        {/* ══ RIGHT COLUMN ══ */}
        <div>
          {/* Section: Chapters */}
          <SectionMarker icon="fa-solid fa-list" label="Course Chapters" />

          <div className="mb-5 overflow-visible rounded-[8px] border border-white/10 bg-slate-900/50 shadow-xl">
            <div className="flex min-h-[58px] items-center justify-between gap-4 bg-white/[0.03] border-b border-white/5 px-5 py-3">
              <span className="text-[0.92rem] font-black text-white">Course Chapters</span>
              <button
                onClick={() => openEdit('chapter')}
                className="flex items-center gap-2 border-none bg-transparent text-sm font-black text-blue-400 transition hover:text-blue-300 cursor-pointer"
              >
                <i className="fa-solid fa-plus" aria-hidden="true" /> Add a chapter
              </button>
            </div>

            <div className="divide-y divide-white/10">
              {chapters.length === 0 ? (
                <div className="px-5 py-7 text-center text-sm font-medium text-slate-500">
                  No chapters yet. Click "Add a chapter".
                </div>
              ) : (
                chapters.map((ch, i) => (
                  <div
                    key={ch._id}
                    draggable
                    onDragStart={() => handleDragStart(i)}
                    onDragEnter={() => handleDragEnter(i)}
                    onDrop={() => handleDropChapter(i)}
                    onDragEnd={handleDragEnd}
                    onDragOver={e => e.preventDefault()}
                    className={`flex min-h-[58px] cursor-grab items-center gap-4 px-5 py-3 transition active:cursor-grabbing ${dragOverIndex === i ? 'bg-blue-600/10 ring-2 ring-inset ring-blue-500/50' : i % 2 === 0 ? 'bg-white/[0.02]' : 'bg-transparent'}`}
                  >
                    <i className="fa-solid fa-grip-vertical shrink-0 text-sm text-slate-500" aria-hidden="true" />
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-sm text-blue-400">
                      <i className="fa-solid fa-list" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-grow">
                      <span className="block truncate text-sm font-semibold text-white">{ch.title}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-0">
                      {ch.free && (
                        <span className="rounded-full bg-[#24438f] px-3 py-1 text-xs font-black text-white">Free</span>
                      )}
                      <span className={`rounded-full px-3 py-1 text-xs font-black text-white ${ch.published ? 'bg-[#4d83ee]' : 'bg-slate-400'}`}>
                        {ch.published ? 'Published' : 'Draft'}
                      </span>
                      <div className="relative ml-3">
                        <button
                          onClick={() => setChapterMenuOpen(chapterMenuOpen?._id === ch._id ? null : ch)}
                          className="flex h-8 w-8 items-center justify-center border-none bg-transparent text-slate-400 transition hover:text-white cursor-pointer"
                        ><i className="fa-solid fa-caret-down" aria-hidden="true" /></button>
                        {chapterMenuOpen?._id === ch._id && (
                          <div
                            className="absolute right-0 top-full z-50 mt-2 min-w-[190px] overflow-hidden rounded-[8px] border border-white/10 bg-[#0d1526] shadow-xl"
                            onMouseLeave={() => setChapterMenuOpen(null)}
                          >
                            {[
                              { label: 'Edit', icon: 'fa-solid fa-pen', action: () => { setEditChapter(ch); setChapterMenuOpen(null); } },
                              { label: ch.published ? 'Unpublish' : 'Publish', icon: ch.published ? 'fa-solid fa-eye-slash' : 'fa-solid fa-bullhorn', action: () => handleTogglePublish(ch) },
                              { label: ch.free ? 'Make paid' : 'Make free', icon: ch.free ? 'fa-solid fa-lock' : 'fa-solid fa-unlock', action: () => handleToggleFree(ch) },
                              { label: 'Delete', icon: 'fa-solid fa-trash', action: () => handleDeleteChapter(ch), danger: true },
                            ].map(item => (
                              <button
                                key={item.label}
                                onClick={item.action}
                                className={`w-full cursor-pointer border-none bg-transparent px-4 py-3 text-left text-sm font-bold transition ${item.danger ? 'text-red-400 hover:bg-red-500/10' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
                              >
                                <i className={`${item.icon} mr-2 w-4`} aria-hidden="true" /> {item.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="border-t border-white/10 bg-white/[0.01] px-5 py-5 text-center text-sm font-medium text-slate-500">
              Drag and drop to reorder chapters
            </div>
          </div>

          {/* Section: Pricing */}
          <SectionMarker icon="fa-solid fa-dollar-sign" label="Sell your course" />

          <FieldCard
            label="Course Price"
            onEdit={courseData.plan !== 'Free' ? () => openEdit('price', courseData.price) : null}
            editLabel="Edit price"
          >
            <span>
              {courseData.plan === 'Free' ? 'Free' : `${courseData.price} XAF`}
            </span>
          </FieldCard>

          {/* Section: Attachments */}
          <SectionMarker icon="fa-solid fa-file" label="Resources & Attachments" />

          <div className="mb-4 overflow-hidden rounded-[4px] border border-slate-200/80 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
            <div className="flex min-h-[58px] items-center justify-between gap-4 bg-slate-50 px-5 py-3">
              <span className="text-[0.92rem] font-black text-[#24438f]">Course Attachments</span>
              <button
                onClick={() => { setEditingAttachment(null); setAttFile(null); setAttName(''); setAttTranscript(''); setEditDialog('attachment'); }}
                className="flex items-center gap-2 border-none bg-transparent text-sm font-black text-[#4d83ee] transition hover:text-[#356de0]"
              >
                <i className="fa-solid fa-plus" aria-hidden="true" /> Add a file
              </button>
            </div>
            <div className="divide-y divide-slate-100 bg-white">
              {allAttachments.length === 0 ? (
                <div className="px-5 py-7 text-center text-sm font-medium text-slate-500">
                  No attachments yet. Add files to your course.
                </div>
              ) : allAttachments.map(att => (
                <div key={att.id} className="flex min-h-[70px] items-center gap-4 px-5 py-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[5px] bg-[#dbeafe] text-lg text-[#4d83ee]">
                    <i className={fileIcon(att.type)} aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-grow">
                    {att.type === 'document' ? (
                      <a
                        href={att.url || (att.file ? URL.createObjectURL(att.file) : '#')}
                        download={att.name}
                        className="block truncate text-sm font-black text-slate-800 no-underline transition hover:text-[#24438f]"
                      >{att.name}</a>
                    ) : (
                      <div className="truncate text-sm font-black text-slate-800">{att.name}</div>
                    )}
                    <div className="mt-1 text-xs font-medium text-slate-500">
                      {att.size ? formatSize(att.size) : ''}
                      {att.type === 'video' && att.transcript ? ' · Transcript available' : ''}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    {att.type === 'video' && (
                      <button
                        onClick={() => { setEditingAttachment(att); setAttTranscript(att.transcript || ''); setEditDialog('attachment'); }}
                        className="border-none bg-transparent text-base text-[#4d83ee] transition hover:text-[#24438f]"
                        title="Edit transcript"
                      ><i className="fa-solid fa-eye" aria-hidden="true" /></button>
                    )}
                    <button
                      onClick={() => handleDeleteFile(att.id)}
                      className="border-none bg-transparent text-lg text-red-500 transition hover:text-red-700"
                      title="Delete"
                    ><i className="fa-solid fa-xmark" aria-hidden="true" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <FieldCard label="Study Language" onEdit={() => openEdit('studyLanguage', courseData.studyLanguage)} editLabel="Edit language">
            <span>{langName}</span>
          </FieldCard>

          <FieldCard
            label="Final Course Exam"
            action={
              <div className="flex items-center gap-3">
                {courseExam && (
                  <button
                    onClick={handleToggleExamPublish}
                    disabled={isLoadingExam}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-black uppercase tracking-wider transition cursor-pointer ${
                      courseExam.status === 'published'
                        ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                        : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    <i className={`fa-solid ${courseExam.status === 'published' ? 'fa-eye-slash' : 'fa-bullhorn'}`} />
                    {courseExam.status === 'published' ? 'Unpublish' : 'Publish'}
                  </button>
                )}
                <button
                  onClick={() => {
                    setExamModalOpen(true);
                    if (!courseExam) handleGenerateExam('');
                  }}
                  className="flex items-center gap-2 border-none bg-transparent text-sm font-black text-blue-400 transition hover:text-blue-300 cursor-pointer"
                >
                  <i className="fa-solid fa-wand-magic-sparkles text-xs" aria-hidden="true" />
                  {courseExam ? 'Manage exam' : 'Generate exam'}
                </button>
              </div>
            }
          >
            <div className="flex w-full flex-wrap items-center justify-between gap-3">
              <div>
                <span className="block text-sm font-black text-white">{courseExam?.title || 'No final exam generated yet'}</span>
                <span className="mt-1 block text-xs font-semibold text-slate-500">
                  {courseExam
                    ? `${courseExam.mcqs?.length || 0} MCQs · ${courseExam.structuredQuestions?.length || 0} structured questions · ${courseExam.status || 'draft'}`
                    : 'AI can build MCQ and structured questions from all chapters, videos, notions, resources, and transcripts.'}
                </span>
              </div>
              {isLoadingExam && <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />}
            </div>
          </FieldCard>
        </div>
      </div>

      {/* ── Bottom action bar ── */}
      <div className="mt-10 flex justify-end gap-3 border-t border-slate-200 pt-7">
        <button onClick={onClose} className="cursor-pointer rounded-[4px] border border-slate-300 bg-white px-6 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-100">
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex cursor-pointer items-center gap-2 rounded-[4px] border-none bg-[#24438f] px-6 py-3 text-sm font-black text-white transition hover:bg-[#1b3471] disabled:opacity-60"
        >
          {isSaving ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Saving…</> : <><i className="fa-solid fa-floppy-disk" aria-hidden="true" /> Save changes</>}
        </button>
      </div>

      {/* ══ DIALOGS ══ */}

      {/* Title */}
      <ModalDialog open={editDialog === 'title'} title="Edit title" onClose={closeEdit} onSave={() => saveField('title', editValue)}>
        <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} className={INPUT} placeholder="Course title..." onKeyDown={e => e.key === 'Enter' && saveField('title', editValue)} />
      </ModalDialog>

      {/* Description */}
      <ModalDialog open={editDialog === 'description'} title="Edit description" onClose={closeEdit} onSave={() => saveField('description', editValue)}>
        <textarea autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} rows={7} className={INPUT} placeholder="Describe the content, objectives, and target audience..." />
      </ModalDialog>

      {/* Category */}
      <ModalDialog open={editDialog === 'category'} title="Edit category" onClose={closeEdit} onSave={() => saveField('category', editValue)}>
        <select value={editValue} onChange={e => setEditValue(e.target.value)} className={SELECT}>
          {['General','German','English','French','Spanish','Italian','Chinese','Japanese','Exam preparation','Conversation','Grammar','Vocabulary'].map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </ModalDialog>

      {/* Level */}
      <ModalDialog open={editDialog === 'level'} title="Course level" onClose={closeEdit} onSave={() => saveField('level', editValue)}>
        <select value={editValue} onChange={e => setEditValue(e.target.value)} className={SELECT}>
          {COURSE_LEVELS.map(level => (
            <option key={level} value={level}>{level === 'none' ? 'No level gate' : level}</option>
          ))}
        </select>
      </ModalDialog>

      {/* Study Language */}
      <ModalDialog open={editDialog === 'studyLanguage'} title="Study language" onClose={closeEdit} onSave={() => saveField('studyLanguage', editValue)}>
        <select value={editValue} onChange={e => setEditValue(e.target.value)} className={SELECT}>
          <option value="">Select a language...</option>
          {languages.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
        </select>
      </ModalDialog>

      {/* Plan */}
      <ModalDialog open={editDialog === 'plan'} title="Course type" onClose={closeEdit} onSave={() => saveField('plan', editValue)}>
        <select value={editValue} onChange={e => setEditValue(e.target.value)} className={SELECT}>
          <option value="Free">Free - fully free</option>
          <option value="Freemium">Freemium - first chapter free, remaining chapters paid</option>
          <option value="Premium">Premium - fully paid</option>
        </select>
      </ModalDialog>

      {/* Payment Type */}
      <ModalDialog open={editDialog === 'paymentType'} title="Payment type" onClose={closeEdit} onSave={() => saveField('paymentType', editValue)}>
        <select value={editValue} onChange={e => setEditValue(e.target.value)} className={SELECT}>
          <option value="full">Full Payment</option>
          <option value="per_chapter">Per Chapter Payment</option>
        </select>
      </ModalDialog>

      {/* Status */}
      <ModalDialog open={editDialog === 'status'} title="Course status" onClose={closeEdit} onSave={() => saveField('status', editValue)}>
        <select value={editValue} onChange={e => setEditValue(e.target.value)} className={SELECT}>
          <option value="Draft">Draft</option>
          <option value="Published">Published</option>
          <option value="Archived">Archived</option>
        </select>
      </ModalDialog>

      {/* Price */}
      <ModalDialog open={editDialog === 'price'} title="Course price" onClose={closeEdit} onSave={() => saveField('price', editValue)}>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">XAF</span>
          <input
            type="number" min="0" step="0.01"
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            className={INPUT + ' pl-14'}
            disabled={courseData.plan === 'Free'}
          />
        </div>
        {courseData.plan === 'Freemium' && (
          <p className="mt-2 text-xs text-slate-500">Price for complete course access.</p>
        )}
      </ModalDialog>

      {/* Add chapter */}
      <ModalDialog
        open={editDialog === 'chapter'}
        title="Add a chapter"
        onClose={() => { setNewChapterTitle(''); setNewChapterDesc(''); closeEdit(); }}
        onSave={handleAddChapter}
        saveLabel="Add"
        saving={isSavingChapter}
      >
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Title</label>
            <input
              autoFocus
              type="text"
              value={newChapterTitle}
              onChange={e => setNewChapterTitle(e.target.value)}
              placeholder="Chapter title..."
              className={INPUT}
              onKeyDown={e => e.key === 'Enter' && handleAddChapter()}
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Description (optional)</label>
            <textarea
              value={newChapterDesc}
              onChange={e => setNewChapterDesc(e.target.value)}
              rows={4}
              className={INPUT}
              placeholder="Chapter description..."
            />
          </div>
        </div>
      </ModalDialog>

      {/* Attachment */}
      <ModalDialog
        open={editDialog === 'attachment'}
        title={editingAttachment ? 'Edit transcript' : 'Add a file'}
        onClose={() => { setEditingAttachment(null); setAttFile(null); setAttName(''); setAttTranscript(''); closeEdit(); }}
        onSave={editingAttachment ? handleSaveAttachmentEdit : handleAddFile}
        saveLabel={editingAttachment ? 'Save' : 'Add'}
      >
        {!editingAttachment && (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Select a file</label>
              <input
                ref={attFileRef}
                type="file"
                accept=".pdf,.doc,.docx,.mp4,.jpg,.jpeg,.png"
                onChange={e => { const f = e.target.files[0]; if (f) { setAttFile(f); if (!attName) setAttName(f.name); } }}
                className="block w-full cursor-pointer text-sm text-slate-500 file:mr-3 file:rounded-[4px] file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:font-bold file:text-[#4d83ee]"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">File name (optional)</label>
              <input
                type="text"
                value={attName}
                onChange={e => setAttName(e.target.value)}
                placeholder="Leave blank to use the original name"
                className={INPUT}
              />
            </div>
          </div>
        )}
        {(attFile?.type.includes('video') || editingAttachment?.type === 'video') && (
          <div className="mt-4 space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Video transcript (optional)</label>
            <textarea
              value={attTranscript}
              onChange={e => setAttTranscript(e.target.value)}
              rows={4}
              className={INPUT}
              placeholder="Enter the video transcript..."
            />
          </div>
        )}
      </ModalDialog>

      {/* Edit chapter modal */}
      {editChapter && (
        <EditChapterModal
          open={true}
          chapter={editChapter}
          courseId={courseData._id}
          onClose={() => setEditChapter(null)}
          onChapterUpdated={(updatedChapter) => {
            setChapters(prev => prev.map(ch => ch._id === updatedChapter._id ? {
              ...ch,
              ...updatedChapter,
              free: updatedChapter.isPreviewable ?? ch.free,
              published: updatedChapter.published ?? ch.published,
              resources: updatedChapter.resources || ch.resources,
            } : ch));
          }}
        />
      )}

      <CourseExamModal
        open={examModalOpen}
        exam={courseExam}
        loading={isLoadingExam}
        saving={isSavingExam}
        aiPrompt={examAiPrompt}
        setAiPrompt={setExamAiPrompt}
        onClose={() => setExamModalOpen(false)}
        onGenerate={handleGenerateExam}
        onSave={handleSaveExam}
        onChange={setCourseExam}
      />
    </div>
  );
}
