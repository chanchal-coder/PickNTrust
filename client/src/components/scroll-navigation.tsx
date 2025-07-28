import { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export default function ScrollNavigation() {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const documentHeight = document.documentElement.scrollHeight;
      const windowHeight = window.innerHeight;
      const scrolledPercent = scrollTop / (documentHeight - windowHeight);

      // Show scroll-to-top button after scrolling 200px
      setShowScrollTop(scrollTop > 200);
      
      // Hide scroll-to-bottom button when near bottom (95% scrolled)
      setShowScrollDown(scrolledPercent < 0.95);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth'
    });
  };

  return (
    <div className="scroll-nav-container fixed right-6 bottom-6 md:right-6 md:bottom-6 z-[60] flex flex-col gap-3">
      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="group relative scroll-nav-button bg-navy/90 hover:bg-bright-blue text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-110 border border-white/20"
          aria-label="Scroll to top"
        >
          <ChevronUp className="w-6 h-6" />
          <span className="tooltip absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900/90 text-white text-sm px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap backdrop-blur-sm">
            Go to Top
          </span>
        </button>
      )}

      {/* Scroll to Bottom Button */}
      {showScrollDown && (
        <button
          onClick={scrollToBottom}
          className="group relative scroll-nav-button bg-navy/90 hover:bg-bright-blue text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-110 border border-white/20"
          aria-label="Scroll to bottom"
        >
          <ChevronDown className="w-6 h-6" />
          <span className="tooltip absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900/90 text-white text-sm px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap backdrop-blur-sm">
            Go to Bottom
          </span>
        </button>
      )}
    </div>
  );
}