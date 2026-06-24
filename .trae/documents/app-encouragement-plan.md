# App 定製鼓勵模式計畫

## Summary

目標是在正式遊戲流程 `claude_ver/stroke test/src/GeminiApp.jsx` 內，設計一套參考 Duolingo「高頻正向回饋」但不直接複製的鼓勵模式，優先強化兩個節點：

1. 即時肯定：每次答對筆劃時，立刻以音效、色彩、微動畫、角色反應與一句短文案確認「你做對了」。
2. 過關儀式感：每完成一個字或一個部首關卡時，用更完整的視覺與語言回饋，讓玩家感受到「作品完成、角色慶功、材料收集推進」。

這套模式會保留專案現有的「四大職業世界 + 狀元冠帽」敘事，因此不引入 `XP`、`連勝天數`、`愛心扣血` 等 Duolingo 辨識度很高的外顯機制，而是改用「職人做工完成感 + 角色陪伴誇獎 + 材料落位」來建立自己的品牌語氣。

## Current State Analysis

### 已有基礎

- `claude_ver/stroke test/src/GeminiApp.jsx`
  - 正式遊戲已有筆劃正誤判定、`showPopupHint` 小彈字、`playSuccessSound()` / `playErrorSound()`、關卡載入、字卡預覽、關卡完成後 `AchievementModal` 與彩帶 `showCelebration`。
  - 成功時目前主要回饋是：
    - `feedback = "完美！"`
    - `showPopupHint = { text: "完美！", type: "success" }`
    - 播放單一成功音效
    - 畫布描出筆劃路徑
  - 關卡完成時目前主要回饋是：
    - `showCelebration` 彩帶
    - 切到 `GAME_STATE.ACHIEVEMENT`
    - 顯示 `AchievementModal`
- `claude_ver/stroke test/src/components/AchievementModal.jsx`
  - 已有完成關卡的彈窗、徽章圖、時間資訊與操作按鈕。
  - 目前偏「結算面板」，儀式感已存在，但還不夠像「角色慶功 + 材料進帳 + 明確完成語言」。
- `claude_ver/stroke test/src/utils/themeAudio.js`
  - 已有全域 UI 音效引擎，支援 `step` 與 `reward` 兩種提示音。
  - 目前 `GeminiApp.jsx` 沒有接入這個全域音效，而是使用自己建立的 `AudioContext` 成功音與錯誤音。
- `claude_ver/stroke test/src/index.css`
  - 已有彩帶、頁面進場等動畫基礎，可擴充即時鼓勵與過關儀式所需的短動畫 class。

### 現況問題

- 即時正向回饋太單一：成功時只會出現重複的「完美！」，容易疲乏，且缺少世界觀語言。
- 角色雖有職業背景，但答對後沒有明顯「角色也在回應你」的表現，童趣陪伴感不足。
- 完成字與完成整關之間的儀式層次不夠清楚：
  - 完成一筆：有
  - 完成一個字：有加秒與切到下一字，但儀式較弱
  - 完成整個部首關卡：有 modal，但沒有明確呈現「材料掉落 + 角色誇獎 + 最終收藏推進」的連續敘事
- 聲音系統分散：首頁/介紹頁與正式遊戲頁的音效設計語言不一致。

## Assumptions & Decisions

- 優先落地範圍：只做正式遊戲頁 `/game`，不先改 `WritingTestPage.jsx` 與 `HomePreviewV2.jsx`。
- 鼓勵語氣：採用「童趣角色型」，但維持職人世界觀，不改成純幼兒語氣。
- 完成儀式：採用雙層結合，既有「材料掉落 / 收藏推進」，也有「角色誇獎 / 慶功表情 / 文案升級」。
- 不新增 Duolingo 既視感很高的指標系統，例如 `XP`、排行榜、streak、愛心。
- 不重做遊戲核心規則，不改 BLE/筆劃識別邏輯，這次只調整鼓勵呈現與節奏。
- 優先重用現有角色圖、職業資料、彩帶與 Tailwind/GSAP 基礎，不新增外部圖片資產。
- 文案全部走「職業世界化」設計，例如木部說「敲得準」，言部說「這一筆真有書卷氣」，而不是通用的 `Great job`。

## Proposed Changes

### 1. 新增鼓勵文案與狀態配置

**檔案**

