# 自動方向校正與四基礎筆畫辨識計畫

## Summary

目標是在現有 `claude_ver/stroke test` 專案上，加入「以每筆起手式為基準」的自動方向校正，讓使用者即使手柄沒有完全按照預設姿勢握持，只要偏差主要是左右傾/前後傾（約 30 度內），系統仍可在前端/PC 端穩定辨識四種基礎筆畫：`橫 / 豎 / 撇 / 捺`。

首版明確不追求「任意扭轉手柄後仍能知道世界座標中的絕對上下左右」，因為目前硬件是 `MPU6050`，可穩定提供重力相關的 `roll/pitch`，但無法可靠解決 `yaw`（平面朝向）問題。首版只做「傾斜校正」，不做完整朝向估測。

## Current State Analysis

### 已確認的現有實作

- `claude_ver/stroke test/microbit/mpu6050_stroke.py`
  - 已有 `MPU6050` 讀值、重力補償、`roll/pitch` 估測、速度/位置積分、`moving` 狀態判定。
  - 已支援輸出 JSON，內容包含 `x/y/vx/vy/ax/ay/roll/pitch/moving`。
  - 已有 `button_a.was_pressed()` 觸發 `reset_state()`，`button_b.was_pressed()` 切換串流。

- `claude_ver/stroke test/microbit/mpu6050_stroke_lite.py`
  - 是較精簡的同類版本，也有 `roll/pitch` 與 `x/y` 輸出，但功能較少。

- `claude_ver/stroke test/tools/imu_pipeline.py`
  - 已有 PC 端純 Python 版 `StrokePipeline`，邏輯與 micro:bit 端接近。
  - 已有 `dtw_distance()`、`resample_path()`、`normalized_dtw_percent()`，可作為之後更穩定筆畫模板比對的基礎。

- `claude_ver/stroke test/tools/tests/test_imu_pipeline.py`
  - 目前只覆蓋 deadzone、resample、DTW 與基本 downsample 行為，尚未覆蓋「方向正規化」或「姿態偏差容忍」。

- `claude_ver/stroke test/src/StrokeTest.jsx`
  - 已可接收 BLE / WebSerial 資料，支援 JSON line 與 `G,1` / `G,0` Gate。
  - 現在的分類邏輯是用 `x,y` 軌跡切段後，以角度區間判斷 `HENG / SHU / PIE / NA / ...`。
  - 雖然可讀入 JSON，但目前只消費 `x/y/z`，未把 `roll/pitch/moving` 納入前端辨識流程。
  - 已經有 Gate 機制，適合接上「按鍵控制每筆開始/結束」。

- `claude_ver/stroke test/MPU6050_STROKE_GUIDE.md`
  - 已記錄目前序列指令與資料流設計，可同步更新使用方式。

### 問題與落差

- 目前前端分類直接使用收到的 `x,y` 軌跡做角度判定，沒有把「每次起筆前的握持姿勢」作為局部基準。
- 目前沒有明確的「每筆開始時重新抓姿態基準」流程。
- 目前沒有 micro:bit 端輸出 Gate 的實作，因此前端雖支援 Gate，實際仍主要靠 idle timeout。
- 目前測試沒有驗證「使用者握持傾斜 15/30 度時，四基礎筆畫仍被判對」。

## Assumptions & Decisions

- 方向基準：採用「相對起手式」，不是絕對世界座標。
- 筆畫辨識位置：放在前端/PC 端，不在 micro:bit 端做最終筆畫分類。
- 首版範圍：只做四基礎筆畫 `橫 / 豎 / 撇 / 捺`。
- 起止判定：採用按鍵控制，而不是純自動切段。
- 容忍角度：以約 `30°` 的 `roll/pitch` 偏差為設計目標。
- 重設策略：每一筆開始前重新建立方向基準。
- 硬件限制：首版只校正傾斜，不解決完整 `yaw` 朝向問題；若使用者大幅扭轉手柄平面，橫/豎仍可能混淆，這是已接受的限制。

## Proposed Changes

### 1. micro:bit 端加入每筆 Gate 與起筆姿態事件

檔案：

- `claude_ver/stroke test/microbit/mpu6050_stroke.py`
- `claude_ver/stroke test/microbit/mpu6050_stroke_lite.py`

