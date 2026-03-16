# Technical - Deployment

> Hướng dẫn deploy và roadmap phát triển

## � Development Setup

### Local Development Environment

#### 1. Cài đặt Dependencies

```bash
# Cài đặt tất cả dependencies (bao gồm devDependencies)
npm install
```

#### 2. Cấu hình môi trường

Tạo file `.env` trong thư mục gốc:

```bash
NODE_ENV=development
PORT=5000

MONGODB_URI=mongodb://localhost:27017/ProManage

JWT_SECRET=dev_secret_key_change_in_production_min_32_chars
JWT_EXPIRES_IN=7d

FRONTEND_URL=http://localhost:3000

UPLOAD_PATH=./uploads
MAX_FILE_SIZE=52428800
```

#### 3. Khởi động với Nodemon

```bash
npm run dev
```

**Nodemon** sẽ tự động restart server khi phát hiện thay đổi trong:
- File `.js`, `.json`
- Thư mục `routes/`, `controllers/`, `models/`, `middleware/`, `config/`, `services/`, `utils/`, `helpers/`

**Cấu hình Nodemon** (`nodemon.json`):

```json
{
  "watch": ["server.js", "routes/**/*.js", "controllers/**/*.js", "models/**/*.js"],
  "ignore": ["node_modules/**", "uploads/**", "logs/**", "test/**"],
  "ext": "js,json",
  "delay": 1000,
  "env": {
    "NODE_ENV": "development"
  },
  "verbose": true,
  "restartable": "rs"
}
```

**Các lệnh hữu ích:**
- Gõ `rs` + Enter: Restart thủ công
- `Ctrl + C`: Dừng server
- `npm test`: Chạy test suite
- `npm run test:watch`: Chạy tests ở chế độ watch

#### 4. Kiểm tra kết nối

```bash
# Test API
curl http://localhost:5000/api/health

# Kiểm tra MongoDB
mongosh
> use ProManage
> show collections
```

---

## �🚀 Deployment Architecture

### Production Setup

```
┌─────────────────────────────────────────────────┐
│                                                  │
│  [Load Balancer / Nginx]                        │
│         │                                        │
│         ├─→ [Node.js API Server 1] ←→ MongoDB  │
│         │                                        │
│         ├─→ [Node.js API Server 2] ←→ MongoDB  │
│         │                                        │
│         └─→ [Static Files / CDN]                │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## 📦 Prerequisites

### Server Requirements

- **OS**: Ubuntu 20.04 LTS or higher
- **CPU**: 2+ cores
- **RAM**: 4GB+ (recommended 8GB)
- **Storage**: 50GB+ SSD
- **Network**: 100Mbps+

### Software

- **Node.js**: v18+ LTS
- **MongoDB**: v6.0+
- **Nginx**: Latest stable
- **PM2**: Latest (process manager)
- **Git**: Latest

---

## 🔧 Installation Steps

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Install Nginx
sudo apt install -y nginx

# Install PM2
sudo npm install -g pm2
```

### 2. Clone & Setup Project

```bash
# Clone repository
cd /var/www
sudo git clone https://github.com/your-repo/workflow32.git
cd workflow32

# Install dependencies
npm install --production

# Create .env
sudo nano .env
```

`.env` file:
```bash
NODE_ENV=production
PORT=5000

MONGODB_URI=mongodb://localhost:27017/workflow32

JWT_SECRET=your_super_secret_key_min_32_chars
JWT_EXPIRES_IN=7d

FRONTEND_URL=https://your-domain.com

UPLOAD_PATH=/var/www/workflow32/uploads
MAX_FILE_SIZE=52428800
```

### 3. Create Upload Directories

```bash
mkdir -p uploads/files
mkdir -p uploads/photos
mkdir -p uploads/videos
mkdir -p uploads/thumbnails

sudo chown -R $USER:$USER uploads
chmod -R 755 uploads
```

### 4. Start with PM2

```bash
# Start app
pm2 start server.js --name workflow32

# Save PM2 config
pm2 save

# Setup PM2 startup
pm2 startup
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp /home/$USER

# Monitor
pm2 monit
```

---

## 🌐 Nginx Configuration

### Nginx Config

