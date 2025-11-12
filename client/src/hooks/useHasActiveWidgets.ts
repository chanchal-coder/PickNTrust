import { useQuery } from '@tanstack/react-query';

interface Widget {
  id: number;
  name: string;
  position: string;
  is_active: number | boolean;
  show_on_mobile?: number | boolean;
  show_on_desktop?: number | boolean;
}

// Detect current device type once per mount
function useIsMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
}

// Returns true if the given page has any active widgets visible on the current device
export default function useHasActiveWidgets(page: string) {
  const isMobile = useIsMobile();

  return useQuery<boolean>({
    queryKey: ['/api/widgets/page-has-active', page, isMobile ? 'mobile' : 'desktop'],
    queryFn: async () => {
      // Fetch all active widgets for the page
      const res = await fetch(`/api/widgets/${page}`);
      if (!res.ok) {
        // Treat errors as "no widgets" to keep layout stable
        return false;
      }
      const widgets: Widget[] = await res.json();

      if (!Array.isArray(widgets) || widgets.length === 0) return false;

      // Filter by device visibility if flags are present
      const visible = widgets.some((w) => {
        const active = Boolean((w as any).is_active ?? true);
        if (!active) return false;
        const showMobile = (w.show_on_mobile === undefined) ? true : Boolean(w.show_on_mobile);
        const showDesktop = (w.show_on_desktop === undefined) ? true : Boolean(w.show_on_desktop);
        return isMobile ? showMobile : showDesktop;
      });

      return visible;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}