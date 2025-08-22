import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

export default function Search() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ["search", searchTerm],
    queryFn: async () => {
      if (!searchTerm) return [];
      const response = await fetch(`/api/products?search=${encodeURIComponent(searchTerm)}`);
      return response.json();
    },
    enabled: !!searchTerm,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Search Products</h1>
        
        <div className="mb-8">
          <input
            type="text"
            placeholder="Search for products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {isLoading && (
          <div className="text-center py-8">
            <div className="text-gray-600">Searching...</div>
          </div>
        )}

        {searchResults && searchResults.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {searchResults.map((product: any) => (
              <div key={product.id} className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
                <p className="text-gray-600 mb-4">{product.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-green-600">₹{product.price}</span>
                  {product.originalPrice && (
                    <span className="text-sm text-gray-500 line-through">₹{product.originalPrice}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {searchTerm && searchResults && searchResults.length === 0 && !isLoading && (
          <div className="text-center py-8">
            <div className="text-gray-600">No products found for "{searchTerm}"</div>
          </div>
        )}
      </div>
    </div>
  );
}
