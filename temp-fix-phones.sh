#!/usr/bin/env bash
set -e
DB=/home/ec2-user/pickntrust/database.sqlite
sqlite3 "$DB" "UPDATE categories SET parent_id = 3558 WHERE LOWER(name) = 'phones';"
sqlite3 "$DB" "SELECT id, name, parent_id FROM categories WHERE LOWER(name) LIKE '%phone%';"