import { Event, EventsResponse } from '../types/event';
import { Program, ProgramsResponse } from '../types/program';
import { Service, ServicesResponse } from '../types/service';
import { Announcement, AnnouncementsResponse } from '../types/announcement';

const STRAPI_URL =
  import.meta.env.VITE_STRAPI_URL ||
  "https://harmonious-kindness-705e180c6b.strapiapp.com";
const STRAPI_API_TOKEN = import.meta.env.VITE_STRAPI_API_TOKEN;

interface GalleryMediaFormat {
  ext: string | null;
  url: string;
  hash: string;
  mime: string;
  name: string;
  path: string | null;
  size: number;
  width: number;
  height: number;
}

export interface GalleryPhoto {
  id: number;
  name: string;
  alternativeText: string | null;
  caption: string | null;
  width: number | null;
  height: number | null;
  url: string;
  previewUrl: string | null;
  formats?: Record<string, GalleryMediaFormat>;
  size: number;
  mime: string;
  createdAt: string;
  updatedAt: string;
}

export interface GalleryAlbum {
  id: number;
  name: string;
  path: string;
  photoCount: number;
  coverPhoto: GalleryPhoto | null;
}

export interface GalleryAlbumDetail {
  album: {
    id: number;
    name: string;
    path: string;
  };
  photos: GalleryPhoto[];
}

interface GalleryApiPhoto
  extends Omit<GalleryPhoto, 'url' | 'previewUrl' | 'formats'> {
  url: string;
  previewUrl: string | null;
  formats?: Record<string, GalleryMediaFormat>;
}

interface GalleryApiAlbum extends Omit<GalleryAlbum, 'coverPhoto'> {
  coverPhoto: GalleryApiPhoto | null;
}

interface GalleryAlbumsResponse {
  albums: GalleryApiAlbum[];
}

interface GalleryAlbumPhotosResponse {
  album: GalleryAlbumDetail['album'];
  photos: GalleryApiPhoto[];
}

function toAbsoluteUrl(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `${STRAPI_URL}${url}`;
}

function normalizeFormats(
  formats?: Record<string, GalleryMediaFormat>
): Record<string, GalleryMediaFormat> | undefined {
  if (!formats) return undefined;

  return Object.entries(formats).reduce<Record<string, GalleryMediaFormat>>(
    (acc, [key, value]) => {
      acc[key] = {
        ...value,
        url: toAbsoluteUrl(value.url) ?? value.url,
      };
      return acc;
    },
    {}
  );
}

function normalizePhoto(photo?: GalleryApiPhoto | null): GalleryPhoto | null {
  if (!photo) return null;

  return {
    ...photo,
    url: toAbsoluteUrl(photo.url) ?? photo.url,
    previewUrl: toAbsoluteUrl(photo.previewUrl),
    formats: normalizeFormats(photo.formats),
  };
}

// Cache configuration
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes in milliseconds
const CACHE_PREFIX = 'strapi_cache_';

// Request deduplication - tracks ongoing requests
const pendingRequests = new Map<string, Promise<unknown>>();

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// Cache utilities
function getCacheKey(url: string): string {
  return `${CACHE_PREFIX}${btoa(url)}`;
}

function getCachedData<T>(cacheKey: string): T | null {
  try {
    const cached = localStorage.getItem(cacheKey);
    if (!cached) return null;

    const entry: CacheEntry<T> = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is expired
    if (now - entry.timestamp > CACHE_TTL) {
      localStorage.removeItem(cacheKey);
      return null;
    }

    return entry.data;
  } catch (error) {
    console.error('Error reading cache:', error);
    return null;
  }
}

function setCachedData<T>(cacheKey: string, data: T): void {
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(cacheKey, JSON.stringify(entry));
  } catch (error) {
    // Handle quota exceeded errors gracefully
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn('Cache storage full, clearing old entries...');
      clearOldCacheEntries();
      // Try again after clearing
      try {
        localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
      } catch (retryError) {
        console.error('Failed to cache after clearing:', retryError);
      }
    } else {
      console.error('Error writing cache:', error);
    }
  }
}

