import { Link } from 'react-router-dom';

function Footer() {
  const footerSections = [
    {
      heading: 'Services',
      icon: '🛠️',
      links: [
        { label: 'Software Development', href: '/#services' },
        { label: 'AI Solutions', href: '/#services' },
        { label: 'Cybersecurity', href: '/#services' },
        { label: 'IoT Engineering', href: '/#services' },
        { label: 'Graphic Design', href: '/#services' },
        { label: 'Internship Training', href: '/#services' },
      ]
    },
    {
      heading: 'Platform',
      icon: '🧭',
      links: [
        { label: 'AI Assistant', href: '/#internship' },
        { label: 'Task Management', href: '/#internship' },
        { label: 'Daily Reports', href: '/#internship' },
        { label: 'Attendance', href: '/#internship' },
        { label: 'Lounge (Chat)', href: '/#internship' },
        { label: 'Dashboard', href: '/dashboard' },
      ]
    },
    {
      heading: 'Company',
      icon: '🏢',
      links: [
        { label: 'About Us', href: '/#about' },
        { label: 'Our Projects', href: '/#projects' },
        { label: 'Contact Us', href: '/#contact' },
        { label: 'Careers', href: '#' },
      ]
    },
    {
      heading: 'Legal',
      icon: '⚖️',
      links: [
        { label: 'Privacy Policy', href: '#' },
        { label: 'Terms of Service', href: '#' },
        { label: 'Cookie Policy', href: '#' },
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
              Connecting innovation to the future. Empowering businesses and students through software engineering, cybersecurity, AI, and creative digital solutions.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="email"
                placeholder="Enter your email"
                style={{
                  flex: 1, background: 'var(--input-bg)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 10, padding: '0.625rem 0.875rem',
                  color: 'var(--text-primary)', fontSize: '0.8125rem', outline: 'none',
                  minWidth: 0,
                }}
              />
              <button className="btn-primary" style={{ padding: '0.625rem 1rem', fontSize: '0.8rem', borderRadius: 10, backgroundColor: 'var(--btn-primary-bg)', color: 'white', border: 'none', cursor: 'pointer' }}>
                Subscribe
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
            © {new Date().getFullYear()} InterLink. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            {[
              { label: 'Privacy Policy', href: '#' },
              { label: 'Terms of Service', href: '#' },
              { label: 'Cookie Policy', href: '#' }
            ].map((link) => (
              <a key={link.label} href={link.href} style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              >{link.label}</a>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Made with</span>
            <span style={{ fontSize: '0.9rem' }}>❤️</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>in Cameroon 🇨🇲</span>
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

