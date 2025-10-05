import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, ChevronDown } from 'lucide-react';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

interface Poster {
  title: string;
  description: string;
  imageUrl: string;
  link?: string;
  startDate: string;
  endDate: string;
  priority: number;
  active: boolean;
}

export function Hero() {
  const [posters, setPosters] = useState<Poster[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosters = async () => {
      try {
        if (!import.meta.env.VITE_POSTER_SPREADSHEET_ID) {
          console.warn('Poster spreadsheet ID not found in environment variables, using fallback content');
          setPosters([]);
          setLoading(false);
          return;
        }

        const SHEET_URL = `https://docs.google.com/spreadsheets/d/e/2PACX-${import.meta.env.VITE_POSTER_SPREADSHEET_ID}/pub?output=csv`;
        
        const response = await fetch(SHEET_URL);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const csvData = await response.text();
        const rows = csvData.split('\n').slice(1); // Skip header row
        
        const currentDate = new Date();
        const parsedPosters = rows
          .filter(row => row.trim()) // Skip empty rows
          .map(row => {
            const columns = row.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''));
            const [title = '', description = '', imageUrl = '', link = '', startDate = '', endDate = '', priority = '0', active = 'false'] = columns;
            return {
              title,
              description,
              imageUrl,
              link,
              startDate,
              endDate,
              priority: parseInt(priority) || 0,
              active: active.toLowerCase() === 'true'
            };
          })
          .filter(poster => {
            if (!poster.title || !poster.imageUrl) return false;
            const start = new Date(poster.startDate);
            const end = new Date(poster.endDate);
            return poster.active && 
                   !isNaN(start.getTime()) && 
                   !isNaN(end.getTime()) && 
                   currentDate >= start && 
                   currentDate <= end;
          })
          .sort((a, b) => b.priority - a.priority); // Sort by priority in descending order

        setPosters(parsedPosters);
      } catch (error) {
        console.error('Error fetching posters:', error.message || error);
        // Set empty array to show fallback content
        setPosters([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPosters();
  }, []);

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    pauseOnHover: true,
    arrows: true,
    prevArrow: <ChevronLeft className="text-white w-8 h-8" />,
    nextArrow: <ChevronRight className="text-white w-8 h-8" />,
  };

  return (
    <section id="home" className="relative h-[90vh] md:h-screen">
      {posters.length > 0 ? (
        <div className="absolute inset-0">
          <Slider {...sliderSettings} className="h-full">
            {posters.map((poster, index) => (
              <div key={index} className="relative h-[90vh] md:h-screen">
                <img
                  src={poster.imageUrl}
                  alt={poster.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/95 via-emerald-900/90 to-emerald-950/95"></div>
                <div className="absolute inset-0 islamic-pattern opacity-30"></div>
                <div className="absolute inset-0 flex items-center">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-3xl animate-fade-in space-y-6 md:space-y-8">
                      <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-serif font-semibold tracking-tight text-white">
                        {poster.title}
                      </h1>
                      <p className="text-lg md:text-xl text-emerald-50 max-w-2xl leading-relaxed">
                        {poster.description}
                      </p>
                      {poster.link && (
                        <a 
                          href={poster.link}
                          className="btn btn-primary group inline-flex items-center"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Learn More
                          <ChevronRight className="ml-2 h-5 w-5 transform transition-transform group-hover:translate-x-1" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </Slider>
        </div>
      ) : (
        <>
          <div className="absolute inset-0">
            <img
              className="w-full h-full object-cover"
              src="https://images.unsplash.com/photo-1542324216541-c84c8ba6db04?auto=format&fit=crop&q=80&w=3000"
              alt="Beautiful Islamic architecture with Arabic calligraphy"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/95 via-emerald-900/90 to-emerald-950/95"></div>
            <div className="absolute inset-0 islamic-pattern opacity-30"></div>
          </div>
          <div className="relative h-full flex items-center">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-3xl animate-fade-in space-y-6 md:space-y-8">
                <div className="space-y-4 md:space-y-6">
                  <div className="inline-block">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-serif font-semibold tracking-tight text-white">
                      Welcome to<br />
                      <span className="text-emerald-400 relative">
                        Al-Bukhari Community Centre
                        <svg className="absolute -bottom-4 left-0 w-full" viewBox="0 0 200 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M1 5.5C47.6667 2.16667 154.4 -2.4 199 6" stroke="#059669" strokeWidth="2"/>
                        </svg>
                      </span>
                    </h1>
                  </div>
                  <p className="text-lg md:text-xl text-emerald-50 max-w-2xl leading-relaxed">
                    Serving the Muslim community with faith, education, and compassion. Join us in building a stronger, more connected ummah.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                  <a 
                    href="#prayer-times" 
                    className="btn btn-primary group"
                  >
                    Prayer Times
                    <ChevronRight className="ml-2 h-5 w-5 transform transition-transform group-hover:translate-x-1" />
                  </a>
                  <a 
                    href="#programs" 
                    className="btn btn-secondary group"
                  >
                    Our Programs
                    <ChevronRight className="ml-2 h-5 w-5 transform transition-transform group-hover:translate-x-1" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      <div className="absolute bottom-0 left-0 right-0">
        <div className="relative">
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent"></div>
          <svg className="w-full h-24 text-white" viewBox="0 0 1440 96" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 96L60 85.3C120 75 240 53 360 48C480 43 600 53 720 58.7C840 64 960 64 1080 61.3C1200 59 1320 53 1380 50.7L1440 48V0H1380C1320 0 1200 0 1080 0C960 0 840 0 720 0C600 0 480 0 360 0C240 0 120 0 60 0H0V96Z" fill="currentColor"/>
          </svg>
        </div>
      </div>
      <a 
        href="#prayer-times" 
        className="absolute bottom-28 left-1/2 transform -translate-x-1/2 text-white animate-bounce"
        aria-label="Scroll down"
      >
        <ChevronDown className="w-8 h-8" />
      </a>
    </section>
  );
}