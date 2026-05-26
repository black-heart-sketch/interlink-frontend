import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import DataTable from '../components/DataTable';
import Loader from '../components/Loader';
import { crmService } from '../../services/crmService';

const CRM_STATUSES = ['new', 'contacted', 'meeting_set', 'test_taken', 'registration_pending', 'paid', 'active', 'abandoned', 'converted'];
const SOURCES = ['Website', 'Referral', 'Social Media', 'Walk-in', 'Event', 'Partner', 'Other'];
const STATUS_STYLES = {
  new: 'bg-slate-500/10 text-slate-400',
  contacted: 'bg-blue-500/10 text-blue-400',
  meeting_set: 'bg-indigo-500/10 text-indigo-400',
  test_taken: 'bg-purple-500/10 text-purple-400',
  registration_pending: 'bg-amber-500/10 text-amber-400',
  paid: 'bg-emerald-500/10 text-emerald-400',
  active: 'bg-green-500/10 text-green-400',
  abandoned: 'bg-red-500/10 text-red-400',
  converted: 'bg-teal-500/10 text-teal-400',
};

const EMPTY = { fullName: '', email: '', phone: '', interest: '', source: 'Website', status: 'new', priorityScore: 0 };

function F({ label, children }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-slate-400 text-sm font-semibold">{label}</span>
      {children}
    </label>
  );
}

