-- Fix Database Permissions Script
-- Run this script as a PostgreSQL superuser (usually 'postgres')
-- 
-- Usage:
--   psql -U postgres -d class_scheduling -f fix-database-permissions.sql
--   OR
--   sudo -u postgres psql -d class_scheduling -f fix-database-permissions.sql

-- Replace 'YOUR_USER' with your actual database user (app_user or postgres)
-- If using app_user, uncomment and modify the lines below
-- If using postgres user, the commands should work as-is

-- Grant all privileges on the database
GRANT ALL PRIVILEGES ON DATABASE class_scheduling TO postgres;

-- Connect to the database (this needs to be run separately or in psql)
\c class_scheduling

-- Grant usage on the public schema
GRANT USAGE ON SCHEMA public TO postgres;

-- Grant all privileges on the public schema
GRANT ALL ON SCHEMA public TO postgres;

-- Grant all privileges on all existing tables
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;

-- Grant all privileges on all existing sequences
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres;

-- Set default privileges for future sequences
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;

-- If you're using app_user instead of postgres, uncomment and modify these:
/*
GRANT ALL PRIVILEGES ON DATABASE class_scheduling TO app_user;
\c class_scheduling
GRANT USAGE ON SCHEMA public TO app_user;
GRANT ALL ON SCHEMA public TO app_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO app_user;
*/
