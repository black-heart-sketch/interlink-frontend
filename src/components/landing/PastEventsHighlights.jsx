import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { publicService } from '../../services/publicService';

const buildSpeaker = (name, role, focus) => ({
  name,
  role,
  message: `${name} shared practical guidance on ${focus}, connecting language confidence with real academic and professional outcomes.`,
  quote: `Progress becomes visible when learners can use the language with clarity, discipline, and cultural awareness.`,
  extra_info: `The session included guided demonstrations, learner questions, and concrete next steps for students preparing for interviews, exams, and international opportunities.`,
  highlights: [
    `Mapped ${focus} to real learner goals and measurable weekly milestones.`,
    'Explained how CEFR progression supports study, work, and visa readiness.',
    'Demonstrated how learners can build speaking confidence through short daily drills.',
    'Showed practical ways to prepare for embassy, school, and workplace conversations.',
    'Compared common exam mistakes with stronger preparation habits.',
    'Introduced peer-learning routines that keep students accountable after class.',
    'Outlined how cultural awareness improves communication and confidence.',
    'Shared a simple framework for tracking vocabulary, grammar, and fluency growth.',
    'Answered learner questions about admissions, documents, and interview readiness.',
    'Presented success habits used by students who stayed consistent for 90 days.',
    'Connected classroom lessons with real situations abroad and online.',
    'Closed with an action plan learners could begin the same week.',
  ],
  testimonials: [
    { author: 'Mireille K.', role: 'A2 learner', text: 'The explanations were clear and gave me a real plan for improving my speaking.' },
    { author: 'Daniel N.', role: 'Exam candidate', text: 'I finally understood how to prepare without wasting time on random materials.' },
    { author: 'Chiara B.', role: 'Italian learner', text: 'The session felt practical, encouraging, and very international.' },
    { author: 'Andre T.', role: 'Parent', text: 'It gave me confidence that the institute follows serious standards.' },
    { author: 'Sofia M.', role: 'French learner', text: 'I liked the focus on culture, pronunciation, and real conversation.' },
    { author: 'Kevin A.', role: 'Prospective student', text: 'The roadmap made the language journey feel achievable.' },
  ],
});

const curatedPastEvents = [
  {
    _id: 'curated-global-pathways-2026',
    title: 'Global Pathways Language Forum',
    date: '2026-04-12T10:00:00.000Z',
    description: 'A practical forum on language readiness, international study preparation, and learner confidence for students planning opportunities across Europe.',
    attendees: 320,
    image: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=1470&auto=format&fit=crop',
    speakers: [
      buildSpeaker('Dr. Elena Fischer', 'CEFR Curriculum Advisor', 'CEFR-aligned language progression'),
      buildSpeaker('Marc Dubois', 'Academic Mobility Mentor', 'French and European study readiness'),
      buildSpeaker('Giulia Romano', 'Intercultural Communication Coach', 'Italian communication and cultural fluency'),
    ],
  },
  {
    _id: 'curated-career-readiness-2026',
    title: 'Career-Ready Multilingual Bootcamp',
    date: '2026-03-08T09:30:00.000Z',
    description: 'An applied bootcamp helping learners connect German, French, English, and Italian communication skills with interviews, workplace tasks, and exam discipline.',
    attendees: 275,
    image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=1470&auto=format&fit=crop',
    speakers: [
      buildSpeaker('Nadia Mbarga', 'Language Exam Strategist', 'exam performance and structured revision'),
      buildSpeaker('Thomas Weber', 'German Interview Coach', 'professional German for interviews'),
      buildSpeaker('Laura Bianchi', 'Student Success Lead', 'learner accountability and study planning'),
    ],
  },
];

