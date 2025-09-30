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
      {/* Header Widgets */}
      <div className="header-widgets">
        <WidgetRenderer page={pageId} position="header" />
      </div>
      
      {/* Main Header */}
      <Header />
      
      {/* Announcement Banner */}
      <AnnouncementBanner />
      
      {/* Content Top Widgets */}
      <div className="content-top-widgets">
        <WidgetRenderer page={pageId} position="content-top" className="container mx-auto px-4" />
      </div>
      
      {/* Main Content Area with proper spacing */}
      <div className="pt-20">
        <div className={`flex ${showSidebar ? 'container mx-auto px-4' : ''}`}>
        {/* Left Sidebar */}
        {showSidebar && (
          <aside className="w-64 flex-shrink-0 hidden lg:block">
            <div className="sticky top-20 space-y-4">
              {/* Left Sidebar Widgets */}
              <WidgetRenderer page={pageId} position="sidebar-left" />
              
              {/* Custom Sidebar Content */}
              {sidebarContent}
            </div>
          </aside>
        )}
        
        {/* Main Content */}
        <main className={`flex-1 ${showSidebar ? 'lg:ml-6' : ''} ${className}`}>
          {children}
        </main>
        
        {/* Right Sidebar */}
        {showSidebar && (
          <aside className="w-64 flex-shrink-0 hidden xl:block">
            <div className="sticky top-20 space-y-4 ml-6">
              {/* Right Sidebar Widgets */}
              <WidgetRenderer page={pageId} position="sidebar-right" />
            </div>
          </aside>
        )}
        </div>
      </div>
      
      {/* Content Bottom Widgets */}
      <div className="content-bottom-widgets">
        <WidgetRenderer page={pageId} position="content-bottom" className="container mx-auto px-4" />
      </div>
      
      {/* Footer Widgets */}
      <div className="footer-widgets">
        <WidgetRenderer page={pageId} position="footer" />
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