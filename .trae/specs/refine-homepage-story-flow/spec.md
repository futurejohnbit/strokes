# Landing Page 重新設計 Spec

## Why
目前方向偏離需求，頁面加入了過多內容與額外頁面，反而削弱首頁作為創科展展示入口的作用。需要重新定義為單一 landing page，重點是更清楚的設計與排版，而不是堆疊功能與花巧元素。

## What Changes
- 將目前首頁重新設計為單一 landing page，不再拆出介紹頁。
- 首頁只保留核心內容：正上方大標題、面向小學觀眾的簡單故事、遊戲流程概說、頁面內的主要按鈕。
- 首屏標題區需成為最主要視覺區塊，約佔首頁主要可視區的 30%。
- 整體設計以版面優化與資訊清晰為主，移除不必要的花哨區塊、浮窗與過度動畫。
- 背景音樂保留，但改為頁面內按鈕控制開關，不使用音響浮窗。
- 背景音樂來源改為先研究可免費使用的音樂庫或免費授權方案。
- 在真正開始實作前，先到 GitHub 搜尋可參考或可直接複用的 landing page、hero section、教育產品首頁與簡潔動畫模式。
- 若視覺效果需要額外插圖或人工素材，必須明確標示人工介入需求。

## Impact
- Affected specs: 首頁資訊架構、首頁版面設計、首頁按鈕配置、背景音樂控制、GitHub 研究、免費音樂資源研究
- Affected code: `claude_ver/stroke test/src/main.jsx`, `claude_ver/stroke test/src/HomePreviewV2.jsx`, `claude_ver/stroke test/src/index.css`, 以及目前首頁相關元件

## ADDED Requirements
### Requirement: 單一 Landing Page
系統 SHALL 提供一個單一首頁作為 landing page，而不是首頁加介紹頁的雙頁結構。

#### Scenario: 使用者打開首頁
- **WHEN** 使用者進入首頁
- **THEN** 應只看到一個經過整理的 landing page
- **AND** 不應依賴額外介紹頁才能理解產品核心

### Requirement: 首頁資訊收斂
系統 SHALL 把首頁內容收斂為最基本的展示元素。

#### Scenario: 首頁內容構成
- **WHEN** 使用者進入 landing page
- **THEN** 頁面應包含標題、簡單故事、遊戲流程概說、頁內主要按鈕
- **AND** 內容必須面向小學觀眾易於理解

### Requirement: 標題區作為首頁主視覺
系統 SHALL 將首頁正上方的標題區做成主視覺焦點。

#### Scenario: 首屏閱讀順序
- **WHEN** 使用者打開首頁首屏
- **THEN** 標題區應位於正上方
- **AND** 在視覺上約佔首頁主要可視區 30%
- **AND** 使用者應先看見標題，再看故事與流程說明

### Requirement: 面向小學觀眾的故事與流程
系統 SHALL 以小學生能快速理解的方式介紹產品故事與玩法。

#### Scenario: 故事內容
- **WHEN** 使用者閱讀首頁文案
- **THEN** 應能看懂一個簡短、直接、適合小學觀眾的故事設定

#### Scenario: 流程內容
- **WHEN** 使用者閱讀首頁玩法區
- **THEN** 應能看懂簡單的遊戲流程概說
- **AND** 流程說明應少量、直接、易掃描

### Requirement: 頁內按鈕整合
系統 SHALL 將首頁主要操作整合在 landing page 內。

#### Scenario: 首頁按鈕
- **WHEN** 使用者查看首頁
- **THEN** 應能直接看到頁內主要按鈕
- **AND** 不需要透過浮窗或跳轉到介紹頁才能操作

### Requirement: 背景音樂改為頁內控制
系統 SHALL 保留背景音樂，但改用頁面內按鈕進行開關控制。

#### Scenario: 音樂控制方式
- **WHEN** 使用者使用首頁
- **THEN** 音樂控制應以頁面內明確按鈕呈現
- **AND** 不應再使用音響浮窗

### Requirement: 免費音樂資源研究
系統 SHALL 在實作背景音樂前先研究可免費使用的音樂庫或免費授權來源。

#### Scenario: 音樂來源決策
- **WHEN** 實作者準備加入背景音樂
- **THEN** 必須先確認可免費使用的音樂庫、授權條件或替代方案
- **AND** 選用理由需能說明

### Requirement: GitHub 先行研究
系統 SHALL 在開始重寫 landing page 前，先到 GitHub 搜尋可參考或可複用的內容。

#### Scenario: 首頁實作前研究
- **WHEN** 實作者尚未開始改寫首頁
- **THEN** 必須先搜尋 GitHub 上與 landing page、hero section、教育產品首頁、簡潔動畫相關的可用內容
- **AND** 研究結論需反映到後續實作方案

### Requirement: 人工素材介入標示
系統 SHALL 在需要新增插圖或人工視覺素材時明確標示需求。

#### Scenario: 視覺素材不足
- **WHEN** 現有素材不足以支撐首頁主視覺或故事區排版
- **THEN** 必須明確列出哪些插圖或素材需要人工介入

## MODIFIED Requirements
### Requirement: 首頁設計方向
首頁的核心目標改為優化設計與排版，而不是擴增額外頁面與大量展示模組。

#### Scenario: 設計決策
- **WHEN** 實作者規劃首頁
- **THEN** 應優先改善版面層次、閱讀順序與資訊清晰度
- **AND** 不應加入不必要的花哨功能

## REMOVED Requirements
### Requirement: 獨立介紹頁
**Reason**: 使用者明確要求去掉介紹頁面，改為單一 landing page。
**Migration**: 原本打算拆到介紹頁的內容，僅保留真正必要的部分並重新整理回首頁。

### Requirement: 音響浮窗控制
**Reason**: 使用者明確要求移除音響浮窗。
**Migration**: 改為頁面內按鈕控制音樂開關。

### Requirement: 額外書寫測試頁
**Reason**: 本輪需求聚焦為重新寫首頁 landing page，不再擴增其他頁面。
**Migration**: 暫不納入本輪實作範圍。
