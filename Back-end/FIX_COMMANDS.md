# Fixed Commands - Copy and Paste These

## The Problem
You used curly quotes `"` instead of straight quotes `'`, and the password needs to be in single quotes.

## Step-by-Step Fix

### First, allow passwordless access temporarily:

```bash
# 1. Backup
sudo cp /Library/PostgreSQL/18/data/pg_hba.conf /Library/PostgreSQL/18/data/pg_hba.conf.backup

# 2. Change md5 to trust
sudo sed -i '' 's/md5/trust/g' /Library/PostgreSQL/18/data/pg_hba.conf

# 3. Reload PostgreSQL
sudo -u postgres /Library/PostgreSQL/18/bin/pg_ctl reload -D /Library/PostgreSQL/18/data
```

### Then reset passwords (use SINGLE quotes around the password):

```bash
# Reset postgres user password
psql -U postgres -c "ALTER USER postgres WITH PASSWORD 'susanelv';"

# Reset susanelv user password  
psql -U postgres -c "ALTER USER susanelv WITH PASSWORD 'susanelv';"
```

### Restore security:

```bash
# Restore backup
sudo cp /Library/PostgreSQL/18/data/pg_hba.conf.backup /Library/PostgreSQL/18/data/pg_hba.conf

# Reload
sudo -u postgres /Library/PostgreSQL/18/bin/pg_ctl reload -D /Library/PostgreSQL/18/data
```

### Create database:

```bash
psql -U postgres -c "CREATE DATABASE class_scheduling;"
```

---

## All Commands in One Block (Copy All):

```bash
sudo cp /Library/PostgreSQL/18/data/pg_hba.conf /Library/PostgreSQL/18/data/pg_hba.conf.backup && sudo sed -i '' 's/md5/trust/g' /Library/PostgreSQL/18/data/pg_hba.conf && sudo -u postgres /Library/PostgreSQL/18/bin/pg_ctl reload -D /Library/PostgreSQL/18/data && psql -U postgres -c "ALTER USER postgres WITH PASSWORD 'susanelv';" && psql -U postgres -c "ALTER USER susanelv WITH PASSWORD 'susanelv';" && sudo cp /Library/PostgreSQL/18/data/pg_hba.conf.backup /Library/PostgreSQL/18/data/pg_hba.conf && sudo -u postgres /Library/PostgreSQL/18/bin/pg_ctl reload -D /Library/PostgreSQL/18/data && psql -U postgres -c "CREATE DATABASE class_scheduling;"
```

