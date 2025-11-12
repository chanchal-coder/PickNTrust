export type ImageProxyOptions = {
  width?: number;
  height?: number;
  quality?: number; // 1-100
  format?: 'webp' | 'jpeg' | 'png';
};

function isExternalUrl(url: string): boolean {
  try {
    const parsed = new URL(url, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return parsed.origin && parsed.origin !== origin;
  } catch {
    return /^https?:\/\//i.test(url);
  }
}

function isUploadsPath(url: string): boolean {
  try {
    const parsed = new URL(url, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
    return parsed.pathname.startsWith('/uploads');
  } catch {
    return url.startsWith('/uploads');
  }
}

export function getSafeImageSrc(url: string, opts: ImageProxyOptions = {}): string {
  if (!url) return '';
  const { width = 800, height = 600, quality = 80, format = 'webp' } = opts;

  // If external and not already served from backend uploads, proxy via server
  if (isExternalUrl(url) && !isUploadsPath(url)) {
    const qs = new URLSearchParams({
      url,
      width: String(width),
      height: String(height),
      quality: String(quality),
      format,
    });
    return `/api/image-proxy?${qs.toString()}`;
  }

  // Otherwise serve as-is
  return url;
}

export default getSafeImageSrc;