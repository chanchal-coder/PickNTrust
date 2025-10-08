import { useQuery } from '@tanstack/react-query';

interface RawWidget {
  id: number;
  name: string;
  body?: string;
  code?: string;
  target_page: string;
  position: string;
  is_active: number | boolean;
  display_order?: number;
  max_width?: string;
  custom_css?: string;
  show_on_mobile?: number | boolean;
  show_on_desktop?: number | boolean;
  external_link?: string;
}

// Detect whether a page has any active widgets visible to the current device
export function useHasActiveWidgets(page: string) {
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;

  return useQuery<boolean>({
    queryKey: ['has-widgets', page, isMobile],
    queryFn: async () => {
      const positions = [
        'body',
        'product-grid-top',
        'product-grid-bottom',
        'content-top',
        'content-middle',
        'content-bottom'
      ];

      const fetches = positions.map(async (pos) => {
        try {
          const res = await fetch(`/api/widgets/${page}/${pos}`);
          if (!res.ok) return [] as RawWidget[];
          return (await res.json()) as RawWidget[];
        } catch {
          return [] as RawWidget[];
        }
      });

      const results = await Promise.all(fetches);
      const widgets = results.flat();

      // Visible if active and device visibility matches
      const visible = widgets.some((w) => {
        const active = Boolean(w.is_active);
        const showMobile = w.show_on_mobile === undefined ? true : Boolean(w.show_on_mobile);
        const showDesktop = w.show_on_desktop === undefined ? true : Boolean(w.show_on_desktop);
        const deviceOk = isMobile ? showMobile : showDesktop;
        return active && deviceOk;
      });

      return visible;
    },
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
  });
}

export default useHasActiveWidgets;