import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import SafeWidgetRenderer from "@/components/SafeWidgetRenderer";
import Header from "@/components/header";
import ScrollNavigation from "@/components/scroll-navigation";
import Footer from "@/components/footer";
import { AnnouncementBanner } from "@/components/announcement-banner";
import Categories from "@/components/categories";
import FeaturedProducts from "@/components/featured-products";
import CardsAppsServices from "@/components/cards-apps-services";
import AppsAIApps from "@/components/apps-ai-apps";
import WhyTrustUs from "@/components/why-trust-us";
import BlogSection from "@/components/blog-section";
import VideosSection from "@/components/videos-section";
import Newsletter from "@/components/newsletter";
import SearchBar from "@/components/search-bar";
import HeroBannerSlider from "@/components/hero-banner-slider";
import TrendingProducts from "@/components/trending-products";
import PageBanner from "@/components/PageBanner";
import LocalErrorBoundary from "@/components/LocalErrorBoundary";

export default function Home() {
  const [location] = useLocation();
  const pageId = 'home';
  const isDev = import.meta.env.DEV;
  // Check if Trending has products to decide whether to show the section and More button
  const { data: trendingList = [] } = useQuery<any[]>({
    queryKey: ['/api/products/page/trending'],
    queryFn: async () => {
      const res = await fetch('/api/products/page/trending');
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-gray-950 via-slate-900 to-black">
      {/* Global Header restored */}
      <Header />
      {/* Header widgets (sandboxed to prevent overlays from breaking layout) */}
      {/* Header Top above dynamic banner */}
      <SafeWidgetRenderer page={pageId} position="header-top" />
      
      {/* Announcement Banner */}
      <AnnouncementBanner page="home" />
      {/* Header Bottom below dynamic banner */}
      <SafeWidgetRenderer page={pageId} position="header-bottom" />
      
      {/* Banner Top Widgets (inside main content flow, sandboxed) */}
      <SafeWidgetRenderer page={pageId} position="banner-top" />
      {/* Dynamic Page Banner Slider for Home */}
      <LocalErrorBoundary>
        <PageBanner page="home" />
      </LocalErrorBoundary>
      
      {/* Main Content - Subtle base with hero-only gradient */}
      <div className="header-spacing">
      <div className="relative">
        {/* Hero Section with rich gradient, overlays for depth */}
        <section className="relative bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
          <div className="pointer-events-none absolute inset-0 bg-black/20" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20" />
          <div className="relative">
            <SearchBar />
          </div>
        </section>

        {/* Rest of the content on neutral base */}
        {trendingList.length > 0 && (
          <>
            <TrendingProducts />
            {/* Right-aligned More button between sections */}
            <div className="flex justify-end px-4 sm:px-6 lg:px-8 mt-2">
              <a
                href="/trending"
                className="inline-flex items-center bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-sm font-semibold shadow-md hover:shadow-lg transition-all"
              >
                <i className="fas fa-chart-line mr-2" /> More
              </a>
            </div>
          </>
        )}
        <FeaturedProducts />
        <CardsAppsServices />
        <AppsAIApps />
        <Categories />
        <BlogSection />
        <VideosSection />
        <WhyTrustUs />
        <Newsletter />

        {/* Content Widgets as overlays (sandboxed to prevent full-page covers) */}
        <SafeWidgetRenderer page={pageId} position="content-top" />
        <SafeWidgetRenderer page={pageId} position="content-middle" />
        <SafeWidgetRenderer page={pageId} position="content-bottom" />

        {/* Floating Widgets inside overlay layer (sandboxed) */}
        {!isDev && (
          <>
            <SafeWidgetRenderer page={pageId} position="floating-top-left" />
            <SafeWidgetRenderer page={pageId} position="floating-top-right" />
            <SafeWidgetRenderer page={pageId} position="floating-bottom-left" />
            <SafeWidgetRenderer page={pageId} position="floating-bottom-right" />
          </>
        )}
      </div>
      
      {/* Banner Bottom Widgets (inside main content flow, sandboxed) */}
      <SafeWidgetRenderer page={pageId} position="banner-bottom" />
      </div>
      
      {/* Main Footer */}
      {/* Footer Top Widgets */}
      <SafeWidgetRenderer page={pageId} position="footer-top" />
      {/* Footer Bottom Widgets */}
      <SafeWidgetRenderer page={pageId} position="footer-bottom" />

      {/* Branded Footer */}
      <Footer />
      
      {/* Fixed Elements */}
      <ScrollNavigation />
    </div>
  );
}
