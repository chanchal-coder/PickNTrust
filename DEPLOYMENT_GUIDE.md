# PickTrustDeals Deployment Guide

## 🚀 **Quick Start - One-Command Deployment**

### **Where to Run the Deploy Script**

The deploy script can be run in **three different environments**:

### **1. Local Development (Recommended for Testing)**
```bash
# From your project root directory
cd c:/Users/vcp98/OneDrive/Desktop/New folder/PickTrustDeals (3)/PickTrustDeals
chmod +x deploy/deploy.sh
./deploy/deploy.sh deploy
```

### **2. AWS EC2 Production Deployment**

#### **One-Command Deployment:**
```bash
# SSH into your EC2 instance first
ssh -i your-key.pem ubuntu@your-ec2-ip

# Then run the deployment
curl -fsSL https://raw.githubusercontent.com/your-username/picktrustdeals/main/deploy/deploy.sh | bash -s deploy
```

### **3. GitHub Actions (Automated)**
- Push to `main` branch → Automatic deployment
- Manual trigger: Actions tab → Deploy → Run workflow

---

## 🎯 **Step-by-Step Deployment Instructions

### **1. Local Development Setup**
```bash
# Navigate to project directory
cd c:/Users/vcp98/OneDrive/Desktop/New folder/PickTrustDeals (3)/PickTrustDeals

# Make script executable
chmod +x deploy/deploy.sh

# Run deployment
./deploy/deploy.sh deploy
```

### **2. AWS EC2 Production Deployment

#### **One-Command Deployment:**
```bash
# SSH into your EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Run deployment script
curl -fsSL https://raw.githubusercontent.com/your-username/picktrustdeals/main/deploy/deploy.sh | bash -s deploy
```

### **3. GitHub Actions Setup

#### **Required Secrets:**
Go to GitHub → Settings → Secrets and variables → Actions:
- `EC2_HOST`: Your EC2 public IP/domain
- `EC2_USERNAME`: Usually `ubuntu`
- `EC2_SSH_KEY`: Your private SSH key

#### **Automatic Deployment:**
- Push to `main` branch → Auto-deploys
- Manual trigger: Actions tab → Deploy → Run workflow

---

## 📋 **Step-by-Step Deployment Instructions

### **1. Local Development Setup
```bash
# Navigate to project directory
cd c:/Users/vcp98/OneDrive/Desktop/New folder/PickTrustDeals (3)/PickTrustDeals

# Make script executable
chmod +x deploy/deploy.sh

# Run deployment
./deploy/deploy.sh deploy
```

### **2. AWS EC2 Production Deployment

#### **One-Command Deployment:**
```bash
# SSH into your EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Run deployment script
curl -fsSL https://raw.githubusercontent.com/your-username/picktrustdeals/main/deploy/deploy.sh | bash -s deploy
```

### **3. GitHub Actions Setup

#### **Required Secrets:**
Go to GitHub → Settings → Secrets and variables → Actions:
- `EC2_HOST`: Your EC2 public IP/domain
- `EC2_USERNAME`: Usually `ubuntu`
- `EC2_SSH_KEY`: Your private SSH key

#### **Automatic Deployment:**
- Push to `main` branch → Auto-deploys
- Manual trigger: Actions tab → Deploy → Run workflow

---

## 📋 **Step-by-Step Deployment Instructions

### **1. Local Development Setup
```bash
# Navigate to project directory
cd c:/Users/vcp98/OneDrive/Desktop/New folder/PickTrustDeals (3)/PickTrustDeals

# Make script executable
chmod +x deploy/deploy.sh

# Run deployment
./deploy/deploy.sh deploy
```

### **2. AWS EC2 Production Deployment

#### **One-Command Deployment:**
```bash
# SSH into your EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Run deployment script
curl -fsSL https://raw.githubusercontent.com/your-username/picktrustdeals/main/deploy/deploy.sh | bash -s deploy
```

### **3. GitHub Actions Setup

#### **Required Secrets:**
Go to GitHub → Settings → Secrets and variables → Actions:
- `EC2_HOST`: Your EC2 public IP/domain
- `EC2_USERNAME`: Usually `ubuntu`
- `EC2_SSH_key`: Your private SSH key

#### **Automatic Deployment:**
- Push to `main` branch → Auto-deploys
- Manual trigger: Actions tab → Deploy → Run workflow

---

## 📋 **Step-by-Step Deployment Instructions

### **1. Local Development Setup
```bash
# Navigate to project directory
cd c:/Users/vcp98/OneDrive/Desktop/New folder/PickTrustDeals (3)/PickTrustDeals

# Make script executable
chmod +x deploy/deploy.sh

# Run deployment
./deploy/deploy.sh deploy
```

### **2. AWS EC2 Production Deployment

#### **One-Command Deployment:**
```bash
# SSH into your EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Run deployment script
curl -fsSL https://raw.githubusercontent.com/your-username/picktrustdeals/main/deploy/deploy.sh | bash -s deploy
```

