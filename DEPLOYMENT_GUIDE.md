# Complete Deployment Guide for Alma Linux VPS

This guide will help you deploy your fullstack application (Next.js frontend + Express backend) on Alma Linux using Nginx and PM2.

## Prerequisites

- Alma Linux VPS with root/sudo access
- Git and Node.js already installed
- Domain name (optional, but recommended)

## Step 1: Install Required Software

```bash
# Update system packages
sudo dnf update -y

# Install PostgreSQL (if not already installed)
sudo dnf install -y postgresql-server postgresql-contrib

# Initialize PostgreSQL database cluster
sudo postgresql-setup --initdb

# Start and enable PostgreSQL
sudo systemctl enable postgresql
sudo systemctl start postgresql

# Verify PostgreSQL installation
sudo systemctl status postgresql
psql --version

# Install Nginx
sudo dnf install nginx -y

# Install PM2 globally
sudo npm install -g pm2

# Install build tools (if not already installed)
sudo dnf groupinstall "Development Tools" -y
sudo dnf install python3 -y
```

**Note:** If PostgreSQL installation fails or you need a specific version, see `INSTALL_POSTGRESQL.md` for detailed instructions.

## Step 2: Configure Firewall

```bash
# Enable and start firewalld
sudo systemctl enable firewalld
sudo systemctl start firewalld

# Allow HTTP, HTTPS, and SSH
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-service=ssh

# Reload firewall
sudo firewall-cmd --reload
```

## Step 3: Set Up PostgreSQL Database

### Option A: If postgres user exists (Standard Method)

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL prompt, create database and user:
CREATE DATABASE class_scheduling;
CREATE USER app_user WITH ENCRYPTED PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE class_scheduling TO app_user;
\q
```

### Option B: If postgres user doesn't exist (Alma Linux Fix)

**First, check PostgreSQL installation:**
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Check PostgreSQL version
psql --version
```

**Method 1: Create postgres user**
```bash
# Create the postgres user
sudo useradd -r -s /bin/bash postgres

# Find and set ownership of PostgreSQL data directory
PG_DIR=$(sudo find / -name "postgresql.conf" 2>/dev/null | head -1 | xargs dirname)
if [ -n "$PG_DIR" ]; then
    sudo chown -R postgres:postgres "$PG_DIR"
fi

# Now access PostgreSQL
sudo -u postgres psql
```

**Method 2: Reinstall PostgreSQL properly**
```bash
# Install PostgreSQL from official repository
sudo dnf install -y postgresql-server postgresql-contrib

# Initialize the database
sudo postgresql-setup --initdb

# Start and enable PostgreSQL
sudo systemctl enable postgresql
sudo systemctl start postgresql

# Now the postgres user should exist
sudo -u postgres psql
```

**Method 3: Direct access (if psql works)**
```bash
# Try connecting directly
psql postgres
# OR
psql -U postgres

# Once connected, run the SQL commands from Option A above
```

**Method 4: Using command line directly**
```bash
# Create database
createdb class_scheduling

# Create user and grant privileges
psql postgres -c "CREATE USER app_user WITH ENCRYPTED PASSWORD 'your_secure_password_here';"
psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE class_scheduling TO app_user;"
psql class_scheduling -c "GRANT ALL ON SCHEMA public TO app_user;"
```

**If you encounter issues, see `POSTGRESQL_FIX.md` for detailed troubleshooting.**

## Step 4: Create Application User and Directory

```bash
# Create a non-root user for the application
sudo useradd -m -s /bin/bash appuser

# Create application directory
sudo mkdir -p /var/www/class-scheduling
sudo chown -R appuser:appuser /var/www/class-scheduling

# Switch to app user
sudo su - appuser
```

## Step 5: Clone and Set Up Application

```bash
# Navigate to application directory
cd /var/www/class-scheduling

# Clone your repository (replace with your actual repo URL)
git clone https://github.com/yourusername/class-scheduling-website.git .

# Or if you already have the code, copy it to this location
```

## Step 6: Backend Setup

```bash
# Navigate to backend directory
cd /var/www/class-scheduling/Back-end

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
DATABASE_URL="postgresql://app_user:your_secure_password_here@localhost:5432/class_scheduling?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-to-random-string"
JWT_EXPIRE="7d"
PORT=3001
NODE_ENV=production
CORS_ORIGIN="https://yourdomain.com"
EOF

# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# (Optional) Seed the database
npm run prisma:seed

# Build the TypeScript code
npm run build
```

