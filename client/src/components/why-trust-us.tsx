export default function WhyTrustUs() {
  return (
    <section id="why-trust-us" className="py-16 bg-white dark:bg-gray-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h3 className="text-4xl font-bold text-navy dark:text-blue-400 mb-4">Why Trust Us? 🤔</h3>
          <p className="text-xl text-gray-600 dark:text-gray-300">Great question! Here's why thousands of shoppers pick us...</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center p-8 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-800 dark:to-blue-700 rounded-3xl">
            <div className="w-20 h-20 bg-bright-blue rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-search text-white text-2xl"></i>
            </div>
            <h4 className="text-xl font-bold text-navy dark:text-blue-400 mb-4">We Do The Research</h4>
            <p className="text-gray-600 dark:text-gray-300">No more endless scrolling! Our team tests and reviews products so you don't have to. We only recommend stuff we'd buy ourselves! 🛍️</p>
          </div>
          
          <div className="text-center p-8 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 rounded-3xl">
            <div className="w-20 h-20 bg-accent-green rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-shield-alt text-white text-2xl"></i>
            </div>
            <h4 className="text-xl font-bold text-navy dark:text-blue-400 mb-4">Safe & Secure</h4>
            <p className="text-gray-600 dark:text-gray-300">We partner only with trusted retailers and brands. Plus, we're transparent about our affiliate relationships - no sneaky business here! 🔒</p>
          </div>
          
          <div className="text-center p-8 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800 rounded-3xl">
            <div className="w-20 h-20 bg-accent-orange rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-heart text-white text-2xl"></i>
            </div>
            <h4 className="text-xl font-bold text-navy dark:text-blue-400 mb-4">Made With Love</h4>
            <p className="text-gray-600 dark:text-gray-300">We're real people who love finding great deals! Our community of happy shoppers grows every day, and we love being part of your shopping journey! ❤️</p>
          </div>
        </div>
        
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-gold to-yellow-400 rounded-2xl p-8 inline-block">
            <h4 className="text-2xl font-bold text-navy mb-2">Join 50,000+ Happy Shoppers! 🎉</h4>
            <p className="text-navy">Ready to discover your next favorite product?</p>
          </div>
        </div>
      </div>
    </section>
  );
}
