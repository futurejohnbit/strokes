import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Sword, Shield, Zap, Award, Bluetooth, User, Ghost } from 'lucide-react';

// 遊戲常數與資料設定
const GAME_STATE = {
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  WON: 'WON',
  LOST: 'LOST',
};

// 迷宮地圖數據結構
const MAZE_DATA = {
  // 網格大小
  gridSize: 20,
  // 地圖尺寸 (格數)
  mapWidth: 15,
  mapHeight: 15,
  // 筆劃路徑數據
  strokes: [
    {
      id: 1,
      type: 'horizontal',
      direction: 'right',
      hint: '向右揮動 (一)',
      // 筆劃在網格中的路徑點
      path: [
        {x: 2, y: 7},
        {x: 3, y: 7},
        {x: 4, y: 7},
        {x: 5, y: 7},
        {x: 6, y: 7},
        {x: 7, y: 7},
        {x: 8, y: 7},
        {x: 9, y: 7},
        {x: 10, y: 7},
        {x: 11, y: 7},
        {x: 12, y: 7}
      ]
    },
    {
      id: 2,
      type: 'throw',
      direction: 'left-down',
      hint: '向左下揮動 (丿)',
      path: [
        {x: 7, y: 7},
        {x: 6, y: 8},
        {x: 5, y: 9},
        {x: 4, y: 10},
        {x: 3, y: 11},
        {x: 2, y: 12}
      ]
    },
    {
      id: 3,
      type: 'press',
      direction: 'right-down',
      hint: '向右下揮動 (丶)',
      path: [
        {x: 7, y: 7},
        {x: 8, y: 8},
        {x: 9, y: 9},
        {x: 10, y: 10},
        {x: 11, y: 11},
        {x: 12, y: 12}
      ]
    }
  ]
};

// 當前關卡數據
const LEVEL_DATA = {
  char: '大',
  pinyin: 'dà',
  meaning: 'Big / Great',
  maze: MAZE_DATA
};