function clearOldCacheEntries(): void {
  try {
    const keys = Object.keys(localStorage);
    const now = Date.now();
    let cleared = 0;

    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const entry: CacheEntry<unknown> = JSON.parse(cached);
            if (now - entry.timestamp > CACHE_TTL) {
              localStorage.removeItem(key);
              cleared++;
            }
          }
        } catch (error) {
          console.warn('Removing invalid cache entry', error);
          localStorage.removeItem(key);
          cleared++;
        }
      }
    });

    // If still too many entries, remove oldest 50%
    if (cleared === 0) {
      const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX));
      if (cacheKeys.length > 20) {
        const entries = cacheKeys.map(key => ({
          key,
          timestamp: (() => {
            try {
              const cached = localStorage.getItem(key);
              return cached ? JSON.parse(cached).timestamp : 0;
            } catch {
              return 0;
            }
          })(),
        }));

        entries.sort((a, b) => a.timestamp - b.timestamp);
        const toRemove = entries.slice(0, Math.floor(entries.length / 2));
        toRemove.forEach(entry => localStorage.removeItem(entry.key));
      }
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

// Cached fetch wrapper
async function cachedFetch<T>(
  url: string,
  options: RequestInit = {},
  forceRefresh = false
): Promise<T> {
  const cacheKey = getCacheKey(url);

  // Check cache first (unless forcing refresh)
  if (!forceRefresh) {
    const cached = getCachedData<T>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // Check if there's already a pending request for this URL
    if (pendingRequests.has(url)) {
      return pendingRequests.get(url)! as Promise<T>;
    }
  }

  // Make the fetch request
  const fetchPromise = (async () => {
    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: T = await response.json();

      // Cache the successful response
      setCachedData(cacheKey, data);

      return data;
    } finally {
      // Remove from pending requests
      pendingRequests.delete(url);
    }
  })();

  // Store pending request for deduplication
  pendingRequests.set(url, fetchPromise);

  return fetchPromise;
}

interface FetchOptions {
  populate?: string[];
  filters?: Record<string, unknown>;
  sort?: string[];
  pagination?: {
    page?: number;
    pageSize?: number;
  };
}

function buildQueryString(options: FetchOptions): string {
  const params = new URLSearchParams();

  if (options.populate) {
    options.populate.forEach(field => {
      params.append('populate', field);
    });
  }

  if (options.sort) {
    options.sort.forEach(field => {
      params.append('sort', field);
    });
  }

  if (options.pagination) {
    if (options.pagination.page) {
      params.append('pagination[page]', options.pagination.page.toString());
    }
    if (options.pagination.pageSize) {
      params.append('pagination[pageSize]', options.pagination.pageSize.toString());
    }
  }

  if (options.filters) {
    Object.entries(options.filters).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        // Handle nested filter objects (e.g., { $gte: 'date' })
        Object.entries(value).forEach(([operator, operatorValue]) => {
          // Handle $eq specially as it's the default
          if (operator === '$eq') {
            params.append(`filters[${key}][$eq]`, String(operatorValue));
          } else {
            params.append(`filters[${key}][${operator}]`, String(operatorValue));
          }
        });
      } else {
        // Handle simple filter values
        params.append(`filters[${key}][$eq]`, String(value));
      }
    });
  }

  return params.toString();
}

export async function fetchFeaturedEvents(): Promise<EventsResponse> {
  try {
    const queryString = buildQueryString({
      populate: ['thumbnail'],
      filters: {
        isFeatured: true,
      },
      sort: ['eventDate:desc'],
      pagination: {
        pageSize: 5,
      },
    });

    const url = `${STRAPI_URL}/api/events?${queryString}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (STRAPI_API_TOKEN) {
      headers['Authorization'] = `Bearer ${STRAPI_API_TOKEN}`;
    }

    const data: EventsResponse = await cachedFetch<EventsResponse>(url, { headers });
    return data;
  } catch (error) {
    console.error('Error fetching featured events:', error);
    return {
      data: [],
      meta: {
        pagination: {
          page: 1,
          pageSize: 0,
          pageCount: 0,
          total: 0,
        },
      },
    };
  }
}

export async function fetchUpcomingEvents(limit = 10): Promise<EventsResponse> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const queryString = buildQueryString({
      populate: ['thumbnail'],
      filters: {
        eventDate: { $gte: today },
      },
      sort: ['eventDate:asc'],
      pagination: {
        pageSize: limit,
      },
    });

    const url = `${STRAPI_URL}/api/events?${queryString}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (STRAPI_API_TOKEN) {
      headers['Authorization'] = `Bearer ${STRAPI_API_TOKEN}`;
    }

    const data: EventsResponse = await cachedFetch<EventsResponse>(url, { headers });
    return data;
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    return {
      data: [],
      meta: {
        pagination: {
          page: 1,
          pageSize: 0,
          pageCount: 0,
          total: 0,
        },
      },
    };
  }
}

