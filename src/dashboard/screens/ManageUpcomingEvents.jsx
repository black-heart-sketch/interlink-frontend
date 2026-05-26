import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import DataTable from '../components/DataTable';
import Loader from '../components/Loader';
import StatusBadge from '../components/StatusBadge';
import { eventService } from '../../services/eventService';

const EMPTY_FORM = { title: '', date: '', time: '', location: '', attendees: 0, status: 'Draft', type: 'event' };

function ManageUpcomingEvents() {
  const { t } = useTranslation();

  const columns = [
    { key: 'title', header: t('dashboard.screens.upcoming_events.event', 'Événement'), render: (row) => <span className="font-bold text-white">{row.title}</span> },
    { key: 'date', header: t('dashboard.screens.upcoming_events.date', 'Date'), render: (row) => new Date(row.date).toLocaleDateString('fr-FR') },
    { key: 'time', header: t('dashboard.screens.upcoming_events.time', 'Heure'), render: (row) => row.time || '—' },
    { key: 'location', header: t('dashboard.screens.upcoming_events.location', 'Lieu') },
    { key: 'attendees', header: t('dashboard.screens.upcoming_events.attendees', 'Participants'), render: (row) => <span className="text-blue-400 font-bold">{row.attendees}</span> },
    { key: 'status', header: t('dashboard.screens.upcoming_events.status', 'Statut'), render: (row) => <StatusBadge value={row.status} /> },
  ];
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchEvents = async () => {
    try {
      const data = await eventService.getEvents('event');
      setRows(data);
    } catch { toast.error('Erreur lors du chargement'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchEvents(); }, []);

  const handleAction = (type, row) => {
    setModalState({ type, row });
    if (type === 'Edit') setForm({ ...row, date: row.date?.split('T')[0] || '' });
    if (type === 'Create') setForm(EMPTY_FORM);
  };

  const closeModal = () => { setModalState(null); setForm(EMPTY_FORM); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await eventService.createEvent({ ...form, type: 'event' });
      toast.success('Événement créé !');
      fetchEvents();
      closeModal();
    } catch { toast.error('Erreur lors de la sauvegarde'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await eventService.deleteEvent(modalState.row._id);
      toast.success('Événement supprimé');
      fetchEvents();
      closeModal();
    } catch { toast.error('Erreur lors de la suppression'); }
    finally { setSaving(false); }
  };

  if (loading) return <Loader />;

  return (
    <>
      <DataTable
        title={t('dashboard.screens.upcoming_events.title', 'Événements à Venir')}
        rows={rows}
        columns={columns}
        searchPlaceholder={t('dashboard.actions.search', 'Rechercher un événement...')}
        filters={['Draft', 'Published', 'Scheduled']}
        addAction={`+ ${t('dashboard.screens.upcoming_events.add_event', 'Ajouter un Événement')}`}
        onAction={handleAction}
      />

      {modalState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onMouseDown={closeModal}>
          <div className="relative bg-[#0f172a] border border-white/10 rounded-2xl p-8 w-full max-w-lg shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
            <button onClick={closeModal} className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl cursor-pointer bg-transparent border-none">×</button>

            {(modalState.type === 'Create' || modalState.type === 'Edit') && (
              <>
                <h3 className="text-white font-black text-xl mb-6">{modalState.type === 'Create' ? t('dashboard.screens.upcoming_events.add_event') : t('dashboard.actions.edit')}</h3>
                <form onSubmit={handleSave} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {[['title', t('dashboard.screens.upcoming_events.event', 'Titre'), 'text', true], ['location', t('dashboard.screens.upcoming_events.location', 'Lieu'), 'text', true]].map(([name, label, type, req]) => (
                      <label key={name} className="flex flex-col gap-2 col-span-2">
                        <span className="text-slate-400 text-sm font-semibold">{label}</span>
                        <input type={type} required={req} value={form[name] || ''} onChange={(e) => setForm({ ...form, [name]: e.target.value })}
                          className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 outline-none focus:border-blue-500/60" />
                      </label>
                    ))}
                    <label className="flex flex-col gap-2">
                      <span className="text-slate-400 text-sm font-semibold">{t('dashboard.screens.upcoming_events.date', 'Date')}</span>
                      <input type="date" required value={form.date || ''} onChange={(e) => setForm({ ...form, date: e.target.value })}
                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500/60" />
                    </label>
                    <label className="flex flex-col gap-2">
                      <span className="text-slate-400 text-sm font-semibold">{t('dashboard.screens.upcoming_events.time', 'Heure')}</span>
                      <input type="time" value={form.time || ''} onChange={(e) => setForm({ ...form, time: e.target.value })}
                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500/60" />
                    </label>
                    <label className="flex flex-col gap-2">
                      <span className="text-slate-400 text-sm font-semibold">{t('dashboard.screens.upcoming_events.attendees', 'Participants attendus')}</span>
                      <input type="number" value={form.attendees || 0} onChange={(e) => setForm({ ...form, attendees: e.target.value })}
                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500/60" />
                    </label>
                    <label className="flex flex-col gap-2">
                      <span className="text-slate-400 text-sm font-semibold">{t('dashboard.screens.upcoming_events.status', 'Statut')}</span>
                      <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                        className="bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500/60">
                        {['Draft', 'Scheduled', 'Published', 'Live', 'Past'].map(s => <option key={s}>{s}</option>)}
                      </select>
                    </label>
                  </div>
                  <div className="flex gap-3 mt-2">
                    <button type="button" onClick={closeModal} className="flex-1 py-3 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 cursor-pointer bg-transparent transition-colors">{t('dashboard.actions.cancel')}</button>
                    <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer border-none transition-colors disabled:opacity-60">
                      {saving ? t('dashboard.actions.saving') : t('dashboard.actions.save')}
                    </button>
                  </div>
                </form>
              </>
            )}

            {modalState.type === 'Delete' && (
              <>
                <h3 className="text-white font-black text-xl mb-4">{t('dashboard.actions.delete')}</h3>
                <p className="text-slate-400 mb-6">{t('dashboard.actions.confirm_delete')} <strong className="text-white">{modalState.row.title}</strong> ? Cette action est irréversible.</p>
                <div className="flex gap-3">
                  <button onClick={closeModal} className="flex-1 py-3 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 cursor-pointer bg-transparent transition-colors">{t('dashboard.actions.cancel')}</button>
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

export default ManageUpcomingEvents;
