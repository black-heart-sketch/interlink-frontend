import React, { useState } from 'react';

const FAQSection = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleAccordion = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const faqData = [
    {
      q: 'What is InterLink?',
      a: 'InterLink is a modern technology enterprise specialized in building intelligent digital systems (software, websites, and mobile apps), AI integrations, cybersecurity audits, IoT systems, and providing high-quality hands-on internship programs for tech students.'
    },
    {
      q: 'Who can apply for an internship at InterLink?',
      a: 'Active university students, coding school graduates, and self-taught developers specialized in Software Engineering, Cybersecurity, AI Development, Web/Mobile Apps, or Graphic Design are highly encouraged to apply.'
    },
    {
      q: 'How does the AI-powered platform work?',
      a: 'Our custom AI engines help student interns by suggesting relevant tasks, assisting in writing professional daily/weekly reports, and offering an inline AI chat assistant. For supervisors, the AI assists by reviewing reports and analyzing student progress.'
    },
    {
      q: 'Are the internship programs remote or on-site?',
      a: 'We offer hybrid, fully on-site, and fully remote internship opportunities, depending on your department and supervisor alignment.'
    },
    {
      q: 'Do I get a certificate at the end of the internship?',
      a: 'Yes! Upon successful completion of your internship and final supervisor review, InterLink issues a verified digital certificate complete with a secure verification QR code and a shareable digital portfolio.'
    },
    {
      q: 'Can InterLink build custom applications for my business?',
      a: 'Absolutely! Our professional team delivers high-performance software engineering, custom AI integrations, cybersecurity assessments, and branding/creative flyer and graphic design services for global clients.'
    }
  ];

  return (
    <section id="faq" className="page-section wide-container" style={{ maxWidth: 1280, margin: '0 auto', position: 'relative', zIndex: 10 }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <div className="section-label" style={{ display: 'inline-flex', marginBottom: '1rem' }}>❓ FAQ</div>
        <h2 className="section-heading">Frequently Asked Questions</h2>
        <p className="section-sub">Have questions? We have answers. Find everything you need to know about InterLink's services and internship program below.</p>
      </div>

      {/* Strict 2-column grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '1.25rem',
      }}>
        {faqData.map((faq, index) => {
          const isOpen = activeIndex === index;
          return (
            <div
              key={index}
              className="glass"
              style={{
                borderRadius: 18,
                overflow: 'hidden',
                border: isOpen ? '1px solid rgba(6,182,212,0.25)' : '1px solid var(--glass-border)',
                background: isOpen ? 'rgba(6,182,212,0.05)' : 'var(--glass-bg)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <button
                onClick={() => toggleAccordion(index)}
                style={{
                  width: '100%',
                  padding: '1.35rem 1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flex: 1 }}>
                  {/* Number badge */}
                  <span style={{
                    flexShrink: 0,
                    width: 28, height: 28,
                    borderRadius: 8,
                    background: isOpen ? 'rgba(6,182,212,0.2)' : 'rgba(255,255,255,0.06)',
                    border: isOpen ? '1px solid rgba(6,182,212,0.3)' : '1px solid var(--glass-border)',
                    color: isOpen ? '#06b6d4' : 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.7rem', fontWeight: 800,
                    transition: 'all 0.3s',
                    marginTop: 1,
                  }}>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span style={{
                    fontSize: '0.97rem',
                    fontWeight: 700,
                    color: isOpen ? '#06b6d4' : 'var(--text-primary)',
                    lineHeight: 1.5,
                    transition: 'color 0.3s',
                  }}>
                    {faq.q}
                  </span>
                </div>
                <span style={{
                  flexShrink: 0,
                  width: 26, height: 26,
                  borderRadius: '50%',
                  background: isOpen ? 'rgba(6,182,212,0.15)' : 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--glass-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: isOpen ? '#06b6d4' : 'var(--text-muted)',
                  fontSize: '1rem', fontWeight: 800,
                  transform: isOpen ? 'rotate(45deg)' : 'rotate(0)',
                  transition: 'all 0.3s ease',
                }}>
                  +
                </span>
              </button>

              <div style={{
                maxHeight: isOpen ? '400px' : '0',
                overflow: 'hidden',
                transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                opacity: isOpen ? 1 : 0,
              }}>
                <div style={{
                  padding: '0 1.5rem 1.5rem 4.25rem',
                  color: 'var(--text-secondary)',
                  fontSize: '0.9rem',
                  lineHeight: 1.75,
                }}>
                  {faq.a}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @media (max-width: 768px) {
          #faq > div:nth-child(2) {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
};

export default FAQSection;

