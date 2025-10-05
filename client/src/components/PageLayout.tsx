import { ReactNode } from 'react';
import { useLocation } from 'wouter';
import Header from './header';
import Footer from './footer';
import WidgetRenderer from './WidgetRenderer';
import ScrollNavigation from './scroll-navigation';
import WhatsAppBanner from './whatsapp-banner';
import { AnnouncementBanner } from './announcement-banner';

interface PageLayoutProps {
  children: ReactNode;
  className?: string;
  showSidebar?: boolean;
  sidebarContent?: ReactNode;
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
  // This allows widgets to work with any new navigation tab created by admin
  return firstSegment;
}

export default function PageLayout({ 
  children, 
  className = '', 
  showSidebar = false, 
  sidebarContent 
}: PageLayoutProps) {
  const [location] = useLocation();
  const pageId = getPageIdentifier(location);
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Main Header */}
      <Header />
      
      {/* Header Widgets placed around the banner area */}
      <div className="header-widgets">
        {/* Header Top should be above the banner */}
        <WidgetRenderer page={pageId} position="header-top" />
        {/* Optional header middle slot near main header */}
        <WidgetRenderer page={pageId} position="header" />
      </div>

      {/* Announcement Banner */}
      <AnnouncementBanner />

      {/* Banner Widgets */}
      <div className="banner-widgets">
        <WidgetRenderer page={pageId} position="banner-top" className="container mx-auto px-4" />
        <WidgetRenderer page={pageId} position="banner-bottom" className="container mx-auto px-4" />
      </div>
      
      {/* Header Bottom should be below the banner */}
      <div className="header-widgets">
        <WidgetRenderer page={pageId} position="header-bottom" />
      </div>
      
      {/* Content Top Widgets are rendered inside the main content container below */}
      
      {/* Main Content Area with tighter spacing */}
      <div className="pt-8">
        <div className={"w-full px-0"}>
        {/* Overlay Sidebars (do not affect layout width) */}
        {showSidebar && (
          <div className="hidden lg:block">
            <div className="fixed top-20 left-4 z-40">
              <WidgetRenderer page={pageId} position="sidebar-left" />
            </div>
          </div>
        )}
        {showSidebar && (
          <div className="hidden md:block">
            <div className="fixed top-20 right-4 z-40">
              <WidgetRenderer page={pageId} position="sidebar-right" />
            </div>
          </div>
        )}
        
        {/* Main Content with overlay layer */}
        <main className={`flex-1 ${className}`}>
          <div className="relative">
            {children}
            {/* Content Widgets as overlays */}
            <WidgetRenderer page={pageId} position="content-top" />
            <WidgetRenderer page={pageId} position="content-middle" />
            <WidgetRenderer page={pageId} position="content-bottom" />
          </div>
        </main>
        </div>
      </div>
      
      {/* Content Bottom Widgets are now inside the main content container */}
      
      {/* Footer Widgets */}
      <div className="footer-widgets">
        {/* Extended Footer Slots */}
        <WidgetRenderer page={pageId} position="footer-top" />
        <WidgetRenderer page={pageId} position="footer" />
        <WidgetRenderer page={pageId} position="footer-bottom" />
      </div>
      
      {/* Main Footer */}
      <Footer />
      
      {/* Fixed Elements */}
      <ScrollNavigation />
    </div>
  );
}

// Specialized layout components for different page types
export function HomePageLayout({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <PageLayout className={className} showSidebar={true}>
      {children}
    </PageLayout>
  );
}

export function CategoryPageLayout({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <PageLayout className={className} showSidebar={true}>
      {children}
    </PageLayout>
  );
}

export function BlogPageLayout({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <PageLayout className={className} showSidebar={true}>
      {children}
    </PageLayout>
  );
}

export function SimplePageLayout({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <PageLayout className={className} showSidebar={false}>
      {children}
    </PageLayout>
  );
}

// Hook to get current page identifier
export function useCurrentPage(): string {
  const [location] = useLocation();
  return getPageIdentifier(location);
}