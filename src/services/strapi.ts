import { Event, EventsResponse } from '../types/event';
import { Program, ProgramsResponse } from '../types/program';
import { Service, ServicesResponse } from '../types/service';
import { Announcement, AnnouncementsResponse } from '../types/announcement';

const STRAPI_URL = import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = import.meta.env.VITE_STRAPI_API_TOKEN;

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

    const response = await fetch(url, { headers });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Strapi API Error (${response.status}):`, errorText);
      console.error('URL:', url);
      console.error('Make sure:');
      console.error('1. Events collection type exists in Strapi');
      console.error('2. API permissions are set for "events" endpoint');
      console.error('3. You have created at least one published event');
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: EventsResponse = await response.json();
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

    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: EventsResponse = await response.json();
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

    const response = await fetch(url, { headers });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Strapi API Error (${response.status}):`, errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: EventsResponse = await response.json();
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

    const response = await fetch(url, { headers });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Strapi API Error (${response.status}):`, errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: EventsResponse = await response.json();
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

    const response = await fetch(url, { headers });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Strapi API Error (${response.status}):`, errorText);
      console.error('URL:', url);
      console.error('Make sure:');
      console.error('1. Programs collection type exists in Strapi');
      console.error('2. API permissions are set for "programs" endpoint');
      console.error('3. You have created at least one published program');
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ProgramsResponse = await response.json();
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

    const response = await fetch(url, { headers });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Strapi API Error (${response.status}):`, errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ProgramsResponse = await response.json();
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

    const response = await fetch(url, { headers });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Strapi API Error (${response.status}):`, errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ProgramsResponse = await response.json();
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

    const response = await fetch(url, { headers });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Strapi API Error (${response.status}):`, errorText);
      console.error('URL:', url);
      console.error('Make sure:');
      console.error('1. Services collection type exists in Strapi');
      console.error('2. API permissions are set for "services" endpoint');
      console.error('3. You have created at least one published service');
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ServicesResponse = await response.json();
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

    const response = await fetch(url, { headers });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Strapi API Error (${response.status}):`, errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ServicesResponse = await response.json();
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

    const response = await fetch(url, { headers });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Strapi API Error (${response.status}):`, errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ServicesResponse = await response.json();
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

    const response = await fetch(url, { headers });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Strapi API Error (${response.status}):`, errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: AnnouncementsResponse = await response.json();
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

    let response = await fetch(url, { headers });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Strapi API Error (${response.status}):`, errorText);
      console.error('URL:', url);
      console.error('Make sure:');
      console.error('1. Announcements collection type exists in Strapi');
      console.error('2. API permissions are set for "announcements" endpoint');
      console.error('3. You have created at least one published announcement');
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    let data: AnnouncementsResponse = await response.json();
    
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
      response = await fetch(url, { headers });
      
      if (response.ok) {
        data = await response.json();
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

    const response = await fetch(url, { headers });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Strapi API Error (${response.status}):`, errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: AnnouncementsResponse = await response.json();
    return data.data.length > 0 ? data.data[0] : null;
  } catch (error) {
    console.error('Error fetching announcement by slug:', error);
    return null;
  }
}
