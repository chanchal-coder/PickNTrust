# 🚨 CRITICAL: AWS Security Group Configuration Required

## The Issue
Your PickNTrust application is running correctly on the EC2 instance, but **AWS Security Groups are blocking external access**. This is why you're getting "connection timed out" errors.

## ✅ What's Working
- ✅ Application is running on port 5000
- ✅ Nginx is running on port 80
- ✅ Ubuntu firewall is configured correctly
- ✅ All services are healthy

## 🔧 IMMEDIATE FIX REQUIRED

### Step 1: AWS Console Access
1. Go to **AWS Console** → **EC2** → **Security Groups**
2. Find the security group attached to instance `51.21.202.172`

### Step 2: Add Inbound Rules
Add these **Inbound Rules** to your security group:

| Type  | Protocol | Port Range | Source    | Description |
|-------|----------|------------|-----------|-------------|
| HTTP  | TCP      | 80         | 0.0.0.0/0 | Web traffic |
| HTTPS | TCP      | 443        | 0.0.0.0/0 | Secure web  |
| SSH   | TCP      | 22         | 0.0.0.0/0 | SSH access  |

### Step 3: Alternative - AWS CLI Command
If you have AWS CLI configured, run this command:

```bash
# Get your security group ID first
aws ec2 describe-instances --instance-ids i-YOUR-INSTANCE-ID --query "Reservations[0].Instances[0].SecurityGroups[0].GroupId"

# Add the rules (replace sg-xxxxxxxxx with your actual security group ID)
aws ec2 authorize-security-group-ingress --group-id sg-xxxxxxxxx --protocol tcp --port 80 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id sg-xxxxxxxxx --protocol tcp --port 443 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id sg-xxxxxxxxx --protocol tcp --port 22 --cidr 0.0.0.0/0
```

## 🎯 After Fixing Security Group

Once you've added the inbound rules, your website will be immediately accessible at:
- **Website**: http://51.21.202.172
- **Admin Panel**: http://51.21.202.172/admin
- **API**: http://51.21.202.172/api/categories

## 📱 Quick Test
After fixing the security group, test with:
```bash
curl -I http://51.21.202.172
```

## 🔍 Current Status Verification
I can verify the application is working internally:

```bash
ssh -i "C:\sshkeys\picktrust-key.pem" ubuntu@51.21.202.172 "curl -I http://localhost"
```

This should return HTTP 200 OK, confirming the app is running correctly.

---

**The ONLY thing preventing external access is the AWS Security Group configuration. Fix this and your site will be live immediately!**
