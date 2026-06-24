# 遊戲鼓勵模式微調計畫

## Summary

本次調整目標是把正式遊戲頁目前新增的鼓勵模式收斂成更簡潔、直接、易懂的版本，重點處理以下七項：

1. 去掉書寫框內的顏色閃動。
2. 所有即時稱讚統一改成「真棒！」。
3. 移除左側的「即時肯定 / 角色陪伴」提示框。
4. 完成一個字後的小型轉接彈窗只保留加時資訊。
5. 完成一關後的獎勵提示卡放大、停留 3 秒、重點字樣更醒目；成就彈窗中的徽章顯示要修正不被遮住。
6. 恢復或加強答對後的獎勵聲音。
7. 背景音樂不改功能範圍，只補清楚「如何自行加入」的使用說明。

## Current State Analysis

### 目前實作位置

- `claude_ver/stroke test/src/GeminiApp.jsx`
  - 答對後的畫布內視覺強化來自：
    - `correctBurst`
    - `recentSuccessStamp`
    - `encourage-glow`
    - `showPopupHint`
  - 目前稱讚文案來自：
    - `showInstantEncouragement()`
    - `pickInstantPraise()`
    - `feedback`
  - 左側「即時肯定」區塊位於 `GAME_STATE.PLAYING` 左側面板中，約在目前檔案 `2536` 行附近。
  - 完成一個字後的小型轉接卡由 `wordCelebration` 控制，內容目前包含：
    - `rewardAccent`
    - `headline`
    - `subline`
    - `rewardLabel`
    - `bonusText`
  - 完成一關後的大型獎勵提示由 `levelCeremonyPayload` 控制，顯示在 `GAME_STATE.ACHIEVEMENT` 前。
  - 答對音效透過 `playPositiveSfx('correct')` 轉給 `main.jsx` 的 `playUiSfx()`。
- `claude_ver/stroke test/src/components/AchievementModal.jsx`
  - 通關後徽章使用 `profession.badgeImage` 顯示於 `w-40 h-40` 的圓形容器內。
  - 目前容器有 `overflow-hidden`，而圖片使用 `object-contain p-2`，這很可能就是使用者看到「徽章被遮住」的原因之一。
- `claude_ver/stroke test/src/utils/themeAudio.js`
  - `playUiSfx('correct')` 已存在，但 `correct` 音量峰值目前只有 `0.065`，相較 `reward` / `ceremony` 偏弱。
  - 背景音樂已支援本地檔案播放，路徑為 `/audio/exhibition-theme.mp3`。
- `claude_ver/stroke test/src/ExhibitionHome.jsx`
  - 首頁已有背景音樂按鈕與一段簡短說明。
  - 目前說明有提到 `public/audio/exhibition-theme.mp3`，但可再補得更明確、更像操作指引。

### 已確認的使用者偏好

- 即時鼓勵要更簡潔，不要多層文字和額外卡片。
- 遊戲內要保留正向回饋，但不要太花、太多中繼 UI。
- 背景音樂本次不擴到整個 app，只需要補清楚使用方式。

## Assumptions & Decisions

- 「書寫框內的顏色閃動」指的是畫布內成功時的 glow/burst 視覺效果，而不是整頁彩帶或通關儀式。
- 「讚賞的話改為只說真棒」套用在正式遊戲成功時的主要文案：
  - `showPopupHint`
  - `feedback`
  - 不再依世界切換不同即時稱讚
- 左側被選到的 `div` 就是要整塊移除，不保留縮小版。
- 完成一字後的轉接卡保留，但只顯示加時資訊，例如 `+30 秒`，不再顯示收成名稱、標題、副文案。
- 完成一關後的「獎勵信息」優先指 `GeminiApp.jsx` 內、進入 `AchievementModal` 之前的那張大獎勵卡，而不是後面的成就 modal 本體。
- 背景音樂不新增上傳功能，不做檔案選擇器，不延伸到遊戲頁；只在首頁說明中補上更明確的操作步驟。

## Proposed Changes

### 1. 收斂即時成功回饋，只保留最必要的提示

**檔案**

- 更新 `claude_ver/stroke test/src/GeminiApp.jsx`

**要做什麼**