- 新增 `claude_ver/stroke test/src/utils/encouragementFeedback.js`

**要做什麼**

- 建立一個集中配置，輸出：
  - 各職業世界的即時稱讚文案池
  - 各職業世界的完成字文案
  - 各職業世界的完成關卡文案
  - 答對時的角色表情/姿勢代碼
  - 完成儀式要顯示的材料名稱與短說明

**為什麼**

- 避免所有回饋都硬寫在 `GeminiApp.jsx`，讓後續延伸到 `WritingTestPage.jsx` 時可直接重用。
- 這是避免過度複製 Duolingo 的關鍵：我們的鼓勵內容會直接綁定木工/田園/廚房/書院四個世界，而不是通用稱讚模板。

**怎麼做**

- 以 `profession.id` 為 key，例如 `wood`、`grain`、`fire`、`speech`。
- 每個世界至少提供：
  - 4 組即時肯定短句
  - 2 組完成一個字的中型鼓勵語
  - 2 組完成整關的儀式型祝賀語
  - 1 組材料掉落標籤與「已收入冠帽材料欄」類型提示
- 即時文案長度控制在 4 到 10 字，適合做浮動 badge，不遮住畫布。

### 2. 把正式遊戲的「答對瞬間」升級成三層即時肯定

**檔案**

- 更新 `claude_ver/stroke test/src/GeminiApp.jsx`

**要做什麼**

- 在每次判定成功時，不只顯示目前的 `showPopupHint`，而是新增三層即時回饋：
  1. `畫布層`
     - 當前筆劃成功時，畫布周圍做 250 到 450ms 的世界色脈衝。
     - 筆劃完成點附近出現短暫星點/火花/墨滴 burst。
  2. `角色層`
     - 角色圖示或工具徽章做一次「向前點頭 / 輕跳 / 發光」。
     - 文字區顯示對應世界的角色肯定短句。
  3. `音效層`
     - 成功時播放更輕快的「correct」音，而不是只靠目前單一成功音。

**為什麼**

- 使用者要求重點是「答對當下立刻出現音效、動畫、顏色變化、角色表情」；現有程式已有成功判定點，最適合在這裡疊加。
- 把回饋拆成三層可以強化立即確認，但仍保持畫面簡潔，不會像硬塞獎章一樣過度。

**怎麼做**

- 在 `GeminiApp.jsx` 新增以下 state：
  - `livePraise`
  - `livePraiseTone`
  - `correctBurst`
  - `characterMood`
  - `recentSuccessStamp`
- 成功時流程改成：
  - 依 `profession.id` 從 `encouragementFeedback.js` 取一條即時文案
  - 更新 `showPopupHint` 為世界化文案，而不是固定 `完美！`
  - 觸發 `characterMood = celebrate`
  - 觸發 `correctBurst = { x, y, kind }`
  - 啟動 `livePraise` 1 秒後自動淡出
- 保留現有 `animateStrokePath()`，但在動畫結束後再補一個短暫的成功脈衝，避免和筆跡動畫互搶。
- 失敗邏輯不大改，只把文案維持柔和，不讓負面回饋壓過正向主軸。

### 3. 在正式遊戲畫面加入「角色即時鼓勵條」

**檔案**

- 更新 `claude_ver/stroke test/src/GeminiApp.jsx`

**要做什麼**

- 在現有左側資訊面板新增一個小型「角色鼓勵條」區塊，位置放在計時/工具資訊與師傅口訣之間。
- 內容包括：
  - 角色頭像或職業 icon
  - 當前鼓勵短句
  - 目前進度詞，如「這一筆穩了」「木框又完成一節」

**為什麼**

- 使用者偏好「童趣角色型」，這代表鼓勵不是只靠彈字，而是要有一個持續存在的「陪你的人」。
- 這個區塊可承接每次成功後的短句，也能在字完成時顯示更完整的中型鼓勵語。

**怎麼做**

- 以現有 `profession.icon` 或 `badgeImage` 生成固定的角色區。
- 空閒狀態顯示「準備下一筆」型鼓勵。
- 成功後 1.2 秒內切成亮色卡片並自動退回常態。
- 世界配色沿用 `getProfessionTheme()` 輸出，不新增新主題系統。

### 4. 新增「完成一個字」的小型儀式，而不是直接硬切下一字

