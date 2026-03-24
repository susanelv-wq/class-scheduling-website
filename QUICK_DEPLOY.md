# Quick Deployment Reference

## Quick Start (Automated)

1. **Upload files to server** or clone repository:
   ```bash
   git clone <your-repo-url> /var/www/class-scheduling
   ```

2. **Run deployment script** (as root):
   ```bash
   cd /var/www/class-scheduling
   sudo ./deploy.sh
   ```

3. **Update domain name** in configuration files:
   - `/etc/nginx/conf.d/class-scheduling.conf` - Replace `yourdomain.com`
   - `/var/www/class-scheduling/.env.local` - Update API URL
   - `/var/www/class-scheduling/Back-end/.env` - Update CORS_ORIGIN

4. **Reload services**:
   ```bash
   sudo systemctl reload nginx
   pm2 restart all
   ```

## Manual Deployment Steps

### 1. Install Dependencies
```bash
sudo dnf install nginx -y
sudo npm install -g pm2
```

### 2. Setup Database

**If postgres user exists:**
```bash
sudo -u postgres psql
CREATE DATABASE class_scheduling;
CREATE USER app_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE class_scheduling TO app_user;
\q
```

**If postgres user doesn't exist (see POSTGRESQL_FIX.md for details):**
```bash
# Option 1: Create postgres user
sudo useradd -r -s /bin/bash postgres

# Option 2: Reinstall PostgreSQL
sudo dnf install -y postgresql-server postgresql-contrib
sudo postgresql-setup --initdb
sudo systemctl enable postgresql
sudo systemctl start postgresql

# Option 3: Use direct psql
psql postgres -c "CREATE DATABASE class_scheduling;"
psql postgres -c "CREATE USER app_user WITH PASSWORD 'your_password';"
psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE class_scheduling TO app_user;"
```

### 3. Setup Backend
```bash
cd /var/www/class-scheduling/Back-end
npm install
# Create .env file (see Back-end/env.template)
npm run prisma:generate
npm run prisma:migrate
npm run build
```

### 4. Setup Frontend
```bash
cd /var/www/class-scheduling
npm install
# Create .env.local file
npm run build
```

### 5. Start with PM2
```bash
cd /var/www/class-scheduling
pm2 start pm2.config.js
pm2 save
pm2 startup systemd
```

### 6. Configure Nginx
```bash
sudo cp nginx.conf /etc/nginx/conf.d/class-scheduling.conf
# Edit and update domain name
sudo nginx -t
sudo systemctl restart nginx
```

## Environment Variables

### Backend (.env)
```env
DATABASE_URL="postgresql://app_user:password@localhost:5432/class_scheduling?schema=public"
JWT_SECRET="your-random-secret-key"
JWT_EXPIRE="7d"
PORT=3001
NODE_ENV=production
CORS_ORIGIN="https://yourdomain.com"
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
```

## Common Commands

```bash
# PM2
pm2 status
pm2 logs
pm2 restart all
pm2 restart backend
pm2 restart frontend

# Nginx
sudo systemctl status nginx
sudo systemctl restart nginx
sudo nginx -t

# Database
sudo -u postgres psql -d class_scheduling
sudo -u postgres pg_dump class_scheduling > backup.sql

# Update application
cd /var/www/class-scheduling
./update.sh
```

## Troubleshooting

- **502 Bad Gateway**: Check if backend is running (`pm2 status`)
- **Database connection error**: Verify PostgreSQL is running and credentials are correct
- **Build errors**: Check Node.js version (should be 18+)
- **Permission errors**: Ensure appuser owns `/var/www/class-scheduling`

## SSL Setup (Let's Encrypt)

```bash
sudo dnf install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com
```
