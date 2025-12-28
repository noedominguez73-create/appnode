#!/bin/bash
# Node.js Deployment Script

# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Start/Restart Server (using PM2 if available, or just node in background)
# For this environment, we'll just show the command
echo "Starting Node.js Server..."
nohup node server.js > server.log 2>&1 &

echo "Deployment completed successfully! Server running on Port 5000"
