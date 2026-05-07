# DevLog — Server Specification & Setup Guide

This document covers every option from free demo to production-ready, so you can always spin up a working environment quickly.

---

## Stack Recap

| Layer | Technology | Needs a server? |
|-------|-----------|----------------|
| Web frontend | Next.js 15 | Yes (or Vercel) |
| Backend API | NestJS | Yes |
| Database | PostgreSQL (via Prisma) | Yes |
| Mobile | Expo React Native | No — runs on device |
| AI | Anthropic Claude API | No — external API |

---

## Option A — Free Tier (Managed Services)

**Best for:** Quick demos, sharing with recruiters, zero cost.
**Limitation:** Services may sleep after inactivity (Render free tier).

```
Next.js  → Vercel        (free, auto-deploy from GitHub)
NestJS   → Render        (free, sleeps after 15min idle)
Database → Supabase      (free, 500MB PostgreSQL)
Storage  → Cloudinary    (free, 25GB — for profile images)
```

### Setup Steps

```bash
# 1. Vercel — Next.js web
# Push to GitHub, connect repo at vercel.com, done.

# 2. Supabase — PostgreSQL
# Create project at supabase.com
# Copy the connection string to DATABASE_URL

# 3. Render — NestJS API
# Create a "Web Service" at render.com
# Build command:  npm install && npm run build
# Start command:  node dist/main.js
# Set environment variables in Render dashboard

# 4. Update NEXT_PUBLIC_API_URL in Vercel to point to your Render URL
```

### Cost
| Service | Free Limit | Paid Upgrade |
|---------|-----------|--------------|
| Vercel | 100GB bandwidth/mo | $20/mo Pro |
| Render | 750 hrs/mo, sleeps | $7/mo starter |
| Supabase | 500MB, 2 projects | $25/mo Pro |
| **Total** | **$0/mo** | **~$52/mo upgraded** |

---

## Option B — Single VPS (Recommended for Demo)

**Best for:** Always-on demo, interview showcase, full control.
**Runs:** Next.js + NestJS + PostgreSQL + Nginx on one server via Docker.

---

### Minimum Spec (Tight but workable)

| Component | Spec |
|-----------|------|
| **CPU** | 1 vCPU |
| **RAM** | 2 GB |
| **Storage** | 40 GB SSD |
| **OS** | Ubuntu 22.04 LTS |
| **Bandwidth** | 1–2 TB/mo |
| **Estimated Cost** | $6–10/mo |

### Recommended Spec (Smooth demo)

| Component | Spec |
|-----------|------|
| **CPU** | 2 vCPU |
| **RAM** | 4 GB |
| **Storage** | 80 GB SSD |
| **OS** | Ubuntu 22.04 LTS |
| **Bandwidth** | 3–4 TB/mo |
| **Estimated Cost** | $12–24/mo |

---

### Provider Comparison (Best Value)

| Provider | Plan | RAM | vCPU | SSD | Price/mo | Best for |
|----------|------|-----|------|-----|----------|----------|
| **Hetzner Cloud** | CX22 | 4 GB | 2 | 40 GB | ~$4–6 | Best value, EU datacenter |
| **DigitalOcean** | Basic | 2 GB | 1 | 50 GB | $12 | Simplest dashboard |
| **DigitalOcean** | Basic | 4 GB | 2 | 80 GB | $24 | Recommended |
| **Vultr** | Cloud Compute | 2 GB | 1 | 55 GB | $10 | US/Asia locations |
| **Linode (Akamai)** | Nanode | 1 GB | 1 | 25 GB | $5 | Budget minimum |
| **AWS EC2** | t3.micro | 1 GB | 2 | 8 GB EBS | Free (12 mo) | Free trial only |
| **AWS EC2** | t3.small | 2 GB | 2 | — | ~$15 | After free tier |

> **Recommendation:** Start with **Hetzner CX22** (~$5/mo, 4GB RAM, 2 vCPU). Best price-to-performance for a demo server outside the US. Use **DigitalOcean** if you prefer a simpler UI.

---

## Option C — Production-Grade (Future Scale)

**Best for:** If DevLog gets real users or you want to demo auto-scaling.

```
Load Balancer   → Cloudflare (free) + Nginx
Next.js         → Vercel Pro or 2× VPS behind load balancer
NestJS API      → 2× VPS (active-passive) or Railway Pro
Database        → AWS RDS PostgreSQL (db.t3.micro, ~$15/mo)
                  OR Supabase Pro ($25/mo)
Cache           → Redis via Upstash (free tier, serverless)
File Storage    → AWS S3 or Cloudflare R2 (free 10GB)
Monitoring      → Grafana Cloud (free) + Prometheus
```

**Estimated cost:** $60–120/mo

---

## VPS Setup Guide (Option B)

### 1. Initial Server Setup

```bash
# SSH into your server
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Create a non-root user
adduser devlog
usermod -aG sudo devlog

# Set up SSH key for new user (run on your LOCAL machine)
ssh-copy-id devlog@your-server-ip

# From now on, SSH as devlog user
ssh devlog@your-server-ip
```

### 2. Install Docker & Docker Compose

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Verify
docker --version
docker compose version
```

### 3. Install Nginx & Certbot (SSL)

```bash
sudo apt install nginx certbot python3-certbot-nginx -y

# Allow firewall ports
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### 4. Project Docker Compose File

