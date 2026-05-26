import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../redux/authSlice';
import AuthShell from '../components/auth/AuthShell';
import { loginUser } from '../services/authService';

function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Development auto-login
  useEffect(() => {
    if (false) {
      const autoLogin = async () => {
        setLoading(true);
        try {
          const data = await loginUser({ email: 'superadmin@einstein.com', password: 'password123' });
          sessionStorage.setItem('token', data.token);
          sessionStorage.setItem('user', JSON.stringify({ id: data._id, email: data.email }));
          dispatch(setCredentials({
            token: data.token,
            userId: data._id,
            userRoles: [data.role],
            userName: `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.email,
            email: data.email,
            phone: data.phone || '',
            profile: data
          }));
          toast.success('Auto-login successful (Dev Mode)');
          navigate('/dashboard');
        } catch (err) {
          console.error('Auto-login failed', err);
        } finally {
          setLoading(false);
        }
      };
      
      // Only auto-login if no token exists
      if (!sessionStorage.getItem('token')) {
        autoLogin();
      }
    }
  }, [navigate, dispatch]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.email || !formData.password) {
      setError(t('auth.errors.required'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await loginUser(formData);
      sessionStorage.setItem('token', data.token);
      sessionStorage.setItem('user', JSON.stringify({ id: data._id, email: data.email }));
      dispatch(setCredentials({
        token: data.token,
        userId: data._id,
        userRoles: [data.role],
        userName: `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.email,
        email: data.email,
        phone: data.phone || '',
        profile: data
      }));
      toast.success(t('auth.login_success'));
      const role = data.role;
      if (role === 'student') {
        navigate('/student/dashboard');
      } else if (role === 'supervisor') {
        navigate('/supervisor/dashboard');
      } else if (role === 'manager') {
        navigate('/manager/dashboard');
      } else if (role === 'admin' || role === 'superadmin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      const message = err.response?.data?.message || t('auth.errors.invalid_login');
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell mode="login">
      <form onSubmit={handleSubmit} className="space-y-5 rounded-[22px] bg-slate-950/35 p-5 sm:p-7">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-300">{t('auth.signin_label')}</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-white">{t('auth.signin_title')}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">{t('auth.signin_subtitle')}</p>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-100">
            {error}
          </div>
        )}

        <label className="block">
          <span className="mb-2 block text-sm font-bold text-slate-200">{t('auth.email')}</span>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
            autoComplete="email"
            className="h-[52px] w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/70 focus:bg-white/[0.09] focus:ring-4 focus:ring-blue-500/10"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-bold text-slate-200">{t('auth.password')}</span>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder={t('auth.password_placeholder')}
              autoComplete="current-password"
              className="h-[52px] w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 pr-24 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/70 focus:bg-white/[0.09] focus:ring-4 focus:ring-blue-500/10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl px-3 py-2 text-xs font-black text-blue-200 transition hover:bg-white/10"
            >
              {showPassword ? t('auth.hide') : t('auth.show')}
            </button>
          </div>
        </label>

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <label className="flex items-center gap-2 font-semibold text-slate-300">
            <input type="checkbox" className="h-4 w-4 rounded border-white/20 bg-white/10 accent-blue-500" />
            {t('auth.remember')}
          </label>
          <a href="#forgot-password" className="font-bold text-blue-300 no-underline transition hover:text-blue-200">
            {t('auth.forgot_password')}
          </a>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary h-[52px] w-full justify-center rounded-2xl disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? t('auth.signing_in') : t('auth.signin_button')}
        </button>

        <p className="text-center text-sm text-slate-400">
          {t('auth.no_account')}{' '}
          <Link to="/register" className="font-black text-blue-300 no-underline hover:text-blue-200">
            {t('auth.create_account')}
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}

export default Login;