function ManageLeads() {
  const { t } = useTranslation();
  const columns = [
    { key: 'fullName', header: t('dashboard.screens.leads.name', 'Prospect'), render: (row) => <span className="font-bold text-white">{row.fullName}</span> },
    { key: 'email', header: t('dashboard.screens.leads.email', 'Contact'), render: (row) => <div><div className="text-sm text-slate-300">{row.email}</div><div className="text-xs text-slate-500">{row.phone || '—'}</div></div> },
    { key: 'interest', header: 'Programme', render: (row) => row.interest || '—' },
    { key: 'source', header: 'Source', render: (row) => row.source || '—' },
    {
      key: 'status', header: t('dashboard.screens.leads.status', 'Statut CRM'),
      render: (row) => (
        <span className={`px-3 py-1 rounded-[5px] text-[0.6rem] font-black uppercase tracking-[0.2em] ${STATUS_STYLES[row.status] || 'bg-slate-500/10 text-slate-400'}`}>
          {t(`dashboard.status.${row.status}`, row.status?.replace('_', ' '))}
        </span>
      )
    },
    { key: 'createdAt', header: 'Ajouté le', render: (row) => new Date(row.createdAt).toLocaleDateString('fr-FR') },
  ];
  
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const fetch = async () => {
    try { setRows(await crmService.getLeads()); }
    catch { toast.error('Erreur de chargement'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const openModal = (type, row = null) => {
    setModal({ type, row });
    setForm(row ? { fullName: row.fullName, email: row.email || '', phone: row.phone || '', interest: row.interest || '', source: row.source || 'Website', status: row.status || 'new', priorityScore: row.priorityScore || 0 } : EMPTY);
  };
  const closeModal = () => { setModal(null); setForm(EMPTY); };
  const handleAction = (type, row) => openModal(type, row);

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (modal.type === 'Create') await crmService.createLead(form);
      else await crmService.updateLead(modal.row._id, form);
      toast.success(modal.type === 'Create' ? 'Prospect ajouté !' : 'Prospect mis à jour !');
      fetch(); closeModal();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try { await crmService.deleteLead(modal.row._id); toast.success('Prospect supprimé'); fetch(); closeModal(); }
    catch { toast.error('Erreur'); }
    finally { setSaving(false); }
  };

  const inputCls = "bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500/60 transition-colors";
  const selectCls = "bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500/60 transition-colors";

  if (loading) return <Loader />;

  return (
    <>
      <DataTable title={t('dashboard.screens.leads.title')} rows={rows} columns={columns} searchPlaceholder={t('dashboard.actions.search')} filters={['new', 'contacted', 'paid', 'converted']} addAction={`+ ${t('dashboard.screens.leads.add_lead')}`} onAction={handleAction} />

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm overflow-y-auto py-8" onMouseDown={closeModal}>
          <div className="relative bg-[#0f172a] border border-white/10 rounded-2xl p-8 w-full max-w-xl shadow-2xl mx-4" onMouseDown={(e) => e.stopPropagation()}>
            <button onClick={closeModal} className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl cursor-pointer bg-transparent border-none">×</button>

            {(modal.type === 'Create' || modal.type === 'Edit') && (
              <form onSubmit={handleSave} className="space-y-4">
                <div className="mb-2">
                  <h3 className="text-white font-black text-xl">{modal.type === 'Create' ? t('dashboard.screens.leads.add_lead') : t('dashboard.actions.edit')}</h3>
                  <p className="text-slate-500 text-sm mt-1">{modal.type === 'Edit' ? `Pipeline CRM — ${modal.row.fullName}` : 'Ajouter un prospect au pipeline d\'admission.'}</p>
                </div>
                <F label={t('dashboard.screens.leads.name')}>
                  <input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className={inputCls} placeholder="ex: Amina Traore" />
                </F>
                <div className="grid grid-cols-2 gap-4">
                  <F label="Email">
                    <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} placeholder="amina@email.com" />
                  </F>
                  <F label="Téléphone">
                    <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} placeholder="+237 6XX XXX XXX" />
                  </F>
                  <F label="Programme d'intérêt">
                    <input value={form.interest} onChange={(e) => setForm({ ...form, interest: e.target.value })} className={inputCls} placeholder="ex: Allemand B1" />
                  </F>
                  <F label="Source">
                    <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className={selectCls}>
                      {SOURCES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </F>
                  <F label="Statut CRM">
                    <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={selectCls}>
                      {CRM_STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                    </select>
                  </F>
                  <F label="Score priorité (0-10)">
                    <input type="number" min="0" max="10" value={form.priorityScore} onChange={(e) => setForm({ ...form, priorityScore: Number(e.target.value) })} className={inputCls} />
                  </F>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={closeModal} className="flex-1 py-3 rounded-xl border border-white/10 text-slate-300 bg-transparent hover:bg-white/5 cursor-pointer transition-colors">{t('dashboard.actions.cancel')}</button>
                  <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer border-none transition-colors disabled:opacity-60">
                    {saving ? t('dashboard.actions.saving') : modal.type === 'Create' ? t('dashboard.actions.create') : t('dashboard.actions.save')}
                  </button>
                </div>
              </form>
            )}

            {modal.type === 'View' && (
              <>
                <h3 className="text-white font-black text-xl mb-1">{modal.row.fullName}</h3>
                <span className={`inline-block mb-4 px-3 py-1 rounded-[5px] text-[0.6rem] font-black uppercase tracking-[0.2em] ${STATUS_STYLES[modal.row.status] || 'bg-slate-500/10 text-slate-400'}`}>{modal.row.status?.replace('_', ' ')}</span>
                <div className="grid grid-cols-2 gap-4 bg-white/5 rounded-xl p-4 border border-white/10 mb-6">
                  {[['Email', modal.row.email || '—'], ['Téléphone', modal.row.phone || '—'], ['Programme', modal.row.interest || '—'], ['Source', modal.row.source || '—'], ['Score', modal.row.priorityScore || 0], ['Ajouté le', new Date(modal.row.createdAt).toLocaleDateString('fr-FR')]].map(([l, v]) => (
                    <div key={l}><span className="text-[0.65rem] text-slate-500 uppercase tracking-widest block mb-1">{l}</span><strong className="text-white text-sm">{v}</strong></div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button onClick={closeModal} className="flex-1 py-3 rounded-xl border border-white/10 text-slate-300 bg-transparent hover:bg-white/5 cursor-pointer transition-colors">{t('dashboard.actions.cancel')}</button>
                  <button onClick={() => openModal('Edit', modal.row)} className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer border-none transition-colors">{t('dashboard.actions.edit')}</button>
                </div>
              </>
            )}

            {modal.type === 'Delete' && (
              <>
                <h3 className="text-white font-black text-xl mb-4">{t('dashboard.actions.delete')}</h3>
                <p className="text-slate-400 mb-6">{t('dashboard.actions.confirm_delete')} <strong className="text-white">{modal.row.fullName}</strong> du pipeline ? Cette action est irréversible.</p>
                <div className="flex gap-3">
                  <button onClick={closeModal} className="flex-1 py-3 rounded-xl border border-white/10 text-slate-300 bg-transparent hover:bg-white/5 cursor-pointer transition-colors">{t('dashboard.actions.cancel')}</button>
                  <button onClick={handleDelete} disabled={saving} className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold cursor-pointer border-none transition-colors disabled:opacity-60">{saving ? t('dashboard.actions.saving') : t('dashboard.actions.delete')}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default ManageLeads;
