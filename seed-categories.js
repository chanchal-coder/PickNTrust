import { createClient } from '@supabase/supabase-js';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { categories } from './shared/sqlite-schema.js';

// Use SQLite database
const sqlite = new Database('sqlite.db');
const db = drizzle(sqlite);

const categoriesData = [
  {
    name: 'Electronics & Gadgets',
    description: 'Latest tech & gadgets',
    icon: 'fas fa-laptop',
    color: '#6366F1'
  },
  {
    name: 'Fashion & Clothing',
    description: 'Trendy fashion items',
    icon: 'fas fa-tshirt',
    color: '#EC4899'
  },
  {
    name: 'Home & Kitchen',
    description: 'Home essentials',
    icon: 'fas fa-home',
    color: '#10B981'
  },
  {
    name: 'Health & Beauty',
    description: 'Beauty & wellness',
    icon: 'fas fa-heart',
    color: '#F59E0B'
  },
  {
    name: 'Sports & Fitness',
    description: 'Fitness equipment',
    icon: 'fas fa-dumbbell',
    color: '#EF4444'
  },
  {
    name: 'Books & Education',
    description: 'Learning resources',
    icon: 'fas fa-book',
    color: '#8B5CF6'
  },
  {
    name: 'Toys & Games',
    description: 'Fun for all ages',
    icon: 'fas fa-gamepad',
    color: '#06B6D4'
  },
  {
    name: 'Automotive',
    description: 'Car accessories',
    icon: 'fas fa-car',
    color: '#84CC16'
  },
  {
    name: 'Travel & Luggage',
    description: 'Travel essentials',
    icon: 'fas fa-suitcase',
    color: '#F97316'
  },
  {
    name: 'Pet Supplies',
    description: 'Pet care products',
    icon: 'fas fa-paw',
    color: '#14B8A6'
  },
  {
    name: 'Office Supplies',
    description: 'Work essentials',
    icon: 'fas fa-briefcase',
    color: '#6B7280'
  },
  {
    name: 'Garden & Outdoor',
    description: 'Outdoor living',
    icon: 'fas fa-leaf',
    color: '#22C55E'
  },
  {
    name: 'Baby & Kids',
    description: 'Child care items',
    icon: 'fas fa-baby',
    color: '#F472B6'
  },
  {
    name: 'Music & Instruments',
    description: 'Musical equipment',
    icon: 'fas fa-music',
    color: '#A855F7'
  },
  {
    name: 'Art & Crafts',
    description: 'Creative supplies',
    icon: 'fas fa-palette',
    color: '#FB7185'
  },
  {
    name: 'Food & Beverages',
    description: 'Gourmet foods',
    icon: 'fas fa-utensils',
    color: '#FBBF24'
  },
  {
    name: 'Jewelry & Watches',
    description: 'Luxury accessories',
    icon: 'fas fa-gem',
    color: '#C084FC'
  },
  {
    name: 'Photography',
    description: 'Camera equipment',
    icon: 'fas fa-camera',
    color: '#60A5FA'
  },
  {
    name: 'Gaming',
    description: 'Gaming gear',
    icon: 'fas fa-gamepad',
    color: '#34D399'
  },
  {
    name: 'Tools & Hardware',
    description: 'DIY tools',
    icon: 'fas fa-tools',
    color: '#F87171'
  },
  {
    name: 'Collectibles',
    description: 'Rare collectibles',
    icon: 'fas fa-trophy',
    color: '#FBBF24'
  },
  {
    name: 'Software & Apps',
    description: 'Digital products',
    icon: 'fas fa-code',
    color: '#818CF8'
  },
  {
    name: 'Subscription Services',
    description: 'Monthly services',
    icon: 'fas fa-calendar',
    color: '#FB923C'
  },
  {
    name: 'Gift Cards',
    description: 'Digital gift cards',
    icon: 'fas fa-gift',
    color: '#F472B6'
  },
  {
    name: 'Courses & Training',
    description: 'Online learning',
    icon: 'fas fa-graduation-cap',
    color: '#A78BFA'
  },
  {
    name: 'Streaming Services',
    description: 'Entertainment',
    icon: 'fas fa-play',
    color: '#EF4444'
  },
  {
    name: 'Cloud Storage',
    description: 'Data storage',
    icon: 'fas fa-cloud',
    color: '#06B6D4'
  },
  {
    name: 'VPN & Security',
    description: 'Online security',
    icon: 'fas fa-shield-alt',
    color: '#10B981'
  },
  {
    name: 'Web Hosting',
    description: 'Website hosting',
    icon: 'fas fa-server',
    color: '#6B7280'
  },
  {
    name: 'Design Tools',
    description: 'Creative software',
    icon: 'fas fa-paint-brush',
    color: '#F59E0B'
  },
  {
    name: 'Productivity Apps',
    description: 'Work efficiency',
    icon: 'fas fa-tasks',
    color: '#8B5CF6'
  },
  {
    name: 'Marketing Tools',
    description: 'Business growth',
    icon: 'fas fa-chart-line',
    color: '#14B8A6'
  },
  {
    name: 'E-commerce Platforms',
    description: 'Online stores',
    icon: 'fas fa-shopping-cart',
    color: '#F97316'
  },
  {
    name: 'Communication Tools',
    description: 'Team collaboration',
    icon: 'fas fa-comments',
    color: '#84CC16'
  },
  {
    name: 'Finance & Crypto',
    description: 'Financial tools',
    icon: 'fas fa-coins',
    color: '#FBBF24'
  },
  {
    name: 'AI Apps & Services',
    description: 'AI-powered tools',
    icon: 'fas fa-robot',
    color: '#A855F7'
  }
];

async function seedCategories() {
  try {
    console.log('🌱 Seeding categories...');
    
    // Clear existing categories
    await db.delete(categories);
    console.log('✅ Cleared existing categories');
    
    // Insert new categories
    for (const category of categoriesData) {
      await db.insert(categories).values({
        name: category.name,
        description: category.description,
        icon: category.icon,
        color: category.color,
        createdAt: new Date()
      });
    }
    
    console.log(`✅ Successfully seeded ${categoriesData.length} categories!`);
    console.log('Categories include:');
    categoriesData.forEach((cat, index) => {
      console.log(`${index + 1}. ${cat.name} (${cat.icon})`);
    });
    
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
  } finally {
    sqlite.close();
  }
}

seedCategories();
