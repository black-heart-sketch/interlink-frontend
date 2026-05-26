import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const accentColors = [
  { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', glow: 'rgba(59,130,246,0.18)' },
  { color: '#06b6d4', bg: 'rgba(6,182,212,0.12)', glow: 'rgba(6,182,212,0.18)' },
  { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', glow: 'rgba(139,92,246,0.18)' },
  { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', glow: 'rgba(239,68,68,0.18)' },
  { color: '#ec4899', bg: 'rgba(236,72,153,0.12)', glow: 'rgba(236,72,153,0.18)' },
  { color: '#10b981', bg: 'rgba(16,185,129,0.12)', glow: 'rgba(16,185,129,0.18)' },
];

const servicesData = [
  {
    title: 'Software Development',
    category: 'Engineering',
    icon: '💻',
    description: 'Design and build custom, high-performance web applications, fluid mobile applications, and scalable backend cloud-based databases tailored for your enterprise scaling.'
  },
  {
    title: 'AI Solutions',
    category: 'Intelligence',
    icon: '🤖',
    description: 'Maximize business efficiency with custom neural network models, natural language processing tools, custom LLM integrations, and intelligent automated workflow agents.'
  },
  {
    title: 'Cybersecurity',
    category: 'Security',
    icon: '🛡️',
    description: 'Protect your enterprise assets with comprehensive network auditing, professional penetration testing, source code analysis, and high-standard encryption integrations.'
  },
  {
    title: 'IoT Engineering',
    category: 'Hardware',
    icon: '🔌',
    description: 'Develop intelligent connected hardware prototypes, smart sensor monitoring networks, and firmware applications engineered for custom home/industrial automations.'
  },
  {
    title: 'Flyer & Graphic Design',
    category: 'Creative',
    icon: '🎨',
    description: 'Create distinct visual identities with state-of-the-art corporate branding designs, interactive vector flyer designs, visual posters, and polished UI/UX website wireframes.'
  },
  {
    title: 'Internship Training',
    category: 'Academy',
    icon: '🎓',
    description: 'Accelerate tech careers for high-potential students through hands-on enterprise-grade projects, direct expert mentorship, daily schedules, and AI analytics.'
  }
];

const ProgramsList = () => {
  const [hovered, setHovered] = useState(null);

  return (
    <section
      id="services"
      className="page-section wide-container"
      style={{ maxWidth: 1280, margin: '0 auto', position: 'relative', zIndex: 10 }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <div className="section-label" style={{ display: 'inline-flex', marginBottom: '1rem' }}>
          🛠️ OUR SERVICES
        </div>
        <h2 className="section-heading">
          High-Performance Solutions for<br />
          <span className="gradient-text" style={{ background: 'linear-gradient(135deg, #06B6D4 0%, #8B5CF6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Modern Enterprises.</span>
        </h2>
        <p className="section-sub">
          We combine cutting-edge technology expertise with professional standards to deliver premium, reliable digital solutions that scale with your business goals.
        </p>
      </div>

      {/* Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {servicesData.map((service, index) => {
          const accent = accentColors[index % accentColors.length];
          const isHovered = hovered === index;
          return (
            <div
              key={index}
              className="glass"
              onMouseEnter={() => setHovered(index)}
              onMouseLeave={() => setHovered(null)}
              style={{
                borderRadius: 24,
                padding: '2rem',
                position: 'relative',
                overflow: 'hidden',
                borderTop: `2px solid ${accent.color}40`,
                transition: 'all 0.35s cubic-bezier(0.23, 1, 0.32, 1)',
                boxShadow: isHovered
                  ? `0 24px 60px -12px ${accent.glow}, var(--glass-shadow)`
                  : 'var(--glass-shadow)',
                transform: isHovered ? 'translateY(-4px)' : 'none',
              }}
            >
              {/* Glow spot */}
              <div style={{
                position: 'absolute', top: -40, right: -40,
                width: 150, height: 150, borderRadius: '50%',
                background: `radial-gradient(circle, ${accent.color}20, transparent 70%)`,
                pointerEvents: 'none',
                transition: 'opacity 0.35s',
                opacity: isHovered ? 1 : 0.5,
              }} />

              {/* Category tag */}
              <span style={{
                display: 'inline-block',
                padding: '0.25rem 0.85rem',
                borderRadius: 999,
                fontSize: '0.68rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                background: accent.bg,
                color: accent.color,
                border: `1px solid ${accent.color}30`,
                marginBottom: '1.25rem',
              }}>
                {service.category}
              </span>

              {/* Icon badge */}
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: accent.bg,
                border: `1px solid ${accent.color}25`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.5rem',
                marginBottom: '1.25rem',
              }}>
                {service.icon}
              </div>

              <h3 style={{
                fontFamily: 'Manrope, sans-serif',
                fontSize: '1.2rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                margin: '0 0 0.75rem',
                lineHeight: 1.3,
              }}>
                {service.title}
              </h3>

              <p style={{
                fontSize: '0.9rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.7,
                margin: '0 0 1.5rem',
                minHeight: '80px'
              }}>
                {service.description}
              </p>

              {/* CTA Link */}
              <a
                href="#contact"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '0.6rem 1.25rem',
                  borderRadius: 999,
                  background: accent.bg,
                  color: accent.color,
                  border: `1px solid ${accent.color}30`,
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  transition: 'all 0.25s ease',
                }}
              >
                Inquire Service
                <span style={{ fontSize: '0.9rem' }}>→</span>
              </a>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default ProgramsList;
