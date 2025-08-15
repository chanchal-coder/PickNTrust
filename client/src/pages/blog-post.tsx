import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import BlogPost from "@/components/blog-post";
import Header from "@/components/header";
import Footer from "@/components/footer";

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();

  // Fetch blog post data from API based on slug
  const { data: blogPost, isLoading, error } = useQuery({
    queryKey: ['/api/blog', slug],
    queryFn: async () => {
      const response = await fetch(`/api/blog/${slug}`);
      if (!response.ok) {
        throw new Error('Failed to fetch blog post');
      }
      return response.json();
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    gcTime: 10 * 60 * 1000, // 10 minutes cache (updated from cacheTime)
    retry: 1,
  });

  // Sample blog post data - fallback for demo
  const sampleBlogPost = {
    title: "10 Must-Have Gadgets Under ₹999 You Can Buy Today",
    content: `
# 10 Must-Have Gadgets Under ₹999 You Can Buy Today

Shopping for amazing gadgets doesn't have to break the bank! We've curated a fantastic list of 10 incredible gadgets that you can buy for under ₹999 today. Each of these products offers exceptional value and functionality that will enhance your daily life.

## 1. Wireless Bluetooth Earbuds

**Experience crystal-clear audio** without the hassle of tangled wires! These premium wireless earbuds deliver stunning sound quality with deep bass and crisp highs.

**Features:**
- 20+ hours battery life with charging case
- IPX7 waterproof rating
- Touch controls for music and calls
- Quick 10-minute charge gives 2 hours playback

[🛒 Buy Wireless Bluetooth Earbuds - ₹899](https://amzn.to/wireless-earbuds-deal)

![Wireless Bluetooth Earbuds](https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=600&h=400&fit=crop)

## 2. Portable Power Bank 10000mAh

**Never run out of battery again!** This compact power bank can charge your smartphone up to 3 times and features fast charging technology.

**Key Benefits:**
- Dual USB ports for charging multiple devices
- LED display showing exact battery percentage
- Ultra-slim design fits in your pocket
- Built-in safety protection

[🔋 Get Power Bank - ₹799](https://amzn.to/power-bank-10000mah)

## 3. Smart Fitness Tracker

**Monitor your health 24/7** with this feature-packed fitness tracker that looks stylish and provides comprehensive health insights.

**Health Features:**
- Heart rate monitoring
- Sleep tracking analysis  
- Step counter and calorie tracker
- Water reminder notifications

[⌚ Buy Fitness Tracker - ₹949](https://amzn.to/smart-fitness-tracker)

![Smart Fitness Tracker](https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=600&h=400&fit=crop)

## 4. USB LED Strip Lights (5 Meters)

**Transform your room's ambiance** with these colorful LED strip lights that can be controlled via remote or smartphone app.

**Amazing Features:**
- 16 million colors to choose from
- Music sync mode - lights dance to your music
- Timer function and DIY mode
- Easy installation with adhesive backing

[💡 Order LED Strip Lights - ₹599](https://amzn.to/usb-led-strip-lights)

## 5. Mini Bluetooth Speaker

**Powerful sound in a compact package!** This waterproof speaker delivers 360-degree surround sound perfect for outdoor adventures.

**Sound Specifications:**
- 12-hour continuous playback
- IPX6 waterproof rating
- Built-in microphone for hands-free calls
- Supports TF card and AUX input

[🔊 Get Mini Speaker - ₹799](https://amzn.to/mini-bluetooth-speaker)

## 6. Phone Camera Lens Kit

**Upgrade your smartphone photography** with this professional lens kit that includes wide-angle, macro, and fisheye lenses.

**Photography Enhancement:**
- 0.6X wide-angle lens for landscape shots
- 15X macro lens for close-up details
- 198° fisheye lens for creative effects
- Universal clip design fits all phones

[📸 Buy Camera Lens Kit - ₹899](https://amzn.to/phone-camera-lens-kit)

![Phone Camera Lens Kit](https://images.unsplash.com/photo-1512790182412-b6ed862d8b1e?w=600&h=400&fit=crop)

## 7. Wireless Charging Pad

**Say goodbye to cables** with this sleek wireless charging pad that works with all Qi-enabled devices.

**Charging Benefits:**
- Fast 10W wireless charging
- LED indicator shows charging status
- Anti-slip design keeps phone secure
- Over-charge protection for safety

[⚡ Order Wireless Charger - ₹699](https://amzn.to/wireless-charging-pad)

## 8. Smart Digital Weighing Scale

**Track your fitness journey accurately** with this smart scale that connects to your smartphone for detailed analytics.

**Smart Features:**
- Measures weight, BMI, body fat percentage
- Connects to fitness apps via Bluetooth
- Supports multiple user profiles
- Tempered glass surface with LCD display

[⚖️ Get Smart Scale - ₹899](https://amzn.to/smart-digital-scale)

## 9. Car Phone Mount with Wireless Charging

**Drive safely while staying connected** with this innovative car mount that charges your phone wirelessly while driving.

**Safety Features:**
- One-hand operation for easy phone placement
- Auto-clamping arms secure your device
- 360-degree rotation for perfect viewing angle
- Compatible with air vents and dashboard

[🚗 Buy Car Mount Charger - ₹999](https://amzn.to/car-phone-mount-wireless)

![Car Phone Mount](https://images.unsplash.com/photo-1549317336-206569e8475c?w=600&h=400&fit=crop)

## 10. Multi-Port USB Hub

**Expand your connectivity options** with this compact USB hub that adds multiple ports to your laptop or desktop.

**Connectivity Options:**
- 4 USB 3.0 ports for high-speed data transfer
- Plug-and-play compatibility
- Compact aluminum design
- LED indicators for each port

[🔌 Order USB Hub - ₹599](https://amzn.to/multi-port-usb-hub)

## **Why Choose These Gadgets?**

Each of these gadgets has been carefully selected based on:
- **Exceptional value for money**
- **High customer ratings and reviews**
- **Practical everyday utility**
- **Reliable brand reputation**
- **Fast delivery and warranty support**

## **Shopping Tips**

1. **Check for lightning deals** - Prices can drop further during flash sales
2. **Read customer reviews** - Real user experiences help make better decisions  
3. **Compare specifications** - Ensure the product meets your specific needs
4. **Verify seller ratings** - Buy from trusted sellers for best experience
5. **Look for combo offers** - Sometimes buying together saves more money

**Happy Shopping!** 🛍️

*Disclosure: This post contains affiliate links. When you buy through these links, we earn a small commission at no extra cost to you. This helps us continue providing great content and recommendations.*
    `,
    publishDate: "2025-01-25",
    readTime: "8 min read",
    featuredImage: "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=800&h=600&fit=crop",
    tags: ["Gadgets", "Shopping", "Tech", "Budget", "Deals"],
    author: "PickNTrust Team",
    slug: slug || "10-must-have-gadgets-under-999"
  };

  // Error state with theme-aware background
  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center pt-20 pb-8">
          <div className="max-w-md mx-auto text-center p-8">
            <div className="text-6xl mb-4">😕</div>
            <h1 className="text-2xl font-bold text-foreground mb-4">
              Blog Post Not Found
            </h1>
            <p className="text-muted-foreground mb-6">
              The blog post you're looking for doesn't exist or has been removed.
            </p>
            <a 
              href="/"
              className="inline-flex items-center px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-colors"
            >
              ← Back to Home
            </a>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Loading state with theme-aware background
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Header />
        <div className="flex-1 pt-20 pb-8">
          <div className="max-w-4xl mx-auto p-8">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded mb-4"></div>
              <div className="h-4 bg-muted rounded mb-2"></div>
              <div className="h-4 bg-muted rounded mb-8"></div>
              <div className="h-64 bg-muted rounded"></div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const postData = blogPost || sampleBlogPost;

  // Main blog post page with theme-aware background
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <div className="flex-1 pt-20 pb-8">
        <BlogPost 
          title={postData?.title || sampleBlogPost.title}
          content={postData?.content || sampleBlogPost.content}
          publishDate={postData?.publishedAt || postData?.publishDate || sampleBlogPost.publishDate}
          readTime={postData?.readTime || sampleBlogPost.readTime}
          featuredImage={postData?.imageUrl || postData?.featuredImage || sampleBlogPost.featuredImage}
          videoUrl={postData?.videoUrl}
          tags={postData?.tags || sampleBlogPost.tags}
          author={postData?.author || "PickNTrust Team"}
          slug={slug || 'sample-post'}
        />
      </div>
      <Footer />
    </div>
  );
}
