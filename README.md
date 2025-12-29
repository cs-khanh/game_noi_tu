# 🎮 Nối Từ Liên Hoàn

Game nối từ ghép trực tuyến nhiều người chơi với hệ thống voting cộng đồng.

[![CI/CD Status](https://github.com/yourusername/noi-tu-lien-hoan/workflows/CI/badge.svg)](https://github.com/cs-khanh/game_noi_tu/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 📖 Giới thiệu

**Nối Từ Liên Hoàn** là trò chơi nối từ ghép theo team, nơi người chơi phải tạo cụm từ mới bằng cách sử dụng từ cuối của cụm trước làm từ đầu của cụm mới. Game kết hợp giữa tư duy nhanh, vốn từ vựng phong phú và yếu tố cộng đồng thông qua hệ thống voting dân chủ.

### Ví dụ gameplay:

```
Player 1: "quả táo"
           ↓
Player 2: "táo tàu" (bắt đầu bằng "táo")
           ↓
Player 3: "tàu hoả" (bắt đầu bằng "tàu")
           ↓
Player 4: "hoả tiễn" (bắt đầu bằng "hoả")
           ↓
Player 1: "tiễn đưa" (bắt đầu bằng "tiễn")
```

### 🎯 Luật chơi cốt lõi:

- ⏱️ **10 giây/lượt** - Mỗi người chơi có 10 giây để trả lời
- 🎮 **Chơi đến 1 người** - Game kết thúc khi chỉ còn 1 người không bị vô hiệu hóa
- 🚫 **Vô hiệu hóa** - Không trả lời được → Bị vô hiệu cho các vòng tiếp theo (vẫn ở lại và vote được)
- 🗳️ **Vote từ mới** - Từ không có trong từ điển cần >50% vote để chấp nhận

## ✨ Tính năng chính

### 🎯 Gameplay

- **Nối từ ghép theo lượt**: Mỗi người chơi đưa ra cụm từ 2 từ, với từ đầu phải trùng với từ cuối của cụm trước
- **Hệ thống từ điển**: Database từ ghép tiếng Việt được chuẩn bị sẵn
- **Lịch sử từ đã dùng**: Tất cả từ đã được trả lời hiển thị trong phòng để người chơi tham khảo và tránh lặp lại
- **Voting cộng đồng**: Khi có từ mới không có trong từ điển, tất cả người chơi còn lại sẽ vote để quyết định
- **Thời gian giới hạn**: Mỗi lượt chỉ có **10 giây** để suy nghĩ
- **Vô hiệu hóa**: Người chơi bị vô hiệu hóa khi hết giờ, từ không hợp lệ, hoặc dùng từ đã dùng (vẫn ở lại phòng và có thể vote)

### 👥 Multiplayer

- **2-8 người chơi** mỗi phòng
- **Real-time gameplay** với WebSocket
- **Phòng công khai & riêng tư** với mã code
- **Thứ tự chơi ngẫu nhiên** trước khi bắt đầu
- **Chat trong phòng** để tương tác

### ⏱️ Giới hạn thời gian

- Mỗi lượt chơi có **10 giây** để trả lời
- Không trả lời được → **Vô hiệu hóa** cho các vòng tiếp theo (skip turn)
- Người chơi bị vô hiệu vẫn có thể vote cho từ mới
- Game tiếp tục cho đến khi chỉ còn **1 người chơi** không bị vô hiệu

### 📊 Social Features

- Profile cá nhân với thống kê
- Bảng xếp hạng (theo ngày/tuần/tháng)
- Lịch sử đóng góp từ mới
- Thành tựu & huy hiệu

## 🎲 Luật chơi chi tiết

### Quy tắc cơ bản

1. **Cấu trúc từ:**
   - Mỗi lượt phải đưa ra **cụm từ gồm đúng 2 từ**
   - Từ đầu của cụm mới = Từ cuối của cụm trước

2. **Thời gian:**
   - Mỗi lượt có **10 giây** để suy nghĩ và trả lời
   - Đếm ngược hiển thị rõ ràng
   - Không có thêm thời gian bonus

3. **Từ hợp lệ:**
   - ✅ Có trong từ điển chuẩn bị sẵn
   - ✅ Cụm từ thông dụng, có nghĩa rõ ràng
   - ✅ Từ ghép (táo tàu, bàn ghế)
   - ✅ Cụm danh từ (con người, cà phê)
   - ✅ Cụm động từ (đi chơi, ăn uống)

4. **Từ không hợp lệ:**
   - ❌ Từ đã được sử dụng trong ván này
   - ❌ Cụm từ không có nghĩa
   - ❌ Nhiều hơn hoặc ít hơn 2 từ
   - ❌ Không nối được với từ trước

### Hệ thống Voting

Khi người chơi đưa ra từ **không có trong từ điển**:

1. ⏸️ **Game tạm dừng**
2. 🗳️ **Hiển thị popup voting** cho tất cả người chơi khác
3. ⏱️ **15 giây** để vote (Chấp nhận ✅ / Từ chối ❌)
4. 📊 **Tính kết quả:**
   - Nếu **>50% vote Chấp nhận** → Từ được thêm vào từ điển
   - Nếu **≤50% vote Từ chối** → Người chơi đó bị **vô hiệu hóa** cho các vòng tiếp theo

**Ví dụ:**
```
5 người chơi, Player A đưa ra "táo quả" (từ mới)

Voting:
- Player B: ✅ Chấp nhận
- Player C: ✅ Chấp nhận  
- Player D: ❌ Từ chối
- Player E: Không vote

Kết quả: 2 / (2+1) = 66.7% > 50%
→ ✅ Chấp nhận! "táo quả" được thêm vào từ điển
```

### Điều kiện bị vô hiệu hóa

Người chơi sẽ bị **vô hiệu hóa** (không được chơi các vòng tiếp theo) khi:

- ⏰ **Hết thời gian** (10 giây) không submit từ
- ❌ **Từ không hợp lệ** và bị vote từ chối
- 🔁 **Dùng từ đã sử dụng** trong ván này
- 🚫 **Không nối được** với từ trước đó

**Lưu ý:** Người chơi bị vô hiệu hóa vẫn:
- ✅ Ở lại trong phòng
- ✅ Có thể vote cho từ mới
- ✅ Xem game tiếp diễn
- ❌ Không được chơi các vòng tiếp theo

### Kết thúc game

- 🏆 **Người chiến thắng**: Người chơi cuối cùng **không bị vô hiệu hóa**
- 🎮 Game kết thúc khi chỉ còn **1 người chơi active**
- 🤝 **Hoà**: Tất cả người chơi còn lại cùng bị vô hiệu hóa trong 1 vòng (hiếm khi xảy ra)

## 🎨 Giao diện Game

### Main Game Screen:

```
┌────────────────────────────────────────────────────────────┐
│  🎮 Nối Từ Liên Hoàn              Room: #ABC123  [⚙️] [🚪] │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  👥 Người chơi:                    📜 Lịch sử từ đã dùng:  │
│  ┌──────────────────┐             ┌──────────────────────┐ │
│  │ 1. [YOU] ⭐      │             │ 1. quả táo           │ │
│  │    Active        │             │ 2. táo tàu           │ │
│  │                  │             │ 3. tàu hoả           │ │
│  │ 2. Player B 🎯   │             │ 4. hoả tiễn          │ │
│  │    Playing...    │             │ 5. tiễn đưa          │ │
│  │                  │             │ 6. đưa đón           │ │
│  │ 3. Player C 💀   │             │ 7. đón nhận          │ │
│  │    Disabled      │             │ 8. nhận thức         │ │
│  │                  │             │    ...               │ │
│  │ 4. Player D 💤   │             │                      │ │
│  │    Waiting       │             │ [Scroll for more...] │ │
│  └──────────────────┘             └──────────────────────┘ │
│                                                            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│              🎯 Từ hiện tại: "thức"                        │
│                                                            │
│              ⏱️  8s                                         │
│                                                            │
│  Player B đang suy nghĩ...                                │
│                                                            │
│  Nhập từ của bạn:                                         │
│  ┌────────────────────────────────────────────────┐       │
│  │ thức_____                                      │       │
│  └────────────────────────────────────────────────┘       │
│                                                            │
│  💡 Gợi ý: thức ăn, thức dậy, thức giấc...                │
│                                                            │
│  [Gửi từ] [Bỏ qua]                                        │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Lịch sử từ - Chi tiết:

```
┌──────────────────────────────────┐
│  📜 Lịch sử từ đã sử dụng        │
├──────────────────────────────────┤
│                                  │
│  1. quả táo       👤 Player A    │
│  2. táo tàu       👤 You         │
│  3. tàu hoả       👤 Player B    │
│  4. hoả tiễn      👤 Player C    │
│  5. tiễn đưa      👤 Player A    │
│  6. đưa đón       👤 You         │
│  7. đón nhận      👤 Player B    │
│  8. nhận thức     👤 Player A    │
│  9. thức ăn       👤 You         │
│ 10. ăn uống       👤 Player B    │
│     ...                          │
│                                  │
│  ❌ Từ đã dùng không được lặp!   │
│                                  │
│  [Tìm kiếm từ...] 🔍            │
│                                  │
└──────────────────────────────────┘
```

### Voting Popup:

```
┌─────────────────────────────────────┐
│   🗳️  Voting: Từ mới từ Player B    │
├─────────────────────────────────────┤
│                                     │
│  Từ đề xuất:                        │
│                                     │
│      "thức tỉnh"                    │
│                                     │
│  Nghĩa: Tỉnh táo, sáng suốt        │
│                                     │
│  ⏱️  12s                             │
│                                     │
│  Bạn có chấp nhận từ này?           │
│                                     │
│  [✅ Chấp nhận]  [❌ Từ chối]        │
│                                     │
│  Voting hiện tại:                   │
│  ████████░░ 3✅  1❌  (75%)         │
│                                     │
│  Player A: ✅                       │
│  Player C: ✅                       │
│  Player D: ✅                       │
│  Player E: ❌                       │
│                                     │
└─────────────────────────────────────┘
```

### Player bị vô hiệu hóa:

```
┌────────────────────────────────┐
│  ⚠️  Bạn đã bị vô hiệu hóa!    │
├────────────────────────────────┤
│                                │
│  Lý do: Hết thời gian          │
│                                │
│  Bạn không thể chơi các vòng   │
│  tiếp theo, nhưng vẫn có thể:  │
│                                │
│  ✅ Xem game diễn ra            │
│  ✅ Vote cho từ mới             │
│  ✅ Chat với người chơi khác    │
│                                │
│  [OK, Tôi hiểu]                │
│                                │
└────────────────────────────────┘
```

### Tính năng của Lịch sử từ:

1. **Hiển thị real-time:** 
   - Cập nhật ngay khi có từ mới
   - Animation khi từ được thêm vào
   - Highlight từ vừa được thêm

2. **Thông tin chi tiết:**
   - Số thứ tự từ
   - Cụm từ đã dùng
   - Người chơi nào đã dùng từ đó
   - Từ mới (do cộng đồng vote) có icon đặc biệt ⭐

3. **Tìm kiếm & Filter:**
   - Tìm kiếm từ trong lịch sử
   - Filter theo người chơi
   - Highlight từ tìm được

4. **Responsive:**
   - Desktop: Panel bên phải
   - Mobile: Swipe lên để xem
   - Tablet: Overlay khi cần

5. **Validation trực quan:**
   - Khi nhập từ, hệ thống check real-time
   - Nếu từ đã dùng → Highlight trong list + cảnh báo
   - Gợi ý từ chưa dùng

## 🚀 Bắt đầu

### Yêu cầu hệ thống

- **Node.js** >= 18.0.0
- **PostgreSQL** >= 14.0
- **Redis** >= 6.0 (cho caching & room state)
- **npm** hoặc **yarn**

### Cài đặt

1. **Clone repository:**

```bash
git clone https://github.com/yourusername/noi-tu-lien-hoan.git
cd noi-tu-lien-hoan
```

2. **Cài đặt dependencies:**

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

3. **Cấu hình môi trường:**

```bash
# Backend
cp backend/.env.example backend/.env
# Chỉnh sửa .env với thông tin database, Redis, JWT secret, etc.

# Frontend
cp frontend/.env.example frontend/.env
# Chỉnh sửa API URL
```

4. **Setup database:**

```bash
cd backend

# Tạo database
npm run db:create

# Chạy migrations
npm run db:migrate

# Seed dữ liệu mẫu (từ điển, users demo)
npm run db:seed
```

5. **Chạy ứng dụng:**

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

6. **Truy cập:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - API Docs: http://localhost:3000/api-docs

### Docker (Khuyên dùng)

```bash
# Build và chạy tất cả services
docker-compose up -d

# Xem logs
docker-compose logs -f

# Dừng services
docker-compose down
```

## 🏗️ Kiến trúc hệ thống

### Tech Stack

**Frontend:**
- ⚛️ **React 18** + **Vite** - UI framework
- 🎨 **Tailwind CSS** - Styling
- 🎭 **Framer Motion** - Animations
- 🔌 **Socket.io Client** - Real-time communication
- 📊 **Recharts** - Data visualization
- 🧭 **React Router** - Routing
- 🔐 **Zustand** - State management

**Backend:**
- 🟢 **Node.js** + **Express** - Server framework
- 🔌 **Socket.io** - WebSocket server
- 🗄️ **PostgreSQL** - Main database
- ⚡ **Redis** - Caching & session store
- 🔐 **JWT** - Authentication
- ✅ **Joi** - Validation
- 📝 **Winston** - Logging

**DevOps:**
- 🐳 **Docker** + **Docker Compose** - Containerization
- 🔄 **GitHub Actions** - CI/CD
- 📊 **Prometheus** + **Grafana** - Monitoring (optional)
- 🧪 **Jest** + **Supertest** - Testing

### Cấu trúc thư mục

```
noi-tu-lien-hoan/
├── frontend/                  # React frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── Game/        # Game components
│   │   │   ├── Room/        # Room/Lobby components
│   │   │   └── Common/      # Shared components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom hooks
│   │   ├── store/           # Zustand stores
│   │   ├── services/        # API services
│   │   ├── utils/           # Utilities
│   │   └── App.jsx
│   ├── public/
│   └── package.json
│
├── backend/                   # Node.js backend
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   │   ├── game/       # Game logic
│   │   │   ├── socket/     # WebSocket handlers
│   │   │   └── dictionary/ # Dictionary management
│   │   ├── middleware/      # Express middleware
│   │   ├── config/          # Configuration
│   │   ├── utils/           # Utilities
│   │   ├── validators/      # Input validation
│   │   └── app.js
│   ├── tests/               # Unit & integration tests
│   ├── migrations/          # Database migrations
│   ├── seeders/             # Database seeders
│   └── package.json
│
├── database/                  # Database scripts & data
│   ├── dictionary/          # Từ điển tiếng Việt
│   │   └── vietnamese-words.json
│   └── schema.sql
│
├── .github/
│   └── workflows/           # CI/CD workflows
│       ├── ci.yml          # Continuous Integration
│       ├── cd.yml          # Continuous Deployment
│       └── tests.yml       # Automated testing
│
├── docker-compose.yml
├── Dockerfile
├── .gitignore
├── README.md
└── LICENSE
```

## 🗄️ Database Schema

### Tables chính

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(500),
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  total_games INTEGER DEFAULT 0,
  words_contributed INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Dictionary (Pre-loaded)
CREATE TABLE dictionary (
  id SERIAL PRIMARY KEY,
  word1 VARCHAR(50) NOT NULL,
  word2 VARCHAR(50) NOT NULL,
  full_word VARCHAR(100) NOT NULL,
  meaning TEXT,
  category VARCHAR(50),
  frequency VARCHAR(20) DEFAULT 'common',
  is_approved BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Community Words (User contributed)
CREATE TABLE community_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word1 VARCHAR(50) NOT NULL,
  word2 VARCHAR(50) NOT NULL,
  full_word VARCHAR(100) NOT NULL,
  meaning TEXT,
  submitted_by_user_id UUID REFERENCES users(id),
  votes_for INTEGER DEFAULT 0,
  votes_against INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending',
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Games
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id VARCHAR(100) NOT NULL,
  winner_id UUID REFERENCES users(id),
  players JSONB NOT NULL,
  words_chain JSONB NOT NULL, -- Array of {word: "quả táo", player_id, timestamp, is_new: boolean}
  game_mode VARCHAR(50) DEFAULT 'classic',
  duration INTEGER,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Player Stats (per game)
CREATE TABLE player_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  game_id UUID REFERENCES games(id),
  words_used INTEGER DEFAULT 0,
  new_words_contributed INTEGER DEFAULT 0,
  is_disabled BOOLEAN DEFAULT FALSE,
  disabled_reason VARCHAR(100),
  placement INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Achievements
CREATE TABLE achievements (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(100),
  requirement JSONB
);

-- User Achievements
CREATE TABLE user_achievements (
  user_id UUID REFERENCES users(id),
  achievement_id INTEGER REFERENCES achievements(id),
  earned_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, achievement_id)
);
```

## 🔌 API Endpoints

### Authentication

```
POST   /api/auth/register       # Đăng ký tài khoản
POST   /api/auth/login          # Đăng nhập
POST   /api/auth/logout         # Đăng xuất
POST   /api/auth/refresh        # Refresh token
GET    /api/auth/me             # Lấy thông tin user hiện tại
```

### Users

```
GET    /api/users/:id           # Lấy thông tin user
PUT    /api/users/:id           # Cập nhật profile
GET    /api/users/:id/stats     # Lấy thống kê user
GET    /api/users/:id/history   # Lịch sử games
```

### Dictionary

```
GET    /api/dictionary          # Lấy danh sách từ (có phân trang)
GET    /api/dictionary/search   # Tìm kiếm từ
POST   /api/dictionary/suggest  # Đề xuất từ mới
GET    /api/dictionary/community # Từ do cộng đồng đóng góp
```

### Rooms

```
GET    /api/rooms               # Danh sách phòng public
POST   /api/rooms               # Tạo phòng mới
GET    /api/rooms/:id           # Thông tin phòng
DELETE /api/rooms/:id           # Xóa phòng (chỉ host)
```

### Leaderboard

```
GET    /api/leaderboard/daily   # Bảng xếp hạng ngày
GET    /api/leaderboard/weekly  # Bảng xếp hạng tuần
GET    /api/leaderboard/alltime # Bảng xếp hạng mọi thời đại
```

### WebSocket Events

**Client → Server:**
```javascript
'join_room'         // Join phòng
'leave_room'        // Rời phòng
'ready'             // Sẵn sàng chơi
'submit_word'       // Gửi từ
'vote'              // Vote từ mới
'chat_message'      // Gửi chat
'search_word'       // Tìm kiếm trong lịch sử từ
```

**Server → Client:**
```javascript
'room_updated'      // Cập nhật thông tin phòng
'game_started'      // Game bắt đầu (bao gồm lịch sử từ rỗng)
'turn_changed'      // Đổi lượt
'word_submitted'    // Có từ mới được gửi (cập nhật lịch sử)
'word_history'      // Đồng bộ toàn bộ lịch sử từ
'voting_started'    // Bắt đầu voting
'voting_ended'      // Kết thúc voting
'player_disabled'   // Player bị vô hiệu hóa
'game_ended'        // Game kết thúc (bao gồm lịch sử đầy đủ)
'timer_tick'        // Cập nhật timer
'chat_message'      // Nhận chat
'error'             // Lỗi
```

## 🧪 Testing

### Chạy tests

```bash
# Backend tests
cd backend
npm test                    # Chạy tất cả tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report

# Frontend tests
cd frontend
npm test
npm run test:e2e          # E2E tests với Playwright
```

### Data Structure Examples

**Words Chain (words_chain JSONB):**
```json
[
  {
    "word": "quả táo",
    "player_id": "uuid-123",
    "player_name": "Player A",
    "timestamp": "2025-12-25T10:00:01Z",
    "is_new": false,
    "turn_number": 1
  },
  {
    "word": "táo tàu",
    "player_id": "uuid-456",
    "player_name": "You",
    "timestamp": "2025-12-25T10:00:12Z",
    "is_new": false,
    "turn_number": 2
  },
  {
    "word": "tàu hoả",
    "player_id": "uuid-789",
    "player_name": "Player B",
    "timestamp": "2025-12-25T10:00:20Z",
    "is_new": false,
    "turn_number": 3
  },
  {
    "word": "tiễn biệt",
    "player_id": "uuid-456",
    "player_name": "You",
    "timestamp": "2025-12-25T10:00:35Z",
    "is_new": true,
    "turn_number": 5
  }
]
```

### Test coverage

- Unit tests: Controllers, Services, Utils
- Integration tests: API endpoints
- E2E tests: User flows (tạo phòng, chơi game, voting)
- WebSocket tests: Real-time events
- Word validation tests: Check duplicates, check dictionary

## 🚀 Deployment

### Build production

```bash
# Frontend
cd frontend
npm run build
# Output: dist/

# Backend (nếu cần transpile)
cd backend
npm run build
```

### Deploy với Docker

```bash
# Build image
docker build -t noi-tu-lien-hoan .

# Run container
docker run -p 3000:3000 -p 5173:5173 noi-tu-lien-hoan
```

### Environment Variables

**Backend (.env):**
```env
NODE_ENV=production
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=noi_tu_db
DB_USER=postgres
DB_PASSWORD=your_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=https://yourdomain.com
```

**Frontend (.env):**
```env
VITE_API_URL=https://api.yourdomain.com
VITE_WS_URL=wss://api.yourdomain.com
```

## 🔄 CI/CD Pipeline

GitHub Actions workflows tự động:

1. **CI (Continuous Integration):**
   - ✅ Lint code (ESLint)
   - ✅ Run tests (Jest)
   - ✅ Build application
   - ✅ Security scan (npm audit)
   - ✅ Test coverage check

2. **CD (Continuous Deployment):**
   - 🚀 Deploy to staging (on push to `develop`)
   - 🚀 Deploy to production (on push to `main` hoặc tag `v*`)
   - 🐳 Build & push Docker images
   - ✅ Health checks
   - 📊 Performance monitoring

3. **Automated Testing:**
   - 🧪 Run E2E tests
   - 📊 Generate coverage reports
   - 🔍 Check code quality

## 📊 Monitoring & Analytics

- **Logs:** Winston (file + console)
- **Metrics:** Prometheus + Grafana (optional)
- **Error tracking:** Sentry (optional)
- **Analytics:** Custom game statistics

## 🤝 Contributing

Chúng tôi hoan nghênh mọi đóng góp! Hãy xem [CONTRIBUTING.md](CONTRIBUTING.md) để biết thêm chi tiết.

### Quy trình contribute:

1. Fork repository
2. Tạo branch mới (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Tạo Pull Request

### Coding Standards

- ESLint configuration được setup sẵn
- Prettier cho code formatting
- Commit messages theo [Conventional Commits](https://www.conventionalcommits.org/)

## 📝 Roadmap

### Phase 1 - MVP (Q1 2025) ✅
- [x] Core gameplay mechanics
- [x] Basic UI/UX
- [x] Lịch sử từ đã dùng (real-time display)
- [x] Authentication system
- [x] Dictionary với 500+ từ ghép
- [x] Voting system
- [x] Real-time multiplayer
- [x] Vô hiệu hóa player (thay vì loại khỏi game)
- [x] 10 giây/lượt

### Phase 2 - Enhancement (Q2 2025)
- [ ] Multiple game modes (Speed, Hard, Marathon)
- [ ] Tournament system
- [ ] Achievements & badges
- [ ] Friends system
- [ ] Voice chat
- [ ] Mobile responsive design

### Phase 3 - Advanced (Q3 2025)
- [ ] AI opponent
- [ ] Replay system
- [ ] Statistics & analytics dashboard
- [ ] Community features (forums, user profiles)
- [ ] Mobile app (React Native)
- [ ] Internationalization (English support)

### Phase 4 - Scale (Q4 2025)
- [ ] Ranked matchmaking
- [ ] Esports tournaments
- [ ] Streaming integration
- [ ] Monetization (premium features)
- [ ] Partnership with education platforms

## 📚 Tài liệu thêm

- [Game Design Document](docs/GAME_DESIGN.md)
- [API Documentation](docs/API.md)
- [Database Schema](docs/DATABASE.md)
- [WebSocket Events](docs/WEBSOCKET.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

## ⚖️ License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Khánh** - Creator & Lead Developer

## 🙏 Acknowledgments

- Cảm ơn cộng đồng đã đóng góp từ vựng
- Inspired by classic word chain games
- Built with ❤️ for Vietnamese language enthusiasts

## 📞 Contact & Support

- 🐛 **Bug Reports:** [GitHub Issues](https://github.com/yourusername/noi-tu-lien-hoan/issues)
- 💬 **Discussions:** [GitHub Discussions](https://github.com/yourusername/noi-tu-lien-hoan/discussions)
- 📧 **Email:** support@noitulienhoan.com
- 💬 **Discord:** [Join our Discord](https://discord.gg/your-invite)

---

**Chơi thử ngay:** https://noitulienhoan.com 🎮

**Made with ❤️ in Vietnam 🇻🇳**

