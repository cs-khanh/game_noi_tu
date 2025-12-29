# 🔍 Giải thích chi tiết: Vấn đề 404 khi Refresh trên GitHub Pages

## 📚 **1. Vấn đề cơ bản: GitHub Pages là Static Hosting**

### **GitHub Pages hoạt động như thế nào?**

GitHub Pages **KHÔNG phải là web server** như Apache hay Nginx. Nó chỉ là **file hosting service**:

```
User request: https://cs-khanh.github.io/game_noi_tu/game/abc123
  ↓
GitHub Pages tìm file: /game_noi_tu/game/abc123
  ↓
❌ Không tìm thấy file → Trả về 404 Not Found
```

**Vấn đề:** GitHub Pages tìm **file thật** trên server, không phải route ảo của React Router!

---

## 🎯 **2. Single Page Application (SPA) hoạt động như thế nào?**

### **SPA = 1 file HTML duy nhất**

Khi bạn build React app, bạn chỉ có:
```
dist/
  ├── index.html          ← File HTML duy nhất
  ├── assets/
  │   ├── main.js         ← JavaScript code
  │   └── main.css        ← CSS styles
  └── ...
```

**Tất cả routes đều dùng CÙNG 1 file `index.html`!**

### **React Router xử lý routing ở Client-side:**

```
1. User vào: https://cs-khanh.github.io/game_noi_tu/
   ↓
2. GitHub Pages serve: index.html
   ↓
3. Browser load: index.html
   ↓
4. JavaScript (React Router) chạy
   ↓
5. React Router đọc URL: "/"
   ↓
6. Match route: <Route path="/" /> → Render HomePage ✅
```

**Khi user click link hoặc navigate:**
```
User click: "Tạo phòng mới"
  ↓
React Router thay đổi URL: /game/abc123
  ↓
React Router match route: <Route path="/game/:roomId" />
  ↓
Render GamePage ✅
```

**KHÔNG có request mới đến server!** Tất cả xảy ra ở client-side (browser).

---

## ❌ **3. Vấn đề khi Refresh (F5)**

### **Scenario: User đang ở `/game/abc123` và nhấn F5**

```
1. User nhấn F5 (Refresh)
   ↓
2. Browser gửi request mới đến server:
   GET https://cs-khanh.github.io/game_noi_tu/game/abc123
   ↓
3. GitHub Pages tìm file: /game_noi_tu/game/abc123
   ↓
4. ❌ Không tìm thấy file này!
   ↓
5. GitHub Pages trả về: 404 Not Found
```

**Tại sao?** Vì trên server **KHÔNG CÓ** file `/game/abc123`!

File thật chỉ có:
- `/game_noi_tu/index.html` ✅
- `/game_noi_tu/assets/...` ✅
- `/game_noi_tu/game/abc123` ❌ **KHÔNG TỒN TẠI!**

---

## 🔧 **4. Giải pháp: `404.html`**

### **Cách GitHub Pages xử lý 404:**

Khi GitHub Pages không tìm thấy file, nó sẽ:
1. Tìm file `404.html` trong root
2. Nếu có → Serve `404.html` thay vì 404 error page
3. URL vẫn giữ nguyên (không redirect)

### **Chiến lược:**

```
1. Tạo 404.html = index.html (copy)
   ↓
2. User refresh: /game/abc123
   ↓
3. GitHub Pages không tìm thấy file
   ↓
4. GitHub Pages serve: 404.html (= index.html)
   ↓
5. Browser load: 404.html → Load React app
   ↓
6. React Router đọc URL: /game/abc123
   ↓
7. Match route: <Route path="/game/:roomId" />
   ↓
8. Render GamePage ✅
```

**Kết quả:** User thấy đúng page, không còn 404!

---

## 🚫 **5. Vấn đề thứ 2: Jekyll Processing**

### **GitHub Pages mặc định dùng Jekyll:**

Jekyll là static site generator. GitHub Pages tự động:
- Process files qua Jekyll
- Transform một số files
- Có thể làm hỏng SPA routing

### **Ví dụ:**

```
File: .nojekyll (KHÔNG có)
  ↓
GitHub Pages: "Ồ, đây là Jekyll site!"
  ↓
Jekyll process files
  ↓
Có thể làm hỏng routing hoặc assets
```

### **Giải pháp: `.nojekyll` file**

Tạo file `.nojekyll` (empty file) để báo cho GitHub Pages:
```
"Đừng dùng Jekyll! Serve files như vậy thôi!"
```

**Kết quả:** Files được serve đúng như build, không bị transform.

---

## 🎯 **6. React Router với Base Path**

### **Vấn đề Base Path:**

URL thực tế: `https://cs-khanh.github.io/game_noi_tu/game/abc123`

Nhưng React Router cần biết:
- Base path: `/game_noi_tu/`
- Route path: `/game/abc123`

