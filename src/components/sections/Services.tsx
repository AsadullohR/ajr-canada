import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, PanInfo, useScroll, useMotionValue, useTransform } from 'framer-motion';
import { Service } from '../../types/service';
import { fetchAllServices } from '../../services/strapi';

const STRAPI_URL = import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337';

// Individual Card Component with drag physics
interface CardItemProps {
  service: Service;
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
  service, 
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
        className="h-full bg-black rounded-2xl shadow-2xl overflow-hidden pointer-events-auto relative border-2 border-emerald-500"
        onClick={onClick}
      >
        {/* Large Image Background */}
        {fullThumbnailUrl && (
          <div className="absolute inset-0">
            <img
              src={fullThumbnailUrl}
              alt={service.title}
              className="w-full h-full object-cover"
            />
            {/* Gradient overlay from bottom */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/75 to-black/60"></div>
          </div>
        )}

        {/* Content Overlay */}
        <div className="relative h-full flex flex-col p-5">
          {/* Bottom Section - Description Area */}
          <div className="mt-auto space-y-3">
            {/* Title */}
            <h3 className="font-serif font-bold text-3xl text-white line-clamp-2 min-h-[4rem] drop-shadow-lg">
                      {service.title}
                    </h3>
                    
            {/* Description with backdrop blur */}
            <div className="bg-black/30 backdrop-blur-md rounded-lg p-3 border border-white/10">
              <p className="text-gray-200 text-sm line-clamp-3 mb-3">
                        {service.description}
                      </p>
                    </div>

            {/* Action Button */}
            <div className="pt-2">
              <motion.a
                href={service.link || (service.slug ? `/services/${service.slug}` : '#')}
                target={service.linkType === 'external' ? '_blank' : undefined}
                rel={service.linkType === 'external' ? 'noopener noreferrer' : undefined}
                onClick={(e) => {
                  e.stopPropagation();
                  if ((service.linkType === 'internal' || !service.link) && service.slug) {
                    e.preventDefault();
                    onClick();
                  }
                }}
                className="group relative inline-flex items-center justify-center w-full px-4 py-2 font-semibold text-white bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(251,146,60,0.6)] hover:scale-105 active:scale-95"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="relative z-10">Learn More</span>
                <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </motion.a>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Mobile Card Stack Component
function MobileCardStack({ services }: { services: Service[] }) {
  const navigate = useNavigate();
  const [cards, setCards] = useState<Service[]>(services);
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

  const handleClick = (service: Service) => {
    if (!isDragging) {
      if (service.linkType === 'internal' && service.slug) {
        navigate(`/services/${service.slug}`);
      } else if (service.link) {
        window.location.href = service.link;
      }
    }
  };

  if (cards.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No services available
      </div>
    );
  }

  return (
    <div className="relative h-[550px] w-full max-w-sm mx-auto">
      {cards.slice(0, 3).map((service, index) => {
        const isTop = index === 0;
        const cardIndex = cards.indexOf(service);
        const uniqueKey = `${service.title}-${cardIndex}-${index}`;
        
        // Get thumbnail URL
        const thumbnailUrl = service.thumbnail?.formats?.large?.url || service.thumbnail?.url;
        const fullThumbnailUrl = thumbnailUrl
          ? (thumbnailUrl.startsWith('http') ? thumbnailUrl : `${STRAPI_URL}${thumbnailUrl}`)
          : null;

        return (
          <CardItem
            key={uniqueKey}
            service={service}
            index={index}
            isTop={isTop}
            exitX={exitX}
            fullThumbnailUrl={fullThumbnailUrl}
            cardsLength={cards.length}
            onDragStart={() => isTop && setIsDragging(true)}
            onDragEnd={isTop ? handleDragEnd : undefined}
            onClick={() => handleClick(service)}
          />
        );
      })}

      {/* Swipe Hint */}
      {cards.length > 1 && (
        <div className="absolute -bottom-12 left-0 right-0 text-center">
          <p className="text-sm text-white/70">Swipe left or right</p>
        </div>
      )}
    </div>
  );
}

// Desktop Horizontal Scroll Component
function DesktopScrollContainer({ services }: { services: Service[] }) {
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
    setTimeout(() => {
      hasDraggedRef.current = false;
    }, 100);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (containerRef.current) {
      containerRef.current.style.cursor = 'grab';
    }
    setTimeout(() => {
      hasDraggedRef.current = false;
    }, 100);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.pageX - rect.left;
    const walk = (x - startX) * 2;
    
    if (Math.abs(walk) > 5) {
      hasDraggedRef.current = true;
    }
    
    containerRef.current.scrollLeft = scrollLeft - walk;
  };