Save this as `~/devlog/docker-compose.yml` on your server:

```yaml
# docker-compose.yml
services:

  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER:     ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB:       devlog
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    image: ghcr.io/yourname/devlog-api:latest  # or build: ./apps/api
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      DATABASE_URL:      postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/devlog
      JWT_SECRET:        ${JWT_SECRET}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      NODE_ENV:          production
      PORT:              3001
    ports:
      - "3001:3001"

  web:
    image: ghcr.io/yourname/devlog-web:latest  # or build: ./apps/web
    restart: unless-stopped
    depends_on:
      - api
    environment:
      NEXT_PUBLIC_API_URL:  http://api:3001
      ANTHROPIC_API_KEY:    ${ANTHROPIC_API_KEY}
      NODE_ENV:             production
    ports:
      - "3000:3000"

volumes:
  postgres_data:
```

### 5. Environment Variables File

Save as `~/devlog/.env` on your server:

```bash
# ~/devlog/.env  — never commit this file

# Database
POSTGRES_USER=devlog_user
POSTGRES_PASSWORD=your_strong_password_here

# Auth
JWT_SECRET=your_64_char_random_secret_here

# AI
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxx

# App
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://devlog.yourdomain.com
NEXT_PUBLIC_API_URL=https://api.devlog.yourdomain.com
```

Generate a strong JWT secret:
```bash
openssl rand -hex 32
```

### 6. Nginx Reverse Proxy Config

```nginx
# /etc/nginx/sites-available/devlog

# Web app (Next.js)
server {
    listen 80;
    server_name devlog.yourdomain.com;

    location / {
        proxy_pass         http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# API (NestJS)
server {
    listen 80;
    server_name api.devlog.yourdomain.com;

    location / {
        proxy_pass         http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
# Enable the config
sudo ln -s /etc/nginx/sites-available/devlog /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Issue SSL certificates (free via Let's Encrypt)
sudo certbot --nginx -d devlog.yourdomain.com -d api.devlog.yourdomain.com
```

### 7. Run the Stack

```bash
cd ~/devlog

# Pull latest images and start
docker compose pull
docker compose up -d

# Run Prisma migrations on first start
docker compose exec api npx prisma migrate deploy

# Check logs
docker compose logs -f api
docker compose logs -f web

# Stop everything
docker compose down
```

---

## CI/CD — Auto Deploy on Git Push

Add this GitHub Actions workflow to auto-deploy on every push to `main`:

```yaml
# .github/workflows/deploy.yml
name: Deploy to VPS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host:     ${{ secrets.VPS_HOST }}
          username: devlog
          key:      ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd ~/devlog
            docker compose pull
            docker compose up -d
            docker compose exec -T api npx prisma migrate deploy
            docker image prune -f
```

Add these secrets in GitHub → Settings → Secrets:
- `VPS_HOST` — your server IP
- `VPS_SSH_KEY` — your private SSH key (the one that can access the server)

---

## Database Backup

Set up automated daily backups:

```bash
# Add to crontab: crontab -e
0 2 * * * docker exec devlog-postgres-1 pg_dump -U devlog_user devlog | gzip > ~/backups/devlog_$(date +\%Y\%m\%d).sql.gz

# Keep only last 7 days
0 3 * * * find ~/backups -name "devlog_*.sql.gz" -mtime +7 -delete
```

Restore from backup:
```bash
gunzip -c ~/backups/devlog_20260101.sql.gz | docker exec -i devlog-postgres-1 psql -U devlog_user devlog
```

---

## Runtime Requirements (on VPS)

| Software | Minimum Version | Install method |
|----------|----------------|----------------|
| Ubuntu | 22.04 LTS | OS image |
| Docker | 24+ | `curl -fsSL https://get.docker.com \| sh` |
| Docker Compose | 2.20+ | Bundled with Docker |
| Nginx | 1.18+ | `apt install nginx` |
| Certbot | 2.0+ | `apt install certbot` |

> Node.js is **not** required directly on the server — it runs inside Docker containers.

---

## Local Development Requirements

| Software | Version | Notes |
|----------|---------|-------|
| Node.js | 20 LTS | Use `nvm` to manage versions |
| npm | 10+ | Bundled with Node 20 |
| Docker Desktop | Latest | For local PostgreSQL |
| Git | 2.40+ | Version control |
| VS Code | Latest | Recommended editor |

```bash
# Recommended VS Code extensions for this stack
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension prisma.prisma
code --install-extension bradlc.vscode-tailwindcss
code --install-extension ms-vscode.vscode-typescript-next
```

Local dev PostgreSQL via Docker (no full stack needed):

```bash
docker run -d \
  --name devlog-db \
  -e POSTGRES_USER=devlog_user \
  -e POSTGRES_PASSWORD=localpassword \
  -e POSTGRES_DB=devlog \
  -p 5432:5432 \
  postgres:16-alpine
```

---

## Quick Decision Guide

```
Just want to share a demo link with a recruiter?
└── Option A (Free Tier) — Vercel + Render + Supabase

Want a permanent always-on demo you control?
└── Option B, Hetzner CX22 (~$5/mo)
    └── 2GB RAM not enough / runs slow?
        └── Upgrade to CX32 (4GB RAM, ~$10/mo)

Building toward real users?
└── Option C — separate managed services per layer
```

---

*Part of the DevLog portfolio project — built with the 25-chapter TypeScript Mastery curriculum.*
