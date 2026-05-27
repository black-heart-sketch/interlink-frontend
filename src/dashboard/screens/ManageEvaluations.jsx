import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import axiosInstance from '../../config/axiosConfig';
import { evaluationService } from '../../services/evaluationService';

const fields = [
  ['punctuality', 'Punctuality'],
  ['taskCompletion', 'Task Completion'],
  ['communication', 'Communication'],
  ['technicalSkills', 'Technical Skills'],
  ['creativity', 'Creativity'],
  ['discipline', 'Discipline'],
];
const normalizeRole = (role) => String(role || '').toLowerCase();
const name = (user) => [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'Student';
const inputCls = 'w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none focus:border-pink-400/60';

export default function ManageEvaluations({ dashboardRoles }) {
  const reduxRoles = useSelector((state) => state.auth.userRoles);
  const roles = useMemo(() => ((dashboardRoles?.length ? dashboardRoles : reduxRoles) || []).map(normalizeRole), [dashboardRoles, reduxRoles]);
  const canEvaluate = roles.some((role) => ['supervisor', 'teacher', 'advisor', 'admin', 'superadmin'].includes(role));
  const [rows, setRows] = useState([]);
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({ internId: '', punctuality: 80, taskCompletion: 80, communication: 80, technicalSkills: 80, creativity: 80, discipline: 80, feedback: '' });
  const [analysis, setAnalysis] = useState(null);

  const fetchRows = async () => {
    try { setRows(await evaluationService.getEvaluations()); }
    catch (error) { toast.error(error.response?.data?.message || 'Unable to load evaluations.'); }
  };
  useEffect(() => {
    fetchRows();
    if (canEvaluate) axiosInstance.get('/users', { params: { role: 'student' } }).then((res) => setStudents(res.data || [])).catch(() => {});
  }, [canEvaluate]);

  const total = Math.round(fields.reduce((sum, [key]) => sum + Number(form[key] || 0), 0) / fields.length);
  const submit = async (event) => {
    event.preventDefault();
    if (!form.internId) return toast.warning('Select a student.');
    try {
      await evaluationService.createEvaluation(form);
      toast.success('Evaluation submitted.');
      fetchRows();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to submit evaluation.');
    }
  };

  return (
    <div className="grid gap-6 pb-12 xl:grid-cols-[420px_minmax(0,1fr)]">
      {canEvaluate && (
        <form onSubmit={submit} className="h-fit space-y-4 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <h3 className="text-xl font-black text-white">Supervisor Evaluation</h3>
          <select className={inputCls} value={form.internId} onChange={(e) => setForm({ ...form, internId: e.target.value })}>
            <option value="">Select intern</option>
            {students.map((student) => <option key={student._id} value={student._id}>{name(student)}</option>)}
          </select>
          {fields.map(([key, label]) => (
            <label key={key} className="block">
              <span className="mb-2 flex justify-between text-xs font-black uppercase tracking-[0.14em] text-slate-500"><span>{label}</span><span>{form[key]}%</span></span>
              <input type="range" min="0" max="100" value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="w-full" />
            </label>
          ))}
          <textarea className={`${inputCls} min-h-[110px]`} value={form.feedback} onChange={(e) => setForm({ ...form, feedback: e.target.value })} placeholder="Supervisor feedback" />
          <div className="rounded-2xl border border-pink-400/15 bg-pink-500/10 p-4 text-sm font-black text-pink-200">Total Score: {total}%</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <button className="rounded-xl bg-pink-400 px-5 py-3 text-sm font-black text-slate-950">Submit</button>
            <button type="button" onClick={async () => setAnalysis(await evaluationService.aiAnalysis({ scores: form, feedback: form.feedback }))} className="rounded-xl border border-white/10 px-5 py-3 text-sm font-black text-white">AI Analysis</button>
          </div>
          {analysis && <pre className="rounded-2xl bg-black/25 p-3 text-xs text-slate-300">{JSON.stringify(analysis.result || analysis, null, 2)}</pre>}
        </form>
      )}
      <section className="space-y-4">
        {rows.length === 0 ? <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center text-slate-400">No evaluations yet.</div> : rows.map((row) => (
          <article key={row._id} className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-lg font-black text-white">{name(row.intern)}</h3>
                <p className="mt-1 text-sm text-slate-400">{row.feedback || 'No feedback added.'}</p>
              </div>
              <strong className="rounded-2xl bg-pink-400 px-4 py-2 text-slate-950">{row.totalScore}%</strong>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {fields.map(([key, label]) => <span key={key} className="rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-xs font-bold text-slate-300">{label}: {row[key]}%</span>)}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
