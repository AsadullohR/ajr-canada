import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Bell } from 'lucide-react';
import { Event } from '../../types/event';
import { Announcement } from '../../types/announcement';
import { fetchAllEvents, fetchHomepageAnnouncements } from '../../services/strapi';

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

const formatAnnouncementDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  return date.toLocaleDateString('en-US', options);
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

                  // Get thumbnail URL
                  const thumbnailUrl = event.thumbnail?.formats?.large?.url || event.thumbnail?.url;
                  const fullThumbnailUrl = thumbnailUrl
                    ? (thumbnailUrl.startsWith('http') ? thumbnailUrl : `${STRAPI_URL}${thumbnailUrl}`)
                    : null;

                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      className="h-[280px]"
                    >
                      <motion.div
                        onClick={() => navigate(`/events/${event.slug}`)}
                        className={`
                          h-full bg-black rounded-2xl shadow-2xl overflow-hidden cursor-pointer relative border-2
                          transition-all duration-300 hover:shadow-[0_0_40px_rgba(16,185,129,0.4)]
                          ${isActive 
                            ? 'border-emerald-500 hover:border-emerald-400' 
                            : isMuted 
                              ? 'border-white/30 opacity-60 hover:opacity-80' 
                              : 'border-white/40 opacity-75 hover:opacity-90'
                          }
                        `}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {/* Large Image Background */}
                        {fullThumbnailUrl && (
                          <div className="absolute inset-0">
                            <img
                              src={fullThumbnailUrl}
                              alt={event.title}
                              className="w-full h-full object-cover"
                            />
                            {/* Gradient overlay from top (transparent) to bottom (darker) */}
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black/70"></div>
                          </div>
                        )}

                        {/* Content Overlay */}
                        <div className="relative h-full flex flex-col p-4">
                          {/* Bottom Section - Description Area */}
                          <div className="mt-auto space-y-2">
                            {/* Title */}
                            <h3 className="font-serif font-bold text-xl text-white line-clamp-2 drop-shadow-lg">
                              {event.title}
                            </h3>
                            
                            {/* Description with backdrop blur */}
                            <div className="bg-black/30 backdrop-blur-md rounded-lg p-2 border border-white/10">
                              {event.description && (
                                <p className="text-gray-200 text-xs line-clamp-2 mb-2">
                                  {event.description}
                                </p>
                              )}
                              {/* Date */}
                              <div className="flex items-center gap-1 text-xs text-gray-200">
                                <Calendar className="w-3 h-3 text-emerald-300" />
                                <span>{formatEventDate(event.eventDate, event.eventTime)}</span>
                              </div>
                            </div>

                            {/* Action Button */}
                            <div className="pt-1">
                              <motion.button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/events/${event.slug}`);
                                }}
                                className="group relative inline-flex items-center justify-center w-full px-3 py-1.5 text-sm font-semibold text-white bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(251,146,60,0.6)] hover:scale-105 active:scale-95"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <span className="relative z-10">Learn More</span>
                                <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                              </motion.button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
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
                  {announcements.map((announcement, index) => {
                    // Get thumbnail URL
                    const thumbnailUrl = announcement.thumbnail?.formats?.large?.url || announcement.thumbnail?.url;
                    const fullThumbnailUrl = thumbnailUrl
                      ? (thumbnailUrl.startsWith('http') ? thumbnailUrl : `${STRAPI_URL}${thumbnailUrl}`)
                      : null;

                    return (
                      <motion.div
                        key={announcement.id}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                        className="h-[280px]"
                      >
                        <motion.div
                          onClick={() => navigate(`/announcements/${announcement.slug}`)}
                          className="h-full bg-black rounded-2xl shadow-2xl overflow-hidden cursor-pointer relative border-2 border-emerald-500 transition-all duration-300 hover:shadow-[0_0_40px_rgba(16,185,129,0.4)] hover:border-emerald-400"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {/* Large Image Background */}
                          {fullThumbnailUrl && (
                            <div className="absolute inset-0">
                              <img
                                src={fullThumbnailUrl}
                                alt={announcement.title}
                                className="w-full h-full object-cover"
                              />
                              {/* Gradient overlay from top (transparent) to bottom (darker) */}
                              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black/70"></div>
                            </div>
                          )}

                          {/* Content Overlay */}
                          <div className="relative h-full flex flex-col p-4">
                            {/* Bottom Section - Description Area */}
                            <div className="mt-auto space-y-2">
                              {/* Title */}
                              <h3 className="font-serif font-bold text-xl text-white line-clamp-2 drop-shadow-lg">
                                {announcement.title}
                              </h3>
                              
                              {/* Description with backdrop blur */}
                              <div className="bg-black/30 backdrop-blur-md rounded-lg p-2 border border-white/10">
                                {announcement.description && (
                                  <p className="text-gray-200 text-xs line-clamp-2 mb-2">
                                    {announcement.description}
                                  </p>
                                )}
                                {/* Date */}
                                <div className="flex items-center gap-1 text-xs text-gray-200">
                                  <Calendar className="w-3 h-3 text-emerald-300" />
                                  <span>{formatAnnouncementDate(announcement.publishDate || announcement.createdAt)}</span>
                                </div>
                              </div>

                              {/* Action Button */}
                              <div className="pt-1">
                                <motion.button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/announcements/${announcement.slug}`);
                                  }}
                                  className="group relative inline-flex items-center justify-center w-full px-3 py-1.5 text-sm font-semibold text-white bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(251,146,60,0.6)] hover:scale-105 active:scale-95"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <span className="relative z-10">Learn More</span>
                                  <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                </motion.button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      </motion.div>
                    );
                  })}
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
                  {announcements.map((announcement, index) => {
                    // Get thumbnail URL
                    const thumbnailUrl = announcement.thumbnail?.formats?.large?.url || announcement.thumbnail?.url;
                    const fullThumbnailUrl = thumbnailUrl
                      ? (thumbnailUrl.startsWith('http') ? thumbnailUrl : `${STRAPI_URL}${thumbnailUrl}`)
                      : null;

                    return (
                      <motion.div
                        key={announcement.id}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                        className="h-[280px]"
                      >
                        <motion.div
                          onClick={() => navigate(`/announcements/${announcement.slug}`)}
                          className="h-full bg-black rounded-2xl shadow-2xl overflow-hidden cursor-pointer relative border-2 border-emerald-500 transition-all duration-300 hover:shadow-[0_0_40px_rgba(16,185,129,0.4)] hover:border-emerald-400"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {/* Large Image Background */}
                          {fullThumbnailUrl && (
                            <div className="absolute inset-0">
                              <img
                                src={fullThumbnailUrl}
                                alt={announcement.title}
                                className="w-full h-full object-cover"
                              />
                              {/* Gradient overlay from top (transparent) to bottom (darker) */}
                              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black/70"></div>
                            </div>
                          )}

                          {/* Content Overlay */}
                          <div className="relative h-full flex flex-col p-4">
                            {/* Bottom Section - Description Area */}
                            <div className="mt-auto space-y-2">
                              {/* Title */}
                              <h3 className="font-serif font-bold text-xl text-white line-clamp-2 drop-shadow-lg">
                                {announcement.title}
                              </h3>
                              
                              {/* Description with backdrop blur */}
                              <div className="bg-black/30 backdrop-blur-md rounded-lg p-2 border border-white/10">
                                {announcement.description && (
                                  <p className="text-gray-200 text-xs line-clamp-2 mb-2">
                                    {announcement.description}
                                  </p>
                                )}
                                {/* Date */}
                                <div className="flex items-center gap-1 text-xs text-gray-200">
                                  <Calendar className="w-3 h-3 text-emerald-300" />
                                  <span>{formatAnnouncementDate(announcement.publishDate || announcement.createdAt)}</span>
                                </div>
                              </div>

                              {/* Action Button */}
                              <div className="pt-1">
                                <motion.button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/announcements/${announcement.slug}`);
                                  }}
                                  className="group relative inline-flex items-center justify-center w-full px-3 py-1.5 text-sm font-semibold text-white bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(251,146,60,0.6)] hover:scale-105 active:scale-95"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <span className="relative z-10">Learn More</span>
                                  <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                </motion.button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      </motion.div>
                    );
                  })}
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
