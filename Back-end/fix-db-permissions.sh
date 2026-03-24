#!/bin/bash

# Quick script to fix database permissions
# This script will grant proper permissions to your database user

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

echo "========================================="
echo "Database Permissions Fix Script"
echo "========================================="
echo ""

# Detect which user to use
read -p "Enter database user name [postgres]: " DB_USER
DB_USER=${DB_USER:-postgres}

DB_NAME="class_scheduling"

print_step "Fixing permissions for user: $DB_USER on database: $DB_NAME"

# Try different access methods
if sudo -u postgres psql -c "\l" &>/dev/null 2>&1; then
    ACCESS_CMD="sudo -u postgres psql"
    print_status "Using: sudo -u postgres psql"
elif psql -U postgres -c "\l" &>/dev/null 2>&1; then
    ACCESS_CMD="psql -U postgres"
    print_status "Using: psql -U postgres"
elif psql postgres -c "\l" &>/dev/null 2>&1; then
    ACCESS_CMD="psql postgres"
    print_status "Using: psql postgres"
else
    print_error "Cannot access PostgreSQL. Please check your PostgreSQL installation."
    exit 1
fi

# Grant permissions
print_step "Granting database privileges..."
$ACCESS_CMD -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>/dev/null || print_error "Failed to grant database privileges"

print_step "Granting schema privileges..."
$ACCESS_CMD -d $DB_NAME -c "GRANT USAGE ON SCHEMA public TO $DB_USER;" 2>/dev/null || print_error "Failed to grant schema usage"
$ACCESS_CMD -d $DB_NAME -c "GRANT ALL ON SCHEMA public TO $DB_USER;" 2>/dev/null || print_error "Failed to grant schema privileges"

print_step "Granting table privileges..."
$ACCESS_CMD -d $DB_NAME -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;" 2>/dev/null || print_error "Failed to grant table privileges"

print_step "Granting sequence privileges..."
$ACCESS_CMD -d $DB_NAME -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;" 2>/dev/null || print_error "Failed to grant sequence privileges"

print_step "Setting default privileges for future objects..."
$ACCESS_CMD -d $DB_NAME -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;" 2>/dev/null || print_error "Failed to set default table privileges"
$ACCESS_CMD -d $DB_NAME -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;" 2>/dev/null || print_error "Failed to set default sequence privileges"

echo ""
print_status "Permissions fixed! You can now try running your Prisma commands again."
echo ""
echo "Next steps:"
echo "  1. npm run prisma:migrate"
echo "  2. npm run prisma:seed"
echo "  3. npm run build"
