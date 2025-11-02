interface ImageFormat {
  url: string;
  width: number;
  height: number;
  size: number;
}

export interface Announcement {
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
  priority: 'high' | 'medium' | 'low';
  isFeatured?: boolean;
  showOnHomepage?: boolean;
  publishDate?: string;
  expiryDate?: string;
  category: 'general' | 'urgent' | 'event' | 'program' | 'administrative' | 'prayer-times' | 'community' | 'other';
  link?: string;
  linkType?: 'external' | 'internal';
  contactEmail?: string;
  contactPhone?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface AnnouncementsResponse {
  data: Announcement[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

