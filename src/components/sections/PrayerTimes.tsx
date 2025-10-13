import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Sun, Moon, Clock, Sunrise, Sunset } from 'lucide-react';

interface PrayerTime {
  name: string;
  begins: string;
  adhan?: string;
  iqama?: string;
}

const SHEET_ID = import.meta.env.VITE_SPREADSHEET_ID;
const SHEET_URL = SHEET_ID ? `https://docs.google.com/spreadsheets/d/e/${SHEET_ID}/pub?output=csv` : "";

const PRAYER_TIMES_URL = 'https://www.galaxystream.com/apps/pt.asp?uid=51&country=Canada&la=&lv=&org=Al%20Bukhari%20Community%20Centre';

const getPrayerIcon = (name: string) => {
  switch (name.toLowerCase()) {
    case 'fajr':
      return <Moon className="w-6 h-6" />;
    case 'sunrise':
      return <Sunrise className="w-6 h-6" />;
    case 'zawal':
      return <Sun className="w-6 h-6" />;
    case 'dhuhr':
      return <Sun className="w-6 h-6" />;
    case 'asr':
      return <Sun className="w-6 h-6" />;
    case 'maghrib':
      return <Sunset className="w-6 h-6" />;
    case 'isha':
      return <Moon className="w-6 h-6" />;
    default:
      return <Clock className="w-6 h-6" />;
  }
};

const convertToMinutes = (timeStr: string): number => {
  const [time, period] = timeStr.split(' ');
  const [hours, minutes] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes;
  return period === 'PM' && hours !== 12 ? totalMinutes + 12 * 60 : totalMinutes;
};

const getNextPrayer = (prayerTimes: PrayerTime[]): number => {
  const now = new Date();
  const torontoTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Toronto' }));
  const currentMinutes = torontoTime.getHours() * 60 + torontoTime.getMinutes();

  const prayersWithIqama = prayerTimes.filter(prayer => prayer.iqama);
  
  for (let i = 0; i < prayersWithIqama.length; i++) {
    const prayerMinutes = convertToMinutes(prayersWithIqama[i].begins);
    if (prayerMinutes > currentMinutes) {
      return prayerTimes.findIndex(p => p.name === prayersWithIqama[i].name);
    }
  }
  return prayerTimes.findIndex(p => p.name === prayersWithIqama[0].name);
};

export function PrayerTimes() {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate] = useState(new Date());
  const [nextPrayerIndex, setNextPrayerIndex] = useState(0);

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
        console.error('Error fetching prayer times:', err.message || err);
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
    <section id="prayer-times" className="py-24 relative overflow-hidden bg-gradient-to-b from-emerald-900 to-emerald-800">
      <div className="absolute inset-0 islamic-pattern opacity-10"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-arabic font-bold text-white mb-6">
            Prayer Times
          </h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-emerald-100">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full">
              <Calendar className="w-5 h-5" />
              <span>{currentDate.toLocaleDateString('en-US', { 
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                timeZone: 'America/Toronto'
              })}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full">
              <MapPin className="w-5 h-5" />
              <span>Al Bukhari Community Centre</span>
            </div>
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto">
          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-emerald-200 border-t-emerald-500"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-300 mb-4">{error}</div>
              <a
                href={PRAYER_TIMES_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
              >
                View Prayer Times on Galaxy Stream
              </a>
            </div>
          ) : (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl overflow-hidden shadow-2xl border border-white/20">
              {/* Desktop Table View */}
              <table className="w-full hidden md:table">
                <thead>
                  <tr className="bg-white/5 border-b border-white/20">
                    <th className="px-6 py-4 text-left text-emerald-200 font-semibold">Prayer</th>
                    <th className="px-6 py-4 text-center text-emerald-200 font-semibold border-l border-white/10">Begins</th>
                    <th className="px-6 py-4 text-center text-emerald-200 font-semibold border-l border-white/10">Adhan</th>
                    <th className="px-6 py-4 text-center text-emerald-200 font-semibold border-l border-white/10">Iqama</th>
                  </tr>
                </thead>
                <tbody>
                  {prayerTimes.map((prayer, index) => {
                    const isNext = index === nextPrayerIndex;
                    const isTimingOnly = !prayer.iqama;

                    return (
                      <tr
                        key={prayer.name}
                        className={`border-b border-white/10 transition-colors duration-300 ${
                          isNext && !isTimingOnly
                            ? 'bg-gradient-to-r from-amber-500/30 to-amber-600/20'
                            : 'hover:bg-white/5'
                        }`}
                      >
                        <td className="px-6 py-5">
                          <div className={`flex items-center ${
                            isNext ? 'text-amber-200' : 'text-emerald-300'
                          }`}>
                            <div className="mr-3">{getPrayerIcon(prayer.name)}</div>
                            <span className="font-medium text-lg">{prayer.name}</span>
                            {isNext && !isTimingOnly && (
                              <span className="ml-3 text-xs font-medium bg-amber-400/20 text-amber-100 px-2 py-1 rounded-full">
                                Next
                              </span>
                            )}
                          </div>
                        </td>
                        <td className={`px-6 py-5 text-center font-medium border-l border-white/10 ${
                          isNext ? 'text-amber-100' : 'text-emerald-100'
                        }`}>
                          {prayer.begins}
                        </td>
                        <td className={`px-6 py-5 text-center font-medium border-l border-white/10 ${
                          isNext ? 'text-amber-100' : 'text-emerald-100'
                        }`}>
                          {prayer.adhan || '-'}
                        </td>
                        <td className={`px-6 py-5 text-center font-medium border-l border-white/10 ${
                          isNext ? 'text-amber-100' : 'text-emerald-100'
                        }`}>
                          {prayer.iqama || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-white/10">
                {prayerTimes.map((prayer, index) => {
                  const isNext = index === nextPrayerIndex;
                  const isTimingOnly = !prayer.iqama;

                  return (
                    <div
                      key={prayer.name}
                      className={`p-4 transition-colors duration-300 ${
                        isNext && !isTimingOnly
                          ? 'bg-gradient-to-r from-amber-500/30 to-amber-600/20'
                          : ''
                      }`}
                    >
                      <div className={`flex items-center justify-between mb-3 ${
                        isNext ? 'text-amber-200' : 'text-emerald-300'
                      }`}>
                        <div className="flex items-center">
                          <div className="mr-2">{getPrayerIcon(prayer.name)}</div>
                          <span className="font-semibold text-lg">{prayer.name}</span>
                        </div>
                        {isNext && !isTimingOnly && (
                          <span className="text-xs font-medium bg-amber-400/20 text-amber-100 px-2 py-1 rounded-full">
                            Next
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                          <div className="text-xs text-emerald-300/70 mb-1">Begins</div>
                          <div className={`font-medium text-sm ${
                            isNext ? 'text-amber-100' : 'text-emerald-100'
                          }`}>
                            {prayer.begins}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-emerald-300/70 mb-1">Adhan</div>
                          <div className={`font-medium text-sm ${
                            isNext ? 'text-amber-100' : 'text-emerald-100'
                          }`}>
                            {prayer.adhan || '-'}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-emerald-300/70 mb-1">Iqama</div>
                          <div className={`font-medium text-sm ${
                            isNext ? 'text-amber-100' : 'text-emerald-100'
                          }`}>
                            {prayer.iqama || '-'}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!loading && !error && (
            <div className="text-center mt-6">
              <a
                href={PRAYER_TIMES_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-emerald-300/70 hover:text-emerald-200 transition-colors inline-flex items-center gap-1"
              >
                Prayer times sourced from galaxystream.com
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}