import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { languages } from '../../data/navigation';
import GlobalBackground3D from '../landing/GlobalBackground3D';

function AuthShell({ mode = 'login', children }) {
  const { t, i18n } = useTranslation();
  const isLogin = mode === 'login';
  const getLanguageOption = (languageCode) => {
    const normalized = languageCode?.split('-')[0]?.toLowerCase();
    return languages.find((lang) => lang.code.toLowerCase() === normalized) || languages[0];
  };

  const [langOpen, setLangOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState(() => getLanguageOption(i18n.resolvedLanguage || i18n.language));
  const [focusLanguageIndex, setFocusLanguageIndex] = useState(0);
  const focusLanguages = t('auth.focus_languages', { returnObjects: true });
  const languageWords = Array.isArray(focusLanguages) ? focusLanguages : ['German', 'French', 'English', 'Italian'];
  const currentFocusLanguage = languageWords[focusLanguageIndex % languageWords.length];

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang.code.toLowerCase());
    setCurrentLang(lang);
    setLangOpen(false);
  };

  useEffect(() => {
    const onLanguageChanged = (lng) => {
      setCurrentLang(getLanguageOption(lng));
      document.documentElement.lang = lng.split('-')[0];
    };

    onLanguageChanged(i18n.resolvedLanguage || i18n.language);
    i18n.on('languageChanged', onLanguageChanged);

    return () => i18n.off('languageChanged', onLanguageChanged);
  }, [i18n]);

  useEffect(() => {
    const interval = setInterval(() => {
      setFocusLanguageIndex((index) => (index + 1) % languageWords.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [languageWords.length]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#06091a] text-slate-100">
      <GlobalBackground3D theme="dark" zIndex={0} opacity={0.32} />
      <div className="absolute inset-0 z-[1] bg-[radial-gradient(circle_at_20%_15%,rgba(37,99,235,0.20),transparent_34%),radial-gradient(circle_at_80%_25%,rgba(16,185,129,0.13),transparent_28%),linear-gradient(135deg,rgba(6,9,26,.88)_0%,rgba(11,20,48,.78)_50%,rgba(4,7,20,.9)_100%)]" />
      <div className="pointer-events-none absolute inset-0 z-[2] overflow-hidden">
        <div className="auth-journey-line absolute left-[8vw] top-[48vh] hidden h-[2px] w-[42vw] bg-gradient-to-r from-transparent via-blue-300/70 to-emerald-300/70 lg:block">
          <span className="absolute right-[-8px] top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-emerald-300 shadow-[0_0_24px_rgba(52,211,153,.9)]" />
        </div>

        <div className="auth-cinematic-card absolute bottom-[8vh] left-[5vw] hidden max-w-[460px] rounded-[28px] border border-white/10 bg-black/20 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl lg:block">
          <div className="text-xs font-black uppercase tracking-[0.22em] text-blue-200">{t('auth.cinematic_label')}</div>
          <div className="mt-3 text-2xl font-black text-white">{t('auth.cinematic_title')}</div>
          <div className="mt-2 text-sm font-semibold leading-6 text-slate-300">{t('auth.cinematic_subtitle')}</div>
        </div>

        <div className="auth-background-word absolute right-[6vw] top-[15vh] hidden text-[clamp(5rem,12vw,12rem)] font-black uppercase leading-none tracking-[-0.08em] text-white/[0.035] transition-all duration-700 lg:block">
          {currentFocusLanguage}
        </div>
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 text-white no-underline">
            <img
              src="/assets/images/logo.png"
              alt="Institute Einstein"
              className="h-12 w-auto rounded-xl object-contain"
            />
            <div className="hidden sm:block">
              <div className="text-sm font-black uppercase tracking-[0.18em] text-white">Institute Einsteins</div>
              <div className="text-xs font-semibold text-slate-400">
                {currentFocusLanguage} {t('auth.brand_subtitle_suffix')}
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => setLangOpen((open) => !open)}
                onBlur={() => setTimeout(() => setLangOpen(false), 200)}
                className="flex h-11 items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 text-sm font-black text-white outline-none backdrop-blur-md transition hover:border-blue-400/60 hover:bg-white/10"
                aria-label={t('auth.language_label')}
                aria-expanded={langOpen}
              >
                <span className="text-lg">{currentLang.flag}</span>
                <span>{currentLang.code}</span>
                <span className={`text-[0.65rem] text-slate-400 transition ${langOpen ? 'rotate-180' : ''}`}>▼</span>
              </button>

              {langOpen && (
                <div className="absolute right-0 top-[calc(100%+12px)] z-50 w-48 rounded-2xl border border-white/10 bg-[#071026]/95 p-2 shadow-2xl shadow-black/40 backdrop-blur-2xl">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => changeLanguage(lang)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition ${
                        currentLang.code === lang.code
                          ? 'bg-blue-500/15 text-blue-200'
                          : 'text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span className="text-lg">{lang.flag}</span>
                      <span>{lang.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Link
              to={isLogin ? '/register' : '/login'}
              className="hidden rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-slate-100 no-underline backdrop-blur-md transition hover:border-blue-400/60 hover:bg-white/10 sm:inline-flex"
            >
              {isLogin ? t('auth.create_account') : t('auth.have_account')}
            </Link>
          </div>
        </header>

        <section className="auth-shell-grid grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1fr_520px] lg:gap-14">
          <div className="auth-shell-copy max-w-2xl">
            <div className="mb-6 inline-flex rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-blue-200">
              {isLogin ? t('auth.login_badge') : t('auth.register_badge')}
            </div>

            <h1 className="font-display text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              {isLogin ? t('auth.login_hero_1') : t('auth.register_hero_1')}
              <span className="gradient-text block transition-all duration-700">
                {currentFocusLanguage} {isLogin ? t('auth.login_hero_2_suffix') : t('auth.register_hero_2_suffix')}
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">
              {isLogin ? t('auth.login_hero_sub') : t('auth.register_hero_sub')}
            </p>

            <div className="auth-promise-grid mt-8 grid gap-3 sm:grid-cols-3">
              {['auth.promise_1', 'auth.promise_2', 'auth.promise_3'].map((key) => (
                <div key={key} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 shadow-2xl shadow-black/10 backdrop-blur-xl">
                  <div className="mb-2 h-2 w-10 rounded-full bg-gradient-to-r from-blue-500 to-emerald-400" />
                  <div className="text-sm font-bold text-slate-100">{t(key)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="auth-form-wrap rounded-[28px] border border-white/12 bg-white/[0.075] p-4 shadow-[0_30px_90px_rgba(0,0,0,.45)] backdrop-blur-2xl sm:p-6">
            {children}
          </div>
        </section>
      </div>
      <style>{`
        @keyframes authJourneyPulse {
          0%, 100% { opacity: 0.42; transform: scaleX(0.92); transform-origin: left; }
          50% { opacity: 0.9; transform: scaleX(1); transform-origin: left; }
        }

        .auth-journey-line {
          animation: authJourneyPulse 4.5s ease-in-out infinite;
        }
      `}</style>
    </main>
  );
}

export default AuthShell;
