# Immediate Fix for PostgreSQL Access Error

## The Errors
```
sudo: unknown user: postgres
Unit postgresql.service could not be found.
```

**This means PostgreSQL is not installed!**

## Solution: Install PostgreSQL First

### Quick Install (Run on your server):

```bash
# Install PostgreSQL
sudo dnf install -y postgresql-server postgresql-contrib

# Initialize database
sudo postgresql-setup --initdb

# Start PostgreSQL
sudo systemctl enable postgresql
sudo systemctl start postgresql

# Verify
sudo systemctl status postgresql
psql --version
```

### Or Use the Installation Script:

```bash
# Upload install-postgresql.sh to your server, then:
sudo chmod +x install-postgresql.sh
sudo ./install-postgresql.sh
```

## After Installation

Once PostgreSQL is installed, create your database:

```bash
sudo -u postgres psql
```

Then in psql:
```sql
CREATE DATABASE class_scheduling;
CREATE USER app_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE class_scheduling TO app_user;
\q
```

## Quick Solutions (Choose One)

### Solution 1: Create the postgres user (Fastest)

```bash
# Create the postgres user
sudo useradd -r -s /bin/bash postgres

# Find PostgreSQL data directory and set ownership
PG_DIR=$(sudo find /var/lib /usr/local -name "postgresql.conf" 2>/dev/null | head -1 | xargs dirname)
if [ -n "$PG_DIR" ]; then
    sudo chown -R postgres:postgres "$PG_DIR"
fi

# Now try again
sudo -u postgres psql
```

### Solution 2: Use the automated fix script

```bash
# Upload fix-postgres-access.sh to your server, then run:
sudo chmod +x fix-postgres-access.sh
sudo ./fix-postgres-access.sh
```

This script will:
- Check PostgreSQL installation
- Create postgres user if needed
- Configure access
- Create your database and user automatically

### Solution 3: Access PostgreSQL directly (if psql works)

```bash
# Try connecting without sudo
psql postgres

# If that works, create database directly:
psql postgres -c "CREATE DATABASE class_scheduling;"
psql postgres -c "CREATE USER app_user WITH ENCRYPTED PASSWORD 'your_password';"
psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE class_scheduling TO app_user;"
```

### Solution 4: Reinstall PostgreSQL properly

```bash
# Install PostgreSQL
sudo dnf install -y postgresql-server postgresql-contrib

# Initialize database (this creates the postgres user)
sudo postgresql-setup --initdb

# Start PostgreSQL
sudo systemctl enable postgresql
sudo systemctl start postgresql

# Now postgres user should exist
sudo -u postgres psql
```

## After Fixing Access

Once you can access PostgreSQL, create your database:

```sql
CREATE DATABASE class_scheduling;
CREATE USER app_user WITH ENCRYPTED PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE class_scheduling TO app_user;
\c class_scheduling
GRANT ALL ON SCHEMA public TO app_user;
\q
```

## Recommended: Use the Fix Script

The easiest way is to use the automated script:

```bash
sudo ./fix-postgres-access.sh
```

It will guide you through the entire process and create the database automatically.
