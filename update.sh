#!/bin/bash

# Update script for Class Scheduling Application
# Run this script as the app user or with sudo -u appuser

set -e  # Exit on error

APP_DIR="/var/www/class-scheduling"
APP_USER="appuser"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Check if running as app user or root
if [ "$USER" != "$APP_USER" ] && [ "$EUID" -ne 0 ]; then
    echo "Please run as $APP_USER or with sudo -u $APP_USER"
    exit 1
fi

print_status "Starting application update..."

cd $APP_DIR

# Backup current version
print_status "Creating backup..."
BACKUP_DIR="/var/backups/class-scheduling-$(date +%Y%m%d-%H%M%S)"
mkdir -p $BACKUP_DIR
cp -r Back-end/.env $BACKUP_DIR/ 2>/dev/null || true
cp -r .env.local $BACKUP_DIR/ 2>/dev/null || true
print_status "Backup created at $BACKUP_DIR"

# Pull latest changes
print_status "Pulling latest changes from Git..."
git pull origin main || git pull origin master

# Update backend
print_status "Updating backend..."
cd Back-end
npm install
npm run prisma:generate
npm run prisma:migrate
npm run build

# Update frontend
print_status "Updating frontend..."
cd ..
npm install
npm run build

# Restart PM2 applications
print_status "Restarting applications..."
pm2 restart all

print_status "Update completed successfully!"
print_status "Check status with: pm2 status"
print_status "View logs with: pm2 logs"