const PastEventsHighlights = () => {
  const { t } = useTranslation();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [eventIndex, setEventIndex] = useState(0);
  const [speakerIndex, setSpeakerIndex] = useState(0);
  const [testimonialPage, setTestimonialPage] = useState(1);
  const [highlightPage, setHighlightPage] = useState(1);
  const [selectedHighlight, setSelectedHighlight] = useState(null);
  const [isMobileGrid, setIsMobileGrid] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001';

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await publicService.getEvents();
        const eventsWithSpeakers = Array.isArray(data) ? data.filter(e => e.speakers && e.speakers.length > 0) : [];
        setEvents([...eventsWithSpeakers, ...curatedPastEvents]);
      } catch (err) {
        console.error('Failed to load past highlights', err);
        setEvents(curatedPastEvents);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();

    const syncViewport = () => setIsMobileGrid(window.innerWidth <= 900);
    syncViewport();
    window.addEventListener('resize', syncViewport);
    return () => window.removeEventListener('resize', syncViewport);
  }, []);

  if (loading) return null;
  if (events.length === 0) return null;

  const currentEventData = events[eventIndex];
  const currentSpeakerData = currentEventData.speakers[speakerIndex] || currentEventData.speakers[0];
  
  // Fallbacks for images if they don't exist
  const currentEventImage = currentEventData.image 
    ? (currentEventData.image.startsWith('http') ? currentEventData.image : `${API_URL}${currentEventData.image}`)
    : "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1470&auto=format&fit=crop";

  const currentSpeakerImage = currentSpeakerData?.image 
    ? (currentSpeakerData.image.startsWith('http') ? currentSpeakerData.image : `${API_URL}${currentSpeakerData.image}`)
    : currentEventImage;

  const testimonials = currentSpeakerData?.testimonials || [];
  const highlights = currentSpeakerData?.highlights || [];

  const testimonialsPerPage = 4;
  const totalTPages = Math.ceil(testimonials.length / testimonialsPerPage) || 1;
  const currentTestimonials = testimonials.slice((testimonialPage - 1) * testimonialsPerPage, testimonialPage * testimonialsPerPage);

  const highlightsPerPage = 4;
  const totalHPages = Math.ceil(highlights.length / highlightsPerPage) || 1;
  const currentHighlights = highlights.slice((highlightPage - 1) * highlightsPerPage, highlightPage * highlightsPerPage);

  const handleNextEvent = () => {
    setEventIndex((prev) => (prev + 1) % events.length);
    setSpeakerIndex(0);
    setTestimonialPage(1);
    setHighlightPage(1);
  };

  const handlePrevEvent = () => {
    setEventIndex((prev) => (prev - 1 + events.length) % events.length);
    setSpeakerIndex(0);
    setTestimonialPage(1);
    setHighlightPage(1);
  };

  const handleNextSpeaker = () => {
    setSpeakerIndex((prev) => (prev + 1) % currentEventData.speakers.length);
    setTestimonialPage(1);
    setHighlightPage(1);
  };

  const borderRadius = '10px';

  return (
    <section id="past-highlights" className="page-section wide-container" style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* Top Header */}
      <div className="past-events-header" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '3rem',
        borderBottom: '1px solid var(--section-divider)',
        paddingBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ 
            width: '40px', height: '40px', borderRadius, 
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem'
          }}>🗓️</div>
          <h2 style={{ 
            fontFamily: 'var(--font-display)', 
            fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em'
          }}>
            {t('past_events.section_title')}
          </h2>
        </div>
        {events.length > 1 && (
          <div className="past-events-actions" style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={handlePrevEvent} className="btn-ghost" style={{ padding: '0.6rem 1.25rem', fontSize: '0.8125rem', borderRadius, background: 'var(--card-bg)', border: '1px solid var(--glass-border)' }}>
              {t('past_events.prev_event')}
            </button>
            <button onClick={handleNextEvent} className="btn-ghost" style={{ padding: '0.6rem 1.25rem', fontSize: '0.8125rem', borderRadius, background: 'var(--card-bg)', border: '1px solid var(--glass-border)' }}>
              {t('past_events.next_event')}
            </button>
          </div>
        )}
      </div>

      <div className="past-events-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: '3.5rem' }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Main Showcase (Featured Speaker or Event) */}
          <div style={{ position: 'relative', borderRadius, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
            <img 
              src={currentSpeakerImage} 
              alt={currentSpeakerData?.name} 
              style={{ width: '100%', height: '420px', objectFit: 'cover', display: 'block', transition: 'all 0.5s ease' }}
            />
            {/* Overlay Info */}
            <div style={{ 
              position: 'absolute', bottom: 0, left: 0, right: 0, 
              background: 'var(--hero-overlay)', 
              padding: '2rem 1.75rem 1.25rem'
            }}>
              <div style={{ fontSize: '0.75rem', color: '#60a5fa', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>{t('past_events.featured')}</div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: 0 }}>{currentSpeakerData?.name}</h3>
              <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: 0 }}>{currentSpeakerData?.role}</p>
            </div>

            <div style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', 
              background: 'var(--nav-bg)', backdropFilter: 'blur(12px)', color: 'var(--text-primary)', 
              padding: '0.5rem 0.875rem', borderRadius, fontSize: '0.75rem', fontWeight: 700,
              border: '1px solid var(--glass-border)'
            }}>{t('past_events.event_label')} {eventIndex + 1}</div>
          </div>

          {/* Speaker Selection Icons */}
          {currentEventData.speakers.length > 1 && (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('past_events.select_speaker')}</span>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {currentEventData.speakers.map((s, idx) => {
                  const sImg = s.image ? (s.image.startsWith('http') ? s.image : `${API_URL}${s.image}`) : currentEventImage;
                  return (
                    <div 
                      key={idx} 
                      onClick={() => { setSpeakerIndex(idx); setTestimonialPage(1); setHighlightPage(1); }}
                      style={{ 
                        cursor: 'pointer',
                        padding: '2px', 
                        background: speakerIndex === idx ? '#3b82f6' : 'rgba(255,255,255,0.1)', 
                        borderRadius: '50%',
                        transition: 'all 0.3s ease',
                        transform: speakerIndex === idx ? 'scale(1.15)' : 'scale(1)'
                      }}
                    >
                      <img 
                        src={sImg} 
                        alt={s.name} 
                        style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '50%', border: '2px solid #06091a' }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Dynamic Speaker Card (Long Content) */}
          <div className="glass" style={{ 
            height: '450px', 
            display: 'flex', 
            flexDirection: 'column',
            borderRadius, 
            border: '1px solid var(--glass-border)',
            overflow: 'hidden',
            background: 'var(--card-bg)'
          }}>
            <div style={{ padding: '1.25rem 1.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <img src={currentSpeakerImage} style={{ width: '40px', height: '40px', borderRadius: '50%' }} alt={currentSpeakerData?.name} />
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{currentSpeakerData?.name}</h4>
                  <div style={{ fontSize: '0.7rem', color: '#60a5fa', fontWeight: 600 }}>{currentSpeakerData?.role}</div>
                </div>
              </div>
              {currentEventData.speakers.length > 1 && (
                <button onClick={handleNextSpeaker} style={{ 
                  background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', 
                  color: '#60a5fa', borderRadius, padding: '0.4rem 0.75rem', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 700
                }}>{t('past_events.next_speaker')}</button>
              )}
            </div>
            
            <div style={{ padding: '1.75rem', overflowY: 'auto', flex: 1 }} className="custom-scrollbar">
              <p style={{ fontSize: '0.9375rem', color: '#94a3b8', lineHeight: 1.8, margin: 0 }}>
                {currentSpeakerData?.message}
              </p>
              {currentSpeakerData?.quote && (
                <div style={{ marginTop: '2rem', padding: '1.25rem', background: 'rgba(59, 130, 246, 0.05)', borderRadius, borderLeft: '3px solid #3b82f6' }}>
                  <p style={{ fontSize: '0.875rem', color: '#cbd5e1', fontStyle: 'italic', margin: 0 }}>
                    "{currentSpeakerData.quote}"
                  </p>
                </div>
              )}
              <p style={{ fontSize: '0.9375rem', color: '#94a3b8', lineHeight: 1.8, marginTop: '1.5rem' }}>
                {currentSpeakerData?.extra_info}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h1 style={{ 
            fontFamily: 'var(--font-display)', 
            fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 1rem 0', lineHeight: 1.15
          }}>{currentEventData.title}</h1>
          
          <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.875rem', fontWeight: 600 }}>
              <span style={{ color: '#3b82f6' }}>📅</span> {new Date(currentEventData.date).toLocaleDateString()}
            </div>
            {currentEventData.attendees > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.875rem', fontWeight: 600 }}>
                <span style={{ color: '#3b82f6' }}>👥</span> {currentEventData.attendees}+
              </div>
            )}
          </div>

          <p style={{ fontSize: '1rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: '2.5rem' }}>
            {currentEventData.description}
          </p>

          <div style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {t('past_events.highlights_label')} — {currentSpeakerData?.name}
              </h3>
              {totalHPages > 1 && (
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  {Array.from({ length: totalHPages }, (_, i) => i + 1).map(page => (
                    <button 
                      key={page}
                      onClick={() => setHighlightPage(page)}
                      style={{ 
                        width: '24px', height: '24px', borderRadius: '4px', border: page === highlightPage ? 'none' : '1px solid rgba(255,255,255,0.1)', 
                        background: page === highlightPage ? '#10b981' : 'rgba(255,255,255,0.05)', 
                        color: '#fff', fontSize: '0.65rem', cursor: 'pointer', fontWeight: 700
                      }}
                    >{page}</button>
                  ))}
                </div>
              )}
            </div>
            <div className="past-highlights-grid" style={{ display: 'grid', gridTemplateColumns: isMobileGrid ? 'repeat(2, minmax(0, 1fr))' : '1fr', gap: '0.75rem' }}>
              {currentHighlights.map((text, i) => (
                text && (
                  <button
                    key={i}
                    type="button"
                    className="past-highlight-card"
                    onClick={() => setSelectedHighlight({ text, index: (highlightPage - 1) * highlightsPerPage + i + 1 })}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      color: '#94a3b8',
                      background: 'transparent',
                      border: 0,
                      padding: 0,
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ 
                      marginTop: '2px', minWidth: '18px', height: '18px', borderRadius: '50%', 
                      background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981'
                    }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                    <span style={{ fontSize: '0.9rem', lineHeight: 1.4 }}>{text}</span>
                  </button>
                )
              ))}
            </div>
          </div>

          {currentTestimonials.length > 0 && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>{t('past_events.comments_label')}</h3>
                {totalTPages > 1 && (
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {Array.from({ length: totalTPages }, (_, i) => i + 1).map(page => (
                      <button 
                        key={page}
                        onClick={() => setTestimonialPage(page)}
                        style={{ 
                          width: '24px', height: '24px', borderRadius: '4px', border: page === testimonialPage ? 'none' : '1px solid rgba(255,255,255,0.1)', 
                          background: page === testimonialPage ? '#3b82f6' : 'rgba(255,255,255,0.05)', 
                          color: '#fff', fontSize: '0.65rem', cursor: 'pointer', fontWeight: 700
                        }}
                      >{page}</button>
                    ))}
                  </div>
                )}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {currentTestimonials.map((test, idx) => (
                  <div key={idx} className="glass" style={{ 
                    padding: '1.125rem 1.5rem', 
                    borderRadius, 
                    background: 'var(--card-bg)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--text-primary)'
                  }}>
                    <p style={{ fontSize: '0.8125rem', fontWeight: 500, lineHeight: 1.5, marginBottom: '0.5rem' }}>
                      <span style={{ color: '#3b82f6', fontWeight: 800 }}>“</span> {test.text} <span style={{ color: '#3b82f6', fontWeight: 800 }}>”</span>
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{test.author}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>{test.role}</div>
                      </div>
                      <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#3b82f6', marginBottom: '2px' }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedHighlight && (
        <div
          className="highlight-modal-backdrop"
          onClick={() => setSelectedHighlight(null)}
          role="presentation"
        >
          <div
            className="highlight-modal glass"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={t('past_events.highlights_label')}
          >
            <button
              type="button"
              className="highlight-modal-close"
              onClick={() => setSelectedHighlight(null)}
              aria-label="Close highlight"
            >
              ×
            </button>
            <div className="section-label" style={{ marginBottom: '1rem' }}>
              {t('past_events.highlights_label')} #{selectedHighlight.index}
            </div>
            <div className="highlight-modal-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.45rem', lineHeight: 1.2, margin: '0 0 1rem', color: 'var(--text-primary)' }}>
              {currentSpeakerData?.name}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.75, margin: 0 }}>
              {selectedHighlight.text}
            </p>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #3b82f6; }
        
        @media (max-width: 1100px) {
          .past-events-layout {
            grid-template-columns: 1fr !important;
            gap: 3rem;
          }
        }
      `}</style>
    </section>
  );
};

export default PastEventsHighlights;
