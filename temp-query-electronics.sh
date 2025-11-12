#!/usr/bin/env bash
set -e
sqlite3 /home/ec2-user/pickntrust/database.sqlite "SELECT id, name, parent_id FROM categories WHERE LOWER(name) LIKE '%electronics%' OR LOWER(name) LIKE '%electronic%' OR LOWER(name) LIKE '%gadget%' OR LOWER(name) LIKE '%gadgets%';"