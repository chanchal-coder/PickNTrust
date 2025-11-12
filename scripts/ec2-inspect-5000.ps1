param(
  [string]$HostName = "16.171.161.251",
  [string]$KeyPath = "$env:USERPROFILE\.ssh\pnt08.pem"
)

$remote = @'
set -e
echo "--- 5000 PROCESS DETAIL ---"
pid=$(ss -lntp | awk '/127.0.0.1:5000/ {print $NF}' | sed -E 's/.*pid=([0-9]+).*/\1/' | head -n1)
echo "PID: $pid"
if [ -n "$pid" ]; then
  echo "cmdline:"
  tr '\0' ' ' < /proc/$pid/cmdline | sed 's/^/  /'
  echo "cwd:"; readlink -f /proc/$pid/cwd | sed 's/^/  /'
  echo "exe:"; readlink -f /proc/$pid/exe | sed 's/^/  /'
  echo "env snippet (DATABASE_URL, PWD, PORT):"
  tr '\0' '\n' < /proc/$pid/environ | egrep '^(DATABASE_URL|PWD|PORT)=' | sed 's/^/  /'
fi
'@

$bytes = [System.Text.Encoding]::UTF8.GetBytes($remote)
$b64 = [Convert]::ToBase64String($bytes)
ssh -i $KeyPath ec2-user@$HostName "bash -lc 'echo $b64 | base64 -d > /home/ec2-user/inspect_5000.sh && chmod +x /home/ec2-user/inspect_5000.sh && /home/ec2-user/inspect_5000.sh'"