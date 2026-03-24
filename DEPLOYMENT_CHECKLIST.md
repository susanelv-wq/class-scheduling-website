# Deployment Checklist

Use this checklist to ensure all steps are completed during deployment.

## Pre-Deployment

- [ ] VPS is accessible via SSH
- [ ] PostgreSQL is installed and running
- [ ] Git is installed
- [ ] Node.js (v18+) is installed
- [ ] npm is installed
- [ ] Domain name is configured (if using domain)

## System Setup

- [ ] System packages updated (`sudo dnf update`)
- [ ] Nginx installed (`sudo dnf install nginx`)
- [ ] PM2 installed globally (`sudo npm install -g pm2`)
- [ ] Firewall configured (HTTP, HTTPS, SSH ports open)
- [ ] Application user created (`appuser`)

## Database Setup

- [ ] PostgreSQL database created (`class_scheduling`)
- [ ] Database user created (`app_user`)
- [ ] Database password set (strong password)
- [ ] Permissions granted to database user
- [ ] Database connection tested

## Application Setup

- [ ] Application code cloned/copied to `/var/www/class-scheduling`
- [ ] Backend dependencies installed (`npm install` in Back-end/)
- [ ] Backend `.env` file created with correct values
- [ ] Prisma Client generated (`npm run prisma:generate`)
- [ ] Database migrations run (`npm run prisma:migrate`)
- [ ] Backend built (`npm run build`)
- [ ] Frontend dependencies installed (`npm install` in root)
- [ ] Frontend `.env.local` file created
- [ ] Frontend built (`npm run build`)

## PM2 Configuration

- [ ] PM2 config file (`pm2.config.js`) in place
- [ ] PM2 log directory created (`/var/log/pm2`)
- [ ] Backend started with PM2
- [ ] Frontend started with PM2
- [ ] PM2 processes saved (`pm2 save`)
- [ ] PM2 startup script configured (`pm2 startup`)

## Nginx Configuration

- [ ] Nginx config file created (`/etc/nginx/conf.d/class-scheduling.conf`)
- [ ] Domain name/IP updated in Nginx config
- [ ] Nginx config tested (`sudo nginx -t`)
- [ ] Nginx enabled (`sudo systemctl enable nginx`)
- [ ] Nginx started (`sudo systemctl start nginx`)

## Environment Variables

- [ ] Backend `.env` has correct:
  - [ ] DATABASE_URL
  - [ ] JWT_SECRET (strong random string)
  - [ ] PORT (3001)
  - [ ] NODE_ENV (production)
  - [ ] CORS_ORIGIN (your domain)
- [ ] Frontend `.env.local` has correct:
  - [ ] NEXT_PUBLIC_API_URL

## Testing

- [ ] Backend health check works (`curl http://localhost:3001/health`)
- [ ] PM2 shows both apps running (`pm2 status`)
- [ ] Nginx is running (`sudo systemctl status nginx`)
- [ ] Application accessible via domain/IP
- [ ] API endpoints responding correctly
- [ ] Frontend loading correctly
- [ ] Database operations working

## SSL Setup (Optional but Recommended)

- [ ] Certbot installed
- [ ] SSL certificate obtained
- [ ] Nginx SSL configuration updated
- [ ] HTTP to HTTPS redirect configured
- [ ] SSL auto-renewal configured

## Security

- [ ] All default passwords changed
- [ ] Strong JWT secret generated
- [ ] Firewall rules configured
- [ ] SSH key authentication enabled (recommended)
- [ ] Unnecessary services disabled
- [ ] File permissions set correctly

## Monitoring & Maintenance

- [ ] PM2 monitoring setup (`pm2 monit`)
- [ ] Log rotation configured
- [ ] Backup strategy in place
- [ ] Update script tested (`update.sh`)
- [ ] Documentation reviewed

## Post-Deployment

- [ ] Application fully functional
- [ ] All features tested
- [ ] Performance acceptable
- [ ] Logs checked for errors
- [ ] Team notified of deployment

---

## Quick Verification Commands

```bash
# Check services
pm2 status
sudo systemctl status nginx
sudo systemctl status postgresql

# Check logs
pm2 logs
sudo tail -f /var/log/nginx/error.log

# Test endpoints
curl http://localhost:3001/health
curl http://yourdomain.com/health

# Check ports
sudo netstat -tulpn | grep -E '3000|3001|80|443'
```
