import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { Event } from '../../types/event';
import { Announcement } from '../../types/announcement';
import { Program } from '../../types/program';
import { fetchAllEvents, fetchHomepageAnnouncements, fetchAllPrograms } from '../../services/strapi';

const getEventDateParts = (dateStr: string, timeStr: string) => {
  const [, month, day] = dateStr.split('-').map(Number);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dayOfMonth = day;
  const monthName = monthNames[month - 1];

  const [hours, minutes] = timeStr.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  const formattedTime = `${hour12}:${minutes}`;

  return { monthName, dayOfMonth, time: formattedTime, ampm };
};

const getAnnouncementDateParts = (dateStr: string) => {
  const date = new Date(dateStr);
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dayOfMonth = date.getDate();
  const monthName = monthNames[date.getMonth()];
  return { monthName, dayOfMonth };
};

const getEventDateTime = (eventDate: string, eventTime: string) => {
  const [year, month, day] = eventDate.split('-').map(Number);
  const [hours, minutes] = eventTime.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes);
};

// Calculate next occurrence for recurring programs
const getNextOccurrence = (program: Program): Date | null => {
  if (!program.eventTime) return null;
  
  const now = new Date();
  const [hours, minutes] = program.eventTime.split(':').map(Number);
  
  // Helper to create date with time
  const setTime = (date: Date) => {
    date.setHours(hours, minutes, 0, 0);
    return date;
  };
  
  switch (program.recurrencePattern) {
    case 'daily': {
      const next = setTime(new Date(now));
      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }
      return next;
    }
    
    case 'weekly': {
      if (!program.recurrenceDaysOfWeek || program.recurrenceDaysOfWeek.length === 0) {
        return null;
      }
      
      // Convert day names to numbers if needed
      const dayNumbers = program.recurrenceDaysOfWeek.map(day => {
        if (typeof day === 'number') return day;
        const dayMap: { [key: string]: number } = {
          'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
          'thursday': 4, 'friday': 5, 'saturday': 6
        };
        return dayMap[day.toLowerCase()] ?? 0;
      });
      
      // Find next occurrence
      for (let i = 0; i < 7; i++) {
        const checkDate = new Date(now);
        checkDate.setDate(checkDate.getDate() + i);
        if (dayNumbers.includes(checkDate.getDay())) {
          const next = setTime(checkDate);
          if (next > now) {
            return next;
          }
        }
      }
      return null;
    }
    
    case 'monthly': {
      const next = setTime(new Date(now));
      if (next <= now) {
        next.setMonth(next.getMonth() + 1);
      }
      return next;
    }
    
    case 'yearly': {
      const next = setTime(new Date(now));
      if (next <= now) {
        next.setFullYear(next.getFullYear() + 1);
      }
      return next;
    }
    
    default:
      return null;
  }
};

// Unified display item type
type DisplayItem = {
  id: number;
  type: 'event' | 'program';
  title: string;
  slug: string;
  location?: string;
  dateTime: Date;
  originalData: Event | Program;
};

