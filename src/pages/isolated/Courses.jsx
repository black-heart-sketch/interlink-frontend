import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import CoursesSection from '../components/landing/CoursesSection';
import CTASection from '../components/landing/CTASection';
import Footer from '../components/Footer';

const Courses = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div style={{ background: '#06091a', minHeight: '100vh', overflowX: 'hidden' }}>
      <Navbar />
      <div style={{ paddingTop: '80px' }}> {/* Adjust for fixed navbar */}
        <CoursesSection />
      </div>
      <CTASection />
      <Footer />
    </div>
  );
};

export default Courses;
