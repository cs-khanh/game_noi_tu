# 🚀 Deployment Guide - Nối Từ Liên Hoàn

## 📋 Overview

Project này có 3 workflows CI/CD:

1. **CI (ci.yml)** - Chạy khi có push/PR → Test & Build
2. **CD (cd.yml)** - Deploy tự động khi push main hoặc tag
3. **Manual Deploy (deploy-docker.yml)** - Deploy thủ công với Docker Compose

---

## 🔄 CI/CD Pipeline Flow

### 1. Development Flow

```
Developer → Commit → Push to branch
    ↓
GitHub Actions CI
    ↓
├─ Backend CI: Lint, Test
├─ Frontend CI: Lint, Build
└─ Docker Build Test
    ↓
All checks pass → Ready for PR
```

### 2. Staging Deployment

```
Merge to main branch
    ↓
CD Workflow (cd.yml)
    ↓
deploy-staging job
    ↓
├─ Build application
├─ Deploy to staging server
└─ Health check
    ↓
✅ Staging: https://staging.noitulienhoan.com
```

### 3. Production Deployment

```
Create tag (e.g., v1.0.0)
    ↓
CD Workflow (cd.yml)
    ↓
build-and-push-images job
    ↓
├─ Build Docker images
├─ Push to GitHub Container Registry
└─ Tag: latest, v1.0.0, v1.0
    ↓
deploy-production job
    ↓
├─ Pull new images
├─ Deploy to production
├─ Run migrations
├─ Smoke tests
└─ Notify team
    ↓
✅ Production: https://noitulienhoan.com
```

---

## 🎯 Deployment Strategies

### Strategy 1: GitHub Container Registry + Docker

**Setup:**

1. Enable GitHub Packages
2. Set secrets in repository settings
3. Create tag để trigger deployment

**Deploy steps:**

```bash
# 1. Commit và push code
git add .
git commit -m "feat: add new feature"
git push origin main

# 2. Tạo tag cho production
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# 3. GitHub Actions tự động:
#    - Build Docker images
#    - Push to ghcr.io
#    - Deploy to production
```

**Pull images từ registry:**

```bash
# Login to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Pull images
docker pull ghcr.io/username/demo_ci_cd-backend:latest
docker pull ghcr.io/username/demo_ci_cd-frontend:latest

# Run
docker-compose up -d
```

---

### Strategy 2: VPS với Docker Compose

**Setup VPS:**

```bash
# 1. Cài Docker và Docker Compose trên VPS
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 2. Clone repository
git clone <your-repo> /app
cd /app

# 3. Setup environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Edit .env files với production values

# 4. Run application
docker-compose up -d

# 5. Setup database
docker-compose exec backend npm run db:migrate
docker-compose exec backend npm run db:seed
```

**Update deployment:**

```bash
cd /app
git pull origin main
docker-compose down
docker-compose up -d --build
```

---

### Strategy 3: Manual Deploy với GitHub Actions

**Trigger manual deployment:**

1. Vào GitHub → Actions tab
2. Chọn "Deploy with Docker Compose"
3. Click "Run workflow"
4. Chọn environment (staging/production)
5. Click "Run workflow"

**Required secrets:**

```
Settings → Secrets and variables → Actions:

- SSH_PRIVATE_KEY: Private key để SSH vào server
- SERVER_HOST: IP hoặc domain của server
- SERVER_USER: Username (e.g., root, ubuntu)
- SLACK_WEBHOOK_URL: (Optional) Slack notification
```

---

## 🔐 Secrets Configuration

### Repository Secrets

Vào **Settings → Secrets and variables → Actions**, thêm:

```bash
# Server SSH
SSH_PRIVATE_KEY=<your-private-key>
SERVER_HOST=your-server.com
SERVER_USER=ubuntu

# Database (Production)
DB_HOST=db.example.com
DB_PASSWORD=super-secret-password

# Redis (Production)
REDIS_PASSWORD=redis-secret

# JWT
JWT_SECRET=your-jwt-secret-key

# Notifications (Optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

---

## 🌍 Deployment Environments

### Staging Environment

**Purpose:** Test trước khi lên production

**URL:** https://staging.noitulienhoan.com

**Trigger:** Mỗi khi push vào `main` branch

**Config:**
```yaml
environment:
  name: staging
  url: https://staging.noitulienhoan.com
```

**Protection rules:** None (deploy tự động)

### Production Environment

**Purpose:** Live application cho users

**URL:** https://noitulienhoan.com

**Trigger:** Khi tạo tag `v*` (v1.0.0, v2.1.0, etc.)

**Config:**
```yaml
environment:
  name: production
  url: https://noitulienhoan.com
