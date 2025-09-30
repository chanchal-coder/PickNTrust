const fetch = require("node-fetch");

async function testBrowseCategoriesAPI() {
  try {
    console.log("Testing browse categories API...");
    
    const response = await fetch("http://localhost:5000/api/categories/browse");
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log("API Response Status:", response.status);
    console.log("Number of categories returned:", data.length);
    console.log("\nCategory details:");
    
    data.forEach((category, index) => {
      console.log(`\n${index + 1}. Category ID: ${category.id}`);
      console.log(`   Name: "${category.name}"`);
      console.log(`   Description: "${category.description || "N/A"}"`);
      console.log(`   Icon: "${category.icon || "N/A"}"`);
      console.log(`   Color: "${category.color || "N/A"}"`);
      console.log(`   Total Products: ${category.total_products_count || 0}`);
      console.log(`   Category Type: "${category.category_type || "N/A"}"`);
    });
    
  } catch (error) {
    console.error("Error testing API:", error.message);
  }
}

testBrowseCategoriesAPI();