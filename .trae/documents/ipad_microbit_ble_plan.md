# iPad 直連 micro:bit 開發計畫

## Summary

- 目標：讓 `claude_ver/stroke test` 這個 Vite/React 網頁在 iPad Safari 上可開啟、可操作，並可直接連接 micro:bit BLE UART 進行遊玩。
- 決策：採用 iOS Safari BLE 相容層方案，允許使用者先安裝並啟用 Safari 擴充 / companion app；保留既有桌機 Chrome/Edge 的原生 `navigator.bluetooth` 流程。
- 非目標：本輪不新增橋接後端、不改 micro:bit 通訊協定、不改成原生 iOS App。

## Current State Analysis

- 專案入口在 [main.jsx](file:///c:/Expoprojects/microtesting/claude_ver/stroke%20test/src/main.jsx)，依網址切到正式遊戲 `GeminiApp` 或除錯頁 `StrokeTest`。
- 正式遊戲的 BLE 連線完全寫在 [GeminiApp.jsx](file:///c:/Expoprojects/microtesting/claude_ver/stroke%20test/src/GeminiApp.jsx)，核心呼叫是 `navigator.bluetooth.requestDevice(...)`；目前沒有任何 Safari/iPad 相容層、能力偵測或安裝指引。
- 除錯頁 [StrokeTest.jsx](file:///c:/Expoprojects/microtesting/claude_ver/stroke%20test/src/StrokeTest.jsx) 已有三種資料路徑雛形：
  - Web Bluetooth
  - Web Serial
  - 外接 WebSocket URL
- 但 repo 內沒有對應 WebSocket bridge server，因此 iPad 目前也不能靠既有程式自動走 bridge。
- `index.html` 只有基本 viewport，`src/index.css` 也沒有針對 iPad safe-area、觸控提示或安裝說明做任何處理。
- 目前部署設定 [vercel.json](file:///c:/Expoprojects/microtesting/claude_ver/stroke%20test/vercel.json) 已符合 HTTPS 網站型態，適合 Web Bluetooth / polyfill 使用。

## Assumptions & Decisions

- 目標瀏覽器是 iPad Safari，不要求 Firefox iOS 或其他 iOS 瀏覽器各自有獨立行為，因為它們同樣受 WebKit 限制。
- 使用者可接受先安裝並啟用 Safari BLE 擴充 / companion app，因此可採用 `@ios-web-bluetooth/core` 類型的相容方案。
- Battery service 在 iPad 路線視為「可選增強」：若相容層不支援或行為不穩，連線成功與筆劃遊玩優先，電池資訊需 graceful degrade。
- 保留原本桌機 Web Bluetooth 行為，不重寫為完全不同的 BLE service layer；優先採用 polyfill/no-op 方式，讓桌機支援不受影響。
- 正式遊戲與除錯頁都要同步相容，避免 `/` 與 `/debug` 行為分裂。

## Proposed Changes

### 1. BLE 相容層接入

- 檔案：`claude_ver/stroke test/package.json`
- 變更：
  - 新增 iOS Safari BLE 相容套件，首選 `@ios-web-bluetooth/core`。
  - 如需要安裝偵測/導引 UI，再加 `@ios-web-bluetooth/detect`。
- 原因：
  - 現況完全依賴原生 Web Bluetooth，iPad Safari 無法直接使用。
- 做法：
  - 使用 auto polyfill 形式，避免改動大量既有連線程式。
  - 維持桌機 Chromium 瀏覽器原生支援，polyfill 在原生支援環境應保持 no-op。

### 2. 入口初始化與平台偵測

- 檔案：`claude_ver/stroke test/src/main.jsx`
- 變更：
  - 在 App 啟動前載入 BLE auto polyfill。
  - 視需要加一層簡單 runtime helper 初始化，用於判斷：
    - 是否為 iPad/iOS WebKit
    - 是否存在 `navigator.bluetooth`
    - 是否需要顯示 Safari 擴充安裝提示
- 原因：
  - `requestDevice()` 必須在相容層完成注入後才可被 UI 使用。
- 做法：
  - 保持現有 `Root()` 切頁架構不變。
  - 若套件需要 provider，則在此處包住整個 App；若只需 import auto，則不加 provider。

### 3. 正式遊戲的 iPad BLE UX 與錯誤處理

- 檔案：`claude_ver/stroke test/src/GeminiApp.jsx`
- 變更：
  - 抽出 BLE 能力檢測與連線前檢查，不再直接假定 `navigator.bluetooth.requestDevice` 一定可用。
  - 新增 iPad 專屬狀態：
    - `isBleSupported`
    - `needsSafariExtension`
    - `platformHint`
    - `connectionStep`
  - 在首頁「連結Micro:bit」區塊加入安裝/啟用 Safari 擴充提示與步驟文案。
  - 保證 `connectMicrobit()` 只由明確按鈕觸發，避免違反 iOS user gesture 限制。
  - 若 battery service 無法取得，不中斷主連線，只記錄提示。
  - 對 `requestDevice` / `gatt.connect` / `startNotifications` 錯誤訊息做 iPad 友善翻譯。
- 原因：
  - 現況錯誤訊息偏桌機視角，且沒有 Safari 擴充未安裝的導引。
- 做法：
  - 保留既有 UART token parsing、`STROKE_MAP`、遊戲邏輯與畫面流程。
  - 把 BLE 相容問題集中在連線入口，避免觸碰核心判定流程。
  - 若 polyfill 可用但未完成 Safari 擴充設定，顯示明確 CTA 與操作步驟。

### 4. `/debug` 頁同步支援 iPad BLE

- 檔案：`claude_ver/stroke test/src/StrokeTest.jsx`
- 變更：
  - 共用與正式遊戲相同的 BLE 能力檢測與 iPad 提示策略。
  - 在 `source === 'ble'` 時對 iPad 顯示：
    - Safari 擴充是否已準備好
    - 如果未就緒，如何安裝/啟用
  - 將 `serial` 選項在 iPad/Safari 上顯示為不可用或附說明，避免誤導。
- 原因：
  - 除錯頁是驗證 iPad BLE 是否真正可收資料的最低風險入口。
- 做法：
  - 優先讓 `StrokeTest` 成為連線驗證頁，正式遊戲沿用同一套相容層判斷。
  - 不新增 repo 內的 WebSocket 伺服器；僅保留既有手動輸入 URL 能力。

### 5. 行動裝置體驗與安裝提示微調

- 檔案：`claude_ver/stroke test/index.html`
- 變更：
  - 優化 mobile meta，例如 viewport 與 theme-color。
  - 視需要補 `apple-mobile-web-app-capable` 相關 meta，讓從主畫面開啟時更像 App。
- 檔案：`claude_ver/stroke test/src/index.css`
- 變更：
  - 加入 safe-area padding、較適合平板的字級/按鈕 touch target、說明卡樣式。
- 原因：
  - 使用者說的是「讓 iPad 上也能運行」，不只 BLE，還包括操作與可讀性。
- 做法：
  - 只做最小必要的 iPad 友善調整，不大改整體視覺。

### 6. 文件補充

- 檔案：`claude_ver/stroke test/README.md`
- 視需要新增或更新：
  - iPad Safari 使用步驟
  - 需要安裝的 Safari 擴充 / companion app
  - 連不上時的排查清單
- 原因：
  - iPad 直連方案帶有額外前置條件，沒有文件會造成現場使用失敗。

## Implementation Notes

- 連線層策略：
  - 先採「最小侵入」方式接入 polyfill，讓原本 `navigator.bluetooth` 呼叫盡量不變。
  - 若 `GeminiApp.jsx` 與 `StrokeTest.jsx` 內重複的 BLE 連線邏輯過多，可在實作時抽成 `src/utils/bleSupport.js` 或 `src/utils/bluetoothClient.js`；但僅在確實能減少重複且不增加風險時才抽。
- 錯誤分類至少要覆蓋：
  - 不支援 BLE API
  - Safari 擴充未安裝/未啟用
  - 使用者取消配對
  - 找不到 micro:bit UART service
  - 特徵值不支援 notify
  - 只拿不到 battery service
- 回退策略：
  - iPad 上若 BLE 未就緒，正式遊戲不應直接壞掉；應停留在可閱讀的引導狀態。
  - `/debug` 頁要能清楚看出「是資料沒進來」還是「BLE 根本沒準備好」。

## Verification Steps

- 程式層驗證
  - 安裝依賴後可正常 `npm run build`。
  - recently edited 檔案沒有新的 diagnostics。
- 桌機回歸驗證
  - 在桌機 Chrome/Edge 上，首頁仍可正常連 micro:bit。
  - `/debug` 頁 BLE 模式仍可收到 UART token / x,y,z。
- iPad 驗證
  - 在 iPad Safari 未安裝擴充時，首頁與 `/debug` 會顯示正確安裝提示，不會直接崩潰。
  - 安裝並啟用擴充後，點擊「連結Micro:bit」可進入選裝置流程。
  - 連上後能收到至少一筆有效 token，並驅動 `StrokeTest` 或正式遊戲進度。
  - 若 battery service 不可用，主功能仍能玩。
- 部署驗證
  - Vercel 預覽環境可正常開啟，且因 HTTPS 符合 BLE 前提。

## Risks

- 第三方 iOS Safari BLE 相容套件本身可能有裝置/版本相容差異，尤其對 Nordic UART 這類自訂 UUID 的掃描與通知流程。
- 若 micro:bit 廣播資訊不足，polyfill 的 `requestDevice` filter 可能需從 `namePrefix` / `optionalServices` 微調。
- iPad 上的連線手勢限制更嚴格，任何非按鈕觸發式重連都可能失敗。

## Execution Order

1. 接入 BLE polyfill 依賴並在 `main.jsx` 初始化。
2. 先改 `/debug` 頁，確認 iPad 上可看到能力狀態與 BLE 連線提示。
3. 再改 `GeminiApp.jsx` 的正式遊戲連線入口與 iPad 導引 UI。
4. 補 `index.html` / `index.css` 的 iPad 友善調整。
5. 更新 README 與驗證步驟。
