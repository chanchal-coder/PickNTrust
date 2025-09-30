# PickNTrust Deployment Guide

## 🚀 Production Build & Deployment

This guide ensures your PickNTrust application works exactly the same in production as it does locally.

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- All dependencies installed (`npm install`)

### Build Process

#### Option 1: Production Build Script (Recommended)
```bash
npm run build:production
```

This script:
- Cleans previous builds
- Builds client to `dist/public/`
- Builds server to `dist/server/`
- Verifies all build outputs
- Creates build info file

#### Option 2: Manual Build
```bash
# Clean previous builds
rm -rf dist/

# Build client
npm run build:client

# Build server  
npm run build:server
```

### File Structure After Build

```
dist/
├── public/                 # Client build output
│   ├── index.html         # Main HTML file
│   ├── assets/            # JS, CSS, and other assets
│   └── ...
├── server/                # Server build output
│   ├── server/            # Compiled server files
│   │   ├── index.js       # Main server entry point
│   │   ├── vite.js        # Vite configuration
│   │   └── ...
│   └── shared/            # Shared utilities
└── build-info.json       # Build metadata
```

### Starting the Application

```bash
npm start
```

This runs: `node dist/server/server/index.js`

### Environment Configuration

1. **Database**: Ensure SQLite database is properly initialized
2. **Environment Variables**: Set up `.env` file with required credentials
3. **Port**: Default is 5000, configurable via `PORT` environment variable

### Path Resolution

The application uses the following path structure:
- **Client files**: `dist/public/index.html`
- **Server files**: `dist/server/server/index.js`
- **Static assets**: Served from `dist/public/assets/`

### Troubleshooting

#### Common Issues

1. **ENOENT: no such file or directory**
   - Ensure complete build process completed
   - Verify `dist/public/index.html` exists
   - Check server path configuration in `server/vite.ts`

2. **Missing Database Tables**
   - Run database initialization scripts
   - Check `create-rss-feeds-table.cjs` and similar scripts

3. **Build Failures**
   - Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
   - Clear build cache: `rm -rf dist/`
   - Run production build script

#### Verification Steps

1. **Check Build Output**:
   ```bash
   ls -la dist/public/     # Should contain index.html and assets/
   ls -la dist/server/     # Should contain server/ and shared/
   ```

2. **Test Application**:
   ```bash
   npm start
   # Visit http://localhost:5000
   ```

3. **Check Logs**: Monitor console for any errors during startup

### Production Deployment

#### Local Production Test
```bash
npm run build:production
npm start
```

#### Server Deployment
1. Upload entire project to server
2. Install dependencies: `npm install --production`
3. Run production build: `npm run build:production`
4. Start application: `npm start`
5. Configure reverse proxy (nginx/apache) if needed

#### Docker Deployment (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
RUN npm run build:production
EXPOSE 5000
CMD ["npm", "start"]
```

### Monitoring

- Health check: `http://localhost:5000/health`
- API status: `http://localhost:5000/api/status`
- Application logs: Check console output

### Security Notes

- Move hardcoded credentials to environment variables
- Use HTTPS in production
- Configure proper CORS settings
- Set up proper authentication

---

## 🔧 Development vs Production

| Aspect | Development | Production |
|--------|-------------|------------|
| Build | `npm run dev` | `npm run build:production` |
| Server | TypeScript with tsx | Compiled JavaScript |
| Client | Vite dev server | Static files in dist/public |
| Hot Reload | ✅ Enabled | ❌ Disabled |
| Source Maps | ✅ Enabled | ⚠️ Optional |

This guide ensures your application works consistently across all environments!