  const scroll = (direction: 'left' | 'right') => {
    if (containerRef.current) {
      const scrollAmount = 400;
      const newScrollLeft = containerRef.current.scrollLeft + (direction === 'right' ? scrollAmount : -scrollAmount);
      containerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth',
      });
    }
  };

  if (services.length === 0) {
    return (
      <div className="text-center py-12 text-white/70">
        No services available
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
          <div className="absolute right-0 top-0 bottom-0 w-40 bg-gradient-to-l from-emerald-900 via-emerald-900/70 to-transparent z-10 pointer-events-none" />
        )}

        {/* Left Fade Gradient */}
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-0 w-40 bg-gradient-to-r from-emerald-900 via-emerald-900/70 to-transparent z-10 pointer-events-none" />
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
            {services.map((service, index) => (
              <motion.div
                key={`desktop-${service.title}-${index}`}
                className="w-[380px] flex-shrink-0"
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: index * 0.1 }}
              >
                <motion.div
                  className="h-[600px] bg-black rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden cursor-pointer relative group border-2 border-emerald-500"
                  onClick={() => {
                    if (!hasDraggedRef.current) {
                      if (service.linkType === 'internal' && service.slug) {
                        navigate(`/services/${service.slug}`);
                      } else if (service.link) {
                        window.location.href = service.link;
                      }
                    }
                  }}
                  whileHover="hover"
                  initial="initial"
                >
                  {/* Large Image Background */}
                  {(service.thumbnail?.formats?.large?.url || service.thumbnail?.url) && (() => {
                    const thumbnailUrl = service.thumbnail?.formats?.large?.url || service.thumbnail?.url;
                    const fullThumbnailUrl = thumbnailUrl
                      ? (thumbnailUrl.startsWith('http') ? thumbnailUrl : `${STRAPI_URL}${thumbnailUrl}`)
                      : null;
                    
                    return fullThumbnailUrl ? (
                      <div className="absolute inset-0">
                        <img
                          src={fullThumbnailUrl}
                          alt={service.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        {/* Gradient overlay - becomes more transparent on hover */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/75 to-black/60 transition-opacity duration-500 group-hover:opacity-0"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/40 to-black/20 opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
                      </div>
                    ) : null;
                  })()}

                  {/* Content Overlay */}
                  <div className="relative h-full flex flex-col p-6">
                    {/* Bottom Section - Description Area with hover effect */}
                    <div className="mt-auto space-y-3">
                      {/* Title */}
                      <h3 className="font-serif font-bold text-3xl text-white line-clamp-2 min-h-[4rem] drop-shadow-lg">
                        {service.title}
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
                              maxHeight: '4.5rem',
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
                            className="text-gray-200 text-sm mb-3 line-clamp-3 group-hover:line-clamp-none"
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
                            {service.description}
                          </motion.p>
                        </motion.div>
                      </motion.div>

                      {/* Action Button */}
                      <div className="pt-2">
                        <motion.a
                          href={service.link || (service.slug ? `/services/${service.slug}` : '#')}
                          target={service.linkType === 'external' ? '_blank' : undefined}
                          rel={service.linkType === 'external' ? 'noopener noreferrer' : undefined}
                          onClick={(e) => {
                            e.stopPropagation();
                            if ((service.linkType === 'internal' || !service.link) && service.slug) {
                              e.preventDefault();
                              navigate(`/services/${service.slug}`);
                            }
                          }}
                          className="group relative inline-flex items-center justify-center w-full px-4 py-2 font-semibold text-white bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(251,146,60,0.6)] hover:scale-105 active:scale-95"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <span className="relative z-10">Learn More</span>
                          <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </motion.a>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll Progress Bar */}
      <motion.div
        className="h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 rounded-full mt-4 mx-4"
        style={{ scaleX: scrollXProgress, transformOrigin: 'left' }}
      />

      {/* Hint Text */}
      {services.length > 1 && (
        <div className="text-center mt-6">
          <p className="text-sm text-white/70">Click arrows or scroll horizontally</p>
        </div>
      )}
    </div>
  );
}

// Main Services Component
export function Services() {
  const [isMobile, setIsMobile] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const loadServices = async () => {
      setLoading(true);
      try {
        const response = await fetchAllServices();
        setServices(response.data);
      } catch (error) {
        console.error('Error loading services:', error);
      } finally {
        setLoading(false);
      }
    };

    loadServices();
  }, []);

  if (loading) {
    return (
      <section id="services" className="py-20 ">
        <div className="px-4">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
            <p className="text-white/70">Loading services...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="services" className="py-20 bg-neutral-900">
      <div className="px-4">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-serif font-bold text-4xl md:text-5xl text-white mb-4">
            Our Services
          </h2>
        </motion.div>

        {/* Responsive Services Display */}
        {isMobile ? (
          <MobileCardStack services={services} />
        ) : (
          <DesktopScrollContainer services={services} />
        )}
      </div>
    </section>
  );
}