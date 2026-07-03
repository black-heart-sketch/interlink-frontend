import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axiosInstance from '../../config/axiosConfig';
import Loader from '../components/Loader';

function ManageSettings() {
  const [settings, setSettings] = useState({
    registrationFee: 5000,
    requireOnlineRegistrationFee: true,
    internshipFee: 0,
    internshipInstallments: 1,
    digipayApiKey: '',
    digipayEnv: 'production'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axiosInstance.get('/settings');
        if (res.data) {
          setSettings({
            registrationFee: res.data.registrationFee || 0,
            requireOnlineRegistrationFee: res.data.requireOnlineRegistrationFee ?? true,
            internshipFee: res.data.internshipFee || 0,
            internshipInstallments: res.data.internshipInstallments || 1,
            digipayApiKey: res.data.digipayApiKey || '',
            digipayEnv: res.data.digipayEnv || 'production'
          });
        }
      } catch (err) {
        toast.error('Failed to load system settings.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axiosInstance.put('/settings', settings);
      toast.success('System settings saved successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save system settings.');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "h-[50px] w-full rounded-2xl border border-white/10 bg-slate-950/45 px-4 text-white outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 placeholder:text-slate-600";
  const selectCls = "h-[50px] w-full rounded-2xl border border-white/10 bg-slate-900 px-4 text-white outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10";

  if (loading) return <Loader />;

  return (
    <div className="space-y-8 animate-fade-up">
      <form onSubmit={handleSave} className="grid gap-6 xl:grid-cols-2">
        
        {/* Onboarding & Admissions Panel */}
        <article className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_25%),linear-gradient(135deg,rgba(15,23,42,0.65),rgba(30,41,59,0.5))] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.2)] backdrop-blur">
          <div className="flex items-start gap-4 mb-6">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xl shadow-lg">
              <i className="fa-solid fa-user-gear" />
            </span>
            <div>
              <span className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-blue-300">Cohort Settings</span>
              <h3 className="text-xl font-black text-white mt-1">Admissions & Onboarding</h3>
              <p className="text-xs text-slate-400 leading-relaxed mt-1">
                Configure student registration fees and automated lock conditions for candidate profiles.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-xs font-bold text-slate-400">Registration Fee Amount (XAF)</span>
              <input
                type="number"
                min="0"
                required
                value={settings.registrationFee}
                onChange={(e) => setSettings({ ...settings, registrationFee: Number(e.target.value) })}
                className={inputCls}
                placeholder="e.g. 5000"
              />
              <span className="mt-1.5 block text-[0.65rem] text-slate-500 font-semibold leading-relaxed">
                Trainees must pay this amount online during onboarding to unlock platform access.
              </span>
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-xs font-bold text-slate-400">Internship Fee Amount (XAF)</span>
                <input
                  type="number"
                  min="0"
                  required
                  value={settings.internshipFee}
                  onChange={(e) => setSettings({ ...settings, internshipFee: Number(e.target.value) })}
                  className={inputCls}
                  placeholder="e.g. 150000"
                />
                <span className="mt-1.5 block text-[0.65rem] text-slate-500 font-semibold leading-relaxed">
                  Total internship amount visible on each student dashboard.
                </span>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-bold text-slate-400">Installment Count</span>
                <input
                  type="number"
                  min="1"
                  required
                  value={settings.internshipInstallments}
                  onChange={(e) => setSettings({ ...settings, internshipInstallments: Math.max(1, Number(e.target.value)) })}
                  className={inputCls}
                  placeholder="e.g. 3"
                />
                <span className="mt-1.5 block text-[0.65rem] text-slate-500 font-semibold leading-relaxed">
                  Students pay the internship fee in this number of equal installments.
                </span>
              </label>
            </div>

            <label className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/30 p-4 transition hover:bg-slate-950/40">
              <span className="min-w-0">
                <span className="block text-xs font-black text-white">Require Payment Checklist Step</span>
                <span className="mt-1 block text-[0.65rem] text-slate-500 font-semibold leading-relaxed">
                  Automatically gates student cockpit dashboards until fee payment is verified.
                </span>
              </span>
              <input
                type="checkbox"
                checked={settings.requireOnlineRegistrationFee}
                onChange={(e) => setSettings({ ...settings, requireOnlineRegistrationFee: e.target.checked })}
                className="h-5 w-5 rounded accent-blue-500 cursor-pointer"
              />
            </label>
          </div>
        </article>

        {/* Payment Integration Panel */}
        <article className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.08),transparent_25%),linear-gradient(135deg,rgba(15,23,42,0.65),rgba(30,41,59,0.5))] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.2)] backdrop-blur">
          <div className="flex items-start gap-4 mb-6">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xl shadow-lg">
              <i className="fa-solid fa-credit-card" />
            </span>
            <div>
              <span className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-emerald-300">Payment Gateway</span>
              <h3 className="text-xl font-black text-white mt-1">DigiPay Online API</h3>
              <p className="text-xs text-slate-400 leading-relaxed mt-1">
                Configure online secret credentials and environment targets. Automatically falls back to environment variables.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-xs font-bold text-slate-400">DigiPay API Secret Key</span>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={settings.digipayApiKey}
                  onChange={(e) => setSettings({ ...settings, digipayApiKey: e.target.value })}
                  className="h-[50px] w-full rounded-2xl border border-white/10 bg-slate-950/45 pl-4 pr-12 text-white outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 placeholder:text-slate-700 font-mono text-sm"
                  placeholder="Enter API Secret Key"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-slate-500 transition hover:bg-white/5 hover:text-white bg-transparent border-none cursor-pointer"
                >
                  <i className={`fa-solid ${showKey ? 'fa-eye-slash' : 'fa-eye'}`} />
                </button>
              </div>
              <span className="mt-1.5 block text-[0.65rem] text-slate-500 font-semibold leading-relaxed">
                Secret key beginning with <strong className="text-slate-400">dpk_test_</strong> will trigger sandbox mock payments.
              </span>
            </label>

            <div>
              <span className="mb-2 block text-xs font-bold text-slate-400">DigiPay Environment Mode</span>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['sandbox', 'Sandbox Mode', 'Test payments simulator.'],
                  ['production', 'Live Production', 'Real Mobile Money payouts.']
                ].map(([val, label, desc]) => {
                  const active = settings.digipayEnv === val;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setSettings({ ...settings, digipayEnv: val })}
                      className={`h-auto text-left cursor-pointer rounded-2xl border p-4 transition ${active ? 'border-emerald-500/40 bg-emerald-500/10 text-white shadow-lg' : 'border-white/10 bg-slate-950/30 text-slate-400 hover:bg-white/[0.04]'}`}
                    >
                      <span className="flex items-center gap-2">
                        <i className={`fa-solid ${active ? 'fa-circle-check text-emerald-400' : 'fa-circle text-slate-600'} text-sm`} />
                        <span className="text-xs font-black">{label}</span>
                      </span>
                      <span className="mt-1.5 block text-[0.6rem] font-semibold text-slate-500 leading-normal">{desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </article>

        {/* Settings Action Footer Row */}
        <div className="xl:col-span-2 flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary min-w-[200px] h-[52px] justify-center rounded-2xl shadow-xl shadow-blue-500/15 disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {saving ? (
              <>
                <i className="fa-solid fa-spinner fa-spin mr-2" />
                Saving Changes...
              </>
            ) : (
              <>
                <i className="fa-solid fa-floppy-disk mr-2" />
                Save Settings
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}

export default ManageSettings;
