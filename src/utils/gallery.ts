import type { GalleryPhoto } from '../services/strapi';

export function getAlbumSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function getPreferredGalleryUrl(photo?: GalleryPhoto | null): string | null {
  if (!photo) return null;
  const { formats } = photo;

  if (!formats || Object.keys(formats).length === 0) {
    return photo.url;
  }

  if (formats.medium?.url) {
    return formats.medium.url;
  }

  if (formats.small?.url) {
    return formats.small.url;
  }

  if (formats.thumbnail?.url) {
    return formats.thumbnail.url;
  }

  const firstFormat = Object.values(formats)[0];
  return firstFormat?.url ?? photo.url;
}

