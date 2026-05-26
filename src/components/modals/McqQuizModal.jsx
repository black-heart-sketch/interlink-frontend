import React, { useState, useEffect } from 'react';

export default function McqQuizModal({ open, onClose, notionTitle, questions, onSubmitQuiz, isLoadingQuiz }) {
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    if (questions?.length) setAnswers({});
  }, [questions]);

  const handleAnswerChange = (qId, optId) => {
    setAnswers(prev => ({ ...prev, [qId]: optId }));
  };

  const handleSubmit = () => {
    if (questions.some(q => !answers[q._id])) {
      return; // Do nothing, or could add a local toast
    }
    onSubmitQuiz(answers);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[170] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px] transition-opacity" 
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-emerald-200/50 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.28)]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-emerald-50 to-sky-50 p-6">
          <div>
            <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-emerald-700">Notion Checkpoint</p>
            <h2 className="mt-1 text-xl font-black text-slate-950">{notionTitle}</h2>
            <p className="mt-2 text-xs font-semibold text-slate-500">
              You can close this checkpoint now, but you must pass it before continuing past this notion.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            aria-label="Close quiz"
            title="Close quiz"
          >
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 custom-scrollbar">
          {isLoadingQuiz ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <i className="fa-solid fa-circle-notch mb-4 animate-spin text-4xl text-emerald-500"></i>
              <p className="font-bold">Generating questions...</p>
            </div>
          ) : !questions || questions.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <p>No questions available.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {questions.map((q, index) => (
                <div key={q._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <h3 className="mb-4 text-base font-bold text-slate-950">
                    <span className="mr-2 text-emerald-600">{index + 1}.</span>
                    {q.questionText}
                  </h3>
                  
                  <div className="space-y-2">
                    {q.options.map(opt => {
                      const isSelected = answers[q._id] === (opt._id || opt.text);
                      return (
                        <label 
                          key={opt._id || opt.text} 
                          className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all ${
                            isSelected 
                              ? 'border-emerald-400 bg-emerald-50' 
                              : 'border-slate-200 bg-white hover:border-emerald-200'
                          }`}
                        >
                          <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-emerald-400 bg-white">
                            {isSelected && <div className="h-2.5 w-2.5 rounded-full bg-emerald-500"></div>}
                          </div>
                          <input
                            type="radio"
                            name={`question-${q._id}`}
                            value={opt._id || opt.text}
                            checked={isSelected}
                            onChange={(e) => handleAnswerChange(q._id, e.target.value)}
                            className="hidden"
                          />
                          <span className={`text-sm ${isSelected ? 'font-bold text-emerald-800' : 'text-slate-700'}`}>
                            {opt.text}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 p-6 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
          >
            Close and review video
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isLoadingQuiz || !questions?.length || questions.some(q => !answers[q._id])}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-100 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Submit Answers
            <i className="fa-solid fa-arrow-right"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
