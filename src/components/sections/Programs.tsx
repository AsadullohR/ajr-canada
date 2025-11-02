import { useState, useEffect, useRef } from 'react';
import { Clock, Users, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, PanInfo, useScroll, useMotionValue, useTransform } from 'framer-motion';
import { Program } from '../../types/program';
import { fetchAllPrograms } from '../../services/strapi';

const STRAPI_URL = import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337';

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
        className="h-full bg-white rounded-2xl shadow-2xl overflow-hidden pointer-events-auto"
        onClick={onClick}
      >
        {/* Image */}
        {fullThumbnailUrl && (
          <div className="h-48 overflow-hidden">
            <img
              src={fullThumbnailUrl}
              alt={program.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {/* Category Badge */}
          <div className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full mb-3">
            {program.category.replace('-', ' ').split(' ').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ')}
          </div>

          {/* Title */}
          <h3 className="font-serif font-bold text-2xl text-gray-900 mb-3 line-clamp-2">
            {program.title}
          </h3>

          {/* Description */}
          <p className="text-gray-600 mb-4 line-clamp-3">
            {program.description}
          </p>

          {/* Meta Info */}
          <div className="space-y-2">
            {program.eventTime && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4 text-emerald-500" />
                <span>{program.timeDescription || program.eventTime}</span>
              </div>
            )}
            {program.audience && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="w-4 h-4 text-emerald-500" />
                <span className="capitalize">{program.audience}</span>
              </div>
            )}
            {program.recurrencePattern && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4 text-emerald-500" />
                <span className="capitalize">{program.recurrencePattern}</span>
              </div>
            )}
          </div>

          {/* Instructor */}
          {program.instructor && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-3">
                {program.instructorPicture?.url ? (
                  <img
                    src={program.instructorPicture.url.startsWith('http') 
                      ? program.instructorPicture.url 
                      : `${STRAPI_URL}${program.instructorPicture.url}`
                    }
                    alt={program.instructor}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-emerald-600" />
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500">Instructor</p>
                  <p className="text-sm font-semibold text-gray-900">{program.instructor}</p>
                </div>
              </div>
            </div>
          )}
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
    <div className="relative h-[500px] w-full max-w-sm mx-auto">
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
          className="overflow-x-auto overflow-y-visible scrollbar-hide cursor-grab active:cursor-grabbing px-8 py-8"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            maxWidth: '100%',
          }}
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
              <div
                className="h-full bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden cursor-pointer group"
                onClick={() => navigate(`/programs/${program.slug}`)}
              >
                {/* Image */}
                {fullThumbnailUrl && (
                  <div className="h-56 overflow-hidden">
                    <img
                      src={fullThumbnailUrl}
                      alt={program.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                )}

                {/* Content */}
                <div className="p-6">
                  {/* Category Badge */}
                  <div className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full mb-3">
                    {program.category.replace('-', ' ').split(' ').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </div>

                  {/* Title */}
                  <h3 className="font-serif font-bold text-2xl text-gray-900 mb-3 line-clamp-2">
                    {program.title}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {program.description}
                  </p>

                  {/* Meta Info */}
                  <div className="space-y-2">
                    {program.eventTime && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4 text-emerald-500" />
                        <span>{program.timeDescription || program.eventTime}</span>
                      </div>
                    )}
                    {program.audience && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="w-4 h-4 text-emerald-500" />
                        <span className="capitalize">{program.audience}</span>
                      </div>
                    )}
                    {program.recurrencePattern && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4 text-emerald-500" />
                        <span className="capitalize">{program.recurrencePattern}</span>
                      </div>
                    )}
                  </div>

                  {/* Instructor */}
                  {program.instructor && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-3">
                        {program.instructorPicture?.url ? (
                          <img
                            src={program.instructorPicture.url.startsWith('http') 
                              ? program.instructorPicture.url 
                              : `${STRAPI_URL}${program.instructorPicture.url}`
                            }
                            alt={program.instructor}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                            <Users className="w-5 h-5 text-emerald-600" />
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-gray-500">Instructor</p>
                          <p className="text-sm font-semibold text-gray-900">{program.instructor}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
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
      
      // Duplicate programs for testing (to have 6 cards)
      const duplicatedPrograms = [...response.data];
      while (duplicatedPrograms.length < 6 && response.data.length > 0) {
        duplicatedPrograms.push(...response.data);
      }
      setPrograms(duplicatedPrograms.slice(0, 6));
      
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
