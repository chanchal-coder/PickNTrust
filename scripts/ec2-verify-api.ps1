param(
  [string]$HostName = "16.171.161.251",
  [string]$KeyPath = "$env:USERPROFILE\.ssh\pnt08.pem"
)

# Compose a remote shell script that avoids complex quoting by sending as base64
$remote = @'
set -e
DB="/home/ec2-user/pickntrust/database.sqlite"

echo "Fetching categories API..."
curl -s http://localhost:5000/api/categories/browse > /home/ec2-user/cats.json
echo "API categories name fields count:"
grep -o '"name"' /home/ec2-user/cats.json | wc -l || echo 0
echo "API categories array length (python):"
python3 - <<'PY'
import json
print(len(json.load(open('/home/ec2-user/cats.json'))))
PY
echo "DB categories rows count:"
sqlite3 "$DB" "SELECT COUNT(1) FROM categories;"

echo "Fetching blog API..."
curl -s http://localhost:5000/api/blog > /home/ec2-user/blogs.json
echo "API blog posts title fields count:"
grep -o '"title"' /home/ec2-user/blogs.json | wc -l || echo 0
echo "API blogs array length (python):"
python3 - <<'PY'
import json
print(len(json.load(open('/home/ec2-user/blogs.json'))))
PY
echo "DB blog_posts rows count:"
sqlite3 "$DB" "SELECT COUNT(1) FROM blog_posts;"
'@

# Ship and execute the remote script via base64 to avoid quoting problems
$bytes = [System.Text.Encoding]::UTF8.GetBytes($remote)
$b64 = [Convert]::ToBase64String($bytes)
ssh -i $KeyPath ec2-user@$HostName "bash -lc 'echo $b64 | base64 -d > /home/ec2-user/verify_api.sh && chmod +x /home/ec2-user/verify_api.sh && /home/ec2-user/verify_api.sh'"