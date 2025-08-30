import Header from "@/components/header";
import Footer from "@/components/footer";
import ScrollNavigation from "@/components/scroll-navigation";
import StickyCTA from "@/components/sticky-cta";
import WhatsAppBanner from "@/components/whatsapp-banner";
import { AnnouncementBanner } from "@/components/announcement-banner";

export default function DealsHub() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <WhatsAppBanner />
      <AnnouncementBanner />
      <div className="header-spacing">
        {/* Main Deals Hub Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-rose-500 to-pink-600 bg-clip-text text-transparent mb-4">
              🔥 Deals Hub
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Hottest deals and discounts all in one place!
            </p>
          </div>

          {/* Content will be added here */}
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔥</div>
            <h2 className="text-2xl font-bold text-gray-600 dark:text-gray-400 mb-4">
              Hot Deals Coming Soon
            </h2>
            <p className="text-gray-500 dark:text-gray-500">
              We're collecting the hottest deals and discounts for you!
            </p>
          </div>
        </div>
      </div>
      <Footer />
      <ScrollNavigation />
      <StickyCTA />
    </div>
  );
}