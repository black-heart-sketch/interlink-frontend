import { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import AuthShell from '../components/auth/AuthShell';
import { strengthColor, strengthIndicator } from '../utils/password-strength';
import axiosInstance from '../config/axiosConfig';
import { settingService } from '../services/settingService';
import { initiateRegistrationPayment } from '../services/authService';

const LEVELS = ['level_1', 'level_2', 'level_3'];

function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    password: '', confirmPassword: '', studyMode: 'online', registeredLevel: 'none',
    class: '', department: 'none', paymentOption: 'pay_now', referralCode: ''
  });
  const [step, setStep] = useState(1);
  const [settings, setSettings] = useState({
    registrationFee: 5000,
    requireOnlineRegistrationFee: true,
  });
  const [receiptFile, setReceiptFile] = useState(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      settingService.getPublicSettings().catch(() => null),
      axiosInstance.get('/classes?activeOnly=true').then(res => res.data).catch(() => []),
    ]).then(([publicSettings, activeClasses]) => {
      setClasses(activeClasses);
      if (publicSettings) {
        setSettings({
          registrationFee: Number(publicSettings.registrationFee) || 0,
          requireOnlineRegistrationFee: Boolean(publicSettings.requireOnlineRegistrationFee),
        });
      }
    });
  }, []);

  const isOnSite = formData.studyMode === 'on_site';
  const shouldPayOnlineFee = formData.studyMode === 'online' && settings.requireOnlineRegistrationFee && formData.paymentOption === 'pay_now';

  const passwordStrength = useMemo(() => {
    const count = strengthIndicator(formData.password || '');
    return strengthColor(count);
  }, [formData.password]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => {
      if (name === 'studyMode') {
        return {
          ...current,
          studyMode: value
        };
      }
      if (name === 'class') {
        const selectedClass = classes.find(c => c._id === value);
        let matchedLevel = 'none';
        if (selectedClass) {
          matchedLevel = `level_${selectedClass.level}`;
        }
        return {
          ...current,
          class: value,
          registeredLevel: matchedLevel
        };
      }
      return { ...current, [name]: value };
    });
    setError('');
  };

  const handleNextStep = (e) => {
    if (e) e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.confirmPassword) {
      setError(t('auth.errors.step1_required'));
      return;
    }
    if (formData.password.length < 6) {
      setError(t('auth.errors.password_short'));
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError(t('auth.errors.password_mismatch'));
      return;
    }
    setError('');
    setStep(2);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.confirmPassword) {
      setError(t('auth.errors.step1_required'));
      setStep(1);
      return;
    }
    if (formData.password.length < 6) {
      setError(t('auth.errors.password_short'));
      setStep(1);
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError(t('auth.errors.password_mismatch'));
      setStep(1);
      return;
    }
    if (!formData.class) {
      setError(t('auth.errors.class_required'));
      return;
    }
    if (formData.department === 'none') {
      setError(t('auth.errors.study_language_required'));
      return;
    }
    if (!formData.referralCode.trim()) {
      setError(t('auth.errors.referral_code_required', 'Referral code is required.'));
      return;
    }
    if (!acceptedTerms) {
      setError(t('auth.errors.terms'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axiosInstance.post('/auth/register', formData);
      toast.success(response.data?.message || 'Registration successful.');
      navigate('/login');
    } catch (err) {
      const message = err.response?.data?.message || err.message || t('auth.errors.register_failed');
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "h-[52px] w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/70 focus:bg-white/[0.09] focus:ring-4 focus:ring-blue-500/10";
  const selectCls = "h-[52px] w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 text-white outline-none transition focus:border-blue-400/70 focus:ring-4 focus:ring-blue-500/10";

  return (
    <AuthShell mode="register">
      <form onSubmit={handleSubmit} className="space-y-5 rounded-[22px] bg-slate-950/35 p-5 sm:p-7">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-300">{t('auth.step_counter', { step })}</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-white">{t('auth.enroll_title')}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            {step === 1 
              ? t('auth.step1_subtitle')
              : t('auth.step2_subtitle')}
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition ${step === 1 ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-emerald-500 text-white'}`}>
              {step > 1 ? '✓' : '1'}
            </span>
            <span className={`text-xs font-bold ${step === 1 ? 'text-blue-300' : 'text-slate-400'}`}>{t('auth.account_info')}</span>
          </div>
          <div className="h-[2px] flex-1 bg-white/10 mx-4" />
          <div className="flex items-center gap-2">
            <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition ${step === 2 ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-white/10 text-slate-500'}`}>
              2
            </span>
            <span className={`text-xs font-bold ${step === 2 ? 'text-blue-300' : 'text-slate-500'}`}>{t('auth.track_details')}</span>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-100">
            {error}
          </div>
        )}

        {step === 1 ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-200">{t('auth.first_name')}</span>
                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} autoComplete="given-name" className={inputCls} />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-200">{t('auth.last_name')}</span>
                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} autoComplete="family-name" className={inputCls} />
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-200">{t('auth.email')}</span>
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" autoComplete="email" className={inputCls} />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-200">{t('auth.phone')}</span>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+237 6XX XXX XXX" className={inputCls} />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-200">{t('auth.password')}</span>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} placeholder={t('auth.password_placeholder')} autoComplete="new-password" className="h-[52px] w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 pr-24 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/70 focus:bg-white/[0.09] focus:ring-4 focus:ring-blue-500/10" />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl px-3 py-2 text-xs font-black text-blue-200 transition hover:bg-white/10">
                  {showPassword ? t('auth.hide') : t('auth.show')}
                </button>
              </div>
              {formData.password && (
                <div className="mt-3">
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(strengthIndicator(formData.password), 1) * 20}%`, background: passwordStrength.color }} />
                  </div>
                  <p className="mt-2 text-xs font-bold" style={{ color: passwordStrength.color }}>
                    {t('auth.password_strength')}: {passwordStrength.label}
                  </p>
                </div>
              )}
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-200">{t('auth.confirm_password')}</span>
              <div className="relative">
                <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder={t('auth.confirm_password_placeholder')} autoComplete="new-password" className="h-[52px] w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 pr-24 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/70 focus:bg-white/[0.09] focus:ring-4 focus:ring-blue-500/10" />
                <button type="button" onClick={() => setShowConfirmPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl px-3 py-2 text-xs font-black text-blue-200 transition hover:bg-white/10">
                  {showConfirmPassword ? t('auth.hide') : t('auth.show')}
                </button>
              </div>
            </label>

            <button type="button" onClick={handleNextStep} className="btn-primary h-[52px] w-full justify-center rounded-2xl">
              {t('auth.next_step')}
            </button>
          </>
        ) : (
          <>
            {/* Dynamic Class selection */}
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-200">{t('auth.dynamic_class')} <span className="text-red-400">*</span></span>
              <select name="class" value={formData.class} onChange={handleChange} className={selectCls}>
                <option value="">{t('auth.select_class_placeholder')}</option>
                {classes.map(c => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({t('auth.class_section_level', { section: c.section, level: c.level })})
                  </option>
                ))}
              </select>
            </label>

            {/* Department track */}
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-200">{t('auth.study_language')} <span className="text-red-400">*</span></span>
              <select name="department" value={formData.department} onChange={handleChange} className={selectCls}>
                <option value="none">{t('auth.select_department_track')}</option>
                <option value="Software Engineering">{t('common.departments.software_engineering')}</option>
                <option value="Cybersecurity">{t('common.departments.cybersecurity')}</option>
                <option value="AI Development">{t('common.departments.ai_development')}</option>
                <option value="IoT Engineering">{t('common.departments.iot_engineering')}</option>
                <option value="Graphic Design">{t('common.departments.graphic_design')}</option>
                <option value="Web & Mobile Development">{t('common.departments.web_mobile_development')}</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-200">{t('auth.referral_code', 'Referral code')} <span className="text-red-400">*</span></span>
              <input
                type="text"
                name="referralCode"
                value={formData.referralCode}
                onChange={handleChange}
                placeholder={t('auth.referral_code_placeholder', 'Code from InterLink or a partner')}
                autoComplete="off"
                className={inputCls}
              />
            </label>

            <div>
              <span className="mb-2 block text-sm font-bold text-slate-200">{t('auth.application_track')} <span className="text-red-400">*</span></span>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ['online', t('auth.remote_track'), t('auth.remote_track_helper')],
                  ['on_site', t('auth.in_person_track'), t('auth.in_person_track_helper')],
                ].map(([value, label, helper]) => (
                  <label key={value} className={`cursor-pointer rounded-2xl border p-4 transition ${formData.studyMode === value ? 'border-blue-400/60 bg-blue-500/10 text-white' : 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.07]'}`}>
                    <span className="flex items-center gap-3">
                      <input type="radio" name="studyMode" value={value} checked={formData.studyMode === value} onChange={handleChange} className="h-4 w-4 accent-blue-500" />
                      <span className="font-black">{label}</span>
                    </span>
                    <span className="mt-2 block text-xs font-semibold leading-5 text-slate-500">{helper}</span>
                  </label>
                ))}
              </div>
            </div>

            <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-slate-300">
              <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="mt-1 h-4 w-4 rounded border-white/20 bg-white/10 accent-blue-500" />
              <span>{t('auth.terms_text')}</span>
            </label>

            <div className="flex gap-4">
              <button type="button" onClick={() => setStep(1)} className="h-[52px] rounded-2xl border border-white/10 bg-transparent px-6 text-sm font-black text-slate-300 transition hover:bg-white/10 hover:text-white">
                {t('learning.back')}
              </button>
              <button type="submit" disabled={loading} className="btn-primary h-[52px] flex-1 justify-center rounded-2xl disabled:cursor-not-allowed disabled:opacity-70">
                {loading ? t('auth.creating_account') : t('auth.enroll_button')}
              </button>
            </div>
          </>
        )}

        <p className="text-center text-sm text-slate-400">
          {t('auth.already_account')}{' '}
          <Link to="/login" className="font-black text-blue-300 no-underline hover:text-blue-200">{t('auth.have_account')}</Link>
        </p>
      </form>
    </AuthShell>
  );
}

export default Register;
