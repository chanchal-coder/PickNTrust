import Header from "@/components/header";
import UniversalPageLayout from '@/components/UniversalPageLayout';

export default function HowItWorksPage() {
  return (
    <UniversalPageLayout pageId="how-it-works">
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header />
            
            <div className="header-spacing pb-16">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                    How PickNTrust Works
                  </h1>
      
                  <div className="prose dark:prose-invert max-w-none">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      Your Trusted Product Discovery Platform
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                      PickNTrust is designed to help you discover the best products and deals across 
                      multiple retailers. Our platform combines smart technology with careful curation 
                      to bring you trusted recommendations.
                    </p>
      
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      Step-by-Step Process
                    </h2>
                    
                    <div className="space-y-6 mb-8">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                          1
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Browse Categories</h3>
                          <p className="text-gray-600 dark:text-gray-300">
                            Explore our 33+ carefully organized categories from Electronics & Gadgets to 
                            Beauty & Health, making it easy to find exactly what you're looking for.
                          </p>
                        </div>
                      </div>
      
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                          2
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Discover Products</h3>
                          <p className="text-gray-600 dark:text-gray-300">
                            View detailed product information including real pricing, authentic reviews, 
                            discount percentages, and high-quality images from trusted retailers.
                          </p>
                        </div>
                      </div>
      
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                          3
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Save to Wishlist</h3>
                          <p className="text-gray-600 dark:text-gray-300">
                            Click the heart icon on any product to save it to your wishlist. Your saved 
                            items are stored locally and persist across browser sessions.
                          </p>
                        </div>
                      </div>
      
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                          4
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Click & Shop</h3>
                          <p className="text-gray-600 dark:text-gray-300">
                            When ready to purchase, click the "Buy Now" button to be redirected to the 
                            retailer's website where you can complete your purchase securely.
                          </p>
                        </div>
                      </div>
                    </div>
      
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      Key Features
                    </h2>
                    <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 mb-6 space-y-2">
                      <li><strong>Real-time Pricing:</strong> Get current prices and discounts from multiple retailers</li>
                      <li><strong>Authentic Reviews:</strong> Access genuine customer ratings and review counts</li>
                      <li><strong>Smart Categories:</strong> Navigate through 33+ organized product categories</li>
                      <li><strong>Wishlist Management:</strong> Save and organize your favorite products</li>
                      <li><strong>Mobile Optimized:</strong> Seamless experience across all devices</li>
                      <li><strong>Dark/Light Mode:</strong> Choose your preferred viewing experience</li>
                      <li><strong>Daily Updates:</strong> Fresh products and deals added regularly</li>
                    </ul>
      
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      Our Technology
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                      PickNTrust uses advanced web scraping and data extraction technology to gather 
                      real-time product information from trusted e-commerce platforms. Our system 
                      automatically updates pricing, availability, and product details to ensure 
                      you always have the most current information.
                    </p>
      
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      Trusted Retailers
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      We partner with leading e-commerce platforms and retailers including:
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                      <div className="text-gray-600 dark:text-gray-300">• Amazon</div>
                      <div className="text-gray-600 dark:text-gray-300">• Flipkart</div>
                      <div className="text-gray-600 dark:text-gray-300">• Myntra</div>
                      <div className="text-gray-600 dark:text-gray-300">• Nykaa</div>
                      <div className="text-gray-600 dark:text-gray-300">• Ajio</div>
                      <div className="text-gray-600 dark:text-gray-300">• And many more</div>
                    </div>
      
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      Why Choose PickNTrust?
                    </h2>
                    <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 mb-6 space-y-2">
                      <li>Save time by comparing products from multiple retailers in one place</li>
                      <li>Get authentic pricing without inflated or fake discounts</li>
                      <li>Access curated recommendations based on quality and value</li>
                      <li>Enjoy a clean, ad-free browsing experience</li>
                      <li>Benefit from our commitment to transparency and honest reviews</li>
                    </ul>
      
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mt-8">
                      <p className="text-green-800 dark:text-green-200 text-sm">
                        <strong>Ready to Start?</strong> Begin exploring our categories or use the search 
                        function to find specific products. Happy shopping with PickNTrust!
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