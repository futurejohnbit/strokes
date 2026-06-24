# 系統技術設計

## 架構
- 後端：`Python` + `Flask`，提供 `/api/query`、`/api/history`、`/api/favorites`
- 前端：`Vue 3 (CDN)` 單頁，與後端以 `JSON` 溝通
- 爬蟲：`requests` + `BeautifulSoup` 併發抓取三個來源
- 轉換：`opencc` 進行繁簡轉換；`pypinyin` 產生拼音，自製映射轉注音
- 資料庫：`MongoDB` 儲存歷史與收藏（無 `MONGO_URI` 時以記憶體後備）
- 測試：`pytest` 單元測試；壓力測試 `locust`

## 來源與過濾
- 主要來源以《重編國語辭典修訂本》為準，該站點定期修訂並公告最新消息（如 2025-11-17 系統維護預告）
- 香港小學學習字詞表作為輔助對照
- 教育部標準字體筆順提供筆順參考圖片
- 合併規則：以 MOE 釋義為主，EDB 內容一致時提高信心分；`confidence>=0.6` 視為核可

## 端點
- `POST /api/query`：`{ q, mode }`；`mode in {definition, pronunciation}`
- `GET /api/history`：回傳本會話查詢歷史
- `GET|POST|DELETE /api/favorites`：收藏管理

## 效能與擴展
- 併發抓取縮短端到端延遲；目標平均 2 秒內
- 可前置快取熱門詞（MongoDB + TTL 索引）
- 水平擴展：Flask 部署於 `gunicorn`/`uwsgi`，前置 `Nginx`；資料庫使用雲端 Mongo 叢集

## 安全
- 不紀錄敏感資訊；會話以隨機 `session_id`
- 同源與 CORS 限制可在部署時調整允許來源