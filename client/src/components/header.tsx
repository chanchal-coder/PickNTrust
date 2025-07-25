import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ThemeToggle } from "@/components/theme-toggle";
import logoImage from "@assets/ChatGPT Image Jul 23, 2025, 11_34_10 PM_1753298844179.png";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);

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
                <span className="text-navy dark:text-blue-400">Pick</span>
                <span className="text-gold dark:text-yellow-400">N</span>
                <span className="text-navy dark:text-blue-400">Trust</span>
              </h1>
              <p className="text-gold dark:text-yellow-400 text-xs">Pick. Click. Trust.</p>
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

          {/* Theme Toggle and Mobile Menu */}
          <div className="flex items-center space-x-3">
            <ThemeToggle />
            {/* Discreet admin access - only visible to those who know */}
            <Link 
              href="/admin" 
              className="hidden md:block text-xs text-gray-400 hover:text-gray-600 dark:text-gray-600 dark:hover:text-gray-400 transition-colors opacity-50 hover:opacity-100"
              title="Admin Access"
            >
              •
            </Link>
            <button 
              className="text-gray-600 dark:text-gray-300 hover:text-navy dark:hover:text-blue-400"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <i className="fas fa-bars text-xl"></i>
            </button>
          </div>
        </div>

        {/* Hamburger Menu - Now for both mobile and desktop */}
        {mobileMenuOpen && (
          <div className="pb-4 max-h-96 overflow-y-auto">
            <nav className="flex flex-col space-y-3">
              <Link 
                href="/" 
                className="text-gray-600 dark:text-gray-300 hover:text-navy dark:hover:text-blue-400 transition-colors font-medium text-left py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                🏠 Home
              </Link>
              
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
