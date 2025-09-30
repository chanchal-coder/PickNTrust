# 🤖 N8N Integration Guide for PickNTrust

## 📋 Overview

This guide shows you how to integrate n8n.ai automation with your PickNTrust backend safely and effectively.

## 🚀 Quick Setup

### 1. Environment Configuration

**Copy the example environment file:**
```bash
cp .env.n8n.example .env.n8n
```

**Add n8n webhook URLs to your `.env` file:**
```bash
# Add these lines to your existing .env file
N8N_WEBHOOK_PRODUCT_CREATED=https://your-n8n-instance.app.n8n.cloud/webhook/product-created
N8N_WEBHOOK_NEWSLETTER_SIGNUP=https://your-n8n-instance.app.n8n.cloud/webhook/newsletter-signup
N8N_WEBHOOK_ORDER_PLACED=https://your-n8n-instance.app.n8n.cloud/webhook/order-placed
N8N_WEBHOOK_CUSTOM_EVENT=https://your-n8n-instance.app.n8n.cloud/webhook/custom-event
```

### 2. Available Webhook Endpoints

**Your PickNTrust backend now provides these n8n endpoints:**

#### Health Check
```
GET https://pickntrust.com/api/n8n/health
```

#### Incoming Webhooks (from n8n to PickNTrust)
```
POST https://pickntrust.com/api/n8n/webhooks/product-created
POST https://pickntrust.com/api/n8n/webhooks/newsletter-subscription
POST https://pickntrust.com/api/n8n/webhooks/custom/{workflowName}
POST https://pickntrust.com/api/n8n/webhooks/trigger-action
```

## 🔧 N8N Workflow Examples

### Example 1: Product Creation Notification

**In n8n.ai, create a workflow:**

1. **Webhook Trigger Node**
   - URL: `https://pickntrust.com/api/n8n/webhooks/product-created`
   - Method: POST

2. **Email Node** (Send notification)
   - To: admin@pickntrust.com
   - Subject: "New Product Added: {{$json.productName}}"
   - Body: "Product {{$json.productName}} in category {{$json.category}} has been added with price ${{$json.price}}"

3. **Slack/Discord Node** (Optional)
   - Send notification to your team channel

### Example 2: Newsletter Signup Automation

**In n8n.ai, create a workflow:**

1. **Webhook Trigger Node**
   - URL: `https://pickntrust.com/api/n8n/webhooks/newsletter-subscription`
   - Method: POST

2. **Mailchimp/ConvertKit Node**
   - Add subscriber to your email list
   - Email: `{{$json.email}}`
   - Source: `{{$json.source}}`

3. **Welcome Email Node**
   - Send personalized welcome email

### Example 3: Data Retrieval from PickNTrust

**In n8n.ai, create a workflow:**

1. **Schedule Trigger Node**
   - Run daily at 9 AM

2. **HTTP Request Node**
   - URL: `https://pickntrust.com/api/n8n/webhooks/trigger-action`
   - Method: POST
   - Body: `{"action": "get-products", "data": {}}`

3. **Google Sheets Node**
   - Update spreadsheet with product data

## 📡 Webhook Payloads

### Product Created Webhook
```json
{
  "productId": "123",
  "productName": "Amazing Product",
  "category": "Electronics",
  "price": 99.99
}
```

### Newsletter Subscription Webhook
```json
{
  "email": "user@example.com",
  "source": "homepage"
}
```

### Trigger Action Webhook
```json
{
  "action": "get-products",
  "data": {}
}
```

**Available Actions:**
- `get-products` - Retrieve all products
- `get-categories` - Retrieve all categories
- `get-newsletter-count` - Get newsletter subscriber count

## 🔒 Security Best Practices

### 1. Use HTTPS Only
- All webhook URLs use HTTPS
- Never use HTTP in production

### 2. Validate Webhook Sources
- Check request headers
- Implement webhook secrets (optional)

### 3. Rate Limiting
- N8N webhooks are automatically rate-limited
- Monitor logs for suspicious activity

## 🧪 Testing Your Integration

### 1. Test Health Endpoint
```bash
curl https://pickntrust.com/api/n8n/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "service": "pickntrust-n8n-integration",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0"
}
```

### 2. Test Product Webhook
```bash
curl -X POST https://pickntrust.com/api/n8n/webhooks/product-created \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "test-123",
    "productName": "Test Product",
    "category": "Test Category",
    "price": 29.99
  }'
```

### 3. Test Data Retrieval
```bash
curl -X POST https://pickntrust.com/api/n8n/webhooks/trigger-action \
  -H "Content-Type: application/json" \
  -d '{
    "action": "get-categories",
    "data": {}
  }'
```

## 🔄 Triggering Webhooks from Your App

**The integration includes helper functions to trigger n8n webhooks when events occur in your app:**

```typescript
// Example: Trigger webhook when product is created
const payload = createN8NPayload('product.created', {
  productId: newProduct.id,
  productName: newProduct.name,
  category: newProduct.category,
  price: newProduct.price
});

await triggerN8NWebhook(N8N_WEBHOOKS.PRODUCT_CREATED, payload);
```

## 📊 Monitoring and Logs

### Check PM2 Logs
```bash
pm2 logs pickntrust-backend | grep "N8N"
```

### Common Log Messages
- `N8N Webhook - Product Created:` - Product webhook received
- `N8N webhook triggered successfully:` - Outgoing webhook sent
- `N8N webhook URL not configured` - Environment variable missing

## 🚨 Troubleshooting

### Issue: Webhooks Not Working

**Check:**
1. Environment variables are set correctly
2. N8N workflow is active
3. Webhook URLs are correct
4. HTTPS is used (not HTTP)

**Debug:**
```bash
# Check if webhook endpoints are accessible
curl https://pickntrust.com/api/n8n/health

# Check PM2 logs
pm2 logs pickntrust-backend --lines 50
```

### Issue: N8N Not Receiving Data

**Check:**
1. N8N workflow webhook URL is correct
2. Workflow is activated in n8n.ai
3. Check n8n execution logs

## 🎯 Common Use Cases

### E-commerce Automation
- **Order notifications** → Slack/Email alerts
- **Inventory updates** → Google Sheets sync
- **Customer signup** → CRM integration

### Marketing Automation
- **Newsletter signup** → Email marketing platform
- **Product launch** → Social media posting
- **Sales reports** → Dashboard updates

### Operations Automation
- **Daily reports** → Email summaries
- **Data backup** → Cloud storage sync
- **Performance monitoring** → Alert systems

## 🔄 Deployment

**After adding n8n integration:**

1. **Update your .env file** with webhook URLs
2. **Rebuild and deploy:**
   ```bash
   npm run build
   pm2 restart pickntrust-backend
   ```
3. **Test the integration** using the examples above
4. **Create your n8n workflows** in n8n.ai
5. **Monitor logs** to ensure everything works

## 🎉 You're Ready!

**Your PickNTrust backend now supports n8n automation! You can:**
- ✅ Receive webhooks from n8n workflows
- ✅ Send data to n8n workflows
- ✅ Trigger actions based on events
- ✅ Monitor all webhook activity
- ✅ Scale your automation as needed

**Start creating powerful automations with n8n.ai and your PickNTrust platform!** 🚀