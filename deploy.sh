#!/bin/bash

# Deployment script for Class Scheduling Application on Alma Linux
# Run this script as root or with sudo privileges

set -e  # Exit on error

echo "========================================="
echo "Class Scheduling App Deployment Script"
echo "========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root or with sudo${NC}"
    exit 1
fi

# Variables (customize these)
APP_USER="appuser"
APP_DIR="/var/www/class-scheduling"
DOMAIN_NAME="yourdomain.com"  # Change this to your domain or IP
DB_NAME="class_scheduling"
DB_USER="app_user"
DB_PASSWORD=""  # Will prompt if empty

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Step 1: Install required packages
print_status "Installing required packages..."
dnf update -y
dnf install -y nginx
npm install -g pm2

# Step 2: Configure firewall
print_status "Configuring firewall..."
systemctl enable firewalld
systemctl start firewalld
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --permanent --add-service=ssh
firewall-cmd --reload

# Step 3: Create application user
print_status "Creating application user..."
if ! id "$APP_USER" &>/dev/null; then
    useradd -m -s /bin/bash $APP_USER
    print_status "User $APP_USER created"
else
    print_warning "User $APP_USER already exists"
fi

# Step 4: Create application directory
print_status "Creating application directory..."
mkdir -p $APP_DIR
chown -R $APP_USER:$APP_USER $APP_DIR

# Step 5: Database setup
print_status "Setting up PostgreSQL database..."

# Check if postgres user exists
if id "postgres" &>/dev/null; then
    print_status "PostgreSQL user 'postgres' exists"
    POSTGRES_USER="postgres"
elif command -v psql &> /dev/null; then
    print_warning "PostgreSQL user 'postgres' doesn't exist, trying alternative methods..."
    # Try to create postgres user
    if ! id "postgres" &>/dev/null; then
        useradd -r -s /bin/bash postgres 2>/dev/null || true
    fi
    POSTGRES_USER="postgres"
else
    print_error "PostgreSQL not found. Installing..."
    dnf install -y postgresql-server postgresql-contrib
    postgresql-setup --initdb
    systemctl enable postgresql
    systemctl start postgresql
    POSTGRES_USER="postgres"
fi

if [ -z "$DB_PASSWORD" ]; then
    read -sp "Enter database password for $DB_USER: " DB_PASSWORD
    echo
fi

# Try multiple methods to access PostgreSQL
print_status "Creating database and user..."

# Method 1: Try with postgres user
if sudo -u $POSTGRES_USER psql -c "\l" &>/dev/null; then
    sudo -u $POSTGRES_USER psql << EOF
-- Create database if not exists
SELECT 'CREATE DATABASE $DB_NAME'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')\gexec

-- Create user if not exists
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = '$DB_USER') THEN
        CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASSWORD';
    END IF;
END
\$\$;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
\q
EOF
# Method 2: Try direct psql
elif psql postgres -c "\l" &>/dev/null; then
    psql postgres << EOF
SELECT 'CREATE DATABASE $DB_NAME'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')\gexec

DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = '$DB_USER') THEN
        CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASSWORD';
    END IF;
END
\$\$;

GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
\q
EOF
# Method 3: Use createdb command
elif command -v createdb &> /dev/null; then
    createdb $DB_NAME 2>/dev/null || true
    psql postgres -c "CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASSWORD';" 2>/dev/null || true
    psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>/dev/null || true
else
    print_error "Could not access PostgreSQL. Please set up database manually."
    print_warning "See POSTGRESQL_FIX.md for troubleshooting steps"
    exit 1
fi

print_status "Database setup completed"

# Step 6: Copy application files
print_status "Please ensure your application code is in $APP_DIR"
print_warning "If not, please clone/copy your repository there"
read -p "Press Enter to continue after ensuring code is in place..."

# Step 7: Setup backend
print_status "Setting up backend..."
cd $APP_DIR/Back-end

# Install dependencies as app user
sudo -u $APP_USER npm install

# Create .env file
if [ ! -f .env ]; then
    print_status "Creating backend .env file..."
    read -p "Enter JWT Secret (or press Enter for default): " JWT_SECRET
    JWT_SECRET=${JWT_SECRET:-"$(openssl rand -base64 32)"}
    
    sudo -u $APP_USER cat > .env << EOF
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME?schema=public"
JWT_SECRET="$JWT_SECRET"
JWT_EXPIRE="7d"
PORT=3001
NODE_ENV=production
CORS_ORIGIN="https://$DOMAIN_NAME"
EOF
    print_status "Backend .env file created"
else
    print_warning "Backend .env file already exists, skipping..."
fi

# Generate Prisma Client and run migrations
sudo -u $APP_USER npm run prisma:generate
sudo -u $APP_USER npm run prisma:migrate
sudo -u $APP_USER npm run build

# Step 8: Setup frontend
print_status "Setting up frontend..."
cd $APP_DIR

# Install dependencies
sudo -u $APP_USER npm install

# Create .env.local file
if [ ! -f .env.local ]; then
    print_status "Creating frontend .env.local file..."
    sudo -u $APP_USER cat > .env.local << EOF
NEXT_PUBLIC_API_URL=https://$DOMAIN_NAME/api
EOF
    print_status "Frontend .env.local file created"
else
    print_warning "Frontend .env.local file already exists, skipping..."
fi

# Build frontend
sudo -u $APP_USER npm run build

# Step 9: Setup PM2
print_status "Setting up PM2..."
cd $APP_DIR

# Create log directory
mkdir -p /var/log/pm2
chown -R $APP_USER:$APP_USER /var/log/pm2

# Start applications with PM2
sudo -u $APP_USER pm2 start pm2.config.js
sudo -u $APP_USER pm2 save

# Setup PM2 startup script
print_status "Setting up PM2 startup script..."
STARTUP_CMD=$(sudo -u $APP_USER pm2 startup systemd -u $APP_USER --hp /home/$APP_USER | grep "sudo")
if [ ! -z "$STARTUP_CMD" ]; then
    eval $STARTUP_CMD
    print_status "PM2 startup script configured"
fi

# Step 10: Configure Nginx
print_status "Configuring Nginx..."

# Copy nginx configuration
if [ -f "$APP_DIR/nginx.conf" ]; then
    # Replace domain name in nginx.conf
    sed "s/yourdomain.com/$DOMAIN_NAME/g" $APP_DIR/nginx.conf > /etc/nginx/conf.d/class-scheduling.conf
    print_status "Nginx configuration copied"
else
    print_error "nginx.conf not found in $APP_DIR"
    print_warning "Please manually configure Nginx"
fi

# Test and start Nginx
nginx -t
systemctl enable nginx
systemctl start nginx
systemctl reload nginx

print_status "Nginx configured and started"

# Step 11: Summary
echo ""
echo "========================================="
print_status "Deployment completed!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Update domain name in Nginx config: /etc/nginx/conf.d/class-scheduling.conf"
echo "2. Update domain name in frontend .env.local: $APP_DIR/.env.local"
echo "3. Update CORS_ORIGIN in backend .env: $APP_DIR/Back-end/.env"
echo "4. (Optional) Setup SSL with Let's Encrypt:"
echo "   sudo certbot --nginx -d $DOMAIN_NAME"
echo ""
echo "Check status:"
echo "  pm2 status"
echo "  sudo systemctl status nginx"
echo ""
echo "View logs:"
echo "  pm2 logs"
echo "  sudo tail -f /var/log/nginx/error.log"
echo ""
