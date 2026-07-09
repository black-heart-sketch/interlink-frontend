import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Loader from '../components/Loader';
import { userService } from '../../services/userService';
import FilePreviewModal, { getThumbnailUrl } from '../../components/public/FilePreviewModal';
import { API_ORIGIN } from '../../config/apiConfig';

const ROLES = ['student', 'teacher', 'advisor', 'admin', 'superadmin', 'partner'];
const STATUSES = ['active', 'inactive', 'pending', 'banned'];
const STUDY_MODES = [
  { value: 'online', label: 'Online' },
  { value: 'on_site', label: 'On-site' },
];
const LEVELS = ['none', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const EMPTY_FORM = { firstName: '', lastName: '', email: '', phone: '', password: '', role: 'student', status: 'active', studyMode: 'online', registeredLevel: 'none' };

const ROLE_COLORS = {
  superadmin: 'bg-purple-500/10 text-purple-400',
  admin: 'bg-blue-500/10 text-blue-400',
  teacher: 'bg-emerald-500/10 text-emerald-400',
  advisor: 'bg-amber-500/10 text-amber-400',
  student: 'bg-slate-500/10 text-slate-400',
  partner: 'bg-pink-500/10 text-pink-400',
};

const API_URL = API_ORIGIN;
const formatXaf = (amount) => `${Number(amount || 0).toLocaleString('fr-FR')} XAF`;

function F({ label, children }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-slate-400 text-sm font-semibold">{label}</span>
      {children}
    </label>
  );
}

const columns = (t) => [
  {
    key: 'name', header: t('dashboard.screens.users.name', 'Utilisateur'),
    render: (row) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
          {(row.firstName?.[0] || row.email?.[0] || '?').toUpperCase()}
        </div>
        <div>
          <div className="font-bold text-white">{row.firstName} {row.lastName}</div>
          <div className="text-xs text-slate-400">{row.email}</div>
        </div>
      </div>
    ),
  },
  {
    key: 'role', header: t('dashboard.screens.users.role', 'Rôle'),
    render: (row) => (
      <span className={`px-3 py-1 rounded-[5px] text-[0.6rem] font-black uppercase tracking-[0.2em] ${ROLE_COLORS[row.role] || 'bg-slate-500/10 text-slate-400'}`}>
        {row.role}
      </span>
    ),
  },
  {
    key: 'studyMode',
    header: 'Type',
    render: (row) => (
      <span className="bg-blue-500/10 text-blue-300 px-2 py-1 rounded text-xs font-bold">
        {row.studyMode === 'on_site' ? 'On-site' : 'Online'}
      </span>
    ),
  },
  {
    key: 'registeredLevel',
    header: 'Niveau',
    render: (row) => row.registeredLevel && row.registeredLevel !== 'none' ? (
      <span className="bg-amber-500/10 text-amber-300 px-2 py-1 rounded text-xs font-bold">{row.registeredLevel}</span>
    ) : '—',
  },
  { key: 'phone', header: 'Téléphone', render: (row) => row.phone || '—' },
  { key: 'status', header: 'Statut', render: (row) => <StatusBadge value={row.status} /> },
  { key: 'createdAt', header: 'Inscrit le', render: (row) => new Date(row.createdAt).toLocaleDateString('fr-FR') },
];