export async function fetchEventBySlug(slug: string): Promise<Event | null> {
  try {
    const queryString = buildQueryString({
      populate: ['thumbnail'],
      filters: {
        slug: { $eq: slug },
      },
    });

    const url = `${STRAPI_URL}/api/events?${queryString}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (STRAPI_API_TOKEN) {
      headers['Authorization'] = `Bearer ${STRAPI_API_TOKEN}`;
    }

    const data: EventsResponse = await cachedFetch<EventsResponse>(url, { headers });
    return data.data.length > 0 ? data.data[0] : null;
  } catch (error) {
    console.error('Error fetching event by slug:', error);
    return null;
  }
}

export async function fetchAllEvents(): Promise<EventsResponse> {
  try {
    const queryString = buildQueryString({
      populate: ['thumbnail'],
      sort: ['eventDate:asc'],
      pagination: {
        pageSize: 100,
      },
    });

    const url = `${STRAPI_URL}/api/events?${queryString}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (STRAPI_API_TOKEN) {
      headers['Authorization'] = `Bearer ${STRAPI_API_TOKEN}`;
    }

    const data: EventsResponse = await cachedFetch<EventsResponse>(url, { headers });
    return data;
  } catch (error) {
    console.error('Error fetching all events:', error);
    return {
      data: [],
      meta: {
        pagination: {
          page: 1,
          pageSize: 0,
          pageCount: 0,
          total: 0,
        },
      },
    };
  }
}

// ============================================
// PROGRAMS API FUNCTIONS
// ============================================

export async function fetchAllPrograms(): Promise<ProgramsResponse> {
  try {
    const queryString = buildQueryString({
      populate: ['thumbnail', 'instructorPicture'],
      sort: ['createdAt:desc'],
      pagination: {
        pageSize: 100, // Get all programs
      },
    });

    const url = `${STRAPI_URL}/api/programs?${queryString}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (STRAPI_API_TOKEN) {
      headers['Authorization'] = `Bearer ${STRAPI_API_TOKEN}`;
    }

    const data: ProgramsResponse = await cachedFetch<ProgramsResponse>(url, { headers });
    return data;
  } catch (error) {
    console.error('Error fetching programs:', error);
    return {
      data: [],
      meta: {
        pagination: {
          page: 1,
          pageSize: 0,
          pageCount: 0,
          total: 0,
        },
      },
    };
  }
}

export async function fetchFeaturedPrograms(): Promise<ProgramsResponse> {
  try {
    const queryString = buildQueryString({
      populate: ['thumbnail', 'instructorPicture'],
      filters: {
        isFeatured: true,
      },
      sort: ['createdAt:desc'],
      pagination: {
        pageSize: 50,
      },
    });

    const url = `${STRAPI_URL}/api/programs?${queryString}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (STRAPI_API_TOKEN) {
      headers['Authorization'] = `Bearer ${STRAPI_API_TOKEN}`;
    }

    const data: ProgramsResponse = await cachedFetch<ProgramsResponse>(url, { headers });
    return data;
  } catch (error) {
    console.error('Error fetching featured programs:', error);
    return {
      data: [],
      meta: {
        pagination: {
          page: 1,
          pageSize: 0,
          pageCount: 0,
          total: 0,
        },
      },
    };
  }
}

