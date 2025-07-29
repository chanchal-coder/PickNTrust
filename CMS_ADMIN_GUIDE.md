# PickNTrust CMS Admin Guide

## How to Access the CMS System

### 1. Admin Login
- Visit: `https://your-site.com/cms`
- Enter admin password: `pickntrust2025`
- Click "Access CMS"

### 2. CMS Dashboard Overview
The CMS has 3 main tabs:
- **Pages**: Create and manage website pages
- **Sections**: Add content blocks to pages
- **Media**: Upload and manage images/files

## Managing Pages

### Creating a New Page
1. Go to **Pages** tab
2. Click **"New Page"** button
3. Fill in the form:
   - **Title**: Display name (e.g., "About Us")
   - **Slug**: URL path (e.g., "about-us" → `/about-us`)
   - **Meta Description**: SEO description for search engines
   - **Published**: Check to make page live
4. Click **"Create"**

### Editing an Existing Page
1. Find the page you want to edit
2. Click the **Edit** button (pencil icon)
3. Update any fields
4. Click **"Update"**

### Deleting a Page
1. Click the **Trash** button (red bin icon)
2. Confirm deletion in the popup
3. Page and all its sections will be permanently deleted

## Managing Sections (Content Blocks)

### What are Sections?
Sections are content blocks that make up a page. Each page can have multiple sections arranged in order.

### Adding Content to a Page
1. Select a page from the **Pages** tab (click on it)
2. Go to **Sections** tab
3. Click **"New Section"**
4. Fill in the form:
   - **Title**: Internal name for the section
   - **Type**: Choose content type:
     - **Text**: Plain text content
     - **HTML**: Rich HTML content with styling
     - **Image**: Single image display
     - **Video**: Video embed or file
     - **Gallery**: Multiple images
   - **Content**: The actual content (text, HTML code, image URL, etc.)
   - **Sort Order**: Number to control display order (0 = first)
5. Click **"Create"**

### Section Types Explained

#### Text Sections
- Use for simple text content
- Automatically formats paragraphs
- Good for basic descriptions

#### HTML Sections
- Use for rich content with styling
- Can include:
  - Formatted text with colors, fonts, sizes
  - Links and buttons
  - Lists and tables
  - Custom styling with CSS
- Example HTML:
```html
<h2 style="color: blue;">Welcome to Our Store</h2>
<p>We offer the <strong>best products</strong> at competitive prices.</p>
<a href="/products" class="btn btn-primary">Shop Now</a>
```

#### Image Sections
- Display single images
- Content should be image URL
- Example: `https://example.com/image.jpg`

#### Video Sections
- Embed videos from YouTube, Vimeo, etc.
- Content can be:
  - YouTube URL: `https://www.youtube.com/watch?v=VIDEO_ID`
  - Vimeo URL: `https://vimeo.com/VIDEO_ID`
  - Direct video file URL: `https://example.com/video.mp4`

#### Gallery Sections
- Display multiple images in a grid
- Content should be JSON array of image URLs:
```json
[
  "https://example.com/image1.jpg",
  "https://example.com/image2.jpg",
  "https://example.com/image3.jpg"
]
```

### Editing Sections
1. Go to **Sections** tab
2. Make sure the correct page is selected
3. Click **Edit** button on any section
4. Update content
5. Click **"Update"**

### Reordering Sections
- Use **Sort Order** numbers to control display order
- Lower numbers appear first (0, 1, 2, 3...)
- Higher numbers appear later

## Media Management

### Uploading Images/Files
1. Go to **Media** tab
2. Click **"Upload Media"**
3. Select file from your computer
4. Add **Alt Text** for accessibility (optional)
5. Click upload

### Using Uploaded Media
1. After uploading, copy the media URL
2. Use the URL in sections:
   - **Image sections**: Paste URL in content field
   - **HTML sections**: Use in `<img>` tags
   - **Gallery sections**: Include in JSON array

