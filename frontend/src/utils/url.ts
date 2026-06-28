/**
 * Resolves a backend-relative image URL (e.g. /uploads/images/character/123.png)
 * to an absolute URL pointing to the backend server.
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Strip trailing /api to get the backend origin
export const BACKEND_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

export function getImageUrl(relativeUrl?: string | null): string | undefined {
  if (!relativeUrl) return undefined;
  // Already absolute
  if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
    return relativeUrl;
  }
  return `${BACKEND_ORIGIN}${relativeUrl}`;
}
