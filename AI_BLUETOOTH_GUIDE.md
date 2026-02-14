# 🧠 Micro:bit CreateAI + 藍牙集成指南

在 `createai.microbit.org` 訓練模型後，生成的代碼 **默認沒有開啟藍牙服務**，且安全設置默認是開啟配對的。這就是為什麼燒錄 AI 代碼後藍牙就失效的原因。

要讓 AI 和 藍牙同時工作，您必須在 CreateAI 的編輯器中手動添加藍牙功能。

## ✅ 解決步驟 (請一步步操作)

### 第一步：打開您的 CreateAI 項目
1. 進入 [https://createai.microbit.org/code](https://createai.microbit.org/code)
2. 確保您的 AI 模型已經訓練好。
3. 點擊 **"Project Settings" (項目設置)**（通常是齒輪圖標）。

### 第二步：添加藍牙擴展
Micro:bit 的 AI 項目默認不包含藍牙庫，必須手動添加：
1. 在代碼編輯器中，點擊 **"Extensions" (擴展)**。
2. 搜索 `bluetooth`。
3. 點擊添加 **"bluetooth"** 擴展包。
   > ⚠️ 如果提示會移除 "radio" (無線電) 功能，請點擊確認。藍牙和無線電不能同時使用。

### 第三步：關閉配對驗證 (關鍵！)
1. 再次點擊右上角的 **齒輪圖標** -> **Project Settings**。
2. 點擊 **Bluetooth** 選項卡。
3. 選擇 **No Pairing Required** (無需配對)。
4. 點擊 **Save**。

### 第四步：添加藍牙代碼
現在您需要修改代碼，讓 AI 識別到動作時發送藍牙信號。

**在 `on start` (當開始時) 塊中添加：**
```javascript
bluetooth.startUartService()
basic.showIcon(IconNames.Heart)
```

**在您的 AI 識別事件中添加發送代碼：**
找到類似 `input.onGesture(Gesture.Shake, function () { ... })` 或者您的 AI 事件塊，在裡面添加：
```javascript
// 例如：當識別到 "橫"
bluetooth.uartWriteLine("HENG")
```

### 第五步：重新下載並燒錄
1. 點擊 **Download**。
2. 將新的 `.hex` 文件燒錄到 Micro:bit。

---

## 💡 常見問題
*   **內存不足 (OOM)**：如果添加藍牙後 Micro:bit 顯示哭臉或 `503` 錯誤，說明 AI 模型 + 藍牙佔用了太多內存。嘗試減少 AI 訓練樣本的數量，或者刪除不用的代碼塊。
*   **藍牙無法連接**：請再次檢查 **Project Settings** 裡的 **No Pairing Required** 是否被選中。每次添加新擴展，這個設置有時會被重置！
