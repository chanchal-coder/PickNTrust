# 🏗️ Travel Content Management - Data Architecture

## 📋 Overview
This document explains the complete data flow from form submission to database storage to website display for the Travel Picks content management system.

## 🔄 Data Flow Architecture

### 1. **Form Submission** → **API Endpoint** → **Database** → **Website Display**

```
[Admin Form] → [POST /api/travel-content] → [SQLite Database] → [Travel Picks Page]
```

## 🗄️ Database Schema

### **Table: `travel_deals`**
```sql
CREATE TABLE travel_deals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price TEXT,
  originalPrice TEXT,
  currency TEXT DEFAULT 'INR',
  imageUrl TEXT,
  affiliateUrl TEXT,
  category TEXT NOT NULL, -- flights, hotels, tours, etc.
  sectionType TEXT NOT NULL, -- featured, standard, destinations
  
  -- Custom section overrides
  customSectionTitle TEXT,
  customSectionDescription TEXT,
  
  -- Styling
  textColor TEXT DEFAULT '#000000',
  
  -- Category-specific fields (JSON)
  categoryData TEXT, -- JSON string with category-specific fields
  
  -- Metadata
  createdBy TEXT DEFAULT 'admin',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  isActive BOOLEAN DEFAULT 1,
  displayOrder INTEGER DEFAULT 0
);
```

