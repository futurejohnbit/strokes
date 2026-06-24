import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface GameState {
  level: number;
  score: number;
  lives: number;
  currentCharacter: string;
  playerPosition: { x: number; y: number };
  gameStatus: 'menu' | 'playing' | 'paused' | 'completed' | 'failed';
  targetStrokes: string[];
  completedStrokes: string[];
  strokePath: Array<{ x: number; y: number }>;
  currentStroke: string;
  highScore: number;
  settings: {
    soundEnabled: boolean;
    vibrationEnabled: boolean;
    difficulty: 'easy' | 'medium' | 'hard';
    sensitivity: number;
  };
}

const initialState: GameState = {
  level: 1,
  score: 0,
  lives: 3,
  currentCharacter: '口',
  playerPosition: { x: 1, y: 1 },
  gameStatus: 'menu',
  targetStrokes: ['vertical', 'horizontal', 'vertical', 'horizontal'],
  completedStrokes: [],
  strokePath: [],
  currentStroke: '',
  highScore: 0,
  settings: {
    soundEnabled: true,
    vibrationEnabled: true,
    difficulty: 'medium',
    sensitivity: 5,
  },
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    // 開始新遊戲
    startNewGame: (state) => {
      state.level = 1;
      state.score = 0;
      state.lives = 3;
      state.gameStatus = 'playing';
      state.completedStrokes = [];
      state.strokePath = [];
      state.playerPosition = { x: 1, y: 1 };
      state.currentStroke = '';
    },

    // 設置關卡
    setLevel: (state, action: PayloadAction<number>) => {
      state.level = action.payload;
    },

    // 更新分數
    updateScore: (state, action: PayloadAction<number>) => {
      state.score += action.payload;
      if (state.score > state.highScore) {
        state.highScore = state.score;
      }
    },

    // 減少生命
    loseLife: (state) => {
      state.lives = Math.max(0, state.lives - 1);
      if (state.lives === 0) {
        state.gameStatus = 'failed';
      }
    },

    // 移動角色
    movePlayer: (state, action: PayloadAction<{ x: number; y: number }>) => {
      state.playerPosition = action.payload;
      state.strokePath.push(action.payload);
    },

    // 完成筆劃
    completeStroke: (state, action: PayloadAction<string>) => {
      state.completedStrokes.push(action.payload);
      state.currentStroke = action.payload;
      
      // 檢查是否完成所有筆劃
      if (state.completedStrokes.length === state.targetStrokes.length) {
        state.gameStatus = 'completed';
      }
    },

    // 設置遊戲狀態
    setGameStatus: (state, action: PayloadAction<GameState['gameStatus']>) => {
      state.gameStatus = action.payload;
    },

    // 重置筆劃路徑
    resetStrokePath: (state) => {
      state.strokePath = [];
      state.currentStroke = '';
    },

    // 下一關
    nextLevel: (state) => {
      state.level += 1;
      state.lives = 3;
      state.completedStrokes = [];
      state.strokePath = [];
      state.playerPosition = { x: 1, y: 1 };
      state.currentStroke = '';
      state.gameStatus = 'playing';
      
      // 根據關卡設置不同的漢字
      const characters = ['口', '人', '大', '木', '火', '日', '山', '水'];
      state.currentCharacter = characters[(state.level - 1) % characters.length];
      
      // 設置對應的筆劃順序
      const strokePatterns: { [key: string]: string[] } = {
        '口': ['vertical', 'horizontal', 'vertical', 'horizontal'],
        '人': ['left_fall', 'right_fall'],
        '大': ['horizontal', 'left_fall', 'right_fall'],
        '木': ['horizontal', 'vertical', 'left_fall', 'right_fall'],
        '火': ['dot', 'left_fall', 'vertical', 'right_fall'],
        '日': ['vertical', 'horizontal', 'horizontal', 'vertical'],
        '山': ['vertical', 'vertical', 'horizontal', 'vertical'],
        '水': ['vertical', 'horizontal', 'left_fall', 'right_fall'],
      };
      
      state.targetStrokes = strokePatterns[state.currentCharacter] || ['horizontal', 'vertical'];
    },

    // 更新設置
    updateSettings: (state, action: PayloadAction<Partial<GameState['settings']>>) => {
      state.settings = { ...state.settings, ...action.payload };
    },

    // 重置遊戲
    resetGame: (state) => {
      return { ...initialState, highScore: state.highScore, settings: state.settings };
    },
  },
});

export const {
  startNewGame,
  setLevel,
  updateScore,
  loseLife,
  movePlayer,
  completeStroke,
  setGameStatus,
  resetStrokePath,
  nextLevel,
  updateSettings,
  resetGame,
} = gameSlice.actions;

export default gameSlice.reducer;