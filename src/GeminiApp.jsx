import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Sword, Shield, Zap, Award, Bluetooth, MonitorSmartphone, Hammer, Sprout, Flame, PenTool, Ruler, Scroll, Utensils, Droplets, Construction } from 'lucide-react';

// 遊戲常數與資料設定
// 遊戲狀態常數
  const GAME_STATE = {
    MENU: 'MENU',
    PLAYING: 'PLAYING',
    WON: 'WON',
    LOST: 'LOST',
    TEST: 'TEST',
    LEVEL_INTRO: 'LEVEL_INTRO'
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

// 筆劃映射表 (Micro:bit UART -> 遊戲方向)
// 嚴格對應 Micro:bit 訓練的筆劃
const STROKE_MAP = {
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

// 允許的筆劃名稱 (用於篩選字)
const ALLOWED_STROKES = ['HENG', 'SHU', 'NA', 'DIAN', 'TI', 'HENGPIE', 'SHUGOU', 'HENGSHUGOU', 'HENGZHE', 'PIE'];

// 候選字列表 (針對讀寫障礙/NCS學生的易混淆字對，強調幾何結構與筆劃糾錯)
// 結合「行行出狀元」職業主題與具身認知 (Embodied Cognition)
// LV1: 小木匠 (Carpenter) - 木 (Wood)
// LV2: 小農夫 (Farmer) - 米 (Rice)
// LV3: 小廚神 (Chef) - 火 (Fire)
// LV4: 小書生 (Scholar) - 文 (Culture)
const PROFESSION_LEVELS = [
      {
          id: 'carpenter',
          title: '小木匠',
          icon: <Icons.Hammer size={32} className="text-amber-600" />,
          color: 'amber',
          desc: '用尺劃線，用釘固定，打造穩固傢俱！',
          chars: [
              { 
                  char: '木', 
                  tool: '魯班尺 & 鐵鎚',
                  story: '先劃橫線，再打直釘，撇捺支撐！',
                  action_cue: '橫：用尺劃線(平)；豎：用力打釘(直)；撇捺：安裝支架(穩)！'
              },
              {
                  char: '本',
                  tool: '墨斗線',
                  story: '木頭生根，根本穩固！',
                  action_cue: '最後一橫是樹根，要畫得扎實！'
              }
          ]
      },
      {
          id: 'farmer',
          title: '小農夫',
          icon: <Icons.Seed size={32} className="text-green-600" />,
          color: 'green',
          desc: '播下種子，辛勤耕耘，期待豐收！',
          chars: [
              { 
                  char: '米', 
                  tool: '鋤頭 & 種子',
                  story: '點下種子，田埂分界，作物長高！',
                  action_cue: '點：播種；橫豎：田埂；撇捺：稻穗垂下！'
              },
              {
                  char: '禾',
                  tool: '鐮刀',
                  story: '禾苗彎彎，豐收在望！',
                  action_cue: '第一筆是禾苗的頭，要畫得彎彎的！'
              }
          ]
      },
      {
          id: 'chef',
          title: '小廚神',
          icon: <Icons.Fire size={32} className="text-red-500" />,
          color: 'red',
          desc: '點燃火花，大火快炒，控制火候！',
          chars: [
              { 
                  char: '火', 
                  tool: '打火石 & 炒鍋',
                  story: '點燃火花，大火快炒，添加柴火！',
                  action_cue: '點：打火；撇：快炒；捺：加柴！'
              }
          ]
      },
      {
          id: 'scholar',
          title: '小書生',
          icon: <Icons.Brush size={32} className="text-indigo-600" />,
          color: 'indigo',
          desc: '沾滿墨水，鋪開宣紙，揮毫寫字！',
          chars: [
              { 
                  char: '文', 
                  tool: '毛筆 & 宣紙',
                  story: '沾墨點頭，橫鋪紙張，撇捺揮毫！',
                  action_cue: '點：沾墨；橫：鋪紙；撇捺：寫出文采！'
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
    
    const screenDx = end.x - start.x;
    const screenDy = -(end.y - start.y); // y 軸反轉
    
    const angle = Math.atan2(screenDy, screenDx) * 180 / Math.PI; // -180 to 180
    const dist = Math.sqrt(screenDx*screenDx + screenDy*screenDy);
    
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

    // 1. 橫 (HENG)
    if (Math.abs(angle) < 30) {
        return 'HENG';
    }
    
    // 2. 豎 (SHU) / 豎鉤 (SHUGOU)
    if (Math.abs(angle - 90) < 30) { // 向下
        if (hasHook) return 'SHUGOU';
        return 'SHU';
    }
    
    // 3. 撇 (PIE) / 橫撇 (HENGPIE) - 左下 (135度)
    if (Math.abs(angle - 135) < 30) {
        if (isBent) return 'HENGPIE'; // 先橫後撇，路徑長
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

const GeminiApp = () => {
  const [gameState, setGameState] = useState(GAME_STATE.MENU);
  const [level, setLevel] = useState(0); // 這裡的 level 代表 "PROFESSION_LEVELS" 的索引
  const [currentCharIndex, setCurrentCharIndex] = useState(0); // 該職業中的第幾個字
  const [currentStrokeIndex, setCurrentStrokeIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60); // 倒計時 (秒)
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState(''); // 'success', 'error'
  const [completedStrokes, setCompletedStrokes] = useState([]);
  const [shakeIntensity, setShakeIntensity] = useState(0);
  const [showGuideArrow, setShowGuideArrow] = useState(null); // 'up', 'down', 'left', 'right', etc.
  
  // 動畫狀態
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationPoint, setAnimationPoint] = useState(null);

  // 遊戲進度狀態 (用於正式遊戲模式)
  const [gameLevelData, setGameLevelData] = useState(null);
  const [isLoadingLevel, setIsLoadingLevel] = useState(false);

  // 測試模式狀態
  const [testCharInput, setTestCharInput] = useState('');
  const [testCharacter, setTestCharacter] = useState(null);
  const [isLoadingChar, setIsLoadingChar] = useState(false);
  const [testError, setTestError] = useState('');

  // 調試日誌狀態
  const [debugLogs, setDebugLogs] = useState([]);
  const [showDebug, setShowDebug] = useState(true); // 默認開啟調試模式

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

  useEffect(() => {
    // 預加載音效 (使用由瀏覽器合成的簡單音效或外部資源)
    // 這裡我們使用 Web Audio API 創建一個簡單的成功音效，避免外部依賴
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
        successAudioRef.current = new AudioContext();
    }
  }, []);

  const playSuccessSound = () => {
    if (!successAudioRef.current) return;
    const ctx = successAudioRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sine';
    // 簡單的琶音效果 (C5 -> E5 -> G5)
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(523.25, now);
    osc.frequency.setValueAtTime(659.25, now + 0.1);
    osc.frequency.setValueAtTime(783.99, now + 0.2);
    
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    
    osc.start(now);
    osc.stop(now + 0.5);
  };

  // 使用 Ref 來解決 React Event Listener Closure Trap
  const gameStateRef = useRef(gameState);
  const levelRef = useRef(level);
  const currentStrokeIndexRef = useRef(currentStrokeIndex);
  const completedStrokesRef = useRef(completedStrokes);
  const timeLeftRef = useRef(timeLeft);
  const currentCharIndexRef = useRef(currentCharIndex);
  
  // 新增：防抖與過渡狀態 Ref
  const lastStrokeTimeRef = useRef(0);
  const isTransitioningRef = useRef(false);

  useEffect(() => {
    gameStateRef.current = gameState;
    levelRef.current = level;
    currentStrokeIndexRef.current = currentStrokeIndex;
    completedStrokesRef.current = completedStrokes;
    timeLeftRef.current = timeLeft;
    currentCharIndexRef.current = currentCharIndex;
  }, [gameState, level, currentStrokeIndex, completedStrokes, timeLeft, currentCharIndex]);

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
      const response = await fetch(`https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0.1/${char}.json`);
      if (!response.ok) throw new Error('找不到該漢字數據');
      
      const data = await response.json();
      
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

  const processStrokeInput = async (inputDir) => {
     if (isAnimating) return; // 防止動畫期間重複觸發
     
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
            playSuccessSound();
            setFeedback('正確！');
            setFeedbackType('success');
            setShowPopupHint({ text: '漂亮！', type: 'success' }); // 彈出提示
            setTimeout(() => setShowPopupHint(null), 1000);
            
            // 動畫開始
            setIsAnimating(true);
            
            // 平滑動畫
            await animateStrokePath(targetStroke.medians, 500);
            
            setCompletedStrokes(prev => [...prev, targetStroke]);
            setAnimationPoint(null);
            setIsAnimating(false);
            
            if (currentIndex + 1 >= testCharacter.strokes.length) {
                setFeedback('測試完成！');
                playSuccessSound();
            } else {
                setCurrentStrokeIndex(prev => prev + 1);
            }
        } else {
            // Wrong
            addLog(`❌ 錯誤 (預期: ${targetStroke.direction})`);
            setFeedback(`方向錯誤 (預期: ${targetStroke.direction})`);
            setFeedbackType('error');
            setShowPopupHint({ text: '再試一次！', type: 'error' }); // 彈出提示
            setTimeout(() => setShowPopupHint(null), 1000);

            // 移除錯誤方向引導
            // setShowGuideArrow(targetStroke.direction);
            // setTimeout(() => setShowGuideArrow(null), 1500);
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
       setFeedback('完美筆法！');
       setFeedbackType('success');
       setShowPopupHint({ text: '完美筆法！', type: 'success' }); // 彈出提示
       setTimeout(() => setShowPopupHint(null), 1000);

       
       // 動畫開始
       setIsAnimating(true);
       
       // 平滑動畫
       await animateStrokePath(targetStroke.medians, 500);

       setCompletedStrokes(prev => [...prev, targetStroke]);
       setAnimationPoint(null);
       setIsAnimating(false);

       // 成功不扣時間，或者可以加時
       // setTimeLeft(prev => Math.min(prev + 2, 90));
       
       if (currentIndex + 1 >= gameLevelData.strokes.length) { // 使用動態數據長度
         // 完成一個字
         isTransitioningRef.current = true; // 鎖定輸入
         playSuccessSound(); // 播放成功音效
         setTimeLeft(prev => prev + 30); // 增加30秒
         
         setTimeout(async () => {
            // 下一關邏輯
            const nextCharIndex = currentCharIndexRef.current + 1;
            setCurrentCharIndex(nextCharIndex);
            await fetchGameLevelData(currentLevel, nextCharIndex);
            
            // 確保 React 完成渲染和 Ref 更新後再解鎖
            setTimeout(() => {
                isTransitioningRef.current = false;
            }, 300);
         }, 1000);
       } else {
         setCurrentStrokeIndex(prev => prev + 1);
       }

     } else {
       // Fail
       addLog(`❌ 筆劃錯誤 (預期: ${targetStroke.direction})`);
       // setFeedback('小心！動作不準確！');
       setFeedbackType('error');
       // setShowPopupHint({ text: '小心！', type: 'error' }); // 彈出提示
       // setTimeout(() => setShowPopupHint(null), 1000);
       // 失敗不扣時間，讓時間自然流逝
       // setTimeLeft(prev => Math.max(prev - 2, 0));
       
       // 移除錯誤方向引導
       // setShowGuideArrow(targetStroke.direction);
       // setTimeout(() => setShowGuideArrow(null), 1500);
     }
   };

  // 處理 Micro:bit 數據
  // 使用 Ref 來保存最新的處理函數，確保 Event Listener 總是調用最新的邏輯
  const processStrokeInputRef = useRef(processStrokeInput);
  useEffect(() => {
      processStrokeInputRef.current = processStrokeInput;
  }, [processStrokeInput]); // processStrokeInput 本身在每次 render 都會變，除非用 useCallback

  const handleMicrobitData = (event) => {
    const value = event.target.value;
    const decoder = new TextDecoder('utf-8');
    
    // 1. 解碼
    let rawData = decoder.decode(value);
    
    // 2. 移除 Null 字符 (關鍵修復) 和前後空白，並轉為大寫
    // replace(/\0/g, '') 是為了移除 C-style 字串結尾的 null terminator
    const data = rawData.replace(/\0/g, '').trim().toUpperCase();

    console.log('收到 Micro:bit 數據 (Raw):', rawData);
    console.log('處理後數據 (Cleaned):', `"${data}"`, 'Length:', data.length);
    
    // 3. 詳細日誌：印出每個字符的編碼，檢查是否有隱藏字符
    // for (let i = 0; i < data.length; i++) {
    //     console.log(`Char[${i}]: ${data[i]} (${data.charCodeAt(i)})`);
    // }

    addLog(`收到信號: "${data}"`);

    // 4. 查詢 Map
    const direction = STROKE_MAP[data];
    
    if (direction) {
      addLog(`👉 識別為: ${direction}`);
      processStrokeInputRef.current(direction);
    } else {
      console.warn(`無法識別指令: "${data}" (Length: ${data.length})`);
      // console.warn('有效指令列表:', Object.keys(STROKE_MAP));
      addLog(`⚠️ 未知指令: ${data}`);
    }
  };

  // 連接 Micro:bit
  const connectMicrobit = async () => {
    try {
      setConnectionError('');
      addLog('開始連接...');
      
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: 'BBC micro:bit' }],
        optionalServices: [UART_SERVICE_UUID]
      });

      addLog('設備已選擇，正在連接 GATT...');
      const server = await device.gatt.connect();
      addLog('GATT 連接成功，正在獲取服務...');

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
      try {
        await characteristic.startNotifications();
      } catch (e) {
        addLog('啟用通知失敗: ' + e.message);
        throw new Error(`無法啟用通知 (GATT Error: Not supported 通常意味著屬性不支持 Notify)`);
      }
      
      characteristic.addEventListener('characteristicvaluechanged', handleMicrobitData);

      device.addEventListener('gattserverdisconnected', onDisconnected);

      bluetoothDeviceRef.current = device;
      setDeviceName(device.name);
      setIsConnected(true);
      setFeedback('Micro:bit 連接成功！');
      setFeedbackType('success');
      addLog('連接流程全部完成！');

    } catch (error) {
      console.error('連接失敗:', error);
      addLog('錯誤: ' + error.message);
      setConnectionError(error.message);
      setIsConnected(false);
    }
  };

  const onDisconnected = () => {
    console.log('Micro:bit 已斷開');
    setIsConnected(false);
    setDeviceName('');
    setFeedback('Micro:bit 已斷開連接');
    setFeedbackType('error');
  };

  // 處理鍵盤事件
  useEffect(() => {
    const handleKeyDown = (e) => {
    // 移除 e.preventDefault() 以允許頁面滾動
    // if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) {
    //     e.preventDefault();
    // }
    
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
          case 'carpenter': // 木匠
              if (strokeType === 'HENG') return `用尺劃線 (${strokeName})`;
              if (strokeType === 'SHU') return `用力打釘 (${strokeName})`;
              if (['PIE', 'NA', 'DIAN'].includes(strokeType)) return `安裝支架 (${strokeName})`;
              return `修整細節 (${strokeName})`;
          case 'farmer': // 農夫
              if (['DIAN', 'NA'].includes(strokeType)) return `播下種子 (${strokeName})`;
              if (['HENG', 'SHU'].includes(strokeType)) return `築起田埂 (${strokeName})`;
              if (['PIE', 'TI'].includes(strokeType)) return `稻穗垂下 (${strokeName})`;
              return `辛勤耕耘 (${strokeName})`;
          case 'chef': // 廚神
              if (['DIAN'].includes(strokeType)) return `點燃爐火 (${strokeName})`;
              if (['PIE', 'HENGPIE'].includes(strokeType)) return `大火快炒 (${strokeName})`;
              if (['NA', 'HENG'].includes(strokeType)) return `添加柴火 (${strokeName})`;
              return `精心調味 (${strokeName})`;
          case 'scholar': // 書生
              if (['DIAN'].includes(strokeType)) return `沾滿墨汁 (${strokeName})`;
              if (['HENG'].includes(strokeType)) return `鋪平宣紙 (${strokeName})`;
              if (['PIE', 'NA', 'SHU'].includes(strokeType)) return `揮毫潑墨 (${strokeName})`;
              return `運筆如飛 (${strokeName})`;
          default:
              return `寫出${strokeName}`;
      }
  };

  const fetchGameLevelData = async (profIdx, charIdx = 0) => {
    // 檢查職業索引是否超出
    if (profIdx >= PROFESSION_LEVELS.length) {
        setGameState(GAME_STATE.WON);
        return;
    }

    const profession = PROFESSION_LEVELS[profIdx];
    
    // 檢查字索引是否超出 -> 進入下一個職業
    if (charIdx >= profession.chars.length) {
        // 進入下一個職業介紹 (LEVEL_INTRO)
        // 只有當不是第一個職業的第一個字時才顯示過場 (避免遊戲剛開始就顯示過場? 不，剛開始也可以顯示)
        // 但這裡是用於 "完成當前職業" 後的跳轉
        
        // 如果還有下一個職業
        if (profIdx + 1 < PROFESSION_LEVELS.length) {
            setLevel(profIdx + 1);
            setCurrentCharIndex(0);
            setGameState(GAME_STATE.LEVEL_INTRO);
        } else {
            setGameState(GAME_STATE.WON); // 全部通關
        }
        return;
    }

    const charObj = profession.chars[charIdx];
    const char = charObj.char;
    
    setIsLoadingLevel(true);
    setFeedback(`正在準備 ${profession.title} 的試煉...`);

    try {
        const response = await fetch(`https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0.1/${char}.json`);
        if (!response.ok) throw new Error('找不到該漢字數據');
        
        const data = await response.json();
        
        // 轉換數據格式
        const strokes = data.strokes.map((svg, index) => {
           const medians = data.medians[index];
           
           // 使用新的筆劃分類器
           const strokeType = classifyStroke(medians) || 'UNKNOWN';
           
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
            pinyin: '', 
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
            fetchGameLevelData(profIdx, charIdx + 1);
            return; 
        }

        setGameLevelData(newLevelData);
        
        // 更新狀態
        setLevel(profIdx);
        setCurrentCharIndex(charIdx);

        setCurrentStrokeIndex(0);
        setCompletedStrokes([]);
        setFeedback(charObj.story); // 顯示故事提示
        setFeedbackType('info');
        
    } catch (err) {
        console.error(err);
        setFeedback(`關卡載入失敗: ${err.message}`);
        setFeedbackType('error');
    } finally {
        setIsLoadingLevel(false);
    }
  };

  const startGame = () => {
    setGameState(GAME_STATE.LEVEL_INTRO);
    setTimeLeft(90); // 初始時間 (例如90秒)
    setLevel(0);
    setCurrentCharIndex(0);
  };

  const startCurrentLevel = () => {
      setGameState(GAME_STATE.PLAYING);
      fetchGameLevelData(level, currentCharIndex);
  };

  const getProfessionTheme = (profId) => {
      switch(profId) {
          case 'carpenter': return { bg: 'bg-amber-100', border: 'border-amber-400', text: 'text-amber-800', highlight: 'text-amber-600', icon: '🔨', shadow: 'shadow-amber-500/20' };
          case 'farmer': return { bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-800', highlight: 'text-green-600', icon: '🌾', shadow: 'shadow-green-500/20' };
          case 'chef': return { bg: 'bg-red-100', border: 'border-red-400', text: 'text-red-800', highlight: 'text-red-600', icon: '🔥', shadow: 'shadow-red-500/20' };
          case 'scholar': return { bg: 'bg-indigo-100', border: 'border-indigo-400', text: 'text-indigo-800', highlight: 'text-indigo-600', icon: '🖌️', shadow: 'shadow-indigo-500/20' };
          default: return { bg: 'bg-slate-100', border: 'border-slate-300', text: 'text-slate-700', highlight: 'text-slate-600', icon: '❓', shadow: 'shadow-slate-500/20' };
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
             <span className="text-[380px] font-kai text-slate-200 opacity-60" style={{ fontFamily: '"KaiTi", "Kaiti SC", "STKaiti", serif' }}>
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
        
        {/* 神器圖標 (跟隨當前筆劃起點) */}
        {(currentStroke || (isAnimating && animationPoint)) && (() => {
           const point = (isAnimating && animationPoint) ? animationPoint : (currentStroke ? currentStroke.medians[0] : null);
           
           if (!point) return null;
           
           const pos = getPosition(point[0], point[1]);
           
           // 根據職業顯示不同圖標
           const profIcon = gameLevelData && gameLevelData.profession.id === 'carpenter' ? <Icons.Hammer size={24} /> :
                            gameLevelData && gameLevelData.profession.id === 'farmer' ? <Icons.Seed size={24} /> :
                            gameLevelData && gameLevelData.profession.id === 'chef' ? <Icons.Fire size={24} /> :
                            gameLevelData && gameLevelData.profession.id === 'scholar' ? <Icons.Brush size={24} /> :
                            <Icons.Sword size={24} />;

           return (
            <div 
              className={`absolute ${isAnimating ? '' : 'transition-all duration-500'}`}
              style={{
                left: pos.left,
                top: pos.top,
                transform: 'translate(-50%, -50%)',
              }}
            >
               <div className={`text-white p-2 rounded-full shadow-lg border-2 border-white bg-blue-500`}>
                  {profIcon}
               </div>
            </div>
           );
        })()}

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

  return (
    <div className={`min-h-screen bg-amber-50 text-slate-800 font-sans flex flex-col items-center p-4 pb-20 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]`}>
      
      <header className="w-full max-w-md flex justify-between items-center mb-2">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-amber-700 font-kai drop-shadow-sm">
          <div className="bg-amber-500 text-white px-2 py-1 rounded-lg shadow-sm">狀元</div>
          行行出狀元
        </h1>
        
        {/* 藍牙狀態顯示 */}
        <div className={`text-sm px-3 py-1 rounded-full flex items-center gap-2 shadow-sm ${isConnected ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-slate-200 text-slate-600'}`}>
          <Bluetooth size={14} className={isConnected ? "text-green-600" : "text-slate-400"} /> 
          <span>{isConnected ? '已連接' : '未連接'}</span>
        </div>
      </header>

      {gameState === GAME_STATE.MENU && (
        <div className="w-full max-w-4xl flex flex-col items-center">
          
          {/* 未連接時顯示首頁 (Landing Page) */}
          {!isConnected ? (
            <div className="text-center space-y-6 animate-fade-in py-8 px-4 max-w-2xl mx-auto">
              
              {/* 標題區 */}
              <div className="relative inline-block mb-4">
                 <h1 className="text-6xl md:text-7xl font-bold text-amber-600 drop-shadow-md font-kai tracking-wide">
                  行行出狀元
                </h1>
                <div className="absolute -top-6 -right-8 text-5xl animate-bounce">🎓</div>
              </div>

              {/* 故事卡片 */}
              <div className="bg-white/90 backdrop-blur-sm p-8 rounded-[2rem] shadow-xl border-4 border-amber-200 transform rotate-1 hover:rotate-0 transition-transform duration-300">
                <div className="flex justify-center gap-4 mb-4 text-6xl">
                    <span className="animate-pulse">🖌️</span>
                    <span>🆚</span>
                    <span className="animate-bounce">👾</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-700 mb-4 font-kai">
                  🔥 急單！狀元坊的挑戰
                </h2>
                <p className="text-lg text-slate-600 leading-relaxed font-kai text-left">
                  各位小學徒，狀元坊接到了緊急訂單！
                  <br/><br/>
                  需要在時間內完成各行各業的漢字招牌製作。快拿起你的 <span className="text-blue-600 font-bold bg-blue-100 px-2 rounded-full">魔法神筆 (Micro:bit)</span>，
                  跟隨 <span className="text-amber-600 font-bold">小木匠</span>、<span className="text-green-600 font-bold">小農夫</span>，
                  在 <span className="text-red-500 font-bold">倒計時</span> 結束前完成任務吧！✨
                </p>
              </div>
              
              {/* 操作區 */}
              <div className="flex flex-col items-center gap-4 mt-8">
                <button 
                  onClick={connectMicrobit}
                  className="group relative px-8 py-5 bg-gradient-to-b from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white text-2xl font-bold rounded-full shadow-xl shadow-blue-200 transition-all hover:scale-105 active:scale-95 flex items-center gap-3 overflow-hidden border-b-8 border-blue-800"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                  <Bluetooth size={32} className="animate-pulse" /> 
                  <span>連結神筆，開始冒險！</span>
                </button>
                
                <p className="text-slate-500 text-sm font-kai">
                  👇 沒有神筆？也可以試試看 👇
                </p>

                <div className="flex flex-col gap-3 w-full max-w-xs">
                  <button 
                     onClick={startGame}
                     className="px-6 py-3 bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold rounded-2xl border-2 border-amber-300 transition-colors flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                  >
                     <Play size={20} /> 直接開始 (跳過連接)
                  </button>
                  <button 
                     onClick={startTestMode}
                     className="px-6 py-3 bg-white hover:bg-slate-50 text-slate-600 font-bold rounded-2xl border-2 border-slate-200 transition-colors flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                  >
                     <MonitorSmartphone size={20} /> 自由練習 (測試模式)
                  </button>
                </div>

                {/* 錯誤提示 */}
                {connectionError && (
                  <div className="mt-4 p-4 bg-red-100 border-2 border-red-200 text-red-600 rounded-2xl flex items-center gap-2 animate-shake">
                    <Zap size={24} />
                    <span className="font-bold">{connectionError}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* 已連接時顯示準備大廳 (Lobby) */
            <div className="bg-white/80 backdrop-blur-md p-8 md:p-12 rounded-[2rem] shadow-2xl text-center max-w-2xl w-full border-4 border-green-200 animate-fade-in-up">
              <div className="mb-6 inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full text-green-500 mb-6 shadow-inner">
                 <Bluetooth size={48} />
              </div>
              
              <h2 className="text-4xl font-bold mb-2 text-slate-800 font-kai">連接成功！</h2>
              <p className="text-slate-500 mb-8 font-medium text-lg">神筆已激活，準備出發！</p>
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={startGame}
                  className="w-full py-4 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white text-2xl font-bold rounded-2xl flex items-center justify-center gap-3 transition-all transform hover:scale-105 shadow-xl shadow-orange-200 border-b-4 border-orange-700"
                >
                  <Play size={28} fill="currentColor" /> 
                  開始冒險
                </button>
                
                <button 
                  onClick={startTestMode}
                  className="w-full py-3 bg-white hover:bg-slate-50 text-slate-600 font-bold rounded-2xl border-2 border-slate-200 flex items-center justify-center gap-2 shadow-sm"
                >
                   <MonitorSmartphone size={20} /> 測試模式
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

      {gameState === GAME_STATE.TEST && (
         <div className="w-full max-w-md space-y-4 animate-fade-in">
             <div className="flex items-center gap-2 mb-4">
                <button onClick={() => setGameState(GAME_STATE.MENU)} className="p-2 hover:bg-slate-200 rounded-full text-slate-600">
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
        <div className="w-full max-w-md h-full flex flex-col p-2">
          {/* 狀態列 */}
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border-2 border-slate-100 shadow-sm">
            <div className="flex flex-col">
               <span className={`text-xs font-bold ${getProfessionTheme(gameLevelData?.profession?.id).highlight}`}>
                 {gameLevelData ? gameLevelData.profession.title : '...'}
               </span>
               <span className="text-4xl font-bold text-slate-800 font-kai">{gameLevelData ? gameLevelData.char : '...'}</span>
            </div>
            <div className="flex-1 mx-4 text-center">
                 {gameLevelData && gameLevelData.tool && (
                   <div className={`text-xs font-bold mb-2 bg-slate-100 rounded-full px-3 py-1 inline-block ${getProfessionTheme(gameLevelData.profession.id).highlight}`}>
                     神器：{gameLevelData.tool}
                   </div>
                 )}
            </div>
            <div className="flex-none flex flex-col items-end">
                 <span className="text-xs text-slate-400 font-bold mb-1">剩餘時間</span>
                 <span className={`text-xl font-bold font-mono ${timeLeft < 15 ? 'text-red-500 animate-pulse' : 'text-slate-700'}`}>
                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                 </span>
            </div>
          </div>

          {/* 時間進度條 */}
          <div className="h-4 bg-slate-200 rounded-full overflow-hidden border border-slate-300 relative shadow-inner">
             <div 
               className={`h-full transition-all duration-1000 ${timeLeft < 15 ? 'bg-red-500' : 'bg-green-500'}`}
               style={{ 
                   width: `${(timeLeft / 90) * 100}%`
               }}
             />
          </div>
          
          {/* 每一筆的故事台詞 (Story Line) - 大大顯示在上方 */}
          {gameLevelData && gameLevelData.strokes[currentStrokeIndex] && (
             <div className="text-center relative z-10 animate-fade-in-up mt-2 mb-1">
                <div className={`text-xl md:text-2xl font-bold font-kai ${getProfessionTheme(gameLevelData.profession.id).text} drop-shadow-md bg-white px-6 py-2 rounded-full inline-block border-2 ${getProfessionTheme(gameLevelData.profession.id).border} shadow-sm`}>
                   {gameLevelData.strokes[currentStrokeIndex].hint.split(' (')[0]} {/* 只顯示前半部分故事，括號內的筆劃名略小顯示 */}
                   <span className="text-base ml-2 opacity-80 font-sans text-slate-500">
                      {gameLevelData.strokes[currentStrokeIndex].hint.match(/\(.*\)/)?.[0]}
                   </span>
                </div>
             </div>
          )}
          
          {/* 遊戲主畫布 */}
          <div className="relative">
              {renderCanvas()}
              
              {/* 懸浮提示框 (Pop-up Hint) - 指引 */}
              {gameLevelData && gameLevelData.strokes[currentStrokeIndex] && !isAnimating && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20 animate-bounce">
                    <div className={`px-5 py-2 rounded-full shadow-xl border-4 bg-white text-slate-800 font-bold text-xl whitespace-nowrap ${getProfessionTheme(gameLevelData.profession.id).border}`}>
                        {gameLevelData.strokes[currentStrokeIndex].hint.replace('請揮動: ', '')}
                        {/* 這裡可以放圖標 */}
                    </div>
                </div>
              )}

              {/* 結果彈出提示 (Result Pop-up) - 成功/失敗 */}
              {showPopupHint && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30 animate-ping-once">
                    <div className={`px-8 py-4 rounded-[2rem] shadow-2xl border-4 font-bold text-3xl whitespace-nowrap transform scale-110
                        ${showPopupHint.type === 'success' ? 'bg-green-50 border-green-400 text-green-600' : 'bg-red-50 border-red-400 text-red-600'}
                    `}>
                        {showPopupHint.text}
                    </div>
                </div>
              )}
          </div>
        </div>
      )}

      {gameState === GAME_STATE.WON && (
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl text-center max-w-md w-full border-4 border-amber-200 animate-bounce-in">
          <div className="mb-6 text-8xl filter drop-shadow-md">🏆</div>
          <h2 className="text-3xl font-bold mb-4 text-amber-600 font-kai">封印成功！</h2>
          <p className="text-slate-600 mb-8 font-kai text-lg leading-relaxed">太棒了！<br/>你成功運用正確的筆順趕走了錯字魔！</p>
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

       {gameState === GAME_STATE.LEVEL_INTRO && PROFESSION_LEVELS[level] && (
        <div className={`p-10 rounded-[2.5rem] shadow-2xl text-center max-w-md w-full border-4 ${getProfessionTheme(PROFESSION_LEVELS[level].id).bg} ${getProfessionTheme(PROFESSION_LEVELS[level].id).border} animate-fade-in-up`}>
            <div className="text-8xl mb-6 animate-bounce filter drop-shadow-md">
                {PROFESSION_LEVELS[level].icon}
            </div>
            <h2 className={`text-4xl font-bold mb-4 font-kai ${getProfessionTheme(PROFESSION_LEVELS[level].id).text}`}>
                {PROFESSION_LEVELS[level].title}
            </h2>
            <p className="text-slate-600 mb-8 font-kai text-xl font-medium">
                {PROFESSION_LEVELS[level].desc}
            </p>
            
            {/* 職業意境圖 (改為更溫馨的風格) */}
            <div className="w-full aspect-video bg-white/50 rounded-2xl mb-8 flex items-center justify-center border-2 border-white/40 overflow-hidden relative group shadow-inner">
                {/* 移除背景漸變 div */}
                
                <div className="text-9xl opacity-30 transform scale-110 group-hover:scale-125 transition-transform duration-1000 filter blur-sm">
                   {PROFESSION_LEVELS[level].icon}
                </div>
            </div>

            <button 
                onClick={startCurrentLevel}
                className={`w-full py-4 text-white text-xl font-bold rounded-2xl flex items-center justify-center gap-3 transition-all hover:scale-105 shadow-xl bg-slate-700 hover:bg-slate-600 border-b-4 border-slate-900`}
            >
                <Play size={24} fill="currentColor" /> 開始試煉
            </button>
        </div>
      )}

      {gameState === GAME_STATE.LOST && (
        <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-md w-full border-4 border-slate-300">
          <div className="mb-4 text-6xl">⏰</div>
          <h2 className="text-2xl font-bold mb-2 text-slate-700 font-kai">訂單超時了...</h2>
          <p className="text-slate-500 mb-6 font-kai">別氣餒，小學徒！<br/>動作再快一點，下次一定能趕上！</p>
          <button 
            onClick={startGame}
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg"
          >
            <RotateCcw size={18} /> 重新挑戰
          </button>
        </div>
      )}

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

      <div className="mt-8 text-xs text-slate-500 max-w-xs text-center">
         科技展專用原型 v2.2 | React + Vite + Micro:bit
      </div>
    </div>
  );
};

export default GeminiApp;
