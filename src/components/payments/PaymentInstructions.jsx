import { useMemo, useState } from 'react';

const COMPLETE_STATUSES = ['completed', 'success', 'successful'];
const FAILED_STATUSES = ['failed', 'cancelled', 'canceled', 'expired'];

function PaymentInstructions({
  amount,
  currency = 'XAF',
  customerPhone,
  description = 'Payment request',
  transactionId,
  onCheckStatus,
  onSuccess,
  onCancel,
}) {
  const [checking, setChecking] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [status, setStatus] = useState('pending');
  const [message, setMessage] = useState('');

  const statusMeta = useMemo(() => {
    if (COMPLETE_STATUSES.includes(status)) return ['bg-emerald-500/10 text-emerald-200 border-emerald-400/25', 'Payment confirmed'];
    if (FAILED_STATUSES.includes(status)) return ['bg-red-500/10 text-red-100 border-red-400/25', 'Payment failed'];
    return ['bg-amber-500/10 text-amber-100 border-amber-400/25', 'Waiting for confirmation'];
  }, [status]);

  const handleCheckStatus = async () => {
    if (!transactionId || !onCheckStatus) return;
    setChecking(true);
    setMessage('');
    try {
      const result = await onCheckStatus(transactionId);
      const nextStatus = String(result.status || '').toLowerCase();
      setStatus(nextStatus || 'pending');

      if (COMPLETE_STATUSES.includes(nextStatus)) {
        setCompleting(true);
        await onSuccess?.(result);
        setMessage('Payment confirmed.');
      } else if (FAILED_STATUSES.includes(nextStatus)) {
        setMessage('Payment was not completed. Please initiate a new payment or contact support.');
      } else {
        setMessage('Payment is still pending. Confirm the Mobile Money prompt on your phone, then check again.');
      }
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || 'Unable to check payment status.');
    } finally {
      setChecking(false);
      setCompleting(false);
    }
  };

  return (
    <section className="min-h-screen bg-[#0f172a] px-4 py-10 text-slate-300 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <span className="inline-flex rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-[0.65rem] font-black uppercase tracking-[0.18em] text-blue-200">
                Mobile Money
              </span>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-white">Complete your payment</h1>
              <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>
            </div>
            <span className={`rounded-full border px-3 py-2 text-xs font-black uppercase tracking-widest ${statusMeta[0]}`}>
              {statusMeta[1]}
            </span>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {[
              ['Amount', `${Number(amount || 0).toLocaleString()} ${currency}`],
              ['Phone', customerPhone || '—'],
              ['Reference', transactionId || '—'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                <span className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-slate-500">{label}</span>
                <strong className="mt-2 block break-words text-sm font-black text-white">{value}</strong>
              </div>
            ))}
          </div>

          <div className="mt-7 rounded-2xl border border-white/10 bg-slate-950/30 p-5">
            <h2 className="text-base font-black text-white">What to do next</h2>
            <ol className="mt-4 space-y-3 text-sm font-semibold leading-6 text-slate-300">
              <li>1. Keep this page open.</li>
              <li>2. Check your phone for the Mobile Money authorization prompt.</li>
              <li>3. Confirm the payment with your PIN.</li>
              <li>4. Return here and click “Check Status”.</li>
            </ol>
          </div>

          {message && (
            <div className="mt-5 rounded-2xl border border-blue-400/20 bg-blue-500/10 px-4 py-3 text-sm font-semibold text-blue-100">
              {message}
            </div>
          )}

          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            {onCancel && (
              <button type="button" onClick={onCancel} className="rounded-2xl border border-white/10 bg-transparent px-5 py-3 text-sm font-black text-slate-300 transition hover:bg-white/10 hover:text-white">
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={handleCheckStatus}
              disabled={checking || completing || !transactionId}
              className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-xl shadow-blue-600/20 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {checking || completing ? 'Checking...' : 'Check Status'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default PaymentInstructions;
