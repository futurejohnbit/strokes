# MIT App Inventor 開發指南 - 行行出狀元

## 📱 App 開發概述

這份指南將幫助小學生使用 MIT App Inventor 創建「行行出狀元」手機 App，與 micro:bit 配合使用。

## 🎯 App 功能需求

### 核心功能
1. **藍牙連接** - 與 micro:bit 通訊
2. **遊戲畫面** - 顯示迷宮和角色
3. **筆劃識別** - 接收並處理 micro:bit 的動作數據
4. **關卡系統** - 多個字形關卡
5. **計分系統** - 記錄玩家表現

## 🧩 MIT App Inventor 組件清單

### 必需組件 (Components)
```
用戶界面 (User Interface):
├── Screen1 (主畫面)
├── VerticalArrangement (垂直佈局)
├── HorizontalArrangement (水平佈局) 
├── Label (文字標籤) x 5
│   ├── LabelTitle (遊戲標題)
│   ├── LabelLevel (關卡顯示)
│   ├── LabelScore (分數顯示)
│   ├── LabelStory (故事文字)
│   └── LabelHint (提示文字)
├── Button (按鈕) x 4
│   ├── ButtonStart (開始遊戲)
│   ├── ButtonReset (重置)
│   ├── ButtonHelp (幫助)
│   └── ButtonConnect (連接 micro:bit)
├── Canvas (畫布) - 用於繪製迷宮
└── Image (圖片) x 2
    ├── ImagePlayer (玩家角色)
    └── ImageEnemy (敵人角色)

連接性 (Connectivity):
├── BluetoothClient1 (藍牙客戶端)
└── Clock1 (計時器)

媒體 (Media):
├── Sound1 (音效播放器)
└── TextToSpeech1 (語音播報)

感測器 (Sensors):
└── OrientationSensor1 (方向感測器，備用)

儲存 (Storage):
└── TinyDB1 (本地數據庫)
```

## 🎨 畫面設計佈局

### 主畫面結構
```
Screen1
└── VerticalArrangement1 (填滿螢幕)
    ├── HorizontalArrangement1 (頂部資訊列)
    │   ├── LabelLevel ("關卡 1")
    │   ├── LabelScore ("分數: 0") 
    │   └── ButtonConnect ("連接")
    ├── LabelTitle ("筆劃俠客")
    ├── LabelStory (故事文字區域)
    ├── Canvas1 (遊戲畫面，400x400像素)
    ├── LabelHint (提示文字)
    └── HorizontalArrangement2 (底部按鈕列)
        ├── ButtonStart ("開始")
        ├── ButtonReset ("重置")
        └── ButtonHelp ("幫助")
```

## 🔧 關鍵程式邏輯 (Blocks)

### 1. 初始化設定
```blocks
當 Screen1.Initialize 時
├── 設定 LabelTitle.Text 為 "筆劃俠客"
├── 設定 LabelLevel.Text 為 "關卡 1"
├── 設定 LabelScore.Text 為 "分數: 0"
├── 設定 Canvas1.BackgroundColor 為 白色
├── 設定全域變數 currentLevel 為 1
├── 設定全域變數 playerScore 為 0
├── 設定全域變數 gameState 為 "menu"
└── 呼叫 drawMaze 程序
```

### 2. 藍牙連接
```blocks
當 ButtonConnect.Click 時
├── 設定 BluetoothClient1.Connect 為 "98:D3:11:FC:28:D8"
└── 如果 BluetoothClient1.IsConnected
    ├── 設定 ButtonConnect.Text 為 "已連接"
    ├── 設定 ButtonConnect.BackgroundColor 為 綠色
    └── 發送文字 "connected" 透過 BluetoothClient1

當 BluetoothClient1.ConnectionLost 時
├── 設定 ButtonConnect.Text 為 "重新連接"
├── 設定 ButtonConnect.BackgroundColor 為 紅色
└── 顯示通知 "micro:bit 連接中斷"
```

