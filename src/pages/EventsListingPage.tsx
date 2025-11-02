import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, MapPin } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { fetchAllEvents } from '../services/strapi';
import { Event } from '../types/event';

const STRAPI_URL = import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337';

const formatEventDate = (dateStr: string, timeStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };

  const [hours, minutes] = timeStr.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  const formattedTime = `${hour12}:${minutes} ${ampm}`;

  return `${date.toLocaleDateString('en-US', options)} • ${formattedTime}`;
};

const isUpcoming = (eventDate: string, eventTime: string) => {
  const [year, month, day] = eventDate.split('-').map(Number);
  const [hours, minutes] = eventTime.split(':').map(Number);
  const eventDateTime = new Date(year, month - 1, day, hours, minutes);
  return eventDateTime >= new Date();
};

export function EventsListingPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true);
      const response = await fetchAllEvents();
      // Events are already sorted by eventDate:asc from the API
      setEvents(response.data);
      setLoading(false);
    };

    loadEvents();
  }, []);

  // Separate upcoming and past events
  const upcomingEvents = events.filter(event => isUpcoming(event.eventDate, event.eventTime));
  const pastEvents = events.filter(event => !isUpcoming(event.eventDate, event.eventTime));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mb-4"></div>
          <p className="text-gray-600">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar isScrolled={isScrolled} activeSection="" />

      <main className="pb-16">
        {/* Hero Section */}
        <div className="relative w-full h-[300px] overflow-hidden bg-gray-950">
          <img
            src="/images/pattern_background.jpg"
            alt="Pattern Background"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-950/80 via-gray-900/75 to-gray-950/80"></div>
          
          <div className="relative h-full flex flex-col justify-center items-center px-4">
            <h1 className="font-serif font-bold text-4xl md:text-5xl text-white text-center mb-4">
              All Events
            </h1>
            <p className="text-white/90 text-lg text-center max-w-2xl">
              Past and upcoming community events
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 xl:px-16 py-12">
          {/* Upcoming Events */}
          {upcomingEvents.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-16"
            >
              <h2 className="font-serif font-bold text-3xl text-gray-900 mb-8">Upcoming Events</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingEvents.map((event, index) => {
                  const thumbnailUrl = event.thumbnail?.formats?.medium?.url || event.thumbnail?.url;
                  const fullThumbnailUrl = thumbnailUrl
                    ? (thumbnailUrl.startsWith('http') ? thumbnailUrl : `${STRAPI_URL}${thumbnailUrl}`)
                    : null;

                  return (
                    <motion.div
                      key={event.id}
                      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer group"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => navigate(`/events/${event.slug}`)}
                    >
                      {fullThumbnailUrl && (
                        <div className="relative h-48 overflow-hidden">
                          <img
                            src={fullThumbnailUrl}
                            alt={event.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                        </div>
                      )}

                      <div className="p-6">
                        <h3 className="font-serif font-bold text-xl text-gray-900 mb-3 line-clamp-2 group-hover:text-emerald-600 transition-colors">
                          {event.title}
                        </h3>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-start gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                            <span>{formatEventDate(event.eventDate, event.eventTime)}</span>
                          </div>

                          {event.location && (
                            <div className="flex items-start gap-2 text-sm text-gray-600">
                              <MapPin className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                              <span className="line-clamp-1">{event.location}</span>
                            </div>
                          )}
                        </div>

                        {event.description && (
                          <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                            {event.description}
                          </p>
                        )}

                        <div className="pt-4 border-t border-gray-200">
                          <span className="text-emerald-600 font-medium text-sm group-hover:text-emerald-700 transition-colors">
                            Learn More →
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.section>
          )}

          {/* Past Events */}
          {pastEvents.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h2 className="font-serif font-bold text-3xl text-gray-900 mb-8">Past Events</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pastEvents.map((event, index) => {
                  const thumbnailUrl = event.thumbnail?.formats?.medium?.url || event.thumbnail?.url;
                  const fullThumbnailUrl = thumbnailUrl
                    ? (thumbnailUrl.startsWith('http') ? thumbnailUrl : `${STRAPI_URL}${thumbnailUrl}`)
                    : null;

                  return (
                    <motion.div
                      key={event.id}
                      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer group opacity-80 hover:opacity-100"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 0.8, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => navigate(`/events/${event.slug}`)}
                    >
                      {fullThumbnailUrl && (
                        <div className="relative h-48 overflow-hidden">
                          <img
                            src={fullThumbnailUrl}
                            alt={event.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                        </div>
                      )}

                      <div className="p-6">
                        <h3 className="font-serif font-bold text-xl text-gray-900 mb-3 line-clamp-2 group-hover:text-emerald-600 transition-colors">
                          {event.title}
                        </h3>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-start gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <span>{formatEventDate(event.eventDate, event.eventTime)}</span>
                          </div>

                          {event.location && (
                            <div className="flex items-start gap-2 text-sm text-gray-600">
                              <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                              <span className="line-clamp-1">{event.location}</span>
                            </div>
                          )}
                        </div>

                        {event.description && (
                          <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                            {event.description}
                          </p>
                        )}

                        <div className="pt-4 border-t border-gray-200">
                          <span className="text-emerald-600 font-medium text-sm group-hover:text-emerald-700 transition-colors">
                            View Details →
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.section>
          )}

          {events.length === 0 && (
            <div className="text-center py-16">
              <p className="text-gray-600 text-lg">No events found.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

