import { Switch, Route, Router } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { useState, useEffect } from "react";
import Home from "@/pages/home";
import CategoryPage from "@/pages/category";
import AdminPage from "@/pages/admin";
import WishlistPage from "@/pages/wishlist";
import AffiliateTrackerPage from "@/pages/affiliate-tracker";
import AffiliateDisclosurePage from "@/pages/affiliate-disclosure";
import HowItWorksPage from "@/pages/how-it-works";
import PrivacyPolicyPage from "@/pages/privacy-policy";
import TermsOfServicePage from "@/pages/terms-of-service";
import BlogPostPage from "@/pages/blog-post";
import LogoPreviewPage from "@/pages/logo-preview";
import NotFound from "@/pages/not-found";

function AppRouter() {
  const [isLoading, setIsLoading] = useState(false);

  // Handle route changes to show loading state
  useEffect(() => {
    const handleStart = () => setIsLoading(true);
    const handleComplete = () => setIsLoading(false);

    // Listen for route changes
    const handlePopState = () => {
      handleStart();
      setTimeout(handleComplete, 100);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <Router>
      {isLoading && (
        <div className="fixed top-0 left-0 w-full h-1 bg-blue-500 z-50 animate-pulse">
          <div className="h-full bg-blue-600 animate-pulse"></div>
        </div>
      )}
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/category/:category" component={CategoryPage} />
        <Route path="/admin" component={AdminPage} />
        <Route path="/wishlist" component={WishlistPage} />
        <Route path="/affiliate-tracker" component={AffiliateTrackerPage} />
        <Route path="/affiliate-disclosure" component={AffiliateDisclosurePage} />
        <Route path="/how-it-works" component={HowItWorksPage} />
        <Route path="/privacy-policy" component={PrivacyPolicyPage} />
        <Route path="/terms-of-service" component={TermsOfServicePage} />
        <Route path="/blog/:slug" component={BlogPostPage} />
        <Route path="/logo-preview" component={LogoPreviewPage} />
        <Route component={NotFound} />
      </Switch>
    </Router>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="pickntrust-theme">
        <TooltipProvider>
          <Toaster />
          <AppRouter />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
