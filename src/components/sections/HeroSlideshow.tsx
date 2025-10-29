import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchFeaturedEvents } from '../../services/strapi';
import { Event } from '../../types/event';

interface PrayerTime {
  name: string;
  begins: string;
  adhan?: string;
  iqama?: string;
}

const SHEET_ID = import.meta.env.VITE_SPREADSHEET_ID;
const PRAYER_TIMES_GID = import.meta.env.VITE_PRAYER_TIMES_GID || '0';
const PRAYER_TIMES_URL = SHEET_ID ? `https://docs.google.com/spreadsheets/d/e/2PACX-${SHEET_ID}/pub?gid=${PRAYER_TIMES_GID}&single=true&output=csv` : "";

const SLIDE_DURATION = 15000; // 15 seconds per slide

const convertToMinutes = (timeStr: string): number => {
  if (timeStr.includes(' - ')) {
    timeStr = timeStr.split(' - ')[0].trim();
  }

  const cleanStr = timeStr.trim().replace(/\s+/g, '');
  const match = cleanStr.match(/^(\d{1,2}):(\d{2})(AM|PM)$/i);

  if (!match) {
    console.error('Invalid time format:', timeStr);
    return 0;
  }

  const hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const period = match[3].toUpperCase();

  let totalMinutes = hours * 60 + minutes;
  if (period === 'PM' && hours !== 12) {
    totalMinutes += 12 * 60;
  } else if (period === 'AM' && hours === 12) {
    totalMinutes = minutes;
  }

  return totalMinutes;
};

const getTimeUntilNextPrayer = (prayerTimes: PrayerTime[]): { name: string; hours: number; minutes: number; seconds: number } | null => {
  if (prayerTimes.length === 0) return null;

  const now = new Date();
  const torontoTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Toronto' }));
  const currentSeconds = torontoTime.getHours() * 3600 + torontoTime.getMinutes() * 60 + torontoTime.getSeconds();
  const isFriday = torontoTime.getDay() === 5;

  const prayersWithIqama = prayerTimes.filter(prayer => prayer.iqama);

  if (prayersWithIqama.length === 0) return null;

  for (let i = 0; i < prayersWithIqama.length; i++) {
    const prayerMinutes = convertToMinutes(prayersWithIqama[i].iqama!);
    const prayerSeconds = prayerMinutes * 60;
    if (prayerSeconds > currentSeconds) {
      const secondsUntil = prayerSeconds - currentSeconds;
      let prayerName = prayersWithIqama[i].name;

      if (isFriday && prayerName.toLowerCase() === 'zuhr') {
        const jumahPrayer = prayerTimes.find(p => p.name.toLowerCase() === 'jumah');
        if (jumahPrayer) {
          prayerName = jumahPrayer.name;
        }
      }

      return {
        name: prayerName,
        hours: Math.floor(secondsUntil / 3600),
        minutes: Math.floor((secondsUntil % 3600) / 60),
        seconds: secondsUntil % 60
      };
    }
  }

  if (prayersWithIqama.length > 0) {
    const firstPrayerMinutes = convertToMinutes(prayersWithIqama[0].iqama!);
    const firstPrayerSeconds = firstPrayerMinutes * 60;
    const secondsUntil = (24 * 3600 - currentSeconds) + firstPrayerSeconds;
    let prayerName = prayersWithIqama[0].name;

    if (isFriday && prayerName.toLowerCase() === 'dhuhr') {
      const jumahPrayer = prayerTimes.find(p => p.name.toLowerCase() === 'jumah' || p.name.toLowerCase() === 'jumu\'ah');
      if (jumahPrayer) {
        prayerName = jumahPrayer.name;
      }
    }

    return {
      name: prayerName,
      hours: Math.floor(secondsUntil / 3600),
      minutes: Math.floor((secondsUntil % 3600) / 60),
      seconds: secondsUntil % 60
    };
  }

  return null;
};

interface Slide {
  type: 'default' | 'event';
  event?: Event;
}

