import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { examService } from '../services/examService';

export default function Exams() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const data = await examService.getExams();
        setExams(data);
      } catch (err) {
        setError('Failed to fetch exams.');
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, []);

  const getExamStatus = (exam) => {
    const now = new Date();
    const start = new Date(exam.startTime);
    const end = new Date(exam.endTime);

    if (now < start) return { label: 'À venir', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' };
    if (now >= start && now <= end) return { label: 'En cours', color: '#10b981', bg: 'rgba(16,185,129,0.1)' };
    return { label: 'Terminé', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' };
  };

  const handleStartExam = (exam) => {
    const now = new Date();
    const start = new Date(exam.startTime);
    if (now < start) {
      alert("Cet examen n'a pas encore commencé.");
      return;
    }
    const end = new Date(exam.endTime);
    if (now > end) {
      alert("Cet examen est terminé.");
      return;
    }
    navigate(`/exams/${exam._id}/take`);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">Chargement...</div>;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      <Navbar theme={theme} toggleTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} />
      
      <div style={{ padding: '120px 2rem 4rem 2rem', flex: 1, maxWidth: 1000, margin: '0 auto', width: '100%' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>Module d'Examen 📝</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Retrouvez ici tous vos examens programmés.</p>
        </div>

        {error && <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: 12, marginBottom: '1rem' }}>{error}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {exams.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 16 }}>
              <p style={{ color: '#94a3b8' }}>Aucun examen disponible pour le moment.</p>
            </div>
          ) : (
            exams.map(exam => {
              const status = getExamStatus(exam);
              return (
                <div key={exam._id} style={{ padding: '1.5rem', background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ background: status.bg, color: status.color, padding: '0.25rem 0.75rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>
                        {status.label}
                      </span>
                      <span style={{ color: '#60a5fa', fontSize: '0.8rem', fontWeight: 700 }}>
                        {exam.course?.title || 'Cours Général'}
                      </span>
                    </div>
                    <h2 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 800 }}>{exam.title}</h2>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      <strong>Début :</strong> {new Date(exam.startTime).toLocaleString()}<br/>
                      <strong>Durée :</strong> {exam.durationMinutes} minutes
                    </p>
                  </div>
                  <div>
                    <button
                      onClick={() => handleStartExam(exam)}
                      disabled={status.label !== 'En cours'}
                      style={{
                        padding: '0.75rem 1.5rem',
                        borderRadius: 12,
                        border: 'none',
                        background: status.label === 'En cours' ? '#3b82f6' : 'rgba(255,255,255,0.05)',
                        color: status.label === 'En cours' ? 'white' : '#94a3b8',
                        fontWeight: 800,
                        cursor: status.label === 'En cours' ? 'pointer' : 'not-allowed',
                        transition: 'all 0.2s'
                      }}
                    >
                      {status.label === 'Terminé' ? 'Examen clos' : 'Démarrer l\'examen'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