### **3. GitHub Actions Setup

#### **Required Secrets:**
Go to GitHub → Settings → Secrets and variables → Actions:
- `EC2_HOST`: Your EC2 public IP/domain
- `EC2_USERNAME`: Usually `ubuntu`
- `EC2_SSH_key`: Your private SSH key

#### **Automatic Deployment:**
- Push to `main` branch → Auto-deploys
- Manual trigger: Actions tab → Deploy → Run workflow

---

## 📋 **Step-by-Step Deployment Instructions

### **1. Local Development Setup
```bash
# Navigate to project directory
cd c:/Users/vcp98/OneDrive/Desktop/New folder/PickTrustDeals (3)/PickTrustDeals

# Make script executable
chmod +x deploy/deploy.sh

# Run deployment
./deploy/deploy.sh deploy
```

### **2. AWS EC2 Production Deployment

#### **One-Command Deployment:**
```bash
# SSH into your EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Run deployment script
curl -fsSL https://raw.githubusercontent.com/your-username/picktrustdeals/main/deploy/deploy.sh | bash -s deploy
```

### **3. GitHub Actions Setup

#### **Required Secrets:**
Go to GitHub → Settings → Secrets and variables → Actions:
- `EC2_HOST`: Your EC2 public IP/domain
- `EC2_username`: Usually `ubuntu`
- `EC2_SSH_key`: Your private SSH key

#### **Automatic Deployment:**
- Push to `main` branch → Auto-deploys
- Manual trigger: Actions tab → Deploy → Run workflow

---

## 📋 **Step-by-Step Deployment Instructions

### **1. Local Development Setup
```bash
# Navigate to project directory
cd c:/Users/vcp98/OneDrive/Desktop/New folder/PickTrustDeals (3)/PickTrustDeals

# Make script executable
chmod +x deploy/deploy.sh

# Run deployment
./deploy/deploy.sh deploy
```

### **2. AWS EC2 Production Deployment

#### **One-Command Deployment:**
```bash
# SSH into your EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Run deployment script
curl -fsSL https://raw.githubusercontent.com/your-destination/main/deploy/deploy.sh | bash -s deploy
```

### **3. GitHub Actions Setup

#### **Required Secrets:**
Go to GitHub → Settings → Secrets and variables → Actions:
- `EC2_host`: Your EC2 public IP/domain
- `EC2_username`: Usually `ubuntu`
- `EC2_SSH_key`: Your private SSH key

#### **Automatic Deployment:**
- Push to `main` branch → Auto-deploys
- Manual trigger: Actions tab → Deploy → Run workflow

---

## 📋 **Step-by-Step Deployment Instructions

### **1. Local Development Setup
```bash
# Navigate to project directory
cd c:/Users/vcp98/OneDrive/Desktop/New folder/PickTrustDeals (3)/PickTrustDeals

# Make script executable
chmod +x deploy/deploy.sh

# Run deployment
./deploy/deploy.sh deploy
```

### **2. AWS EC2 Production Deployment

#### **One-Command Deployment:**
```bash
# SSH into your EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Run deployment script
curl -fsSL https://raw.githubusercontent.com/your-destination/main/deploy/deploy.sh | bash -s deploy
```

### **3. GitHub Actions Setup

#### **Required Secrets:**
Go to GitHub → Settings → Secrets and variables → Actions:
- `EC2_host`: Your EC2 public IP/domain
- `EC2_username`: Usually `ubuntu`
- `EC2_SSH_key`: Your private SSH key

#### **Automatic Deployment:**
- Push to `main` branch → Auto-deploys
- Manual trigger: Actions tab → Deploy → Run workflow

---

## 📋 **Step-by-Step Deployment Instructions

### **1. Local Development Setup
```bash
# Navigate to project directory
cd c:/Users/vcp98/OneDrive/Desktop/New folder/PickTrustDeals (3)/PickTrustDeals

# Make script executable
chmod +x deploy/deploy.sh

# Run deployment
./deploy/deploy.sh deploy
```

### **2. AWS EC2 Production Deployment

#### **One-Command Deployment:**
```bash
# SSH into your EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Run deployment script
curl -fsSL https://raw.githubusercontent.com/your-destination/main/deploy/deploy.sh | bash -s deploy
```

### **3. GitHub Actions Setup

#### **Required Secrets:**
Go to GitHub → Settings → Secrets and variables → Actions:
- `EC2_host`: Your EC2 public IP/domain
- `EC2_username`: Usually `ubuntu`
- `EC2_SSH_key`: Your private SSH key

#### **Automatic Deployment:**
- Push to `main` branch → Auto-deploys
- Manual trigger: Actions tab → Deploy → Run workflow

---

## 📋 **Step-by-Step Deployment Instructions

### **1. Local Development Setup
```bash
# Navigate to project directory
