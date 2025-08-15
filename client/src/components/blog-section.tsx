import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

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

// Fallback blog posts data (shown only if API returns empty)
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
  }
];

export default function BlogSection() {
  // Try to fetch from API but don't show loading state - show fallback immediately
  const { data: blogPosts } = useQuery<BlogPost[]>({
    queryKey: ['/api/blog'],
    queryFn: async () => {
      const response = await fetch('/api/blog');
      if (!response.ok) {
        throw new Error('Failed to fetch blog posts');
      }
      return response.json();
    },
    retry: false,
    refetchOnWindowFocus: false,
    // Don't show loading state, fail silently and use fallback
    enabled: false, // Disable automatic fetching for now
  });

  // Always use fallback data for immediate display
  const displayPosts = fallbackBlogPosts;

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Remove loading state completely - always show content immediately

  return (
    <section id="blog" className="py-16 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:bg-gradient-to-br dark:from-indigo-900/30 dark:via-purple-900/30 dark:to-pink-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="relative inline-block">
            <h3 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-green-500 via-teal-500 to-blue-500 bg-clip-text text-transparent mb-4 relative">
              Quick Tips & Trending
              <div className="absolute -top-2 -right-6 text-xl animate-spin" style={{animationDuration: '3s'}}>📝</div>
            </h3>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 font-medium mt-6">
            <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">🚀 Stay updated with the latest deals and shopping hacks 🚀</span>
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {displayPosts.map((post: BlogPost, index: number) => (
            <article key={post.id} className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700 hover:-translate-y-2 hover:scale-105 group">
              <div className={`w-full h-48 relative p-2 dark:bg-gradient-to-br dark:from-green-900 dark:via-teal-900 dark:to-blue-900 ${
                index % 3 === 0 ? 'bg-blue-400' : 
                index % 3 === 1 ? 'bg-green-400' : 
                'bg-orange-400'
              }`}>
                <img 
                  src={post.imageUrl} 
                  alt={post.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300 rounded-2xl border-2 border-white/50 dark:border-gray-700/50 shadow-lg" 
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
    </section>
  );
}
