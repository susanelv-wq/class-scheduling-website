# Database Setup Guide

## Prerequisites

Make sure PostgreSQL is installed on your system.

### Check if PostgreSQL is installed:
```bash
psql --version
```

### If not installed, install PostgreSQL:

**macOS (using Homebrew):**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**macOS (using Postgres.app):**
Download from: https://postgresapp.com/

**Windows:**
Download from: https://www.postgresql.org/download/windows/

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

## Method 1: Using psql Command Line

### Step 1: Connect to PostgreSQL
```bash
psql postgres
```

Or if you have a specific user:
```bash
psql -U postgres
```

### Step 2: Create a new database
```sql
CREATE DATABASE class_scheduling;
```

### Step 3: Create a user (optional, but recommended)
```sql
CREATE USER class_user WITH PASSWORD 'your_secure_password';
```

### Step 4: Grant privileges
```sql
GRANT ALL PRIVILEGES ON DATABASE class_scheduling TO class_user;
```

### Step 5: Connect to the new database
```sql
\c class_scheduling
```

### Step 6: Exit psql
```sql
\q
```

## Method 2: Using SQL Command Directly

You can create the database in one command:

```bash
createdb class_scheduling
```

Or with a specific user:
```bash
createdb -U postgres class_scheduling
```

## Method 3: Using Docker (Quick Setup)

If you prefer using Docker:

```bash
# Run PostgreSQL in a Docker container
docker run --name class-scheduling-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=class_scheduling \
  -p 5432:5432 \
  -d postgres:14
```

This creates:
- Database name: `class_scheduling`
- Username: `postgres`
- Password: `postgres`
- Port: `5432`

## Method 4: Using pgAdmin (GUI Tool)

1. Download and install pgAdmin from: https://www.pgadmin.org/
2. Open pgAdmin
3. Right-click on "Databases" → "Create" → "Database"
4. Enter database name: `class_scheduling`
5. Click "Save"

## Configure Your .env File

After creating the database, update your `.env` file in the `Back-end` directory:

```env
# If using default postgres user
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/class_scheduling?schema=public"

# If you created a custom user
DATABASE_URL="postgresql://class_user:your_secure_password@localhost:5432/class_scheduling?schema=public"

# If using Docker (default)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/class_scheduling?schema=public"
```

## Verify Database Connection

Test the connection:

```bash
psql -d class_scheduling -U postgres
```

Or with your custom user:
```bash
psql -d class_scheduling -U class_user
```

## Initialize Database with Prisma

Once your database is created and `.env` is configured:

```bash
cd Back-end

# Generate Prisma Client
npm run prisma:generate

# Run migrations to create tables
npm run prisma:migrate

# (Optional) Seed the database with sample data
npm run prisma:seed
```

## Troubleshooting

### Connection refused error:
- Make sure PostgreSQL service is running:
  ```bash
  # macOS
  brew services start postgresql@14
  
  # Linux
  sudo systemctl start postgresql
  
  # Check status
  brew services list  # macOS
  sudo systemctl status postgresql  # Linux
  ```

### Authentication failed:
- Check your username and password in the DATABASE_URL
- Verify PostgreSQL authentication settings in `pg_hba.conf`

### Database does not exist:
- Make sure you created the database first
- Check the database name in your DATABASE_URL matches exactly

### Port already in use:
- Check if PostgreSQL is already running on port 5432
- Change the port in your DATABASE_URL if needed

