# [OPEN] service-unavailable

## 症狀

- 使用者點擊網頁後顯示「服務不可用」。

## 範圍

- 專案：`claude_ver/stroke test`
- 目前優先排查：
  - 本地預覽服務是否存活
  - `/home-v2` 是否可正常載入
  - 點擊後是否導向錯誤路徑或不存在的服務
  - 是否有前端運行時錯誤導致白屏/錯頁

## 初始假設

1. 本地 Vite 開發服務其實沒有持續運行，點擊時瀏覽器落到失效的 localhost 頁面。
2. 首頁按鈕導向 `/` 或其他路徑後，當前服務器/預覽入口沒有處理該路徑，因而回傳「服務不可用」。
3. 頁面本身有前端運行時錯誤，瀏覽器表面看起來像「服務不可用」，實際是 SPA 沒成功掛載。
4. 先前開啟的預覽 URL/埠號已失效或切換，使用者點到的是過期頁面。
5. 開發環境或預覽工具對本地頁面載入不完整，造成表面上的不可用。

## 證據紀錄

- `src/main.jsx` 入口分流正常：
  - `/debug` -> `StrokeTest`
  - `/home-v2` -> `HomePreviewV2`
  - `/` -> `GeminiApp`
- `HomePreviewV2.jsx` 內主要點擊行為僅導向站內 `/` 或頁內錨點，未發現外部壞網址。
- `CheckCommandStatus(d538fe93-264c-4477-8bf6-7bcc86be2f91)` 顯示原本 Vite dev server 已退出，`exit_code = -1073741510`。
- 重新導航到 `http://localhost:5175/home-v2` 時，瀏覽器 URL 變為 `chrome-error://chromewebdata/`，說明本地服務當時確實不可達。
- 排查過程中曾在同一終端上啟動 dev server，之後又在相同終端執行短命令；根據工具環境規則，這會殺掉原本正在跑的服務。

## 結論

- 目前最強證據指向：問題不是首頁跳轉邏輯，而是**本地預覽服務進程被終端復用時殺掉**，導致使用者點擊先前提供的 localhost 預覽連結後看到「服務不可用」。

## 修復動作

- 不修改首頁業務邏輯。
- 將預覽服務重新啟動在**獨立終端**，避免再被後續短命令覆蓋。
- 重新提供有效預覽路徑：`http://localhost:5175/home-v2`

## 修復前 / 修復後對比

### pre-fix

- `CheckCommandStatus(d538fe93-264c-4477-8bf6-7bcc86be2f91)`：
  - `exit_code = -1073741510`
- 瀏覽器重新打開 `http://localhost:5175/home-v2`：
  - URL 轉為 `chrome-error://chromewebdata/`
  - network 出現 `ERR_CONNECTION_REFUSED`

### post-fix

- `CheckCommandStatus(e2d58dc7-5563-4c42-8fb0-69558f7d7562)`：
  - Vite `ready`
  - `Local: http://localhost:5175/`
- 瀏覽器 network：
  - `GET http://localhost:5175/home-v2 type=Document`
  - `GET http://localhost:5175/@vite/client type=Script`
- 表示本地服務已恢復可連接，首頁預覽地址重新有效。

## 追加證據（黑屏根因）

- 使用者補充：點聊天中的 `localhost` 連結後為黑屏。
- 在頁面上下文中執行：
  - `fetch('/')` -> `404`，空內容
  - `fetch('/home-v2')` -> `404`，空內容
- 目前 dev server 的實際啟動日誌是：
  - `vite 127.0.0.1 5175`
- 這表示命令參數沒有以 `--host` / `--port` 的形式被正確傳入，而是被 Vite 當成了位置參數；結果是服務雖然啟動了，但**根目錄錯誤**，導致首頁路徑回傳空 404，表面即黑屏。

## 更新結論

- 「服務不可用」與「黑屏」是兩層問題：
  1. 服務曾被終端復用殺掉。
  2. 重新啟動後又因為 Vite 啟動命令參數錯誤，導致首頁實際回傳 404 空內容。

## 最小修復

- 停止錯誤啟動方式的 dev server。
- 改用正確命令：
  - `npx vite --host 127.0.0.1 --port 5175`

## post-fix 證據

- 啟動日誌：
  - `Local: http://127.0.0.1:5175/`
- 瀏覽器頁面快照已能讀到完整頁面元素：
  - `頁面標題 = Stroke Hero Game`
  - 可見聲音控制、返回首頁、四大世界卡、徽章牆等互動元素
- 頁面上下文中執行：
  - `fetch('/')` -> `200`
  - `fetch('/home-v2')` -> `200`
- 說明目前黑屏根因已被排除，首頁與預覽頁都能返回正常 HTML 文檔。
