import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import DataTable from '../components/DataTable';
import Loader from '../components/Loader';
import StatusBadge from '../components/StatusBadge';
import { userService } from '../../services/userService';
import FilePreviewModal, { getThumbnailUrl } from '../../components/public/FilePreviewModal';

const ACCOUNT_ROLES = ['student', 'teacher', 'advisor', 'admin', 'superadmin', 'partner', 'public'];
const ACCOUNT_FILTERS = ['All', ...ACCOUNT_ROLES, ...['active', 'inactive', 'pending', 'banned']];
const STATUSES = ['active', 'inactive', 'pending', 'banned'];
const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  role: 'student',
  status: 'active'
};

const ROLE_COLORS = {
  student: 'bg-slate-500/10 text-slate-300',
  admin: 'bg-blue-500/10 text-blue-400',
  superadmin: 'bg-purple-500/10 text-purple-400',
  teacher: 'bg-emerald-500/10 text-emerald-400',
  advisor: 'bg-amber-500/10 text-amber-400',
  partner: 'bg-pink-500/10 text-pink-400',
  public: 'bg-cyan-500/10 text-cyan-400'
};

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-slate-400">{label}</span>
      {children}
    </label>
  );
}

function initials(row) {
  return `${row?.firstName?.[0] || ''}${row?.lastName?.[0] || ''}`.trim().toUpperCase() || row?.email?.[0]?.toUpperCase() || '?';
}

