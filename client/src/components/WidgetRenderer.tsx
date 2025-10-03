import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

interface Widget {
  id: number;
  name: string;
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

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Map travel subcategories to main travel-picks page for widget fetching
  const getWidgetPage = (currentPage: string) => {
    // Check if it's a travel subcategory (starts with 'travel-')
    const isTravelSubcategory = currentPage.startsWith('travel-') && currentPage !== 'travel-picks';
    
    // If it's a travel subcategory, keep the specific subcategory for targeted widgets
    if (isTravelSubcategory) {
      return currentPage;
    }
    
    return currentPage;
  };

  const widgetPage = getWidgetPage(page);

  // Fetch widgets for this page and position (including fallback to parent pages)
  const { data: widgets = [], isLoading, error } = useQuery({
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
        // For non-travel pages, fetch normally
        const response = await fetch(`/api/widgets/${widgetPage}/${position}`);
        if (!response.ok) {
          throw new Error('Failed to fetch widgets');
        }
        allWidgets = await response.json();
      }
      
      // Transform snake_case API response to camelCase for frontend
      return allWidgets.map((widget: any) => ({
        id: widget.id,
        name: widget.name,
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
  });

  // Filter widgets based on device type
  const filteredWidgets = widgets.filter((widget: Widget) => {
    if (isMobile && !widget.showOnMobile) return false;
    if (!isMobile && !widget.showOnDesktop) return false;
    return true;
  });

  if (isLoading) {
    return null; // Don't show loading state for widgets
  }

  if (error || filteredWidgets.length === 0) {
    return null; // Don't show error state for widgets
  }

  // Add position-specific styling
  const getPositionStyles = (position: string) => {
    const baseStyles = 'widget-container';
    
    switch (position) {
      case 'floating-top-left':
        return `${baseStyles} fixed top-4 left-4 z-50 max-w-sm`;
      case 'floating-top-right':
        return `${baseStyles} fixed top-4 right-4 z-50 max-w-sm`;
      case 'floating-bottom-left':
        return `${baseStyles} fixed bottom-4 left-4 z-50 max-w-sm`;
      case 'floating-bottom-right':
        return `${baseStyles} fixed bottom-4 right-4 z-50 max-w-sm`;
      case 'banner-top':
      case 'banner-bottom':
        return `${baseStyles} w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white`;
      case 'header-top':
      case 'header-bottom':
        return `${baseStyles} w-full bg-white dark:bg-gray-800 shadow-sm`;
      case 'content-top':
      case 'content-middle':
      case 'content-bottom':
        return `${baseStyles} my-4`;
      case 'sidebar-left':
      case 'sidebar-right':
        return `${baseStyles} mb-4`;
      case 'footer-top':
      case 'footer-bottom':
        return `${baseStyles} w-full`;
      default:
        return `${baseStyles} ${className}`;
    }
  };

  return (
    <div className={getPositionStyles(position)}>
      {filteredWidgets.map((widget: Widget) => (
        <WidgetItem key={widget.id} widget={widget} position={position} page={page} />
      ))}
    </div>
  );
}

// Individual widget item component
function WidgetItem({ widget, position, page }: { widget: Widget; position: string; page?: string }) {
  // Execute any scripts in the widget code safely
  useEffect(() => {
    try {
      const container = document.getElementById(`widget-${widget.id}`);
      if (!container) return;
      const scripts = container.querySelectorAll('script');
      scripts.forEach((script) => {
        try {
          const newScript = document.createElement('script');
          // Copy attributes
          Array.from(script.attributes).forEach((attr) => {
            newScript.setAttribute(attr.name, attr.value);
          });
          // Copy content
          if (script.src) {
            newScript.src = script.src;
          } else {
            newScript.textContent = script.textContent;
          }
          // Replace the old script with the new one
          script.parentNode?.replaceChild(newScript, script);
        } catch (err) {
          console.error(`Widget script execution error (widget ${widget.id}):`, err);
        }
      });
    } catch (err) {
      console.error(`Widget container processing error (widget ${widget.id}):`, err);
    }
  }, [widget.id, widget.code]);

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
  const isAdLike = /adsbygoogle|ad-slot|Advertisement|Affiliate|Sponsored/i.test(widget.code) || /ad|sponsor/i.test(widget.name);

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
      {widget.customCss && (
        <style>
          {`#widget-${widget.id} { ${widget.customCss} }`}
        </style>
      )}

      {isAdLike && (
        <span className="absolute top-2 right-2 z-10 text-xs px-2 py-0.5 rounded-full bg-black/50 text-white border border-white/20 select-none" aria-label="Advertisement">Ad</span>
      )}
      
      {/* Widget Content */}
      <div
        dangerouslySetInnerHTML={{ __html: widget.code }}
        className="widget-content"
      />
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