import Header from "@/components/header";
import Categories from "@/components/categories";
import FeaturedProducts from "@/components/featured-products";
import WhyTrustUs from "@/components/why-trust-us";
import BlogSection from "@/components/blog-section";
import Newsletter from "@/components/newsletter";
import Footer from "@/components/footer";
import ScrollNavigation from "@/components/scroll-navigation";
import SearchBar from "@/components/search-bar";
import HeroBannerSlider from "@/components/hero-banner-slider";
import StickyCTA from "@/components/sticky-cta";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="header-spacing">
        <HeroBannerSlider />
        <SearchBar />
        <FeaturedProducts />
        <Categories />
        <BlogSection />
        <WhyTrustUs />
        <Newsletter />
      </div>
      <Footer />
      <ScrollNavigation />
      <StickyCTA />
    </div>
  );
}
