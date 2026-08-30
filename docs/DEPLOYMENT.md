# 🐳 Tabibi AI (طبيبي) — Infrastructure & Deployment Manual

> **Scope**: Hosting, Docker Setup, Production Deployment, SSL Configuration, Data Backups, and Zero-Downtime Updates for Platform Owner.

---

## 1. Production Architecture Overview

The system runs as a containerized stack using Docker Compose:

```
                          ┌───────────────────────────┐
                          │    Nginx Reverse Proxy    │
                          │   (Port 80/443 SSL Cert)  │
                          └─────────────┬─────────────┘
                                        │
             ┌──────────────────────────┴──────────────────────────┐
             │                                                     │
             ▼                                                     ▼
┌───────────────────────────┐                       ┌───────────────────────────┐
│     Next.js Web App       │                       │       n8n Workflows       │
│    (App Router Port 3000) │                       │        (Port 5678)        │
└─────────────┬─────────────┘                       └─────────────┬─────────────┘
              │                                                   │
              └─────────────────────────┬─────────────────────────┘
                                        │
                                        ▼
                         ┌─────────────────────────────┐
                         │   PostgreSQL Database       │
                         │   (Port 5432)               │
                         └─────────────────────────────┘
```

---

## 2. Server Requirements

- **Provider**: Hetzner Cloud (CX22 / CPX21), DigitalOcean Droplet, or AWS EC2.
- **Recommended Spec**: 2 vCPU, 4GB RAM, 40GB NVMe SSD (Ubuntu 22.04 LTS).
- **Estimated Server Cost**: €6 – €12 / month.

---

## 3. Deployment Commands & Workflow

### Step 1: Clone & Configure Environment
```bash
git clone https://github.com/your-repo/tabibi-whatsapp-clinic.git
cd tabibi-whatsapp-clinic
cp .env.example .env
```

### Step 2: Edit Production `.env`
```env
DATABASE_URL="postgresql://tabibi_user:tabibi_secure_pass_2026@postgres:5432/tabibi_db?schema=public"
JWT_SECRET="super_secret_jwt_key_tabibi_prod_2026"
OPENAI_API_KEY="sk-proj-your-real-openai-key"
WHATSAPP_VERIFY_TOKEN="tabibi_webhook_verify_secret"
NODE_ENV="production"
```

### Step 3: Launch Docker Stack
```bash
docker-compose up -d --build
```

### Step 4: Run Database Migration & Seed
```bash
docker-compose exec app npx prisma db push
docker-compose exec app npm run db:seed
```

---

## 4. SSL Certificate Setup (Let's Encrypt Certbot)

Install Certbot for free automatic HTTPS certificates:

```bash
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d tabibi.ai -d www.tabibi.ai
```

---

## 5. Automated Backup Policy

### Database Daily Backup Script (`scripts/backup.sh`):
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/tabibi"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p $BACKUP_DIR

docker-compose exec -T postgres pg_dump -U tabibi_user tabibi_db | gzip > "$BACKUP_DIR/tabibi_backup_$TIMESTAMP.sql.gz"

# Retain last 30 days of backups
find $BACKUP_DIR -type f -name "*.sql.gz" -mtime +30 -delete
```

Add daily Cron Job (`crontab -e`):
```cron
0 3 * * * /bin/bash /var/backups/tabibi/backup.sh
```

---

## 6. Updating the Platform Without Breaking Clients

To deploy software updates safely without corrupting client data:

1. Pull latest code changes: `git pull origin main`
2. Run Prisma migration dry-run: `npx prisma migrate status`
3. Rebuild Docker containers: `docker-compose up -d --build --no-deps app`
4. Run Vitest verification tests: `docker-compose exec app npx vitest run`
