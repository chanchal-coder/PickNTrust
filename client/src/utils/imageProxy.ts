// Safe image proxy helper for client-side usage
// Wraps external URLs through backend `/api/image-proxy` to avoid ORB/CORS blocks
export interface ImageProxyOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

export function getSafeImageSrc(url: string, opts: ImageProxyOptions = {}): string {
  if (!url || typeof url !== 'string') return '';
  try {
    const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    const parsed = new URL(url, base);
    const isExternal = parsed.origin !== base;
    const isUploads = parsed.pathname.startsWith('/uploads');

    if (isExternal && !isUploads) {
      const qs = new URLSearchParams({
        url,
        width: String(opts.width ?? 800),
        height: String(opts.height ?? 600),
        quality: String(opts.quality ?? 80),
        format: String(opts.format ?? 'webp')
      });
      return `/api/image-proxy?${qs.toString()}`;
    }
    return url;
  } catch {
    return url;
  }
}