param(
  [string]$HostName = "16.171.161.251",
  [string]$KeyPath = "$env:USERPROFILE\.ssh\pnt08.pem",
  [string]$Action = "list"
)

$remote = @'
set -euo pipefail
DB="/home/ec2-user/pickntrust/database.sqlite"
case "__ACTION__" in
  schema)
    echo "Blog Posts schema:"
    sqlite3 "$DB" ".schema blog_posts" || true
    ;;
  count)
    echo "Blog Posts count:"
    sqlite3 "$DB" "SELECT COUNT(*) FROM blog_posts;" || true
    ;;
  list|*)
    echo "Blog Posts rows (id, title, slug, created_at):"
    sqlite3 "$DB" "SELECT id, title, slug, created_at FROM blog_posts ORDER BY id DESC LIMIT 20;" || true
    ;;
esac
'@

$remote = $remote.Replace("__ACTION__", $Action)
$b64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($remote))
ssh -i $KeyPath ec2-user@$HostName "bash -lc 'echo $b64 | base64 -d > /home/ec2-user/run_query_blog.sh && bash /home/ec2-user/run_query_blog.sh'"