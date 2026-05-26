import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import DataTable from '../components/DataTable';
import Loader from '../components/Loader';
import { studyLanguageService } from '../../services/studyLanguageService';

const EMPTY_FORM = { name: '', code: '', isActive: true };

function FormField({ label, children }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-slate-400 text-sm font-semibold">{label}</span>
      {children}
    </label>
  );
}

const columns = [
  { key: 'name', header: 'Langue', render: (row) => (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-xs">
        {row.code?.toUpperCase()}
      </div>
      <span className="font-bold text-white">{row.name}</span>
    </div>
  )},
  { key: 'code', header: 'Code', render: (row) => <span className="font-mono text-slate-400 text-sm">{row.code}</span> },
  { key: 'isActive', header: 'Statut', render: (row) => (
    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${row.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
      {row.isActive ? 'Actif' : 'Inactif'}
    </span>
  )},
  { key: 'createdAt', header: 'Créé le', render: (row) => new Date(row.createdAt).toLocaleDateString('fr-FR') },
];

export default function ManageStudyLanguages() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try { setItems(await studyLanguageService.getLanguages()); }
    catch { toast.error('Erreur de chargement'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const openModal = (type, row = null) => {
    setModal({ type, row });
    setForm(row ? { name: row.name, code: row.code, isActive: row.isActive } : EMPTY_FORM);
  };
  const closeModal = () => { setModal(null); setForm(EMPTY_FORM); };

  const handleAction = (type, row) => {
    if (type === 'Create') return openModal('Create');
    openModal(type, row);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.code) { toast.error('Nom et code requis'); return; }
    setSaving(true);
    try {
      if (modal.type === 'Edit') {
        await studyLanguageService.updateLanguage(modal.row._id, form);
        toast.success('Langue mise à jour !');
      } else {
        await studyLanguageService.createLanguage(form);
        toast.success('Langue créée !');
      }
      fetchData(); closeModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await studyLanguageService.deleteLanguage(modal.row._id);
      toast.success('Langue supprimée');
      fetchData(); closeModal();
    } catch { toast.error('Erreur lors de la suppression'); }
    finally { setSaving(false); }
  };

  const inputCls = "bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500/60 transition-colors w-full";
  const selectCls = "bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500/60 transition-colors w-full";

  if (loading) return <Loader />;

  return (
    <>
      <DataTable
        title="Langues d'Étude"
        rows={items}
        columns={columns}
        searchPlaceholder="Rechercher une langue..."
        addAction="+ Ajouter une langue"
        onAction={handleAction}
      />

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm py-8" onMouseDown={closeModal}>
          <div className="relative bg-[#0f172a] border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-2xl mx-4" onMouseDown={e => e.stopPropagation()}>
            <button onClick={closeModal} className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl cursor-pointer bg-transparent border-none">×</button>

            {(modal.type === 'Create' || modal.type === 'Edit') && (
              <form onSubmit={handleSave} className="space-y-4">
                <div className="mb-2">
                  <h3 className="text-white font-black text-xl">{modal.type === 'Edit' ? 'Modifier la langue' : 'Nouvelle langue d\'étude'}</h3>
                  <p className="text-slate-500 text-sm mt-1">Les étudiants sélectionneront cette langue lors de l'inscription.</p>
                </div>
                <FormField label="Nom de la langue">
                  <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="Allemand" />
                </FormField>
                <FormField label="Code (abréviation)">
                  <input required value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toLowerCase() })} className={inputCls} placeholder="de" maxLength={5} />
                </FormField>
                <FormField label="Statut">
                  <select value={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.value === 'true' })} className={selectCls}>
                    <option value="true">Actif</option>
                    <option value="false">Inactif</option>
                  </select>
                </FormField>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={closeModal} className="flex-1 py-3 rounded-xl border border-white/10 text-slate-300 bg-transparent hover:bg-white/5 cursor-pointer transition-colors">Annuler</button>
                  <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer border-none transition-colors disabled:opacity-60">
                    {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                  </button>
                </div>
              </form>
            )}

            {modal.type === 'Delete' && (
              <>
                <h3 className="text-white font-black text-xl mb-4">Supprimer la langue</h3>
                <p className="text-slate-400 mb-6">Êtes-vous sûr de vouloir supprimer <strong className="text-white">{modal.row.name}</strong> ? Cette action est irréversible.</p>
                <div className="flex gap-3">
                  <button onClick={closeModal} className="flex-1 py-3 rounded-xl border border-white/10 text-slate-300 bg-transparent hover:bg-white/5 cursor-pointer transition-colors">Annuler</button>
                  <button onClick={handleDelete} disabled={saving} className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold cursor-pointer border-none transition-colors disabled:opacity-60">
                    {saving ? 'Suppression...' : 'Supprimer'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
