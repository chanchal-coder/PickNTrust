import { useState, useEffect } from "react";

export default function SocialProofBar() {
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
    <section className="bg-gradient-to-r from-gray-800 to-gray-900 py-4 border-y border-gray-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-3 md:space-y-0">
          
          {/* Live User Count */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
              </div>
              <span className="text-green-400 font-semibold">
                <i className="fas fa-users mr-1"></i>
                {currentUsers.toLocaleString()}+ happy shoppers browsing now
              </span>
            </div>
          </div>

          {/* Recent Purchase Alert */}
          <div className="flex items-center space-x-3 bg-gray-700/80 px-4 py-2 rounded-full shadow-sm">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
            <span className="text-gray-300 text-sm">
              <strong>{recentPurchases[currentPurchase].name}</strong> just bought{" "}
              <strong>{recentPurchases[currentPurchase].product}</strong>{" "}
              <span className="text-gray-400">
                {recentPurchases[currentPurchase].time}
              </span>
            </span>
          </div>

          {/* Trust Indicators */}
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1 text-blue-400">
              <i className="fas fa-shield-alt"></i>
              <span className="font-medium">Secure</span>
            </div>
            <div className="flex items-center space-x-1 text-green-400">
              <i className="fas fa-certificate"></i>
              <span className="font-medium">Trusted Reviews</span>
            </div>
            <div className="flex items-center space-x-1 text-purple-400">
              <i className="fas fa-star"></i>
              <span className="font-medium">4.8/5 Rating</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}