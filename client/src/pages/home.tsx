import { useLocation } from 'wouter';
import WidgetRenderer from "@/components/WidgetRenderer";
import Header from "@/components/header";
import ScrollNavigation from "@/components/scroll-navigation";
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

export default function Home() {
  const [location] = useLocation();
  const pageId = 'home';
  
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-gray-950 via-slate-900 to-black">
      {/* Global Header restored */}
      <Header />
      {/* Header widgets */}
      {/* Header Top above dynamic banner */}
      <WidgetRenderer page={pageId} position="header-top" />
      
      {/* Announcement Banner */}
      <AnnouncementBanner page="home" />
      {/* Header Bottom below dynamic banner */}
      <WidgetRenderer page={pageId} position="header-bottom" />
      
      {/* Banner Top Widgets (inside main content flow) */}
      <WidgetRenderer page={pageId} position="banner-top" />
      
      {/* Main Content - Subtle base with hero-only gradient */}
      <div className="header-spacing">
      <div className="relative">
        {/* Hero Section with rich gradient, overlays for depth */}
        <section className="relative bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
          <div className="pointer-events-none absolute inset-0 bg-black/20" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20" />
          <div className="relative">
            <HeroBannerSlider />
            <SearchBar />
          </div>
        </section>

        {/* Rest of the content on neutral base */}
        <FeaturedProducts />
        <CardsAppsServices />
        <AppsAIApps />
        <Categories />
        <BlogSection />
        <VideosSection />
        <WhyTrustUs />
        <Newsletter />

        {/* Content Widgets as overlays (absolute inside relative container) */}
        <WidgetRenderer page={pageId} position="content-top" />
        <WidgetRenderer page={pageId} position="content-middle" />
        <WidgetRenderer page={pageId} position="content-bottom" />

        {/* Floating Widgets inside overlay layer to appear below banner */}
        <WidgetRenderer page={pageId} position="floating-top-left" />
        <WidgetRenderer page={pageId} position="floating-top-right" />
        <WidgetRenderer page={pageId} position="floating-bottom-left" />
        <WidgetRenderer page={pageId} position="floating-bottom-right" />
      </div>
      
      {/* Banner Bottom Widgets (inside main content flow) */}
      <WidgetRenderer page={pageId} position="banner-bottom" />
      </div>
      
      {/* Main Footer */}
      {/* Footer Top Widgets */}
      <WidgetRenderer page={pageId} position="footer-top" />
      {/* Footer Bottom Widgets */}
      <WidgetRenderer page={pageId} position="footer-bottom" />
      
      {/* Fixed Elements */}
      <ScrollNavigation />
    </div>
  );
}
