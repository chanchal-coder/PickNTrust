export default function WhyTrustUs() {
  const testimonials = [
    {
      id: 1,
      name: "Priya Sharma",
      location: "Mumbai",
      rating: 5,
      comment: "Amazing deals and genuine products! Saved over ₹15,000 on my smartphone purchase.",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b047?ixlib=rb-4.0.3&w=64&h=64&fit=crop&crop=face"
    },
    {
      id: 2,
      name: "Raj Patel",
      location: "Delhi",
      rating: 5,
      comment: "Transparent affiliate links and honest reviews. Trust PickNTrust for all my online shopping!",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&w=64&h=64&fit=crop&crop=face"
    },
    {
      id: 3,
      name: "Sneha Gupta",
      location: "Bangalore",
      rating: 5,
      comment: "The best deals and cashback offers. Their recommendations never disappoint!",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&w=64&h=64&fit=crop&crop=face"
    }
  ];

  const partnerBrands = [
    { name: "Amazon", icon: "fab fa-amazon", color: "#FF9900" },
    { name: "Flipkart", icon: "fas fa-shopping-bag", color: "#047BD6" },
    { name: "Samsung", icon: "fas fa-mobile-alt", color: "#1428A0" },
    { name: "Apple", icon: "fab fa-apple", color: "#000000" },
    { name: "Xiaomi", icon: "fas fa-mobile", color: "#FF6900" },
    { name: "OnePlus", icon: "fas fa-plus", color: "#EB0028" },
    { name: "Google", icon: "fab fa-google", color: "#4285F4" },
    { name: "Microsoft", icon: "fab fa-microsoft", color: "#00A1F1" }
  ];

  return (
    <section id="why-trust-us" className="py-16 bg-white dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Heading */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-navy dark:text-blue-400 mb-4">Why Trust Us</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">Here's why thousands of shoppers choose PickNTrust for their shopping needs</p>
        </div>
        
        {/* Core Trust Pillars */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="text-center p-8 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-800 dark:to-blue-700 rounded-3xl">
            <div className="w-20 h-20 bg-bright-blue rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-search text-white text-2xl"></i>
            </div>
            <h4 className="text-xl font-bold text-navy dark:text-blue-400 mb-4">We Do The Research</h4>
            <p className="text-gray-600 dark:text-gray-300">No more endless scrolling! Our team tests and reviews products so you don't have to. We only recommend stuff we'd buy ourselves!</p>
          </div>
          
          <div className="text-center p-8 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 rounded-3xl">
            <div className="w-20 h-20 bg-accent-green rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-shield-alt text-white text-2xl"></i>
            </div>
            <h4 className="text-xl font-bold text-navy dark:text-blue-400 mb-4">Safe & Secure</h4>
            <p className="text-gray-600 dark:text-gray-300">We partner only with trusted retailers and brands. Plus, we're transparent about our affiliate relationships - no sneaky business here!</p>
          </div>
          
          <div className="text-center p-8 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800 rounded-3xl">
            <div className="w-20 h-20 bg-accent-orange rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-heart text-white text-2xl"></i>
            </div>
            <h4 className="text-xl font-bold text-navy dark:text-blue-400 mb-4">Made With Love</h4>
            <p className="text-gray-600 dark:text-gray-300">We're real people who love finding great deals! Our community of happy shoppers grows every day, and we love being part of your shopping journey!</p>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mb-16">
          <div className="flex flex-wrap justify-center items-center gap-8">
            {/* 100% Affiliate Transparency */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-blue-200 dark:border-blue-700 min-w-[200px]">
              <div className="text-blue-600 dark:text-blue-400 text-3xl mb-2 text-center">
                <i className="fas fa-shield-check"></i>
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg text-center">100% Transparent</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm text-center">Affiliate Links Disclosed</p>
            </div>

            {/* Verified Reviews */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-green-200 dark:border-green-700 min-w-[200px]">
              <div className="text-green-600 dark:text-green-400 text-3xl mb-2 text-center">
                <i className="fas fa-star"></i>
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg text-center">4.8/5 Rating</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm text-center">From 10,000+ Reviews</p>
            </div>

            {/* Money Back Guarantee */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-purple-200 dark:border-purple-700 min-w-[200px]">
              <div className="text-purple-600 dark:text-purple-400 text-3xl mb-2 text-center">
                <i className="fas fa-money-bill-wave"></i>
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg text-center">Best Price</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm text-center">Guarantee Promise</p>
            </div>

            {/* Secure Shopping */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-orange-200 dark:border-orange-700 min-w-[200px]">
              <div className="text-orange-600 dark:text-orange-400 text-3xl mb-2 text-center">
                <i className="fas fa-lock"></i>
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg text-center">Secure Links</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm text-center">SSL Protected Shopping</p>
            </div>
          </div>
        </div>

        {/* Customer Testimonials */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-center text-navy dark:text-blue-400 mb-8">What Our Customers Say</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="bg-gradient-to-br from-gray-50 to-gray-100 dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center mb-4">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover mr-3"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{testimonial.name}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{testimonial.location}</p>
                  </div>
                </div>
                <div className="flex mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <i key={i} className="fas fa-star text-yellow-400 text-sm"></i>
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm italic">"{testimonial.comment}"</p>
              </div>
            ))}
          </div>
        </div>

        {/* Partner Brands */}
        <div className="text-center mb-12">
          <h3 className="text-xl font-semibold text-navy dark:text-blue-400 mb-6">Trusted Partner Brands</h3>
          <div className="flex flex-wrap justify-center items-center gap-6 opacity-80 hover:opacity-100 transition-opacity">
            {partnerBrands.map((brand) => (
              <div key={brand.name} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all transform hover:scale-105 min-w-[120px] text-center">
                <i 
                  className={`${brand.icon} text-3xl mb-2`}
                  style={{ color: brand.color }}
                ></i>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{brand.name}</p>
              </div>
            ))}
          </div>
        </div>
        
        {/* Call to Action */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-gold to-yellow-400 rounded-2xl p-8 inline-block">
            <h4 className="text-2xl font-bold text-navy mb-2">Join 50,000+ Happy Shoppers!</h4>
            <p className="text-navy">Ready to discover your next favorite product?</p>
          </div>
        </div>
      </div>
    </section>
  );
}