要做什麼：

- 把 `button_a` 從單純 `reset_state()` 改為「每筆切換 Gate」的控制鍵。
- 第一次按下 `button_a`：
  - 送出 `G,1`
  - 重設位移狀態 `reset_state(now_ms)`
  - 立即送出一筆起筆基準 JSON，例如附加欄位或獨立事件，至少包含：
    - `event: "stroke_start"`
    - `roll`
    - `pitch`
    - `t`
- 第二次按下 `button_a`：
  - 送出 `G,0`
  - 可附帶 `event: "stroke_end"` 方便前端除錯。
- `button_b` 保留為串流開關，避免干擾既有操作。

為什麼：

- 使用者已指定首版要用按鍵控制每筆開始/結束。
- 前端已可解析 Gate，但目前 micro:bit 還沒有真正發出 Gate 訊號。
- 每筆開始時輸出基準 `roll/pitch`，可讓前端用同一筆的起手姿勢做方向正規化。

如何做：

- 在現有 JSON/命令處理架構內新增一個 `gate_active` 布林狀態。
- Gate 關閉時可維持姿態更新，但不要累積當前筆畫點列；或維持原始資料串流，但在前端只於 Gate 開啟期間收筆畫點。
- 為避免舊前端失效，保留原本 JSON 欄位；新增欄位時以向後相容方式處理，例如只多送 `event` 或另送一行 JSON。

### 2. 前端建立「每筆起手式方向正規化」流程

檔案：

- `claude_ver/stroke test/src/StrokeTest.jsx`

要做什麼：

- 讓前端完整讀取 JSON 中的 `roll/pitch/moving/event`，不只讀 `x/y/z`。
- 在 `G,1` 或 `event: "stroke_start"` 到來時，記錄本筆的姿態基準：
  - `baselineRoll`
  - `baselinePitch`
- 在處理每個點時，先把原始或累積位移投影到「相對起手式」座標，再進行切段與分類。
- UI 上新增基準姿態與正規化狀態顯示，方便調參與觀察。

為什麼：

- 目前分類只看原始 `x,y` 路徑，對握持傾斜敏感。
- 使用者要求「手柄不一定照預設姿勢」，而專案現有資料流已經有 `roll/pitch`，前端是最適合做正規化和快速迭代的地方。

如何做：

- 新增前端狀態/參考值：
  - `baselinePoseRef`
  - `latestPoseRef`
  - `normalizedPointsRef`
- 解析 JSON 時：
  - 若有 `roll/pitch`，更新 `latestPoseRef`
  - 若是 `stroke_start`，把 `latestPoseRef` 或事件自帶姿態存成基準
- 正規化方式採「傾斜差補償」而不是完整 3D heading 解算：
  - 用 `currentRoll - baselineRoll`
  - 用 `currentPitch - baselinePitch`
  - 根據差值對當前 `dx/dy` 或累積軌跡做 2D 補償旋轉/縮放近似
  - 實作上優先採「對局部位移向量做旋轉校正」，不要回頭重算整筆歷史點，避免 UI 與分類邏輯過於複雜
- 若偵測到姿態差超過容忍範圍（例如 30 度）：
  - 在 UI 顯示「握持偏差過大」
  - 該筆標記為低可信，不直接判為錯筆畫

### 3. 把首版分類收斂到四基礎筆畫

檔案：

- `claude_ver/stroke test/src/StrokeTest.jsx`

要做什麼：

- 首版先把分類邏輯縮到 `HENG / SHU / PIE / NA` 四類。
- 暫時停用或降級 `HENGZHE / SHUGOU / HENGZHEGOU / DIAN / UP / LEFT` 等規則，避免在方向正規化剛加入時增加誤判來源。

為什麼：

- 使用者已明確指定首版只驗證四基礎筆畫。
- 目前 `StrokeTest.jsx` 的分類規則是為多類筆畫設計，加入方向正規化後若不先收斂，將難以判斷誤差來自姿態補償還是多段規則。

如何做：

- `classifySegments()` 只保留單段主方向與簡單斜向判斷。
- 規則建議：
  - 主向量接近 `0°`：`HENG`
  - 主向量接近 `90°`：`SHU`
  - 主向量接近 `135°`：`PIE`
  - 主向量接近 `45°`：`NA`
