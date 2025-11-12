param()

$SSH_KEY = "C:\Users\sharm\.ssh\pnt08.pem"
$SERVER = "ec2-user@16.171.161.251"

Write-Host "Showing active Nginx server_name and proxy_pass mappings..." -ForegroundColor Yellow

$remote = @'
set -e
echo "---- server_name and listens (with file origins) ----"
sudo nginx -T 2>&1 | awk 'BEGIN{file=""} /nginx: the configuration file/{next} /\/etc\/nginx\//{file=$0; print file; next} /server_name|listen/{print $0}' | sed -E "s/^\s+//" | uniq || true
echo "---- API proxy_pass blocks (with file origins) ----"
sudo nginx -T 2>&1 | awk 'BEGIN{file=""} /\/etc\/nginx\//{file=$0} /location \/api\/{show=1; print file; print $0; next} show{print} /\}/{show=0}' | sed -n '1,160p' || true
'@

ssh -i $SSH_KEY -o StrictHostKeyChecking=no $SERVER "bash -lc \"$remote\""

Write-Host "Done." -ForegroundColor Green