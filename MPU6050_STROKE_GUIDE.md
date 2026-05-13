# MPU6050 筆畫位移辨識（micro:bit MicroPython）

## micro:bit 端
- 檔案：[mpu6050_stroke.py](file:///c:/Expoprojects/microtesting/claude_ver/stroke%20test/microbit/mpu6050_stroke.py)
- 精簡版（較不容易放不下）：[mpu6050_stroke_lite.py](file:///c:/Expoprojects/microtesting/claude_ver/stroke%20test/microbit/mpu6050_stroke_lite.py)
- MakeCode BLE UART（網頁用 Web Bluetooth 連，輸出 CSV x,y）：[mpu6050_ble_csv_makecode.py](file:///c:/Expoprojects/microtesting/claude_ver/stroke%20test/microbit/mpu6050_ble_csv_makecode.py)
- 預設軸向重映射：已依「y 軸朝左、x 軸朝下」建立矩陣（可用 `MAP` 覆寫）
- 開機自動校準：上電後保持靜止約 5 秒會自動完成零點/偏置與初始傾角

### Serial 指令（USB/UART）
- `HELP`
- `CAL`：重新靜止校準（約 5 秒）
- `ZERO`：位置/速度歸零（不重算偏置）
- `STREAM 0|1`：開關輸出
- `MODE JSON|CSV`：輸出格式（JSON line 或 `x,y`）
- `DIST <mm>`：位移門檻（預設 2）
- `TIME <ms>`：時間門檻（預設 20）
- `DZ <deg>`：傾斜死區（預設 3）
- `MAP a,b,c,d,e,f,g,h,i`：設定 3×3 映射矩陣（raw→書寫座標）
- `FIFO 0|1`：開關 FIFO 批次讀取
- `AUTO 0|1`：開關自動取樣率調整
- `DIV <n>`：手動指定 `SMPLRT_DIV`（會關閉 AUTO）
- `STATUS`：回傳一行 JSON 狀態

## Web 測試工具（視覺化）
- 檔案：[StrokeTest.jsx](file:///c:/Expoprojects/microtesting/claude_ver/stroke%20test/src/StrokeTest.jsx)
- 支援資料來源：
  - 藍牙 UART（Web Bluetooth）
  - USB 序列埠（WebSerial，Chrome/Edge）
- 支援輸入格式：
  - `X,Y` 或 `X,Y,Z`
  - JSON line：`{"x":...,"y":...,"t":...}`（也支援 `{"pos":{"x":...,"y":...}}`）
  - Gate 控制行：`G,1`（開始）/ `G,0`（結束）
- 可選 WebSocket 轉發：填入 `ws://...` 後連線，會把每筆解析到的資料 JSON 送出

## 離線單元測試與報告（PC 端）
- 演算法模組：[imu_pipeline.py](file:///c:/Expoprojects/microtesting/claude_ver/stroke%20test/tools/imu_pipeline.py)
- 單元測試：`python -m unittest discover -s tools/tests -p "test_*.py"`
- 模擬資料產生：`python tools/generate_sim_datasets.py`
- 報告輸出：`python tools/perf_report.py`
  - 產出：`tools/out/report.md`、`tools/out/report.html`
