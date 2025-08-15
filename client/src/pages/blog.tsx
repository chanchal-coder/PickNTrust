import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import Header from "@/components/header";
import Footer from "@/components/footer";

// Define BlogPost type locally to avoid schema conflicts
interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  imageUrl: string;
  videoUrl?: string;
  publishedAt: Date | string;
  createdAt: Date | null;
  readTime: string;
  slug: string;
  hasTimer: boolean;
  timerDuration: number | null;
  timerStartTime: Date | null;
}

// Extended fallback blog posts for the full page
const fallbackBlogPosts = [
  {
    id: 1,
    title: "Top 10 Best Deals This Week",
    excerpt: "Discover the hottest deals and discounts available this week. From electronics to fashion, we've curated the best offers just for you.",
    content: "Full blog content here...",
    category: "Deals",
    tags: ["deals", "discounts", "shopping", "weekly"],
    imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&q=80",
    publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    createdAt: new Date(),
    readTime: "5 min read",
    slug: "top-10-best-deals-this-week",
    hasTimer: false,
    timerDuration: null,
    timerStartTime: null
  },
  {
    id: 2,
    title: "Smart Shopping Tips for 2024",
    excerpt: "Learn the best strategies to save money while shopping online. Expert tips and tricks to get the most value for your money.",
    content: "Full blog content here...",
    category: "Tips",
    tags: ["shopping", "tips", "money-saving", "guide"],
    imageUrl: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400&q=80",
    publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    createdAt: new Date(),
    readTime: "7 min read",
    slug: "smart-shopping-tips-2024",
    hasTimer: false,
    timerDuration: null,
    timerStartTime: null
  },
  {
    id: 3,
    title: "iPhone 15 vs Samsung Galaxy S24: Which to Buy?",
    excerpt: "Complete comparison of the latest flagship smartphones. We break down specs, features, and value to help you make the right choice.",
    content: "Full blog content here...",
    category: "Reviews",
    tags: ["iphone", "samsung", "comparison", "smartphones"],
    imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=80",
    publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    createdAt: new Date(),
    readTime: "10 min read",
    slug: "iphone-15-vs-samsung-galaxy-s24",
    hasTimer: false,
    timerDuration: null,
    timerStartTime: null
  },
  {
    id: 4,
    title: "Best Black Friday Deals 2024",
    excerpt: "Get ready for the biggest shopping event of the year. We've compiled the best Black Friday deals across all categories.",
    content: "Full blog content here...",
    category: "Deals",
    tags: ["black-friday", "deals", "discounts", "shopping"],
    imageUrl: "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=400&q=80",
    publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
    createdAt: new Date(),
    readTime: "8 min read",
    slug: "best-black-friday-deals-2024",
    hasTimer: false,
    timerDuration: null,
    timerStartTime: null
  },
  {
    id: 5,
    title: "How to Spot Fake Products Online",
    excerpt: "Protect yourself from counterfeit products with our comprehensive guide. Learn the warning signs and shopping tips.",
    content: "Full blog content here...",
    category: "Tips",
    tags: ["safety", "fake-products", "online-shopping", "guide"],
    imageUrl: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&q=80",
    publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    createdAt: new Date(),
    readTime: "6 min read",
    slug: "how-to-spot-fake-products-online",
    hasTimer: false,
    timerDuration: null,
    timerStartTime: null
  },
  {
    id: 6,
    title: "Best Budget Laptops Under $500",
    excerpt: "Find the perfect laptop without breaking the bank. Our expert reviews of the best budget-friendly laptops available.",
    content: "Full blog content here...",
    category: "Reviews",
    tags: ["laptops", "budget", "reviews", "technology"],
    imageUrl: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&q=80",
    publishedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
    createdAt: new Date(),
    readTime: "9 min read",
    slug: "best-budget-laptops-under-500",
    hasTimer: false,
    timerDuration: null,
    timerStartTime: null
  }
];

