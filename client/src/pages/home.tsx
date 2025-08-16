import Header from "@/components/header";
import Categories from "@/components/categories";
import FeaturedProducts from "@/components/featured-products";
import CardsAppsServices from "@/components/cards-apps-services";
import WhyTrustUs from "@/components/why-trust-us";
import BlogSection from "@/components/blog-section";
import VideosSection from "@/components/videos-section";
import Newsletter from "@/components/newsletter";
import Footer from "@/components/footer";
import ScrollNavigation from "@/components/scroll-navigation";
import SearchBar from "@/components/search-bar";
import HeroBannerSlider from "@/components/hero-banner-slider";
import StickyCTA from "@/components/sticky-cta";
import WhatsAppBanner from "@/components/whatsapp-banner";
import { AnnouncementBanner } from "@/components/announcement-banner";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <WhatsAppBanner />
      <AnnouncementBanner />
      <div className="header-spacing">
        <HeroBannerSlider />
        <SearchBar />
        <FeaturedProducts />
        <CardsAppsServices />
        <Categories />
        <BlogSection />
        <VideosSection />
        <WhyTrustUs />
        <Newsletter />
      </div>
      <Footer />
      <ScrollNavigation />
      <StickyCTA />
    </div>
  );
}
