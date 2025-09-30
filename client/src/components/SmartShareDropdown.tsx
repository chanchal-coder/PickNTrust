import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: number | string;
  name: string;
  description?: string;
  price?: string | number;
  imageUrl?: string;
  category?: string;
  affiliateUrl?: string;
}

interface SmartShareDropdownProps {
  product: Product;
  className?: string;
  buttonText?: string;
  showIcon?: boolean;
}

interface SharePlatform {
  id: string;
  name: string;
  icon: string;
  color: string;
  available: boolean;
}

export default function SmartShareDropdown({ 
  product, 
  className = "", 
  buttonText = "",
  showIcon = true 
}: SmartShareDropdownProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [platforms, setPlatforms] = useState<SharePlatform[]>([]);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Detect user's system and available platforms
  useEffect(() => {
    const detectPlatforms = (): SharePlatform[] => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      const isDesktop = !isMobile;
      
      const basePlatforms: SharePlatform[] = [
        {
          id: 'copy',
          name: 'Copy Link',
          icon: 'fas fa-copy',
          color: 'text-gray-600',
          available: true // Always available
        },
        {
          id: 'facebook',
          name: 'Facebook',
          icon: 'fab fa-facebook',
          color: 'text-blue-600',
          available: true // Universal
        },
        {
          id: 'twitter',
          name: 'Twitter/X',
          icon: 'fab fa-twitter',
          color: 'text-blue-400',
          available: true // Universal
        },
        {
          id: 'email',
          name: 'Email',
          icon: 'fas fa-envelope',
          color: 'text-gray-600',
          available: true // Universal
        }
      ];

      // Add mobile-specific platforms
      if (isMobile) {
        basePlatforms.push(
          {
            id: 'whatsapp',
            name: 'WhatsApp',
            icon: 'fab fa-whatsapp',
            color: 'text-green-600',
            available: true
          },
          {
            id: 'telegram',
            name: 'Telegram',
            icon: 'fab fa-telegram',
            color: 'text-blue-500',
            available: true
          }
        );
      }

      // Add desktop-specific platforms
      if (isDesktop) {
        // Check if Telegram desktop might be available
        basePlatforms.push({
          id: 'telegram',
          name: 'Telegram',
          icon: 'fab fa-telegram',
          color: 'text-blue-500',
          available: true
        });
      }

      // Sort platforms: Copy Link first, then others
      return basePlatforms
        .filter(p => p.available)
        .sort((a, b) => {
          if (a.id === 'copy') return -1;
          if (b.id === 'copy') return 1;
          return 0;
        })
        .slice(0, 6); // Max 6 options
    };

    const detectedPlatforms = detectPlatforms();
    console.log('Detected platforms:', detectedPlatforms);
    setPlatforms(detectedPlatforms);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleShare = (platformId: string) => {
    const productUrl = `${window.location.origin}/product/${product.id}`;
    const text = `Check out this amazing product: ${product.name}`;
    const subject = `Amazing Deal: ${product.name}`;
    
    switch (platformId) {
      case 'copy':
        navigator.clipboard.writeText(productUrl);
        toast({
          title: 'Link Copied!',
          description: 'Product link copied to clipboard',
        });
        break;
        
      case 'facebook':
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`,
          '_blank',
          'width=600,height=400'
        );
        break;
        
      case 'twitter':
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(productUrl)}`,
          '_blank',
          'width=600,height=400'
        );
        break;
        
      case 'whatsapp':
        window.open(
          `https://wa.me/?text=${encodeURIComponent(text + ' ' + productUrl)}`,
          '_blank'
        );
        break;
        
      case 'telegram':
        window.open(
          `https://t.me/share/url?url=${encodeURIComponent(productUrl)}&text=${encodeURIComponent(text)}`,
          '_blank'
        );
        break;
        
      case 'email':
        window.open(
          `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text + '\n\n' + productUrl)}`,
          '_blank'
        );
        break;
    }
    
    setIsOpen(false);
  };

  return (
    <div className="relative" style={{ zIndex: 9999 }}>
      {/* Share Button */}
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          console.log('Share button clicked, current isOpen:', isOpen);
          setIsOpen(!isOpen);
        }}
        className={`flex items-center gap-1 ${className}`}
        title="Share product"
      >
        {showIcon && <i className="fas fa-share text-xs" />}
        {buttonText && <span className="text-xs">{buttonText}</span>}
      </button>

      {/* Simple Dropdown Menu */}
      {isOpen && (
        <div 
          ref={dropdownRef}
          className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-2 min-w-[180px] max-h-[300px] overflow-y-auto z-[99999]"
          style={{
            transform: 'translateZ(0)',
            willChange: 'transform',
            isolation: 'isolate'
          }}
        >
          <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 px-2">
            Share this product
          </div>
          
          <div className="space-y-1">
            {platforms.length > 0 ? platforms.map((platform) => (
              <button
                key={platform.id}
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare(platform.id);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors text-left"
              >
                <i className={`${platform.icon} ${platform.color} w-4 text-center`} />
                <span className="text-gray-700 dark:text-gray-300">{platform.name}</span>
                {platform.id === 'copy' && (
                  <span className="ml-auto text-xs text-gray-500">⌘C</span>
                )}
              </button>
            )) : (
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                Loading share options...
              </div>
            )}
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-600 mt-2 pt-2">
            <div className="text-xs text-gray-500 dark:text-gray-400 px-2">
              {platforms.length} sharing options available
            </div>
          </div>
        </div>
      )}
    </div>
  );
}