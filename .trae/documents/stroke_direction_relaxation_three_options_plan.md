# 筆畫近似方向放行計畫（已鎖定：只鬆動捺與點）

## Summary
- 目標：採用原本三方案中的 **方案 B**，但只對 `NA` 與 `DIAN` 這一組做鬆動放行。
- 額外決策：
  - 取消 `HENGSHUGOU`
  - 取消 `TI`
  - 保持其他筆畫代碼不變，不重新編號。
- 成功標準：
  - `CAND:` 與 raw token 只允許 `NA` 與 `DIAN` 互通。
  - `SHU` 不再和 `HENGSHUGOU` 互通。
  - `TI`、`HENGSHUGOU` 不再作為前端可接收筆畫輸入。
  - 其餘筆畫代碼與既有流程維持不變。

## Current State Analysis
- `GeminiApp.jsx` 目前有三個相關層次：
  - `STROKE_CODE_TO_TOKEN`：UART 代碼到 token 的映射。
  - `STROKE_TOKEN_TO_DIRECTION`：token 到方向的映射。
  - `processStrokeInput()`：最終用 `inputDir === targetStroke.direction` 做嚴格比對。
- `CAND:` 現況是「候選 token 精準命中目標 token 才放行」，目前沒有近似族群補放。
- 現在仍保留以下前端支援：
  - `3 -> TI`
  - `8 -> HENGSHUGOU`
  - `ALLOWED_STROKES` 也仍包含 `TI`、`HENGSHUGOU`
- 這代表即使 MakeCode 已不再送 `提` 與 `橫豎鉤`，前端目前仍把它們視為可玩的筆畫種類。

## Assumptions & Decisions
- 使用者已明確決定：
  - 採用 **方案 B**
  - 只鬆動 `NA` 與 `DIAN`
  - 取消 `HENGSHUGOU` 與 `TI`
  - 其他筆畫代碼維持原樣
- 本次不修改 MakeCode，只調整前端容錯與支援範圍。
- `SHU` 維持嚴格，不和任何其他筆畫互通。
- 因目前關卡字表為 `木 / 林 / 柱 / 禾 / 秋 / 火 / 燈 / 炒 / 言 / 語`，執行時需額外驗證這批字在現有分類器與 override 下，不會因移除 `TI`、`HENGSHUGOU` 而變成不可玩。

## Proposed Changes

### 1. 收斂 UART 可接收筆畫集合

#### 檔案
- `c:\Expoprojects\microtesting\claude_ver\stroke test\src\GeminiApp.jsx`

#### 修改
- 調整 `STROKE_CODE_TO_TOKEN`
  - 移除或停用 `3: TI`
  - 移除或停用 `8: HENGSHUGOU`
- 調整 `STROKE_TOKEN_TO_DIRECTION`
  - 移除 `TI`
  - 移除 `HENGSHUGOU`
- 調整 `ALLOWED_STROKES`
  - 移除 `TI`
  - 移除 `HENGSHUGOU`
- 調整 `STROKE_NAMES`
  - 移除 `TI`
  - 移除 `HENGSHUGOU`

#### 原因
- 使用者已確認 MakeCode 不再送這兩種筆畫，前端不應繼續把它們當成可接收輸入。
- 保留其他代碼不變，可避免影響既有 `1 / 2 / 4 / 5 / 6 / 7 / 9 / 10` 協議。

### 2. 新增僅限 `NA / DIAN` 的近似放行規則

#### 檔案
- `c:\Expoprojects\microtesting\claude_ver\stroke test\src\GeminiApp.jsx`

#### 修改
- 新增小範圍族群常數，例如：
  - `RELAXED_TOKEN_FAMILIES = {`
  - `NA: ['NA', 'DIAN'],`
  - `DIAN: ['NA', 'DIAN']`
  - `}`
- 不為 `SHU` 建立 relaxed family。
- 不為 `SHUGOU` 建立 relaxed family。
- 不為 `PIE`、`HENGPIE`、`HENGZHE` 建立 relaxed family。

#### 原因
- 只落實使用者指定的單一互通組，不把整個方向系統全面放寬。

