import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import UniversalPageLayout from "@/components/UniversalPageLayout";
import { AnnouncementBanner } from "@/components/announcement-banner";
import PageBanner from "@/components/PageBanner";
import WidgetRenderer from "@/components/WidgetRenderer";

type PublicAd = {
  id: number;
  title: string;
  description?: string;
  imageUrl?: string;
  clickUrl: string;
  size?: string;
  type?: string;
  campaignName?: string;
  startDate?: string;
  endDate?: string;
  // Optional display preference (e.g., Banner, Grid, List)
  viewMode?: string;
  // Optional CTA label shown on Explore cards
  buttonText?: string;
};

export default function Explore() {
  const resolveImageUrl = (url?: string) => {
    if (!url) return '';
    try {
      if (/^https?:\/\//i.test(url)) return url;
      if (url.startsWith('/')) return new URL(url, window.location.origin).href;
      return url;
    } catch {
      return url || '';
    }
  };
  const { data: ads = [], isLoading, isError } = useQuery<PublicAd[]>({
    queryKey: ["/api/advertisers/public/ads"],
    queryFn: async () => {
      const res = await fetch("/api/advertisers/public/ads");
      if (!res.ok) throw new Error("Failed to fetch advertisements");
      return res.json();
    },
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });

  // Config-approved ads (added by admin via requests panel)
  const { data: configAds = [] } = useQuery<PublicAd[]>({
    queryKey: ["/api/config/explore-ads"],
    queryFn: async () => {
      const res = await fetch("/api/config/explore-ads");
      if (!res.ok) throw new Error("Failed to fetch explore config ads");
      return res.json();
    },
    refetchOnWindowFocus: true,
    refetchOnMount: "always",
    staleTime: 0,
    refetchInterval: 15 * 1000,
  });

  // Admin-only local ads (simple add form stored in localStorage)
  // Deprecated: Admin quick-add form and local ads are now managed via Admin panel

  // Dynamic tabs from ad types with All as default
  // Merge server ads and config-approved ads
  const mergedAds = useMemo(() => {
    const serverAds = ads || [];
    const approvedAds = configAds || [];
    // Deduplicate by (title + clickUrl) to avoid collisions across sources
    const dedupeKey = (x: PublicAd) => `${(x.title || '').toLowerCase()}|${(x.clickUrl || '').toLowerCase()}`;

    // Prefer config-approved ads when duplicates exist (e.g., to keep uploaded /uploads images)
    const map = new Map<string, PublicAd>();
    for (const s of serverAds) {
      map.set(dedupeKey(s), s);
    }
    for (const a of approvedAds) {
      const key = dedupeKey(a);
      if (!map.has(key)) {
        map.set(key, a);
      } else {
        const existing = map.get(key)!;
        // Merge with preference to config ad fields; ensure imageUrl from config wins when present
        const mergedItem: PublicAd = { ...existing, ...a };
        if ((a.imageUrl || '').trim()) {
          mergedItem.imageUrl = a.imageUrl;
        }
        map.set(key, mergedItem);
      }
    }
    return Array.from(map.values());
  }, [ads, configAds]);

  const tabs = useMemo(() => {
    const types = Array.from(
      new Set((mergedAds || []).map((a) => (a.type || "").trim()).filter(Boolean))
    );
    return ["All", ...types];
  }, [mergedAds]);
  const [activeTab, setActiveTab] = useState<string>("All");

  const filteredAds = useMemo(() => {
    if (activeTab === "All") return mergedAds;
    return mergedAds.filter((a) => (a.type || "").trim() === activeTab);
  }, [mergedAds, activeTab]);

  const gradients = [
    "from-indigo-500 to-purple-600",
    "from-blue-600 to-cyan-500",
    "from-emerald-500 to-teal-600",
    "from-rose-500 to-pink-600",
    "from-orange-500 to-amber-500",
    "from-violet-500 to-fuchsia-600",
  ];

  const addUtm = (url: string, source = "explore") => {
    try {
      const u = new URL(url);
      u.searchParams.set("utm_source", source);
      u.searchParams.set("utm_medium", "sponsored-card");
      return u.toString();
    } catch {
      return url;
    }
  };

  const trackClick = (ad: PublicAd) => {
    try {
      const payload = JSON.stringify({ id: ad.id, title: ad.title, type: ad.type, page: "explore" });
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/advertisers/track-click", payload);
      } else {
        fetch("/api/advertisers/track-click", { method: "POST", headers: { "Content-Type": "application/json" }, body: payload });
      }
    } catch {}
  };

  return (
    <>
      <UniversalPageLayout pageId="explore" className="container mx-auto px-4 py-6">
        <WidgetRenderer page="explore" position="header-top" />
        <AnnouncementBanner />
        <PageBanner page="explore" />
        <WidgetRenderer page="explore" position="header-bottom" />

        <div className="header-spacing"></div>
        {/* Hero header */}
        <section className="relative overflow-hidden rounded-2xl p-8 sm:p-10 mb-8 bg-gradient-to-b from-gray-900/30 to-gray-800/70 dark:from-black/40 dark:to-gray-900">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-gradient-to-tr from-blue-500/40 to-purple-500/40 blur-3xl"></div>
            <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-gradient-to-tr from-pink-500/30 to-orange-500/30 blur-3xl"></div>
          </div>
          <h1 className="relative z-10 text-3xl sm:text-4xl font-extrabold tracking-tight text-white">Explore</h1>
          <p className="relative z-10 mt-2 text-sm sm:text-base text-gray-200">
            Discover trusted brands, exclusive offers & sponsored picks — all in one place.
          </p>
        </section>

        {/* Admin quick-add form removed; use Admin → Ad Requests to manage Explore ads */}

        {/* Tabs */}
        {tabs.length > 1 && (
          <div className="mb-6 flex flex-wrap items-center gap-3 text-sm">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-full border transition-colors ${
                  activeTab === tab
                    ? "bg-white text-gray-900 border-gray-300 dark:bg-gray-800 dark:text-white dark:border-gray-700"
                    : "bg-transparent text-gray-600 border-gray-300 hover:bg-gray-100 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-800"
                }`}
                aria-pressed={activeTab === tab}
              >
                {tab}
              </button>
            ))}
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {isError && (
          <div className="p-4 rounded bg-red-50 text-red-700 border border-red-200">
            Failed to load advertisements. Please try again later.
          </div>
        )}

        {!isLoading && !isError && mergedAds.length === 0 && (
          <div className="p-4 rounded bg-yellow-50 text-yellow-800 border border-yellow-200">
            No advertisements are currently active.
          </div>
        )}

        {/* Cards (rendered according to ad.viewMode: banner, list, or grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAds.map((ad, idx) => {
            const grad = gradients[idx % gradients.length];
            const href = addUtm(ad.clickUrl);
            const vm = (ad.viewMode || "").toLowerCase();
            const isBanner = vm === "banner";
            const isList = vm === "list";

            // Banner layout: full width, larger hero-like presentation
            if (isBanner) {
              return (
                <article
                  key={ad.id}
                  className={`col-span-full rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br ${grad}`}
                  aria-label={`Sponsored (Banner): ${ad.title}`}
                >
                  <div className="relative">
                    {ad.imageUrl ? (
                      <img
                        src={resolveImageUrl(ad.imageUrl)}
                        alt={ad.title}
                        className="w-full h-56 sm:h-64 object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-56 sm:h-64 flex items-center justify-center bg-black/10 text-white/80">No Image</div>
                    )}
                  </div>
                  <div className="p-6 bg-white/90 dark:bg-gray-900/80 backdrop-blur">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-800 border border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700">Sponsored</span>
                      {ad.type && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white text-gray-700 border border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 whitespace-nowrap">
                          {ad.type}
                        </span>
                      )}
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      {(() => {
                        const s: any = (ad as any).titleStyle || {};
                        const style: any = {
                          fontWeight: s.fontWeight ?? 700,
                          fontStyle: s.fontStyle ?? 'normal',
                          textDecoration: s.textDecoration ?? 'none',
                          fontSize: s.fontSize ?? undefined,
                          fontFamily: s.fontFamily ?? undefined,
                        };
                        if (s.gradientEnabled && s.gradientFrom && s.gradientTo) {
                          style.backgroundImage = `linear-gradient(135deg, ${s.gradientFrom}, ${s.gradientTo})`;
                          style.WebkitBackgroundClip = 'text';
                          style.backgroundClip = 'text';
                          style.color = 'transparent';
                          (style as any).WebkitTextFillColor = 'transparent';
                          if ((s.textDecoration || 'none') !== 'none') {
                            style.textDecorationColor = s.textDecorationColor || s.color || s.gradientTo || s.gradientFrom || undefined;
                            if (s.textDecorationThickness) style.textDecorationThickness = s.textDecorationThickness;
                            if (s.textUnderlineOffset) style.textUnderlineOffset = s.textUnderlineOffset;
                          }
                        } else if (s.color) {
                          style.color = s.color;
                        }
                      return (
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white" title={ad.title} style={style}>{ad.title}</h2>
                      );
                    })()}
                  </div>
                  {ad.description && (() => {
                      const s: any = (ad as any).descriptionStyle || {};
                      const style: any = {
                        fontWeight: s.fontWeight ?? 400,
                        fontStyle: s.fontStyle ?? 'normal',
                        textDecoration: s.textDecoration ?? 'none',
                        fontSize: s.fontSize ?? undefined,
                        fontFamily: s.fontFamily ?? undefined,
                      };
                      if (s.gradientEnabled && s.gradientFrom && s.gradientTo) {
                        style.backgroundImage = `linear-gradient(135deg, ${s.gradientFrom}, ${s.gradientTo})`;
                        style.WebkitBackgroundClip = 'text';
                        style.backgroundClip = 'text';
                        style.color = 'transparent';
                        (style as any).WebkitTextFillColor = 'transparent';
                        if ((s.textDecoration || 'none') !== 'none') {
                          style.textDecorationColor = s.textDecorationColor || s.color || s.gradientTo || s.gradientFrom || undefined;
                          if (s.textDecorationThickness) style.textDecorationThickness = s.textDecorationThickness;
                          if (s.textUnderlineOffset) style.textUnderlineOffset = s.textUnderlineOffset;
                        }
                      } else if (s.color) {
                        style.color = s.color;
                      }
                      return (<p className="mt-2 text-sm sm:text-base text-gray-700 dark:text-gray-300" style={style}>{ad.description}</p>);
                    })()}
                    <div className="mt-4 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      {ad.campaignName && <span title="Campaign">{ad.campaignName}</span>}
                      {ad.size && <span>• {ad.size}</span>}
                    </div>
                    <div className="mt-5">
                      <a
                        href={href}
                        onClick={() => trackClick(ad)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm shadow focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
                      >
                        {ad.buttonText || 'View Deal'} <i className="fas fa-external-link-alt ml-2"></i>
                      </a>
                    </div>
                  </div>
                </article>
              );
            }

            // List layout: full width compact row with thumbnail
            if (isList) {
              return (
                <article
                  key={ad.id}
                  className={`col-span-full rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800`}
                  aria-label={`Sponsored (List): ${ad.title}`}
                >
                  <div className="flex items-stretch gap-0">
                    <div className={`w-40 sm:w-56 bg-gradient-to-br ${grad}`}>
                      <div className="relative">
                        {ad.imageUrl ? (
                          <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <div className="w-full h-full min-h-[140px] flex items-center justify-center bg-black/10 text-gray-600">No Image</div>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-800 border border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700">Sponsored</span>
                        {ad.type && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-white text-gray-700 border border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 whitespace-nowrap">
                            {ad.type}
                          </span>
                        )}
                      </div>
                      <div className="flex items-start justify-between gap-2">
                        {(() => {
                          const s: any = (ad as any).titleStyle || {};
                          const style: any = {
                            fontWeight: s.fontWeight ?? 600,
                            fontStyle: s.fontStyle ?? 'normal',
                            textDecoration: s.textDecoration ?? 'none',
                            fontSize: s.fontSize ?? undefined,
                            fontFamily: s.fontFamily ?? undefined,
                          };
                          if (s.gradientEnabled && s.gradientFrom && s.gradientTo) {
                            style.backgroundImage = `linear-gradient(135deg, ${s.gradientFrom}, ${s.gradientTo})`;
                            style.WebkitBackgroundClip = 'text';
                            style.backgroundClip = 'text';
                            style.color = 'transparent';
                            (style as any).WebkitTextFillColor = 'transparent';
                            if ((s.textDecoration || 'none') !== 'none') {
                              style.textDecorationColor = s.textDecorationColor || s.color || s.gradientTo || s.gradientFrom || undefined;
                              if (s.textDecorationThickness) style.textDecorationThickness = s.textDecorationThickness;
                              if (s.textUnderlineOffset) style.textUnderlineOffset = s.textUnderlineOffset;
                            }
                          } else if (s.color) {
                            style.color = s.color;
                          }
                          return (
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white" title={ad.title} style={style}>{ad.title}</h2>
                          );
                        })()}
                        {ad.type && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-white text-gray-700 border border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 whitespace-nowrap">
                            {ad.type}
                          </span>
                        )}
                      </div>
                      {ad.description && (() => {
                        const s: any = (ad as any).descriptionStyle || {};
                        const style: any = {
                          fontWeight: s.fontWeight ?? 400,
                          fontStyle: s.fontStyle ?? 'normal',
                          textDecoration: s.textDecoration ?? 'none',
                          fontSize: s.fontSize ?? undefined,
                          fontFamily: s.fontFamily ?? undefined,
                        };
                        if (s.gradientEnabled && s.gradientFrom && s.gradientTo) {
                          style.backgroundImage = `linear-gradient(135deg, ${s.gradientFrom}, ${s.gradientTo})`;
                          style.WebkitBackgroundClip = 'text';
                          style.backgroundClip = 'text';
                          style.color = 'transparent';
                          (style as any).WebkitTextFillColor = 'transparent';
                          if ((s.textDecoration || 'none') !== 'none') {
                            style.textDecorationColor = s.textDecorationColor || s.color || s.gradientTo || s.gradientFrom || undefined;
                            if (s.textDecorationThickness) style.textDecorationThickness = s.textDecorationThickness;
                            if (s.textUnderlineOffset) style.textUnderlineOffset = s.textUnderlineOffset;
                          }
                        } else if (s.color) {
                          style.color = s.color;
                        }
                        return (<p className="mt-1 text-sm text-gray-700 dark:text-gray-300 line-clamp-2" style={style}>{ad.description}</p>);
                      })()}
                      <div className="mt-2 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                        {ad.campaignName && <span title="Campaign">{ad.campaignName}</span>}
                        {ad.size && <span>• {ad.size}</span>}
                      </div>
                      <div className="mt-3">
                        <a
                          href={href}
                          onClick={() => trackClick(ad)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center px-3 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm shadow focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
                        >
                          {ad.buttonText || 'View Deal'} <i className="fas fa-external-link-alt ml-2"></i>
                        </a>
                      </div>
                    </div>
                  </div>
                </article>
              );
            }

            return (
              <article
                key={ad.id}
                className={`rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br ${grad}`}
                aria-label={`Sponsored: ${ad.title}`}
              >
                <div className="relative">
                  {ad.imageUrl ? (
                    <img
                      src={ad.imageUrl}
                      alt={ad.title}
                      className="w-full h-40 object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-40 flex items-center justify-center bg-black/10 text-white/80">No Image</div>
                  )}
                </div>
                <div className="p-4 bg-white/90 dark:bg-gray-900/80 backdrop-blur">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-800 border border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700">Sponsored</span>
                    {ad.type && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white text-gray-700 border border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 whitespace-nowrap">
                        {ad.type}
                      </span>
                    )}
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    {(() => {
                      const s: any = (ad as any).titleStyle || {};
                      const style: any = {
                        fontWeight: s.fontWeight ?? 600,
                        fontStyle: s.fontStyle ?? 'normal',
                        textDecoration: s.textDecoration ?? 'none',
                        fontSize: s.fontSize ?? undefined,
                        fontFamily: s.fontFamily ?? undefined,
                      };
                      if (s.gradientEnabled && s.gradientFrom && s.gradientTo) {
                        style.backgroundImage = `linear-gradient(135deg, ${s.gradientFrom}, ${s.gradientTo})`;
                        style.WebkitBackgroundClip = 'text';
                        style.backgroundClip = 'text';
                        style.color = 'transparent';
                        (style as any).WebkitTextFillColor = 'transparent';
                        if ((s.textDecoration || 'none') !== 'none') {
                          style.textDecorationColor = s.textDecorationColor || s.color || s.gradientTo || s.gradientFrom || undefined;
                          if (s.textDecorationThickness) style.textDecorationThickness = s.textDecorationThickness;
                          if (s.textUnderlineOffset) style.textUnderlineOffset = s.textUnderlineOffset;
                        }
                      } else if (s.color) {
                        style.color = s.color;
                      }
                      return (
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate" title={ad.title} style={style}>{ad.title}</h2>
                      );
                    })()}
                  </div>
                  {ad.description && (() => {
                    const s: any = (ad as any).descriptionStyle || {};
                    const style: any = {
                      fontWeight: s.fontWeight ?? 400,
                      fontStyle: s.fontStyle ?? 'normal',
                      textDecoration: s.textDecoration ?? 'none',
                      fontSize: s.fontSize ?? undefined,
                      fontFamily: s.fontFamily ?? undefined,
                    };
                    if (s.gradientEnabled && s.gradientFrom && s.gradientTo) {
                      style.backgroundImage = `linear-gradient(135deg, ${s.gradientFrom}, ${s.gradientTo})`;
                      style.WebkitBackgroundClip = 'text';
                      style.backgroundClip = 'text';
                      style.color = 'transparent';
                      (style as any).WebkitTextFillColor = 'transparent';
                      if ((s.textDecoration || 'none') !== 'none') {
                        style.textDecorationColor = s.textDecorationColor || s.color || s.gradientTo || s.gradientFrom || undefined;
                        if (s.textDecorationThickness) style.textDecorationThickness = s.textDecorationThickness;
                        if (s.textUnderlineOffset) style.textUnderlineOffset = s.textUnderlineOffset;
                      }
                    } else if (s.color) {
                      style.color = s.color;
                    }
                    return (<p className="mt-1 text-sm text-gray-700 dark:text-gray-300 line-clamp-3" style={style}>{ad.description}</p>);
                  })()}
                  <div className="mt-3 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    {ad.campaignName && <span title="Campaign">{ad.campaignName}</span>}
                    {ad.size && <span>• {ad.size}</span>}
                  </div>
                  <div className="mt-4">
                    <a
                      href={href}
                      onClick={() => trackClick(ad)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center px-3 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm shadow focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
                    >
                      {ad.buttonText || 'View Deal'} <i className="fas fa-external-link-alt ml-2"></i>
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-10 rounded-xl p-6 sm:p-8 bg-gradient-to-r from-gray-800 to-gray-900 text-white">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg sm:text-xl font-semibold">Want to see your brand here?</h3>
              <p className="mt-1 text-sm text-gray-300">Get featured on PickNTrust Explore — website + Telegram + community reach</p>
            </div>
            <a
              href="/advertise"
              className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-pink-500 hover:bg-pink-600 text-white text-sm shadow focus:outline-none focus:ring-2 focus:ring-pink-300"
            >
              Advertise With Us
            </a>
          </div>
        </div>
      </UniversalPageLayout>
    </>
  );
}