export function HeroSlideshow() {
  const [slides, setSlides] = useState<Slide[]>([{ type: 'default' }]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [progress, setProgress] = useState(0);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([]);
  const [countdown, setCountdown] = useState<{ name: string; hours: number; minutes: number; seconds: number } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch prayer times
  useEffect(() => {
    const fetchPrayerTimes = async () => {
      try {
        if (!PRAYER_TIMES_URL) {
          console.error('Prayer times URL not configured');
          return;
        }

        const response = await fetch(PRAYER_TIMES_URL);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const csvData = await response.text();

        const rows = csvData.split('\n').slice(1);
        const parsedTimes = rows
          .filter(row => row.trim())
          .map(row => {
            const columns = row.split(',').map(cell =>
              cell.replace(/^"|"$/g, '').trim()
            );
            const [name = '', begins = '', adhan = '', iqama = ''] = columns;
            return {
              name,
              begins,
              ...(adhan ? { adhan } : {}),
              ...(iqama ? { iqama } : {})
            };
          })
          .filter(prayer => prayer.name && prayer.begins);

        setPrayerTimes(parsedTimes);
      } catch (err) {
        console.error('Error fetching prayer times for countdown:', err);
        setPrayerTimes([]);
      }
    };

    fetchPrayerTimes();
  }, []);

  // Update countdown every second
  useEffect(() => {
    const updateCountdown = () => {
      const timeUntil = getTimeUntilNextPrayer(prayerTimes);
      setCountdown(timeUntil);
    };

    if (prayerTimes.length > 0) {
      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);
      return () => clearInterval(interval);
    }
  }, [prayerTimes]);

  // Fetch featured events
  useEffect(() => {
    const loadEvents = async () => {
      const response = await fetchFeaturedEvents();
      if (response.data.length > 0) {
        const eventSlides: Slide[] = response.data.map(event => ({
          type: 'event' as const,
          event,
        }));
        // Events first, default slide last
        setSlides([...eventSlides, { type: 'default' }]);
      }
    };

    loadEvents();
  }, []);

  // Auto-advance slides
  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setProgress(0);
  }, [slides.length]);

  // Progress bar animation
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          return 0;
        }
        return prev + (100 / (SLIDE_DURATION / 50));
      });
    }, 50);

    return () => clearInterval(progressInterval);
  }, []);

  // Auto-advance when progress reaches 100%
  useEffect(() => {
    if (progress >= 100) {
      nextSlide();
    }
  }, [progress, nextSlide]);

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

  const currentSlideData = slides[currentSlide];
  const isDefaultSlide = currentSlideData.type === 'default';
  const eventData = currentSlideData.event;

  const STRAPI_URL = import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337';
  // Use large format if available, otherwise fall back to original
  const thumbnailUrl = eventData?.thumbnail
    ? (eventData.thumbnail.formats?.large?.url || eventData.thumbnail.url)
    : null;
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
    <section id="home" className="relative h-screen overflow-hidden bg-gray-950">
      {/* Background - Only for default slide */}
      {isDefaultSlide && (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            className="absolute inset-0 w-full h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* YouTube Video Background for default slide */}
            <div className="absolute inset-0 w-full h-full pointer-events-none">
              <iframe
                className="absolute top-1/2 left-1/2 w-[100vw] h-[56.25vw] min-h-[100vh] min-w-[177.77vh] -translate-x-1/2 -translate-y-1/2"
                src="https://www.youtube.com/embed/zBTjOxJy8w8?autoplay=1&mute=1&loop=1&playlist=zBTjOxJy8w8&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&enablejsapi=1"
                title="Hero Background Video"
                allow="autoplay; encrypted-media"
                frameBorder="0"
              ></iframe>
              <div className="absolute inset-0 bg-gradient-to-r from-gray-950/90 via-gray-900/85 to-gray-950/90"></div>
              <div className="absolute inset-0 islamic-pattern opacity-30"></div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Slide indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 flex gap-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentSlide(index);
                setProgress(0);
              }}
              className={`w-8 h-8 rounded-full transition-all duration-300 flex items-center justify-center text-white font-semibold text-sm ${
                index === currentSlide
                  ? 'bg-black border-2 border-amber-500 scale-110'
                  : 'bg-black border border-amber-500/50 hover:border-amber-500/75 hover:scale-105'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      )}

      {/* Progress Bar */}
      {slides.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 z-50 h-1 bg-gray-800/50">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.05, ease: 'linear' }}
          />
        </div>
      )}

      {/* Content */}
      <div className="relative h-full flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            className="w-full h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            {isDefaultSlide ? (
              // Default slide - centered content with video background
              <div className="h-full flex items-center justify-center px-4 md:px-8 lg:px-12 xl:px-16">
                <div className="max-w-3xl mx-auto text-left md:text-center space-y-12 md:space-y-16">
                  <div className="space-y-10 md:space-y-12">
                    <div className="inline-block">
                      <h1 className="font-serif font-semibold tracking-tight text-white flex flex-col items-start md:items-center">
                        <motion.span
                          className="text-2xl md:text-3xl mb-2"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: 0.1 }}
                        >
                          ٱلسَّلَامُ عَلَيْكُمْ
                        </motion.span>
                        <motion.span
                          className="text-3xl md:text-4xl"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: 0.2 }}
                        >
                          Welcome to
                        </motion.span>
                        <motion.span
                          className="text-5xl md:text-6xl xl:text-8xl text-emerald-400 inline-block mt-2"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: 0.3 }}
                        >
                          Al-Bukhari
                        </motion.span>
                        <motion.span
                          className="text-3xl md:text-4xl relative inline-block mt-2 pb-6"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: 0.4 }}
                        >
                          Community Centre
                          <svg
                            className="absolute -bottom-4 left-0 w-full"
                            viewBox="0 0 200 8"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <motion.path
                              key={`underline-${currentSlide}`}
                              d="M1 5.5C47.6667 2.16667 154.4 -2.4 199 6"
                              stroke="#059669"
                              strokeWidth="2"
                              strokeLinecap="round"
                              initial={{ pathLength: 0, opacity: 0 }}
                              animate={{ pathLength: 1, opacity: 1 }}
                              transition={{ duration: 1.5, delay: 1, ease: "easeInOut" }}
                            />
                          </svg>
                        </motion.span>
                      </h1>
                    </div>
                    <motion.p
                      className="italic text-lg md:text-xl text-emerald-50 max-w-2xl md:mx-auto leading-relaxed font-serif"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.5 }}
                    >
                      "Whatever you spend in good is for yourselves, and your reward is with Allah." - Quran 2:272
                    </motion.p>
                  </div>

                  {/* Action Buttons for Default Slide */}
                  <motion.div
                    className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 justify-start md:justify-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                  >
                    <motion.a
                      href="https://app.irm.io/ajrcanada.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative inline-flex items-center justify-center px-6 py-3 text-base md:px-8 md:py-4 md:text-lg lg:px-10 lg:py-5 lg:text-xl font-bold text-white bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-[0_0_40px_rgba(251,146,60,0.8)] hover:scale-105 active:scale-95"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className="relative z-10">Donate Now</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 to-orange-600 rounded-lg blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
                    </motion.a>
                    {countdown ? (
                      <motion.a
                        href="#prayer-times"
                        className="group relative inline-flex items-center justify-center px-6 py-3 text-base md:px-8 md:py-4 md:text-lg lg:px-10 lg:py-5 lg:text-xl font-semibold text-white bg-transparent border-2 border-emerald-500 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] hover:scale-105 active:scale-95"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <span className="relative z-10 flex items-center gap-2">
                          <span className="tracking-wide">
                            {countdown.name}: {countdown.hours > 0 && `${countdown.hours}h `}{countdown.minutes}m {countdown.seconds}s
                          </span>
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </motion.a>
                    ) : (
                      <motion.button
                        className="px-6 py-3 text-base md:px-8 md:py-4 md:text-lg lg:px-10 lg:py-5 lg:text-xl font-semibold bg-emerald-950/50 border border-emerald-700/50 rounded-lg cursor-not-allowed opacity-60"
                        disabled
                      >
                        Loading prayer times...
                      </motion.button>
                    )}
                  </motion.div>
                </div>
              </div>
            ) : (
              // Event slide - split layout (desktop: image left, content right | mobile: stacked)
              <div className="h-full w-full flex flex-col lg:grid lg:grid-cols-2">
                {/* Content Section - Right on desktop, Bottom on mobile */}
                <div className="flex-1 flex items-start lg:items-center justify-center px-4 pt-6 pb-8 md:px-12 md:py-12 lg:px-16 lg:py-0 bg-gradient-to-br from-gray-900 via-gray-950 to-black order-2 lg:order-2">
                  <div className="max-w-xl space-y-3 md:space-y-6 lg:space-y-8">
                  <motion.div
                    className="inline-block px-3 py-1.5 md:px-4 md:py-2 bg-emerald-500/20 border border-emerald-500/50 rounded-full"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                  >
                    <span className="text-emerald-300 text-xs md:text-sm font-semibold uppercase tracking-wider">
                      {eventData?.category.replace('-', ' ')}
                    </span>
                  </motion.div>

                  <h2 className="font-serif font-bold text-2xl md:text-4xl lg:text-5xl xl:text-7xl text-white leading-tight">
                    {eventData?.title}
                  </h2>

                  <p className="text-sm md:text-lg lg:text-xl text-emerald-50 leading-relaxed">
                    {eventData?.description}
                  </p>

                  <div className="flex flex-col sm:flex-row items-start gap-2 md:gap-4 text-emerald-100">
                    <div className="flex items-center gap-1.5 md:gap-2">
                      <svg className="w-4 h-4 md:w-5 md:h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs md:text-sm">
                        {eventData && formatEventDate(eventData.eventDate, eventData.eventTime)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 md:gap-2">
                      <svg className="w-4 h-4 md:w-5 md:h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-xs md:text-sm">{eventData?.location}</span>
                    </div>
                  </div>

                    {/* Event Action Buttons */}
                    <motion.div
                      className="flex flex-wrap gap-2 md:gap-3"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.4 }}
                    >
                      {eventData?.registrationLink && (
                        <motion.a
                          href={eventData.registrationLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative inline-flex items-center justify-center px-4 py-2 md:px-6 md:py-3 lg:px-8 lg:py-4 text-sm md:text-base font-bold text-white bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-[0_0_40px_rgba(251,146,60,0.8)] hover:scale-105 active:scale-95"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <span className="relative z-10">Register Now</span>
                          <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </motion.a>
                      )}
                      {eventData?.slug && (
                        <motion.a
                          href={`/${eventData.slug}`}
                          className="group relative inline-flex items-center justify-center px-4 py-2 md:px-6 md:py-3 lg:px-8 lg:py-4 text-sm md:text-base font-semibold text-white bg-transparent border-2 border-amber-500 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(251,146,60,0.6)] hover:scale-105 active:scale-95"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <span className="relative z-10">Learn More</span>
                          <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </motion.a>
                      )}
                    </motion.div>
                  </div>
                </div>

                {/* Image Section - Left on desktop, Top on mobile (below navbar) */}
                {fullThumbnailUrl && (
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="relative h-[50vh] md:h-[60vh] lg:h-full w-full order-1 lg:order-1 overflow-hidden cursor-pointer group"
                  >
                    <motion.img
                      src={fullThumbnailUrl}
                      alt={eventData?.title || 'Event'}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      initial={{ opacity: 0.8, scale: 1.02 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                    />
                    {/* Decorative gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-gray-950/50 via-transparent to-transparent"></div>
                    {/* Click indicator - Always visible on mobile, hover on desktop */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                      <div className="opacity-60 md:opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/30 backdrop-blur-sm rounded-full p-3 md:p-4 shadow-lg">
                        <svg className="w-6 h-6 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                      </div>
                    </div>
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Full-Screen Image Modal - Image Only */}
      <AnimatePresence>
        {isModalOpen && !isDefaultSlide && fullThumbnailUrl && (
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
              className="absolute top-4 right-4 z-[110] p-3 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm transition-all duration-300 group"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6 md:w-8 md:h-8 text-white group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Full-screen image */}
            <motion.img
              src={fullThumbnailUrl}
              alt={eventData?.title || 'Event'}
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
    </section>
  );
}
