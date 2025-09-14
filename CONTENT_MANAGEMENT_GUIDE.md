# PickNTrust Daily Content Management Guide

## Overview
This guide explains how to update products, links, and content on your PickNTrust affiliate website daily.

## Quick Daily Updates

### 1. Adding New Products
Products are stored in `server/storage.ts`. To add new products:

1. Open `server/storage.ts`
2. Find the `productsData` array (around line 97)
3. Add new product objects with this format:

```javascript
{
  name: "Product Name",
  description: "Product description",
  price: "₹9,999.00",           // Current price in INR
  originalPrice: "₹14,999.00",  // Original price (optional)
  imageUrl: "https://images.unsplash.com/...",  // Product image URL
  affiliateUrl: "https://your-affiliate-link.com",  // Your affiliate link
  category: "Tech",             // Tech, Home, Beauty, Fashion, or Deals
  rating: "4.5",               // Product rating (1-5)
  reviewCount: 1234,           // Number of reviews
  discount: 33,                // Discount percentage (optional)
  isNew: false,                // Mark as NEW badge (optional)
  isFeatured: true             // Show on homepage (optional)
}
```

### 2. Updating Existing Products
- Find the product in the `productsData` array
- Update any field (price, affiliate link, description, etc.)
- Save the file - changes appear immediately

### 3. Managing Categories
Each product must have a category:
- **Tech**: Gadgets, electronics, smartphones, laptops
- **Home**: Kitchen, furniture, home appliances
- **Beauty**: Skincare, makeup, beauty tools
- **Fashion**: Clothing, accessories, bags
- **Deals**: Special offers, limited-time deals

### 4. Product Images
Use high-quality images from:
- Unsplash.com (free stock photos)
- Official product websites
- Affiliate partner resources

Format: `https://images.unsplash.com/photo-XXXXXXX?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300`

## Advanced Content Management

### Blog Posts
Update blog content in the `blogPostsData` array:

```javascript
{
  title: "Article Title",
  excerpt: "Short description of the article...",
  imageUrl: "https://images.unsplash.com/...",
  publishedAt: new Date("2024-01-25"),
  readTime: "3 min read",
  slug: "article-url-slug"
}
```

### Newsletter Management
Subscriber emails are automatically stored when users sign up. View them in the browser console or implement an admin panel.

## Daily Workflow

### Morning Routine (10 minutes)
1. Check affiliate partner websites for new deals
2. Update 2-3 products with current prices
3. Add 1 new product to "Deals" category
4. Verify all affiliate links are working

### Afternoon Check (5 minutes)
1. Monitor website analytics
2. Check for expired deals
3. Update product availability

### Evening Review (5 minutes)
1. Review affiliate click tracking
2. Plan tomorrow's products
3. Update blog if needed

## Affiliate Link Management

### Best Practices
1. **Always test links** before adding them
2. **Use short URLs** when possible (bit.ly, tinyurl)
3. **Include tracking parameters** if your affiliate program supports them
4. **Monitor click-through rates** via affiliate dashboard

### Link Format Examples
- Amazon: `https://amzn.to/XXXXXXX`
- Flipkart: `https://fkrt.it/XXXXXXX`
- Custom: `https://yoursite.com/go/product-name`

### Tracking
The website automatically tracks affiliate clicks. View logs in the browser console or server logs.

## Content Ideas

### Daily Product Sources
- **Amazon Best Sellers**: Check daily for trending products
- **Flipkart Super Deals**: Monitor flash sales and offers
- **Brand Websites**: Direct affiliate programs
- **Social Media**: Instagram, YouTube product mentions
- **Tech Reviews**: Latest gadget releases

### Seasonal Content
- **Festivals**: Diwali, Holi, Christmas deals
- **Sales Events**: Prime Day, Big Billion Day
- **Weather**: Summer coolers, winter clothing
- **Trends**: Viral products, influencer recommendations

## Automation Options

### Future Enhancements
1. **Admin Dashboard**: Build a simple form to add products
2. **CSV Import**: Bulk upload products from spreadsheets
3. **API Integration**: Auto-sync with affiliate networks
4. **Scheduled Posts**: Queue products for specific times

### Quick Admin Interface
For easier daily updates, you could add a simple admin form:

1. Create `/admin` page
2. Add product input form
3. Save directly to database
4. No code editing required

## Analytics & Optimization

### Key Metrics to Track
- **Click-through rates** on affiliate links
- **Popular categories** (Tech vs Beauty vs Fashion)
- **Best-performing products** (highest clicks)
- **Mobile vs desktop** usage
- **Newsletter signup rates**

### Optimization Tips
1. **A/B test** product descriptions
2. **Update images** regularly for freshness
3. **Rotate featured products** weekly
4. **Seasonal pricing** adjustments
5. **Mobile-first** content creation

## Emergency Procedures

### If Affiliate Links Break
1. Check affiliate partner dashboard
2. Update links in `server/storage.ts`
3. Test new links before going live
4. Monitor error logs

### If Website Goes Down
1. Check server logs in Replit console
2. Restart the application
3. Check database connections
4. Contact support if needed

## Legal Considerations

### Affiliate Disclosure
- Already included on product cards: "🔗 Affiliate Link - We earn from purchases"
- Required by law in most countries
- Always be transparent with users

### Content Guidelines
- Use original product descriptions when possible
- Properly attribute image sources
- Follow affiliate program terms of service
- Respect copyright and trademark laws

## Contact Support
- **Email**: contact@pickntrust.com
- **Technical Issues**: Check browser console for errors
- **Affiliate Problems**: Contact your affiliate manager

---

*Last Updated: January 2024*
*Keep this guide updated as you add new features and processes*