import React, { useEffect, useState } from 'react';
import BlogPostCard from './BlogPostCard';

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  imageUrl: string;
  publishedAt: string;
  readTime: string;
  category: string;
  tags: string[];
}

const BlogPostList: React.FC = () => {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogPosts = async () => {
      try {
        const response = await fetch('/api/blog');
        const data = await response.json();
        setBlogPosts(data);
      } catch (error) {
        console.error('Failed to fetch blog posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogPosts();
  }, []);

  if (loading) {
    return <div>Loading blog posts...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {blogPosts.map((post) => (
        <BlogPostCard
          key={post.id}
          id={post.id}
          title={post.title}
          excerpt={post.excerpt}
          imageUrl={post.imageUrl}
          publishedAt={post.publishedAt}
          readTime={post.readTime}
          category={post.category}
          tags={post.tags || []}
        />
      ))}
    </div>
  );
};

export default BlogPostList;
