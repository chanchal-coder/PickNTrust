param(
  [string]$HostName = "16.171.161.251",
  [string]$KeyPath = "$env:USERPROFILE\.ssh\pnt08.pem"
)

$remote = @'
set -e
pm2 status || true
echo "--- LISTENERS ---"
ss -lntp | grep -E '(:5000|:80|:8080)' || true
'@

$bytes = [System.Text.Encoding]::UTF8.GetBytes($remote)
$b64 = [Convert]::ToBase64String($bytes)
ssh -i $KeyPath ec2-user@$HostName "bash -lc 'echo $b64 | base64 -d > /home/ec2-user/check_ports.sh && chmod +x /home/ec2-user/check_ports.sh && /home/ec2-user/check_ports.sh'"