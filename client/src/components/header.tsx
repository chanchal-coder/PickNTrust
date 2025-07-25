import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ThemeToggle } from "@/components/theme-toggle";
import { useWishlist } from "@/hooks/use-wishlist";
import { useToast } from "@/hooks/use-toast";
import logoImage from "@assets/Logoo_1753451593641.png";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const { wishlistCount } = useWishlist();
  const { toast } = useToast();
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');

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

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === 'pickntrust2025') {
      localStorage.setItem('pickntrust-admin-session', 'active');
      setIsAdmin(true);
      setShowAdminLogin(false);
      setAdminPassword('');
      toast({
        title: 'Admin Login Successful!',
        description: 'You now have admin access across all pages.',
      });
      // Trigger storage event for other components
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'pickntrust-admin-session',
        newValue: 'active'
      }));
    } else {
      toast({
        title: 'Invalid Password',
        description: 'Please enter the correct admin password.',
        variant: 'destructive',
      });
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('pickntrust-admin-session');
    setIsAdmin(false);
    toast({
      title: 'Logged Out',
      description: 'Admin session ended.',
    });
    // Trigger storage event for other components
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'pickntrust-admin-session',
      newValue: null
    }));
  };

  return (
    <header className="bg-white dark:bg-gray-900 shadow-lg sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        {/* Main Header Row */}
        <div className="flex justify-between items-center py-2 sm:py-3">
          {/* Logo in Corner with hidden admin access */}
          <div className="flex-shrink-0 relative">
            <Link href="/" className="hover:opacity-80 transition-opacity">
              <img 
                src={logoImage} 
                alt="PickNTrust Logo" 
                className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
              />
            </Link>
            {/* Hidden admin access dot */}
            {!isAdmin && (
              <button
                onClick={() => setShowAdminLogin(true)}
                className="absolute -bottom-1 -right-1 w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full opacity-30 hover:opacity-100 transition-opacity"
                title="Admin"
              />
            )}
          </div>

          {/* Centered Brand Name & Slogan */}
          <Link href="/" className="flex-1 flex flex-col items-center hover:opacity-80 transition-opacity">
            <h1 className="text-xl sm:text-3xl font-bold cursor-pointer">
              <span className="text-navy dark:text-blue-400">Pick</span>
              <span className="text-gold dark:text-yellow-400">N</span>
              <span className="text-navy dark:text-blue-400">Trust</span>
            </h1>
            <p className="text-gold dark:text-yellow-400 text-xs sm:text-sm">Pick. Click. Trust.</p>
          </Link>

          {/* Admin indicator for corner balance */}
          <div className="w-8 sm:w-10 flex justify-end">
            {isAdmin && (
              <Link 
                href="/admin" 
                className="text-red-500 hover:text-red-600 transition-colors"
                title="Admin Panel"
              >
                <i className="fas fa-cog text-sm"></i>
              </Link>
            )}
          </div>
        </div>

        {/* Centered Navigation Row */}
        <div className="flex justify-center items-center space-x-6 pb-2 sm:pb-3 border-t border-gray-100 dark:border-gray-800 pt-2">
          {/* Home link */}
          <Link 
            href="/" 
            className="text-gray-600 dark:text-gray-300 hover:text-navy dark:hover:text-blue-400 transition-colors flex items-center space-x-1"
            title="Home"
          >
            <i className="fas fa-home text-sm sm:text-base"></i>
            <span className="text-sm font-medium">Home</span>
          </Link>
          
          {/* Wishlist link */}
          <Link 
            href="/wishlist" 
            className="text-gray-600 dark:text-gray-300 hover:text-navy dark:hover:text-blue-400 transition-colors flex items-center space-x-1 relative"
            title="Wishlist"
          >
            <i className="fas fa-heart text-sm sm:text-base"></i>
            <span className="text-sm font-medium">Wishlist</span>
            {wishlistCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                {wishlistCount > 9 ? '9+' : wishlistCount}
              </span>
            )}
          </Link>
          
          {/* Theme Toggle */}
          <div className="flex items-center">
            <ThemeToggle />
          </div>
          
          {/* Hamburger Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-gray-600 dark:text-gray-300 hover:text-navy dark:hover:text-blue-400 transition-colors flex items-center space-x-1"
            aria-label="Menu"
          >
            <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'} text-sm sm:text-base`}></i>
            <span className="text-sm font-medium">Menu</span>
          </button>
        </div>



        {/* Admin Login Modal - appears when dot is clicked */}
        {showAdminLogin && !isAdmin && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-sm w-full mx-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Admin Access</h3>
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  autoFocus
                />
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    className="flex-1 bg-navy dark:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAdminLogin(false);
                      setAdminPassword('');
                    }}
                    className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

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
              

              
              {/* Show ALL categories in hamburger menu - PERSISTENT (no auto-close) */}
              {categories.map((category: any) => (
                <Link 
                  key={category.name}
                  href={`/category/${encodeURIComponent(category.name)}`}
                  className={`transition-colors font-medium text-left py-2 flex items-center ${
                    category.name.toLowerCase().includes('deal') 
                      ? 'text-orange-600 dark:text-orange-400 font-bold'
                      : 'text-gray-600 dark:text-gray-300 hover:text-navy dark:hover:text-blue-400'
                  }`}
                >
                  <i className={`${category.icon} text-sm mr-3 w-4`} style={{color: category.color}}></i>
                  {category.name.toLowerCase().includes('deal') ? '🔥 ' : ''}{category.name}
                </Link>
              ))}
              
              {/* Admin Controls - Only visible to authenticated admins */}
              {isAdmin && (
                <div className="border-t border-gray-200 dark:border-gray-600 mt-4 pt-4">
                  <Link 
                    href="/admin" 
                    className="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-600 transition-colors text-center block mb-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    ⚙️ Admin Dashboard
                  </Link>
                  <button
                    onClick={handleAdminLogout}
                    className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-600 transition-colors text-center"
                  >
                    🚪 Logout Admin
                  </button>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
