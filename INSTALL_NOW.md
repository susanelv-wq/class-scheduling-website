# Install PostgreSQL Now - Copy & Paste

## Run This on Your Server (as root):

```bash
sudo dnf install -y postgresql-server postgresql-contrib && sudo postgresql-setup --initdb && sudo systemctl enable postgresql && sudo systemctl start postgresql && sudo systemctl status postgresql
```

## Then Create Your Database:

```bash
sudo -u postgres psql -c "CREATE DATABASE class_scheduling;" && sudo -u postgres psql -c "CREATE USER app_user WITH ENCRYPTED PASSWORD 'your_password_here';" && sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE class_scheduling TO app_user;" && sudo -u postgres psql -d class_scheduling -c "GRANT ALL ON SCHEMA public TO app_user;"
```

**Replace `your_password_here` with your actual password!**

## Verify Everything Works:

```bash
# Check service
sudo systemctl status postgresql

# Check version
psql --version

# Test connection
sudo -u postgres psql -c "SELECT version();"

# List databases
sudo -u postgres psql -c "\l"
```

## If You Get Errors:

1. **Service won't start**: Check logs with `sudo journalctl -u postgresql -n 50`
2. **Permission errors**: Run `sudo chown -R postgres:postgres /var/lib/pgsql/`
3. **Connection refused**: Make sure service is running: `sudo systemctl start postgresql`
