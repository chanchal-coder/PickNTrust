# PickNTrust Development Guide

## 🚀 Quick Start

### Option 1: Integrated Development (Recommended)
```bash
# Use the PowerShell script for automated setup
.\start-dev.ps1

# Or manually:
npm run dev
```
- Backend: `http://localhost:5000`
- Frontend: Integrated with backend
- API: `http://localhost:5000/api/*`

### Option 2: Separate Frontend/Backend
```bash
# Use the PowerShell script
.\start-dev-separate.ps1

# Or manually:
npm run dev:backend    # Backend on port 5000
npm run dev:frontend   # Frontend on port 5173
```
- Backend: `http://localhost:5000`
- Frontend: `http://localhost:5173`
- API: `http://localhost:5000/api/*`

## 📁 Project Structure

```
PickNTrust/
├── client/                 # React frontend
│   ├── src/
│   ├── public/
│   └── package.json
├── server/                 # Express backend
│   ├── index.ts           # Main server file
│   ├── vite.ts            # Vite development setup
│   └── routes/
├── shared/                # Shared types and utilities
├── start-dev.ps1         # Integrated development script
├── start-dev-separate.ps1 # Separate servers script
└── package.json          # Root package.json
```

## 🔧 Development Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start backend with integrated frontend |
| `npm run dev:backend` | Start only backend server |
| `npm run dev:frontend` | Start only frontend server |
| `npm run dev:separate` | Start both servers separately |
| `npm run build` | Build for production |
| `npm start` | Start production server |

## 🌍 Environment Configuration

### Development Mode
- `NODE_ENV=development` (default)
- Vite development server integrated
- Hot module replacement enabled
- Source maps enabled
- Detailed error logging

### Production Mode
- `NODE_ENV=production`
- Static file serving
- Optimized builds
- Error logging to files

## 🔍 Health Monitoring

### Health Check Endpoints
- `GET /health` - Basic health status
- `GET /api/status` - Detailed API status with uptime and memory usage

### Example Health Check Response
```json
{
  "status": "healthy",
  "timestamp": "2024-01-20T10:30:00.000Z",
  "environment": "development",
  "services": {
    "database": "connected",
    "masterBot": "active"
  }
}
```

## 🐛 Troubleshooting

### Common Issues and Solutions

#### 1. Port Already in Use
**Error**: `EADDRINUSE: address already in use :::5000`
**Solution**:
```bash
# Kill processes on port 5000
Get-NetTCPConnection -LocalPort 5000 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }

# Or use the startup scripts which handle this automatically
.\start-dev.ps1
```

#### 2. Frontend Not Loading
**Error**: `net::ERR_CONNECTION_REFUSED` on port 5173
**Solution**:
- Check if using integrated mode (port 5000) or separate mode (port 5173)
- For integrated: Use `http://localhost:5000`
- For separate: Ensure both servers are running

#### 3. Module Not Found Errors
**Error**: `Cannot find module '@/components/...'`
**Solution**:
```bash
# Reinstall dependencies
npm install
cd client && npm install
```

#### 4. Vite Build Errors
**Error**: Various Vite configuration issues
**Solution**:
- Check `vite.config.ts` for correct paths
- Ensure `client/` directory structure is correct
- Clear Vite cache: `rm -rf client/.vite`

#### 5. Database Connection Issues
**Error**: Database connection failures
**Solution**:
- Check `.env` file exists and has correct values
- Verify database server is running
- Check health endpoint: `http://localhost:5000/health`

## 🔒 Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173

# Database Configuration
DATABASE_URL=your_database_url

# API Keys
FLIPKART_AFFILIATE_ID=your_affiliate_id
FLIPKART_AFFILIATE_TOKEN=your_affiliate_token

# Other Configuration
LOG_LEVEL=debug
```

## 🚦 Development Workflow

1. **Start Development**:
   ```bash
   .\start-dev.ps1
   ```

2. **Make Changes**:
   - Frontend changes: Edit files in `client/src/`
   - Backend changes: Edit files in `server/`
   - Shared types: Edit files in `shared/`

3. **Test Changes**:
   - Check health: `http://localhost:5000/health`
   - Test API: `http://localhost:5000/api/status`
   - View app: `http://localhost:5000`

4. **Debug Issues**:
   - Check terminal output for errors
   - Use health endpoints for status
   - Check browser console for frontend errors

## 📦 Dependencies Management

### Root Dependencies
- Express server and backend utilities
- Development tools and scripts

### Client Dependencies
- React and frontend libraries
- Vite for development and building

### Adding New Dependencies

```bash
# Backend dependencies
npm install package-name

# Frontend dependencies
cd client && npm install package-name

# Development dependencies
npm install -D package-name
```

## 🏗️ Build and Deployment

### Development Build
```bash
npm run build:dev
```

### Production Build
```bash
npm run build
```

### Production Deployment
```bash
npm start
```

## 📝 Best Practices

1. **Always use the startup scripts** for consistent environment setup
2. **Check health endpoints** before reporting issues
3. **Keep dependencies updated** regularly
4. **Use environment variables** for configuration
5. **Test both integrated and separate modes** when making changes
6. **Monitor terminal output** for warnings and errors

## 🆘 Getting Help

If you encounter issues not covered here:

1. Check the terminal output for specific error messages
2. Test the health endpoints to verify service status
3. Try restarting with the startup scripts
4. Check if ports are available and not blocked
5. Verify all dependencies are installed correctly

## 🔄 Maintenance

### Regular Tasks
- Update dependencies monthly
- Clear build caches if experiencing issues
- Monitor health endpoints in production
- Review and update environment variables

### Performance Monitoring
- Use `/api/status` endpoint for uptime and memory usage
- Monitor build times and bundle sizes
- Check for memory leaks in long-running processes