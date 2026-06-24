import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Animated,
  Dimensions,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import bluetoothService from '../../services/BluetoothService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const MainMenu: React.FC = () => {
  const navigation = useNavigation();
  const [isBluetoothConnected, setIsBluetoothConnected] = useState(false);
  const [availableDevices, setAvailableDevices] = useState<any[]>([]);
  const [titleAnimation] = useState(new Animated.Value(0));
  const [buttonAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    // 啟動動畫
    Animated.sequence([
      Animated.timing(titleAnimation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(buttonAnimation, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // 監聽藍牙狀態
    const handleConnection = () => setIsBluetoothConnected(true);
    const handleDisconnection = () => setIsBluetoothConnected(false);

    bluetoothService.on('connected', handleConnection);
    bluetoothService.on('disconnected', handleDisconnection);

    // 檢查初始連接狀態
    setIsBluetoothConnected(bluetoothService.getConnectionStatus());

    return () => {
      bluetoothService.off('connected', handleConnection);
      bluetoothService.off('disconnected', handleDisconnection);
    };
  }, []);

  // 開始遊戲
  const startGame = () => {
    if (!isBluetoothConnected) {
      Alert.alert(
        '需要連接micro:bit',
        '請先連接micro:bit設備才能開始遊戲',
        [
          { text: '取消', style: 'cancel' },
          { text: '連接設備', onPress: connectBluetooth },
        ]
      );
      return;
    }

    navigation.navigate('GameScreen' as never);
  };

  // 連接藍牙設備
  const connectBluetooth = async () => {
    try {
      const devices = await bluetoothService.scanDevices();
      setAvailableDevices(devices);

      if (devices.length === 0) {
        Alert.alert('未找到設備', '請確保micro:bit已開啟並在附近');
        return;
      }

      // 如果只有一個設備，直接連接
      if (devices.length === 1) {
        const success = await bluetoothService.connectToDevice(devices[0].id);
        if (success) {
          Alert.alert('連接成功', '已成功連接到micro:bit');
        } else {
          Alert.alert('連接失敗', '無法連接到micro:bit，請重試');
        }
        return;
      }

      // 多個設備時顯示選擇列表
      const deviceOptions = devices.map(device => ({
        text: device.name || device.id,
        onPress: () => connectToDevice(device.id),
      }));

      Alert.alert(
        '選擇設備',
        '請選擇要連接的micro:bit設備',
        [
          ...deviceOptions,
          { text: '取消', style: 'cancel' },
        ]
      );
    } catch (error) {
      Alert.alert('掃描失敗', '無法掃描藍牙設備，請檢查權限設置');
    }
  };

  // 連接到指定設備
  const connectToDevice = async (deviceId: string) => {
    try {
      const success = await bluetoothService.connectToDevice(deviceId);
      if (success) {
        Alert.alert('連接成功', '已成功連接到micro:bit');
      } else {
        Alert.alert('連接失敗', '無法連接到micro:bit，請重試');
      }
    } catch (error) {
      Alert.alert('連接錯誤', '連接過程中發生錯誤');
    }
  };

  // 斷開連接
  const disconnectBluetooth = async () => {
    try {
      await bluetoothService.disconnect();
      Alert.alert('已斷開連接', 'micro:bit設備已斷開連接');
    } catch (error) {
      Alert.alert('斷開失敗', '無法斷開連接');
    }
  };

  // 關卡選擇
  const selectLevel = () => {
    navigation.navigate('LevelSelect' as never);
  };

  // 設置
  const openSettings = () => {
    navigation.navigate('Settings' as never);
  };

  // 教學
  const openTutorial = () => {
    navigation.navigate('Tutorial' as never);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1976D2" />
      
      {/* 背景裝飾 */}
      <View style={styles.backgroundDecoration}>
        <View style={[styles.decorationCircle, styles.circle1]} />
        <View style={[styles.decorationCircle, styles.circle2]} />
        <View style={[styles.decorationCircle, styles.circle3]} />
      </View>

      {/* 標題區域 */}
      <Animated.View
        style={[
          styles.titleContainer,
          {
            opacity: titleAnimation,
            transform: [
              {
                translateY: titleAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-50, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.title}>筆劃俠客</Text>
        <Text style={styles.subtitle}>Stroke Hero</Text>
        <Text style={styles.description}>用micro:bit學習漢字筆劃</Text>
      </Animated.View>

      {/* 藍牙狀態 */}
      <View style={styles.bluetoothStatus}>
        <View style={[
          styles.statusIndicator,
          { backgroundColor: isBluetoothConnected ? '#4CAF50' : '#F44336' }
        ]}>
          <Text style={styles.statusText}>
            {isBluetoothConnected ? '✓ micro:bit已連接' : '✗ micro:bit未連接'}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.bluetoothButton,
            { backgroundColor: isBluetoothConnected ? '#F44336' : '#2196F3' }
          ]}
          onPress={isBluetoothConnected ? disconnectBluetooth : connectBluetooth}
        >
          <Text style={styles.bluetoothButtonText}>
            {isBluetoothConnected ? '斷開連接' : '連接設備'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 主選單按鈕 */}
      <Animated.View
        style={[
          styles.menuContainer,
          {
            opacity: buttonAnimation,
            transform: [
              {
                scale: buttonAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.menuButton, styles.startButton]}
          onPress={startGame}
        >
          <Text style={styles.buttonText}>🎮 開始遊戲</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuButton, styles.levelButton]}
          onPress={selectLevel}
        >
          <Text style={styles.buttonText}>📚 關卡選擇</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuButton, styles.tutorialButton]}
          onPress={openTutorial}
        >
          <Text style={styles.buttonText}>📖 遊戲教學</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuButton, styles.settingsButton]}
          onPress={openSettings}
        >
          <Text style={styles.buttonText}>⚙️ 設置</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* 底部信息 */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>版本 1.0.0</Text>
        <Text style={styles.footerText}>適用於小學生漢字學習</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1976D2',
  },
  backgroundDecoration: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  decorationCircle: {
    position: 'absolute',
    borderRadius: 100,
    opacity: 0.1,
  },
  circle1: {
    width: 200,
    height: 200,
    backgroundColor: '#FFFFFF',
    top: -50,
    right: -50,
  },
  circle2: {
    width: 150,
    height: 150,
    backgroundColor: '#FFFFFF',
    bottom: 100,
    left: -30,
  },
  circle3: {
    width: 100,
    height: 100,
    backgroundColor: '#FFFFFF',
    top: screenHeight * 0.4,
    right: 20,
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: screenHeight * 0.1,
    marginBottom: 30,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: '#E3F2FD',
    marginTop: 5,
    fontStyle: 'italic',
  },
  description: {
    fontSize: 14,
    color: '#BBDEFB',
    marginTop: 10,
    textAlign: 'center',
  },
  bluetoothStatus: {
    alignItems: 'center',
    marginBottom: 30,
  },
  statusIndicator: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 10,
  },
  statusText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  bluetoothButton: {
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderRadius: 25,
    elevation: 3,
  },
  bluetoothButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  menuContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  menuButton: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginVertical: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  levelButton: {
    backgroundColor: '#FF9800',
  },
  tutorialButton: {
    backgroundColor: '#9C27B0',
  },
  settingsButton: {
    backgroundColor: '#607D8B',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  footerText: {
    color: '#BBDEFB',
    fontSize: 12,
    marginVertical: 2,
  },
});

export default MainMenu;