### Supported File Types
- **Images**: JPG, PNG, GIF, WebP
- **Videos**: MP4, WebM, MOV
- **Documents**: PDF, DOC, etc.

## Common CMS Tasks

### Creating a Simple About Page
1. **Create Page**:
   - Title: "About Us"
   - Slug: "about-us"
   - Published: ✓

2. **Add Hero Section**:
   - Type: HTML
   - Content:
   ```html
   <div style="text-align: center; padding: 40px 0;">
     <h1>About PickNTrust</h1>
     <p style="font-size: 18px;">Your trusted shopping companion</p>
   </div>
   ```

3. **Add Company Story Section**:
   - Type: Text
   - Content: Write your company story...

4. **Add Team Photo**:
   - Type: Image
   - Content: Upload team photo and use URL

### Creating a Product Showcase Page
1. **Create Page**: "Featured Products"
2. **Add Sections**:
   - Header (HTML): Title and description
   - Product 1 (HTML): Product details with image
   - Product 2 (HTML): Another product
   - Call-to-action (HTML): Shop now button

### Building a Landing Page
1. **Create Page**: "Special Offer"
2. **Add Sections** in order:
   - Hero banner (HTML)
   - Benefits list (HTML)
   - Product gallery (Gallery)
   - Customer testimonials (HTML)
   - Contact form (HTML)

## Best Practices

### SEO Optimization
- Always fill in **Meta Description** for pages
- Use descriptive **Page Titles**
- Create SEO-friendly **Slugs** (lowercase, hyphens)
- Add **Alt Text** to all images

### Content Organization
- Use logical **Sort Order** numbers (0, 10, 20, 30...)
- This leaves room to insert sections later (5, 15, 25...)
- Keep section titles descriptive for easy management

### Performance Tips
- Optimize images before uploading (compress, resize)
- Use appropriate image formats (WebP for web, JPG for photos)
- Keep HTML sections clean and minimal

### Mobile Responsiveness
- Test content on mobile devices
- Use responsive HTML in sections:
```html
<div style="max-width: 100%; padding: 20px;">
  <img src="image.jpg" style="width: 100%; height: auto;" />
</div>
```

## Advanced Features

### Custom CSS Styling
Add custom styles in HTML sections:
```html
<style>
.custom-box {
  background: linear-gradient(45deg, #007bff, #6610f2);
  color: white;
  padding: 20px;
  border-radius: 10px;
  text-align: center;
}
</style>
<div class="custom-box">
  <h2>Special Announcement</h2>
  <p>Limited time offer!</p>
</div>
```

### Interactive Elements
Add buttons, forms, and interactive content:
```html
<div style="text-align: center; margin: 20px 0;">
  <button onclick="alert('Hello!')" 
          style="background: #007bff; color: white; padding: 15px 30px; border: none; border-radius: 5px; cursor: pointer;">
    Click Me!
  </button>
</div>
```

### Dynamic Content Updates
- Pages update immediately when published
- No need to restart the server
- Changes are stored in the database permanently
- Perfect for daily content updates without technical knowledge

## Troubleshooting

### Common Issues
1. **Page not showing**: Check if "Published" is enabled
2. **Images not displaying**: Verify image URLs are correct and accessible
3. **Sections out of order**: Adjust Sort Order numbers
4. **HTML not rendering**: Check for syntax errors in HTML content

### Getting Help
- All content is stored safely in the database
- Changes can be reverted by editing sections
- Contact technical support if you encounter issues

## Daily Workflow Example

### Morning Content Update (5 minutes)
1. Login to CMS (`/cms`)
2. Go to homepage sections
3. Update "Today's Deals" section with new products
4. Upload any new product images
5. Update meta descriptions for SEO

### Weekly Page Creation (15 minutes)
1. Create new blog/news page
2. Add header with title and date
3. Add main content sections
4. Upload supporting images
5. Set to published when ready

This CMS system gives you complete control over your website content without needing any coding knowledge!