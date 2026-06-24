
import { renderHook, act } from '@testing-library/react-hooks';
import { useGameTimer, formatTimeMMSS, formatTimeHHMMSS } from '../utils/timerUtils';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    clear: () => { store = {}; },
    removeItem: (key) => { delete store[key]; }
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('Timer Utils', () => {
  
  beforeEach(() => {
    localStorage.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('formatTimeMMSS formats seconds correctly', () => {
    expect(formatTimeMMSS(0)).toBe('00:00');
    expect(formatTimeMMSS(65)).toBe('01:05');
    expect(formatTimeMMSS(3600)).toBe('60:00');
  });

  test('formatTimeHHMMSS formats seconds correctly', () => {
    expect(formatTimeHHMMSS(0)).toBe('00:00:00');
    expect(formatTimeHHMMSS(3661)).toBe('01:01:01');
    expect(formatTimeHHMMSS(7200)).toBe('02:00:00');
  });

  describe('useGameTimer Hook', () => {
    test('should initialize with 0 or stored time', () => {
      const { result } = renderHook(() => useGameTimer());
      expect(result.current.totalGameTime).toBe(0);

      localStorage.setItem('totalGameTime', '100');
      const { result: result2 } = renderHook(() => useGameTimer());
      expect(result2.current.totalGameTime).toBe(100);
    });

    test('should track level duration', () => {
      const { result } = renderHook(() => useGameTimer());

      act(() => {
        result.current.startLevelTimer();
      });

      // Fast-forward 10 seconds
      act(() => {
        jest.advanceTimersByTime(10000);
      });

      let duration;
      act(() => {
        duration = result.current.stopLevelTimer();
      });

      expect(duration).toBe(10);
      expect(result.current.currentLevelTime).toBe(10);
    });

    test('should accumulate total time', () => {
      const { result } = renderHook(() => useGameTimer());

      // Level 1: 5 seconds
      act(() => {
        result.current.startLevelTimer();
        jest.advanceTimersByTime(5000);
        result.current.stopLevelTimer();
      });

      expect(result.current.totalGameTime).toBe(5);
      expect(localStorage.getItem('totalGameTime')).toBe('5');

      // Level 2: 3 seconds
      act(() => {
        result.current.startLevelTimer();
        jest.advanceTimersByTime(3000);
        result.current.stopLevelTimer();
      });

      expect(result.current.totalGameTime).toBe(8);
      expect(localStorage.getItem('totalGameTime')).toBe('8');
    });

    test('should reset total time', () => {
      localStorage.setItem('totalGameTime', '50');
      const { result } = renderHook(() => useGameTimer());

      expect(result.current.totalGameTime).toBe(50);

      act(() => {
        result.current.resetTotalTime();
      });

      expect(result.current.totalGameTime).toBe(0);
      expect(localStorage.getItem('totalGameTime')).toBe('0');
    });
  });
});