const App = () => {
  const [gameState, setGameState] = useState(GAME_STATE.MENU);
  const [currentStrokeIndex, setCurrentStrokeIndex] = useState(0);
  const [currentPathIndex, setCurrentPathIndex] = useState(0);
  const [playerPosition, setPlayerPosition] = useState({x: 2, y: 7});
  const [monsterPosition, setMonsterPosition] = useState({x: 0, y: 7});
  const [monsterDistance, setMonsterDistance] = useState(100);
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState('');
  const [shakeIntensity, setShakeIntensity] = useState(0);
  const [completedPaths, setCompletedPaths] = useState([]);

  // 獲取當前筆劃路徑
  const getCurrentStrokePath = () => {
    return LEVEL_DATA.maze.strokes[currentStrokeIndex]?.path || [];
  };

  // 獲取玩家應該移動到的下一個位置
  const getNextPlayerPosition = () => {
    const currentPath = getCurrentStrokePath();
    if (currentPathIndex < currentPath.length - 1) {
      return currentPath[currentPathIndex + 1];
    }
    return null;
  };

  // 模擬 Micro:bit 輸入監聽
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== GAME_STATE.PLAYING) return;

      let inputDirection = null;
      
      switch(e.key) {
        case 'ArrowRight': inputDirection = 'right'; break;
        case 'ArrowDown': inputDirection = 'down'; break;
        case 'ArrowLeft': inputDirection = 'left-down'; break;
        case 'd': inputDirection = 'right-down'; break;
        default: break;
      }

      // 智能判斷撇捺
      const currentTarget = LEVEL_DATA.maze.strokes[currentStrokeIndex];
      if (currentTarget?.direction === 'left-down' && e.key === 'ArrowLeft') inputDirection = 'left-down';
      if (currentTarget?.direction === 'right-down' && e.key === 'ArrowRight') inputDirection = 'right-down';

      if (inputDirection && currentTarget && inputDirection === currentTarget.direction) {
        movePlayerForward();
      } else if (inputDirection) {
        // 錯誤輸入
        setFeedback('筆劃方向錯誤！怪物逼近了！');
        setFeedbackType('error');
        setMonsterDistance(prev => Math.max(prev - 15, 0));
        setShakeIntensity(20);
        setTimeout(() => setShakeIntensity(0), 500);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, currentStrokeIndex, currentPathIndex]);

  // 怪物移動循環
  useEffect(() => {
    let interval;
    if (gameState === GAME_STATE.PLAYING) {
      interval = setInterval(() => {
        moveMonsterForward();
        setMonsterDistance(prev => {
          const newDist = prev - 3;
          if (newDist <= 0) {
            setGameState(GAME_STATE.LOST);
            return 0;
          }
          return newDist;
        });
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [gameState, playerPosition]);

  // 玩家向前移動
  const movePlayerForward = () => {
    const nextPos = getNextPlayerPosition();
    if (nextPos) {
      setPlayerPosition(nextPos);
      setCurrentPathIndex(prev => prev + 1);
      
      setFeedback('完美！');
      setFeedbackType('success');
      setMonsterDistance(prev => Math.min(prev + 8, 100));
      setShakeIntensity(5);
      setTimeout(() => setShakeIntensity(0), 200);

      // 檢查是否完成當前筆劃
      const currentPath = getCurrentStrokePath();
      if (currentPathIndex >= currentPath.length - 2) {
        // 完成當前筆劃
        setCompletedPaths(prev => [...prev, currentStrokeIndex]);
        
        setTimeout(() => {
          if (currentStrokeIndex + 1 < LEVEL_DATA.maze.strokes.length) {
            // 進入下一筆劃
            setCurrentStrokeIndex(prev => prev + 1);
            setCurrentPathIndex(0);
            const nextStroke = LEVEL_DATA.maze.strokes[currentStrokeIndex + 1];
            setPlayerPosition(nextStroke.path[0]);
            setFeedback('筆劃完成！進入下一筆');
          } else {
            // 完成所有筆劃
            setGameState(GAME_STATE.WON);
          }
        }, 1000);
      }
    }
  };

  // 怪物向前移動
  const moveMonsterForward = () => {
    const allPaths = LEVEL_DATA.maze.strokes.flatMap(stroke => stroke.path);
    const playerIndex = allPaths.findIndex(pos => 
      pos.x === playerPosition.x && pos.y === playerPosition.y
    );
    
    if (playerIndex > 0) {
      const targetPos = allPaths[playerIndex - 1];
      setMonsterPosition(targetPos);
      
      // 檢查是否抓到玩家
      if (targetPos.x === playerPosition.x && targetPos.y === playerPosition.y) {
        setGameState(GAME_STATE.LOST);
      }
    }
  };

  const startGame = () => {
    setGameState(GAME_STATE.PLAYING);
    setCurrentStrokeIndex(0);
    setCurrentPathIndex(0);
    setPlayerPosition({x: 2, y: 7});
    setMonsterPosition({x: 0, y: 7});
    setMonsterDistance(100);
    setCompletedPaths([]);
    setFeedback('準備好你的神筆 (Micro:bit)!');
    setFeedbackType('info');
  };

  // 渲染迷宮地圖
  const renderMaze = () => {
    const cellSize = LEVEL_DATA.maze.gridSize;
    const allPathCells = new Set();
    
    // 收集所有路徑點
    LEVEL_DATA.maze.strokes.forEach(stroke => {
      stroke.path.forEach(pos => {
        allPathCells.add(`${pos.x},${pos.y}`);
      });
    });

    return (
      <div className="relative w-full max-w-2xl aspect-square bg-green-100 rounded-xl shadow-inner border-4 border-green-300 overflow-hidden mx-auto mt-4">
        {/* 網格背景 */}
        <svg 
          width="100%" 
          height="100%" 
          viewBox={`0 0 ${LEVEL_DATA.maze.mapWidth * cellSize} ${LEVEL_DATA.maze.mapHeight * cellSize}`}
          className="absolute inset-0"
        >
          {/* 繪製網格 */}
          {Array.from({length: LEVEL_DATA.maze.mapWidth + 1}).map((_, i) => (
            <line 
              key={`v-${i}`}
              x1={i * cellSize} 
              y1={0} 
              x2={i * cellSize} 
              y2={LEVEL_DATA.maze.mapHeight * cellSize}
              stroke="#22c55e" 
              strokeWidth="1" 
              opacity="0.3"
            />
          ))}
          {Array.from({length: LEVEL_DATA.maze.mapHeight + 1}).map((_, i) => (
            <line 
              key={`h-${i}`}
              x1={0} 
              y1={i * cellSize} 
              x2={LEVEL_DATA.maze.mapWidth * cellSize} 
              y2={i * cellSize}
              stroke="#22c55e" 
              strokeWidth="1" 
              opacity="0.3"
            />
          ))}
          
          {/* 繪製筆劃路徑 */}
          {LEVEL_DATA.maze.strokes.map((stroke, strokeIndex) => (
            <g key={stroke.id}>
              {stroke.path.map((pos, posIndex) => {
                const isCompleted = completedPaths.includes(strokeIndex);
                const isCurrent = strokeIndex === currentStrokeIndex;
                const isPassed = isCurrent && posIndex <= currentPathIndex;
                
                return (
                  <rect
                    key={`${stroke.id}-${posIndex}`}
                    x={pos.x * cellSize + 2}
                    y={pos.y * cellSize + 2}
                    width={cellSize - 4}
                    height={cellSize - 4}
                    fill={isCompleted ? '#3b82f6' : (isPassed ? '#60a5fa' : isCurrent ? '#fbbf24' : '#d1d5db')}
                    stroke={isCurrent ? '#f59e0b' : '#9ca3af'}
                    strokeWidth={isCurrent ? '2' : '1'}
                    className={isCurrent ? 'animate-pulse' : ''}
                  />
                );
              })}
            </g>
          ))}
        </svg>
        
        {/* 玩家角色 */}
        <div 
          className="absolute transition-all duration-300 z-10"
          style={{
            left: playerPosition.x * cellSize + cellSize/4,
            top: playerPosition.y * cellSize + cellSize/4,
            width: cellSize/2,
            height: cellSize/2
          }}
        >
          <div className="w-full h-full bg-blue-600 rounded-full border-2 border-blue-800 flex items-center justify-center shadow-lg">
            <User size={cellSize/3} className="text-white" />
          </div>
        </div>

        {/* 怪物 */}
        <div 
          className="absolute transition-all duration-1000 z-5"
          style={{
            left: monsterPosition.x * cellSize + cellSize/4,
            top: monsterPosition.y * cellSize + cellSize/4,
            width: cellSize/2,
            height: cellSize/2
          }}
        >
          <div className="w-full h-full bg-red-600 rounded-full border-2 border-red-800 flex items-center justify-center shadow-lg animate-bounce">
            <Ghost size={cellSize/3} className="text-white" />
          </div>
        </div>

        {/* 當前筆劃提示 */}
        {LEVEL_DATA.maze.strokes[currentStrokeIndex] && (
          <div className="absolute top-2 left-2 bg-yellow-200 px-3 py-1 rounded-lg border-2 border-yellow-400">
            <div className="text-sm font-bold text-yellow-800">
              下一筆：{LEVEL_DATA.maze.strokes[currentStrokeIndex].hint}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`min-h-screen bg-slate-800 text-slate-100 font-sans flex flex-col items-center p-4 ${shakeIntensity > 0 ? 'translate-x-1' : ''}`} 
         style={{transform: `translate(${Math.random() * shakeIntensity}px, ${Math.random() * shakeIntensity}px)`}}>
      
      <header className="w-full max-w-2xl flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-amber-400">
          <div className="bg-amber-500 text-slate-900 p-1 rounded">迷</div>
          筆劃迷宮
        </h1>
        <div className="text-sm bg-slate-700 px-3 py-1 rounded-full flex items-center gap-2">
          <Bluetooth size={14} className="text-blue-400" /> 
          <span>迷宮模式 (使用鍵盤)</span>
        </div>
      </header>

      {gameState === GAME_STATE.MENU && (
        <div className="bg-slate-700 p-8 rounded-2xl shadow-2xl text-center max-w-2xl w-full border border-slate-600">
          <div className="mb-6 text-6xl animate-bounce">🏃‍♂️</div>
          <h2 className="text-xl font-bold mb-4 text-amber-300">準備好穿越筆劃迷宮了嗎？</h2>
          <p className="text-slate-300 mb-6 leading-relaxed text-left">
            拿起你的 Micro:bit，按照正確的筆順揮動，讓角色在迷宮中前進！小心後方的怪物，它會沿著你走過的路徑追趕你！
          </p>
          
          <div className="bg-slate-800 p-4 rounded-lg mb-6 text-sm text-left space-y-2">
            <p className="text-gray-400 font-bold">操作指南：</p>
            <p>➡️ <span className="text-amber-400">橫劃 (一)</span>：按右鍵 - 角色向右移動</p>
            <p>⬇️ <span className="text-amber-400">豎劃 (丨)</span>：按下鍵 - 角色向下移動</p>
            <p>↙️ <span className="text-amber-400">撇劃 (丿)</span>：按左鍵 - 角色向左下移動</p>
            <p>↘️ <span className="text-amber-400">捺劃 (丶)</span>：按右鍵 - 角色向右下移動</p>
          </div>

          <button 
            onClick={startGame}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-amber-500/20"
          >
            <Play size={20} /> 開始冒險
          </button>
        </div>
      )}

      {gameState === GAME_STATE.PLAYING && (
        <div className="w-full max-w-2xl space-y-4">
          {/* 狀態列 */}
          <div className="flex justify-between items-center bg-slate-700 p-3 rounded-xl border border-slate-600">
            <div className="flex flex-col">
               <span className="text-xs text-slate-400">當前漢字</span>
               <span className="text-2xl font-bold text-white">{LEVEL_DATA.char}</span>
            </div>
            <div className="flex-1 mx-4">
              <div className="flex justify-between text-xs mb-1">
                <span>怪物距離</span>
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

          {/* 迷宮地圖 */}
          {renderMaze()}

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
              使用方向鍵控制角色移動，完成筆劃順序
            </div>
          </div>
        </div>
      )}

      {gameState === GAME_STATE.WON && (
        <div className="bg-slate-700 p-8 rounded-2xl shadow-2xl text-center max-w-2xl w-full border border-amber-500/50">
          <div className="mb-4 text-6xl">🏆</div>
          <h2 className="text-2xl font-bold mb-2 text-amber-400">迷宮通關！</h2>
          <p className="text-slate-300 mb-6">你成功完成了「大」字的所有筆劃，逃出了迷宮！</p>
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
        <div className="bg-slate-700 p-8 rounded-2xl shadow-2xl text-center max-w-2xl w-full border border-red-500/50">
          <div className="mb-4 text-6xl">👾</div>
          <h2 className="text-2xl font-bold mb-2 text-red-400">被怪物抓住了...</h2>
          <p className="text-slate-300 mb-6">怪物追上了你。記得要寫得又快又準喔！</p>
          <button 
            onClick={startGame}
            className="w-full py-3 bg-slate-600 hover:bg-slate-500 text-white font-bold rounded-xl flex items-center justify-center gap-2"
          >
            <RotateCcw size={18} /> 重新挑戰
          </button>
        </div>
      )}

      <div className="mt-8 text-xs text-slate-500 max-w-xs text-center">
         迷宮模式原型 v1.0 | 筆劃學習遊戲<br/>
         React + Tailwind CSS | Micro:bit Maze Concept
      </div>
    </div>
  );
};

export default App;