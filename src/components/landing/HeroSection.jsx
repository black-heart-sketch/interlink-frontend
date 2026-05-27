import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import HeroBackground3D from './HeroBackground3D';
import { heroSlides as slides } from '../../data/heroSlides';

function HeroSection() {
  const { t } = useTranslation();
  const [active, setActive] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const intervalRef = useRef(null);

  const techTerms = t('hero.tech_terms', { returnObjects: true });
  const [techIndex, setTechIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTechIndex((prev) => (prev + 1) % techTerms.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const currentTech = techTerms[techIndex];

  const goTo = (idx) => {
    if (transitioning || idx === active) return;
    setTransitioning(true);
    setTimeout(() => {
      setActive(idx);
      setTransitioning(false);
    }, 350);
  };

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTransitioning(true);
      setTimeout(() => {
        setActive((p) => (p + 1) % slides.length);
        setTransitioning(false);
      }, 350);
    }, 6000);
    return () => clearInterval(intervalRef.current);
  }, []);
  
  const slide = slides[active];
  const localizedBadge = slide.badge;
  const localizedTitle = slide.title;
  const localizedTitleAccent = slide.titleAccent;
  const localizedSubtitle = slide.subtitle;
  const localizedCTA = slide.cta;
  const localizedCTASecondary = slide.ctaSecondary;
  const localizedTag1 = slide.tag1;
  const localizedTag2 = slide.tag2;
  const localizedTag3 = slide.tag3;

  return (
    <section
      className="hero-bg noise"
      style={{
        minHeight: '100vh',
        paddingTop: '80px',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        zIndex: 1,
      }}
    >
      {/* 3D Animation Background */}
      <HeroBackground3D />

      {/* Ambient orbs */}
      <div style={{
        position: 'absolute', top: '15%', right: '5%', width: 520, height: 520,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 1
      }} />
      <div style={{
        position: 'absolute', bottom: '10%', left: '-5%', width: 400, height: 400,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 1
      }} />

      {/* Grid lines */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.02,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
        pointerEvents: 'none',
        zIndex: 1
      }} />

      <div style={{
        maxWidth: 1500, margin: '0 auto', padding: '4rem 2.5rem',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem',
        alignItems: 'center', width: '100%', position: 'relative', zIndex: 10,
      }}
        className="hero-grid"
      >
        {/* Left: Content */}
        <div className="hero-copy" style={{ opacity: transitioning ? 0 : 1, transform: transitioning ? 'translateY(16px)' : 'translateY(0)', transition: 'all 0.4s ease' }}>
          {/* Badge */}
          <div className="section-label animate-fade-up" style={{ marginBottom: '1.5rem' }}>
            <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#06b6d4', position: 'relative' }}>
              <span className="animate-ping" style={{
                position: 'absolute', inset: 0, borderRadius: '50%', background: '#06b6d4',
              }} />
            </span>
            {localizedBadge}
          </div>

          {/* Headline */}
          <h1 className="animate-fade-up-delay-1" style={{
            fontFamily: 'Manrope, sans-serif', fontWeight: 900,
            fontSize: 'clamp(2.5rem, 5.5vw, 4.5rem)',
            lineHeight: 1.05, letterSpacing: '-0.04em',
            color: 'var(--text-primary)', margin: '0 0 0.25rem',
          }}>
            {localizedTitle} <span className="gradient-text" style={{ transition: 'all 0.5s ease', background: 'linear-gradient(135deg, #06B6D4 0%, #8B5CF6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{currentTech}.</span>
            <br />
            <span style={{ fontSize: '0.85em', opacity: 0.9 }}>{localizedTitleAccent}</span>
          </h1>

          {/* Subtitle */}
          <p className="animate-fade-up-delay-2" style={{
            fontSize: '1.0625rem', color: 'var(--text-secondary)', lineHeight: 1.75,
            maxWidth: '52ch', margin: '1.25rem 0 2.25rem',
          }}>
            {localizedSubtitle}
          </p>

          {/* CTAs */}
          <div className="animate-fade-up-delay-3 hero-actions" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
            <Link to="/register" className="btn-primary" style={{ fontSize: '0.9375rem', background: 'linear-gradient(135deg, #2563EB, #06B6D4)', border: 'none', color: '#fff' }}>
              {localizedCTA} →
            </Link>
            <a href="#services" className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
              <span style={{ fontSize: '1rem' }}>▶</span> {localizedCTASecondary}
            </a>
          </div>

          {/* Tags */}
          <div className="animate-fade-up-delay-3 hero-tags" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[localizedTag1, localizedTag2, localizedTag3].map((t, i) => (
              <span key={i} className={i === 1 ? 'tag-pill-green' : i === 2 ? 'tag-pill-gold' : 'tag-pill'} style={{ padding: '0.4rem 0.875rem' }}>
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Right: Image */}
        <div className="animate-float hero-visual" style={{
          position: 'relative',
          opacity: transitioning ? 0 : 1,
          transform: transitioning ? 'scale(0.97)' : 'scale(1)',
          transition: 'all 0.45s ease',
          zIndex: 10
        }}>
          {/* Glow ring */}
          <div style={{
            position: 'absolute', inset: -2, borderRadius: 28,
            background: 'linear-gradient(135deg, #06B6D444, #8B5CF644, #2563EB44)',
            filter: 'blur(1px)',
            zIndex: 0,
          }} />

          <div style={{
            position: 'relative', zIndex: 1,
            borderRadius: 24,
            overflow: 'hidden',
            aspectRatio: '4/3',
            boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)',
          }}>
            <img
              src={slide.image}
            alt={t('hero.showcase_alt')}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            {/* Overlay gradient */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%',
              background: 'var(--hero-overlay)',
            }} />
          </div>

          {/* Floating stat cards */}
          <div className="glass hero-floating-card" style={{
            position: 'absolute', top: -18, right: -18, borderRadius: 16, padding: '0.875rem 1.25rem',
            zIndex: 2, minWidth: 150,
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#06b6d4', fontFamily: 'Manrope, sans-serif', lineHeight: 1 }}>99%</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>{t('hero.platform_success')}</div>
          </div>
          <div className="glass hero-floating-card" style={{
            position: 'absolute', bottom: -18, left: -18, borderRadius: 16, padding: '0.875rem 1.25rem',
            zIndex: 2, minWidth: 160,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {['💻','🤖','🛡️','🌐'].map((f, i) => (
                <span key={i} style={{ fontSize: '1.2rem' }}>{f}</span>
              ))}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 4 }}>{t('hero.tech_focus_areas')}</div>
          </div>
        </div>
      </div>

      {/* Slide dots */}
      <div style={{
        position: 'absolute', bottom: 36, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: 8, zIndex: 10,
      }}>
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            style={{
              width: i === active ? 28 : 8, height: 8,
              borderRadius: 4, border: 'none', cursor: 'pointer',
              background: i === active ? '#06b6d4' : 'rgba(255,255,255,0.2)',
              transition: 'all 0.35s ease',
              padding: 0,
            }}
            aria-label={t('hero.slide_label', { number: i + 1 })}
          />
        ))}
      </div>

      <style>{`
        @media (max-width: 968px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
            gap: 3rem !important;
            padding: 2.25rem 1.25rem 3.5rem !important;
            text-align: left !important;
            justify-items: start !important;
            align-items: start !important;
          }

          .hero-copy {
            display: flex;
            flex-direction: column;
            align-items: flex-start !important;
            max-width: 640px;
            margin: 0 !important;
            text-align: left !important;
          }

          .hero-copy .section-label {
            align-self: flex-start;
            max-width: 100%;
          }

          .animate-fade-up-delay-1 {
            text-align: left !important;
          }

          .animate-fade-up-delay-2 {
            margin-left: 0 !important;
            margin-right: 0 !important;
          }

          .animate-fade-up-delay-3 {
            justify-content: flex-start !important;
          }

          .hero-visual {
            justify-self: center;
            width: min(100%, 680px);
          }
        }
      `}</style>
    </section>
  );
}

export default HeroSection;
