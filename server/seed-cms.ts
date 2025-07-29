// Script to seed CMS with sample pages
import { db } from './db';
import { cmsPages } from '@shared/schema';

async function seedCmsPages() {
  try {
    console.log('Seeding CMS with sample pages...');
    
    // Homepage content
    const homepageContent = `
<div class="homepage-content">
  <h1>Welcome to PickNTrust</h1>
  <p>Your trusted shopping companion for discovering the best products and deals.</p>
  
  <div class="features">
    <h2>Why Choose PickNTrust?</h2>
    <ul>
      <li>✅ Curated product recommendations</li>
      <li>✅ Real user reviews and ratings</li>
      <li>✅ Best price comparisons</li>
      <li>✅ Trusted affiliate partnerships</li>
    </ul>
  </div>
  
  <div class="cta-section">
    <h2>Start Shopping Smart Today!</h2>
    <p>Browse our featured products and discover amazing deals from trusted retailers.</p>
  </div>
</div>
    `;

    // About Us content
    const aboutUsContent = `
<div class="about-content">
  <h1>About PickNTrust</h1>
  <p>PickNTrust is your trusted companion in the world of online shopping. We're dedicated to helping you make informed purchasing decisions by providing curated product recommendations, honest reviews, and the best deals available.</p>
  
  <h2>Our Mission</h2>
  <p>To simplify online shopping by connecting you with high-quality products from trusted retailers, ensuring you get the best value for your money.</p>
  
  <h2>What We Do</h2>
  <ul>
    <li>Curate the best products across multiple categories</li>
    <li>Provide detailed product reviews and comparisons</li>
    <li>Track prices and notify you of the best deals</li>
    <li>Partner with trusted affiliate networks</li>
  </ul>
  
  <h2>Our Values</h2>
  <ul>
    <li><strong>Trust:</strong> We only recommend products we believe in</li>
    <li><strong>Transparency:</strong> Clear information about affiliate partnerships</li>
    <li><strong>Quality:</strong> Rigorous selection process for featured products</li>
    <li><strong>Value:</strong> Focus on getting you the best deals</li>
  </ul>
</div>
    `;

    // Contact Us content
    const contactUsContent = `
<div class="contact-content">
  <h1>Contact Us</h1>
  <p>We'd love to hear from you! Get in touch with us for any questions, suggestions, or partnerships.</p>
  
  <div class="contact-info">
    <h2>Get In Touch</h2>
    <div class="contact-details">
      <p><strong>Email:</strong> sharmachanchalcvp@gmail.com</p>
      <p><strong>Phone:</strong> +91 9898892198</p>
      <p><strong>WhatsApp Channel:</strong> <a href="https://whatsapp.com/channel/0029Vb6osphADTODpfUO4h0C" target="_blank">Join our channel</a></p>
    </div>
  </div>
  
  <div class="business-hours">
    <h2>Business Hours</h2>
    <p>Monday - Friday: 9:00 AM - 6:00 PM IST</p>
    <p>Saturday: 9:00 AM - 2:00 PM IST</p>
    <p>Sunday: Closed</p>
  </div>
  
  <div class="support">
    <h2>Customer Support</h2>
    <p>For product-related queries or technical support, please email us or reach out via WhatsApp. We typically respond within 24 hours.</p>
  </div>
</div>
    `;

    // Create pages array
    const pages = [
      {
        title: 'Homepage',
        slug: 'homepage',
        content: homepageContent,
        metaTitle: 'PickNTrust - Your Trusted Shopping Companion',
        metaDescription: 'Discover the best products and deals with PickNTrust. Your trusted companion for smart online shopping with curated recommendations and honest reviews.',
        isPublished: true,
      },
      {
        title: 'About Us',
        slug: 'about-us',
        content: aboutUsContent,
        metaTitle: 'About PickNTrust - Our Mission and Values',
        metaDescription: 'Learn about PickNTrust\'s mission to simplify online shopping through trusted product recommendations and transparent affiliate partnerships.',
        isPublished: true,
      },
      {
        title: 'Contact Us',
        slug: 'contact-us',
        content: contactUsContent,
        metaTitle: 'Contact PickNTrust - Get In Touch',
        metaDescription: 'Contact PickNTrust for questions, support, or partnerships. Email, phone, and WhatsApp support available.',
        isPublished: true,
      },
    ];

    // Insert pages
    for (const page of pages) {
      try {
        await db.insert(cmsPages).values(page);
        console.log(`✅ Created page: ${page.title}`);
      } catch (error: any) {
        if (error.code === '23505') { // Unique constraint violation
          console.log(`ℹ️ Page "${page.title}" already exists, skipping...`);
        } else {
          throw error;
        }
      }
    }
    
    console.log('🎉 CMS seeding completed successfully!');
    console.log('📄 Pages available for editing in CMS:');
    console.log('   - Homepage (for main page content)');
    console.log('   - About Us (company information)');
    console.log('   - Contact Us (contact details)');
    
  } catch (error) {
    console.error('❌ Error seeding CMS pages:', error);
    process.exit(1);
  }
}

// Run if called directly
seedCmsPages()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Failed to seed CMS pages:', error);
    process.exit(1);
  });

export { seedCmsPages };