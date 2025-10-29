import { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { fetchEventBySlug } from '../services/strapi';
import { Event } from '../types/event';

export function EventDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);

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

  const STRAPI_URL = import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337';
  const thumbnailUrl = event.thumbnail?.formats?.large?.url || event.thumbnail?.url;
  const fullThumbnailUrl = thumbnailUrl
    ? (thumbnailUrl.startsWith('http') ? thumbnailUrl : `${STRAPI_URL}${thumbnailUrl}`)
    : null;

  const formatEventDate = (dateStr: string, timeStr: string) => {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return `${date.toLocaleDateString('en-US', options)} at ${timeStr}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar isScrolled={isScrolled} activeSection="" />

      <main className=" pb-16">
        {/* Hero Image */}
        {fullThumbnailUrl && (
          <div className="relative h-96 md:h-[500px] w-full overflow-hidden bg-gray-950">
            <img
              src={fullThumbnailUrl}
              alt={event.title}
              className="absolute inset-y-0 top-1/2 left-0 w-full h-full object-cover -translate-y-1/2"
              style={{ objectPosition: "center center" }}
            />
            {/* Dark overlay - similar to main hero */}
            <div className="absolute inset-0 bg-gradient-to-r from-gray-950/90 via-gray-900/85 to-gray-950/90"></div>
            <div className="absolute inset-0 islamic-pattern opacity-30"></div>

            {/* Category Badge */}
            <div className="absolute bottom-8 left-8 z-10">
              <div className="inline-block px-4 py-2 bg-emerald-500/20 border border-emerald-500/50 rounded-full backdrop-blur-sm">
                <span className="text-emerald-300 text-sm font-semibold uppercase tracking-wider">
                  {event.category.replace('-', ' ')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-12">
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Title */}
            <h1 className="font-serif font-bold text-4xl md:text-5xl lg:text-6xl text-gray-900 mb-6 leading-tight">
              {event.title}
            </h1>

            {/* Meta Information */}
            <div className="flex flex-wrap gap-6 mb-8 pb-8 border-b border-gray-200">
              <div className="flex items-center gap-2 text-gray-600">
                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="font-medium">
                  {formatEventDate(event.eventDate, event.eventTime)}
                </span>
              </div>

              <div className="flex items-center gap-2 text-gray-600">
                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="font-medium">{event.location}</span>
              </div>

              {event.organizer && (
                <div className="flex items-center gap-2 text-gray-600">
                  <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="font-medium">{event.organizer}</span>
                </div>
              )}
            </div>

            {/* Description */}
            {event.description && (
              <div className="mb-8">
                <p className="text-xl text-gray-700 leading-relaxed italic border-l-4 border-emerald-500 pl-6 py-2">
                  {event.description}
                </p>
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
            {(event.locationAddress || event.contactEmail || event.contactPhone) && (
              <div className="bg-gray-100 rounded-lg p-6 mb-8">
                <h2 className="font-serif font-bold text-2xl text-gray-900 mb-4">Event Information</h2>
                <div className="space-y-3">
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
            <div className="flex flex-wrap gap-4">
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

              <a
                href="/"
                className="group relative inline-flex items-center justify-center px-8 py-4 font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-lg overflow-hidden transition-all duration-300 hover:border-gray-400 hover:scale-105 active:scale-95"
              >
                <span className="relative z-10">Back to Home</span>
              </a>
            </div>
          </motion.article>
        </div>
      </main>

      <Footer />
    </div>
  );
}
