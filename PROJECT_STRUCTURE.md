# 📁 PickNTrust Project Structure

## 🏗️ Main Application Structure

```
PickNTrust/
├── 📦 Core Application Files
│   ├── package.json                 # Node.js dependencies and scripts
│   ├── package-lock.json           # Locked dependency versions
│   ├── tsconfig.json               # TypeScript configuration
│   ├── vite.config.ts              # Vite build configuration
│   ├── tailwind.config.ts          # Tailwind CSS configuration
│   ├── postcss.config.js           # PostCSS configuration
│   └── components.json             # UI components configuration
│
├── 🖥️ Server (Backend)
│   ├── server/
│   │   ├── index.ts                # Main server entry point
│   │   ├── routes.ts               # API routes and endpoints
│   │   ├── db.ts                   # Database connection and queries
│   │   ├── storage.ts              # Data storage layer
│   │   ├── seed.ts                 # Database seeding
│   │   ├── vite.ts                 # Vite development server integration
│   │   └── utils/                  # Server utilities
│   │
│   └── shared/
│       ├── schema.ts               # Shared data schemas
│       └── sqlite-schema.ts        # SQLite database schema
│
├── 🌐 Client (Frontend)
│   ├── client/
│   │   ├── index.html              # Main HTML template
│   │   ├── src/
│   │   │   ├── App.tsx             # Main React application
│   │   │   ├── main.tsx            # React entry point
│   │   │   ├── index.css           # Global styles
│   │   │   ├── routes.ts           # Frontend routing
│   │   │   ├── components/         # React components
│   │   │   ├── contexts/           # React contexts
│   │   │   ├── hooks/              # Custom React hooks
│   │   │   ├── lib/                # Utility libraries
│   │   │   └── pages/              # Page components
│   │   └── public/                 # Static assets
│   │
│   └── public/
│       ├── index.html              # Production HTML
│       └── assets/                 # Static assets
│
├── 🗄️ Database
│   ├── migrations/                 # Database migration files
│   │   ├── 0000_burly_zaladane.sql
│   │   ├── 0001_init.sql
│   │   └── meta/                   # Migration metadata
│   ├── sqlite.db                  # Local SQLite database
│   └── drizzle.config.ts          # Drizzle ORM configuration
│
├── 🚀 Deployment
│   ├── deploy/
│   │   ├── deploy.sh               # Main deployment script
│   │   ├── start.sh                # Start services script
│   │   ├── stop.sh                 # Stop services script
│   │   ├── package.json            # Deployment dependencies
│   │   └── server/                 # Deployment server files
│   │
│   ├── .github/workflows/          # GitHub Actions CI/CD
│   ├── docker-compose.yml          # Docker configuration
│   ├── vercel.json                 # Vercel deployment config
│   └── railway.json               # Railway deployment config
│
├── 📁 Assets & Uploads
│   ├── attached_assets/            # User uploaded assets
│   ├── uploads/                    # File uploads directory
│   └── templates/                  # HTML templates
│
└── 📚 Documentation & Scripts
    ├── 🔧 Deployment Guides
    │   ├── AWS_SECURITY_GROUP_SETUP_GUIDE.md
    │   ├── DNS_CONFIGURATION_GUIDE.md
    │   ├── COMPLETE_TROUBLESHOOTING_CHECKLIST.md
    │   └── [Multiple deployment guides...]
    │
    ├── 🛠️ Utility Scripts
    │   ├── create-admin.js          # Create admin user
    │   ├── check-db.js              # Database health check
    │   ├── setup-admin.js           # Admin setup
    │   └── [Various utility scripts...]
    │
    └── 🐛 Debug & Fix Files
        ├── BLANK_SCREEN_FIX.md
        ├── PORT_5000_FIX.md
        ├── NGINX_403_FORBIDDEN_FIX.md
        └── [Multiple troubleshooting guides...]
```

## 🔑 Key Application Components

### Backend (Node.js/Express)
- **Entry Point**: `server/index.ts`
- **API Routes**: `server/routes.ts`
- **Database**: `server/db.ts` (Supabase PostgreSQL)
- **Storage**: `server/storage.ts` (File handling)
- **Port**: 5000 (proxied through Nginx on port 80)

### Frontend (React/Vite)
- **Entry Point**: `client/src/main.tsx`
- **Main App**: `client/src/App.tsx`
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + Custom components

### Database
- **Production**: Supabase PostgreSQL
- **Local**: SQLite (`sqlite.db`)
- **ORM**: Drizzle
- **Migrations**: `migrations/` directory

### Deployment
- **Platform**: AWS EC2 (Amazon Linux 2023)
- **Process Manager**: PM2
- **Web Server**: Nginx (reverse proxy)
- **Domain**: pickntrust.com
- **SSL**: Ready for HTTPS setup

## 🌐 Application Architecture

```
Internet → Nginx (Port 80) → Node.js App (Port 5000) → Supabase DB
                ↓
            Static Files & React SPA
```

## 📋 Current Status

✅ **Deployed Components**:
- Node.js backend running on PM2
- Nginx configured as reverse proxy
- Database connected to Supabase
- DNS configured for pickntrust.com

❌ **Issue**: Connection refused (likely AWS Security Group)

## 🔧 Main Configuration Files

- `package.json` - Dependencies and scripts
- `server/index.ts` - Main server configuration
- `vite.config.ts` - Build configuration
- `deploy/deploy.sh` - Deployment automation
- `drizzle.config.ts` - Database configuration

This is a full-stack TypeScript application with React frontend and Node.js backend, deployed on AWS EC2 with proper CI/CD and documentation.
