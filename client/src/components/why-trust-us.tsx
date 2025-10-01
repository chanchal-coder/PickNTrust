import { useEffect, useState } from "react";

export default function WhyTrustUs() {
  const defaultTestimonials = [
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

  const [testimonials, setTestimonials] = useState(defaultTestimonials);
  const [visibleTestimonials, setVisibleTestimonials] = useState(defaultTestimonials.slice(0, 3));

  // Fetch testimonials dynamically if available, otherwise use defaults
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/testimonials?limit=12', { headers: { accept: 'application/json' } });
        if (res.ok) {
          const payload: any = await res.json();
          const arr = Array.isArray(payload) ? payload : (payload?.data || payload?.items || defaultTestimonials);
          if (!cancelled && Array.isArray(arr) && arr.length) {
            setTestimonials(arr);
            setVisibleTestimonials(arr.slice(0, 3));
          }
        }
      } catch (e) {
        // silently fall back to default testimonials
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Rotate visible testimonials every few seconds to keep section dynamic/live
  useEffect(() => {
    let i = 0;
    const rotate = () => {
      const arr = testimonials;
      if (arr.length <= 3) { setVisibleTestimonials(arr); return; }
      const next = [arr[i % arr.length], arr[(i + 1) % arr.length], arr[(i + 2) % arr.length]];
      setVisibleTestimonials(next);
      i = (i + 1) % arr.length;
    };
    const id = window.setInterval(rotate, 6000);
    return () => window.clearInterval(id);
  }, [testimonials]);

  const avatarFallback = (name: string) => {
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'>`+
      `<rect width='100%' height='100%' rx='32' fill='#2563eb'/>`+
      `<text x='50%' y='55%' font-size='24' font-family='Inter,system-ui,-apple-system,Segoe UI,Roboto,sans-serif' fill='#fff' text-anchor='middle'>${initials}</text>`+
      `</svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  };

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
          <div className="relative inline-block">
            <h2 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 bg-clip-text text-transparent mb-4 relative leading-tight">
              Why Trust Us?
              <div className="absolute -top-2 -right-8 text-xl animate-pulse"><i className="fas fa-shield-alt"></i></div>
            </h2>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 font-medium">
            <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent"><i className="fas fa-sparkles"></i> Here's why thousands of shoppers choose PickNTrust <i className="fas fa-sparkles"></i></span>
          </p>
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

        {/* Trust Badges - Colorful Design */}
        <div className="mb-16">
          <div className="flex flex-wrap justify-center items-center gap-8">
            {/* 100% Affiliate Transparency */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6 shadow-xl border-2 border-blue-300 min-w-[200px] transform hover:scale-105 transition-all duration-300">
              <div className="text-white text-4xl mb-3 text-center">
                <i className="fas fa-shield-check drop-shadow-lg"></i>
              </div>
              <h3 className="font-bold text-white text-lg text-center mb-2">100% Transparent</h3>
              <p className="text-blue-100 text-sm text-center font-medium">Affiliate Links Disclosed</p>
            </div>

            {/* Verified Reviews */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6 shadow-xl border-2 border-green-300 min-w-[200px] transform hover:scale-105 transition-all duration-300">
              <div className="text-white text-4xl mb-3 text-center">
                <i className="fas fa-star drop-shadow-lg"></i>
              </div>
              <h3 className="font-bold text-white text-lg text-center mb-2">4.8/5 Rating</h3>
              <p className="text-green-100 text-sm text-center font-medium">From 10,000+ Reviews</p>
            </div>

            {/* Best Price Guarantee */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6 shadow-xl border-2 border-purple-300 min-w-[200px] transform hover:scale-105 transition-all duration-300">
              <div className="text-white text-4xl mb-3 text-center">
                <i className="fas fa-money-bill-wave drop-shadow-lg"></i>
              </div>
              <h3 className="font-bold text-white text-lg text-center mb-2">Best Price</h3>
              <p className="text-purple-100 text-sm text-center font-medium">Guarantee Promise</p>
            </div>

            {/* Secure Shopping */}
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl p-6 shadow-xl border-2 border-orange-300 min-w-[200px] transform hover:scale-105 transition-all duration-300">
              <div className="text-white text-4xl mb-3 text-center">
                <i className="fas fa-lock drop-shadow-lg"></i>
              </div>
              <h3 className="font-bold text-white text-lg text-center mb-2">Secure Links</h3>
              <p className="text-orange-100 text-sm text-center font-medium">SSL Protected Shopping</p>
            </div>
          </div>
        </div>

        {/* Customer Testimonials - Colorful Design */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <h3 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-pink-600 via-rose-600 to-red-600 bg-clip-text text-transparent mb-4 relative leading-tight">
                What Our Customers Say
                <div className="absolute -top-1 -right-6 text-xl animate-pulse"><i className="fas fa-comment"></i></div>
              </h3>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {visibleTestimonials.map((testimonial, index) => {
              const gradients = [
                "bg-gradient-to-br from-pink-400 to-pink-500",
                "bg-gradient-to-br from-indigo-400 to-indigo-500", 
                "bg-gradient-to-br from-teal-400 to-teal-500"
              ];
              const borderColors = [
                "border-pink-300",
                "border-indigo-300",
                "border-teal-300"
              ];
              return (
                <div key={testimonial.id ?? `${testimonial.name}-${index}`} className={`${gradients[index % gradients.length]} text-white rounded-xl p-6 shadow-xl border-2 ${borderColors[index % borderColors.length]} transform hover:scale-105 transition-all duration-300`}>
                  <div className="flex items-center mb-4">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full object-cover mr-3 border-2 border-white shadow-md"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = avatarFallback(testimonial.name); (e.currentTarget as HTMLImageElement).onerror = null; }}
                    />
                    <div>
                      <h4 className="font-semibold text-white">{testimonial.name}</h4>
                      <p className="text-sm text-white/80">{testimonial.location}</p>
                    </div>
                  </div>
                  <div className="flex mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <i key={i} className="fas fa-star text-yellow-300 text-lg drop-shadow-sm"></i>
                    ))}
                  </div>
                  <p className="text-white/95 text-sm font-medium">"{testimonial.comment}"</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Partner Brands */}
        <div className="text-center mb-12">
          <div className="relative inline-block mb-6">
            <h3 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent relative leading-tight">
              Our Amazing Partners
              <div className="absolute -top-1 -right-6 text-xl animate-pulse">🤝</div>
            </h3>
          </div>
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
