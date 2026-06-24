# 新版首頁 GSAP 預覽方案計劃

## Summary

- 目標是在**不覆寫現有首頁**的前提下，為 `claude_ver/stroke test` 建立一個可獨立預覽的新版首頁第一版。
- 預覽入口使用**獨立路徑**，例如 `/home-v2`，保留目前 `/` 正式首頁與 `/debug` 調試入口不變。
- 新版首頁定位為一個以 GSAP 驅動的「學習冒險入口」，先展示世界觀、四大職業、先試玩示範、收集與成就，再提供連接 Micro:bit 或進入正式遊戲的入口。
- 新版首頁第一版聚焦以下內容：
  - 第一優先：重做首屏、加入四大職業世界入口、補上自動播放 demo 預覽。
  - 第二優先：加入音樂/音效控制、四個原有徽章牆。
  - 擴充設定：加入「每畫一筆就完成物件更多一點」的收集與動畫概念，四關材料最終整合為**狀元冠帽**。
- 本次只做**預覽版首頁與入口切換**，不直接改寫現有 `GeminiApp.jsx` 的正式首頁流程。

## Current State Analysis

### 現有入口與路由狀態

- 目前入口在 `claude_ver/stroke test/src/main.jsx`。
- `main.jsx` 現在僅依 `window.location.pathname` 與 query 決定：
  - `/debug` 或 `?debug=1` 載入 `StrokeTest`
  - 其餘載入 `GeminiApp`
- 專案**沒有 React Router**，因此新增預覽入口最穩定的方式是延續現有的 `pathname` 分流模式。

### 現有首頁與遊戲狀態

- 正式首頁在 `claude_ver/stroke test/src/GeminiApp.jsx` 中的 `GAME_STATE.MENU` 區塊。
- 現有首頁已具備：
  - 品牌標題與世界觀文案
  - 連接 Micro:bit 按鈕
  - 跳過連接進入選關
  - 連接成功後的準備畫面
- 目前首頁仍以「連接裝置」為主要焦點，未完整呈現：
  - 四大職業世界入口
  - 首次使用者能快速理解的示範區
  - 徽章、收集、成長、故事終局

### 現有素材與系統可重用項目

- `claude_ver/stroke test/package.json` 已包含 `gsap` 依賴，無需新增套件。
- `claude_ver/stroke test/src/GeminiApp.jsx` 已有四大職業設定 `PROFESSION_LEVELS`：
  - `wood` 木部工坊
  - `grain` 禾部田園
  - `fire` 火部廚房
  - `speech` 言部書院
- 已有四個對應角色/徽章圖片：
  - `src/assets/images/carpenter.png`
  - `src/assets/images/farmer.png`
  - `src/assets/images/chef.png`
  - `src/assets/images/scholar.png`
- 已有四張場景背景：
  - `public/level-bg/wood.png`
  - `public/level-bg/grain.png`
  - `public/level-bg/fire.png`
  - `public/level-bg/speech.png`
- 已有成就結算元件 `src/components/AchievementModal.jsx`，可作為徽章視覺語言參考，但預覽首頁不直接修改此元件。
- `GeminiApp.jsx` 已有音效與語音相關基礎邏輯：
  - Web Audio success / error sound
  - `speechSynthesis` 粵語朗讀
- 這表示新版首頁預覽可先做**音效/音樂控制 UI 與互動框架**，後續與正式遊戲整合成本低。

## Assumptions & Decisions

- 預覽版採用**獨立路徑**，避免影響現有首頁與展示流程。
- 新版首頁預覽先聚焦於**展示與理解**，不是直接複製完整遊戲邏輯。
- 「先試玩示範」採用**自動播放循環 demo**，以最快速度讓第一次進入的使用者看懂玩法。
- 聲音預設採用**音效開、背景音樂關**，更符合學校、家長與展覽環境。
- 四關材料最終整合物設定為**狀元冠帽**，作為整體世界觀與收集線的終極目標。
- 四個原有徽章沿用現有職業角色圖，首頁只新增展示與動畫，不修改原本關卡結算資料結構。
- 本次不改動 `GeminiApp.jsx` 現有 MENU 流程內容，僅新增一套首頁預覽體驗與入口分流。

