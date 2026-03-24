# PostgreSQL Access Fix for Alma Linux

## Problem
The `postgres` user doesn't exist, so you can't use `sudo -u postgres psql`.

## Solution: Check PostgreSQL Installation

First, let's determine how PostgreSQL was installed:

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Check PostgreSQL version
psql --version

# Find PostgreSQL data directory
sudo find / -name "postgresql.conf" 2>/dev/null
```

## Method 1: Create the postgres User (Recommended)

If PostgreSQL is installed but the user doesn't exist:

```bash
# Create the postgres user
sudo useradd -r -s /bin/bash postgres

# Find PostgreSQL installation directory
PG_DIR=$(sudo find / -name "postgresql.conf" 2>/dev/null | head -1 | xargs dirname)

# Set ownership of PostgreSQL data directory
if [ -n "$PG_DIR" ]; then
    sudo chown -R postgres:postgres "$PG_DIR"
fi

# Now try accessing PostgreSQL
sudo -u postgres psql
```

## Method 2: Access PostgreSQL as Root

If PostgreSQL allows local connections without authentication:

```bash
# Try connecting directly
psql -U postgres

# Or connect to default database
psql postgres

# If that doesn't work, try as root
psql -U $(whoami) postgres
```

## Method 3: Find the Actual PostgreSQL User

```bash
# List all users on the system
cat /etc/passwd | grep postgres

# Check what user owns PostgreSQL files
sudo ls -la /var/lib/pgsql 2>/dev/null || sudo ls -la /usr/local/pgsql 2>/dev/null

# Check PostgreSQL process owner
ps aux | grep postgres
```

## Method 4: Reinstall PostgreSQL Properly (If Needed)

If PostgreSQL isn't properly installed:

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

## Method 5: Direct Database Creation (If You Can Access psql)

If you can access `psql` in any way, create the database directly:

```bash
# Connect to PostgreSQL (use whichever method works)
psql postgres
# OR
psql -U postgres
# OR
psql -U $(whoami) postgres

# Once connected, run these SQL commands:
CREATE DATABASE class_scheduling;
CREATE USER app_user WITH ENCRYPTED PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE class_scheduling TO app_user;
\q
```

## Method 6: Using createdb Command

If you have PostgreSQL client tools:

```bash
# Create database directly
createdb class_scheduling

# Create user (if you can access psql)
psql postgres -c "CREATE USER app_user WITH ENCRYPTED PASSWORD 'your_password';"
psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE class_scheduling TO app_user;"
```

## Quick Diagnostic Commands

Run these to understand your PostgreSQL setup:

```bash
# Check if PostgreSQL service exists
sudo systemctl list-units | grep postgres

# Check PostgreSQL installation
rpm -qa | grep postgres

# Check PostgreSQL data directory location
sudo find /var/lib -name "PG_VERSION" 2>/dev/null
sudo find /usr/local -name "PG_VERSION" 2>/dev/null

# Check PostgreSQL configuration
sudo find /etc -name "postgresql.conf" 2>/dev/null
```

## After Fixing Access

Once you can access PostgreSQL, create the database and user:

```sql
-- Connect to PostgreSQL (use the method that worked)
-- Then run:

CREATE DATABASE class_scheduling;

CREATE USER app_user WITH ENCRYPTED PASSWORD 'your_secure_password_here';

GRANT ALL PRIVILEGES ON DATABASE class_scheduling TO app_user;

-- Connect to the new database to grant schema privileges
\c class_scheduling

GRANT ALL ON SCHEMA public TO app_user;

\q
```

## Update Your .env File

After creating the database, update your backend `.env`:

```env
DATABASE_URL="postgresql://app_user:your_secure_password_here@localhost:5432/class_scheduling?schema=public"
```
