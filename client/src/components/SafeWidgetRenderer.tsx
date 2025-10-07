import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import DOMPurify from 'dompurify';

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

interface Props {
  page: string;
  position: string;
  className?: string;
}

export default function SafeWidgetRenderer({ page, position, className = '' }: Props) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const widgetPage = page;
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isProductionDomain = /pickntrust\.com$/i.test(hostname);
  // Hard safeguard: disable all widgets on prime-picks regardless of domain
  const disableWidgetsOnPrimeInProd = widgetPage === 'prime-picks';

  const { data: widgets = [], isLoading, error } = useQuery<Widget[]>({
    queryKey: [`/api/widgets/${widgetPage}/${position}`, widgetPage, position],
    queryFn: async () => {
      let allWidgets: any[] = [];
      try {
        const response = await fetch(`/api/widgets/${widgetPage}/${position}`);
        if (response.ok) {
          allWidgets = await response.json();
        }
      } catch {}

      // Do not fall back to other pages; only render widgets for the current page

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
    enabled: !disableWidgetsOnPrimeInProd,
  });

  const filteredWidgets = widgets.filter((w) => {
    if (isMobile && !w.showOnMobile) return false;
    if (!isMobile && !w.showOnDesktop) return false;
    return true;
  });

  if (isLoading || error || filteredWidgets.length === 0 || disableWidgetsOnPrimeInProd) {
    return null;
  }

  const baseStyles = 'widget-container relative';
  const getPositionStyles = (pos: string) => {
    switch (pos) {
      case 'body':
        return `${baseStyles} w-full ${className}`;
      case 'product-grid-top':
        return `${baseStyles} w-full mb-4 ${className}`;
      case 'product-grid-bottom':
        return `${baseStyles} w-full mt-4 ${className}`;
      case 'product-card-top':
        return `${baseStyles} w-full mb-2 ${className}`;
      case 'product-card-bottom':
        return `${baseStyles} w-full mt-2 ${className}`;
      default:
        return `${baseStyles} ${className}`;
    }
  };

  return (
    <div className={getPositionStyles(position)}>
      {filteredWidgets.map((widget) => (
        <SafeWidgetItem key={widget.id} widget={widget} page={page} position={position} />
      ))}
    </div>
  );
}

function SafeWidgetItem({ widget, position, page }: { widget: Widget; position: string; page: string }) {
  const containerStyle: React.CSSProperties = {
    maxWidth: widget.maxWidth || 'none',
    width: '100%'
  };

  const isAdLike = /adsbygoogle|ad-slot|Advertisement|Affiliate|Sponsored/i.test(widget.body || widget.code) || /ad|sponsor/i.test(widget.name);

  return (
    <div
      id={`safe-widget-${widget.id}`}
      className="widget-item mb-4 relative"
      data-widget-name={widget.name}
      data-widget-position={widget.position}
      style={containerStyle}
    >
      {widget.customCss && (
        <style>{`#safe-widget-${widget.id} { ${widget.customCss} }`}</style>
      )}

      {isAdLike && (
        <span className="absolute top-2 right-2 z-10 text-xs px-2 py-0.5 rounded-full bg-black/50 text-white border border-white/20 select-none" aria-label="Advertisement">Ad</span>
      )}

      {(() => {
        if (widget.externalLink && /^https?:\/\//i.test(widget.externalLink)) {
          return (
            <iframe
              src={widget.externalLink}
              className="w-full rounded-md"
              sandbox="allow-scripts allow-popups allow-forms"
              referrerPolicy="no-referrer"
              loading="lazy"
              height={300}
            />
          );
        }
        const rawHtml = (widget.body && widget.body.trim().length > 0) ? widget.body : widget.code;
        const sanitized = DOMPurify.sanitize(rawHtml, {
          USE_PROFILES: { html: true },
          FORBID_TAGS: ['script'],
          ALLOWED_ATTR: ['href','src','alt','title','target','rel','class','style','data-*','aria-*'],
        } as any);
        return (
          <div dangerouslySetInnerHTML={{ __html: sanitized }} className="widget-content" />
        );
      })()}
    </div>
  );
}