- 角度區間要以「正規化後」的向量角度判定，而非原始感測座標。
- UI 顯示與 log 也同步只列四類，減少測試時的噪音。

### 4. 在 PC 演算法模組補上可重複驗證的方向正規化工具

檔案：

- `claude_ver/stroke test/tools/imu_pipeline.py`

要做什麼：

- 加入與前端一致的姿態基準/方向正規化輔助函式，供離線測試使用。
- 把「基於起手式做傾斜補償」抽成純函式，而不是只藏在前端 React 狀態裡。

為什麼：

- 目前 `StrokePipeline` 已是最適合放純數學/純演算法驗證的地方。
- 若只有前端實作，後續很難用模擬資料回歸測試 15 度、30 度偏差。

如何做：

- 新增類似下列純函式：
  - `normalize_pose_delta(current_roll, current_pitch, baseline_roll, baseline_pitch)`
  - `normalize_xy_step(dx, dy, pose_delta)`
  - 或一個更集中式函式 `normalize_stroke_step(...)`
- 與前端採同一套公式與閾值，避免兩邊行為漂移。
- 保留現有 `dtw_*` 函式，暫不把首版切成 DTW 分類，但為第二版保留接口。

### 5. 增加針對姿態偏差的測試與文件

檔案：

- `claude_ver/stroke test/tools/tests/test_imu_pipeline.py`
- `claude_ver/stroke test/MPU6050_STROKE_GUIDE.md`
- 如有需要，再補 `claude_ver/stroke test/README.md`

要做什麼：

- 測試新增：
  - 基準姿態 `0°` 與 `15° / 30°` 偏差時，正規化結果仍落在同一目標方向區間。
  - 四種基礎筆畫在正規化後仍能被判為相同 token。
  - 超過容忍角度時會回報低可信或不分類。
- 文件新增：
  - 新操作流程：`button_a` 按一下開始一筆、再按一下結束一筆。
  - 說明「首版只校正傾斜，不支援任意扭轉」。
  - 說明前端需要使用 JSON 模式，以便讀取 `roll/pitch/event`。

為什麼：

- 這次改動的價值不在 UI，而在「不同拿法下是否還能穩定判對」。
- 若沒有針對姿態偏差的測試，後續調整閾值很容易把功能改壞。

## Implementation Sequence

1. 先修改 `mpu6050_stroke.py`，打通 Gate 與 `stroke_start/stroke_end` 事件。
2. 視容量情況把同樣邏輯同步到 `mpu6050_stroke_lite.py`；若空間不足，至少在檔案註解中標明 lite 版暫不支援此功能。
3. 在 `StrokeTest.jsx` 新增姿態事件解析、基準姿態記錄與正規化後的點處理。
4. 收斂前端分類規則到四基礎筆畫。
5. 在 `imu_pipeline.py` 抽出對應純函式。
6. 補 `test_imu_pipeline.py` 測試。
7. 更新 `MPU6050_STROKE_GUIDE.md`。

## Verification Steps

### 程式驗證

- 執行 `python -m unittest discover -s "claude_ver/stroke test/tools/tests" -p "test_*.py"`，確認新增測試通過。
- 若前端有現成測試框架，可補最小單元測試；若沒有，至少做手動驗證並記錄結果。

### 裝置與流程驗證

- 燒錄 `mpu6050_stroke.py` 到 micro:bit。
- 連上 `StrokeTest.jsx` 頁面，確認：
  - 按一次 `button_a` 後，前端收到 `G,1` 與 `stroke_start`
  - 再按一次 `button_a` 後，前端收到 `G,0` 與 `stroke_end`
- 在以下情境各做四筆基礎筆畫：
  - 正常握姿
  - 左右傾斜約 15 度
  - 左右/前後傾斜約 30 度
- 成功標準：
  - 四基礎筆畫在正常握姿下可穩定判定
  - 在 15~30 度傾斜內仍維持可用辨識率
  - 超過設計容忍範圍時，系統至少能提示「低可信」而不是亂判成其它筆畫

### 非目標驗證

- 不把以下情境視為首版失敗：
  - 使用者整個手柄平面大幅扭轉（yaw）後仍要求系統知道世界絕對方向
  - 多段複合筆畫（如橫折鉤）仍要在首版一併穩定辨識

