import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  PanResponder,
  Animated,
} from 'react-native';
import Svg, { Rect, Circle, Path, Text as SvgText } from 'react-native-svg';

interface GameCanvasProps {
  mazeData: number[][];
  playerPosition: { x: number; y: number };
  onPlayerMove: (direction: 'up' | 'down' | 'left' | 'right') => void;
  strokePath: Array<{ x: number; y: number }>;
  currentStroke: string;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const CANVAS_SIZE = Math.min(screenWidth * 0.9, screenHeight * 0.6);
const CELL_SIZE = CANVAS_SIZE / 8; // 8x8 迷宮

export const GameCanvas: React.FC<GameCanvasProps> = ({
  mazeData,
  playerPosition,
  onPlayerMove,
  strokePath,
  currentStroke,
}) => {
  const [playerAnimation] = useState(new Animated.ValueXY());
  const [strokeAnimation] = useState(new Animated.Value(0));

  // 角色移動動畫
  useEffect(() => {
    Animated.spring(playerAnimation, {
      toValue: {
        x: playerPosition.x * CELL_SIZE,
        y: playerPosition.y * CELL_SIZE,
      },
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start();
  }, [playerPosition]);

  // 筆劃軌跡動畫
  useEffect(() => {
    if (strokePath.length > 0) {
      strokeAnimation.setValue(0);
      Animated.timing(strokeAnimation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    }
  }, [strokePath]);

  // 渲染迷宮牆壁
  const renderMaze = () => {
    const walls = [];
    for (let row = 0; row < mazeData.length; row++) {
      for (let col = 0; col < mazeData[row].length; col++) {
        if (mazeData[row][col] === 1) {
          walls.push(
            <Rect
              key={`wall-${row}-${col}`}
              x={col * CELL_SIZE}
              y={row * CELL_SIZE}
              width={CELL_SIZE}
              height={CELL_SIZE}
              fill="#8D6E63" // 城牆顏色
              stroke="#5D4037"
              strokeWidth={2}
            />
          );
        }
      }
    }
    return walls;
  };

  // 渲染筆劃路徑
  const renderStrokePath = () => {
    if (strokePath.length < 2) return null;

    const pathData = strokePath.reduce((path, point, index) => {
      const x = point.x * CELL_SIZE + CELL_SIZE / 2;
      const y = point.y * CELL_SIZE + CELL_SIZE / 2;
      return index === 0 ? `M ${x} ${y}` : `${path} L ${x} ${y}`;
    }, '');

    const strokeColor = getStrokeColor(currentStroke);

    return (
      <Path
        d={pathData}
        stroke={strokeColor}
        strokeWidth={8}
        fill="none"
        strokeLinecap="round"
        strokeDasharray="10,5"
        opacity={0.8}
      />
    );
  };

  // 根據筆劃類型獲取顏色
  const getStrokeColor = (stroke: string): string => {
    switch (stroke) {
      case 'horizontal': return '#2196F3'; // 藍色
      case 'vertical': return '#F44336';   // 紅色
      case 'left_fall': return '#4CAF50'; // 綠色
      case 'right_fall': return '#FF9800'; // 橙色
      case 'dot': return '#9C27B0';        // 紫色
      default: return '#757575';           // 灰色
    }
  };

  // 渲染角色
  const renderCharacter = () => {
    return (
      <Animated.View
        style={[
          styles.character,
          {
            transform: [
              { translateX: playerAnimation.x },
              { translateY: playerAnimation.y },
            ],
          },
        ]}
      >
        <Circle
          cx={CELL_SIZE / 2}
          cy={CELL_SIZE / 2}
          r={CELL_SIZE / 3}
          fill="#2196F3"
          stroke="#1976D2"
          strokeWidth={3}
        />
        <SvgText
          x={CELL_SIZE / 2}
          y={CELL_SIZE / 2 + 5}
          fontSize={CELL_SIZE / 4}
          fill="white"
          textAnchor="middle"
        >
          明
        </SvgText>
      </Animated.View>
    );
  };

  // 渲染起點和終點
  const renderSpecialCells = () => {
    const elements = [];
    
    // 起點 (傳送門)
    elements.push(
      <Circle
        key="start"
        cx={CELL_SIZE / 2}
        cy={CELL_SIZE / 2}
        r={CELL_SIZE / 3}
        fill="#00BCD4"
        opacity={0.7}
      />
    );

    // 終點 (寶箱)
    const endX = (mazeData[0].length - 1) * CELL_SIZE;
    const endY = (mazeData.length - 1) * CELL_SIZE;
    elements.push(
      <Rect
        key="end"
        x={endX + CELL_SIZE / 4}
        y={endY + CELL_SIZE / 4}
        width={CELL_SIZE / 2}
        height={CELL_SIZE / 2}
        fill="#FFD700"
        stroke="#FFA000"
        strokeWidth={2}
      />
    );

    return elements;
  };

  return (
    <View style={styles.container}>
      <View style={styles.canvasContainer}>
        <Svg width={CANVAS_SIZE} height={CANVAS_SIZE} style={styles.svg}>
          {/* 背景 */}
          <Rect
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            fill="#E8F5E8"
          />
          
          {/* 迷宮牆壁 */}
          {renderMaze()}
          
          {/* 特殊格子 */}
          {renderSpecialCells()}
          
          {/* 筆劃路徑 */}
          {renderStrokePath()}
        </Svg>
        
        {/* 角色 (使用Animated.View以支持動畫) */}
        {renderCharacter()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  canvasContainer: {
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
    position: 'relative',
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  character: {
    position: 'absolute',
    width: CELL_SIZE,
    height: CELL_SIZE,
    zIndex: 10,
  },
});

export default GameCanvas;