**檔案**

- 更新 `claude_ver/stroke test/src/GeminiApp.jsx`
- 可能輕量更新 `claude_ver/stroke test/src/index.css`

**要做什麼**

- 目前完成整個字後，只會：
  - 加 30 秒
  - 延遲 1 秒切下一字
- 調整為：
  1. 顯示「作品完成卡」
  2. 角色短暫慶功
  3. 出現材料掉落或部件落位提示
  4. 再切到下一個字

**為什麼**

- 如果每個字只是技術上過關，沒有被「收尾確認」，玩家對自己的進步記憶感會很弱。
- 小儀式能承接大儀式，形成「一筆有小回饋，一字有中回饋，一關有大回饋」的節奏。

**怎麼做**

- 在完成最後一筆後，先不立刻切下一字。
- 顯示 900 到 1200ms 的字完成 overlay：
  - 例如「木框做好了！」「這塊穗飾編好了！」
  - 配合世界 icon、小亮片、加秒提示
- Overlay 結束後再執行現在的 `fetchGameLevelData(currentLevel, nextCharIndex)`。
- 如果是當前部首的最後一個字，則直接導入大儀式，不再顯示重複小儀式。

### 5. 把整關完成改成「材料入庫 + 角色慶功 + 結算」三段式儀式

**檔案**

- 更新 `claude_ver/stroke test/src/GeminiApp.jsx`
- 更新 `claude_ver/stroke test/src/components/AchievementModal.jsx`

**要做什麼**

- 現在整關完成流程為：彩帶 -> AchievementModal。
- 改成三段式：
  1. `瞬間爆發`
     - 全畫面彩帶與世界色光暈
     - 播放較完整的 ceremony 音效
  2. `收成確認`
     - 在 modal 開啟前，短暫顯示本關掉落材料卡
     - 文字明確告知該材料已加入狀元冠帽收藏
  3. `成就展示`
     - `AchievementModal` 上半部加入角色慶功文案與材料名稱
     - 既保留時間統計，也保留故事收尾

**為什麼**

- 使用者明確要求「過關儀式感」。
- 專案本身已有冠帽主線，最值得擴大的不是 generic 勝利，而是「你完成了某個世界的職人工序，因此冠帽又多了一件組件」。

**怎麼做**

- 在 `GeminiApp.jsx` 新增 `levelCeremonyPayload` state，承接：
  - `profession`
  - `rewardLabel`
  - `completionCopy`
  - `characterPraise`
- 完成部首關卡時：
  - 先設定 `showCelebration = true`
  - 生成 `levelCeremonyPayload`
  - 延遲約 500 到 700ms 後再打開 `AchievementModal`
- `AchievementModal.jsx` 調整內容：
  - Header 改成角色慶功標題，而不是固定「挑戰成功」
  - 新增「本次收成」區塊，顯示材料名稱與對應圖像/職業 icon
  - 新增「狀元冠帽推進」一句說明，例如「木部工坊材料已收入冠帽木框」
  - 按鈕維持簡潔，只保留「返回選關 / 主選單」

### 6. 統一遊戲內正向音效語言

**檔案**

- 更新 `claude_ver/stroke test/src/main.jsx`
- 更新 `claude_ver/stroke test/src/utils/themeAudio.js`
- 更新 `claude_ver/stroke test/src/GeminiApp.jsx`

**要做什麼**

- 讓正式遊戲也接入和首頁同一套音效引擎，但新增更細的音色類型：
  - `correct`
  - `wordComplete`
  - `ceremony`
- 移除或弱化 `GeminiApp.jsx` 內自建成功音的主導地位，避免全站音效風格斷裂。

**為什麼**

- 現在首頁/介紹頁與正式遊戲的音效來源分離，不利於做成一套完整品牌體驗。
- 這次即時肯定非常依賴音效層，應該共用一個可維護的音效入口。

**怎麼做**

- `main.jsx` 改成 `<GeminiApp onPulseSfx={playUiSfx} />`
- `themeAudio.js` 擴充 `playUiSfx(kind)` 支援更多類型，不改 public API 名稱。
- `GeminiApp.jsx` 成功時改調 `onPulseSfx?.('correct')`，完成字時調 `wordComplete`，完成整關時調 `ceremony`。
- 保留本地 `playErrorSound()` 做錯誤提醒，不把負面音效塞進全域共用音效中。

