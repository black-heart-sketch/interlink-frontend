import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { toast } from 'react-toastify';
import { analyticsService } from '../../services/analyticsService';

export default function ManageAnalytics() {
  const [data, setData] = useState(null);
  useEffect(() => {
    analyticsService.getAnalytics().then(setData).catch((error) => toast.error(error.response?.data?.message || 'Unable to load analytics.'));
  }, []);
  if (!data) return <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center text-slate-400">Loading analytics...</div>;
  return (
    <div className="space-y-6 pb-12">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ['Task Completion', `${data.taskCompletionRate}%`],
          ['Attendance', `${data.attendanceRate}%`],
          ['Report Submission', `${data.reportSubmissionRate}%`],
          ['Completion', `${data.internshipCompletionRate}%`],
          ['Certificates', data.certificatesGenerated],
        ].map(([label, value]) => <article key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</span><strong className="mt-2 block text-2xl font-black text-white">{value}</strong></article>)}
      </div>
      <section className="grid gap-6 xl:grid-cols-2">
        <Chart title="Interns Per Department" data={data.internsPerDepartment} x="department" y="count" />
        <Chart title="Performance Per Intern" data={data.performanceScorePerIntern} x="intern" y="score" />
      </section>
    </div>
  );
}

function Chart({ title, data, x, y }) {
  return (
    <div className="h-[360px] rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <h3 className="mb-4 text-lg font-black text-white">{title}</h3>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={data}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.08)" /><XAxis dataKey={x} stroke="#94a3b8" /><YAxis stroke="#94a3b8" /><Tooltip /><Bar dataKey={y} fill="#22d3ee" radius={[8, 8, 0, 0]} /></BarChart>
      </ResponsiveContainer>
    </div>
  );
}
