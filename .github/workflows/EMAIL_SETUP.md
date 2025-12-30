# 📧 Cấu hình Email Notifications cho CI/CD

Workflow này sẽ tự động gửi email thông báo trạng thái sau khi các workflow CI/CD hoàn thành.

## 📋 Các Workflow Email

1. **send-ci-status-email.yml** - Gửi email sau khi CI workflow hoàn thành
2. **send-cd-status-email.yml** - Gửi email sau khi CD workflow hoàn thành  
3. **send-pages-status-email.yml** - Gửi email sau khi deploy GitHub Pages hoàn thành

## 🔐 Cấu hình Secrets

Để sử dụng tính năng gửi email, bạn cần cấu hình các secrets sau trong GitHub Repository Settings:

### Bước 1: Vào Repository Settings
1. Vào repository trên GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

### Bước 2: Thêm các secrets sau:

#### SMTP Configuration
- **`SMTP_SERVER`**: Địa chỉ SMTP server (ví dụ: `smtp.gmail.com`, `smtp.sendgrid.net`)
- **`SMTP_PORT`**: Port SMTP (ví dụ: `587` cho TLS, `465` cho SSL, `25` cho không mã hóa)
- **`SMTP_USERNAME`**: Username để đăng nhập SMTP
- **`SMTP_PASSWORD`**: Password hoặc App Password cho SMTP

#### Email Configuration
- **`EMAIL_FROM`**: Email người gửi (ví dụ: `noreply@yourdomain.com` hoặc `your-email@gmail.com`)
- **`EMAIL_TO`**: Email người nhận (ví dụ: `your-email@gmail.com`)

## 📝 Ví dụ cấu hình

### Gmail SMTP
```
SMTP_SERVER: smtp.gmail.com
SMTP_PORT: 587
SMTP_USERNAME: your-email@gmail.com
SMTP_PASSWORD: your-app-password (tạo App Password trong Google Account)
EMAIL_FROM: your-email@gmail.com
EMAIL_TO: recipient@gmail.com
```

**Lưu ý**: Với Gmail, bạn cần:
1. Bật 2-Step Verification
2. Tạo App Password tại: https://myaccount.google.com/apppasswords
3. Sử dụng App Password thay vì mật khẩu thông thường

### SendGrid SMTP
```
SMTP_SERVER: smtp.sendgrid.net
SMTP_PORT: 587
SMTP_USERNAME: apikey
SMTP_PASSWORD: your-sendgrid-api-key
EMAIL_FROM: noreply@yourdomain.com
EMAIL_TO: recipient@email.com
```

### Outlook/Hotmail SMTP
```
SMTP_SERVER: smtp-mail.outlook.com
SMTP_PORT: 587
SMTP_USERNAME: your-email@outlook.com
SMTP_PASSWORD: your-password
EMAIL_FROM: your-email@outlook.com
EMAIL_TO: recipient@email.com
```

### Custom SMTP Server
```
SMTP_SERVER: mail.yourdomain.com
SMTP_PORT: 587 (hoặc 465, 25)
SMTP_USERNAME: noreply@yourdomain.com
SMTP_PASSWORD: your-password
EMAIL_FROM: noreply@yourdomain.com
EMAIL_TO: recipient@email.com
```

## 🎨 Nội dung Email

Email sẽ bao gồm:
- ✅/❌/⚠️ Trạng thái workflow (Thành công/Thất bại/Đã hủy)
- Tên workflow
- Branch và commit
- Commit message
- Người thực hiện
- Thời gian
- Link đến workflow run trên GitHub

## 🔍 Kiểm tra

Sau khi cấu hình secrets:
1. Push code hoặc trigger một workflow CI/CD
2. Sau khi workflow hoàn thành, workflow email sẽ tự động chạy
3. Kiểm tra email inbox của `EMAIL_TO`

## ⚠️ Lưu ý

- Workflow email chỉ chạy khi workflow gốc **không bị skip**
- Nếu không cấu hình secrets, workflow email sẽ skip (không báo lỗi)
- Email được gửi dạng HTML với styling đẹp
- Có thể cấu hình nhiều email nhận bằng cách thêm nhiều `EMAIL_TO` secrets hoặc dùng email group

## 🛠️ Troubleshooting

### Email không được gửi
1. Kiểm tra secrets đã được cấu hình đúng chưa
2. Kiểm tra SMTP credentials có đúng không
3. Xem logs của workflow email trong Actions tab
4. Kiểm tra spam folder

### Lỗi authentication
- Với Gmail: Đảm bảo đã tạo App Password, không dùng mật khẩu thông thường
- Với các provider khác: Kiểm tra username/password có đúng không

### Lỗi connection
- Kiểm tra SMTP server và port có đúng không
- Kiểm tra firewall/network có block port SMTP không

