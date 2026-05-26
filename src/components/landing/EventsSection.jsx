import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const departments = [
  {
    name: 'Software Engineering',
    icon: '💻',
    accent: '#2563EB',
    bg: 'rgba(37,99,235,0.1)',
    desc: 'Build robust desktop, web, and enterprise applications using modern architectures, robust data pipelines, and design patterns.',
    techs: ['React', 'Node.js', 'Python', 'Docker', 'CI/CD']
  },
  {
    name: 'Cybersecurity',
    icon: '🛡️',
    accent: '#EF4444',
    bg: 'rgba(239,68,68,0.1)',
    desc: 'Audit system vulnerabilities, secure network protocols, test database injections, and implement state-of-the-art encryption defenses.',
    techs: ['Linux', 'Wireshark', 'Metasploit', 'OWASP Top 10']
  },
  {
    name: 'IoT Engineering',
    icon: '🔌',
    accent: '#F59E0B',
    bg: 'rgba(245,158,11,0.1)',
    desc: 'Engineer connected hardware systems, design microcontrollers, and develop sensor networks for modern industry automation.',
    techs: ['Arduino', 'Raspberry Pi', 'ESP32', 'MQTT', 'C++']
  },
  {
    name: 'AI Development',
    icon: '🤖',
    accent: '#8B5CF6',
    bg: 'rgba(139,92,246,0.1)',
    desc: 'Implement deep learning neural networks, process languages with NLP, and program predictive analytics or intelligent automated agents.',
    techs: ['PyTorch', 'TensorFlow', 'Pandas', 'OpenAI APIs', 'NLP']
  },
  {
    name: 'Graphic Design',
    icon: '🎨',
    accent: '#EC4899',
    bg: 'rgba(236,72,153,0.1)',
    desc: 'Craft professional corporate branding, UI system mockups, visual banners, and beautiful vector-based marketing flyers.',
    techs: ['Figma', 'Illustrator', 'Photoshop', 'Branding Design']
  },
  {
    name: 'Web & Mobile Development',
    icon: '📱',
    accent: '#06B6D4',
    bg: 'rgba(6,182,212,0.1)',
    desc: 'Design beautiful, highly responsive user experiences and engineer modern cross-platform web and mobile applications.',
    techs: ['Next.js', 'Flutter', 'React Native', 'Tailwind v4']
  }
];

function EventsSection() {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  return (
    <section
      id="internship"
      className="page-section wide-container"
      style={{ maxWidth: 1280, margin: '0 auto', position: 'relative', zIndex: 10 }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <div className="section-label" style={{ display: 'inline-flex', marginBottom: '1rem' }}>
          🎓 INTERNSHIP PROGRAM
        </div>
        <h2 className="section-heading">
          Explore Our Active Internship<br />
          <span className="gradient-text" style={{ background: 'linear-gradient(135deg, #06B6D4 0%, #8B5CF6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Departments.</span>
        </h2>
        <p className="section-sub">
          Accelerate your career in technology. Work on real production systems under expert supervisor mentorship and track your growth with our AI-powered analytics dashboard.
        </p>
      </div>

      {/* Grid of departments */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '1.5rem',
        marginBottom: '4rem'
      }}>
        {departments.map((dept, idx) => {
          const isHovered = hoveredIdx === idx;
          return (
            <div
              key={idx}
              className="glass"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{
                borderRadius: 24,
                padding: '2.25rem 2rem',
                position: 'relative',
                overflow: 'hidden',
                borderTop: `2px solid ${dept.accent}40`,
                transition: 'all 0.35s cubic-bezier(0.23, 1, 0.32, 1)',
                boxShadow: isHovered
                  ? `0 24px 60px -12px ${dept.accent}20, var(--glass-shadow)`
                  : 'var(--glass-shadow)',
                transform: isHovered ? 'translateY(-6px)' : 'none',
              }}
            >
              {/* Glow spot */}
              <div style={{
                position: 'absolute', top: -40, right: -40,
                width: 140, height: 140, borderRadius: '50%',
                background: `radial-gradient(circle, ${dept.accent}15, transparent 70%)`,
                pointerEvents: 'none',
                opacity: isHovered ? 1 : 0.5,
                transition: 'opacity 0.3s'
              }} />

              {/* Icon badge */}
              <div style={{
                width: 56, height: 56, borderRadius: 16,
                background: dept.bg,
                border: `1px solid ${dept.accent}25`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.75rem',
                marginBottom: '1.5rem',
              }}>
                {dept.icon}
              </div>

              <h3 style={{
                fontFamily: 'Manrope, sans-serif',
                fontSize: '1.25rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                margin: '0 0 0.875rem',
                lineHeight: 1.3
              }}>
                {dept.name}
              </h3>

              <p style={{
                fontSize: '0.9rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.65,
                margin: '0 0 1.5rem',
                minHeight: '75px'
              }}>
                {dept.desc}
              </p>

              {/* Tech Tags */}
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {dept.techs.map((tech, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: '0.725rem',
                      fontWeight: 700,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '8px',
                      padding: '0.3rem 0.6rem',
                      color: 'var(--text-muted)'
                    }}
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA Box */}
      <div
        className="glass"
        style={{
          borderRadius: 24,
          padding: '3rem',
          textAlign: 'center',
          border: '1px solid var(--glass-border)',
          background: 'var(--glass-bg)',
          boxShadow: 'var(--glass-shadow)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{
          position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)',
          width: '80%', height: '120%', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 60%)',
          pointerEvents: 'none'
        }} />
        <h3 style={{
          fontSize: '1.75rem',
          fontWeight: 850,
          color: 'var(--text-primary)',
          margin: '0 0 0.75rem',
          fontFamily: 'Manrope, sans-serif'
        }}>
          Ready to launch your technical career?
        </h3>
        <p style={{
          fontSize: '1rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          maxWidth: '650px',
          margin: '0 auto 2rem'
        }}>
          Applications for our upcoming technical cohort are now open. Choose your preferred department and start your journey with a modern enterprise today.
        </p>
        <Link
          to="/register"
          className="btn-primary"
          style={{
            display: 'inline-flex',
            padding: '1rem 2.25rem',
            fontSize: '0.95rem',
            borderRadius: '16px',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #06B6D4, #8B5CF6)',
            border: 'none',
            color: '#fff',
            boxShadow: '0 10px 25px -5px rgba(6,182,212,0.4)',
            textDecoration: 'none'
          }}
        >
          Apply for Internship Now →
        </Link>
      </div>
    </section>
  );
}

export default EventsSection;

