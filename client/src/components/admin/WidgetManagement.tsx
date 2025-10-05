import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Edit, Plus, Save, X, Eye, EyeOff, Code, Monitor, Smartphone, ArrowUp, ArrowDown } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

interface Widget {
  id: number;
  name: string;
  description?: string;
  body?: string;
  code: string;
  targetPage: string;
  position: string;
  isActive: boolean;
  displayOrder: number;
  maxWidth?: string;
  customCss?: string;
  showOnMobile: boolean;
  showOnDesktop: boolean;
  externalLink?: string;
  createdAt: string;
  updatedAt: string;
}

interface WidgetForm {
  name: string;
  description: string;
  body: string;
  code: string;
  targetPage: string;
  position: string;
  isActive: boolean;
  maxWidth: string;
  customCss: string;
  showOnMobile: boolean;
  showOnDesktop: boolean;
  externalLink: string;
}

// Travel category interface for dynamic categories
interface TravelCategory {
  id: number;
  name: string;
  slug: string;
  icon: string;
  color: string;
  description?: string;
  isActive: boolean;
  displayOrder: number;
}

// Static system pages that are always available
const staticPages = [
  { value: 'home', label: 'Home Page' },
  { value: 'categories', label: 'Categories Page' },
  { value: 'blog', label: 'Blog Page' },
  { value: 'videos', label: 'Videos Page' },
  { value: 'wishlist', label: 'Wishlist Page' },
  { value: 'contact', label: 'Contact Page' },
  { value: 'admin', label: 'Admin Panel' },
];

// Product pages that support widgets
const productPages = [
  { value: 'prime-picks', label: 'Prime Picks' },
  { value: 'value-picks', label: 'Value Picks' },
  { value: 'click-picks', label: 'Click Picks' },
  { value: 'cue-picks', label: 'Cue Picks' },
  { value: 'global-picks', label: 'Global Picks' },
  { value: 'loot-box', label: 'Loot Box' },
  { value: 'deals-hub', label: 'Deals Hub' },
  { value: 'travel-picks', label: 'Travel Picks' },
];

// Note: Travel subcategories are now fetched dynamically from API
// This will be replaced by dynamic travel categories in the component

const positions = [
  { value: 'header', label: 'Header (Legacy)' },
  { value: 'header-top', label: 'Header Top (Above Navigation)' },
  { value: 'header-bottom', label: 'Header Bottom (Below Navigation)' },
  { value: 'body', label: 'Body (Main content flow)' },
  { value: 'content-top', label: 'Content Top (Before Main Content)' },
  { value: 'content-middle', label: 'Content Middle (Between Sections)' },
  { value: 'content-bottom', label: 'Content Bottom (After Main Content)' },
  { value: 'sidebar-left', label: 'Left Sidebar' },
  { value: 'sidebar-right', label: 'Right Sidebar' },
  { value: 'footer-top', label: 'Footer Top (Before Footer Content)' },
  { value: 'footer-bottom', label: 'Footer Bottom (After Footer Content)' },
  { value: 'floating-top-left', label: 'Floating Top Left' },
  { value: 'floating-top-right', label: 'Floating Top Right' },
  { value: 'floating-bottom-left', label: 'Floating Bottom Left' },
  { value: 'floating-bottom-right', label: 'Floating Bottom Right' },
  { value: 'banner-top', label: 'Full Width Banner Top' },
  { value: 'banner-bottom', label: 'Full Width Banner Bottom' },
  { value: 'product-grid-top', label: 'Product Grid Top (Above cards)' },
  { value: 'product-grid-bottom', label: 'Product Grid Bottom (Below cards)' },
  { value: 'product-card-top', label: 'Product Card Top (Inside each card)' },
  { value: 'product-card-bottom', label: 'Product Card Bottom (Inside each card)' }
];

