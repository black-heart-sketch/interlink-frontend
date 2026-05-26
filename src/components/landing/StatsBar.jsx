import { useRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const stats = [
  { id: 'projects', label: 'Projects Completed', value: 48, suffix: '+', icon: 'fa-solid fa-code', accent: '#2563eb' },
  { id: 'interns', label: 'Interns Trained', value: 320, suffix: '+', icon: 'fa-solid fa-user-tie', accent: '#10b981' },
  { id: 'departments', label: 'Active Departments', value: 6, suffix: '', icon: 'fa-solid fa-sitemap', accent: '#f59e0b' },
  { id: 'satisfaction', label: 'Client Satisfaction', value: 98, suffix: '%', icon: 'fa-solid fa-face-smile', accent: '#8b5cf6' },
  { id: 'supervisors', label: 'Expert Supervisors', value: 14, suffix: '+', icon: 'fa-solid fa-user-shield', accent: '#06b6d4' },
  { id: 'partners', label: 'Partner Institutions', value: 12, suffix: '+', icon: 'fa-solid fa-university', accent: '#ef4444' },
];

const recognitionStandards = [
  { title: 'AI-Enhanced Mentorship', detail: 'Real-time performance analytics, report evaluation, and tailored tasks suggested by AI models.', icon: 'fa-solid fa-robot' },
  { title: 'Industry-Standard Projects', detail: 'Collaborate on production-grade software development, cybersecurity audits, and IoT prototypes.', icon: 'fa-solid fa-laptop-code' },
  { title: 'Verified Professional Credentials', detail: 'Earn blockchain-ready digital certificates and interactive portfolio links to accelerate careers.', icon: 'fa-solid fa-certificate' },
];

function useCountUp(target, duration = 1800, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

function StatCard({ stat, startCount }) {
  const { t } = useTranslation();
  const count = useCountUp(stat.value, 1800, startCount);
  return (
    <div
      className="glass card-hover stat-card"
      style={{
        borderRadius: 20,
        padding: '2rem 1.5rem',
        textAlign: 'center',
        flex: '1 1 140px',
        cursor: 'default',
      }}
    >
      <div style={{
        width: 44,
        height: 44,
        borderRadius: 12,
        margin: '0 auto 0.9rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: stat.accent,
        background: `${stat.accent}14`,
        border: `1px solid ${stat.accent}26`
      }}>
        <i className={stat.icon} aria-hidden="true" />
      </div>
      <div className="stat-number">
        {count}{stat.suffix}
      </div>
      <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.375rem', fontWeight: 500 }}>
        {stat.label || t(`stats.${stat.id}`)}
      </div>
    </div>
  );
}

function StatsBar() {
  const { t } = useTranslation();
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className="page-section"
      style={{
        background: 'linear-gradient(180deg, var(--bg-color), rgba(37,99,235,0.045), var(--bg-color))',
        borderTop: '1px solid var(--glass-border)',
        borderBottom: '1px solid var(--glass-border)',
        position: 'relative',
        zIndex: 10
      }}
    >
      <div className="wide-container" style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', maxWidth: 820, margin: '0 auto 2.75rem' }}>
          <p style={{
            fontSize: '0.75rem', fontWeight: 800,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: 'var(--text-muted)', marginBottom: '0.9rem',
          }}>
            {t('stats.trusted_by', 'TRUSTED BY AMBITIOUS TALENT & LEADING ENTERPRISES')}
          </p>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 4vw, 3.2rem)',
            lineHeight: 1.05,
            margin: 0,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            fontWeight: 900
          }}>
            Aligned with modern industry standards.
          </h2>
          <p style={{
            margin: '1rem auto 0',
            maxWidth: 680,
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
            fontSize: '1rem'
          }}>
            InterLink combines cutting-edge software engineering, professional internship tracking, AI-assisted mentorship, and verifiable portfolio generation for tomorrow's technology leaders.
          </p>
        </div>

        <div className="stats-grid" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {stats.map((s, i) => (
            <StatCard key={i} stat={s} startCount={visible} />
          ))}
        </div>

        <div
          className="recognition-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: '1rem',
            marginTop: '1.25rem'
          }}
        >
          {recognitionStandards.map((item) => (
            <div
              key={item.title}
              className="glass"
              style={{
                borderRadius: 18,
                padding: '1.25rem',
                display: 'grid',
                gridTemplateColumns: '44px 1fr',
                gap: '1rem',
                alignItems: 'start',
                border: '1px solid var(--glass-border)',
                background: 'var(--glass-bg)'
              }}
            >
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(37,99,235,0.1)',
                color: '#3b82f6',
                border: '1px solid rgba(59,130,246,0.18)'
              }}>
                <i className={item.icon} aria-hidden="true" />
              </div>
              <div>
                <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: 800 }}>{item.title}</h3>
                <p style={{ margin: '0.35rem 0 0', color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.55 }}>{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @media (max-width: 860px) {
          .recognition-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}

export default StatsBar;

