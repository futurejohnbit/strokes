# MPU6050 輔助撇判斷計畫

## Summary

本次目標是在不改動現有 `CreateAI` 訓練邏輯、不重做主頁流程、不改既有關卡/畫面結構的前提下，加入 `MPU6050` 作為「撇」的輔助判斷來源。

整體策略採用：

- `CreateAI` 仍然是主判斷來源。
- 前端只在 `GeminiApp.jsx` 的訊號解析層增加一個中介融合邏輯，不改遊戲主流程。
- `MPU6050` 首階段只補強 `left-down`（撇）方向，不一次擴到所有筆畫。
- 對既有可行結構採「低侵入擴充」：
  - 保留既有單字節 BLE 筆畫碼。
  - 保留既有前端 `direction` 比對流程。
  - 只新增一條可選的 `IMU assist` 側訊號，讓前端在特定情境下修正或補強 `撇`。

## Current State Analysis

### 已確認的現有結構

- `claude_ver/stroke test/src/main.jsx`
  - 目前 `/` 走 `GeminiApp.jsx`。
  - `/debug` 或 `?debug=1` 走 `StrokeTest.jsx`。
  - 代表正式遊戲頁與 6050 測試頁已經天然分流，適合保留現狀。

- `claude_ver/stroke test/src/GeminiApp.jsx`
  - 目前正式遊戲的 BLE 入口在這裡。
  - `handleMicrobitData()` 只把 UART 訊息當成：
    - 電池字串
    - 單字節/字串筆畫 token
  - 之後直接映射成 `direction`，交給 `processStrokeInput()`。
  - 目前沒有任何 6050 相關的 JSON、角速度、姿態、輔助分數處理。
  - 目前 `left-down` 的判定完全依賴收到的 token 被映射成 `left-down`。

- `claude_ver/stroke test/microbit-updated-code.py`
  - 這份是目前最接近正式使用的 micro:bit / CreateAI BLE 傳送範例。
  - 現況是各個 `ml.on_start(...)` 事件直接送單字節筆畫碼。
  - 已經很適合作為「不動 CreateAI 主體，只在事件旁邊加 6050 輔助訊號」的修改入口。

- `claude_ver/stroke test/microbit/mpu6050_ble_csv_makecode.py`
  - 已經有 6050 取樣、Gate、BLE UART 輸出 `x,y` 的經驗實作。
  - 適合作為本次把 6050 資料重新搬回正式 firmware 時的參考來源。

- `claude_ver/stroke test/src/StrokeTest.jsx`
  - 已有獨立的 6050 軌跡測試頁，可接收：
    - `X,Y`
    - `X,Y,Z`
    - JSON line
    - `G,1` / `G,0`
  - 已有分段與方向分類概念。
  - 很適合當作「校正撇判斷門檻」的研究頁，但不必把它直接搬進主遊戲頁。

- `claude_ver/stroke test/MPU6050_STROKE_GUIDE.md`
  - 已有 6050 相關說明。
  - 可作為更新本次協定與校正流程的文件入口。

### 已確認的限制

- 使用者明確要求：
  - 不動 `CreateAI` 核心思路。
  - 不重做網頁與既有可行結構。
  - 可改動 6050 相關內容。
- 使用者已選定：
  - 融合位置在前端中介層。
  - 輔助方式是「特定筆畫補強」。
  - 第一優先只補強 `撇`。

### 問題落點

- 目前正式遊戲中，`撇` 只要 `CreateAI` 沒有給出映射到 `left-down` 的 token，就會直接判錯。
- 但專案中其實已經有另一條 6050 研究線，可提供動作方向訊號，只是尚未接回正式遊戲頁。
- 如果直接大改成「前端完全改吃 6050」，會破壞原本可行結構，不符合本次要求。

## Assumptions & Decisions

### 核心決策

- 主頁 UI、關卡流程、關卡資料、`processStrokeInput()` 的遊戲規則保持不變。
- `CreateAI` 仍為主判斷來源，不重新訓練、不重做 token 協定。
- 6050 第一階段只用來補強 `撇`，不擴到 `捺 / 橫 / 豎`。
- 融合只發生在正式頁的 BLE 訊號解析層，不新增使用者操作步驟。
- `StrokeTest.jsx` 只當研究/校正工具，不作為正式頁主入口。

