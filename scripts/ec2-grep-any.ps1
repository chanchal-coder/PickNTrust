param(
  [Parameter(Mandatory=$true)][string]$Pattern,
  [string]$FilePath = "/home/ec2-user/pickntrust/dist/server/server/routes-final.js",
  [int]$ContextLines = 20,
  [string]$HostName = "16.171.161.251",
  [string]$KeyPath = "$env:USERPROFILE\.ssh\pnt08.pem"
)

# Build a safe remote script that greps with context
# Use a single-quoted here-string to avoid PowerShell interpolation inside bash script
$script = @'
#!/usr/bin/env bash
set -euo pipefail
FILE="$FilePath"
PATTERN="$Pattern"
LINES=$ContextLines
if [[ ! -f "$FILE" ]]; then
  echo "File not found: $FILE" >&2
  exit 1
fi
echo "Searching pattern: $PATTERN"
grep -n "$PATTERN" "$FILE" || true
match_line=$(grep -n "$PATTERN" "$FILE" | head -n1 | cut -d: -f1 || true)
if [[ -n "${match_line:-}" ]]; then
  start=$(( match_line > LINES ? match_line - LINES : 1 ))
  end=$(( match_line + LINES ))
  echo "Context ($start-$end):"
  sed -n "${start},${end}p" "$FILE"
fi
'@

# Inject PowerShell parameter values into the bash script
$script = $script -replace 'FILE="\$FilePath"', "FILE=\"$FilePath\""
$script = $script -replace 'PATTERN="\$Pattern"', "PATTERN=\"$Pattern\""
$script = $script -replace 'LINES=\$ContextLines', "LINES=$ContextLines"

$b64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($script))
# Use a fixed temp path to avoid PowerShell $ expansion issues
ssh -i $KeyPath ec2-user@$HostName "bash -lc 'set -e; echo $b64 | base64 -d > /tmp/grep-any.sh; bash /tmp/grep-any.sh; rm -f /tmp/grep-any.sh'"