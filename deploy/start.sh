#!/bin/bash

# Start the backend server with PM2
pm2 start dist/server/index.js --name picktrustdeals

# Save the PM2 process list
pm2 save

echo "Application started successfully!"
echo "You can view logs with: pm2 logs picktrustdeals"
