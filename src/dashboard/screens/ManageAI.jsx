import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { interlinkAiService } from '../../services/interlinkAiService';

const normalizeRole = (role) => String(role || '').toLowerCase();
const inputCls = 'w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-violet-400/60';
const areaCls = `${inputCls} min-h-[130px] resize-y leading-6`;

function Field({ label, children }) {
  return <label className="block"><span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</span>{children}</label>;
}

function JsonPanel({ title, data }) {
  if (!data) return null;
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-950/40 p-5">
      <h3 className="text-sm font-black uppercase tracking-[0.18em] text-violet-200">{title}</h3>
      <pre className="mt-4 max-h-[420px] overflow-auto whitespace-pre-wrap rounded-2xl bg-black/25 p-4 text-sm leading-6 text-slate-200">{JSON.stringify(data, null, 2)}</pre>
    </section>
  );
}

export default function ManageAI({ dashboardRoles }) {
  const reduxRoles = useSelector((state) => state.auth.userRoles);
  const roles = useMemo(() => {
    const source = Array.isArray(dashboardRoles) && dashboardRoles.length ? dashboardRoles : reduxRoles;
    return (source || []).map(normalizeRole);
  }, [dashboardRoles, reduxRoles]);
  const isStudent = roles.includes('student');
  const isSupervisor = roles.includes('supervisor') || roles.includes('teacher') || roles.includes('advisor');
  const isAdmin = roles.includes('admin') || roles.includes('superadmin') || roles.includes('manager');

  const [tab, setTab] = useState(isStudent ? 'assistant' : isSupervisor ? 'review' : 'performance');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatText, setChatText] = useState('');
  const [reportForm, setReportForm] = useState({ type: 'daily', notes: '', achievements: '', blockers: '', nextSteps: '' });
  const [reviewForm, setReviewForm] = useState({ title: '', content: '', challenges: '', nextSteps: '' });
  const [taskForm, setTaskForm] = useState({ internId: '', context: '' });
  const [analysisForm, setAnalysisForm] = useState({ internId: '' });

  const run = async (label, fn) => {
    setLoading(true);
    try {
      const data = await fn();
      setResult(data);
      toast.success(`${label} complete.`);
      return data;
    } catch (error) {
      toast.error(error.response?.data?.message || `${label} failed.`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const sendChat = async (event) => {
    event.preventDefault();
    if (!chatText.trim()) return;
    const nextMessages = [...chatMessages, { role: 'user', text: chatText }];
    setChatMessages(nextMessages);
    const text = chatText;
    setChatText('');
    const data = await run('AI chat', () => interlinkAiService.chat({ message: text, history: nextMessages.slice(-6) }));
    if (data?.result?.reply) setChatMessages((current) => [...current, { role: 'assistant', text: data.result.reply }]);
  };

  const tabs = [
    { id: 'assistant', label: 'Assistant', icon: 'fa-comments', show: true },
    { id: 'report', label: 'Report Writer', icon: 'fa-file-pen', show: true },
    { id: 'review', label: 'Report Review', icon: 'fa-clipboard-check', show: isSupervisor || isAdmin },
    { id: 'tasks', label: 'Task Ideas', icon: 'fa-list-check', show: isSupervisor || isAdmin },
    { id: 'performance', label: 'Performance', icon: 'fa-chart-line', show: isAdmin || isSupervisor },
    { id: 'summary', label: 'Final Summary', icon: 'fa-award', show: isAdmin || isSupervisor },
  ].filter((item) => item.show);

  return (
    <div className="space-y-6 pb-12">
      <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <span className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-violet-300">InterLink AI</span>
          <h2 className="mt-2 text-3xl font-black text-white">Internship Copilot</h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-400">Generate reports, improve drafts, review submissions, suggest tasks, analyze performance, detect risks, and prepare final summaries with provider fallback built in.</p>
        </div>
        <div className="rounded-2xl border border-violet-400/15 bg-violet-500/[0.06] p-4 text-sm leading-6 text-slate-300">
          AI output should support human decisions, not replace supervisor or admin review.
        </div>
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-2">
        {tabs.map((item) => (
          <button key={item.id} type="button" onClick={() => { setTab(item.id); setResult(null); }} className={`flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-black uppercase tracking-[0.14em] transition ${tab === item.id ? 'bg-violet-400 text-slate-950' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}>
            <i className={`fa-solid ${item.icon}`} />{item.label}
          </button>
        ))}
      </div>

      {tab === 'assistant' && (
        <section className="rounded-3xl border border-white/10 bg-white/[0.04]">
          <div className="min-h-[380px] space-y-3 p-5">
            {chatMessages.length === 0 ? <div className="grid min-h-[320px] place-items-center text-sm text-slate-500">Ask for report help, task planning, or progress advice.</div> : chatMessages.map((message, index) => (
              <div key={index} className={`max-w-[82%] rounded-2xl border p-4 text-sm leading-6 ${message.role === 'user' ? 'ml-auto border-violet-400/20 bg-violet-500/10 text-white' : 'border-white/10 bg-slate-950/40 text-slate-200'}`}>{message.text}</div>
            ))}
          </div>
          <form onSubmit={sendChat} className="border-t border-white/10 p-4">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_130px]">
              <input className={inputCls} value={chatText} onChange={(e) => setChatText(e.target.value)} placeholder="Ask the AI assistant..." />
              <button disabled={loading} className="rounded-xl bg-violet-400 px-5 py-3 text-sm font-black text-slate-950 disabled:opacity-50">Send</button>
            </div>
          </form>
        </section>
      )}

      {tab === 'report' && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <form onSubmit={(e) => { e.preventDefault(); run('Report generation', () => interlinkAiService.generateReport(reportForm)); }} className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <Field label="Report Type"><select className={inputCls} value={reportForm.type} onChange={(e) => setReportForm({ ...reportForm, type: e.target.value })}><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="final">Final</option></select></Field>
            <Field label="Raw Notes"><textarea className={areaCls} value={reportForm.notes} onChange={(e) => setReportForm({ ...reportForm, notes: e.target.value })} /></Field>
            <Field label="Achievements"><textarea className={areaCls} value={reportForm.achievements} onChange={(e) => setReportForm({ ...reportForm, achievements: e.target.value })} /></Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Blockers"><textarea className={areaCls} value={reportForm.blockers} onChange={(e) => setReportForm({ ...reportForm, blockers: e.target.value })} /></Field>
              <Field label="Next Steps"><textarea className={areaCls} value={reportForm.nextSteps} onChange={(e) => setReportForm({ ...reportForm, nextSteps: e.target.value })} /></Field>
            </div>
            <button disabled={loading} className="rounded-xl bg-violet-400 px-5 py-3 text-sm font-black text-slate-950 disabled:opacity-50">Generate Report</button>
          </form>
          <JsonPanel title="Generated Draft" data={result} />
        </div>
      )}

      {tab === 'review' && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <form onSubmit={(e) => { e.preventDefault(); run('Report review', () => interlinkAiService.reviewReport(reviewForm)); }} className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <Field label="Title"><input className={inputCls} value={reviewForm.title} onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })} /></Field>
            <Field label="Content"><textarea className={areaCls} value={reviewForm.content} onChange={(e) => setReviewForm({ ...reviewForm, content: e.target.value })} /></Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Challenges"><textarea className={areaCls} value={reviewForm.challenges} onChange={(e) => setReviewForm({ ...reviewForm, challenges: e.target.value })} /></Field>
              <Field label="Next Steps"><textarea className={areaCls} value={reviewForm.nextSteps} onChange={(e) => setReviewForm({ ...reviewForm, nextSteps: e.target.value })} /></Field>
            </div>
            <button disabled={loading} className="rounded-xl bg-violet-400 px-5 py-3 text-sm font-black text-slate-950 disabled:opacity-50">Review Draft</button>
          </form>
          <JsonPanel title="AI Review" data={result} />
        </div>
      )}

      {tab === 'tasks' && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <form onSubmit={(e) => { e.preventDefault(); run('Task suggestions', () => interlinkAiService.taskSuggestions(taskForm)); }} className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <Field label="Intern ID"><input className={inputCls} value={taskForm.internId} onChange={(e) => setTaskForm({ ...taskForm, internId: e.target.value })} placeholder="Optional Mongo user id" /></Field>
            <Field label="Supervisor Context"><textarea className={areaCls} value={taskForm.context} onChange={(e) => setTaskForm({ ...taskForm, context: e.target.value })} placeholder="Skills to develop, current project, deadlines..." /></Field>
            <button disabled={loading} className="rounded-xl bg-violet-400 px-5 py-3 text-sm font-black text-slate-950 disabled:opacity-50">Suggest Tasks</button>
          </form>
          <JsonPanel title="Task Recommendations" data={result} />
        </div>
      )}

      {(tab === 'performance' || tab === 'summary') && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <form onSubmit={(e) => { e.preventDefault(); run(tab === 'performance' ? 'Performance analysis' : 'Final summary', () => tab === 'performance' ? interlinkAiService.performanceAnalysis(analysisForm) : interlinkAiService.finalSummary(analysisForm)); }} className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <Field label="Intern ID"><input className={inputCls} value={analysisForm.internId} onChange={(e) => setAnalysisForm({ ...analysisForm, internId: e.target.value })} placeholder="Optional; defaults to current user where allowed" /></Field>
            <button disabled={loading} className="rounded-xl bg-violet-400 px-5 py-3 text-sm font-black text-slate-950 disabled:opacity-50">{tab === 'performance' ? 'Analyze Performance' : 'Generate Final Summary'}</button>
          </form>
          <JsonPanel title={tab === 'performance' ? 'Performance Analysis' : 'Final Summary'} data={result} />
        </div>
      )}
    </div>
  );
}
