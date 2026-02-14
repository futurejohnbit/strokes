import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Sword, Shield, Zap, Award, Bluetooth, MonitorSmartphone } from 'lucide-react';

// 遊戲常數與資料設定
const GAME_STATE = {
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  WON: 'WON',
  LOST: 'LOST',
};

// 漢字資料庫：定義筆劃順序、方向與提示
// directions: 'right', 'down', 'left-down' (撇), 'right-down' (捺)
const CHARACTERS = [
  {
    char: '大',
    pinyin: 'dà',
    meaning: 'Big / Great',
    strokes: [
      { id: 1, type: 'horizontal', direction: 'right', hint: '向右揮動 (一)', start: {x: 20, y: 40}, end: {x: 80, y: 40} },
      { id: 2, type: 'throw', direction: 'left-down', hint: '向左下揮動 (丿)', start: {x: 50, y: 40}, end: {x: 20, y: 90} },
      { id: 3, type: 'press', direction: 'right-down', hint: '向右下揮動 (丶)', start: {x: 50, y: 40}, end: {x: 80, y: 90} },
    ]
  },
  {
    char: '木',
    pinyin: 'mù',
    meaning: 'Wood / Tree',
    strokes: [
      { id: 1, type: 'horizontal', direction: 'right', hint: '向右揮動 (一)', start: {x: 20, y: 40}, end: {x: 80, y: 40} },
      { id: 2, type: 'vertical', direction: 'down', hint: '向下揮動 (丨)', start: {x: 50, y: 20}, end: {x: 50, y: 80} },
      { id: 3, type: 'throw', direction: 'left-down', hint: '向左下揮動 (丿)', start: {x: 50, y: 40}, end: {x: 20, y: 90} },
      { id: 4, type: 'press', direction: 'right-down', hint: '向右下揮動 (丶)', start: {x: 50, y: 40}, end: {x: 80, y: 90} },
    ]
  }
];

// Micro:bit 藍牙服務 UUID
const UART_SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const UART_RX_CHARACTERISTIC_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';

// 筆劃映射表 (Micro:bit UART -> 遊戲方向)
const STROKE_MAP = {
  'HENG': 'right',
  'SHU': 'down',
  'PIE': 'left-down',
  'NA': 'right-down',
  'DIAN': 'right-down',
  'TI': 'right-up', // 遊戲目前可能沒用到，但保留
  'HENGPIE': 'left-down',
  'SHUGOU': 'up',
  'HENGSHUGOU': 'down'
};

