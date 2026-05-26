import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axiosInstance from '../config/axiosConfig';
import PaymentInstructions from '../components/payments/PaymentInstructions';
import { getRegistrationPaymentStatus } from '../services/authService';
import { courseService } from '../services/courseService';

function readPaymentContext(location) {
  if (location.state?.paymentContext) return location.state.paymentContext;

  const stored = sessionStorage.getItem('pendingPaymentContext');
  if (!stored) return null;

  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

function PaymentStatus() {
  const location = useLocation();
  const navigate = useNavigate();
  const context = useMemo(() => readPaymentContext(location), [location]);

  const handleRegistrationSuccess = async () => {
    const pending = JSON.parse(sessionStorage.getItem('pendingRegistration') || 'null');
    if (!pending || !context?.transactionId) {
      throw new Error('Registration details are missing. Please restart registration.');
    }

    await axiosInstance.post('/auth/register', {
      ...pending,
      studyMode: 'online',
      transactionId: context.transactionId,
    });

    sessionStorage.removeItem('pendingRegistration');
    sessionStorage.removeItem('pendingPaymentContext');
    toast.success('Registration successful. Your account is active.');
    navigate('/login', { replace: true });
  };

  const handleCourseSuccess = async () => {
    sessionStorage.removeItem('pendingPaymentContext');
    toast.success('Payment confirmed. Course access unlocked.');
    const courseId = context?.courseId;
    if (courseId) {
      navigate(`/learning/learn/${courseId}`, { replace: true });
    } else {
      navigate('/learning', { replace: true });
    }
  };

  const checkStatus = context.kind === 'course'
    ? courseService.getCoursePaymentStatus
    : getRegistrationPaymentStatus;

  const handleSuccess = context.kind === 'course'
    ? handleCourseSuccess
    : handleRegistrationSuccess;

  if (!context) {
    return (
      <section className="flex min-h-screen items-center justify-center bg-[#0f172a] px-4 text-slate-300">
        <div className="max-w-md rounded-2xl border border-red-400/20 bg-red-500/10 p-6 text-center">
          <h1 className="text-xl font-black text-white">Payment session not found</h1>
          <p className="mt-2 text-sm text-red-100">Please restart the payment flow.</p>
          <button type="button" onClick={() => navigate('/register')} className="mt-5 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white">
            Back to registration
          </button>
        </div>
      </section>
    );
  }

  return (
    <PaymentInstructions
      amount={context.amount}
      currency={context.currency || 'XAF'}
      customerPhone={context.customerPhone}
      description={context.description}
      transactionId={context.transactionId}
      onCheckStatus={checkStatus}
      onSuccess={handleSuccess}
      onCancel={() => navigate(context.cancelPath || '/')}
    />
  );
}

export default PaymentStatus;
