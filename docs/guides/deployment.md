# Deployment Guide

Complete guide for deploying NT TaxOffice Node to production.

**Last Updated:** December 1, 2025

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Server Requirements](#server-requirements)
- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Deployment Methods](#deployment-methods)
  - [Docker Deployment (Recommended)](#docker-deployment-recommended)
  - [Manual Deployment](#manual-deployment)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [SSL/TLS Configuration](#ssltls-configuration)
- [Email Service Setup](#email-service-setup)
- [Post-Deployment Tasks](#post-deployment-tasks)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying to production, ensure you have:

- **Server Access**: SSH access to your production server (VPS or dedicated)
- **Domain Name**: A registered domain pointing to your server's IP
- **Email Account**: Gmail account with 2FA enabled for sending emails
- **Database**: MySQL 8.0 server or access to managed MySQL service
- **Git**: Installed on your server for code deployment
- **Basic Linux Knowledge**: Comfortable with command-line operations

---

## Server Requirements

### Minimum Specifications

| Resource      | Minimum    | Recommended | Why?                                |
| ------------- | ---------- | ----------- | ----------------------------------- |
| **CPU**       | 1 core     | 2 cores     | Email queue and concurrent requests |
| **RAM**       | 1 GB       | 2 GB        | Node.js + MySQL + email queue       |
| **Disk**      | 10 GB      | 20 GB       | Application + database + logs       |
| **Bandwidth** | 1 TB/month | Unlimited   | Emails and web traffic              |

### Software Requirements

- **OS**: Ubuntu 20.04 LTS or later (or equivalent Linux distribution)
- **Node.js**: Version 18.x or later
- **MySQL**: Version 8.0 or later
- **Docker** (if using Docker deployment): Version 20.10 or later
- **Docker Compose** (if using Docker deployment): Version 2.0 or later
- **Nginx** (for reverse proxy): Latest stable version

### Why These Requirements?

**CPU**: The email queue processor runs in the background every 30 seconds. With multiple concurrent booking requests, having 2 cores prevents bottlenecks.

**RAM**: Node.js application (~300-500 MB) + MySQL (~500 MB minimum) + headroom for traffic spikes.

**Disk**: Application code is small (~50 MB), but database and logs grow over time. 20 GB gives comfortable headroom.

---

## Pre-Deployment Checklist

Before deploying, complete these steps:

### Security

- [ ] Generate strong `SESSION_SECRET` (64+ characters)
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```
- [ ] Create strong `DB_PASSWORD` (16+ characters, mixed case, symbols)
- [ ] Obtain Gmail App Password (not regular password!)
- [ ] Review rate limiting settings for production traffic
- [ ] Plan backup strategy for database

### Configuration

- [ ] Update `.env` with production values
- [ ] Set `NODE_ENV=production`
- [ ] Configure production domain in `APP_URL`
- [ ] Verify timezone setting (`TIMEZONE=Europe/Athens`)
- [ ] Set appropriate `BCRYPT_ROUNDS` (12 recommended)

### Infrastructure

- [ ] Domain DNS configured (A record pointing to server IP)
- [ ] SSL certificate obtained (Let's Encrypt recommended)
- [ ] Firewall configured (ports 80, 443, 3306 if needed)
- [ ] Reverse proxy configured (Nginx or similar)

### Testing

- [ ] Test application in staging environment first
- [ ] Verify email sending works with production credentials
- [ ] Test booking flow end-to-end
- [ ] Verify database backups are working
- [ ] Load test with expected traffic

---

## Deployment Methods

### Docker Deployment (Recommended)

Docker simplifies deployment by containerizing the application and its dependencies.

#### Why Docker?

- **Consistency**: Same environment in development and production
- **Isolation**: Application runs in isolated container
- **Easy Rollback**: Simple to revert to previous versions
- **Portability**: Works on any server with Docker installed

#### Step 1: Install Docker

```bash
# Update package index
sudo apt update

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group (logout/login required)
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

#### Step 2: Clone Repository

```bash
# Create application directory
sudo mkdir -p /var/www
cd /var/www

# Clone repository
git clone https://github.com/itheCreator1/nt-taxoffice-node.git
cd nt-taxoffice-node
```

#### Step 3: Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit with production values
nano .env
```

**Critical `.env` values for production:**

```bash
NODE_ENV=production
PORT=3000

# Strong session secret (generate new one!)
SESSION_SECRET=your_64_char_random_string_here

# Database (uses Docker service name)
DB_HOST=mysql
DB_USER=root
DB_PASSWORD=your_strong_database_password
DB_NAME=nt_taxoffice_appointments

# Gmail (app-specific password required)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your_16_char_app_password
ADMIN_EMAIL=admin@yourdomain.com

# Production domain
APP_URL=https://yourdomain.com
APP_NAME=NT - TAXOFFICE

# Adjust rate limits for production traffic
RATE_LIMIT_WINDOW_MS=3600000
RATE_LIMIT_MAX_REQUESTS=10  # Increase for production

TIMEZONE=Europe/Athens
DEFAULT_SLOT_DURATION=30
BCRYPT_ROUNDS=12
```

#### Step 4: Configure Docker Compose for Production

Edit `docker-compose.yml` for production:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    depends_on:
      mysql:
        condition: service_healthy
    restart: unless-stopped # Auto-restart on failure
    volumes:
      - ./logs:/app/logs # Persist logs
    networks:
      - app-network

  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_PASSWORD}
      MYSQL_DATABASE: ${DB_NAME}
    ports:
      - '3306:3306'
    volumes:
      - mysql-data:/var/lib/mysql # Persist database
      - ./database/schema.sql:/docker-entrypoint-initdb.d/schema.sql
    restart: unless-stopped
    healthcheck:
      test: ['CMD', 'mysqladmin', 'ping', '-h', 'localhost']
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - app-network

volumes:
  mysql-data: # Named volume for database persistence

networks:
  app-network:
    driver: bridge
```

#### Step 5: Start Application

```bash
# Build and start containers
docker-compose up -d

# Check logs
docker-compose logs -f app

# Verify containers are running
docker-compose ps
```

#### Step 6: Verify Database Initialization

```bash
# Check database tables were created
docker-compose exec mysql mysql -uroot -p${DB_PASSWORD} ${DB_NAME} -e "SHOW TABLES;"

# Should show: admin_users, appointments, availability_settings, blocked_dates, email_queue, security_audit_log
```

---

### Manual Deployment

For servers without Docker:

#### Step 1: Install Node.js

```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

#### Step 2: Install MySQL

```bash
# Install MySQL 8.0
sudo apt update
sudo apt install mysql-server

# Secure installation
sudo mysql_secure_installation

# Create database and user
sudo mysql -u root -p
```

In MySQL console:

```sql
CREATE DATABASE nt_taxoffice_appointments CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'nt_taxoffice'@'localhost' IDENTIFIED BY 'your_strong_password';
GRANT ALL PRIVILEGES ON nt_taxoffice_appointments.* TO 'nt_taxoffice'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### Step 3: Clone and Install

```bash
# Clone repository
cd /var/www
git clone https://github.com/itheCreator1/nt-taxoffice-node.git
cd nt-taxoffice-node

# Install dependencies (production only)
npm install --production

# Configure environment
cp .env.example .env
nano .env  # Edit with production values
```

**Production `.env` for manual deployment:**

```bash
DB_HOST=localhost  # Not 'mysql' - using local MySQL
# ... (other values same as Docker deployment)
```

#### Step 4: Initialize Database

```bash
# Run schema creation
mysql -u nt_taxoffice -p nt_taxoffice_appointments < database/schema.sql
```

#### Step 5: Install PM2 (Process Manager)

PM2 keeps your application running and auto-restarts on crashes:

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start application
pm2 start server.js --name nt-taxoffice

# Configure auto-start on server reboot
pm2 startup
pm2 save

# Monitor application
pm2 status
pm2 logs nt-taxoffice
```

**PM2 Ecosystem File** (optional, for advanced configuration):

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'nt-taxoffice',
      script: './server.js',
      instances: 2, // Run 2 instances for load balancing
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
```

Start with ecosystem file:

```bash
pm2 start ecosystem.config.js
```

---

## Environment Configuration

### Production Environment Variables

**Security-Critical Variables:**

```bash
# NEVER use development secrets in production!
SESSION_SECRET=  # Generate: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
DB_PASSWORD=     # Strong password (16+ chars)
GMAIL_APP_PASSWORD=  # Gmail app-specific password
```

### Understanding Rate Limits

Adjust based on expected traffic:

```bash
# Conservative (small office)
RATE_LIMIT_WINDOW_MS=3600000  # 1 hour
RATE_LIMIT_MAX_REQUESTS=5

# Moderate (medium traffic)
RATE_LIMIT_WINDOW_MS=900000   # 15 minutes
RATE_LIMIT_MAX_REQUESTS=20

# High traffic (large office)
RATE_LIMIT_WINDOW_MS=900000   # 15 minutes
RATE_LIMIT_MAX_REQUESTS=50
```

**Why Rate Limiting Matters:**

- Prevents brute-force attacks on admin login
- Stops spam booking attempts
- Protects server resources

---

## Database Setup

### Backup Strategy

**Automated Daily Backups:**

```bash
# Create backup script
sudo nano /usr/local/bin/backup-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/mysql"
DB_NAME="nt_taxoffice_appointments"
DB_USER="root"
DB_PASS="your_password"  # Consider using .my.cnf for security
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Backup database
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_DIR/${DB_NAME}_${DATE}.sql.gz

# Delete backups older than 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/backup-db.sh

# Schedule daily backup at 2 AM
sudo crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-db.sh
```

### Database Maintenance

**Weekly Optimization:**

```bash
# Optimize tables
mysql -u root -p nt_taxoffice_appointments -e "OPTIMIZE TABLE appointments, email_queue, security_audit_log;"
```

---

## SSL/TLS Configuration

### Using Let's Encrypt (Free)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal (already configured by certbot)
sudo certbot renew --dry-run
```

### Nginx Reverse Proxy Configuration

Create `/etc/nginx/sites-available/nt-taxoffice`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration (managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy to Node.js application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Access and error logs
    access_log /var/log/nginx/nt-taxoffice-access.log;
    error_log /var/log/nginx/nt-taxoffice-error.log;
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/nt-taxoffice /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Email Service Setup

### Gmail Configuration

1. **Enable 2-Factor Authentication** on your Google account
2. Go to https://myaccount.google.com/apppasswords
3. Select "Mail" and "Other (Custom name)"
4. Generate password
5. Copy 16-character code to `GMAIL_APP_PASSWORD` in `.env`

### Testing Email Setup

```bash
# After deployment, test email sending
# Book a test appointment and verify emails are sent
```

### Monitoring Email Queue

```bash
# Check for failed emails
mysql -u root -p nt_taxoffice_appointments -e "SELECT * FROM email_queue WHERE status='failed';"

# Retry failed emails manually
# They will auto-retry, but you can reset:
# UPDATE email_queue SET status='pending', retry_count=0 WHERE id=X;
```

---

## Post-Deployment Tasks

### 1. Create Admin Account

```bash
# Access setup page (only works once)
https://yourdomain.com/admin/setup.html
```

Fill in:

- Username
- Email
- Secure password (12+ characters)

### 2. Configure Availability

1. Login at https://yourdomain.com/admin/login.html
2. Go to Availability settings
3. Configure working hours for each day
4. Add any blocked dates (holidays)

### 3. Test Booking Flow

1. Visit https://yourdomain.com/appointments.html
2. Complete a test booking
3. Verify emails are received
4. Check admin dashboard shows the appointment

### 4. Monitor Application

```bash
# Docker deployment
docker-compose logs -f app

# Manual deployment (PM2)
pm2 logs nt-taxoffice

# Check disk space
df -h

# Check memory usage
free -h
```

---

## Monitoring & Maintenance

### Daily Checks

- Monitor email queue for failures
- Check application logs for errors
- Verify database backups completed

### Weekly Maintenance

- Review security audit log
- Optimize database tables
- Check disk space usage
- Update application if needed

### Monthly Tasks

- Review and analyze appointment data
- Check for package updates: `npm outdated`
- Test backup restoration process
- Review rate limiting effectiveness

### Setting Up Monitoring

**Using PM2 (Manual Deployment):**

```bash
# Monitor CPU/Memory
pm2 monit

# Web dashboard
pm2 plus  # Premium service
```

**Log Rotation:**

Create `/etc/logrotate.d/nt-taxoffice`:

```
/var/www/nt-taxoffice-node/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    missingok
    create 0640 www-data www-data
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

---

## Troubleshooting

### Application Won't Start

**Error: `ECONNREFUSED` (Database Connection)**

```bash
# Check MySQL is running
sudo systemctl status mysql

# Docker: Check mysql container
docker-compose ps mysql
docker-compose logs mysql

# Verify DB_HOST in .env
# Docker: DB_HOST=mysql
# Manual: DB_HOST=localhost
```

**Error: `SESSION_SECRET` Required**

```bash
# Generate and add to .env
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Emails Not Sending

**Check Email Queue:**

```bash
mysql -u root -p nt_taxoffice_appointments
SELECT * FROM email_queue WHERE status='failed' ORDER BY created_at DESC LIMIT 10;
```

**Common Causes:**

- Using regular Gmail password instead of app password
- 2FA not enabled on Gmail
- Gmail account locked due to suspicious activity
- Incorrect `GMAIL_USER` or `GMAIL_APP_PASSWORD`

**Solution:**

1. Verify 2FA is enabled
2. Generate new app password
3. Update `.env`
4. Restart application

### High Memory Usage

```bash
# Check process memory
docker stats  # Docker
pm2 list      # PM2

# If memory leak suspected, restart:
docker-compose restart app  # Docker
pm2 restart nt-taxoffice    # PM2
```

### Database Growing Too Large

```bash
# Check table sizes
mysql -u root -p nt_taxoffice_appointments -e "
SELECT
    table_name AS 'Table',
    round(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
FROM information_schema.TABLES
WHERE table_schema = 'nt_taxoffice_appointments'
ORDER BY (data_length + index_length) DESC;
"

# Archive old appointments (older than 1 year)
# Consider creating an archive table or exporting to CSV
```

---

## Updating the Application

### Docker Deployment

```bash
cd /var/www/nt-taxoffice-node

# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up -d --build

# Check logs
docker-compose logs -f app
```

### Manual Deployment (PM2)

```bash
cd /var/www/nt-taxoffice-node

# Pull latest changes
git pull origin main

# Install any new dependencies
npm install --production

# Restart application
pm2 restart nt-taxoffice

# Check status
pm2 status
```

---

## Security Best Practices

1. **Keep Software Updated**: Regularly update Node.js, MySQL, and system packages
2. **Use Strong Passwords**: 16+ characters for all credentials
3. **Limit SSH Access**: Use SSH keys, disable password authentication
4. **Configure Firewall**: Only open necessary ports (80, 443)
5. **Monitor Logs**: Regularly review security audit logs
6. **Backup Regularly**: Automated daily database backups
7. **Use HTTPS**: Always use SSL/TLS in production
8. **Rate Limiting**: Protect against brute-force attacks

---

## Support Resources

- **Main Documentation**: [README.md](../README.md)
- **API Reference**: [API.md](API.md)
- **Admin Guide**: [ADMIN_GUIDE.md](ADMIN_GUIDE.md)
- **Issues**: https://github.com/itheCreator1/nt-taxoffice-node/issues

---

**Successfully deployed? Don't forget to:**

- ✅ Create admin account
- ✅ Configure working hours
- ✅ Test email sending
- ✅ Set up monitoring
- ✅ Schedule database backups

**Your appointment system is now live!** 🎉
