Admin Checks and Fixes

- Quick fix and verify categories API:
  - `powershell -ExecutionPolicy Bypass -File scripts\check-fix-api.ps1`
  - Uploads and runs a remote SQLite fix on EC2 to ensure `categories` has `is_active` and `is_for_ai_apps`, seeds minimal rows if empty, then verifies `/api/categories/browse`.

- Quick browse API check only:
  - `powershell -Command "$resp = Invoke-WebRequest https://www.pickntrust.com/api/categories/browse -UseBasicParsing; ($resp.Content | ConvertFrom-Json).Count"`

- Remote PM2 status snapshot:
  - `ssh -i "$env:USERPROFILE\.ssh\pnt08.pem" ec2-user@16.171.161.251 "bash -lc 'pm2 status | sed -n \"1,60p\"'"`

Notes
- The backend now guards the `categories` schema at startup to add missing columns and defaults, preventing this issue from recurring.
- If counts are zero after running the fix, check server logs: `ssh -i "$env:USERPROFILE\.ssh\pnt08.pem" ec2-user@16.171.161.251 "bash -lc 'pm2 logs pickntrust-backend --lines 120'"`.