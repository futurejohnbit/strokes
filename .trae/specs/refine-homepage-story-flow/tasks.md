# Tasks
- [x] Task 1: 先做 GitHub 與免費資源研究，確認可參考的 landing page 實作模式。
  - [x] SubTask 1.1: 搜尋 GitHub 上與 landing page、hero section、教育產品首頁、簡潔動畫有關的可用內容
  - [x] SubTask 1.2: 搜尋可免費使用的背景音樂庫或免費授權來源
  - [x] SubTask 1.3: 整理哪些方案可直接參考、哪些只適合作為設計靈感

- [x] Task 2: 重新定義首頁資訊架構，只保留 landing page 必要內容。
  - [x] SubTask 2.1: 盤點現有首頁中應刪除的區塊，例如介紹頁導向、浮窗、過長內容與多餘模組
  - [x] SubTask 2.2: 定義新的首頁內容順序：標題、簡單故事、流程概說、主要按鈕
  - [x] SubTask 2.3: 確保首屏閱讀順序清晰，標題位於正上方並成為主視覺

- [x] Task 3: 重寫 landing page 的版面與視覺層次。
  - [x] SubTask 3.1: 重新設計 hero 區塊，使標題區約佔主要可視區 30%
  - [x] SubTask 3.2: 以面向小學觀眾的語氣重寫簡單故事與玩法概說
  - [x] SubTask 3.3: 整合頁內主要按鈕，讓操作清楚而不花哨

- [x] Task 4: 重構首頁音樂控制方式。
  - [x] SubTask 4.1: 移除音響浮窗
  - [x] SubTask 4.2: 改為頁面內按鈕控制背景音樂開關
  - [x] SubTask 4.3: 採用免費音樂庫或免費授權方案，並在交付中記錄來源與選用理由

- [x] Task 5: 清理不屬於本輪需求的額外頁面與過度設計方向。
  - [x] SubTask 5.1: 去掉介紹頁面在首頁流程中的角色
  - [x] SubTask 5.2: 確保本輪不再以額外測試頁或多頁敘事作為首頁方案的一部分
  - [x] SubTask 5.3: 若現有素材不足支撐首頁主視覺，明確標示人工插圖介入需求

- [x] Task 6: 驗證新的 landing page 是否符合需求。
  - [x] SubTask 6.1: 驗證首頁是否為單一 landing page
  - [x] SubTask 6.2: 驗證首頁是否包含標題、簡單故事、流程概說與頁內按鈕
  - [x] SubTask 6.3: 驗證音樂控制是否改為頁內按鈕且來源為免費資源
  - [x] SubTask 6.4: 驗證是否已完成 GitHub 先行研究

- [x] Task 7: 補齊免費背景音樂實際交付，修復 checklist 未通過項。
  - [x] SubTask 7.1: 從 Pixabay Music 或已核准的免費授權來源選定最終音軌，記錄曲目名稱、來源網址、下載日期與授權截圖
  - [x] SubTask 7.2: 將核准音檔放入 public/audio/exhibition-theme.mp3，確認首頁音樂按鈕可正常播放與關閉
  - [x] SubTask 7.3: 將首頁音樂來源文案改為最終採用曲目資訊，避免保留「請先下載」的暫代說明
  - Delivery note: 最終採用 Mixkit 曲目 Playground Fun（Ahjay Stelino），來源頁 https://mixkit.co/free-stock-music/tag/kids/ ，授權頁 https://mixkit.co/license/#musicFree ，下載日期 2026-06-22；交付紀錄已存於 .trae/specs/refine-homepage-story-flow/artifacts/music-delivery-record.md，來源頁截圖已存於同資料夾。

# Task Dependencies
- Task 2 depends on Task 1
- Task 3 depends on Task 1, Task 2
- Task 4 depends on Task 1
- Task 5 depends on Task 2
- Task 6 depends on Task 3, Task 4, Task 5