## Proposed Changes

### 1. `claude_ver/stroke test/src/main.jsx`

**What**

- 擴充現有 `pathname` 分流，新增新版首頁預覽入口，例如：
  - `/home-v2`
  - 可選擇再支援 `/preview/home-v2`

**Why**

- 符合「複製後的首頁上做，給我預覽，不要直接改寫」的要求。
- 不需要引入路由套件，維持現有專案結構與簡單性。

**How**

- 在現有 `Root()` 函式中新增路徑判斷。
- 當 `pathname` 命中新版首頁預覽路徑時，載入新的預覽頁元件。
- 保留：
  - `/` -> `GeminiApp`
  - `/debug` -> `StrokeTest`

### 2. 新增 `claude_ver/stroke test/src/HomePreviewV2.jsx`

**What**

- 建立新版首頁預覽主頁元件，作為 `/home-v2` 的主要畫面。

**Why**

- 與現有 `GeminiApp.jsx` 分離，避免直接修改正式首頁。
- 讓所有新版首頁結構、文案、動畫、示範邏輯集中在單一可維護入口。

**How**

- 頁面區塊規劃如下：

1. Hero 首屏
  - 大標題：強調「筆順 + 職業故事 + 體感互動 + 成就收集」。
  - 副標：補足教育與冒險雙重定位。
  - 主按鈕：
    - 立即進入正式首頁/開始連接
    - 先試玩示範
  - 右側主視覺：
    - 四職業混合舞台
    - 狀元冠帽輪廓/收集進度暗示
  - GSAP 動畫：
    - 標題、按鈕、角色、紙屑/光點/工具進場時間軸

2. 先試玩示範區
  - 自動播放 20-30 秒循環 demo
  - 展示流程：
    - 選擇一個職業世界
    - 顯示一個漢字或一個筆劃提示
    - 每一筆完成時，對應物件被「做成更多一點」
    - 關卡完成後掉落一個材料
  - GSAP 動畫：
    - 筆劃描繪
    - 物件完成度補間
    - 材料掉落與收納

3. 四大職業世界入口
  - 四張大卡片對應木、禾、火、言
  - 每張卡片展示：
    - 場景圖 / 角色圖
    - 關卡名、部首、簡述
    - 對應代表工具與代表收集材料
  - GSAP 動畫：
    - ScrollTrigger 卡片浮現
    - hover 微動效
    - 卡片內元素 stagger 進場

4. 收集與狀元冠帽總目標區
  - 說明四關收集邏輯：
    - 木部工坊：做出冠帽骨架或木框支撐
    - 禾部田園：收集穗飾與流蘇
    - 火部廚房：鍛出金飾/徽印/亮面裝飾
    - 言部書院：完成題字匾額或冠帽正面題字
  - 四關完成後合成「狀元冠帽」
  - 這個設定要做到邏輯自洽：
    - 每關除了完成該關特定物品，也額外獲得一個能拼進終局裝備的關鍵配件
  - GSAP 動畫：
    - 四材料逐一飛入中央
    - 最後組裝成完整冠帽

5. 徽章牆
  - 展示四個原有徽章/角色圖
  - 附簡短解鎖描述
  - 滑入或 hover 時放大、浮動、光暈動畫

6. 音樂 / 音效控制
  - 首頁固定 UI 區塊提供：
    - 背景音樂開關
    - 音效開關
  - 預設：
    - 音效開
    - 背景音樂關
  - 第一版先提供可操作狀態與示範用互動反應
  - 若有餘裕，可用 Web Audio 做極簡 UI 回饋音，不依賴外部資源

