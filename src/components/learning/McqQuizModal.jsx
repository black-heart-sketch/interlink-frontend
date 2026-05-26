import { useEffect, useState } from 'react';

export default function McqQuizModal({ open, notionTitle, questions, attempt, loading, onSubmit }) {
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    if (open) setAnswers({});
  }, [open, questions]);

  if (!open) return null;

  const allAnswered = questions?.length > 0 && questions.every(question => answers[question._id]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-[#0f172a] shadow-2xl">
        <div className="border-b border-white/10 bg-white/[0.04] p-5 sm:p-6">
          <span className="inline-flex rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-blue-200">
            Notion checkpoint · Attempt {attempt}/3
          </span>
          <h2 className="mt-3 text-2xl font-black text-white">{notionTitle || 'Learning checkpoint'}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Answer every question. You need at least 60% to continue the video.
          </p>
        </div>

        <div className="max-h-[58vh] overflow-y-auto p-5 sm:p-6">
          {loading && (
            <div className="flex min-h-60 items-center justify-center text-slate-400">
              <i className="fa-solid fa-circle-notch mr-3 animate-spin" aria-hidden="true" />
              Preparing your checkpoint questions...
            </div>
          )}

          {!loading && questions?.length > 0 && (
            <div className="space-y-5">
              {questions.map((question, index) => (
                <fieldset key={question._id} className="rounded-2xl border border-white/10 bg-black/15 p-4">
                  <legend className="px-2 text-sm font-black text-white">
                    {index + 1}. {question.questionText}
                  </legend>
                  <div className="mt-3 grid gap-2">
                    {question.options.map((option) => {
                      const value = option._id || option.text;
                      const selected = answers[question._id] === value;
                      return (
                        <label
                          key={value}
                          className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 text-sm transition ${selected ? 'border-blue-400/50 bg-blue-500/15 text-blue-50' : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:bg-white/[0.06]'}`}
                        >
                          <input
                            type="radio"
                            name={question._id}
                            value={value}
                            checked={selected}
                            onChange={(event) => setAnswers(prev => ({ ...prev, [question._id]: event.target.value }))}
                            className="mt-1"
                          />
                          <span>{option.text}</span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 bg-white/[0.035] p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-bold text-slate-500">
            {questions?.length || 0} questions · Passing score 60%
          </p>
          <button
            type="button"
            onClick={() => onSubmit(answers)}
            disabled={loading || !allAnswered}
            className="btn-primary justify-center !rounded-xl disabled:cursor-not-allowed disabled:opacity-50"
          >
            Submit answers
          </button>
        </div>
      </div>
    </div>
  );
}
