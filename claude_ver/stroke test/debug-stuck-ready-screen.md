# Debug Session: stuck-ready-screen

Status: OPEN

## Symptom
- 在 Vercel Preview 開啟後，畫面會卡在右側大框「準備開始...」，看起來像進入遊戲但沒有載入任何漢字/筆劃內容。
- 預期：選關/開始後應該要載入漢字資料並顯示筆劃提示，而不是長時間停在「準備開始...」。

## Environment
- Project: `claude_ver/stroke test`
- URL: `https://strokesyyt.vercel.app`
- Client: Chrome / Edge（Web Bluetooth）

## Falsifiable Hypotheses
1. `fetchGameLevelData()` 在 production 取漢字資料時 fetch 失敗（cdn/jsdelivr 被擋、CORS、網路）→ `gameLevelData` 長時間維持 `null`。
2. `validateCharacterStrokes()` / `analyzeStrokeType()` 過濾太嚴格導致所有候選字都被跳過，遞迴跳字後沒有成功 set `gameLevelData`。
3. 遊戲 state（`gameState`）切到 `PLAYING`，但關卡資料尚未 ready 或被清空，造成 `renderCanvas()` 落入 `!currentChar` 的 fallback「準備開始...」。
4. 有 runtime error（production only）在資料載入/狀態切換時拋出，React 還在但主流程中斷（可能只在某些路徑/裝置出現）。
5. BLE 事件或按鈕事件觸發了意外的 state transition（例如連擊、跳關、或連線回呼觸發）導致資料被 reset。

## Next Step
- 在不改業務邏輯前提下，先加「可回報到 Debug Server」的插桿，收集：
  - gameState/level/charIdx 轉換序列
  - fetch 的 URL、response.ok、錯誤堆疊
  - validate 失敗原因與跳過次數
  - 最終是否成功 setGameLevelData

