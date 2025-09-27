import { useLocation } from 'wouter';
import Header from "@/components/header";
import Footer from "@/components/footer";
import WidgetRenderer from "@/components/WidgetRenderer";
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
      {/* Main Header */}
      <Header />
      
      {/* Announcement Banner */}
      <AnnouncementBanner page="home" />
      
      {/* Content Top Widgets */}
      <div className="content-top-widgets">
        <WidgetRenderer page={pageId} position="content-top" />
      </div>
      
      {/* Main Content - Subtle base with hero-only gradient */}
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
      </div>
      
      {/* Content Bottom Widgets */}
      <div className="content-bottom-widgets">
        <WidgetRenderer page={pageId} position="content-bottom" />
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
