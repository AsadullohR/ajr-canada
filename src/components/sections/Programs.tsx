import { useState, useEffect, useRef } from 'react';
import { Clock, Users, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, PanInfo, useScroll, useMotionValue, useTransform } from 'framer-motion';
import { Program } from '../../types/program';
import { fetchAllPrograms } from '../../services/strapi';

const STRAPI_URL = import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337';

// Helper function to format recurrence pattern
const getRecurrenceText = (program: Program) => {
  let text = program.recurrencePattern.charAt(0).toUpperCase() + program.recurrencePattern.slice(1);
  
  if (program.recurrenceDaysOfWeek && program.recurrenceDaysOfWeek.length > 0) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayNames = program.recurrenceDaysOfWeek.map(d => {
      // If it's a string, use it directly (e.g., "Saturdays")
      if (typeof d === 'string') {
        return d;
      }
      // If it's a number, map it to day name
      return days[d];
    }).join(', ');
    text += ` • ${dayNames}`;
  }
  
  return text;
};

// Helper function to format time
const formatTime = (timeStr: string) => {
  const [hours, minutes] = timeStr.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

// Individual Card Component with drag physics
interface CardItemProps {
  program: Program;
  index: number;
  isTop: boolean;
  exitX: number;
  fullThumbnailUrl: string | null;
  cardsLength: number;
  onDragStart: () => void;
  onDragEnd: ((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => void) | undefined;
  onClick: () => void;
}

function CardItem({ 
  program, 
  index, 
  isTop, 
  exitX, 
  fullThumbnailUrl, 
  cardsLength,
  onDragStart,
  onDragEnd,
  onClick 
}: CardItemProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-25, 0, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      style={{
        zIndex: cardsLength - index,
        x: isTop ? x : 0,
        rotate: isTop ? rotate : 0,
        opacity: isTop ? opacity : 1 - index * 0.2,
      }}
      animate={
        isTop && exitX !== 0
          ? { x: exitX, opacity: 0, transition: { duration: 0.2 } }
          : {
              scale: 1 - index * 0.05,
              y: index * 20,
            }
      }
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20,
      }}
    >
      <div
        className="h-full bg-black rounded-2xl shadow-2xl overflow-hidden pointer-events-auto relative"
        onClick={onClick}
      >
        {/* Large Image Background */}
        {fullThumbnailUrl && (
          <div className="absolute inset-0">
            <img
              src={fullThumbnailUrl}
              alt={program.title}
              className="w-full h-full object-cover"
            />
            {/* Gradient overlay from bottom */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/75 to-black/60"></div>
          </div>
        )}

        {/* Content Overlay */}
        <div className="relative h-full flex flex-col p-5">
          {/* Top Section - Category Badge */}
          <div className="mb-auto">
            <div className="inline-block px-3 py-1 bg-amber-500/80 backdrop-blur-sm text-white hover:bg-amber-600/80 focus:ring-amber-400 shadow-lg shadow-amber-500/30 text-xs font-semibold rounded-full">
              {program.category.replace('-', ' ').split(' ').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ')}
            </div>
          </div>

          {/* Bottom Section - Description Area */}
          <div className="mt-auto space-y-3">
            {/* Title */}
            <h3 className="font-serif font-bold text-3xl text-white line-clamp-2 min-h-[4rem] drop-shadow-lg">
              {program.title}
            </h3>

            {/* Description with backdrop blur */}
            <div className="bg-black/30 backdrop-blur-md rounded-lg p-3 border border-white/10">
              <p className="text-gray-200 text-sm line-clamp-2 mb-3">
                {program.description}
              </p>

              {/* Meta Info */}
              <div className="grid grid-cols-2 gap-2">
                {/* First Column */}
                <div className="space-y-1.5">
                  {program.recurrencePattern && (
                    <div className="flex items-start gap-1.5 text-xs text-gray-300">
                      <Calendar className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span className="leading-tight">{getRecurrenceText(program)}</span>
                    </div>
                  )}
                  {program.eventTime && (
                    <div className="flex items-start gap-1.5 text-xs text-gray-300">
                      <Clock className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span className="leading-tight">{program.timeDescription || formatTime(program.eventTime)}</span>
                    </div>
                  )}
                </div>
                
                {/* Second Column */}
                <div className="space-y-1.5">
                  {program.audience && (
                    <div className="flex items-start gap-1.5 text-xs text-gray-300">
                      <Users className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span className="capitalize leading-tight">{program.audience}</span>
                    </div>
                  )}
                  {program.age && (
                    <div className="flex items-start gap-1.5 text-xs text-gray-300">
                      <Users className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span className="leading-tight">{program.age}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-2">
              {program.registrationRequired ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClick();
                  }}
                  className="w-full px-4 py-2 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white font-semibold rounded-lg hover:from-amber-600 hover:via-orange-600 hover:to-amber-600 transition-all duration-300 hover:shadow-lg"
                >
                  Register Now
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClick();
                  }}
                  className="w-full px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors duration-200"
                >
                  Learn More
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Mobile Card Stack Component
function MobileCardStack({ programs }: { programs: Program[] }) {
  const navigate = useNavigate();
  const [cards, setCards] = useState<Program[]>(programs);
  const [exitX, setExitX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    
    // If swiped left or right significantly, animate card off screen
    if (Math.abs(info.offset.x) > 100) {
      // Set exit direction
      setExitX(info.offset.x > 0 ? 1000 : -1000);
      
      // Move card to back after animation
      setTimeout(() => {
        setCards((prev) => {
          const newCards = [...prev];
          const topCard = newCards.shift();
          if (topCard) {
            newCards.push(topCard);
          }
          return newCards;
        });
        setExitX(0);
      }, 200);
    }
  };

  if (cards.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No programs available
      </div>
    );
  }

  return (
    <div className="relative h-[550px] w-full max-w-sm mx-auto">
      {cards.slice(0, 3).map((program, index) => {
        const isTop = index === 0;
        const thumbnailUrl = program.thumbnail?.formats?.medium?.url || program.thumbnail?.url;
        const fullThumbnailUrl = thumbnailUrl
          ? (thumbnailUrl.startsWith('http') ? thumbnailUrl : `${STRAPI_URL}${thumbnailUrl}`)
          : null;

        // Create unique key using both program id and current index in cards array
        const cardIndex = cards.indexOf(program);
        const uniqueKey = `${program.id}-${cardIndex}-${index}`;

        return (
          <CardItem
            key={uniqueKey}
            program={program}
            index={index}
            isTop={isTop}
            exitX={exitX}
            fullThumbnailUrl={fullThumbnailUrl}
            cardsLength={cards.length}
            onDragStart={() => isTop && setIsDragging(true)}
            onDragEnd={isTop ? handleDragEnd : undefined}
            onClick={() => !isDragging && isTop && navigate(`/programs/${program.slug}`)}
          />
        );
      })}

      {/* Swipe Hint */}
      {cards.length > 1 && (
        <div className="absolute -bottom-12 left-0 right-0 text-center">
          <p className="text-sm text-gray-500">Swipe left or right</p>
        </div>
      )}
    </div>
  );
}

// Desktop Horizontal Scroll Component
function DesktopScrollContainer({ programs }: { programs: Program[] }) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollXProgress } = useScroll({ container: containerRef });
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const hasDraggedRef = useRef(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const checkScroll = () => {
    if (containerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
      return () => container.removeEventListener('scroll', checkScroll);
    }
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    hasDraggedRef.current = false;
    const rect = containerRef.current.getBoundingClientRect();
    setStartX(e.pageX - rect.left);
    setScrollLeft(containerRef.current.scrollLeft);
    containerRef.current.style.cursor = 'grabbing';
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    if (containerRef.current) {
      containerRef.current.style.cursor = 'grab';
    }
    // Reset hasDragged after a short delay to allow click to be prevented
    setTimeout(() => {
      hasDraggedRef.current = false;
    }, 100);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (containerRef.current) {
      containerRef.current.style.cursor = 'grab';
    }
    // Reset hasDragged after a short delay to allow click to be prevented
    setTimeout(() => {
      hasDraggedRef.current = false;
    }, 100);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.pageX - rect.left;
    const walk = (x - startX) * 2; // Scroll speed multiplier
    
    // If the mouse moved more than 5px, consider it a drag
    if (Math.abs(walk) > 5) {
      hasDraggedRef.current = true;
    }
    
    containerRef.current.scrollLeft = scrollLeft - walk;
  };

  const scroll = (direction: 'left' | 'right') => {
    if (containerRef.current) {
      const scrollAmount = 400; // Card width (380) + gap (20px)
      const newScrollLeft = containerRef.current.scrollLeft + (direction === 'right' ? scrollAmount : -scrollAmount);
      containerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth',
      });
    }
  };

  if (programs.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No programs available
      </div>
    );
  }

  return (
    <div className="relative -mx-4 md:mx-0">
      <div className="relative overflow-hidden">
        {/* Left Arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/95 hover:bg-white shadow-xl rounded-full p-3 transition-all duration-300 hover:scale-110 group"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700 group-hover:text-emerald-600" />
          </button>
        )}

        {/* Right Arrow */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/95 hover:bg-white shadow-xl rounded-full p-3 transition-all duration-300 hover:scale-110 group"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-6 h-6 text-gray-700 group-hover:text-emerald-600" />
          </button>
        )}

        {/* Right Fade Gradient */}
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-0 w-40 bg-gradient-to-l from-gray-50 via-gray-50/70 to-transparent z-10 pointer-events-none" />
        )}

        {/* Left Fade Gradient */}
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-0 w-40 bg-gradient-to-r from-gray-50 via-gray-50/70 to-transparent z-10 pointer-events-none" />
        )}

        <div
          ref={containerRef}
          className="overflow-x-auto overflow-y-visible scrollbar-hide cursor-grab active:cursor-grabbing px-8 py-8 select-none"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            maxWidth: '100%',
            userSelect: 'none',
          }}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
        >
          <div className="flex gap-5" style={{ width: 'max-content', paddingRight: '200px' }}>
        {programs.map((program, index) => {
          const thumbnailUrl = program.thumbnail?.formats?.medium?.url || program.thumbnail?.url;
          const fullThumbnailUrl = thumbnailUrl
            ? (thumbnailUrl.startsWith('http') ? thumbnailUrl : `${STRAPI_URL}${thumbnailUrl}`)
            : null;

          return (
            <motion.div
              key={`desktop-${program.id}-${index}`}
              className="w-[380px] flex-shrink-0"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: index * 0.1 }}
            >
              <motion.div
                className="h-[600px] bg-black rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden cursor-pointer relative group"
                onClick={() => !hasDraggedRef.current && navigate(`/programs/${program.slug}`)}
                whileHover="hover"
                initial="initial"
              >
                {/* Large Image Background */}
                {fullThumbnailUrl && (
                  <div className="absolute inset-0">
                    <img
                      src={fullThumbnailUrl}
                      alt={program.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    {/* Gradient overlay - becomes more transparent on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/75 to-black/60 transition-opacity duration-500 group-hover:opacity-0"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/40 to-black/20 opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
                  </div>
                )}

                {/* Content Overlay */}
                <div className="relative h-full flex flex-col p-6">
                  {/* Top Section - Category Badge */}
                  <motion.div 
                    className="mb-auto"
                    variants={{
                      initial: { opacity: 1 },
                      hover: { opacity: 1 },
                    }}
                  >
                    <motion.div 
                      className="inline-block px-3 py-1 bg-amber-500/80 backdrop-blur-sm text-white hover:bg-amber-600/80 focus:ring-amber-400 shadow-lg shadow-amber-500/30 text-xs font-semibold rounded-full"
                      variants={{
                        initial: { backgroundColor: 'rgba(245, 158, 11, 0.8)', boxShadow: '0 10px 15px -3px rgba(245, 158, 11, 0.3)' },
                        hover: { backgroundColor: 'rgba(217, 119, 6, 0.8)', boxShadow: '0 10px 15px -3px rgba(245, 158, 11, 0.4)' },
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      {program.category.replace('-', ' ').split(' ').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ')}
                    </motion.div>
                  </motion.div>

                  {/* Bottom Section - Description Area with hover effect */}
                  <div className="mt-auto space-y-3">
                    {/* Title */}
                    <h3 className="font-serif font-bold text-3xl text-white line-clamp-2 min-h-[4rem] drop-shadow-lg">
                      {program.title}
                    </h3>

                    {/* Description with backdrop blur - expands on hover */}
                    <motion.div 
                      className="bg-black/30 backdrop-blur-md rounded-lg p-3 border border-white/10 overflow-hidden"
                      variants={{
                        initial: { 
                          y: 0,
                          backgroundColor: 'rgba(0, 0, 0, 0.3)',
                          backdropFilter: 'blur(12px)',
                          borderColor: 'rgba(255, 255, 255, 0.1)',
                          opacity: 0.9,
                        },
                        hover: { 
                          y: -8,
                          backgroundColor: 'rgba(0, 0, 0, 0.6)',
                          backdropFilter: 'blur(16px)',
                          borderColor: 'rgba(255, 255, 255, 0.2)',
                          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                          opacity: 1,
                        },
                      }}
                      transition={{
                        duration: 0.7,
                        ease: [0.25, 0.46, 0.45, 0.94],
                      }}
                    >
                      <motion.div
                        className="overflow-hidden"
                        variants={{
                          initial: { 
                            maxHeight: '3rem',
                          },
                          hover: { 
                            maxHeight: '500px',
                          },
                        }}
                        transition={{
                          duration: 0.7,
                          ease: [0.25, 0.46, 0.45, 0.94],
                        }}
                      >
                        <motion.p 
                          className="text-gray-200 text-sm mb-3 line-clamp-2 group-hover:line-clamp-none"
                          variants={{
                            initial: { 
                              opacity: 0.85,
                              y: 8,
                            },
                            hover: { 
                              opacity: 1,
                              y: 0,
                            },
                          }}
                          transition={{
                            duration: 0.7,
                            ease: [0.25, 0.46, 0.45, 0.94],
                            delay: 0.05,
                          }}
                        >
                          {program.description}
                        </motion.p>
                      </motion.div>

                      {/* Meta Info */}
                      <div className="grid grid-cols-2 gap-2">
                        {/* First Column */}
                        <div className="space-y-1.5">
                          {program.recurrencePattern && (
                            <div className="flex items-start gap-1.5 text-xs text-gray-300">
                              <Calendar className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                              <span className="leading-tight">{getRecurrenceText(program)}</span>
                            </div>
                          )}
                          {program.eventTime && (
                            <div className="flex items-start gap-1.5 text-xs text-gray-300">
                              <Clock className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                              <span className="leading-tight">{program.timeDescription || formatTime(program.eventTime)}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Second Column */}
                        <div className="space-y-1.5">
                          {program.audience && (
                            <div className="flex items-start gap-1.5 text-xs text-gray-300">
                              <Users className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                              <span className="capitalize leading-tight">{program.audience}</span>
                            </div>
                          )}
                          {program.age && (
                            <div className="flex items-start gap-1.5 text-xs text-gray-300">
                              <Users className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                              <span className="leading-tight">{program.age}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>

                    {/* Action Button */}
                    <div className="pt-2">
                      {program.registrationRequired ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/programs/${program.slug}`);
                          }}
                          className="w-full px-4 py-2 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white font-semibold rounded-lg hover:from-amber-600 hover:via-orange-600 hover:to-amber-600 transition-all duration-300 hover:shadow-lg"
                        >
                          Register Now
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/programs/${program.slug}`);
                          }}
                          className="w-full px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors duration-200"
                        >
                          Learn More
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          );
        })}
          </div>
        </div>
      </div>

      {/* Scroll Progress Bar */}
      <motion.div
        className="h-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full mt-4 mx-4"
        style={{ scaleX: scrollXProgress, transformOrigin: 'left' }}
      />

      {/* Hint Text */}
      {programs.length > 1 && (
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">Click arrows or scroll horizontally</p>
        </div>
      )}
    </div>
  );
}

// Main Programs Component
export function Programs() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const loadPrograms = async () => {
      setLoading(true);
      const response = await fetchAllPrograms();
      // Sort programs by createdAt descending (latest first)
      const sortedPrograms = [...response.data].sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA; // Descending order
      });
      setPrograms(sortedPrograms);
      setLoading(false);
    };

    loadPrograms();
  }, []);

  if (loading) {
    return (
      <section id="programs" className="py-20 bg-gray-50">
        <div className="px-4">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mb-4"></div>
            <p className="text-gray-600">Loading programs...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="programs" className="py-20 bg-gray-50">
      <div className="px-4 ">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-serif font-bold text-4xl md:text-5xl text-gray-900 mb-4">
            Our Programs
          </h2>
        </motion.div>

        {/* Responsive Programs Display */}
        {isMobile ? (
          <MobileCardStack programs={programs} />
        ) : (
          <DesktopScrollContainer programs={programs} />
        )}
      </div>
    </section>
  );
}
