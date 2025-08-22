#!/usr/bin/env python3

from app import ProductExtractor
import json

def test_extraction():
    extractor = ProductExtractor()
    
    # Test URLs
    test_urls = [
        "https://www.amazon.in/Apple-iPhone-15-128GB-Blue/dp/B0CHX1W1XY",
        "https://www.flipkart.com/apple-iphone-15-blue-128-gb/p/itm6ac6485515c75",
        "https://www.amazon.in/boAt-Airdopes-141-Wireless-Earbuds/dp/B08R6GLYCX"
    ]
    
    print("🧪 Testing Product Extractor...")
    print("=" * 50)
    
    for i, url in enumerate(test_urls, 1):
        print(f"\nTest {i}: {url}")
        print("-" * 30)
        
        try:
            result = extractor.extract_product_data(url)
            if result:
                print(f"✅ Name: {result['name'][:60]}...")
                print(f"💰 Current Price: {result['current_price']}")
                print(f"🏷️  Original Price: {result.get('original_price', 'N/A')}")
                print(f"🔥 Discount: {result.get('discount_percentage', 'N/A')}")
                print(f"🖼️  Image: {'Found' if result.get('image_url') else 'Not found'}")
                print(f"🛒 Source: {result['source']}")
            else:
                print("❌ Extraction failed")
        except Exception as e:
            print(f"❌ Error: {str(e)}")
    
    print("\n" + "=" * 50)
    print("Test completed!")

if __name__ == "__main__":
    test_extraction()