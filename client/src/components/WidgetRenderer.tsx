import { useQuery } from '@tanstack/react-query';
import { useEffect, useState, useMemo } from 'react';

interface Widget {
  id: number;
  name: string;
  body?: string;
  code: string;
  targetPage: string;
  position: string;
  isActive: boolean;
  displayOrder: number;
  maxWidth?: string;
  customCss?: string;
  showOnMobile: boolean;
  showOnDesktop: boolean;
  externalLink?: string;
}

interface WidgetRendererProps {
  page: string;
  position: string;
  className?: string;
}

export default function WidgetRenderer({ page, position, className = '' }: WidgetRendererProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [previewTick, setPreviewTick] = useState(0);
  // Global safe-mode: disable overlay widgets that might cover the page
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const isDevEnv = import.meta.env.DEV === true;
  const isProdEnv = import.meta.env.PROD === true;
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isProductionDomain = /pickntrust\.com$/i.test(hostname);
  const widgetsSafeMode = (urlParams.get('widgetsSafeMode') === '1') || (typeof window !== 'undefined' && localStorage.getItem('widgetsSafeMode') === 'true');
  const widgetsSafeModeFull = (urlParams.get('widgetsSafeModeFull') === '1') || (typeof window !== 'undefined' && localStorage.getItem('widgetsSafeModeFull') === 'true');
  const isOverlayPosition = position.startsWith('content-') || position.startsWith('floating-') || position === 'sidebar-left' || position === 'sidebar-right';
  // In dev safe-mode, skip rendering overlay positions entirely
  if (isDevEnv && widgetsSafeMode && isOverlayPosition) {
    return null;
  }
  // In dev safe-mode FULL, skip rendering all widget positions
  if (isDevEnv && widgetsSafeModeFull) {
    return null;
  }

  // Clear stale preview state unless explicitly enabled via URL (?preview=1)
  useEffect(() => {
    try {
      const wantsPreview = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('preview') === '1';
      // In production on the live domain, force-disable and clear any preview flags
      if (isProdEnv && isProductionDomain) {
        localStorage.removeItem('widgetPreview');
        localStorage.removeItem('widgetPreviewEnabled');
        localStorage.removeItem('widgetPreviewOnly');
      } else if (!wantsPreview) {
        localStorage.removeItem('widgetPreview');
        localStorage.removeItem('widgetPreviewEnabled');
        localStorage.removeItem('widgetPreviewOnly');
      }
    } catch {}
  }, [page, position]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Listen for storage changes to refresh preview
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key && (e.key.includes('widgetPreview') || e.key === 'widgetPreviewEnabled')) {
        setPreviewTick((t) => t + 1);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Use the current page by default; optionally fall back to a source page
  const getWidgetPage = (_currentPage: string) => {
    return _currentPage;
  };

  const widgetPage = getWidgetPage(page);
  // Allow widgets on prime-picks again
  const disableWidgetsOnPrimeInProd = false;

  // Fetch widgets for this page and position (including fallback to parent pages)
  const { data: widgets = [], isLoading, error } = useQuery<Widget[]>({
    queryKey: [`/api/widgets/${widgetPage}/${position}`, page],
    queryFn: async () => {
      // Check if it's a travel subcategory (starts with 'travel-' but not 'travel-picks')
      const isTravelSubcategory = page.startsWith('travel-') && page !== 'travel-picks';
      
      let allWidgets: any[] = [];
      
      // If it's a travel subcategory, fetch widgets from both specific subcategory and main travel-picks
      if (isTravelSubcategory) {
        // Fetch widgets specifically for this subcategory
        try {
          const subcategoryResponse = await fetch(`/api/widgets/${page}/${position}`);
          if (subcategoryResponse.ok) {
            const subcategoryWidgets = await subcategoryResponse.json();
            allWidgets.push(...subcategoryWidgets);
          }
        } catch (error) {
          console.log(`No specific widgets found for ${page}`);
        }
        
        // Also fetch widgets from main travel-picks page as fallback
        try {
          const mainResponse = await fetch(`/api/widgets/travel-picks/${position}`);
          if (mainResponse.ok) {
            const mainWidgets = await mainResponse.json();
            // Add main widgets that aren't already included
            const existingIds = new Set(allWidgets.map(w => w.id));
            const newMainWidgets = mainWidgets.filter((w: any) => !existingIds.has(w.id));
            allWidgets.push(...newMainWidgets);
          }
        } catch (error) {
          console.log('No fallback widgets found for travel-picks');
        }
      } else {
        // For non-travel pages, fetch for the current page first
        let primaryWidgets: any[] = [];
        try {
          const response = await fetch(`/api/widgets/${widgetPage}/${position}`);
          if (response.ok) {
            primaryWidgets = await response.json();
          }
        } catch {}

        // Apply client-side safety filter to avoid rendering seeded fallback banners
        const noFallback = (w: any) => {
          const n = (w?.name || '').toString().toLowerCase();
          const c = (w?.code || '').toString().toLowerCase();
          const b = (w?.body || '').toString().toLowerCase();
          // Exclude any seeded fallback banners or loading placeholders
          if (n.includes('fallback')) return false;
          if (c.includes('fallback')) return false;
          if (b.includes('fallback')) return false;
          if (b.includes('loading')) return false;
          return true;
        };
        allWidgets = (primaryWidgets || []).filter(noFallback);

        // Do not fall back to other pages; only render widgets for the current page
      }

      // Transform snake_case API response to camelCase for frontend
      return allWidgets.map((widget: any): Widget => ({
        id: widget.id,
        name: widget.name,
        body: widget.body || '',
        code: widget.code,
        targetPage: widget.target_page,
        position: widget.position,
        isActive: Boolean(widget.is_active),
        displayOrder: widget.display_order,
        maxWidth: widget.max_width,
        customCss: widget.custom_css,
        showOnMobile: Boolean(widget.show_on_mobile),
        showOnDesktop: Boolean(widget.show_on_desktop),
        externalLink: widget.external_link || ''
      }));
    },
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    enabled: true,
  });

  // Filter widgets based on device type
  const filteredWidgets = widgets.filter((widget: Widget) => {
    if (isMobile && !widget.showOnMobile) return false;
    if (!isMobile && !widget.showOnDesktop) return false;
    return true;
  });

  // Inject localStorage-based live preview widget when enabled and matching
  // Block preview mode in production on the live domain
  const previewEnabledRaw = urlParams.get('preview') === '1' || localStorage.getItem('widgetPreviewEnabled') === 'true';
  const previewOnlyRaw = urlParams.get('previewOnly') === '1' || localStorage.getItem('widgetPreviewOnly') === 'true';
  // Hard-disable preview on production domain regardless of build env
  const previewEnabled = isProductionDomain ? false : previewEnabledRaw;
  const previewOnly = isProductionDomain ? false : previewOnlyRaw;
  const forceDebug = urlParams.get('forceWidgetDebug') === '1';
  const positionHash = Array.from(position).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const isFloating = position.startsWith('floating-');
  const isOverlaySidebar = position === 'sidebar-left' || position === 'sidebar-right';
  let finalWidgets: Widget[] = filteredWidgets;
  if (previewEnabled) {
    try {
      const raw = localStorage.getItem('widgetPreview');
      if (raw) {
        const pv = JSON.parse(raw);
        if (pv && pv.targetPage && pv.position && pv.targetPage === page && pv.position === position) {
          const previewWidget: Widget = {
            id: 999999 + positionHash, // synthetic id per position for preview
            name: pv.name || 'Preview Widget',
            body: pv.body || '',
            code: pv.code || '',
            targetPage: pv.targetPage,
            position: pv.position,
            isActive: true,
            displayOrder: -1,
            maxWidth: pv.maxWidth || 'none',
            customCss: pv.customCss || 'border: 2px dashed #22c55e; padding: 8px; background: rgba(34,197,94,0.08);',
            showOnMobile: pv.showOnMobile ?? true,
            showOnDesktop: pv.showOnDesktop ?? true,
            externalLink: pv.externalLink || ''
          };
          finalWidgets = previewOnly ? [previewWidget] : [previewWidget, ...filteredWidgets];
        }
      }
    } catch {}
  }

  // Allow preview widgets to render even while data is loading
  if (isLoading && !previewEnabled && !forceDebug) {
    return null;
  }

  if (error) {
    // Suppress dev fallback boxes; keep UI clean
    return null;
  }

  // If no real widgets and preview not enabled, inject a dev-only fallback (localhost)
  if (!previewEnabled && (finalWidgets.length === 0 || disableWidgetsOnPrimeInProd)) {
    // Suppress dev fallback boxes; keep UI clean
    return null;
  }

  // Add position-specific styling (non-intrusive, preserve parent layout classes)
  const getPositionStyles = (position: string) => {
    const baseStyles = 'widget-container relative';
    
    switch (position) {
      case 'floating-top-left':
        return `${baseStyles} absolute top-4 left-4 z-50 max-w-sm ${className}`;
      case 'floating-top-right':
        return `${baseStyles} absolute top-4 right-4 z-50 max-w-sm ${className}`;
      case 'floating-bottom-left':
        return `${baseStyles} absolute bottom-4 left-4 z-50 max-w-sm ${className}`;
      case 'floating-bottom-right':
        return `${baseStyles} absolute bottom-4 right-4 z-50 max-w-sm ${className}`;
      case 'banner-top':
      case 'banner-bottom':
        return `${baseStyles} w-full ${className}`;
      case 'header-top':
      case 'header-bottom':
        return `${baseStyles} w-full ${className}`;
      case 'content-top':
        // Overlay near top of main content area (below banner)
        return `${baseStyles} absolute top-4 left-1/2 -translate-x-1/2 z-40 ${className}`;
      case 'content-middle':
        // Overlay centered within the content area
        return `${baseStyles} absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 ${className}`;
      case 'content-bottom':
        // Overlay near bottom of main content area
        return `${baseStyles} absolute bottom-4 left-1/2 -translate-x-1/2 z-40 ${className}`;
      case 'sidebar-left':
        // Non-intrusive: parent wrapper controls positioning
        return `${baseStyles} max-w-sm ${className}`;
      case 'sidebar-right':
        // Non-intrusive: parent wrapper controls positioning
        return `${baseStyles} max-w-sm ${className}`;
      case 'footer-top':
      case 'footer-bottom':
        return `${baseStyles} w-full ${className}`;
      default:
        return `${baseStyles} ${className}`;
    }
  };

  const content = (
    <div className={getPositionStyles(position)}>
      {finalWidgets.map((widget: Widget) => (
        <WidgetItem key={widget.id} widget={widget} position={position} page={page} />
      ))}
    </div>
  );
  return content;
}

// Individual widget item component
function WidgetItem({ widget, position, page }: { widget: Widget; position: string; page?: string }) {
  // Sandbox widget content via iframe to prevent page-wide overrides
  const [iframeHeight, setIframeHeight] = useState<number>(300);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const d: any = e.data;
      if (d && d.type === 'WIDGET_IFRAME_HEIGHT' && d.id === widget.id && typeof d.h === 'number') {
        const clamped = Math.min(Math.max(d.h, 60), 3000);
        setIframeHeight(clamped);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [widget.id]);

  const rawHtml = useMemo(() => {
    const html = (widget.body && widget.body.trim().length > 0) ? widget.body : widget.code;
    return html || '';
  }, [widget.body, widget.code]);

  const srcDoc = useMemo(() => {
    if (!rawHtml) return '';
    const customStyle = widget.customCss ? `<style>${widget.customCss}</style>` : '';
    return `<!doctype html><html><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\" />
      <style>html,body{margin:0;padding:0;background:transparent}</style>${customStyle}</head>
      <body>
        ${rawHtml}
        <script>(function(){
          function send(){ try{ parent.postMessage({ type: 'WIDGET_IFRAME_HEIGHT', id: ${widget.id}, h: document.body.scrollHeight }, '*'); }catch(e){} }
          var mo = new MutationObserver(function(){ send(); });
          mo.observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true });
          window.addEventListener('load', send);
          setTimeout(send, 200);
        })();</script>
      </body></html>`;
  }, [rawHtml, widget.customCss, widget.id]);

  // Basic click tracking for links inside widget content
  useEffect(() => {
    const container = document.getElementById(`widget-${widget.id}`);
    if (!container) return;
    const handleClick = (e: Event) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a') as HTMLAnchorElement | null;
      if (anchor && anchor.href) {
        try {
          const payload = JSON.stringify({
            widgetId: widget.id,
            widgetName: widget.name,
            page: page,
            position: position,
            href: anchor.href
          });
          if (navigator.sendBeacon) {
            navigator.sendBeacon('/api/widgets/track-click', payload);
          } else {
            fetch('/api/widgets/track-click', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: payload
            });
          }
        } catch {}
      }
    };
    container.addEventListener('click', handleClick);
    return () => container.removeEventListener('click', handleClick);
  }, [widget.id, page, position]);

  const containerStyle: React.CSSProperties = {
    maxWidth: widget.maxWidth || 'none',
    width: '100%',
  };

  // Try to detect if widget is ad-like for disclosure badge
  const isAdLike = /adsbygoogle|ad-slot|Advertisement|Affiliate|Sponsored/i.test(widget.body || widget.code) || /ad|sponsor/i.test(widget.name);

  return (
    <div
      id={`widget-${widget.id}`}
      className="widget-item mb-4 relative"
      data-widget-name={widget.name}
      data-widget-position={widget.position}
      onClick={(e) => {
        if (!widget.externalLink) return;
        const target = e.target as HTMLElement;
        const insideAnchor = target.closest('a');
        if (insideAnchor) return; // let inner links behave normally
        try {
          const payload = JSON.stringify({
            widgetId: widget.id,
            widgetName: widget.name,
            page: page,
            position: position,
            href: widget.externalLink
          });
          if (navigator.sendBeacon) {
            navigator.sendBeacon('/api/widgets/track-click', payload);
          } else {
            fetch('/api/widgets/track-click', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: payload
            });
          }
        } catch {}
        if (widget.externalLink?.startsWith('http')) {
          window.open(widget.externalLink, '_blank', 'noopener,noreferrer');
        } else if (widget.externalLink) {
          window.location.href = widget.externalLink;
        }
      }}
      style={{ ...containerStyle, cursor: widget.externalLink ? 'pointer' : 'auto' }}
    >
      {/* Custom CSS */}
      {isAdLike && (
        <span className="absolute top-2 right-2 z-10 text-xs px-2 py-0.5 rounded-full bg-black/50 text-white border border-white/20 select-none" aria-label="Advertisement">Ad</span>
      )}
      
      {/* Widget Content (sandboxed) */}
      {widget.externalLink && /^https?:\/\//i.test(widget.externalLink) ? (
        <iframe
          src={widget.externalLink}
          className="w-full rounded-md"
          sandbox="allow-scripts allow-popups allow-forms"
          referrerPolicy="no-referrer"
          loading="lazy"
          height={iframeHeight}
          style={{ background: 'transparent' }}
        />
      ) : (rawHtml ? (
        <iframe
          srcDoc={srcDoc}
          className="w-full rounded-md"
          sandbox="allow-scripts allow-popups allow-forms"
          referrerPolicy="no-referrer"
          loading="lazy"
          height={iframeHeight}
          style={{ background: 'transparent' }}
          title={`Widget ${widget.name}`}
        />
      ) : null)}
    </div>
  );
}

// Hook for getting all widgets for a page
export function usePageWidgets(page: string) {
  return useQuery({
    queryKey: [`/api/widgets/${page}`],
    queryFn: async () => {
      const response = await fetch(`/api/widgets/${page}`);
      if (!response.ok) {
        throw new Error('Failed to fetch page widgets');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

// Utility function to group widgets by position
export function groupWidgetsByPosition(widgets: Widget[]) {
  return widgets.reduce((acc, widget) => {
    if (!acc[widget.position]) {
      acc[widget.position] = [];
    }
    acc[widget.position].push(widget);
    return acc;
  }, {} as Record<string, Widget[]>);
}