- 移除或停用畫布內成功時的視覺閃動：
  - 不再渲染 `correctBurst`
  - 不再在畫布容器套用 `encourage-glow`
  - 停用 `triggerCorrectBurst()` 與相關 `recentSuccessStamp` 視覺用途
- 將答對時的彈出提示統一改成固定文字：
  - `showPopupHint.text = "真棒！"`
  - `feedback = "真棒！"`

**為什麼**

- 使用者明確要求去掉書寫框內顏色閃動。
- 目前成功時同時有畫布 glow、burst、彈出提示、左側卡片、聲音，資訊太多；收斂後更清爽。

**怎麼做**

- 保留成功後的筆跡動畫 `animateStrokePath()`，因為那是功能性回饋，不屬於多餘閃動。
- 成功時仍保留一個畫布外的 `showPopupHint`，但不再帶世界色與多樣文案。

### 2. 移除左側「即時肯定」卡片

**檔案**

- 更新 `claude_ver/stroke test/src/GeminiApp.jsx`

**要做什麼**

- 刪除左側面板中目前顯示：
  - `即時肯定`
  - `角色陪伴`
  - `木工師傅看著你，準備把下一筆敲穩。`
  這整塊 UI。
- 同步清理不再需要的 state / helper：
  - `livePraise`
  - `livePraiseTone`
  - `characterMood`
  - `queueLivePraise()`
  - `triggerCharacterMood()`
  - 與這塊卡片直接綁定的 timeout ref

**為什麼**

- 使用者已直接指定移除該 `div`。
- 若不刪除相關狀態，之後只會留下無用狀態與 timeout，增加維護負擔。

### 3. 把「完成一個字」的小彈窗縮成純加時提示

**檔案**

- 更新 `claude_ver/stroke test/src/GeminiApp.jsx`

**要做什麼**

- 保留 `wordCelebration` 這個中繼節點，但資料縮減成最小型：
  - 只顯示 `+30 秒`
  - 可補一句很短的標籤，例如 `加時獎勵`
- 移除目前的：
  - `rewardAccent`
  - `headline`
  - `subline`
  - `rewardLabel`

**為什麼**

- 使用者希望完成一字後不要再被一張內容很多的過場卡打斷。
- 但加時本身是重要資訊，應保留且顯眼。

**怎麼做**

- `showWordCelebrationCard()` 改成只組出 `bonusText` 或 `label + bonusText`。
- 畫面上的 `wordCelebration` 區塊改為小型、極簡，位置仍維持在畫布底部或靠近計時區即可，不新增互動。

### 4. 放大關卡完成前的大獎勵卡，延長停留到 3 秒

**檔案**

- 更新 `claude_ver/stroke test/src/GeminiApp.jsx`
- 可能更新 `claude_ver/stroke test/src/index.css`

**要做什麼**

- 調整 `levelCeremonyPayload` 對應的獎勵卡：
  - 容器尺寸放大（目前 `max-w-md` 偏小）
  - 主標題、獎勵名、關鍵詞放大
  - 關鍵字以更明顯的視覺設計強化，例如更深底色、對比標籤、加粗數字/詞
- 停留時間改成 3 秒後再消失或轉入成就彈窗。

**為什麼**

- 使用者希望這一層更有「真的得獎」的感覺，而且要看得清楚。
- 目前卡片只停留約 `650ms` 就切換進 `AchievementModal`，資訊其實來不及讀。

**怎麼做**

- 調整 `openLevelCeremony()` 內兩個 timeout：
  - 進入 `GAME_STATE.ACHIEVEMENT` 的時間延後到約 `3000ms`
  - `showCelebration` 的彩帶時間可視情況同步拉長，或至少涵蓋主要獎勵卡停留前段
- 讓 `rewardLabel` 成為卡片中的主視覺焦點，而不是和說明文字同等層級。

### 5. 修正通關後成就彈窗的徽章裁切問題

**檔案**

- 更新 `claude_ver/stroke test/src/components/AchievementModal.jsx`

**要做什麼**

- 檢查並調整徽章容器與圖片樣式，避免被圓形容器邊界裁掉：
  - 放大容器，或改成更寬鬆的內距
  - 視需要移除或放寬 `overflow-hidden`
  - 圖片可改為較安全的 `object-contain` 搭配更小 padding / 更大容器
