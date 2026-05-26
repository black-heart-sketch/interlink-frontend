import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import DataTable from '../components/DataTable';
import Loader from '../components/Loader';
import { programService } from '../../services/programService';
import FilePreviewModal from '../../components/public/FilePreviewModal';

const CATEGORIES = ['language', 'preparation', 'integration', 'coaching'];
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const LANGS = [{ v: 'de', l: 'Allemand' }, { v: 'fr', l: 'Français' }, { v: 'en', l: 'Anglais' }];
const EMPTY = { title: '', slug: '', category: 'language', level: 'A1', duration: '', price: '', description: '', language: 'de', isPublished: false };
const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001';

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-slate-400 text-sm font-semibold">{label}</span>
      {children}
    </label>
  );
}

function ManagePrograms () {
  const { t } = useTranslation();
  const columns = [
    { key: 'title', header: t('dashboard.screens.programs.name'), render: (row) => <span className="font-bold text-white">{row.title}</span> },
    { key: 'category', header: t('dashboard.screens.programs.category'), render: (row) => <span className="px-3 py-1 rounded-[5px] text-[0.6rem] font-black uppercase tracking-[0.2em] bg-blue-500/10 text-blue-400">{row.category}</span> },
    { key: 'level', header: t('dashboard.screens.programs.level'), render: (row) => <span className="font-bold text-slate-300">{row.level}</span> },
    { key: 'duration', header: t('dashboard.screens.programs.duration') },
    { key: 'price', header: 'Prix', render: (row) => row.price ? `${row.price} XAF` : '—' },
    { key: 'isPublished', header: 'Statut', render: (row) => <span className={`px-3 py-1 rounded-[5px] text-[0.6rem] font-black uppercase tracking-[0.2em] ${row.isPublished ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>{row.isPublished ? t('dashboard.status.published', 'Publié') : t('dashboard.status.draft', 'Brouillon')}</span> },
  ];
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [thumbFile, setThumbFile] = useState(null);
  const [syllabusFile, setSyllabusFile] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);

  const fetch = async () => {
    try { setRows(await programService.getPrograms()); }
    catch { toast.error('Erreur de chargement'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const openModal = (type, row = null) => {
    setModal({ type, row });
    setForm(row ? { title: row.title, slug: row.slug, category: row.category, level: row.level, duration: row.duration || '', price: row.price || '', description: row.description || '', language: row.language || 'de', isPublished: row.isPublished } : EMPTY);
    setThumbFile(null);
    setSyllabusFile(null);
  };
  const closeModal = () => { setModal(null); setForm(EMPTY); setThumbFile(null); setSyllabusFile(null); };

  const handleAction = (type, row) => openModal(type, row);

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        fd.append(k, v);
      });
      if (thumbFile) fd.append('thumbnail', thumbFile);
      if (syllabusFile) fd.append('syllabus', syllabusFile);

      if (!form.slug) {
        const generatedSlug = form.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        fd.set('slug', generatedSlug);
      }

      if (modal.type === 'Create') {
        await programService.createProgram(fd);
      } else {
        await programService.updateProgram(modal.row._id, fd);
      }
      toast.success(modal.type === 'Create' ? 'Programme créé !' : 'Programme mis à jour !');
      fetch(); closeModal();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try { await programService.deleteProgram(modal.row._id); toast.success('Programme supprimé'); fetch(); closeModal(); }
    catch { toast.error('Erreur de suppression'); }
    finally { setSaving(false); }
  };

  const inputCls = "bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500/60 transition-colors w-full";
  const selectCls = "bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500/60 transition-colors w-full";

  if (loading) return <Loader />;

  return (
    <>
      <DataTable title={t('dashboard.screens.programs.title')} rows={rows} columns={columns} searchPlaceholder={t('dashboard.actions.search')} filters={['Publié', 'Brouillon']} addAction={`+ ${t('dashboard.screens.programs.add_program')}`} onAction={handleAction} />

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm overflow-y-auto py-8" onMouseDown={closeModal}>
          <div className="relative bg-[#0f172a] border border-white/10 rounded-2xl p-8 w-full max-w-xl shadow-2xl mx-4" onMouseDown={(e) => e.stopPropagation()}>
            <button onClick={closeModal} className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl cursor-pointer bg-transparent border-none">×</button>

            {(modal.type === 'Create' || modal.type === 'Edit') && (
              <form onSubmit={handleSave} className="space-y-4">
                <div className="mb-2">
                  <h3 className="text-white font-black text-xl">{modal.type === 'Create' ? t('dashboard.screens.programs.add_program') : t('dashboard.actions.edit')}</h3>
                  <p className="text-slate-500 text-sm mt-1">{modal.type === 'Create' ? 'Créer un nouveau programme académique.' : `Modification de "${modal.row.title}"`}</p>
                </div>

                <Field label="Titre du programme">
                  <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} placeholder="ex: Allemand Intensif A1" />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Catégorie">
                    <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={selectCls}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                    </select>
                  </Field>
                  <Field label="Niveau">
                    <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className={selectCls}>
                      {LEVELS.map(l => <option key={l}>{l}</option>)}
                    </select>
                  </Field>
                  <Field label="Durée">
                    <input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} className={inputCls} placeholder="ex: 3 mois" />
                  </Field>
                  <Field label="Prix (XAF)">
                    <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={inputCls} placeholder="150000" />
                  </Field>
                  <Field label="Langue">
                    <select value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} className={selectCls}>
                      {LANGS.map(({ v, l }) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </Field>
                  <Field label="Statut">
                    <select value={form.isPublished ? 'published' : 'draft'} onChange={(e) => setForm({ ...form, isPublished: e.target.value === 'published' })} className={selectCls}>
                      <option value="draft">Brouillon</option>
                      <option value="published">Publié</option>
                    </select>
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Image de couverture">
                    <input type="file" accept="image/*" onChange={(e) => setThumbFile(e.target.files[0])} className={`${inputCls} file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white file:cursor-pointer`} />
                  </Field>
                  <Field label="Document Syllabus (PDF)">
                    <input type="file" accept="application/pdf" onChange={(e) => setSyllabusFile(e.target.files[0])} className={`${inputCls} file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white file:cursor-pointer`} />
                  </Field>
                </div>

                <Field label="Description">
                  <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${inputCls} resize-none`} placeholder="Description du programme..." />
                </Field>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={closeModal} className="flex-1 py-3 rounded-xl border border-white/10 text-slate-300 bg-transparent hover:bg-white/5 cursor-pointer transition-colors">{t('dashboard.actions.cancel')}</button>
                  <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer border-none transition-colors disabled:opacity-60">
                    {saving ? t('dashboard.actions.saving') : modal.type === 'Create' ? t('dashboard.actions.create') : t('dashboard.actions.save')}
                  </button>
                </div>
              </form>
            )}

            {modal.type === 'View' && (
              <>
                <h3 className="text-white font-black text-xl mb-4">{modal.row.title}</h3>
                
                {modal.row.thumbnail && (
                  <div className="w-full h-44 rounded-xl overflow-hidden border border-white/10 bg-slate-900 flex items-center justify-center mb-4">
                    <img src={`${API_URL}${modal.row.thumbnail}`} alt={modal.row.title} className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 bg-white/5 rounded-xl p-4 border border-white/10 mb-6">
                  {[['Catégorie', modal.row.category], ['Niveau', modal.row.level], ['Durée', modal.row.duration || '—'], ['Prix', modal.row.price ? `${modal.row.price} XAF` : '—'], ['Langue', modal.row.language], ['Statut', modal.row.isPublished ? 'Publié' : 'Brouillon']].map(([label, val]) => (
                    <div key={label}><span className="text-[0.65rem] text-slate-500 uppercase tracking-widest block mb-1">{label}</span><strong className="text-white text-sm">{val}</strong></div>
                  ))}
                </div>
                {modal.row.description && <p className="text-slate-400 text-sm mb-6">{modal.row.description}</p>}

                {modal.row.syllabus && (
                  <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                    <div>
                      <span className="text-[0.65rem] text-emerald-400 font-bold uppercase tracking-wider block">Document Syllabus</span>
                      <strong className="text-white text-sm">Syllabus_{modal.row.level}.pdf</strong>
                    </div>
                    <button
                      onClick={() => setPreviewFile({
                        url: modal.row.syllabus,
                        name: `Syllabus ${modal.row.title}`,
                        type: 'pdf'
                      })}
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer border-none"
                    >
                      👁️ Aperçu interactif
                    </button>
                  </div>
                )}

                <div className="flex gap-3">
                  <button onClick={closeModal} className="flex-1 py-3 rounded-xl border border-white/10 text-slate-300 bg-transparent hover:bg-white/5 cursor-pointer transition-colors">{t('dashboard.actions.cancel')}</button>
                  <button onClick={() => openModal('Edit', modal.row)} className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer border-none transition-colors">{t('dashboard.actions.edit')}</button>
                </div>
              </>
            )}

            {modal.type === 'Delete' && (
              <>
                <h3 className="text-white font-black text-xl mb-4">{t('dashboard.screens.programs.delete_program')}</h3>
                <p className="text-slate-400 mb-6">{t('dashboard.actions.confirm_delete')} <strong className="text-white">{modal.row.title}</strong> ? Cette action est irréversible.</p>
                <div className="flex gap-3">
                  <button onClick={closeModal} className="flex-1 py-3 rounded-xl border border-white/10 text-slate-300 bg-transparent hover:bg-white/5 cursor-pointer transition-colors">{t('dashboard.actions.cancel')}</button>
                  <button onClick={handleDelete} disabled={saving} className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold cursor-pointer border-none transition-colors disabled:opacity-60">
                    {saving ? t('dashboard.actions.saving') : t('dashboard.actions.delete')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <FilePreviewModal
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        fileUrl={previewFile?.url}
        fileName={previewFile?.name}
        fileType={previewFile?.type}
      />
    </>
  );
};

export default ManagePrograms;
