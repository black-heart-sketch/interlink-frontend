import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { courseService } from '../../services/courseService';
import CourseCard from '../learning/CourseCard';
import { getCourseId } from '../../utils/courseUtils';


function CoursesSection() {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const [dbCourses, setDbCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    courseService.getCourses({ status: 'Published' })
      .then(res => {
        const list = res?.courses || (Array.isArray(res) ? res : []);
        setDbCourses(list.filter(c => c.status === 'Published'));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const coursesPerPage = 6;
  const totalPages = Math.ceil(dbCourses.length / coursesPerPage);
  const indexOfLastCourse = currentPage * coursesPerPage;
  const indexOfFirstCourse = indexOfLastCourse - coursesPerPage;
  const currentCourses = dbCourses.slice(indexOfFirstCourse, indexOfLastCourse);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section
      id="courses"
      className="page-section"
      style={{
        background: 'var(--bg-color)',
        borderTop: '1px solid var(--glass-border)',
        borderBottom: '1px solid var(--glass-border)',
        position: 'relative',
        zIndex: 10
      }}
    >
      <div className="wide-container" style={{ maxWidth: 1280, margin: '0 auto' }}>
        {/* Header */}
        <div className="courses-header" style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '3.5rem',
        }}>
          <div>
            <div className="section-label">📚 {t('courses.label')}</div>
            <h2 className="section-heading" style={{ marginBottom: 0 }}>
              {t('courses.heading_1')}<br />
              <span className="gradient-text">{t('courses.heading_2')}</span>
            </h2>
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {t('courses.showing')} {dbCourses.length > 0 ? indexOfFirstCourse + 1 : 0}-{Math.min(indexOfLastCourse, dbCourses.length)} {t('courses.of')} {dbCourses.length} {t('courses.results')}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[400px] text-slate-400">
            <i className="fa-solid fa-circle-notch animate-spin text-2xl mr-3"></i>
            Loading courses...
          </div>
        ) : dbCourses.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 bg-white/[0.03] rounded-3xl border border-white/10 p-10">
            <i className="fa-solid fa-book-open text-4xl mb-4"></i>
            <h3 className="text-xl font-bold text-white mb-2">No courses available yet</h3>
            <p>Check back later for new learning content.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {currentCourses.map((course) => (
              <CourseCard key={getCourseId(course)} course={course} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="courses-pagination" style={{ 
            marginTop: '4rem', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: '0.5rem' 
          }}>
            <button 
              disabled={currentPage === 1}
              onClick={() => paginate(currentPage - 1)}
              style={{
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: 600,
                transition: 'all 0.2s'
              }}
            >
              {t('courses.prev')}
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
              <button
                key={number}
                onClick={() => paginate(number)}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  border: 'none',
                  background: currentPage === number ? 'var(--btn-primary-bg)' : 'var(--glass-bg)',
                  color: '#fff',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {number}
              </button>
            ))}

            <button 
              disabled={currentPage === totalPages}
              onClick={() => paginate(currentPage + 1)}
              style={{
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                color: currentPage === totalPages ? 'var(--text-muted)' : 'var(--text-primary)',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: 600,
                transition: 'all 0.2s'
              }}
            >
              {t('courses.next')}
            </button>
          </div>
        )}
      </div>

    </section>
  );
}

export default CoursesSection;
