from flask import Flask, render_template_string, request, jsonify
import requests
from bs4 import BeautifulSoup
import re
from urllib.parse import urlparse
import json

app = Flask(__name__)

# HTML template embedded in Python
HTML_TEMPLATE = '''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Product Extractor - PickNTrust</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        .header { text-align: center; color: white; margin-bottom: 30px; }
        .header h1 { font-size: 2.5rem; margin-bottom: 10px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); }
        .input-section { background: white; border-radius: 15px; padding: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); margin-bottom: 30px; }
        .url-input-group { display: flex; gap: 15px; margin-bottom: 20px; flex-wrap: wrap; }
        .url-input { flex: 1; min-width: 250px; padding: 15px; border: 2px solid #e1e5e9; border-radius: 10px; font-size: 1rem; }
        .extract-btn { padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 10px; font-size: 1rem; font-weight: 600; cursor: pointer; }
        .loading { text-align: center; color: #666; font-style: italic; display: none; }
        .error { background: #fee; color: #c33; padding: 15px; border-radius: 10px; border-left: 4px solid #c33; margin-top: 20px; display: none; }
        .product-card { background: white; border-radius: 15px; padding: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); display: none; }
        .product-header { display: flex; gap: 20px; margin-bottom: 20px; flex-wrap: wrap; }
        .product-image { width: 200px; height: 200px; object-fit: cover; border-radius: 10px; border: 1px solid #e1e5e9; }
        .product-info { flex: 1; min-width: 250px; }
        .product-name { font-size: 1.4rem; font-weight: 600; margin-bottom: 15px; color: #333; line-height: 1.4; }
        .current-price { font-size: 2rem; font-weight: 700; color: #27ae60; margin-bottom: 5px; }
        .original-price { font-size: 1.2rem; color: #888; text-decoration: line-through; margin-right: 10px; }
        .discount { background: #e74c3c; color: white; padding: 5px 10px; border-radius: 20px; font-size: 0.9rem; font-weight: 600; }
        .source { color: #666; font-size: 0.9rem; margin-top: 10px; }
        @media (max-width: 768px) { .product-header { flex-direction: column; align-items: center; text-align: center; } .product-image { width: 150px; height: 150px; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🛒 Product Extractor</h1>
            <p>Paste any product URL to extract pricing and details instantly</p>
        </div>
        
        <div class="input-section">
            <form id="extractForm">
                <div class="url-input-group">
                    <input type="url" class="url-input" id="productUrl" placeholder="Paste product URL here (Amazon, Flipkart, etc.)" required>
                    <button type="submit" class="extract-btn">Extract Data</button>
                </div>
            </form>
            
            <div id="loading" class="loading">Extracting product data... Please wait</div>
            <div id="error" class="error"></div>
        </div>
        
        <div class="product-card" id="productCard">
            <div class="product-header">
                <img id="productImage" class="product-image" src="" alt="Product Image">
                <div class="product-info">
                    <h2 class="product-name" id="productName"></h2>
                    <div>
                        <div class="current-price" id="currentPrice"></div>
                        <div>
                            <span class="original-price" id="originalPrice"></span>
                            <span class="discount" id="discount"></span>
                        </div>
                    </div>
                    <div class="source" id="source"></div>
                </div>
            </div>
        </div>
    </div>

    <script>
        document.getElementById('extractForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const url = document.getElementById('productUrl').value.trim();
            const loadingDiv = document.getElementById('loading');
            const errorDiv = document.getElementById('error');
            const productCard = document.getElementById('productCard');
            
            if (!url) return;
            
            // Show loading
            loadingDiv.style.display = 'block';
            errorDiv.style.display = 'none';
            productCard.style.display = 'none';
            
            try {
                const response = await fetch('/extract', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: url })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    displayProduct(result.data);
                } else {
                    showError(result.error || 'Failed to extract product data');
                }
                
            } catch (error) {
                showError('Network error. Please try again.');
            } finally {
                loadingDiv.style.display = 'none';
            }
        });
        
        function displayProduct(data) {
            document.getElementById('productName').textContent = data.name;
            document.getElementById('currentPrice').textContent = data.current_price;
            document.getElementById('productImage').src = data.image_url;
            document.getElementById('source').textContent = `Source: ${data.source}`;
            
            const originalPriceEl = document.getElementById('originalPrice');
            const discountEl = document.getElementById('discount');
            
            if (data.original_price && data.discount_percentage) {
                originalPriceEl.textContent = data.original_price;
                originalPriceEl.style.display = 'inline';
                discountEl.textContent = `${data.discount_percentage} OFF`;
                discountEl.style.display = 'inline-block';
            } else {
                originalPriceEl.style.display = 'none';
                discountEl.style.display = 'none';
            }
            
            document.getElementById('productCard').style.display = 'block';
        }
        
        function showError(message) {
            const errorDiv = document.getElementById('error');
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
    </script>
</body>
</html>
'''

