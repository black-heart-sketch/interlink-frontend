import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axiosInstance from '../../config/axiosConfig';
import Loader from '../components/Loader';

function ManageFinancialBalance() {
  const [balance, setBalance] = useState({ available: 0, currency: 'XAF' });
  const [paidStudents, setPaidStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFinancials = async () => {
    console.log('[ManageFinancialBalance] Fetching financials (balance & registrations)...');
    try {
      const [balRes, appsRes] = await Promise.all([
        axiosInstance.get('/payments/digipay/balance').then(res => {
          console.log('[ManageFinancialBalance] DigiPay balance response:', res.data);
          return res;
        }).catch((err) => {
          console.error('[ManageFinancialBalance] Failed to fetch DigiPay balance, using fallback.', err);
          return { data: { available: 0, currency: 'XAF' } };
        }),
        axiosInstance.get('/applications').then(res => {
          console.log('[ManageFinancialBalance] Applications response:', res.data);
          return res;
        }).catch((err) => {
          console.error('[ManageFinancialBalance] Failed to fetch admissions/applications, using fallback.', err);
          return { data: [] };
        })
      ]);
      setBalance(balRes.data);
      
      const paidApps = Array.isArray(appsRes.data)
        ? appsRes.data.filter(app => app.paymentStatus === 'paid')
        : [];
      console.log(`[ManageFinancialBalance] Found ${paidApps.length} paid student registrations.`);
      setPaidStudents(paidApps);
    } catch (err) {
      console.error('[ManageFinancialBalance] Error in fetchFinancials:', err);
      toast.error('Failed to load financial records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancials();
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Treasury Card & Performance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Treasury Balance */}
        <div className="md:col-span-2 rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.08),transparent_25%),linear-gradient(135deg,rgba(15,23,42,0.65),rgba(30,41,59,0.5))] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.2)] backdrop-blur flex items-center justify-between">
          <div>
            <span className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-emerald-300 block mb-1">
              DigiPay Gateway Balance
            </span>
            <h3 className="text-4xl font-black tracking-tight text-white mt-1">
              {Number(balance?.available || 0).toLocaleString()} {balance?.currency || 'XAF'}
            </h3>
            <p className="text-xs text-slate-400 mt-2">
              Live treasury balance retrieved directly from the online mobile money wallet.
            </p>
          </div>
          <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-3xl shadow-lg">
            <i className="fa-solid fa-vault animate-pulse" />
          </span>
        </div>

        {/* Quick Audit Stat */}
        <div className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_25%),linear-gradient(135deg,rgba(15,23,42,0.65),rgba(30,41,59,0.5))] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.2)] backdrop-blur flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-blue-300">
              Total Admissions Revenue
            </span>
            <i className="fa-solid fa-receipt text-blue-400 text-lg" />
          </div>
          <div>
            <h4 className="text-3xl font-black text-white">
              {(paidStudents.length * 5000).toLocaleString()} XAF
            </h4>
            <p className="text-[0.65rem] text-slate-400 font-semibold mt-1">
              Derived from {paidStudents.length} verified applicant registrations.
            </p>
          </div>
        </div>

      </div>

      {/* Paid Students Ledger Table */}
      <article className="rounded-[2rem] border border-white/10 bg-slate-900/40 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.25)] backdrop-blur">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xl shadow-lg">
              <i className="fa-solid fa-list-check" />
            </span>
            <div>
              <span className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-blue-300">Payment Ledger</span>
              <h3 className="text-xl font-black text-white mt-1">Onboarding Paid Ledger</h3>
              <p className="text-xs text-slate-400 leading-relaxed mt-1">
                Real-time chronological view of registered students who have successfully finalized payments.
              </p>
            </div>
          </div>
          
          <button 
            type="button" 
            onClick={fetchFinancials} 
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-slate-300 hover:bg-white/10 hover:text-white transition cursor-pointer"
          >
            <i className="fa-solid fa-arrows-rotate" />
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-white/5 bg-slate-950/20">
          <table className="w-full text-left text-sm text-slate-300 border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02] text-xs font-black uppercase tracking-widest text-slate-400">
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Track</th>
                <th className="px-6 py-4">Ref Transaction ID</th>
                <th className="px-6 py-4">Paid Fee</th>
                <th className="px-6 py-4">Approval</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paidStudents.length > 0 ? (
                paidStudents.map((app, idx) => (
                  <tr key={app._id || idx} className="hover:bg-white/[0.02] transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-white">
                        {app.user ? `${app.user.firstName} ${app.user.lastName}` : 'Trainee Student'}
                      </div>
                      <span className="text-xs text-slate-500">
                        {app.user?.email || 'email@example.com'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-black uppercase tracking-wider text-blue-300">
                        {app.department}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">
                      {app.transactionId || '—'}
                    </td>
                    <td className="px-6 py-4 font-black text-emerald-400">
                      5,000 XAF
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-black uppercase tracking-wider ${app.status === 'approved' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-amber-500/10 text-amber-300'}`}>
                        {app.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-slate-500">
                    <i className="fa-solid fa-receipt text-2xl block mb-2 opacity-50" />
                    No paid students found on record.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}

export default ManageFinancialBalance;
