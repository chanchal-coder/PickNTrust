import { Component, lazy, Suspense, type ErrorInfo, type ReactNode, useEffect } from "react";
import { Switch, Route } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { ThemeProvider } from "@/components/theme-provider";
import MetaTags from "@/components/meta-tags";
import MetaTagsInjector from "@/components/MetaTagsInjector";
import GlobalTitleTooltip from "@/components/ui/global-title-tooltip";
// Minimal safe-mode page to isolate routing/CSS issues
function SafePage() {
  return (
    <div style={{ minHeight: '100vh', background: '#fff', color: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Safe Mode Page</h1>
        <p style={{ marginBottom: 12 }}>Routing and rendering are working.</p>
        <a href="/" style={{ color: '#2563eb', textDecoration: 'underline' }}>Go to Home</a>
      </div>
    </div>
  );
}

// Error Boundary Component
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-4">The application encountered an error.</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Reload Page
            </button>
            {this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500">Error Details</summary>
                <pre className="text-xs text-red-500 mt-2 overflow-auto">
                  {`${this.state.error.toString()}\n\n${(this.state.error as any).stack || ''}`}
                </pre>
                <div className="mt-3 text-xs text-gray-500">
                  If this persists in production only, it may indicate a mismatched
                  build asset (vendor/radix chunk) being served. Clearing cached assets
                  and redeploying all files from a single build usually resolves it.
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
// Import Home directly to avoid lazy-load issues on the root route
import Home from "@/pages/home";
import Category from "@/pages/category";
import Admin from "@/pages/admin";
import BotAdmin from "@/pages/BotAdmin";
import Wishlist from "@/pages/wishlist";
import Blog from "@/pages/blog";
import BlogPost from "@/pages/blog-post";
import Videos from "@/pages/videos";
import HowItWorks from "@/pages/how-it-works";
import TermsOfService from "@/pages/terms-of-service";
import PrivacyPolicy from "@/pages/privacy-policy";
import Search from "@/pages/search";
import TopPicks from "@/pages/top-picks";
import Services from "@/pages/services";
import Apps from "@/pages/apps";
import LootBox from "@/pages/loot-box";
import GlobalPicks from "@/pages/global-picks";
import TravelPicks from "@/pages/travel-picks";
import Flights from "@/pages/flights";
import Hotels from "@/pages/hotels";
import PrimePicks from "@/pages/prime-picks";
import CuePicks from "@/pages/cue-picks";
import Advertise from "@/pages/advertise";
import AdvertiseRegister from "@/pages/advertise-register";
import AdvertiseCheckout from "@/pages/advertise-checkout";
import AdvertiseDashboard from "@/pages/advertise-dashboard";
import Explore from "@/pages/explore";
import ValuePicks from "@/pages/value-picks";
import ClickPicks from "@/pages/click-picks";
import DealsHub from "@/pages/deals-hub";
import BrowseCategories from "@/pages/browse-categories";
import DynamicPage from "@/pages/DynamicPage";
import AdminPaymentsPage from "@/pages/admin-payments";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: 1000,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      // Prevent React Query from showing default error messages
      throwOnError: false,
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});

function App() {
  // Add debugging for black screen issues
  useEffect(() => {
    console.log('🚀 App component mounted');
    
    // Check for common black screen causes
    const checkForIssues = () => {
      const root = document.getElementById('root');
      if (root) {
        console.log('✅ Root element found');
        console.log('📊 Root element styles:', {
          backgroundColor: getComputedStyle(root).backgroundColor,
          color: getComputedStyle(root).color,
          display: getComputedStyle(root).display
        });
      } else {
        console.error('❌ Root element not found!');
      }
    };
    
    // Check immediately and after a short delay
    checkForIssues();
    setTimeout(checkForIssues, 1000);
  }, []);

  // Detect widget safe-mode (dev-only) to inform users when overlays are disabled
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const widgetsSafeMode = (urlParams.get('widgetsSafeMode') === '1') || (typeof window !== 'undefined' && localStorage.getItem('widgetsSafeMode') === 'true');
  const forceAppBaseline = urlParams.get('forceAppBaseline') === '1' || (typeof window !== 'undefined' && localStorage.getItem('forceAppBaseline') === 'true');

  // Diagnostic baseline: render minimal content to isolate App composition issues
  if (forceAppBaseline) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0b1220',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 12,
        fontFamily: 'Inter, system-ui, Arial, sans-serif'
      }}>
        <div style={{
          background: '#1f2937',
          border: '1px solid #374151',
          padding: '16px 20px',
          borderRadius: 8,
          boxShadow: '0 6px 20px rgba(0,0,0,0.35)',
          maxWidth: 720,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>App Baseline</div>
          <div style={{ fontSize: 14, opacity: 0.9 }}>React rendering works inside App without providers or routes.</div>
        </div>
        <a href="/?" style={{ color: '#93c5fd', textDecoration: 'underline', fontSize: 14 }}>Return to full app</a>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <CurrencyProvider>
            <WishlistProvider>
              <div className="min-h-screen bg-white dark:bg-gray-900" style={{ minHeight: '100vh' }}>
                {import.meta.env.DEV && widgetsSafeMode && (
                  <div style={{ position: 'fixed', top: 34, left: 0, right: 0, padding: '6px 10px', background: '#a7f3d0', color: '#064e3b', fontWeight: 600, zIndex: 10000, textAlign: 'center' }}>
                    Widgets Safe-Mode: overlay widgets are disabled (dev).
                  </div>
                )}
                <MetaTags />
                <MetaTagsInjector />
                {/* Global styled tooltip for any native `title` attributes */}
                <GlobalTitleTooltip />
                <Suspense fallback={
                  (
                    <div style={{ minHeight: '100vh', background: '#0b1220', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
                      <div style={{ fontSize: 14, opacity: 0.9 }}>Loading app…</div>
                      <div style={{ width: 48, height: 48, borderRadius: '50%', border: '4px solid #93c5fd', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                      <style>
                        {`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}
                      </style>
                    </div>
                  )
                }>
                  <Switch>
                  <Route path="/" component={Home} />
                  <Route path="/category/:category" component={Category} />
                  <Route path="/admin" component={Admin} />
                  {/* Map all admin tabs to Admin component to prevent 404s */}
                  <Route path="/admin/dashboard" component={Admin} />
                  <Route path="/admin/blog" component={Admin} />
                  <Route path="/admin/announcements" component={Admin} />
                  <Route path="/admin/banners" component={Admin} />
                  <Route path="/admin/categories" component={Admin} />
                  <Route path="/admin/products" component={Admin} />
                  <Route path="/admin/navigation" component={Admin} />
                  <Route path="/admin/widgets" component={Admin} />
                  {/* Support both hyphenated and non-hyphenated meta tags paths */}
                  <Route path="/admin/meta-tags" component={Admin} />
                  <Route path="/admin/metatags" component={Admin} />
                  <Route path="/admin/videos" component={Admin} />
                  <Route path="/admin/automation" component={Admin} />
                  <Route path="/admin/commission" component={Admin} />
                  <Route path="/admin/credentials" component={Admin} />
                  <Route path="/admin/rssfeeds" component={Admin} />
                  <Route path="/admin/adrequests" component={Admin} />
                  <Route path="/admin/bots" component={Admin} />
                  <Route path="/admin/payments" component={AdminPaymentsPage} />
                  <Route path="/bot-admin" component={BotAdmin} />
                  <Route path="/wishlist" component={Wishlist} />
                  <Route path="/blog" component={Blog} />
                  <Route path="/blog/:slug" component={BlogPost} />
                  <Route path="/videos" component={Videos} />
                  <Route path="/how-it-works" component={HowItWorks} />
                  <Route path="/terms-of-service" component={TermsOfService} />
                  <Route path="/privacy-policy" component={PrivacyPolicy} />
                  <Route path="/search" component={Search} />
                  <Route path="/top-picks" component={TopPicks} />
                  <Route path="/services" component={Services} />
                  <Route path="/apps" component={Apps} />
                  <Route path="/loot-box" component={LootBox} />
                  <Route path="/global-picks" component={GlobalPicks} />
                  <Route path="/travel-picks" component={TravelPicks} />
                  <Route path="/flights" component={Flights} />
                  <Route path="/hotels" component={Hotels} />
                  <Route path="/prime-picks" component={PrimePicks} />
                  <Route path="/cue-picks" component={CuePicks} />
                  <Route path="/value-picks" component={ValuePicks} />
                  <Route path="/click-picks" component={ClickPicks} />
                  <Route path="/deals-hub" component={DealsHub} />
                  <Route path="/browse-categories" component={BrowseCategories} />
                  <Route path="/advertise" component={Advertise} />
                  <Route path="/advertise/checkout" component={AdvertiseCheckout} />
                  <Route path="/advertise/register" component={AdvertiseRegister} />
                  <Route path="/advertise/dashboard" component={AdvertiseDashboard} />
                  <Route path="/explore" component={Explore} />
                  <Route path="/__safe" component={SafePage} />
                  {/* Dynamic route for custom navigation tabs */}
                  <Route path="/:slug" component={DynamicPage} />
                  {/* Catch-all fallback to a styled NotFound page instead of raw 404 text */}
                  <Route component={lazy(() => import('@/pages/not-found'))} />
                  </Switch>
                </Suspense>
                {/* Temporary: render Home directly to bypass router in case of route mismatch */}
                <div style={{ display: 'none' }}>
                  <Home />
                </div>
                <Toaster />
              </div>
            </WishlistProvider>
          </CurrencyProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
