#!/bin/bash

# PostgreSQL Installation Script for Alma Linux
# Run this script as root: sudo ./install-postgresql.sh

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

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

echo "========================================="
echo "PostgreSQL Installation for Alma Linux"
echo "========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    print_error "Please run as root or with sudo"
    exit 1
fi

# Check if PostgreSQL is already installed
print_step "Checking if PostgreSQL is already installed..."
if command -v psql &> /dev/null; then
    PSQL_VERSION=$(psql --version)
    print_status "PostgreSQL already installed: $PSQL_VERSION"
    
    if systemctl is-active --quiet postgresql 2>/dev/null || systemctl is-active --quiet postgresql-* 2>/dev/null; then
        print_status "PostgreSQL service is running"
        echo ""
        print_status "PostgreSQL is already installed and running!"
        echo ""
        read -p "Do you want to proceed with database setup? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 0
        fi
    else
        print_warning "PostgreSQL is installed but service is not running"
        read -p "Start PostgreSQL service? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            systemctl start postgresql || systemctl start postgresql-15 || systemctl start postgresql-14 || systemctl start postgresql-13
            systemctl enable postgresql || systemctl enable postgresql-15 || systemctl enable postgresql-14 || systemctl enable postgresql-13
            print_status "PostgreSQL service started"
        fi
    fi
else
    # Install PostgreSQL
    print_step "Installing PostgreSQL..."
    dnf install -y postgresql-server postgresql-contrib
    
    if [ $? -eq 0 ]; then
        print_status "PostgreSQL packages installed"
    else
        print_error "Failed to install PostgreSQL packages"
        exit 1
    fi
    
    # Initialize database
    print_step "Initializing PostgreSQL database cluster..."
    postgresql-setup --initdb
    
    if [ $? -eq 0 ]; then
        print_status "Database cluster initialized"
    else
        print_error "Failed to initialize database cluster"
        print_warning "Trying alternative initialization method..."
        if [ -d "/var/lib/pgsql/data" ]; then
            sudo -u postgres /usr/bin/initdb -D /var/lib/pgsql/data 2>/dev/null || {
                print_error "Manual initialization also failed"
                exit 1
            }
        fi
    fi
    
    # Start and enable service
    print_step "Starting PostgreSQL service..."
    systemctl enable postgresql
    systemctl start postgresql
    
    sleep 2
    
    if systemctl is-active --quiet postgresql; then
        print_status "PostgreSQL service started successfully"
    else
        print_error "Failed to start PostgreSQL service"
        print_warning "Checking logs..."
        journalctl -u postgresql -n 20 --no-pager
        exit 1
    fi
fi

# Verify installation
print_step "Verifying installation..."
PSQL_VERSION=$(psql --version 2>/dev/null || echo "unknown")
print_status "PostgreSQL version: $PSQL_VERSION"

# Check if postgres user exists
if id "postgres" &>/dev/null; then
    print_status "User 'postgres' exists"
else
    print_warning "User 'postgres' does not exist, creating..."
    useradd -r -s /bin/bash postgres
    if [ -d "/var/lib/pgsql" ]; then
        chown -R postgres:postgres /var/lib/pgsql
    fi
    print_status "User 'postgres' created"
fi

# Test connection
print_step "Testing PostgreSQL connection..."
if sudo -u postgres psql -c "SELECT version();" &>/dev/null; then
    print_status "✓ PostgreSQL connection successful!"
else
    print_warning "Connection test failed, but installation may still be successful"
    print_warning "You may need to configure pg_hba.conf for local access"
fi

# Summary
echo ""
echo "========================================="
print_status "PostgreSQL installation completed!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Create your database:"
echo "   sudo -u postgres psql"
echo ""
echo "2. In psql, run:"
echo "   CREATE DATABASE class_scheduling;"
echo "   CREATE USER app_user WITH PASSWORD 'your_password';"
echo "   GRANT ALL PRIVILEGES ON DATABASE class_scheduling TO app_user;"
echo ""
echo "Or use the fix-postgres-access.sh script to automate database creation."
echo ""
