# 筆劃俠客 React Native 版本開發指南

## 項目概述

這是「筆劃俠客」的React Native版本，旨在測試使用現代移動開發框架的可行性，並與MIT App Inventor進行比較。

## 開發環境設置

### 1. 系統要求

- Node.js 16+ 
- React Native CLI
- Android Studio (用於Android開發)
- Java Development Kit (JDK) 11+

### 2. 安裝步驟

```bash
# 1. 安裝依賴
npm install

# 2. 安裝React Native CLI (如果尚未安裝)
npm install -g react-native-cli

# 3. 安裝CocoaPods (iOS開發，可選)
cd ios && pod install && cd ..

# 4. 啟動Metro服務器
npm start

# 5. 運行Android版本
npm run android

# 6. 運行iOS版本 (macOS only)
npm run ios
```

### 3. Android開發設置

1. 安裝Android Studio
2. 設置Android SDK
3. 配置環境變量：
   ```bash
   export ANDROID_HOME=$HOME/Android/Sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/tools
   export PATH=$PATH:$ANDROID_HOME/tools/bin
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```

## 項目結構

```
stroke-hero-react-native/
├── src/
│   ├── components/          # 可重用組件
│   │   └── GameCanvas/      # 遊戲畫布組件
│   ├── screens/             # 畫面組件
│   │   ├── MainMenu/        # 主選單
│   │   └── GameScreen/      # 遊戲畫面
│   ├── services/            # 服務層
│   │   └── BluetoothService.ts  # 藍牙通訊服務
│   └── store/               # 狀態管理
│       ├── store.ts         # Redux store配置
│       └── slices/          # Redux slices
├── App.tsx                  # 主應用組件
├── index.js                 # 應用入口
└── package.json             # 依賴配置
```

## 核心功能實現

### 1. 藍牙通訊 (BluetoothService.ts)

- 使用 `react-native-bluetooth-serial` 庫
- 支持設備掃描、連接、數據傳輸
- 實時接收micro:bit的筆劃數據

```typescript
// 連接設備示例
await bluetoothService.connectToDevice(deviceId);

// 監聽筆劃數據
bluetoothService.on('strokeDetected', (stroke) => {
  handleStrokeInput(stroke.type, stroke.direction);
});
```

### 2. 遊戲畫布 (GameCanvas.tsx)

- 使用 `react-native-svg` 繪製迷宮
- 支持動畫效果和互動
- 實時顯示角色移動和筆劃軌跡

### 3. 狀態管理 (Redux Toolkit)

- 遊戲狀態管理 (gameSlice.ts)
- 藍牙狀態管理 (bluetoothSlice.ts)
- 統一的狀態更新邏輯

## 開發優勢

### 相比MIT App Inventor的優勢：

1. **更強的UI控制**
   - 自定義動畫效果
   - 精確的佈局控制
   - 現代化的UI組件

2. **更好的性能**
   - 原生渲染性能
   - 更流暢的動畫
   - 更快的響應速度

3. **更豐富的功能**
   - 複雜的狀態管理
   - 更多的第三方庫支持
   - 更靈活的數據處理

4. **更好的可維護性**
   - TypeScript類型安全
   - 模組化架構
   - 更好的代碼組織

## 開發挑戰

1. **學習曲線**
   - 需要JavaScript/TypeScript知識
   - React Native框架學習
   - 原生開發概念

2. **環境配置複雜**
   - 多個工具鏈設置
   - 平台特定配置
   - 依賴管理

3. **調試複雜度**
   - 需要更多調試工具
   - 跨平台問題
   - 性能優化需求

## 測試計劃

### 1. 功能測試
- [ ] 藍牙連接穩定性
- [ ] 筆劃識別準確性
- [ ] 遊戲邏輯正確性
- [ ] UI響應性能

### 2. 性能測試
- [ ] 應用啟動時間
- [ ] 記憶體使用情況
- [ ] 電池消耗
- [ ] 動畫流暢度

### 3. 兼容性測試
- [ ] 不同Android版本
- [ ] 不同設備尺寸
- [ ] micro:bit連接穩定性

## 部署指南

### Android APK構建

```bash
# 1. 生成簽名密鑰
keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000

# 2. 構建發布版本
cd android
./gradlew assembleRelease

# 3. APK文件位置
# android/app/build/outputs/apk/release/app-release.apk
```

## 比較分析

### React Native vs MIT App Inventor

| 特性 | React Native | MIT App Inventor |
|------|-------------|------------------|
| 學習難度 | 中等-困難 | 簡單 |
| 開發速度 | 中等 | 快速 |
| UI靈活性 | 高 | 中等 |
| 性能 | 優秀 | 良好 |
| 可維護性 | 優秀 | 中等 |
| 社區支持 | 豐富 | 有限 |
| 部署便利性 | 複雜 | 簡單 |

## 結論建議

### 適合使用React Native的情況：
- 需要複雜的UI設計
- 要求高性能
- 計劃長期維護和擴展
- 團隊有相關技術背景

### 適合使用MIT App Inventor的情況：
- 快速原型開發
- 教育用途
- 簡單的功能需求
- 初學者友好

## 下一步計劃

1. 完成基本功能開發
2. 在真實設備上測試
3. 性能優化
4. 與MIT App Inventor版本比較
5. 制定最終技術選型建議