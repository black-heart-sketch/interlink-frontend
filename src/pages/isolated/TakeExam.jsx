import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { examService } from '../services/examService';
import AntiCheatMonitor from '../components/public/AntiCheatMonitor';
import { ShieldAlert } from 'lucide-react';

export default function TakeExam() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [violation, setViolation] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const startExam = async () => {
      try {
        const data = await examService.startAttempt(id);
        setExam(data.exam);
        setAttempt(data.attempt);
        if (data.attempt.status === 'completed') {
          setError(t('take_exam.already_submitted'));
        } else {
          // Initialize answers from previous state if any
          setAnswers(data.attempt.answers || {});
          
          // Calculate time left
          const now = new Date();
          const startedAt = new Date(data.attempt.startedAt);
          const endTime = new Date(data.exam.endTime);
          
          // Duration based on startedAt + duration vs absolute endTime
          const maxDurationMs = data.exam.durationMinutes * 60 * 1000;
          const userEndTime = new Date(startedAt.getTime() + maxDurationMs);
          const actualEndTime = userEndTime < endTime ? userEndTime : endTime;
          
          const remainingMs = actualEndTime - now;
          if (remainingMs <= 0) {
            submitExam(data.attempt.answers || {});
          } else {
            setTimeLeft(Math.floor(remainingMs / 1000));
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || t('take_exam.load_failed'));
      } finally {
        setLoading(false);
      }
    };
    startExam();
  }, [id]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || violation) return;
    const timerId = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerId);
          submitExam(answers);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerId);
  }, [timeLeft, violation, answers]);

  const submitExam = async (currentAnswers, auto = false) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await examService.submitAttempt(id, currentAnswers || answers);
      alert(t('take_exam.submitted_score', { score: res.score }));
      navigate('/exams');
    } catch (err) {
      alert(t('take_exam.submit_failed'));
      setSubmitting(false);
    }
  };

  const handleOptionSelect = (qIdx, oIdx) => {
    setAnswers(prev => ({ ...prev, [qIdx]: oIdx }));
  };

  const handleViolation = (reason) => {
    if (violation) return;
    setViolation(reason);
    // Force submit on cheat detection
    submitExam(answers, true);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">{t('take_exam.initializing')}</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-red-500 font-bold p-8 text-center">{error}</div>;

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col relative select-none">
      
      {/* Top Bar */}
      <div className="h-16 bg-slate-900 border-b border-white/5 flex items-center justify-between px-6 sticky top-0 z-40">
        <div className="font-bold text-white">{exam?.title}</div>
        <div className="flex items-center gap-4">
          <div className={`font-mono text-xl font-bold px-4 py-1 rounded bg-black border ${timeLeft < 60 ? 'text-red-500 border-red-500/50 animate-pulse' : 'text-emerald-400 border-emerald-500/30'}`}>
            {timeLeft !== null ? formatTime(timeLeft) : '00:00'}
          </div>
          <button 
            onClick={() => submitExam(answers)}
            disabled={submitting || violation}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
          >
            <span className="inline-flex items-center gap-2">
              {submitting && <i className="fa-solid fa-spinner fa-spin" aria-hidden="true" />}
              {submitting ? t('take_exam.submitting') : t('take_exam.submit')}
            </span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-12">
        {violation ? (
           <div className="bg-red-950/80 border border-red-500/30 p-8 rounded-2xl text-center">
             <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
             <h2 className="text-2xl font-bold text-white mb-2">{t('take_exam.interrupted')}</h2>
             <p className="text-red-200">{t('take_exam.violation_detected')}: {violation}</p>
             <p className="text-slate-400 mt-4 text-sm">{t('take_exam.auto_submitted')}</p>
           </div>
        ) : (
          <div className="space-y-8">
            {exam?.questions.map((q, qIdx) => (
              <div key={q._id} className="bg-slate-900 border border-white/5 p-6 rounded-xl">
                <h3 className="text-lg font-bold text-white mb-4">{t('take_exam.question_number', { number: qIdx + 1 })}</h3>
                <p className="text-slate-300 mb-6 leading-relaxed">{q.questionText}</p>
                <div className="space-y-3">
                  {q.options.map((opt, oIdx) => {
                    const isSelected = answers[qIdx] === oIdx;
                    return (
                      <button
                        key={oIdx}
                        onClick={() => handleOptionSelect(qIdx, oIdx)}
                        className={`w-full text-left p-4 rounded-lg border transition-colors ${
                          isSelected 
                            ? 'bg-blue-600/20 border-blue-500 text-blue-100' 
                            : 'bg-slate-950 border-white/5 hover:border-white/20 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Security Monitor */}
      {!violation && (
        <AntiCheatMonitor active={true} onViolation={handleViolation} />
      )}
    </div>
  );
}
