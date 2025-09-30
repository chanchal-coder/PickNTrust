# 🔐 Canva API Credentials Setup Guide

## 🚨 Important Security Notice

The Canva API credentials have been removed from the codebase to comply with GitHub Push Protection and security best practices. You need to manually add your real credentials to the `.env` file.

## 📝 Setup Instructions

### Step 1: Add Credentials to .env File

1. Open your `.env` file in the root directory
2. Add these lines with your actual Canva API credentials:

```bash
# Canva API Credentials
CANVA_CLIENT_ID=your_actual_client_id_here
CANVA_CLIENT_SECRET=your_actual_client_secret_here
```

**Note**: Replace the placeholder values with your actual Canva API credentials provided separately.

### Step 2: Verify .env File is in .gitignore

Make sure your `.env` file is listed in `.gitignore` to prevent accidentally committing secrets:

```gitignore
.env
.env.local
.env.production
```

### Step 3: Restart Your Server

After adding the credentials, restart your server:

```bash
npm run dev
# or
pm2 restart all
```

### Step 4: Test the Integration

Run the test script to verify everything is working:

```bash
node test-canva-api-integration.cjs
```

## 🎯 How to Use Canva Integration

1. Navigate to **Admin Panel → Automation Management**
2. Scroll to **"🎨 Social Media Automation with Canva"** section
3. Follow the simple 4-step process:
   - **Step 1**: Turn on automation (toggle switch)
   - **Step 2**: Choose social platforms (Instagram, Facebook, Twitter, LinkedIn)
   - **Step 3**: Configure content options (auto-captions, auto-hashtags)
   - **Step 4**: Test automation or create content manually

## 🔧 API Credentials Details

- **Client ID**: Provided separately for security
- **Client Secret**: Provided separately for security
- **OAuth Flow**: Client Credentials (server-to-server)
- **Scopes**: `design:read design:write folder:read folder:write`

## ✅ Security Best Practices

- ✅ Credentials stored in environment variables only
- ✅ No hardcoded secrets in source code
- ✅ .env file excluded from version control
- ✅ GitHub Push Protection compliance
- ✅ Secure OAuth implementation

## 🆘 Troubleshooting

If you encounter issues:

1. **Check .env file**: Ensure credentials are correctly formatted
2. **Restart server**: Environment variables need server restart to load
3. **Check logs**: Look for authentication errors in server logs
4. **Test connection**: Use the test script to verify API connectivity

## 📞 Support

For technical support:
- Review the complete documentation in `CANVA_API_INTEGRATION_COMPLETE.md`
- Check the API implementation in `server/canva-service.ts`
- Run tests using `node test-canva-api-integration.cjs`

---

**Security Status**: ✅ Compliant with GitHub Push Protection  
**Integration Status**: ✅ Ready for Production Use  
**Last Updated**: December 2024
