Param(
  [string]$Server = "ec2-user@16.171.161.251",
  [string]$KeyPath = "C:\Users\sharm\.ssh\pnt08.pem"
)

Write-Host "Restarting backend on EC2 and verifying health..." -ForegroundColor Yellow

$remote = @'
set -e
cd /home/ec2-user/pickntrust
node -v || { echo "ERROR: Node.js not installed"; exit 1; }
npm -v || { echo "ERROR: npm not installed"; exit 1; }
npm i -g pm2 || true

# Ensure dist exists
if [ ! -d dist ]; then
  echo "ERROR: dist not found in /home/ec2-user/pickntrust"; ls -la || true; exit 1
fi

# Start backend via ecosystem or direct script
pm2 delete pickntrust-backend || true
pm2 start ecosystem.config.cjs || pm2 start dist/server/index.js --name pickntrust-backend --update-env || pm2 start dist/server/server/index.js --name pickntrust-backend --update-env
pm2 save || true

echo "Waiting for backend on :5000..."
for i in 1 2 3 4 5; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5000/health || true)
  echo "Attempt $i, /health: $CODE"
  ss -tulpn | grep -E ":5000" && break || true
  sleep 2
done
pm2 status || true
'@

& ssh -i $KeyPath -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null $Server "bash -lc \"$remote\""

# Tail backend logs to capture errors
& ssh -i $KeyPath -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null $Server "bash -lc 'pm2 logs pickntrust-backend --lines 120'"

Write-Host "Done." -ForegroundColor Green