### 本次採用的融合原則

- 對非 `left-down` 目標筆畫：
  - 完全保留原有行為，不讓 6050 介入。

- 對目標為 `left-down` 的筆畫：
  - 如果 `CreateAI` 已經給出 `left-down`，直接沿用現有成功流程，不做否決。
  - 如果 `CreateAI` 沒給出 `left-down`，但 6050 在同一事件窗口內給出高信心 `left-down`，前端把本次輸入升級為 `left-down` 後再送進既有流程。
  - 如果 6050 沒有高信心訊號，維持原本 `CreateAI` 的結果。

### 為什麼採「只補強、不否決」

- 這樣最不容易破壞原本可用的體驗。
- 這樣不會因為 6050 雜訊而把原本正確的 `CreateAI` 結果擋掉。
- 這樣符合「不影響原有可行結構」的要求。

## Proposed Changes

### 1. 在 micro:bit 端增加 6050 的事件對齊輔助訊號

檔案：

- `claude_ver/stroke test/microbit-updated-code.py`

要做什麼：

- 保留現有 `ml.on_start(...)` 事件與單字節 BLE 筆畫碼輸出。
- 在不改變原 token 的情況下，額外加入 6050 短視窗採樣與輔助訊號輸出。
- 6050 不做全筆畫最終分類，只做「這次動作是否像撇」的側訊號。

為什麼：

- `microbit-updated-code.py` 已經是現有 CreateAI 發送筆畫碼的最直接入口。
- 把 6050 側訊號綁在同一個 ML 事件附近，能避免前端大改資料流。
- 這種做法能讓舊前端仍然繼續吃原有 token，不至於因為新資料流而失效。

如何做：

- 在 firmware 中初始化 `MPU6050`。
- 持續讀取 6050 的短時間視窗資料，建立一個最近 `N` 筆樣本的 ring buffer。
- 每當某個 `ml.on_start(...)` 事件觸發時：
  - 先照舊送出原本單字節筆畫碼。
  - 再從最近 `250ms ~ 400ms` 的 6050 視窗中計算簡單撇特徵，例如：
    - `sumGX`
    - `sumGY`
    - `avgGX`
    - `avgGY`
    - `sampleCount`
  - 依據先前研究出的方向規則，產出：
    - `imuDir`: `left-down` / `right-down` / `unknown`
    - `pieScore`: `0~1`
  - 再額外送出一條輔助訊息。

建議協定：

```json
{"kind":"imuAssist","forCode":"6","imuDir":"left-down","pieScore":0.84,"sumGX":-120,"sumGY":82,"sampleCount":14}
```

協定要求：

- 原本單字節筆畫碼照舊保留，例如 `"6"`。
- 新增的 6050 輔助訊息一定要帶 `kind:"imuAssist"`，避免與現有 token 混淆。
- 若 6050 無法得出有效結果，也可送：

```json
{"kind":"imuAssist","forCode":"6","imuDir":"unknown","pieScore":0.22}
```

### 2. 從既有 6050 研究程式萃取「撇輔助」邏輯，而不是把整套 debug 頁搬進主頁

檔案：

- `claude_ver/stroke test/microbit/mpu6050_ble_csv_makecode.py`
- `claude_ver/stroke test/src/StrokeTest.jsx`

要做什麼：

- 只把其中可重用的 6050 取樣與方向 heuristics 當參考來源。
- 不把正式頁改成完整 6050 畫軌模式。
- 只抽出「撇 vs 非撇」所需的最小判斷特徵。

為什麼：

- 正式頁目前已經可以正常以 `CreateAI` 運作。
- 若把完整 6050 軌跡與切段流程搬進正式頁，風險與改動面都太大。
- 目前需求不是重做辨識架構，而是補強 `撇`。

如何做：

