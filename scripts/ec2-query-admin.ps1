param(
  [string]$HostName = "16.171.161.251",
  [string]$KeyPath = "$env:USERPROFILE\.ssh\pnt08.pem"
)

$remote = @'
set -euo pipefail
DB="/home/ec2-user/pickntrust/database.sqlite"
echo "Admin Users schema:"
sqlite3 "$DB" ".schema admin_users" || true
echo
echo "Admin Users rows:"
sqlite3 "$DB" "SELECT id, username, email, password_hash, is_active, last_login, created_at FROM admin_users;" || true
'@

$b64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($remote))
ssh -i $KeyPath ec2-user@$HostName "bash -lc 'echo $b64 | base64 -d > /home/ec2-user/run_query_admin.sh && bash /home/ec2-user/run_query_admin.sh'"