import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ThemeToggle } from "@/components/theme-toggle";
import { useWishlist } from "@/hooks/use-wishlist";
import { useToast } from "@/hooks/use-toast";
import BrandLogo from "@/components/brand-logo";

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

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: adminPassword }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
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
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Login Failed',
        description: 'Unable to connect to server. Please try again.',
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
            <Link href="/" className="hover:opacity-80 transition-all duration-300 hover:scale-110">
              <BrandLogo className="w-10 h-10 sm:w-12 sm:h-12" />
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

          {/* Centered Brand Name & Slogan - Beautiful Design */}
          <Link href="/" className="flex-1 flex flex-col items-center hover:opacity-90 transition-all duration-300 group">
            <div className="relative">
              <h1 className="text-2xl sm:text-4xl font-black cursor-pointer bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
                <span className="relative">
                  Pick
                  <span className="absolute -top-1 -right-1 text-xs">✨</span>
                </span>
                <span className="mx-1 text-amber-500 dark:text-yellow-400 text-shadow">N</span>
                <span className="relative">
                  Trust
                  <span className="absolute -top-1 -right-1 text-xs">🛡️</span>
                </span>
              </h1>
              {/* Subtle underline effect */}
              <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <div className="mt-1 relative">
              <p className="text-sm sm:text-base font-semibold bg-gradient-to-r from-amber-600 to-orange-600 dark:from-yellow-400 dark:to-orange-400 bg-clip-text text-transparent">
                ✨ Pick. Click. Trust. Shop Smart. ✨
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 italic">
                "Your trusted shopping companion"
              </p>
            </div>
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

        {/* Centered Navigation Row - Stylish Design */}
        <div className="flex justify-center items-center space-x-3 sm:space-x-6 pb-2 sm:pb-3 border-t border-gray-100 dark:border-gray-800 pt-2">
          {/* Home link - Stylish */}
          <Link 
            href="/" 
            className="group relative bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2"
            title="Home"
          >
            <i className="fas fa-home text-sm group-hover:rotate-12 transition-transform"></i>
            <span className="text-sm font-semibold">Home</span>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-full transition-opacity"></div>
          </Link>
          
          {/* Wishlist link - Stylish */}
          <Link 
            href="/wishlist" 
            className="group relative bg-gradient-to-r from-pink-500 to-red-600 hover:from-pink-600 hover:to-red-700 text-white px-4 py-2 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2"
            title="Wishlist"
          >
            <i className="fas fa-heart text-sm group-hover:scale-125 transition-transform text-pink-100"></i>
            <span className="text-sm font-semibold">Wishlist</span>
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-yellow-400 text-red-800 text-xs rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shadow-md animate-bounce">
                {wishlistCount > 9 ? '9+' : wishlistCount}
              </span>
            )}
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-full transition-opacity"></div>
          </Link>
          
          {/* Theme Toggle - Enhanced */}
          <div className="relative bg-gradient-to-r from-indigo-500 to-cyan-600 hover:from-indigo-600 hover:to-cyan-700 rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <ThemeToggle />
          </div>

          {/* Header CTA Button - Sober Design */}
          <HeaderCtaButton />
          
          {/* Hamburger Menu Button - Stylish */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="group relative bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-2 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2"
            aria-label="Menu"
          >
            <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'} text-sm group-hover:rotate-180 transition-transform duration-300`}></i>
            <span className="text-sm font-semibold">Menu</span>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-full transition-opacity"></div>
          </button>
        </div>

        {/* Social Proof Bar - Full Original Version in Header */}
        <HeaderSocialProofBar />

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

// Full Social Proof Bar for Header (original styling)
function HeaderSocialProofBar() {
  const [currentUsers, setCurrentUsers] = useState(3500);
  const [recentPurchases, setRecentPurchases] = useState([
    { name: "Priya from Mumbai", product: "iPhone 15 Pro", time: "2 min ago" },
    { name: "Raj from Delhi", product: "Samsung TV", time: "5 min ago" },
    { name: "Sneha from Bangalore", product: "Laptop", time: "8 min ago" },
    { name: "Amit from Pune", product: "Headphones", time: "12 min ago" },
    { name: "Maya from Chennai", product: "Smart Watch", time: "15 min ago" }
  ]);
  const [currentPurchase, setCurrentPurchase] = useState(0);

  // Simulate live user count updates
  useEffect(() => {
    const userInterval = setInterval(() => {
      setCurrentUsers(prev => {
        const change = Math.floor(Math.random() * 21) - 10; // Random change between -10 and +10
        const newCount = Math.max(3200, Math.min(4200, prev + change)); // Keep between 3200-4200
        return newCount;
      });
    }, 8000);

    return () => clearInterval(userInterval);
  }, []);

  // Cycle through recent purchases
  useEffect(() => {
    const purchaseInterval = setInterval(() => {
      setCurrentPurchase(prev => (prev + 1) % recentPurchases.length);
    }, 4000);

    return () => clearInterval(purchaseInterval);
  }, [recentPurchases.length]);

  return (
    <section className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 py-4 border-y border-green-200 dark:border-green-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-3 md:space-y-0">
          
          {/* Live User Count */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
              </div>
              <span className="text-green-700 dark:text-green-400 font-semibold">
                <i className="fas fa-users mr-1"></i>
                {currentUsers.toLocaleString()}+ happy shoppers browsing now
              </span>
            </div>
          </div>

          {/* Recent Purchase Alert */}
          <div className="flex items-center space-x-3 bg-white/60 dark:bg-gray-800/60 px-4 py-2 rounded-full shadow-sm">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
            <span className="text-gray-700 dark:text-gray-300 text-sm">
              <strong>{recentPurchases[currentPurchase].name}</strong> just bought{" "}
              <strong>{recentPurchases[currentPurchase].product}</strong>{" "}
              <span className="text-gray-500 dark:text-gray-400">
                {recentPurchases[currentPurchase].time}
              </span>
            </span>
          </div>

          {/* Trust Indicators */}
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1 text-blue-600 dark:text-blue-400">
              <i className="fas fa-shield-alt"></i>
              <span className="font-medium">Secure</span>
            </div>
            <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
              <i className="fas fa-truck"></i>
              <span className="font-medium">Fast Delivery</span>
            </div>
            <div className="flex items-center space-x-1 text-purple-600 dark:text-purple-400">
              <i className="fas fa-star"></i>
              <span className="font-medium">4.8/5 Rating</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Sober Header CTA Button Component
function HeaderCtaButton() {
  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 45,
    seconds: 30
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let { hours, minutes, seconds } = prev;
        
        if (seconds > 0) {
          seconds--;
        } else if (minutes > 0) {
          minutes--;
          seconds = 59;
        } else if (hours > 0) {
          hours--;
          minutes = 59;
          seconds = 59;
        } else {
          // Reset timer
          hours = 23;
          minutes = 59;
          seconds = 59;
        }
        
        return { hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="hidden lg:flex items-center bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer">
      <div className="flex items-center space-x-3">
        <div className="text-center">
          <div className="text-xs font-medium opacity-90">Deal Ends In</div>
          <div className="text-sm font-bold">
            {String(timeLeft.hours).padStart(2, '0')}:
            {String(timeLeft.minutes).padStart(2, '0')}:
            {String(timeLeft.seconds).padStart(2, '0')}
          </div>
        </div>
        <div className="h-6 w-px bg-white/30"></div>
        <div className="flex items-center space-x-1">
          <i className="fas fa-shopping-bag text-sm"></i>
          <span className="text-sm font-semibold">Shop Now</span>
        </div>
      </div>
    </div>
  );
}
