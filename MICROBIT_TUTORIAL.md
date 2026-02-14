# 📘 micro:bit 代碼更新教程

## 🎯 目標
在你已訓練好的 Create AI 項目中添加藍牙發送功能

---

## 📝 第一步：打開你的項目

1. 訪問 https://makecode.microbit.org/
2. 打開你訓練好的項目（包含 ML 識別的那個）
3. 點擊右上角的 **Python** 切換到 Python 模式

---

## 🔧 第二步：添加藍牙初始化代碼

在代碼**最開始**（所有其他代碼之前）添加：

```python
# 在這裡添加！！！
bluetooth.start_uart_service()
basic.show_icon(IconNames.HEART)

# 下面是你原來的代碼
def on_on_start():
    basic.show_icon(IconNames.DUCK)
ml.on_start(ml.event.提, on_on_start)
# ...
```

---

## 📡 第三步：在每個識別事件添加藍牙發送

找到你的 8 個識別函數，**每個都添加一行 `bluetooth.uart_write_line()`**

### 原來的代碼：
```python
def on_on_start():
    basic.show_icon(IconNames.DUCK)
ml.on_start(ml.event.提, on_on_start)
```

### 修改後：
```python
def on_on_start():
    basic.show_icon(IconNames.DUCK)
    bluetooth.uart_write_line("TI")  # ← 添加這行！
ml.on_start(ml.event.提, on_on_start)
```

---

## 📋 完整的發送代碼對照表

| 筆劃 | 原圖標 | 藍牙發送代碼 |
|------|--------|-------------|
| 提 | DUCK | `bluetooth.uart_write_line("TI")` |
| 捺 | STICK_FIGURE | `bluetooth.uart_write_line("NA")` |
| 點 | TORTOISE | `bluetooth.uart_write_line("DIAN")` |
| 橫豎鉤 | COW | `bluetooth.uart_write_line("HENGSHUGOU")` |
| 橫撇 | UMBRELLA | `bluetooth.uart_write_line("HENGPIE")` |
| 豎 | GHOST | `bluetooth.uart_write_line("SHU")` |
| 橫 | HOUSE | `bluetooth.uart_write_line("HENG")` |
| 豎鉤 | GIRAFFE | `bluetooth.uart_write_line("SHUGOU")` |

---

## ✅ 完整的更新後代碼

```python
# === 初始化藍牙（必須在最開始）===
bluetooth.start_uart_service()
basic.show_icon(IconNames.HEART)

# === 提 ===
def on_on_start():
    basic.show_icon(IconNames.DUCK)
    bluetooth.uart_write_line("TI")
ml.on_start(ml.event.提, on_on_start)

# === 捺 ===
def on_on_start2():
    basic.show_icon(IconNames.STICK_FIGURE)
    bluetooth.uart_write_line("NA")
ml.on_start(ml.event.捺, on_on_start2)

# === 點 ===
def on_on_start3():
    basic.show_icon(IconNames.TORTOISE)
    bluetooth.uart_write_line("DIAN")
ml.on_start(ml.event.點, on_on_start3)

# === 橫豎鉤 ===
def on_on_start4():
    basic.show_icon(IconNames.COW)
    bluetooth.uart_write_line("HENGSHUGOU")
ml.on_start(ml.event.橫豎鉤, on_on_start4)

# === 橫撇 ===
def on_on_start5():
    basic.show_icon(IconNames.UMBRELLA)
    bluetooth.uart_write_line("HENGPIE")
ml.on_start(ml.event.橫撇, on_on_start5)

# === 豎 ===
def on_on_start6():
    basic.show_icon(IconNames.GHOST)
    bluetooth.uart_write_line("SHU")
ml.on_start(ml.event.豎, on_on_start6)

# === 橫 ===
def on_on_start7():
    basic.show_icon(IconNames.HOUSE)
    bluetooth.uart_write_line("HENG")
ml.on_start(ml.event.橫, on_on_start7)

# === 豎鉤 ===
def on_on_start8():
    basic.show_icon(IconNames.GIRAFFE)
    bluetooth.uart_write_line("SHUGOU")
ml.on_start(ml.event.豎鉤, on_on_start8)
```

---

## 💾 第四步：下載並燒錄

1. 點擊 MakeCode 底部的 **Download** 按鈕
2. 將下載的 `.hex` 文件複製到 MICROBIT 磁盤
3. 等待黃燈停止閃爍

---

## 🔵 第五步：首次藍牙配對

**重要！micro:bit v2 首次使用藍牙需要配對：**

1. **同時按住** micro:bit 的 **A + B** 鍵
2. **同時按下**背面的 **RESET** 按鈕（保持按住 A+B）
3. LED 屏幕會顯示配對圖案
4. **鬆開所有按鈕**
5. micro:bit 進入配對模式，LED 顯示心形 ❤️

---

## 🧪 第六步：測試連接

1. 打開網頁 `landing.html`
2. 點擊「連接 micro:bit」
3. 在彈出窗口選擇你的設備（名稱類似 "BBC micro:bit [xxxxx]"）
4. 連接成功後，揮動 micro:bit
5. 網頁應該顯示識別到的筆劃

---

## ❓ 故障排除

### 問題 1：找不到設備
**解決：**
- 確認 micro:bit 已開機（LED 顯示心形）
- 檢查電腦藍牙是否開啟
- 重新進行配對（A+B+RESET）

### 問題 2：連接後沒有反應
**解決：**
- 檢查是否添加了 `bluetooth.uart_write_line()`
- 確認初始化代碼在最開始
- 查看瀏覽器控制台（F12）是否有錯誤

### 問題 3：連接後立即斷開
**解決：**
- micro:bit 電量不足，換新電池
- 重新燒錄程序
- 嘗試重啟 micro:bit

### 問題 4：瀏覽器不支持
**解決：**
- 必須使用 **Chrome** 或 **Edge**
- Safari 和 Firefox 不支持
- 手機必須是 Android + Chrome

---

## 🎮 連接成功後

1. 首頁會顯示「✅ micro:bit 已連接」
2. 測試區域會顯示識別到的筆劃
3. 點擊「開始遊戲」進入主遊戲

---

## 📊 筆劃映射檢查

確保網頁和 micro:bit 的映射一致：

| micro:bit 發送 | 網頁識別 | 遊戲筆劃 |
|---------------|---------|---------|
| HENG | 橫 | 橫 (一) |
| SHU | 豎 | 豎 (丨) |
| PIE | 撇 | 撇 (丿) |
| NA | 捺 | 捺 (丶) |
| DIAN | 點 | 點 (、) |
| TI | 提 | 提 (㇀) |
| HENGPIE | 橫撇 | 橫撇 |
| SHUGOU | 豎鉤 | 豎鉤 |
| HENGSHUGOU | 橫豎鉤 | 橫豎鉤 |

---

## 🎯 下一步

完成 micro:bit 設置後，部署網站到 Vercel：
1. 上傳 `landing.html`（改名為 `index.html`）
2. 上傳 `game.html`（遊戲主頁面）
3. 部署完成！

---

需要幫助？檢查：
- 瀏覽器控制台（F12）
- micro:bit 串口監視器
- LED 顯示是否正常
