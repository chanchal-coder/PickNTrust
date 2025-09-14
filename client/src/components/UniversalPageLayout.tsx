import { ReactNode } from 'react';
import { useLocation } from 'wouter';
import Footer from './footer';
import WidgetRenderer from './WidgetRenderer';
import ScrollNavigation from './scroll-navigation';

interface UniversalPageLayoutProps {
  children: ReactNode;
  pageId?: string;
  className?: string;
  showSidebar?: boolean;
  sidebarContent?: ReactNode;
  pageTitle?: string;
  showHeader?: boolean;
  showFooter?: boolean;
  showScrollNav?: boolean;
  showWhatsApp?: boolean;
  showAnnouncement?: boolean;
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
  sidebarContent,
  pageTitle,
  showHeader = true,
  showFooter = true,
  showScrollNav = true,
  showWhatsApp = true,
  showAnnouncement = true
}: UniversalPageLayoutProps) {
  const [location] = useLocation();
  const pageId = providedPageId || getPageIdentifier(location);
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 page-container">
      {/* Banner Top Widgets - Full Width Above Everything */}
      <WidgetRenderer page={pageId} position="banner-top" className="w-full" />
      
      {/* Floating Widgets */}
      <WidgetRenderer page={pageId} position="floating-top-left" />
      <WidgetRenderer page={pageId} position="floating-top-right" />
      <WidgetRenderer page={pageId} position="floating-bottom-left" />
      <WidgetRenderer page={pageId} position="floating-bottom-right" />
      
      {/* Header Top Widgets */}
      <WidgetRenderer page={pageId} position="header-top" className="w-full" />
      
      {/* Header Bottom Widgets */}
      <WidgetRenderer page={pageId} position="header-bottom" className="w-full" />
      
      {/* Content Top Widgets */}
      <WidgetRenderer page={pageId} position="content-top" className="container mx-auto px-4" />
      
      {/* Main Content Area */}
      <div>
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
            {/* Content Middle Widgets */}
            <WidgetRenderer page={pageId} position="content-middle" className="mb-6" />
            
            {children}
            
            {/* Content Bottom Widgets */}
            <WidgetRenderer page={pageId} position="content-bottom" className="mt-6" />
          </main>
          
          {/* Right Sidebar (if needed) */}
          {showSidebar && (
            <aside className="w-64 flex-shrink-0 hidden xl:block ml-6">
              <div className="sticky top-20 space-y-4">
                {/* Right Sidebar Widgets */}
                <WidgetRenderer page={pageId} position="sidebar-right" />
              </div>
            </aside>
          )}
        </div>
      </div>
      
      {/* Footer Top Widgets */}
      <WidgetRenderer page={pageId} position="footer-top" className="w-full" />
      
      {/* Main Footer */}
      {showFooter && <Footer />}
      
      {/* Footer Bottom Widgets */}
      <WidgetRenderer page={pageId} position="footer-bottom" className="w-full" />
      
      {/* Banner Bottom Widgets - Full Width Below Everything */}
      <WidgetRenderer page={pageId} position="banner-bottom" className="w-full" />
      
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