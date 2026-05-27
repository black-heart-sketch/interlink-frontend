import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import axiosInstance from '../../config/axiosConfig';

const DEPARTMENTS = [
  'Software Engineering',
  'Cybersecurity',
  'AI Development',
  'IoT Engineering',
  'Graphic Design',
  'Web & Mobile Development'
];

function GateLock({ user, application, onRefresh }) {
  const { t } = useTranslation();
  const [step, setStep] = useState('request'); // 'request', 'payment', 'pending_approval'
  const [dept, setDept] = useState(user?.department || 'Software Engineering');
  const [studyMode, setStudyMode] = useState('online');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);
  const [txId, setTxId] = useState('');
  const [polling, setPolling] = useState(false);

  // Sync step with application state
  useEffect(() => {
    if (application) {
      if (application.paymentStatus !== 'paid') {
        setStep('payment');
        if (application.transactionId) {
          setTxId(application.transactionId);
        }
      } else if (application.status === 'pending') {
        setStep('pending_approval');
      }
    } else {
      setStep('request');
    }
  }, [application]);

  // Poll payment status
  useEffect(() => {
    let timer;
    if (polling && txId) {
      const checkStatus = async () => {
        try {
          const res = await axiosInstance.get(`/auth/registration-payment-status/${txId}`);
          if (res.data?.status === 'completed') {
            setPolling(false);
            toast.success(t('gate_lock.registration_payment_verified'));
            onRefresh(); // Refresh parent status which will shift step to pending_approval
          }
        } catch (err) {
          console.error('Error polling payment status:', err);
        }
      };

      timer = setInterval(checkStatus, 3000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [polling, txId, onRefresh]);

  const handleSendRequest = async (e) => {
    e.preventDefault();
    if (dept === 'none') {
      toast.error(t('gate_lock.select_valid_department'));
      return;
    }
    setLoading(true);
    try {
      // Create the InternshipApplication record
      const res = await axiosInstance.post('/applications', {
        department: dept,
        studyMode,
        paymentOption: 'pay_now',
        paymentStatus: 'pending'
      });
      toast.success(t('gate_lock.application_submitted'));
      onRefresh(); // Refresh dashboard state
    } catch (err) {
      toast.error(err.response?.data?.message || t('gate_lock.application_failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleInitiatePayment = async (e) => {
    e.preventDefault();
    if (!phone) {
      toast.error(t('gate_lock.phone_required'));
      return;
    }
    setLoading(true);
    try {
      // Initiate DigiPay payment
      const res = await axiosInstance.post('/auth/initiate-registration-payment', {
        phone,
        email: user?.email || ''
      });
      const transactionId = res.data?.transactionId;
      if (!transactionId) {
        throw new Error(t('gate_lock.transaction_missing'));
      }
      setTxId(transactionId);

      // Save transaction ID on the internship application
      await axiosInstance.patch('/applications/me/transaction', {
        transactionId
      });

      setPolling(true);
      toast.info(t('gate_lock.payment_initiated'));
    } catch (err) {
      console.log(err);
      toast.error(err.response?.data?.message || t('gate_lock.payment_failed'));
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "h-[50px] w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-white outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 placeholder:text-slate-600";
  const selectCls = "h-[50px] w-full rounded-2xl border border-white/10 bg-slate-900 px-4 text-white outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10";

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/40 p-4 sm:p-6 md:p-8 backdrop-blur-[2px]">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-950/80 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.6)] backdrop-blur-2xl transition duration-500 animate-fade-up">
        
        {/* Padlock Glow Icon */}
        <div className="mb-6 flex justify-center">
          <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500/20 to-emerald-500/20 text-3xl text-blue-400 border border-white/10 shadow-[0_8px_30px_rgba(59,130,246,0.15)]">
            <i className={`fa-solid ${step === 'pending_approval' ? 'fa-user-check text-emerald-400' : 'fa-lock'} animate-pulse`} />
          </div>
        </div>

        {/* Lock Screen Header */}
        <div className="text-center">
          <span className="text-[0.65rem] font-black uppercase tracking-[0.25em] text-blue-400">
            {t('gate_lock.onboarding_required')}
          </span>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-white uppercase">
            {t('gate_lock.access_restricted')}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            {t('gate_lock.unlock_helper')}
          </p>
        </div>

        {/* Progress Tracker Cards */}
        <div className="mt-8 grid grid-cols-2 gap-4">
          <div className={`rounded-2xl border p-4 text-left transition ${application ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-blue-500/25 bg-blue-500/5'}`}>
            <span className="text-[0.6rem] font-bold uppercase tracking-wider text-slate-500 block">{t('gate_lock.step_1')}</span>
            <strong className="mt-1 block text-sm font-black text-white">{t('gate_lock.internship_request')}</strong>
            <span className={`mt-2 inline-flex items-center gap-1.5 text-[0.68rem] font-black uppercase tracking-wider ${application ? 'text-emerald-400' : 'text-blue-400'}`}>
              <i className={`fa-solid ${application ? 'fa-circle-check' : 'fa-circle-dot'}`} />
              {application ? t('gate_lock.submitted') : t('gate_lock.pending')}
            </span>
          </div>
          
          <div className={`rounded-2xl border p-4 text-left transition ${application?.paymentStatus === 'paid' ? 'border-emerald-500/30 bg-emerald-500/5' : step === 'payment' ? 'border-amber-500/30 bg-amber-500/5' : 'border-white/5 bg-white/[0.02]'}`}>
            <span className="text-[0.6rem] font-bold uppercase tracking-wider text-slate-500 block">{t('gate_lock.step_2')}</span>
            <strong className="mt-1 block text-sm font-black text-white">{t('gate_lock.registration_fee')}</strong>
            <span className={`mt-2 inline-flex items-center gap-1.5 text-[0.68rem] font-black uppercase tracking-wider ${application?.paymentStatus === 'paid' ? 'text-emerald-400' : polling ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`}>
              <i className={`fa-solid ${application?.paymentStatus === 'paid' ? 'fa-circle-check' : polling ? 'fa-spinner fa-spin' : 'fa-circle'}`} />
              {application?.paymentStatus === 'paid' ? t('gate_lock.paid') : polling ? t('gate_lock.processing') : t('gate_lock.pending')}
            </span>
          </div>
        </div>

        {/* Dynamic Inner Step Forms */}
        <div className="mt-8 border-t border-white/10 pt-6">
          
          {/* STEP 1: Internship application submission */}
          {step === 'request' && (
            <form onSubmit={handleSendRequest} className="space-y-4">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2">{t('gate_lock.submit_request_title')}</h3>
                <p className="text-xs text-slate-500">{t('gate_lock.submit_request_helper')}</p>
              </div>

              <label className="block">
                <span className="mb-2 block text-xs font-bold text-slate-400">{t('auth.study_language')}</span>
                <select value={dept} onChange={(e) => setDept(e.target.value)} className={selectCls}>
                  <option value="none">{t('auth.select_department_track')}</option>
                  {DEPARTMENTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </label>

              <div>
                <span className="mb-2 block text-xs font-bold text-slate-400">{t('auth.application_track')}</span>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ['online', t('auth.remote_track'), t('gate_lock.online_evaluation')],
                    ['on_site', t('auth.in_person_track'), t('gate_lock.physical_placement')]
                  ].map(([val, label, helper]) => (
                    <label key={val} className={`cursor-pointer rounded-2xl border p-4 transition ${studyMode === val ? 'border-blue-400/60 bg-blue-500/10 text-white' : 'border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.05]'}`}>
                      <span className="flex items-center gap-2">
                        <input type="radio" name="studyMode" value={val} checked={studyMode === val} onChange={() => setStudyMode(val)} className="h-4 w-4 accent-blue-500" />
                        <span className="text-xs font-black">{label}</span>
                      </span>
                      <span className="mt-1 block text-[0.6rem] font-semibold leading-relaxed text-slate-500">{helper}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary h-[50px] w-full justify-center rounded-2xl transition disabled:opacity-60 disabled:cursor-not-allowed">
                {loading ? t('gate_lock.submitting') : t('gate_lock.send_request')}
              </button>
            </form>
          )}

          {/* STEP 2: Online Mobile Money Payment */}
          {step === 'payment' && (
            <form onSubmit={handleInitiatePayment} className="space-y-4">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2">{t('gate_lock.pay_fee_title')}</h3>
                <p className="text-xs text-slate-500">{t('gate_lock.pay_fee_helper')}</p>
              </div>

              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-black text-emerald-300">{t('gate_lock.payment_required')}</span>
                  <strong className="text-lg font-black text-white">5,000 XAF</strong>
                </div>
                <p className="mt-1.5 text-[0.68rem] font-semibold leading-relaxed text-emerald-100/70">
                  {t('gate_lock.payment_processed_automatically')}
                </p>
              </div>

              {!polling ? (
                <>
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold text-slate-400">{t('gate_lock.mobile_money_phone')}</span>
                    <input type="tel" required placeholder="+237 6XX XXX XXX" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} />
                  </label>

                  <button type="submit" disabled={loading} className="btn-primary h-[50px] w-full justify-center rounded-2xl transition disabled:opacity-60 disabled:cursor-not-allowed">
                    {loading ? t('gate_lock.initiating_payment') : t('gate_lock.pay_now')}
                  </button>
                </>
              ) : (
                <div className="rounded-2xl border border-blue-400/25 bg-blue-500/10 p-6 text-center space-y-4">
                  <div className="flex justify-center">
                    <i className="fa-solid fa-spinner fa-spin text-2xl text-blue-400" />
                  </div>
                  <strong className="block text-sm font-bold text-white">{t('gate_lock.waiting_payment')}</strong>
                  <p className="text-xs leading-relaxed text-slate-400">
                    {t('gate_lock.payment_prompt_sent')} (<strong className="text-white">{phone}</strong>). {t('gate_lock.payment_prompt_pin')}
                  </p>
                  <button type="button" onClick={() => setPolling(false)} className="text-xs font-bold text-slate-500 hover:text-white transition bg-transparent border-none cursor-pointer underline">
                    {t('gate_lock.cancel_try_again')}
                  </button>
                </div>
              )}
            </form>
          )}

          {/* STEP 3: Admin review pending dashboard */}
          {step === 'pending_approval' && (
            <div className="space-y-5 text-center py-2 animate-fade-up">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2">{t('gate_lock.admin_review_title')}</h3>
                <p className="text-xs text-slate-500">{t('gate_lock.payment_verified_helper')}</p>
              </div>

              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-5 text-left flex items-start gap-4">
                <i className="fa-solid fa-circle-check text-emerald-400 text-xl mt-0.5" />
                <div className="min-w-0">
                  <strong className="block text-sm text-emerald-300 font-black">{t('gate_lock.registration_complete')}</strong>
                  <p className="mt-1 text-xs leading-relaxed text-emerald-100/70">
                    {t('gate_lock.payment_received')}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 text-left flex items-start gap-4">
                <i className="fa-solid fa-clock text-amber-400 text-xl mt-0.5" />
                <div className="min-w-0">
                  <strong className="block text-sm text-amber-300 font-black">{t('gate_lock.pending_review')}</strong>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">
                    {t('gate_lock.request_processing_prefix')} <strong className="text-white">{application?.department || dept}</strong> {t('gate_lock.request_processing_suffix')}
                  </p>
                </div>
              </div>

              <button type="button" onClick={onRefresh} className="btn-ghost h-[50px] w-full justify-center rounded-2xl transition hover:bg-white/10">
                <i className="fa-solid fa-rotate" />
                {t('gate_lock.check_status')}
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}

export default GateLock;
