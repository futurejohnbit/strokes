# 行行出狀元：學生指南 (Student Guide)

歡迎參加智能筆劃課程。本文件列出了你在項目中會使用的核心工具和軟件，幫助你快速上手。

## 🛠️ 1. 硬件設備 (Hardware)

*   **Micro:bit V2 (主控板)**
    *   **功能**：這是智能筆的核心處理器。它內置了**加速度計 (Accelerometer)**，可以精確感測你的手部動作，並通過**藍牙 (Bluetooth)** 將數據無線傳輸到電腦。
*   **電池盒 (Battery Pack)**
    *   **功能**：為 Micro:bit 提供電源，讓你擺脫 USB 線的束縛，像使用普通筆一樣自由書寫。
*   **USB 傳輸線**
    *   **功能**：用於連接電腦與 Micro:bit，將你編寫好的程式**燒錄 (Flash)** 到主控板中。

---

## 💻 2. 軟件工具 (Software)

*   **Tinkercad** ([tinkercad.com](https://www.tinkercad.com/))
    *   **類別**：3D 設計與建模
    *   **任務**：設計符合人體工學的筆桿外殼，結合工程設計思維，讓 Micro:bit 握感更舒適。
*   **Micro:bit Create AI** ([classroom.microbit.org/create-ai](https://classroom.microbit.org/create-ai))
    *   **類別**：機器學習 (Machine Learning)
    *   **任務**：採集你的筆劃數據（如：橫、豎、撇、捺），訓練 AI 模型，讓電腦學會識別你的字跡。
*   **MakeCode** ([makecode.microbit.org](https://makecode.microbit.org/))
    *   **類別**：圖形化編程
    *   **任務**：編寫程式邏輯，將傳感器數據轉換為指令。你將學習如何處理數據輸入與輸出。
*   **Chrome 瀏覽器** (Web App)
    *   **類別**：應用運行環境
    *   **任務**：運行我們的漢字練習網頁。請確保使用 Chrome 或 Edge 瀏覽器以獲得完整的藍牙支持。

---

## � 3. 項目流程 (Project Workflow)

1.  **工程設計 (Engineering)**：使用 Tinkercad 設計並打印筆身。
2.  **數據訓練 (Data Training)**：使用 Create AI 錄製動作，生成你的專屬 AI 模型。
3.  **編程實現 (Coding)**：在 MakeCode 中應用模型，編寫邏輯並下載到 Micro:bit。
4.  **測試與優化 (Testing)**：連接網頁應用，測試書寫效果，並根據反饋優化你的動作或代碼。
