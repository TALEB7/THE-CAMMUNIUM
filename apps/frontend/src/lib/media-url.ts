/**
 * Resolves an avatar/listing image URL.
 * - Relative paths (/api/uploads/...) → prepend the API base host
 * - Absolute URLs that contain /api/uploads/ → re-resolve using current API base
 *   (handles old DB records stored with http://localhost:4000/... that break on LAN)
 * - Other absolute URLs (http/https external) → return as-is
 */
export function getMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
  const base = apiUrl.replace(/\/api\/?$/, '');

  if (path.startsWith('http://') || path.startsWith('https://')) {
    // Re-resolve any absolute URL that contains our uploads path
    const uploadsMatch = path.match(/(\/api\/uploads\/.+)/);
    if (uploadsMatch) return `${base}${uploadsMatch[1]}`;
    return path;
  }

  // Relative path like /api/uploads/avatars/xxx.jpg
  return `${base}${path}`;
}
