import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface BluetoothDevice {
  id: string;
  name: string;
  address?: string;
}

export interface BluetoothState {
  isEnabled: boolean;
  isConnected: boolean;
  connectedDevice: BluetoothDevice | null;
  availableDevices: BluetoothDevice[];
  isScanning: boolean;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'failed';
  lastError: string | null;
  receivedData: any[];
  signalStrength: number;
}

const initialState: BluetoothState = {
  isEnabled: false,
  isConnected: false,
  connectedDevice: null,
  availableDevices: [],
  isScanning: false,
  connectionStatus: 'disconnected',
  lastError: null,
  receivedData: [],
  signalStrength: 0,
};

const bluetoothSlice = createSlice({
  name: 'bluetooth',
  initialState,
  reducers: {
    // 設置藍牙啟用狀態
    setBluetoothEnabled: (state, action: PayloadAction<boolean>) => {
      state.isEnabled = action.payload;
      if (!action.payload) {
        state.isConnected = false;
        state.connectedDevice = null;
        state.connectionStatus = 'disconnected';
      }
    },

    // 開始掃描設備
    startScanning: (state) => {
      state.isScanning = true;
      state.availableDevices = [];
      state.lastError = null;
    },

    // 停止掃描設備
    stopScanning: (state) => {
      state.isScanning = false;
    },

    // 添加發現的設備
    addDevice: (state, action: PayloadAction<BluetoothDevice>) => {
      const existingDevice = state.availableDevices.find(
        device => device.id === action.payload.id
      );
      if (!existingDevice) {
        state.availableDevices.push(action.payload);
      }
    },

    // 清空設備列表
    clearDevices: (state) => {
      state.availableDevices = [];
    },

    // 開始連接
    startConnecting: (state, action: PayloadAction<BluetoothDevice>) => {
      state.connectionStatus = 'connecting';
      state.lastError = null;
    },

    // 連接成功
    deviceConnected: (state, action: PayloadAction<BluetoothDevice>) => {
      state.isConnected = true;
      state.connectedDevice = action.payload;
      state.connectionStatus = 'connected';
      state.lastError = null;
    },

    // 連接失敗
    connectionFailed: (state, action: PayloadAction<string>) => {
      state.isConnected = false;
      state.connectedDevice = null;
      state.connectionStatus = 'failed';
      state.lastError = action.payload;
    },

    // 設備斷開連接
    deviceDisconnected: (state) => {
      state.isConnected = false;
      state.connectedDevice = null;
      state.connectionStatus = 'disconnected';
      state.receivedData = [];
      state.signalStrength = 0;
    },

    // 接收數據
    dataReceived: (state, action: PayloadAction<any>) => {
      state.receivedData.push({
        ...action.payload,
        timestamp: Date.now(),
      });
      
      // 只保留最近100條數據
      if (state.receivedData.length > 100) {
        state.receivedData = state.receivedData.slice(-100);
      }
    },

    // 更新信號強度
    updateSignalStrength: (state, action: PayloadAction<number>) => {
      state.signalStrength = action.payload;
    },

    // 設置錯誤
    setError: (state, action: PayloadAction<string>) => {
      state.lastError = action.payload;
    },

    // 清除錯誤
    clearError: (state) => {
      state.lastError = null;
    },

    // 清除接收數據
    clearReceivedData: (state) => {
      state.receivedData = [];
    },

    // 重置藍牙狀態
    resetBluetoothState: (state) => {
      return { ...initialState, isEnabled: state.isEnabled };
    },
  },
});

export const {
  setBluetoothEnabled,
  startScanning,
  stopScanning,
  addDevice,
  clearDevices,
  startConnecting,
  deviceConnected,
  connectionFailed,
  deviceDisconnected,
  dataReceived,
  updateSignalStrength,
  setError,
  clearError,
  clearReceivedData,
  resetBluetoothState,
} = bluetoothSlice.actions;

export default bluetoothSlice.reducer;