function ManageUsers() {
  const { t } = useTranslation();
  const [userList, setUserList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [accessSummary, setAccessSummary] = useState(null);
  const [accessLoading, setAccessLoading] = useState(false);

  const fetchData = async () => {
    try {
      const users = await userService.getUsers();
      setUserList(users);
    } catch { toast.error('Erreur de chargement des utilisateurs'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const openModal = (type, row = null) => {
    setModal({ type, row });
    setAccessSummary(null);
    if (type === 'Edit' && row) {
      setForm({
        firstName: row.firstName || '',
        lastName: row.lastName || '',
        email: row.email || '',
        phone: row.phone || '',
        password: '',
        role: row.role || 'student',
        status: row.status || 'active',
        studyMode: row.studyMode || 'online',
        registeredLevel: row.registeredLevel || 'none',
      });
    } else {
      setForm(EMPTY_FORM);
    }

    if (type === 'View' && row?.role === 'student') {
      setAccessLoading(true);
      userService.getAccessSummary(row._id)
        .then(setAccessSummary)
        .catch(() => setAccessSummary(null))
        .finally(() => setAccessLoading(false));
    }
  };
  const closeModal = () => { setModal(null); setForm(EMPTY_FORM); setAccessSummary(null); };
  const handleAction = (type, row) => {
    if (type === 'Create') return openModal('Create');
    openModal(type, row);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.password || form.password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    setSaving(true);
    try {
      await userService.createUser(form);
      toast.success('Utilisateur créé !');
      fetchData();
      closeModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la création');
    } finally { setSaving(false); }
  };

  const handleValidate = async () => {
    setSaving(true);
    try {
      await userService.validateUser(modal.row._id);
      toast.success(`${modal.row.firstName} ${modal.row.lastName} validé(e) !`);
      fetchData();
      closeModal();
    } catch { toast.error('Erreur lors de la validation'); }
    finally { setSaving(false); }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      await userService.updateUser(modal.row._id, payload);
      toast.success('Utilisateur mis à jour');
      fetchData();
      closeModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await userService.deleteUser(modal.row._id);
      toast.success('Utilisateur supprimé');
      fetchData();
      closeModal();
    } catch { toast.error('Erreur lors de la suppression'); }
    finally { setSaving(false); }
  };

  const inputCls = "bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500/60 transition-colors";
  const selectCls = "bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500/60 transition-colors";

  if (loading) return <Loader />;

  return (
    <>
      <DataTable
        title={t('dashboard.screens.users.title')}
        rows={userList}
        columns={columns(t)}
        searchPlaceholder={t('dashboard.actions.search')}
        filters={ROLES}
        addAction={`+ ${t('dashboard.screens.users.add_user')}`}
        onAction={handleAction}
      />

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm overflow-y-auto py-8" onMouseDown={closeModal}>
          <div className="relative bg-[#0f172a] border border-white/10 rounded-2xl p-8 w-full max-w-lg shadow-2xl mx-4" onMouseDown={(e) => e.stopPropagation()}>
            <button onClick={closeModal} className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl cursor-pointer bg-transparent border-none">×</button>

            {/* CREATE */}
            {modal.type === 'Create' && (
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="mb-2">
                  <h3 className="text-white font-black text-xl">{t('dashboard.screens.users.add_user')}</h3>
                  <p className="text-slate-500 text-sm mt-1">Créer un compte avec un rôle spécifique.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <F label="Prénom"><input required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className={inputCls} placeholder="Jean" /></F>
                  <F label="Nom"><input required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className={inputCls} placeholder="Dupont" /></F>
                </div>
                <F label="Adresse Email"><input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} placeholder="jean@einstein.com" /></F>
                <F label="Téléphone"><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} placeholder="+237 6XX XXX XXX" /></F>
                <div className="grid grid-cols-2 gap-4">
                  <F label="Mot de passe"><input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputCls} placeholder="Min. 6 caractères" /></F>
                  <F label="Rôle">
                    <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={selectCls}>
                      {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                    </select>
                  </F>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <F label="Statut">
                    <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={selectCls}>
                      {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                  </F>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <F label="Type d'étudiant">
                    <select value={form.studyMode} onChange={(e) => setForm({ ...form, studyMode: e.target.value, registeredLevel: e.target.value === 'online' ? 'none' : (form.registeredLevel === 'none' ? 'A1' : form.registeredLevel) })} className={selectCls}>
                      {STUDY_MODES.map(mode => <option key={mode.value} value={mode.value}>{mode.label}</option>)}
                    </select>
                  </F>
                  <F label="Niveau inscrit">
                    <select value={form.registeredLevel} disabled={form.studyMode === 'online'} onChange={(e) => setForm({ ...form, registeredLevel: e.target.value })} className={`${selectCls} disabled:cursor-not-allowed disabled:opacity-50`}>
                      {LEVELS.map(level => <option key={level} value={level}>{level === 'none' ? '— Aucun —' : level}</option>)}
                    </select>
                  </F>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={closeModal} className="flex-1 py-3 rounded-xl border border-white/10 text-slate-300 bg-transparent hover:bg-white/5 cursor-pointer transition-colors">{t('dashboard.actions.cancel')}</button>
                  <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer border-none transition-colors disabled:opacity-60">
                    {saving ? t('dashboard.actions.saving') : t('dashboard.actions.create')}
                  </button>
                </div>
              </form>
            )}

            {/* EDIT */}
            {modal.type === 'Edit' && (
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="mb-2">
                  <h3 className="text-white font-black text-xl">Modifier l'utilisateur</h3>
                  <p className="text-slate-500 text-sm mt-1">Mettre à jour le profil, le rôle et le statut du compte.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <F label="Prénom"><input required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className={inputCls} /></F>
                  <F label="Nom"><input required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className={inputCls} /></F>
                </div>
                <F label="Adresse Email"><input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} /></F>
                <F label="Téléphone"><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} /></F>
                <F label="Nouveau mot de passe"><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputCls} placeholder="Laisser vide pour conserver" /></F>
                <div className="grid grid-cols-2 gap-4">
                  <F label="Rôle">
                    <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={selectCls}>
                      {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                    </select>
                  </F>
                  <F label="Statut">
                    <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={selectCls}>
                      {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                  </F>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <F label="Type d'étudiant">
                    <select value={form.studyMode} onChange={(e) => setForm({ ...form, studyMode: e.target.value, registeredLevel: e.target.value === 'online' ? 'none' : (form.registeredLevel === 'none' ? 'A1' : form.registeredLevel) })} className={selectCls}>
                      {STUDY_MODES.map(mode => <option key={mode.value} value={mode.value}>{mode.label}</option>)}
                    </select>
                  </F>
                  <F label="Niveau inscrit">
                    <select value={form.registeredLevel} disabled={form.studyMode === 'online'} onChange={(e) => setForm({ ...form, registeredLevel: e.target.value })} className={`${selectCls} disabled:cursor-not-allowed disabled:opacity-50`}>
                      {LEVELS.map(level => <option key={level} value={level}>{level === 'none' ? '— Aucun —' : level}</option>)}
                    </select>
                  </F>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={closeModal} className="flex-1 py-3 rounded-xl border border-white/10 text-slate-300 bg-transparent hover:bg-white/5 cursor-pointer transition-colors">{t('dashboard.actions.cancel')}</button>
                  <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer border-none transition-colors disabled:opacity-60">
                    {saving ? t('dashboard.actions.saving') : 'Enregistrer'}
                  </button>
                </div>
              </form>
            )}

            {/* VIEW */}
            {modal.type === 'View' && (
              <>
                <h3 className="text-white font-black text-xl mb-6">Profil Utilisateur</h3>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-black text-2xl">
                    {(modal.row.firstName?.[0] || '?').toUpperCase()}
                  </div>
                  <div>
                    <div className="text-white font-bold text-lg">{modal.row.firstName} {modal.row.lastName}</div>
                    <div className="text-slate-400 text-sm">{modal.row.email}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 bg-white/5 rounded-xl p-4 border border-white/10 mb-4">
                  {[
                    ['Rôle', modal.row.role],
                    ['Statut', modal.row.status],
                    ['Accès plateforme', modal.row.platformAccessOverride ? 'Validé manuellement' : 'Standard'],
                    ['Type', modal.row.studyMode === 'on_site' ? 'On-site' : 'Online'],
                    ['Niveau inscrit', modal.row.registeredLevel && modal.row.registeredLevel !== 'none' ? modal.row.registeredLevel : '—'],
                    ['Téléphone', modal.row.phone || '—'],
                    ['Inscrit le', new Date(modal.row.createdAt).toLocaleDateString('fr-FR')]
                  ].map(([label, val]) => (
                    <div key={label}>
                      <span className="text-[0.65rem] text-slate-500 uppercase tracking-widest block mb-1">{label}</span>
                      <strong className="text-white text-sm">{val}</strong>
                    </div>
                  ))}
                </div>

                {modal.row.role === 'student' && (
                  <div className="mb-4 rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-blue-300">Accès & Paiements</span>
                        <h4 className="mt-1 text-sm font-black text-white">Statut étudiant</h4>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${accessSummary?.platformAccess ? 'bg-emerald-500/10 text-emerald-300' : 'bg-amber-500/10 text-amber-300'}`}>
                        {accessLoading ? 'Chargement...' : accessSummary?.platformAccess ? 'Accès ouvert' : 'Accès bloqué'}
                      </span>
                    </div>

                    {accessLoading ? (
                      <p className="mt-4 text-sm text-slate-500">Chargement des informations...</p>
                    ) : accessSummary ? (
                      <>
                        <div className="mt-4 grid grid-cols-2 gap-3">
                          {[
                            ['Inscription', accessSummary.registrationPaid ? 'Payée' : accessSummary.manuallyValidated ? 'Validée manuellement' : 'Non payée'],
                            ['Demande admission', accessSummary.application?.status || 'Aucune'],
                            ['Frais internship', formatXaf(accessSummary.internshipFee)],
                            ['Déjà payé', formatXaf(accessSummary.amountPaid)],
                            ['Paiement en attente', formatXaf(accessSummary.pendingAmount)],
                            ['Reste à payer', formatXaf(accessSummary.remainingAmount)],
                          ].map(([label, value]) => (
                            <div key={label} className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
                              <span className="block text-[0.62rem] font-black uppercase tracking-[0.14em] text-slate-500">{label}</span>
                              <strong className="mt-1 block text-xs text-white">{value}</strong>
                            </div>
                          ))}
                        </div>
                        <p className="mt-3 text-xs leading-5 text-slate-500">
                          L'accès plateforme peut être ouvert par paiement d'inscription ou validation manuelle. Les frais internship restent visibles mais ne bloquent pas l'accès.
                        </p>
                      </>
                    ) : (
                      <p className="mt-4 text-sm text-slate-500">Résumé indisponible.</p>
                    )}
                  </div>
                )}

                {/* Payment receipt */}
                {modal.row.paymentReceiptUrl && (
                  <div className="mb-4">
                    <p className="text-[0.65rem] text-slate-500 uppercase tracking-widest mb-2">Reçu de paiement</p>
                    <button
                      onClick={() => setPreviewFile({
                        url: modal.row.paymentReceiptUrl,
                        name: `Reçu - ${modal.row.firstName} ${modal.row.lastName}`,
                        type: modal.row.paymentReceiptUrl.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image'
                      })}
                      className="w-full text-left group relative flex items-center gap-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-3 transition-all hover:scale-[1.02] cursor-pointer"
                    >
                      <div className="w-14 h-14 rounded-xl bg-slate-950/40 overflow-hidden flex-shrink-0 border border-white/5 flex items-center justify-center relative">
                        <img
                          src={getThumbnailUrl(modal.row.paymentReceiptUrl)}
                          alt="Reçu miniature"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                          className="w-full h-full object-cover"
                        />
                        <div className="hidden absolute inset-0 items-center justify-center bg-slate-900">
                          <span className="text-xl">🧾</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-bold text-sm truncate group-hover:text-amber-400 transition-colors">
                          Voir le reçu de paiement
                        </h4>
                        <p className="text-xs text-slate-400 mt-1 truncate">
                          Cliquez pour un aperçu interactif
                        </p>
                      </div>
                    </button>
                  </div>
                )}

                {/* Validate button for pending users */}
                {modal.row.role === 'student' && !modal.row.platformAccessOverride && (
                  <button onClick={handleValidate} disabled={saving}
                    className="w-full mb-3 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer border-none transition-colors disabled:opacity-60">
                    {saving ? 'Validation...' : 'Valider et donner accès à la plateforme'}
                  </button>
                )}
                <button onClick={closeModal} className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer border-none transition-colors">{t('dashboard.actions.cancel')}</button>
              </>
            )}

            {/* DELETE */}
            {modal.type === 'Delete' && (
              <>
                <h3 className="text-white font-black text-xl mb-4">Supprimer l'utilisateur</h3>
                <p className="text-slate-400 mb-6">{t('dashboard.actions.confirm_delete')} <strong className="text-white">{modal.row.firstName} {modal.row.lastName}</strong> ? Cette action est irréversible.</p>
                <div className="flex gap-3">
                  <button onClick={closeModal} className="flex-1 py-3 rounded-xl border border-white/10 text-slate-300 bg-transparent hover:bg-white/5 cursor-pointer transition-colors">{t('dashboard.actions.cancel')}</button>
                  <button onClick={handleDelete} disabled={saving} className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold cursor-pointer border-none transition-colors disabled:opacity-60">
                    {saving ? t('dashboard.actions.saving') : t('dashboard.actions.delete')}
                  </button>
                </div>
              </>
            )}

            {/* MORE */}
            {modal.type === 'More' && (
              <>
                <h3 className="text-white font-black text-xl mb-2">Actions rapides</h3>
                <p className="text-slate-500 mb-6">Choisissez une opération administrative pour <strong className="text-white">{modal.row.firstName} {modal.row.lastName}</strong>.</p>
                <div className="grid gap-3">
                  <button onClick={() => openModal('View', modal.row)} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-slate-200 hover:bg-white/10 transition-colors">
                    <i className="fa-solid fa-eye text-blue-400"></i>
                    Voir le profil complet
                  </button>
                  <button onClick={() => openModal('Edit', modal.row)} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-slate-200 hover:bg-white/10 transition-colors">
                    <i className="fa-solid fa-pen text-emerald-400"></i>
                    Modifier les informations
                  </button>
                  {modal.row.role === 'student' && !modal.row.platformAccessOverride && (
                    <button onClick={handleValidate} disabled={saving} className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-left text-emerald-300 hover:bg-emerald-500/20 transition-colors">
                      <i className="fa-solid fa-user-check"></i>
                      Valider et donner accès à la plateforme
                    </button>
                  )}
                  <button onClick={() => openModal('Delete', modal.row)} className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-left text-red-300 hover:bg-red-500/20 transition-colors">
                    <i className="fa-solid fa-trash"></i>
                    Supprimer cet utilisateur
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
}

export default ManageUsers;
