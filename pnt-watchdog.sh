#!/bin/bash
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5000/health)
if [ -z "$STATUS" ]; then STATUS=000; fi
if [ "$STATUS" != "200" ]; then
  if ! pm2 restart pickntrust; then
    if ! pm2 resurrect; then
      pm2 start /home/ec2-user/pickntrust/dist/server/index.js --name pickntrust || true
    fi
  fi
fi