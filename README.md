# 筆劃俠客遊戲 - micro:bit 集成版 (React Version)

## 🎮 項目介紹
結合 micro:bit 陀螺儀動作識別和中文筆劃學習的創新教育遊戲。此版本已升級為 React + Vite 架構，提供更流暢的動畫和互動體驗。

## 🔗 在線演示 (Demo)
👉 **[點擊這裡體驗遊戲](https://strokesyyt1-qmi12nz4m-john-tyys-projects.vercel.app)**
*(需使用支持 Web Bluetooth 的瀏覽器，如 Chrome 或 Edge)*

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

1. 確保已安裝藍牙擴展
2. 在 MakeCode 中開啟「無需配對」模式 (No Pairing Required)
3. 參考之前的指南燒錄代碼

## 📊 技術棧

- **框架**: React 18 + Vite
- **樣式**: Tailwind CSS
- **圖標**: Lucide React
- **硬件交互**: Web Bluetooth API