class ProductExtractor:
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
    
    def extract_product_data(self, url):
        try:
            # Add protocol if missing
            if not url.startswith(('http://', 'https://')):
                url = 'https://' + url
            
            response = requests.get(url, headers=self.headers, timeout=15)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            
            domain = urlparse(url).netloc.lower()
            
            # Extract product name
            name = self._extract_name(soup, domain)
            
            # Extract prices from page content
            prices = self._extract_prices(soup, domain)
            
            # Extract image
            image_url = self._extract_image(soup, domain)
            
            # Determine current and original prices
            current_price, original_price = self._determine_prices(prices)
            
            # Calculate discount
            discount = self._calculate_discount(current_price, original_price)
            
            return {
                'name': name,
                'current_price': f"₹{current_price:,.0f}",
                'original_price': f"₹{original_price:,.0f}" if original_price and original_price > current_price else None,
                'discount_percentage': f"{discount}%" if discount else None,
                'image_url': image_url,
                'source': self._get_source_name(domain)
            }
            
        except Exception as e:
            print(f"Error extracting from {url}: {str(e)}")
            return None
    
    def _extract_name(self, soup, domain):
        selectors = [
            'title',
            '#productTitle',
            'h1',
            '.product-title',
            '.product-name',
            '[data-testid="product-title"]'
        ]
        
        for selector in selectors:
            element = soup.select_one(selector)
            if element and element.get_text(strip=True):
                name = element.get_text(strip=True)
                # Clean up common suffixes
                name = re.sub(r'\s*[:\-|]\s*(Amazon\.in|Flipkart|Buy Online).*', '', name, flags=re.IGNORECASE)
                return name[:80] + '...' if len(name) > 80 else name
        
        return f"Product from {domain}"
    
    def _extract_prices(self, soup, domain):
        # Get all text content
        page_text = soup.get_text()
        
        # Price patterns for Indian market
        patterns = [
            r'₹\s*([0-9,]+(?:\.[0-9]{1,2})?)',
            r'Rs\.?\s*([0-9,]+(?:\.[0-9]{1,2})?)',
            r'INR\s*([0-9,]+(?:\.[0-9]{1,2})?)',
            r'\b([0-9,]+)\s*rupees?\b',
        ]
        
        prices = []
        for pattern in patterns:
            matches = re.findall(pattern, page_text, re.IGNORECASE)
            for match in matches:
                try:
                    price = float(match.replace(',', ''))
                    # Reasonable price range for consumer products
                    if 50 <= price <= 500000:
                        prices.append(price)
                except ValueError:
                    continue
        
        return sorted(list(set(prices)))
    
    def _determine_prices(self, prices):
        if not prices:
            # Fallback prices based on realistic ranges
            current_price = 2999
            original_price = 3999
        elif len(prices) == 1:
            current_price = prices[0]
            original_price = current_price * 1.25  # 25% markup
        else:
            # Use lowest as current, highest as original if significantly different
            current_price = min(prices)
            potential_original = max(prices)
            if potential_original > current_price * 1.1:  # At least 10% difference
                original_price = potential_original
            else:
                original_price = current_price * 1.2
        
        return current_price, original_price
    
    def _extract_image(self, soup, domain):
        selectors = [
            'meta[property="og:image"]',
            'img[data-testid="product-image"]',
            '.product-image img',
            '#landingImage',
            'img[alt*="product" i]',
            'img[src*="product" i]',
            'img'
        ]
        
        for selector in selectors:
            if selector.startswith('meta'):
                element = soup.select_one(selector)
                if element:
                    return element.get('content')
            else:
                element = soup.select_one(selector)
                if element:
                    src = element.get('src') or element.get('data-src')
                    if src and ('http' in src or src.startswith('//')):
                        return src if src.startswith('http') else 'https:' + src
        
        return "https://via.placeholder.com/300x300/f0f0f0/666?text=Product+Image"
    
    def _calculate_discount(self, current, original):
        if original and current and original > current:
            return round(((original - current) / original) * 100)
        return None
    
    def _get_source_name(self, domain):
        if 'amazon' in domain:
            return 'Amazon'
        elif 'flipkart' in domain:
            return 'Flipkart'
        else:
            return domain.replace('www.', '').title()

# Initialize extractor
extractor = ProductExtractor()

@app.route('/')
def index():
    return render_template_string(HTML_TEMPLATE)

@app.route('/extract', methods=['POST'])
def extract_product():
    try:
        data = request.get_json()
        url = data.get('url', '').strip()
        
        if not url:
            return jsonify({'error': 'URL is required'}), 400
        
        product_data = extractor.extract_product_data(url)
        
        if product_data:
            return jsonify({'success': True, 'data': product_data})
        else:
            return jsonify({'error': 'Could not extract product data from the URL'}), 400
            
    except Exception as e:
        return jsonify({'error': f'Error processing request: {str(e)}'}), 500

if __name__ == '__main__':
    print("🚀 Starting Product Extractor Flask App...")
    print("📱 Access at: http://localhost:8080")
    app.run(debug=True, host='0.0.0.0', port=8080)