import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

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
    'home',
    'prayer-times',
    'programs',
    'services',
    'contact'
  ];

  // Determine navbar background based on section
  const isLightSection = ['programs', 'services', 'contact'].includes(activeSection);
  const isDarkSection = ['home', 'prayer-times'].includes(activeSection);

  let navBgClass = 'bg-transparent';
  let textColorClass = 'text-white';
  let blurClass = '';

  if (!isScrolled) {
    // At the very top - completely transparent
    navBgClass = 'bg-transparent';
    textColorClass = 'text-white';
  } else if (isDarkSection) {
    // Scrolling through dark sections (home, prayer-times) - dark transparent blur
    navBgClass = 'bg-black/30 shadow-md';
    textColorClass = 'text-white';
    blurClass = 'backdrop-blur-md';
  } else if (isLightSection) {
    // Scrolling through light sections (programs+) - white transparent blur
    navBgClass = 'bg-white/70 shadow-md';
    textColorClass = 'text-gray-700';
    blurClass = 'backdrop-blur-md';
  }

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ${blurClass} ${navBgClass}`}
    >
      <div className="px-4 md:px-8 lg:px-12 xl:px-16">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center">
            <a href="#home" className="flex items-center">
              <img
                src="/images/Ajr Islamic Foundation Logo PNG.png"
                alt="Ajr Islamic Foundation Logo"
                className="h-12 transition-opacity duration-300 opacity-90 hover:opacity-100"
              />
            </a>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              {navItems.map((item) => (
                <a
                  key={item}
                  href={`#${item}`}
                  className={`nav-link ${textColorClass} ${
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
                className="btn btn-secondary ml-4 transform hover:scale-105 transition-transform duration-300"
              >
                Donate
              </a>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              type="button"
              className={`p-2 rounded-md ${textColorClass} backdrop-blur-md transition-all duration-300`}
              style={{
                backgroundColor: isDarkSection ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.3)'
              }}
              aria-label="Toggle menu"
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div
          className={`md:hidden shadow-lg animate-slide-in ${
            isDarkSection ? 'text-white' : 'text-gray-700'
          }`}
          style={{
            backgroundColor: `${isDarkSection ? 'rgba(0, 0, 0, 0.85)' : 'rgba(255, 255, 255, 0.95)'} !important`,
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)'
          } as React.CSSProperties}
        >
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.map((item) => (
              <a
                key={item}
                href={`#${item}`}
                className={`block px-3 py-2 text-base font-medium rounded-md transition-colors duration-200 ${
                  isDarkSection
                    ? 'text-white hover:bg-white/10'
                    : 'text-gray-700 hover:bg-emerald-50'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </a>
            ))}
            {/* Move Donate button after Programs in mobile menu */}
            {navItems.indexOf('programs') !== -1 && (
              <div className="py-2">
                <a
                  href="https://app.irm.io/ajrcanada.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center px-3 py-2 text-base font-medium btn btn-secondary"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Donate
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}