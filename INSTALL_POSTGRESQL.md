# Install PostgreSQL on Alma Linux

## Quick Installation (Recommended)

Run these commands on your Alma Linux server:

```bash
# Install PostgreSQL server and client
sudo dnf install -y postgresql-server postgresql-contrib

# Initialize the database cluster
sudo postgresql-setup --initdb

# Start and enable PostgreSQL service
sudo systemctl enable postgresql
sudo systemctl start postgresql

# Verify installation
sudo systemctl status postgresql
psql --version
```

## Verify Installation

After installation, check:

```bash
# Check service status
sudo systemctl status postgresql

# Check PostgreSQL version
psql --version

# Check if postgres user exists
id postgres

# Test connection
sudo -u postgres psql -c "SELECT version();"
```

## Create Your Database

Once PostgreSQL is installed and running:

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE class_scheduling;
CREATE USER app_user WITH ENCRYPTED PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE class_scheduling TO app_user;
\c class_scheduling
GRANT ALL ON SCHEMA public TO app_user;
\q
```

## Alternative: Install Specific PostgreSQL Version

If you need a specific version (e.g., PostgreSQL 15):

```bash
# Install PostgreSQL 15 repository
sudo dnf install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-9-x86_64/pgdg-redhat-repo-latest.noarch.rpm

# Install PostgreSQL 15
sudo dnf install -y postgresql15-server postgresql15-contrib

# Initialize database
sudo /usr/pgsql-15/bin/postgresql-15-setup --initdb

# Start service
sudo systemctl enable postgresql-15
sudo systemctl start postgresql-15
```

## Troubleshooting

### If postgresql-setup command not found:

```bash
# Try alternative initialization
sudo /usr/bin/postgresql-setup --initdb

# Or manually initialize
sudo -u postgres /usr/bin/initdb -D /var/lib/pgsql/data
```

### If service won't start:

```bash
# Check logs
sudo journalctl -u postgresql -n 50

# Check data directory permissions
sudo ls -la /var/lib/pgsql/

# Fix permissions if needed
sudo chown -R postgres:postgres /var/lib/pgsql/
```

### Check PostgreSQL is listening:

```bash
# Check if PostgreSQL is listening on port 5432
sudo netstat -tulpn | grep 5432
# OR
sudo ss -tulpn | grep 5432
```

## Firewall Configuration

Allow PostgreSQL connections (if needed for remote access):

```bash
# Allow PostgreSQL port
sudo firewall-cmd --permanent --add-port=5432/tcp
sudo firewall-cmd --reload
```

**Note:** For security, only allow local connections unless you specifically need remote access.
