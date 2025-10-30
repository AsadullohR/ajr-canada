import { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { fetchEventBySlug } from '../services/strapi';
import { Event } from '../types/event';

export function EventDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const loadEvent = async () => {
      if (!slug) return;

      setLoading(true);
      const eventData = await fetchEventBySlug(slug);
      setEvent(eventData);
      setLoading(false);
    };

    loadEvent();
  }, [slug]);

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isModalOpen]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mb-4"></div>
          <p className="text-gray-600">Loading event...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return <Navigate to="/" replace />;
  }

  // Get thumbnail URL
  const STRAPI_URL = import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337';
  const thumbnailUrl = event.thumbnail?.formats?.large?.url || event.thumbnail?.url;
  const fullThumbnailUrl = thumbnailUrl
    ? (thumbnailUrl.startsWith('http') ? thumbnailUrl : `${STRAPI_URL}${thumbnailUrl}`)
    : null;

  const formatEventDate = (dateStr: string, timeStr: string) => {
    // Parse date as local date to avoid timezone issues
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed

    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };

    // Format time from 24hr to 12hr format
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    const formattedTime = `${hour12}:${minutes} ${ampm}`;

    return `${date.toLocaleDateString('en-US', options)} • ${formattedTime}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar isScrolled={isScrolled} activeSection="" />

      <main className="pb-16">
        {/* Pattern Background Hero with Title */}
        <div className="relative w-full h-[400px] md:h-[320px] overflow-hidden bg-gray-950">
          {/* Background Image */}
          <img
            src="/images/pattern_background.jpg"
            alt="Pattern Background"
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Dark overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-gray-950/80 via-gray-900/75 to-gray-950/80"></div>

          {/* Content Container - positioned at bottom */}
          <div className="absolute inset-0 flex flex-col justify-end px-4 md:px-8 lg:px-12 xl:px-16 pb-8 md:pb-12">
            {/* Title */}
            <h1 className="font-serif font-bold text-4xl md:text-5xl text-white leading-tight max-w-4xl mb-6">
              {event.title}
            </h1>

            {/* Meta Information */}
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2 text-white/90">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="font-medium">
                  {formatEventDate(event.eventDate, event.eventTime)}
                </span>
              </div>
              {event.endDate && event.endDate !== event.eventDate && (
                <div className="flex items-center gap-2 text-white/90">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-medium">
                    {formatEventDate(event.endDate, event.endTime || '')}
                  </span>
                </div>
              )}
            </div>

            
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-4 md:px-0 py-12">
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Event Thumbnail/Poster */}
            {fullThumbnailUrl && (
              <div className="mb-12">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="relative group overflow-hidden rounded-xl shadow-2xl cursor-pointer w-full max-w-2xl mx-auto block"
                >
                  <img
                    src={fullThumbnailUrl}
                    alt={event.title}
                    className="w-full h-auto object-contain transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Magnifying glass overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-75 group-hover:scale-100 bg-white/20 backdrop-blur-sm rounded-full p-4 shadow-lg">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                    </div>
                  </div>
                </button>
              </div>
            )}

            {/* Body Content */}
            {event.body && (
              <div className="prose prose-lg max-w-none mb-12">
                <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {event.body}
                </div>
              </div>
            )}

            {/* Additional Information */}
            {(event.location || event.organizer || event.category || event.capacity || event.locationAddress || event.contactEmail || event.contactPhone) && (
              <div className="bg-gray-100 rounded-lg p-6 mb-8">
                <h2 className="font-serif font-bold text-2xl text-gray-900 mb-6">Event Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {event.location && (
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-emerald-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div>
                        <p className="font-medium text-gray-900">Location</p>
                        <p className="text-gray-600">{event.location}</p>
                      </div>
                    </div>
                  )}

                  {event.organizer && (
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-emerald-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <div>
                        <p className="font-medium text-gray-900">Organizer</p>
                        <p className="text-gray-600">{event.organizer}</p>
                      </div>
                    </div>
                  )}

                  {event.category && (
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-emerald-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <div>
                        <p className="font-medium text-gray-900">Category</p>
                        <p className="text-gray-600">{event.category.replace('-', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</p>
                      </div>
                    </div>
                  )}

                  {event.capacity && (
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-emerald-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <div>
                        <p className="font-medium text-gray-900">Capacity</p>
                        <p className="text-gray-600">{event.capacity}</p>
                      </div>
                    </div>
                  )}

                  {event.locationAddress && (
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-emerald-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div>
                        <p className="font-medium text-gray-900">Address</p>
                        <p className="text-gray-600">{event.locationAddress}</p>
                      </div>
                    </div>
                  )}

                  {event.contactEmail && (
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-emerald-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <p className="font-medium text-gray-900">Email</p>
                        <a href={`mailto:${event.contactEmail}`} className="text-emerald-600 hover:text-emerald-700">
                          {event.contactEmail}
                        </a>
                      </div>
                    </div>
                  )}

                  {event.contactPhone && (
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-emerald-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <div>
                        <p className="font-medium text-gray-900">Phone</p>
                        <a href={`tel:${event.contactPhone}`} className="text-emerald-600 hover:text-emerald-700">
                          {event.contactPhone}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Call to Action Buttons */}
            <div className="flex flex-wrap gap-4 items-center">
              <a
                href="/"
                className="text-emerald-600 hover:text-emerald-700 underline font-medium transition-colors duration-200"
              >
                Back to Home
              </a>

              {event.registrationLink && (
                <a
                  href={event.registrationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-[0_0_40px_rgba(251,146,60,0.8)] hover:scale-105 active:scale-95"
                >
                  <span className="relative z-10">Register Now</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </a>
              )}
            </div>
          </motion.article>
        </div>
      </main>

      <Footer />

      {/* Full-Screen Image Modal */}
      <AnimatePresence>
        {isModalOpen && fullThumbnailUrl && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsModalOpen(false)}
          >
            {/* Close button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 z-[110] p-3 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-sm transition-all duration-300 group"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6 md:w-8 md:h-8 text-white group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Full-screen image */}
            <motion.img
              src={fullThumbnailUrl}
              alt={event.title}
              className="max-w-full max-h-full object-contain p-4"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
