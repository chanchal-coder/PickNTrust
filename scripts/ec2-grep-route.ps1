param(
  [string]$HostName = "16.171.161.251",
  [string]$KeyPath = "$env:USERPROFILE\.ssh\pnt08.pem"
)

$remote = @'
set -e
file=/home/ec2-user/pickntrust/dist/server/server/routes-final.js
echo "Searching categories browse route..."
grep -n "/api/categories/browse" "$file" || true
echo "Context:"
nl -ba "$file" | sed -n '1,240p' | sed -n '/\/api\/categories\/browse/,+40p' || true
'@

$bytes = [System.Text.Encoding]::UTF8.GetBytes($remote)
$b64 = [Convert]::ToBase64String($bytes)
ssh -i $KeyPath ec2-user@$HostName "bash -lc 'echo $b64 | base64 -d > /home/ec2-user/grep_route.sh && chmod +x /home/ec2-user/grep_route.sh && /home/ec2-user/grep_route.sh'"