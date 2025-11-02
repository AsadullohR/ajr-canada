import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Bell } from 'lucide-react';
import { Event } from '../../types/event';
import { Announcement } from '../../types/announcement';
import { fetchAllEvents, fetchHomepageAnnouncements } from '../../services/strapi';

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

const getEventDateTime = (eventDate: string, eventTime: string) => {
  const [year, month, day] = eventDate.split('-').map(Number);
  const [hours, minutes] = eventTime.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes);
};

export function UpcomingEvents() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [eventsResponse, announcementsResponse] = await Promise.all([
          fetchAllEvents(),
          fetchHomepageAnnouncements()
        ]);
        console.log('Events loaded:', eventsResponse.data.length);
        console.log('Announcements loaded:', announcementsResponse.data.length);
        setEvents(eventsResponse.data);
        // Sort announcements by priority (high first), then by createdAt
        const sortedAnnouncements = [...announcementsResponse.data].sort((a, b) => {
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          const priorityDiff = (priorityOrder[a.priority as keyof typeof priorityOrder] || 1) - 
                               (priorityOrder[b.priority as keyof typeof priorityOrder] || 1);
          if (priorityDiff !== 0) return priorityDiff;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        setAnnouncements(sortedAnnouncements);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Separate and sort events
  const upcomingEvents = events.filter(event => isUpcoming(event.eventDate, event.eventTime))
    .sort((a, b) => {
      const dateA = getEventDateTime(a.eventDate, a.eventTime);
      const dateB = getEventDateTime(b.eventDate, b.eventTime);
      return dateA.getTime() - dateB.getTime();
    });

  const pastEvents = events.filter(event => !isUpcoming(event.eventDate, event.eventTime))
    .sort((a, b) => {
      const dateA = getEventDateTime(a.eventDate, a.eventTime);
      const dateB = getEventDateTime(b.eventDate, b.eventTime);
      return dateB.getTime() - dateA.getTime(); // Most recent first
    });

  // Select events to display: 2 future (muted), 1 active upcoming, 2 past
  let displayEvents: (Event & { isActive?: boolean; isMuted?: boolean; isPast?: boolean })[] = [];
  
  if (upcomingEvents.length > 0) {
    // At least 1 upcoming event exists
    const activeEvent = upcomingEvents[0]; // Next upcoming
    const futureMuted = upcomingEvents.slice(1, 3); // 2 far away future events
    const pastDisplay = pastEvents.slice(0, 2); // 2 past events

    displayEvents = [
      ...futureMuted.map(e => ({ ...e, isMuted: true })),
      { ...activeEvent, isActive: true },
      ...pastDisplay.map(e => ({ ...e, isPast: true }))
    ];
  } else {
    // No upcoming events
    displayEvents = pastEvents.slice(0, 2).map(e => ({ ...e, isPast: true }));
  }

  return (
    <section id="upcoming-events" className="py-20 bg-emerald-900">
      <div className="px-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mb-4"></div>
            <p className="text-white/70">Loading...</p>
          </div>
        ) : (
          <>
            {/* Section Header */}
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="font-serif font-bold text-4xl md:text-5xl text-white mb-4">
                Latest
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Left Side - Events */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h3 className="font-serif font-bold text-3xl md:text-4xl text-white mb-8">
                  Upcoming Events
                </h3>

              {upcomingEvents.length === 0 && (
                <div className="mb-6 p-4 bg-white/10 rounded-lg">
                  <p className="text-white/90 font-medium">No upcoming events at this time.</p>
                </div>
              )}

              <div className="space-y-4">
                {displayEvents.map((event, index) => {
                  const isActive = event.isActive;
                  const isMuted = event.isMuted;
                  const isPast = event.isPast;

                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => navigate(`/events/${event.slug}`)}
                      className={`
                        border-l-4 pl-4 py-3 cursor-pointer transition-all duration-200 rounded-r-lg
                        ${isActive 
                          ? 'border-emerald-400 bg-white/10 hover:bg-white/15' 
                          : isMuted 
                            ? 'border-white/30 bg-white/5 opacity-60 hover:opacity-80' 
                            : 'border-white/40 bg-white/5 opacity-75 hover:opacity-90'
                        }
                      `}
                    >
                      <h3 className={`
                        font-serif font-semibold mb-1 transition-colors
                        ${isActive ? 'text-white text-lg' : 'text-white/80 text-base'}
                      `}>
                        {event.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-white/70">
                        <div className="flex items-center gap-1.5">
                          <Calendar className={`w-4 h-4 ${isActive ? 'text-emerald-300' : 'text-white/50'}`} />
                          <span>{formatEventDate(event.eventDate, event.eventTime)}</span>
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className={`w-4 h-4 ${isActive ? 'text-emerald-300' : 'text-white/50'}`} />
                            <span>{event.location}</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-2">
                        {isActive ? (
                          <span className="inline-block px-2 py-1 text-xs font-semibold bg-emerald-600 text-white rounded">
                            Next Event
                          </span>
                        ) : isMuted ? (
                          <span className="inline-block px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded">
                            Future Event
                          </span>
                        ) : isPast ? (
                          <span className="inline-block px-2 py-1 text-xs font-semibold bg-gray-200 text-gray-700 rounded">
                            Past Event
                          </span>
                        ) : null}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div className="mt-6">
                <Link
                  to="/events"
                  className="inline-flex items-center gap-2 text-emerald-300 hover:text-emerald-200 font-semibold transition-colors duration-200 underline"
                >
                  See All Events
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </motion.div>

              {/* Right Side - Announcements (Desktop only) */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="hidden lg:block"
              >
                <h3 className="font-serif font-bold text-3xl md:text-4xl text-white mb-8 flex items-center gap-3">
                  <Bell className="w-8 h-8 text-emerald-300" />
                  Announcements
                </h3>

              {announcements.length === 0 ? (
                <div className="p-4 bg-white/10 rounded-lg">
                  <p className="text-white/90">No announcements at this time.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {announcements.map((announcement, index) => (
                    <motion.div
                      key={announcement.id}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => navigate(`/announcements/${announcement.slug}`)}
                      className="border-l-4 border-emerald-300 pl-4 py-3 cursor-pointer hover:bg-white/10 transition-all duration-200 bg-white/5 rounded-r-lg shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-serif font-semibold text-white text-lg flex-1">
                          {announcement.title}
                        </h3>
                        {announcement.priority === 'high' && (
                          <span className="px-2 py-1 text-xs font-semibold bg-red-500 text-white rounded whitespace-nowrap">
                            High Priority
                          </span>
                        )}
                      </div>
                      {announcement.description && (
                        <p className="text-white/70 text-sm line-clamp-2 mb-2">
                          {announcement.description}
                        </p>
                      )}
                      {announcement.category && (
                        <span className="inline-block px-2 py-1 text-xs font-medium bg-white/20 text-white rounded capitalize">
                          {announcement.category.replace('-', ' ')}
                        </span>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
              
              <div className="mt-6">
                <Link
                  to="/announcements"
                  className="inline-flex items-center gap-2 text-emerald-300 hover:text-emerald-200 font-semibold transition-colors duration-200 underline"
                >
                  See All Announcements
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
              </motion.div>

              {/* Announcements - Mobile (below events) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="lg:hidden mt-12"
              >
                <h3 className="font-serif font-bold text-3xl md:text-4xl text-white mb-8 flex items-center gap-3">
                  <Bell className="w-8 h-8 text-emerald-300" />
                  Announcements
                </h3>

              {announcements.length === 0 ? (
                <div className="p-4 bg-white/10 rounded-lg">
                  <p className="text-white/90">No announcements at this time.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {announcements.map((announcement, index) => (
                    <motion.div
                      key={announcement.id}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => navigate(`/announcements/${announcement.slug}`)}
                      className="border-l-4 border-emerald-300 pl-4 py-3 cursor-pointer hover:bg-white/10 transition-all duration-200 bg-white/5 rounded-r-lg shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-serif font-semibold text-white text-lg flex-1">
                          {announcement.title}
                        </h3>
                        {announcement.priority === 'high' && (
                          <span className="px-2 py-1 text-xs font-semibold bg-red-500 text-white rounded whitespace-nowrap">
                            High Priority
                          </span>
                        )}
                      </div>
                      {announcement.description && (
                        <p className="text-white/70 text-sm line-clamp-2 mb-2">
                          {announcement.description}
                        </p>
                      )}
                      {announcement.category && (
                        <span className="inline-block px-2 py-1 text-xs font-medium bg-white/20 text-white rounded capitalize">
                          {announcement.category.replace('-', ' ')}
                        </span>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
              
              <div className="mt-6">
                <Link
                  to="/announcements"
                  className="inline-flex items-center gap-2 text-emerald-300 hover:text-emerald-200 font-semibold transition-colors duration-200 underline"
                >
                  See All Announcements
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
              </motion.div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