- 以 `StrokeTest.jsx` 的方向判斷概念和你之前研究的經驗為基礎，整理出單純的 `撇` 輔助規則：
  - `sumGX` 顯著偏負
  - `sumGY` 顯著偏正
  - 或轉成簡單 score
- 先不要在正式頁處理完整 `x,y` 軌跡畫布。
- `StrokeTest.jsx` 只在必要時加上「協助校門檻」的觀察訊息，作為研究工具。

### 3. 在正式遊戲頁加入前端中介融合層，但不動頁面結構

檔案：

- `claude_ver/stroke test/src/GeminiApp.jsx`
- 新增 `claude_ver/stroke test/src/utils/imuPieAssist.js`

要做什麼：

- 擴充 `GeminiApp.jsx` 的 `handleMicrobitData()`，讓它除了吃既有筆畫 token，也能吃 `imuAssist` JSON。
- 新增一個小型 pure helper 模組，把 `撇輔助` 的資料結構與決策集中管理。
- 不改畫面布局，只利用既有 debug log 顯示 6050 輔助狀態。

為什麼：

- 使用者已指定融合位置在前端中介層。
- `GeminiApp.jsx` 已經是正式遊戲的 BLE 單一入口。
- 把 6050 輔助邏輯拆成 `src/utils/imuPieAssist.js`，能降低 `GeminiApp.jsx` 繼續膨脹的風險。

如何做：

- 在 `GeminiApp.jsx` 新增：
  - `latestImuAssistRef`
  - `lastStrokeCodeRef`
  - `assistWindowMs`
- 在 `handleMicrobitData()` 中：
  - 若 token 是單字節/既有筆畫碼，照原本流程解析。
  - 若 token 是 JSON 且 `kind === "imuAssist"`，則存到 `latestImuAssistRef`。
- 在方向映射之後、呼叫 `processStrokeInput()` 之前，加一道融合判斷：

建議決策順序：

1. 取出當前目標筆畫方向。
2. 若目標不是 `left-down`：
   - 完全走原本流程。
3. 若目標是 `left-down`：
   - 若原始 `CreateAI` token 已映射成 `left-down`：
     - 直接通過，不用 6050 否決。
   - 若原始 `CreateAI` token 不是 `left-down`：
     - 若最近 `assistWindowMs` 內有新鮮的 `imuAssist`，且：
       - `imuDir === "left-down"`
       - `pieScore >= PIE_CONFIRM_THRESHOLD`
     - 則把本次輸入方向升級成 `left-down`，再送進原有 `processStrokeInput()`。
   - 其餘情況：
     - 維持原來的 `CreateAI` 判斷。

建議 helper 模組介面：

```js
export function parseImuAssistToken(raw)
export function isFreshAssist(assist, now, windowMs)
export function shouldUpgradeToPie({ targetDirection, createAiDirection, assist, now, threshold })
```

### 4. 明確限制正式頁只做「撇補強」，避免功能蔓延

檔案：

- `claude_ver/stroke test/src/GeminiApp.jsx`
- `claude_ver/stroke test/src/utils/imuPieAssist.js`

要做什麼：

- 在邏輯上明確限定：
  - 第一版只處理 `targetDirection === "left-down"`。
  - 不補強 `right-down`、`down`、`right`。
  - 不處理 `HENGZHE / SHUGOU / HENGSHUGOU` 等複合筆畫。

為什麼：

- 這樣才能真正做到低風險、低侵入。
- 你目前最在意的是 `撇` 的辨認準確度。
- 若一開始就擴成全面融合，會大幅提高誤判來源與回歸風險。

如何做：

- helper 內只暴露 `PIE` 相關決策函式。
- `GeminiApp.jsx` 內只在 `left-down` 目標時引用它。
- 其餘筆畫保持舊行為，避免影響既有成功案例。

### 5. 用 debug 頁完成門檻校正，但不把 debug 頁混進正式流程

檔案：

- `claude_ver/stroke test/src/StrokeTest.jsx`
- `claude_ver/stroke test/MPU6050_STROKE_GUIDE.md`

要做什麼：