const widgetTemplates = [
  // Advertisement Templates
  {
    name: 'Google AdSense - Display Ad',
    category: 'Advertisements',
    code: `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossorigin="anonymous"></script>
<!-- Display Ad -->
<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
     data-ad-slot="XXXXXXXXXX"
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>`
  },
  {
    name: 'Google AdSense - Banner Ad',
    category: 'Advertisements',
    code: `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossorigin="anonymous"></script>
<!-- Banner Ad -->
<ins class="adsbygoogle"
     style="display:inline-block;width:728px;height:90px"
     data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
     data-ad-slot="XXXXXXXXXX"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>`
  },
  {
    name: 'Trip.com Affiliate Banner',
    category: 'Advertisements',
    code: `<iframe border="0" src="https://www.trip.com/partners/ad/SB5334205?Allianceid=7067369&SID=258816601&trip_sub1=" style="width:300px;height:250px" frameborder="0" scrolling="no" style="border:none" id="SB5334205"></iframe>`
  },
  {
    name: 'Banner Ad',
    category: 'Advertisements',
    code: `<div class="relative overflow-hidden rounded-lg shadow-lg">
  <a href="#" target="_blank" class="block">
    <img src="https://via.placeholder.com/728x90/4F46E5/FFFFFF?text=Your+Banner+Ad" alt="Advertisement" class="w-full h-auto">
    <div class="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">Ad</div>
  </a>
</div>`
  },
  {
    name: 'Affiliate Product Card',
    category: 'Advertisements',
    code: `<div class="bg-white border border-gray-200 rounded-lg shadow-sm p-4 max-w-sm">
  <img src="https://via.placeholder.com/200x200" alt="Product" class="w-full h-48 object-cover rounded-md mb-3">
  <h3 class="font-semibold text-gray-900 mb-2">Product Name</h3>
  <p class="text-sm text-gray-600 mb-3">Product description goes here...</p>
  <div class="flex items-center justify-between">
    <span class="text-lg font-bold text-green-600">$99.99</span>
    <a href="#" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">Buy Now</a>
  </div>
</div>`
  },
  
  // Call-to-Action Templates
  {
    name: 'Newsletter Signup',
    category: 'Call-to-Action',
    code: `<div class="bg-gradient-to-r from-blue-500 to-purple-600 p-6 rounded-lg text-white">
  <h3 class="text-xl font-bold mb-2">Subscribe to Our Newsletter</h3>
  <p class="mb-4 opacity-90">Get the latest deals and updates delivered to your inbox!</p>
  <form class="flex gap-2">
    <input type="email" placeholder="Enter your email" class="flex-1 px-4 py-2 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-white" required>
    <button type="submit" class="px-6 py-2 bg-white text-blue-600 rounded-md hover:bg-gray-100 transition-colors font-semibold">Subscribe</button>
  </form>
</div>`
  },
  {
    name: 'Download CTA',
    category: 'Call-to-Action',
    code: `<div class="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
  <div class="mb-4">
    <svg class="w-12 h-12 mx-auto text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
    </svg>
  </div>
  <h3 class="text-lg font-semibold text-green-900 mb-2">Download Our App</h3>
  <p class="text-green-700 mb-4">Get exclusive deals and faster checkout!</p>
  <a href="#" class="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold">Download Now</a>
</div>`
  },
  {
    name: 'Contact CTA',
    category: 'Call-to-Action',
    code: `<div class="bg-orange-50 border-l-4 border-orange-400 p-6">
  <div class="flex items-center">
    <div class="flex-shrink-0">
      <svg class="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
      </svg>
    </div>
    <div class="ml-4 flex-1">
      <h3 class="text-lg font-semibold text-orange-900">Need Help?</h3>
      <p class="text-orange-700 mb-3">Our support team is here to assist you!</p>
      <a href="#" class="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors">Contact Us</a>
    </div>
  </div>
</div>`
  },
  
  // Social Media Templates
  {
    name: 'Social Media Links',
    category: 'Social Media',
    code: `<div class="flex justify-center space-x-4 p-4">
  <a href="#" class="text-blue-600 hover:text-blue-800 transition-colors" title="Facebook">
    <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
  </a>
  <a href="#" class="text-blue-400 hover:text-blue-600 transition-colors" title="Twitter">
    <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
  </a>
  <a href="#" class="text-pink-600 hover:text-pink-800 transition-colors" title="Instagram">
    <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.097.118.112.221.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.012.001z"/></svg>
  </a>
  <a href="#" class="text-red-600 hover:text-red-800 transition-colors" title="YouTube">
    <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
  </a>
</div>`
  },
  {
    name: 'Twitter Feed',
    category: 'Social Media',
    code: `<div class="bg-white border border-gray-200 rounded-lg p-4 max-w-md">
  <div class="flex items-center mb-3">
    <img src="https://via.placeholder.com/40x40" alt="Profile" class="w-10 h-10 rounded-full mr-3">
    <div>
      <h4 class="font-semibold text-gray-900">@YourHandle</h4>
      <p class="text-sm text-gray-500">Follow us on Twitter</p>
    </div>
  </div>
  <p class="text-gray-700 mb-3">Latest updates and deals from our Twitter feed!</p>
  <a href="#" class="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors">
    <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
    Follow on Twitter
  </a>
</div>`
  },
  
  // Form Templates
  {
    name: 'Contact Form',
    category: 'Forms',
    code: `<div class="bg-white p-6 rounded-lg shadow-md border border-gray-200">
  <h3 class="text-xl font-semibold text-gray-900 mb-4">Contact Us</h3>
  <form class="space-y-4">
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
      <input type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
      <input type="email" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
    </div>
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Message</label>
      <textarea rows="4" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required></textarea>
    </div>
    <button type="submit" class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">Send Message</button>
  </form>
</div>`
  },
  {
    name: 'Feedback Form',
    category: 'Forms',
    code: `<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
  <h3 class="text-lg font-semibold text-yellow-900 mb-3">We Value Your Feedback</h3>
  <form class="space-y-3">
    <div>
      <label class="block text-sm font-medium text-yellow-800 mb-1">How was your experience?</label>
      <div class="flex space-x-2">
        <button type="button" class="text-2xl hover:scale-110 transition-transform">😞</button>
        <button type="button" class="text-2xl hover:scale-110 transition-transform">😐</button>
        <button type="button" class="text-2xl hover:scale-110 transition-transform">😊</button>
        <button type="button" class="text-2xl hover:scale-110 transition-transform">😍</button>
      </div>
    </div>
    <div>
      <textarea placeholder="Tell us more..." rows="3" class="w-full px-3 py-2 border border-yellow-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"></textarea>
    </div>
    <button type="submit" class="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors">Submit Feedback</button>
  </form>
</div>`
  },
  
  // Notification Templates
  {
    name: 'Announcement Banner',
    category: 'Notifications',
    code: `<div class="bg-blue-600 text-white p-4 text-center relative">
  <p class="font-medium">🎉 Special Offer: Get 50% off on all products! Limited time only.</p>
  <button class="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-200" onclick="this.parentElement.style.display='none'">
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
    </svg>
  </button>
</div>`
  },
  {
    name: 'Cookie Notice',
    category: 'Notifications',
    code: `<div class="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 z-50" id="cookieNotice">
  <div class="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-4">
    <p class="text-sm">We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies.</p>
    <div class="flex gap-2">
      <button onclick="document.getElementById('cookieNotice').style.display='none'" class="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition-colors">Accept</button>
      <button onclick="document.getElementById('cookieNotice').style.display='none'" class="border border-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-800 transition-colors">Decline</button>
    </div>
  </div>
</div>`
  },
  
  // Analytics & Tracking
  {
    name: 'Google Analytics',
    category: 'Analytics',
    code: `<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_TRACKING_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_TRACKING_ID');
</script>`
  },
  {
    name: 'Facebook Pixel',
    category: 'Analytics',
    code: `<!-- Facebook Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', 'YOUR_PIXEL_ID');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=YOUR_PIXEL_ID&ev=PageView&noscript=1"/></noscript>`
  },
  
  // Live Chat & Support
  {
    name: 'Live Chat Widget',
    category: 'Support',
    code: `<div class="fixed bottom-4 right-4 z-50">
  <button id="chatToggle" class="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors">
    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
    </svg>
  </button>
  <div id="chatWindow" class="hidden absolute bottom-16 right-0 w-80 h-96 bg-white border border-gray-300 rounded-lg shadow-xl">
    <div class="bg-blue-600 text-white p-4 rounded-t-lg">
      <h3 class="font-semibold">Live Chat</h3>
    </div>
    <div class="p-4 h-64 overflow-y-auto">
      <p class="text-gray-600">Hello! How can we help you today?</p>
    </div>
    <div class="p-4 border-t">
      <input type="text" placeholder="Type your message..." class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
    </div>
  </div>
</div>
<script>
document.getElementById('chatToggle').onclick = function() {
  const chatWindow = document.getElementById('chatWindow');
  chatWindow.classList.toggle('hidden');
};
</script>`
  },
  {
    name: 'WhatsApp Chat',
    category: 'Support',
    code: `<div class="fixed bottom-4 left-4 z-50">
  <a href="https://wa.me/1234567890?text=Hello!%20I%20need%20help" target="_blank" class="flex items-center bg-green-500 text-white px-4 py-3 rounded-full shadow-lg hover:bg-green-600 transition-colors">
    <svg class="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
    </svg>
    Chat with us
  </a>
</div>`
  },
  
  // Custom HTML Template
  {
    name: 'Custom HTML',
    category: 'Custom',
    code: `<!-- Add your custom HTML code here -->
<div class="p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
  <h3 class="text-xl font-semibold text-gray-900 mb-3">Custom Widget</h3>
  <p class="text-gray-600 mb-4">Replace this with your custom content. You can add any HTML, CSS, and JavaScript here.</p>
  <div class="bg-white p-4 rounded border">
    <p class="text-sm text-gray-500">Your custom content goes here...</p>
  </div>
</div>

<style>
/* Add your custom CSS here */
.custom-widget {
  /* Your styles */
}
</style>

<script>
// Add your custom JavaScript here
console.log('Custom widget loaded');
</script>`
  }
];

