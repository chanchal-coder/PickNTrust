param(
  [string]$HostName = "16.171.161.251",
  [string]$KeyPath = "$env:USERPROFILE\.ssh\pnt08.pem",
  [string]$Title = "Test Post After Restore",
  [string]$Slug = "test-post-after-restore"
)

# Build JSON payload in PowerShell
$payload = [ordered]@{
  adminPassword = "pickntrust2025"
  title        = $Title
  excerpt      = "Short summary of the test post."
  content      = "This is a test blog content to verify admin blogging works after DB alignment."
  category     = "updates"
  tags         = '["test","restore"]'
  imageUrl     = "https://example.com/test.jpg"
  videoUrl     = $null
  pdfUrl       = $null
  publishedAt  = [int][double]((Get-Date).ToUniversalTime() -as [DateTime]).Subtract([DateTime]::UnixEpoch).TotalSeconds
  readTime     = "2 min"
  slug         = $Slug
} | ConvertTo-Json -Compress

$remote = @'
set -e
DB="/home/ec2-user/pickntrust/database.sqlite"
cat > /home/ec2-user/tmp_blog.json <<"EOF"
__JSON__
EOF
echo "Posting blog via admin API..."
curl -s -X POST -H "Content-Type: application/json" --data @/home/ec2-user/tmp_blog.json http://localhost:5000/api/admin/blog || true
echo
echo "DB blog_posts count:"
sqlite3 "$DB" "SELECT COUNT(1) FROM blog_posts;"
'@

# Inject JSON into remote script (safe placeholder substitution)
$remote = $remote -replace '__JSON__', [Regex]::Escape($payload).Replace('\"','"')

# Ship and execute remote script via base64
$bytes = [System.Text.Encoding]::UTF8.GetBytes($remote)
$b64 = [Convert]::ToBase64String($bytes)
ssh -i $KeyPath ec2-user@$HostName "bash -lc 'echo $b64 | base64 -d > /home/ec2-user/run_post_blog.sh && chmod +x /home/ec2-user/run_post_blog.sh && /home/ec2-user/run_post_blog.sh'"