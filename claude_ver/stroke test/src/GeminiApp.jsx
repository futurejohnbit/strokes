import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Sword, Zap, Award, Bluetooth, MonitorSmartphone, Hammer, Sprout, Flame, PenTool, Ruler, Scroll, Droplets, Construction, Volume2, VolumeX } from 'lucide-react';
import AchievementModal from './components/AchievementModal';
import { useGameTimer } from './utils/timerUtils';
import {
  PIE_ASSIST_WINDOW_MS,
  PIE_CONFIRM_THRESHOLD,
  parseImuAssistToken,
  shouldUpgradeToPie,
} from './utils/imuPieAssist';
import {
  ensureBleRequestAvailable,
  getBleInstallSteps,
  getBlePlatformHint,
  getBleSetupUrl,
  getBleSupportSnapshot,
  initBleSupport,
  subscribeBleSupport,
  translateBleError,
} from './utils/bleSupport';
import {
  getEncouragementPack,
  pickLevelCeremonyPraise,
} from './utils/encouragementFeedback';

// Import assets
import imgCarpenter from './assets/images/carpenter.png';
import imgFarmer from './assets/images/farmer.png';
import imgChef from './assets/images/chef.png';
import imgScholar from './assets/images/scholar.png';

// 遊戲常數與資料設定
// 遊戲狀態常數
  const GAME_STATE = {
    MENU: 'MENU',
    LEVEL_SELECT: 'LEVEL_SELECT',
    PLAYING: 'PLAYING',
    CHAR_PREVIEW: 'CHAR_PREVIEW',
    WON: 'WON',
    LOST: 'LOST',
    TEST: 'TEST',
    LEVEL_INTRO: 'LEVEL_INTRO',
    ACHIEVEMENT: 'ACHIEVEMENT'
  };

  // 自定義可愛 SVG 圖標組件
  const Icons = {
    Hammer: ({ size = 24, className = "" }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M19 8L15 4L13 6L17 10L19 8Z" fill="#A16207" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M14 9L10 5L3 12L7 16L14 9Z" fill="#FCD34D" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7 16L11 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    Seed: ({ size = 24, className = "" }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M12 22C12 22 17 18 17 12C17 7 12 2 12 2C12 2 7 7 7 12C7 18 12 22 12 22Z" fill="#4ADE80" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 2V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 12L17 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 12L7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    Fire: ({ size = 24, className = "" }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12C11 11.24 10.37 11 10.37 11C13 10 13 3.5 13 3.5C13 3.5 15.5 5.25 15.5 8.25C15.5 9 16.25 10.62 16.25 10.62C17.5 11 19 12.5 19 14.5A5.5 5.5 0 0 1 13.5 20H11A5.5 5.5 0 0 1 5.5 14.5C5.5 12.5 7 11 8.5 10.62C8.5 10.62 8.5 14.5 8.5 14.5Z" fill="#F87171" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    Brush: ({ size = 24, className = "" }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M10 2L8 6L16 10L18 6L10 2Z" fill="#94A3B8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8 6L4 14C4 14 3 16 3 18C3 20.2 4.8 22 7 22C9.2 22 11 20.2 11 18C11 16 10 14 10 14L16 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M14 2L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    Sword: ({ size = 24, className = "" }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M14.5 17.5L3 6V3H6L17.5 14.5L14.5 17.5Z" fill="#60A5FA" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M13 19L19 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M16 16L20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M19 21L21 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  };

  // 漢字資料庫：使用 Make Me A Hanzi 的路徑數據
// 座標系統：1024x1024, 原點在左下 (需轉換)
const CHARACTERS = [
  {
    char: '大',
    pinyin: 'dà',
    meaning: 'Big / Great',
    strokes: [
      { 
        id: 1, 
        type: 'horizontal', 
        direction: 'right', 
        hint: '向右揮動 (一)', 
        svg: "M 494 476 Q 542 485 795 501 Q 817 502 822 512 Q 826 525 808 540 Q 750 580 707 569 Q 631 550 500 522 L 436 509 Q 331 490 213 469 Q 189 465 208 447 Q 241 420 294 432 Q 357 453 431 465 L 494 476 Z",
        medians: [[210, 458], [268, 453], [514, 503], [719, 534], [770, 529], [810, 517]]
      },
      { 
        id: 2, 
        type: 'throw', 
        direction: 'left-down', 
        hint: '向左下揮動 (丿)', 
        svg: "M 487 437 Q 491 456 494 476 L 500 522 Q 510 711 528 763 Q 534 776 523 786 Q 501 805 459 822 Q 434 832 414 825 Q 390 816 410 796 Q 444 762 444 726 Q 445 602 436 509 L 431 465 Q 398 275 310 179 Q 303 173 297 166 Q 251 118 148 55 Q 133 48 130 43 Q 124 36 144 34 Q 195 34 300 104 Q 385 173 414 218 Q 444 266 480 396 L 487 437 Z",
        medians: [[416, 810], [444, 799], [482, 759], [469, 518], [448, 394], [426, 320], [386, 231], [361, 196], [307, 140], [202, 67], [138, 41]]
      },
      { 
        id: 3, 
        type: 'press', 
        direction: 'right-down', 
        hint: '向右下揮動 (丶)', 
        svg: "M 480 396 Q 501 357 575 245 Q 657 124 718 56 Q 746 22 774 22 Q 856 28 928 32 Q 959 33 959 41 Q 960 50 927 66 Q 753 144 719 174 Q 614 267 500 419 Q 493 429 487 437 C 469 461 465 422 480 396 Z",
        medians: [[486, 430], [500, 393], [576, 284], [660, 182], [722, 118], [774, 77], [953, 42]]
      },
    ]
  },
  {
    char: '木',
    pinyin: 'mù',
    meaning: 'Wood / Tree',
    strokes: [
      { 
        id: 1, 
        type: 'horizontal', 
        direction: 'right', 
        hint: '向右揮動 (一)', 
        svg: "M 524 533 Q 537 536 755 560 Q 768 557 779 573 Q 780 586 754 600 Q 709 627 634 603 Q 526 582 524 580 L 479 572 Q 404 563 234 546 Q 200 542 226 521 Q 265 491 291 494 Q 309 503 446 521 L 524 533 Z",
        medians: [[228, 534], [280, 522], [695, 584], [728, 584], [766, 574]]
      },
      { 
        id: 2, 
        type: 'vertical', 
        direction: 'down', 
        hint: '向下揮動 (丨)', 
        svg: "M 524 580 Q 524 682 544 758 Q 559 783 532 802 Q 516 814 485 833 Q 460 851 439 834 Q 433 828 440 813 Q 474 762 476 711 Q 477 647 479 572 L 477 458 Q 474 208 466 155 Q 442 46 456 5 Q 460 -7 466 -21 Q 473 -40 481 -43 Q 488 -50 495 -41 Q 504 -37 514 -15 Q 524 10 523 44 Q 522 90 523 480 L 524 580 Z",
        medians: [[453, 825], [506, 771], [498, 218], [486, -29]]
      },
      { 
        id: 3, 
        type: 'throw', 
        direction: 'left-down', 
        hint: '向左下揮動 (丿)', 
        svg: "M 446 521 Q 368 337 127 132 Q 114 119 124 117 Q 134 113 146 119 Q 276 176 403 344 Q 472 450 477 458 C 528 538 464 563 446 521 Z",
        medians: [[474, 519], [459, 504], [447, 460], [404, 389], [332, 297], [244, 206], [179, 154], [130, 124]]
      },
      { 
        id: 4, 
        type: 'press', 
        direction: 'right-down', 
        hint: '向右下揮動 (丶)', 
        svg: "M 523 480 Q 607 338 716 186 Q 737 159 774 157 Q 901 147 942 150 Q 954 151 957 157 Q 957 164 941 173 Q 773 251 721 302 Q 628 398 523 532 Q 523 533 524 533 L 524 533 C 506 558 508 506 523 480 Z",
        medians: [[528, 513], [549, 470], [641, 344], [749, 220], [789, 200], [951, 159]]
      },
    ]
  }
];

// Micro:bit 藍牙服務 UUID
const UART_SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const UART_RX_CHARACTERISTIC_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';

// 筆劃代碼對照表：BLE 傳輸層改用單字節代碼，遊戲內部仍使用筆劃名稱。
const STROKE_CODE_TO_TOKEN = {
  '1': 'HENG',
  '2': 'SHU',
  '3': 'TI',
  '4': 'NA',
  '5': 'DIAN',
  '6': 'HENGPIE',
  '7': 'SHUGOU',
  '8': 'HENGSHUGOU',
};

// 筆劃映射表 (Micro:bit UART -> 遊戲方向)
// 嚴格對應 Micro:bit 訓練的筆劃
const STROKE_TOKEN_TO_DIRECTION = {
  'HENG': 'right',
  'SHU': 'down',
  'PIE': 'left-down', // 嘗試支持撇 (映射為左下)
  'NA': 'right-down',
  'DIAN': 'right-down', // 與捺方向相同
  'TI': 'right-up',
  'HENGPIE': 'left-down', // 橫撇，遊戲中判定為左下
  'SHUGOU': 'up', // 豎鉤，遊戲中判定為向上
  'HENGSHUGOU': 'down', // 橫豎鉤，遊戲中判定為向下
  'HENGZHE': 'right-down' // 橫折，映射為右下 (折角方向)
};

const normalizeStrokeToken = (value) => STROKE_CODE_TO_TOKEN[value] || value;
const MICROBIT_BUTTON_TOKEN_MAP = {
  BTN_A: 'A',
  BUTTON_A: 'A',
  A_PRESS: 'A',
  PRESS_A: 'A',
  BTN_B: 'B',
  BUTTON_B: 'B',
  B_PRESS: 'B',
  PRESS_B: 'B',
  BTN_AB: 'AB',
  BUTTON_AB: 'AB',
  AB_PRESS: 'AB',
  PRESS_AB: 'AB',
  PIN14_TAP: 'ENTER',
  P14_TAP: 'ENTER',
  PIN14_CLICK: 'ENTER',
  P14_CLICK: 'ENTER',
  PIN14_ENTER: 'ENTER',
  P14_ENTER: 'ENTER',
};

const normalizeMicrobitButtonToken = (value) => MICROBIT_BUTTON_TOKEN_MAP[value] || null;

const isIgnoredUartMessage = (msg) => {
  if (/^VI_\d+$/i.test(msg)) return true;
  if (/^ID_PROP$/i.test(msg)) return true;
  return false;
};

const LEVEL_PROGRESS_STORAGE_KEY = 'radicalLevelProgress';
const HANZI_DATA_CACHE = new Map();

// 允許的筆劃名稱 (用於篩選字)
const ALLOWED_STROKES = ['HENG', 'SHU', 'NA', 'DIAN', 'TI', 'HENGPIE', 'SHUGOU', 'HENGSHUGOU', 'HENGZHE', 'PIE'];

// 部首關卡列表：依常用部首重新整理現有生字，保留原網站的主題式視覺風格。
const PROFESSION_LEVELS = [
      {
          id: 'wood',
          radical: '木',
          radicalLabel: '木部',
          title: '木部工坊',
          icon: <Icons.Hammer size={32} className="text-amber-600" />,
          badgeImage: imgCarpenter,
          color: 'amber',
          desc: '走進木部工坊試煉，體驗木匠任務，替狀元帽打好木框骨架！',
          chars: [
              { 
                  char: '木', 
                  pinyin: 'mù',
                  cantonese: 'muk6',
                  tool: '魯班尺 & 鐵鎚',
                  story: '先劃橫線，再打直釘，撇捺支撐！',
                  action_cue: '橫：用尺劃線(平)；豎：用力打釘(直)；撇捺：安裝支架(穩)！'
              },
              {
                  char: '林',
                  pinyin: 'lín',
                  cantonese: 'lam4',
                  tool: '雙斧頭',
                  story: '雙木成林，木材更多了！',
                  action_cue: '左邊木頭要瘦長，右邊木頭要寬大！'
              },
              {
                  char: '柱',
                  pinyin: 'zhù',
                  cantonese: 'cyu5',
                  tool: '大樑柱',
                  story: '木頭做的柱子，支撐房屋！',
                  action_cue: '左邊木頭站好，右邊主子撐住！'
              }
          ]
      },
      {
          id: 'grain',
          radical: '禾',
          radicalLabel: '禾部',
          title: '禾部田園',
          icon: <Icons.Seed size={32} className="text-green-600" />,
          badgeImage: imgFarmer,
          color: 'green',
          desc: '走進禾部田園試煉，體驗農作任務，收集稻穗，製作在狀元帽上的穗飾！',
          chars: [
              { 
                  char: '禾', 
                  pinyin: 'hé',
                  cantonese: 'wo4',
                  tool: '鐮刀',
                  story: '禾苗彎彎，豐收在望！',
                  action_cue: '第一筆是禾苗的頭，要畫得彎彎的！'
              },
              {
                  char: '秋',
                  pinyin: 'qiū',
                  cantonese: 'cau1',
                  tool: '秋收火把',
                  story: '禾苗像火一樣紅，秋天到了！',
                  action_cue: '左禾右火，紅紅火火！'
              }
          ]
      },
      {
          id: 'fire',
          radical: '火',
          radicalLabel: '火部',
          title: '火部廚房',
          icon: <Icons.Fire size={32} className="text-red-500" />,
          badgeImage: imgChef,
          color: 'red',
          desc: '走進火部廚房試煉，做出美食，獲得美芝蓮星星，做出星星配件！',
          chars: [
              { 
                  char: '火', 
                  pinyin: 'huǒ',
                  cantonese: 'fo2',
                  tool: '打火石 & 炒鍋',
                  story: '點燃火花，大火快炒，添加柴火！',
                  action_cue: '點：打火；撇：快炒；捺：加柴！'
              },
              {
                  char: '燈',
                  pinyin: 'dēng',
                  cantonese: 'dang1',
                  tool: '小油燈',
                  story: '點亮燈火，照著鍋邊慢慢炒！',
                  action_cue: '左邊先點火，右邊登字要站穩！'
              },
              {
                  char: '炒',
                  pinyin: 'chǎo',
                  cantonese: 'caau2',
                  tool: '炒菜鏟',
                  story: '火少一點，慢慢炒！',
                  action_cue: '左火旺，右少翻！'
              }
          ]
      },
      {
          id: 'speech',
          radical: '言',
          radicalLabel: '言部',
          title: '言部書院',
          icon: <Icons.Brush size={32} className="text-indigo-600" />,
          badgeImage: imgScholar,
          color: 'indigo',
          desc: '走進言部書院試煉，體驗題字任務，寫好狀元帽最重要的冠牌！',
          chars: [
              { 
                  char: '言', 
                  pinyin: 'yán',
                  cantonese: 'jin4',
                  tool: '毛筆 & 宣紙',
                  story: '說話要誠實，一言九鼎！',
                  action_cue: '點橫開頭，下面口要正！'
              },
              {
                  char: '語',
                  pinyin: 'yǔ',
                  cantonese: 'jyu5',
                  tool: '字典',
                  story: '語言是溝通的橋樑！',
                  action_cue: '言字旁在左，吾字在右邊！'
              }
          ]
      }
  ];

// ... (in GeminiApp component)

// 筆劃分類器
const classifyStroke = (medians) => {
    if (!medians || medians.length < 2) return null;
    
    // 轉換為屏幕坐標 (y 軸向下為正)
    // 注意：MakeMeAHanzi 數據 y 軸通常向上為正 (0在下)，但 SVG 渲染時我們做了翻轉。
    // 為了計算角度，我們需要一個統一的坐標系。
    // 假設 medians 是原始數據，我們將其視為標準笛卡爾坐標 (y向上)，
    // 那麼 screenDy (y向下) = - (end.y - start.y)
    // 但觀察 renderCanvas: top: ((900-y)/1024)*100% => y=900是頂部(0%), y=0是底部。
    // 所以原始數據 y 越大越靠上。
    // 屏幕坐標 y' = 900 - y.
    // dy' = (900 - y2) - (900 - y1) = y1 - y2 = -(y2 - y1).
    // 所以 screenDy = -(end[1] - start[1]). 正確。
    
    const points = medians.map(p => ({x: p[0], y: p[1]}));
    const start = points[0];
    const end = points[points.length - 1];
    const probeOffset = Math.min(2, points.length - 1);
    const firstProbe = points[probeOffset];
    const lastProbe = points[Math.max(0, points.length - 1 - probeOffset)];
    
    const screenDx = end.x - start.x;
    const screenDy = -(end.y - start.y); // y 軸反轉
    const startDx = firstProbe.x - start.x;
    const startDy = -(firstProbe.y - start.y);
    const endDx = end.x - lastProbe.x;
    const endDy = -(end.y - lastProbe.y);
    
    const angle = Math.atan2(screenDy, screenDx) * 180 / Math.PI; // -180 to 180
    const dist = Math.sqrt(screenDx*screenDx + screenDy*screenDy);
    const startAngle = Math.atan2(startDy, startDx || 0.001) * 180 / Math.PI;
    const endAngle = Math.atan2(endDy, endDx || 0.001) * 180 / Math.PI;
    
    // 計算路徑總長
    let pathLen = 0;
    for(let i=1; i<points.length; i++) {
        // 在屏幕坐標系下計算距離 (dx不變，dy變號但平方不變)
        const dx = points[i].x - points[i-1].x;
        const dy = points[i].y - points[i-1].y; 
        pathLen += Math.sqrt(dx*dx + dy*dy);
    }
    
    const ratio = pathLen / (dist + 0.1); // 避免除以0
    const isBent = ratio > 1.2; // 彎曲閾值
    const startIsHorizontal = Math.abs(startAngle) < 30 && startDx > 20;
    const endIsVerticalDown = Math.abs(endAngle - 90) < 35 && endDy > 20;
    const endIsLeftDown = endAngle > 105 && endAngle < 175 && endDy > 20 && endDx < -20;
    const leftDriftRatio = Math.abs(screenDx) / (Math.abs(screenDy) + 0.1);
    const isLongLeftFalling = screenDx < -120 && screenDy > 120 && leftDriftRatio > 0.22;
    const isHengZheLike = isBent && startIsHorizontal && endIsVerticalDown && dist > 80;
    const isHengPieLike = isBent && startIsHorizontal && endIsLeftDown && dist > 60;
    
    // 檢測鉤 (Hook)
    // 檢查最後一段的走向與整體走向的差異，或者最後一小段的反向
    // 簡單判定：最後 20% 的點形成的向量，與之前的向量是否有劇烈反轉
    let hasHook = false;
    if (points.length > 5) {
        const lastP = points[points.length-1];
        const prevP = points[points.length-3]; // 取倒數第三點避免噪聲
        const hookDx = lastP.x - prevP.x;
        const hookDy = -(lastP.y - prevP.y);
        
        // 豎鉤: 主體向下，鉤向左或左上
        // 橫鉤: 主體向右，鉤向下? (通常是橫折鉤)
        // 這裡主要檢測豎鉤 (SHUGOU) 和 橫豎鉤 (HENGSHUGOU) 的鉤
        // 如果主體是向下 (SHU/HENGSHUGOU)，鉤應該是向上 (hookDy < 0，因為 y向下為正，向上是負)
        // 或者 hookDy > 0 (如果 y 軸定義不同... 讓我們 stick to screenDy)
        // screenDy 是 -(y2-y1). 
        // 向上: y2 > y1 (原始), screenDy < 0.
        // 所以 hookDy < 0 是向上鉤。
        if (hookDy > 10) { // 向下鉤? 不太可能
        } else if (hookDy < -10) { // 向上鉤
            hasHook = true;
        }
    }

    // 先識別複合筆劃，避免橫折被整體夾角誤判成橫。
    if (isHengZheLike) {
        if (hasHook) return 'HENGSHUGOU';
        return 'HENGZHE';
    }

    // 橫撇必須真的是先橫後撇，避免短撇只因路徑略彎而被誤判。
    if (isHengPieLike) {
        return 'HENGPIE';
    }

    // 1. 橫 (HENG)
    if (Math.abs(angle) < 30) {
        return 'HENG';
    }
    
    // 2. 豎 (SHU) / 豎鉤 (SHUGOU)
    if (Math.abs(angle - 90) < 30) { // 向下
        if (isLongLeftFalling) return 'PIE';
        if (hasHook) return 'SHUGOU';
        return 'SHU';
    }
    
    // 3. 撇 (PIE) / 橫撇 (HENGPIE) - 左下 (135度)
    if (Math.abs(angle - 135) < 30) {
        return 'PIE'; // 單撇
    }
    
    // 4. 捺 (NA) / 點 (DIAN) / 橫折 (HENGZHE) / 橫豎鉤 (HENGSHUGOU) - 右下 (45度)
    if (Math.abs(angle - 45) < 35) {
        if (isBent) {
            if (hasHook) return 'HENGSHUGOU'; // 橫+豎+鉤
            return 'HENGZHE'; // 橫+豎 (無鉤)
        }
        // 直線
        if (dist < 300) return 'DIAN';
        return 'NA';
    }
    
    // 5. 提 (TI) - 右上 (-45度)
    if (Math.abs(angle + 45) < 30) {
        return 'TI';
    }
    
    // 默認返回最接近的
    // 如果無法分類，回退到簡單角度
    if (Math.abs(angle) < 45) return 'HENG';
    if (Math.abs(angle - 90) < 45) return 'SHU';
    if (Math.abs(angle - 135) < 45) return 'PIE';
    if (Math.abs(angle + 45) < 45) return 'TI';
    
    return 'UNKNOWN';
};

const FIRE_COMPONENT_STROKE_OVERRIDES = ['DIAN', 'PIE', 'PIE'];

const applyCharacterStrokeOverrides = (professionId, char, strokeIndex, totalStrokes, strokeType) => {
    // 火字部件統一按點、撇、撇處理，單字「火」本身除外。
    if (professionId === 'fire' && char !== '火' && strokeIndex < FIRE_COMPONENT_STROKE_OVERRIDES.length) {
        return FIRE_COMPONENT_STROKE_OVERRIDES[strokeIndex];
    }

    // 燈的倒數第二筆固定視為撇。
    if (char === '燈' && strokeIndex === totalStrokes - 2) {
        return 'PIE';
    }

    return strokeType;
};

const loadHanziData = async (char) => {
    if (HANZI_DATA_CACHE.has(char)) {
        return HANZI_DATA_CACHE.get(char);
    }

    const response = await fetch(`https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0.1/${char}.json`);
    if (!response.ok) throw new Error('找不到該漢字數據');

    const data = await response.json();
    HANZI_DATA_CACHE.set(char, data);
    return data;
};

// 更精確的筆劃分類 (基於路徑分析)
const analyzeStrokeType = (stroke) => {
    const medians = stroke.medians;
    if (!medians || medians.length < 2) return 'UNKNOWN';

    // 轉為屏幕坐標 (y 向下)
    const points = medians.map(p => ({x: p[0], y: -p[1]}));
    
    const start = points[0];
    const end = points[points.length-1];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    
    const len = Math.sqrt(dx*dx + dy*dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI; // -180 ~ 180
    
    // 1. 檢測轉折點 (Corner Detection)
    // 計算每個點的曲率或角度變化
    
    // 簡單規則：
    
    // 橫 (HENG): 主要是向右，無大轉折
    if (Math.abs(angle) < 20 && len > 100) return 'HENG';
    
    // 豎 (SHU): 主要是向下，無大轉折 (除了可能的垂露/懸針區別，都算豎)
    if (Math.abs(angle - 90) < 20 && len > 100) {
        // 檢查尾部是否有鉤
        // 豎鉤: 結尾處明顯向上/向左上/向右上
        // 檢查最後 20% 的趨勢
        const lastPartIdx = Math.floor(points.length * 0.8);
        const p80 = points[lastPartIdx];
        const p100 = end;
        const tailDy = p100.y - p80.y;
        if (tailDy < -20) return 'SHUGOU'; // 向上勾
        return 'SHU';
    }
    
    // 撇 (PIE): 向左下
    if (angle > 100 && angle < 170) {
        return 'PIE';
    }
    
    // 捺 (NA): 向右下
    if (angle > 10 && angle < 80) {
        if (len < 250) return 'DIAN'; // 短的算點
        return 'NA';
    }
    
    // 提 (TI): 向右上
    if (angle > -80 && angle < -10) {
        return 'TI';
    }
    
    // 橫撇 (HENGPIE): 先橫再撇
    // 橫豎鉤 (HENGSHUGOU): 先橫再豎再鉤
    
    // 這些複合筆劃通常 start-end 角度比較奇怪，或者路徑長度遠大於直線距離
    // HENGPIE: start -> right -> left-down. End is usually left-down of start.
    // HENGSHUGOU: start -> right -> down -> hook. End is usually right-down of start.
    
    // 這裡我們用一個簡單的 heuristic:
    // 如果是複合筆劃，通常 MakeMeAHanzi 的數據結構中並不會直接告訴我們。
    // 但我們可以信任如果 filter 過的字，其筆劃應該落在我們允許的範圍內。
    
    // 如果無法精確識別，我們先假設它是有效的，但標記為 UNKNOWN。
    // 但用戶要求嚴格篩選。
    
    // 讓我們嘗試用一個比較寬鬆的映射，並依賴 "Candidate List" 來保證字的品質。
    // 我們只檢查它是否 *明顯* 是不支持的筆劃 (如 PIE)。
    
    if (angle > 100 && angle < 170) return 'PIE'; // 撇
    
    // 檢測橫折類 (HENGPIE, HENGSHUGOU)
    // 檢查路徑中間是否有向右的段，然後向下的段
    // ...
    
    return 'UNKNOWN';
};

// 實際的驗證函數
const validateCharacterStrokes = (charData) => {
    if (!charData || !charData.strokes) return false;
    
    // 1. 筆劃數篩選 (放寬限制，允許簡單字如 木、火、文)
    if (charData.strokes.length < 2 || charData.strokes.length > 20) return false;
    
    // 2. 筆劃類型篩選
    for (let stroke of charData.strokes) {
        const type = analyzeStrokeType(stroke);
        
        // 如果識別出是 PIE (撇)，且 PIE 不在 ALLOWED_STROKES 中，則該字無效
        if (type === 'PIE' && !ALLOWED_STROKES.includes('PIE')) {
            // 但如果這個 PIE 其實是 HENGPIE 的一部分？
            // MakeMeAHanzi 把 HENGPIE 當作一筆。
            // 我們的 analyzeStrokeType 如果把 HENGPIE 誤判為 PIE，那就會誤殺。
            // HENGPIE 的 start-end 角度通常也是左下。
            // 區別：HENGPIE 起筆是橫的。
            
            // 優化 PIE vs HENGPIE 檢測
            const medians = stroke.medians;
            const p0 = medians[0];
            const p1 = medians[Math.min(5, medians.length-1)];
            const startDx = p1[0] - p0[0];
            const startDy = -(p1[1] - p0[1]);
            const startAngle = Math.atan2(startDy, startDx) * 180 / Math.PI;
            
            // 如果起筆是橫 (角度接近0)，但整體是左下 -> HENGPIE
            if (Math.abs(startAngle) < 30) {
                 if (ALLOWED_STROKES.includes('HENGPIE')) continue; // 是 HENGPIE，且允許
            }
            
            return false; // 是純撇，不允許
        }
        
        // 如果是 UNKNOWN，為了保險起見，也可以過濾掉，或者暫時允許 (取決於嚴格程度)
        // 這裡我們嚴格一點
        if (type === 'UNKNOWN') {
             // 嘗試寬容一點：如果是複合筆劃，且起筆/終筆符合某些特徵...
             // 算了，直接過濾 UNKNOWN 可能會殺太多。
             // 我們主要目標是過濾掉 "單撇" (如果 Micro:bit 不支持)
        }
    }
    
    return true;
};

const GeminiApp = ({ onPulseSfx, musicEnabled = false, onToggleMusic, onAudioSceneChange }) => {
  const [gameState, setGameState] = useState(GAME_STATE.MENU);
  const [level, setLevel] = useState(0); // 這裡的 level 代表 "PROFESSION_LEVELS" 的索引
  const [levelSelectCursor, setLevelSelectCursor] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0); // 該職業中的第幾個字
  const [currentStrokeIndex, setCurrentStrokeIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60); // 倒計時 (秒)
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState(''); // 'success', 'error'
  const [completedStrokes, setCompletedStrokes] = useState([]);
  const [shakeIntensity, setShakeIntensity] = useState(0);
  const [showGuideArrow, setShowGuideArrow] = useState(null); // 'up', 'down', 'left', 'right', etc.
  const [showHint, setShowHint] = useState(false); // 控制提示顯示
  const hintTimeoutRef = useRef(null);

  // 電池狀態
  const [batteryLevel, setBatteryLevel] = useState(null);
  const [batteryWarning, setBatteryWarning] = useState(false);
  
  // 計時器 Hook
  const { startLevelTimer, stopLevelTimer, resetTotalTime, currentLevelTime, totalGameTime } = useGameTimer();
  const [lastLevelDuration, setLastLevelDuration] = useState(0);

  // 動畫狀態
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationPoint, setAnimationPoint] = useState(null);

  // 遊戲進度狀態 (用於正式遊戲模式)
  const [gameLevelData, setGameLevelData] = useState(null);
  const [isLoadingLevel, setIsLoadingLevel] = useState(false);
  const [completedLevels, setCompletedLevels] = useState({});
  const [showCelebration, setShowCelebration] = useState(false);
  const [wordCelebration, setWordCelebration] = useState(null);
  const [levelCeremonyPayload, setLevelCeremonyPayload] = useState(null);

  // 測試模式狀態
  const [testCharInput, setTestCharInput] = useState('');
  const [testCharacter, setTestCharacter] = useState(null);
  const [isLoadingChar, setIsLoadingChar] = useState(false);
  const [testError, setTestError] = useState('');

  // 調試日誌狀態
  const [debugLogs, setDebugLogs] = useState([]);
  const [showDebug, setShowDebug] = useState(true); // 默認開啟調試模式
  const [bleSupport, setBleSupport] = useState(getBleSupportSnapshot());
  const [connectionStep, setConnectionStep] = useState('');

  // 添加日誌函數
  const addLog = (msg) => {
    setDebugLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 50)]); // 增加日誌保留條數
  };
  
  // 藍牙狀態
  const [isConnected, setIsConnected] = useState(false);
  const [deviceName, setDeviceName] = useState('');
  const [connectionError, setConnectionError] = useState('');
  const bluetoothDeviceRef = useRef(null);

  const successAudioRef = useRef(null);
  const pronunciationTimeoutRef = useRef(null);
  const correctBurstTimeoutRef = useRef(null);
  const wordCelebrationTimeoutRef = useRef(null);
  const ceremonyTransitionTimeoutRef = useRef(null);
  const ceremonyOverlayTimeoutRef = useRef(null);
  const successStampRef = useRef(0);
  const activeLevelRequestRef = useRef(0);
  const [correctBurst, setCorrectBurst] = useState(null);

  useEffect(() => {
    // 預加載音效 (使用由瀏覽器合成的簡單音效或外部資源)
    // 這裡我們使用 Web Audio API 創建一個簡單的成功音效，避免外部依賴
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
        successAudioRef.current = new AudioContext();
    }
  }, []);

  useEffect(() => {
    try {
      const storedProgress = localStorage.getItem(LEVEL_PROGRESS_STORAGE_KEY);
      if (storedProgress) {
        setCompletedLevels(JSON.parse(storedProgress));
      }
    } catch (error) {
      console.warn('讀取關卡進度失敗:', error);
    }
  }, []);

  useEffect(() => {
    initBleSupport().catch((err) => {
      const friendlyMessage = translateBleError(err);
      setConnectionError(friendlyMessage);
      setConnectionStep('相容層初始化失敗');
    });

    const unsubscribe = subscribeBleSupport((snapshot) => {
      setBleSupport(snapshot);
    });

    return () => unsubscribe();
  }, []);

  const persistCompletedLevels = (updater) => {
    setCompletedLevels((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      localStorage.setItem(LEVEL_PROGRESS_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const markLevelCompleted = (levelId) => {
    persistCompletedLevels((prev) => ({ ...prev, [levelId]: true }));
  };

  const clearPronunciationPreview = () => {
    if (pronunciationTimeoutRef.current) {
      clearTimeout(pronunciationTimeoutRef.current);
      pronunciationTimeoutRef.current = null;
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const speakCantonese = (levelData) => {
    if (!levelData || !('speechSynthesis' in window)) return;

    const utterance = new SpeechSynthesisUtterance(levelData.char);
    utterance.lang = 'zh-HK';
    utterance.rate = 0.78;
    utterance.pitch = 1;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find((voice) => {
      const voiceName = `${voice.name} ${voice.lang}`;
      return /zh-hk|yue|cantonese|粵|粤|香港/i.test(voiceName);
    }) || voices.find((voice) => voice.lang?.toLowerCase().startsWith('zh'));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const playSuccessSound = (kind = 'correct') => {
    if (onPulseSfx) {
      onPulseSfx(kind);
      return;
    }
    if (!successAudioRef.current) return;
    const ctx = successAudioRef.current;
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    const isWordComplete = kind === 'wordComplete';
    osc.type = isWordComplete ? 'triangle' : 'sine';
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(isWordComplete ? 659.25 : 523.25, now);
    osc.frequency.setValueAtTime(isWordComplete ? 880 : 659.25, now + 0.1);
    osc.frequency.setValueAtTime(isWordComplete ? 1174.66 : 783.99, now + 0.22);
    
    gain.gain.setValueAtTime(isWordComplete ? 0.35 : 0.26, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + (isWordComplete ? 0.72 : 0.5));
    
    osc.start(now);
    osc.stop(now + (isWordComplete ? 0.74 : 0.5));

    if (isWordComplete) {
      const chime = ctx.createOscillator();
      const chimeGain = ctx.createGain();
      chime.type = 'sine';
      chime.frequency.setValueAtTime(987.77, now + 0.08);
      chime.frequency.linearRampToValueAtTime(1318.51, now + 0.28);
      chimeGain.gain.setValueAtTime(0.0001, now);
      chimeGain.gain.linearRampToValueAtTime(0.16, now + 0.12);
      chimeGain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
      chime.connect(chimeGain);
      chimeGain.connect(ctx.destination);
      chime.start(now + 0.08);
      chime.stop(now + 0.62);
    }
  };

  const playPositiveSfx = (kind = 'correct') => {
    if (onPulseSfx) {
      onPulseSfx(kind);
      return;
    }

    playSuccessSound(kind);
  };

  const playErrorSound = () => {
    if (!successAudioRef.current) return;
    const ctx = successAudioRef.current;
    if (ctx.state === 'suspended') ctx.resume();
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sawtooth';
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.3);
    
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    
    osc.start(now);
    osc.stop(now + 0.3);
  };

  useEffect(() => {
    if (gameState !== GAME_STATE.CHAR_PREVIEW || !gameLevelData) return undefined;

    clearPronunciationPreview();
    speakCantonese(gameLevelData);
    pronunciationTimeoutRef.current = setTimeout(() => {
      setGameState(GAME_STATE.PLAYING);
      pronunciationTimeoutRef.current = null;
    }, 2000);

    return () => {
      clearPronunciationPreview();
    };
  }, [gameState, gameLevelData?.char]);

  useEffect(() => () => {
    clearPronunciationPreview();
  }, []);

  useEffect(() => () => {
    window.clearTimeout(correctBurstTimeoutRef.current);
    window.clearTimeout(wordCelebrationTimeoutRef.current);
    window.clearTimeout(ceremonyTransitionTimeoutRef.current);
    window.clearTimeout(ceremonyOverlayTimeoutRef.current);
  }, []);

  useEffect(() => {
    onAudioSceneChange?.(gameState === GAME_STATE.MENU ? 'menu' : 'game');
  }, [gameState, onAudioSceneChange]);

  // 使用 Ref 來解決 React Event Listener Closure Trap
  const gameStateRef = useRef(gameState);
  const levelRef = useRef(level);
  const currentStrokeIndexRef = useRef(currentStrokeIndex);
  const completedStrokesRef = useRef(completedStrokes);
  const timeLeftRef = useRef(timeLeft);
  const currentCharIndexRef = useRef(currentCharIndex);
  const levelSelectCursorRef = useRef(levelSelectCursor);
  const isConnectedRef = useRef(isConnected);
  
  // 新增：防抖與過渡狀態 Ref
  const lastStrokeTimeRef = useRef(0);
  const isTransitioningRef = useRef(false);
  const isAnimatingRef = useRef(false);
  const gameLevelDataRef = useRef(gameLevelData);
  const testCharacterRef = useRef(testCharacter);
  const latestImuAssistRef = useRef(null);
  const pendingStrokeRef = useRef(null);
  const pendingStrokeTimerRef = useRef(null);

  const pulseSuccessStamp = () => {
    successStampRef.current += 1;
    return successStampRef.current;
  };

  const triggerCorrectBurst = (targetStroke) => {
    window.clearTimeout(correctBurstTimeoutRef.current);
    const burstPoint = targetStroke?.medians?.[targetStroke.medians.length - 1] || [512, 420];
    setCorrectBurst({
      x: `${(burstPoint[0] / 1024) * 100}%`,
      y: `${((900 - burstPoint[1]) / 1024) * 100}%`,
      id: Date.now(),
    });
    correctBurstTimeoutRef.current = window.setTimeout(() => {
      setCorrectBurst(null);
    }, 650);
  };

  const showWordCelebrationCard = () => {
    window.clearTimeout(wordCelebrationTimeoutRef.current);
    setWordCelebration({
      label: '加時獎勵',
      bonusText: '+30 秒',
    });
    wordCelebrationTimeoutRef.current = window.setTimeout(() => {
      setWordCelebration(null);
    }, 1100);
  };

  const openLevelCeremony = (profession) => {
    const praise = pickLevelCeremonyPraise(profession.id, successStampRef.current);
    const professionPack = getEncouragementPack(profession.id);
    const payload = {
      profession,
      title: praise.title,
      subtitle: praise.subtitle,
      rewardLabel: professionPack.rewardLabel,
      rewardAccent: professionPack.rewardAccent,
      rewardSummary: professionPack.rewardSummary,
    };

    setLevelCeremonyPayload(payload);
    setShowCelebration(true);
    playPositiveSfx('ceremony');
    window.clearTimeout(ceremonyTransitionTimeoutRef.current);
    window.clearTimeout(ceremonyOverlayTimeoutRef.current);
    ceremonyTransitionTimeoutRef.current = window.setTimeout(() => {
      setGameState(GAME_STATE.ACHIEVEMENT);
    }, 3000);
    ceremonyOverlayTimeoutRef.current = window.setTimeout(() => setShowCelebration(false), 3000);
  };

  useEffect(() => {
    gameStateRef.current = gameState;
    levelRef.current = level;
    currentStrokeIndexRef.current = currentStrokeIndex;
    completedStrokesRef.current = completedStrokes;
    timeLeftRef.current = timeLeft;
    currentCharIndexRef.current = currentCharIndex;
    levelSelectCursorRef.current = levelSelectCursor;
    gameLevelDataRef.current = gameLevelData;
    testCharacterRef.current = testCharacter;
    isConnectedRef.current = isConnected;
  }, [gameState, level, currentStrokeIndex, completedStrokes, timeLeft, currentCharIndex, levelSelectCursor, gameLevelData, testCharacter, isConnected]);

  const analyzeStrokeDirection = (medians) => {
      if (!medians || medians.length < 2) return 'unknown';
      const start = medians[0];
      const end = medians[medians.length - 1];
      const dx = end[0] - start[0];
      const dy = end[1] - start[1]; // 注意: 這裡的y是基於SVG原始數據(可能被翻轉前)

      // Make Me A Hanzi data: 
      // y increases downwards in typical SVG coords, BUT
      // The rendering uses scale(1, -1) translate(0, -900).
      // Let's look at raw data examples.
      // '一': medians start [121, 393] end [920, 401]. y is similar. dx > 0.
      // '丨': medians start [517, 212] end [517, 212]... wait, let's check '木' vertical.
      // '木' vertical stroke 2: start [453, 825] end [486, -29]. y decreases significantly.
      // So in raw data, larger Y is higher up? Or lower down?
      // Let's re-read rendering: <g transform="scale(1, -1) translate(0, -900)">
      // If raw y=825, transformed y = -(825 - 900) = -( -75 ) = 75. (Bottom)
      // If raw y=-29, transformed y = -(-29 - 900) = -(-929) = 929. (Top)
      // So visually, the stroke goes from Bottom (y=75) to Top (y=929)?
      // That would be UPWARD stroke. But '木' vertical is DOWNWARD.
      // Wait, let's check the transform again.
      // Transform: scale(1, -1) is usually applied around (0,0).
      // Point (x, y) -> (x, -y).
      // Then translate(0, -900) -> (x, -y - 900).
      // If raw y=900 (top), -> (x, -1800).
      // If raw y=0 (bottom), -> (x, -900).
      // This puts everything far below the screen.
      // Maybe the transform string `scale(1, -1) translate(0, -900)` means:
      // Apply translate first: (x, y-900).
      // Then scale: (x, -(y-900)) = (x, 900-y).
      // If raw y=900 -> 0 (Top).
      // If raw y=0 -> 900 (Bottom).
      // This matches standard screen coords (y increases down).
      // So: RAW Y=900 is TOP. RAW Y=0 is BOTTOM.
      // '木' vertical stroke: start y=825 (Top), end y=-29 (Bottom).
      // So dy = -29 - 825 = -854 (Negative).
      // So: dy < 0 means DOWN.
      
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      // 簡單判斷邏輯
      if (absDx > absDy) {
          // Horizontal dominant
          return dx > 0 ? 'right' : 'left'; // 通常漢字橫畫都是向右
      } else {
          // Vertical dominant
          if (dy < 0) {
             // Downward
             // Check for Pie (Left-Down) vs Na (Right-Down) vs Vertical (Down)
             if (dx < -100 && absDx > absDy * 0.3) return 'left-down'; // 撇
             if (dx > 100 && absDx > absDy * 0.3) return 'right-down'; // 捺
             return 'down'; // 豎
          } else {
             return 'up'; // 提 (向右上)
          }
      }
  };

  const fetchCharacterData = async (char) => {
    if (!char) return;
    setIsLoadingChar(true);
    setTestError('');
    setTestCharacter(null);
    addLog(`正在獲取 '${char}' 的數據...`);

    try {
      const data = await loadHanziData(char);
      
      // Process data into our format
      const strokes = data.strokes.map((svg, index) => {
         const medians = data.medians[index];
         const direction = analyzeStrokeDirection(medians);
         
         let type = 'unknown';
         let hint = '請揮動';
         
         switch(direction) {
             case 'right': type='horizontal'; hint='向右揮動 (一)'; break;
             case 'down': type='vertical'; hint='向下揮動 (丨)'; break;
             case 'left-down': type='throw'; hint='向左下揮動 (丿)'; break;
             case 'right-down': type='press'; hint='向右下揮動 (丶)'; break;
             case 'up': type='rise'; hint='向右上揮動 (提)'; break;
             default: hint=`方向: ${direction}`;
         }

         return {
             id: index + 1,
             type,
             direction,
             hint,
             svg,
             medians
         };
      });

      const newCharData = {
          char: char,
          pinyin: 'custom',
          meaning: 'Custom Test',
          strokes: strokes
      };

      setTestCharacter(newCharData);
      setCompletedStrokes([]);
      setCurrentStrokeIndex(0);
      setFeedback(`已加載 '${char}'，共 ${strokes.length} 畫`);
      addLog(`成功加載 '${char}'`);
      
    } catch (err) {
      console.error(err);
      setTestError(`無法加載 '${char}': ${err.message}`);
      addLog(`加載失敗: ${err.message}`);
    } finally {
      setIsLoadingChar(false);
    }
  };

  const startTestMode = () => {
      setGameState(GAME_STATE.TEST);
      setFeedback('測試模式：請輸入漢字');
      setTestCharacter(null);
      setTestCharInput('');
  };

  const handleTestSubmit = (e) => {
      e.preventDefault();
      if (testCharInput) {
          fetchCharacterData(testCharInput[0]); // Only first char
      }
  };

  const animateStrokePath = (points, duration = 600) => {
      return new Promise((resolve) => {
          if (!points || points.length < 2) {
              resolve();
              return;
          }

          const startTime = performance.now();
          
          // 計算總長度以便均勻移動
          let totalLength = 0;
          const segmentLengths = [];
          for (let i = 0; i < points.length - 1; i++) {
              const dx = points[i+1][0] - points[i][0];
              const dy = points[i+1][1] - points[i][1];
              const dist = Math.sqrt(dx*dx + dy*dy);
              segmentLengths.push(dist);
              totalLength += dist;
          }

          const animate = (currentTime) => {
              const elapsed = currentTime - startTime;
              const progress = Math.min(elapsed / duration, 1);
              
              // 根據進度計算當前距離
              const currentDist = progress * totalLength;
              
              let accumulatedDist = 0;
              let currentPoint = points[points.length - 1]; // 默認終點
              
              for (let i = 0; i < segmentLengths.length; i++) {
                  if (accumulatedDist + segmentLengths[i] >= currentDist) {
                      // 在當前線段內
                      const segmentProgress = (currentDist - accumulatedDist) / segmentLengths[i];
                      const p1 = points[i];
                      const p2 = points[i+1];
                      currentPoint = [
                          p1[0] + (p2[0] - p1[0]) * segmentProgress,
                          p1[1] + (p2[1] - p1[1]) * segmentProgress
                      ];
                      break;
                  }
                  accumulatedDist += segmentLengths[i];
              }
              
              setAnimationPoint(currentPoint);
              
              if (progress < 1) {
                  requestAnimationFrame(animate);
              } else {
                  resolve();
              }
          };
          
          requestAnimationFrame(animate);
      });
  };

  const [showPopupHint, setShowPopupHint] = useState(null); // 用於顯示彈出提示 { text: string, type: 'success' | 'error' }

  const goToLevelSelect = () => {
     clearPronunciationPreview();
     window.clearTimeout(ceremonyTransitionTimeoutRef.current);
     window.clearTimeout(ceremonyOverlayTimeoutRef.current);
     activeLevelRequestRef.current += 1;
     setShowCelebration(false);
     setGameLevelData(null);
     setCompletedStrokes([]);
     setCurrentStrokeIndex(0);
     setCurrentCharIndex(0);
     setShowHint(false);
     setShowPopupHint(null);
     setWordCelebration(null);
     setLevelCeremonyPayload(null);
     setAnimationPoint(null);
     setIsAnimating(false);
     isTransitioningRef.current = false;
     isAnimatingRef.current = false;
     setLevelSelectCursor(levelRef.current);
     setFeedback('請選擇想先挑戰的職業試煉');
     setFeedbackType('info');
     setGameState(GAME_STATE.LEVEL_SELECT);
  };

  const returnToMenu = () => {
     clearPronunciationPreview();
     window.clearTimeout(ceremonyTransitionTimeoutRef.current);
     window.clearTimeout(ceremonyOverlayTimeoutRef.current);
     window.clearTimeout(wordCelebrationTimeoutRef.current);
     window.clearTimeout(correctBurstTimeoutRef.current);
     activeLevelRequestRef.current += 1;
     setShowCelebration(false);
     setLevelCeremonyPayload(null);
     setWordCelebration(null);
     setCorrectBurst(null);
     setGameLevelData(null);
     setCompletedStrokes([]);
     setCurrentStrokeIndex(0);
     setCurrentCharIndex(0);
     setShowHint(false);
     setShowPopupHint(null);
     setAnimationPoint(null);
     setIsAnimating(false);
     isTransitioningRef.current = false;
     isAnimatingRef.current = false;
     setGameState(GAME_STATE.MENU);
  };

  const selectLevel = (levelIndex) => {
     clearPronunciationPreview();
     window.clearTimeout(ceremonyTransitionTimeoutRef.current);
     window.clearTimeout(ceremonyOverlayTimeoutRef.current);
     activeLevelRequestRef.current += 1;
     setLevel(levelIndex);
     levelRef.current = levelIndex;
     setLevelSelectCursor(levelIndex);
     setCurrentCharIndex(0);
     setCurrentStrokeIndex(0);
     setCompletedStrokes([]);
     setGameLevelData(null);
     setShowHint(false);
     setShowPopupHint(null);
     setWordCelebration(null);
     setLevelCeremonyPayload(null);
     setGameState(GAME_STATE.LEVEL_INTRO);
  };

  const skipPronunciationPreview = () => {
     clearPronunciationPreview();
     setGameState(GAME_STATE.PLAYING);
  };

  const skipCurrentLevel = () => {
     clearPronunciationPreview();
     stopLevelTimer();
     setShowCelebration(false);
     setFeedback('已跳過本關，返回職業試煉選單。');
     setFeedbackType('info');
     goToLevelSelect();
  };

  const skipCurrentCharacter = async () => {
     if (gameState !== GAME_STATE.PLAYING || !gameLevelData) return;

     const currentLevel = levelRef.current;
     const nextCharIndex = currentCharIndexRef.current + 1;
     const currentLevelConfig = PROFESSION_LEVELS[currentLevel];

     setFeedback(`已跳過「${gameLevelData.char}」，準備下一個生字。`);
     setFeedbackType('info');

     if (!currentLevelConfig || nextCharIndex >= currentLevelConfig.chars.length) {
       skipCurrentLevel();
       return;
     }

     isTransitioningRef.current = true;
     clearPronunciationPreview();
     setGameLevelData(null);
     setCompletedStrokes([]);
     setCurrentStrokeIndex(0);
     setCurrentCharIndex(nextCharIndex);
     setGameState(GAME_STATE.CHAR_PREVIEW);
     await fetchGameLevelData(currentLevel, nextCharIndex);
     setTimeout(() => {
       isTransitioningRef.current = false;
     }, 300);
  };

  const processStrokeInput = async (inputDir) => {
     if (isAnimatingRef.current) return; // 使用 Ref 進行嚴格鎖定防止重複觸發
     
     // 200ms 防抖
     const now = Date.now();
     if (now - lastStrokeTimeRef.current < 200) return;
     lastStrokeTimeRef.current = now;

     // 過渡期檢查 (防止連擊跳關)
     if (isTransitioningRef.current) return;

     const currentGameState = gameStateRef.current;
     
     // 測試模式邏輯分支
     if (currentGameState === GAME_STATE.TEST) {
        if (!testCharacter) return;
        
        const currentIndex = currentStrokeIndexRef.current;
        const targetStroke = testCharacter.strokes[currentIndex];
        
        if (!targetStroke) return; // 已完成所有筆劃

        addLog(`測試比對: 輸入=${inputDir}, 目標=${targetStroke.direction}`);

        if (inputDir === targetStroke.direction) {
            // Correct
            playPositiveSfx('correct');
            setFeedback('真棒！');
            setFeedbackType('success');
            setShowPopupHint({ text: '真棒！', type: 'success' });
            setTimeout(() => setShowPopupHint(null), 1000);
            
            // 動畫開始
            isAnimatingRef.current = true;
            setIsAnimating(true);
            
            // 平滑動畫
            await animateStrokePath(targetStroke.medians, 500);
            
            setCompletedStrokes(prev => [...prev, targetStroke]);
            setAnimationPoint(null);
            isAnimatingRef.current = false;
            setIsAnimating(false);
            
            if (currentIndex + 1 >= testCharacter.strokes.length) {
                setFeedback('測試完成！');
                playPositiveSfx('wordComplete');
            } else {
                setCurrentStrokeIndex(prev => prev + 1);
            }
        } else {
            // Wrong
            addLog(`❌ 錯誤 (預期: ${targetStroke.direction})`);
            setFeedback(`方向錯誤 (預期: ${targetStroke.direction})`);
            setFeedbackType('error');
            playErrorSound();
            setShowPopupHint({ text: '再試一次！', type: 'error' }); // 彈出提示
            setTimeout(() => setShowPopupHint(null), 1000);
        }
        return;
     }

     if (currentGameState !== GAME_STATE.PLAYING) {
        addLog(`🚫 遊戲未開始 (狀態: ${currentGameState})`);
        return;
     }

     const currentLevel = levelRef.current;
     const currentIndex = currentStrokeIndexRef.current;
     // const targetStroke = CHARACTERS[currentLevel].strokes[currentIndex]; // 舊代碼
     const targetStroke = gameLevelData ? gameLevelData.strokes[currentIndex] : null; // 使用動態數據
     
     if (!targetStroke) {
        addLog(`🚫 無當前筆劃`);
        return;
     }

     addLog(`筆劃比對: 輸入=${inputDir}, 目標=${targetStroke.direction}`);

     if (inputDir === targetStroke.direction) {
       // Success
       addLog('✅ 筆劃正確！');
      pulseSuccessStamp();
      triggerCorrectBurst(targetStroke);
      setShowPopupHint({ text: '真棒！', type: 'success' });
      setTimeout(() => setShowPopupHint(null), 1000);
      setFeedback('真棒！');
       setFeedbackType('success');
       playPositiveSfx('correct');

       
       // 動畫開始
       isAnimatingRef.current = true;
       setIsAnimating(true);
       
       // 平滑動畫
       await animateStrokePath(targetStroke.medians, 500);

       setCompletedStrokes(prev => [...prev, targetStroke]);
       setAnimationPoint(null);
       isAnimatingRef.current = false;
       setIsAnimating(false);

       // 成功不扣時間，或者可以加時
       // setTimeLeft(prev => Math.min(prev + 2, 90));
       
        if (currentIndex + 1 >= gameLevelData.strokes.length) { // 使用動態數據長度
         // 完成一個字
         isTransitioningRef.current = true; // 鎖定輸入
         playPositiveSfx('wordComplete');
         setTimeLeft(prev => prev + 30); // 增加30秒
         const currentLevelConfig = PROFESSION_LEVELS[currentLevel];
         const nextCharIndex = currentCharIndexRef.current + 1;
         const hasNextChar = Boolean(currentLevelConfig?.chars?.[nextCharIndex]);
         if (hasNextChar) {
           showWordCelebrationCard();
         }
         
         setTimeout(async () => {
            // 下一關邏輯
            const nextCharIndex = currentCharIndexRef.current + 1;
            // 先重置狀態防止閃爍
            setGameLevelData(null);
            setCompletedStrokes([]);
            setCurrentStrokeIndex(0);
            
            setCurrentCharIndex(nextCharIndex);
            setGameState(GAME_STATE.CHAR_PREVIEW);
            await fetchGameLevelData(currentLevel, nextCharIndex);
            
            // 確保 React 完成渲染和 Ref 更新後再解鎖
            setTimeout(() => {
                isTransitioningRef.current = false;
            }, 300);
         }, 1000);
       } else {
         setCurrentStrokeIndex(prev => prev + 1);
         setShowHint(false); // 重置提示，準備下一筆
       }

     } else {
       // Fail
       addLog(`❌ 筆劃錯誤 (預期: ${targetStroke.direction})`);
       setFeedbackType('error');
       playErrorSound();
       setShowHint(true); // 錯誤後顯示提示
       
       if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
       hintTimeoutRef.current = setTimeout(() => {
           setShowHint(false);
       }, 3000);
     }
   };

  // 處理 Micro:bit 數據
  // 使用 Ref 來保存最新的處理函數，確保 Event Listener 總是調用最新的邏輯
  const processStrokeInputRef = useRef(processStrokeInput);
  useEffect(() => {
      processStrokeInputRef.current = processStrokeInput;
  }, [processStrokeInput]); // processStrokeInput 本身在每次 render 都會變，除非用 useCallback

  const clearPendingStrokeTimer = () => {
    if (pendingStrokeTimerRef.current) {
      clearTimeout(pendingStrokeTimerRef.current);
      pendingStrokeTimerRef.current = null;
    }
  };

  const getCurrentTargetDirection = () => {
    if (gameStateRef.current === GAME_STATE.TEST) {
      const activeTestCharacter = testCharacterRef.current;
      return activeTestCharacter?.strokes?.[currentStrokeIndexRef.current]?.direction || null;
    }

    if (gameStateRef.current === GAME_STATE.PLAYING) {
      const activeLevelData = gameLevelDataRef.current;
      return activeLevelData?.strokes?.[currentStrokeIndexRef.current]?.direction || null;
    }

    return null;
  };

  function cycleLevelSelection(step = 1) {
    const total = PROFESSION_LEVELS.length;
    if (!total) return;
    setLevelSelectCursor((prev) => {
      const base = Number.isFinite(prev) ? prev : 0;
      const next = (base + step + total) % total;
      const nextLevel = PROFESSION_LEVELS[next];
      setFeedback(`目前選擇：${nextLevel.title}`);
      setFeedbackType('info');
      return next;
    });
  }

  function handleMicrobitButton(buttonKind) {
    const currentGameState = gameStateRef.current;

    if (currentGameState === GAME_STATE.PLAYING || currentGameState === GAME_STATE.TEST) {
      return;
    }

    if (!isConnectedRef.current && currentGameState === GAME_STATE.MENU) {
      setFeedback('請先連接 Micro:bit，再用按鈕進入關卡。');
      setFeedbackType('info');
      return;
    }

    if (buttonKind === 'ENTER') {
      if (currentGameState === GAME_STATE.MENU) {
        playPositiveSfx('reward');
        startGame();
        return;
      }
      if (currentGameState === GAME_STATE.LEVEL_SELECT) {
        playPositiveSfx('reward');
        selectLevel(levelSelectCursorRef.current);
        return;
      }
      if (currentGameState === GAME_STATE.LEVEL_INTRO) {
        playPositiveSfx('reward');
        startCurrentLevel();
        return;
      }
      if (currentGameState === GAME_STATE.CHAR_PREVIEW) {
        playPositiveSfx('reward');
        skipPronunciationPreview();
      }
      return;
    }

    if (currentGameState === GAME_STATE.MENU) {
      if (buttonKind === 'A' || buttonKind === 'B') {
        playPositiveSfx('step');
        startGame();
      }
      return;
    }

    if (currentGameState === GAME_STATE.LEVEL_SELECT) {
      if (buttonKind === 'A') {
        playPositiveSfx('step');
        cycleLevelSelection(1);
        return;
      }
      if (buttonKind === 'B') {
        playPositiveSfx('reward');
        selectLevel(levelSelectCursorRef.current);
        return;
      }
      if (buttonKind === 'AB') {
        playPositiveSfx('step');
        returnToMenu();
      }
      return;
    }

    if (currentGameState === GAME_STATE.LEVEL_INTRO) {
      if (buttonKind === 'A') {
        playPositiveSfx('step');
        goToLevelSelect();
        return;
      }
      if (buttonKind === 'B' || buttonKind === 'AB') {
        playPositiveSfx('reward');
        startCurrentLevel();
      }
      return;
    }

    if (currentGameState === GAME_STATE.CHAR_PREVIEW) {
      if (buttonKind === 'A' && gameLevelDataRef.current) {
        playPositiveSfx('step');
        speakCantonese(gameLevelDataRef.current);
        return;
      }
      if (buttonKind === 'B' || buttonKind === 'AB') {
        playPositiveSfx('reward');
        skipPronunciationPreview();
      }
      return;
    }

    if (currentGameState === GAME_STATE.LOST) {
      if (buttonKind === 'B' || buttonKind === 'AB') {
        playPositiveSfx('reward');
        goToLevelSelect();
      }
      return;
    }

    if (currentGameState === GAME_STATE.ACHIEVEMENT) {
      if (buttonKind === 'B' || buttonKind === 'AB') {
        playPositiveSfx('reward');
        returnToMenu();
      }
    }
  }

  const deliverStrokeDirection = (direction, note = '') => {
    addLog(note ? `👉 識別為: ${direction} (${note})` : `👉 識別為: ${direction}`);
    processStrokeInputRef.current(direction);
  };

  const flushPendingStroke = (reason = 'timeout') => {
    const pending = pendingStrokeRef.current;
    if (!pending) return;

    clearPendingStrokeTimer();
    pendingStrokeRef.current = null;

    const now = Date.now();
    const upgraded = shouldUpgradeToPie({
      targetDirection: pending.targetDirection,
      createAiDirection: pending.direction,
      createAiToken: pending.normalizedToken,
      assist: latestImuAssistRef.current,
      now,
      threshold: PIE_CONFIRM_THRESHOLD,
    });

    if (upgraded) {
      const assist = latestImuAssistRef.current;
      addLog(`🩹 IMU 補強撇成功: ${pending.normalizedToken} -> left-down (score=${assist?.pieScore ?? 0})`);
      deliverStrokeDirection('left-down', `IMU補強/${reason}`);
      return;
    }

    deliverStrokeDirection(pending.direction, reason === 'timeout' ? 'CreateAI原判定' : `CreateAI原判定/${reason}`);
  };

  const handleMicrobitData = (event) => {
    const value = event.target.value;
    const decoder = new TextDecoder('utf-8');
    
    const rawData = decoder.decode(value);

    const tokens = rawData
      .replace(/\0/g, '')
      .split(/[\r\n]+/)
      .map(s => s.trim())
      .filter(Boolean);

    if (tokens.length === 0) return;

    console.log('收到 Micro:bit 數據 (Raw):', rawData, 'Tokens:', tokens);

    for (const token of tokens) {
      const imuAssist = parseImuAssistToken(token);
      if (imuAssist) {
        const receivedAt = Date.now();
        latestImuAssistRef.current = {
          ...imuAssist,
          receivedAt,
        };
        addLog(`IMU 輔助: ${imuAssist.imuDir} score=${imuAssist.pieScore} samples=${imuAssist.sampleCount}`);

        const pending = pendingStrokeRef.current;
        if (pending) {
          const upgraded = shouldUpgradeToPie({
            targetDirection: pending.targetDirection,
            createAiDirection: pending.direction,
            createAiToken: pending.normalizedToken,
            assist: latestImuAssistRef.current,
            now: receivedAt,
            threshold: PIE_CONFIRM_THRESHOLD,
          });

          if (upgraded) {
            clearPendingStrokeTimer();
            pendingStrokeRef.current = null;
            addLog(`🩹 IMU 補強撇成功: ${pending.normalizedToken} -> left-down (score=${imuAssist.pieScore})`);
            deliverStrokeDirection('left-down', 'IMU即時補強');
          }
        }
        continue;
      }

      const data = token.toUpperCase();

      if (isIgnoredUartMessage(data)) {
        addLog(`(忽略系統訊息) "${data}"`);
        continue;
      }

      const buttonToken = normalizeMicrobitButtonToken(data);
      if (buttonToken) {
        addLog(`🎮 Micro:bit 按鈕: ${buttonToken}`);
        handleMicrobitButton(buttonToken);
        continue;
      }

      if (data.startsWith('BATTERY_')) {
          const levelStr = data.replace('BATTERY_', '');
          const levelNum = parseInt(levelStr, 10);
          if (!isNaN(levelNum)) {
              setBatteryLevel(levelNum);
              if (levelNum <= 10) {
                  setBatteryWarning(true);
              }
          }
          continue;
      }

      const normalizedToken = normalizeStrokeToken(data);
      addLog(`收到信號: "${data}" -> "${normalizedToken}"`);

      if (pendingStrokeRef.current) {
        flushPendingStroke('before-next-token');
      }

      const direction = STROKE_TOKEN_TO_DIRECTION[normalizedToken];
      if (direction) {
        const targetDirection = getCurrentTargetDirection();
        const shouldWaitForAssist = targetDirection === 'left-down' && direction !== 'left-down';

        if (shouldWaitForAssist) {
          pendingStrokeRef.current = {
            normalizedToken,
            direction,
            targetDirection,
            receivedAt: Date.now(),
          };
          clearPendingStrokeTimer();
          pendingStrokeTimerRef.current = setTimeout(() => {
            flushPendingStroke('timeout');
          }, 180);
          addLog(`⏳ 等待 IMU 撇輔助: ${normalizedToken}`);
        } else {
          deliverStrokeDirection(direction);
        }
      } else {
        console.warn(`無法識別指令: "${data}" (Length: ${data.length})`);
        addLog(`⚠️ 未知指令: ${data}`);
      }
    }
  };

  // 連接 Micro:bit
  const connectMicrobit = async () => {
    try {
      setConnectionError('');
      setConnectionStep('檢查藍牙環境');
      addLog('開始連接...');
      await ensureBleRequestAvailable();
      
      setConnectionStep('等待選擇 micro:bit');
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: 'BBC micro:bit' }],
        optionalServices: [UART_SERVICE_UUID, 'battery_service']
      });

      addLog('設備已選擇，正在連接 GATT...');
      setConnectionStep('連接 GATT');
      const server = await device.gatt.connect();
      addLog('GATT 連接成功，正在獲取服務...');
      setConnectionStep('搜尋 UART 服務');

      const getServicesPromise = server.getPrimaryServices();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Service_Discovery_Timeout')), 5000)
      );

      let services;
      try {
        services = await Promise.race([getServicesPromise, timeoutPromise]);
      } catch (e) {
        if (e.message === 'Service_Discovery_Timeout') {
           throw new Error('服務發現超時 (請嘗試在 Windows 藍牙設置中刪除設備後重試)');
        }
        throw e;
      }

      const service = services.find(s => s.uuid.toLowerCase() === UART_SERVICE_UUID.toLowerCase());
      
      if (!service) {
        throw new Error('未找到 UART 服務 (請確認 Micro:bit 代碼正確且設置了 No Pairing Required)');
      }
      
      addLog('找到 UART 服務，正在獲取特徵值...');
      setConnectionStep('配置通知通道');
      
      const TX_UUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e'; 
      const RX_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';

      let characteristic = null;
      
      try {
        const char1 = await service.getCharacteristic(TX_UUID);
        if (char1.properties.notify) {
           characteristic = char1;
           addLog('使用特徵值 0002 (支持 Notify)');
        }
      } catch(e) { /* ignore */ }

      if (!characteristic) {
        try {
          const char2 = await service.getCharacteristic(RX_UUID);
          if (char2.properties.notify) {
             characteristic = char2;
             addLog('使用特徵值 0003 (支持 Notify)');
          }
        } catch(e) { /* ignore */ }
      }

      if (!characteristic) {
         addLog('警告: 未找到明確支持 Notify 的特徵值，嘗試盲連 0002...');
         characteristic = await service.getCharacteristic(TX_UUID);
      }

      addLog('正在啟用通知...');
      setConnectionStep('啟用通知');
      try {
        await characteristic.startNotifications();
      } catch (e) {
        addLog('啟用通知失敗: ' + e.message);
        throw new Error(`無法啟用通知 (GATT Error: Not supported 通常意味著屬性不支持 Notify)`);
      }
      
      characteristic.addEventListener('characteristicvaluechanged', handleMicrobitData);

      device.addEventListener('gattserverdisconnected', onDisconnected);

      // 嘗試獲取電池服務
      try {
        setConnectionStep('讀取電池資訊');
        const batteryService = await server.getPrimaryService('battery_service');
        const batteryLevelChar = await batteryService.getCharacteristic('battery_level');
        
        const initialLevel = await batteryLevelChar.readValue();
        const levelVal = initialLevel.getUint8(0);
        setBatteryLevel(levelVal);
        if (levelVal <= 10) setBatteryWarning(true);

        await batteryLevelChar.startNotifications();
        batteryLevelChar.addEventListener('characteristicvaluechanged', (e) => {
          const newLevel = e.target.value.getUint8(0);
          setBatteryLevel(newLevel);
          if (newLevel <= 10) setBatteryWarning(true);
        });
        addLog('電池服務已啟用');
      } catch (e) {
        addLog('未提供標準電池服務或獲取失敗');
      }

      bluetoothDeviceRef.current = device;
      setDeviceName(device.name);
      setIsConnected(true);
      setFeedback('Micro:bit 連接成功！');
      setFeedbackType('success');
      setConnectionStep('已連接');
      addLog('連接流程全部完成！');

    } catch (error) {
      console.error('連接失敗:', error);
      const friendlyMessage = translateBleError(error);
      addLog('錯誤: ' + friendlyMessage);
      setConnectionError(friendlyMessage);
      setIsConnected(false);
      if (!connectionStep) {
        setConnectionStep('連接失敗');
      }
    }
  };

  const onDisconnected = () => {
    console.log('Micro:bit 已斷開');
    clearPendingStrokeTimer();
    pendingStrokeRef.current = null;
    latestImuAssistRef.current = null;
    setIsConnected(false);
    setDeviceName('');
    setConnectionStep('已斷開');
    setFeedback('Micro:bit 已斷開連接');
    setFeedbackType('error');
  };

  // 處理鍵盤事件
  useEffect(() => {
    const handleKeyDown = (e) => {
    // 移除 e.preventDefault() 以允許頁面滾動 -> 恢復防止滾動
    if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) {
        e.preventDefault();
    }
    
    if (gameState !== GAME_STATE.PLAYING && gameState !== GAME_STATE.TEST) return;

      let inputDirection = null;
      
      // 確定當前目標筆劃 (用於智能按鍵映射)
      let currentTarget = null;
      if (gameState === GAME_STATE.PLAYING && gameLevelData && gameLevelData.strokes) {
          currentTarget = gameLevelData.strokes[currentStrokeIndex];
      } else if (gameState === GAME_STATE.TEST && testCharacter && testCharacter.strokes) {
          currentTarget = testCharacter.strokes[currentStrokeIndex];
      }

      switch(e.key) {
        case 'ArrowRight': inputDirection = 'right'; break;
        case 'ArrowDown': inputDirection = 'down'; break;
        case 'ArrowLeft': inputDirection = 'left'; break; 
        case 'ArrowUp': inputDirection = 'up'; break;
        case 'd': inputDirection = 'right-down'; break; 
        default: break;
      }

      // 智能映射：根據當前目標筆劃調整方向鍵含義
      if (currentTarget) {
         // 如果按左鍵，但目標是撇 (左下)，則映射為左下
         if (e.key === 'ArrowLeft' && currentTarget.direction === 'left-down') inputDirection = 'left-down';
         // 如果按右鍵，但目標是捺 (右下)，則映射為右下
         if (e.key === 'ArrowRight' && currentTarget.direction === 'right-down') inputDirection = 'right-down';
      }

      // 強制覆蓋 (Shift組合鍵)
      if (e.key === 'ArrowLeft' && e.shiftKey) inputDirection = 'left-down';
      if (e.key === 'ArrowRight' && e.shiftKey) inputDirection = 'right-down';
      
      if (inputDirection) {
        processStrokeInput(inputDirection);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, currentStrokeIndex, level, gameLevelData, testCharacter]);

  useEffect(() => () => {
    clearPendingStrokeTimer();
  }, []);

  // 遊戲主循環 (訂單倒計時)
  useEffect(() => {
    let interval;
    if (gameState === GAME_STATE.PLAYING) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            setGameState(GAME_STATE.LOST);
            return 0;
          }
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState]);

  // 獲取筆劃故事 (根據職業和筆劃類型)
  const getStrokeStory = (profId, strokeType) => {
      const strokeName = STROKE_NAMES[strokeType] || strokeType;
      
      switch(profId) {
          case 'wood':
              if (strokeType === 'HENG') return `用尺劃線 (${strokeName})`;
              if (strokeType === 'SHU') return `用力打釘 (${strokeName})`;
              if (['PIE', 'NA', 'DIAN'].includes(strokeType)) return `安裝支架 (${strokeName})`;
              return `修整細節 (${strokeName})`;
          case 'grain':
              if (['DIAN', 'NA'].includes(strokeType)) return `播下種子 (${strokeName})`;
              if (['HENG', 'SHU'].includes(strokeType)) return `築起田埂 (${strokeName})`;
              if (['PIE', 'TI'].includes(strokeType)) return `稻穗垂下 (${strokeName})`;
              return `辛勤耕耘 (${strokeName})`;
          case 'fire':
              if (['DIAN'].includes(strokeType)) return `點燃爐火 (${strokeName})`;
              if (['PIE', 'HENGPIE'].includes(strokeType)) return `大火快炒 (${strokeName})`;
              if (['NA', 'HENG'].includes(strokeType)) return `添加柴火 (${strokeName})`;
              return `精心調味 (${strokeName})`;
          case 'speech':
              if (['DIAN'].includes(strokeType)) return `沾滿墨汁 (${strokeName})`;
              if (['HENG'].includes(strokeType)) return `鋪平宣紙 (${strokeName})`;
              if (['PIE', 'NA', 'SHU'].includes(strokeType)) return `揮毫潑墨 (${strokeName})`;
              return `運筆如飛 (${strokeName})`;
          default:
              return `寫出${strokeName}`;
      }
  };

  const fetchGameLevelData = async (profIdx, charIdx = 0) => {
    const requestId = ++activeLevelRequestRef.current;
    const isStaleRequest = () => activeLevelRequestRef.current !== requestId;

    // 檢查職業索引是否超出
    if (profIdx >= PROFESSION_LEVELS.length) {
        if (!isStaleRequest()) {
          setGameState(GAME_STATE.WON);
        }
        return;
    }

    const profession = PROFESSION_LEVELS[profIdx];
    
    // 檢查字索引是否超出 -> 完成本部首關卡
    if (charIdx >= profession.chars.length) {
        if (!isStaleRequest()) {
          const time = stopLevelTimer();
          setLastLevelDuration(time);
          markLevelCompleted(profession.id);
          openLevelCeremony(profession);
        }
        return;
    }

    const charObj = profession.chars[charIdx];
    const char = charObj.char;
    
    setIsLoadingLevel(true);
    setFeedback(`正在準備 ${profession.title} 的試煉任務...`);

    try {
        const data = await loadHanziData(char);
        if (isStaleRequest()) return;
        
        // 轉換數據格式
        const strokes = data.strokes.map((svg, index) => {
           const medians = data.medians[index];
           const totalStrokes = data.strokes.length;
           
           // 使用新的筆劃分類器
           const detectedStrokeType = classifyStroke(medians) || 'UNKNOWN';
           const strokeType = applyCharacterStrokeOverrides(
               profession.id,
               char,
               index,
               totalStrokes,
               detectedStrokeType
           );
           
           // 根據 strokeType 決定 direction (與 STROKE_MAP 對應)
           let direction = 'unknown';
           switch(strokeType) {
               case 'HENG': direction = 'right'; break;
               case 'SHU': direction = 'down'; break;
               case 'NA': direction = 'right-down'; break;
               case 'DIAN': direction = 'right-down'; break;
               case 'TI': direction = 'right-up'; break;
               case 'HENGPIE': direction = 'left-down'; break;
               case 'SHUGOU': direction = 'up'; break;
               case 'HENGSHUGOU': direction = 'down'; break;
               case 'HENGZHE': direction = 'right-down'; break;
               case 'PIE': direction = 'left-down'; break; 
               default: direction = 'unknown';
           }
           
           // 使用新的故事生成器
           let hint = getStrokeStory(profession.id, strokeType);
           
           return { id: index + 1, type: strokeType, direction, hint, svg, medians };
        });

        const newLevelData = {
            char: char,
            pinyin: charObj.pinyin,
            cantonese: charObj.cantonese,
            meaning: profession.title, // 顯示職業
            story: charObj.story, 
            tool: charObj.tool,
            action_cue: charObj.action_cue,
            profession: profession, // 保存職業信息以便 UI 使用
            strokes: strokes
        };

        // 嚴格驗證：確保筆劃數符合且所有筆劃都支持
        const isValid = validateCharacterStrokes(newLevelData);
        if (!isValid) {
            console.warn(`字 '${char}' 未通過驗證，嘗試下一個...`);
            // 跳過這個字，試下一個
            await fetchGameLevelData(profIdx, charIdx + 1);
            return; 
        }

        if (isStaleRequest()) return;

        setGameLevelData(newLevelData);
        
        // 更新狀態
        setLevel(profIdx);
        setCurrentCharIndex(charIdx);

        setCurrentStrokeIndex(0);
        setCompletedStrokes([]);
        setShowHint(false); // 重置提示
        setFeedback(charObj.story); // 顯示故事提示
        setFeedbackType('info');
        
    } catch (err) {
        if (!isStaleRequest()) {
          console.error(err);
          setFeedback(`關卡載入失敗: ${err.message}`);
          setFeedbackType('error');
        }
    } finally {
        if (!isStaleRequest()) {
          setIsLoadingLevel(false);
        }
    }
  };

  const startGame = () => {
    clearPronunciationPreview();
    setLevelSelectCursor(levelRef.current);
    setFeedback('請選擇想先挑戰的職業試煉');
    setFeedbackType('info');
    setGameState(GAME_STATE.LEVEL_SELECT);
  };

  const startCurrentLevel = async () => {
      clearPronunciationPreview();
      const currentLevel = levelRef.current;
      setGameState(GAME_STATE.CHAR_PREVIEW);
      setTimeLeft(90);
      setCurrentCharIndex(0);
      setCurrentStrokeIndex(0);
      setCompletedStrokes([]);
      startLevelTimer();
      await fetchGameLevelData(currentLevel, 0);
  };

  const handleNextLevel = () => {
      goToLevelSelect();
  };

  const getProfessionTheme = (profId) => {
      switch(profId) {
          case 'wood': return { bg: 'bg-amber-100', border: 'border-amber-400', text: 'text-amber-800', highlight: 'text-amber-600', icon: '🔨', shadow: 'shadow-amber-500/20' };
          case 'grain': return { bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-800', highlight: 'text-green-600', icon: '🌾', shadow: 'shadow-green-500/20' };
          case 'fire': return { bg: 'bg-red-100', border: 'border-red-400', text: 'text-red-800', highlight: 'text-red-600', icon: '🔥', shadow: 'shadow-red-500/20' };
          case 'speech': return { bg: 'bg-indigo-100', border: 'border-indigo-400', text: 'text-indigo-800', highlight: 'text-indigo-600', icon: '🖌️', shadow: 'shadow-indigo-500/20' };
          default: return { bg: 'bg-slate-100', border: 'border-slate-300', text: 'text-slate-700', highlight: 'text-slate-600', icon: '❓', shadow: 'shadow-slate-500/20' };
      }
  };

  const getProfessionFxTheme = (profId) => {
      switch(profId) {
          case 'wood':
              return {
                  burst: 'bg-amber-300',
                  soft: 'bg-amber-50 border-amber-200 text-amber-800',
                  glow: 'from-amber-300/30 via-amber-100/10 to-transparent',
                  label: 'bg-amber-100 text-amber-700',
              };
          case 'grain':
              return {
                  burst: 'bg-green-300',
                  soft: 'bg-green-50 border-green-200 text-green-800',
                  glow: 'from-green-300/30 via-green-100/10 to-transparent',
                  label: 'bg-green-100 text-green-700',
              };
          case 'fire':
              return {
                  burst: 'bg-rose-300',
                  soft: 'bg-rose-50 border-rose-200 text-rose-800',
                  glow: 'from-rose-300/30 via-orange-100/10 to-transparent',
                  label: 'bg-rose-100 text-rose-700',
              };
          case 'speech':
              return {
                  burst: 'bg-indigo-300',
                  soft: 'bg-indigo-50 border-indigo-200 text-indigo-800',
                  glow: 'from-indigo-300/30 via-sky-100/10 to-transparent',
                  label: 'bg-indigo-100 text-indigo-700',
              };
          default:
              return {
                  burst: 'bg-slate-300',
                  soft: 'bg-slate-50 border-slate-200 text-slate-700',
                  glow: 'from-slate-300/20 via-slate-100/10 to-transparent',
                  label: 'bg-slate-100 text-slate-700',
              };
      }
  };

  const getLevelIntroBackgroundSrc = (profId) => {
      switch (profId) {
          case 'wood': return '/level-bg/wood.png';
          case 'grain': return '/level-bg/grain.png';
          case 'fire': return '/level-bg/fire.png';
          case 'speech': return '/level-bg/speech.png';
          default: return null;
      }
  };

  // 筆劃名稱翻譯表
  const STROKE_NAMES = {
      'HENG': '橫',
      'SHU': '豎',
      'PIE': '撇',
      'NA': '捺',
      'DIAN': '點',
      'TI': '提',
      'HENGPIE': '橫撇',
      'SHUGOU': '豎鉤',
      'HENGSHUGOU': '橫豎鉤',
      'HENGZHE': '橫折',
      'UNKNOWN': '筆劃'
  };

  // 渲染繪圖區 (SVG)
  const renderCanvas = () => {
    // 根據模式選擇當前漢字
    const currentChar = gameState === GAME_STATE.TEST ? testCharacter : gameLevelData;
    const profTheme = gameLevelData && gameLevelData.profession ? getProfessionTheme(gameLevelData.profession.id) : getProfessionTheme('default');
    
    if (isLoadingLevel) {
        return (
            <div className={`relative w-full max-w-[80vh] aspect-square rounded-xl shadow-inner border-4 overflow-hidden mx-auto mt-4 flex items-center justify-center ${profTheme.bg} ${profTheme.border}`}>
                <div className={`${profTheme.text} font-bold text-xl flex flex-col items-center gap-2`}>
                   <div className="animate-spin text-4xl">{profTheme.icon}</div>
                   正在召喚{gameLevelData ? gameLevelData.profession.title : '關卡'}...
                </div>
            </div>
        );
    }
    
    if (!currentChar) {
        // 如果測試模式下還沒選字
        if (gameState === GAME_STATE.TEST) {
           return (
             <div className="relative w-full max-w-md aspect-square bg-slate-800 rounded-xl border-4 border-dashed border-slate-600 flex items-center justify-center mx-auto mt-4">
                <div className="text-slate-400">請在上方輸入漢字</div>
             </div>
           );
        }
        // 使用新設計的準備畫面
        return (
            <div className={`relative w-full max-w-md aspect-square rounded-xl shadow-2xl border-4 overflow-hidden mx-auto mt-4 flex items-center justify-center ${profTheme.bg} ${profTheme.border} ${profTheme.shadow}`}>
                <div className="text-slate-400 relative z-10 font-bold text-xl bg-slate-900/80 px-6 py-3 rounded-full border border-slate-600">
                    準備開始...
                </div>
            </div>
        );
    }

    const currentStroke = currentChar.strokes[currentStrokeIndex];

    // 轉換 Make Me A Hanzi 座標到 CSS 百分比 (用於 HTML 元素定位)
    const getPosition = (x, y) => ({
      left: `${(x / 1024) * 100}%`,
      top: `${((900 - y) / 1024) * 100}%`
    });
    
    // 渲染
    return (
      <div className={`relative w-full max-w-[80vh] aspect-square bg-[#fdfbf7] rounded-xl shadow-2xl border-4 overflow-hidden mx-auto mt-2 font-kai cursor-crosshair ${profTheme.border} ${profTheme.shadow}`}>
        {/* 1. 背景大字 (Shadow Character) - 淺灰色 */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
             <span className="text-[380px] font-kai text-slate-200 opacity-60" style={{ fontFamily: '"Free HK Kai", "DFKai-SB", "KaiTi", "標楷體", "TW-Kai", "BiauKai", "Kaiti SC", "STKaiti", serif' }}>
                 {currentChar.char}
             </span>
        </div>

        {/* 背景格線 (米字格) */}
        <svg width="100%" height="100%" viewBox="0 0 100 100" className="absolute inset-0 opacity-20 pointer-events-none">
          <line x1="0" y1="0" x2="100" y2="100" stroke="red" strokeWidth="0.5" strokeDasharray="2,2" />
          <line x1="100" y1="0" x2="0" y2="100" stroke="red" strokeWidth="0.5" strokeDasharray="2,2" />
          <line x1="50" y1="0" x2="50" y2="100" stroke="red" strokeWidth="0.5" />
          <line x1="0" y1="50" x2="100" y2="50" stroke="red" strokeWidth="0.5" />
          <rect x="0" y="0" width="100" height="100" stroke="red" strokeWidth="1" fill="none"/>
        </svg>

        {/* 漢字渲染 - 使用 Make Me A Hanzi 座標系 (1024x1024) */}
        <svg width="100%" height="100%" viewBox="0 0 1024 1024" className="absolute inset-0">
          <g transform="scale(1, -1) translate(0, -900)">
            {/* 已完成的筆劃 */}
            {completedStrokes.map(stroke => (
              <path 
                key={stroke.id}
                d={stroke.svg}
                fill="black" 
                className="animate-draw"
              />
            ))}

            {/* 當前提示筆劃 */}
            {currentStroke && (
              <g>
                 {/* 筆劃輪廓 (淡色填充) */}
                 <path 
                  d={currentStroke.svg}
                  fill="rgba(255, 165, 0, 0.2)" 
                  stroke="rgba(255, 165, 0, 0.5)"
                  strokeWidth="5"
                  className="animate-pulse"
                />
                
                {/* 筆劃中線 (紅色虛線引導) */}
                <path
                  d={`M ${currentStroke.medians.map(p => p.join(' ')).join(' L ')}`}
                  stroke="red"
                  strokeWidth="10"
                  fill="none"
                  strokeDasharray="20,20"
                  className="animate-pulse"
                  strokeLinecap="round"
                />
                
                {/* 起點圓點 */}
                <circle cx={currentStroke.medians[0][0]} cy={currentStroke.medians[0][1]} r="15" fill="red" />
                {/* 終點圓點 */}
                <circle cx={currentStroke.medians[currentStroke.medians.length-1][0]} cy={currentStroke.medians[currentStroke.medians.length-1][1]} r="15" fill="green" />
              </g>
            )}
          </g>
        </svg>
        
        {/* 工具圖標 (跟隨當前筆劃起點) */}
        {(currentStroke || (isAnimating && animationPoint)) && (() => {
           const point = (isAnimating && animationPoint) ? animationPoint : (currentStroke ? currentStroke.medians[0] : null);
           
           if (!point) return null;
           
           const pos = getPosition(point[0], point[1]);
           
           // 根據職業顯示不同圖標
           const profIcon = gameLevelData && gameLevelData.profession.id === 'wood' ? <Icons.Hammer size={24} /> :
                            gameLevelData && gameLevelData.profession.id === 'grain' ? <Icons.Seed size={24} /> :
                            gameLevelData && gameLevelData.profession.id === 'fire' ? <Icons.Fire size={24} /> :
                            gameLevelData && gameLevelData.profession.id === 'speech' ? <Icons.Brush size={24} /> :
                           <Icons.Hammer size={24} />;

           return (
            <div 
              className={`absolute ${isAnimating ? '' : 'transition-all duration-500'}`}
              style={{
                left: pos.left,
                top: pos.top,
                transform: 'translate(-50%, -50%)',
              }}
            >
               <div className={`text-white p-2 rounded-full shadow-lg border-2 border-white ${profTheme.highlight.replace('text-', 'bg-')}`}>
                  {profIcon}
               </div>
            </div>
           );
        })()}

        {correctBurst && (
          <div
            className="pointer-events-none absolute z-30 encourage-float"
            style={{ left: correctBurst.x, top: correctBurst.y, transform: 'translate(-50%, -50%)' }}
          >
            <span className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-300/50 blur-md encourage-burst" />
            <span className="absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-amber-300/80 encourage-burst" />
            <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500" />
          </div>
        )}

        {/* 錯誤引導大箭頭 */}
        {showGuideArrow && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50 bg-black/20">
             <div 
                className="text-9xl text-yellow-400 animate-bounce drop-shadow-lg transition-transform"
                style={{
                  transform: 
                    showGuideArrow === 'right' ? 'rotate(0deg)' : 
                    showGuideArrow === 'down' ? 'rotate(90deg)' : 
                    showGuideArrow === 'left' ? 'rotate(180deg)' : 
                    showGuideArrow === 'up' ? 'rotate(-90deg)' : 
                    showGuideArrow === 'left-down' ? 'rotate(135deg)' : 
                    showGuideArrow === 'right-down' ? 'rotate(45deg)' : 'rotate(0deg)'
                }}
             >
                ➜
             </div>
          </div>
        )}
      </div>
    );
  };

  const activeProfessionId = gameLevelData?.profession?.id || PROFESSION_LEVELS[level]?.id || 'wood';
  const activeProfessionTheme = getProfessionTheme(activeProfessionId);
  const activeFxTheme = getProfessionFxTheme(activeProfessionId);

  return (
    <div className={`min-h-screen bg-amber-50 text-slate-800 font-sans flex flex-col items-center bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]`}>
      
      <header className="w-full max-w-md flex justify-between items-center p-4 shrink-0 z-50">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-amber-700 font-kai drop-shadow-sm">
          <div className="bg-amber-500 text-white px-2 py-1 rounded-lg shadow-sm">狀元</div>
          行行出狀元
        </h1>
        
        {/* 藍牙狀態顯示 */}
        <div className="flex items-center gap-2">
          {batteryLevel !== null && (
             <div className={`text-sm px-3 py-1 rounded-full flex items-center gap-1 shadow-sm ${batteryLevel <= 10 ? 'bg-red-100 text-red-700 border border-red-300 animate-pulse' : 'bg-green-100 text-green-700 border border-green-300'}`}>
                <span>🔋</span>
                <span className="font-bold">{batteryLevel}%</span>
             </div>
          )}
          <button
            type="button"
            onClick={onToggleMusic}
            className={`text-sm px-3 py-1 rounded-full flex items-center gap-2 shadow-sm border transition-colors ${
              musicEnabled
                ? 'bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-200'
                : 'bg-slate-200 text-slate-600 border-slate-300 hover:bg-slate-300'
            }`}
            aria-pressed={musicEnabled}
            aria-label={musicEnabled ? '關閉背景音樂' : '開啟背景音樂'}
            title={musicEnabled ? '關閉背景音樂' : '開啟背景音樂'}
          >
            {musicEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            <span>{musicEnabled ? '音樂開' : '音樂關'}</span>
          </button>
          <button
            onClick={() => window.location.assign('/debug')}
            className="text-xs px-3 py-1 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 shadow-sm"
          >
            調試
          </button>
          <div className={`text-sm px-3 py-1 rounded-full flex items-center gap-2 shadow-sm ${isConnected ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-slate-200 text-slate-600'}`}>
            <Bluetooth size={14} className={isConnected ? "text-green-600" : "text-slate-400"} /> 
            <span>{isConnected ? '已連接' : '未連接'}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full flex flex-col items-center p-4 pb-20 relative">
      {/* 電池警告彈窗 */}
      {batteryWarning && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[100] animate-bounce">
          <div className="bg-red-500 text-white px-6 py-4 rounded-full shadow-2xl font-bold flex items-center gap-3 border-4 border-red-700">
            <span className="text-2xl">⚠️</span>
            <span className="text-lg">注意：Micro:bit 電池快沒電了 (低於10%)！</span>
            <button 
                onClick={() => setBatteryWarning(false)} 
                className="ml-4 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl transition-colors"
            >
                我知道了
            </button>
          </div>
        </div>
      )}

      {gameState === GAME_STATE.MENU && (
        <div className="w-full max-w-6xl flex flex-col items-center">
          
          {/* 未連接時顯示首頁 (Landing Page) */}
          {!isConnected ? (
            <div className="flex flex-col md:flex-row items-center justify-center gap-12 w-full px-4 py-8 animate-fade-in relative">
              
              {/* 背景裝飾圖標 (Background Icons) */}
              <div className="absolute top-10 left-10 opacity-10 rotate-12 pointer-events-none text-amber-800"><Icons.Hammer size={120} /></div>
              <div className="absolute bottom-10 right-10 opacity-10 -rotate-12 pointer-events-none text-green-800"><Icons.Seed size={120} /></div>
              <div className="absolute top-20 right-20 opacity-10 rotate-45 pointer-events-none text-red-800"><Icons.Fire size={80} /></div>

              {/* 左側：品牌與故事 (Left Column: Brand & Story) */}
              <div className="flex-1 text-center md:text-left space-y-8 max-w-xl z-10">
                  <div className="relative inline-block">
                      <h1 className="text-6xl md:text-8xl font-bold text-amber-700 drop-shadow-lg font-kai tracking-wide leading-tight">
                        行行出狀元
                      </h1>
                      <div className="absolute -top-6 -right-8 text-5xl animate-bounce">🎓</div>
                  </div>
                  
                  <div className="bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-xl border-l-8 border-amber-500 text-left transform transition-all hover:scale-[1.02] relative overflow-hidden">
                      <div className="absolute -right-10 -top-10 opacity-5 pointer-events-none"><Award size={150} /></div>
                      <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-3">
                          <span className="text-3xl bg-amber-100 p-2 rounded-lg">🏆</span> 行行出狀元：狀元試煉場
                      </h2>
                      <p className="text-slate-600 leading-relaxed font-kai text-xl">
                          想成為狀元，先要通過試煉。<br/>
                          你的 <span className="text-blue-600 font-bold bg-blue-50 px-2 rounded border border-blue-200">Micro:bit</span> 就是一把「百變工具」。
                          <br/><br/>
                          你會前往木工坊、田園、廚房和書院，體驗不同職業並完成任務；每次過關都會掉落一件狀元帽配件，還會保留對應的徽章。
                          <br/><br/>
                          集齊四界配件後，就能親手合成狀元帽，正式成為小小狀元！✨
                      </p>
                  </div>
              </div>

              {/* 右側：操作面板 (Right Column: Actions) */}
              <div className="flex-1 w-full max-w-md bg-white/95 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-2xl border-4 border-white relative overflow-hidden group hover:border-blue-200 transition-colors duration-500 z-10">
                  {/* 裝飾背景 */}
                  <div className="absolute top-0 right-0 w-48 h-48 bg-blue-100 rounded-full blur-3xl -z-10 opacity-70"></div>
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-100 rounded-full blur-3xl -z-10 opacity-70"></div>

                  <div className="space-y-8 relative z-10">
                      <div className="text-center mb-4">
                          <h3 className="text-xl font-bold text-slate-500 font-kai tracking-widest">準備開始狀元試煉了嗎？</h3>
                      </div>

                      <div className="flex flex-col gap-4 w-full">
                        <button
                          onClick={onToggleMusic}
                          className={`w-full rounded-2xl border px-5 py-4 text-left shadow-sm transition-all hover:-translate-y-0.5 ${
                            musicEnabled
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                              : 'border-slate-200 bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`rounded-full p-2 ${musicEnabled ? 'bg-emerald-100' : 'bg-slate-200'}`}>
                              {musicEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                            </div>
                            <div>
                              <div className="font-bold">{musicEnabled ? '背景音樂已開啟' : '背景音樂已關閉'}</div>
                              <div className="mt-1 text-sm leading-6 opacity-80">
                                開啟後整個 app 都會播放；進入選關與遊戲時會自動降低音量，讓鼓勵音效更清楚。
                              </div>
                            </div>
                          </div>
                        </button>

                        <button 
                          onClick={connectMicrobit}
                          disabled={bleSupport.status === 'loading'}
                          className="w-full group relative px-8 py-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-2xl font-bold rounded-2xl shadow-xl shadow-blue-200/50 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-4 border-b-4 border-blue-800"
                        >
                          <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                          <Bluetooth size={32} className="animate-pulse" /> 
                          <span>{bleSupport.status === 'loading' ? '檢查藍牙中...' : '連結Micro:bit'}</span>
                        </button>

                        <div className={`rounded-2xl border px-4 py-4 text-left text-sm shadow-sm ${
                          bleSupport.status === 'ready'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : bleSupport.status === 'needs-extension'
                              ? 'bg-amber-50 border-amber-200 text-amber-900'
                              : bleSupport.status === 'error'
                                ? 'bg-red-50 border-red-200 text-red-700'
                                : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}>
                          <div className="font-bold mb-2">藍牙環境</div>
                          <div>{getBlePlatformHint(bleSupport)}</div>
                          {connectionStep && (
                            <div className="mt-2 text-xs font-semibold opacity-80">目前步驟：{connectionStep}</div>
                          )}
                          {bleSupport.isIOSSafari && (
                            <div className="mt-3 space-y-2">
                              <div className="text-xs font-bold uppercase tracking-wide opacity-70">iPad Safari 連線前</div>
                              <ol className="list-decimal pl-5 space-y-1">
                                {getBleInstallSteps().map((step) => (
                                  <li key={step}>{step}</li>
                                ))}
                              </ol>
                              <a
                                href={getBleSetupUrl()}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex rounded-xl bg-white px-3 py-2 font-semibold text-blue-600 shadow-sm ring-1 ring-blue-200 hover:bg-blue-50"
                              >
                                打開 WebBLE 安裝頁
                              </a>
                            </div>
                          )}
                        </div>

                        <button 
                           onClick={startGame}
                           className="w-full py-4 bg-white hover:bg-amber-50 text-slate-500 hover:text-amber-600 font-bold rounded-2xl border-2 border-slate-200 hover:border-amber-200 transition-all hover:shadow-md flex items-center justify-center gap-2 group"
                        >
                           <span className="group-hover:scale-110 transition-transform">🚀</span>
                           <span className="text-lg">跳過連接，前往選關</span>
                        </button>
                      </div>

                      {/* 錯誤提示區域 */}
                      {connectionError && (
                        <div className="mt-2 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl flex items-start gap-2 animate-shake shadow-sm">
                          <Zap size={16} className="mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-bold">{connectionError}</div>
                            {bleSupport.isIOSSafari && (
                              <a
                                href={getBleSetupUrl()}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-1 inline-flex text-xs font-semibold text-blue-600 hover:text-blue-700"
                              >
                                查看 iPad Safari 安裝步驟
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                  </div>
              </div>
            </div>
          ) : (
            /* 已連接時顯示準備大廳 (Lobby) */
            <div className="bg-white/80 backdrop-blur-md p-8 md:p-12 rounded-[2rem] shadow-2xl text-center max-w-2xl w-full border-4 border-green-200 animate-fade-in-up">
              <div className="mb-6 inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full text-green-500 mb-6 shadow-inner">
                 <Bluetooth size={48} />
              </div>
              
              <h2 className="text-4xl font-bold mb-2 text-slate-800 font-kai">連接成功！</h2>
              <p className="text-slate-500 mb-8 font-medium text-lg">百變工具已就緒，準備上工！</p>
              {deviceName && (
                <div className="mb-4 text-sm text-slate-500">已連接裝置：{deviceName}</div>
              )}
              {connectionStep && (
                <div className="mb-6 text-xs font-semibold tracking-wide uppercase text-green-700">狀態：{connectionStep}</div>
              )}
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={startGame}
                  className="w-full py-4 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white text-2xl font-bold rounded-2xl flex items-center justify-center gap-3 transition-all transform hover:scale-105 shadow-xl shadow-orange-200 border-b-4 border-orange-700"
                >
                  <Play size={28} fill="currentColor" /> 
                  選擇部首關卡
                </button>
              </div>
              
              <button 
                 onClick={onDisconnected}
                 className="mt-6 text-slate-400 hover:text-red-400 text-sm flex items-center justify-center gap-2 transition-colors"
              >
                 斷開連接
              </button>
            </div>
          )}
        </div>
      )}

      {gameState === GAME_STATE.LEVEL_SELECT && (
        <div className="w-full max-w-6xl space-y-6 animate-fade-in px-2">
          <div className="bg-white/85 backdrop-blur-md p-6 md:p-8 rounded-[2rem] shadow-xl border-4 border-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="text-sm font-bold tracking-[0.3em] text-amber-600 mb-2">職業試煉</div>
                <h2 className="text-3xl md:text-4xl font-bold text-slate-800 font-kai">選擇想先體驗的職業試煉</h2>
                <p className="text-slate-500 mt-2">可自由進入任一職業世界，系統會保留通關進度、徽章與已收集的狀元帽配件。</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="px-4 py-2 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 font-bold">
                  已通關 {PROFESSION_LEVELS.filter((item) => completedLevels[item.id]).length} / {PROFESSION_LEVELS.length}
                </div>
                {isConnected && (
                  <div className="px-4 py-2 rounded-2xl bg-blue-50 border border-blue-200 text-blue-800 font-bold">
                    A 切換關卡 · B 進入 · A+B 返回
                  </div>
                )}
                <button
                  onClick={returnToMenu}
                  className="px-4 py-2 rounded-2xl bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-50 font-bold"
                >
                  返回首頁
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
            {PROFESSION_LEVELS.map((levelItem, index) => {
              const theme = getProfessionTheme(levelItem.id);
              const isCompleted = Boolean(completedLevels[levelItem.id]);
              const isSelected = index === levelSelectCursor;

              return (
                <button
                  key={levelItem.id}
                  onClick={() => selectLevel(index)}
                  className={`text-left p-4 md:p-5 rounded-2xl border-2 bg-white/95 shadow-md transition-all hover:-translate-y-0.5 hover:shadow-xl ${theme.border} ${
                    isSelected ? 'ring-4 ring-amber-300/80 -translate-y-0.5 shadow-xl' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${theme.bg} ${theme.text}`}>
                        <span className="text-lg leading-none">{levelItem.radical}</span>
                        <span className="tracking-wide">{levelItem.radicalLabel}</span>
                      </div>
                      <h3 className="mt-3 text-lg md:text-xl font-bold text-slate-800 font-kai">{levelItem.title}</h3>
                    </div>
                    <div className={`shrink-0 w-11 h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center ${theme.bg} ${theme.text}`}>
                      {React.cloneElement(levelItem.icon, { size: 22 })}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">生字 {levelItem.chars.length}</span>
                    <span className={`px-2.5 py-1 rounded-full ${isCompleted ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'}`}>
                      {isCompleted ? '通關' : '未通關'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {gameState === GAME_STATE.TEST && (
         <div className="w-full max-w-md space-y-4 animate-fade-in">
             <div className="flex items-center gap-2 mb-4">
                <button onClick={returnToMenu} className="p-2 hover:bg-slate-200 rounded-full text-slate-600">
                    <RotateCcw size={24} />
                </button>
                <h2 className="text-2xl font-bold font-kai text-slate-800">測試模式</h2>
             </div>

             <form onSubmit={handleTestSubmit} className="flex gap-2">
                 <input 
                   type="text" 
                   maxLength="1"
                   value={testCharInput}
                   onChange={(e) => setTestCharInput(e.target.value)}
                   placeholder="輸入一個漢字..."
                   className="flex-1 bg-white border-2 border-slate-300 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:border-amber-500 text-center font-kai text-xl shadow-sm"
                 />
                 <button 
                   type="submit"
                   disabled={isLoadingChar || !testCharInput}
                   className="bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 text-white px-6 py-2 rounded-xl font-bold transition-colors shadow-sm"
                 >
                    {isLoadingChar ? '...' : '加載'}
                 </button>
             </form>

             {/* 常用字快速選擇 */}
             <div className="flex flex-wrap gap-2 justify-center">
                 {['永', '我', '愛', '你', '龍'].map(char => (
                     <button 
                       key={char}
                       onClick={() => { setTestCharInput(char); fetchCharacterData(char); }}
                       className="bg-white hover:bg-slate-50 px-4 py-2 rounded-lg text-slate-600 font-kai border border-slate-200 shadow-sm"
                     >
                        {char}
                     </button>
                 ))}
             </div>

             {testError && (
                 <div className="text-red-600 text-sm text-center bg-red-100 p-3 rounded-xl border border-red-200">{testError}</div>
             )}

             {testCharacter && (
                 <>
                    {/* 狀態列 */}
                    <div className="flex justify-between items-center bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-sm">
                        <div className="flex flex-col">
                        <span className="text-xs text-slate-400 font-bold">當前測試</span>
                        <span className="text-3xl font-bold text-slate-800 font-kai">{testCharacter.char}</span>
                        </div>
                        <div className="flex-1 text-right">
                           <span className="text-slate-500 text-sm font-bold bg-slate-100 px-3 py-1 rounded-full">筆劃: {currentStrokeIndex + 1} / {testCharacter.strokes.length}</span>
                        </div>
                    </div>

                    {/* 遊戲主畫布 */}
                    {renderCanvas()}

                    {/* 提示與回饋 */}
                    <div className={`p-6 rounded-2xl text-center transition-colors duration-300 border-2 shadow-sm ${
                        feedbackType === 'success' ? 'bg-green-100 border-green-300 text-green-800' : 
                        feedbackType === 'error' ? 'bg-red-100 border-red-300 text-red-800' : 
                        'bg-white border-slate-200 text-slate-600'
                    }`}>
                        <div className="text-xl font-bold mb-2 font-kai">
                        {feedback || "等待指令..."}
                        </div>
                        <div className="text-base opacity-90 font-kai text-amber-600 font-medium">
                           {/* 顯示具身認知動作提示 */}
                           {gameLevelData && gameLevelData.action_cue ? gameLevelData.action_cue : 
                            (gameLevelData && gameLevelData.strokes[currentStrokeIndex] ? `下一筆：${gameLevelData.strokes[currentStrokeIndex].hint}` : "完成！")}
                        </div>
                    </div>
                 </>
             )}
         </div>
      )}

      {gameState === GAME_STATE.PLAYING && (
        <div className="w-full max-w-6xl flex-1 flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 overflow-y-auto md:overflow-visible p-2 md:p-4 scrollbar-hide">
          
          {/* 左側面板：信息與提示 (Left Panel: Info & Hints) */}
          <div className="flex-1 w-full max-w-md flex flex-col gap-4 md:gap-6 order-2 md:order-1 pb-10 md:pb-0">
              
              {/* 1. 狀態與進度卡片 */}
              <div className="bg-white p-6 rounded-3xl border-2 border-slate-100 shadow-lg relative overflow-hidden">
                  <div className={`absolute top-0 left-0 w-2 h-full ${activeProfessionTheme.bg.replace('bg-', 'bg-')}`}></div>
                  <div className="flex justify-between items-start mb-4">
                      <div>
                          <div className={`text-sm font-bold tracking-wider uppercase mb-1 ${activeProfessionTheme.highlight}`}>
                              {gameLevelData ? `${gameLevelData.profession.radicalLabel} ${gameLevelData.profession.title}` : '...'}
                          </div>
                          <div className="font-bold text-slate-800 font-kai leading-none text-[clamp(4.5rem,12vw,8rem)]">{gameLevelData ? gameLevelData.char : '...'}</div>
                      </div>
                      <div className="text-right">
                          <div className="text-xs text-slate-400 font-bold mb-1">剩餘時間</div>
                          <div className={`text-3xl font-mono font-bold ${timeLeft < 15 ? 'text-red-500 animate-pulse' : 'text-slate-700'}`}>
                              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                          </div>
                      </div>
                  </div>
                  
                  {/* 工具標籤 */}
                  {gameLevelData && gameLevelData.tool && (
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold ${activeProfessionTheme.bg} ${activeProfessionTheme.text}`}>
                          <span>{gameLevelData.tool}</span>
                      </div>
                  )}

                  {/* 進度條 */}
                  <div className="mt-6 h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${timeLeft < 15 ? 'bg-red-500' : 'bg-green-500'}`}
                        style={{ width: `${(timeLeft / 90) * 100}%` }}
                      />
                  </div>
              </div>

              {/* 3. 師傅口訣 (底部信息) */}
              {gameLevelData && gameLevelData.action_cue && (
                  <div className={`p-5 rounded-3xl border-2 border-dashed bg-white/60 backdrop-blur-sm ${activeProfessionTheme.border.replace('border-', 'border-opacity-50 ')}`}>
                      <div className="flex items-start gap-4">
                          <div className="bg-yellow-100 p-2 rounded-xl text-2xl shadow-sm">💡</div>
                          <div>
                              <div className={`text-xs font-bold uppercase tracking-wider opacity-60 mb-1 ${activeProfessionTheme.text}`}>
                                  師傅口訣
                              </div>
                              <div className={`text-lg font-medium leading-snug ${activeProfessionTheme.text}`}>
                                  {gameLevelData.action_cue}
                              </div>
                          </div>
                      </div>
                  </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={skipCurrentCharacter}
                  className="w-full py-3 rounded-2xl bg-white border-2 border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors"
                >
                  跳過本字
                </button>
                <button
                  onClick={skipCurrentLevel}
                  className="w-full py-3 rounded-2xl bg-slate-700 text-white font-bold hover:bg-slate-800 transition-colors"
                >
                  跳過本關
                </button>
              </div>
          </div>

          {/* 右側面板：主畫布 (Right Panel: Main Canvas) */}
          <div className="flex-none w-full max-w-[320px] md:max-w-none md:w-auto h-auto md:h-[80vh] aspect-square order-1 md:order-2 flex flex-col justify-center relative shrink-0">
              {/* 畫布容器 */}
              {renderCanvas()}
              
              {/* 懸浮提示框 (Pop-up Hint) - 指引 (錯誤後才顯示) */}
              {gameLevelData && gameLevelData.strokes[currentStrokeIndex] && !isAnimating && showHint && (
                <div className="absolute top-1/2 left-[70%] transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20 animate-bounce">
                    <div className={`px-8 py-4 rounded-full shadow-2xl border-[5px] bg-white text-slate-800 font-bold text-4xl whitespace-nowrap ${getProfessionTheme(gameLevelData.profession.id).border}`}>
                        {gameLevelData.strokes[currentStrokeIndex].hint.replace('請揮動: ', '')}
                    </div>
                </div>
              )}

              {/* 結果彈出提示 */}
              {showPopupHint && (
                <div className="absolute top-1/2 left-[70%] transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30 animate-ping-once">
                    <div className={`px-8 py-5 rounded-[2rem] shadow-2xl border-[6px] font-bold text-3xl whitespace-nowrap transform scale-110
                        ${showPopupHint.type === 'success' ? 'bg-green-50 border-green-400 text-green-600' : 'bg-red-50 border-red-400 text-red-600'}
                    `}>
                        {showPopupHint.text}
                    </div>
                </div>
              )}

              {wordCelebration && (
                <div className="absolute inset-x-8 bottom-4 z-30 pointer-events-none ceremony-pop">
                    <div className="rounded-[2rem] border-2 border-emerald-200 bg-white/95 px-5 py-4 shadow-2xl">
                        <div className="text-center">
                            <div className="inline-flex rounded-full bg-emerald-100 px-4 py-1 text-xs font-bold tracking-wide text-emerald-700">
                                {wordCelebration.label}
                            </div>
                            <div className="mt-3 text-3xl font-black text-emerald-600">{wordCelebration.bonusText}</div>
                        </div>
                    </div>
                </div>
              )}

              {/* 底部職業心法 (Desc) - 已移除 */}
          </div>
        </div>
      )}

      {gameState === GAME_STATE.CHAR_PREVIEW && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 animate-fade-in">
          <button
            type="button"
            onClick={skipPronunciationPreview}
            className={`w-[min(55vw,55vh)] min-w-[260px] aspect-square rounded-[2.5rem] shadow-2xl text-center border-4 flex items-center justify-center ${getProfessionTheme(gameLevelData?.profession?.id).bg} ${getProfessionTheme(gameLevelData?.profession?.id).border}`}
          >
            <span className="block font-kai text-slate-800 drop-shadow-sm leading-none text-[min(38vw,38vh)]">
              {isLoadingLevel || !gameLevelData ? '...' : gameLevelData.char}
            </span>
          </button>
        </div>
      )}

      {gameState === GAME_STATE.WON && (
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl text-center max-w-md w-full border-4 border-amber-200 animate-bounce-in">
          <div className="mb-6 text-8xl filter drop-shadow-md">🏆</div>
          <h2 className="text-3xl font-bold mb-4 text-amber-600 font-kai">狀元及第！</h2>
          <p className="text-slate-600 mb-8 font-kai text-lg leading-relaxed">太棒了！<br/>你已完成四方試煉，集齊配件做好狀元帽，正式成為小小狀元！</p>
          <div className="flex justify-center gap-4">
             <button 
              onClick={startGame}
              className="px-8 py-4 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-2xl flex items-center gap-3 shadow-lg shadow-amber-200 transition-transform hover:scale-105 border-b-4 border-amber-700"
            >
              <RotateCcw size={24} /> 再玩一次
            </button>
          </div>
        </div>
      )}

      {/* 成就結算畫面 */}
      <AchievementModal 
        visible={gameState === GAME_STATE.ACHIEVEMENT}
        levelTime={lastLevelDuration}
        totalTime={totalGameTime}
        onNext={handleNextLevel}
        onMenu={() => {
          returnToMenu();
        }}
        profession={PROFESSION_LEVELS[level]}
        ceremony={levelCeremonyPayload}
        nextLabel="返回選關"
      />

      {showCelebration && (
        <div className="fixed inset-0 z-[60] pointer-events-none overflow-hidden">
          <span className="confetti-piece confetti-piece--a" />
          <span className="confetti-piece confetti-piece--b" />
          <span className="confetti-piece confetti-piece--c" />
          <span className="confetti-piece confetti-piece--d" />
          <span className="confetti-piece confetti-piece--e" />
          <span className="confetti-piece confetti-piece--f" />
          <span className="confetti-piece confetti-piece--g" />
          <span className="confetti-piece confetti-piece--h" />
          <span className="confetti-piece confetti-piece--i" />
          <span className="confetti-piece confetti-piece--j" />
          <span className="confetti-piece confetti-piece--k" />
          <span className="confetti-piece confetti-piece--l" />
        </div>
      )}

      {levelCeremonyPayload && gameState !== GAME_STATE.ACHIEVEMENT && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
          <div className={`ceremony-pop w-full max-w-2xl rounded-[2.5rem] border-4 bg-white/95 px-8 py-8 text-center shadow-2xl ${getProfessionTheme(levelCeremonyPayload.profession.id).border}`}>
            <div className={`mx-auto inline-flex rounded-full px-5 py-2 text-sm font-bold tracking-[0.2em] ${getProfessionFxTheme(levelCeremonyPayload.profession.id).label}`}>
              {levelCeremonyPayload.rewardAccent}
            </div>
            <div className="mt-5 text-4xl font-bold text-slate-800 font-kai md:text-5xl">{levelCeremonyPayload.title}</div>
            <div className="mt-4 text-lg leading-8 text-slate-500 md:text-xl">{levelCeremonyPayload.subtitle}</div>
            <div className="mt-6 rounded-[2rem] border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-orange-50 px-6 py-6 shadow-inner">
              <div className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">本關收成</div>
              <div className="mt-4 inline-flex rounded-full bg-slate-900 px-5 py-2 text-sm font-bold tracking-[0.18em] text-white">
                重點獎勵
              </div>
              <div className="mt-4 text-4xl font-black text-amber-600 md:text-5xl">{levelCeremonyPayload.rewardLabel}</div>
              <div className="mt-4 text-base leading-7 text-slate-600 md:text-lg">{levelCeremonyPayload.rewardSummary}</div>
            </div>
          </div>
        </div>
      )}

       {gameState === GAME_STATE.LEVEL_INTRO && PROFESSION_LEVELS[level] && (
        <div className={`p-6 md:p-8 rounded-[2.5rem] shadow-2xl text-center max-w-md w-full border-4 ${getProfessionTheme(PROFESSION_LEVELS[level].id).bg} ${getProfessionTheme(PROFESSION_LEVELS[level].id).border} animate-fade-in-up flex flex-col h-[min(82svh,720px)] overflow-hidden`}>
            <div className="text-6xl md:text-7xl mb-4 animate-bounce filter drop-shadow-md">
                {PROFESSION_LEVELS[level].icon}
            </div>
            <h2 className={`text-3xl md:text-4xl font-bold mb-3 font-kai ${getProfessionTheme(PROFESSION_LEVELS[level].id).text}`}>
                {PROFESSION_LEVELS[level].title}
            </h2>
            <div className="mb-3 flex flex-wrap justify-center gap-2">
              <span className="px-4 py-1.5 rounded-full bg-white/70 text-slate-700 font-bold">
                部首：{PROFESSION_LEVELS[level].radicalLabel}
              </span>
              <span className="px-4 py-1.5 rounded-full bg-white/70 text-slate-700 font-bold">
                生字：{PROFESSION_LEVELS[level].chars.length} 個
              </span>
              {completedLevels[PROFESSION_LEVELS[level].id] && (
                <span className="px-4 py-1.5 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold">
                  已通關
                </span>
              )}
            </div>
            <p className="text-slate-600 mb-4 font-kai text-lg md:text-xl font-medium">
                {PROFESSION_LEVELS[level].desc}
            </p>
            
            {/* 職業意境圖 (改為更溫馨的風格) */}
            <div className="w-full flex-1 bg-white/30 rounded-2xl mb-4 border-2 border-white/40 overflow-hidden relative shadow-inner">
                {getLevelIntroBackgroundSrc(PROFESSION_LEVELS[level].id) ? (
                  <img
                    src={getLevelIntroBackgroundSrc(PROFESSION_LEVELS[level].id)}
                    alt=""
                    className="w-full h-full object-contain"
                  />
                ) : null}
            </div>

            <div className="mt-auto flex flex-col sm:flex-row gap-3">
              <button 
                  onClick={startCurrentLevel}
                  className={`flex-1 py-4 text-white text-xl font-bold rounded-2xl flex items-center justify-center gap-3 transition-all hover:scale-105 shadow-xl bg-slate-700 hover:bg-slate-600 border-b-4 border-slate-900`}
              >
                  <Play size={24} fill="currentColor" /> 開始試煉
              </button>
              <button
                  onClick={goToLevelSelect}
                  className="flex-1 py-4 bg-white/80 hover:bg-white text-slate-700 text-lg font-bold rounded-2xl border-2 border-white/80 transition-colors"
              >
                  返回選關
              </button>
            </div>
        </div>
      )}

      {gameState === GAME_STATE.LOST && (
        <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-md w-full border-4 border-slate-300">
          <div className="mb-4 text-6xl">⏰</div>
          <h2 className="text-2xl font-bold mb-2 text-slate-700 font-kai">力氣用盡了...</h2>
          <p className="text-slate-500 mb-6 font-kai">別氣餒，小學徒！<br/>休息一下，重新握好工具再挑戰！</p>
          <button 
            onClick={startGame}
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg"
          >
            <RotateCcw size={18} /> 重新選關
          </button>
        </div>
      )}

      <div className="mt-8 text-xs text-slate-500 max-w-xs text-center shrink-0 pb-8">
         科技展專用原型 v2.2 | React + Vite + Micro:bit
      </div>
      </main>

      {/* 調試模式切換 */}
      <div className="fixed bottom-4 left-4 z-50">
         <button 
           onClick={() => setShowDebug(!showDebug)}
           className="text-xs bg-black/50 text-white px-2 py-1 rounded hover:bg-black/70"
         >
           {showDebug ? '關閉調試' : '開啟調試'}
         </button>
      </div>

      {/* 調試面板 */}
      {showDebug && (
        <div className="fixed bottom-12 left-4 z-50 w-64 h-64 bg-black/80 text-green-400 font-mono text-xs p-2 rounded overflow-y-auto border border-green-500/30">
           <div className="font-bold border-b border-green-500/30 mb-1 pb-1 flex justify-between">
              <span>信號日誌</span>
              <span onClick={() => setDebugLogs([])} className="cursor-pointer hover:text-white">清除</span>
           </div>
           {debugLogs.length === 0 && <div className="opacity-50 italic">等待信號...</div>}
           {debugLogs.map((log, i) => (
             <div key={i} className="mb-1 break-words">{log}</div>
           ))}
        </div>
      )}

    </div>
  );
};

export default GeminiApp;
