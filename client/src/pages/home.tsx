import Header from "@/components/header";

import Categories from "@/components/categories";
import FeaturedProducts from "@/components/featured-products";
import WhyTrustUs from "@/components/why-trust-us";
import BlogSection from "@/components/blog-section";
import Newsletter from "@/components/newsletter";
import Footer from "@/components/footer";
import ScrollNavigation from "@/components/scroll-navigation";
import TrustBadges from "@/components/trust-badges";
import SearchBar from "@/components/search-bar";
import StickyCtaButton from "@/components/sticky-cta-button";
import HeroBannerSlider from "@/components/hero-banner-slider";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="header-spacing">
        <HeroBannerSlider />
        <SearchBar />
        <FeaturedProducts />
        <Categories />
        <WhyTrustUs />
        <BlogSection />
        <TrustBadges />
        <Newsletter />
      </div>
      <Footer />
      <ScrollNavigation />
      <StickyCtaButton />
    </div>
  );
}
