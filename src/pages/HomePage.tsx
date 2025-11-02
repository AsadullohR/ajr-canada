import { useState, useEffect } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { HeroSlideshow } from '../components/sections/HeroSlideshow';
import { PrayerTimes } from '../components/sections/PrayerTimes';
import { UpcomingEvents } from '../components/sections/UpcomingEvents';
import { Programs } from '../components/sections/Programs';
import { Services } from '../components/sections/Services';
import { Contact } from '../components/sections/Contact';

export function HomePage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);

      // Update active section based on scroll position
      const sections = ['home', 'prayer-times', 'upcoming-events', 'programs', 'services', 'contact'];
      const current = sections.find(section => {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          return rect.top <= 100 && rect.bottom >= 100;
        }
        return false;
      });
      if (current && current !== activeSection) {
        setActiveSection(current);
      }
    };

    window.addEventListener('scroll', handleScroll);
    // Set initial active section
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeSection]);

  // Handle hash navigation on mount and hash changes
  useEffect(() => {
    const scrollToHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        // Small delay to ensure the page has rendered
        setTimeout(() => {
          const element = document.getElementById(hash);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }
    };

    // Scroll on mount if hash exists
    scrollToHash();

    // Listen for hash changes
    window.addEventListener('hashchange', scrollToHash);

    return () => window.removeEventListener('hashchange', scrollToHash);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar isScrolled={isScrolled} activeSection={activeSection} />
      <main className="space-y-0">
        <HeroSlideshow />
        <PrayerTimes />
        <UpcomingEvents />
        <Programs />
        <Services />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