7. 入口收束區
  - 提供按鈕跳回正式首頁 `/`
  - 或直接用 `window.location.assign('/')`
  - 讓預覽與正式版本清楚區隔

### 3. 新增 `claude_ver/stroke test/src/components/home-preview/PreviewDemoStage.jsx`

**What**

- 建立「先試玩示範」專用元件。

**Why**

- 這是新版首頁第一優先，也是理解成本最低的功能核心。
- 把 demo 與首頁容器拆開，便於單獨調整動畫節奏與敘事順序。

**How**

- 元件內用假資料或精簡資料驅動示範，不直接接正式 BLE 或完整遊戲狀態。
- 示範資料包含：
  - 職業 ID
  - 代表字/代表筆劃
  - 該關物件
  - 本關收集材料
  - 動畫進度百分比
- 動畫流程：
  - 顯示任務卡
  - 筆劃開始
  - 每完成一筆，物件完成度 +25% 或按筆數比例增加
  - 關卡完成後，材料飛入「狀元冠帽組裝區」
- 第一版不追求真正的筆劃辨識，只做首頁理解示範。

### 4. 新增 `claude_ver/stroke test/src/components/home-preview/WorldCardGrid.jsx`

**What**

- 封裝四大職業世界入口卡片區。

**Why**

- 現有 `PROFESSION_LEVELS` 已有完整主題資料，適合抽出做首頁導航展示。
- 卡片需要獨立 GSAP hover / reveal 效果，拆元件更清晰。

**How**

- 接收經過整理的世界卡片資料。
- 顯示：
  - 世界名
  - 角色圖
  - 場景背景
  - 代表工具
  - 代表材料
- 加入 CTA：
  - 查看示範
  - 進入正式挑戰（連回 `/`）

### 5. 新增 `claude_ver/stroke test/src/components/home-preview/ScholarCrownAssembly.jsx`

**What**

- 封裝四關收集與最終「狀元冠帽」組裝區。

**Why**

- 使用者新增的「收集概念和動畫概念」是首頁新版故事邏輯的核心，需要單獨承載。

**How**

- 為四個職業各定義一個：
  - 關卡物件
  - 關鍵材料
  - 對狀元冠帽的貢獻
- 建議邏輯：
  - 木部工坊：打造冠帽木框骨架
  - 禾部田園：收集金穗流蘇
  - 火部廚房：鍛亮中央徽印與金飾
  - 言部書院：題寫冠帶正中匾字
- 頁面中同步呈現：
  - 每關完成的地方物件
  - 每關獲得的冠帽配件
  - 中央最終裝備的階段式完成圖
- GSAP 動畫用於：
  - 材料飛入
  - 零件吸附
  - 中央成品光效完成

### 6. 新增 `claude_ver/stroke test/src/components/home-preview/BadgeGallery.jsx`

**What**

- 展示四個原有徽章的首頁徽章牆。

**Why**

- 使用者明確要求保留「四個原有徽章」。
- 現有徽章素材已存在，最適合在首頁作為成就展示與回訪誘因。

**How**

- 從現有職業資料映射出四個徽章卡。
- 顯示：
  - 圖像
  - 世界名稱
  - 解鎖提示
- 卡片可搭配：
  - GSAP stagger 進場
  - hover 浮起
  - 已點亮/未點亮兩種視覺

### 7. 新增 `claude_ver/stroke test/src/components/home-preview/AudioControlDock.jsx`

**What**

- 建立首頁預覽的聲音控制面板。

**Why**

- 首頁已不是純靜態頁，GSAP 與示範區會搭配音效/音樂狀態提示。

**How**

- 控制項：
  - 背景音樂開關
  - 音效開關
- 預設值：
  - `music = false`
  - `sfx = true`
- 第一版先做 UI 與輕互動；
  - 若使用簡單 Web Audio click / whoosh，需可安全在使用者互動後啟動。

### 8. `claude_ver/stroke test/src/index.css`

**What**

