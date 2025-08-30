import Header from "@/components/header";
import Footer from "@/components/footer";
import ScrollNavigation from "@/components/scroll-navigation";
import StickyCTA from "@/components/sticky-cta";
import WhatsAppBanner from "@/components/whatsapp-banner";
import { AnnouncementBanner } from "@/components/announcement-banner";

export default function LootBox() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <WhatsAppBanner />
      <AnnouncementBanner />
      <div className="header-spacing">
        {/* Main Loot Box Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent mb-4">
              🎁 Loot Box
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Amazing products at unbeatable low prices!
            </p>
          </div>

          {/* Content will be added here */}
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-bold text-gray-600 dark:text-gray-400 mb-4">
              Products Coming Soon
            </h2>
            <p className="text-gray-500 dark:text-gray-500">
              We're preparing amazing low-priced products for you!
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