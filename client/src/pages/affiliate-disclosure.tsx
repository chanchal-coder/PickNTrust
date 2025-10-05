import UniversalPageLayout from '@/components/UniversalPageLayout';
import { AnnouncementBanner } from '@/components/announcement-banner';
import PageBanner from '@/components/PageBanner';
import WidgetRenderer from '@/components/WidgetRenderer';

export default function AffiliateDisclosurePage() {
  return (
    <UniversalPageLayout pageId="affiliate-disclosure">
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <WidgetRenderer page="affiliate-disclosure" position="header-top" />
            <AnnouncementBanner />
            <PageBanner page="affiliate-disclosure" />
            <WidgetRenderer page="affiliate-disclosure" position="header-bottom" />
            
            <div className="header-spacing pb-16">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                    Affiliate Disclosure
                  </h1>
      
                  <div className="prose dark:prose-invert max-w-none">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      Transparency Notice
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                      PickNTrust operates as an affiliate marketing platform. This means we may earn 
                      commissions when you make purchases through our recommended links. We want to be 
                      completely transparent about how our platform works.
                    </p>
      
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      How Affiliate Marketing Works
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                      When you click on product links or recommendations on our website, you may be 
                      directed to retailer websites like Amazon, Flipkart, or other partner stores. 
                      If you make a purchase after clicking these links, we may receive a small 
                      commission from the retailer at no extra cost to you.
                    </p>
      
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      Our Commitment to You
                    </h2>
                    <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 mb-6 space-y-2">
                      <li>We only recommend products we believe offer genuine value</li>
                      <li>Our reviews and recommendations are based on research and user feedback</li>
                      <li>Affiliate relationships do not influence our honest opinions</li>
                      <li>We clearly mark sponsored content and paid partnerships</li>
                      <li>Your trust is more important than any commission we might earn</li>
                    </ul>
      
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      Our Affiliate Partners
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      We work with various affiliate networks and retailers, including:
                    </p>
                    <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 mb-6 space-y-1">
                      <li>Amazon Associates</li>
                      <li>Flipkart Affiliate Program</li>
                      <li>Commission Junction</li>
                      <li>ShareASale</li>
                      <li>ClickBank</li>
                      <li>Impact</li>
                      <li>Rakuten Advertising</li>
                      <li>CueLinks</li>
                      <li>VCommission</li>
                      <li>And other trusted affiliate networks</li>
                    </ul>
      
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      Price Transparency
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                      Using our affiliate links does not increase the price you pay. Retailers pay 
                      us a commission from their marketing budget, not from your purchase price. 
                      In many cases, we may even provide exclusive discount codes that save you money.
                    </p>
      
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      Questions or Concerns?
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                      If you have any questions about our affiliate relationships or how we 
                      operate, please feel free to contact us. We believe in complete transparency 
                      and are happy to address any concerns you may have.
                    </p>
      
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-8">
                      <p className="text-blue-800 dark:text-blue-200 text-sm">
                        <strong>Last Updated:</strong> January 2025<br/>
                        This disclosure is in compliance with the FTC's guidelines concerning the use of endorsements and testimonials in advertising.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
    </UniversalPageLayout>
  );
}