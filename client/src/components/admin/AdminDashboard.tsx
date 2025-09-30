import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AdminStats {
  totalProducts: number;
  featuredProducts: number;
  blogPosts: number;
  affiliateNetworks: number;
}

export default function AdminDashboard() {
  // Fetch admin stats
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['/api/admin/stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch admin stats');
      }
      return response.json();
    },
    retry: 1
  });

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Error Loading Dashboard</CardTitle>
          <CardDescription>
            Failed to load dashboard statistics. Check your server connection.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-300 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-300 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statsCards = [
    {
      title: 'Total Products',
      value: stats?.totalProducts || 0,
      description: 'Products in your catalog',
      icon: '<i className="fas fa-box"></i>',
      color: 'text-blue-600'
    },
    {
      title: 'Featured Products',
      value: stats?.featuredProducts || 0,
      description: 'Currently featured items',
      icon: '⭐',
      color: 'text-yellow-600'
    },
    {
      title: 'Blog Posts',
      value: stats?.blogPosts || 0,
      description: 'Published blog articles',
      icon: '<i className="fas fa-edit"></i>',
      color: 'text-green-600'
    },
    {
      title: 'Affiliate Networks',
      value: stats?.affiliateNetworks || 0,
      description: 'Connected networks',
      icon: '<i className="fas fa-link"></i>',
      color: 'text-purple-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-navy dark:text-blue-400">
            Welcome to PickNTrust Admin Dashboard
          </CardTitle>
          <CardDescription>
            Manage your products, categories, blog posts, and more from this central hub.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-navy dark:text-blue-400 mb-2">
              Quick Actions
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Use the tabs above to navigate between different management sections:
            </p>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li>• <strong>Products:</strong> Add, edit, and manage your product catalog</li>
              <li>• <strong>Categories:</strong> Organize products into categories with custom icons</li>
              <li>• <strong>Blog Posts:</strong> Create and manage blog content</li>
              <li>• <strong>Announcements:</strong> Create promotional banners for your site</li>
              <li>• <strong>Settings:</strong> Configure social media links and other settings</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((card, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {card.title}
              </CardTitle>
              <span className="text-2xl">{card.icon}</span>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${card.color} mb-1`}>
                {card.value.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {card.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>
            Current system information and status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <div>
                  <p className="font-semibold text-green-800 dark:text-green-400">API Status</p>
                  <p className="text-sm text-green-600 dark:text-green-300">All systems operational</p>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                <div>
                  <p className="font-semibold text-blue-800 dark:text-blue-400">Database</p>
                  <p className="text-sm text-blue-600 dark:text-blue-300">Connected and healthy</p>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                <div>
                  <p className="font-semibold text-purple-800 dark:text-purple-400">Admin Panel</p>
                  <p className="text-sm text-purple-600 dark:text-purple-300">Fully functional</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Tips */}
      <Card>
        <CardHeader>
          <CardTitle><i className="fas fa-lightbulb"></i> Quick Tips</CardTitle>
          <CardDescription>
            Tips to help you manage your PickNTrust website effectively
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <span className="text-blue-500 mt-1"><i className="fas fa-box"></i></span>
                <div>
                  <h4 className="font-semibold text-sm">Product Management</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Keep your product information up-to-date with accurate prices and descriptions.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-green-500 mt-1"><i className="fas fa-tag"></i></span>
                <div>
                  <h4 className="font-semibold text-sm">Category Organization</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Use clear category names and appropriate icons for better user experience.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <span className="text-purple-500 mt-1"><i className="fas fa-edit"></i></span>
                <div>
                  <h4 className="font-semibold text-sm">Content Creation</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Regular blog posts help improve SEO and engage your audience.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-orange-500 mt-1"><i className="fas fa-bullhorn"></i></span>
                <div>
                  <h4 className="font-semibold text-sm">Announcements</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Use announcements to highlight special offers and important updates.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
