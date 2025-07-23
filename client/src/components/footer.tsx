import logoImage from "@assets/ChatGPT Image Jul 23, 2025, 11_34_10 PM_1753298844179.png";

export default function Footer() {
  return (
    <footer className="bg-navy text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <img 
                src={logoImage} 
                alt="PickNTrust Logo" 
                className="w-12 h-12 object-contain"
              />
              <div>
                <h1 className="text-2xl font-bold">
                  <span className="text-white">Pick</span>
                  <span className="text-gold dark:text-yellow-400">N</span>
                  <span className="text-white">Trust</span>
                </h1>
                <p className="text-gold dark:text-yellow-400 text-xs">Pick. Click. Trust.</p>
              </div>
            </div>
            <p className="text-blue-100 text-lg mb-6">Making online shopping simple, safe, and fun. We're here to help you discover amazing products from trusted brands.</p>
            
            {/* Social Links */}
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 bg-bright-blue rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="#" className="w-10 h-10 bg-bright-blue rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="#" className="w-10 h-10 bg-bright-blue rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="#" className="w-10 h-10 bg-bright-blue rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors">
                <i className="fab fa-pinterest"></i>
              </a>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-blue-100 hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="text-blue-100 hover:text-white transition-colors">How It Works</a></li>
              <li><a href="#" className="text-blue-100 hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-blue-100 hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="text-blue-100 hover:text-white transition-colors">Affiliate Disclosure</a></li>
            </ul>
          </div>
          
          {/* Contact */}
          <div>
            <h4 className="font-bold text-lg mb-4">Get in Touch</h4>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <i className="fas fa-envelope gold"></i>
                <span className="text-blue-100">contact@pickntrust.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <i className="fas fa-clock gold"></i>
                <span className="text-blue-100">Mon-Fri 9AM-6PM EST</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="border-t border-blue-800 mt-8 pt-8 text-center">
          <p className="text-blue-100">© 2024 PickNTrust. All rights reserved. | We may earn commission from affiliate links.</p>
        </div>
      </div>
    </footer>
  );
}
