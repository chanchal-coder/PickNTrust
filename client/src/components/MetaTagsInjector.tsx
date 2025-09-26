import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

interface MetaTag {
  id?: number;
  name: string;
  content: string;
  provider: string;
  purpose: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export default function MetaTagsInjector() {
  // Fetch active meta tags from the public API
  const { data: metaTags } = useQuery({
    queryKey: ['/api/meta-tags/active'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/meta-tags/active');
        if (!response.ok) {
          throw new Error('Failed to fetch meta tags');
        }
        const data = await response.json();
        return data.metaTags || [];
      } catch (error) {
        console.warn('Failed to fetch meta tags:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!metaTags || metaTags.length === 0) {
      return;
    }

    // Store references to created meta tags for cleanup
    const createdTags: HTMLMetaElement[] = [];

    // Function to create or update meta tag
    const createOrUpdateMetaTag = (name: string, content: string) => {
      // Check if meta tag already exists
      let existingTag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
      
      if (existingTag) {
        // Update existing tag
        existingTag.setAttribute('content', content);
        existingTag.setAttribute('data-injected', 'true');
      } else {
        // Create new meta tag
        const metaTag = document.createElement('meta');
        metaTag.setAttribute('name', name);
        metaTag.setAttribute('content', content);
        metaTag.setAttribute('data-injected', 'true');
        metaTag.setAttribute('data-purpose', 'ownership-verification');
        
        // Insert meta tag in head
        document.head.appendChild(metaTag);
        createdTags.push(metaTag);
      }
    };

    // Inject all active meta tags
    metaTags.forEach((tag: MetaTag) => {
      // Check if tag is active (default to true if not specified)
      const isActive = tag.is_active !== undefined ? tag.is_active : true;
      if (isActive) {
        createOrUpdateMetaTag(tag.name, tag.content);
      }
    });

    // Cleanup function to remove injected tags when component unmounts
    return () => {
      // Remove only the tags we created (not existing ones)
      createdTags.forEach(tag => {
        if (tag.parentNode) {
          tag.parentNode.removeChild(tag);
        }
      });
      
      // Also remove any tags that were updated and marked as injected
      const injectedTags = document.querySelectorAll('meta[data-injected="true"]');
      injectedTags.forEach(tag => {
        // Only remove if it was created by us (has data-purpose attribute)
        if (tag.getAttribute('data-purpose') === 'ownership-verification') {
          if (tag.parentNode) {
            tag.parentNode.removeChild(tag);
          }
        } else {
          // For updated existing tags, just remove our marker attributes
          tag.removeAttribute('data-injected');
        }
      });
    };
  }, [metaTags]);

  // This component doesn't render anything visible
  return null;
}