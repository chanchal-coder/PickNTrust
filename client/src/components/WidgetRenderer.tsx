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
        showOnDesktop: Boolean(widget.show_on_desktop)
      }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
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
        <WidgetItem key={widget.id} widget={widget} position={position} />
      ))}
    </div>
  );
}

// Individual widget item component
function WidgetItem({ widget, position }: { widget: Widget; position: string }) {
  useEffect(() => {
    // Execute any scripts in the widget code
    const container = document.getElementById(`widget-${widget.id}`);
    if (container) {
      // Extract and execute script tags
      const scripts = container.querySelectorAll('script');
      scripts.forEach((script) => {
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
      });
    }
  }, [widget.id, widget.code]);

  const containerStyle: React.CSSProperties = {
    maxWidth: widget.maxWidth || 'none',
    width: '100%',
  };

  return (
    <div
      id={`widget-${widget.id}`}
      className="widget-item mb-4"
      style={containerStyle}
      data-widget-name={widget.name}
      data-widget-position={widget.position}
    >
      {/* Custom CSS */}
      {widget.customCss && (
        <style>
          {`#widget-${widget.id} { ${widget.customCss} }`}
        </style>
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