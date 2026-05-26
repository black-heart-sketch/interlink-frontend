import React, { useState, useEffect } from 'react';

const aiFeatures = [
  {
    tag: 'Analytics',
    icon: '🧠',
    color: '#2563eb',
    title: 'AI Performance Analyzer',
    desc: 'Continuously evaluates intern check-ins, task completion speeds, report quality, and supervisor ratings to deliver real-time progress metrics.'
  },
  {
    tag: 'Automation',
    icon: '📝',
    color: '#06b6d4',
    title: 'AI Report Assistant',
    desc: 'Generates professional, structural daily and weekly reports from bulleted student drafts, improving grammar and highlighting achievements.'
  },
  {
    tag: 'Productivity',
    icon: '⚙️',
    color: '#8b5cf6',
    title: 'AI Task Recommendation',
    desc: 'Automatically suggests optimal developmental tasks to supervisors based on student performance, department, skills, and current timeline.'
  },
  {
    tag: 'Monitoring',
    icon: '🛡️',
    color: '#ef4444',
    title: 'AI Risk Guard',
    desc: 'Detects inactive interns, late report submissions, or low-performing trends to notify admins and supervisors before deadlines are missed.'
  },
  {
    tag: 'Evaluation',
    icon: '📜',
    color: '#10b981',
    title: 'AI Final Summarizer',
    desc: 'Synthesizes the entire internship journey—including completed tasks, skills acquired, and feedback—into a cohesive final summary.'
  },
  {
    tag: 'Collaboration',
    icon: '💬',
    color: '#f59e0b',
    title: 'Real-Time Copilot',
    desc: 'An on-demand AI chatbot that answers questions, explains complex coding tasks, and assists students directly inside their dashboard.'
  }
];

function FeaturesSection() {
  const [hovered, setHovered] = useState(null);

  const techTerms = ['Efficiency', 'Accuracy', 'Analytics', 'Intelligence', 'Automation'];
  const [techIndex, setTechIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTechIndex((prev) => (prev + 1) % techTerms.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const currentTech = techTerms[techIndex];

  return (
    <section
      id="features"
      className="page-section wide-container"
      style={{
        maxWidth: 1280,
        margin: '0 auto',
        position: 'relative',
        zIndex: 10,
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <div className="section-label" style={{ display: 'inline-flex', marginBottom: '1rem' }}>
          ✦ AI-POWERED PLATFORM
        </div>
        <h2 className="section-heading">
          Empowering Collaboration with AI<br />
          <span className="gradient-text" style={{ transition: 'all 0.5s ease', background: 'linear-gradient(135deg, #06B6D4 0%, #8B5CF6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{currentTech}.</span>
        </h2>
        <p className="section-sub">
          InterLink leverages advanced artificial intelligence models to streamline administrative overhead, enhance learning speed, and provide granular insights into student progression.
        </p>
      </div>

      {/* Strict 3×2 Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1.25rem',
        }}
      >
        {aiFeatures.map((f, i) => {
          const isHovered = hovered === i;
          return (
            <div
              key={i}
              className="glass feature-card"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{
                borderRadius: 22,
                padding: '2rem',
                cursor: 'default',
                position: 'relative',
                overflow: 'hidden',
                borderTop: `2px solid ${f.color}40`,
                transition: 'all 0.35s cubic-bezier(0.23, 1, 0.32, 1)',
                boxShadow: isHovered
                  ? `0 24px 60px -12px ${f.color}30, var(--glass-shadow)`
                  : 'var(--glass-shadow)',
                transform: isHovered ? 'translateY(-5px)' : 'none',
              }}
            >
              {/* Glow spot */}
              <div style={{
                position: 'absolute', top: -30, right: -30,
                width: 130, height: 130, borderRadius: '50%',
                background: `radial-gradient(circle, ${f.color}22, transparent 70%)`,
                pointerEvents: 'none',
                transition: 'opacity 0.35s',
                opacity: isHovered ? 1 : 0.5,
              }} />

              {/* Tag */}
              <span style={{
                display: 'inline-block',
                padding: '0.25rem 0.75rem',
                borderRadius: 999,
                fontSize: '0.68rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                background: `${f.color}18`,
                color: f.color,
                border: `1px solid ${f.color}30`,
                marginBottom: '1.25rem',
              }}>
                {f.tag}
              </span>

              {/* Icon */}
              <div style={{
                fontSize: '2.25rem',
                marginBottom: '1rem',
                width: 56, height: 56,
                borderRadius: 14,
                background: `${f.color}14`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `1px solid ${f.color}20`,
                transition: 'transform 0.35s ease',
                transform: isHovered ? 'scale(1.1)' : 'scale(1)',
              }}>
                {f.icon}
              </div>

              <h3 style={{
                fontFamily: 'Manrope, sans-serif',
                fontSize: '1.1rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                margin: '0 0 0.625rem',
                lineHeight: 1.4,
              }}>
                {f.title}
              </h3>
              <p style={{
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.7,
                margin: 0,
              }}>
                {f.desc}
              </p>
            </div>
          );
        })}
      </div>

      <style>{`
        @media (max-width: 900px) {
          #features > div:last-child {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 580px) {
          #features > div:last-child {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}

export default FeaturesSection;

