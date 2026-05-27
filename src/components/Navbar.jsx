import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { clearCredentials } from '../redux/authSlice';
import { navLinks, languages } from '../data/navigation';

function Navbar({ theme, toggleTheme }) {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const userProfile = useSelector((state) => state.auth.userProfile);
  const isAdminUser = ['admin', 'superadmin'].includes(String(userProfile?.role || '').toLowerCase());

  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const getLanguageOption = (languageCode) => {
    const normalized = languageCode?.split('-')[0]?.toLowerCase();
    return languages.find(l => l.code.toLowerCase() === normalized) || languages[0];
  };

  const [currentLang, setCurrentLang] = useState(() => getLanguageOption(i18n.resolvedLanguage || i18n.language));
  const [activeSection, setActiveSection] = useState('');

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

  // Global scroll listener for scrolled state and mobile drawer auto-hide
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
        setMenuOpen(false);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      // Scroll Spy Logic
      if (location.pathname === '/') {
        const sections = ['services', 'internship', 'projects', 'about', 'contact'];
        const current = sections.find(id => {
          const el = document.getElementById(id);
          if (el) {
            const rect = el.getBoundingClientRect();
            return rect.top <= 150 && rect.bottom >= 150;
          }
          return false;
        });
        setActiveSection(current || '');
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [location]);

  // Handle scroll to hash if present in URL
  useEffect(() => {
    if (location.hash && location.pathname === '/') {
      const id = location.hash.replace('#', '');
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [location]);

  const handleNavClick = (e, path) => {
    if (path.includes('#')) {
      const [basePath, hash] = path.split('#');
      if (location.pathname === basePath || (basePath === '/' && location.pathname === '/')) {
        e.preventDefault();
        const id = hash;
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
          window.history.pushState(null, '', path);
        }
        setMenuOpen(false);
      }
    }
  };

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 2000,
        padding: scrolled ? '0.75rem 1.5rem' : '1.5rem 0',
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: 'none'
      }}
    >
      <nav
        className="mobile-nav-shell"
        style={{
          pointerEvents: 'auto',
          maxWidth: '1600px',
          margin: '0 auto',
          padding: scrolled ? '0.75rem 2.5rem' : '0 2.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: scrolled ? 'var(--nav-bg)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          border: scrolled ? '1px solid var(--glass-border)' : '1px solid transparent',
          borderRadius: scrolled ? '30px' : '0px',
          boxShadow: scrolled ? '0 10px 30px -10px rgba(0, 0, 0, 0.3)' : 'none',
          transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Official Logo */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            textDecoration: 'none',
            transition: 'transform 0.3s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <img
            src="/assets/images/logo.png"
            alt="InterLink Logo"
            style={{
              height: '42px',
              width: '42px',
              objectFit: 'contain',
              borderRadius: '12px',
              backgroundColor: '#fff',
              padding: '5px',
              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.12)',
              flexShrink: 0
            }}
          />
          <span
            style={{
              fontSize: '1.6rem',
              fontWeight: 850,
              letterSpacing: '-0.025em',
              background: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 50%, #8B5CF6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginLeft: '0.6rem',
              fontFamily: '"Outfit", sans-serif',
              textShadow: '0 0 20px rgba(6, 182, 212, 0.15)'
            }}
          >
            InterLink
          </span>
        </Link>

        {/* Desktop Navigation */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              background: 'var(--glass-bg)',
              padding: '0.35rem',
              borderRadius: '100px',
              border: '1px solid var(--glass-border)',
              transition: 'all 0.3s ease',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
            }}
            className="hidden-mobile"
          >
          {navLinks.map((link) => {
            const hash = link.path.split('#')[1];
            const isHome = link.path === '/';
            const isCourses = link.path === '/courses';
            const isLearning = link.path === '/learning';
            const isActive = isCourses 
              ? location.pathname === '/courses' 
              : isLearning
                ? location.pathname.startsWith('/learning')
              : isHome 
                ? (location.pathname === '/' && !activeSection)
                : activeSection === hash || (location.hash === `#${hash}` && location.pathname === '/');
            
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={(e) => handleNavClick(e, link.path)}
                className={`nav-link-item ${isActive ? 'active' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.65rem 1.25rem',
                  borderRadius: '100px',
                  fontSize: '0.925rem',
                  fontWeight: isActive ? 700 : 600,
                  color: isActive ? '#fff' : '#94a3b8',
                  textDecoration: 'none',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  background: isActive ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.6), rgba(37, 99, 235, 0.8))' : 'transparent',
                  boxShadow: isActive ? '0 4px 15px -3px rgba(37,99,235,0.4)' : 'none',
                  border: isActive ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
                  textShadow: isActive ? '0 1px 2px rgba(0,0,0,0.2)' : 'none'
                }}
              >
                <span style={{ fontSize: '1rem', filter: isActive ? 'none' : 'grayscale(100%) opacity(0.7)', transition: 'all 0.3s' }}>{link.icon}</span> {t(`nav.${link.name.toLowerCase()}`)}
              </Link>
            );
          })}
          
          <div style={{ width: '1px', height: '24px', background: 'var(--glass-border)', margin: '0 0.5rem' }}></div>
          
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            style={{
              width: 40,
              height: 40,
              borderRadius: '100px',
              border: 'none',
              background: 'transparent',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            className="nav-link-item"
            title={theme === 'dark' ? t('theme.switch_light') : t('theme.switch_dark')}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {/* Language Switcher */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setLangOpen(!langOpen)}
              onBlur={() => setTimeout(() => setLangOpen(false), 200)}
              style={{
                background: 'transparent',
                border: 'none',
                borderRadius: '100px',
                padding: '0.5rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              className="nav-link-item"
            >
              <span style={{ fontSize: '1.1rem' }}>{currentLang.flag}</span>
              {currentLang.code}
            </button>

            {/* Language Dropdown */}
            {langOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 16px)',
                right: 0,
                width: '180px',
                background: 'var(--nav-bg)',
                backdropFilter: 'blur(20px)',
                border: '1px solid var(--glass-border)',
                borderRadius: 16,
                padding: '0.5rem',
                boxShadow: 'var(--glass-shadow)',
                animation: 'slideIn 0.3s ease forwards'
              }}>
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => changeLanguage(lang)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem 1rem',
                      background: currentLang.code === lang.code ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                      border: 'none',
                      borderRadius: 10,
                      color: currentLang.code === lang.code ? '#60a5fa' : '#cbd5e1',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'left'
                    }}
                    className="lang-option"
                  >
                    <span style={{ fontSize: '1.1rem' }}>{lang.flag}</span>
                    {lang.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions (Enroll / Dashboard Buttons) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            {(() => {
              if (isAuthenticated && userProfile) {
                return (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.2rem',
                      background: 'var(--glass-bg)',
                      padding: '0.3rem',
                      borderRadius: '100px',
                      border: '1px solid var(--glass-border)',
                      transition: 'all 0.3s ease',
                      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
                      backdropFilter: 'blur(10px)'
                    }}
                    className="hidden-mobile"
                  >
                    {isAdminUser && (
                      <Link
                        to="/lounge"
                        title={t('nav.lounge', "Lounge")}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.55rem 1.15rem',
                          borderRadius: '100px',
                          fontSize: '0.875rem',
                          fontWeight: location.pathname === '/lounge' ? 700 : 600,
                          color: location.pathname === '/lounge' ? '#fff' : '#cbd5e1',
                          textDecoration: 'none',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          background: location.pathname === '/lounge' ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.5), rgba(37, 99, 235, 0.7))' : 'transparent',
                          border: location.pathname === '/lounge' ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
                        }}
                        className="nav-link-item nav-action-btn"
                      >
                        <span className="nav-action-icon">💬</span> <span className="nav-action-text">{t('nav.lounge', "Lounge")}</span>
                      </Link>
                    )}
                    <Link
                      to="/dashboard"
                      title={t('nav.dashboard', 'Dashboard')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.55rem 1.15rem',
                        borderRadius: '100px',
                        fontSize: '0.875rem',
                        fontWeight: location.pathname.startsWith('/dashboard') ? 700 : 600,
                        color: location.pathname.startsWith('/dashboard') ? '#fff' : '#cbd5e1',
                        textDecoration: 'none',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        background: location.pathname.startsWith('/dashboard') ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.5), rgba(37, 99, 235, 0.7))' : 'transparent',
                        border: location.pathname.startsWith('/dashboard') ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
                      }}
                      className="nav-link-item nav-action-btn"
                    >
                      <span className="nav-action-icon">▣</span> <span className="nav-action-text">{t('nav.dashboard', 'Dashboard')}</span>
                    </Link>
                  </div>
                );
              }
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <Link to="/login" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600, transition: 'color 0.2s' }} className="hidden-mobile hover-white">
                    {t('nav.signin', 'Sign In')}
                  </Link>
                  <Link 
                    to="/register" 
                    className="btn-primary mobile-nav-enroll" 
                    style={{ 
                      padding: '0.8rem 1.75rem', 
                      fontSize: '0.875rem',
                      borderRadius: '14px',
                      fontWeight: 800,
                      boxShadow: '0 10px 20px -5px rgba(37,99,235,0.5)'
                    }}
                  >
                    {t('nav.enroll', 'Apply Now')} →
                  </Link>
                </div>
              );
            })()}
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              display: 'none',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              cursor: 'pointer'
            }}
            className="show-mobile"
          >
            <div style={{ width: 20, height: 2, background: '#fff', borderRadius: 2, transform: menuOpen ? 'rotate(45deg) translateY(5px)' : 'none', transition: 'all 0.3s' }} />
            <div style={{ width: 20, height: 2, background: '#fff', borderRadius: 2, opacity: menuOpen ? 0 : 1, transition: 'all 0.3s' }} />
            <div style={{ width: 20, height: 2, background: '#fff', borderRadius: 2, transform: menuOpen ? 'rotate(-45deg) translateY(-5px)' : 'none', transition: 'all 0.3s' }} />
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Backdrop Scrim */}
      {menuOpen && (
        <div 
          onClick={() => setMenuOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 2050,
            transition: 'opacity 0.3s ease'
          }}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className="mobile-drawer"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: '320px',
          background: 'rgba(6, 11, 38, 0.98)',
          backdropFilter: 'blur(25px)',
          transform: menuOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.6s cubic-bezier(0.85, 0, 0.15, 1)',
          zIndex: 2100,
          padding: '6rem 2rem 2rem',
          boxShadow: '20px 0 60px rgba(0,0,0,0.6)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}
      >
        <button 
          onClick={() => setMenuOpen(false)}
          style={{ position: 'absolute', top: '2.5rem', right: '2rem', background: 'none', border: 'none', color: '#fff', fontSize: '2rem', cursor: 'pointer' }}
        >
          ×
        </button>
        {navLinks.map((link, i) => (
          <Link 
            key={link.path} 
            to={link.path} 
            onClick={(e) => {
              handleNavClick(e, link.path);
              if (!link.path.includes('#')) setMenuOpen(false);
            }} 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1.25rem',
              padding: '1.25rem',
              borderRadius: 16,
              fontSize: '1.2rem',
              fontWeight: 700,
              color: '#fff',
              textDecoration: 'none',
              background: 'rgba(255,255,255,0.03)',
              transition: 'all 0.3s ease',
              transform: menuOpen ? 'translateX(0)' : 'translateX(-30px)',
              opacity: menuOpen ? 1 : 0,
              transitionDelay: `${i * 0.1}s`
            }}
          >
            <span>{link.icon}</span> {t(`nav.${link.name.toLowerCase()}`)}
          </Link>
        ))}
        {(() => {
          if (isAuthenticated && userProfile) {
            return (
              <>
                {isAdminUser && (
                  <Link
                    to="/lounge"
                    onClick={() => setMenuOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1.25rem',
                      padding: '1.25rem',
                      borderRadius: 16,
                      fontSize: '1.2rem',
                      fontWeight: 700,
                      color: '#fff',
                      textDecoration: 'none',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <span>💬</span> {t('nav.lounge', "Lounge")}
                  </Link>
                )}
                <Link
                  to="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.25rem',
                    padding: '1.25rem',
                    borderRadius: 16,
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    color: '#fff',
                    textDecoration: 'none',
                    background: 'rgba(59, 130, 246, 0.15)',
                    border: '1px solid rgba(59, 130, 246, 0.25)',
                  }}
                >
                  <span>▣</span> {t('nav.dashboard', 'Dashboard')}
                </Link>
              </>
            );
          }
          return (
            <>
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.25rem',
                  padding: '1.25rem',
                  borderRadius: 16,
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  color: '#fff',
                  textDecoration: 'none',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                <span>🔑</span> {t('nav.signin', 'Sign In')}
              </Link>
              <Link
                to="/register"
                onClick={() => setMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '1.25rem',
                  borderRadius: 16,
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  color: '#fff',
                  textDecoration: 'none',
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  boxShadow: '0 8px 24px rgba(37, 99, 235, 0.35)',
                }}
              >
                {t('nav.enroll', 'Apply Now')} →
              </Link>
            </>
          );
        })()}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginTop: '1rem' }}>
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang)}
              style={{
                border: currentLang.code === lang.code ? '1px solid #60a5fa' : '1px solid rgba(255,255,255,0.1)',
                background: currentLang.code === lang.code ? 'rgba(59,130,246,0.22)' : 'rgba(255,255,255,0.04)',
                color: '#fff',
                borderRadius: 12,
                padding: '0.75rem 0.5rem',
                cursor: 'pointer',
                fontWeight: 800
              }}
            >
              <span style={{ display: 'block', fontSize: '1.15rem', marginBottom: '0.15rem' }}>{lang.flag}</span>
              {lang.code}
            </button>
          ))}
        </div>
      </div>

      <style>{`
        .logo-shimmer {
          position: absolute; inset: 0;
          background: linear-gradient(45deg, transparent, rgba(255,255,255,0.3), transparent);
          transform: translateX(-100%);
          animation: shimmer 4s infinite;
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .nav-link-item:hover {
          color: #fff !important;
          background: rgba(255,255,255,0.1) !important;
          transform: translateY(-2px);
        }
        .lang-option:hover {
          background: var(--highlight-bg) !important;
          color: var(--text-primary) !important;
        }
        .hover-white:hover { color: var(--btn-primary-bg) !important; }
        @media (max-width: 1200px) {
          .hidden-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
        }
        @media (min-width: 1201px) and (max-width: 1400px) {
          .nav-link-item {
            padding: 0.5rem 1rem !important;
            font-size: 0.825rem !important;
          }
          .mobile-nav-shell {
            padding: 0 1.5rem !important;
          }
          .mobile-nav-enroll {
            padding: 0.7rem 1.25rem !important;
            font-size: 0.8rem !important;
          }
        }
        @media (max-width: 1550px) {
          .nav-action-text {
            display: none !important;
          }
          .nav-action-btn {
            padding: 0.55rem !important;
            justify-content: center !important;
            gap: 0 !important;
            width: 40px !important;
            height: 40px !important;
            display: inline-flex !important;
            align-items: center !important;
          }
          .nav-action-icon {
            font-size: 1.1rem !important;
            margin: 0 !important;
          }
        }
      `}</style>
    </header>
  );
}

export default Navbar;
