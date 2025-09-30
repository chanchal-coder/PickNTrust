import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

export default function SearchBar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [, setLocation] = useLocation();

  // Fetch products and categories for search
  const { data: products = [] } = useQuery({
    queryKey: ['/api/products/featured'],
    queryFn: async () => {
      const response = await fetch('/api/products/featured');
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      return response.json();
    },
    select: (data) => data || []
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories/browse'],
    queryFn: async () => {
      const response = await fetch('/api/categories/browse');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      return response.json();
    },
    select: (data) => data || []
  });

  // Filter results based on search query
  const searchResults = searchQuery.length > 0 ? {
    products: (products as any[]).filter((product: any) => 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5),
    categories: (categories as any[]).filter((category: any) =>
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.description.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 3)
  } : { products: [], categories: [] };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Redirect to a search results page or filter current view
      setLocation(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowResults(false);
    }
  };

  const handleCategoryClick = (categoryName: string) => {
    setLocation(`/category/${encodeURIComponent(categoryName)}`);
    setShowResults(false);
    setSearchQuery("");
  };

  const handleProductClick = (product: any) => {
    // Navigate to a product detail page or search results with that product
    setLocation(`/search?q=${encodeURIComponent(product.name)}&product=${product.id}`);
    setShowResults(false);
    setSearchQuery("");
  };

  return (
    <section className="bg-white dark:bg-gray-800 py-4 sm:py-8 shadow-sm">
      <div className="max-w-4xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="relative">
          {/* Search Form */}
          <form onSubmit={handleSearch} className="relative">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowResults(e.target.value.length > 0);
                }}
                onFocus={() => setShowResults(searchQuery.length > 0)}
                placeholder="Search for products, categories, deals..."
                className="w-full pl-8 sm:pl-12 pr-16 sm:pr-20 py-2 sm:py-4 text-sm sm:text-lg border-2 border-gray-300 dark:border-gray-600 rounded-full focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
              <i className="fas fa-search absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm sm:text-xl"></i>
              <button
                type="submit"
                className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-6 py-1 sm:py-2 rounded-full transition-colors font-semibold text-xs sm:text-sm"
              >
                Search
              </button>
            </div>
          </form>

          {/* Search Results Dropdown */}
          {showResults && (searchResults.products.length > 0 || searchResults.categories.length > 0) && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
              {/* Categories */}
              {searchResults.categories.length > 0 && (
                <div className="p-4 border-b border-gray-200 dark:border-gray-600">
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">CATEGORIES</h3>
                  <div className="space-y-2">
                    {searchResults.categories.map((category: any) => (
                      <button
                        key={category.id}
                        onClick={() => handleCategoryClick(category.name)}
                        className="w-full text-left flex items-center space-x-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <i className={`${category.icon} text-lg`} style={{ color: category.color }}></i>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{category.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{category.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Products */}
              {searchResults.products.length > 0 && (
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">PRODUCTS</h3>
                  <div className="space-y-2">
                    {searchResults.products.map((product: any) => (
                      <div
                        key={product.id}
                        onClick={() => handleProductClick(product)}
                        className="flex items-center space-x-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                      >
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white line-clamp-1">{product.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{product.description}</p>
                          {/* Enhanced pricing display for services */}
                          {(product as any).isFree || ((product as any).pricingType === 'free') ? (
                            <p className="text-sm font-semibold text-green-600 dark:text-green-400">FREE</p>
                          ) : (product as any).priceDescription ? (
                            <p className="text-sm font-semibold text-green-600 dark:text-green-400">{(product as any).priceDescription}</p>
                          ) : (product as any).monthlyPrice && (product as any).monthlyPrice !== '0' ? (
                            <p className="text-sm font-semibold text-green-600 dark:text-green-400">₹{(product as any).monthlyPrice}/month</p>
                          ) : (product as any).yearlyPrice && (product as any).yearlyPrice !== '0' ? (
                            <p className="text-sm font-semibold text-green-600 dark:text-green-400">₹{(product as any).yearlyPrice}/year</p>
                          ) : (product as any).pricingType === 'monthly' ? (
                            <p className="text-sm font-semibold text-green-600 dark:text-green-400">₹{product.price}/month</p>
                          ) : (product as any).pricingType === 'yearly' ? (
                            <p className="text-sm font-semibold text-green-600 dark:text-green-400">₹{product.price}/year</p>
                          ) : (
                            <p className="text-sm font-semibold text-green-600 dark:text-green-400">₹{product.price}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Results */}
              {searchQuery.length > 0 && searchResults.products.length === 0 && searchResults.categories.length === 0 && (
                <div className="p-8 text-center">
                  <i className="fas fa-search text-4xl text-gray-300 dark:text-gray-600 mb-4"></i>
                  <p className="text-gray-500 dark:text-gray-400">No results found for "{searchQuery}"</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Try different keywords or browse categories</p>
                </div>
              )}
            </div>
          )}

          {/* Overlay to close search results */}
          {showResults && (
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowResults(false)}
            />
          )}
        </div>

        {/* Popular Searches - Colorful & Functional */}
        <div className="mt-3 sm:mt-6 text-center">
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-2">Popular searches:</p>
          <PopularSearchButtons setSearchQuery={setSearchQuery} handleSearch={handleSearch} />
        </div>
      </div>
    </section>
  );
}

// Colorful Popular Search Buttons Component
function PopularSearchButtons({ setSearchQuery, handleSearch }: { 
  setSearchQuery: (query: string) => void; 
  handleSearch: (e: React.FormEvent) => void; 
}) {
  const [showFashionPopup, setShowFashionPopup] = useState(false);
  const [showBeautyPopup, setShowBeautyPopup] = useState(false);
  const [, setLocation] = useLocation();

  const popularSearches = [
    {
      name: 'AI Apps',
      icon: 'fas fa-robot',
      gradient: 'from-violet-500 to-purple-600',
      category: 'Apps & AI Apps',
      isNew: true
    },
    {
      name: 'Smartphones',
      icon: 'fas fa-mobile-alt',
      gradient: 'from-blue-500 to-cyan-500',
      category: 'Electronics & Gadgets'
    },
    {
      name: 'Laptops',
      icon: 'fas fa-laptop',
      gradient: 'from-purple-500 to-indigo-500',
      category: 'Electronics & Gadgets'
    },
    {
      name: 'Fashion',
      icon: 'fas fa-tshirt',
      gradient: 'from-pink-500 to-rose-500',
      category: null // Special case for popup
    },
    {
      name: 'Home Appliances',
      icon: 'fas fa-home',
      gradient: 'from-green-500 to-emerald-500',
      category: 'Home & Kitchen'
    },
    {
      name: 'Beauty',
      icon: 'fas fa-heart',
      gradient: 'from-red-500 to-pink-500',
      category: null // Special case for popup
    }
  ];

  const handleClick = (search: {name: string; category: string | null}) => {
    if (search.name === 'Fashion') {
      setShowFashionPopup(true);
    } else if (search.name === 'Beauty') {
      setShowBeautyPopup(true);
    } else if (search.category) {
      setLocation(`/category/${encodeURIComponent(search.category)}`);
    } else {
      setSearchQuery(search.name);
      handleSearch({ preventDefault: () => {} } as React.FormEvent);
    }
  };

  return (
    <>
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
        {popularSearches.map((search) => (
          <button
            key={search.name}
            onClick={() => handleClick(search)}
            className={`group bg-gradient-to-r ${search.gradient} hover:scale-105 text-white px-2 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-xl flex items-center space-x-1 sm:space-x-2 relative ${
              search.isNew ? 'ring-2 ring-yellow-300 ring-opacity-70 animate-pulse' : ''
            }`}
          >
            {search.isNew && (
              <div className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[6px] sm:text-[8px] font-bold px-1 rounded-full animate-bounce">
                NEW!
              </div>
            )}
            <i className={`${search.icon} text-xs sm:text-sm group-hover:rotate-12 transition-transform ${search.isNew ? 'animate-pulse' : ''}`}></i>
            <span>{search.name}</span>
          </button>
        ))}
      </div>

      {/* Fashion Popup Modal */}
      {showFashionPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-xl font-bold text-center mb-4 text-gray-900 dark:text-white">
              Choose Fashion Category
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setLocation("/category/Fashion & Clothing?gender=men");
                  setShowFashionPopup(false);
                }}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 flex items-center justify-center space-x-2"
              >
                <i className="fas fa-male"></i>
                <span>Men's Fashion</span>
              </button>
              <button
                onClick={() => {
                  setLocation("/category/Fashion & Clothing?gender=women");
                  setShowFashionPopup(false);
                }}
                className="w-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white px-4 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 flex items-center justify-center space-x-2"
              >
                <i className="fas fa-female"></i>
                <span>Women's Fashion</span>
              </button>
              <button
                onClick={() => {
                  setLocation("/category/Fashion & Clothing?gender=kids");
                  setShowFashionPopup(false);
                }}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 flex items-center justify-center space-x-2"
              >
                <i className="fas fa-child"></i>
                <span>Kid's Fashion</span>
              </button>
              <button
                onClick={() => {
                  setLocation("/category/Fashion & Clothing?gender=common");
                  setShowFashionPopup(false);
                }}
                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 flex items-center justify-center space-x-2"
              >
                <i className="fas fa-globe"></i>
                <span>Common Fashion</span>
              </button>
            </div>
            <button
              onClick={() => setShowFashionPopup(false)}
              className="mt-4 w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Beauty Popup Modal */}
      {showBeautyPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-xl font-bold text-center mb-4 text-gray-900 dark:text-white">
              Choose Beauty Category
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setLocation("/category/Health & Beauty?gender=men");
                  setShowBeautyPopup(false);
                }}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 flex items-center justify-center space-x-2"
              >
                <i className="fas fa-male"></i>
                <span>Men's Beauty</span>
              </button>
              <button
                onClick={() => {
                  setLocation("/category/Health & Beauty?gender=women");
                  setShowBeautyPopup(false);
                }}
                className="w-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white px-4 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 flex items-center justify-center space-x-2"
              >
                <i className="fas fa-female"></i>
                <span>Women's Beauty</span>
              </button>
              <button
                 onClick={() => {
                   setLocation("/category/Health & Beauty?gender=kids");
                   setShowBeautyPopup(false);
                 }}
                 className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 flex items-center justify-center space-x-2"
               >
                 <i className="fas fa-child"></i>
                 <span>Kid's Beauty</span>
               </button>
               <button
                 onClick={() => {
                   setLocation("/category/Health & Beauty?gender=common");
                   setShowBeautyPopup(false);
                 }}
                 className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 flex items-center justify-center space-x-2"
               >
                 <i className="fas fa-globe"></i>
                 <span>Common Beauty</span>
               </button>
             </div>
            <button
              onClick={() => setShowBeautyPopup(false)}
              className="mt-4 w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}