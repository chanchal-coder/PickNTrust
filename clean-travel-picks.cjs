const fs = require('fs');
const path = require('path');

console.log('🧹 Cleaning travel-picks.tsx - removing all demo data...');

const filePath = path.join(__dirname, 'client', 'src', 'pages', 'travel-picks.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Find the start of demo data (after demoTravelDeals array declaration)
const demoStartPattern = /const demoTravelDeals: TravelDeal\[\] = \[\];[\s\S]*?(?=\/\/ Fetch real travel products from API)/;

// Find the corrupted getSmartFilterOptions function
const corruptedFilterPattern = /\/\/ Generate smart filter options based on available data\s*const getSmartFilterOptions = useMemo\(\(\) => \{[\s\S]*?(?=if \(currentCategoryConfig\.hasFilter && routeFilter !== 'all'\))/;

// Clean up the demo data
content = content.replace(demoStartPattern, 'const demoTravelDeals: TravelDeal[] = [];\n\n  ');

// Fix the getSmartFilterOptions function
const correctFilterFunction = `// Generate smart filter options based on available data
   const getSmartFilterOptions = useMemo(() => {
     if (!currentCategoryConfig.hasFilter) return [];
     
     const allDeals = Object.values(categorizedDeals).flat();
     const availableFilters = new Set(['all']); // Always include 'all'
     
     // If there are deals but no specific filter matches found, show basic filters
     const hasDeals = allDeals.length > 0;
     
     allDeals.forEach((deal: TravelDeal) => {
       // Add route type filters for flights, bus, train, packages
       if (['flights', 'bus', 'train', 'packages'].includes(selectedCategory)) {
         if (deal.routeType) {
           availableFilters.add(deal.routeType);
         }
       }
       
       // Add hotel-specific filters
       if (selectedCategory === 'hotels') {
         if (deal.hotelType) {
           const type = deal.hotelType.toLowerCase();
           if (['luxury', 'budget'].includes(type)) {
             availableFilters.add(type);
           }
         }
         // Add star rating filters
         if (deal.rating) {
           const rating = parseFloat(deal.rating);
           if (rating >= 3 && rating < 4) availableFilters.add('3-star');
           else if (rating >= 4 && rating < 5) availableFilters.add('4-star');
           else if (rating >= 5) availableFilters.add('5-star');
         }
       }
       
       // Add tour-specific filters
       if (selectedCategory === 'tours') {
         if (deal.tourType) {
           availableFilters.add(deal.tourType.toLowerCase());
         }
       }
       
       // Add cruise-specific filters
       if (selectedCategory === 'cruises') {
         if (deal.cruiseType) {
           availableFilters.add(deal.cruiseType.toLowerCase());
         }
       }
       
       // Add bus-specific filters
       if (selectedCategory === 'bus') {
         if (deal.busType) {
           const type = deal.busType.toLowerCase();
           if (type.includes('ac')) availableFilters.add('ac');
           if (type.includes('non-ac')) availableFilters.add('non-ac');
           if (type.includes('sleeper')) availableFilters.add('sleeper');
           if (type.includes('seater')) availableFilters.add('seater');
         }
       }
       
       // Add train-specific filters
       if (selectedCategory === 'train') {
         if (deal.trainClass) {
           const trainClass = deal.trainClass.toLowerCase();
           if (trainClass.includes('ac')) availableFilters.add('ac');
           if (trainClass.includes('sleeper')) availableFilters.add('sleeper');
           if (trainClass.includes('3ac')) availableFilters.add('3ac');
           if (trainClass.includes('2ac')) availableFilters.add('2ac');
           if (trainClass.includes('1ac')) availableFilters.add('1ac');
         }
       }
       
       // Add car rental filters
       if (selectedCategory === 'car-rental') {
         if (deal.carType) {
           availableFilters.add(deal.carType.toLowerCase());
         }
       }
     });
     
     // If no specific filters found but we have deals, show predefined options
     if (availableFilters.size === 1 && hasDeals) {
       const predefinedOptions = currentCategoryConfig.filterOptions || [];
       predefinedOptions.forEach(option => availableFilters.add(option));
     }
     
     return Array.from(availableFilters);
   }, [categorizedDeals, selectedCategory, currentCategoryConfig]);

   // Apply route filter to categorized deals
   `;

content = content.replace(corruptedFilterPattern, correctFilterFunction);

// Write the cleaned content back
fs.writeFileSync(filePath, content);

console.log('✅ Successfully cleaned travel-picks.tsx');
console.log('🗑️  Removed all demo data');
console.log('🔧 Fixed getSmartFilterOptions function');
console.log('💾 File saved successfully');