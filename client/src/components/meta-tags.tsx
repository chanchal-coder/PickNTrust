import { useEffect } from 'react';

interface MetaTagsProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

export default function MetaTags({ 
  title = "PickNTrust - Best Deals & Trusted Products",
  description = "Discover amazing deals on trusted products. Hand-picked items with verified reviews and best prices.",
  image = "/og-image.jpg",
  url,
  type = "website"
}: MetaTagsProps) {
  
  useEffect(() => {
    const currentUrl = url || window.location.href;
    const fullImageUrl = image.startsWith('http') ? image : `${window.location.origin}${image}`;
    
    // Update document title
    document.title = title;
    
    // Helper function to update or create meta tag
    const updateMetaTag = (property: string, content: string, isProperty = true) => {
      const selector = isProperty ? `meta[property="${property}"]` : `meta[name="${property}"]`;
      let tag = document.querySelector(selector) as HTMLMetaElement;
      
      if (!tag) {
        tag = document.createElement('meta');
        if (isProperty) {
          tag.setAttribute('property', property);
        } else {
          tag.setAttribute('name', property);
        }
        document.head.appendChild(tag);
      }
      
      tag.setAttribute('content', content);
    };
    
    // Basic meta tags
    updateMetaTag('description', description, false);
    
    // Open Graph tags
    updateMetaTag('og:title', title);
    updateMetaTag('og:description', description);
    updateMetaTag('og:image', fullImageUrl);
    updateMetaTag('og:url', currentUrl);
    updateMetaTag('og:type', type);
    updateMetaTag('og:site_name', 'PickNTrust');
    
    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image', false);
    updateMetaTag('twitter:title', title, false);
    updateMetaTag('twitter:description', description, false);
    updateMetaTag('twitter:image', fullImageUrl, false);
    updateMetaTag('twitter:site', '@PickNTrust', false);
    updateMetaTag('twitter:creator', '@PickNTrust', false);
    
    // Additional meta tags for better SEO
    updateMetaTag('robots', 'index, follow', false);
    updateMetaTag('viewport', 'width=device-width, initial-scale=1.0', false);
    
    // Cleanup function to reset to default when component unmounts
    return () => {
      // Reset to default values when component unmounts
      document.title = "PickNTrust - Best Deals & Trusted Products";
    };
  }, [title, description, image, url, type]);
  
  return null; // This component doesn't render anything
}
