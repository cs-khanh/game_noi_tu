# 🌐 Cloudflare Setup Guide

## Tổng quan kiến trúc:

```
┌─────────────────────────────────────┐
│  Cloudflare DNS + Tunnel            │
└─────────────────────────────────────┘
              │
    ┌─────────┴─────────┐
    │                   │
    ▼                   ▼
┌─────────┐      ┌──────────────┐
│ Frontend│      │   Backend    │
│  (DNS)  │      │   (Tunnel)   │
└─────────┘      └──────────────┘
    │                   │
    ▼                   ▼
GitHub Pages     Docker (Local)
noitu.khanhcs    apinoitu.khanhcs
```

---

## 📋 **Phần 1: Frontend - Custom Domain cho GitHub Pages**

### **A. Cloudflare DNS Record:**

1. Đăng nhập Cloudflare Dashboard
2. Chọn domain `khanhcs.id.vn`
3. Vào tab **DNS** → **Records**
4. Click **Add record**

**Thêm CNAME record:**

```
Type: CNAME
Name: noitu
Content/Target: cs-khanh.github.io
Proxy status: ✅ Proxied (hoặc DNS only - cả 2 đều OK)
TTL: Auto
```

**Kết quả:** `noitu.khanhcs.id.vn` → trỏ đến GitHub Pages

### **B. Verify DNS:**

```bash
# Check DNS đã propagate chưa
nslookup noitu.khanhcs.id.vn
# hoặc
dig noitu.khanhcs.id.vn
```

### **C. GitHub Pages Settings:**

1. Vào repo: `https://github.com/cs-khanh/game_noi_tu/settings/pages`
2. **Custom domain**: Nhập `noitu.khanhcs.id.vn`
3. Click **Save**
4. Đợi DNS check (~5-10 phút)
5. Sau khi xuất hiện ✅ checkmark:
   - Bật **Enforce HTTPS**

**Note:** GitHub sẽ tự động tạo file `CNAME` trong repo.

---

## 📋 **Phần 2: Backend - Cloudflare Tunnel**

### **A. Tạo Tunnel:**

```bash
# 1. Login
cloudflared tunnel login

# 2. Tạo tunnel
cloudflared tunnel create noitu

# 3. Note tunnel ID (xuất hiện sau khi tạo)
# Tunnel credentials saved to: ~/.cloudflared/[TUNNEL-ID].json
```

### **B. Tạo file config:**

File: `~/.cloudflared/config.yml`

```yaml
tunnel: [TUNNEL-ID]
credentials-file: /home/khanh/.cloudflared/[TUNNEL-ID].json

ingress:
  # Backend API endpoint
  - hostname: apinoitu.khanhcs.id.vn
    service: http://localhost:4000
  
  # Catch-all rule (required)
  - service: http_status:404
```

### **C. Route DNS qua Tunnel:**

```bash
# Link tunnel với domain
cloudflared tunnel route dns noitu apinoitu.khanhcs.id.vn
```

**Lệnh này sẽ tự động tạo CNAME record trong Cloudflare:**

```
Type: CNAME
Name: apinoitu
Content: [TUNNEL-ID].cfargotunnel.com
Proxy status: ✅ Proxied
```

### **D. Chạy Tunnel:**

```bash
# Test trước (foreground)
cloudflared tunnel run noitu

# Nếu OK, chạy background (như service)
cloudflared service install
sudo systemctl start cloudflared
sudo systemctl enable cloudflared  # Auto-start on boot
```

### **E. Verify Backend:**

```bash
# Check tunnel status
cloudflared tunnel list

# Test API endpoint
curl https://apinoitu.khanhcs.id.vn/health
# Expected: {"status":"ok","timestamp":"..."}
```

---

## 📊 **DNS Records Summary:**

Sau khi setup xong, trong Cloudflare DNS sẽ có:

```
┌──────────┬───────┬─────────────────────────────────────┬────────┐
│   Name   │ Type  │              Content                │ Proxy  │
├──────────┼───────┼─────────────────────────────────────┼────────┤
│ noitu    │ CNAME │ cs-khanh.github.io                  │ ✅ Yes │
│ apinoitu │ CNAME │ [tunnel-id].cfargotunnel.com        │ ✅ Yes │
└──────────┴───────┴─────────────────────────────────────┴────────┘
```

---

## 🔧 **Troubleshooting:**

### **Frontend không load (noitu.khanhcs.id.vn):**

```bash
# 1. Check DNS
nslookup noitu.khanhcs.id.vn

# 2. Check GitHub Pages
# Vào Settings → Pages, phải thấy:
# "Your site is published at https://noitu.khanhcs.id.vn/"

# 3. Xóa cache browser và thử lại
```

### **Backend không kết nối (apinoitu.khanhcs.id.vn):**

```bash
# 1. Check tunnel đang chạy
cloudflared tunnel list
# Status phải là "healthy"

# 2. Check backend container
docker ps | grep noi-tu-backend
docker logs noi-tu-backend

# 3. Test local trước
curl http://localhost:4000/health

# 4. Test qua tunnel
curl https://apinoitu.khanhcs.id.vn/health
```

### **CORS errors:**

Check `docker-compose.backend.yml`:

```yaml
CORS_ORIGIN: https://noitu.khanhcs.id.vn,https://cs-khanh.github.io,http://localhost:5173
```

Restart backend sau khi sửa:

```bash
docker-compose -f docker-compose.backend.yml restart backend
```

---

## 🔄 **Update Tunnel Config:**

Nếu cần thay đổi config:

```bash
# 1. Sửa file config
vim ~/.cloudflared/config.yml

# 2. Restart tunnel
sudo systemctl restart cloudflared

# hoặc nếu chạy foreground:
# Ctrl+C để stop, rồi chạy lại:
cloudflared tunnel run noitu
```

---

## 🗑️ **Xóa Tunnel (nếu cần):**

```bash
# 1. Stop service
sudo systemctl stop cloudflared
sudo systemctl disable cloudflared
cloudflared service uninstall

# 2. Xóa tunnel
cloudflared tunnel delete noitu

# 3. Xóa DNS record trên Cloudflare (thủ công)
```

---

## 💡 **Tips:**

1. **Proxy Status:**
   - ✅ Proxied: Request đi qua Cloudflare (có cache, DDoS protection)
   - ⚪ DNS only: Trỏ thẳng đến target (nhanh hơn nhưng không có protection)

2. **SSL/TLS:**
   - GitHub Pages: Tự động có SSL (Let's Encrypt)
   - Cloudflare Tunnel: Tự động có SSL (Cloudflare cert)

3. **Free Tier:**
   - Cloudflare DNS: Miễn phí
   - Cloudflare Tunnel: Miễn phí
   - GitHub Pages: Miễn phí (public repo)

---

## ✅ **Checklist:**

- [ ] Cloudflare account với domain `khanhcs.id.vn`
- [ ] `cloudflared` đã cài đặt
- [ ] Tunnel đã tạo và config
- [ ] DNS records đã setup (noitu, apinoitu)
- [ ] GitHub Pages custom domain đã verify
- [ ] Backend CORS đã update với đúng domains
- [ ] Test cả 2 URLs hoạt động

