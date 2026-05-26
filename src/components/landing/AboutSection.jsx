import React from 'react';
import { Link } from 'react-router-dom';

function AboutSection() {
  return (
    <section
      id="about"
      className="page-section wide-container"
      style={{
        maxWidth: 1280,
        margin: '0 auto',
        position: 'relative',
        zIndex: 10,
        padding: '5rem 2rem'
      }}
    >
      {/* Background Glows */}
      <div style={{
        position: 'absolute', top: '20%', left: '-10%', width: 500, height: 500,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: '10%', right: '-10%', width: 400, height: 400,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1.1fr',
        gap: '4.5rem',
        alignItems: 'center'
      }} className="about-grid">
        {/* Left Column: Interactive Graphics Card */}
        <div style={{ position: 'relative' }} className="about-visual animate-float">
          <div style={{
            position: 'absolute', inset: -2, borderRadius: 24,
            background: 'linear-gradient(135deg, #06B6D433, #8B5CF633)',
            filter: 'blur(1px)',
            zIndex: 0
          }} />
          <div style={{
            position: 'relative',
            zIndex: 1,
            borderRadius: 22,
            overflow: 'hidden',
            aspectRatio: '5/4',
            boxShadow: '0 30px 70px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06)',
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            padding: '2.5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: '1.5rem'
          }}>
            {/* Tech network decoration */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#06b6d4', boxShadow: '0 0 10px #06b6d4' }} />
              <div style={{ flex: 1, height: 2, background: 'linear-gradient(to right, #06b6d4, #8b5cf6, transparent)' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Core Matrix</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Enterprise Value</div>
              <h4 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#fff', lineHeight: 1.25 }}>Connecting talent & businesses to advanced digital solutions.</h4>
            </div>

            {/* Glowing Specs Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
              <div style={{ padding: '1rem', borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>⚡</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>99.9% Scalable</div>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: 2 }}>High-performance core</div>
              </div>
              <div style={{ padding: '1rem', borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>🛡️</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>Fortified Systems</div>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: 2 }}>Secure by design</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Copy */}
        <div className="about-copy">
          <div className="section-label" style={{ display: 'inline-flex', marginBottom: '1.25rem' }}>
            ✦ ABOUT INTERLINK
          </div>
          <h2 className="section-heading" style={{ textAlign: 'left', margin: '0 0 1.5rem', lineHeight: 1.15 }}>
            Learn. Innovate. Connect.<br />
            <span className="gradient-text" style={{ background: 'linear-gradient(135deg, #06B6D4 0%, #8B5CF6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Our Technological DNA.</span>
          </h2>
          
          <p style={{
            fontSize: '1.025rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.75,
            margin: '0 0 2rem'
          }}>
            InterLink is a modern technology enterprise specialized in building intelligent digital systems, training young talents, and delivering professional software, cybersecurity, IoT, AI, and creative design solutions.
          </p>

          {/* Highlights */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem' }}>
            {[
              { title: 'Connected Technology Systems', desc: 'Engineering robust cloud platforms, mobile structures, and smart IoT device networks.', icon: '🌐' },
              { title: 'AI-Powered Orchestrations', desc: 'Optimizing manual tasks, evaluating student progress, and generating detailed reports.', icon: '🤖' },
              { title: 'Professional Mentorship Focus', desc: 'Empowering future developers through immersive real-world projects and expert supervisor logic.', icon: '🎓' }
            ].map((hl, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '1rem', alignItems: 'start' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.15)',
                  color: '#06b6d4', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1rem', flexShrink: 0, marginTop: 2
                }}>{hl.icon}</div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>{hl.title}</h4>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{hl.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <a href="#services" className="btn-primary" style={{ padding: '0.9rem 2rem', borderRadius: 14, fontSize: '0.9rem', fontWeight: 800, background: 'linear-gradient(135deg, #06B6D4, #2563EB)', border: 'none', color: '#fff', textDecoration: 'none' }}>
              Explore Services
            </a>
            <Link to="/register" className="btn-ghost" style={{ padding: '0.9rem 2rem', borderRadius: 14, fontSize: '0.9rem', fontWeight: 800, textDecoration: 'none' }}>
              Join Internship Program →
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .about-grid {
            grid-template-columns: 1fr !important;
            gap: 3.5rem !important;
          }
          .about-copy {
            order: 1;
          }
          .about-visual {
            order: 2;
            width: min(100%, 550px);
            margin: 0 auto;
          }
        }
      `}</style>
    </section>
  );
}

export default AboutSection;
