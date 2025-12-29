# 🚀 Deployment Guide

## Kiến trúc deployment:

```
GitHub Pages (noitu.khanhcs.id.vn)
  ↓
Frontend React (static files)
  ↓ API calls
Cloudflare Tunnel (apinoitu.khanhcs.id.vn)
  ↓
Backend Docker (local machine)
  ↓
PostgreSQL + Redis
```

---

## 📦 **1. Deploy Frontend lên GitHub Pages**

### Bước 1: Enable GitHub Pages

1. Vào repo Settings: `https://github.com/[username]/demo_ci_cd/settings/pages`
2. **Source**: Chọn **GitHub Actions**
3. Save

### Bước 2: Push code

```bash
git add .
git commit -m "Setup GitHub Pages deployment"
git push origin main
```

Workflow sẽ tự động chạy và deploy frontend lên:
- `https://[username].github.io/demo_ci_cd/` (mặc định)
- `https://noitu.khanhcs.id.vn` (custom domain)

---

## 🖥️ **2. Chạy Backend trên Local**

### Chỉ chạy Backend (không cần frontend):

```bash
# Sử dụng file docker-compose.backend.yml
docker-compose -f docker-compose.backend.yml up -d

# Hoặc chạy selective services từ file gốc
docker-compose up postgres redis backend -d
```

### Kiểm tra logs:

```bash
docker-compose -f docker-compose.backend.yml logs -f backend
```

### Stop services:

```bash
docker-compose -f docker-compose.backend.yml down
```

---

## 🌐 **3. Setup Cloudflare Tunnel**

### File config: `~/.cloudflared/config.yml`

```yaml
tunnel: [your-tunnel-id]
credentials-file: /home/khanh/.cloudflared/[tunnel-id].json

ingress:
  # Backend API
  - hostname: apinoitu.khanhcs.id.vn
    service: http://localhost:4000
  
  # Catch-all
  - service: http_status:404
```

### Chạy tunnel:

```bash
cloudflared tunnel run noitu
```

### Hoặc chạy background:

```bash
cloudflared service install
sudo systemctl start cloudflared
sudo systemctl enable cloudflared
```

---

## 🔧 **4. Update CORS Origin**

Nếu GitHub Pages domain khác, update trong `docker-compose.backend.yml`:

```yaml
environment:
  CORS_ORIGIN: https://[your-github-username].github.io,https://noitu.khanhcs.id.vn
```

---

## ✅ **5. Verify Deployment**

### Frontend (GitHub Pages):
- URL: `https://noitu.khanhcs.id.vn`
- Check: Trang web load được

### Backend (Cloudflare Tunnel):
- URL: `https://apinoitu.khanhcs.id.vn/health`
- Response: `{"status":"ok","timestamp":"..."}`

### WebSocket:
- URL: `https://apinoitu.khanhcs.id.vn`
- Check: Tạo room và chơi game thử

---

## 🛠️ **Troubleshooting**

### Frontend không connect được backend:

```bash
# 1. Check backend đang chạy
docker ps | grep noi-tu-backend

# 2. Check Cloudflare tunnel
curl https://apinoitu.khanhcs.id.vn/health

# 3. Check CORS trong logs
docker logs noi-tu-backend
```

### Database issues:

```bash
# Reset database
docker-compose -f docker-compose.backend.yml down -v
docker-compose -f docker-compose.backend.yml up -d
```

---

## 📝 **Development vs Production**

### Local Development (Full stack):

```bash
# Chạy cả frontend + backend
docker-compose up
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`

### Production (GitHub Pages + Cloudflare):

```bash
# Chỉ chạy backend
docker-compose -f docker-compose.backend.yml up -d

# Chạy Cloudflare tunnel
cloudflared tunnel run noitu
```

- Frontend: `https://noitu.khanhcs.id.vn` (GitHub Pages)
- Backend: `https://apinoitu.khanhcs.id.vn` (Cloudflare Tunnel)

---

## 🔄 **Update Flow**

### Update Frontend:

```bash
git add frontend/
git commit -m "Update frontend"
git push origin main
# GitHub Actions sẽ tự động deploy
```

### Update Backend:

```bash
# 1. Rebuild image
docker-compose -f docker-compose.backend.yml up -d --build

# 2. Cloudflare tunnel tự động forward
```

---

## 💰 **Chi phí**

- ✅ GitHub Pages: **Miễn phí**
- ✅ Cloudflare Tunnel: **Miễn phí**
- ⚠️ Điện máy local: ~$5-10/tháng (nếu chạy 24/7)
- ℹ️ Tổng: **Gần như miễn phí!**