- 補上新版首頁預覽專用樣式與動畫基礎 class。

**Why**

- 雖然主要動畫由 GSAP 驅動，但仍需要：
  - 基礎版面 class
  - 漸層、紙紋、光效背景
  - 初始 hidden state
  - 響應式排版補強

**How**

- 增加命名清楚的 preview 專用 class，例如：
  - `.home-v2-hero`
  - `.home-v2-orb`
  - `.home-v2-card`
  - `.home-v2-demo-progress`
- 避免污染現有 `GeminiApp` 的 class 風格。
- 若需要動畫 fallback，僅加少量 CSS keyframes，主要節奏仍交給 GSAP。

## GSAP Implementation Direction

### 動畫策略

- Hero：
  - 使用一個主 `timeline`
  - 標題、描述、按鈕、主視覺 stagger 進場
- 四大世界卡：
  - 使用 `ScrollTrigger` 逐段 reveal
  - hover 用 `gsap.to()` 做微縮放、傾斜或浮起
- Demo 區：
  - 使用 timeline loop 模擬「提示 -> 落筆 -> 物件完成 -> 材料掉落」
- 收集組裝區：
  - 使用 `MotionPath` 並非必要；第一版可先用位置補間與縮放完成材料飛入
- 徽章牆：
  - stagger + autoAlpha + y 進場

### 實作準則

- 優先動畫 `transform` / `opacity` / `autoAlpha`
- 避免頻繁動畫 `top / left / width / height`
- 高頻 hover 或跟手效果優先用 `quickTo()`，若實際加入此互動
- React 中使用 `gsap.context()` 或 `@gsap/react` 等價模式進行 cleanup
- 所有 ScrollTrigger 需在元件卸載時清除

## Narrative Design: 收集邏輯

### 核心敘事

- 玩家不是單純學筆順，而是在四個職業世界中完成任務、打造配件，最終成為能佩戴「狀元冠帽」的小小狀元。

### 四關邏輯

1. 木部工坊
  - 每筆完成：冠帽骨架或木作底框更完整
  - 本關完成物件：木框冠架
  - 額外收集：冠帽支架木扣件

2. 禾部田園
  - 每筆完成：穗飾編織更多一層
  - 本關完成物件：流蘇穗飾
  - 額外收集：金穗配件

3. 火部廚房
  - 每筆完成：徽印鍛打更亮、金屬更完整
  - 本關完成物件：火紋徽印
  - 額外收集：冠帽中央金飾

4. 言部書院
  - 每筆完成：題字卷面或冠帶墨字逐步顯現
  - 本關完成物件：題字冠帶
  - 額外收集：狀元題字牌

### 最終合成

- 四關材料匯聚後，中央展示「狀元冠帽」完整成型。
- 這個終點既可服務首頁敘事，也可作為後續正式遊戲的中長期 meta 目標。

## Verification Steps

### 靜態驗證

- 確認 `/` 仍載入現有 `GeminiApp`
- 確認 `/debug` 仍載入 `StrokeTest`
- 確認 `/home-v2` 載入新版首頁預覽

### 視覺與互動驗證

- 首屏進場動畫正常，不會阻塞互動
- 自動 demo 會循環播放並清楚展示：
  - 筆劃
  - 物件完成度
  - 材料收集
- 四大職業卡片能清楚辨識
- 徽章牆能正確顯示四個原有徽章圖
- 音效/音樂控制 UI 狀態正確切換

### 技術驗證

- `npm run build` 成功
- recently edited files 無重大診斷錯誤
- GSAP / ScrollTrigger cleanup 正常，切換頁面無殘留動畫報錯

## Execution Notes

- 實作時以**新增檔案為主，修改入口為輔**。
- 不重寫 `GeminiApp.jsx` 的現有 MENU 區塊。
- 若需要共用 `PROFESSION_LEVELS`，可考慮在實作時把資料抽到共享常數檔，但只有在不增加不必要風險的前提下進行。
