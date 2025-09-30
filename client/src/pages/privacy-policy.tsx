import Header from '@/components/header';
import UniversalPageLayout from '@/components/UniversalPageLayout';

export default function PrivacyPolicyPage() {
  return (
    <UniversalPageLayout pageId="privacy-policy">
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header />
            <div className="header-spacing">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <h1 className="text-4xl font-bold text-navy dark:text-blue-400 mb-8">Privacy Policy</h1>
                
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-lg space-y-8">
                  <section>
                    <h2 className="text-2xl font-bold text-navy dark:text-blue-400 mb-4">Information We Collect</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      At PickNTrust, we collect information to provide better services to our users. We collect:
                    </p>
                    <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                      <li>Email addresses when you subscribe to our newsletter</li>
                      <li>Usage data to improve our product recommendations</li>
                      <li>Cookies to enhance your browsing experience</li>
                      <li>Device information for website optimization</li>
                    </ul>
                  </section>
      
                  <section>
                    <h2 className="text-2xl font-bold text-navy dark:text-blue-400 mb-4">How We Use Your Information</h2>
                    <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                      <li>To send you our weekly newsletter with curated deals</li>
                      <li>To track affiliate link performance and commissions</li>
                      <li>To improve our website and user experience</li>
                      <li>To analyze trends and optimize our product recommendations</li>
                    </ul>
                  </section>
      
                  <section>
                    <h2 className="text-2xl font-bold text-navy dark:text-blue-400 mb-4">Affiliate Partnerships</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      PickNTrust participates in affiliate marketing programs. When you click our affiliate links and make purchases, 
                      we may earn a commission at no extra cost to you. This helps us keep our service free.
                    </p>
                  </section>
      
                  <section>
                    <h2 className="text-2xl font-bold text-navy dark:text-blue-400 mb-4">Data Security</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      We implement appropriate security measures to protect your personal information against unauthorized access, 
                      alteration, disclosure, or destruction.
                    </p>
                  </section>
      
                  <section>
                    <h2 className="text-2xl font-bold text-navy dark:text-blue-400 mb-4">Third-Party Services</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      Our website may contain links to external sites. We are not responsible for the privacy practices of these sites. 
                      We encourage you to read their privacy policies.
                    </p>
                  </section>
      
                  <section>
                    <h2 className="text-2xl font-bold text-navy dark:text-blue-400 mb-4">Your Rights</h2>
                    <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                      <li>Request access to your personal data</li>
                      <li>Request correction of inaccurate data</li>
                      <li>Request deletion of your data</li>
                      <li>Unsubscribe from our newsletter at any time</li>
                    </ul>
                  </section>
      
                  <section>
                    <h2 className="text-2xl font-bold text-navy dark:text-blue-400 mb-4">Contact Us</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      If you have questions about this Privacy Policy, please contact us at:
                    </p>
                    <p className="text-gray-600 dark:text-gray-300">
                      Email: <a href="mailto:contact@pickntrust.com" className="text-bright-blue hover:underline">contact@pickntrust.com</a>
                    </p>
                  </section>
      
                  <section>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Last updated: January 2025
                    </p>
                  </section>
                </div>
              </div>
            </div>
          </div>
    </UniversalPageLayout>
  );
}