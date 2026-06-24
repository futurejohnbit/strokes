[OPEN]

# 症狀
- 網頁進入後畫面停住/卡住，疑似與字體載入失敗有關（之前也出現「字體不能加載」）。

# 復現步驟
- 打開部署站點或本機站點首頁
- 觀察畫面停留在載入/準備畫面，無法進入正常互動

# 假設（可證偽）
1. 字體資源請求 404/403/CORS，導致等待字體就緒的流程永遠不結束（例如 `document.fonts.ready` / `FontFace.load()` / 自訂 loader）。
2. Service Worker / PWA 快取命中舊版資源或壞快取，導致字體或入口腳本載入錯誤而卡住。
3. CSS 引用的字體路徑在 Vercel base path 下不正確（相對路徑、`/assets/...`、`/public/...`），導致 only-in-prod 失敗。
4. JS 執行期錯誤（與字體無關），但 UI 看起來像“卡住”；需要 Console stack 證據。
5. 字體檔案過大或被阻擋（MIME type / content-type 不對），瀏覽器重試或阻塞渲染。

# 待收集證據
- Network：字體/入口資源是否 failed（狀態碼、MIME）
- Console：是否有字體相關錯誤或 JS exception
- 是否啟用了 SW（Application 面板）以及是否有舊快取

