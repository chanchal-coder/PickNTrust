import React from "react";
import { Switch, Route } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { ThemeProvider } from "@/components/theme-provider";
import MetaTags from "@/components/meta-tags";
import MetaTagsInjector from "@/components/MetaTagsInjector";

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
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
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
// Lazy load page components for better code splitting
const Home = React.lazy(() => import("@/pages/home"));
const Category = React.lazy(() => import("@/pages/category"));
const Admin = React.lazy(() => import("@/pages/admin"));
const BotAdmin = React.lazy(() => import("@/pages/BotAdmin"));
const Wishlist = React.lazy(() => import("@/pages/wishlist"));
const Blog = React.lazy(() => import("@/pages/blog"));
const BlogPost = React.lazy(() => import("@/pages/blog-post"));
const Videos = React.lazy(() => import("@/pages/videos"));
const HowItWorks = React.lazy(() => import("@/pages/how-it-works"));
const TermsOfService = React.lazy(() => import("@/pages/terms-of-service"));
const PrivacyPolicy = React.lazy(() => import("@/pages/privacy-policy"));
const Search = React.lazy(() => import("@/pages/search"));
const TopPicks = React.lazy(() => import("@/pages/top-picks"));
const Services = React.lazy(() => import("@/pages/services"));
const Apps = React.lazy(() => import("@/pages/apps"));
const LootBox = React.lazy(() => import("@/pages/loot-box"));
const GlobalPicks = React.lazy(() => import("@/pages/global-picks"));
const TravelPicks = React.lazy(() => import("@/pages/travel-picks"));
const Flights = React.lazy(() => import("@/pages/flights"));
const Hotels = React.lazy(() => import("@/pages/hotels"));
const PrimePicks = React.lazy(() => import("@/pages/prime-picks"));
const CuePicks = React.lazy(() => import("@/pages/cue-picks"));
const Advertise = React.lazy(() => import("@/pages/advertise"));
const AdvertiseRegister = React.lazy(() => import("@/pages/advertise-register"));
const AdvertiseCheckout = React.lazy(() => import("@/pages/advertise-checkout"));
const AdvertiseDashboard = React.lazy(() => import("@/pages/advertise-dashboard"));
const ValuePicks = React.lazy(() => import("@/pages/value-picks"));
const ClickPicks = React.lazy(() => import("@/pages/click-picks"));
const DealsHub = React.lazy(() => import("@/pages/deals-hub"));
const BrowseCategories = React.lazy(() => import("@/pages/browse-categories"));
const DynamicPage = React.lazy(() => import("@/pages/DynamicPage"));
const AdminPaymentsPage = React.lazy(() => import("@/pages/admin-payments"));

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
  React.useEffect(() => {
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

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <CurrencyProvider>
            <WishlistProvider>
              <div className="min-h-screen bg-white dark:bg-gray-900" style={{ minHeight: '100vh' }}>
                <MetaTags />
                <MetaTagsInjector />
                <React.Suspense fallback={
                  <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
                  </div>
                }>
                  <Switch>
                  <Route path="/" component={Home} />
                  <Route path="/category/:category" component={Category} />
                  <Route path="/admin" component={Admin} />
                  <Route path="/admin/blog" component={Admin} />
                  <Route path="/admin/announcements" component={Admin} />
                  <Route path="/admin/banners" component={Admin} />
                  <Route path="/admin/categories" component={Admin} />
                  <Route path="/admin/products" component={Admin} />
                  <Route path="/admin/widgets" component={Admin} />
                  <Route path="/admin/meta-tags" component={Admin} />
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
                  {/* Dynamic route for custom navigation tabs */}
                  <Route path="/:slug" component={DynamicPage} />
                    <Route>404 - Page Not Found</Route>
                  </Switch>
                </React.Suspense>
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
