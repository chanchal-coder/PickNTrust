import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";

interface CategoryNavigationProps {
  currentCategory: string;
  className?: string;
}

interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
  description: string;
}

export default function CategoryNavigation({ currentCategory, className = "" }: CategoryNavigationProps) {
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories/browse'],
    queryFn: () => fetch('/api/categories/browse').then(res => res.json()),
  });

  // Normalize to a safe array to prevent runtime errors if API returns
  // an object or an unexpected shape
  const safeCategories: Category[] = Array.isArray(categories) ? categories : [];

  const decodedCurrentCategory = decodeURIComponent(currentCategory);

  // Categories that have gender-specific products
  const genderSpecificCategories = [
    'Fashion & Clothing',
    'Health & Beauty',
    'Footwear & Accessories',
    'Jewelry & Watches', 
    'Beauty & Grooming'
  ];

  // Color fallbacks to ensure colorful UI even when API lacks category color/icon
  const colorMap: Record<string, string> = {
    'Electronics & Gadgets': '#3B82F6', // blue
    'AI Apps & Services': '#8B5CF6',    // violet
    'AI Apps': '#8B5CF6',               // violet (fallback)
    'AI Tools': '#A78BFA',              // light violet
    'Automotive': '#F59E0B',            // amber
    'Fashion & Clothing': '#EC4899',    // pink
    'Footwear & Accessories': '#10B981', // emerald
    'Jewelry & Watches': '#F472B6',     // rose
    'Beauty & Grooming': '#A3E635',     // lime
    'Beauty & Personal Care': '#06B6D4',// cyan
    'Beauty': '#EC4899',               // pink (fallback)
    'Computers': '#3B82F6',            // blue
    'Electronics': '#6366F1',          // indigo
    'Finance': '#F59E0B',              // amber
    'Grocery': '#22C55E',              // green
    'Services': '#14B8A6',             // teal
    'Test': '#64748B',                 // slate
    'Home & Living': '#22C55E',         // green
    'Health & Fitness': '#EF4444',      // red
    'Sports & Outdoors': '#FB923C',     // orange
    'Pet Supplies': '#6366F1',          // indigo
    'Books & Education': '#7C3AED',     // purple
    'Travel & Luggage': '#0EA5E9',      // sky
    'Special Deals': '#14B8A6'          // teal
  };

  // Detect greyish colors to avoid dull tabs when API provides grey
  const isGreyish = (value: string) => {
    const s = String(value || '').trim().toLowerCase();
    if (/^linear-gradient\s*\(/i.test(s)) return false;
    const knownGreys = new Set([
      '#000000','#111827','#1f2937','#374151','#4b5563','#6b7280',
      '#9ca3af','#d1d5db','#e5e7eb','#f3f4f6','#64748b','#94a3b8',
      '#334155','#475569'
    ]);
    if (knownGreys.has(s)) return true;
    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s)) {
      let hex = s.slice(1);
      if (hex.length === 3) hex = hex.split('').map(ch => ch + ch).join('');
      const intVal = parseInt(hex, 16);
      const r = (intVal >> 16) & 255;
      const g = (intVal >> 8) & 255;
      const b = intVal & 255;
      const diff = Math.max(r, g, b) - Math.min(r, g, b);
      return diff < 15; // low contrast -> greyish
    }
    const rgbMatch = s.match(/^rgba?\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*[\d\.]+\s*)?\)$/);
    if (rgbMatch) {
      const r = Number(rgbMatch[1]);
      const g = Number(rgbMatch[2]);
      const b = Number(rgbMatch[3]);
      const diff = Math.max(r, g, b) - Math.min(r, g, b);
      return diff < 15;
    }
    const hslMatch = s.match(/^hsla?\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%(?:\s*,\s*[\d\.]+\s*)?\)$/);
    if (hslMatch) {
      const sat = Number(hslMatch[2]);
      return sat < 12;
    }
    const namedGreys = ['gray','grey','slate','stone','neutral'];
    if (namedGreys.some(n => s.includes(n))) return true;
    return false;
  };

  // Robust color resolver: prefer valid API color, else named fallback, else hash palette
  const resolveColor = (name: string, provided?: string) => {
    const trimmed = String(provided || '').trim();
    const isHex = /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/.test(trimmed);
    const isRgb = /^rgb\s*\(/i.test(trimmed) || /^rgba\s*\(/i.test(trimmed);
    const isHsl = /^hsl\s*\(/i.test(trimmed) || /^hsla\s*\(/i.test(trimmed);
    const isGradient = /^linear-gradient\s*\(/i.test(trimmed);
    if (trimmed && (isHex || isRgb || isHsl || isGradient)) {
      if (!isGradient && isGreyish(trimmed)) {
        // ignore greyish API colors to keep tabs vibrant
      } else {
        return trimmed;
      }
    }
    if (colorMap[name]) return colorMap[name];
    const palette = ['#3B82F6','#8B5CF6','#10B981','#F59E0B','#EF4444','#14B8A6','#6366F1','#0EA5E9','#A3E635','#FB923C'];
    const hash = Math.abs(Array.from(name).reduce((acc, ch) => acc + ch.charCodeAt(0), 0));
    return palette[hash % palette.length];
  };

  // Extract a usable hex color from any string (gradient -> first hex)
  const extractHex = (value: string, fallbackName: string) => {
    const hexMatch = String(value || '').match(/#([0-9A-Fa-f]{6})/);
    if (hexMatch) return `#${hexMatch[1]}`;
    const isHex = /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/.test(String(value || ''));
    if (isHex) return String(value);
    // fallback to named map
    return colorMap[fallbackName] || '#6366F1';
  };

  // Get related categories (same group or similar)
  const getRelatedCategories = (currentCat: string) => {
    const categoryGroups: Record<string, string[]> = {
      'Tech & Electronics': ['Electronics & Gadgets', 'AI Apps & Services', 'Automotive'],
      'Fashion & Style': ['Fashion & Clothing', 'Footwear & Accessories', 'Jewelry & Watches', 'Beauty & Grooming', 'Beauty & Personal Care'],
      'Home & Lifestyle': ['Home & Living', 'Health & Fitness', 'Sports & Outdoors', 'Pet Supplies'],
      'Learning & Travel': ['Books & Education', 'Travel & Luggage'],
      'Special': ['Special Deals']
    };

    // Find which group the current category belongs to
    for (const groupCategories of Object.values(categoryGroups)) {
      if (groupCategories.includes(currentCat)) {
        // Build display items from API when available, otherwise add colorful fallbacks
        return groupCategories.map((name) => {
          const apiCat = safeCategories.find(c => c.name === name);
          const resolved = resolveColor(name, apiCat?.color);
          return {
            id: apiCat?.id ?? 0,
            name,
            icon: (apiCat?.icon && apiCat.icon.trim()) ? apiCat.icon : 'fas fa-tags',
            color: resolved,
            description: apiCat?.description ?? ''
          } as Category;
        });
      }
    }

    // If not in any group, return all categories from API or a colorful minimal set
    if (safeCategories.length > 0) {
      // Ensure each API category has a color/icon fallback so tabs are colorful
      return safeCategories.map((c) => {
        const resolved = resolveColor(c.name, c.color);
        return {
          ...c,
          icon: (c.icon && c.icon.trim()) ? c.icon : 'fas fa-tags',
          color: resolved
        };
      });
    }
    const fallbackNames = Object.keys(colorMap);
    return fallbackNames.map((name) => ({
      id: 0,
      name,
      icon: 'fas fa-tags',
      color: resolveColor(name, colorMap[name]),
      description: ''
    }));
  };

  const relatedCategories = getRelatedCategories(decodedCurrentCategory);
  const isCurrentGenderSpecific = genderSpecificCategories.includes(decodedCurrentCategory);

  // Helper: convert hex to RGBA for soft tinted backgrounds
  const hexToRgba = (hex: string, alpha = 0.15) => {
    const match = String(hex || '').trim().match(/^#?([0-9a-fA-F]{6})$/);
    if (!match) {
      // Subtle indigo tint fallback
      return 'rgba(99, 102, 241, 0.12)';
    }
    const intVal = parseInt(match[1], 16);
    const r = (intVal >> 16) & 255;
    const g = (intVal >> 8) & 255;
    const b = intVal & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const softBg = (hex: string) => hexToRgba(hex, 0.4);

  // Lighten by mixing with white for vibrant gradients
  const lightenHex = (hex: string, t = 0.35) => {
    const match = String(hex || '').trim().match(/^#?([0-9a-fA-F]{6})$/);
    const base = match ? parseInt(match[1], 16) : 0x6366F1; // indigo fallback
    const r = (base >> 16) & 255;
    const g = (base >> 8) & 255;
    const b = base & 255;
    const lr = Math.round(r + (255 - r) * t);
    const lg = Math.round(g + (255 - g) * t);
    const lb = Math.round(b + (255 - b) * t);
    return `rgb(${lr}, ${lg}, ${lb})`;
  };

  return (
    <div className={`bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
              {isCurrentGenderSpecific ? 'Related Categories' : 'Switch Categories'}
            </h3>
            <Link 
              href="/"
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
            >
              ← Back to Home
            </Link>
          </div>
          
          {/* Category Tabs */}
          <div className="flex overflow-x-auto pb-2 space-x-3 scrollbar-hide">
            {relatedCategories.map((category) => {
              const isActive = decodedCurrentCategory === category.name;
              const isGradient = /^linear-gradient\s*\(/i.test(category.color);
              const baseHex = extractHex(category.color, category.name);
              const anchorStyle = isGradient
                ? { background: category.color }
                : { backgroundColor: baseHex };
              const borderColor = isActive ? '#FFFFFF' : baseHex;
              const borderWidth = isActive ? '2px' : '1px';
              return (
                <Link
                  key={category.name}
                  href={`/category/${encodeURIComponent(category.name)}`}
                  className={`flex-shrink-0 transition-transform hover:scale-105`}
                  style={{
                    ...anchorStyle,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.5rem',
                    color: '#FFFFFF',
                    borderStyle: 'solid',
                    borderColor,
                    borderWidth,
                    backgroundBlendMode: 'normal',
                    mixBlendMode: 'normal',
                    filter: 'none',
                    opacity: 1,
                    position: 'relative',
                    zIndex: 10,
                    isolation: 'isolate',
                    boxShadow: `0 0 0 ${isActive ? '2px' : '1px'} ${baseHex}`,
                  }}
                >
                  <i className={`${category.icon} text-sm`}></i>
                  <span className="text-sm font-medium">{category.name}</span>
                  {isActive && <i className="fas fa-check text-xs"></i>}
                  {/* Remove any opacity overlays on icons */}
                </Link>
              );
            })}
          </div>

          {/* Show all categories link */}
          <div className="mt-3 text-center">
            <Link 
              href="/#categories"
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium"
            >
              View All Categories →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
