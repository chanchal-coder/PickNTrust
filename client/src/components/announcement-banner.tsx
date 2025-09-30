import { useState, useEffect } from 'react';

interface Announcement {
  id: number;
  message: string;
  isActive: boolean;
  textColor: string;
  backgroundColor: string;
  fontSize: string;
  fontWeight: string;
  textDecoration?: string;
  fontStyle?: string;
  animationSpeed: string;
  textBorderWidth?: string;
  textBorderStyle?: string;
  textBorderColor?: string;
  bannerBorderWidth?: string;
  bannerBorderStyle?: string;
  bannerBorderColor?: string;
  page?: string; // Page-specific announcement
  isGlobal?: boolean; // Global announcement for all pages
  createdAt: string;
}

interface AnnouncementBannerProps {
  page?: string; // Current page identifier
}

export function AnnouncementBanner({ page }: AnnouncementBannerProps = {}) {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let abortController = new AbortController();
    
    const fetchActiveAnnouncement = async () => {
      try {
        // Fetch page-specific announcement first, then global as fallback
        const pageParam = page ? `&page=${encodeURIComponent(page)}` : '';
        const response = await fetch(`/api/announcement/active?t=${Date.now()}${pageParam}`, {
          signal: abortController.signal
        });
        
        if (response.ok && isMounted) {
          const data = await response.json();
          setAnnouncement(data);
          setIsLoaded(true);
        } else if (response.status === 404 && isMounted) {
          // No active announcement found
          setAnnouncement(null);
          setIsLoaded(true);
        }
      } catch (error) {
        if (error.name !== 'AbortError' && isMounted) {
          console.error('Failed to fetch announcement:', error);
          setIsLoaded(true);
        }
      }
    };

    // Initial fetch
    fetchActiveAnnouncement();
    
    // Set up polling to refresh announcement data every 30 seconds (reduced frequency)
    const interval = setInterval(() => {
      if (isMounted) {
        // Cancel previous request before making new one
        abortController.abort();
        abortController = new AbortController();
        fetchActiveAnnouncement();
      }
    }, 30000);
    
    return () => {
      isMounted = false;
      abortController.abort();
      clearInterval(interval);
    };
  }, [page]);

  if (!isLoaded || !announcement || !announcement.isActive || !isVisible) {
    return null;
  }

  const handleClose = () => {
    setIsVisible(false);
  };

  return (
    <>
      <style>{`
        @keyframes marqueeScroll {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        
        .announcement-marquee {
          animation: marqueeScroll ${announcement.animationSpeed}s linear infinite;
          white-space: nowrap;
          display: block;
        }
      `}</style>
      
      <div 
        className="relative overflow-hidden border-b border-gray-200 dark:border-gray-600"
        style={{ 
          backgroundColor: announcement.backgroundColor,
          minHeight: '35px',
          maxWidth: '100vw',
          width: '100%',
          boxSizing: 'border-box',
          border: `${announcement.bannerBorderWidth || '0px'} ${announcement.bannerBorderStyle || 'solid'} ${announcement.bannerBorderColor || '#000000'}`
        }}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 z-10 w-6 h-6 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/30 text-white text-sm transition-colors"
          title="Close announcement"
        >
          ×
        </button>

        {/* Marquee Text */}
        <div className="py-1 overflow-hidden" style={{ maxWidth: '100%', width: '100%' }}>
          <div 
            className="announcement-marquee"
            style={{
              color: announcement.textColor,
              fontSize: announcement.fontSize,
              fontWeight: announcement.fontWeight,
              textDecoration: announcement.textDecoration || 'none',
              fontStyle: announcement.fontStyle || 'normal',
              textShadow: `${announcement.textBorderWidth || '0px'} 0 0 ${announcement.textBorderColor || '#000000'}, 0 ${announcement.textBorderWidth || '0px'} 0 ${announcement.textBorderColor || '#000000'}, -${announcement.textBorderWidth || '0px'} 0 0 ${announcement.textBorderColor || '#000000'}, 0 -${announcement.textBorderWidth || '0px'} 0 ${announcement.textBorderColor || '#000000'}`
            }}
          >
            {announcement.message}
          </div>
        </div>
      </div>
    </>
  );
}
