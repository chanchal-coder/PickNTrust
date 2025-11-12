param()

$SSH_KEY = "C:\Users\sharm\.ssh\pnt08.pem"
$SERVER = "ec2-user@16.171.161.251"

Write-Host "Auditing and fixing Nginx /api proxy paths on EC2..." -ForegroundColor Yellow

ssh -i $SSH_KEY -o StrictHostKeyChecking=no $SERVER "bash -lc 'sudo grep -RInE "location \/api\/?|proxy_pass http:\/\/127.0.0.1:5000\/api" /etc/nginx || true'"

ssh -i $SSH_KEY -o StrictHostKeyChecking=no $SERVER "bash -lc 'sudo sed -i "s/location \\/api\//location \\/api/g" /etc/nginx/conf.d/*.conf /etc/nginx/sites-available/* 2>/dev/null || true'"

ssh -i $SSH_KEY -o StrictHostKeyChecking=no $SERVER "bash -lc 'sudo sed -i "s#proxy_pass http://127.0.0.1:5000/api/#proxy_pass http://127.0.0.1:5000/#g" /etc/nginx/conf.d/*.conf /etc/nginx/sites-available/* 2>/dev/null || true'"

ssh -i $SSH_KEY -o StrictHostKeyChecking=no $SERVER "bash -lc 'sudo sed -i "s#proxy_pass http://127.0.0.1:5000/api;#proxy_pass http://127.0.0.1:5000;#g" /etc/nginx/conf.d/*.conf /etc/nginx/sites-available/* 2>/dev/null || true'"

ssh -i $SSH_KEY -o StrictHostKeyChecking=no $SERVER "bash -lc 'sudo nginx -t'"
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $SERVER "bash -lc 'sudo systemctl reload nginx || sudo systemctl restart nginx'"

ssh -i $SSH_KEY -o StrictHostKeyChecking=no $SERVER "bash -lc 'sudo nginx -T 2>/dev/null | awk \''/location \/api/{show=1} show{print} /\}/{show=0}\'' | sed -n \"1,160p\"'"

ssh -i $SSH_KEY -o StrictHostKeyChecking=no $SERVER "bash -lc 'pm2 show pickntrust-backend 2>/dev/null | sed -n \"1,200p\"'"

ssh -i $SSH_KEY -o StrictHostKeyChecking=no $SERVER "bash -lc 'curl -s -o /dev/null -w \"status https://pickntrust.com/: %{http_code}\\n\" https://pickntrust.com/'"
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $SERVER "bash -lc 'curl -s -o /dev/null -w \"status https://pickntrust.com/api/status: %{http_code}\\n\" https://pickntrust.com/api/status'"
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $SERVER "bash -lc 'curl -s -o /dev/null -w \"bulk-upload POST (expect 400): %{http_code}\\n\" -X POST https://pickntrust.com/api/admin/products/bulk-upload || true'"

Write-Host "Done." -ForegroundColor Green