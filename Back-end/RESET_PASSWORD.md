# How to Reset PostgreSQL Password on macOS

## Method 1: Reset Password via pg_hba.conf (Recommended)

### Step 1: Find PostgreSQL data directory
```bash
psql -U postgres -c "SHOW data_directory;" 2>&1 || echo "Need to find manually"
```

Or check common locations:
- `/Library/PostgreSQL/18/data` (if installed via EnterpriseDB installer)
- `/usr/local/var/postgres` (if installed via Homebrew)
- `~/Library/Application Support/Postgres/var-18` (if using Postgres.app)

### Step 2: Locate pg_hba.conf file
The file is usually in the data directory:
```bash
# For EnterpriseDB installation
sudo find /Library/PostgreSQL -name "pg_hba.conf" 2>/dev/null

# For Homebrew installation
find /usr/local/var/postgres -name "pg_hba.conf" 2>/dev/null

# For Postgres.app
find ~/Library/Application\ Support/Postgres -name "pg_hba.conf" 2>/dev/null
```

### Step 3: Backup and modify pg_hba.conf
```bash
# Backup the file
sudo cp /path/to/pg_hba.conf /path/to/pg_hba.conf.backup

# Edit the file (use your actual path)
sudo nano /path/to/pg_hba.conf
```

Find the line that looks like:
```
local   all             all                                     md5
```
or
```
host    all             all             127.0.0.1/32            md5
```

Change `md5` to `trust` for local connections:
```
local   all             all                                     trust
host    all             all             127.0.0.1/32            trust
```

Save and exit (Ctrl+X, then Y, then Enter in nano).

### Step 4: Reload PostgreSQL configuration
```bash
# Find PostgreSQL process
ps aux | grep postgres

# Reload configuration (replace with your PostgreSQL version)
sudo -u postgres /Library/PostgreSQL/18/bin/pg_ctl reload -D /Library/PostgreSQL/18/data

# Or restart PostgreSQL service
brew services restart postgresql@18  # if using Homebrew
```

### Step 5: Reset the password
Now you can connect without a password:
```bash
psql -U postgres
```

Once connected, reset the password:
```sql
ALTER USER postgres WITH PASSWORD 'new_password';
ALTER USER susanelv WITH PASSWORD 'new_password';
\q
```

### Step 6: Restore pg_hba.conf
Change `trust` back to `md5`:
```bash
sudo nano /path/to/pg_hba.conf
```

Change back to:
```
local   all             all                                     md5
host    all             all             127.0.0.1/32            md5
```

Reload PostgreSQL again.

## Method 2: Using Homebrew (if installed via Homebrew)

If you installed PostgreSQL via Homebrew:

```bash
# Stop PostgreSQL
brew services stop postgresql@18

# Start in single-user mode
postgres --single -D /usr/local/var/postgres postgres

# In the PostgreSQL prompt, run:
ALTER USER postgres WITH PASSWORD 'new_password';
ALTER USER susanelv WITH PASSWORD 'new_password';
\q

# Restart PostgreSQL
brew services start postgresql@18
```

## Method 3: Reset via initdb (Last Resort - Deletes All Data!)

⚠️ **WARNING: This will delete all your databases!**

```bash
# Stop PostgreSQL
brew services stop postgresql@18  # or your stop command

# Remove old data directory
rm -rf /usr/local/var/postgres  # or your data directory

# Initialize new database
initdb /usr/local/var/postgres

# Start PostgreSQL
brew services start postgresql@18
```

## Method 4: Quick Fix - Create New User

If you just need to create the database, you can create a new user:

```bash
# Try connecting as postgres user (you might know this password)
psql -U postgres

# Or create a new superuser
createuser -s -P newuser
```

## After Resetting Password

Update your `.env` file:
```env
DATABASE_URL="postgresql://postgres:new_password@localhost:5432/class_scheduling?schema=public"
```

## Troubleshooting

### If you can't find pg_hba.conf:
```bash
# Search everywhere
sudo find / -name "pg_hba.conf" 2>/dev/null
```

### If PostgreSQL won't start:
```bash
# Check logs
tail -f /usr/local/var/postgres/server.log  # Homebrew
# or
tail -f /Library/PostgreSQL/18/data/log/postgresql-*.log  # EnterpriseDB
```

### If you get "permission denied":
Make sure you're using `sudo` for system-wide installations.

