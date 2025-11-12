param()

$SSH_KEY = "C:\Users\sharm\.ssh\pnt08.pem"
$SERVER = "ec2-user@16.171.161.251"

Write-Host "Listing remote dist/server/server contents on EC2..." -ForegroundColor Yellow

$remote = @'
set -e
cd /home/ec2-user/pickntrust
echo "PWD: $(pwd)"
echo "Index.js presence:"; ls -la dist/server/server/index.js || true
echo "routes-final.js presence:"; ls -la dist/server/server/routes-final.js || true
echo "List dist/server/server:"; ls -la dist/server/server | sed -n '1,160p'
'@

ssh -i $SSH_KEY -o StrictHostKeyChecking=no $SERVER "bash -lc \"$remote\""

Write-Host "Done." -ForegroundColor Green