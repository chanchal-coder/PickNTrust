 import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { ThemeToggle } from "@/components/theme-toggle";
import { useWishlist } from "@/hooks/use-wishlist";
import { useToast } from "@/hooks/use-toast";
import AmazingBrandLogo from "@/components/amazing-brand-logo";
import CenteredBrandText from "@/components/centered-brand-text";
import { GenderSelectionPopup } from "@/components/gender-selection-popup";

// Use the same predefined categories as the main categories component
const predefinedCategories = [
  // Row 1
  { id: 1, name: "Electronics & Gadgets", description: "Latest Tech & Electronics", icon: "⚙️", color: "#6366F1" },
  { id: 2, name: "Mobiles & Accessories", description: "Smartphones & Mobile Gear", icon: "📱", color: "#8B5CF6" },
  { id: 3, name: "Computers & Laptops", description: "Computing Solutions", icon: "💻", color: "#3B82F6" },
  { id: 4, name: "Cameras & Photography", description: "Capture Perfect Moments", icon: "📷", color: "#A855F7" },
  { id: 5, name: "Home Appliances", description: "Smart Home Solutions", icon: "🏠", color: "#10B981" },
  { id: 6, name: "Men's Fashion", description: "Stylish Men's Wear", icon: "👔", color: "#059669" },
  
  // Row 2
  { id: 7, name: "Women's Fashion", description: "Elegant Women's Collection", icon: "👗", color: "#EC4899" },
  { id: 8, name: "Kids' Fashion", description: "Trendy Kids' Clothing", icon: "👶", color: "#F59E0B" },
  { id: 9, name: "Footwear & Accessories", description: "Shoes & Style Accessories", icon: "👟", color: "#8B5CF6" },
  { id: 10, name: "Jewelry & Watches", description: "Luxury & Timepieces", icon: "💎", color: "#A855F7" },
  { id: 11, name: "Beauty & Grooming", description: "Beauty & Personal Care", icon: "💄", color: "#F472B6" },
  { id: 12, name: "Health & Wellness", description: "Health & Fitness Products", icon: "❤️", color: "#EF4444" },
  
  // Row 3
  { id: 13, name: "Fitness & Nutrition", description: "Fitness & Sports Gear", icon: "🏋️", color: "#F97316" },
  { id: 14, name: "Personal Care", description: "Appliances", icon: "🧴", color: "#84CC16" },
  { id: 15, name: "Furniture & Décor", description: "Home Furniture & Decor", icon: "🛋️", color: "#10B981" },
  { id: 16, name: "Kitchen & Dining", description: "Kitchen Essentials", icon: "🍽️", color: "#22C55E" },
  { id: 17, name: "Bedding & Home Essentials", description: "Comfort & Home Basics", icon: "🛏️", color: "#06B6D4" },
  { id: 18, name: "Gardening & Outdoor", description: "Garden & Outdoor Living", icon: "🌱", color: "#65A30D" },
  
  // Row 4
  { id: 19, name: "Books & Stationery", description: "Books & Learning Materials", icon: "📚", color: "#D97706" },
  { id: 20, name: "Music, Movies & Games", description: "Entertainment & Gaming", icon: "🎮", color: "#DC2626" },
  { id: 21, name: "E-learning & Courses", description: "Online Learning & Skills", icon: "🎓", color: "#B91C1C" },
  { id: 22, name: "Groceries & Gourmet", description: "Fresh & Gourmet Foods", icon: "🛒", color: "#D97706" },
  { id: 23, name: "Food Delivery & Meal Kits", description: "Ready Meals & Delivery", icon: "🍕", color: "#EA580C" },
  { id: 24, name: "Flights & Hotels", description: "Travel Bookings", icon: "✈️", color: "#3B82F6" },
  
  // Row 5
  { id: 25, name: "Holiday Packages", description: "Complete Travel Packages", icon: "🏖️", color: "#0891B2" },
  { id: 26, name: "Experiences & Activities", description: "Adventure & Experiences", icon: "🎪", color: "#1E40AF" },
  { id: 27, name: "Credit Cards & Finance", description: "Financial Services", icon: "💳", color: "#7C3AED" },
  { id: 28, name: "Loans & Insurance", description: "Loans & Protection Plans", icon: "🛡️", color: "#8B5CF6" },
  { id: 29, name: "Investments & Trading Tools", description: "Investment & Trading", icon: "📈", color: "#A855F7" },
  { id: 30, name: "Utility & Bill Payments", description: "Bills & Utility Services", icon: "📄", color: "#6366F1" },
  
  // Row 6
  { id: 31, name: "Cars & Bikes", description: "Vehicle Accessories", icon: "🚗", color: "#D97706" },
  { id: 32, name: "Parts & Maintenance", description: "Auto Parts & Services", icon: "🔧", color: "#DC2626" },
  { id: 33, name: "Baby Products", description: "Baby Care & Products", icon: "🍼", color: "#F472B6" },
  { id: 34, name: "Pet Supplies", description: "Pet Care & Accessories", icon: "🐾", color: "#FB7185" },
  { id: 35, name: "Gifting & Occasions", description: "Gifts & Special Occasions", icon: "🎁", color: "#F87171" },
  { id: 36, name: "AI Apps & Services", description: "🤖 Cutting-edge AI tools and applications", icon: "🤖", color: "#8B5CF6", isNew: true },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const { wishlistCount } = useWishlist();
  const { toast } = useToast();
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showGenderPopup, setShowGenderPopup] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');

  // Use predefined categories instead of API call
  const categories = predefinedCategories;

  // Close mobile menu when clicking outside or pressing escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      // Check if click is outside the mobile menu container and hamburger button
      if (mobileMenuOpen && 
          !target.closest('.mobile-menu-container') && 
          !target.closest('button[aria-label="Open Menu"]') &&
          !target.closest('button[aria-label="Close Menu"]')) {
        setMobileMenuOpen(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      // Add a small delay to prevent immediate closing when opening
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscapeKey);
      }, 100);
      
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden';
      
      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscapeKey);
        document.body.style.overflow = 'unset';
      };
    }
  }, [mobileMenuOpen]);

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

  // Categories that require gender selection
  const genderSpecificCategories = [
    'Footwear & Accessories',
    'Jewelry & Watches',
    'Beauty & Grooming'
  ];

  const handleCategoryClick = (categoryName: string) => {
    if (genderSpecificCategories.includes(categoryName)) {
      setSelectedCategory(categoryName);
      setShowGenderPopup(true);
    } else {
      setLocation(`/category/${encodeURIComponent(categoryName)}`);
    }
  };

  const handleGenderSelection = (gender: string) => {
    if (selectedCategory) {
      setLocation(`/category/${encodeURIComponent(selectedCategory)}?gender=${gender}`);
      setSelectedCategory('');
    }
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
    <header className="bg-gray-900 shadow-lg sticky top-0 z-50 border-b border-gray-700">
      <div className="w-full px-0">
        {/* Main Header Row */}
        <div className="flex justify-between items-center py-2 sm:py-3 px-2 sm:px-4 lg:px-8">
          {/* Logo in Corner with hidden admin access */}
          <div className="flex-shrink-0 relative">
            <Link href="/" className="hover:opacity-80 transition-all duration-300 hover:scale-110">
              <AmazingBrandLogo className="flex items-center gap-2" />
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

          {/* Centered Brand Text */}
          <div className="flex-1 flex justify-center items-center px-2">
            <Link href="/" className="hover:opacity-80 transition-all duration-300 hover:scale-105">
              <CenteredBrandText />
            </Link>
          </div>

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

        {/* Centered Navigation Row - Mobile Optimized */}
        <div className="flex justify-center items-center space-x-2 sm:space-x-3 lg:space-x-4 border-t border-gray-100 dark:border-gray-800 pt-2 px-1 sm:px-4 lg:px-8 overflow-x-auto">
          {/* Home */}
          <Link 
            href="/" 
            className="group relative bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm touch-manipulation flex-shrink-0"
            title="Home"
            onClick={() => setMobileMenuOpen(false)}
          >
            <i className="fas fa-home group-hover:rotate-12 transition-transform"></i>
            <span className="font-semibold hidden xs:inline">Home</span>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-full transition-opacity"></div>
          </Link>

          {/* Top Picks */}
          <button
            onClick={() => scrollToSection('featured-products')}
            className="group relative bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm touch-manipulation flex-shrink-0"
            title="Today's Top Picks"
          >
            <i className="fas fa-star group-hover:rotate-12 transition-transform"></i>
            <span className="font-semibold hidden xs:inline">Top Picks</span>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-full transition-opacity"></div>
          </button>

          {/* Categories (renamed from Menu) */}
          <button
            onClick={() => scrollToSection('categories')}
            className="group relative bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm touch-manipulation flex-shrink-0"
            title="Browse Categories"
          >
            <i className="fas fa-th-large group-hover:rotate-12 transition-transform"></i>
            <span className="font-semibold hidden xs:inline">Categories</span>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-full transition-opacity"></div>
          </button>

          {/* Blog */}
          <button
            onClick={() => scrollToSection('blog')}
            className="group relative bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm touch-manipulation flex-shrink-0"
            title="Quick Tips and Trends"
          >
            <i className="fas fa-blog group-hover:rotate-12 transition-transform"></i>
            <span className="font-semibold hidden xs:inline">Blog</span>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-full transition-opacity"></div>
          </button>

          {/* Wishlist */}
          <Link 
            href="/wishlist" 
            className="group relative bg-gradient-to-r from-pink-500 to-red-600 hover:from-pink-600 hover:to-red-700 text-white px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm touch-manipulation flex-shrink-0"
            title="Wishlist"
            onClick={() => {
              setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
            }}
          >
            <i className="fas fa-heart group-hover:scale-125 transition-transform text-pink-100"></i>
            <span className="font-semibold hidden xs:inline">Wishlist</span>
            {wishlistCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-yellow-400 text-red-800 text-[8px] sm:text-[10px] rounded-full w-3.5 h-3.5 sm:w-4 sm:h-4 flex items-center justify-center font-bold shadow-md animate-bounce">
                {wishlistCount > 9 ? '9+' : wishlistCount}
              </span>
            )}
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-full transition-opacity"></div>
          </Link>

          {/* Contact Us */}
          <button
            onClick={() => scrollToSection('footer')}
            className="group relative bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm touch-manipulation flex-shrink-0"
            title="Contact Us"
          >
            <i className="fas fa-envelope group-hover:rotate-12 transition-transform"></i>
            <span className="font-semibold hidden xs:inline">Contact</span>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-full transition-opacity"></div>
          </button>

          {/* Theme Toggle */}
          <div className="relative bg-gradient-to-r from-indigo-500 to-slate-600 hover:from-indigo-600 hover:to-slate-700 rounded-full p-1 sm:p-1.5 lg:p-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex-shrink-0">
            <ThemeToggle />
          </div>
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

        {/* Hamburger Menu - Beautiful Colorful Dropdown positioned below hamburger button */}
        {mobileMenuOpen && (
          <div className="mobile-menu-container absolute top-full left-1/2 transform -translate-x-1/2 w-80 max-w-[90vw] pb-4 max-h-80 sm:max-h-96 overflow-y-auto bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 rounded-2xl mt-2 shadow-2xl border border-purple-500/30 z-50">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-2xl"></div>
            <nav className="relative z-10 flex flex-col space-y-2 p-4">
              {/* Home Link with Special Styling */}
              <Link 
                href="/" 
                className="group bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center font-semibold"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="text-xl mr-3">🏠</span>
                Home
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 rounded-xl transition-opacity"></div>
              </Link>
              
              {/* Categories with Individual Colors */}
              {categories.map((category: any) => {
                const isGenderSpecific = genderSpecificCategories.includes(category.name);
                
                const baseClasses = `group relative px-4 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg flex items-center font-medium text-white overflow-hidden ${
                  category.isNew ? 'animate-pulse ring-2 ring-yellow-400/50' : ''
                }`;
                
                const gradientStyle = {
                  background: `linear-gradient(135deg, ${category.color}CC, ${category.color}FF)`,
                };
                
                if (isGenderSpecific) {
                  return (
                    <button
                      key={category.name}
                      onClick={() => {
                        handleCategoryClick(category.name);
                        setMobileMenuOpen(false);
                      }}
                      className={baseClasses}
                      style={gradientStyle}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <span className="text-2xl mr-3 relative z-10">
                        {category.icon}
                      </span>
                      <span className="relative z-10 flex-1 text-left">
                        {category.isNew ? '🔥 ' : ''}{category.name}
                      </span>
                      <i className="fas fa-chevron-right text-sm ml-2 relative z-10 opacity-70 group-hover:opacity-100 transition-opacity"></i>
                    </button>
                  );
                } else {
                  return (
                    <Link 
                      key={category.name}
                      href={`/category/${encodeURIComponent(category.name)}`}
                      className={baseClasses}
                      style={gradientStyle}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <span className="text-2xl mr-3 relative z-10">
                        {category.icon}
                      </span>
                      <span className="relative z-10 flex-1 text-left">
                        {category.isNew ? '🔥 ' : ''}{category.name}
                      </span>
                      <i className="fas fa-arrow-right text-sm ml-2 relative z-10 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all"></i>
                    </Link>
                  );
                }
              })}
              
              {/* Admin Controls - Only visible to authenticated admins */}
              {isAdmin && (
                <div className="border-t border-white/20 mt-4 pt-4 space-y-2">
                  <Link 
                    href="/admin" 
                    className="group bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-center block relative overflow-hidden"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
                    <span className="relative z-10">⚙️ Admin Dashboard</span>
                  </Link>
                  <button
                    onClick={handleAdminLogout}
                    className="group w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-center relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
                    <span className="relative z-10">🚪 Logout Admin</span>
                  </button>
                </div>
              )}
            </nav>
          </div>
        )}

        {/* Gender Selection Popup */}
        <GenderSelectionPopup
          isOpen={showGenderPopup}
          onClose={() => {
            setShowGenderPopup(false);
            setSelectedCategory('');
          }}
          onSelect={handleGenderSelection}
          categoryName={selectedCategory}
        />
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
    <section className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 border-y border-green-200 dark:border-gray-600">
      <div className="w-full px-0">
        <div className="flex flex-col sm:flex-row items-center justify-between space-y-1 sm:space-y-0 sm:space-x-4 px-3 sm:px-6 lg:px-8 py-2">
          
          {/* Live User Count - Mobile Optimized */}
          <div className="flex items-center justify-center sm:justify-start">
            <div className="flex items-center space-x-1 sm:space-x-2">
              <div className="relative">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-400 rounded-full animate-ping"></div>
              </div>
              <span className="text-green-700 dark:text-green-400 font-semibold text-xs sm:text-sm">
                <i className="fas fa-users mr-1"></i>
                <span className="hidden xs:inline">{currentUsers.toLocaleString()}+ happy shoppers browsing now</span>
                <span className="xs:hidden">{currentUsers.toLocaleString()}+ shopping now</span>
              </span>
            </div>
          </div>

          {/* Recent Purchase Alert - Mobile Optimized */}
          <div className="flex items-center space-x-2 sm:space-x-3 bg-white/60 dark:bg-gray-700/80 px-2 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-sm max-w-full">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse flex-shrink-0"></div>
            <span className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm truncate">
              <strong>{recentPurchases[currentPurchase].name}</strong> just bought{" "}
              <strong>{recentPurchases[currentPurchase].product}</strong>
              <span className="text-gray-500 dark:text-gray-400 hidden sm:inline"> {recentPurchases[currentPurchase].time}</span>
            </span>
          </div>

          {/* Trust Indicators - Mobile Optimized */}
          <div className="flex items-center space-x-3 sm:space-x-6 text-xs sm:text-sm">
            <div className="flex items-center space-x-1 text-blue-600 dark:text-blue-400">
              <i className="fas fa-shield-alt"></i>
              <span className="font-medium hidden xs:inline">Secure</span>
            </div>
            <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
              <i className="fas fa-certificate"></i>
              <span className="font-medium hidden sm:inline">Trusted Reviews</span>
              <span className="font-medium sm:hidden xs:inline">Trusted</span>
            </div>
            <div className="flex items-center space-x-1 text-purple-600 dark:text-purple-400">
              <i className="fas fa-star"></i>
              <span className="font-medium">4.8/5</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


