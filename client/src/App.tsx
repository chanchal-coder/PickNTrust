import { Switch, Route } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { ThemeProvider } from "@/components/theme-provider";
import MetaTags from "@/components/meta-tags";
import Home from "@/pages/home";
import Category from "@/pages/category";
import Admin from "@/pages/admin";
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
import PrimePicks from "@/pages/prime-picks";
import CuePicks from "@/pages/cue-picks";
import ValuePicks from "@/pages/value-picks";
import ClickPicks from "@/pages/click-picks";
import DealsHub from "@/pages/deals-hub";

const queryClient = new QueryClient();

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <WishlistProvider>
          <div className="min-h-screen bg-white dark:bg-gray-900">
            <MetaTags />
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/category/:category" component={Category} />
              <Route path="/admin" component={Admin} />
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
              <Route path="/prime-picks" component={PrimePicks} />
              <Route path="/cue-picks" component={CuePicks} />
              <Route path="/value-picks" component={ValuePicks} />
              <Route path="/click-picks" component={ClickPicks} />
              <Route path="/deals-hub" component={DealsHub} />
              <Route>404 - Page Not Found</Route>
            </Switch>
            <Toaster />
          </div>
        </WishlistProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
