# 🚀 Hướng dẫn cài đặt và chạy Game Nối Từ Liên Hoàn

## 📋 Yêu cầu hệ thống

- **Node.js** >= 18.0.0
- **PostgreSQL** >= 14.0  
- **Redis** >= 6.0
- **Docker** & **Docker Compose** (khuyên dùng)
- **npm** hoặc **yarn**

## 🐳 Cách 1: Chạy với Docker (Khuyên dùng - Dễ nhất)

### Bước 1: Clone project

```bash
git clone <your-repo-url>
cd demo_ci_cd
```

### Bước 2: Chạy Docker Compose

```bash
docker-compose up -d
```

**Lệnh này sẽ:**
- Tạo và chạy PostgreSQL database
- Tạo và chạy Redis
- Tạo và chạy Backend API
- Tạo và chạy Frontend

### Bước 3: Kiểm tra services

```bash
# Xem logs
docker-compose logs -f

# Kiểm tra services đang chạy
docker-compose ps
```

### Bước 4: Setup database

```bash
# Chạy migrations
docker-compose exec backend npm run db:migrate

# Seed dữ liệu (từ điển)
docker-compose exec backend npm run db:seed
```

### Bước 5: Truy cập ứng dụng

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **Health check:** http://localhost:3000/health

### Dừng services

```bash
docker-compose down

# Xóa cả volumes (database data)
docker-compose down -v
```

---

## 💻 Cách 2: Chạy local (Không dùng Docker)

### Bước 1: Cài đặt PostgreSQL và Redis

**Ubuntu/Debian:**
```bash
# PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Redis
sudo apt install redis-server
```

**macOS (Homebrew):**
```bash
brew install postgresql redis

# Start services
brew services start postgresql
brew services start redis
```

### Bước 2: Tạo database

```bash
# Đăng nhập PostgreSQL
sudo -u postgres psql

# Tạo database
CREATE DATABASE noi_tu_db;
CREATE USER postgres WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE noi_tu_db TO postgres;

# Thoát
\q
```

### Bước 3: Clone và cài đặt dependencies

```bash
git clone <your-repo-url>
cd demo_ci_cd

# Cài đặt tất cả dependencies
npm run install:all
```

### Bước 4: Cấu hình environment

**Backend:**
```bash
cd backend
cp .env.example .env
# Chỉnh sửa .env nếu cần (password, ports, etc.)
```

**Frontend:**
```bash
cd frontend  
cp .env.example .env
# Mặc định đã OK cho local development
```

### Bước 5: Setup database

```bash
cd backend

# Chạy migrations
npm run db:migrate

# Seed dữ liệu
npm run db:seed
```

### Bước 6: Chạy ứng dụng

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Bước 7: Truy cập

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000

---

## 🎮 Hướng dẫn chơi

### 1. Tạo phòng mới

1. Nhập tên của bạn
2. Click "Tạo phòng mới"
3. Chia sẻ mã phòng cho bạn bè

### 2. Tham gia phòng

1. Nhập tên của bạn
2. Nhập mã phòng
3. Click "Tham gia phòng"

### 3. Bắt đầu game

1. Click "Sẵn sàng" khi đủ người chơi (min 2)
2. Đợi tất cả người chơi sẵn sàng
3. Game tự động bắt đầu!

### 4. Chơi game

- Mỗi lượt có **10 giây**
- Nhập cụm từ **2 từ**, với từ đầu = từ cuối của cụm trước
- Ví dụ: "quả táo" → "táo tàu" → "tàu hoả"
- Nếu từ không có trong từ điển → Voting
- Không trả lời được → Bị vô hiệu hóa (vẫn ở lại và vote được)
- Người cuối cùng còn lại = **Winner!** 🏆

---

## 🛠️ Commands hữu ích

### Root level

```bash
# Cài đặt tất cả dependencies
npm run install:all

# Chạy cả backend và frontend
npm run dev

# Build tất cả
npm run build

# Test tất cả
npm test

# Docker commands
npm run docker:up     # Start docker services
npm run docker:down   # Stop docker services
npm run docker:logs   # View logs
```

