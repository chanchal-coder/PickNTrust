import { ReactNode } from 'react';
import { useLocation } from 'wouter';
import Footer from './footer';
import Header from './header';
import SafeWidgetRenderer from './SafeWidgetRenderer';
import ScrollNavigation from './scroll-navigation';

interface UniversalPageLayoutProps {
  children: ReactNode;
  pageId?: string;
  className?: string;
  showSidebar?: boolean;
  showRightSidebar?: boolean;
  sidebarContent?: ReactNode;
  pageTitle?: string;
  showHeader?: boolean;
  showFooter?: boolean;
  showScrollNav?: boolean;
  showWhatsApp?: boolean;
  showAnnouncement?: boolean;
  enableContentOverlays?: boolean;
  enableFloatingOverlays?: boolean;
}

// Map URL paths to page identifiers for widgets
function getPageIdentifier(path: string): string {
  // Remove leading slash and get the first segment
  const segments = path.replace(/^\//, '').split('/');
  const firstSegment = segments[0] || 'home';
  
  // Handle empty path as home
  if (firstSegment === '' || firstSegment === 'home') {
    return 'home';
  }
  
  // For category pages, use 'categories' as the page identifier
  if (firstSegment === 'category') {
    return 'categories';
  }
  
  // For blog post pages, use 'blog' as the page identifier
  if (firstSegment === 'blog' && segments.length > 1) {
    return 'blog';
  }
  
  // Return the first segment as-is for dynamic pages
  return firstSegment;
}

export default function UniversalPageLayout({ 
  children, 
  pageId: providedPageId,
  className = '', 
  showSidebar = false, 
  showRightSidebar = true,
  sidebarContent,
  pageTitle,
  showHeader = true,
  showFooter = true,
  showScrollNav = true,
  showWhatsApp = true,
  showAnnouncement = true,
  enableContentOverlays = true,
  enableFloatingOverlays = true,
}: UniversalPageLayoutProps) {
  const [location] = useLocation();
  const pageId = providedPageId || getPageIdentifier(location);

  // Dev safe-mode flags to disable overlay widgets that may cover the page
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const isDevEnv = import.meta.env.DEV === true;
  const widgetsSafeMode = (urlParams.get('widgetsSafeMode') === '1') || (typeof window !== 'undefined' && localStorage.getItem('widgetsSafeMode') === 'true');
  const widgetsSafeModeFull = (urlParams.get('widgetsSafeModeFull') === '1') || (typeof window !== 'undefined' && localStorage.getItem('widgetsSafeModeFull') === 'true');
  const shouldRenderAnyWidgets = !(isDevEnv && widgetsSafeModeFull);
  const shouldRenderOverlayWidgets = !(isDevEnv && widgetsSafeMode);
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 page-container">
      {/* Floating Widgets moved below banner into overlay layer */}
      {/* Global Header */}
      {showHeader && <Header />}
      
      {/* Header widgets are rendered by each page around its Header component */}
      
      {/* Content Top Widgets are rendered inside the main content container below */}
      
      {/* Main Content Area */}
      <div>
        <div className={"w-full px-0"}>
          {/* Overlay Sidebars (do not affect layout width) */}
          {showSidebar && shouldRenderAnyWidgets && shouldRenderOverlayWidgets && (
            <div className="hidden lg:block">
              <div className="fixed top-20 left-4 z-40">
                <SafeWidgetRenderer page={pageId} position="sidebar-left" />
              </div>
            </div>
          )}
          {showSidebar && showRightSidebar && shouldRenderAnyWidgets && shouldRenderOverlayWidgets && (
            <div className="hidden md:block">
              <div className="fixed top-20 right-4 z-40">
                <SafeWidgetRenderer page={pageId} position="sidebar-right" />
              </div>
            </div>
          )}

          {/* Main Content */}
          <main className={`flex-1 ${className}`}>
            {/* Banner Top Widgets (inside main content flow) */}
            {shouldRenderAnyWidgets && (
              <SafeWidgetRenderer page={pageId} position="banner-top" className="w-full mb-4" />
            )}

            {/* Overlay layer below banner: absolute overlays do not take space */}
            <div className="relative">
              {/* Children occupy normal flow within this relative container */}
              {children}

              {/* Content Widgets as overlays (absolute inside relative container) */}
              {enableContentOverlays && shouldRenderAnyWidgets && shouldRenderOverlayWidgets && (
                <>
                  <SafeWidgetRenderer page={pageId} position="content-top" />
                  <SafeWidgetRenderer page={pageId} position="content-middle" />
                  <SafeWidgetRenderer page={pageId} position="content-bottom" />
                </>
              )}

              {/* Floating Widgets inside overlay layer to appear below banner */}
              {enableFloatingOverlays && shouldRenderAnyWidgets && shouldRenderOverlayWidgets && (
                <>
                  <SafeWidgetRenderer page={pageId} position="floating-top-left" />
                  <SafeWidgetRenderer page={pageId} position="floating-top-right" />
                  <SafeWidgetRenderer page={pageId} position="floating-bottom-left" />
                  <SafeWidgetRenderer page={pageId} position="floating-bottom-right" />
                </>
              )}
            </div>

            {/* Mobile fallback: show right-sidebar widgets at top of content on small screens */}
            {showSidebar && showRightSidebar && shouldRenderAnyWidgets && shouldRenderOverlayWidgets && (
              <div className="block md:hidden mb-4">
                <SafeWidgetRenderer page={pageId} position="sidebar-right" />
              </div>
            )}

            {/* Banner Bottom Widgets (inside main content flow) */}
            {shouldRenderAnyWidgets && (
              <SafeWidgetRenderer page={pageId} position="banner-bottom" className="w-full mt-6" />
            )}
          </main>
        </div>
      </div>
      
      {/* Footer Top Widgets */}
      {shouldRenderAnyWidgets && (
        <SafeWidgetRenderer page={pageId} position="footer-top" className="w-full" />
      )}
      
      {/* Main Footer */}
      {showFooter && <Footer />}
      
      {/* Footer Bottom Widgets */}
      {shouldRenderAnyWidgets && (
        <SafeWidgetRenderer page={pageId} position="footer-bottom" className="w-full" />
      )}
      
      {/* Additional Components */}
      {showScrollNav && <ScrollNavigation />}
    </div>
  );
}

