interface ImageFormat {
  url: string;
  width: number;
  height: number;
  size: number;
}

// Strapi v5 returns a flat structure (no nested attributes)
export interface Event {
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
  eventDate: string;
  eventTime: string;
  endDate?: string;
  endTime?: string;
  location: string;
  locationAddress?: string;
  organizer: string;
  organizerContact?: string;
  link?: string;
  linkType?: 'external' | 'internal';
  category: 'lecture' | 'workshop' | 'community-gathering' | 'prayer' | 'educational' | 'charity' | 'youth' | 'family' | 'other';
  registrationRequired?: boolean;
  registrationLink?: string;
  capacity?: number;
  isFeatured?: boolean;
  tags?: string;
  contactEmail?: string;
  contactPhone?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface EventsResponse {
  data: Event[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}