export default function WidgetManagement() {
  const [isAddingWidget, setIsAddingWidget] = useState(true);
  const [editingWidget, setEditingWidget] = useState<Widget | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [creationMode, setCreationMode] = useState<'code' | 'form'>('form');
  const [showPreviewFullscreen, setShowPreviewFullscreen] = useState(false);
  const [formBuilder, setFormBuilder] = useState({
    templateType: 'image-link' as 'image-link' | 'cta-button' | 'announcement-banner' | 'banner-ad' | 'adsense',
    title: '',
    descriptionText: '',
    imageUrl: '',
    imageAlt: '',
    linkUrl: '',
    buttonText: 'Learn More',
    colorAccent: '#2563EB',
    adClient: '',
    adSlot: ''
  });
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [formData, setFormData] = useState<WidgetForm>({
    name: '',
    description: '',
    body: '',
    code: '',
    targetPage: '',  // No default - let user select
    position: '',    // No default - let user select
    isActive: true,
    maxWidth: '',
    customCss: '',
    showOnMobile: true,
    showOnDesktop: true,
    externalLink: '',
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch dynamic navigation tabs
  const { data: navTabs = [] } = useQuery({
    queryKey: ['/api/admin/nav-tabs'],
    queryFn: async () => {
      const response = await fetch('/api/admin/nav-tabs', {
        headers: {
          'x-admin-password': localStorage.getItem('adminPassword') || ''
        }
      });
      if (!response.ok) throw new Error('Failed to fetch navigation tabs');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch dynamic travel categories
  const { data: travelCategories = [] } = useQuery<TravelCategory[]>({
    queryKey: ['/api/travel-categories'],
    queryFn: async () => {
      const response = await fetch('/api/travel-categories');
      if (!response.ok) {
        console.log('Failed to fetch travel categories, using empty array');
        return [];
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Create dynamic travel subcategories from API
  const travelSubcategories = travelCategories
    .filter(cat => cat.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map(cat => ({
      value: `travel-${cat.slug}`,
      label: `Travel - ${cat.name}`
    }));

  // Combine static pages with dynamic navigation tabs and travel categories
  const availablePages = [
    ...staticPages,
    ...productPages,
    ...travelSubcategories,
    ...(Array.isArray(navTabs) ? navTabs : []).map((tab: any) => ({
      value: tab.slug,
      label: tab.name
    }))
  ];

  // Remove duplicates based on value
  const pages = availablePages.filter((page, index, self) => 
    index === self.findIndex(p => p.value === page.value)
  );

  // Fetch widgets with proper cache management
  const { data: widgetsData, isLoading, refetch } = useQuery({
    queryKey: ['/api/admin/widgets'],
    queryFn: async () => {
      const response = await fetch('/api/admin/widgets', {
        headers: {
          'x-admin-password': localStorage.getItem('pickntrust-admin-password') || localStorage.getItem('adminPassword') || 'pickntrust2025'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch widgets');
      const rawWidgets = await response.json();
      
      // Transform snake_case API response to camelCase for frontend
      return rawWidgets.map((widget: any) => ({
        id: widget.id,
        name: widget.name,
        description: widget.description || '',
        body: widget.body || '',
        code: widget.code,
        targetPage: widget.target_page,
        position: widget.position,
        isActive: Boolean(widget.is_active),
        displayOrder: widget.display_order,
        maxWidth: widget.max_width,
        customCss: widget.custom_css,
        showOnMobile: Boolean(widget.show_on_mobile),
        showOnDesktop: Boolean(widget.show_on_desktop),
        externalLink: widget.external_link || '',
        createdAt: widget.created_at,
        updatedAt: widget.updated_at
      }));
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false
  });

  // Fetch widget statistics
  const { data: stats } = useQuery({
    queryKey: ['/api/admin/widgets/stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/widgets/stats', {
        headers: {
          'x-admin-password': localStorage.getItem('pickntrust-admin-password') || localStorage.getItem('adminPassword') || 'pickntrust2025'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch widget stats');
      return response.json();
    }
  });

  // Create widget mutation
  const createWidgetMutation = useMutation({
    mutationFn: async (widgetData: WidgetForm) => {
      // API accepts camelCase directly - no transformation needed
      const response = await fetch('/api/admin/widgets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': localStorage.getItem('pickntrust-admin-password') || localStorage.getItem('adminPassword') || 'pickntrust2025'
        },
        body: JSON.stringify(widgetData)
      });
      if (!response.ok) throw new Error('Failed to create widget');
      return response.json();
    },
    onSuccess: () => {
      // Force immediate refresh of widget data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/widgets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/widgets/stats'] });
      queryClient.refetchQueries({ queryKey: ['/api/admin/widgets'] });
      refetch(); // Force immediate refetch
      setIsAddingWidget(false);
      resetForm();
      toast({ title: 'Success', description: 'Widget created successfully!' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: 'Failed to create widget', variant: 'destructive' });
    }
  });

  // Update widget mutation
  const updateWidgetMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<WidgetForm> }) => {
      // API accepts camelCase directly - no transformation needed
      const response = await fetch(`/api/admin/widgets/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': localStorage.getItem('pickntrust-admin-password') || localStorage.getItem('adminPassword') || 'pickntrust2025'
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update widget');
      return response.json();
    },
    onSuccess: () => {
      // Force immediate refresh of widget data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/widgets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/widgets/stats'] });
      queryClient.refetchQueries({ queryKey: ['/api/admin/widgets'] });
      refetch(); // Force immediate refetch
      setIsAddingWidget(false);
      setEditingWidget(null);
      resetForm();
      toast({ title: 'Success', description: 'Widget updated successfully!' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: 'Failed to update widget', variant: 'destructive' });
    }
  });

  // Delete widget mutation
  const deleteWidgetMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/widgets/${id}`, {
        method: 'DELETE',
        headers: {
          'x-admin-password': localStorage.getItem('pickntrust-admin-password') || localStorage.getItem('adminPassword') || 'pickntrust2025'
        }
      });
      if (!response.ok) throw new Error('Failed to delete widget');
      return response.json();
    },
    onSuccess: () => {
      // Force immediate refresh of widget data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/widgets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/widgets/stats'] });
      queryClient.refetchQueries({ queryKey: ['/api/admin/widgets'] });
      refetch(); // Force immediate refetch
      toast({ title: 'Success', description: 'Widget deleted successfully!' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: 'Failed to delete widget', variant: 'destructive' });
    }
  });

  // Toggle widget status mutation
  const toggleWidgetMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/widgets/${id}/toggle`, {
        method: 'PATCH',
        headers: {
          'x-admin-password': localStorage.getItem('pickntrust-admin-password') || localStorage.getItem('adminPassword') || 'pickntrust2025'
        }
      });
      if (!response.ok) throw new Error('Failed to toggle widget');
      return response.json();
    },
    onSuccess: () => {
      // Force immediate refresh of widget data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/widgets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/widgets/stats'] });
      queryClient.refetchQueries({ queryKey: ['/api/admin/widgets'] });
      refetch(); // Force immediate refetch
      toast({ title: 'Success', description: 'Widget status updated!' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: 'Failed to toggle widget', variant: 'destructive' });
    }
  });

  const getTemplateDescription = (templateName: string) => {
    const descriptions: Record<string, string> = {
      'Google AdSense': 'Display responsive Google ads on your website',
      'Banner Ad': 'Custom banner advertisement with image and link',
      'Affiliate Product Card': 'Product showcase card with buy now button',
      'Newsletter Signup': 'Email subscription form with gradient design',
      'Download CTA': 'App download call-to-action with icon',
      'Contact CTA': 'Contact us prompt with phone icon',
      'Social Media Links': 'Social media icons with hover effects',
      'Twitter Feed': 'Twitter profile card with follow button',
      'Contact Form': 'Full contact form with name, email, and message',
      'Feedback Form': 'Customer feedback form with emoji ratings',
      'Announcement Banner': 'Dismissible announcement banner',
      'Cookie Notice': 'GDPR compliant cookie consent notice',
      'Google Analytics': 'Google Analytics tracking code',
      'Facebook Pixel': 'Facebook Pixel tracking for ads',
      'Live Chat Widget': 'Interactive live chat support widget',
      'WhatsApp Chat': 'WhatsApp contact button with custom message',
      'Custom HTML': 'Blank template for custom HTML, CSS, and JavaScript'
    };
    return descriptions[templateName] || 'Custom widget template';
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      body: '',
      code: '',
      targetPage: '',  // No default - let user select
      position: '',    // No default - let user select
      isActive: true,
      maxWidth: '',
      customCss: '',
      showOnMobile: true,
      showOnDesktop: true,
      externalLink: '',
    });
    setSelectedTemplate('');
    setSelectedCategory('All');
    setCreationMode('form');
    setFormBuilder({
      templateType: 'image-link',
      title: '',
      descriptionText: '',
      imageUrl: '',
      imageAlt: '',
      linkUrl: '',
      buttonText: 'Learn More',
      colorAccent: '#2563EB',
      adClient: '',
      adSlot: ''
    });
  };

  // Generate widget code from the form builder inputs
  const generateCodeFromForm = (): string | null => {
    const { templateType, title, descriptionText, imageUrl, imageAlt, linkUrl, buttonText, colorAccent, adClient, adSlot } = formBuilder;

    const safeTitle = title?.trim() || 'Widget';
    const safeButtonText = buttonText?.trim() || 'Learn More';
    const safeLink = linkUrl?.trim() || '#';
    const descBlock = descriptionText?.trim()
      ? `<p class="text-sm text-gray-700 mt-2">${descriptionText.trim()}</p>`
      : '';

    if (templateType === 'image-link') {
      if (!imageUrl?.trim()) {
        toast({ title: 'Error', description: 'Please provide an Image URL for the Image + Link template', variant: 'destructive' });
        return null;
      }
      return `<!-- Auto-generated: Image + Link Widget -->\n<div class="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden max-w-md">\n  <img src="${imageUrl.trim()}" alt="${safeTitle}" class="w-full h-48 object-cover">\n  <div class="p-4">\n    <h3 class="text-lg font-semibold text-gray-900">${safeTitle}</h3>\n    ${descBlock}\n    <a href="${safeLink}" class="inline-block mt-3 px-4 py-2 rounded-md text-white" style="background-color:${colorAccent}">${safeButtonText}</a>\n  </div>\n</div>`;
    }

    if (templateType === 'cta-button') {
      return `<!-- Auto-generated: CTA Button Widget -->\n<div class="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">\n  <h3 class="text-lg font-semibold text-gray-900">${safeTitle}</h3>\n  ${descBlock}\n  <a href="${safeLink}" class="inline-block mt-3 px-6 py-2 rounded-md text-white" style="background-color:${colorAccent}">${safeButtonText}</a>\n</div>`;
    }

    if (templateType === 'announcement-banner') {
      const bannerText = descriptionText?.trim() || 'Announcement';
      return `<!-- Auto-generated: Announcement Banner Widget -->\n<div class="text-white p-4 text-center relative" style="background-color:${colorAccent}">\n  <p class="font-medium"><strong>${safeTitle}:</strong> ${bannerText}</p>\n  <button class="absolute right-4 top-1/2 -translate-y-1/2" onclick="this.parentElement.style.display='none'">\n    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>\n    </svg>\n  </button>\n</div>`;
    }

    if (templateType === 'banner-ad') {
      if (!imageUrl?.trim()) {
        toast({ title: 'Error', description: 'Please provide an Image URL for the Banner Ad template', variant: 'destructive' });
        return null;
      }
      const alt = (imageAlt?.trim() || safeTitle);
      return `<!-- Auto-generated: Banner Ad Widget -->\n<div class="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden max-w-md">\n  <a href="${safeLink}" target="_blank" rel="nofollow sponsored">\n    <img src="${imageUrl.trim()}" alt="${alt}" class="w-full h-48 object-cover">\n  </a>\n  <div class="p-4">\n    <h3 class="text-lg font-semibold text-gray-900">${safeTitle}</h3>\n    ${descBlock}\n  </div>\n</div>`;
    }

    if (templateType === 'adsense') {
      const client = adClient?.trim();
      const slot = adSlot?.trim();
      if (!client || !slot) {
        toast({ title: 'Error', description: 'AdSense requires both Client ID (ca-pub-...) and Slot ID', variant: 'destructive' });
        return null;
      }
      return `<!-- Auto-generated: Google AdSense Widget -->\n<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}" crossorigin="anonymous"></script>\n<ins class="adsbygoogle" style="display:block" data-ad-client="${client}" data-ad-slot="${slot}" data-ad-format="auto" data-full-width-responsive="true"></ins>\n<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>`;
    }

    return null;
  };

  // Upload image helper and set imageUrl from response
  const handleImageUpload = async (file: File) => {
    try {
      setIsUploadingImage(true);
      const fd = new FormData();
      fd.append('file', file);
      const resp = await fetch('/api/upload', { method: 'POST', body: fd });
      if (!resp.ok) throw new Error('Upload failed');
      const data = await resp.json();
      const url = typeof data.url === 'string' ? data.url : data?.files?.image || '';
      if (url) {
        setFormBuilder(prev => ({ ...prev, imageUrl: url }));
        toast({ title: 'Image Uploaded', description: 'Image URL set from uploaded file.' });
      } else {
        throw new Error('No URL returned from upload');
      }
    } catch (e: any) {
      toast({ title: 'Upload Error', description: e?.message || 'Failed to upload image', variant: 'destructive' });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.targetPage) {
      toast({ title: 'Error', description: 'Please select a target page', variant: 'destructive' });
      return;
    }
    
    if (!formData.position) {
      toast({ title: 'Error', description: 'Please select a position', variant: 'destructive' });
      return;
    }
    
    // When using the form builder, generate code before submit
    let payload: WidgetForm = { ...formData };
    if (creationMode === 'form') {
      const generated = generateCodeFromForm();
      if (!generated) {
        // generation failed due to validation, do not submit
        return;
      }
      payload = { ...payload, code: generated };
    }

    if (editingWidget) {
      updateWidgetMutation.mutate({ id: editingWidget.id, data: payload });
    } else {
      createWidgetMutation.mutate(payload);
    }
  };

  const handleEdit = (widget: Widget) => {
    setEditingWidget(widget);
    setFormData({
      name: widget.name,
      description: widget.description || '',
      body: widget.body || '',
      code: widget.code,
      targetPage: widget.targetPage,
      position: widget.position,
      isActive: widget.isActive,
      maxWidth: widget.maxWidth || '',
      customCss: widget.customCss || '',
      showOnMobile: widget.showOnMobile,
      showOnDesktop: widget.showOnDesktop,
      externalLink: widget.externalLink || '',
    });
    setIsAddingWidget(true);
    setCreationMode('code');
  };

  const handleTemplateSelect = (template: typeof widgetTemplates[0]) => {
    setFormData(prev => ({
      ...prev,
      name: template.name,
      code: template.code
    }));
    setSelectedTemplate(template.name);
    setCreationMode('code');
  };

  const handleCancel = () => {
    setIsAddingWidget(false);
    setEditingWidget(null);
    resetForm();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading widgets...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Widget Management</h2>
          <p className="text-gray-600 dark:text-gray-400">Add and manage custom widgets for your pages</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              refetch();
              toast({ title: 'Success', description: 'Widget list refreshed!' });
            }}
            variant="outline"
            size="sm"
          >
            🔄 Refresh
          </Button>
          <Button
            onClick={() => setIsAddingWidget(true)}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={isAddingWidget}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Widget
          </Button>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Widgets</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                </div>
                <Code className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Widgets</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                </div>
                <Eye className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Inactive Widgets</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.inactive}</p>
                </div>
                <EyeOff className="w-8 h-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pages with Widgets</p>
                  <p className="text-2xl font-bold text-purple-600">{Object.keys(stats.byPage || {}).length}</p>
                </div>
                <Monitor className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add/Edit Widget Form */}
      {isAddingWidget && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
          <CardHeader>
            <CardTitle className="text-blue-800 dark:text-blue-200">
              {editingWidget ? 'Edit Widget' : 'Add New Widget'}
            </CardTitle>
            <CardDescription>
              {editingWidget ? 'Update the widget details' : 'Create a new widget for your pages'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Creation Mode Toggle */}
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">Creation Mode</Label>
                <div className="flex gap-2">
                  <Button type="button" variant={creationMode === 'form' ? 'default' : 'outline'} size="sm" onClick={() => setCreationMode('form')}>Use Form</Button>
                  <Button type="button" variant={creationMode === 'code' ? 'default' : 'outline'} size="sm" onClick={() => setCreationMode('code')}>Paste Code</Button>
                </div>
              </div>
              {/* Template Selection (shown only in Code mode) */}
              {!editingWidget && creationMode === 'code' && (
                <div>
                  <Label className="text-sm font-medium">Widget Templates</Label>
                  <p className="text-xs text-gray-500 mb-3">Choose from our comprehensive collection of pre-built widgets</p>
                  
                  {/* Category Tabs */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {['All', ...Array.from(new Set(widgetTemplates.map(t => t.category)))].map((category) => (
                        <Button
                          key={category}
                          type="button"
                          variant={selectedCategory === category ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedCategory(category)}
                          className="text-xs"
                        >
                          {category}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Template Grid */}
                  <div className="max-h-64 overflow-y-auto border rounded-lg p-3">
                    {(selectedCategory === 'All' ? widgetTemplates : widgetTemplates.filter(t => t.category === selectedCategory))
                      .map((template) => (
                        <div key={template.name} className="mb-3 last:mb-0">
                          <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-sm text-gray-900 dark:text-white">{template.name}</h4>
                                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                                  {template.category}
                                </span>
                              </div>
                              <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2">
                                {getTemplateDescription(template.name)}
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant={selectedTemplate === template.name ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleTemplateSelect(template)}
                              className="ml-3"
                            >
                              {selectedTemplate === template.name ? 'Selected' : 'Use Template'}
                            </Button>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Widget Name */}
                <div>
                  <Label htmlFor="name">Widget Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter widget name"
                    required
                  />
                </div>

                {/* Description (optional) */}
                <div>
                  <Label htmlFor="description">Description (optional)</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Short description for admins or template content"
                  />
                </div>

                {/* Target Page */}
                <div>
                  <Label htmlFor="targetPage">Target Page</Label>
                  <Select value={formData.targetPage} onValueChange={(value) => setFormData(prev => ({ ...prev, targetPage: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select page" />
                    </SelectTrigger>
                    <SelectContent>
                      {pages.map((page) => (
                        <SelectItem key={page.value} value={page.value}>
                          {page.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Position */}
                <div>
                  <Label htmlFor="position">Position</Label>
                  <Select value={formData.position} onValueChange={(value) => setFormData(prev => ({ ...prev, position: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      {positions.map((position) => (
                        <SelectItem key={position.value} value={position.value}>
                          {position.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Max Width */}
                <div>
                  <Label htmlFor="maxWidth">Max Width (optional)</Label>
                  <Input
                    id="maxWidth"
                    value={formData.maxWidth}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxWidth: e.target.value }))}
                    placeholder="e.g., 300px, 100%, auto"
                  />
                </div>

                {/* External Link */}
                <div>
                  <Label htmlFor="externalLink">External Link (optional)</Label>
                  <Input
                    id="externalLink"
                    value={formData.externalLink}
                    onChange={(e) => setFormData(prev => ({ ...prev, externalLink: e.target.value }))}
                    placeholder="https://example.com/landing"
                  />
                </div>
              </div>

              {/* Form Builder */}
              {creationMode === 'form' && (
                <div className="space-y-4">
                  <Label className="text-sm font-medium">Form Template</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Template Type</Label>
                      <Select value={formBuilder.templateType} onValueChange={(v) => setFormBuilder(prev => ({ ...prev, templateType: v as any }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select template" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="image-link">Image + Link</SelectItem>
                          <SelectItem value="cta-button">CTA Button</SelectItem>
                          <SelectItem value="announcement-banner">Announcement Banner</SelectItem>
                          <SelectItem value="banner-ad">Banner Ad</SelectItem>
                          <SelectItem value="adsense">Google AdSense</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Title</Label>
                      <Input value={formBuilder.title} onChange={(e) => setFormBuilder(prev => ({ ...prev, title: e.target.value }))} placeholder="Widget title" />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Description Text</Label>
                      <Textarea value={formBuilder.descriptionText} onChange={(e) => setFormBuilder(prev => ({ ...prev, descriptionText: e.target.value }))} rows={3} placeholder="Optional description shown inside the widget" />
                    </div>
                    {(formBuilder.templateType === 'image-link' || formBuilder.templateType === 'announcement-banner' || formBuilder.templateType === 'banner-ad') && (
                      <div>
                        <Label>Image URL or Upload</Label>
                        <Input value={formBuilder.imageUrl} onChange={(e) => setFormBuilder(prev => ({ ...prev, imageUrl: e.target.value }))} placeholder="https://..." />
                        <div className="mt-2 flex items-center gap-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleImageUpload(f);
                            }}
                          />
                          {isUploadingImage && <span className="text-xs text-gray-600">Uploading...</span>}
                        </div>
                        {formBuilder.imageUrl && (
                          <div className="mt-2">
                            <img src={formBuilder.imageUrl} alt="Preview" className="h-20 w-auto rounded border" />
                          </div>
                        )}
                      </div>
                    )}
                    {(formBuilder.templateType === 'image-link' || formBuilder.templateType === 'banner-ad') && (
                      <div>
                        <Label>Image Alt Text (optional)</Label>
                        <Input value={formBuilder.imageAlt} onChange={(e) => setFormBuilder(prev => ({ ...prev, imageAlt: e.target.value }))} placeholder="Describe the image" />
                      </div>
                    )}
                    {formBuilder.templateType === 'adsense' && (
                      <>
                        <div>
                          <Label>AdSense Client ID</Label>
                          <Input value={formBuilder.adClient} onChange={(e) => setFormBuilder(prev => ({ ...prev, adClient: e.target.value }))} placeholder="ca-pub-XXXXXXXXXXXXXXXX" />
                        </div>
                        <div>
                          <Label>AdSense Slot ID</Label>
                          <Input value={formBuilder.adSlot} onChange={(e) => setFormBuilder(prev => ({ ...prev, adSlot: e.target.value }))} placeholder="e.g., 1234567890" />
                        </div>
                      </>
                    )}
                    <div>
                      <Label>Link URL</Label>
                      <Input value={formBuilder.linkUrl} onChange={(e) => setFormBuilder(prev => ({ ...prev, linkUrl: e.target.value }))} placeholder="https://..." />
                    </div>
                    <div>
                      <Label>Button Text</Label>
                      <Input value={formBuilder.buttonText} onChange={(e) => setFormBuilder(prev => ({ ...prev, buttonText: e.target.value }))} placeholder="Learn More" />
                    </div>
                    <div>
                      <Label>Accent Color</Label>
                      <Input type="color" value={formBuilder.colorAccent} onChange={(e) => setFormBuilder(prev => ({ ...prev, colorAccent: e.target.value }))} />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">Code is auto-generated from these fields.</p>
                </div>
              )}

              {/* Secondary Creation Mode Toggle (near builder/editor for visibility) */}
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">Creation Mode</Label>
                <div className="flex gap-2">
                  <Button type="button" variant={creationMode === 'form' ? 'default' : 'outline'} size="sm" onClick={() => setCreationMode('form')}>Use Form</Button>
                  <Button type="button" variant={creationMode === 'code' ? 'default' : 'outline'} size="sm" onClick={() => setCreationMode('code')}>Paste Code</Button>
                </div>
              </div>

              {/* Widget Code */}
              {creationMode === 'code' && (
                <div>
                  <Label htmlFor="code">Widget Code (HTML/CSS/JS)</Label>
                  <Textarea
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="Paste your widget code here..."
                    rows={8}
                    className="font-mono text-sm"
                    required
                  />
                </div>
              )}

              {/* Body (optional) */}
              <div>
                <Label htmlFor="body">Body (optional)</Label>
                <Textarea
                  id="body"
                  value={formData.body}
                  onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                  placeholder="Optional body HTML/text content rendered before code"
                  rows={6}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">If provided, Body renders before/above Code. Use for simple HTML content or helper text; Code supports full HTML/CSS/JS.</p>
              </div>

              {/* Custom CSS */}
              <div>
                <Label htmlFor="customCss">Custom CSS (optional)</Label>
                <Textarea
                  id="customCss"
                  value={formData.customCss}
                  onChange={(e) => setFormData(prev => ({ ...prev, customCss: e.target.value }))}
                  placeholder="Add custom CSS styles..."
                  rows={4}
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Placement Preview</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">Page layout preview</div>
                      <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className={`p-2 text-xs ${formData.position==='banner-top' ? 'bg-green-50 dark:bg-green-900/20 border-b border-green-300 dark:border-green-700' : 'bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700'}`}>
                          Banner Top
                          {formData.position==='banner-top' && (
                            <div className="mt-2 rounded border border-green-300 dark:border-green-700 bg-white dark:bg-gray-900 p-2 text-[11px]" dangerouslySetInnerHTML={{ __html: formData.body || 'Preview content' }} />
                          )}
                        </div>
                        <div className="p-2">
                          <div className={`p-2 text-xs mb-2 ${formData.position==='content-top' ? 'bg-green-50 dark:bg-green-900/20 rounded border border-green-300 dark:border-green-700' : 'bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700'}`}>
                            Content Top
                            {formData.position==='content-top' && (
                              <div className="mt-2 rounded border border-green-300 dark:border-green-700 bg-white dark:bg-gray-900 p-2 text-[11px]" dangerouslySetInnerHTML={{ __html: formData.body || 'Preview content' }} />
                            )}
                          </div>
                          <div className="h-20 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs text-gray-600 dark:text-gray-300 mb-2">Main Content</div>
                          <div className={`p-2 text-xs ${formData.position==='content-bottom' ? 'bg-green-50 dark:bg-green-900/20 rounded border border-green-300 dark:border-green-700' : 'bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700'}`}>
                            Content Bottom
                            {formData.position==='content-bottom' && (
                              <div className="mt-2 rounded border border-green-300 dark:border-green-700 bg-white dark:bg-gray-900 p-2 text-[11px]" dangerouslySetInnerHTML={{ __html: formData.body || 'Preview content' }} />
                            )}
                          </div>
                        </div>
                        <div className={`p-2 text-xs border-t ${formData.position==='footer' ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
                          Footer
                          {formData.position==='footer' && (
                            <div className="mt-2 rounded border border-green-300 dark:border-green-700 bg-white dark:bg-gray-900 p-2 text-[11px]" dangerouslySetInnerHTML={{ __html: formData.body || 'Preview content' }} />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600 dark:text-gray-400">Selected Page:</span>
                          <Badge variant="outline">{formData.targetPage || 'Not selected'}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600 dark:text-gray-400">Selected Position:</span>
                          <Badge variant="outline">{formData.position || 'Not selected'}</Badge>
                        </div>
                        <div className="pt-2 flex items-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="default"
                            onClick={() => {
                              try {
                                const payload = {
                                  name: formData.name || 'Preview Widget',
                                  body: formData.body || '',
                                  code: formData.code || '',
                                  targetPage: formData.targetPage || 'home',
                                  position: formData.position || 'content-top',
                                  customCss: formData.customCss || '',
                                  maxWidth: formData.maxWidth || 'none',
                                  showOnMobile: formData.showOnMobile,
                                  showOnDesktop: formData.showOnDesktop,
                                  externalLink: formData.externalLink || ''
                                };
                                localStorage.setItem('widgetPreview', JSON.stringify(payload));
                                localStorage.setItem('widgetPreviewEnabled', 'true');
                                localStorage.setItem('widgetPreviewOnly', 'true');
                                const page = formData.targetPage || 'home';
                                window.open(`/${page}?preview=1&previewOnly=1`, '_blank');
                                // Optional toast
                                // @ts-ignore
                                toast?.({ title: 'Live Preview', description: 'Opened page with temporary widget preview.' });
                              } catch {}
                            }}
                          >
                            Open Live Preview
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              try {
                                localStorage.removeItem('widgetPreview');
                                localStorage.removeItem('widgetPreviewEnabled');
                                localStorage.removeItem('widgetPreviewOnly');
                                // @ts-ignore
                                toast?.({ title: 'Preview Cleared', description: 'Temporary preview removed.' });
                              } catch {}
                            }}
                          >
                            Clear Preview
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500">Highlighted areas show where this widget will render for the selected page and position.</p>
                      </div>
                    </CardContent>
                  </Card>
                  {/* Live Page Preview (selected widget only) */}
  <div className="mt-4 w-full col-span-1 md:col-span-2">
    <Card>
      <CardHeader>
        <CardTitle>Live Page Preview</CardTitle>
        <CardDescription>Shows only this widget in the selected page and position.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex items-center gap-2 mb-3">
          <Button
            type="button"
            size="sm"
            onClick={() => {
              try {
                const payload = {
                  name: formData.name || 'Preview Widget',
                  body: formData.body || '',
                  code: formData.code || '',
                  targetPage: formData.targetPage || 'home',
                  position: formData.position || 'content-top',
                  customCss: formData.customCss || '',
                  maxWidth: formData.maxWidth || 'none',
                  showOnMobile: formData.showOnMobile,
                  showOnDesktop: formData.showOnDesktop,
                  externalLink: formData.externalLink || ''
                };
                localStorage.setItem('widgetPreview', JSON.stringify(payload));
                localStorage.setItem('widgetPreviewEnabled', 'true');
                localStorage.setItem('widgetPreviewOnly', 'true');
                // @ts-ignore
                toast?.({ title: 'Live Preview Updated', description: 'Preview payload saved. Iframe refreshed.' });
                const iframe = document.getElementById('live-preview-iframe') as HTMLIFrameElement | null;
                if (iframe) {
                  const base = `/${payload.targetPage}?preview=1&previewOnly=1`;
                  const ts = Date.now();
                  iframe.src = `${base}&t=${ts}`;
                }
                const full = document.getElementById('live-preview-full-iframe') as HTMLIFrameElement | null;
                if (full) {
                  const base = `/${payload.targetPage}?preview=1&previewOnly=1`;
                  const ts = Date.now();
                  full.src = `${base}&t=${ts}`;
                }
              } catch {}
            }}
          >
            Update Live Preview
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              try {
                const payload = {
                  targetPage: formData.targetPage || 'home'
                };
                const base = `/${payload.targetPage}?preview=1&previewOnly=1`;
                const ts = Date.now();
                const url = `${base}&t=${ts}`;
                setShowPreviewFullscreen(true);
                const iframe = document.getElementById('live-preview-full-iframe') as HTMLIFrameElement | null;
                if (iframe) iframe.src = url;
              } catch {}
            }}
          >
            Open Fullscreen
          </Button>
        </div>
        <div className="border rounded overflow-auto overflow-x-hidden h-[100vh] bg-white dark:bg-gray-950">
          <iframe
            id="live-preview-iframe"
            title="Selected Page Live Preview"
            className="w-full h-full"
            src={`/${formData.targetPage || 'home'}?preview=1&previewOnly=1&t=${Date.now()}`}
          />
        </div>
      </CardContent>
    </Card>
  </div>
  {/* Fullscreen overlay for Live Preview */}
  <div id="live-preview-overlay" className={`${showPreviewFullscreen ? '' : 'hidden'} fixed inset-0 z-[100] bg-black/70`}>
    <div className="h-full w-full flex flex-col">
      <div className="p-3 flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => {
            setShowPreviewFullscreen(false);
          }}
        >
          Close
        </Button>
        <a
          className="text-xs underline text-white"
          href={`/${formData.targetPage || 'home'}?preview=1&previewOnly=1`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open in new tab
        </a>
      </div>
      <iframe
        id="live-preview-full-iframe"
        title="Fullscreen Live Preview"
        className="h-full w-full bg-white"
        src={`/${formData.targetPage || 'home'}?preview=1&previewOnly=1&t=${Date.now()}`}
      />
    </div>
  </div>
                </div>
              </div>

              {/* Display Options */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="showOnDesktop"
                    checked={formData.showOnDesktop}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, showOnDesktop: checked }))}
                  />
                  <Label htmlFor="showOnDesktop" className="flex items-center gap-1">
                    <Monitor className="w-4 h-4" />
                    Desktop
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="showOnMobile"
                    checked={formData.showOnMobile}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, showOnMobile: checked }))}
                  />
                  <Label htmlFor="showOnMobile" className="flex items-center gap-1">
                    <Smartphone className="w-4 h-4" />
                    Mobile
                  </Label>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={createWidgetMutation.isPending || updateWidgetMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editingWidget ? 'Update Widget' : 'Create Widget'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Widgets List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Existing Widgets ({widgetsData?.length || 0})</h3>
        {!widgetsData || widgetsData.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Code className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No widgets yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Create your first widget to add custom functionality to your pages.
              </p>
              <Button onClick={() => setIsAddingWidget(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Widget
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {widgetsData.map((widget) => (
              <Card key={widget.id} className={`${widget.isActive ? 'border-green-200 bg-green-50/50' : 'border-gray-200 bg-gray-50/50'} dark:bg-gray-800`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white">{widget.name}</h4>
                        <Badge variant={widget.isActive ? "default" : "secondary"}>
                          {widget.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline">
                          {pages.find(p => p.value === widget.targetPage)?.label || widget.targetPage}
                        </Badge>
                        <Badge variant="outline">
                          {positions.find(p => p.value === widget.position)?.label || widget.position}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <span className="flex items-center gap-1">
                          <Monitor className="w-4 h-4" />
                          {widget.showOnDesktop ? 'Desktop' : 'No Desktop'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Smartphone className="w-4 h-4" />
                          {widget.showOnMobile ? 'Mobile' : 'No Mobile'}
                        </span>
                        {widget.description && (
                          <span className="truncate max-w-[240px]" title={widget.description}>Desc: {widget.description}</span>
                        )}
                        {widget.maxWidth && (
                          <span>Max Width: {widget.maxWidth}</span>
                        )}
                      </div>
                      <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-xs font-mono text-gray-700 dark:text-gray-300 max-h-20 overflow-hidden">
                        {widget.code.substring(0, 200)}{widget.code.length > 200 ? '...' : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleWidgetMutation.mutate(widget.id)}
                        disabled={toggleWidgetMutation.isPending}
                      >
                        {widget.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(widget)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this widget?')) {
                            deleteWidgetMutation.mutate(widget.id);
                          }
                        }}
                        disabled={deleteWidgetMutation.isPending}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}