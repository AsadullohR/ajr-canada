import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

interface Program {
  name: string;
  time: string;
  description: string;
  card_image?: string;
}

const SHEET_ID = import.meta.env.VITE_SPREADSHEET_ID;
const PROGRAMS_GID = import.meta.env.VITE_PROGRAMS_GID;
const SHEET_URL = SHEET_ID && PROGRAMS_GID ? `https://docs.google.com/spreadsheets/d/e/2PACX-${SHEET_ID}/pub?gid=${PROGRAMS_GID}&output=csv` : "";

// Fallback data in case of API failure
const FALLBACK_PROGRAMS: Program[] = [
  {
    name: "Friday Prayer",
    time: "1:30 PM - 2:30 PM",
    description: "Weekly congregational prayer and khutbah focusing on relevant Islamic topics and community matters.",
    card_image: "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=400&h=300&fit=crop"
  },
  {
    name: "Weekend Islamic School",
    time: "Saturday 10:00 AM - 2:00 PM",
    description: "Comprehensive Islamic education for children including Quran, Islamic studies, and Arabic language.",
    card_image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=300&fit=crop"
  },
  {
    name: "Adult Quran Class",
    time: "Sunday 10:00 AM - 12:00 PM",
    description: "Quran recitation and tajweed classes for adults of all levels.",
    card_image: "https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=400&h=300&fit=crop"
  },
  {
    name: "Sisters' Halaqa",
    time: "Wednesday 7:00 PM - 8:30 PM",
    description: "Weekly gathering for sisters to discuss Islamic topics and build community.",
    card_image: "https://images.unsplash.com/photo-1519682577862-22b62b24e493?w=400&h=300&fit=crop"
  }
];

export function Programs() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        if (!SHEET_ID || !PROGRAMS_GID) {
          console.warn('Spreadsheet ID or Programs GID not found in environment variables, using fallback data');
          setPrograms(FALLBACK_PROGRAMS);
          setLoading(false);
          return;
        }

        const response = await fetch(SHEET_URL);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const csvData = await response.text();

        console.log('Raw CSV Data:', csvData);

        // Parse CSV data (skip header row)
        const rows = csvData.split('\n').slice(1);
        const parsedPrograms = rows
          .filter(row => row.trim()) // Skip empty rows
          .map(row => {
            const columns = row.split(',').map(cell =>
              cell.replace(/^"|"$/g, '').trim() // Remove quotes and whitespace
            );
            console.log('Parsed columns:', columns);
            const [name = '', time = '', description = '', card_image = ''] = columns;

            // Convert Unsplash photo page URL to direct image URL
            let imageUrl = card_image ? card_image.trim() : '';
            if (imageUrl.includes('unsplash.com/photos/')) {
              // Extract photo ID from URL like: https://unsplash.com/photos/a-wooden-chess-board-with-chess-pieces-on-it-hayc4n2dI-k
              const photoId = imageUrl.split('/photos/')[1]?.split('?')[0]?.split('-').pop();
              if (photoId) {
                imageUrl = `https://images.unsplash.com/photo-${photoId}?w=400&h=300&fit=crop`;
              }
            } else if (imageUrl && !imageUrl.includes('?')) {
              // If it's already a direct image URL without params, add them
              imageUrl = `${imageUrl}?w=400&h=300&fit=crop`;
            }

            return { name, time, description, card_image: imageUrl || undefined };
          })
          .filter(program => program.name && program.time && program.description)

        if (parsedPrograms.length === 0) {
          throw new Error('No programs found in the spreadsheet');
        }

        setPrograms(parsedPrograms);
        setError(null);
      } catch (err) {
        console.error('Error fetching programs:', err.message || err);
        setError('Failed to load programs. Using fallback data.');
        setPrograms(FALLBACK_PROGRAMS);
      } finally {
        setLoading(false);
      }
    };

    fetchPrograms();
  }, []);

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    pauseOnHover: true,
    responsive: [
      {
        breakpoint: 1280,
        settings: {
          slidesToShow: 3,
        }
      },
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
        }
      },
      {
        breakpoint: 640,
        settings: {
          slidesToShow: 1,
        }
      }
    ]
  };

  return (
    <section id="programs" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="section-title mb-4">Our Programs</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover our diverse range of educational and community programs designed to nurture spiritual growth and Islamic learning.
          </p>
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
                setPrograms(FALLBACK_PROGRAMS);
                setLoading(false);
              }}
              className="mt-4 btn btn-primary"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="program-slider">
            <Slider {...sliderSettings}>
              {programs.map((program, index) => (
                <div key={index} className="px-3 py-4">
                  <div className="card overflow-hidden flex flex-col transform hover:scale-105 transition-transform duration-300" style={{ height: '370px' }}>
                    {program.card_image ? (
                      <div className="relative h-48 w-full overflow-hidden flex-shrink-0">
                        <img
                          src={program.card_image}
                          alt={program.name}
                          className="w-full h-full object-cover"
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
                  </div>
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
            Support Our Programs - Donate Now
          </a>
        </div>
      </div>
    </section>
  );
}