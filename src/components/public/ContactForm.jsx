import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { publicService } from '../../services/publicService';

const ContactForm = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    interest: 'language',
    message: ''
  });
  const [status, setStatus] = useState('idle'); // idle, submitting, success, error

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');
    try {
      await publicService.submitContactForm(formData);
      setStatus('success');
      setFormData({ fullName: '', email: '', phone: '', interest: 'language', message: '' });
    } catch (err) {
      console.error('Contact error', err);
      setStatus('error');
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '0.85rem 1.1rem',
    borderRadius: 14,
    border: '1px solid var(--glass-border)',
    background: 'rgba(255,255,255,0.04)',
    color: 'var(--text-primary)',
    fontSize: '0.9rem',
    fontFamily: 'Manrope, sans-serif',
    fontWeight: 600,
    outline: 'none',
    transition: 'border-color 0.25s, box-shadow 0.25s',
    boxSizing: 'border-box',
  };

  return (
    <section
      id="admission"
      className="page-section wide-container"
      style={{ maxWidth: 1280, margin: '0 auto', position: 'relative', zIndex: 10 }}
    >
      {/* Glows */}
      <div style={{
        position: 'absolute', top: '10%', left: '-5%',
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.06), transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '10%', right: '-5%',
        width: 350, height: 350, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16,185,129,0.05), transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '4rem', position: 'relative', zIndex: 2 }}>
        <div className="section-label" style={{ display: 'inline-flex', marginBottom: '1rem' }}>
          ✉️ Admission
        </div>
        <h2 className="section-heading">Démarrer votre admission</h2>
        <p className="section-sub">
          Laissez-nous vos coordonnées et l'un de nos conseillers vous contactera dans les plus brefs délais pour analyser votre projet.
        </p>
      </div>

      {/* Card */}
      <div
        className="glass"
        style={{
          maxWidth: 760,
          margin: '0 auto',
          borderRadius: 28,
          padding: '3rem',
          position: 'relative',
          zIndex: 2,
          borderTop: '2px solid rgba(59,130,246,0.3)',
          boxShadow: '0 40px 80px -20px rgba(0,0,0,0.5)',
        }}
      >
        {/* Glow spot */}
        <div style={{
          position: 'absolute', top: -30, right: -30,
          width: 180, height: 180, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.15), transparent 70%)',
          pointerEvents: 'none',
        }} />

        {status === 'success' ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem 2rem',
            borderRadius: 20,
            background: 'rgba(16,185,129,0.08)',
            border: '1px solid rgba(52,211,153,0.2)',
          }}>
            <div style={{
              width: 72, height: 72,
              borderRadius: '50%',
              background: 'rgba(16,185,129,0.15)',
              border: '2px solid rgba(52,211,153,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2rem', margin: '0 auto 1.5rem',
            }}>✅</div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
              Demande envoyée !
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
              Merci de l'intérêt que vous portez à l'Institut Einstein. Notre équipe vous contactera très prochainement.
            </p>
            <button
              onClick={() => setStatus('idle')}
              style={{
                padding: '0.75rem 2rem',
                borderRadius: 999,
                background: 'rgba(16,185,129,0.15)',
                border: '1px solid rgba(52,211,153,0.3)',
                color: '#34d399',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                fontFamily: 'Manrope, sans-serif',
              }}
            >
              Envoyer une autre demande
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Nom complet *</label>
                <input
                  required type="text" name="fullName"
                  value={formData.fullName} onChange={handleChange}
                  style={inputStyle} placeholder="Jean Dupont"
                  onFocus={e => { e.target.style.borderColor = 'rgba(59,130,246,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--glass-border)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email *</label>
                <input
                  required type="email" name="email"
                  value={formData.email} onChange={handleChange}
                  style={inputStyle} placeholder="jean@exemple.com"
                  onFocus={e => { e.target.style.borderColor = 'rgba(59,130,246,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--glass-border)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Téléphone / WhatsApp</label>
                <input
                  type="tel" name="phone"
                  value={formData.phone} onChange={handleChange}
                  style={inputStyle} placeholder="+237 600 000 000"
                  onFocus={e => { e.target.style.borderColor = 'rgba(59,130,246,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--glass-border)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Programme d'intérêt</label>
                <select
                  name="interest" value={formData.interest} onChange={handleChange}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                  onFocus={e => { e.target.style.borderColor = 'rgba(59,130,246,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--glass-border)'; e.target.style.boxShadow = 'none'; }}
                >
                  <option value="language" style={{ background: '#1e293b' }}>Cours d'Allemand</option>
                  <option value="preparation" style={{ background: '#1e293b' }}>Préparation Ausbildung</option>
                  <option value="integration" style={{ background: '#1e293b' }}>Intégration Culturelle</option>
                  <option value="coaching" style={{ background: '#1e293b' }}>Visa Coaching</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Message (optionnel)</label>
              <textarea
                name="message" value={formData.message} onChange={handleChange}
                rows={4}
                style={{ ...inputStyle, resize: 'none', lineHeight: 1.7 }}
                placeholder="Parlez-nous de votre projet..."
                onFocus={e => { e.target.style.borderColor = 'rgba(59,130,246,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--glass-border)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            {status === 'error' && (
              <div style={{ padding: '0.75rem 1rem', borderRadius: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: '0.875rem', fontWeight: 600 }}>
                Une erreur est survenue. Veuillez réessayer.
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'submitting'}
              style={{
                padding: '1rem 2rem',
                borderRadius: 999,
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                color: '#fff',
                fontFamily: 'Manrope, sans-serif',
                fontWeight: 800,
                fontSize: '0.95rem',
                border: 'none',
                cursor: status === 'submitting' ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                opacity: status === 'submitting' ? 0.7 : 1,
                boxShadow: '0 8px 24px rgba(37,99,235,0.35)',
                transition: 'all 0.25s ease',
              }}
              onMouseEnter={e => { if (status !== 'submitting') e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
            >
              {status === 'submitting' ? (
                <>⏳ Envoi en cours...</>
              ) : (
                <>✉️ Envoyer ma demande</>
              )}
            </button>
          </form>
        )}
      </div>
    </section>
  );
};

export default ContactForm;
