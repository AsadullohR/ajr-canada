import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, Calendar } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { fetchAllAnnouncements } from '../services/strapi';
import { Announcement } from '../types/announcement';

const formatDate = (dateStr: string | undefined) => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const getPriorityOrder = (priority: string) => {
  switch (priority) {
    case 'high':
      return 0;
    case 'medium':
      return 1;
    case 'low':
      return 2;
    default:
      return 1;
  }
};

export function AnnouncementsListingPage() {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
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
    const loadAnnouncements = async () => {
      setLoading(true);
      const response = await fetchAllAnnouncements();
      // Sort by priority (high first), then by createdAt (newest first)
      const sorted = [...response.data].sort((a, b) => {
        const priorityDiff = getPriorityOrder(a.priority) - getPriorityOrder(b.priority);
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      setAnnouncements(sorted);
      setLoading(false);
    };

    loadAnnouncements();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mb-4"></div>
          <p className="text-gray-600">Loading announcements...</p>
        </div>
      </div>
    );
  }

  // Separate by priority
  const highPriority = announcements.filter(a => a.priority === 'high');
  const otherAnnouncements = announcements.filter(a => a.priority !== 'high');

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
            <h1 className="font-serif font-bold text-4xl md:text-5xl text-white text-center mb-4 flex items-center gap-3">
              <Bell className="w-10 h-10 md:w-12 md:h-12 text-emerald-400" />
              All Announcements
            </h1>
            <p className="text-white/90 text-lg text-center max-w-2xl">
              Stay updated with our latest announcements and notices
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 xl:px-16 py-12">
          {/* High Priority Announcements */}
          {highPriority.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-16"
            >
              <h2 className="font-serif font-bold text-3xl text-gray-900 mb-8 flex items-center gap-3">
                <span className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm font-semibold">High Priority</span>
                Urgent Announcements
              </h2>
              <div className="space-y-4">
                {highPriority.map((announcement, index) => (
                  <motion.div
                    key={announcement.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => navigate(`/announcements/${announcement.slug}`)}
                    className="border-l-4 border-red-500 pl-6 py-4 cursor-pointer hover:bg-red-50/50 transition-all duration-200 bg-white rounded-r-lg shadow-md hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="font-serif font-bold text-xl text-gray-900 flex-1">
                        {announcement.title}
                      </h3>
                      <span className="px-3 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded whitespace-nowrap">
                        High Priority
                      </span>
                    </div>
                    {announcement.description && (
                      <p className="text-gray-600 text-base mb-3 line-clamp-2">
                        {announcement.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      {announcement.publishDate && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          <span>Published: {formatDate(announcement.publishDate)}</span>
                        </div>
                      )}
                      {announcement.category && (
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded capitalize">
                          {announcement.category.replace('-', ' ')}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {/* Other Announcements */}
          {otherAnnouncements.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h2 className="font-serif font-bold text-3xl text-gray-900 mb-8">
                All Announcements
              </h2>
              <div className="space-y-4">
                {otherAnnouncements.map((announcement, index) => (
                  <motion.div
                    key={announcement.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => navigate(`/announcements/${announcement.slug}`)}
                    className="border-l-4 border-emerald-500 pl-6 py-4 cursor-pointer hover:bg-emerald-50/50 transition-all duration-200 bg-white rounded-r-lg shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="font-serif font-semibold text-lg text-gray-900 flex-1">
                        {announcement.title}
                      </h3>
                      {announcement.priority === 'high' && (
                        <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded whitespace-nowrap">
                          High Priority
                        </span>
                      )}
                    </div>
                    {announcement.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {announcement.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      {announcement.publishDate && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          <span>Published: {formatDate(announcement.publishDate)}</span>
                        </div>
                      )}
                      {announcement.category && (
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded capitalize">
                          {announcement.category.replace('-', ' ')}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {announcements.length === 0 && (
            <div className="text-center py-16">
              <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No announcements found.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

