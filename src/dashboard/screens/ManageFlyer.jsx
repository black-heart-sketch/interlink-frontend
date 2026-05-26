import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import DataTable from '../components/DataTable';
import Loader from '../components/Loader';
import StatusBadge from '../components/StatusBadge';
import { mediaService } from '../../services/mediaService';

const EMPTY_FORM = { title: '', channel: '', url: '', startDate: '', endDate: '', status: 'Review', type: 'flyer' };

function ManageFlyer() {
  const { t } = useTranslation();

  const columns = [
    { key: 'title', header: t('dashboard.screens.flyers.campaign', 'Campagne'), render: (row) => <span className="font-bold text-white">{row.title}</span> },
    { key: 'channel', header: t('dashboard.screens.flyers.channel', 'Canal'), render: (row) => row.channel || '—' },
    { key: 'startDate', header: t('dashboard.screens.flyers.start_date', 'Début'), render: (row) => row.startDate ? new Date(row.startDate).toLocaleDateString('fr-FR') : '—' },
    { key: 'endDate', header: t('dashboard.screens.flyers.end_date', 'Fin'), render: (row) => row.endDate ? new Date(row.endDate).toLocaleDateString('fr-FR') : '—' },
    { key: 'url', header: t('dashboard.screens.flyers.file', 'Fichier'), render: (row) => <a href={row.url} target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline text-xs truncate block max-w-[160px]">{t('dashboard.screens.flyers.view_flyer', 'Voir le flyer')}</a> },
    { key: 'status', header: t('dashboard.screens.flyers.status', 'Statut'), render: (row) => <StatusBadge value={row.status} /> },
  ];
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchFlyers = async () => {
    try {
      const data = await mediaService.getMedia('flyer');
      setRows(data);
    } catch { toast.error('Erreur chargement'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchFlyers(); }, []);

  const handleAction = (type, row) => {
    setModalState({ type, row });
    if (type === 'Create') setForm(EMPTY_FORM);
    if (type === 'Edit') setForm({ title: row.title, channel: row.channel, url: row.url, startDate: row.startDate?.split('T')[0] || '', endDate: row.endDate?.split('T')[0] || '', status: row.status, type: 'flyer' });
  };
  const closeModal = () => { setModalState(null); setForm(EMPTY_FORM); };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await mediaService.createMedia({ ...form, type: 'flyer' });
      toast.success('Flyer ajouté !'); fetchFlyers(); closeModal();
    } catch { toast.error('Erreur sauvegarde'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await mediaService.deleteMedia(modalState.row._id);
      toast.success('Flyer supprimé'); fetchFlyers(); closeModal();
    } catch { toast.error('Erreur suppression'); }
    finally { setSaving(false); }
  };

  if (loading) return <Loader />;

  return (
    <>
      <DataTable title={t('dashboard.screens.flyers.title', 'Supports Marketing')} rows={rows} columns={columns} searchPlaceholder={t('dashboard.actions.search', 'Rechercher une campagne...')} filters={['Live', 'Scheduled', 'Review']} addAction={`+ ${t('dashboard.screens.flyers.upload_flyer', 'Uploader un Flyer')}`} onAction={handleAction} />

      {modalState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onMouseDown={closeModal}>
          <div className="relative bg-[#0f172a] border border-white/10 rounded-2xl p-8 w-full max-w-lg shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
            <button onClick={closeModal} className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl cursor-pointer bg-transparent border-none">×</button>

            {(modalState.type === 'Create' || modalState.type === 'Edit') && (
              <form onSubmit={handleSave} className="space-y-4">
                <h3 className="text-white font-black text-xl mb-2">{modalState.type === 'Create' ? t('dashboard.screens.flyers.upload_flyer') : t('dashboard.actions.edit')}</h3>
                <label className="flex flex-col gap-2"><span className="text-slate-400 text-sm font-semibold">{t('dashboard.screens.flyers.campaign')}</span>
                  <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500/60" placeholder="ex: Summer Intake 2026" />
                </label>
                <label className="flex flex-col gap-2"><span className="text-slate-400 text-sm font-semibold">{t('dashboard.screens.flyers.file')} (URL)</span>
                  <input required value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500/60" placeholder="https://..." />
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex flex-col gap-2"><span className="text-slate-400 text-sm font-semibold">{t('dashboard.screens.flyers.channel')}</span>
                    <input value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500/60" placeholder="Enrollment, Social..." />
                  </label>
                  <label className="flex flex-col gap-2"><span className="text-slate-400 text-sm font-semibold">{t('dashboard.screens.flyers.status')}</span>
                    <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none">
                      {['Review', 'Scheduled', 'Live', 'Archived'].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </label>
                  <label className="flex flex-col gap-2"><span className="text-slate-400 text-sm font-semibold">{t('dashboard.screens.flyers.start_date')}</span>
                    <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none" />
                  </label>
                  <label className="flex flex-col gap-2"><span className="text-slate-400 text-sm font-semibold">{t('dashboard.screens.flyers.end_date')}</span>
                    <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none" />
                  </label>
                </div>
                <div className="flex gap-3 mt-2">
                  <button type="button" onClick={closeModal} className="flex-1 py-3 rounded-xl border border-white/10 text-slate-300 bg-transparent hover:bg-white/5 cursor-pointer transition-colors">{t('dashboard.actions.cancel', 'Annuler')}</button>
                  <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold cursor-pointer border-none transition-colors disabled:opacity-60">{saving ? t('dashboard.actions.saving', 'Sauvegarde...') : t('dashboard.actions.save', 'Enregistrer')}</button>
                </div>
              </form>
            )}

            {modalState.type === 'Delete' && (
              <>
                <h3 className="text-white font-black text-xl mb-4">{t('dashboard.actions.delete', 'Supprimer')}</h3>
                <p className="text-slate-400 mb-6">{t('dashboard.actions.confirm_delete')} <strong className="text-white">{modalState.row.title}</strong> ?</p>
                <div className="flex gap-3">
                  <button onClick={closeModal} className="flex-1 py-3 rounded-xl border border-white/10 text-slate-300 bg-transparent hover:bg-white/5 cursor-pointer transition-colors">{t('dashboard.actions.cancel', 'Annuler')}</button>
                  <button onClick={handleDelete} disabled={saving} className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold cursor-pointer border-none transition-colors disabled:opacity-60">{saving ? t('dashboard.actions.saving', 'Suppression...') : t('dashboard.actions.delete', 'Supprimer')}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default ManageFlyer;