export async function fetchProgramBySlug(slug: string): Promise<Program | null> {
  try {
    const queryString = buildQueryString({
      populate: ['thumbnail', 'instructorPicture'],
      filters: {
        slug: { $eq: slug },
      },
    });

    const url = `${STRAPI_URL}/api/programs?${queryString}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (STRAPI_API_TOKEN) {
      headers['Authorization'] = `Bearer ${STRAPI_API_TOKEN}`;
    }

    const data: ProgramsResponse = await cachedFetch<ProgramsResponse>(url, { headers });
    return data.data.length > 0 ? data.data[0] : null;
  } catch (error) {
    console.error('Error fetching program by slug:', error);
    return null;
  }
}

// ============================================
// SERVICES API FUNCTIONS
// ============================================

export async function fetchAllServices(): Promise<ServicesResponse> {
  try {
    const queryString = buildQueryString({
      populate: ['thumbnail'],
      sort: ['createdAt:desc'],
      pagination: {
        pageSize: 100, // Get all services
      },
    });

    const url = `${STRAPI_URL}/api/services?${queryString}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (STRAPI_API_TOKEN) {
      headers['Authorization'] = `Bearer ${STRAPI_API_TOKEN}`;
    }

    const data: ServicesResponse = await cachedFetch<ServicesResponse>(url, { headers });
    return data;
  } catch (error) {
    console.error('Error fetching services:', error);
    return {
      data: [],
      meta: {
        pagination: {
          page: 1,
          pageSize: 0,
          pageCount: 0,
          total: 0,
        },
      },
    };
  }
}

export async function fetchFeaturedServices(): Promise<ServicesResponse> {
  try {
    const queryString = buildQueryString({
      populate: ['thumbnail'],
      filters: {
        isFeatured: true,
      },
      sort: ['createdAt:desc'],
      pagination: {
        pageSize: 50,
      },
    });

    const url = `${STRAPI_URL}/api/services?${queryString}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (STRAPI_API_TOKEN) {
      headers['Authorization'] = `Bearer ${STRAPI_API_TOKEN}`;
    }

    const data: ServicesResponse = await cachedFetch<ServicesResponse>(url, { headers });
    return data;
  } catch (error) {
    console.error('Error fetching featured services:', error);
    return {
      data: [],
      meta: {
        pagination: {
          page: 1,
          pageSize: 0,
          pageCount: 0,
          total: 0,
        },
      },
    };
  }
}

export async function fetchServiceBySlug(slug: string): Promise<Service | null> {
  try {
    const queryString = buildQueryString({
      populate: ['thumbnail'],
      filters: {
        slug: { $eq: slug },
      },
    });

    const url = `${STRAPI_URL}/api/services?${queryString}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (STRAPI_API_TOKEN) {
      headers['Authorization'] = `Bearer ${STRAPI_API_TOKEN}`;
    }

    const data: ServicesResponse = await cachedFetch<ServicesResponse>(url, { headers });
    return data.data.length > 0 ? data.data[0] : null;
  } catch (error) {
    console.error('Error fetching service by slug:', error);
    return null;
  }
}

// ============================================
// ANNOUNCEMENTS API FUNCTIONS
// ============================================

export async function fetchAllAnnouncements(): Promise<AnnouncementsResponse> {
  try {
    const queryString = buildQueryString({
      populate: ['thumbnail'],
      sort: ['priority:desc', 'createdAt:desc'],
      pagination: {
        pageSize: 100,
      },
    });

    const url = `${STRAPI_URL}/api/announcements?${queryString}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (STRAPI_API_TOKEN) {
      headers['Authorization'] = `Bearer ${STRAPI_API_TOKEN}`;
    }

    const data: AnnouncementsResponse = await cachedFetch<AnnouncementsResponse>(url, { headers });
    return data;
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return {
      data: [],
      meta: {
        pagination: {
          page: 1,
          pageSize: 0,
          pageCount: 0,
          total: 0,
        },
      },
    };
  }
}

export async function fetchHomepageAnnouncements(): Promise<AnnouncementsResponse> {
  try {
    // First try to get announcements marked for homepage
    let queryString = buildQueryString({
      populate: ['thumbnail'],
      filters: {
        showOnHomepage: true,
      },
      sort: ['priority:desc', 'createdAt:desc'],
      pagination: {
        pageSize: 10,
      },
    });

    let url = `${STRAPI_URL}/api/announcements?${queryString}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (STRAPI_API_TOKEN) {
      headers['Authorization'] = `Bearer ${STRAPI_API_TOKEN}`;
    }

    let data: AnnouncementsResponse = await cachedFetch<AnnouncementsResponse>(url, { headers });
    
    // If no homepage announcements found, fallback to all published announcements
    if (data.data.length === 0) {
      console.log('No homepage announcements found, fetching all published announcements...');
      queryString = buildQueryString({
        populate: ['thumbnail'],
        sort: ['priority:desc', 'createdAt:desc'],
        pagination: {
          pageSize: 10,
        },
      });
      
      url = `${STRAPI_URL}/api/announcements?${queryString}`;
      try {
        const fallbackData = await cachedFetch<AnnouncementsResponse>(url, { headers });
        if (fallbackData.data.length > 0) {
          data = fallbackData;
        }
      } catch (error) {
        console.error('Error fetching fallback announcements:', error);
      }
    }

    return data;
  } catch (error) {
    console.error('Error fetching homepage announcements:', error);
    return {
      data: [],
      meta: {
        pagination: {
          page: 1,
          pageSize: 0,
          pageCount: 0,
          total: 0,
        },
      },
    };
  }
}

