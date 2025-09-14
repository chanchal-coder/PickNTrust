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
import WhatsAppBanner from "@/components/whatsapp-banner";

export default function Home() {
  const [location] = useLocation();
  const pageId = 'home';
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Main Header */}
      <Header />
      
      {/* Announcement Banner */}
      <AnnouncementBanner page="home" />
      
      {/* WhatsApp Banner */}
      <WhatsAppBanner />
      
      {/* Content Top Widgets */}
      <div className="content-top-widgets">
        <WidgetRenderer page={pageId} position="content-top" />
      </div>
      
      {/* Main Content - Full Width without Container Constraints */}
      <div>
        <HeroBannerSlider />
        <SearchBar />
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
