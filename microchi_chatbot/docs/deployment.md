# 部署指南

## 前置
- 安裝 Python 3.10+
- 建立並啟用虛擬環境
- 安裝依賴：`pip install -r requirements.txt`
- 準備 MongoDB（選擇性）：設定環境變數 `MONGO_URI`（例：`mongodb+srv://...`）

## 開發啟動
- 進入目標目錄：`cd C:\Expoprojects\microtesting\chi_chatbot`
- 啟動：`python -m backend.app`
- 瀏覽 `http://localhost:5000/`

## 生產部署
- 使用 `gunicorn`：`gunicorn -w 4 -b 0.0.0.0:5000 backend.app:create_app()`（在 `chi_chatbot` 目錄下）
- 以 `Nginx` 反向代理，啟用壓縮與快取熱門詞
- 設定環境變數：`PORT`、`MONGO_URI`、`DATA_DIR`（例：`C:\Expoprojects\microtesting\chi_chatbot\runtime`）、允許 CORS 的來源

## 壓力測試
- 啟動伺服器後，於 `chi_chatbot` 目錄執行：`locust -f locustfile.py`
- 在 UI 設定使用者數（≥100）與產生速率，觀察平均響應時間是否 ≤2 秒