export default function Blog() {
  const { data: blogPosts, isLoading } = useQuery<BlogPost[]>({
    queryKey: ['/api/blog'],
    queryFn: async () => {
      const response = await fetch('/api/blog');
      if (!response.ok) {
        throw new Error('Failed to fetch blog posts');
      }
      return response.json();
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Use API data if available, otherwise use fallback data
  const displayPosts = blogPosts && blogPosts.length > 0 ? blogPosts : fallbackBlogPosts;

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Main Header */}
      <Header />
      
      {/* Page Header */}
      <div className="bg-gradient-to-r from-green-500 via-teal-500 to-blue-500 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-4">
              Quick Tips & Trending 📝
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-6">
              Stay updated with the latest deals and shopping hacks
            </p>
            <Link 
              href="/"
              className="inline-flex items-center px-6 py-3 bg-white text-green-600 font-semibold rounded-full hover:bg-gray-100 transition-colors"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Back to Home
            </Link>
          </div>
        </div>
      </div>

      {/* Blog Posts Grid */}
      <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:bg-gradient-to-br dark:from-indigo-900/30 dark:via-purple-900/30 dark:to-pink-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayPosts.map((post: BlogPost, index: number) => (
              <article key={post.id} className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700 hover:-translate-y-2 hover:scale-105 group">
                <div className={`w-full h-48 relative p-2 dark:bg-gradient-to-br dark:from-green-900 dark:via-teal-900 dark:to-blue-900 ${
                  index % 3 === 0 ? 'bg-blue-400' : 
                  index % 3 === 1 ? 'bg-green-400' : 
                  'bg-orange-400'
                }`}>
                  {post.videoUrl && post.videoUrl.trim() !== '' ? (
                    <video 
                      src={post.videoUrl} 
                      controls
                      className="w-full h-full object-cover rounded-2xl border-2 border-white/50 dark:border-gray-700/50 shadow-lg"
                      poster={post.imageUrl}
                      onError={(e) => {
                        // If video fails to load, hide it and show image instead
                        const videoElement = e.target as HTMLVideoElement;
                        videoElement.style.display = 'none';
                        const imgElement = videoElement.nextElementSibling as HTMLImageElement;
                        if (imgElement) {
                          imgElement.style.display = 'block';
                        }
                      }}
                    />
                  ) : null}
                  <img 
                    src={post.imageUrl} 
                    alt={post.title} 
                    className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-300 rounded-2xl border-2 border-white/50 dark:border-gray-700/50 shadow-lg ${
                      post.videoUrl && post.videoUrl.trim() !== '' ? 'hidden' : 'block'
                    }`}
                    onError={(e) => {
                      // If image fails to load, show a placeholder
                      const imgElement = e.target as HTMLImageElement;
                      imgElement.src = `https://via.placeholder.com/400x200/6366f1/ffffff?text=${encodeURIComponent(post.title.substring(0, 20))}`;
                    }}
                  />
                </div>
                <div className={`p-6 ${
                  index % 3 === 0 ? 'bg-blue-50 dark:bg-gray-800' : 
                  index % 3 === 1 ? 'bg-green-50 dark:bg-gray-800' : 
                  'bg-orange-50 dark:bg-gray-800'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                      <i className="far fa-calendar mr-2 text-blue-500 dark:text-blue-400"></i>
                      <span>{formatDate(post.publishedAt)}</span>
                      <span className="mx-2 text-purple-500">•</span>
                      <i className="far fa-clock mr-1 text-green-500 dark:text-green-400"></i>
                      <span>{post.readTime}</span>
                    </div>
                    {post.category && (
                      <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                        {post.category}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-xl font-bold text-navy dark:text-blue-400 flex-1">{post.title}</h4>
                  </div>
                  <div className="text-gray-600 dark:text-gray-300 mb-4">
                    <span>{post.excerpt.length > 120 ? `${post.excerpt.substring(0, 120)}...` : post.excerpt}</span>
                    <br />
                    <Link 
                      href={`/blog/${post.slug}`} 
                      className="text-blue-600 hover:text-blue-800 dark:hover:text-blue-300 font-semibold inline-flex items-center gap-1 mt-2 transition-colors hover:underline cursor-pointer"
                      onClick={() => {
                        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                      }}
                    >
                      Read More <span>→</span>
                    </Link>
                  </div>
                  
                  {/* Tags */}
                  {post.tags && Array.isArray(post.tags) && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                      {post.tags.slice(0, 3).map((tag: string, tagIndex: number) => (
                        <span 
                          key={tagIndex}
                          className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded text-xs"
                        >
                          #{tag}
                        </span>
                      ))}
                      {post.tags.length > 3 && (
                        <span className="text-gray-400 text-xs px-2 py-1">
                          +{post.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}
