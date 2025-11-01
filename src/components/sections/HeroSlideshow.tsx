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
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [dataReady, setDataReady] = useState(false);
  const [showContent, setShowContent] = useState(false);

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

  // Animate loading progress to 95% over exactly 1 second
  useEffect(() => {
    const duration = 1000; // 1 second
    const targetProgress = 95;
    const startTime = Date.now();

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / duration) * targetProgress, targetProgress);

      setLoadingProgress(progress);

      if (progress >= targetProgress) {
        clearInterval(timer);
      }
    }, 16); // ~60fps

    return () => clearInterval(timer);
  }, []);

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

      // Mark data as ready
      setDataReady(true);
    };

    loadEvents();
  }, []);

  // Once data is ready and progress reaches 95%, complete loading
  useEffect(() => {
    if (dataReady && loadingProgress >= 95) {
      // Jump to 100%
      setLoadingProgress(100);

      // Wait a bit to show 100%, then fade out and show content
      setTimeout(() => {
        setIsLoading(false);
        // Small delay to ensure loading screen starts fading before content animates in
        setTimeout(() => {
          setShowContent(true);
        }, 100);
      }, 400);
    }
  }, [dataReady, loadingProgress]);

  // Auto-advance slides
  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setProgress(0);
  }, [slides.length]);

  // Progress bar animation
  useEffect(() => {
    if (isPaused) return;

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          return 0;
        }
        return prev + (100 / (SLIDE_DURATION / 50));
      });
    }, 50);

    return () => clearInterval(progressInterval);
  }, [isPaused]);

  // Auto-advance when progress reaches 100%
  useEffect(() => {
    if (!isPaused && progress >= 100) {
      nextSlide();
    }
  }, [progress, nextSlide, isPaused]);

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
    <section id="home" className="relative h-screen overflow-hidden bg-gray-950">
      {/* Loading Screen */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="absolute inset-0 z-[200] flex flex-col items-center justify-center bg-gray-950"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Logo */}
            <motion.div
              className="mb-12"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <img
                src="/images/Ajr Islamic Foundation Logo PNG.png"
                alt="Al-Bukhari Community Centre Logo"
                className="w-48 h-48 md:w-64 md:h-64 object-contain"
              />
            </motion.div>

            {/* Percentage Counter */}
            <motion.div
              className="flex flex-col items-center gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              {/* Animated Percentage */}
              <div className="relative">
                <motion.div
                  className="text-base md:text-xl text-white font-serif"
                  key={Math.floor(loadingProgress)}
                >
                  {Math.floor(loadingProgress)}%
                </motion.div>
              </div>

              {/* Progress Bar */}
              <div className="w-64 md:w-80 h-2 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500 rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: `${loadingProgress}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
              </div>

              {/* Loading Text */}
              <motion.p
                className="text-white text-sm md:text-base font-light tracking-wide"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                Loading...
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background - Only for default slide - Only show when content is ready */}
      {showContent && isDefaultSlide && (
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
              ></iframe>
              <div className="absolute inset-0 bg-gradient-to-r from-gray-950/80 via-gray-900/65 to-gray-950/80"></div>
              <div className="absolute inset-0 islamic-pattern opacity-30"></div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Slide indicators with pause button - Only show when content is ready */}
      {showContent && slides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3">
          {/* Pause/Play Button */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="w-8 h-8 rounded-full bg-black border-2 border-emerald-500 hover:border-emerald-400 transition-all duration-300 flex items-center justify-center hover:scale-110"
            aria-label={isPaused ? 'Play slideshow' : 'Pause slideshow'}
          >
            {isPaused ? (
              // Play icon
              <svg className="w-4 h-4 text-emerald-400 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            ) : (
              // Pause icon
              <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            )}
          </button>

          {/* Slide number buttons */}
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

      {/* Progress Bar - Only show when content is ready */}
      {showContent && slides.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 z-50 h-1 bg-gray-800/50">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.05, ease: 'linear' }}
          />
        </div>
      )}

      {/* Content - Only show when content is ready */}
      {showContent && (
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
                      <h1 className="font-serif font-semibold tracking-tight text-white flex flex-col items-start">
                        <motion.span
                          className="text-xl md:text-3xl mb-2"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: 0.1 }}
                        >
                          ٱلسَّلَامُ عَلَيْكُمْ
                        </motion.span>
                        <motion.span
                          className="text-5xl md:text-7xl"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: 0.2 }}
                        >
                          Welcome to
                        </motion.span>
                        <motion.span
                          className="text-5xl md:text-7xl text-emerald-400 inline-block mt-2"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: 0.3 }}
                        >
                          Al-Bukhari
                        </motion.span>
                        <motion.span
                          className="text-3xl md:text-7xl text-emerald-400 relative inline-block mt-2 pb-6"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: 0.4 }}
                        >
                          Community Centre
                          <svg
                            className="absolute -bottom-1 left-0 w-full"
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
                      className="italic text-base md:text-xl text-emerald-50 max-w-2xl md:mx-auto leading-relaxed font-serif text-center md:text-left"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.5 }}
                    >
                      "Whoever builds a mosque for Allah, Allah will build for him likewise in Paradise" - Sahih al-Bukhari & Sahih Muslim
                    </motion.p>
                  </div>

                  {/* Action Buttons for Default Slide */}
                  <motion.div
                    className="flex flex-col sm:flex-row justify-center md:justify-start gap-4 [&>*]:w-full sm:[&>*]:w-auto sm:[&>*]:min-w-[240px]"
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
                        <span className="flex items-center gap-2 tracking-wide">
                          {countdown.name}: {countdown.hours > 0 && `${countdown.hours}h `}{countdown.minutes}m {countdown.seconds}s
                        </span>
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
              // Event slide - desktop: two-column layout (text left, image right), mobile: text only
              <div className="h-full w-full relative">
                {/* Background with pattern */}
                <div className="absolute inset-0 w-full h-full">
                  <div
                    className="absolute inset-0 w-full h-full"
                    style={{
                      backgroundImage: 'url(/images/pattern_background.jpg)',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  ></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-950/90 to-gray-950/60"></div>

                </div>

                {/* Content */}
                <div className="relative h-full flex items-center justify-center px-4 md:px-8 lg:px-12 xl:px-16">
                  <div className="max-w-7xl w-full mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                      {/* Left side - Text content */}
                      <div className="space-y-6 md:space-y-8">
                        {/* Event Title */}
                        <motion.h2
                          className="font-serif font-semibold text-3xl lg:text-6xl text-white leading-tight"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: 0.1 }}
                        >
                          {eventData?.title}
                        </motion.h2>

                        {/* Event Description */}
                        <motion.p
                          className="italic text-sm md:text-lg text-emerald-50 leading-relaxed font-serif"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: 0.3 }}
                        >
                          {eventData?.description}
                        </motion.p>

                        {/* Poster Image - Mobile Only */}
                        {fullThumbnailUrl && (
                          <motion.div
                            className="lg:hidden relative flex items-center justify-center"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.35 }}
                          >
                            <button
                              onClick={() => setIsModalOpen(true)}
                              className="relative group overflow-hidden rounded-xl shadow-2xl cursor-pointer max-w-sm mx-auto"
                            >
                              <img
                                src={fullThumbnailUrl}
                                alt={eventData?.title || 'Event'}
                                className="w-full h-auto max-h-64 object-contain transition-transform duration-500 group-hover:scale-105"
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
                          </motion.div>
                        )}

                        {/* Event Details - Hidden on Mobile */}
                        <motion.div
                          className="hidden lg:grid grid-cols-2 gap-x-4 sm:gap-x-6 gap-y-3 text-emerald-100"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: 0.4 }}
                        >
                          {/* First Column */}
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2">
                              <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span className="text-sm">
                                {eventData && formatEventDate(eventData.eventDate, eventData.eventTime)}
                              </span>
                            </div>
                            {eventData?.endDate && eventData.endDate !== eventData.eventDate && (
                              <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="text-sm">
                                  {formatEventDate(eventData.endDate, eventData.endTime || '')}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span className="text-sm">{eventData?.location}</span>
                            </div>
                            {eventData?.capacity && (
                              <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                <span className="text-sm">Capacity: {eventData.capacity}</span>
                              </div>
                            )}
                          </div>

                          {/* Second Column */}
                          <div className="flex flex-col gap-3">
                            {eventData?.category && (
                              <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                                <span className="text-sm">Category: {eventData.category.replace('-', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</span>
                              </div>
                            )}
                            {eventData?.organizer && (
                              <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span className="text-sm">{eventData.organizer}</span>
                              </div>
                            )}
                            {eventData?.contactEmail && (
                              <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <a href={`mailto:${eventData.contactEmail}`} className="text-sm hover:text-emerald-300 transition-colors">
                                  {eventData.contactEmail}
                                </a>
                              </div>
                            )}
                            {eventData?.contactPhone && (
                              <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                  <a href={`tel:${eventData.contactPhone}`} className="text-sm hover:text-emerald-300 transition-colors">
                                  {eventData.contactPhone}
                                </a>
                              </div>
                            )}
                          </div>
                        </motion.div>

                        {/* Event Action Buttons */}
                        <motion.div
                          className="flex flex-col sm:flex-row gap-3 sm:gap-4 [&>*]:flex-1 [&>*]:min-w-[200px]"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: 0.5 }}
                        >
                          {eventData?.registrationLink && (
                            <motion.a
                              href={eventData.registrationLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group relative inline-flex items-center justify-center px-6 py-3 text-base md:px-8 md:py-4 md:text-lg lg:px-10 lg:py-5 lg:text-xl font-bold text-white bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-[0_0_40px_rgba(251,146,60,0.8)] hover:scale-105 active:scale-95"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <span className="relative z-10">Register</span>
                              <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                              <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 to-orange-600 rounded-lg blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
                            </motion.a>
                          )}
                          {eventData?.slug && (
                            <motion.a
                              href={`/events/${eventData.slug}`}
                              className="group relative inline-flex items-center justify-center px-6 py-3 text-base md:px-8 md:py-4 md:text-lg lg:px-10 lg:py-5 lg:text-xl font-semibold text-white bg-transparent border-2 border-emerald-500 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] hover:scale-105 active:scale-95"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <span>Learn More</span>
                            </motion.a>
                          )}
                        </motion.div>
                      </div>

                      {/* Right side - Image (hidden on mobile) */}
                      {fullThumbnailUrl && (
                        <motion.div
                          className="hidden lg:flex relative items-center justify-center max-h-[500px]"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.6, delay: 0.3 }}
                        >
                          <button
                            onClick={() => setIsModalOpen(true)}
                            className="relative group overflow-hidden rounded-xl shadow-2xl cursor-pointer"
                          >
                            <img
                              src={fullThumbnailUrl}
                              alt={eventData?.title || 'Event'}
                              className="max-h-[500px] w-auto object-contain transition-transform duration-500 group-hover:scale-110"
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
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
        </div>
      )}

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
