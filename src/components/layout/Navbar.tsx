import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface NavbarProps {
  isScrolled: boolean;
  activeSection: string;
}

export function Navbar({ isScrolled, activeSection }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(prev => !prev);
  };

  // Close mobile menu when clicking outside or on escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      const menuButton = document.querySelector('[aria-label="Toggle menu"]');
      // Don't close if clicking the menu button itself
      if (isMenuOpen && !target.closest('nav') && !menuButton?.contains(target)) {
        setIsMenuOpen(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      // Use a small delay to prevent immediate closing
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isMenuOpen]);

  const navItems = [
    'prayer-times',
    'programs',
    'services',
    'contact'
  ];

  // Determine navbar background based on section
  const isLightSection = ['programs', 'services', 'contact'].includes(activeSection);
  const isDarkSection = ['home', 'prayer-times'].includes(activeSection);
  // Default to dark section for unknown sections (like event pages)
  const isUnknownSection = !isLightSection && !isDarkSection;

  let navBgClass = 'bg-transparent';
  let textColorClass = 'text-white';
  let blurClass = 'backdrop-blur-md';

  if (!isScrolled) {
    // At the very top - fully transparent
    navBgClass = 'bg-transparent';
    textColorClass = 'text-white';
    blurClass = '';
  } else if (isDarkSection || isUnknownSection) {
    // Scrolling through dark sections (home, prayer-times, event pages) - glassy dark blur
    navBgClass = 'bg-black/30 shadow-lg';
    textColorClass = 'text-white';
    blurClass = 'backdrop-blur-lg';
  } else if (isLightSection) {
    // Scrolling through light sections (programs+) - glassy white blur
    navBgClass = 'bg-white/60 shadow-lg';
    textColorClass = 'text-gray-700';
    blurClass = 'backdrop-blur-lg';
  }

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ${blurClass} ${navBgClass}`}
    >
      <div className="px-4 md:px-8 lg:px-12 xl:px-16">
        <div className="relative flex items-center justify-between h-20">
          <div className="flex items-center z-10">
            <Link to="/" className="flex items-center">
              <img
                src="/images/Ajr Islamic Foundation Logo PNG.png"
                alt="Ajr Islamic Foundation Logo"
                className="h-10 md:h-12 transition-opacity duration-300 opacity-90 hover:opacity-100"
              />
            </Link>
          </div>

          {/* Mobile Donate Button - Absolutely Centered */}
          <div className="md:hidden absolute left-1/2 -translate-x-1/2 z-0">
            <motion.a
              href="https://app.irm.io/ajrcanada.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative px-6 py-2 text-sm font-bold text-white bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 rounded-lg overflow-hidden transition-all duration-300 shadow-[0_0_20px_rgba(251,146,60,0.5)] hover:shadow-[0_0_30px_rgba(251,146,60,0.8)]"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2, type: "spring", stiffness: 200 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="relative z-10">Donate</span>
              <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 to-orange-600 rounded-lg blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
            </motion.a>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              {navItems.map((item) => (
                <a
                  key={item}
                  href={`/#${item}`}
                  className={`nav-link whitespace-nowrap ${textColorClass} ${
                    activeSection === item ? 'nav-link-active' : ''
                  }`}
                >
                  {item.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </a>
              ))}
              <a
                href="https://app.irm.io/ajrcanada.com"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center px-3 py-2 text-base font-medium btn btn-secondary"
              >
                Donate
              </a>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden z-10">
            <button
              onClick={toggleMenu}
              type="button"
              className={`p-2.5 rounded-md ${textColorClass} backdrop-blur-md transition-all duration-300`}
              style={{
                backgroundColor: (isDarkSection || isUnknownSection) ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.3)'
              }}
              aria-label="Toggle menu"
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div
          className={`md:hidden shadow-lg animate-slide-in ${
            (isDarkSection || isUnknownSection) ? 'text-white' : 'text-gray-700'
          }`}
          style={{
            backgroundColor: `${(isDarkSection || isUnknownSection) ? 'rgba(0, 0, 0, 0.85)' : 'rgba(255, 255, 255, 0.95)'} !important`,
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)'
          } as React.CSSProperties}
        >
          <div className="px-2 pt-2 pb-3 space-y-3">
            {navItems.map((item) => (
              <a
                key={item}
                href={`/#${item}`}
                className={`block px-3 py-2 text-base font-medium rounded-md transition-colors duration-200 whitespace-nowrap ${
                  (isDarkSection || isUnknownSection)
                    ? 'text-white hover:bg-white/10'
                    : 'text-gray-700 hover:bg-emerald-50'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </a>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}