import React from "react";
import { Switch, Route } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { ThemeProvider } from "@/components/theme-provider";
import MetaTags from "@/components/meta-tags";

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
import ValuePicks from "@/pages/value-picks";
import ClickPicks from "@/pages/click-picks";
import DealsHub from "@/pages/deals-hub";
import BrowseCategories from "@/pages/browse-categories";
import DynamicPage from "@/pages/DynamicPage";

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
                <Switch>
                  <Route path="/" component={Home} />
                  <Route path="/category/:category" component={Category} />
                  <Route path="/admin" component={Admin} />
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
                  {/* Dynamic route for custom navigation tabs */}
                  <Route path="/:slug" component={DynamicPage} />
                  <Route>404 - Page Not Found</Route>
                </Switch>
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
