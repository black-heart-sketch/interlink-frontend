import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguageCycle } from '../../hooks/useLanguageCycle';

function CTASection() {
  const { t } = useTranslation();
  const currentLanguage = useLanguageCycle(3000);
  return (
    <section className="page-section" style={{
      position: 'relative',
      overflow: 'hidden',
      background: 'var(--cta-gradient)',
      borderTop: '1px solid var(--section-divider)',
    }}>
      {/* Glowing orbs */}
      <div style={{ position: 'absolute', top: '-20%', left: '30%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.15), transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-20%', right: '20%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.1), transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '0.35rem 1rem', borderRadius: 999,
          background: 'rgba(245,158,11,0.12)', color: '#fbbf24',
          border: '1px solid rgba(245,158,11,0.25)',
          fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
          marginBottom: '1.5rem',
        }}>
          🚀 {t('cta.label')}
        </span>

        <h2 style={{
          fontFamily: 'Manrope, sans-serif',
          fontSize: 'clamp(2.25rem, 5vw, 3.75rem)',
          fontWeight: 900, lineHeight: 1.1,
          letterSpacing: '-0.04em',
          color: 'var(--text-primary)',
          margin: '0 0 1.25rem',
        }}>
          The future of <span className="gradient-text" style={{ transition: 'all 0.5s ease' }}>{currentLanguage}</span><br />
          <span className="gradient-text">{t('cta.heading_2')}</span>
        </h2>

        <p style={{ fontSize: '1.0625rem', color: 'var(--text-secondary)', lineHeight: 1.75, maxWidth: '50ch', margin: '0 auto 2.5rem' }}>
          {t('cta.sub')}
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2rem' }}>
          <Link to="/register" className="btn-primary" style={{ padding: '1rem 2.25rem', fontSize: '1rem' }}>
            {t('cta.enrol_free')} →
          </Link>
          <a href="#courses" className="btn-ghost" style={{ padding: '1rem 2.25rem', fontSize: '1rem' }}
            onClick={(e) => { e.preventDefault(); document.querySelector('#courses')?.scrollIntoView({ behavior: 'smooth' }); }}>
            {t('cta.explore')}
          </a>
        </div>

        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          ✓ {t('cta.check1')} &nbsp;·&nbsp; ✓ {t('cta.check2')} &nbsp;·&nbsp; ✓ {t('cta.check3')}
        </p>
      </div>
    </section>
  );
}

export default CTASection;
