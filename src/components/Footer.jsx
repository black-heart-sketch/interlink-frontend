import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function Footer() {
  const { t } = useTranslation();
  const footerSections = [
    {
      heading: t('footer.sections.courses'),
      icon: '🛠️',
      links: [
        { label: t('footer.links.a1'), href: '/#services' },
        { label: t('footer.links.c1'), href: '/#services' },
        { label: t('footer.links.a2'), href: '/#services' },
        { label: t('footer.links.c2'), href: '/#services' },
        { label: t('footer.links.b2'), href: '/#services' },
        { label: t('footer.links.mentorship'), href: '/#services' },
      ]
    },
    {
      heading: t('footer.sections.platform'),
      icon: '🧭',
      links: [
        { label: t('footer.links.ai_curr'), href: '/#internship' },
        { label: t('footer.links.task_management'), href: '/#internship' },
        { label: t('footer.links.daily_reports'), href: '/#internship' },
        { label: t('footer.links.attendance'), href: '/#internship' },
        { label: t('footer.links.lounge'), href: '/#internship' },
        { label: t('footer.links.dashboard'), href: '/dashboard' },
      ]
    },
    {
      heading: t('footer.sections.company'),
      icon: '🏢',
      links: [
        { label: t('footer.links.about'), href: '/#about' },
        { label: t('footer.links.gallery'), href: '/#projects' },
        { label: t('footer.links.contact'), href: '/#contact' },
        { label: t('footer.links.careers'), href: '#' },
      ]
    },
    {
      heading: t('footer.sections.legal'),
      icon: '⚖️',
      links: [
        { label: t('footer.links.privacy'), href: '#' },
        { label: t('footer.links.terms'), href: '#' },
        { label: t('footer.links.cookie'), href: '#' },
      ]
    }
  ];

  return (
    <footer style={{
      background: 'var(--footer-bg)',
      borderTop: '1px solid var(--section-divider)',
      padding: '5rem 2rem 2rem',
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.5fr repeat(4, 1fr)',
          gap: '3rem',
          marginBottom: '4rem',
        }} className="footer-grid">
          <div className="footer-brand">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1.25rem' }}>
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: '#06B6D4', filter: 'drop-shadow(0 0 6px rgba(6, 182, 212, 0.4))' }}
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
              <span
                style={{
                  fontSize: '1.3rem',
                  fontWeight: 850,
                  letterSpacing: '-0.025em',
                  background: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 50%, #8B5CF6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontFamily: '"Outfit", sans-serif',
                }}
              >
                InterLink
              </span>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: '1.5rem', maxWidth: '28ch' }}>
              {t('footer.about_desc')}
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="email"
                placeholder={t('footer.email_placeholder')}
                style={{
                  flex: 1, background: 'var(--input-bg)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 10, padding: '0.625rem 0.875rem',
                  color: 'var(--text-primary)', fontSize: '0.8125rem', outline: 'none',
                  minWidth: 0,
                }}
              />
              <button className="btn-primary" style={{ padding: '0.625rem 1rem', fontSize: '0.8rem', borderRadius: 10, backgroundColor: 'var(--btn-primary-bg)', color: 'white', border: 'none', cursor: 'pointer' }}>
                {t('footer.subscribe')}
              </button>
            </div>
          </div>

          {footerSections.map((section) => (
            <div key={section.heading} className="footer-link-card">
              <h4 style={{
                fontFamily: 'Manrope, sans-serif',
                fontSize: '0.8rem', fontWeight: 700,
                letterSpacing: '0.07em', textTransform: 'uppercase',
                color: 'var(--text-muted)', margin: '0 0 1.25rem',
                display: 'flex', alignItems: 'center', gap: '0.5rem'
              }}>
                <span className="footer-section-icon">{section.icon}</span>
                {section.heading}
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {section.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                    >{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: '1rem',
          paddingTop: '2rem',
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>
            © {new Date().getFullYear()} InterLink. {t('footer.rights_reserved')}
          </p>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            {[
              { label: t('footer.privacy_policy'), href: '#' },
              { label: t('footer.terms_service'), href: '#' },
              { label: t('footer.cookie_policy'), href: '#' }
            ].map((link) => (
              <a key={link.label} href={link.href} style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              >{link.label}</a>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('footer.made_with')}</span>
            <span style={{ fontSize: '0.9rem' }}>❤️</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('footer.in_cameroon')}</span>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) { .footer-grid { grid-template-columns: 1fr 1fr !important; } }
      `}</style>
    </footer>
  );
}

export default Footer;
