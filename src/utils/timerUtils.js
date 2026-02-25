
import { useState, useEffect, useRef } from 'react';

/**
 * 遊戲計時器 Hook
 * 用於記錄關卡耗時與總累積時間
 */
export const useGameTimer = () => {
  const [levelStartTime, setLevelStartTime] = useState(null);
  const [currentLevelTime, setCurrentLevelTime] = useState(0); // 本關耗時 (秒)
  const [totalGameTime, setTotalGameTime] = useState(0); // 總累積時間 (秒)
  
  // 初始化總時間 (從 LocalStorage 讀取)
  useEffect(() => {
    const storedTotalTime = localStorage.getItem('totalGameTime');
    if (storedTotalTime) {
      setTotalGameTime(parseInt(storedTotalTime, 10));
    }
  }, []);

  // 開始關卡計時
  const startLevelTimer = () => {
    setLevelStartTime(Date.now());
    setCurrentLevelTime(0);
  };

  // 結束關卡計時並結算
  const stopLevelTimer = () => {
    if (!levelStartTime) return 0;
    
    const now = Date.now();
    const durationInSeconds = Math.floor((now - levelStartTime) / 1000);
    
    setCurrentLevelTime(durationInSeconds);
    
    // 更新總時間
    const newTotalTime = totalGameTime + durationInSeconds;
    setTotalGameTime(newTotalTime);
    
    // 持久化保存
    localStorage.setItem('totalGameTime', newTotalTime.toString());
    
    setLevelStartTime(null);
    return durationInSeconds;
  };

  // 重置總時間 (例如新遊戲開始)
  const resetTotalTime = () => {
    setTotalGameTime(0);
    localStorage.setItem('totalGameTime', '0');
  };

  return {
    startLevelTimer,
    stopLevelTimer,
    resetTotalTime,
    currentLevelTime,
    totalGameTime
  };
};

/**
 * 格式化時間 (秒 -> MM:SS)
 */
export const formatTimeMMSS = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

/**
 * 格式化時間 (秒 -> HH:MM:SS)
 */
export const formatTimeHHMMSS = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};
