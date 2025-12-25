# 🌐 Cloudflare Tunnel Setup Guide

## 📋 Thông tin Domain & Port

- **Frontend:** https://noitu.khanhcs.id.vn → localhost:5173
- **Backend API:** https://apinoitu.khanhcs.id.vn → localhost:4000

---

## 🚀 Setup Cloudflare Tunnel

### 1. Cài đặt cloudflared

**Linux:**
```bash
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
```

**macOS:**
```bash
brew install cloudflare/cloudflare/cloudflared
```

**Windows:**
Download từ: https://github.com/cloudflare/cloudflared/releases

---

### 2. Login vào Cloudflare

```bash
cloudflared tunnel login
```

Trình duyệt sẽ mở, chọn domain `khanhcs.id.vn` để authorize.

---

### 3. Tạo Tunnel

```bash
# Tạo tunnel mới
cloudflared tunnel create noi-tu-game

# Lưu lại Tunnel ID được hiển thị
# Example: ab12cd34-ef56-gh78-ij90-kl12mn34op56
```

---

### 4. Tạo file config

Tạo file: `~/.cloudflared/config.yml`

```yaml
tunnel: <YOUR-TUNNEL-ID>
credentials-file: /home/khanh/.cloudflared/<YOUR-TUNNEL-ID>.json

ingress:
  # Frontend
  - hostname: noitu.khanhcs.id.vn
    service: http://localhost:5173
    originRequest:
      noTLSVerify: true
  
  # Backend API & WebSocket
  - hostname: apinoitu.khanhcs.id.vn
    service: http://localhost:4000
    originRequest:
      noTLSVerify: true
      connectTimeout: 30s
      http2Origin: false
  
  # Catch-all rule (bắt buộc)
  - service: http_status:404
```

---

### 5. Tạo DNS Records

```bash
# Frontend
cloudflared tunnel route dns noi-tu-game noitu.khanhcs.id.vn

# Backend API
cloudflared tunnel route dns noi-tu-game apinoitu.khanhcs.id.vn
```

**Hoặc tạo thủ công trên Cloudflare Dashboard:**

1. Vào **DNS Settings** của domain `khanhcs.id.vn`
2. Thêm 2 CNAME records:

```
Type: CNAME
Name: noitu
Content: <YOUR-TUNNEL-ID>.cfargotunnel.com
Proxied: Yes (Orange cloud)

Type: CNAME
Name: apinoitu
Content: <YOUR-TUNNEL-ID>.cfargotunnel.com
Proxied: Yes (Orange cloud)
```

---

### 6. Chạy Tunnel

**Chạy một lần (test):**
```bash
cloudflared tunnel run noi-tu-game
```

**Chạy như service (khuyên dùng):**

**Linux:**
```bash
sudo cloudflared service install
sudo systemctl start cloudflared
sudo systemctl enable cloudflared
```

**Kiểm tra status:**
```bash
sudo systemctl status cloudflared
```

---

## 🔧 Start Application

### Cách 1: Local Development (không dùng Cloudflare)

```bash
cd /home/khanh/demo_git/demo_ci_cd

# Start với config local
docker compose up -d --build

# Truy cập: http://localhost:5173
```

### Cách 2: Production với Cloudflare Tunnel (Khuyên dùng)

```bash
cd /home/khanh/demo_git/demo_ci_cd

# Stop containers cũ
docker compose down

# Start với config production (override env vars)
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Chờ services khởi động (30 giây)
sleep 30

# Kiểm tra logs
docker compose logs -f
```

**Lưu ý:** Chỉ dùng `docker-compose.prod.yml` khi bạn đã setup Cloudflare Tunnel!

### Cách 2: Local (không dùng Docker)