function ManageMembers() {
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  const columns = [
    {
      key: 'name',
      header: t('dashboard.screens.members.member', 'Member'),
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.avatar ? (
            <img src={row.avatar} alt="" className="h-10 w-10 flex-shrink-0 rounded-full border border-white/10 object-cover" />
          ) : (
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-black text-white">
              {initials(row)}
            </div>
          )}
          <div className="min-w-0">
            <div className="truncate font-bold text-white">{row.firstName} {row.lastName}</div>
            <div className="truncate text-xs text-slate-400">{row.email}</div>
          </div>
        </div>
      )
    },
    {
      key: 'receipt',
      header: 'Receipt',
      render: (row) => row.paymentReceiptUrl ? (
        <button
          type="button"
          onClick={() => setPreviewFile({
            url: row.paymentReceiptUrl,
            name: `Receipt - ${row.firstName || ''} ${row.lastName || ''}`.trim(),
            type: row.paymentReceiptUrl.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image'
          })}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-amber-400/20 bg-amber-500/10 px-3 py-1.5 text-xs font-black text-amber-300 transition hover:bg-amber-500/20"
        >
          <i className="fa-solid fa-receipt"></i>
          View
        </button>
      ) : (
        <span className="text-xs font-semibold text-slate-500">No receipt</span>
      )
    },
    {
      key: 'role',
      header: t('dashboard.screens.members.role', 'Position'),
      render: (row) => (
        <span className={`rounded-[5px] px-3 py-1 text-[0.6rem] font-black uppercase tracking-[0.2em] ${ROLE_COLORS[row.role] || 'bg-slate-500/10 text-slate-400'}`}>
          {row.role}
        </span>
      )
    },
    { key: 'phone', header: t('dashboard.screens.members.contact', 'Contact'), render: (row) => row.phone || row.email },
    { key: 'status', header: t('dashboard.screens.members.status', 'Status'), render: (row) => <StatusBadge value={row.status} /> },
    { key: 'createdAt', header: t('dashboard.screens.members.joined', 'Joined'), render: (row) => row.createdAt ? new Date(row.createdAt).toLocaleDateString('fr-FR') : '—' },
  ];

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const data = await userService.getUsers();
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to load members.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMembers(); }, []);

  const openModal = (type, row = null) => {
    setModal({ type, row });
    if (type === 'Edit' && row) {
      setForm({
        firstName: row.firstName || '',
        lastName: row.lastName || '',
        email: row.email || '',
        phone: row.phone || '',
        password: '',
        role: ACCOUNT_ROLES.includes(row.role) ? row.role : 'student',
        status: row.status || 'active'
      });
      return;
    }
    if (type === 'Create') {
      setForm(EMPTY_FORM);
    }
  };

  const closeModal = () => {
    setModal(null);
    setForm(EMPTY_FORM);
  };

  const handleAction = (type, row) => {
    if (type === 'Create') return openModal('Create');
    openModal(type, row);
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!form.password || form.password.length < 6) {
      toast.error('Password must contain at least 6 characters.');
      return;
    }

    setSaving(true);
    try {
      await userService.createUser(form);
      toast.success('Member created successfully.');
      await fetchMembers();
      closeModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to create member.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      await userService.updateUser(modal.row._id, payload);
      toast.success('Member updated successfully.');
      await fetchMembers();
      closeModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to update member.');
    } finally {
      setSaving(false);
    }
  };

  const handleValidate = async () => {
    if (!modal.row.paymentReceiptUrl) {
      toast.error('Please review or request a payment receipt before approving this account.');
      return;
    }

    setSaving(true);
    try {
      await userService.validateUser(modal.row._id);
      toast.success('Member account activated.');
      await fetchMembers();
      closeModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to activate member.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await userService.deleteUser(modal.row._id);
      toast.success('Member deleted successfully.');
      await fetchMembers();
      closeModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to delete member.');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition-colors placeholder:text-slate-600 focus:border-blue-500/60';
  const selectCls = 'rounded-xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none transition-colors focus:border-blue-500/60';

  if (loading) return <Loader />;

  return (
    <>
      <DataTable
        title={t('dashboard.screens.members.title', 'Account Directory')}
        rows={rows}
        columns={columns}
        searchPlaceholder={t('dashboard.actions.search', 'Search accounts...')}
        filters={ACCOUNT_FILTERS}
        addAction={t('dashboard.screens.members.add_member', '+ Add Account')}
        onAction={handleAction}
      />

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 px-4 py-8 backdrop-blur-sm" onMouseDown={closeModal}>
          <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#0f172a] p-8 shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
            <button onClick={closeModal} className="absolute right-4 top-4 cursor-pointer border-none bg-transparent text-xl text-slate-400 hover:text-white">×</button>

            {modal.type === 'Create' && (
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <h3 className="text-xl font-black text-white">Add Account</h3>
                  <p className="mt-1 text-sm text-slate-500">Create a student, staff, partner, or public account.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="First name"><input required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className={inputCls} /></Field>
                  <Field label="Last name"><input required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className={inputCls} /></Field>
                </div>
                <Field label="Email"><input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} /></Field>
                <Field label="Phone"><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} /></Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Password"><input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputCls} placeholder="Min. 6 characters" /></Field>
                  <Field label="Role">
                    <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={selectCls}>
                      {ACCOUNT_ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                    </select>
                  </Field>
                </div>
                <Field label="Status">
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={selectCls}>
                    {STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
                  </select>
                </Field>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={closeModal} className="flex-1 cursor-pointer rounded-xl border border-white/10 bg-transparent py-3 text-slate-300 transition-colors hover:bg-white/5">Cancel</button>
                  <button type="submit" disabled={saving} className="flex-1 cursor-pointer rounded-xl border-none bg-blue-600 py-3 font-bold text-white transition-colors hover:bg-blue-500 disabled:opacity-60">
                    {saving ? 'Creating...' : 'Create Member'}
                  </button>
                </div>
              </form>
            )}

            {modal.type === 'Edit' && (
              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                <h3 className="text-xl font-black text-white">Edit Account</h3>
                  <p className="mt-1 text-sm text-slate-500">Update profile, role, and account status.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="First name"><input required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className={inputCls} /></Field>
                  <Field label="Last name"><input required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className={inputCls} /></Field>
                </div>
                <Field label="Email"><input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} /></Field>
                <Field label="Phone"><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} /></Field>
                <Field label="New password"><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputCls} placeholder="Leave blank to keep current password" /></Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Role">
                    <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={selectCls}>
                      {ACCOUNT_ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                    </select>
                  </Field>
                  <Field label="Status">
                    <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={selectCls}>
                      {STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </Field>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={closeModal} className="flex-1 cursor-pointer rounded-xl border border-white/10 bg-transparent py-3 text-slate-300 transition-colors hover:bg-white/5">Cancel</button>
                  <button type="submit" disabled={saving} className="flex-1 cursor-pointer rounded-xl border-none bg-blue-600 py-3 font-bold text-white transition-colors hover:bg-blue-500 disabled:opacity-60">
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}

            {modal.type === 'View' && (
              <>
                <h3 className="mb-6 text-xl font-black text-white">Member Profile</h3>
                <div className="mb-6 flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-2xl font-black text-white">
                    {initials(modal.row)}
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white">{modal.row.firstName} {modal.row.lastName}</div>
                    <div className="text-sm capitalize text-slate-400">{modal.row.role}</div>
                  </div>
                </div>
                <div className="mb-4 grid grid-cols-2 gap-4 rounded-xl border border-white/10 bg-white/5 p-4">
                  {[
                    ['Email', modal.row.email],
                    ['Phone', modal.row.phone || '—'],
                    ['Role', modal.row.role],
                    ['Status', modal.row.status],
                    ['Joined', modal.row.createdAt ? new Date(modal.row.createdAt).toLocaleDateString('fr-FR') : '—']
                  ].map(([label, value]) => (
                    <div key={label}>
                      <span className="mb-1 block text-[0.65rem] uppercase tracking-widest text-slate-500">{label}</span>
                      <strong className="text-sm text-white">{value}</strong>
                    </div>
                  ))}
                </div>
                <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <span className="block text-[0.65rem] uppercase tracking-widest text-slate-500">Payment receipt</span>
                      <strong className="mt-1 block text-sm text-white">{modal.row.paymentReceiptUrl ? 'Receipt uploaded' : 'No receipt uploaded'}</strong>
                    </div>
                    {modal.row.paymentReceiptUrl ? (
                      <button
                        type="button"
                        onClick={() => setPreviewFile({
                          url: modal.row.paymentReceiptUrl,
                          name: `Receipt - ${modal.row.firstName || ''} ${modal.row.lastName || ''}`.trim(),
                          type: modal.row.paymentReceiptUrl.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image'
                        })}
                        className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-2 text-sm font-black text-amber-300 transition hover:bg-amber-500/20"
                      >
                        <i className="fa-solid fa-eye"></i>
                        Preview receipt
                      </button>
                    ) : (
                      <span className="rounded-xl bg-red-500/10 px-3 py-2 text-xs font-black text-red-300">Required before approval</span>
                    )}
                  </div>
                  {modal.row.paymentReceiptUrl && (
                    <button
                      type="button"
                      onClick={() => setPreviewFile({
                        url: modal.row.paymentReceiptUrl,
                        name: `Receipt - ${modal.row.firstName || ''} ${modal.row.lastName || ''}`.trim(),
                        type: modal.row.paymentReceiptUrl.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image'
                      })}
                      className="group flex w-full cursor-pointer items-center gap-4 rounded-2xl border border-white/10 bg-slate-950/35 p-3 text-left transition hover:bg-white/10"
                    >
                      <div className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-slate-900">
                        <img
                          src={getThumbnailUrl(modal.row.paymentReceiptUrl)}
                          alt="Receipt thumbnail"
                          className="h-full w-full object-cover"
                          onError={(event) => {
                            event.currentTarget.style.display = 'none';
                          }}
                        />
                        <i className="fa-solid fa-receipt absolute text-xl text-amber-300"></i>
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-black text-white group-hover:text-amber-300">Open payment proof</div>
                        <p className="mt-1 text-xs text-slate-500">Review this before activating the account.</p>
                      </div>
                    </button>
                  )}
                </div>
                {modal.row.status === 'pending' && (
                  <button onClick={handleValidate} disabled={saving || !modal.row.paymentReceiptUrl} className="mb-3 w-full cursor-pointer rounded-xl border-none bg-emerald-600 py-3 font-bold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60">
                    {saving ? 'Activating...' : modal.row.paymentReceiptUrl ? 'Approve and activate this account' : 'Receipt required before approval'}
                  </button>
                )}
                <button onClick={closeModal} className="w-full cursor-pointer rounded-xl border-none bg-blue-600 py-3 font-bold text-white transition-colors hover:bg-blue-500">Close</button>
              </>
            )}

            {modal.type === 'Delete' && (
              <>
                <h3 className="mb-4 text-xl font-black text-white">Delete Staff Member</h3>
                <p className="mb-6 text-slate-400">Are you sure you want to delete <strong className="text-white">{modal.row.firstName} {modal.row.lastName}</strong>? This action cannot be undone.</p>
                <div className="flex gap-3">
                  <button onClick={closeModal} className="flex-1 cursor-pointer rounded-xl border border-white/10 bg-transparent py-3 text-slate-300 transition-colors hover:bg-white/5">Cancel</button>
                  <button onClick={handleDelete} disabled={saving} className="flex-1 cursor-pointer rounded-xl border-none bg-red-600 py-3 font-bold text-white transition-colors hover:bg-red-500 disabled:opacity-60">
                    {saving ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </>
            )}

            {modal.type === 'More' && (
              <>
                <h3 className="mb-2 text-xl font-black text-white">Quick Actions</h3>
                <p className="mb-6 text-slate-500">Choose what you want to do with <strong className="text-white">{modal.row.firstName} {modal.row.lastName}</strong>.</p>
                <div className="grid gap-3">
                  <button onClick={() => openModal('View', modal.row)} className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-slate-200 transition-colors hover:bg-white/10">
                    <i className="fa-solid fa-eye text-blue-400"></i> View profile
                  </button>
                  <button onClick={() => openModal('Edit', modal.row)} className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-slate-200 transition-colors hover:bg-white/10">
                    <i className="fa-solid fa-pen text-emerald-400"></i> Edit information
                  </button>
                  {modal.row.status === 'pending' && (
                    <button onClick={handleValidate} disabled={saving || !modal.row.paymentReceiptUrl} className="flex cursor-pointer items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-left text-emerald-300 transition-colors hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50">
                      <i className="fa-solid fa-user-check"></i> Activate account
                    </button>
                  )}
                  {modal.row.paymentReceiptUrl && (
                    <button
                      onClick={() => setPreviewFile({
                        url: modal.row.paymentReceiptUrl,
                        name: `Receipt - ${modal.row.firstName || ''} ${modal.row.lastName || ''}`.trim(),
                        type: modal.row.paymentReceiptUrl.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image'
                      })}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-left text-amber-300 transition-colors hover:bg-amber-500/20"
                    >
                      <i className="fa-solid fa-receipt"></i> Preview payment receipt
                    </button>
                  )}
                  <button onClick={() => openModal('Delete', modal.row)} className="flex cursor-pointer items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-left text-red-300 transition-colors hover:bg-red-500/20">
                    <i className="fa-solid fa-trash"></i> Delete member
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

export default ManageMembers;
