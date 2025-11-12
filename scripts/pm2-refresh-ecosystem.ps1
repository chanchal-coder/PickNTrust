param()

$SSH_KEY = "C:\Users\sharm\.ssh\pnt08.pem"
$SERVER = "ec2-user@16.171.161.251"

Write-Host "Refreshing PM2 backend via ecosystem.config.cjs on EC2..." -ForegroundColor Yellow

$remote = @'
set -e
cd /home/ec2-user/pickntrust
sudo chown -R ec2-user:ec2-user /home/ec2-user/pickntrust || true

if ! command -v pm2 >/dev/null 2>&1; then
  npm i -g pm2 || true
fi

if [ ! -f ecosystem.config.cjs ]; then
  echo "ecosystem.config.cjs not found in /home/ec2-user/pickntrust"; ls -la
  exit 1
fi
if [ ! -d dist ]; then
  echo "dist directory missing in /home/ec2-user/pickntrust"; ls -la
  exit 1
fi

pm2 delete pickntrust-backend || true
pm2 start ecosystem.config.cjs --update-env
pm2 save || true
pm2 status || true

echo "--- PM2 describe pickntrust-backend ---"
pm2 describe pickntrust-backend || true
'@

ssh -i $SSH_KEY -o StrictHostKeyChecking=no $SERVER "bash -lc \"$remote\""

Write-Host "Done refreshing PM2 via ecosystem on EC2." -ForegroundColor Green