### 3. 接收 micro:bit 數據
```blocks
當 Clock1.Timer 時 (間隔: 100毫秒)
├── 如果 BluetoothClient1.IsConnected
│   └── 如果 BluetoothClient1.BytesAvailableToReceive > 0
│       ├── 設定 receivedData 為 BluetoothClient1.ReceiveText(-1)
│       └── 呼叫 processStrokeData 程序，參數: receivedData

程序 processStrokeData (strokeData)
├── 如果 包含 ":" 在 strokeData 中
│   ├── 設定 strokeType 為 分割文字 strokeData 在 ":" 位置 1
│   ├── 設定 strokeCount 為 分割文字 strokeData 在 ":" 位置 2
│   └── 呼叫 checkStrokeCorrect 程序，參數: strokeType
```

### 4. 筆劃驗證邏輯
```blocks
程序 checkStrokeCorrect (inputStroke)
├── 設定 expectedStrokes 為 取得清單項目 characterDatabase 索引 currentLevel
├── 如果 inputStroke = 取得清單項目 expectedStrokes 索引 1
│   ├── 呼叫 executeCorrectStroke 程序，參數: inputStroke
│   ├── 移除清單項目 expectedStrokes 索引 1
│   └── 如果 清單長度 expectedStrokes = 0
│       └── 呼叫 completeLevel 程序
└── 否則
    └── 呼叫 executeWrongStroke 程序，參數: inputStroke

程序 executeCorrectStroke (stroke)
├── 設定 playerScore 為 playerScore + 10
├── 設定 LabelScore.Text 為 連接文字 "分數: " playerScore
├── 呼叫 movePlayer 程序，參數: stroke
├── 播放音效 Sound1 來源: "success.mp3"
└── 發送文字 "success" 透過 BluetoothClient1

程序 executeWrongStroke (stroke)
├── 設定 playerScore 為 最大值 (playerScore - 5) 0
├── 設定 LabelScore.Text 為 連接文字 "分數: " playerScore
├── 播放音效 Sound1 來源: "error.mp3"
├── 發送文字 "wrong" 透過 BluetoothClient1
└── 設定 LabelHint.Text 為 "請嘗試正確的筆劃！"
```

### 5. 迷宮繪製
```blocks
程序 drawMaze
├── 呼叫 Canvas1.Clear
├── 設定 mazeData 為 取得清單項目 mazeDatabse 索引 currentLevel
├── 重複 i 從 1 到 清單長度 mazeData
│   ├── 重複 j 從 1 到 清單長度 (取得清單項目 mazeData 索引 i)
│   │   ├── 設定 cellValue 為 取得清單項目 (取得清單項目 mazeData 索引 i) 索引 j
│   │   ├── 如果 cellValue = 0 (牆壁)
│   │   │   └── 呼叫 Canvas1.DrawRectangle (j*40) (i*40) 40 40 填滿: true
│   │   ├── 如果 cellValue = 2 (起點)
│   │   │   └── 呼叫 Canvas1.DrawCircle (j*40+20) (i*40+20) 15 填滿: true 顏色: 綠色
│   │   └── 如果 cellValue = 3 (終點)
│   │       └── 呼叫 Canvas1.DrawCircle (j*40+20) (i*40+20) 15 填滿: true 顏色: 紅色
```

### 6. 角色移動
```blocks
程序 movePlayer (strokeType)
├── 如果 strokeType = "horizontal"
│   └── 設定 playerX 為 playerX + 40
├── 如果 strokeType = "vertical"  
│   └── 設定 playerY 為 playerY + 40
├── 如果 strokeType = "left_fall"
│   ├── 設定 playerX 為 playerX - 40
│   └── 設定 playerY 為 playerY + 40
├── 如果 strokeType = "right_fall"
│   ├── 設定 playerX 為 playerX + 40
│   └── 設定 playerY 為 playerY + 40
└── 呼叫 updatePlayerPosition 程序
```

## 📊 數據結構設計

