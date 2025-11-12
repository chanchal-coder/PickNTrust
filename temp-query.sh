#!/usr/bin/env bash
set -e
sqlite3 /home/ec2-user/pickntrust/database.sqlite "SELECT id, name, parent_id FROM categories WHERE LOWER(name) LIKE '%phone%';"