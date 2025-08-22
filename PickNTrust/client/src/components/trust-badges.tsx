export default function TrustBadges() {
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
    <section className="py-16 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Trust Badges */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Why Thousands Trust PickNTrust</h2>
          
          {/* Credibility Badges */}
          <div className="flex flex-wrap justify-center items-center gap-8 mb-12">
            {/* 100% Affiliate Transparency */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-blue-200 dark:border-blue-700 min-w-[200px]">
              <div className="text-blue-600 dark:text-blue-400 text-3xl mb-2">
                <i className="fas fa-shield-check"></i>
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">100% Transparent</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Affiliate Links Disclosed</p>
            </div>

            {/* Verified Reviews */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-green-200 dark:border-green-700 min-w-[200px]">
              <div className="text-green-600 dark:text-green-400 text-3xl mb-2">
                <i className="fas fa-star"></i>
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">4.8/5 Rating</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">From 10,000+ Reviews</p>
            </div>

            {/* Money Back Guarantee */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-purple-200 dark:border-purple-700 min-w-[200px]">
              <div className="text-purple-600 dark:text-purple-400 text-3xl mb-2">
                <i className="fas fa-money-bill-wave"></i>
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">Best Price</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Guarantee Promise</p>
            </div>

            {/* Secure Shopping */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-orange-200 dark:border-orange-700 min-w-[200px]">
              <div className="text-orange-600 dark:text-orange-400 text-3xl mb-2">
                <i className="fas fa-lock"></i>
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">Secure Links</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">SSL Protected Shopping</p>
            </div>
          </div>
        </div>

        {/* Customer Testimonials */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">What Our Customers Say</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700">
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
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">As Featured On & Partner Brands</h3>
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
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
            Trusted partnerships with leading brands and retailers
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 text-center">
          <div>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">50K+</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Happy Customers</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">₹2Cr+</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Money Saved</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">1000+</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Products Reviewed</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">24/7</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Deal Monitoring</div>
          </div>
        </div>
      </div>
    </section>
  );
}