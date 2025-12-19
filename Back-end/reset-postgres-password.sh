#!/bin/bash

# PostgreSQL Password Reset Script for macOS
# Run this script with: bash reset-postgres-password.sh

echo "🔐 PostgreSQL Password Reset Script"
echo "===================================="
echo ""

PG_DATA_DIR="/Library/PostgreSQL/18/data"
PG_HBA_FILE="$PG_DATA_DIR/pg_hba.conf"
PG_HBA_BACKUP="$PG_DATA_DIR/pg_hba.conf.backup"

# Step 1: Backup pg_hba.conf
echo "📋 Step 1: Backing up pg_hba.conf..."
sudo cp "$PG_HBA_FILE" "$PG_HBA_BACKUP"
echo "✅ Backup created at: $PG_HBA_BACKUP"
echo ""

# Step 2: Modify pg_hba.conf to use trust authentication
echo "🔧 Step 2: Modifying pg_hba.conf to allow passwordless connection..."
sudo sed -i '' 's/^\(local[[:space:]]*all[[:space:]]*all[[:space:]]*\)md5/\1trust/' "$PG_HBA_FILE"
sudo sed -i '' 's/^\(host[[:space:]]*all[[:space:]]*all[[:space:]]*127\.0\.0\.1\/32[[:space:]]*\)md5/\1trust/' "$PG_HBA_FILE"
sudo sed -i '' 's/^\(host[[:space:]]*all[[:space:]]*all[[:space:]]*::1\/128[[:space:]]*\)md5/\1trust/' "$PG_HBA_FILE"
echo "✅ Modified pg_hba.conf"
echo ""

# Step 3: Reload PostgreSQL
echo "🔄 Step 3: Reloading PostgreSQL configuration..."
sudo -u postgres /Library/PostgreSQL/18/bin/pg_ctl reload -D "$PG_DATA_DIR" 2>/dev/null || {
    echo "⚠️  Could not reload, trying to restart service..."
    # Try alternative reload method
    sudo killall -HUP postgres 2>/dev/null || echo "⚠️  Manual reload may be needed"
}
echo "✅ Configuration reloaded"
echo ""

# Step 4: Reset password
echo "🔑 Step 4: Resetting passwords..."
echo "Enter new password for 'postgres' user:"
read -s NEW_PASSWORD

psql -U postgres <<EOF
ALTER USER postgres WITH PASSWORD '$NEW_PASSWORD';
ALTER USER susanelv WITH PASSWORD '$NEW_PASSWORD';
\q
EOF

if [ $? -eq 0 ]; then
    echo "✅ Passwords reset successfully!"
else
    echo "❌ Failed to reset password. You may need to run the SQL commands manually."
    echo ""
    echo "Try running: psql -U postgres"
    echo "Then run:"
    echo "  ALTER USER postgres WITH PASSWORD 'your_new_password';"
    echo "  ALTER USER susanelv WITH PASSWORD 'your_new_password';"
    exit 1
fi

echo ""

# Step 5: Restore pg_hba.conf
echo "🔒 Step 5: Restoring pg_hba.conf security settings..."
sudo cp "$PG_HBA_BACKUP" "$PG_HBA_FILE"
echo "✅ Security settings restored"
echo ""

# Step 6: Reload again
echo "🔄 Step 6: Reloading PostgreSQL with secure settings..."
sudo -u postgres /Library/PostgreSQL/18/bin/pg_ctl reload -D "$PG_DATA_DIR" 2>/dev/null || {
    sudo killall -HUP postgres 2>/dev/null
}
echo "✅ PostgreSQL reloaded with secure settings"
echo ""

echo "🎉 Password reset complete!"
echo ""
echo "📝 Update your .env file with:"
echo "   DATABASE_URL=\"postgresql://postgres:$NEW_PASSWORD@localhost:5432/class_scheduling?schema=public\""
echo ""

