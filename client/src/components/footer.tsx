import FooterLogo from "@/components/footer-logo";
import FooterBrandText from "@/components/footer-brand-text";
import { Link, useLocation } from "wouter";

export default function Footer() {
  const [, setLocation] = useLocation();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAboutUsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setLocation('/');
    setTimeout(() => {
      const element = document.getElementById('why-trust-us');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleLinkClick = () => {
    setTimeout(scrollToTop, 100);
  };

  return (
    <footer id="footer" className="bg-navy text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-1 mb-6 group">
              <FooterLogo className="flex-shrink-0 group-hover:scale-110 transition-transform duration-300" />
              <FooterBrandText />
            </div>
            <p className="text-blue-100 text-sm mb-4">Making online shopping simple, safe, and fun. We help you discover amazing products from trusted brands.</p>
            
            {/* Social Links */}
            <div className="mb-2">
              <p className="text-blue-200 text-sm font-semibold mb-3">Follow us at:</p>
              <div className="flex flex-wrap gap-3">
                <a href="https://whatsapp.com/channel/0029Vb6osphADTODpfUO4h0C" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors group">
                  <i className="fab fa-whatsapp text-white text-lg group-hover:scale-110 transition-transform"></i>
                </a>
                <a href="https://www.facebook.com/profile.php?id=61578969445670" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors">
                  <i className="fab fa-facebook-f text-white"></i>
                </a>
                <a href="https://t.me/+m-O-S6SSpVU2NWU1" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-blue-400 rounded-full flex items-center justify-center hover:bg-blue-500 transition-colors">
                  <i className="fab fa-telegram-plane text-white"></i>
                </a>
                <a href="https://x.com/pickntrust" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-black rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors">
                  <div className="text-white text-lg font-bold">𝕏</div>
                </a>
                <a href="https://www.instagram.com/pickntrust/?hl=en" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded-full flex items-center justify-center hover:scale-110 transition-all">
                  <i className="fab fa-instagram text-white"></i>
                </a>
                <a href="https://www.youtube.com/@PickNTrust" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors">
                  <i className="fab fa-youtube text-white"></i>
                </a>
                <a href="https://www.pinterest.com/PickNTrust/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors">
                  <i className="fab fa-pinterest text-white"></i>
                </a>
              </div>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><a href="#why-trust-us" onClick={handleAboutUsClick} className="text-blue-100 hover:text-white transition-colors cursor-pointer">About Us</a></li>
              <li><Link href="/how-it-works" onClick={handleLinkClick} className="text-blue-100 hover:text-white transition-colors">How It Works</Link></li>
              <li><Link href="/advertise" onClick={handleLinkClick} className="text-blue-100 hover:text-white transition-colors">Advertise with Us</Link></li>
              <li><Link href="/privacy-policy" onClick={handleLinkClick} className="text-blue-100 hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms-of-service" onClick={handleLinkClick} className="text-blue-100 hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/affiliate-disclosure" onClick={handleLinkClick} className="text-blue-100 hover:text-white transition-colors">Affiliate Disclosure</Link></li>
            </ul>
          </div>
          
          {/* Contact */}
          <div>
            <h4 className="font-bold text-lg mb-4">Get in Touch</h4>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <i className="fas fa-phone gold"></i>
                <a href="tel:+919898892198" className="text-blue-100 hover:text-white transition-colors">+91 9898892198</a>
              </div>
              <div className="flex items-center space-x-3">
                <i className="fab fa-whatsapp gold"></i>
                <a href="https://wa.me/919898892198" target="_blank" rel="noopener noreferrer" className="text-blue-100 hover:text-white transition-colors">+91 9898892198</a>
              </div>
              <div className="flex items-center space-x-3">
                <i className="fas fa-envelope gold"></i>
                <span className="text-blue-100">contact@pickntrust.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <i className="fas fa-clock gold"></i>
                <span className="text-blue-100">Mon - Sat 9 AM-9 PM EST</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="border-t border-blue-800 mt-8 pt-8">
          <p className="text-blue-100 text-center">© 2024 PickNTrust. All rights reserved. | We may earn commission from affiliate links.</p>
          {/* Subtle Brand Attribution */}
          <p
            className="text-center mt-2 text-xs italic text-yellow-300/80"
            style={{ fontFamily: 'cursive' }}
            aria-hidden="true"
          >
            PickNTrust is a brand of Chanchal Enterprise
          </p>
        </div>
      </div>
    </footer>
  );
}
