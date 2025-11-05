import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Sun, Moon, Clock, Sunrise, Sunset } from 'lucide-react';

interface PrayerTime {
  name: string;
  begins: string;
  adhan?: string;
  iqama?: string;
}

// Arabic prayer names mapping
const ARABIC_PRAYER_NAMES: Record<string, string> = {
  'fajr': 'الفجر',
  'sunrise': 'الشروق',
  'zawal': 'الزوال',
  'dhuhr': 'الظهر',
  'zuhr': 'الظهر',
  'asr': 'العصر',
  'maghrib': 'المغرب',
  'isha': 'العشاء',
  'jumah': 'الجمعة',
  'jumu\'ah': 'الجمعة',
};

const SHEET_ID = import.meta.env.VITE_SPREADSHEET_ID;
const PRAYER_TIMES_GID = import.meta.env.VITE_PRAYER_TIMES_GID || '0';
const SHEET_URL = SHEET_ID ? `https://docs.google.com/spreadsheets/d/e/2PACX-${SHEET_ID}/pub?gid=${PRAYER_TIMES_GID}&single=true&output=csv` : "";

const PRAYER_TIMES_URL = 'https://www.galaxystream.com/apps/pt.asp?uid=51&country=Canada&la=&lv=&org=Al%20Bukhari%20Community%20Centre';

const getPrayerIcon = (name: string) => {
  switch (name.toLowerCase()) {
    case 'fajr':
      return <Moon className="w-5 h-5 md:w-8 md:h-8" />;
    case 'sunrise':
      return <Sunrise className="w-5 h-5 md:w-8 md:h-8" />;
    case 'zawal':
      return <Sun className="w-5 h-5 md:w-8 md:h-8" />;
    case 'dhuhr':
      return <Sun className="w-5 h-5 md:w-8 md:h-8" />;
    case 'asr':
      return <Sun className="w-5 h-5 md:w-8 md:h-8" />;
    case 'maghrib':
      return <Sunset className="w-5 h-5 md:w-8 md:h-8" />;
    case 'isha':
      return <Moon className="w-5 h-5 md:w-8 md:h-8" />;
    default:
      return <Clock className="w-5 h-5 md:w-8 md:h-8" />;
  }
};

const formatTimeWithSmallAmPm = (timeStr: string) => {
  if (!timeStr || timeStr === '-') return timeStr;
  
  // Match time format like "5:42 AM" or "12:59 PM"
  const match = timeStr.match(/^(\d{1,2}:\d{2})\s*(AM|PM)$/i);
  if (match) {
    return (
      <>
        {match[1]}
        <span className="text-[0.6em]"> {match[2]}</span>
      </>
    );
  }
  
  // If no match, return as is
  return timeStr;
};

const convertToMinutes = (timeStr: string): number => {
  // Handle range format (e.g., "12:59PM - 1:04PM") by taking the first time
  if (timeStr.includes(' - ')) {
    timeStr = timeStr.split(' - ')[0].trim();
  }

  // Remove spaces and extract time and period
  const cleanStr = timeStr.trim().replace(/\s+/g, '');
  const match = cleanStr.match(/^(\d{1,2}):(\d{2})(AM|PM)$/i);

  if (!match) {
    console.error('Invalid time format:', timeStr);
    return 0;
  }

  const hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const period = match[3].toUpperCase();

  let totalMinutes = hours * 60 + minutes;
  if (period === 'PM' && hours !== 12) {
    totalMinutes += 12 * 60;
  } else if (period === 'AM' && hours === 12) {
    totalMinutes = minutes;
  }

  return totalMinutes;
};

const getNextPrayer = (prayerTimes: PrayerTime[]): number => {
  const now = new Date();
  
  // Get Toronto time components
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Toronto',
    hour12: false,
    hour: 'numeric',
    minute: 'numeric',
    weekday: 'long'
  });
  
  const torontoParts = formatter.formatToParts(now);
  const hours = parseInt(torontoParts.find(p => p.type === 'hour')?.value || '0');
  const minutes = parseInt(torontoParts.find(p => p.type === 'minute')?.value || '0');
  const weekday = torontoParts.find(p => p.type === 'weekday')?.value || '';
  
  const currentMinutes = hours * 60 + minutes;
  const isFriday = weekday.toLowerCase() === 'friday';
  const prayersWithIqama = prayerTimes.filter(prayer => prayer.iqama);

  // If there are no prayers with iqama, return 0
  if (prayersWithIqama.length === 0) {
    return 0;
  }

  for (let i = 0; i < prayersWithIqama.length; i++) {
    const prayerMinutes = convertToMinutes(prayersWithIqama[i].iqama!);
    if (prayerMinutes > currentMinutes) {
      const prayerName = prayersWithIqama[i].name;
      // On Fridays, if the next prayer is Zuhr, highlight Jumu'ah instead
      if (isFriday && prayerName.toLowerCase() === 'zuhr') {
        const jumahIndex = prayerTimes.findIndex(p => p.name.toLowerCase() === 'jumah');
        if (jumahIndex !== -1) {
          return jumahIndex;
        }
      }

      return prayerTimes.findIndex(p => p.name === prayerName);
    }
  }

  const firstPrayerName = prayersWithIqama[0].name;

  // On Fridays, if wrapping around to Zuhr/Dhuhr, highlight Jumu'ah instead
  if (isFriday && firstPrayerName.toLowerCase() === 'zuhr') {
    const jumahIndex = prayerTimes.findIndex(p => p.name.toLowerCase() === 'jumah' || p.name.toLowerCase() === 'jumu\'ah');
    if (jumahIndex !== -1) {
      return jumahIndex;
    }
  }

  return prayerTimes.findIndex(p => p.name === firstPrayerName);
};

