# 🔧 Micro:bit 藍牙連接設置指南

如果遇到 `GATT Server is disconnected` 錯誤，通常是因為 Micro:bit 的**藍牙安全設置**阻擋了瀏覽器連接。請按照以下步驟修改您的 MakeCode 項目。

## ⚠️ 關鍵步驟：關閉配對驗證

Web Bluetooth 最常見的問題是 Micro:bit 預設需要配對碼。我們需要將其設置為「無需配對」模式。

### 1. 打開項目設置
在 MakeCode 編輯器 (https://makecode.microbit.org) 中：
1. 點擊右上角的 **齒輪圖標 (設置)**
2. 選擇 **Project Settings (項目設置)**

### 2. 修改藍牙模式
1. 找到 **Bluetooth** 選項卡
2. 選擇 **No Pairing Required: Anyone can connect via Bluetooth** (無需配對：任何人都可以通過藍牙連接)
   > 注意：這可能會提示您項目將切換到 C++ 模式，這是正常的，點擊確認即可。

### 3. 重新下載並燒錄
1. 修改設置後，代碼會自動重新編譯。
2. 點擊 **Download** 下載新的 `.hex` 文件。
3. 將新文件拖入 **MICROBIT** 磁盤進行燒錄。

---

## 🔍 其他排查清單

如果設置後仍然無法連接：

1. **斷開其他連接**
   - 確保您的手機或其他設備沒有正在連接這個 Micro:bit。藍牙通常一次只能連接一個設備。

2. **瀏覽器限制**
   - 必須使用 **Chrome** 或 **Edge** 瀏覽器。
   - 必須在 **HTTPS** (如 Vercel) 或 `localhost` 環境下運行。

3. **完全重置**
   - 在電腦的藍牙設置中，找到 BBC micro:bit 並選擇「忘記設備」或「刪除設備」。
   - 重新刷新網頁，重新進行搜索連接。

4. **Micro:bit 狀態**
   - 確保 Micro:bit 屏幕上顯示了 ❤️ (心形) 或您設置的圖標，表示程序已在運行。
   - 如果顯示 `503` 或哭臉，表示內存不足或藍牙服務啟動失敗，請嘗試刪除一些不用的擴展包。
