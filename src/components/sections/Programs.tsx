import React, { useState, useEffect } from 'react';
import { Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { Program } from '../../types/program';
import { fetchAllPrograms } from '../../services/strapi';

const STRAPI_URL = import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337';

interface ProgramCardData {
  name: string;
  slug: string;
  time: string;
  description: string;
  card_image?: string;
}

// Fallback data in case of API failure
const FALLBACK_PROGRAMS: ProgramCardData[] = [
  {
    name: "Friday Prayer",
    slug: "friday-prayer",
    time: "1:30 PM - 2:30 PM",
    description: "Weekly congregational prayer and khutbah focusing on relevant Islamic topics and community matters.",
    card_image: "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=400&h=300&fit=crop"
  },
  {
    name: "Weekend Islamic School",
    slug: "weekend-islamic-school",
    time: "Saturday 10:00 AM - 2:00 PM",
    description: "Comprehensive Islamic education for children including Quran, Islamic studies, and Arabic language.",
    card_image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=300&fit=crop"
  },
  {
    name: "Adult Quran Class",
    slug: "adult-quran-class",
    time: "Sunday 10:00 AM - 12:00 PM",
    description: "Quran recitation and tajweed classes for adults of all levels.",
    card_image: "https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=400&h=300&fit=crop"
  },
  {
    name: "Sisters' Halaqa",
    slug: "sisters-halaqa",
    time: "Wednesday 7:00 PM - 8:30 PM",
    description: "Weekly gathering for sisters to discuss Islamic topics and build community.",
    card_image: "https://images.unsplash.com/photo-1519682577862-22b62b24e493?w=400&h=300&fit=crop"
  }
];

// Simple arrow components
function NextArrow(props: any) {
  const { onClick } = props;
  return (
    <button
      onClick={onClick}
      className="absolute -right-2 md:-right-14 top-1/2 -translate-y-1/2 z-10 w-7 h-7 md:w-9 md:h-9 bg-black hover:bg-gray-800 rounded-full flex items-center justify-center transition-all shadow-md hover:scale-110"
      aria-label="Next"
    >
      <ChevronRight className="w-4 h-4 text-white" />
    </button>
  );
}

function PrevArrow(props: any) {
  const { onClick } = props;
  return (
    <button
      onClick={onClick}
      className="absolute -left-2 md:-left-14 top-1/2 -translate-y-1/2 z-10 w-7 h-7 md:w-9 md:h-9 bg-black hover:bg-gray-800 rounded-full flex items-center justify-center transition-all shadow-md hover:scale-110"
      aria-label="Previous"
    >
      <ChevronLeft className="w-4 h-4 text-white" />
    </button>
  );
}

// Helper function to convert Strapi Program to ProgramCardData
function convertProgramToCardData(program: Program): ProgramCardData {
  // Format time display
  let timeDisplay = program.timeDescription || '';

  if (!timeDisplay && program.eventTime) {
    // Convert HH:mm:ss to readable format
    const timeParts = program.eventTime.split(':');
    const hours = parseInt(timeParts[0]);
    const minutes = timeParts[1];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    timeDisplay = `${displayHours}:${minutes} ${ampm}`;

    // Add recurrence pattern
    if (program.recurrencePattern === 'weekly') {
      timeDisplay = `Weekly ${timeDisplay}`;
    } else if (program.recurrencePattern === 'daily') {
      timeDisplay = `Daily ${timeDisplay}`;
    } else if (program.recurrencePattern === 'monthly') {
      timeDisplay = `Monthly ${timeDisplay}`;
    }
  }

  // Get thumbnail URL
  let imageUrl = '';
  if (program.thumbnail) {
    const baseUrl = program.thumbnail.url.startsWith('http')
      ? program.thumbnail.url
      : `${STRAPI_URL}${program.thumbnail.url}`;

    // Use medium format if available, otherwise use original
    if (program.thumbnail.formats?.medium) {
      imageUrl = program.thumbnail.formats.medium.url.startsWith('http')
        ? program.thumbnail.formats.medium.url
        : `${STRAPI_URL}${program.thumbnail.formats.medium.url}`;
    } else {
      imageUrl = baseUrl;
    }
  }

  return {
    name: program.title,
    slug: program.slug,
    time: timeDisplay,
    description: program.description,
    card_image: imageUrl || undefined,
  };
}

export function Programs() {
  const navigate = useNavigate();
  const [programs, setPrograms] = useState<ProgramCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPrograms = async () => {
      try {
        const response = await fetchAllPrograms();

        if (response.data.length === 0) {
          throw new Error('No programs found in Strapi');
        }

        // Convert Strapi programs to card data format
        const programCards = response.data.map(convertProgramToCardData);

        setPrograms(programCards);
        setError(null);
      } catch (err) {
        console.error('Error fetching programs:', err);
        setError('Failed to load programs from Strapi. Using fallback data.');
        setPrograms(FALLBACK_PROGRAMS);
      } finally {
        setLoading(false);
      }
    };

    loadPrograms();
  }, []);

  const sliderSettings = {
    dots: true,
    infinite: programs.length > 4,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 2000,
    pauseOnHover: true,
    cssEase: "linear",
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    responsive: [
      {
        breakpoint: 1280,
        settings: {
          slidesToShow: 3,
          infinite: programs.length > 3,
        }
      },
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
          infinite: programs.length > 2,
        }
      },
      {
        breakpoint: 640,
        settings: {
          slidesToShow: 1,
          infinite: programs.length > 1,
        }
      }
    ]
  };

  return (
    <section id="programs" className="py-24 bg-gray-50">
      <div className="px-4 md:px-8 lg:px-12 xl:px-16">
        <div className="mb-16">
          <h2 className="text-4xl font-serif font-semibold text-gray-900 md:text-5xl mb-8 text-center">
            Our Programs
          </h2>
        </div>
        
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-emerald-200 border-t-emerald-500"></div>
          </div>
        ) : error ? (
          <div className="text-center">
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                // Retry loading programs from Strapi
                fetchAllPrograms()
                  .then(response => {
                    if (response.data.length === 0) {
                      throw new Error('No programs found');
                    }
                    const programCards = response.data.map(convertProgramToCardData);
                    setPrograms(programCards);
                    setError(null);
                  })
                  .catch(err => {
                    console.error('Error retrying:', err);
                    setError('Failed to load programs. Using fallback data.');
                    setPrograms(FALLBACK_PROGRAMS);
                  })
                  .finally(() => {
                    setLoading(false);
                  });
              }}
              className="mt-4 btn btn-primary"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="relative px-6 md:px-10">
            <Slider {...sliderSettings}>
              {programs.map((program, index) => (
                <div key={index} className="px-3 py-4">
                  <motion.div
                    className="card overflow-hidden flex flex-col h-[370px] md:h-[450px] lg:h-[500px] cursor-pointer"
                    whileHover={{ scale: 1.03, y: -3 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    onClick={() => navigate(`/programs/${program.slug}`)}
                  >
                    {program.card_image ? (
                      <div className="relative h-48 md:h-56 lg:h-64 w-full overflow-hidden flex-shrink-0">
                        <motion.img
                          src={program.card_image}
                          alt={program.name}
                          className="w-full h-full object-cover"
                          whileHover={{ scale: 1.08 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement?.classList.add('hidden');
                          }}
                        />
                        <div className="absolute inset-0 bg-black/20"></div>
                      </div>
                    ) : (
                      <div className="p-6 pb-0 flex-shrink-0">
                        <Clock className="w-8 h-8 text-emerald-600 mb-4" />
                      </div>
                    )}
                    <div className="p-6 flex flex-col flex-grow">
                      <h3 className="text-xl font-semibold mb-2 text-gray-900">{program.name}</h3>
                      <p className="text-emerald-600 font-medium mb-2">{program.time}</p>
                      <p className="text-gray-600 flex-grow">{program.description}</p>
                    </div>
                  </motion.div>
                </div>
              ))}
            </Slider>
          </div>
        )}

        {/* Donate Button */}
        <div className="text-center mt-12">
          <a
            href="https://app.irm.io/ajrcanada.com"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary text-lg px-12 py-4 mt-5"
          >
            Support Our Programs
          </a>
        </div>
      </div>
    </section>
  );
}
