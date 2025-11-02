import { useEffect, useState } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { fetchAnnouncementBySlug } from '../services/strapi';
import { Announcement } from '../types/announcement';

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'low':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'urgent':
      return 'bg-red-500';
    case 'event':
      return 'bg-emerald-500';
    case 'program':
      return 'bg-amber-500';
    case 'prayer-times':
      return 'bg-purple-500';
    default:
      return 'bg-gray-500';
  }
};

export function AnnouncementDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
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
    const loadAnnouncement = async () => {
      if (!slug) return;

      setLoading(true);
      const announcementData = await fetchAnnouncementBySlug(slug);
      setAnnouncement(announcementData);
      setLoading(false);
    };

    loadAnnouncement();
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
          <p className="text-gray-600">Loading announcement...</p>
        </div>
      </div>
    );
  }

  if (!announcement) {
    return <Navigate to="/" replace />;
  }

  // Get thumbnail URL
  const STRAPI_URL = import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337';
  const thumbnailUrl = announcement.thumbnail?.formats?.large?.url || announcement.thumbnail?.url;
  const fullThumbnailUrl = thumbnailUrl
    ? (thumbnailUrl.startsWith('http') ? thumbnailUrl : `${STRAPI_URL}${thumbnailUrl}`)
    : null;

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
            {/* Priority Badge */}
            <div className="mb-4">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(announcement.priority)}`}>
                {announcement.priority.toUpperCase()} PRIORITY
              </span>
            </div>

            {/* Title */}
            <h1 className="font-serif font-bold text-4xl md:text-5xl text-white leading-tight max-w-4xl mb-6">
              {announcement.title}
            </h1>

            {/* Meta Information */}
            <div className="flex flex-wrap gap-6">
              {announcement.publishDate && (
                <div className="flex items-center gap-2 text-white/90">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-medium">
                    Published: {formatDate(announcement.publishDate)}
                  </span>
                </div>
              )}
              {announcement.category && (
                <div className="flex items-center gap-2 text-white/90">
                  <div className={`w-3 h-3 rounded-full ${getCategoryColor(announcement.category)}`}></div>
                  <span className="font-medium capitalize">
                    {announcement.category.replace('-', ' ')}
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
            {/* Announcement Thumbnail */}
            {fullThumbnailUrl && (
              <div className="mb-12">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="relative group overflow-hidden rounded-xl shadow-2xl cursor-pointer w-full max-w-2xl mx-auto block"
                >
                  <img
                    src={fullThumbnailUrl}
                    alt={announcement.title}
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

            {/* Description */}
            {announcement.description && (
              <div className="prose prose-lg max-w-none mb-8 text-gray-700">
                <p className="text-xl text-gray-600 leading-relaxed">{announcement.description}</p>
              </div>
            )}

            {/* Body Content */}
            {announcement.body && (
              <div className="prose prose-lg max-w-none mb-12 text-gray-700">
                <ReactMarkdown remarkPlugins={[remarkBreaks, remarkGfm]}>
                  {announcement.body}
                </ReactMarkdown>
              </div>
            )}

            {/* Additional Information */}
            {(announcement.link || announcement.contactEmail || announcement.contactPhone || announcement.expiryDate) && (
              <div className="bg-gray-100 rounded-lg p-6 mb-8">
                <h2 className="font-serif font-bold text-2xl text-gray-900 mb-6">Additional Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {announcement.link && (
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-emerald-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-5.656-3.555l1.102-1.101m0 0l4-4m-4 4l-4-4m1.102-1.101l-1.102-1.101m0 0l4-4m-4 4l-4-4" />
                      </svg>
                      <div>
                        <p className="font-medium text-gray-900">Link</p>
                        <a
                          href={announcement.link}
                          target={announcement.linkType === 'external' ? '_blank' : undefined}
                          rel={announcement.linkType === 'external' ? 'noopener noreferrer' : undefined}
                          className="text-emerald-600 hover:text-emerald-700 break-all"
                        >
                          {announcement.link}
                        </a>
                      </div>
                    </div>
                  )}

                  {announcement.contactEmail && (
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-emerald-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <p className="font-medium text-gray-900">Email</p>
                        <a href={`mailto:${announcement.contactEmail}`} className="text-emerald-600 hover:text-emerald-700">
                          {announcement.contactEmail}
                        </a>
                      </div>
                    </div>
                  )}

                  {announcement.contactPhone && (
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-emerald-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <div>
                        <p className="font-medium text-gray-900">Phone</p>
                        <a href={`tel:${announcement.contactPhone}`} className="text-emerald-600 hover:text-emerald-700">
                          {announcement.contactPhone}
                        </a>
                      </div>
                    </div>
                  )}

                  {announcement.expiryDate && (
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-emerald-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="font-medium text-gray-900">Expires</p>
                        <p className="text-gray-600">{formatDate(announcement.expiryDate)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Call to Action */}
            <div className="flex flex-col gap-4">
              {announcement.link && (
                <a
                  href={announcement.link}
                  target={announcement.linkType === 'external' ? '_blank' : undefined}
                  rel={announcement.linkType === 'external' ? 'noopener noreferrer' : undefined}
                  className="w-full group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-[0_0_40px_rgba(251,146,60,0.8)] hover:scale-105 active:scale-95"
                >
                  <span className="relative z-10">View Link</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </a>
              )}

              <Link
                to="/"
                className="text-emerald-600 hover:text-emerald-700 underline font-medium transition-colors duration-200"
              >
                Back to Home
              </Link>
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
              alt={announcement.title}
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

