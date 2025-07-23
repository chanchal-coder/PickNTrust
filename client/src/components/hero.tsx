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
    <section className="bg-gradient-to-br from-bright-blue to-navy text-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Trusted Deals <br />
              <span className="gold">Made Simple</span>
            </h2>
            <p className="text-xl mb-8 text-blue-100">
              Discover amazing products from trusted brands. We pick, you click, and trust the savings!
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={scrollToProducts}
                className="bg-accent-orange hover:bg-orange-600 text-white font-bold py-4 px-8 rounded-full transition-all transform hover:scale-105 shadow-lg"
              >
                Start Shopping Now
              </button>
              <button 
                onClick={scrollToAbout}
                className="border-2 border-white text-white hover:bg-white hover:text-navy font-bold py-4 px-8 rounded-full transition-all"
              >
                Learn More
              </button>
            </div>
          </div>
          <div className="flex justify-center">
            {/* Mascot Shopping Bag Character */}
            <div className="relative">
              <div className="w-80 h-80 bg-white rounded-3xl shadow-2xl flex items-center justify-center relative animate-bounce-slow">
                <div className="text-center">
                  <div className="w-32 h-32 bg-gold rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
                    <i className="fas fa-shopping-bag text-navy text-4xl"></i>
                  </div>
                  <div className="text-6xl mb-2">😊</div>
                  <p className="text-navy font-bold text-lg">Happy Shopping!</p>
                </div>
                {/* Decorative elements */}
                <div className="absolute -top-4 -right-4 w-8 h-8 bg-accent-green rounded-full animate-pulse"></div>
                <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-accent-orange rounded-full animate-pulse delay-500"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
