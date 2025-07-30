import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import type { BlogPost } from "@shared/schema";

export default function BlogSection() {
  const { data: blogPosts, isLoading } = useQuery<BlogPost[]>({
    queryKey: ['/api/blog'],
  });

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (isLoading) {
    return (
      <section className="py-16 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:bg-gradient-to-br dark:from-indigo-900/30 dark:via-purple-900/30 dark:to-pink-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-navy dark:text-blue-400 mb-4">Quick Tips & Trending 📝</h3>
            <p className="text-xl text-gray-600 dark:text-gray-300">Stay updated with the latest deals and shopping hacks</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <article key={i} className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg overflow-hidden animate-pulse border border-gray-100 dark:border-gray-700">
                <div className={`w-full h-48 ${
                  i === 0 ? 'bg-gradient-to-br from-blue-200 to-purple-300 dark:from-blue-700 dark:to-purple-800' :
                  i === 1 ? 'bg-gradient-to-br from-green-200 to-teal-300 dark:from-green-700 dark:to-teal-800' :
                  'bg-gradient-to-br from-pink-200 to-orange-300 dark:from-pink-700 dark:to-orange-800'
                }`}></div>
                <div className="p-6">
                  <div className="h-4 bg-gradient-to-r from-blue-200 to-purple-200 dark:from-blue-700 dark:to-purple-700 rounded mb-3"></div>
                  <div className="h-6 bg-gradient-to-r from-green-200 to-teal-200 dark:from-green-700 dark:to-teal-700 rounded mb-3"></div>
                  <div className="h-4 bg-gradient-to-r from-pink-200 to-orange-200 dark:from-pink-700 dark:to-orange-700 rounded mb-4"></div>
                  <div className="h-4 bg-gradient-to-r from-purple-200 to-indigo-200 dark:from-purple-700 dark:to-indigo-700 rounded w-24"></div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:bg-gradient-to-br dark:from-indigo-900/30 dark:via-purple-900/30 dark:to-pink-900/30">
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
          {blogPosts?.map((post, index) => (
            <article key={post.id} className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700 hover:-translate-y-2 hover:scale-105 group">
              <div className={`w-full h-48 relative p-2 dark:bg-gradient-to-br dark:from-green-900 dark:via-teal-900 dark:to-blue-900 ${
                index % 3 === 0 ? 'bg-blue-400' : 
                index % 3 === 1 ? 'bg-green-400' : 
                'bg-orange-400'
              }`}>
                {post.videoUrl ? (
                  <div className="w-full h-full rounded-2xl overflow-hidden border-2 border-white/50 dark:border-gray-700/50 shadow-lg">
                    {/* YouTube Videos */}
                    {(post.videoUrl.includes('youtube.com') || post.videoUrl.includes('youtu.be')) ? (
                      <iframe
                        src={post.videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                        className="w-full h-full"
                        frameBorder="0"
                        allowFullScreen
                        title={post.title}
                      />
                    ) : 
                    /* Instagram Reels */
                    post.videoUrl.includes('instagram.com/reel/') ? (
                      <iframe
                        src={`${post.videoUrl}embed/`}
                        className="w-full h-full"
                        frameBorder="0"
                        allowFullScreen
                        title={post.title}
                      />
                    ) : 
                    /* Facebook Reels */
                    post.videoUrl.includes('facebook.com/reel/') ? (
                      <iframe
                        src={`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(post.videoUrl)}&show_text=false&width=400`}
                        className="w-full h-full"
                        frameBorder="0"
                        allowFullScreen
                        title={post.title}
                      />
                    ) : 
                    /* Direct Video Files (uploaded or external) */
                    (
                      <video 
                        src={post.videoUrl.startsWith('/uploads/') ? `${window.location.origin}${post.videoUrl}` : post.videoUrl}
                        className="w-full h-full object-cover"
                        controls
                        poster={post.imageUrl}
                      />
                    )}
                    <div className="absolute top-4 right-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-2 py-1 rounded-full text-xs font-medium shadow-lg">
                      {post.videoUrl.includes('instagram.com') ? '📱 Reel' : 
                       post.videoUrl.includes('facebook.com') ? '📘 Reel' : 
                       post.videoUrl.includes('youtube.com') ? '🎥 Video' : '📹 Video'}
                    </div>
                  </div>
                ) : (
                  <img 
                    src={post.imageUrl} 
                    alt={post.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300 rounded-2xl border-2 border-white/50 dark:border-gray-700/50 shadow-lg" 
                  />
                )}
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
                    <span className="bg-bright-blue text-white px-2 py-1 rounded-full text-xs font-medium">
                      {post.category}
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-start mb-3">
                  <h4 className="text-xl font-bold text-navy dark:text-blue-400 flex-1">{post.title}</h4>
                </div>
                <div className="text-gray-600 dark:text-gray-300 mb-4">
                  {/* Show only first 4-5 lines of excerpt */}
                  <span>{post.excerpt.length > 120 ? `${post.excerpt.substring(0, 120)}...` : post.excerpt}</span>
                  <br />
                  <Link 
                    href={`/blog/${post.slug}`} 
                    className="text-bright-blue hover:text-navy dark:hover:text-blue-300 font-semibold inline-flex items-center gap-1 mt-2 transition-colors hover:underline cursor-pointer"
                    onClick={() => {
                      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                    }}
                  >
                    Read More <span>→</span>
                  </Link>
                </div>
                
                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                    {post.tags.slice(0, 3).map((tag, index) => (
                      <span 
                        key={index}
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