- 若某些 badge 本身比例偏高，也要確保在 modal 中完整可見。

**為什麼**

- 這是明確的可見性 bug，不是風格偏好。
- 通關後的徽章是重要成果，如果被遮擋，整個收尾體驗會打折。

### 6. 恢復並加強答對音效

**檔案**

- 更新 `claude_ver/stroke test/src/utils/themeAudio.js`
- 視需要輕量更新 `claude_ver/stroke test/src/GeminiApp.jsx`

**要做什麼**

- 提升 `correct` 音效的可感知度：
  - 拉高峰值音量
  - 拉長一點持續時間
  - 必要時為 `correct` 也加一個短 chime，讓它不會被 `reward` / `wordComplete` 壓過
- 檢查 `GeminiApp.jsx` 成功流程是否有重複或互相覆蓋的音效觸發，避免聲音被後續切換打斷。

**為什麼**

- 使用者明確回報「答對後的獎勵聲音不見了」。
- 從目前參數看，`correct` 比 `wordComplete` / `ceremony` 弱很多，聽感上可能像不存在。

### 7. 補強背景音樂的使用說明

**檔案**

- 更新 `claude_ver/stroke test/src/ExhibitionHome.jsx`
- 視需要輕量更新 `claude_ver/stroke test/src/utils/themeAudio.js`

**要做什麼**

- 將首頁的背景音樂說明改得更明確，至少包含：
  1. 去哪裡下載
  2. 檔名要叫什麼
  3. 放到哪個資料夾
  4. 如何在頁面上開啟
- 如有需要，順手補一行更直白的 fallback 說明，例如：
  - 若沒有放入檔案，音樂按鈕不會播放內容

**為什麼**

- 目前功能已存在，但對一般使用者而言還不夠像「操作指引」。
- 使用者這次要的是「怎麼才能加」，不是新增音樂系統。

## Verification Steps

### 視覺與互動驗證

1. 進入 `/game`，完成單筆後確認：
   - 書寫框內不再有顏色閃動或 burst
   - 畫面只出現簡單的 `真棒！`
   - 左側不再出現「即時肯定」卡片
2. 完成一個字後確認：
   - 只看到加時資訊
   - 不再顯示收成標題、副文案、材料名稱
   - 約 1 秒左右自然切到下一字
3. 完成整關後確認：
   - 大獎勵卡比現在明顯更大
   - 重點字樣更清楚
   - 停留約 3 秒後才消失/切入成就彈窗
4. 打開成就彈窗確認：
   - 徽章不被遮住
   - 在不同關卡顏色與圖像下仍完整顯示
5. 答對單筆時確認：
   - 能清楚聽見成功音效

### 背景音樂驗證

1. 首頁文字中能清楚看到：
   - `public/audio/exhibition-theme.mp3`
   - 音樂來源與授權入口
   - 點擊頁面音樂按鈕的使用方式
2. 若本地存在該檔案，首頁切換按鈕後能開始/停止播放。

### 技術驗證

- `GetDiagnostics` 至少檢查：
  - `claude_ver/stroke test/src/GeminiApp.jsx`
  - `claude_ver/stroke test/src/components/AchievementModal.jsx`
  - `claude_ver/stroke test/src/utils/themeAudio.js`
  - `claude_ver/stroke test/src/ExhibitionHome.jsx`
- 執行 `npm run build`，確認沒有編譯錯誤。

## Execution Order

1. 先在 `GeminiApp.jsx` 移除多餘的即時鼓勵狀態與 UI。
2. 同步把答對文案收斂成固定 `真棒！`，並關掉書寫框內顏色閃動。
3. 精簡 `wordCelebration` 成只顯示加時。
4. 放大並延長 `levelCeremonyPayload` 獎勵卡停留時間。
5. 修正 `AchievementModal.jsx` 的徽章顯示。
6. 調整 `themeAudio.js` 的 `correct` 音效。
7. 補強 `ExhibitionHome.jsx` 的背景音樂說明。
8. 做視覺驗證、diagnostics 與 build 檢查。
