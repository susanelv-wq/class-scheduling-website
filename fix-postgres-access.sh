#!/bin/bash

# PostgreSQL Access Fix Script for Alma Linux
# Run this script to diagnose and fix PostgreSQL access issues

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
echo "PostgreSQL Access Diagnostic & Fix Tool"
echo "========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    print_error "Please run as root or with sudo"
    exit 1
fi

# Step 1: Check PostgreSQL installation
print_step "Step 1: Checking PostgreSQL installation..."
if command -v psql &> /dev/null; then
    PSQL_VERSION=$(psql --version)
    print_status "PostgreSQL found: $PSQL_VERSION"
else
    print_error "PostgreSQL client not found!"
    read -p "Install PostgreSQL? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Installing PostgreSQL..."
        dnf install -y postgresql-server postgresql-contrib
        postgresql-setup --initdb
        systemctl enable postgresql
        systemctl start postgresql
        print_status "PostgreSQL installed and started"
    else
        print_error "Cannot proceed without PostgreSQL"
        exit 1
    fi
fi

# Step 2: Check if PostgreSQL service is running
print_step "Step 2: Checking PostgreSQL service..."
if systemctl is-active --quiet postgresql; then
    print_status "PostgreSQL service is running"
else
    print_warning "PostgreSQL service is not running"
    systemctl start postgresql
    sleep 2
    if systemctl is-active --quiet postgresql; then
        print_status "PostgreSQL service started"
    else
        print_error "Failed to start PostgreSQL service"
        exit 1
    fi
fi

# Step 3: Check for postgres user
print_step "Step 3: Checking for postgres user..."
if id "postgres" &>/dev/null; then
    print_status "User 'postgres' exists"
    POSTGRES_USER_EXISTS=true
else
    print_warning "User 'postgres' does not exist"
    POSTGRES_USER_EXISTS=false
fi

# Step 4: Find PostgreSQL data directory
print_step "Step 4: Finding PostgreSQL data directory..."
PG_CONF=$(find /var/lib /usr/local /opt -name "postgresql.conf" 2>/dev/null | head -1)
if [ -n "$PG_CONF" ]; then
    PG_DATA_DIR=$(dirname "$PG_CONF")
    print_status "PostgreSQL data directory: $PG_DATA_DIR"
else
    print_warning "Could not find postgresql.conf"
    PG_DATA_DIR="/var/lib/pgsql/data"
    print_status "Using default: $PG_DATA_DIR"
fi

# Step 5: Fix postgres user if needed
if [ "$POSTGRES_USER_EXISTS" = false ]; then
    print_step "Step 5: Creating postgres user..."
    useradd -r -s /bin/bash postgres 2>/dev/null || true
    
    if id "postgres" &>/dev/null; then
        print_status "User 'postgres' created"
        
        # Set ownership of data directory if it exists
        if [ -d "$PG_DATA_DIR" ]; then
            print_status "Setting ownership of $PG_DATA_DIR to postgres user"
            chown -R postgres:postgres "$PG_DATA_DIR"
        fi
    else
        print_error "Failed to create postgres user"
    fi
fi

# Step 6: Test PostgreSQL access
print_step "Step 6: Testing PostgreSQL access..."

# Test method 1: sudo -u postgres
if sudo -u postgres psql -c "\l" &>/dev/null 2>&1; then
    print_status "✓ Access via 'sudo -u postgres psql' works!"
    ACCESS_METHOD="sudo -u postgres psql"
elif psql postgres -c "\l" &>/dev/null 2>&1; then
    print_status "✓ Access via 'psql postgres' works!"
    ACCESS_METHOD="psql postgres"
elif psql -U postgres -c "\l" &>/dev/null 2>&1; then
    print_status "✓ Access via 'psql -U postgres' works!"
    ACCESS_METHOD="psql -U postgres"
else
    print_error "Cannot access PostgreSQL with any method"
    print_warning "You may need to configure pg_hba.conf"
    print_status "Trying to find and configure pg_hba.conf..."
    
    PG_HBA=$(find "$PG_DATA_DIR" -name "pg_hba.conf" 2>/dev/null | head -1)
    if [ -n "$PG_HBA" ]; then
        print_status "Found pg_hba.conf at: $PG_HBA"
        print_warning "You may need to edit this file to allow local connections"
        print_status "Backing up pg_hba.conf..."
        cp "$PG_HBA" "${PG_HBA}.backup"
        
        # Try to add trust method for local connections
        if ! grep -q "local.*all.*all.*trust" "$PG_HBA"; then
            print_status "Adding trust method for local connections..."
            echo "local   all             all                                     trust" >> "$PG_HBA"
            echo "host    all             all             127.0.0.1/32            trust" >> "$PG_HBA"
            
            # Reload PostgreSQL
            if systemctl is-active --quiet postgresql; then
                systemctl reload postgresql
                sleep 1
            fi
        fi
        
        # Test again
        if psql postgres -c "\l" &>/dev/null 2>&1; then
            print_status "✓ Access now works after pg_hba.conf update!"
            ACCESS_METHOD="psql postgres"
        else
            print_error "Still cannot access PostgreSQL"
            print_warning "Please manually configure pg_hba.conf or check PostgreSQL logs"
            exit 1
        fi
    else
        print_error "Could not find pg_hba.conf"
        exit 1
    fi
fi

# Step 7: Create database and user
print_step "Step 7: Creating database and user..."

read -p "Enter database name [class_scheduling]: " DB_NAME
DB_NAME=${DB_NAME:-class_scheduling}

read -p "Enter database user [app_user]: " DB_USER
DB_USER=${DB_USER:-app_user}

read -sp "Enter password for $DB_USER: " DB_PASSWORD
echo

# Create database
print_status "Creating database '$DB_NAME'..."
if [ "$ACCESS_METHOD" = "sudo -u postgres psql" ]; then
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" 2>/dev/null && print_status "Database created" || print_warning "Database may already exist"
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASSWORD';" 2>/dev/null && print_status "User created" || print_warning "User may already exist"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
    sudo -u postgres psql -d $DB_NAME -c "GRANT ALL ON SCHEMA public TO $DB_USER;"
else
    psql postgres -c "CREATE DATABASE $DB_NAME;" 2>/dev/null && print_status "Database created" || print_warning "Database may already exist"
    psql postgres -c "CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASSWORD';" 2>/dev/null && print_status "User created" || print_warning "User may already exist"
    psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
    psql -d $DB_NAME -c "GRANT ALL ON SCHEMA public TO $DB_USER;"
fi

# Summary
echo ""
echo "========================================="
print_status "Setup completed successfully!"
echo "========================================="
echo ""
echo "Database Information:"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo "  Password: [hidden]"
echo ""
echo "Connection String:"
echo "  postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME?schema=public"
echo ""
echo "Access Method: $ACCESS_METHOD"
echo ""
print_status "You can now update your .env file with the connection string above"
