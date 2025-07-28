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
    select: (data) => data || []
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
    select: (data) => data || []
  });

  // Filter results based on search query
  const searchResults = searchQuery.length > 0 ? {
    products: products.filter((product: any) => 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5),
    categories: categories.filter((category: any) =>
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

  const handleProductClick = () => {
    setShowResults(false);
    setSearchQuery("");
  };

  return (
    <section className="bg-white dark:bg-gray-800 py-8 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
                className="w-full pl-12 pr-20 py-4 text-lg border-2 border-gray-300 dark:border-gray-600 rounded-full focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
              <i className="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl"></i>
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full transition-colors font-semibold"
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
                        onClick={handleProductClick}
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
                          <p className="text-sm font-semibold text-green-600 dark:text-green-400">₹{product.price}</p>
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

        {/* Popular Searches */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Popular searches:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {['Smartphones', 'Laptops', 'Fashion', 'Home Appliances', 'Beauty'].map((term) => (
              <button
                key={term}
                onClick={() => {
                  setSearchQuery(term);
                  handleSearch({ preventDefault: () => {} } as React.FormEvent);
                }}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}