## Step 7: Frontend Setup

```bash
# Navigate to root directory
cd /var/www/class-scheduling

# Install dependencies
npm install

# Create .env.local file
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
EOF

# Build the Next.js application
npm run build
```

## Step 8: Configure PM2

```bash
# Navigate back to application root
cd /var/www/class-scheduling

# Use the PM2 ecosystem file (see pm2.config.js)
pm2 start pm2.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup systemd -u appuser --hp /home/appuser
# Follow the instructions provided by the command above
```

## Step 9: Configure Nginx

```bash
# Switch back to root user
exit

# Create Nginx configuration
sudo nano /etc/nginx/conf.d/class-scheduling.conf
```

Copy the configuration from `nginx.conf` file (see below) or use the provided template.

```bash
# Test Nginx configuration
sudo nginx -t

# Enable and start Nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# Reload Nginx
sudo systemctl reload nginx
```

## Step 10: Set Up SSL with Let's Encrypt (Optional but Recommended)

```bash
# Install Certbot
sudo dnf install certbot python3-certbot-nginx -y

# Obtain SSL certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Certbot will automatically configure Nginx and set up auto-renewal
```

## Step 11: Verify Deployment

```bash
# Check PM2 status
pm2 status

# Check PM2 logs
pm2 logs

# Check Nginx status
sudo systemctl status nginx

# Check backend health
curl http://localhost:3001/health

# Check if services are running
sudo systemctl status nginx
pm2 list
```

## Useful Commands

### PM2 Commands
```bash
pm2 status              # Check status
pm2 logs                # View logs
pm2 restart all         # Restart all apps
pm2 restart backend     # Restart backend only
pm2 restart frontend    # Restart frontend only
pm2 stop all            # Stop all apps
pm2 delete all          # Delete all apps
pm2 monit               # Monitor resources
```

### Nginx Commands
```bash
sudo systemctl status nginx    # Check status
sudo systemctl restart nginx   # Restart Nginx
sudo systemctl reload nginx    # Reload configuration
sudo nginx -t                  # Test configuration
```

### Database Commands
```bash
# Connect to database
sudo -u postgres psql -d class_scheduling

# Backup database
sudo -u postgres pg_dump class_scheduling > backup.sql

# Restore database
sudo -u postgres psql class_scheduling < backup.sql
```

## Troubleshooting

### Backend not starting
- Check PM2 logs: `pm2 logs backend`
- Verify database connection in `.env`
- Check if port 3001 is available: `sudo netstat -tulpn | grep 3001`

### Frontend not loading
- Check PM2 logs: `pm2 logs frontend`
- Verify build completed: `ls -la .next`
- Check Nginx error logs: `sudo tail -f /var/log/nginx/error.log`

### Database connection issues
- Verify PostgreSQL is running: `sudo systemctl status postgresql`
- Check database credentials in `.env`
- Test connection: `psql -U app_user -d class_scheduling -h localhost`

### Nginx 502 Bad Gateway
- Check if backend is running: `pm2 status`
- Verify backend port in Nginx config matches backend PORT
- Check Nginx error logs: `sudo tail -f /var/log/nginx/error.log`

## Security Recommendations

1. **Change default passwords**: Update all default passwords in `.env` files
2. **Use strong JWT secret**: Generate a random string for JWT_SECRET
3. **Keep system updated**: Regularly run `sudo dnf update`
4. **Configure fail2ban**: Install and configure fail2ban for SSH protection
5. **Regular backups**: Set up automated database backups
6. **Monitor logs**: Regularly check application and system logs

## Updating the Application

```bash
# Switch to app user
sudo su - appuser

# Navigate to application directory
cd /var/www/class-scheduling

# Pull latest changes
git pull origin main

# Backend update
cd Back-end
npm install
npm run prisma:generate
npm run prisma:migrate
npm run build
cd ..

# Frontend update
npm install
npm run build

# Restart PM2 applications
pm2 restart all

# Exit app user
exit
```

## File Structure on Server

```
/var/www/class-scheduling/
├── Back-end/
│   ├── .env
│   ├── dist/
│   └── ...
├── .env.local
├── .next/
├── pm2.config.js
└── ...
```
