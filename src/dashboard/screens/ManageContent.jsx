import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { projectContentService, serviceContentService } from '../../services/contentService';

const empty = { title: '', description: '', category: '', status: 'published', image: null, technologies: '', projectUrl: '' };

export default function ManageContent({ type = 'services' }) {
  const svc = type === 'projects' ? projectContentService : serviceContentService;
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const label = type === 'projects' ? 'Project' : 'Service';
  const inputCls = 'w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none';
  const fetchRows = async () => { try { setRows(await svc.list()); } catch { toast.error(`Unable to load ${type}.`); } };
  useEffect(() => { fetchRows(); }, [type]);
  const submit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, technologies: type === 'projects' ? form.technologies.split(',').map((v) => v.trim()).filter(Boolean) : undefined };
      if (editing) await svc.update(editing._id, payload); else await svc.create(payload);
      toast.success(`${label} saved.`);
      setForm(empty); setEditing(null); fetchRows();
    } catch (error) { toast.error(error.response?.data?.message || `Unable to save ${label}.`); }
  };
  return (
    <div className="grid gap-6 pb-12 xl:grid-cols-[420px_minmax(0,1fr)]">
      <form onSubmit={submit} className="h-fit space-y-4 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
        <h3 className="text-xl font-black text-white">{editing ? `Edit ${label}` : `Add ${label}`}</h3>
        <input required className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" />
        <textarea required className={`${inputCls} min-h-[120px]`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" />
        <input className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Category" />
        {type === 'projects' && <input className={inputCls} value={form.technologies} onChange={(e) => setForm({ ...form, technologies: e.target.value })} placeholder="Technologies, comma separated" />}
        {type === 'projects' && <input className={inputCls} value={form.projectUrl} onChange={(e) => setForm({ ...form, projectUrl: e.target.value })} placeholder="Project URL" />}
        <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="published">Published</option><option value="draft">Draft</option></select>
        <input type="file" accept="image/*" className={inputCls} onChange={(e) => setForm({ ...form, image: e.target.files?.[0] })} />
        <div className="grid gap-3 sm:grid-cols-2">
          {editing && <button type="button" onClick={() => { setEditing(null); setForm(empty); }} className="rounded-xl border border-white/10 px-5 py-3 text-sm font-black text-white">Cancel</button>}
          <button className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950">Save</button>
        </div>
      </form>
      <section className="grid gap-4 lg:grid-cols-2">
        {rows.map((row) => (
          <article key={row._id} className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <span className="text-xs font-black uppercase tracking-[0.16em] text-cyan-300">{row.category}</span>
            <h3 className="mt-2 text-xl font-black text-white">{row.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">{row.description}</p>
            <div className="mt-4 flex gap-2">
              <button onClick={() => { setEditing(row); setForm({ ...empty, ...row, technologies: (row.technologies || []).join(', ') }); }} className="rounded-xl border border-white/10 px-4 py-2 text-sm font-black text-white">Edit</button>
              <button onClick={async () => { await svc.remove(row._id); fetchRows(); }} className="rounded-xl border border-rose-400/20 px-4 py-2 text-sm font-black text-rose-200">Delete</button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
