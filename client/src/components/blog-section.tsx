import { useQuery } from "@tanstack/react-query";
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
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-4xl font-bold text-navy mb-4">Quick Tips & Trending 📝</h3>
            <p className="text-xl text-gray-600">Stay updated with the latest deals and shopping hacks</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <article key={i} className="bg-white rounded-3xl shadow-lg overflow-hidden animate-pulse">
                <div className="w-full h-48 bg-gray-200"></div>
                <div className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-3"></div>
                  <div className="h-6 bg-gray-200 rounded mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h3 className="text-4xl font-bold text-navy mb-4">Quick Tips & Trending 📝</h3>
          <p className="text-xl text-gray-600">Stay updated with the latest deals and shopping hacks</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {blogPosts?.map((post) => (
            <article key={post.id} className="bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all overflow-hidden">
              <img 
                src={post.imageUrl} 
                alt={post.title} 
                className="w-full h-48 object-cover" 
              />
              <div className="p-6">
                <div className="flex items-center text-sm text-gray-500 mb-3">
                  <i className="far fa-calendar mr-2"></i>
                  <span>{formatDate(post.publishedAt)}</span>
                  <span className="mx-2">•</span>
                  <span>{post.readTime}</span>
                </div>
                <h4 className="text-xl font-bold text-navy mb-3">{post.title}</h4>
                <p className="text-gray-600 mb-4">{post.excerpt}</p>
                <a 
                  href={`/blog/${post.slug}`} 
                  className="text-bright-blue hover:text-navy font-semibold"
                >
                  Read More →
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
