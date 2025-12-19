#!/bin/bash

# Quick PostgreSQL Password Reset
# This script will temporarily allow passwordless access, reset passwords, then restore security

PG_DATA="/Library/PostgreSQL/18/data"
PG_HBA="$PG_DATA/pg_hba.conf"

echo "🔐 PostgreSQL Password Reset for 'postgres' and 'susanelv' users"
echo "================================================================"
echo ""

# Step 1: Backup
echo "📋 Step 1: Creating backup..."
sudo cp "$PG_HBA" "$PG_HBA.backup"
echo "✅ Backup created"
echo ""

# Step 2: Change md5 to trust
echo "🔧 Step 2: Temporarily allowing passwordless access..."
sudo sed -i '' 's/md5/trust/g' "$PG_HBA"
echo "✅ Modified pg_hba.conf"
echo ""

# Step 3: Reload PostgreSQL
echo "🔄 Step 3: Reloading PostgreSQL..."
sudo -u postgres /Library/PostgreSQL/18/bin/pg_ctl reload -D "$PG_DATA"
echo "✅ PostgreSQL reloaded"
echo ""

# Step 4: Get new password
echo "🔑 Step 4: Setting new password..."
echo "Enter new password for both 'postgres' and 'susanelv' users:"
read -s NEW_PASSWORD
echo ""

# Step 5: Reset passwords
echo "🔄 Resetting passwords..."
psql -U postgres <<EOF
ALTER USER postgres WITH PASSWORD '$NEW_PASSWORD';
ALTER USER susanelv WITH PASSWORD '$NEW_PASSWORD';
\q
EOF

if [ $? -eq 0 ]; then
    echo "✅ Passwords reset successfully!"
else
    echo "❌ Failed to reset passwords"
    echo "Restoring backup..."
    sudo cp "$PG_HBA.backup" "$PG_HBA"
    sudo -u postgres /Library/PostgreSQL/18/bin/pg_ctl reload -D "$PG_DATA"
    exit 1
fi

echo ""

# Step 6: Restore security
echo "🔒 Step 5: Restoring security settings..."
sudo cp "$PG_HBA.backup" "$PG_HBA"
echo "✅ Security restored"
echo ""

# Step 7: Reload again
echo "🔄 Step 6: Reloading with secure settings..."
sudo -u postgres /Library/PostgreSQL/18/bin/pg_ctl reload -D "$PG_DATA"
echo "✅ PostgreSQL reloaded"
echo ""

# Step 8: Create database
echo "📦 Step 7: Creating database..."
psql -U postgres -c "CREATE DATABASE class_scheduling;" 2>/dev/null && echo "✅ Database 'class_scheduling' created" || echo "⚠️  Database may already exist"
echo ""

echo "🎉 Password reset complete!"
echo ""
echo "📝 Your new password is: $NEW_PASSWORD"
echo ""
echo "📝 Update your .env file with:"
echo "   DATABASE_URL=\"postgresql://postgres:$NEW_PASSWORD@localhost:5432/class_scheduling?schema=public\""
echo ""

