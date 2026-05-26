import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import HeroSection from '../components/landing/HeroSection';
import StatsBar from '../components/landing/StatsBar';
import AboutSection from '../components/landing/AboutSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import EventsSection from '../components/landing/EventsSection';
import GallerySection from '../components/landing/GallerySection';
import TestimonialsSection from '../components/landing/TestimonialsSection';
import FAQSection from '../components/landing/FAQSection';
import ContactSection from '../components/landing/ContactSection';
import Footer from '../components/Footer';
import GlobalBackground3D from '../components/landing/GlobalBackground3D';

// Services Preview
import ProgramsList from '../components/public/ProgramsList';

function Home() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  return (
    <div style={{ position: 'relative', overflowX: 'hidden' }}>
      <GlobalBackground3D theme={theme} />
      <Navbar theme={theme} toggleTheme={toggleTheme} />
      <HeroSection />
      <ProgramsList />
      <AboutSection />
      <EventsSection />
      <FeaturesSection />
      <GallerySection />
      <StatsBar />
      <TestimonialsSection />
      <ContactSection />
      <FAQSection />
      <Footer />
    </div>
  );
}

export default Home;