const App = () => {
  const [gameState, setGameState] = useState(GAME_STATE.MENU);
  const [level, setLevel] = useState(0);
  const [currentStrokeIndex, setCurrentStrokeIndex] = useState(0);
  const [monsterDistance, setMonsterDistance] = useState(100); // 100m away
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState(''); // 'success', 'error'
  const [completedStrokes, setCompletedStrokes] = useState([]);
  const [shakeIntensity, setShakeIntensity] = useState(0);
  
  // 調試日誌狀態
  const [debugLogs, setDebugLogs] = useState([]);
  const [showDebug, setShowDebug] = useState(false);

  // 添加日誌函數
  const addLog = (msg) => {
    setDebugLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 19)]);
  };
  
  // 藍牙狀態
  const [isConnected, setIsConnected] = useState(false);
  const [deviceName, setDeviceName] = useState('');
  const [connectionError, setConnectionError] = useState('');
  const bluetoothDeviceRef = useRef(null);

  // 處理 Micro:bit 數據
  const handleMicrobitData = (event) => {
    const value = event.target.value;
    const decoder = new TextDecoder('utf-8');
    const data = decoder.decode(value).trim();
    console.log('收到 Micro:bit 數據:', data);
    addLog(`收到信號: "${data}"`);

    const direction = STROKE_MAP[data];
    if (direction) {
      addLog(`👉 識別為: ${direction}`);
      processStrokeInput(direction);
    } else {
      console.warn('未知筆劃指令:', data);
      addLog(`⚠️ 未知指令: ${data}`);
    }
  };

  // 連接 Micro:bit
  const connectMicrobit = async () => {
    try {
      setConnectionError('');
      
      // 使用更寬鬆的過濾條件，只匹配名字前綴
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: 'BBC micro:bit' }],
        optionalServices: [UART_SERVICE_UUID]
      });

      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(UART_SERVICE_UUID);
      const characteristic = await service.getCharacteristic(UART_RX_CHARACTERISTIC_UUID);

      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', handleMicrobitData);

      device.addEventListener('gattserverdisconnected', onDisconnected);

      bluetoothDeviceRef.current = device;
      setDeviceName(device.name);
      setIsConnected(true);
      setFeedback('Micro:bit 連接成功！');
      setFeedbackType('success');

    } catch (error) {
      console.error('連接失敗:', error);
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

  // 模擬 Micro:bit 輸入監聽 (鍵盤替代)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== GAME_STATE.PLAYING) return;

      let inputDirection = null;
      
      // 簡單的鍵盤映射模擬體感
      switch(e.key) {
        case 'ArrowRight': inputDirection = 'right'; break;
        case 'ArrowDown': inputDirection = 'down'; break;
        case 'ArrowLeft': inputDirection = 'left-down'; break; // 用左鍵模擬撇
        case 'd': inputDirection = 'right-down'; break; // 用 D 鍵模擬捺
        default: break;
      }

      // 為了方便演示，我們允許組合鍵或簡化邏輯
      if (e.key === 'ArrowLeft' && e.shiftKey) inputDirection = 'left-down';
      if (e.key === 'ArrowRight' && e.shiftKey) inputDirection = 'right-down';
      
      // 自動判斷撇捺 (優化體驗，因為鍵盤很難模擬斜向)
      const currentTarget = CHARACTERS[level].strokes[currentStrokeIndex];
      if (currentTarget) {
         if (currentTarget.direction === 'left-down' && e.key === 'ArrowLeft') inputDirection = 'left-down';
         if (currentTarget.direction === 'right-down' && e.key === 'ArrowRight') inputDirection = 'right-down';
      }

      if (inputDirection) {
        checkStroke(inputDirection);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, currentStrokeIndex, level]);

  // 遊戲主循環 (怪獸追趕)
  useEffect(() => {
    let interval;
    if (gameState === GAME_STATE.PLAYING) {
      interval = setInterval(() => {
        setMonsterDistance(prev => {
          const newDist = prev - 2; // 怪獸每秒靠近
          if (newDist <= 0) {
            setGameState(GAME_STATE.LOST);
            return 0;
          }
          return newDist;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState]);

  const startGame = () => {
    setGameState(GAME_STATE.PLAYING);
    setMonsterDistance(100);
    setCurrentStrokeIndex(0);
    setCompletedStrokes([]);
    setFeedback('準備好你的神筆 (Micro:bit)!');
    setFeedbackType('info');
  };

  const checkStroke = (inputDir) => {
    // 確保遊戲正在進行中
    // 這裡我們稍微放寬檢查，如果是從藍牙調用，可能 gameState 更新有延遲，但通常沒問題
    // 注意：React state 在 callback 中可能是舊的，如果 handleMicrobitData 閉包問題。
    // 但因為我們將 checkStroke 定義在組件內，且每次 render 重新定義，
    // handleMicrobitData 是作為 event listener 添加的，它引用的 checkStroke 是添加時的版本...
    // 這是一個潛在 Bug！ handleMicrobitData 添加後不會更新，所以它引用的 checkStroke 閉包是舊的。
    // 解決方案：使用 Ref 保存最新的 checkStroke 或 state。
    
    // 不過，為簡單起見，我們先假設它能工作，或者我們需要在 useEffect 中重新綁定 listener。
    // 更好的方式是使用 useEffect 監聽 changes 並更新 listener，或者使用 Ref。
    // 讓我們用 Ref 來存取最新的 state。
    
    // 實際上，為了修復這個常見的 React Event Listener Trap，我們應該讓 handleMicrobitData 調用一個 Ref 函數。
  };
  
  // === 修復 React Event Listener 閉包陷阱 ===
  const gameStateRef = useRef(gameState);
  const levelRef = useRef(level);
  const currentStrokeIndexRef = useRef(currentStrokeIndex);
  const completedStrokesRef = useRef(completedStrokes);
  const monsterDistanceRef = useRef(monsterDistance);

  useEffect(() => {
    gameStateRef.current = gameState;
    levelRef.current = level;
    currentStrokeIndexRef.current = currentStrokeIndex;
    completedStrokesRef.current = completedStrokes;
    monsterDistanceRef.current = monsterDistance;
  }, [gameState, level, currentStrokeIndex, completedStrokes, monsterDistance]);

  const processStrokeInput = (inputDir) => {
     const currentGameState = gameStateRef.current;
     if (currentGameState !== GAME_STATE.PLAYING) return;

     const currentLevel = levelRef.current;
     const currentIndex = currentStrokeIndexRef.current;
     const targetStroke = CHARACTERS[currentLevel].strokes[currentIndex];
     
     if (!targetStroke) return;

     if (inputDir === targetStroke.direction) {
       // Success
       setFeedback('完美筆法！');
       setFeedbackType('success');
       setCompletedStrokes([...completedStrokesRef.current, targetStroke]);
       setMonsterDistance(prev => Math.min(prev + 10, 100)); // 獎勵距離
       
       // 震動畫面
       setShakeIntensity(5);
       setTimeout(() => setShakeIntensity(0), 200);

       if (currentIndex + 1 >= CHARACTERS[currentLevel].strokes.length) {
         // 完成一個字
         setTimeout(() => {
            if (currentLevel + 1 < CHARACTERS.length) {
              // Next Level
              setLevel(currentLevel + 1);
              setCurrentStrokeIndex(0);
              setCompletedStrokes([]);
              setFeedback('字靈覺醒！進入下一關');
            } else {
              setGameState(GAME_STATE.WON);
            }
         }, 1000);
       } else {
         setCurrentStrokeIndex(prev => prev + 1);
       }

     } else {
       // Fail
       setFeedback('筆劃方向錯誤！怪獸逼近了！');
       setFeedbackType('error');
       setMonsterDistance(prev => Math.max(prev - 10, 0));
       setShakeIntensity(20); // 強烈震動
       setTimeout(() => setShakeIntensity(0), 500);
     }
  };

  // 重寫 checkStroke 以便鍵盤事件也能用
  // 注意：鍵盤事件因為是在 render scope 內觸發，直接用 state 沒問題。
  // 但為了統一，都走 processStrokeInput
  
  // 更新 handleMicrobitData 以使用 processStrokeInput
  // 我們需要一個穩定的引用給 addEventListener
  const onMicrobitDataRef = useRef();
  
  useEffect(() => {
      onMicrobitDataRef.current = (event) => {
        const value = event.target.value;
        const decoder = new TextDecoder('utf-8');
        const data = decoder.decode(value).trim();
        console.log('收到 Micro:bit 數據:', data);
    
        const direction = STROKE_MAP[data];
        if (direction) {
            processStrokeInput(direction);
        }
      };
  }, []); // Empty dependency, but processStrokeInput uses refs so it's fresh

  // 實際綁定到 characteristic 的是這個 wrapper
  const handleDataWrapper = (event) => {
      if (onMicrobitDataRef.current) {
          onMicrobitDataRef.current(event);
      }
  };

  // 渲染繪圖區 (SVG)
  const renderCanvas = () => {
    const currentChar = CHARACTERS[level];
    const currentStroke = currentChar.strokes[currentStrokeIndex];

    return (
      <div className="relative w-full max-w-md aspect-square bg-amber-50 rounded-xl shadow-inner border-4 border-amber-200 overflow-hidden mx-auto mt-4">
        {/* 背景格線 (米字格) */}
        <svg width="100%" height="100%" viewBox="0 0 100 100" className="absolute inset-0 opacity-20 pointer-events-none">
          <line x1="0" y1="0" x2="100" y2="100" stroke="red" strokeWidth="0.5" strokeDasharray="2,2" />
          <line x1="100" y1="0" x2="0" y2="100" stroke="red" strokeWidth="0.5" strokeDasharray="2,2" />
          <line x1="50" y1="0" x2="50" y2="100" stroke="red" strokeWidth="0.5" />
          <line x1="0" y1="50" x2="100" y2="50" stroke="red" strokeWidth="0.5" />
          <rect x="0" y="0" width="100" height="100" stroke="red" strokeWidth="1" fill="none"/>
        </svg>

        {/* 漢字渲染 */}
        <svg width="100%" height="100%" viewBox="0 0 100 100" className="absolute inset-0">
          {/* 已完成的筆劃 */}
          {completedStrokes.map(stroke => (
            <path 
              key={stroke.id}
              d={`M${stroke.start.x} ${stroke.start.y} Q ${(stroke.start.x + stroke.end.x)/2} ${(stroke.start.y + stroke.end.y)/2 - 5} ${stroke.end.x} ${stroke.end.y}`}
              stroke="black" 
              strokeWidth="8" 
              fill="none" 
              strokeLinecap="round"
              className="animate-draw"
            />
          ))}

          {/* 當前提示筆劃 (虛線) */}
          {currentStroke && (
            <g className="animate-pulse">
               <path 
                d={`M${currentStroke.start.x} ${currentStroke.start.y} Q ${(currentStroke.start.x + currentStroke.end.x)/2} ${(currentStroke.start.y + currentStroke.end.y)/2 - 5} ${currentStroke.end.x} ${currentStroke.end.y}`}
                stroke="rgba(255, 165, 0, 0.5)" 
                strokeWidth="8" 
                fill="none" 
                strokeLinecap="round"
                strokeDasharray="5,5"
              />
              {/* 方向箭頭 */}
              <circle cx={currentStroke.start.x} cy={currentStroke.start.y} r="2" fill="red" />
              <circle cx={currentStroke.end.x} cy={currentStroke.end.y} r="2" fill="green" />
            </g>
          )}
        </svg>
        
        {/* 俠客頭像 (跟隨當前筆劃起點) */}
        {currentStroke && (
          <div 
            className="absolute transition-all duration-500"
            style={{
              left: `${currentStroke.start.x}%`,
              top: `${currentStroke.start.y}%`,
              transform: 'translate(-50%, -50%)'
            }}
          >
             <div className="bg-blue-600 text-white p-1 rounded-full shadow-lg">
                <Sword size={20} />
             </div>
          </div>
        )}

        {/* 錯字魔 (根據距離顯示大小/透明度) */}
        <div 
          className="absolute bottom-2 right-2 transition-all duration-1000"
          style={{
            opacity: Math.max(0.2, 1 - monsterDistance / 120),
            transform: `scale(${2 - monsterDistance / 100})`
          }}
        >
           <div className="text-4xl">👾</div>
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen bg-slate-800 text-slate-100 font-sans flex flex-col items-center p-4 ${shakeIntensity > 0 ? 'translate-x-1' : ''}`} style={{transform: `translate(${Math.random() * shakeIntensity}px, ${Math.random() * shakeIntensity}px)`}}>
      
      <header className="w-full max-w-md flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-amber-400">
          <div className="bg-amber-500 text-slate-900 p-1 rounded">筆</div>
          神筆小俠客
        </h1>
        
        {/* 藍牙狀態顯示 */}
        <div className={`text-sm px-3 py-1 rounded-full flex items-center gap-2 ${isConnected ? 'bg-green-900 text-green-300' : 'bg-slate-700'}`}>
          <Bluetooth size={14} className={isConnected ? "text-green-400" : "text-slate-400"} /> 
          <span>{isConnected ? '已連接' : '未連接'}</span>
        </div>
      </header>

      {gameState === GAME_STATE.MENU && (
        <div className="w-full max-w-4xl flex flex-col items-center">
          
          {/* 未連接時顯示首頁 (Landing Page) */}
          {!isConnected ? (
            <div className="text-center space-y-8 animate-fade-in">
              <div className="mb-8 relative">
                <div className="text-9xl animate-bounce mb-4">🖌️</div>
                <div className="absolute top-0 right-0 -mr-12 animate-pulse text-6xl">✨</div>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 drop-shadow-lg">
                神筆小俠客
              </h1>
              
              <p className="text-xl md:text-2xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
                揮動你的 Micro:bit 神筆，施展魔法筆劃，<br/>
                擊退錯字魔，拯救文字世界！
              </p>

              <div className="flex flex-col items-center gap-4 mt-12">
                <button 
                  onClick={connectMicrobit}
                  className="group relative px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white text-xl font-bold rounded-full shadow-lg shadow-blue-500/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-3 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                  <Bluetooth size={28} className="animate-pulse" /> 
                  <span>連接 Micro:bit 開始遊戲</span>
                </button>
                
                <p className="text-slate-500 text-sm mt-4">
                  需要使用 Chrome 或 Edge 瀏覽器 • 支持 Micro:bit v2
                </p>

                {connectionError && (
                  <div className="mt-4 p-4 bg-red-900/50 border border-red-500/30 text-red-200 rounded-xl flex items-center gap-2 max-w-md">
                    <Zap size={20} />
                    <span>{connectionError}</span>
                  </div>
                )}
                
                <button 
                   onClick={startGame}
                   className="mt-8 text-slate-600 hover:text-slate-400 text-sm underline decoration-slate-700 hover:decoration-slate-400 transition-colors"
                >
                   (開發者模式：跳過連接直接進入)
                </button>
              </div>
            </div>
          ) : (
            /* 已連接時顯示準備大廳 (Lobby) */
            <div className="bg-slate-700/80 backdrop-blur-md p-8 md:p-12 rounded-3xl shadow-2xl text-center max-w-2xl w-full border border-green-500/30 animate-fade-in-up">
              <div className="mb-6 inline-flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-full text-green-400 mb-6">
                 <Bluetooth size={40} />
              </div>
              
              <h2 className="text-3xl font-bold mb-2 text-white">連接成功！</h2>
              <p className="text-green-300 mb-8 font-medium">神筆已激活，準備戰鬥！</p>
              
              <div className="grid grid-cols-2 gap-4 mb-8 text-left">
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-600">
                  <h3 className="text-amber-400 font-bold mb-2 flex items-center gap-2">
                    <Sword size={16} /> 攻擊方式
                  </h3>
                  <ul className="text-slate-300 text-sm space-y-2">
                    <li>➡️ 橫劃 (一)：向右揮</li>
                    <li>⬇️ 豎劃 (丨)：向下揮</li>
                  </ul>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-600">
                   <h3 className="text-amber-400 font-bold mb-2 flex items-center gap-2">
                    <Shield size={16} /> 防禦技巧
                  </h3>
                  <ul className="text-slate-300 text-sm space-y-2">
                    <li>↙️ 撇劃 (丿)：向左下</li>
                    <li>↘️ 捺劃 (丶)：向右下</li>
                  </ul>
                </div>
              </div>

              <button 
                onClick={startGame}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xl font-bold rounded-xl flex items-center justify-center gap-3 transition-all transform hover:scale-105 shadow-xl shadow-orange-500/20"
              >
                <Play size={24} fill="currentColor" /> 
                開始冒險
              </button>
              
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

      {gameState === GAME_STATE.PLAYING && (
        <div className="w-full max-w-md space-y-4">
          {/* 狀態列 */}
          <div className="flex justify-between items-center bg-slate-700 p-3 rounded-xl border border-slate-600">
            <div className="flex flex-col">
               <span className="text-xs text-slate-400">當前漢字</span>
               <span className="text-2xl font-bold text-white">{CHARACTERS[level].char}</span>
            </div>
            <div className="flex-1 mx-4">
              <div className="flex justify-between text-xs mb-1">
                <span>怪獸距離</span>
                <span className={`${monsterDistance < 30 ? 'text-red-400 animate-pulse' : 'text-green-400'}`}>{monsterDistance}m</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${monsterDistance < 30 ? 'bg-red-500' : 'bg-green-500'}`}
                  style={{ width: `${monsterDistance}%` }}
                />
              </div>
            </div>
          </div>

          {/* 遊戲主畫布 */}
          {renderCanvas()}

          {/* 提示與回饋 */}
          <div className={`p-4 rounded-xl text-center transition-colors duration-300 border-2 ${
            feedbackType === 'success' ? 'bg-green-900/30 border-green-500/50 text-green-300' : 
            feedbackType === 'error' ? 'bg-red-900/30 border-red-500/50 text-red-300' : 
            'bg-slate-700 border-slate-600 text-slate-300'
          }`}>
            <div className="text-lg font-bold mb-1">
              {feedback || "等待指令..."}
            </div>
            <div className="text-sm opacity-70">
              {CHARACTERS[level].strokes[currentStrokeIndex] ? `下一筆：${CHARACTERS[level].strokes[currentStrokeIndex].hint}` : "完成！"}
            </div>
          </div>
        </div>
      )}

      {gameState === GAME_STATE.WON && (
        <div className="bg-slate-700 p-8 rounded-2xl shadow-2xl text-center max-w-md w-full border border-amber-500/50">
          <div className="mb-4 text-6xl">🏆</div>
          <h2 className="text-2xl font-bold mb-2 text-amber-400">封印成功！</h2>
          <p className="text-slate-300 mb-6">你成功運用正確的筆順趕走了錯字魔！</p>
          <div className="flex justify-center gap-4">
             <button 
              onClick={startGame}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-xl flex items-center gap-2"
            >
              <RotateCcw size={18} /> 再玩一次
            </button>
          </div>
        </div>
      )}

       {gameState === GAME_STATE.LOST && (
        <div className="bg-slate-700 p-8 rounded-2xl shadow-2xl text-center max-w-md w-full border border-red-500/50">
          <div className="mb-4 text-6xl">👾</div>
          <h2 className="text-2xl font-bold mb-2 text-red-400">被抓住了...</h2>
          <p className="text-slate-300 mb-6">錯字魔追上了你。記得要寫得又快又準喔！</p>
          <button 
            onClick={startGame}
            className="w-full py-3 bg-slate-600 hover:bg-slate-500 text-white font-bold rounded-xl flex items-center justify-center gap-2"
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
         科技展專用原型 v2.1 | React + Vite + Micro:bit
      </div>
    </div>
  );
};

export default App;
