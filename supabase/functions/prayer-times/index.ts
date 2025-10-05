import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const response = await fetch('https://www.galaxystream.com/apps/pt.asp?uid=51&country=Canada&la=&lv=&org=Al%20Bukhari%20Community%20Centre', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'no-cache',
        'Referer': 'https://www.galaxystream.com/'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();

    // Extract prayer times using more flexible patterns
    const timePattern = /(\d{1,2}:\d{2}\s*(?:AM|PM))/i;
    const prayerTimes: Record<string, { begins: string; adhan: string; iqama: string }> = {};

    // Define prayer patterns with variations
    const prayers = [
      { name: 'fajr', patterns: [/Fajr/i, /Fjar/i] },
      { name: 'sunrise', patterns: [/Sunrise/i, /Shuruq/i] },
      { name: 'zuhr', patterns: [/Zuhr/i, /Dhuhr/i, /Duhr/i] },
      { name: 'asr', patterns: [/Asr/i, /Asar/i] },
      { name: 'maghrib', patterns: [/Maghrib/i, /Magrib/i] },
      { name: 'isha', patterns: [/Isha/i, /Ishaa/i] },
      { name: 'jumah', patterns: [/Jumu.?ah/i, /Friday/i] }
    ];

    for (const prayer of prayers) {
      for (const pattern of prayer.patterns) {
        // Find the prayer section in HTML
        const prayerMatch = html.match(new RegExp(`${pattern.source}[\\s\\S]*?(?=(?:${prayers.map(p => p.patterns[0].source).join('|')})|$)`, 'i'));
        
        if (prayerMatch) {
          const section = prayerMatch[0];
          // Extract all times from the section
          const times = section.match(new RegExp(timePattern, 'g')) || [];
          
          if (times.length > 0) {
            prayerTimes[prayer.name] = {
              begins: times[0] || '',
              adhan: times[1] || times[0] || '',
              iqama: times[2] || times[1] || times[0] || ''
            };
            break; // Found times for this prayer, move to next
          }
        }
      }
    }

    // Validate required prayers are present
    const requiredPrayers = ['fajr', 'sunrise', 'zuhr', 'asr', 'maghrib', 'isha'];
    const missingPrayers = requiredPrayers.filter(prayer => !prayerTimes[prayer]);

    if (missingPrayers.length > 0) {
      console.error('Missing prayers:', missingPrayers);
      console.error('HTML content:', html.substring(0, 1000)); // Log first 1000 chars for debugging
      throw new Error(`Missing required prayer times: ${missingPrayers.join(', ')}`);
    }

    // Return the prayer times
    return new Response(
      JSON.stringify({
        fajr: prayerTimes.fajr,
        sunrise: prayerTimes.sunrise,
        dhuhr: prayerTimes.zuhr,
        asr: prayerTimes.asr,
        maghrib: prayerTimes.maghrib,
        isha: prayerTimes.isha,
        ...(prayerTimes.jumah && { jumah: prayerTimes.jumah })
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error) {
    console.error('Error fetching prayer times:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch prayer times',
        details: error.message 
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});