export function PrayerTimes() {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextPrayerIndex, setNextPrayerIndex] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });
  const y = useTransform(scrollYProgress, [0, 1], ['-50%', '50%']);

  useEffect(() => {
    const fetchPrayerTimes = async () => {
      try {
        if (!SHEET_URL) {
          throw new Error('Prayer times sheet URL not configured');
        }

        const response = await fetch(SHEET_URL);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const csvData = await response.text();
        
        const rows = csvData.split('\n').slice(1);
        const parsedTimes = rows
          .filter(row => row.trim())
          .map(row => {
            const columns = row.split(',').map(cell =>
              cell.replace(/^"|"$/g, '').trim()
            );
            // Handle both 3-column (name, begins, iqama) and 4-column (name, begins, adhan, iqama) formats
            const [name = '', begins = '', adhan = '', iqama = ''] = columns;
            return {
              name,
              begins,
              ...(adhan ? { adhan } : {}),
              ...(iqama ? { iqama } : {})
            };
          })
          .filter(prayer => prayer.name && prayer.begins);

        if (parsedTimes.length === 0) {
          throw new Error('No prayer times found in the spreadsheet');
        }

        setPrayerTimes(parsedTimes);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('Error fetching prayer times:', errorMessage);
        setError('Failed to load prayer times.');
        setPrayerTimes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPrayerTimes();
  }, []);

  useEffect(() => {
    const updateNextPrayer = () => {
      setNextPrayerIndex(getNextPrayer(prayerTimes));
    };

    updateNextPrayer();
    const interval = setInterval(updateNextPrayer, 60000);
    return () => clearInterval(interval);
  }, [prayerTimes]);

  return (
    <section ref={sectionRef} id="prayer-times" className="py-24 relative overflow-hidden bg-black">
      {/* Parallax background image */}
      <motion.div
        className="absolute inset-0 w-full h-[140%] -top-[20%]"
        style={{ y }}
      >
        <img
          src="/images/stars.jpg"
          alt=""
          className="w-full h-full object-cover"
          style={{ objectPosition: 'center center' }}
        />
        <div className="absolute inset-0 bg-black/70"></div>
      </motion.div>
      
      {/* Subtle decorative elements with emerald hues */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-emerald-600/15 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-emerald-500/8 rounded-full blur-3xl"></div>
      </div>
      
      <div className="px-4 md:px-8 lg:px-12 xl:px-16 relative">
        <div className="mb-16">
          <motion.h2
            className="text-4xl font-serif font-semibold text-white md:text-5xl mb-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Prayer Times
          </motion.h2>
        </div>
        
        <div className="relative">
          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-emerald-200 border-t-emerald-500"></div>
            </div>
          ) : error ? (
            <motion.div
              className="text-center py-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 1 }}
              transition={{ duration: 0.6 }}
            >
              <div className="text-red-300 mb-4">{error}</div>
              <a
                href={PRAYER_TIMES_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
              >
                View Prayer Times on Galaxy Stream
              </a>
            </motion.div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 md:gap-4 lg:gap-6">
              {prayerTimes.map((prayer, index) => {
                const isNext = index === nextPrayerIndex;
                const isTimingOnly = !prayer.iqama;

                return (
                  <motion.div
                    key={prayer.name}
                    className={`relative backdrop-blur-md rounded-2xl border-2 shadow-lg transition-colors duration-300 ${
                      isNext && !isTimingOnly
                        ? 'bg-gradient-to-br from-secondary-50 via-secondary-50 to-secondary-100 border-secondary-500 shadow-secondary-500/30 ring-2 ring-secondary-400/50'
                        : 'bg-gradient-to-br from-gray-900/80 via-gray-800/80 to-gray-900/80 border-emerald-500/30 hover:border-emerald-500/60'
                    }`}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ 
                      opacity: 1, 
                      y: 0,
                      scale: isNext && !isTimingOnly ? 1.05 : 1
                    }}
                    viewport={{ once: true, amount: 1 }}
                    transition={{ 
                      delay: 0.2 + (index * 0.1),
                      type: "spring",
                      stiffness: 300,
                      damping: 20
                    }}
                    whileHover={{ 
                      scale: isNext && !isTimingOnly ? 1.06 : 1.03,
                      boxShadow: isNext && !isTimingOnly 
                        ? '0 20px 25px -5px rgba(245, 158, 11, 0.3), 0 10px 10px -5px rgba(245, 158, 11, 0.1)' 
                        : '0 20px 25px -5px rgba(16, 185, 129, 0.3), 0 10px 10px -5px rgba(16, 185, 129, 0.1)',
                      transition: {
                        type: "spring",
                        stiffness: 400,
                        damping: 25
                      }
                    }}
                    whileTap={{ 
                      scale: isNext && !isTimingOnly ? 1.04 : 1.01,
                      transition: {
                        type: "spring",
                        stiffness: 400,
                        damping: 25
                      }
                    }}
                  >
                    <div className="overflow-hidden rounded-2xl">
                      {/* Header Section */}
                      <div className={`p-2 pb-2 md:p-4 md:pb-3 ${
                        isNext && !isTimingOnly ? 'bg-gradient-to-r from-secondary-600/10 to-secondary-600/10' : ''
                      }`}>
                      <div className="flex flex-col items-center gap-1 md:gap-2">
                        <div className="flex items-center justify-center gap-2 md:gap-3">
                          <div className={isNext && !isTimingOnly ? "text-secondary-500" : "text-emerald-500"}>
                            {getPrayerIcon(prayer.name)}
                          </div>
                          <h3 className={`font-extrabold text-lg md:text-2xl font-serif text-center ${
                            isNext && !isTimingOnly ? 'text-secondary-900' : 'text-white'
                          }`}>
                            {prayer.name}
                          </h3>
                        </div>
                        {ARABIC_PRAYER_NAMES[prayer.name.toLowerCase()] && (
                          <div className={`text-lg md:text-xl font-serif ${
                            isNext && !isTimingOnly ? 'text-secondary-700' : 'text-emerald-300/70'
                          }`} style={{ direction: 'rtl' }}>
                            {ARABIC_PRAYER_NAMES[prayer.name.toLowerCase()]}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Detail Section */}
                    <div className="px-2 pb-2 md:px-4 md:pb-3">
                      <div className="grid grid-cols-2 gap-2 md:gap-3">
                        <div className={`border-r pr-2 md:pr-3 text-center ${
                          isNext && !isTimingOnly ? 'border-secondary-300/50' : 'border-emerald-500/20'
                        }`}>
                          <div className={`text-[9px] md:text-[10px] uppercase tracking-wider mb-1 ${
                            isNext && !isTimingOnly ? 'text-secondary-600' : 'text-emerald-400'
                          }`}>
                            Beginning
                          </div>
                          <div className={`text-xs md:text-sm font-semibold ${
                            isNext && !isTimingOnly ? 'text-secondary-900' : 'text-white'
                          }`}>
                            {formatTimeWithSmallAmPm(prayer.begins)}
                          </div>
                        </div>
                        <div className="pl-2 md:pl-3 text-center">
                          <div className={`text-[9px] md:text-[10px] uppercase tracking-wider mb-1 ${
                            isNext && !isTimingOnly ? 'text-secondary-600' : 'text-emerald-400'
                          }`}>
                            Athan
                          </div>
                          <div className={`text-xs md:text-sm font-semibold ${
                            isNext && !isTimingOnly ? 'text-secondary-900' : 'text-white'
                          }`}>
                            {formatTimeWithSmallAmPm(prayer.adhan || '-')}
                          </div>
                        </div>
                      </div>
                      <div className={`border-t mt-2 pt-2 md:mt-3 md:pt-3 ${
                        isNext && !isTimingOnly ? 'border-secondary-300/50' : 'border-emerald-500/20'
                      }`}></div>
                    </div>

                    {/* Highlighted IQAMA Section */}
                    <div className="px-2 pb-2 md:px-4 md:pb-4 rounded-b-xl text-center">
                      <div className={`text-[9px] md:text-[10px] uppercase tracking-wider mb-1 md:mb-2 ${
                        isNext && !isTimingOnly ? 'text-secondary-600' : 'text-emerald-400'
                      }`}>
                        Iqama
                      </div>
                      <div className={`text-2xl md:text-4xl font-bold font-serif text-center ${
                        isNext && !isTimingOnly ? 'text-black' : 'text-white'
                      }`}>
                        {formatTimeWithSmallAmPm(prayer.iqama || '-')}
                      </div>
                    </div>
                    </div>

                    {/* Footer Accent */}
                    {!isNext || isTimingOnly ? (
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-20 h-1 rounded-full bg-current/20"></div>
                    ) : null}
                  </motion.div>
                );
              })}
            </div>
          )}

          {!loading && !error && (
            <motion.div
              className="text-center mt-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <a
                href={PRAYER_TIMES_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-emerald-400/70 hover:text-emerald-300 transition-colors inline-flex items-center gap-1"
              >
                Prayer times sourced from galaxystream.com
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </motion.div>
          )}
        </div>
      </div>
      
      {/* Separator line matching HeroSlideshow progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-500"></div>
    </section>
  );
}