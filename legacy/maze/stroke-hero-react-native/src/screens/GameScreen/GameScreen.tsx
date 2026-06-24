import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import GameCanvas from '../../components/GameCanvas/GameCanvas';
import bluetoothService, { StrokeData } from '../../services/BluetoothService';
import Sound from 'react-native-sound';

// 遊戲狀態接口
interface GameState {
  level: number;
  score: number;
  lives: number;
  currentCharacter: string;
  playerPosition: { x: number; y: number };
  mazeData: number[][];
  strokePath: Array<{ x: number; y: number }>;
  currentStroke: string;
  gameStatus: 'playing' | 'paused' | 'completed' | 'failed';
  targetStrokes: string[];
  completedStrokes: string[];
}

// "口" 字迷宮數據 (8x8)
const MAZE_DATA_KOU = [
  [1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 1, 1, 0, 1],
  [1, 0, 1, 0, 0, 1, 0, 1],
  [1, 0, 1, 0, 0, 1, 0, 1],
  [1, 0, 1, 1, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1],
];

const { width: screenWidth } = Dimensions.get('window');

export const GameScreen: React.FC = () => {
  const navigation = useNavigation();
  
  // 遊戲狀態
  const [gameState, setGameState] = useState<GameState>({
    level: 1,
    score: 0,
    lives: 3,
    currentCharacter: '口',
    playerPosition: { x: 1, y: 1 }, // 起始位置
    mazeData: MAZE_DATA_KOU,
    strokePath: [],
    currentStroke: '',
    gameStatus: 'playing',
    targetStrokes: ['vertical', 'horizontal', 'vertical', 'horizontal'], // 口字筆順
    completedStrokes: [],
  });

  // 藍牙連接狀態
  const [isBluetoothConnected, setIsBluetoothConnected] = useState(false);
  
  // 音效
  const [sounds, setSounds] = useState<{ [key: string]: Sound }>({});

  // 初始化音效
  useEffect(() => {
    const soundFiles = {
      success: new Sound('success.mp3', Sound.MAIN_BUNDLE),
      error: new Sound('error.mp3', Sound.MAIN_BUNDLE),
      move: new Sound('move.mp3', Sound.MAIN_BUNDLE),
      complete: new Sound('complete.mp3', Sound.MAIN_BUNDLE),
    };
    setSounds(soundFiles);

    return () => {
      Object.values(soundFiles).forEach(sound => sound.release());
    };
  }, []);

  // 監聽藍牙事件
  useEffect(() => {
    const handleConnection = () => setIsBluetoothConnected(true);
    const handleDisconnection = () => setIsBluetoothConnected(false);
    const handleStrokeDetected = (stroke: StrokeData) => {
      handleStrokeInput(stroke.type, stroke.direction);
    };

    bluetoothService.on('connected', handleConnection);
    bluetoothService.on('disconnected', handleDisconnection);
    bluetoothService.on('strokeDetected', handleStrokeDetected);

    // 檢查初始連接狀態
    setIsBluetoothConnected(bluetoothService.getConnectionStatus());

    return () => {
      bluetoothService.off('connected', handleConnection);
      bluetoothService.off('disconnected', handleDisconnection);
      bluetoothService.off('strokeDetected', handleStrokeDetected);
    };
  }, []);

  // 處理筆劃輸入
  const handleStrokeInput = useCallback((strokeType: string, direction?: string) => {
    if (gameState.gameStatus !== 'playing') return;

    const expectedStroke = gameState.targetStrokes[gameState.completedStrokes.length];
    
    if (strokeType === expectedStroke) {
      // 正確筆劃
      playSound('success');
      
      setGameState(prev => ({
        ...prev,
        completedStrokes: [...prev.completedStrokes, strokeType],
        score: prev.score + 100,
        currentStroke: strokeType,
      }));

      // 移動角色
      if (direction) {
        movePlayer(direction as 'up' | 'down' | 'left' | 'right');
      }

      // 檢查是否完成關卡
      if (gameState.completedStrokes.length + 1 === gameState.targetStrokes.length) {
        completeLevel();
      }
    } else {
      // 錯誤筆劃
      playSound('error');
      setGameState(prev => ({
        ...prev,
        lives: prev.lives - 1,
        score: Math.max(0, prev.score - 50),
      }));

      if (gameState.lives <= 1) {
        gameOver();
      }
    }
  }, [gameState]);

  // 移動角色
  const movePlayer = (direction: 'up' | 'down' | 'left' | 'right') => {
    const { x, y } = gameState.playerPosition;
    let newX = x;
    let newY = y;

    switch (direction) {
      case 'up':
        newY = Math.max(0, y - 1);
        break;
      case 'down':
        newY = Math.min(gameState.mazeData.length - 1, y + 1);
        break;
      case 'left':
        newX = Math.max(0, x - 1);
        break;
      case 'right':
        newX = Math.min(gameState.mazeData[0].length - 1, x + 1);
        break;
    }

    // 檢查是否可以移動（不是牆壁）
    if (gameState.mazeData[newY][newX] === 0) {
      playSound('move');
      setGameState(prev => ({
        ...prev,
        playerPosition: { x: newX, y: newY },
        strokePath: [...prev.strokePath, { x: newX, y: newY }],
      }));
    }
  };

  // 完成關卡
  const completeLevel = () => {
    playSound('complete');
    setGameState(prev => ({
      ...prev,
      gameStatus: 'completed',
      score: prev.score + 500,
    }));

    Alert.alert(
      '恭喜！',
      `你成功完成了"${gameState.currentCharacter}"字的書寫！`,
      [
        { text: '下一關', onPress: nextLevel },
        { text: '返回選單', onPress: () => navigation.goBack() },
      ]
    );
  };

  // 下一關
  const nextLevel = () => {
    setGameState(prev => ({
      ...prev,
      level: prev.level + 1,
      gameStatus: 'playing',
      completedStrokes: [],
      strokePath: [],
      playerPosition: { x: 1, y: 1 },
      lives: 3,
    }));
  };

  // 遊戲結束
  const gameOver = () => {
    setGameState(prev => ({ ...prev, gameStatus: 'failed' }));
    
    Alert.alert(
      '遊戲結束',
      `最終得分: ${gameState.score}`,
      [
        { text: '重新開始', onPress: restartGame },
        { text: '返回選單', onPress: () => navigation.goBack() },
      ]
    );
  };

  // 重新開始遊戲
  const restartGame = () => {
    setGameState(prev => ({
      ...prev,
      score: 0,
      lives: 3,
      gameStatus: 'playing',
      completedStrokes: [],
      strokePath: [],
      playerPosition: { x: 1, y: 1 },
    }));
  };

  // 播放音效
  const playSound = (soundName: string) => {
    const sound = sounds[soundName];
    if (sound) {
      sound.play();
    }
  };

  // 暫停/繼續遊戲
  const togglePause = () => {
    setGameState(prev => ({
      ...prev,
      gameStatus: prev.gameStatus === 'playing' ? 'paused' : 'playing',
    }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2196F3" />
      
      {/* 頂部狀態欄 */}
      <View style={styles.statusBar}>
        <View style={styles.statusLeft}>
          <Text style={styles.statusText}>關卡: {gameState.level}</Text>
          <Text style={styles.statusText}>得分: {gameState.score}</Text>
        </View>
        <View style={styles.statusCenter}>
          <Text style={styles.characterText}>{gameState.currentCharacter}</Text>
        </View>
        <View style={styles.statusRight}>
          <Text style={styles.statusText}>生命: {gameState.lives}</Text>
          <View style={[
            styles.bluetoothStatus,
            { backgroundColor: isBluetoothConnected ? '#4CAF50' : '#F44336' }
          ]}>
            <Text style={styles.bluetoothText}>
              {isBluetoothConnected ? '已連接' : '未連接'}
            </Text>
          </View>
        </View>
      </View>

      {/* 遊戲畫布 */}
      <GameCanvas
        mazeData={gameState.mazeData}
        playerPosition={gameState.playerPosition}
        onPlayerMove={movePlayer}
        strokePath={gameState.strokePath}
        currentStroke={gameState.currentStroke}
      />

      {/* 筆劃進度 */}
      <View style={styles.strokeProgress}>
        <Text style={styles.progressTitle}>筆劃進度:</Text>
        <View style={styles.strokeIndicators}>
          {gameState.targetStrokes.map((stroke, index) => (
            <View
              key={index}
              style={[
                styles.strokeIndicator,
                {
                  backgroundColor: index < gameState.completedStrokes.length
                    ? '#4CAF50'
                    : index === gameState.completedStrokes.length
                    ? '#2196F3'
                    : '#E0E0E0'
                }
              ]}
            >
              <Text style={styles.strokeText}>{index + 1}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 控制按鈕 */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={togglePause}
        >
          <Text style={styles.buttonText}>
            {gameState.gameStatus === 'playing' ? '暫停' : '繼續'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.controlButton, styles.restartButton]}
          onPress={restartGame}
        >
          <Text style={styles.buttonText}>重新開始</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.controlButton, styles.exitButton]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>退出</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E3F2FD',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingHorizontal: 15,
    paddingVertical: 10,
    elevation: 4,
  },
  statusLeft: {
    flex: 1,
  },
  statusCenter: {
    flex: 1,
    alignItems: 'center',
  },
  statusRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  characterText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  bluetoothStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  bluetoothText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  strokeProgress: {
    backgroundColor: 'white',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  strokeIndicators: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  strokeIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  strokeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  controlButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 2,
  },
  restartButton: {
    backgroundColor: '#FF9800',
  },
  exitButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default GameScreen;