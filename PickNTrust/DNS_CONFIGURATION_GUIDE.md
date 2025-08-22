# 🌐 DNS Configuration Guide for pickntrust.com

## IMPORTANT: Remove Old CNAME Records First

If you previously added CNAME records, you MUST delete them first because:
- **A records and CNAME records cannot coexist for the same domain**
- CNAME records don't work for root domains (pickntrust.com)

## Step-by-Step DNS Configuration

### Step 1: Remove Old Records
1. Go to your domain registrar (GoDaddy, Namecheap, etc.)
2. Find DNS management section
3. **DELETE** any existing CNAME records for:
   - `pickntrust` 
   - `www`
   - `@` (root domain)

### Step 2: Add A Records
Add these **A Records** (not CNAME):

**Record 1: Root Domain**
- **Type**: `A Record`
- **Host/Name**: `@` (or leave blank for root domain)
- **Value/Points to**: `51.20.43.157`
- **TTL**: `300` (or default)

**Record 2: WWW Subdomain**
- **Type**: `A Record`
- **Host/Name**: `www`
- **Value/Points to**: `51.20.43.157`
- **TTL**: `300` (or default)

## Common Domain Registrar Instructions

### GoDaddy:
- **Host**: `@` (for pickntrust.com)
- **Host**: `www` (for www.pickntrust.com)
- **Points to**: `51.20.43.157`

### Namecheap:
- **Host**: `@` (for pickntrust.com)
- **Host**: `www` (for www.pickntrust.com)
- **Value**: `51.20.43.157`

### Cloudflare:
- **Name**: `pickntrust.com` (for root)
- **Name**: `www` (for www subdomain)
- **IPv4 address**: `51.20.43.157`

## What NOT to Use

❌ **Don't use CNAME records** - they don't work for root domains
❌ **Don't use** `pickntrust` as host - use `@` for root domain
❌ **Don't mix** A records and CNAME records for the same domain

## After DNS Configuration

### Step 3: Wait for Propagation
- **Time**: 5-60 minutes (sometimes up to 24 hours)
- **Check propagation**: https://dnschecker.org

### Step 4: Test Your Domain
After propagation:
- ✅ Test: `http://pickntrust.com`
- ✅ Test: `http://www.pickntrust.com`
- ✅ Test: `http://51.20.43.157` (should still work)

## Troubleshooting

### If Domain Still Doesn't Work:
1. **Clear browser cache**: Ctrl+F5 or incognito mode
2. **Check DNS propagation**: Use dnschecker.org
3. **Verify A records**: Use `nslookup pickntrust.com`
4. **Wait longer**: DNS can take up to 24 hours

### Common Mistakes:
- Using CNAME instead of A record
- Not deleting old CNAME records
- Using wrong host name (`pickntrust` instead of `@`)
- Not waiting for DNS propagation

## Summary
1. **Delete** old CNAME records
2. **Add A record**: `@` → `51.20.43.157`
3. **Add A record**: `www` → `51.20.43.157`
4. **Wait** for DNS propagation
5. **Test** both pickntrust.com and www.pickntrust.com

Remember: **A records point directly to IP addresses**, which is what you need for your EC2 server!
