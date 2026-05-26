import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUserProfile, clearCredentials } from '../../redux/authSlice';

const RealTimeClock = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-2">
      <i className="fa-regular fa-clock text-blue-500 text-lg"></i>
      <span className="font-['Outfit'] text-xl font-[800] tracking-tight text-white">
        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </span>
    </div>
  );
};

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const languages = [
    { code: 'en', label: 'EN', flag: '🇬🇧' },
    { code: 'fr', label: 'FR', flag: '🇫🇷' },
    { code: 'de', label: 'DE', flag: '🇩🇪' },
    { code: 'it', label: 'IT', flag: '🇮🇹' }
  ];

  const currentLang = languages.find(lang => lang.code === i18n.language) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeLanguage = (code) => {
    i18n.changeLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        type="button" 
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-12 w-20 items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 text-white transition-all hover:bg-white/10 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]"
      >
        <span className="text-sm font-bold flex gap-2 items-center">
          <span>{currentLang.flag}</span>
          <span>{currentLang.label}</span>
        </span>
        <i className={`fa-solid fa-chevron-down text-[0.6rem] transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-32 origin-top-right rounded-2xl border border-white/10 bg-[#1e293b] p-1.5 shadow-2xl animate-in fade-in zoom-in duration-200">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                i18n.language === lang.code 
                  ? 'bg-blue-500/20 text-blue-400' 
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const Topbar = ({ 
  theme, 
  setTheme, 
  fullscreen, 
  toggleFullscreen, 
  profileOpen, 
  setProfileOpen, 
  admin,
  setSidebarOpen,
  selectView
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const userProfile = useSelector(selectCurrentUserProfile);
  
  const currentUser = userProfile ? {
    name: `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim() || userProfile.email,
    role: userProfile.role === 'superadmin' ? 'System Administrator' : (userProfile.role === 'admin' ? 'Administrator' : userProfile.role === 'teacher' ? 'Teacher' : userProfile.role === 'advisor' ? 'Advisor' : 'Student'),
    email: userProfile.email,
    phone: userProfile.phone || '',
    avatar: userProfile.avatar ? (userProfile.avatar.startsWith('http') ? userProfile.avatar : `http://localhost:5001${userProfile.avatar}`) : admin.avatar
  } : admin;

  const handleSignOut = () => {
    dispatch(clearCredentials());
    window.location.href = '/login';
  };

  return (
    <header className="fixed top-0 right-0 z-40 flex h-[100px] items-center justify-between gap-6 border-b border-white/5 bg-[#0f172a] px-12 shadow-[0_10px_50px_rgba(0,0,0,0.4)] transition-all duration-300" style={{ width: 'calc(100% - var(--sidebar-width, 310px))' }}>
      <div className="flex items-center gap-8">
        {/* Mobile Menu Button */}
        <button 
          className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white lg:hidden hover:bg-white/10 transition-all"
          onClick={() => setSidebarOpen(true)}
        >
          <i className="fa-solid fa-bars-staggered text-2xl"></i>
        </button>

        <div className="flex flex-col gap-1">
          <span className="text-[0.7rem] font-black uppercase tracking-[0.2em] text-blue-500/80">{t('dashboard.topbar.current_session', 'Current Session')}</span>
          <RealTimeClock />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden xl:flex flex-col items-end mr-4">
          <span className="text-[0.7rem] font-bold text-slate-500 uppercase tracking-widest">{t('dashboard.topbar.server_status', 'Server Status')}</span>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            <span className="text-sm font-bold text-emerald-500/90">{t('dashboard.topbar.online', 'Online & Secure')}</span>
          </div>
        </div>

        <div className="h-10 w-[1px] bg-white/10 hidden md:block"></div>

        {/* Language Switcher */}
        <LanguageSwitcher />

        {/* Theme Toggle */}
        <button 
          type="button" 
          className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition-all hover:bg-white/10 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]"
          title="Toggle theme" 
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          <span className="text-xl">{theme === 'dark' ? '☀' : '◐'}</span>
        </button>

        {/* Fullscreen Toggle */}
        <button 
          type="button" 
          className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition-all hover:bg-white/10 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]"
          title="Toggle fullscreen" 
          onClick={toggleFullscreen}
        >
          <span className="text-xl">{fullscreen ? '↙' : '↗'}</span>
        </button>

        {/* Profile Menu */}
        <div className="relative">
          <button 
            type="button" 
            className="flex items-center gap-4 rounded-[20px] border border-white/10 bg-white/5 p-2 pr-5 transition-all hover:bg-white/10 group hover:border-blue-500/30"
            onClick={() => setProfileOpen(!profileOpen)}
          >
            <div className="h-11 w-11 overflow-hidden rounded-[14px] border-2 border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.2)] group-hover:shadow-[0_0_25px_rgba(59,130,246,0.4)] transition-all">
              <img src={currentUser.avatar} alt={currentUser.name} className="h-full w-full object-cover" />
            </div>
            <div className="flex flex-col items-start leading-tight">
              <strong className="text-sm font-black text-white group-hover:text-blue-400 transition-colors">{currentUser.name}</strong>
              <small className="text-[0.65rem] font-black text-slate-500 uppercase tracking-[0.15em]">{currentUser.role}</small>
            </div>
            <i className={`fa-solid fa-chevron-down text-[0.7rem] text-slate-600 transition-transform duration-300 ${profileOpen ? 'rotate-180' : ''}`}></i>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-4 w-64 origin-top-right rounded-3xl border border-white/10 bg-[#1e293b] p-2 shadow-2xl animate-in fade-in zoom-in duration-200">
              <div className="flex flex-col items-center gap-2 p-6 border-b border-white/5">
                <img src={currentUser.avatar} alt={currentUser.name} className="h-20 w-20 rounded-2xl border-2 border-blue-500 p-1" />
                <strong className="text-lg text-white">{currentUser.name}</strong>
                <span className="text-xs text-slate-400">{currentUser.role}</span>
              </div>
              <div className="flex flex-col p-2 gap-1">
                <button 
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                  onClick={() => {
                    selectView('profile');
                    setProfileOpen(false);
                  }}
                >
                  <i className="fa-regular fa-user text-blue-400"></i>
                  {t('dashboard.topbar.profile', 'Profile Settings')}
                </button>
                <button 
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <i className="fa-solid fa-arrow-right-from-bracket"></i>
                  {t('dashboard.topbar.signout', 'Sign Out')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
