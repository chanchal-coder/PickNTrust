import Header from '@/components/header';
import UniversalPageLayout from '@/components/UniversalPageLayout';

export default function TermsOfServicePage() {
  return (
    <UniversalPageLayout pageId="terms-of-service">
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header />
            <div className="header-spacing">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <h1 className="text-4xl font-bold text-navy dark:text-blue-400 mb-8">Terms of Service</h1>
                
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-lg space-y-8">
                  <section>
                    <h2 className="text-2xl font-bold text-navy dark:text-blue-400 mb-4">Acceptance of Terms</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      By accessing and using PickNTrust, you accept and agree to be bound by the terms and provision of this agreement.
                    </p>
                  </section>
      
                  <section>
                    <h2 className="text-2xl font-bold text-navy dark:text-blue-400 mb-4">Use of the Website</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      PickNTrust is a product discovery and affiliate marketing platform. You may use our website to:
                    </p>
                    <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                      <li>Browse product recommendations and reviews</li>
                      <li>Access affiliate links to purchase products</li>
                      <li>Subscribe to our newsletter for deals and updates</li>
                      <li>Read our blog content and guides</li>
                    </ul>
                  </section>
      
                  <section>
                    <h2 className="text-2xl font-bold text-navy dark:text-blue-400 mb-4">Affiliate Disclosure</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      PickNTrust participates in various affiliate marketing programs. This means we may earn a commission 
                      when you click our links and make purchases. This does not affect the price you pay.
                    </p>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      We only recommend products we believe will provide value to our users. Our editorial content is not 
                      influenced by affiliate partnerships.
                    </p>
                  </section>
      
                  <section>
                    <h2 className="text-2xl font-bold text-navy dark:text-blue-400 mb-4">User Responsibilities</h2>
                    <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                      <li>Provide accurate information when subscribing to our newsletter</li>
                      <li>Use the website for lawful purposes only</li>
                      <li>Respect intellectual property rights</li>
                      <li>Not attempt to gain unauthorized access to our systems</li>
                    </ul>
                  </section>
      
                  <section>
                    <h2 className="text-2xl font-bold text-navy dark:text-blue-400 mb-4">Product Information</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      We strive to provide accurate product information, but we cannot guarantee the completeness or accuracy 
                      of all product details. Prices and availability are subject to change without notice.
                    </p>
                  </section>
      
                  <section>
                    <h2 className="text-2xl font-bold text-navy dark:text-blue-400 mb-4">Third-Party Links</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      Our website contains links to third-party websites. We are not responsible for the content, privacy 
                      policies, or practices of these external sites.
                    </p>
                  </section>
      
                  <section>
                    <h2 className="text-2xl font-bold text-navy dark:text-blue-400 mb-4">Limitation of Liability</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      PickNTrust shall not be liable for any indirect, incidental, special, consequential, or punitive damages 
                      resulting from your use of our website or services.
                    </p>
                  </section>
      
                  <section>
                    <h2 className="text-2xl font-bold text-navy dark:text-blue-400 mb-4">Modifications</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      We reserve the right to modify these terms at any time. Changes will be effective immediately upon 
                      posting on our website.
                    </p>
                  </section>
      
                  <section>
                    <h2 className="text-2xl font-bold text-navy dark:text-blue-400 mb-4">Governing Law</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      These terms shall be governed by and construed in accordance with the laws of India.
                    </p>
                  </section>
      
                  <section>
                    <h2 className="text-2xl font-bold text-navy dark:text-blue-400 mb-4">Contact Information</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      For questions about these Terms of Service, contact us at:
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