### 全域變數清單
```
數字變數:
├── currentLevel (當前關卡)
├── playerScore (玩家分數)
├── playerX (玩家X座標)
├── playerY (玩家Y座標)
└── gameTimer (遊戲計時)

文字變數:
├── gameState ("menu", "playing", "paused", "completed")
├── currentCharacter (當前學習的字)
└── playerName (玩家姓名)

清單變數:
├── characterDatabase (字庫數據)
├── mazeDatabase (迷宮數據)
├── expectedStrokes (期望的筆劃順序)
└── completedLevels (已完成關卡)
```

### 字庫數據結構
```blocks
當 Screen1.Initialize 時
├── 設定 characterDatabase 為 建立空清單
├── 新增項目到清單 characterDatabase 項目: 建立清單
│   ├── 項目: "人"
│   ├── 項目: 建立清單 "left_fall" "right_fall"
│   └── 項目: "小明被困在「人」字迷宮中..."
├── 新增項目到清單 characterDatabase 項目: 建立清單
│   ├── 項目: "大"  
│   ├── 項目: 建立清單 "horizontal" "left_fall" "right_fall"
│   └── 項目: "這次迷宮更大了！記住「大」字的筆順..."
```

## 🎵 音效和視覺回饋

### 音效檔案需求
- `success.mp3` - 正確筆劃音效
- `error.mp3` - 錯誤筆劃音效  
- `level_complete.mp3` - 關卡完成音效
- `game_start.mp3` - 遊戲開始音效

### 視覺效果
```blocks
程序 showSuccessEffect
├── 設定 Canvas1.BackgroundColor 為 淺綠色
├── 等待 200 毫秒
└── 設定 Canvas1.BackgroundColor 為 白色

程序 showErrorEffect  
├── 設定 Canvas1.BackgroundColor 為 淺紅色
├── 等待 200 毫秒
└── 設定 Canvas1.BackgroundColor 為 白色
```

## 🔍 測試和除錯

### 測試步驟
1. **藍牙連接測試**
   - 確認能成功連接 micro:bit
   - 測試數據傳輸是否正常

2. **筆劃識別測試**
   - 模擬各種筆劃輸入
   - 驗證正確/錯誤判斷邏輯

3. **遊戲流程測試**
   - 完整遊玩一個關卡
   - 測試關卡切換功能

4. **錯誤處理測試**
   - 藍牙連接中斷處理
   - 無效輸入處理

### 常見問題解決

**Q: 藍牙連接失敗**
A: 檢查 micro:bit MAC 地址是否正確，確保藍牙已開啟

**Q: 筆劃識別不準確**  
A: 調整 micro:bit 程式中的 THRESHOLD 值

**Q: 畫面顯示異常**
A: 檢查 Canvas 尺寸設定和座標計算

## 📚 學習資源

### MIT App Inventor 教學
- [官方教學網站](http://appinventor.mit.edu/explore/ai2/tutorials)
- [藍牙連接教學](http://appinventor.mit.edu/explore/ai2/bluetooth)
- [Canvas 繪圖教學](http://appinventor.mit.edu/explore/ai2/canvas)

### 進階功能建議
1. **數據儲存** - 使用 TinyDB 保存遊戲進度
2. **多人模式** - 支援多個玩家競賽
3. **自定義關卡** - 讓用戶創建自己的字形迷宮
4. **語音提示** - 使用 TextToSpeech 提供語音指導

## 🎯 開發時程建議

### 第一週：基礎功能
- [ ] 建立基本 UI 介面
- [ ] 實現藍牙連接功能
- [ ] 完成簡單的筆劃識別

### 第二週：遊戲邏輯
- [ ] 實現迷宮繪製
- [ ] 完成角色移動邏輯
- [ ] 添加計分系統

### 第三週：完善和測試
- [ ] 添加音效和視覺效果
- [ ] 完成多關卡系統
- [ ] 進行全面測試和除錯

這個指南提供了完整的開發框架，小學生可以按照步驟逐步實現「行行出狀元」App！