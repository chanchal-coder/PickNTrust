import { useState, useEffect, useRef } from "react";

export default function SocialProofBar() {
  const [currentUsers, setCurrentUsers] = useState(4800);
  
  // Generate unique, non-repeating recent purchase events
  interface Purchase {
    name: string;
    product: string;
    time: string;
  }

  const firstNames = [
    "Priya", "Raj", "Sneha", "Amit", "Maya", "Rohan", "Anita", "Vikram", "Neha", "Arjun",
    "Kiran", "Pooja", "Gaurav", "Isha", "Sameer", "Nisha", "Rahul", "Meera", "Kabir", "Tanya",
    "Siddharth", "Ayesha", "Manish", "Rekha", "Varun", "Sanya", "Dev", "Anshul", "Simran", "Aarav"
  ];
  const cities = [
    "Mumbai", "Delhi", "Bangalore", "Pune", "Chennai", "Hyderabad", "Kolkata", "Jaipur", "Ahmedabad", "Surat",
    "Noida", "Gurgaon", "Indore", "Bhopal", "Nagpur", "Lucknow", "Patna", "Vadodara", "Coimbatore", "Kochi"
  ];
  const products = [
    "iPhone 15 Pro", "Samsung TV", "Laptop", "Headphones", "Smart Watch", "Air Purifier", "Gaming Console",
    "Bluetooth Speaker", "Coffee Machine", "Fitness Band", "Wireless Earbuds", "DSLR Camera", "Tablet",
    "Smart Light", "Robot Vacuum"
  ];
  const timeOptions = ["just now", "1 min ago", "2 min ago", "3 min ago", "5 min ago", "8 min ago", "12 min ago", "15 min ago"];

  const getRandomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

  const lastShownNamesRef = useRef<Set<string>>(new Set());
  const [recentPurchases, setRecentPurchases] = useState<Purchase[]>([]);
  const [currentPurchase, setCurrentPurchase] = useState(0);

  const generateUniquePurchase = (usedNames: Set<string>): Purchase => {
    let nameStr = "";
    let attempts = 0;
    do {
      const name = getRandomItem(firstNames);
      const city = getRandomItem(cities);
      nameStr = `${name} from ${city}`;
      attempts++;
      // If we are exhausting unique names, reset memory gracefully
      if (attempts > 100) {
        usedNames.clear();
      }
    } while (usedNames.has(nameStr));
    usedNames.add(nameStr);

    return {
      name: nameStr,
      product: getRandomItem(products),
      time: getRandomItem(timeOptions)
    };
  };

  const regeneratePurchaseList = (count: number) => {
    const used = lastShownNamesRef.current;
    const newList: Purchase[] = [];
    for (let i = 0; i < count; i++) {
      newList.push(generateUniquePurchase(used));
    }
    setRecentPurchases(newList);
  };

  // Initialize purchases with unique entries
  useEffect(() => {
    regeneratePurchaseList(6);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Simulate live user count updates
  useEffect(() => {
    const userInterval = setInterval(() => {
      setCurrentUsers(prev => {
        const change = Math.floor(Math.random() * 21) - 10; // Random change between -10 and +10
        const newCount = Math.max(4200, Math.min(5800, prev + change)); // Keep between 4200-5800
        return newCount;
      });
    }, 8000);

    return () => clearInterval(userInterval);
  }, []);

  // Cycle through recent purchases and refresh the list when a loop completes
  useEffect(() => {
    if (recentPurchases.length === 0) return;
    const purchaseInterval = setInterval(() => {
      setCurrentPurchase(prev => {
        const next = (prev + 1) % recentPurchases.length;
        // When we loop back to start, regenerate with fresh unique names
        if (next === 0) {
          regeneratePurchaseList(recentPurchases.length);
        }
        return next;
      });
    }, 4000);

    return () => clearInterval(purchaseInterval);
  }, [recentPurchases]);

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
          {recentPurchases.length > 0 && (
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
          )}

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