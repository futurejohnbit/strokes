[OPEN]

# 症狀
- Vite dev server 可啟動，但瀏覽器打開後畫面黑屏/空白。

# 復現步驟
- `npm run dev`
- 打開 `http://localhost:5176/`（或 Vite 顯示的實際端口）

# 假設（可證偽）
1. 入口腳本未載入或載入失敗（例如 `main.jsx` 404 / MIME 錯誤），導致 React 未掛載。
2. 執行期 JavaScript 例外（React render 前就 throw），導致頁面不渲染。
3. 路由/基底路徑錯誤（Vite base、資源路徑或 SPA fallback）造成所有資源請求失敗。
4. CSS/佈局導致內容存在但不可見（例如容器高度為 0、背景覆蓋、opacity=0）。
5. Service Worker / Cache（或舊 build）干擾，導致載入舊資源或錯誤版本。

# 待收集證據
- 瀏覽器 Console errors / Network 404 / JS 堆疊
- 首屏 DOM 是否掛載到 `#root`
- Vite 終端輸出是否有 runtime 報錯

