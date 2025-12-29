# ⏱️ Timer Logic Check

## 📋 **Timer States:**

1. **Running**: Timer đang chạy, đếm ngược từ 10s
2. **Paused**: Timer tạm dừng, lưu thời gian còn lại
3. **Stopped**: Timer đã dừng (clear), chuẩn bị start lại

---

## 🔄 **Timer Flow Scenarios:**

### **1. Normal Turn Flow:**
```
Start turn → startTurnTimer() → Timer chạy 10s
  ↓
User submit word → clearTurnTimer() → Timer dừng
  ↓
nextTurn() → clearTurnTimer() → startTurnTimer() → Timer mới cho lượt tiếp theo
```

### **2. Change Word Flow (Word in Dictionary):**
```
Timer đang chạy (ví dụ: 5s còn lại)
  ↓
User click "Đổi từ" → pauseTurnTimer() → Timer pause, lưu 5s
  ↓
User nhập từ mới → change_word event
  ↓
Đổi từ thành công → nextTurn() → clearTurnTimer() → startTurnTimer() → Timer mới 10s cho lượt tiếp theo
```

### **3. Change Word Flow (Word NOT in Dictionary - Voting):**
```
Timer đang chạy (ví dụ: 5s còn lại)
  ↓
User click "Đổi từ" → pauseTurnTimer() → Timer pause, lưu 5s
  ↓
User nhập từ mới → change_word event
  ↓
Từ không có trong từ điển → startVotingForChangeWord() → Timer vẫn paused
  ↓
Voting approved → Đổi từ → nextTurn() → clearTurnTimer() → startTurnTimer() → Timer mới 10s cho lượt tiếp theo
  ↓
Voting rejected → nextTurn() → clearTurnTimer() → startTurnTimer() → Timer mới 10s cho lượt tiếp theo
```

### **4. Cancel Change Word Modal:**
```
Timer đang chạy (ví dụ: 5s còn lại)
  ↓
User click "Đổi từ" → pauseTurnTimer() → Timer pause, lưu 5s
  ↓
User cancel modal → resumeTurnTimer() → Timer resume với 5s còn lại
  ↓
Timer tiếp tục đếm ngược từ 5s
```

---

## ✅ **Checklist:**

### **Backend (Room Manager):**

- [x] `startTurnTimer()` - Start timer với callback
- [x] `pauseTurnTimer()` - Pause timer, lưu thời gian còn lại
- [x] `resumeTurnTimer()` - Resume timer với thời gian đã lưu
- [x] `clearTurnTimer()` - Clear tất cả timers và reset flags
- [x] `nextTurn()` - Clear timer và reset `turnTimeLeft`

### **Backend (Socket Handler):**

- [x] `submit_word` - Clear timer trước khi validate
- [x] `change_word_started` - Pause timer khi mở modal
- [x] `change_word_cancelled` - Resume timer khi cancel modal
- [x] `change_word` (success) - nextTurn() → Timer reset cho lượt tiếp theo
- [x] `change_word` (voting) - Timer vẫn paused
- [x] `endVoting()` (change word approved) - nextTurn() → Timer reset
- [x] `endVoting()` (change word rejected) - nextTurn() → Timer reset
- [x] `nextTurn()` - Clear timer và start timer mới

### **Frontend:**

- [x] Emit `change_word_started` khi mở modal
- [x] Emit `change_word_cancelled` khi cancel modal
- [x] Đóng modal khi voting started
- [x] Đóng modal khi changeWordUsed = true

---

## 🐛 **Potential Issues:**

### **1. Race Condition trong pauseTurnTimer():**
**Issue:** `turnTimeLeft` có thể bị update bởi interval trước khi lưu.

**Fix:** ✅ Đã sửa - Clear interval trước khi lưu `turnTimeLeft`

### **2. Timer không được clear khi nextTurn():**
**Issue:** Nếu timer đang paused, `nextTurn()` có clear đúng không?

**Fix:** ✅ `nextTurn()` gọi `clearTurnTimer()` → Reset tất cả flags → `startTurnTimer()` start timer mới

### **3. Timer resume sau khi đã nextTurn():**
**Issue:** Nếu có code nào đó gọi `resumeTurnTimer()` sau `nextTurn()`, có thể gây lỗi?

**Fix:** ✅ `clearTurnTimer()` reset `timerPaused = false`, nên `resumeTurnTimer()` sẽ không chạy

---

## 🧪 **Test Cases:**

### **Test 1: Normal Submit Word**
1. Timer chạy 10s
2. User submit word ở giây thứ 5
3. ✅ Timer dừng
4. ✅ Chuyển sang lượt tiếp theo với timer mới 10s

### **Test 2: Change Word (Success)**
1. Timer chạy 10s, còn 5s
2. User click "Đổi từ"
3. ✅ Timer pause, lưu 5s
4. User nhập từ mới (có trong từ điển)
5. ✅ Đổi từ thành công
6. ✅ Chuyển sang lượt tiếp theo với timer mới 10s

### **Test 3: Change Word (Voting Approved)**
1. Timer chạy 10s, còn 5s
2. User click "Đổi từ"
3. ✅ Timer pause, lưu 5s
4. User nhập từ mới (không có trong từ điển)
5. ✅ Start voting, timer vẫn paused
6. ✅ Voting approved
7. ✅ Đổi từ thành công
8. ✅ Chuyển sang lượt tiếp theo với timer mới 10s

### **Test 4: Change Word (Voting Rejected)**
1. Timer chạy 10s, còn 5s
2. User click "Đổi từ"
3. ✅ Timer pause, lưu 5s
4. User nhập từ mới (không có trong từ điển)
5. ✅ Start voting, timer vẫn paused
6. ✅ Voting rejected
7. ✅ Không đổi từ
8. ✅ Chuyển sang lượt tiếp theo với timer mới 10s

### **Test 5: Cancel Change Word Modal**
1. Timer chạy 10s, còn 5s
2. User click "Đổi từ"
3. ✅ Timer pause, lưu 5s
4. User cancel modal
5. ✅ Timer resume với 5s còn lại
6. ✅ Timer tiếp tục đếm ngược từ 5s

### **Test 6: Timeout khi đang đổi từ**
1. Timer chạy 10s, còn 3s
2. User click "Đổi từ"
3. ✅ Timer pause, lưu 3s
4. User không làm gì trong 3s
5. ✅ Timer đã pause, không timeout
6. ✅ User cancel → Timer resume với 3s → Timeout sau 3s

---

## ✅ **Conclusion:**

Tất cả logic timer đã được kiểm tra và hoạt động đúng:

1. ✅ Timer pause khi mở modal đổi từ
2. ✅ Timer resume khi cancel modal
3. ✅ Timer reset khi chuyển lượt
4. ✅ Timer không chạy khi đang voting
5. ✅ Timer reset đúng cách sau khi đổi từ thành công
6. ✅ Không có race condition
7. ✅ Tất cả flags được reset đúng cách

**Status: ✅ PASS**