### **Table: `travel_sections`** (Optional - for custom sections)
```sql
CREATE TABLE travel_sections (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  sectionType TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  displayOrder INTEGER DEFAULT 0,
  isActive BOOLEAN DEFAULT 1,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🔌 API Endpoints

### **POST /api/travel-content**
**Purpose:** Save new travel content from admin form

**Request Body:**
```json
{
  "name": "Air India Express",
  "description": "Budget airline with great connectivity",
  "price": "3500",
  "originalPrice": "4500",
  "currency": "INR",
  "imageUrl": "https://example.com/image.jpg",
  "affiliateUrl": "https://booking-link.com",
  "category": "flights",
  "sectionType": "featured",
  "customSectionTitle": "Special Airline Offers",
  "customSectionDescription": "Limited time promotional fares",
  "textColor": "#1a365d",
  
  // Category-specific fields
  "airline": "Air India Express",
  "departure": "Mumbai",
  "arrival": "Delhi",
  "flightClass": "Economy",
  "stops": "Non-stop",
  "routeType": "domestic"
}
```

**Response:**
```json
{
  "success": true,
  "id": "flights-1704067200000",
  "message": "Travel content added successfully"
}
```

### **GET /api/travel-content/:category**
**Purpose:** Retrieve travel content for display

**Response:**
```json
{
  "success": true,
  "data": {
    "featured": [
      {
        "id": "flights-1704067200000",
        "name": "Air India Express",
        "description": "Budget airline with great connectivity",
        "price": "3500",
        "originalPrice": "4500",
        "currency": "INR",
        "imageUrl": "https://example.com/image.jpg",
        "affiliateUrl": "https://booking-link.com",
        "category": "flights",
        "sectionType": "featured",
        "customSectionTitle": "Special Airline Offers",
        "textColor": "#1a365d",
        "categoryData": {
          "airline": "Air India Express",
          "departure": "Mumbai",
          "arrival": "Delhi",
          "flightClass": "Economy",
          "stops": "Non-stop",
          "routeType": "domestic"
        },
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "standard": [...],
    "destinations": [...]
  }
}
```

## 🖥️ Frontend Integration

### **Data Fetching in Travel Picks Page**
```typescript
// In travel-picks.tsx
const { data: travelDeals } = useQuery({
  queryKey: ['travel-deals', selectedCategory],
  queryFn: () => fetch(`/api/travel-content/${selectedCategory}`).then(res => res.json())
});

// Replace sample data with real data
const categoryDeals = travelDeals?.data || [];
```

### **Dynamic Section Rendering**
```typescript
// Enhanced renderTravelSection function
const renderTravelSection = (section: TravelSection) => {
  const sectionDeals = categorizedDeals[section.type] || [];
  
  // Check for custom section titles from database
  const customSection = sectionDeals.find(deal => deal.customSectionTitle);
  const sectionTitle = customSection?.customSectionTitle || section.title;
  const sectionDescription = customSection?.customSectionDescription || section.description;
  
  return (
    <div key={section.id} className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${section.color} flex items-center justify-center text-white mr-4`}>
            <i className={section.icon} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{sectionTitle}</h3>
            <p className="text-gray-600 dark:text-gray-400">{sectionDescription}</p>
          </div>
        </div>
      </div>
      {/* Render cards */}
    </div>
  );
};
```

## 🔄 Complete Data Flow Example

### **Step 1: Admin Fills Form**
```
Admin clicks + button → Form opens → Fills flight details:
- Name: "IndiGo 6E-123"
- Category: "flights"
- Section: "featured"
- Custom Section Title: "Flash Sale Flights"
- Airline: "IndiGo"
- Route: "Mumbai → Bangalore"
```

### **Step 2: Form Submission**
```javascript
const handleFormSubmit = async (formData) => {
  const response = await fetch('/api/travel-content', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...formData,
      id: `${formData.category}-${Date.now()}`,
      categoryData: JSON.stringify({
        airline: formData.airline,
        departure: formData.departure,
        arrival: formData.arrival,
        // ... other category fields
      })
    })
  });
  
  if (response.ok) {
    // Refresh page data
    queryClient.invalidateQueries(['travel-deals']);
    toast.success('Content added successfully!');
  }
};
```

### **Step 3: Database Storage**
```sql
INSERT INTO travel_deals (
  id, name, category, sectionType, customSectionTitle,
  airline, departure, arrival, categoryData, createdAt
) VALUES (
  'flights-1704067200000',
  'IndiGo 6E-123',
  'flights',
  'featured',
  'Flash Sale Flights',
  'IndiGo',
  'Mumbai',
  'Bangalore',
  '{"airline":"IndiGo","departure":"Mumbai","arrival":"Bangalore"}',
  '2024-01-01 12:00:00'
);
```

### **Step 4: Website Display**
```
User visits /travel-picks?category=flights
↓
Page fetches: GET /api/travel-content/flights
↓
Database returns all flight deals grouped by section
↓
Page renders:
- Section Title: "Flash Sale Flights" (custom)
- Card: "IndiGo 6E-123" with all details
- Positioned in "featured" section
```

## 🛠️ Backend Implementation

### **Server Route Handler**
```typescript
// In server/routes.ts
app.post('/api/travel-content', async (req, res) => {
  try {
    const {
      name, description, price, originalPrice, currency,
      imageUrl, affiliateUrl, category, sectionType,
      customSectionTitle, customSectionDescription,
      textColor, ...categoryFields
    } = req.body;
    
    const id = `${category}-${Date.now()}`;
    
    // Store category-specific fields as JSON
    const categoryData = JSON.stringify(categoryFields);
    
    await db.run(`
      INSERT INTO travel_deals (
        id, name, description, price, originalPrice, currency,
        imageUrl, affiliateUrl, category, sectionType,
        customSectionTitle, customSectionDescription,
        textColor, categoryData, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, name, description, price, originalPrice, currency,
      imageUrl, affiliateUrl, category, sectionType,
      customSectionTitle, customSectionDescription,
      textColor, categoryData, new Date().toISOString()
    ]);
    
    res.json({ success: true, id, message: 'Content added successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/travel-content/:category', async (req, res) => {
  try {
    const { category } = req.params;
    
    const deals = await db.all(`
      SELECT * FROM travel_deals 
      WHERE category = ? AND isActive = 1 
      ORDER BY displayOrder ASC, createdAt DESC
    `, [category]);
    
    // Group by section type and parse category data
    const groupedDeals = {
      featured: [],
      standard: [],
      destinations: []
    };
    
    deals.forEach(deal => {
      const parsedDeal = {
        ...deal,
        categoryData: JSON.parse(deal.categoryData || '{}')
      };
      groupedDeals[deal.sectionType].push(parsedDeal);
    });
    
    res.json({ success: true, data: groupedDeals });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

## 📱 Real-time Updates

### **WebSocket Integration (Optional)**
```typescript
// Real-time updates when admin adds content
const socket = io();

socket.on('travel-content-added', (data) => {
  // Refresh the specific category
  queryClient.invalidateQueries(['travel-deals', data.category]);
  toast.info(`New ${data.category} content added!`);
});
```

## 🔒 Security & Validation

### **Input Validation**
```typescript
// Validation schema
const travelContentSchema = {
  name: { required: true, minLength: 2, maxLength: 100 },
  category: { required: true, enum: ['flights', 'hotels', 'tours', 'cruises', 'bus', 'train'] },
  sectionType: { required: true, enum: ['featured', 'standard', 'destinations'] },
  price: { pattern: /^\d+(\.\d{1,2})?$/ },
  imageUrl: { pattern: /^https?:\/\/.+/ },
  affiliateUrl: { pattern: /^https?:\/\/.+/ }
};
```

### **Admin Authentication**
```typescript
// Middleware to check admin status
const requireAdmin = (req, res, next) => {
  const adminSession = req.headers['admin-session'];
  if (adminSession !== 'active') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

app.post('/api/travel-content', requireAdmin, handleTravelContent);
```

## 📊 Data Management Features

### **Bulk Operations**
- Import/Export CSV
- Bulk delete
- Bulk status updates
- Category migration

### **Content Versioning**
- Track changes
- Rollback capability
- Audit logs

### **Performance Optimization**
- Database indexing
- Caching layer
- Image optimization
- Lazy loading

## 🎯 Summary

**Data Flow:** Form → API → Database → Website Display

**Storage:** SQLite database with flexible JSON fields for category-specific data

**Display:** Dynamic section rendering with custom titles and real-time updates

**Features:** Custom section names, category-specific fields, styling options, admin controls

This architecture ensures scalable, flexible content management while maintaining data integrity and performance.