```bash
sudo nano /etc/nginx/sites-available/workflow32
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL certificates (use Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # API proxy
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeout for uploads
        proxy_connect_timeout 600;
        proxy_send_timeout 600;
        proxy_read_timeout 600;
        send_timeout 600;
        
        # Increase body size for file uploads
        client_max_body_size 50M;
    }

    # Static files
    location /uploads/ {
        alias /var/www/workflow32/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Frontend (if serving from same server)
    location / {
        root /var/www/workflow32/frontend/build;
        try_files $uri /index.html;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/workflow32 /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🔒 SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal (already setup by certbot)
sudo certbot renew --dry-run
```

---

## 💾 Database Backup

### MongoDB Backup Script

```bash
# Create backup script
sudo nano /usr/local/bin/backup-mongo.sh
```

```bash
#!/bin/bash

BACKUP_DIR="/var/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup
mongodump --db workflow32 --out $BACKUP_DIR/$DATE

# Compress
tar -czf $BACKUP_DIR/workflow32_$DATE.tar.gz -C $BACKUP_DIR $DATE
rm -rf $BACKUP_DIR/$DATE

# Keep only last 7 days
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: workflow32_$DATE.tar.gz"
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/backup-mongo.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
0 2 * * * /usr/local/bin/backup-mongo.sh
```

### Restore Backup

```bash
# Extract
tar -xzf /var/backups/mongodb/workflow32_20260315_020000.tar.gz

# Restore
mongorestore --db workflow32 --drop 20260315_020000/workflow32
```

---

## 📊 Monitoring

### PM2 Monitoring

```bash
# Status
pm2 status

# Logs
pm2 logs workflow32

# Restart
pm2 restart workflow32

# Stop
pm2 stop workflow32
```

### System Monitoring

```bash
# CPU/RAM usage
htop

# Disk usage
df -h

# MongoDB stats
mongo --eval "db.stats()"

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

---

## 🔄 Update Deployment

```bash
# Pull latest code
cd /var/www/workflow32
git pull origin main

# Install new dependencies (if any)
npm install --production

# Restart app
pm2 restart workflow32

# Check logs
pm2 logs workflow32
```

---

## 🎯 Roadmap

### Phase 1: MVP (Current)

**Timeline:** Q1 2026

✅ Core features:
- Admin: Broadcast management, store/user management
- Manager: Task assignment, employee review
- Employee: Task completion, evidence upload
- JWT authentication
- MongoDB database
- Basic file upload

### Phase 2: Enhancements

**Timeline:** Q2 2026

🔵 Features:
- Real-time notifications (Socket.io)
- Advanced analytics dashboard
- Report generation (PDF/Excel)
- Mobile app (React Native)
- Push notifications (Firebase)
- Multi-language support (i18n)
- Dark mode

### Phase 3: Scale & Optimize

**Timeline:** Q3 2026

🔵 Features:
- Redis caching
- CDN for file uploads (AWS S3/Cloudflare)
- Load balancing (multiple servers)
- Database sharding
- Advanced search (Elasticsearch)
- Audit logs
- Admin activity tracking

### Phase 4: Advanced Features

**Timeline:** Q4 2026

🔵 Features:
- AI-powered image recognition (auto-check quality)
- OCR for documents
- Video compression/streaming
- Geolocation tracking (employee check-in)
- QR code scanning
- Integration with external systems (ERP, CRM)
- Custom workflow builder

---

## 🐳 Docker Deployment (Optional)

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    container_name: workflow32-app
    restart: always
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/workflow32
      - JWT_SECRET=${JWT_SECRET}
    volumes:
      - ./uploads:/app/uploads
    depends_on:
      - mongo

  mongo:
    image: mongo:6.0
    container_name: workflow32-mongo
    restart: always
    volumes:
      - mongo-data:/data/db
    ports:
      - "27017:27017"

  nginx:
    image: nginx:alpine
    container_name: workflow32-nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./uploads:/var/www/uploads
    depends_on:
      - app

volumes:
  mongo-data:
```

### Deploy with Docker

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

---

## 🔗 Liên quan

- **Architecture**: [architecture.md](architecture.md)
- **Security**: [security.md](security.md)
- **Database Schema**: [database-schema.md](database-schema.md)
