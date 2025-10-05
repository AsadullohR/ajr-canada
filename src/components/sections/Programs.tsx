import React, { useState, useEffect } from 'react';
import { ChevronRight, Clock } from 'lucide-react';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

interface Program {
  name: string;
  time: string;
  description: string;
}

const SHEET_URL = `https://docs.google.com/spreadsheets/d/e/2PACX-${import.meta.env.VITE_SPREADSHEET_ID}/pub?output=csv`;

// Fallback data in case of API failure
const FALLBACK_PROGRAMS: Program[] = [
  {
    name: "Friday Prayer",
    time: "1:30 PM - 2:30 PM",
    description: "Weekly congregational prayer and khutbah focusing on relevant Islamic topics and community matters."
  },
  {
    name: "Weekend Islamic School",
    time: "Saturday 10:00 AM - 2:00 PM",
    description: "Comprehensive Islamic education for children including Quran, Islamic studies, and Arabic language."
  },
  {
    name: "Adult Quran Class",
    time: "Sunday 10:00 AM - 12:00 PM",
    description: "Quran recitation and tajweed classes for adults of all levels."
  },
  {
    name: "Sisters' Halaqa",
    time: "Wednesday 7:00 PM - 8:30 PM",
    description: "Weekly gathering for sisters to discuss Islamic topics and build community."
  }
];

export function Programs() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        if (!import.meta.env.VITE_SPREADSHEET_ID) {
          console.warn('Spreadsheet ID not found in environment variables, using fallback data');
          setPrograms(FALLBACK_PROGRAMS);
          setLoading(false);
          return;
        }

        const response = await fetch(SHEET_URL);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const csvData = await response.text();
        
        // Parse CSV data (skip header row)
        const rows = csvData.split('\n').slice(1);
        const parsedPrograms = rows
          .filter(row => row.trim()) // Skip empty rows
          .map(row => {
            const columns = row.split(',').map(cell =>
              cell.replace(/^"|"$/g, '') // Remove quotes
            );
            const [name = '', time = '', description = ''] = columns;
            return { name, time, description };
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
                <div key={index} className="px-3">
                  <div className="card p-6 h-full flex flex-col transform hover:scale-105 transition-transform duration-300">
                    <Clock className="w-8 h-8 text-emerald-600 mb-4" />
                    <h3 className="text-xl font-semibold mb-2 text-gray-900">{program.name}</h3>
                    <p className="text-emerald-600 font-medium mb-2">{program.time}</p>
                    <p className="text-gray-600 flex-grow">{program.description}</p>
                    <a href="#contact" className="mt-4 inline-flex items-center text-emerald-600 hover:text-emerald-700">
                      Learn more
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </a>
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
            className="btn btn-secondary text-lg px-12 py-4"
          >
            Support Our Programs - Donate Now
          </a>
        </div>
      </div>
    </section>
  );
}