- 保留 `/debug` 作為 6050 研究頁。
- 補上一個簡單的校正流程，用來決定 `PIE_CONFIRM_THRESHOLD`、`sumGX/sumGY` 的參考範圍。

為什麼：

- 同一顆 6050 的安裝方向、握法、靈敏度會影響閾值。
- 若不先校門檻，正式頁即使接好了輔助邏輯，也可能補錯。

如何做：

- 使用 `/debug` 收集：
  - 10 次撇
  - 10 次非撇（至少捺）
- 記錄其：
  - `sumGX`
  - `sumGY`
  - `pieScore`
- 根據結果決定正式頁使用的常數：
  - `PIE_CONFIRM_THRESHOLD`
  - `PIE_MIN_SAMPLES`
  - `PIE_NEG_GX_THRESHOLD`
  - `PIE_POS_GY_THRESHOLD`

### 6. 更新文件，明確定義正式協定與作用邊界

檔案：

- `claude_ver/stroke test/MPU6050_STROKE_GUIDE.md`
- 如有需要，再補 `claude_ver/stroke test/README.md`

要做什麼：

- 補上本次正式頁使用的 BLE side-channel 協定。
- 註明：
  - `CreateAI` 仍是主流程
  - 6050 目前只補強 `撇`
  - 正式頁不會顯示完整 6050 軌跡
  - `/debug` 才是研究與校正頁

為什麼：

- 這次最重要的是把「不影響原有結構」說清楚。
- 文件若不先寫清楚，之後很容易被誤改成「6050 接管整個辨識」。

## Implementation Sequence

1. 先整理 `microbit-updated-code.py` 的現有 CreateAI BLE 發碼流程，確定所有既有 token 不變。
2. 參考 `microbit/mpu6050_ble_csv_makecode.py`，把 6050 最小採樣與短視窗特徵計算嵌入 `microbit-updated-code.py`。
3. 定義 `imuAssist` JSON side-channel 格式，確保和既有單字節 token 可共存。
4. 新增 `src/utils/imuPieAssist.js`，集中放撇補強規則。
5. 修改 `src/GeminiApp.jsx` 的 BLE parser，加入：
   - `imuAssist` 接收
   - 只在 `left-down` 目標筆畫時使用的 upgrade 規則
6. 視需要微調 `src/StrokeTest.jsx`，讓它更方便做撇門檻校正。
7. 更新 `MPU6050_STROKE_GUIDE.md`。

## Verification Steps

### 靜態驗證

- 在 `claude_ver/stroke test` 執行 `npm run build`，確認前端修改未破壞 Vite build。
- 檢查 `GeminiApp.jsx` 中：
  - 非 `left-down` 目標筆畫仍走舊流程。
  - `processStrokeInput()` 本體不被重寫，只在外層加判斷。

### 協定驗證

- 燒錄更新後的 micro:bit 程式。
- 以 BLE 連線正式頁，確認每次 ML 觸發時：
  - 仍收到原本筆畫碼
  - 額外收到一條 `imuAssist` JSON
- 舊 token 若單獨存在，前端仍能正常工作。

### 撇補強驗證

- 在正式頁選到需要 `left-down` 的筆畫時測試三種情況：
  - `CreateAI` 本來就判對 `left-down`
  - `CreateAI` 沒判成 `left-down`，但 6050 強烈支持 `left-down`
  - `CreateAI` 沒判成 `left-down`，6050 也不支持
- 成功標準：
  - 第一種維持原本可用體驗，不被干擾
  - 第二種能被補成成功
  - 第三種維持原判定，不誤升級

### Debug 校正驗證

- 用 `/debug` 收集至少：
  - 10 次撇
  - 10 次捺
- 確認 `pieScore` 或 `sumGX/sumGY` 門檻能把兩者區分開。
- 門檻定下後，再回正式頁實測。

## Out Of Scope

- 不重訓 `CreateAI`。
- 不重做 `GeminiApp.jsx` 的 UI 與關卡結構。
- 不把正式頁改造成完整 6050 軌跡畫布。
- 不在第一版處理所有筆畫融合。
- 不讓 6050 否決已經正確的 `CreateAI` 撇結果。
