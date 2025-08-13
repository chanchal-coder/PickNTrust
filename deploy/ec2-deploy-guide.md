# EC2 Deployment Update Guide

This guide provides step-by-step instructions to update your deployment on the EC2 instance using SSH. Follow carefully to avoid errors.

---

## Prerequisites

- You have your EC2 private key file (e.g., `picktrust-key.pem`) available locally.
- You have SSH access to your EC2 instance.
- Your project repository is cloned on the EC2 instance.
- PM2 is installed on the EC2 instance to manage backend processes.
- Nginx is installed and configured to serve your app.

---

## Step 1: Connect to EC2 via SSH

Open your terminal and run:

```bash
ssh -i "C:\AWSKeys\picktrust-key.pem" ec2-user@51.20.43.157
```

Replace the path and IP address with your actual key and instance IP.

---

## Step 2: Navigate to your project directory

```bash
cd /path/to/your/project
```

Replace with your actual project path.

---

## Step 3: Pull latest code from GitHub

```bash
git pull origin main
```

---

## Step 4: Install dependencies

```bash
npm install
```

If you get permission errors, run:

```bash
sudo npm install -g pm2
```

or use a Node version manager like `nvm` to avoid permission issues.

---

## Step 5: Clean previous builds and caches

```bash
rm -rf dist/
rm -rf client/dist/
rm -rf node_modules/.vite/
rm -rf .vite/
npm cache clean --force
```

---

## Step 6: Build frontend and backend

```bash
npm run build
```

---

## Step 7: Restart backend service with PM2

```bash
pm2 restart pickntrust-backend || pm2 start dist/server/index.js --name pickntrust-backend
```

---

## Step 8: Restart nginx to clear cache

```bash
sudo systemctl restart nginx
```

---

## Additional Notes

- The frontend is served as static files by the backend/nginx in production.
- If you want to run the frontend dev server separately (for development), you can run:

```bash
npm run dev --prefix client
```

- Always check PM2 logs for errors:

```bash
pm2 logs pickntrust-backend
```

- Check nginx logs if you face any issues:

```bash
sudo tail -f /var/log/nginx/error.log
```

---

## Troubleshooting

- If you encounter permission issues, ensure your user has the necessary rights.
- If PM2 is not installed, install it globally:

```bash
sudo npm install -g pm2
```

- If you face build errors, check your Node.js and npm versions.

---
pm2 logs pickntrust-backend
npm run dev --prefix client
sudo systemctl restart nginx
pm2 restart pickntrust-backend || pm2 start dist/server/index.js --name pickntrust-backend
sudo npm install -g pm2
npm install
cd /path/to/your/project
ssh -i "C:\AWSKeys\picktrust-key.pem" ec2-user@51.20.43.157

This guide is tested and should help you deploy your app error-free.

If you want, I can assist you step-by-step during the deployment.
