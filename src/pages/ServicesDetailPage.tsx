import { useEffect, useState } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import { Phone, Mail, ExternalLink } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { fetchServiceBySlug } from '../services/strapi';
import { Service } from '../types/service';

const STRAPI_URL = import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337';

export function ServicesDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [service, setService] = useState<Service | null>(null);
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
    const loadService = async () => {
      if (!slug) return;

      setLoading(true);
      const serviceData = await fetchServiceBySlug(slug);
      setService(serviceData);
      setLoading(false);
    };

    loadService();
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
          <p className="text-gray-600">Loading service...</p>
        </div>
      </div>
    );
  }

  if (!service) {
    return <Navigate to="/" replace />;
  }

  // Get thumbnail URL
  const thumbnailUrl = service.thumbnail?.formats?.large?.url || service.thumbnail?.url;
  const fullThumbnailUrl = thumbnailUrl
    ? (thumbnailUrl.startsWith('http') ? thumbnailUrl : `${STRAPI_URL}${thumbnailUrl}`)
    : null;

  const formatCategory = (category: string) => {
    return category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
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
            {/* Category Badge */}
            <div className="inline-block w-fit px-4 py-2 bg-amber-500/80 backdrop-blur-sm text-white hover:bg-amber-600/80 focus:ring-amber-400 shadow-lg shadow-amber-500/30 text-sm font-semibold rounded-full mb-4">
              {formatCategory(service.category)}
            </div>

            {/* Title */}
            <h1 className="font-serif font-bold text-4xl md:text-5xl text-white leading-tight max-w-4xl mb-6">
              {service.title}
            </h1>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-4 md:px-0 py-12">
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Service Thumbnail */}
            {fullThumbnailUrl && (
              <div className="mb-12">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="relative group overflow-hidden rounded-xl shadow-2xl cursor-pointer w-full max-w-2xl mx-auto block"
                >
                  <img
                    src={fullThumbnailUrl}
                    alt={service.title}
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
            <div className="mb-8">
              <h2 className="font-serif font-bold text-2xl text-gray-900 mb-4">About This Service</h2>
              <p className="text-lg text-gray-700 leading-relaxed">{service.description}</p>
            </div>

            {/* Body Content */}
            {service.body && (
              <div className="prose prose-lg max-w-none mb-12 text-gray-700">
                <ReactMarkdown remarkPlugins={[remarkBreaks, remarkGfm]}>
                  {service.body}
                </ReactMarkdown>
              </div>
            )}

            {/* Service Information */}
            {(service.contactEmail || service.contactPhone || service.category) && (
              <div className="bg-gray-100 rounded-lg p-6 mb-8">
                <h2 className="font-serif font-bold text-2xl text-gray-900 mb-6">Service Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {service.category && (
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-emerald-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <div>
                        <p className="font-medium text-gray-900">Category</p>
                        <p className="text-gray-600">{formatCategory(service.category)}</p>
                      </div>
                    </div>
                  )}

                  {service.contactEmail && (
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-emerald-500 mt-1" />
                      <div>
                        <p className="font-medium text-gray-900">Email</p>
                        <a href={`mailto:${service.contactEmail}`} className="text-emerald-600 hover:text-emerald-700">
                          {service.contactEmail}
                        </a>
                      </div>
                    </div>
                  )}

                  {service.contactPhone && (
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-emerald-500 mt-1" />
                      <div>
                        <p className="font-medium text-gray-900">Phone</p>
                        <a href={`tel:${service.contactPhone}`} className="text-emerald-600 hover:text-emerald-700">
                          {service.contactPhone}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Call to Action Buttons */}
            <div className="flex flex-col gap-4">
              {service.link && (
                <a
                  href={service.link}
                  target={service.linkType === 'external' ? '_blank' : undefined}
                  rel={service.linkType === 'external' ? 'noopener noreferrer' : undefined}
                  className="w-full group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-[0_0_40px_rgba(251,146,60,0.8)] hover:scale-105 active:scale-95"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Learn More
                    {service.linkType === 'external' && <ExternalLink className="w-5 h-5" />}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </a>
              )}

              <Link
                to="/#services"
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
              alt={service.title}
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

