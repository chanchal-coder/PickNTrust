export default function Hero() {
  const scrollToProducts = () => {
    const element = document.getElementById('featured-products');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToAbout = () => {
    const element = document.getElementById('why-trust-us');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="bg-gradient-to-br from-bright-blue to-navy text-white py-10 sm:py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
              Trusted Deals <br />
              <span className="gold">Made Simple</span>
            </h2>
            <p className="text-base sm:text-lg lg:text-xl mb-6 sm:mb-8 text-blue-100 max-w-lg mx-auto lg:mx-0">
              Discover amazing products from trusted brands. We pick, you click, and trust the savings!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
              <button 
                onClick={scrollToProducts}
                className="bg-accent-orange hover:bg-orange-600 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-full transition-all transform hover:scale-105 shadow-lg text-sm sm:text-base touch-manipulation"
              >
                Start Shopping Now
              </button>
              <button 
                onClick={scrollToAbout}
                className="border-2 border-white text-white hover:bg-white hover:text-navy font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-full transition-all text-sm sm:text-base touch-manipulation"
              >
                Learn More
              </button>
            </div>
          </div>
          <div className="flex justify-center mt-6 lg:mt-0">
            {/* Mascot Shopping Bag Character */}
            <div className="relative">
              <div className="w-64 h-64 sm:w-72 sm:h-72 lg:w-80 lg:h-80 bg-white rounded-3xl shadow-2xl flex items-center justify-center relative animate-bounce-slow">
                <div className="text-center">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 bg-gold rounded-2xl mx-auto mb-3 sm:mb-4 flex items-center justify-center shadow-lg">
                    <i className="fas fa-shopping-bag text-navy text-2xl sm:text-3xl lg:text-4xl"></i>
                  </div>
                  <div className="text-4xl sm:text-5xl lg:text-6xl mb-2"><i className="fas fa-smile"></i></div>
                  <p className="text-navy font-bold text-base sm:text-lg">Happy Shopping!</p>
                </div>
                {/* Decorative elements */}
                <div className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 w-6 h-6 sm:w-8 sm:h-8 bg-accent-green rounded-full animate-pulse"></div>
                <div className="absolute -bottom-3 -left-3 sm:-bottom-4 sm:-left-4 w-4 h-4 sm:w-6 sm:h-6 bg-accent-orange rounded-full animate-pulse delay-500"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