export async function fetchAnnouncementBySlug(slug: string): Promise<Announcement | null> {
  try {
    const queryString = buildQueryString({
      populate: ['thumbnail'],
      filters: {
        slug: { $eq: slug },
      },
    });

    const url = `${STRAPI_URL}/api/announcements?${queryString}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (STRAPI_API_TOKEN) {
      headers['Authorization'] = `Bearer ${STRAPI_API_TOKEN}`;
    }

    const data: AnnouncementsResponse = await cachedFetch<AnnouncementsResponse>(url, { headers });
    return data.data.length > 0 ? data.data[0] : null;
  } catch (error) {
    console.error('Error fetching announcement by slug:', error);
    return null;
  }
}

// ============================================
// GALLERY API FUNCTIONS
// ============================================

export async function fetchGalleryAlbums(): Promise<GalleryAlbum[]> {
  try {
    const url = `${STRAPI_URL}/api/gallery`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (STRAPI_API_TOKEN) {
      headers['Authorization'] = `Bearer ${STRAPI_API_TOKEN}`;
    }

    const data = await cachedFetch<GalleryAlbumsResponse>(url, { headers });
    if (!data || !Array.isArray(data.albums)) {
      return [];
    }

    return data.albums.map(album => ({
      id: album.id,
      name: album.name,
      path: album.path,
      photoCount: album.photoCount ?? 0,
      coverPhoto: normalizePhoto(album.coverPhoto),
    }));
  } catch (error) {
    console.error('Error fetching gallery albums:', error);
    return [];
  }
}

export async function fetchGalleryAlbumPhotos(
  albumId: number
): Promise<GalleryAlbumDetail | null> {
  if (!albumId) {
    return null;
  }

  try {
    const params = new URLSearchParams({ albumId: String(albumId) });
    const url = `${STRAPI_URL}/api/gallery?${params.toString()}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (STRAPI_API_TOKEN) {
      headers['Authorization'] = `Bearer ${STRAPI_API_TOKEN}`;
    }

    const data = await cachedFetch<GalleryAlbumPhotosResponse>(url, { headers });

    if (!data || !data.album) {
      return null;
    }

    const photos = (data.photos ?? [])
      .map(photo => normalizePhoto(photo))
      .filter((photo): photo is GalleryPhoto => Boolean(photo))
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateA - dateB;
      });

    return {
      album: data.album,
      photos,
    };
  } catch (error) {
    console.error('Error fetching gallery album photos:', error);
    return null;
  }
}

// ============================================
// CACHE MANAGEMENT UTILITIES
// ============================================

/**
 * Clears all cached Strapi API responses
 * Useful for forcing fresh data after content updates
 */
export function clearStrapiCache(): void {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
    console.log('Strapi cache cleared');
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

/**
 * Gets cache statistics (useful for debugging)
 */
export function getCacheStats(): { totalEntries: number; totalSize: number } {
  try {
    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX));
    let totalSize = 0;

    cacheKeys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        totalSize += new Blob([value]).size;
      }
    });

    return {
      totalEntries: cacheKeys.length,
      totalSize: totalSize, // Size in bytes
    };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return { totalEntries: 0, totalSize: 0 };
  }
}