### Backend

```bash
cd backend

# Development
npm run dev           # Chạy với nodemon (hot reload)
npm start             # Chạy production mode

# Database
npm run db:create     # Tạo database
npm run db:migrate    # Chạy migrations
npm run db:seed       # Seed data

# Testing & Quality
npm test              # Chạy tests
npm run lint          # Check code style
npm run lint:fix      # Fix code style
```

### Frontend

```bash
cd frontend

# Development
npm run dev           # Chạy dev server
npm run build         # Build cho production
npm run preview       # Preview production build

# Testing & Quality
npm test              # Chạy tests
npm run lint          # Check code style
```

---

## 🐛 Troubleshooting

### Lỗi: "Port already in use"

```bash
# Kiểm tra port đang dùng
lsof -i :3000  # Backend
lsof -i :5173  # Frontend
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis

# Kill process
kill -9 <PID>
```

### Lỗi: "Cannot connect to database"

```bash
# Kiểm tra PostgreSQL đang chạy
sudo systemctl status postgresql  # Linux
brew services list                # macOS

# Restart PostgreSQL
sudo systemctl restart postgresql # Linux
brew services restart postgresql  # macOS
```

### Lỗi: "Redis connection refused"

```bash
# Kiểm tra Redis đang chạy
redis-cli ping  # Should return "PONG"

# Start Redis
sudo systemctl start redis-server # Linux
brew services start redis         # macOS
```

### Lỗi: "Module not found"

```bash
# Xóa node_modules và cài lại
rm -rf node_modules package-lock.json
npm install

# Hoặc cài lại tất cả
cd backend && rm -rf node_modules package-lock.json && npm install
cd ../frontend && rm -rf node_modules package-lock.json && npm install
```

### Docker issues

```bash
# Rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Reset everything
docker-compose down -v
docker system prune -a
docker-compose up -d
```

---

## 📊 API Endpoints

### Health Check
```
GET http://localhost:3000/health
```

### Dictionary
```
GET http://localhost:3000/api/dictionary
GET http://localhost:3000/api/dictionary/search?q=táo
GET http://localhost:3000/api/dictionary/suggestions?word=táo
GET http://localhost:3000/api/dictionary/community
```

### WebSocket Events

**Client → Server:**
- `join_room` - Join phòng chơi
- `ready` - Sẵn sàng chơi
- `submit_word` - Gửi từ
- `vote` - Vote cho từ mới
- `chat_message` - Gửi chat

**Server → Client:**
- `room_updated` - Cập nhật thông tin phòng
- `game_started` - Game bắt đầu
- `turn_changed` - Đổi lượt
- `word_submitted` - Từ mới được gửi
- `voting_started` - Bắt đầu voting
- `player_disabled` - Player bị vô hiệu hóa
- `game_ended` - Game kết thúc

---

## 🎯 Testing

### Backend Tests

```bash
cd backend
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage
```

### Frontend Tests

```bash
cd frontend
npm test              # Run all tests
```

---

## 📝 Development Tips

### Hot Reload

- Backend tự động reload khi code thay đổi (nodemon)
- Frontend tự động reload (Vite HMR)

### Debug Mode

**Backend:**
```bash
NODE_ENV=development DEBUG=* npm run dev
```

**Frontend:**
```bash
# Mở DevTools trong browser (F12)
# Check Console và Network tabs
```

### Database GUI

- **pgAdmin:** GUI cho PostgreSQL
- **Redis Commander:** GUI cho Redis

```bash
# Install Redis Commander globally
npm install -g redis-commander

# Run
redis-commander
# Open http://localhost:8081
```

---

## 🚀 Deployment

Xem file [README.md](README.md) để biết thêm về deployment lên production.

---

## 📞 Support

Nếu gặp vấn đề:

1. Check file [README.md](README.md) - Troubleshooting section
2. Xem logs: `docker-compose logs -f` hoặc `npm run dev`
3. Create issue trên GitHub

---

**Happy Coding! 🎮🚀**

