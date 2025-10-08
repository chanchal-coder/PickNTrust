# Canonical Form Categories Seeding

Guarantee the form dropdowns always show the exact updated categories after any deploy/redeploy: 13 Products, 19 Services, 16 Apps & AI Apps.

## Usage

Run the PowerShell deployment script with your EC2 details:

```
powershell -ExecutionPolicy Bypass -File scripts\deploy-seed-form-flags.ps1 \
  -Server "ec2-user@<YOUR-EC2-IP>" \
  -KeyPath "C:\\Users\\<you>\\.ssh\\your-key.pem" \
  -DbPath "/home/ec2-user/pickntrust/database.sqlite"
```

## What it does

- Copies `scripts/seed-form-flags.sql` to the server
- Applies it via `sqlite3` against the production DB
- Verifies DB counts: products/services/aiapps
- Optionally checks public API counts for the forms endpoints

## Why it’s robust

- Promotes target categories to parents if they were added as children
- Resets all parent flags to `0`, then sets only the canonical lists with display orders
- Ensures `is_active=1` on the canonical categories

## Integrate into your deploy

Add this step at the end of any deployment script (e.g., `deploy-full-app.ps1`) to guarantee consistent form categories post-release.