const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing all React Query issues...\n');

// Files that need React Query fixes
const filesToFix = [
  'client/src/pages/videos.tsx',
  'client/src/pages/services.tsx',
  'client/src/pages/blog.tsx',
  'client/src/pages/blog-post.tsx',
  'client/src/pages/admin.tsx',
  'client/src/components/videos-section.tsx',
  'client/src/components/admin/VideoContentManager.tsx',
  'client/src/components/admin/SimplifiedBlogForm.tsx',
  'client/src/components/admin/CategoryManagement.tsx',
  'client/src/components/category-navigation.tsx',
  'client/src/components/categories.tsx',
  'client/src/components/cards-apps-services.tsx',
  'client/src/components/blog-section.tsx',
  'client/src/components/admin/AnnouncementManagement.tsx'
];

// Common patterns to fix
const fixes = [
  // Fix missing queryFn for video content
  {
    pattern: /const { data: videos.*?} = useQuery\(\{\s*queryKey: \[['"]\/api\/video-content['"]\],?\s*\}\);?/gs,
    replacement: `const { data: videos = [], isLoading } = useQuery({
    queryKey: ['/api/video-content'],
    queryFn: async () => {
      const response = await fetch('/api/video-content');
      if (!response.ok) throw new Error('Failed to fetch videos');
      return response.json();
    },
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });`
  },
  
  // Fix missing queryFn for services
  {
    pattern: /const { data: services.*?} = useQuery<Product\[\]>\(\{\s*queryKey: \[['"]\/api\/products\/services['"]\],?\s*\}\);?/gs,
    replacement: `const { data: services } = useQuery<Product[]>({
    queryKey: ['/api/products/services'],
    queryFn: async (): Promise<Product[]> => {
      const response = await fetch('/api/products/services');
      if (!response.ok) throw new Error('Failed to fetch services');
      return response.json();
    },
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });`
  },
  
  // Fix missing queryFn for blog posts
  {
    pattern: /const { data: blogPosts.*?} = useQuery<BlogPost\[\]>\(\{\s*queryKey: \[['"]\/api\/blog['"]\],?\s*\}\);?/gs,
    replacement: `const { data: blogPosts, isLoading } = useQuery<BlogPost[]>({
    queryKey: ['/api/blog'],
    queryFn: async (): Promise<BlogPost[]> => {
      const response = await fetch('/api/blog');
      if (!response.ok) throw new Error('Failed to fetch blog posts');
      return response.json();
    },
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });`
  },
  
  // Fix missing queryFn for categories
  {
    pattern: /const { data: categories.*?} = useQuery\(\{\s*queryKey: \[['"]\/api\/categories['"]\],?\s*\}\);?/gs,
    replacement: `const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    },
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });`
  },
  
  // Fix missing queryFn for announcements
  {
    pattern: /const { data: announcements.*?} = useQuery\(\{\s*queryKey: \[['"]\/api\/admin\/announcements['"]\],?\s*\}\);?/gs,
    replacement: `const { data: announcements = [], isLoading, error } = useQuery({
    queryKey: ['/api/admin/announcements'],
    queryFn: async () => {
      const response = await fetch('/api/admin/announcements');
      if (!response.ok) throw new Error('Failed to fetch announcements');
      return response.json();
    },
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });`
  }
];

let totalFixed = 0;

filesToFix.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    let fileFixed = false;
    
    fixes.forEach(fix => {
      if (fix.pattern.test(content)) {
        content = content.replace(fix.pattern, fix.replacement);
        fileFixed = true;
      }
    });
    
    if (fileFixed) {
      fs.writeFileSync(filePath, content);
      console.log(`Success Fixed: ${filePath}`);
      totalFixed++;
    } else {
      console.log(`⏭️  Skipped: ${filePath} (no issues found)`);
    }
  } else {
    console.log(`Error Not found: ${filePath}`);
  }
});

console.log(`\nTarget Summary: Fixed ${totalFixed} files with React Query issues`);
console.log('\nSuccess All React Query queryFn issues should now be resolved!');