**Terminal 1 - Backend:**
```bash
cd backend
cp .env.example .env

# Edit .env:
# PORT=4000
# CORS_ORIGIN=https://noitu.khanhcs.id.vn

npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
cp .env.example .env

# Edit .env:
# VITE_API_URL=https://apinoitu.khanhcs.id.vn
# VITE_WS_URL=https://apinoitu.khanhcs.id.vn

npm run dev
```

---

## ✅ Kiểm tra

### 1. Kiểm tra Tunnel đang chạy:

```bash
cloudflared tunnel list
cloudflared tunnel info noi-tu-game
```

### 2. Kiểm tra services local:

```bash
# Backend
curl http://localhost:4000/health

# Frontend
curl http://localhost:5173
```

### 3. Kiểm tra qua domain:

```bash
# Backend API
curl https://apinoitu.khanhcs.id.vn/health

# Frontend
curl https://noitu.khanhcs.id.vn
```

### 4. Truy cập trên browser:

- **Frontend:** https://noitu.khanhcs.id.vn
- **Backend API:** https://apinoitu.khanhcs.id.vn/health

---

## 🐛 Troubleshooting

### Lỗi: "Unable to reach the origin service"

```bash
# Kiểm tra services đang chạy
docker compose ps

# Restart services
docker compose restart

# Kiểm tra Cloudflare Tunnel logs
cloudflared tunnel info noi-tu-game
```

### Lỗi: CORS

Nếu frontend không connect được backend, kiểm tra CORS origin:

```bash
# Vào backend container
docker compose exec backend sh

# Check env
echo $CORS_ORIGIN
# Should show: https://noitu.khanhcs.id.vn,http://localhost:5173
```

### Lỗi: WebSocket connection failed

WebSocket cần HTTP/2 disabled trong tunnel config:

```yaml
- hostname: apinoitu.khanhcs.id.vn
  service: http://localhost:4000
  originRequest:
    http2Origin: false  # Important for WebSocket
```

### Lỗi: DNS chưa propagate

DNS có thể mất vài phút. Kiểm tra:

```bash
# Check DNS
nslookup noitu.khanhcs.id.vn
nslookup apinoitu.khanhcs.id.vn

# Hoặc dùng dig
dig noitu.khanhcs.id.vn
dig apinoitu.khanhcs.id.vn
```

---

## 📊 Monitoring

### Xem logs Cloudflare Tunnel:

```bash
# Real-time logs
sudo journalctl -u cloudflared -f

# Recent logs
sudo journalctl -u cloudflared -n 100
```

### Xem logs Application:

```bash
# All services
docker compose logs -f

# Backend only
docker compose logs -f backend

# Frontend only
docker compose logs -f frontend
```

---

## 🔒 Security (Production)

### 1. Update CORS cho production only:

```yaml
# docker-compose.yml
environment:
  CORS_ORIGIN: https://noitu.khanhcs.id.vn
```

### 2. Enable Cloudflare features:

- **SSL/TLS:** Full (strict)
- **WAF:** Enable
- **Rate Limiting:** Protect backend API
- **Bot Fight Mode:** Enable

### 3. Environment variables:

Không hardcode secrets trong docker-compose.yml. Dùng file `.env`:

```bash
# .env
JWT_SECRET=your-super-secret-production-key
DB_PASSWORD=strong-password-here
```

---

## 🚀 Auto-start on Boot

### Linux (systemd):

Cloudflare Tunnel đã tự động start on boot nếu install như service.

### Docker:

```yaml
# docker-compose.yml
services:
  backend:
    restart: unless-stopped
  frontend:
    restart: unless-stopped
```

---

## 📝 Summary

**Đã setup:**
- ✅ Backend port: 4000
- ✅ Frontend domain: https://noitu.khanhcs.id.vn
- ✅ Backend domain: https://apinoitu.khanhcs.id.vn
- ✅ CORS configured
- ✅ WebSocket support

**Next steps:**
1. Install cloudflared
2. Create tunnel
3. Configure DNS
4. Start tunnel & app
5. Test trên browser

---

**Happy Deploying! 🎮🚀**

