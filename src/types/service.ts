interface ImageFormat {
  url: string;
  width: number;
  height: number;
  size: number;
}

// Strapi v5 returns a flat structure (no nested attributes)
export interface Service {
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
  category: 'religious-services' | 'facilities' | 'counseling' | 'educational' | 'community' | 'other';
  isFeatured?: boolean;
  contactEmail?: string;
  contactPhone?: string;
  link?: string;
  linkType?: 'external' | 'internal';
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface ServicesResponse {
  data: Service[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

