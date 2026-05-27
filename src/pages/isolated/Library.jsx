import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { libraryService } from '../services/libraryService';
import { quizService } from '../services/quizService';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FilePreviewModal from '../components/public/FilePreviewModal';

const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001';

const TYPE_ICONS = { document: '📄', course: '📚', video: '🎬', audio: '🎧' };
const TYPE_COLORS = {
  document: 'from-blue-600 to-blue-800',
  course: 'from-emerald-600 to-teal-800',
  video: 'from-purple-600 to-purple-800',
  audio: 'from-amber-600 to-orange-800',
};

export default function Library() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [previewFile, setPreviewFile] = useState(null);

  // Track completed items locally
  const user = JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('user') || 'null');
  const [completedItems, setCompletedItems] = useState(user?.completedLibraryItems || []);

  // Quiz Modal States
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizError, setQuizError] = useState('');
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  useEffect(() => {
    if (!user) { setError('not_logged_in'); setLoading(false); return; }
    if (user.status === 'pending') { setError('pending'); setLoading(false); return; }

    const fetchItems = async () => {
      try {
        const params = {};
        if (user.studyLanguage?._id) params.studyLanguage = user.studyLanguage._id;
        const data = await libraryService.getItems(params);
        setItems(data);
      } catch (err) {
        setError('fetch_error');
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  const handleToggleComplete = async (itemId, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const data = await libraryService.toggleCompleteItem(itemId);
      setCompletedItems(data.completedLibraryItems);
      
      // Update session storage user
      const updatedUser = { ...user, completedLibraryItems: data.completedLibraryItems };
      sessionStorage.setItem('user', JSON.stringify(updatedUser));
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (err) {
      console.error('Failed to toggle library complete status:', err);
    }
  };

  const handleOpenQuiz = async (item, e) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveItem(item);
    setQuizModalOpen(true);
    setQuizLoading(true);
    setQuizError('');
    setQuiz(null);
    setQuizResult(null);
    setSelectedAnswers({});

    try {
      const quizData = await quizService.getQuiz(item._id);
      setQuiz(quizData);
    } catch (err) {
      setQuizError(t('library.quiz_unavailable'));
    } finally {
      setQuizLoading(false);
    }
  };

  const handleSelectOption = (questionIdx, optionIdx) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIdx]: optionIdx
    }));
  };

  const handleSubmitQuiz = async (e) => {
    e.preventDefault();
    if (!quiz || quizLoading) return;

    // Verify all answered
    const unanswered = quiz.questions.some((_, idx) => selectedAnswers[idx] === undefined);
    if (unanswered) {
      alert(t('library.answer_all_questions'));
      return;
    }

    setQuizLoading(true);
    try {
      const answersArray = quiz.questions.map((_, idx) => selectedAnswers[idx]);
      const result = await quizService.submitQuiz(activeItem._id, answersArray);
      setQuizResult(result);

      if (result.passed) {
        // Update completions
        const updatedCompletions = [...completedItems];
        if (!updatedCompletions.includes(activeItem._id)) {
          updatedCompletions.push(activeItem._id);
          setCompletedItems(updatedCompletions);
          
          const updatedUser = { ...user, completedLibraryItems: updatedCompletions };
          sessionStorage.setItem('user', JSON.stringify(updatedUser));
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      }
    } catch (err) {
      alert(t('library.quiz_submit_failed'));
    } finally {
      setQuizLoading(false);
    }
  };

  const filtered = items.filter(item => {
    const matchSearch = !search || item.title.toLowerCase().includes(search.toLowerCase());
    const matchType = !typeFilter || item.type === typeFilter;
    return matchSearch && matchType;
  });

  // Calculate Progress Stats
  const totalCount = items.length;
  const completedCount = items.filter(item => completedItems.includes(item._id)).length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const typeLabels = { document: t('library.types.document'), course: t('library.types.course'), video: t('library.types.video'), audio: t('library.types.audio') };

  // SVG circular properties
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
      <div className="text-white text-lg">{t('library.loading')}</div>
    </div>
  );

  if (error === 'not_logged_in') return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background: 'var(--bg-primary)' }}>
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">🔒</div>
        <h1 className="text-2xl font-black text-white mb-3">{t('library.restricted_title')}</h1>
        <p className="text-slate-400 mb-6">{t('library.login_required')}</p>
        <Link to="/login" className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl transition-colors no-underline">{t('auth.have_account')}</Link>
      </div>
    </div>
  );

  if (error === 'pending') return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background: 'var(--bg-primary)' }}>
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">⏳</div>
        <h1 className="text-2xl font-black text-white mb-3">{t('library.pending_title')}</h1>
        <p className="text-slate-400 mb-2">{t('library.pending_desc')}</p>
        <p className="text-slate-500 text-sm">{t('library.pending_access')}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
      <Navbar theme={theme} toggleTheme={toggleTheme} />

      {/* Header Info */}
      <div style={{ background: 'var(--nav-bg)', borderBottom: '1px solid var(--glass-border)', padding: '100px 2rem 1.5rem 2rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              📚 {t('library.title')}
            </h1>
            {user?.studyLanguage?.name && (
              <p style={{ color: '#10b981', fontSize: '0.875rem', fontWeight: 700, margin: '0.25rem 0 0 0' }}>
                {user.studyLanguage.name} - {t('library.active_learning_space')}
              </p>
            )}
          </div>
          <Link to="/lounge" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', color: '#60a5fa', padding: '0.5rem 1rem', borderRadius: 10, textDecoration: 'none', fontSize: '0.85rem', fontWeight: 700 }}>
            💬 {t('library.live_study_lounge')}
          </Link>
        </div>
      </div>

      {/* Core Layout Grid */}
      <div style={{ maxWidth: 1200, width: '90%', margin: '0 auto', padding: '2rem 0 4rem 0', flex: 1 }}>
        
        {/* Visual Circular Roadmap Gauge Panel */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: 20, padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2.5rem', backdropFilter: 'blur(10px)' }}>
          {/* Radial Ring Gauge */}
          <div style={{ position: 'relative', width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width={80} height={80} style={{ transform: 'rotate(-90deg)' }}>
              <circle cx={40} cy={40} r={radius} fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth={6} />
              <circle cx={40} cy={40} r={radius} fill="transparent" stroke="#10b981" strokeWidth={6} strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }} />
            </svg>
            <div style={{ position: 'absolute', color: 'white', fontSize: '1rem', fontWeight: 900 }}>
              {progressPercent}%
            </div>
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'white' }}>{t('library.roadmap_title')}</h3>
            <p style={{ margin: '0.25rem 0 0 0', color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.4 }}>
              {t('library.roadmap_prefix')} <strong style={{ color: '#10b981' }}>{completedCount}</strong> {t('library.roadmap_middle')} <strong style={{ color: '#3b82f6' }}>{totalCount}</strong> {t('library.roadmap_suffix')}
            </p>
          </div>
        </div>

        {/* Search & Filters Panel */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            placeholder={t('library.search_placeholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 200, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '0.75rem 1rem', color: 'white', outline: 'none' }}
          />
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {['', 'document', 'course', 'video', 'audio'].map(type => (
              <button key={type} onClick={() => setTypeFilter(type)}
                style={{
                  padding: '0.5rem 1rem', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem',
                  background: typeFilter === type ? '#3b82f6' : 'rgba(255,255,255,0.05)',
                  color: typeFilter === type ? 'white' : '#94a3b8',
                  transition: 'all 0.2s'
                }}>
                {type ? `${TYPE_ICONS[type]} ${typeLabels[type]}` : t('library.all')}
              </button>
            ))}
          </div>
        </div>

        {/* Resources Grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#475569' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
            <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>{t('library.no_resources_title')}</p>
            <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>{t('library.no_resources_desc')}</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {filtered.map(item => {
              const isCompleted = completedItems.includes(item._id);
              return (
                <div
                  key={item._id}
                  style={{
                    background: 'var(--card-bg)', border: isCompleted ? '1px solid rgba(16,185,129,0.3)' : '1px solid var(--glass-border)', borderRadius: 16,
                    overflow: 'hidden', transition: 'all 0.3s', position: 'relative', display: 'flex', flexDirection: 'column'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  {/* Thumbnail / Type Header */}
                  <div 
                    onClick={() => setPreviewFile({
                      url: item.fileUrl,
                      name: item.title,
                      type: item.type,
                      isPrivate: item.isPrivate
                    })}
                    title={t('library.preview_title')}
                    style={{
                      height: 130,
                      background: item.thumbnail ? `url(${API_URL}${item.thumbnail}) center/cover` : `linear-gradient(135deg, ${TYPE_COLORS[item.type]?.split(' ')[0]?.replace('from-', '')} 0%, ${TYPE_COLORS[item.type]?.split(' ')[1]?.replace('to-', '')} 100%)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', cursor: 'pointer'
                    }}
                  >
                    {!item.thumbnail && <span style={{ fontSize: '3rem' }}>{TYPE_ICONS[item.type]}</span>}
                    
                    {/* Checklist Completion Badge Button */}
                    <button
                      onClick={(e) => handleToggleComplete(item._id, e)}
                      title={isCompleted ? t('library.mark_incomplete') : t('library.mark_complete')}
                      style={{
                        position: 'absolute', top: 12, right: 12, background: isCompleted ? '#10b981' : 'rgba(0,0,0,0.4)',
                        border: isCompleted ? 'none' : '1px solid rgba(255,255,255,0.4)', width: 28, height: 28, borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', zIndex: 10
                      }}
                    >
                      <span style={{ fontSize: '0.85rem', color: 'white', fontWeight: 900 }}>
                        {isCompleted ? '✓' : ''}
                      </span>
                    </button>
                  </div>

                  {/* Body Content */}
                  <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#60a5fa', background: 'rgba(59,130,246,0.1)', padding: '0.2rem 0.5rem', borderRadius: 6 }}>
                        {typeLabels[item.type]}
                      </span>
                    </div>
                    <h3 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1rem', margin: '0 0 0.5rem 0', lineHeight: 1.3 }}>{item.title}</h3>
                    {item.description && <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', margin: 0, lineHeight: 1.5, flex: 1 }}>{item.description}</p>}
                    
                    {/* Action buttons (Download & Quizzes) */}
                    <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem' }}>
                      <button
                        onClick={() => setPreviewFile({
                          url: item.fileUrl,
                          name: item.title,
                          type: item.type,
                          isPrivate: item.isPrivate
                        })}
                        style={{ background: 'transparent', border: 'none', color: '#60a5fa', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        👁️ {t('library.preview')}
                      </button>
                      <a
                        href={`${API_URL}${item.fileUrl}`}
                        download
                        style={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.8rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        📥 {t('library.download')}
                      </a>
                      
                      <button
                        onClick={(e) => handleOpenQuiz(item, e)}
                        style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981', padding: '0.35rem 0.75rem', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.2)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.1)'; }}
                      >
                        📝 {t('library.take_quiz')}
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* QUIZ TAKING MODAL DRAWER */}
      {quizModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div style={{ background: '#0a0f29', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, maxWidth: 650, width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            
            {/* Modal Header */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('library.quiz_title')}</span>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'white', margin: '0.25rem 0 0 0' }}>{activeItem?.title}</h2>
              </div>
              <button onClick={() => setQuizModalOpen(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#94a3b8', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', fontWeight: 900 }}>×</button>
            </div>

            {/* Modal Body */}
            <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }} className="no-scrollbar">
              {quizLoading && <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>{t('library.quiz_loading')}</div>}
              
              {quizError && (
                <div style={{ textAlign: 'center', color: '#f87171', padding: '2rem', fontWeight: 600 }}>
                  <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>⚠️</span>
                  {quizError}
                </div>
              )}

              {/* Quiz content */}
              {quiz && !quizResult && (
                <form onSubmit={handleSubmitQuiz} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {quiz.description && <p style={{ color: '#cbd5e1', fontSize: '0.85rem', lineHeight: 1.5, background: 'rgba(255,255,255,0.02)', padding: '0.75rem 1rem', borderRadius: 10, border: '1px solid rgba(255,255,255,0.03)' }}>{quiz.description}</p>}
                  
                  {quiz.questions.map((q, qIdx) => (
                    <div key={q._id} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 16, padding: '1rem' }}>
                      <p style={{ fontWeight: 800, fontSize: '0.9rem', color: 'white', margin: '0 0 0.75rem 0' }}>
                        {qIdx + 1}. {q.questionText}
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {q.options.map((option, oIdx) => {
                          const isSelected = selectedAnswers[qIdx] === oIdx;
                          return (
                            <button
                              key={oIdx}
                              type="button"
                              onClick={() => handleSelectOption(qIdx, oIdx)}
                              style={{
                                textAlign: 'left', padding: '0.75rem 1rem', borderRadius: 10,
                                background: isSelected ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.02)',
                                border: isSelected ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.05)',
                                color: isSelected ? '#60a5fa' : '#cbd5e1',
                                fontWeight: isSelected ? 700 : 600, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s'
                              }}
                            >
                              {option}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  <button
                    type="submit"
                    style={{
                      background: '#10b981', color: 'white', border: 'none', borderRadius: 12, padding: '0.8rem',
                      fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s', marginTop: '1rem'
                    }}
                  >
                    {t('library.submit_answers')}
                  </button>
                </form>
              )}

              {/* Quiz Result Feedback Screen */}
              {quizResult && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  
                  {/* Score Alert */}
                  <div style={{
                    textAlign: 'center', padding: '2rem', borderRadius: 20,
                    background: quizResult.passed ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                    border: quizResult.passed ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(239,68,68,0.3)'
                  }}>
                    <span style={{ fontSize: '3rem', display: 'block', marginBottom: '0.5rem' }}>
                      {quizResult.passed ? '🎉' : '❌'}
                    </span>
                    <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: quizResult.passed ? '#10b981' : '#f87171' }}>
                      {quizResult.passed ? t('library.quiz_passed') : t('library.quiz_failed')}
                    </h3>
                    <p style={{ margin: '0.5rem 0 0 0', color: 'white', fontWeight: 800, fontSize: '1.5rem' }}>
                      {t('library.score')}: {quizResult.score}%
                    </p>
                    <p style={{ margin: '0.25rem 0 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
                      {t('library.correct_answers', { correct: quizResult.correctCount, total: quizResult.totalQuestions })}
                      {quizResult.passed ? ` ${t('library.course_validated')}` : ` ${t('library.minimum_score')}`}
                    </p>
                  </div>

                  {/* List of Graded Explanations */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h4 style={{ margin: 0, color: 'white', fontWeight: 800, fontSize: '0.95rem' }}>{t('library.detailed_correction')}</h4>
                    {quizResult.gradedQuestions.map((q, idx) => (
                      <div key={idx} style={{
                        padding: '1rem', borderRadius: 16, background: 'rgba(255,255,255,0.01)',
                        border: q.isCorrect ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(239,68,68,0.2)'
                      }}>
                        <p style={{ fontWeight: 800, fontSize: '0.85rem', color: 'white', margin: '0 0 0.5rem 0' }}>
                          {idx + 1}. {q.questionText}
                        </p>
                        
                        <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '0.5rem' }}>
                          <span style={{ color: q.isCorrect ? '#10b981' : '#f87171' }}>
                            {t('library.your_answer')}: <strong>{q.selectedOption}</strong>
                          </span>
                          {!q.isCorrect && (
                            <span style={{ color: '#10b981' }}>
                              {t('library.correct_answer')}: <strong>{q.correctOption}</strong>
                            </span>
                          )}
                        </div>

                        {q.explanation && (
                          <p style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem 0.75rem', borderRadius: 8, fontSize: '0.75rem', color: '#94a3b8', margin: 0, borderLeft: '3px solid #3b82f6' }}>
                            <strong>{t('library.explanation')}:</strong> {q.explanation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => setQuizModalOpen(false)}
                    style={{
                      background: '#3b82f6', color: 'white', border: 'none', borderRadius: 12, padding: '0.8rem',
                      fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s', marginTop: '1rem'
                    }}
                  >
                    {t('dashboard.actions.close')}
                  </button>

                </div>
              )}

            </div>

          </div>
        </div>
      )}

      <Footer />

      <FilePreviewModal
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        fileUrl={previewFile?.url}
        fileName={previewFile?.name}
        fileType={previewFile?.type}
        isPrivate={previewFile?.isPrivate}
        user={user}
      />
    </div>
  );
}
