import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

function GallerySection() {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState(null);
  const projectsData = [
    { title: t('gallery.projects.crm.title'), category: t('gallery.projects.crm.category'), image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80', desc: t('gallery.projects.crm.desc'), tech: 'React • Node.js • Express • Socket.IO' },
    { title: t('gallery.projects.health.title'), category: t('gallery.projects.health.category'), image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&q=80', desc: t('gallery.projects.health.desc'), tech: 'Flutter • WebRTC • Firebase' },
    { title: t('gallery.projects.security.title'), category: t('gallery.projects.security.category'), image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&q=80', desc: t('gallery.projects.security.desc'), tech: 'Python • Bash • Wireshark • Linux' },
    { title: t('gallery.projects.iot.title'), category: t('gallery.projects.iot.category'), image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80', desc: t('gallery.projects.iot.desc'), tech: 'C++ • ESP32 • MQTT • Python' },
    { title: t('gallery.projects.ai.title'), category: t('gallery.projects.ai.category'), image: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=800&q=80', desc: t('gallery.projects.ai.desc'), tech: 'Python • Gemini API • Pinecone' },
    { title: t('gallery.projects.branding.title'), category: t('gallery.projects.branding.category'), image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80', desc: t('gallery.projects.branding.desc'), tech: 'Figma • Illustrator • Photoshop' }
  ];

  return (
    <section
      id="projects"
      className="page-section wide-container"
      style={{ maxWidth: 1280, margin: '0 auto', position: 'relative', zIndex: 10 }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <div className="section-label" style={{ display: 'inline-flex', marginBottom: '1rem' }}>
          💻 {t('gallery.label')}
        </div>
        <h2 className="section-heading">
          {t('gallery.heading_1')}<br />
          <span className="gradient-text" style={{ background: 'linear-gradient(135deg, #06B6D4 0%, #8B5CF6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{t('gallery.heading_2')}</span>
        </h2>
        <p className="section-sub">
          {t('gallery.sub')}
        </p>
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '1.5rem',
      }}>
        {projectsData.map((project, idx) => {
          const isHovered = hovered === idx;
          return (
            <div
              key={idx}
              onMouseEnter={() => setHovered(idx)}
              onMouseLeave={() => setHovered(null)}
              style={{
                borderRadius: 24,
                overflow: 'hidden',
                position: 'relative',
                aspectRatio: '16/11',
                cursor: 'pointer',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--glass-border)',
                boxShadow: isHovered
                  ? '0 30px 60px -15px rgba(6, 182, 212, 0.25)'
                  : 'none',
                transform: isHovered ? 'translateY(-6px)' : 'none',
                transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)'
              }}
              className="gallery-item"
            >
              {/* Background Image */}
              <img
                src={project.image}
                alt={project.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                  transition: 'transform 0.8s cubic-bezier(0.25, 1, 0.3, 1)',
                  transform: isHovered ? 'scale(1.08)' : 'scale(1)',
                  filter: isHovered ? 'brightness(0.95)' : 'brightness(0.8)'
                }}
              />

              {/* Gradient Overlay */}
              <div style={{
                position: 'absolute',
                inset: 0,
                background: isHovered
                  ? 'linear-gradient(to top, rgba(6, 9, 26, 0.98) 15%, rgba(6, 9, 26, 0.75) 60%, rgba(6, 9, 26, 0.4) 100%)'
                  : 'linear-gradient(to top, rgba(6, 9, 26, 0.9) 0%, rgba(6, 9, 26, 0.4) 70%, transparent 100%)',
                transition: 'background 0.3s ease'
              }} />

              {/* Tech tag at the top right */}
              <span style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: 'rgba(6, 182, 212, 0.2)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                borderRadius: '8px',
                padding: '0.3rem 0.65rem',
                fontSize: '0.65rem',
                fontWeight: 800,
                color: '#06B6D4',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                transition: 'all 0.3s'
              }}>
                {project.category}
              </span>

              {/* Text & Content Overlay */}
              <div style={{
                position: 'absolute',
                bottom: '1.5rem',
                left: '1.5rem',
                right: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                transform: isHovered ? 'translateY(0)' : 'translateY(8px)',
                transition: 'transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)'
              }}>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: '#fff',
                  margin: 0,
                  fontFamily: 'Manrope, sans-serif'
                }}>
                  {project.title}
                </h3>
                
                {/* Description - expanded on hover */}
                <p style={{
                  fontSize: '0.875rem',
                  color: '#cbd5e1',
                  margin: 0,
                  lineHeight: 1.5,
                  maxHeight: isHovered ? '80px' : '0px',
                  opacity: isHovered ? 1 : 0,
                  overflow: 'hidden',
                  transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)'
                }}>
                  {project.desc}
                </p>

                {/* Tech specifications */}
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'rgba(255, 255, 255, 0.5)',
                  marginTop: '0.25rem',
                  letterSpacing: '0.02em'
                }}>
                  {project.tech}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default GallerySection;