export function UpcomingEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [eventsResponse, programsResponse, announcementsResponse] = await Promise.all([
          fetchAllEvents(),
          fetchAllPrograms(),
          fetchHomepageAnnouncements()
        ]);
        console.log('Events loaded:', eventsResponse.data.length);
        console.log('Programs loaded:', programsResponse.data.length);
        console.log('Announcements loaded:', announcementsResponse.data.length);
        setEvents(eventsResponse.data);
        setPrograms(programsResponse.data);
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

  // Combine events and programs into unified display items
  const now = new Date();
  
  // Convert events to display items
  const eventItems: DisplayItem[] = events.map(event => ({
    id: event.id,
    type: 'event' as const,
    title: event.title,
    slug: event.slug,
    location: event.location,
    dateTime: getEventDateTime(event.eventDate, event.eventTime),
    originalData: event,
  }));
  
  // Convert programs to display items (with next occurrence)
  const programItems: DisplayItem[] = programs
    .map(program => {
      const nextOccurrence = getNextOccurrence(program);
      if (!nextOccurrence) return null;
      
      return {
        id: program.id,
        type: 'program' as const,
        title: program.title,
        slug: program.slug,
        location: program.address,
        dateTime: nextOccurrence,
        originalData: program,
      };
    })
    .filter(item => item !== null) as DisplayItem[];
  
  // Combine all items
  const allItems = [...eventItems, ...programItems];
  
  // Separate upcoming and past items
  const upcomingItems = allItems
    .filter(item => item.dateTime >= now)
    .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
    
  const pastItems = allItems
    .filter(item => item.dateTime < now)
    .sort((a, b) => b.dateTime.getTime() - a.dateTime.getTime());
  
  // Select 3 items to display: 1 future, 1 next upcoming, 1 just passed
  let displayItems: DisplayItem[] = [];
  let nextUpcomingKey: string | null = null;
  let futureItemKey: string | null = null;
  let pastItemKey: string | null = null;
  
  if (upcomingItems.length > 0) {
    // Get the next upcoming item (soonest)
    const nextUpcoming = upcomingItems[0];
    nextUpcomingKey = `${nextUpcoming.type}-${nextUpcoming.id}`;
    
    // Get one future item (not the immediate next one)
    const futureItem = upcomingItems.length > 1 ? upcomingItems[1] : null;
    if (futureItem) {
      futureItemKey = `${futureItem.type}-${futureItem.id}`;
    }
    
    // Get the most recent past item
    const recentPast = pastItems.length > 0 ? pastItems[0] : null;
    if (recentPast) {
      pastItemKey = `${recentPast.type}-${recentPast.id}`;
    }
    
    // Build array: future item, next upcoming, past item
    displayItems = [
      ...(futureItem ? [futureItem] : []),
      nextUpcoming,
      ...(recentPast ? [recentPast] : [])
    ];
  } else {
    // No upcoming items, just show recent past items
    displayItems = pastItems.slice(0, 3);
    // Mark all as past
    if (displayItems.length > 0) {
      pastItemKey = `${displayItems[0].type}-${displayItems[0].id}`;
    }
  }

  return (
    <section id="upcoming-events" className="relative py-20 bg-gray-900 overflow-hidden">
      {/* Emerald glow in the middle */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] rounded-full bg-emerald-500/20 blur-3xl"></div>
      </div>

      <div className="relative px-4">
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
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="font-serif font-bold text-4xl md:text-5xl text-white mb-4">
                <span className="flex flex-col md:flex-row md:items-center gap-3 md:gap-3 items-center justify-center">
                  <span>What's Happening at</span>
                  <img
                    src="/images/Ajr Islamic Foundation Logo PNG.png"
                    alt="AJR Logo"
                    className="h-16"
                  />
                </span>
              </h2>
            </motion.div>

            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Events Container */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.6 }}
                className="bg-white rounded-lg shadow-lg p-6 border-2 border-emerald-500"
                style={{ boxShadow: '0 0 30px rgba(16, 185, 129, 0.3)' }}
              >
                <h3 className="font-serif font-bold text-2xl text-gray-900 mb-6">
                  Upcoming Events & Programs
                </h3>

              {upcomingItems.length === 0 ? (
                <p className="text-gray-500">No upcoming events or programs at this time.</p>
              ) : (
                <div className="space-y-4">
                  {displayItems.map((item, index) => {
                    const itemKey = `${item.type}-${item.id}`;
                    const isNext = itemKey === nextUpcomingKey;
                    const isFuture = itemKey === futureItemKey;
                    const isPast = itemKey === pastItemKey;
                    
                    // Get date parts based on item type
                    let dateParts;
                    if (item.type === 'event') {
                      const event = item.originalData as Event;
                      dateParts = getEventDateParts(event.eventDate, event.eventTime);
                    } else {
                      // For programs, use the calculated next occurrence
                      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                      const date = item.dateTime;
                      const monthName = monthNames[date.getMonth()];
                      const dayOfMonth = date.getDate();
                      const hours = date.getHours();
                      const minutes = date.getMinutes();
                      const ampm = hours >= 12 ? 'PM' : 'AM';
                      const hour12 = hours % 12 || 12;
                      const formattedTime = `${hour12}:${minutes.toString().padStart(2, '0')}`;
                      dateParts = { monthName, dayOfMonth, time: formattedTime, ampm };
                    }

                    return (
                      <motion.div
                        key={itemKey}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.5 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Link
                          to={`/${item.type === 'event' ? 'events' : 'programs'}/${item.slug}`}
                          className={`block p-4 hover:bg-gray-50 rounded-lg border-2 transition-all group relative shadow-sm ${
                            isNext
                              ? 'bg-gradient-to-br from-secondary-50 to-secondary-100 border-secondary-500 shadow-lg ring-2 ring-secondary-400/50'
                              : (isPast || isFuture)
                              ? 'bg-gray-50 border-gray-300 opacity-75'
                              : 'border-emerald-500'
                          }`}
                        >
                          {isNext && (
                            <div className="absolute -top-2 -right-2 bg-secondary-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                              Next
                            </div>
                          )}
                          {isFuture && (
                            <div className="absolute -top-2 -right-2 bg-gray-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                              Future
                            </div>
                          )}
                          {isPast && (
                            <div className="absolute -top-2 -right-2 bg-gray-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                              Past
                            </div>
                          )}
                          <div className="flex items-start gap-4">
                            {/* Left side - Item details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className={`font-semibold ${
                                  isNext
                                    ? 'text-secondary-900 group-hover:text-secondary-700'
                                    : (isPast || isFuture)
                                    ? 'text-gray-600 group-hover:text-gray-700'
                                    : 'text-gray-900 group-hover:text-emerald-600'
                                }`}>
                                  {item.title}
                                </h4>
                                {item.type === 'program' && (
                                  <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                                    isNext
                                      ? 'bg-secondary-200 text-secondary-900'
                                      : 'bg-blue-100 text-blue-900'
                                  }`}>
                                    Program
                                  </span>
                                )}
                              </div>
                              {item.location && (
                                <div className={`flex items-center gap-1 text-xs ${
                                  isNext
                                    ? 'text-secondary-600'
                                    : (isPast || isFuture)
                                    ? 'text-gray-400'
                                    : 'text-gray-500'
                                }`}>
                                  <MapPin className="w-3 h-3" />
                                  <span>{item.location}</span>
                                </div>
                              )}
                            </div>

                            {/* Right side - Date and Time display */}
                            <div className="flex flex-col items-center justify-center px-4 py-2 min-w-[80px] font-serif">
                              <div className={`text-xs font-semibold uppercase tracking-wide ${
                                isNext
                                  ? 'text-secondary-600'
                                  : (isPast || isFuture)
                                  ? 'text-gray-400'
                                  : 'text-gray-600'
                              }`}>
                                {dateParts.monthName}
                              </div>
                              <div className={`text-3xl font-bold leading-none my-1 ${
                                isNext
                                  ? 'text-secondary-900'
                                  : (isPast || isFuture)
                                  ? 'text-gray-500'
                                  : 'text-gray-900'
                              }`}>
                                {dateParts.dayOfMonth}
                              </div>
                              <div className={`text-sm font-semibold ${
                                isNext
                                  ? 'text-secondary-700'
                                  : (isPast || isFuture)
                                  ? 'text-gray-400'
                                  : 'text-gray-700'
                              }`}>
                                {dateParts.time}
                                <span className="text-xs ml-1">
                                  {dateParts.ampm}
                                </span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              <div className="flex gap-4 mt-6">
                <Link
                  to="/events"
                  className="inline-block text-emerald-600 hover:text-emerald-700 font-semibold whitespace-nowrap"
                >
                  View all events →
                </Link>
                <a
                  href="#programs"
                  className="inline-block text-emerald-600 hover:text-emerald-700 font-semibold whitespace-nowrap"
                  onClick={(e) => {
                    e.preventDefault();
                    const element = document.getElementById('programs');
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                >
                  View all programs →
                </a>
              </div>
            </motion.div>

              {/* Announcements Container */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.6 }}
                className="bg-white rounded-lg shadow-lg p-6 border-2 border-emerald-500"
                style={{ boxShadow: '0 0 30px rgba(16, 185, 129, 0.3)' }}
              >
                <h3 className="font-serif font-bold text-2xl text-gray-900 mb-6">
                  Announcements
                </h3>

              {announcements.length === 0 ? (
                <p className="text-gray-500">No announcements at this time.</p>
              ) : (
                <div className="space-y-4">
                  {announcements.map((announcement, index) => {
                    const isHighPriority = announcement.priority === 'high';
                    const dateToUse = announcement.publishDate || announcement.createdAt;
                    const dateParts = getAnnouncementDateParts(dateToUse);
                    
                    return (
                      <motion.div
                        key={announcement.id}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.5 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Link
                          to={`/announcements/${announcement.slug}`}
                          className={`block p-4 hover:bg-gray-50 rounded-lg transition-all group relative ${
                            isHighPriority
                              ? 'bg-gradient-to-br from-amber-50 to-amber-100 ring-2 ring-amber-400/50'
                              : 'border-emerald-500'
                          }`}
                        >
                          {isHighPriority && (
                            <div className="absolute -top-2 -right-2 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                              Important
                            </div>
                          )}
                          <div className="flex items-start gap-4">
                            {/* Left side - Announcement details */}
                            <div className="flex-1 min-w-0">
                              <h4 className={`font-semibold mb-1 ${
                                isHighPriority
                                  ? 'text-amber-900 group-hover:text-amber-700'
                                  : 'text-gray-900 group-hover:text-emerald-600'
                              }`}>
                                {announcement.title}
                              </h4>
                              {announcement.category && (
                                <span className={`inline-block text-xs font-semibold px-2 py-1 rounded ${
                                  isHighPriority 
                                    ? 'bg-amber-200 text-amber-900' 
                                    : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {announcement.category.replace('-', ' ').split(' ').map(word => 
                                    word.charAt(0).toUpperCase() + word.slice(1)
                                  ).join(' ')}
                                </span>
                              )}
                            </div>

                            {/* Right side - Date display */}
                            <div className="flex flex-col items-center justify-center px-4 py-2 min-w-[80px] font-serif">
                              <div className={`text-xs font-semibold uppercase tracking-wide ${
                                isHighPriority ? 'text-amber-600' : 'text-gray-600'
                              }`}>
                                {dateParts.monthName}
                              </div>
                              <div className={`text-3xl font-bold leading-none my-1 ${
                                isHighPriority ? 'text-amber-900' : 'text-gray-900'
                              }`}>
                                {dateParts.dayOfMonth}
                              </div>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              <Link
                to="/announcements"
                className="inline-block mt-6 text-emerald-600 hover:text-emerald-700 font-semibold whitespace-nowrap"
              >
                View all announcements →
              </Link>
              </motion.div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
