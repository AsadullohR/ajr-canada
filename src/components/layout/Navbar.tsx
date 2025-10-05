import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

interface NavbarProps {
  isScrolled: boolean;
  activeSection: string;
}

export function Navbar({ isScrolled, activeSection }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Close mobile menu when clicking outside or on escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isMenuOpen && !target.closest('nav')) {
        setIsMenuOpen(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
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

  return (
    <nav 
      className={`fixed w-full z-50 transition-all duration-300 backdrop-blur-md ${
        isScrolled ? 'bg-white/95 shadow-md' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center">
            <a href="#home" className="flex items-center">
              <img 
                src="/images/Ajr Islamic Foundation Logo PNG.png" 
                alt="Ajr Islamic Foundation Logo" 
                className={`h-16 transition-opacity duration-300 ${
                  isScrolled ? 'opacity-100' : 'opacity-90 hover:opacity-100'
                }`}
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
                  className={`nav-link ${isScrolled ? 'text-gray-700' : 'text-white'} ${
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
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`p-2 rounded-md ${isScrolled ? 'text-gray-700' : 'text-white'}`}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-white/95 shadow-lg animate-slide-in backdrop-blur-md">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.map((item) => (
              <a
                key={item}
                href={`#${item}`}
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-emerald-50 rounded-md transition-colors duration-200"
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