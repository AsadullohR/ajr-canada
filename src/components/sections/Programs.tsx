import { useState, useEffect, useRef } from 'react';
import { Clock, Users, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useTransform, PanInfo, useScroll, useTransform as scrollTransform } from 'framer-motion';
import { Program } from '../../types/program';
import { fetchAllPrograms } from '../../services/strapi';

const STRAPI_URL = import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337';

// Mobile Card Stack Component
function MobileCardStack({ programs }: { programs: Program[] }) {
  const navigate = useNavigate();
  const [cards, setCards] = useState<Program[]>(programs);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    
    // If swiped left or right significantly, move card to back
    if (Math.abs(info.offset.x) > 100) {
      setCards((prev) => {
        const newCards = [...prev];
        const topCard = newCards.shift();
        if (topCard) {
          newCards.push(topCard);
        }
        return newCards;
      });
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
          <motion.div
            key={uniqueKey}
            className="absolute inset-0 cursor-grab active:cursor-grabbing"
            style={{
              zIndex: cards.length - index,
            }}
            initial={false}
            animate={{
              scale: 1 - index * 0.05,
              y: index * 20,
              opacity: 1 - index * 0.2,
            }}
            drag={isTop ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            onDragStart={() => isTop && setIsDragging(true)}
            onDragEnd={isTop ? handleDragEnd : undefined}
            whileDrag={{ scale: 1.05, rotate: 0 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
          >
            <div
              className="h-full bg-white rounded-2xl shadow-2xl overflow-hidden"
              onClick={() => !isDragging && isTop && navigate(`/programs/${program.slug}`)}
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

  if (programs.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No programs available
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="overflow-x-auto overflow-y-hidden scrollbar-hide"
      style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      <div className="flex gap-6 pb-4" style={{ width: 'max-content' }}>
        {programs.map((program, index) => {
          const thumbnailUrl = program.thumbnail?.formats?.medium?.url || program.thumbnail?.url;
          const fullThumbnailUrl = thumbnailUrl
            ? (thumbnailUrl.startsWith('http') ? thumbnailUrl : `${STRAPI_URL}${thumbnailUrl}`)
            : null;

          return (
            <motion.div
              key={`desktop-${program.id}-${index}`}
              className="w-[400px] flex-shrink-0"
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

      {/* Scroll Progress Bar */}
      <motion.div
        className="h-1 bg-emerald-500 rounded-full mt-4"
        style={{ scaleX: scrollXProgress, transformOrigin: 'left' }}
      />
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
        <div className="container mx-auto px-4">
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
      <div className="container mx-auto px-4">
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
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover our diverse range of educational, spiritual, and community programs
          </p>
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