### 3. 讓 `CAND:` 支援「精準優先、近似其次」

#### 檔案
- `c:\Expoprojects\microtesting\claude_ver\stroke test\src\GeminiApp.jsx`

#### 修改
- 在 `parseCandidateStrokeCodes()` 保持回傳 `tokens`，必要時額外回傳 `families` 或在分支內即時計算。
- 在 `handleMicrobitData()` 的 `CAND:` 分支中，判定順序改為：
  - 先檢查 `candidateStroke.tokens.includes(targetToken)`，命中則維持現有精準放行。
  - 若未命中，再檢查候選 token 是否落在 `targetToken` 的 relaxed family。
  - 若命中 relaxed family，記錄 `近似放行/CAND` 並放行。
  - 若仍未命中，才維持失敗。

#### 原因
- 保留 `CAND:` 的精準優先，同時只讓 `捺/點` 在候選命中相近筆畫時可直接過關。

### 4. 讓 raw token / CreateAI 路徑支援同樣的兩族鬆動

#### 檔案
- `c:\Expoprojects\microtesting\claude_ver\stroke test\src\GeminiApp.jsx`

#### 修改
- 調整 `deliverStrokeDirection()` / `processStrokeInput()` 的資料介面，讓它不只拿到 `direction`，還能知道：
  - `inputToken`
  - `inputDirection`
  - `source`
  - `acceptReason`
- 在 `processStrokeInput()` 中將比對順序改為：
  - exact token / exact direction
  - relaxed family match（僅 `NA/DIAN`）
  - fail
- `TEST` 與 `PLAYING` 都可使用同一套邏輯，但 log 必須標示是 `精準命中` 或 `近似放行`。

#### 原因
- 若只改 `CAND:`，raw token 路徑仍會維持過硬，體感不一致。

### 5. 驗證移除 `TI` / `HENGSHUGOU` 後的關卡可玩性

#### 檔案
- `c:\Expoprojects\microtesting\claude_ver\stroke test\src\GeminiApp.jsx`
- `c:\Expoprojects\microtesting\claude_ver\stroke test\public\hanzi-data\*.json`

#### 修改
- 不直接改字庫內容，但在執行時需驗證目前十個關卡字：
  - `木 / 林 / 柱 / 禾 / 秋 / 火 / 燈 / 炒 / 言 / 語`
- 若其中某筆在分類後仍落到 `TI` 或 `HENGSHUGOU`，需再補字級 override，把它收斂回目前保留的筆畫集合。

#### 原因
- 單純從 UART 映射移除還不夠，還要確保關卡本身不要求玩家輸入已取消的筆畫。

## Verification Steps
- 映射驗證：
  - 確認前端不再接受 `3 -> TI`、`8 -> HENGSHUGOU`。
  - 確認其他代碼仍維持：
    - `1 -> HENG`
    - `2 -> SHU`
    - `4 -> NA`
    - `5 -> DIAN`
    - `6 -> HENGPIE`
    - `7 -> SHUGOU`
    - `9 -> PIE`
    - `10 -> HENGZHE`
- 鬆動規則驗證：
  - `NA` 目標時，`NA` / `DIAN` 可通過。
  - `DIAN` 目標時，`NA` / `DIAN` 可通過。
  - `PIE`、`HENGPIE`、`HENGZHE` 都維持精準判定。
  - `SHU` 只接受 `SHU`。
- `CAND:` 驗證：
  - `CAND:4`、`CAND:5` 對 `NA/DIAN` 目標可放行。
  - `CAND:9`、`CAND:6` 不可再因鬆動規則被放行。
  - `CAND:10` 不可再因鬆動規則被放行。
  - `CAND:2` 不可再因 `8` 類舊邏輯被放寬。
- 關卡回歸驗證：
  - 實際進入目前四關所有字，確認沒有任何一步還要求 `TI` 或 `HENGSHUGOU`。
- 日誌驗證：
  - debug log 能分辨：
    - `精準命中`
    - `近似放行/CAND`
    - `近似放行/RAW`
