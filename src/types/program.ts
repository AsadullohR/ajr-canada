interface ImageFormat {
  url: string;
  width: number;
  height: number;
  size: number;
}

// Strapi v5 returns a flat structure (no nested attributes)
export interface Program {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  thumbnail?: {
    id: number;
    url: string;
    alternativeText?: string;
    width?: number;
    height?: number;
    formats?: {
      large?: ImageFormat;
      medium?: ImageFormat;
      small?: ImageFormat;
      thumbnail?: ImageFormat;
    };
  };
  description: string;
  body?: string;
  address?: string;
  recurrencePattern: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurrenceInterval?: number;
  recurrenceDaysOfWeek?: (number | string)[]; // JSON array of day numbers (0-6) or day names (e.g., "Saturdays")
  eventTime?: string; // Time format HH:mm:ss
  timeDescription?: string;
  age?: string;
  audience: 'men' | 'women' | 'youth' | 'children' | 'families' | 'all';
  instructor?: string;
  instructorPicture?: {
    id: number;
    url: string;
    alternativeText?: string;
    width?: number;
    height?: number;
  };
  category: 'quran' | 'arabic' | 'islamic-studies' | 'youth-program' | 'sports' | 'community-service' | 'family-program' | 'educational' | 'spiritual' | 'other';
  capacity?: number;
  registrationRequired?: boolean;
  registrationLink?: string;
  link?: string;
  linkType?: 'external' | 'internal';
  isFeatured?: boolean;
  tags?: string;
  contactEmail?: string;
  contactPhone?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface ProgramsResponse {
  data: Program[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}
