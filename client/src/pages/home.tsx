import Header from "@/components/header";
import Hero from "@/components/hero";
import Categories from "@/components/categories";
import FeaturedProducts from "@/components/featured-products";
import WhyTrustUs from "@/components/why-trust-us";
import BlogSection from "@/components/blog-section";
import Newsletter from "@/components/newsletter";
import Footer from "@/components/footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <Hero />
      <Categories />
      <FeaturedProducts />
      <WhyTrustUs />
      <BlogSection />
      <Newsletter />
      <Footer />
    </div>
  );
}
