import { useState } from "react";
import logoImage from "@assets/ChatGPT Image Jul 23, 2025, 11_34_10 PM_1753298844179.png";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <img 
              src={logoImage} 
              alt="PickNTrust Logo" 
              className="w-12 h-12 object-contain"
            />
            <div>
              <h1 className="text-2xl font-bold">
                <span className="navy">Pick</span>
                <span className="gold">N</span>
                <span className="navy">Trust</span>
              </h1>
              <p className="gold text-xs">Pick. Click. Trust.</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <button 
              onClick={() => scrollToSection('tech')} 
              className="text-gray-600 hover:text-navy transition-colors font-medium"
            >
              Tech
            </button>
            <button 
              onClick={() => scrollToSection('home')} 
              className="text-gray-600 hover:text-navy transition-colors font-medium"
            >
              Home
            </button>
            <button 
              onClick={() => scrollToSection('beauty')} 
              className="text-gray-600 hover:text-navy transition-colors font-medium"
            >
              Beauty
            </button>
            <button 
              onClick={() => scrollToSection('fashion')} 
              className="text-gray-600 hover:text-navy transition-colors font-medium"
            >
              Fashion
            </button>
            <button 
              onClick={() => scrollToSection('deals')} 
              className="accent-orange hover:text-orange-600 transition-colors font-bold"
            >
              🔥 Deals
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-gray-600 hover:text-navy"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <i className="fas fa-bars text-xl"></i>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4">
            <nav className="flex flex-col space-y-4">
              <button 
                onClick={() => scrollToSection('tech')} 
                className="text-gray-600 hover:text-navy transition-colors font-medium text-left"
              >
                Tech
              </button>
              <button 
                onClick={() => scrollToSection('home')} 
                className="text-gray-600 hover:text-navy transition-colors font-medium text-left"
              >
                Home
              </button>
              <button 
                onClick={() => scrollToSection('beauty')} 
                className="text-gray-600 hover:text-navy transition-colors font-medium text-left"
              >
                Beauty
              </button>
              <button 
                onClick={() => scrollToSection('fashion')} 
                className="text-gray-600 hover:text-navy transition-colors font-medium text-left"
              >
                Fashion
              </button>
              <button 
                onClick={() => scrollToSection('deals')} 
                className="accent-orange hover:text-orange-600 transition-colors font-bold text-left"
              >
                🔥 Deals
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
