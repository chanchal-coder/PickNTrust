Param(
  [string]$Server = "ec2-user@51.20.55.153",
  [string]$KeyPath = "C:\Users\sharm\.ssh\pnt08.pem"
)

$ErrorActionPreference = "Stop"

Write-Host "Restarting backend via PM2 (Mumma)" -ForegroundColor Green

${remote} = @'
pm2 -v || npm i -g pm2;
cd ~/pickntrust;
pm2 start ecosystem.config.cjs --only pickntrust-backend --update-env || pm2 start dist/server/server/index.js --name pickntrust-backend --update-env;
sleep 1;
echo ==== PM2 STATUS ====;
pm2 status;
echo ==== PORT BINDINGS ====;
(ss -tulpn 2>/dev/null || netstat -tulpn 2>/dev/null) | grep -E ':5000' || echo 'no process bound to :5000';
echo ==== LOCAL HEALTH ====;
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:5000/health
'@

$tmpScript = [System.IO.Path]::Combine($env:TEMP, "restart-remote.sh")
Set-Content -Path $tmpScript -Value $remote -Encoding UTF8
scp -i $KeyPath -o StrictHostKeyChecking=no $tmpScript "${Server}:/home/ec2-user/pickntrust/restart-remote.sh"
ssh -i $KeyPath -o StrictHostKeyChecking=no ${Server} "bash -lc 'chmod +x /home/ec2-user/pickntrust/restart-remote.sh && /home/ec2-user/pickntrust/restart-remote.sh'"

Write-Host "Backend restart command executed" -ForegroundColor Green