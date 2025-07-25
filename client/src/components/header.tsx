import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ThemeToggle } from "@/components/theme-toggle";
import { useWishlist } from "@/hooks/use-wishlist";
import logoImage from "@assets/ChatGPT Image Jul 23, 2025, 11_34_10 PM_1753298844179.png";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const { wishlistCount } = useWishlist();

  // Fetch all categories dynamically
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: () => fetch('/api/categories').then(res => res.json()),
  });

  // Check admin status
  useEffect(() => {
    const adminSession = localStorage.getItem('pickntrust-admin-session');
    setIsAdmin(adminSession === 'active');

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'pickntrust-admin-session') {
        setIsAdmin(e.newValue === 'active');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-white dark:bg-gray-900 shadow-lg sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center py-2 sm:py-4">
          {/* Logo - Clickable to home */}
          <Link href="/" className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0 hover:opacity-80 transition-opacity">
            <img 
              src={logoImage} 
              alt="PickNTrust Logo" 
              className="w-8 h-8 sm:w-12 sm:h-12 object-contain"
            />
            <div>
              <h1 className="text-lg sm:text-2xl font-bold cursor-pointer">
                <span className="text-navy dark:text-blue-400">Pick</span>
                <span className="text-gold dark:text-yellow-400">N</span>
                <span className="text-navy dark:text-blue-400">Trust</span>
              </h1>
              <p className="text-gold dark:text-yellow-400 text-xs hidden sm:block">Pick. Click. Trust.</p>
            </div>
          </Link>

          {/* Admin Dashboard Link - Only visible when logged in as desktop item */}
          {isAdmin && (
            <div className="hidden md:block">
              <Link 
                href="/admin" 
                className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold hover:bg-red-600 transition-colors animate-pulse"
              >
                ⚙️ Admin
              </Link>
            </div>
          )}

          {/* Navigation Icons and Menu */}
          <div className="flex items-center space-x-1 sm:space-x-3 flex-shrink-0">
            {/* Home Icon - Always visible for easy navigation */}
            <Link 
              href="/" 
              className="text-gray-600 dark:text-gray-300 hover:text-navy dark:hover:text-blue-400 transition-colors p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Go to Homepage"
            >
              <i className="fas fa-home text-lg sm:text-xl"></i>
            </Link>

            {/* Wishlist Icon with count */}
            <Link 
              href="/wishlist" 
              className="relative text-gray-600 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              title={`Wishlist (${wishlistCount} items)`}
            >
              <i className="fas fa-heart text-lg sm:text-xl"></i>
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center font-medium">
                  {wishlistCount > 9 ? '9+' : wishlistCount}
                </span>
              )}
            </Link>
            
            <ThemeToggle />
            
            {/* Discreet admin access - only visible to those who know */}
            <Link 
              href="/admin" 
              className="hidden lg:block text-xs text-gray-400 hover:text-gray-600 dark:text-gray-600 dark:hover:text-gray-400 transition-colors opacity-50 hover:opacity-100"
              title="Admin Access"
            >
              •
            </Link>
            
            <button 
              className="text-gray-600 dark:text-gray-300 hover:text-navy dark:hover:text-blue-400 transition-colors p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              title="Open Categories Menu"
            >
              <i className="fas fa-bars text-lg sm:text-xl"></i>
            </button>
          </div>
        </div>

        {/* Hamburger Menu - Now for both mobile and desktop */}
        {mobileMenuOpen && (
          <div className="pb-2 sm:pb-4 max-h-80 sm:max-h-96 overflow-y-auto bg-gray-50 dark:bg-gray-800 rounded-lg mt-2">
            <nav className="flex flex-col space-y-1 sm:space-y-3 p-2 sm:p-4">
              <Link 
                href="/" 
                className="text-gray-600 dark:text-gray-300 hover:text-navy dark:hover:text-blue-400 transition-colors font-medium text-left py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                🏠 Home
              </Link>
              
              {/* Mobile Theme Toggle in Menu */}
              <div className="flex items-center justify-between py-2 sm:hidden">
                <span className="text-gray-600 dark:text-gray-300 font-medium">Dark Mode</span>
                <ThemeToggle />
              </div>
              
              {/* Show ALL categories in hamburger menu */}
              {categories.map((category: any) => (
                <Link 
                  key={category.name}
                  href={`/category/${encodeURIComponent(category.name)}`}
                  className={`transition-colors font-medium text-left py-2 flex items-center ${
                    category.name.toLowerCase().includes('deal') 
                      ? 'text-orange-600 dark:text-orange-400 font-bold'
                      : 'text-gray-600 dark:text-gray-300 hover:text-navy dark:hover:text-blue-400'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <i className={`${category.icon} text-sm mr-3 w-4`} style={{color: category.color}}></i>
                  {category.name.toLowerCase().includes('deal') ? '🔥 ' : ''}{category.name}
                </Link>
              ))}
              
              {/* Admin link in hamburger menu if logged in */}
              {isAdmin && (
                <Link 
                  href="/admin" 
                  className="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-600 transition-colors text-center mt-4"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  ⚙️ Admin Dashboard
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