// Predefined layout variants for common use cases
export function HomePageLayout({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <UniversalPageLayout 
      className={className} 
      showSidebar={false}
      showAnnouncement={true}
      showWhatsApp={true}
    >
      {children}
    </UniversalPageLayout>
  );
}

export function CategoryPageLayout({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <UniversalPageLayout 
      className={className} 
      showSidebar={true}
      showAnnouncement={true}
      showWhatsApp={true}
    >
      {children}
    </UniversalPageLayout>
  );
}

export function BlogPageLayout({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <UniversalPageLayout 
      className={className} 
      showSidebar={true}
      showAnnouncement={false}
      showWhatsApp={false}
    >
      {children}
    </UniversalPageLayout>
  );
}

export function SimplePageLayout({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <UniversalPageLayout 
      className={className} 
      showSidebar={false}
      showAnnouncement={false}
      showWhatsApp={false}
    >
      {children}
    </UniversalPageLayout>
  );
}

// Hook to get current page identifier
export function useCurrentPage(): string {
  const [location] = useLocation();
  return getPageIdentifier(location);
}

// Widget position helper
export function getAvailablePositions() {
  return [
    'header-top',
    'header-bottom', 
    'header', // legacy
    'content-top',
    'content-middle',
    'content-bottom',
    'sidebar-left',
    'sidebar-right',
    'footer-top',
    'footer-bottom',
    'floating-top-left',
    'floating-top-right',
    'floating-bottom-left',
    'floating-bottom-right',
    'banner-top',
    'banner-bottom'
  ];
}