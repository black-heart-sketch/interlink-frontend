import { useEffect, useState } from 'react';
import { analyticsService } from '../../services/analyticsService';

export default function ManagePortfolio() {
  const [portfolio, setPortfolio] = useState(null);
  useEffect(() => { analyticsService.getMyPortfolio().then(setPortfolio).catch(() => setPortfolio({})); }, []);
  if (!portfolio) return <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center text-slate-400">Loading portfolio...</div>;
  return (
    <div className="space-y-6 pb-12">
      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <h2 className="text-3xl font-black text-white">{portfolio.profile ? `${portfolio.profile.firstName || ''} ${portfolio.profile.lastName || ''}`.trim() || portfolio.profile.email : 'Digital Portfolio'}</h2>
        <p className="mt-2 text-slate-400">{portfolio.department || 'InterLink Internship'} · Public share route ready for future launch</p>
      </section>
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Completed Tasks" items={portfolio.completedTasks?.map((task) => task.title)} />
        <Panel title="Reports Summary" items={portfolio.reportsSummary?.map((report) => `${report.type}: ${report.title}`)} />
        <Panel title="Skills" items={Object.entries(portfolio.skills || {}).map(([key, value]) => `${key}: ${value}%`)} />
        <Panel title="Supervisor Feedback" items={portfolio.supervisorFeedback} />
      </div>
      {portfolio.certificate && <a className="inline-flex rounded-xl bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 no-underline" href={`/certificate/verify/${portfolio.certificate.certificateNumber}`}>View Certificate</a>}
    </div>
  );
}

function Panel({ title, items = [] }) {
  return <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"><h3 className="text-lg font-black text-white">{title}</h3><div className="mt-4 grid gap-2">{items.length ? items.map((item, i) => <div key={i} className="rounded-xl bg-slate-950/35 px-4 py-3 text-sm text-slate-300">{item}</div>) : <p className="text-sm text-slate-500">No data yet.</p>}</div></section>;
}