### 7. 補齊必要動畫樣式，但控制在輕量範圍

**檔案**

- 更新 `claude_ver/stroke test/src/index.css`

**要做什麼**

- 新增這次需要的少量動畫 class：
  - `encourage-burst`
  - `encourage-glow`
  - `encourage-float`
  - `ceremony-pop`
  - `character-cheer`

**為什麼**

- 目前只有彩帶與頁面進場動畫，缺少專供「答對瞬間」和「過關小儀式」使用的輕量動畫。
- 用 CSS 補齊小型動畫，比把所有效果都塞進 GSAP 更適合高頻觸發。

**怎麼做**

- 所有新動畫時長控制在 250 到 900ms。
- 避免連續永久動效，降低視覺疲勞與硬體負擔。
- 大型儀式仍可沿用現有 confetti，新增的 class 主要服務成功瞬間與材料卡彈出。

## Interaction Rules

### 即時肯定規則

- 觸發條件：每次筆劃判定成功。
- 必做反應：
  - 播放 `correct` 音
  - 顯示世界化短句
  - 畫布或筆劃終點出現 burst
  - 角色 icon 輕跳 / 發光
- 不做的事：
  - 不顯示積分
  - 不出現誇張大面積遮罩
  - 不打斷下一筆節奏超過 1 秒

### 完成一個字規則

- 觸發條件：完成當前字最後一筆，且該字後面仍有下一字。
- 必做反應：
  - 播放 `wordComplete`
  - 顯示字完成卡
  - 顯示材料/作品完成語
  - 角色慶功一次
  - 加秒提示可視化
- 自動延續到下一字，不要求玩家再次點擊。

### 完成整關規則

- 觸發條件：完成該部首最後一個字。
- 必做反應：
  - 播放 `ceremony`
  - 彩帶與全畫面儀式光暈
  - 顯示收成材料確認
  - 打開增強版 `AchievementModal`
- 這一層儀式才使用較完整文案，避免每次小成功都太重。

## Out Of Scope

- 不修改 BLE、Serial、Micro:bit 連線流程。
- 不修改字庫抓取與筆劃分類邏輯。
- 不擴充到首頁 `/`、介紹頁 `/intro`、測試頁 `/writing-test`。
- 不新增帳號、長期成就、排行榜、積分系統。
- 不新增外部圖片資產或第三方動畫套件。

## Verification Steps

### 手動驗證

1. 進入 `/game`，跳過連線進入選關，選任一部首。
2. 成功完成單筆後確認：
   - 有立即音效
   - 有色彩/動畫 burst
   - 有角色型鼓勵短句
   - 不會遮住主要書寫視圖
3. 成功完成一個字後確認：
   - 有字完成小儀式
   - 有材料/作品完成提示
   - 約 1 秒內自然進下一字
4. 完成整個部首關卡後確認：
   - 先出現大儀式，再出現 modal
   - modal 內能看到世界化祝賀語與材料收成資訊
   - 返回選關與主選單仍能正常工作
5. 關閉 SFX 後再測一次，確認視覺鼓勵仍成立，且不報錯。

### 回歸檢查

- `main.jsx` 路由切換正常。
- `AchievementModal.jsx` 在沒有材料資料時也能正常渲染，不應白屏。
- 遊戲成功/失敗流程仍能繼續，不應卡在 overlay 或 transition state。
- `GetDiagnostics` 檢查至少涵蓋：
  - `claude_ver/stroke test/src/GeminiApp.jsx`
  - `claude_ver/stroke test/src/components/AchievementModal.jsx`
  - `claude_ver/stroke test/src/utils/themeAudio.js`
  - `claude_ver/stroke test/src/main.jsx`

## Execution Order

1. 新增 `encouragementFeedback.js`，先把文案與儀式資料集中。
2. 調整 `main.jsx` 與 `themeAudio.js`，先打通正式遊戲與全域音效。
3. 在 `GeminiApp.jsx` 接入即時鼓勵 state、字完成小儀式與整關 ceremony payload。
4. 更新 `AchievementModal.jsx`，把整關收尾改成故事化成就面板。
5. 在 `index.css` 補齊小型動畫樣式。
6. 做手動流程驗證與 diagnostics 檢查。
