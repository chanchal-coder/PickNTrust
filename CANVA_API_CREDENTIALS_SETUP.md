# 🎨 Canva API Credentials Setup Guide

## Where to Add Canva API Credentials

### 1. **Environment Variables (.env file)**

Add these variables to your `.env` file in the root directory:

```bash
# Canva API Credentials
CANVA_CLIENT_ID=your_canva_client_id_here
CANVA_CLIENT_SECRET=your_canva_client_secret_here
DEFAULT_CANVA_TEMPLATE_ID=your_default_template_id_here

# Optional: Default social media image (fallback when Canva fails)
DEFAULT_SOCIAL_IMAGE=https://your-domain.com/default-social-image.png
```

### 2. **How to Get Canva API Credentials**

#### Step 1: Create Canva Developer Account
1. Go to [Canva Developers](https://www.canva.com/developers/)
2. Sign up or log in with your Canva account
3. Click "Create an App"

#### Step 2: Configure Your App
1. **App Name**: PickNTrust Automation
2. **App Type**: Choose "Server-side app"
3. **Scopes**: Select these permissions:
   - `design:read` - Read designs
   - `design:write` - Create and modify designs
   - `folder:read` - Read folders
   - `folder:write` - Create folders

#### Step 3: Get Your Credentials
1. After creating the app, you'll see:
   - **Client ID** → Copy to `CANVA_CLIENT_ID`
   - **Client Secret** → Copy to `CANVA_CLIENT_SECRET`

#### Step 4: Create a Default Template
1. In Canva, create a social media post template
2. Make it public or shareable
3. Get the template ID from the URL
4. Add it to `DEFAULT_CANVA_TEMPLATE_ID`

### 3. **File Locations**

The credentials are used in these files:
- **`server/canva-service.ts`** - Main Canva integration
- **`server/routes.ts`** - Automation triggers

### 4. **Testing Your Setup**

After adding credentials, test with:
```bash
node test-automation-with-fallback.cjs
```

Check logs for:
```
✅ Canva design created: [design_id]
```

Instead of:
```
⚠️ Canva design failed, using fallback approach
```

### 5. **Production Deployment**

For production, add these environment variables to your server:

```bash
# On your EC2 instance
echo "CANVA_CLIENT_ID=your_client_id" >> .env
echo "CANVA_CLIENT_SECRET=your_client_secret" >> .env
echo "DEFAULT_CANVA_TEMPLATE_ID=your_template_id" >> .env

# Restart PM2
pm2 restart all
```

### 6. **Security Notes**

- ✅ **DO**: Keep credentials in `.env` file
- ✅ **DO**: Add `.env` to `.gitignore`
- ❌ **DON'T**: Commit credentials to Git
- ❌ **DON'T**: Share credentials publicly

### 7. **Fallback Behavior**

Even without valid Canva credentials, your automation will still work:
- ✅ Content gets saved to database
- ✅ Social media posts are created using original images
- ✅ Captions and hashtags are generated
- ⚠️ Just no custom Canva designs

This ensures your system is always functional!

---

## 🔧 Quick Setup Commands

```bash
# 1. Edit your .env file
nano .env

# 2. Add the Canva credentials (replace with your actual values)
echo "CANVA_CLIENT_ID=your_canva_client_id_here" >> .env
echo "CANVA_CLIENT_SECRET=your_canva_client_secret_here" >> .env
echo "DEFAULT_CANVA_TEMPLATE_ID=your_default_template_id_here" >> .env

# 3. Restart your server
pm2 restart all

# 4. Test the automation
node test-automation-with-fallback.cjs
```

Once you add valid Canva credentials, your automation will create beautiful custom designs for every post! 🎨