```

**Protection rules:** 
- Required reviewers (optional)
- Wait timer (optional)

---

## 📦 Docker Images

### Build locally

```bash
# Backend
cd backend
docker build -t noi-tu-backend:latest .

# Frontend
cd frontend
docker build -t noi-tu-frontend:latest .
```

### Push to registry

```bash
# Tag images
docker tag noi-tu-backend:latest ghcr.io/username/noi-tu-backend:v1.0.0
docker tag noi-tu-frontend:latest ghcr.io/username/noi-tu-frontend:v1.0.0

# Push
docker push ghcr.io/username/noi-tu-backend:v1.0.0
docker push ghcr.io/username/noi-tu-frontend:v1.0.0
```

---

## 🔄 Rollback Strategy

### Automatic Rollback

```bash
# Kubernetes
kubectl rollout undo deployment/backend
kubectl rollout undo deployment/frontend

# Docker Swarm
docker service rollback backend
docker service rollback frontend
```

### Manual Rollback

```bash
# 1. Revert to previous tag
git revert HEAD
git push origin main

# 2. Or checkout previous tag
git checkout v1.0.0
git tag -a v1.0.1 -m "Rollback to stable version"
git push origin v1.0.1
```

### Emergency Rollback

```bash
# SSH vào server
ssh user@server

# Stop current version
docker-compose down

# Checkout previous version
git checkout v1.0.0

# Rebuild and restart
docker-compose up -d --build
```

---

## 📊 Monitoring & Health Checks

### Health Check Endpoints

```bash
# Backend health
curl https://noitulienhoan.com/health

# Response:
{
  "status": "healthy",
  "timestamp": "2025-12-25T10:00:00Z",
  "uptime": 3600
}
```

### Smoke Tests

```bash
# Run after deployment
curl -f https://noitulienhoan.com/health || exit 1
curl -f https://noitulienhoan.com/api/dictionary || exit 1
```

### Monitoring Tools

- **Docker:** `docker-compose ps`, `docker-compose logs -f`
- **Logs:** Winston logs in `/logs` directory
- **Metrics:** Prometheus + Grafana (optional)
- **Uptime:** UptimeRobot, Pingdom

---

## 🚨 Troubleshooting

### Deployment fails

```bash
# Check GitHub Actions logs
# Go to Actions tab → Click on failed workflow → Check logs

# Common issues:
- SSH key không đúng
- Server không accessible
- Docker không chạy
- Port bị conflict
```

### Database migration fails

```bash
# SSH vào server
ssh user@server

# Run migration manually
cd /app
docker-compose exec backend npm run db:migrate

# Check migration status
docker-compose exec backend npm run db:migrate:status
```

### Application not accessible

```bash
# Check if containers are running
docker-compose ps

# Check logs
docker-compose logs backend
docker-compose logs frontend

# Restart services
docker-compose restart

# Check ports
netstat -tulpn | grep -E '3000|5173'
```

---

## 📝 Best Practices

### 1. Version Tagging

```bash
# Semantic versioning
v1.0.0  # Major.Minor.Patch

# Examples:
v1.0.0  # Initial release
v1.0.1  # Bug fix
v1.1.0  # New feature
v2.0.0  # Breaking changes
```

### 2. Deployment Checklist

- [ ] All tests passing
- [ ] Code reviewed và approved
- [ ] Database migrations tested
- [ ] Environment variables updated
- [ ] Backup database trước khi deploy
- [ ] Notify team về deployment
- [ ] Monitor logs sau deployment
- [ ] Run smoke tests
- [ ] Check health endpoints

### 3. Database Migrations

```bash
# Always backup before migration
docker-compose exec postgres pg_dump -U postgres noi_tu_db > backup.sql

# Run migration
docker-compose exec backend npm run db:migrate

# If failed, restore backup
docker-compose exec -T postgres psql -U postgres noi_tu_db < backup.sql
```

### 4. Zero-Downtime Deployment

```bash
# Use blue-green deployment
# Or rolling updates with Kubernetes
# Or load balancer với multiple instances
```

---

## 🎯 Next Steps

1. **Setup production server**
   - Rent VPS (DigitalOcean, AWS, Linode)
   - Install Docker & Docker Compose
   - Setup domain và SSL

2. **Configure CI/CD**
   - Add repository secrets
   - Test deployment to staging
   - Enable production environment protection

3. **Setup monitoring**
   - Add logging service (Sentry, LogRocket)
   - Setup uptime monitoring
   - Configure alerts

4. **Scale application**
   - Add load balancer
   - Multiple instances
   - Database replication

---

## 📚 Resources

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Docker Compose Docs](https://docs.docker.com/compose/)
- [Deployment Best Practices](https://12factor.net/)

---

**Happy Deploying! 🚀**

