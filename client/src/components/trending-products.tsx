import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import AmazonProductCard from '@/components/amazon-product-card';

type Product = {
  id: string;
  name: string;
  imageUrl?: string;
  price?: number;
  originalPrice?: number;
  discountPercent?: number;
  rating?: number;
  slug?: string;
};

const getDailyRotationOffset = () => {
  const today = new Date();
  // Use UTC date to avoid timezone-induced flicker
  const base = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  // Simple rotation: hash of date mod a prime-ish number
  return (base / (24 * 60 * 60 * 1000)) % 97;
};

export default function TrendingProducts() {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

  const { data = [], isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products/page/trending', getDailyRotationOffset()],
    queryFn: async () => {
      const res = await fetch('/api/products/page/trending');
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const rotated = useMemo(() => {
    if (!data || data.length === 0) return [];
    const offset = getDailyRotationOffset() % data.length;
    return [...data.slice(offset), ...data.slice(0, offset)];
  }, [data]);

  // Auto-rotate the horizontal scroller, pausing on hover/visibility, and respecting reduced motion
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    let paused = false;

    const step = el.clientWidth || 320; // advance by a full page width
    const isElementMostlyInView = (node: HTMLElement) => {
      const rect = node.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
      const vertVisible = Math.max(0, Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0));
      const horizVisible = Math.max(0, Math.min(rect.right, viewportWidth) - Math.max(rect.left, 0));
      const areaVisible = vertVisible * horizVisible;
      const areaTotal = rect.width * rect.height || 1;
      return areaVisible / areaTotal > 0.5;
    };

    const advance = () => {
      if (paused || document.hidden || !isElementMostlyInView(el)) return;
      const max = el.scrollWidth - el.clientWidth;
      const next = el.scrollLeft + step;
      if (next >= max - 1) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollTo({ left: next, behavior: 'smooth' });
      }
    };

    const onMouseEnter = () => { paused = true; };
    const onMouseLeave = () => { paused = false; };
    const onTouchStart = () => { paused = true; };
    const onTouchEnd = () => { paused = false; };
    const onVisibility = () => { /* handled via document.hidden in advance() */ };

    el.addEventListener('mouseenter', onMouseEnter);
    el.addEventListener('mouseleave', onMouseLeave);
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);

    const interval = setInterval(advance, 5000); // every 5 seconds

    return () => {
      clearInterval(interval);
      el.removeEventListener('mouseenter', onMouseEnter);
      el.removeEventListener('mouseleave', onMouseLeave);
      el.removeEventListener('touchstart', onTouchStart as EventListener);
      el.removeEventListener('touchend', onTouchEnd as EventListener);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [rotated.length]);

  // Calculate pages and track current page based on scroll position
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const recalc = () => {
      const width = el.clientWidth || 0;
      const rawPages = width > 0 ? Math.ceil(el.scrollWidth / width) : 1;
      const pages = Number.isFinite(rawPages) ? Math.max(1, rawPages) : 1;
      setPageCount(pages);
      const page = width > 0 ? Math.round(el.scrollLeft / width) : 0;
      setCurrentPage(Math.min(pages - 1, Math.max(0, page)));
    };

    recalc();
    const onScroll = () => recalc();
    const onResize = () => recalc();
    el.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      el.removeEventListener('scroll', onScroll as EventListener);
      window.removeEventListener('resize', onResize);
    };
  }, [rotated.length]);

  // Auto-hide if loading or empty (original behavior)
  if (isLoading) return null;
  if (!rotated || rotated.length === 0) return null;

  const scrollBy = (delta: number) => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollBy({ left: delta, behavior: 'smooth' });
    }
  };

  return (
    <section id="trending-products" className="px-4 sm:px-6 lg:px-8 mt-6">
      <div className="relative mb-3">
        <h2 className="text-center text-lg sm:text-xl font-extrabold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent">
          Trending Products
        </h2>
      </div>
      <div className="relative">
        <button
          aria-label="Scroll left"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl hidden sm:flex items-center justify-center"
          onClick={() => scrollBy(-320)}
        >
          <i className="fas fa-chevron-left" />
        </button>
        <div
          ref={scrollerRef}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch', touchAction: 'pan-x' }}
        >
          {rotated.map((p) => (
            <div key={p.id} className="flex-shrink-0 w-64 sm:w-72 snap-start">
              <AmazonProductCard product={p as any} />
            </div>
          ))}
        </div>
        <button
          aria-label="Scroll right"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl hidden sm:flex items-center justify-center"
          onClick={() => scrollBy(320)}
        >
          <i className="fas fa-chevron-right" />
        </button>
        {/* No explicit empty state (original behavior hides section) */}
        {/* Dots pagination like banner */}
        {pageCount > 1 && (
          <div className="mt-3 flex items-center justify-center space-x-2">
            {Array.from({ length: pageCount }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  const el = scrollerRef.current;
                  if (!el) return;
                  el.scrollTo({ left: idx * el.clientWidth, behavior: 'smooth' });
                }}
                className={`w-3 h-3 rounded-full transition-colors ${idx === currentPage ? 'bg-white' : 'bg-white/50'}`}
                aria-label={`Go to page ${idx + 1}`}
              />
            ))}
          </div>
        )}
        {/* Bottom CTA removed to avoid duplication; header has More button */}
      </div>
    </section>
  );
}