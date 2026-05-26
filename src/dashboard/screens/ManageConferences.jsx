import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import DataTable from '../components/DataTable';
import Loader from '../components/Loader';
import StatusBadge from '../components/StatusBadge';
import { eventService } from '../../services/eventService';

const EMPTY_FORM = { title: '', speakers: '', location: '', date: '', attendees: 0, status: 'Scheduled', type: 'conference' };

function ManageConferences() {
  const { t } = useTranslation();

  const columns = [
    { key: 'title', header: t('dashboard.screens.conferences.conference', 'Conférence'), render: (row) => <span className="font-bold text-white">{row.title}</span> },
    { key: 'speakers', header: t('dashboard.screens.conferences.speakers', 'Intervenants'), render: (row) => <span className="text-slate-300">{row.speakers || '—'}</span> },
    { key: 'location', header: t('dashboard.screens.conferences.location', 'Lieu') },
    { key: 'date', header: t('dashboard.screens.conferences.date', 'Date'), render: (row) => new Date(row.date).toLocaleDateString('fr-FR') },
    { key: 'attendees', header: t('dashboard.screens.conferences.attendees', 'Participants'), render: (row) => <span className="text-purple-400 font-bold">{row.attendees}</span> },
    { key: 'status', header: t('dashboard.screens.conferences.status', 'Statut'), render: (row) => <StatusBadge value={row.status} /> },
  ];
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchConferences = async () => {
    try {
      const data = await eventService.getEvents('conference');
      setRows(data);
    } catch { toast.error('Erreur chargement'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchConferences(); }, []);

  const handleAction = (type, row) => {
    setModalState({ type, row });
    if (type === 'Create') setForm(EMPTY_FORM);
    if (type === 'Edit') setForm({ ...row, date: row.date?.split('T')[0] || '' });
  };
  const closeModal = () => { setModalState(null); setForm(EMPTY_FORM); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await eventService.createEvent({ ...form, type: 'conference' });
      toast.success('Conférence créée !');
      fetchConferences();
      closeModal();
    } catch { toast.error('Erreur sauvegarde'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await eventService.deleteEvent(modalState.row._id);
      toast.success('Conférence supprimée');
      fetchConferences();
      closeModal();
    } catch { toast.error('Erreur suppression'); }
    finally { setSaving(false); }
  };

  if (loading) return <Loader />;

  return (
    <>
      <DataTable
        title={t('dashboard.screens.conferences.title', 'Sommets Académiques')}
        rows={rows}
        columns={columns}
        searchPlaceholder={t('dashboard.actions.search', 'Rechercher une conférence...')}
        filters={['Scheduled', 'Published', 'Past']}
        addAction={`+ ${t('dashboard.screens.conferences.add_conference', 'Créer une Conférence')}`}
        onAction={handleAction}
      />

      {modalState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onMouseDown={closeModal}>
          <div className="relative bg-[#0f172a] border border-white/10 rounded-2xl p-8 w-full max-w-lg shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
            <button onClick={closeModal} className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl cursor-pointer bg-transparent border-none">×</button>

            {(modalState.type === 'Create' || modalState.type === 'Edit') && (
              <>
                <h3 className="text-white font-black text-xl mb-6">{modalState.type === 'Create' ? t('dashboard.screens.conferences.add_conference') : t('dashboard.actions.edit')}</h3>
                <form onSubmit={handleSave} className="space-y-4">
                  <label className="flex flex-col gap-2">
                    <span className="text-slate-400 text-sm font-semibold">{t('dashboard.screens.conferences.conference')}</span>
                    <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500/60" placeholder="ex: Study in Germany 2026" />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="text-slate-400 text-sm font-semibold">{t('dashboard.screens.conferences.speakers')}</span>
                    <input value={form.speakers} onChange={(e) => setForm({ ...form, speakers: e.target.value })}
                      className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500/60" placeholder="DAAD Advisor, Alumni Panel..." />
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex flex-col gap-2">
                      <span className="text-slate-400 text-sm font-semibold">{t('dashboard.screens.conferences.location')}</span>
                      <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500/60" placeholder="Douala / Online" />
                    </label>
                    <label className="flex flex-col gap-2">
                      <span className="text-slate-400 text-sm font-semibold">{t('dashboard.screens.conferences.date')}</span>
                      <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500/60" />
                    </label>
                    <label className="flex flex-col gap-2">
                      <span className="text-slate-400 text-sm font-semibold">{t('dashboard.screens.conferences.attendees')}</span>
                      <input type="number" value={form.attendees} onChange={(e) => setForm({ ...form, attendees: e.target.value })}
                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500/60" />
                    </label>
                    <label className="flex flex-col gap-2">
                      <span className="text-slate-400 text-sm font-semibold">{t('dashboard.screens.conferences.status')}</span>
                      <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                        className="bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500/60">
                        {['Scheduled', 'Published', 'Live', 'Past', 'Draft'].map(s => <option key={s}>{s}</option>)}
                      </select>
                    </label>
                  </div>
                  <div className="flex gap-3 mt-2">
                    <button type="button" onClick={closeModal} className="flex-1 py-3 rounded-xl border border-white/10 text-slate-300 bg-transparent hover:bg-white/5 cursor-pointer transition-colors">{t('dashboard.actions.cancel')}</button>
                    <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold cursor-pointer border-none transition-colors disabled:opacity-60">
                      {saving ? t('dashboard.actions.saving') : t('dashboard.actions.save')}
                    </button>
                  </div>
                </form>
              </>
            )}

            {modalState.type === 'Delete' && (
              <>
                <h3 className="text-white font-black text-xl mb-4">{t('dashboard.actions.delete')}</h3>
                <p className="text-slate-400 mb-6">{t('dashboard.actions.confirm_delete')} <strong className="text-white">{modalState.row.title}</strong> ?</p>
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
    </>
  );
}

export default ManageConferences;
