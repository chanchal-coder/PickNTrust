param(
  [Parameter(Mandatory=$true)][string]$NewPassword,
  [string]$HostName = "16.171.161.251",
  [string]$KeyPath = "$env:USERPROFILE\.ssh\pnt08.pem"
)

$remote = @'
set -euo pipefail
DB="/home/ec2-user/pickntrust/database.sqlite"
PW_PLACEHOLDER="__PW__"
JS="const bcrypt=require('bcryptjs'); const pw=process.argv[2]; console.log(bcrypt.hashSync(pw,10));"
cd /home/ec2-user/pickntrust
HASH=$(node -e "$JS" "$PW_PLACEHOLDER")
echo "Computed bcrypt hash: $HASH"
sqlite3 "$DB" "UPDATE admin_users SET password_hash='$HASH' WHERE username='admin';"
echo "Updated admin password hash. Current row:"
sqlite3 "$DB" "SELECT id, username, email, password_hash, is_active FROM admin_users;"
'@

# Inject the password safely by replacing placeholder
$remote = $remote -replace '__PW__', ([Regex]::Escape($NewPassword).Replace('"','"'))

$b64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($remote))
ssh -i $KeyPath ec2-user@$HostName "bash -lc 'echo $b64 | base64 -d > /home/ec2-user/run_set_admin.sh && bash /home/ec2-user/run_set_admin.sh'"