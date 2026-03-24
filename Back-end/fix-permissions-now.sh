#!/bin/bash

# Quick fix for database permissions - run this from Back-end directory
# This uses sudo -u postgres which works with peer authentication

DB_USER="${1:-postgres}"  # Use first argument or default to postgres
DB_NAME="class_scheduling"

echo "Fixing permissions for user: $DB_USER on database: $DB_NAME"
echo ""

# Grant database privileges
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" || echo "Warning: Database privileges may already be set"

# Grant schema and object privileges (must connect to the database)
sudo -u postgres psql -d $DB_NAME << EOF
GRANT USAGE ON SCHEMA public TO $DB_USER;
GRANT ALL ON SCHEMA public TO $DB_USER;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;
EOF

echo ""
echo "✅ Permissions fixed! You can now run:"
echo "   npm run prisma:migrate"
echo "   npm run prisma:seed"
echo "   npm run build"
