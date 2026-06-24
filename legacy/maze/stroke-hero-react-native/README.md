# 行行出狀元 (Stroke Champs) React Native 版本

## 🚀 項目概述

這是「行行出狀元」遊戲的React Native版本，用於測試與MIT App Inventor相比的開發可行性和優勢。

## 📊 React Native vs MIT App Inventor 比較

### ✅ React Native 優勢
- **專業級UI**：更精美的界面設計和動畫效果
- **性能更佳**：原生性能，流暢的遊戲體驗
- **擴展性強**：易於添加複雜功能和第三方庫
- **跨平台**：一套代碼同時支援iOS和Android
- **AI整合**：更容易整合AI功能（如語音識別、圖像處理）
- **版本控制**：完整的Git版本管理
- **團隊協作**：多人開發更方便

### ❌ React Native 挑戰
- **學習曲線**：需要JavaScript/TypeScript知識
- **開發時間**：初期設置和學習需要更多時間
- **調試複雜**：錯誤排查比App Inventor困難

### 🎯 MIT App Inventor 優勢
- **零門檻**：圖形化編程，適合初學者
- **快速原型**：可以很快做出可用的app
- **教育友好**：適合學生學習編程概念
- **藍牙支援**：內建micro:bit支援

## 🛠️ 技術棧

- **框架**：React Native
- **語言**：TypeScript
- **狀態管理**：Redux Toolkit
- **導航**：React Navigation
- **動畫**：React Native Reanimated
- **藍牙**：react-native-bluetooth-serial
- **遊戲引擎**：React Native Game Engine (可選)

## 📁 項目結構

```
stroke-hero-react-native/
├── src/
│   ├── components/          # 可重用組件
│   │   ├── GameCanvas/      # 遊戲畫布
│   │   ├── MazeRenderer/    # 迷宮渲染器
│   │   └── CharacterSprite/ # 角色精靈
│   ├── screens/             # 頁面組件
│   │   ├── HomeScreen/      # 主選單
│   │   ├── GameScreen/      # 遊戲畫面
│   │   └── SettingsScreen/  # 設定頁面
│   ├── services/            # 服務層
│   │   ├── BluetoothService/# 藍牙通訊
│   │   ├── GameEngine/      # 遊戲引擎
│   │   └── AIService/       # AI功能
│   ├── data/                # 遊戲數據
│   │   ├── mazes/           # 迷宮數據
│   │   └── characters/      # 角色數據
│   ├── assets/              # 資源文件
│   │   ├── images/          # 圖片
│   │   ├── sounds/          # 音效
│   │   └── fonts/           # 字體
│   └── utils/               # 工具函數
├── android/                 # Android原生代碼
├── ios/                     # iOS原生代碼
└── package.json             # 依賴管理
```

## 🎮 核心功能實作計劃

### 1. 藍牙通訊模組
```typescript
// BluetoothService.ts
class BluetoothService {
  async connectToMicrobit(): Promise<boolean>
  async sendCommand(command: string): Promise<void>
  onDataReceived(callback: (data: string) => void): void
}
```

### 2. 遊戲引擎
```typescript
// GameEngine.ts
class GameEngine {
  loadMaze(mazeId: string): Maze
  moveCharacter(direction: Direction): boolean
  checkStrokeSequence(strokes: Stroke[]): boolean
  updateGameState(): void
}
```

### 3. AI功能整合
```typescript
// AIService.ts
class AIService {
  generateMaze(character: string): Promise<Maze>
  recognizeStroke(sensorData: number[]): Promise<Stroke>
  provideLearningFeedback(performance: GameStats): string
}
```

## 🎨 UI/UX 設計優勢

### 高級動畫效果
- **粒子系統**：魔法筆劃軌跡效果
- **骨骼動畫**：角色移動動畫
- **場景轉換**：流暢的關卡切換
- **互動反饋**：觸覺反饋和音效同步

### 響應式設計
- **多屏幕適配**：手機、平板完美適配
- **主題切換**：日間/夜間模式
- **無障礙支援**：視覺輔助功能

## 🤖 AI功能擴展

### 智能迷宮生成
```typescript
// 使用AI生成個性化迷宮
const generatePersonalizedMaze = async (
  character: string,
  difficulty: number,
  playerHistory: GameHistory
): Promise<Maze> => {
  // 調用AI API生成迷宮
  const aiResponse = await fetch('/api/generate-maze', {
    method: 'POST',
    body: JSON.stringify({
      character,
      difficulty,
      playerPreferences: playerHistory.preferences
    })
  });
  return aiResponse.json();
};
```

### 學習進度分析
```typescript
// AI分析學習進度
const analyzeLearningProgress = (gameStats: GameStats) => {
  return {
    strengths: ['橫劃掌握良好', '筆劃順序準確'],
    improvements: ['豎劃動作需要練習'],
    recommendations: ['建議多練習「日」字關卡']
  };
};
```

## 📱 開發環境設置

### 必要工具
1. **Node.js** (v16+)
2. **React Native CLI**
3. **Android Studio** (Android開發)
4. **Xcode** (iOS開發，僅Mac)
5. **VS Code** + React Native擴展

### 快速開始
```bash
# 安裝依賴
npm install

# 啟動Metro服務器
npm start

# 運行Android版本
npm run android

# 運行iOS版本 (僅Mac)
npm run ios
```

## 🎯 開發里程碑

### Phase 1: 基礎框架 (1-2週)
- [ ] 項目初始化和環境配置
- [ ] 基礎UI組件開發
- [ ] 導航系統設置

### Phase 2: 核心功能 (2-3週)
- [ ] 藍牙通訊模組
- [ ] 遊戲引擎基礎
- [ ] 迷宮渲染系統

### Phase 3: 遊戲邏輯 (2-3週)
- [ ] 筆劃識別算法
- [ ] 角色移動邏輯
- [ ] 關卡系統

### Phase 4: AI整合 (1-2週)
- [ ] AI迷宮生成
- [ ] 智能學習分析
- [ ] 個性化推薦

### Phase 5: 優化發布 (1週)
- [ ] 性能優化
- [ ] 測試和調試
- [ ] 打包發布

## 💡 建議

### 如果你是初學者
建議先用**MIT App Inventor**快速做出原型，驗證遊戲概念，然後再考慮用React Native重新開發專業版本。

### 如果你有編程經驗
**React Native**是更好的選擇，可以做出更專業、更具擴展性的app。

### 混合策略
1. **第一階段**：用MIT App Inventor做概念驗證
2. **第二階段**：用React Native開發完整版本
3. **第三階段**：整合AI功能，打造智能學習平台

你想先從哪個部分開始測試？我可以幫你設置開發環境或創建具體的代碼示例！
## Branding / 品牌命名
- 中文名稱：行行出狀元
- 英文名稱：Stroke Champs

Rationale / 命名說明：
- 「行行出狀元」寓意每一筆劃（行）的練習都能成就未來的狀元，結合教育與成就感。
- 「Stroke Champs」直指「筆劃冠軍」，強調通過練習成為筆劃達人，童趣且具激勵性。

Note：英文名暫列為備選，最終版本將隨產品視覺與展會主題微調。