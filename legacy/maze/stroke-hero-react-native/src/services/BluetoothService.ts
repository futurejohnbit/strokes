import BluetoothSerial from 'react-native-bluetooth-serial';
import { EventEmitter } from 'events';

export interface StrokeData {
  type: 'horizontal' | 'vertical' | 'left_fall' | 'right_fall' | 'dot';
  direction?: 'up' | 'down' | 'left' | 'right';
  timestamp: number;
}

export interface MicrobitData {
  accelerometer: { x: number; y: number; z: number };
  button_a: boolean;
  button_b: boolean;
  stroke: StrokeData | null;
}

class BluetoothService extends EventEmitter {
  private isConnected: boolean = false;
  private connectedDevice: any = null;
  private dataBuffer: string = '';

  constructor() {
    super();
    this.initializeBluetooth();
  }

  private async initializeBluetooth() {
    try {
      // 檢查藍牙是否可用
      const isEnabled = await BluetoothSerial.isEnabled();
      if (!isEnabled) {
        await BluetoothSerial.enable();
      }
      
      // 監聽藍牙狀態變化
      BluetoothSerial.on('bluetoothEnabled', () => {
        console.log('藍牙已啟用');
        this.emit('bluetoothEnabled');
      });

      BluetoothSerial.on('bluetoothDisabled', () => {
        console.log('藍牙已停用');
        this.emit('bluetoothDisabled');
      });

      // 監聽連接狀態
      BluetoothSerial.on('connectionSuccess', () => {
        console.log('藍牙連接成功');
        this.isConnected = true;
        this.emit('connected');
      });

      BluetoothSerial.on('connectionFailed', () => {
        console.log('藍牙連接失敗');
        this.isConnected = false;
        this.emit('connectionFailed');
      });

      BluetoothSerial.on('connectionLost', () => {
        console.log('藍牙連接中斷');
        this.isConnected = false;
        this.connectedDevice = null;
        this.emit('disconnected');
      });

      // 監聽數據接收
      BluetoothSerial.on('data', (data: any) => {
        this.handleIncomingData(data.data);
      });

    } catch (error) {
      console.error('藍牙初始化失敗:', error);
      this.emit('error', error);
    }
  }

  // 掃描可用設備
  async scanDevices(): Promise<any[]> {
    try {
      const devices = await BluetoothSerial.list();
      return devices.filter(device => 
        device.name && device.name.includes('BBC micro:bit')
      );
    } catch (error) {
      console.error('掃描設備失敗:', error);
      throw error;
    }
  }

  // 連接到micro:bit
  async connectToDevice(deviceId: string): Promise<boolean> {
    try {
      if (this.isConnected) {
        await this.disconnect();
      }

      await BluetoothSerial.connect(deviceId);
      this.connectedDevice = deviceId;
      return true;
    } catch (error) {
      console.error('連接設備失敗:', error);
      this.emit('connectionFailed', error);
      return false;
    }
  }

  // 斷開連接
  async disconnect(): Promise<void> {
    try {
      if (this.isConnected) {
        await BluetoothSerial.disconnect();
        this.isConnected = false;
        this.connectedDevice = null;
      }
    } catch (error) {
      console.error('斷開連接失敗:', error);
    }
  }

  // 發送命令到micro:bit
  async sendCommand(command: string): Promise<void> {
    if (!this.isConnected) {
      throw new Error('設備未連接');
    }

    try {
      await BluetoothSerial.write(command + '\n');
      console.log('發送命令:', command);
    } catch (error) {
      console.error('發送命令失敗:', error);
      throw error;
    }
  }

  // 處理接收到的數據
  private handleIncomingData(data: string) {
    this.dataBuffer += data;
    
    // 處理完整的JSON消息
    const lines = this.dataBuffer.split('\n');
    this.dataBuffer = lines.pop() || ''; // 保留不完整的行

    for (const line of lines) {
      if (line.trim()) {
        try {
          const parsedData: MicrobitData = JSON.parse(line.trim());
          this.emit('dataReceived', parsedData);
          
          // 如果檢測到筆劃，發出特定事件
          if (parsedData.stroke) {
            this.emit('strokeDetected', parsedData.stroke);
          }
          
          // 如果檢測到按鈕按下，發出特定事件
          if (parsedData.button_a) {
            this.emit('buttonA');
          }
          if (parsedData.button_b) {
            this.emit('buttonB');
          }
          
        } catch (error) {
          console.error('解析數據失敗:', line, error);
        }
      }
    }
  }

  // 校準micro:bit
  async calibrate(): Promise<void> {
    await this.sendCommand('CALIBRATE');
  }

  // 開始遊戲模式
  async startGameMode(): Promise<void> {
    await this.sendCommand('START_GAME');
  }

  // 停止遊戲模式
  async stopGameMode(): Promise<void> {
    await this.sendCommand('STOP_GAME');
  }

  // 設置靈敏度
  async setSensitivity(level: number): Promise<void> {
    if (level < 1 || level > 10) {
      throw new Error('靈敏度必須在1-10之間');
    }
    await this.sendCommand(`SENSITIVITY:${level}`);
  }

  // 獲取連接狀態
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  // 獲取已連接設備
  getConnectedDevice(): string | null {
    return this.connectedDevice;
  }

  // 測試連接
  async testConnection(): Promise<boolean> {
    try {
      await this.sendCommand('PING');
      return true;
    } catch (error) {
      return false;
    }
  }
}

// 單例模式
export const bluetoothService = new BluetoothService();
export default bluetoothService;