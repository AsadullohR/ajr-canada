import { Event, EventsResponse } from '../types/event';

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
          params.append(`filters[${key}]${operator}`, String(operatorValue));
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