### **Giải pháp: `basename` prop**

```jsx
<BrowserRouter basename="/game_noi_tu/">
  <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/game/:roomId" element={<GamePage />} />
  </Routes>
</BrowserRouter>
```

**Cách hoạt động:**

```
URL thực tế: /game_noi_tu/game/abc123
  ↓
BrowserRouter loại bỏ basename: /game_noi_tu/
  ↓
Route path còn lại: /game/abc123
  ↓
Match route: <Route path="/game/:roomId" />
  ↓
roomId = "abc123" ✅
```

---

## 📊 **7. So sánh: Trước và Sau**

### **❌ TRƯỚC (Không có 404.html):**

```
User ở: /game/abc123
  ↓
F5
  ↓
GitHub Pages: "Không tìm thấy file!"
  ↓
404 Error Page ❌
```

### **✅ SAU (Có 404.html + .nojekyll):**

```
User ở: /game/abc123
  ↓
F5
  ↓
GitHub Pages: "Không tìm thấy file!"
  ↓
Serve: 404.html (= index.html)
  ↓
React app load
  ↓
React Router: "/game/abc123"
  ↓
Match route → Render GamePage ✅
```

---

## 🔄 **8. Flow hoàn chỉnh**

### **Lần đầu vào trang:**

```
1. User vào: https://cs-khanh.github.io/game_noi_tu/
   ↓
2. GitHub Pages serve: index.html
   ↓
3. Browser load React app
   ↓
4. React Router (basename="/game_noi_tu/") đọc URL: "/"
   ↓
5. Match route: <Route path="/" />
   ↓
6. Render HomePage ✅
```

### **Navigate trong app (click link):**

```
1. User click: "Tạo phòng mới"
   ↓
2. React Router thay đổi URL: /game/abc123
   ↓
3. KHÔNG có request đến server!
   ↓
4. React Router match route: <Route path="/game/:roomId" />
   ↓
5. Render GamePage ✅
```

### **Refresh (F5):**

```
1. User ở: /game/abc123
   ↓
2. User nhấn F5
   ↓
3. Browser request: GET /game_noi_tu/game/abc123
   ↓
4. GitHub Pages: "Không tìm thấy file!"
   ↓
5. GitHub Pages serve: 404.html (= index.html)
   ↓
6. Browser load React app
   ↓
7. React Router (basename="/game_noi_tu/") đọc URL: "/game/abc123"
   ↓
8. Match route: <Route path="/game/:roomId" />
   ↓
9. Render GamePage ✅
```

---

## 🛠️ **9. Implementation trong Workflow**

### **Bước trong GitHub Actions:**

```yaml
- name: Create 404.html and .nojekyll for SPA routing
  working-directory: ./frontend/dist
  run: |
    # 1. Tạo .nojekyll để tắt Jekyll
    touch .nojekyll
    
    # 2. Copy index.html → 404.html
    cp index.html 404.html
```

**Kết quả trong `dist/`:**
```
dist/
  ├── .nojekyll          ← Tắt Jekyll
  ├── index.html        ← File chính
  ├── 404.html          ← Copy của index.html
  └── assets/...
```

---

## ✅ **10. Tóm tắt**

### **Vấn đề:**
- GitHub Pages là static hosting, không hiểu SPA routing
- Khi refresh, server tìm file thật → Không tìm thấy → 404

### **Giải pháp:**
1. **`.nojekyll`**: Tắt Jekyll processing
2. **`404.html`**: Serve React app khi không tìm thấy file
3. **`basename`**: React Router biết base path

### **Kết quả:**
- ✅ Refresh ở bất kỳ route nào đều hoạt động
- ✅ URL được giữ nguyên
- ✅ React Router xử lý routing đúng

---

## 🎓 **11. Kiến thức mở rộng**

### **Các cách khác để deploy SPA:**

1. **GitHub Pages** (đang dùng)
   - ✅ Miễn phí
   - ⚠️ Cần `404.html` trick

2. **Netlify**
   - ✅ Tự động handle SPA routing
   - ✅ Có `_redirects` file

3. **Vercel**
   - ✅ Tự động handle SPA routing
   - ✅ Zero config

4. **Cloudflare Pages**
   - ✅ Tự động handle SPA routing
   - ✅ CDN global

### **Tại sao GitHub Pages cần trick?**

Vì GitHub Pages được thiết kế cho **static sites** (Jekyll, HTML thuần), không phải SPA. Nên cần workaround như `404.html`.

---

## 🔗 **12. Tài liệu tham khảo**

- [GitHub Pages Custom 404 Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-custom-404-page-for-your-github-pages-site)
- [React Router Basename](https://reactrouter.com/en/main/router-components/browser-router#basename)
- [Vite Base Path](https://vitejs.dev/config/shared-options.html#base)

---

**Hy vọng giải thích này giúp bạn hiểu rõ vấn đề!** 🎉

