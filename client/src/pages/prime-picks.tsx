import Header from "@/components/header";
import Footer from "@/components/footer";
import ScrollNavigation from "@/components/scroll-navigation";
import StickyCTA from "@/components/sticky-cta";
import WhatsAppBanner from "@/components/whatsapp-banner";
import { AnnouncementBanner } from "@/components/announcement-banner";

export default function PrimePicks() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <WhatsAppBanner />
      <AnnouncementBanner />
      <div className="header-spacing">
        {/* Main Prime Picks Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-indigo-700 bg-clip-text text-transparent mb-4">
              <i className="fas fa-crown mr-3"></i>Prime Picks
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Premium quality products handpicked for excellence!
            </p>
          </div>

          {/* Content will be added here */}
          <div className="text-center py-16">
            <div className="text-6xl mb-4"><i className="fas fa-crown text-purple-600"></i></div>
            <h2 className="text-2xl font-bold text-gray-600 dark:text-gray-400 mb-4">
              Premium Products Coming Soon
            </h2>
            <p className="text-gray-500 dark:text-gray-500">
              We're curating the finest premium products for you!
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