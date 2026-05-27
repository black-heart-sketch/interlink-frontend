import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  background: 'var(--input-bg)',
  border: '1px solid var(--glass-border)',
  borderRadius: 12, padding: '0.75rem 1rem',
  color: 'var(--text-primary)', fontSize: '0.9rem',
  outline: 'none', fontFamily: 'inherit',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};
const focusStyle = { borderColor: 'rgba(6,182,212,0.6)', boxShadow: '0 0 0 3px rgba(6,182,212,0.1)' };
const blurStyle = { borderColor: 'var(--glass-border)', boxShadow: 'none' };

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function ContactSection() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const onSubmit = (e) => { e.preventDefault(); setLoading(true); setTimeout(() => { setLoading(false); setSent(true); }, 1500); };

  const topics = [
    { value: 'software', label: t('contact.topics.software') },
    { value: 'ai', label: t('contact.topics.ai') },
    { value: 'security', label: t('contact.topics.security') },
    { value: 'internship', label: t('contact.topics.internship') },
    { value: 'partnership', label: t('contact.topics.partnership') },
    { value: 'other', label: t('contact.topics.other') },
  ];

  return (
    <section id="contact" className="page-section" style={{ background: 'var(--bg-color)', borderTop: '1px solid var(--glass-border)' }}>
      <div className="wide-container" style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <div className="section-label" style={{ display: 'inline-flex', marginBottom: '1rem' }}>✉️ {t('contact.label')}</div>
          <h2 className="section-heading">
            {t('contact.heading_1')} <span className="gradient-text" style={{ background: 'linear-gradient(135deg, #06B6D4 0%, #8B5CF6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{t('contact.heading_2')}</span>
          </h2>
          <p className="section-sub">{t('contact.sub')}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '2.5rem', alignItems: 'start' }} className="contact-grid">
            {/* Info */}
            <div className="glass contact-card" style={{ borderRadius: 22, padding: '2rem' }}>
              <h3 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 1.5rem' }}>{t('contact.info_title')}</h3>
              {[
                { icon: '📍', label: t('contact.address'), value: t('contact.address_value') },
                { icon: '📧', label: t('contact.email'), value: 'contact@interlink.com' },
                { icon: '📞', label: t('contact.phone'), value: '+237 682 931 025' },
                { icon: '🕐', label: t('contact.hours'), value: t('contact.hours_value') },
              ].map((c, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.875rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: 38, height: 38, flexShrink: 0, borderRadius: 10, background: 'var(--highlight-bg)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>{c.icon}</div>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{c.label}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 2 }}>{c.value}</div>
                </div>
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1.25rem', display: 'flex', gap: '0.625rem' }}>
              {[{ l: 'f', c: '#1877f2' }, { l: '📸', c: '#e1306c' }, { l: 'in', c: '#0a66c2' }, { l: '💬', c: '#25d366' }].map((s, i) => (
                <button key={i} title={s.l} style={{ width: 38, height: 38, borderRadius: 9, background: `${s.c}18`, border: `1px solid ${s.c}30`, color: s.c, fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = s.c; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = `${s.c}18`; e.currentTarget.style.color = s.c; }}
                >{s.l}</button>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="glass contact-card" style={{ borderRadius: 22, padding: '2.5rem' }}>
            {sent ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                <h3 style={{ fontFamily: 'Manrope, sans-serif', color: '#34d399', margin: '0 0 0.5rem' }}>{t('contact.sent_title')}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{t('contact.sent_desc')}</p>
                <button className="btn-primary" style={{ marginTop: '1.5rem', background: 'linear-gradient(135deg, #06B6D4, #8B5CF6)', border: 'none', color: '#fff' }} onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', message: '' }); }}>{t('contact.send_another')}</button>
              </div>
            ) : (
              <form onSubmit={onSubmit}>
                <h3 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 1.75rem' }}>{t('contact.form_title')}</h3>
                <div className="contact-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <Field label={t('contact.full_name')}>
                    <input name="name" type="text" placeholder="John Doe" required value={form.name} onChange={onChange} style={inputStyle} onFocus={(e) => Object.assign(e.currentTarget.style, focusStyle)} onBlur={(e) => Object.assign(e.currentTarget.style, blurStyle)} />
                  </Field>
                  <Field label={t('contact.email_address')}>
                    <input name="email" type="email" placeholder="john@example.com" required value={form.email} onChange={onChange} style={inputStyle} onFocus={(e) => Object.assign(e.currentTarget.style, focusStyle)} onBlur={(e) => Object.assign(e.currentTarget.style, blurStyle)} />
                  </Field>
                </div>
                <Field label={t('contact.topic_interest')}>
                  <select name="subject" required value={form.subject} onChange={onChange} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="" style={{ background: 'var(--bg-color)' }}>{t('contact.select_topic')}</option>
                    {topics.map((o) => (
                      <option key={o.value} value={o.value} style={{ background: 'var(--bg-color)' }}>{o.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label={t('contact.your_message')}>
                  <textarea name="message" required rows={5} placeholder={t('contact.message_placeholder')} value={form.message} onChange={onChange} style={{ ...inputStyle, resize: 'vertical' }} onFocus={(e) => Object.assign(e.currentTarget.style, focusStyle)} onBlur={(e) => Object.assign(e.currentTarget.style, blurStyle)} />
                </Field>
                <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', opacity: loading ? 0.7 : 1, background: 'linear-gradient(135deg, #06B6D4, #8B5CF6)', border: 'none', color: '#fff' }} disabled={loading}>
                  {loading ? t('contact.sending') : t('contact.send_message')}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
      <style>{`@media(max-width:768px){.contact-grid{grid-template-columns:1fr !important;}}`}</style>
    </section>
  );
}

export default ContactSection;
