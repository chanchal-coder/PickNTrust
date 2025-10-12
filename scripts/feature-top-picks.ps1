Param(
  [string]$Server = "ec2-user@16.171.161.251",
  [string]$KeyPath = "C:\Users\sharm\.ssh\pnt08.pem",
  [int]$Count = 12
)

$ErrorActionPreference = "Stop"

Write-Host "Flagging latest $Count items as active+featured on $Server" -ForegroundColor Yellow

$remote = @'
cd /home/ec2-user/pickntrust

COUNT=${COUNT:-12}

node - "$COUNT" <<'NODE'
const Database=require('better-sqlite3');
const countArg = Number(process.argv[2]||12);
try {
  const db=new Database('./database.sqlite');
  const rows=db.prepare("SELECT id FROM unified_content WHERE (processing_status!='archived' OR processing_status IS NULL) ORDER BY created_at DESC, id DESC LIMIT ?").all(countArg);
  const ids=rows.map(r=>r.id);
  console.log('Selected IDs', ids);
  if(ids.length){
    const sql = `UPDATE unified_content 
      SET 
        is_active=1, 
        is_featured=1, 
        status='active', 
        visibility='public'
      WHERE id IN (${ids.join(',')})`;
    db.exec(sql);
  }
  const c=db.prepare("SELECT COUNT(*) c FROM unified_content WHERE is_active='1' AND (is_featured='1' OR CAST(is_featured AS TEXT) IN ('1','true','TRUE','yes','YES','y','Y'))").get().c;
  console.log('featured_active_count', c);
  db.close();
} catch (e) {
  console.error('Update error', e);
  process.exit(1);
}
NODE

echo "Internal API HTTP status:"; curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1/api/products/page/top-picks || true
echo "Internal API sample JSON:"; curl -s http://127.0.0.1/api/products/page/top-picks | head -c 200 || true
echo "Featured endpoint sample JSON:"; curl -s http://127.0.0.1/api/products/featured | head -c 200 || true

echo "Route-filter count (status/visibility/archived + featured truthy):"
sqlite3 ./database.sqlite "SELECT COUNT(*) FROM unified_content WHERE (status IN ('active','published','ready','processed','completed') OR status IS NULL) AND (visibility IN ('public','visible') OR visibility IS NULL) AND (processing_status != 'archived' OR processing_status IS NULL) AND (is_featured = 1 OR CAST(is_featured AS TEXT) IN ('1','true','TRUE','yes','YES','y','Y') OR COALESCE(is_featured, 0) = 1);" || true

echo "Recent backend logs (pickntrust-backend):"
pm2 logs pickntrust-backend --lines 50 || true
echo "SQL debug log tail (if present):"
tail -n 50 /home/ec2-user/pickntrust/dist/server/server/sql-debug.log 2>/dev/null || true
tail -n 50 /home/ec2-user/pickntrust/dist/server/sql-debug.log 2>/dev/null || true
'@

$tmpScript = [System.IO.Path]::Combine($env:TEMP, "feature-top-picks.sh")
Set-Content -Path $tmpScript -Value $remote -Encoding UTF8
scp -i $KeyPath -o StrictHostKeyChecking=no $tmpScript "${Server}:/home/ec2-user/pickntrust/feature-top-picks.sh"
ssh -i $KeyPath -o StrictHostKeyChecking=no $Server "bash -lc 'chmod +x /home/ec2-user/pickntrust/feature-top-picks.sh && COUNT=$Count /home/ec2-user/pickntrust/feature-top-picks.sh'"

Write-Host "Top Picks feature flag update completed." -ForegroundColor Green