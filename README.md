# 筆劃俠客遊戲 - micro:bit 集成版 (React Version)

## 🎮 項目介紹
結合 micro:bit 陀螺儀動作識別和中文筆劃學習的創新教育遊戲。此版本已升級為 React + Vite 架構，提供更流暢的動畫和互動體驗。

## 🔗 在線演示 (Demo)
👉 **[點擊這裡體驗遊戲](https://strokesyyt1-qmi12nz4m-john-tyys-projects.vercel.app)**
*(桌機建議使用 Chrome / Edge；iPad Safari 需先安裝並啟用 WebBLE 擴充)*

## iPad Safari 直連 micro:bit

如果你想在 iPad 上直接連接 micro:bit，請先完成以下步驟：

1. 用 iPad Safari 打開 WebBLE 安裝頁：`https://ioswebble.com/setup.html`
2. 安裝對應的 companion app
3. 到「設定 > Safari > 擴充功能」啟用 WebBLE
4. 回到本專案頁面重新整理，再點「連結Micro:bit」

說明：

- 本專案正式遊戲 `/` 與調試頁 `/debug` 都會自動檢查 iPad Safari 的藍牙相容層狀態
- 若未啟用 WebBLE，頁面會顯示安裝提示，不會直接崩潰
- 若電池服務不可用，主遊戲仍可連線與接收筆劃資料

排查建議：

- 確認 micro:bit 已燒錄啟用 BLE UART 的程式
- 確認 micro:bit 正在廣播藍牙，並且未被其他裝置佔用
- 若 iPad 看不到裝置，先重整頁面，再重新進入選擇裝置流程
- 若只想先驗證資料流，優先打開 `/debug`

## 🚀 本地開發

1. 克隆項目
```bash
git clone https://github.com/futurejohnbit/strokes.git
cd strokes
```

2. 安裝依賴
```bash
npm install
```

3. 啟動開發服務器
```bash
npm run dev
```

4. 打開瀏覽器訪問 `http://localhost:5173`

## 📦 部署到 Vercel

本項目已配置好 Vercel 部署。只需將 GitHub 倉庫連接到 Vercel，它會自動識別 Vite 項目並進行構建。

## 🔧 Micro:bit 設置

**重要提示：如果遇到藍牙連接問題，請查看 [MICROBIT_SETUP.md](./MICROBIT_SETUP.md) 指南，調整項目安全設置。**
**🤖 如果使用 CreateAI 訓練模型，請務必閱讀 [AI_BLUETOOTH_GUIDE.md](./AI_BLUETOOTH_GUIDE.md) 指南。**

1. 確保已安裝藍牙擴展
2. 在 MakeCode 中開啟「無需配對」模式 (No Pairing Required)
3. 參考之前的指南燒錄代碼

## 📊 技術棧

- **框架**: React 18 + Vite
- **樣式**: Tailwind CSS
- **圖標**: Lucide React
- **硬件交互**: Web Bluetooth API
