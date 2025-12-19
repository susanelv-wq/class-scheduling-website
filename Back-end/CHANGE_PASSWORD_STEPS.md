# Step-by-Step Password Reset Guide

Run these commands **one by one** in your terminal:

## Step 1: Backup pg_hba.conf
```bash
sudo cp /Library/PostgreSQL/18/data/pg_hba.conf /Library/PostgreSQL/18/data/pg_hba.conf.backup
```
(Enter your Mac password when prompted)

## Step 2: Modify pg_hba.conf to allow passwordless connection
```bash
sudo nano /Library/PostgreSQL/18/data/pg_hba.conf
```

In the nano editor:
1. Find lines that contain `md5` (use Ctrl+W to search for "md5")
2. Change `md5` to `trust` on these lines:
   - `local   all             all                                     md5` → change to `trust`
   - `host    all             all             127.0.0.1/32            md5` → change to `trust`
   - `host    all             all             ::1/128                 md5` → change to `trust`
3. Save: Press `Ctrl+X`, then `Y`, then `Enter`

## Step 3: Reload PostgreSQL configuration
```bash
sudo -u postgres /Library/PostgreSQL/18/bin/pg_ctl reload -D /Library/PostgreSQL/18/data
```

## Step 4: Connect to PostgreSQL (no password needed now)
```bash
psql -U postgres
```

## Step 5: Reset passwords in psql
Once connected, run these SQL commands:
```sql
ALTER USER postgres WITH PASSWORD 'postgres123';
ALTER USER susanelv WITH PASSWORD 'postgres123';
\q
```
(Replace `postgres123` with your desired password)

## Step 6: Restore pg_hba.conf security
```bash
sudo cp /Library/PostgreSQL/18/data/pg_hba.conf.backup /Library/PostgreSQL/18/data/pg_hba.conf
```

## Step 7: Reload PostgreSQL again
```bash
sudo -u postgres /Library/PostgreSQL/18/bin/pg_ctl reload -D /Library/PostgreSQL/18/data
```

## Step 8: Test the new password
```bash
psql -U postgres -d postgres
```
(Enter your new password when prompted)

## Step 9: Create the database
```bash
psql -U postgres -c "CREATE DATABASE class_scheduling;"
```

## Step 10: Update your .env file
Edit `Back-end/.env` and set:
```env
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/class_scheduling?schema=public"
```
(Replace `postgres123` with the password you set in Step 5)

---

## Quick Alternative: Using sed (if you're comfortable with it)

If you prefer a faster method, you can use these commands:

```bash
# Backup
sudo cp /Library/PostgreSQL/18/data/pg_hba.conf /Library/PostgreSQL/18/data/pg_hba.conf.backup

# Change md5 to trust
sudo sed -i '' 's/md5/trust/g' /Library/PostgreSQL/18/data/pg_hba.conf

# Reload
sudo -u postgres /Library/PostgreSQL/18/bin/pg_ctl reload -D /Library/PostgreSQL/18/data

# Reset passwords (no password needed)
psql -U postgres -c "ALTER USER postgres WITH PASSWORD 'postgres123';"
psql -U postgres -c "ALTER USER susanelv WITH PASSWORD 'postgres123';"

# Restore security
sudo cp /Library/PostgreSQL/18/data/pg_hba.conf.backup /Library/PostgreSQL/18/data/pg_hba.conf

# Reload again
sudo -u postgres /Library/PostgreSQL/18/bin/pg_ctl reload -D /Library/PostgreSQL/18/data
```

