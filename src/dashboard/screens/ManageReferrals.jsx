import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import Loader from '../components/Loader';
import { referralService } from '../../services/referralService';

const EMPTY_FORM = { code: '', label: '', description: '', isActive: true };

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-bold text-slate-300">{label}</span>
      {children}
    </label>
  );
}

function ManageReferrals() {
  const [codes, setCodes] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);

  const sortedCodes = useMemo(() => {
    return [...codes].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [codes]);

  const load = async () => {
    try {
      const [nextCodes, nextStats] = await Promise.all([
        referralService.getCodes(),
        referralService.getStats(),
      ]);
      setCodes(nextCodes);
      setStats(nextStats);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to load referral data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const startEdit = (code) => {
    setEditingId(code._id);
    setForm({
      code: code.code || '',
      label: code.label || '',
      description: code.description || '',
      isActive: Boolean(code.isActive),
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await referralService.updateCode(editingId, {
          label: form.label,
          description: form.description,
          isActive: form.isActive,
        });
        toast.success('Referral code updated.');
      } else {
        await referralService.createCode(form);
        toast.success('Referral code created.');
      }
      resetForm();
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Referral code could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (code) => {
    try {
      await referralService.updateCode(code._id, { isActive: !code.isActive });
      toast.success(code.isActive ? 'Referral code deactivated.' : 'Referral code activated.');
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Status could not be changed.');
    }
  };

  const deleteCode = async (code) => {
    if (!window.confirm(`Delete or deactivate ${code.code}?`)) return;
    try {
      const response = await referralService.deleteCode(code._id);
      toast.success(response.message || 'Referral code removed.');
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Referral code could not be removed.');
    }
  };

  const inputClass = "h-12 rounded-xl border border-white/10 bg-white/[0.055] px-4 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400/70 focus:ring-4 focus:ring-blue-500/10";
  const textareaClass = "min-h-[104px] rounded-xl border border-white/10 bg-white/[0.055] px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400/70 focus:ring-4 focus:ring-blue-500/10";

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ['Total codes', stats?.totalCodes || 0, 'fa-ticket', 'text-blue-300'],
          ['Active codes', stats?.activeCodes || 0, 'fa-circle-check', 'text-emerald-300'],
          ['Referred registrations', stats?.referredUsers || 0, 'fa-user-plus', 'text-amber-300'],
        ].map(([label, value, icon, tone]) => (
          <article key={label} className="rounded-2xl border border-white/10 bg-slate-950/45 p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-slate-500">{label}</span>
              <i className={`fa-solid ${icon} ${tone}`} aria-hidden="true" />
            </div>
            <strong className="mt-3 block text-3xl font-black text-white">{value}</strong>
          </article>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <form onSubmit={handleSubmit} className="rounded-2xl border border-white/10 bg-slate-950/45 p-5">
          <div className="mb-5">
            <h2 className="text-xl font-black text-white">{editingId ? 'Edit referral code' : 'Create referral code'}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">Leave the code empty to generate one automatically.</p>
          </div>

          <div className="space-y-4">
            <Field label="Code">
              <input
                value={form.code}
                onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })}
                disabled={Boolean(editingId)}
                className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-60`}
                placeholder="PARTNER-2026"
              />
            </Field>
            <Field label="Label">
              <input value={form.label} onChange={(event) => setForm({ ...form, label: event.target.value })} className={inputClass} placeholder="Partner, campaign, or staff name" />
            </Field>
            <Field label="Description">
              <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className={textareaClass} placeholder="Internal notes for this referral source" />
            </Field>
            <label className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
              <span>
                <strong className="block text-sm font-black text-white">Active</strong>
                <small className="mt-1 block text-xs font-semibold text-slate-500">Inactive codes cannot be used during registration.</small>
              </span>
              <input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} className="h-5 w-5 accent-blue-500" />
            </label>
          </div>

          <div className="mt-5 flex gap-3">
            {editingId && (
              <button type="button" onClick={resetForm} className="h-12 rounded-xl border border-white/10 px-4 text-sm font-black text-slate-300 transition hover:bg-white/10">
                Cancel
              </button>
            )}
            <button type="submit" disabled={saving} className="h-12 flex-1 rounded-xl bg-blue-500 px-5 text-sm font-black text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60">
              {saving ? 'Saving...' : editingId ? 'Save changes' : 'Create code'}
            </button>
          </div>
        </form>

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/45">
          <div className="border-b border-white/10 px-5 py-4">
            <h2 className="text-xl font-black text-white">Referral codes</h2>
            <p className="mt-1 text-sm text-slate-500">Usage totals are calculated from completed registrations.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-white/[0.035] text-[0.68rem] font-black uppercase tracking-[0.18em] text-slate-500">
                <tr>
                  <th className="px-5 py-3">Code</th>
                  <th className="px-5 py-3">Label</th>
                  <th className="px-5 py-3">Usage</th>
                  <th className="px-5 py-3">Last used</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {sortedCodes.map((code) => (
                  <tr key={code._id} className="text-sm text-slate-300">
                    <td className="px-5 py-4">
                      <strong className="font-black text-white">{code.code}</strong>
                      {code.description && <span className="mt-1 block max-w-[260px] truncate text-xs text-slate-500">{code.description}</span>}
                    </td>
                    <td className="px-5 py-4">{code.label || '-'}</td>
                    <td className="px-5 py-4 font-black text-white">{code.usageCount || 0}</td>
                    <td className="px-5 py-4">{code.lastUsedAt ? new Date(code.lastUsedAt).toLocaleDateString() : '-'}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${code.isActive ? 'bg-emerald-500/10 text-emerald-300' : 'bg-slate-500/10 text-slate-400'}`}>
                        {code.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => startEdit(code)} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-black text-blue-200 transition hover:bg-white/10">Edit</button>
                        <button type="button" onClick={() => toggleActive(code)} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-black text-slate-200 transition hover:bg-white/10">{code.isActive ? 'Disable' : 'Enable'}</button>
                        <button type="button" onClick={() => deleteCode(code)} className="rounded-lg border border-red-400/20 px-3 py-2 text-xs font-black text-red-300 transition hover:bg-red-500/10">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!sortedCodes.length && (
                  <tr>
                    <td colSpan="6" className="px-5 py-12 text-center text-sm font-semibold text-slate-500">No referral codes yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-white/10 bg-slate-950/45 p-5">
        <h2 className="text-xl font-black text-white">Recent referral usage</h2>
        <div className="mt-4 grid gap-3">
          {(stats?.recentUsers || []).map((user) => (
            <div key={user._id} className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.035] p-4 md:grid-cols-[minmax(0,1fr)_180px_150px] md:items-center">
              <div className="min-w-0">
                <strong className="block truncate text-white">{[user.firstName, user.lastName].filter(Boolean).join(' ') || user.email}</strong>
                <span className="mt-1 block truncate text-sm text-slate-500">{user.email} {user.phone ? `- ${user.phone}` : ''}</span>
              </div>
              <span className="font-black text-blue-200">{user.referralCode?.code || user.referralCodeSnapshot || '-'}</span>
              <span className="text-sm text-slate-500">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</span>
            </div>
          ))}
          {!(stats?.recentUsers || []).length && (
            <div className="rounded-xl border border-white/10 bg-white/[0.035] p-8 text-center text-sm font-semibold text-slate-500">
              No referred registrations yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default ManageReferrals;
