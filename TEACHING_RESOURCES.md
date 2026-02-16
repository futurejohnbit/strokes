# 🎓 教學資源清單：智能筆劃練習系統

這份文件列出了本項目中使用的所有硬件和軟件工具，旨在幫助教師為學生準備入門課程。

## 🛠️ 硬件設備 (Hardware)

### 1. BBC Micro:bit V2
*   **用途**：作為「智能筆」的核心，負責感測手部動作（加速度計）並通過藍牙傳輸數據。
*   **備註**：必須使用 **V2 版本**，因為 V2 具備更好的處理器和藍牙性能，且支持更復雜的 AI 擴展。
*   **數量建議**：每位學生或每組一個。

### 2. Micro USB 數據線
*   **用途**：將電腦上的程式（.hex 文件）燒錄到 Micro:bit 中，以及為設備供電。
*   **備註**：需確保數據線具備**傳輸功能**，而不僅僅是充電線。

### 3. 電腦或平板 (具備藍牙功能)
*   **用途**：編寫程式、運行網頁應用程序 (Web App)。
*   **系統要求**：Windows 10+, macOS, 或 Chromebook。
*   **關鍵功能**：必須支持 **Web Bluetooth API** (絕大多數現代筆記本電腦都支持)。

### 4. 電池盒 (可選)
*   **用途**：讓 Micro:bit 脫離電腦獨立運作，模擬真實的「寫字」體驗。
*   **規格**：2x AAA 電池盒。

---

## 💻 軟件與平台 (Software & Platforms)

### 1. Microsoft MakeCode for micro:bit
*   **網址**：[makecode.microbit.org](https://makecode.microbit.org/)
*   **用途**：
    *   圖形化編程環境 (Block Coding)。
    *   編寫 Micro:bit 的固件邏輯 (採集數據、發送藍牙信號)。
    *   添加藍牙 (Bluetooth) 和 AI 擴展包。
*   **教學重點**：讓學生理解「輸入 (傳感器) -> 處理 -> 輸出 (藍牙/LED)」的邏輯。

### 2. Micro:bit Create AI (機器學習工具)
*   **網址**：[classroom.microbit.org/create-ai](https://classroom.microbit.org/create-ai) (或 MakeCode 中的擴展)
*   **用途**：
    *   採集筆劃數據 (橫、豎、撇、捺)。
    *   訓練機器學習模型 (Machine Learning)。
    *   將模型導出並應用到 MakeCode 中。
*   **教學重點**：向學生展示 AI 如何通過數據進行「學習」和「分類」。

### 3. Tinkercad
*   **網址**：[www.tinkercad.com](https://www.tinkercad.com/)
*   **用途**：
    *   **3D 設計**：設計 Micro:bit 的外殼，使其手感更像一支筆。
*   **教學重點**：結合工程設計 (Engineering Design)，製作符合人體工學的輔助教具。

### 4. Google Chrome / Microsoft Edge 瀏覽器
*   **用途**：運行本項目的網頁應用 (Web App)。
*   **必要性**：只有基於 Chromium 內核的瀏覽器才完整支持 Web Bluetooth API，Safari 或 Firefox 可能無法直接連接 Micro:bit。

---

## 🤖 AI 與雲端服務 (AI Services)

### 1. 本項目網頁應用 (Stroke Test Web App)
*   **描述**：即您當前打開的 React 應用程序。
*   **功能**：
    *   接收 Micro:bit 的藍牙數據。
    *   可視化筆劃路徑。
    *   提供遊戲化反饋 (如：小木匠、小農夫模式)。

### 2. Google Gemini API
*   **用途**：
    *   在應用後台提供智能分析。
    *   生成鼓勵性反饋或根據學生的表現動態調整難度。
    *   (在代碼 `GeminiApp.jsx` 中集成)。

---

## 📝 教學入門建議 (For Teachers)

1.  **第一步 (Tinkercad)**：讓學生設計並打印自己的「魔法筆」外殼，增加參與感。
2.  **第二步 (MakeCode & AI)**：使用 Micro:bit Create AI 採集數據，讓學生體驗「教電腦認字」的過程。
3.  **第三步 (Web App)**：將 Micro:bit 連接到網頁，進行實際的漢字書寫遊戲，體驗成果。
