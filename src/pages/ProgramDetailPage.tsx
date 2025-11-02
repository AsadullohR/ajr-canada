import { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import { Clock, Users, Calendar, MapPin, Phone, Mail, User } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { fetchProgramBySlug } from '../services/strapi';
import { Program } from '../types/program';

const STRAPI_URL = import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337';

export function ProgramDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [program, setProgram] = useState<Program | null>(null);
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
    const loadProgram = async () => {
      if (!slug) return;

      setLoading(true);
      const programData = await fetchProgramBySlug(slug);
      setProgram(programData);
      setLoading(false);
    };

    loadProgram();
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
          <p className="text-gray-600">Loading program...</p>
        </div>
      </div>
    );
  }

  if (!program) {
    return <Navigate to="/" replace />;
  }

  // Get thumbnail URL
  const thumbnailUrl = program.thumbnail?.formats?.large?.url || program.thumbnail?.url;
  const fullThumbnailUrl = thumbnailUrl
    ? (thumbnailUrl.startsWith('http') ? thumbnailUrl : `${STRAPI_URL}${thumbnailUrl}`)
    : null;

  const instructorPictureUrl = program.instructorPicture?.url
    ? (program.instructorPicture.url.startsWith('http') 
        ? program.instructorPicture.url 
        : `${STRAPI_URL}${program.instructorPicture.url}`)
    : null;

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getRecurrenceText = () => {
    let text = program.recurrencePattern.charAt(0).toUpperCase() + program.recurrencePattern.slice(1);
    
    if (program.recurrenceInterval && program.recurrenceInterval > 1) {
      text = `Every ${program.recurrenceInterval} ${program.recurrencePattern === 'weekly' ? 'weeks' : program.recurrencePattern.replace('ly', 's')}`;
    }
    
    if (program.recurrenceDaysOfWeek && program.recurrenceDaysOfWeek.length > 0) {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayNames = program.recurrenceDaysOfWeek.map(d => days[d]).join(', ');
      text += ` (${dayNames})`;
    }
    
    return text;
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
            <div className="inline-block w-fit px-4 py-2 bg-emerald-500 text-white text-sm font-semibold rounded-full mb-4">
              {program.category.replace('-', ' ').split(' ').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ')}
            </div>

            {/* Title */}
            <h1 className="font-serif font-bold text-4xl md:text-5xl text-white leading-tight max-w-4xl mb-6">
              {program.title}
            </h1>

            {/* Meta Information */}
            <div className="flex flex-wrap gap-6">
              {program.eventTime && (
                <div className="flex items-center gap-2 text-white/90">
                  <Clock className="w-5 h-5 text-emerald-400" />
                  <span className="font-medium">
                    {program.timeDescription || formatTime(program.eventTime)}
                  </span>
                </div>
              )}
              {program.audience && (
                <div className="flex items-center gap-2 text-white/90">
                  <Users className="w-5 h-5 text-emerald-400" />
                  <span className="font-medium capitalize">{program.audience}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-white/90">
                <Calendar className="w-5 h-5 text-emerald-400" />
                <span className="font-medium">{getRecurrenceText()}</span>
              </div>
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
            {/* Program Thumbnail */}
            {fullThumbnailUrl && (
              <div className="mb-12">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="relative group overflow-hidden rounded-xl shadow-2xl cursor-pointer w-full max-w-2xl mx-auto block"
                >
                  <img
                    src={fullThumbnailUrl}
                    alt={program.title}
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
              <h2 className="font-serif font-bold text-2xl text-gray-900 mb-4">About This Program</h2>
              <p className="text-lg text-gray-700 leading-relaxed">{program.description}</p>
            </div>

            {/* Body Content */}
            {program.body && (
              <div className="prose prose-lg max-w-none mb-12 text-gray-700">
                <ReactMarkdown remarkPlugins={[remarkBreaks, remarkGfm]}>
                  {program.body}
                </ReactMarkdown>
              </div>
            )}

            {/* Instructor Information */}
            {program.instructor && (
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-8 mb-8">
                <h2 className="font-serif font-bold text-2xl text-gray-900 mb-6">Instructor</h2>
                <div className="flex items-center gap-6">
                  {instructorPictureUrl ? (
                    <img
                      src={instructorPictureUrl}
                      alt={program.instructor}
                      className="w-24 h-24 rounded-full object-cover shadow-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
                      <User className="w-12 h-12 text-white" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-xl text-gray-900">{program.instructor}</h3>
                    <p className="text-gray-600">Program Instructor</p>
                  </div>
                </div>
              </div>
            )}

            {/* Program Details */}
            <div className="bg-gray-100 rounded-lg p-6 mb-8">
              <h2 className="font-serif font-bold text-2xl text-gray-900 mb-6">Program Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {program.recurrencePattern && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-emerald-500 mt-1" />
                    <div>
                      <p className="font-medium text-gray-900">Schedule</p>
                      <p className="text-gray-600">{getRecurrenceText()}</p>
                    </div>
                  </div>
                )}

                {program.eventTime && (
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-emerald-500 mt-1" />
                    <div>
                      <p className="font-medium text-gray-900">Time</p>
                      <p className="text-gray-600">
                        {program.timeDescription || formatTime(program.eventTime)}
                      </p>
                    </div>
                  </div>
                )}

                {program.audience && (
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-emerald-500 mt-1" />
                    <div>
                      <p className="font-medium text-gray-900">Audience</p>
                      <p className="text-gray-600 capitalize">{program.audience}</p>
                    </div>
                  </div>
                )}

                {program.age && (
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-emerald-500 mt-1" />
                    <div>
                      <p className="font-medium text-gray-900">Age Group</p>
                      <p className="text-gray-600">{program.age}</p>
                    </div>
                  </div>
                )}

                {program.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-emerald-500 mt-1" />
                    <div>
                      <p className="font-medium text-gray-900">Location</p>
                      <p className="text-gray-600">{program.address}</p>
                    </div>
                  </div>
                )}

                {program.capacity && (
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-emerald-500 mt-1" />
                    <div>
                      <p className="font-medium text-gray-900">Capacity</p>
                      <p className="text-gray-600">{program.capacity} participants</p>
                    </div>
                  </div>
                )}

                {program.contactEmail && (
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-emerald-500 mt-1" />
                    <div>
                      <p className="font-medium text-gray-900">Email</p>
                      <a href={`mailto:${program.contactEmail}`} className="text-emerald-600 hover:text-emerald-700">
                        {program.contactEmail}
                      </a>
                    </div>
                  </div>
                )}

                {program.contactPhone && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-emerald-500 mt-1" />
                    <div>
                      <p className="font-medium text-gray-900">Phone</p>
                      <a href={`tel:${program.contactPhone}`} className="text-emerald-600 hover:text-emerald-700">
                        {program.contactPhone}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Registration Info */}
            {program.registrationRequired && (
              <div className="bg-amber-50 border-l-4 border-amber-500 p-6 mb-8 rounded-r-lg">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-amber-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h3 className="font-bold text-amber-900 mb-1">Registration Required</h3>
                    <p className="text-amber-800">Please register in advance to participate in this program.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Call to Action Buttons */}
            <div className="flex flex-col gap-4">
              {(program.registrationRequired || program.registrationLink) && program.registrationLink && (
                <a
                  href={program.registrationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-[0_0_40px_rgba(251,146,60,0.8)] hover:scale-105 active:scale-95"
                >
                  <span className="relative z-10">Register Now</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </a>
              )}

              {program.link && program.linkType === 'external' && !program.registrationLink && (
                <a
                  href={program.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full px-8 py-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors duration-200 font-bold text-center"
                >
                  Learn More
                </a>
              )}

              <a
                href="/"
                className="text-emerald-600 hover:text-emerald-700 underline font-medium transition-colors duration-200"
              >
                Back to Home
              </a>
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
              alt={program.title}
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
