import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

interface PrayerTime {
  name: string;
  begins: string;
  adhan?: string;
  iqama?: string;
}

const SHEET_ID = import.meta.env.VITE_SPREADSHEET_ID;
const PRAYER_TIMES_GID = import.meta.env.VITE_PRAYER_TIMES_GID || '0';
const PRAYER_TIMES_URL = SHEET_ID ? `https://docs.google.com/spreadsheets/d/e/2PACX-${SHEET_ID}/pub?gid=${PRAYER_TIMES_GID}&single=true&output=csv` : "";

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

const getTimeUntilNextPrayer = (prayerTimes: PrayerTime[]): { name: string; hours: number; minutes: number; seconds: number } | null => {
  if (prayerTimes.length === 0) return null;

  const now = new Date();
  const torontoTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Toronto' }));
  const currentSeconds = torontoTime.getHours() * 3600 + torontoTime.getMinutes() * 60 + torontoTime.getSeconds();

  const prayersWithIqama = prayerTimes.filter(prayer => prayer.iqama);

  for (let i = 0; i < prayersWithIqama.length; i++) {
    const prayerMinutes = convertToMinutes(prayersWithIqama[i].begins);
    const prayerSeconds = prayerMinutes * 60;
    if (prayerSeconds > currentSeconds) {
      const secondsUntil = prayerSeconds - currentSeconds;
      return {
        name: prayersWithIqama[i].name,
        hours: Math.floor(secondsUntil / 3600),
        minutes: Math.floor((secondsUntil % 3600) / 60),
        seconds: secondsUntil % 60
      };
    }
  }

  // If no prayer found today, return first prayer tomorrow
  if (prayersWithIqama.length > 0) {
    const firstPrayerMinutes = convertToMinutes(prayersWithIqama[0].begins);
    const firstPrayerSeconds = firstPrayerMinutes * 60;
    const secondsUntil = (24 * 3600 - currentSeconds) + firstPrayerSeconds;
    return {
      name: prayersWithIqama[0].name,
      hours: Math.floor(secondsUntil / 3600),
      minutes: Math.floor((secondsUntil % 3600) / 60),
      seconds: secondsUntil % 60
    };
  }

  return null;
};

export function Hero() {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([]);
  const [countdown, setCountdown] = useState<{ name: string; hours: number; minutes: number; seconds: number } | null>(null);

  // Fetch prayer times
  useEffect(() => {
    const fetchPrayerTimes = async () => {
      try {
        if (!PRAYER_TIMES_URL) {
          console.error('Prayer times URL not configured');
          return;
        }

        const response = await fetch(PRAYER_TIMES_URL);
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
            const [name = '', begins = '', adhan = '', iqama = ''] = columns;
            return {
              name,
              begins,
              ...(adhan ? { adhan } : {}),
              ...(iqama ? { iqama } : {})
            };
          })
          .filter(prayer => prayer.name && prayer.begins);

        setPrayerTimes(parsedTimes);
      } catch (err) {
        console.error('Error fetching prayer times for countdown:', err);
        setPrayerTimes([]);
      }
    };

    fetchPrayerTimes();
  }, []);

  // Update countdown every second
  useEffect(() => {
    const updateCountdown = () => {
      const timeUntil = getTimeUntilNextPrayer(prayerTimes);
      setCountdown(timeUntil);
    };

    if (prayerTimes.length > 0) {
      updateCountdown();
      const interval = setInterval(updateCountdown, 1000); // Update every second
      return () => clearInterval(interval);
    }
  }, [prayerTimes]);

  return (
    <section id="home" className="relative h-screen overflow-hidden">
      {/* YouTube Video Background */}
      <div className="absolute inset-0 w-full h-full">
        <iframe
          className="absolute top-1/2 left-1/2 w-[100vw] h-[56.25vw] min-h-[100vh] min-w-[177.77vh] -translate-x-1/2 -translate-y-1/2"
          src="https://www.youtube.com/embed/zBTjOxJy8w8?autoplay=1&mute=1&loop=1&playlist=zBTjOxJy8w8&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&enablejsapi=1"
          title="Hero Background Video"
          allow="autoplay; encrypted-media"
          frameBorder="0"
        ></iframe>
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950/90 via-gray-900/85 to-gray-950/90"></div>
        <div className="absolute inset-0 islamic-pattern opacity-30"></div>
      </div>

      {/* Content */}
      <div className="relative h-full flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl animate-fade-in space-y-12 md:space-y-16">
            <div className="space-y-10 md:space-y-12">
              <div className="inline-block">
                <h1 className="text-5xl lg:text-6xl xl:text-7xl font-serif font-semibold tracking-tight text-white">
                  Welcome to<br />
                  <span className="text-emerald-400 relative">
                    Al-Bukhari Community Centre
                    <svg className="absolute -bottom-4 left-0 w-full" viewBox="0 0 200 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 5.5C47.6667 2.16667 154.4 -2.4 199 6" stroke="#059669" strokeWidth="2"/>
                    </svg>
                  </span>
                </h1>
              </div>
              <p className="text-lg md:text-xl text-emerald-50 max-w-2xl leading-relaxed italic font-serif">
                "Whatever you spend in good is for yourselves, and your reward is with Allah." - Quran 2:272
              </p>
            </div>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              <a
                href="https://app.irm.io/ajrcanada.com"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative inline-flex items-center justify-center px-10 py-5 text-xl font-bold text-white bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-[0_0_40px_rgba(251,146,60,0.8)] hover:scale-105 active:scale-95"
              >
                <span className="relative z-10">
                  Donate and earn Ajr
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 to-orange-600 rounded-lg blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
              </a>
              {countdown ? (
                <a
                  href="#prayer-times"
                  className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] hover:scale-105 active:scale-95"
                  aria-label="Time until next prayer"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <span className="tracking-wide">
                      {countdown.name}: {countdown.hours > 0 && `${countdown.hours}h `}{countdown.minutes}m {countdown.seconds}s
                    </span>
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-600 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </a>
              ) : (
                <button
                  className="px-8 py-4 text-lg font-semibold text-emerald-300 bg-emerald-950/50 border border-emerald-700/50 rounded-lg cursor-not-allowed opacity-60"
                  disabled
                >
                  Loading prayer times...
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}