import React, { useState } from 'react';

const AdminBlogPostForm: React.FC = () => {
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [publishedAt, setPublishedAt] = useState('');
  const [readTime, setReadTime] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);

    // Convert publishedAt string to timestamp (milliseconds)
    const publishedAtTimestamp = publishedAt ? new Date(publishedAt).getTime() : null;

    const blogPostData = {
      title,
      excerpt,
      imageUrl,
      publishedAt: publishedAtTimestamp,
      readTime,
      category,
      tags: JSON.stringify(tagsArray), // stringify tags array for server
      password,
    };

    try {
      const response = await fetch('/api/admin/blog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(blogPostData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to add blog post');
      } else {
        setSuccess('Blog post added successfully');
        // Clear form
        setTitle('');
        setExcerpt('');
        setImageUrl('');
        setPublishedAt('');
        setReadTime('');
        setCategory('');
        setTags('');
        setPassword('');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto p-4 bg-gray-900 rounded-lg shadow-md text-white">
      <h2 className="text-2xl mb-4">Add New Blog Post</h2>

      {error && <div className="mb-4 p-2 bg-red-600 rounded">{error}</div>}
      {success && <div className="mb-4 p-2 bg-green-600 rounded">{success}</div>}

      <label className="block mb-2">
        Title
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          className="w-full p-2 rounded bg-gray-800 text-white"
        />
      </label>

      <label className="block mb-2">
        Excerpt
        <textarea
          value={excerpt}
          onChange={e => setExcerpt(e.target.value)}
          required
          className="w-full p-2 rounded bg-gray-800 text-white"
        />
      </label>

      <label className="block mb-2">
        Image URL
        <input
          type="text"
          value={imageUrl}
          onChange={e => setImageUrl(e.target.value)}
          required
          className="w-full p-2 rounded bg-gray-800 text-white"
        />
      </label>

      <label className="block mb-2">
        Published At (ISO Date)
        <input
          type="datetime-local"
          value={publishedAt}
          onChange={e => setPublishedAt(e.target.value)}
          required
          className="w-full p-2 rounded bg-gray-800 text-white"
        />
      </label>

      <label className="block mb-2">
        Read Time (e.g., "5 min read")
        <input
          type="text"
          value={readTime}
          onChange={e => setReadTime(e.target.value)}
          required
          className="w-full p-2 rounded bg-gray-800 text-white"
        />
      </label>

      <label className="block mb-2">
        Category
        <input
          type="text"
          value={category}
          onChange={e => setCategory(e.target.value)}
          required
          className="w-full p-2 rounded bg-gray-800 text-white"
        />
      </label>

      <label className="block mb-2">
        Tags (comma separated)
        <input
          type="text"
          value={tags}
          onChange={e => setTags(e.target.value)}
          className="w-full p-2 rounded bg-gray-800 text-white"
        />
      </label>

      <label className="block mb-4">
        Admin Password
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="w-full p-2 rounded bg-gray-800 text-white"
        />
      </label>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        {loading ? 'Posting...' : 'Post Blog'}
      </button>
    </form>
  );
};

export default AdminBlogPostForm;
