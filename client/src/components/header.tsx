import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ThemeToggle } from "@/components/theme-toggle";
import logoImage from "@assets/ChatGPT Image Jul 23, 2025, 11_34_10 PM_1753298844179.png";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-white dark:bg-gray-900 shadow-lg sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
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
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link 
              href="/category/Tech" 
              className="text-gray-600 dark:text-gray-300 hover:text-navy dark:hover:text-blue-400 transition-colors font-medium"
            >
              Tech
            </Link>
            <Link 
              href="/category/Home" 
              className="text-gray-600 dark:text-gray-300 hover:text-navy dark:hover:text-blue-400 transition-colors font-medium"
            >
              Home
            </Link>
            <Link 
              href="/category/Beauty" 
              className="text-gray-600 dark:text-gray-300 hover:text-navy dark:hover:text-blue-400 transition-colors font-medium"
            >
              Beauty
            </Link>
            <Link 
              href="/category/Fashion" 
              className="text-gray-600 dark:text-gray-300 hover:text-navy dark:hover:text-blue-400 transition-colors font-medium"
            >
              Fashion
            </Link>
            <Link 
              href="/category/Deals" 
              className="accent-orange hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 transition-colors font-bold"
            >
              🔥 Deals
            </Link>
          </nav>

          {/* Theme Toggle and Mobile Menu */}
          <div className="flex items-center space-x-3">
            <ThemeToggle />
            <button 
              className="md:hidden text-gray-600 dark:text-gray-300 hover:text-navy dark:hover:text-blue-400"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <i className="fas fa-bars text-xl"></i>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4">
            <nav className="flex flex-col space-y-4">
              <Link 
                href="/category/Tech" 
                className="text-gray-600 dark:text-gray-300 hover:text-navy dark:hover:text-blue-400 transition-colors font-medium text-left"
                onClick={() => setMobileMenuOpen(false)}
              >
                Tech
              </Link>
              <Link 
                href="/category/Home" 
                className="text-gray-600 dark:text-gray-300 hover:text-navy dark:hover:text-blue-400 transition-colors font-medium text-left"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                href="/category/Beauty" 
                className="text-gray-600 dark:text-gray-300 hover:text-navy dark:hover:text-blue-400 transition-colors font-medium text-left"
                onClick={() => setMobileMenuOpen(false)}
              >
                Beauty
              </Link>
              <Link 
                href="/category/Fashion" 
                className="text-gray-600 dark:text-gray-300 hover:text-navy dark:hover:text-blue-400 transition-colors font-medium text-left"
                onClick={() => setMobileMenuOpen(false)}
              >
                Fashion
              </Link>
              <Link 
                href="/category/Deals" 
                className="accent-orange hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 transition-colors font-bold text-left"
                onClick={() => setMobileMenuOpen(false)}
              >
                🔥 Deals
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
