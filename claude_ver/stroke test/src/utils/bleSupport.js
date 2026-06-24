const baseUrl = import.meta.env?.BASE_URL || '/';
const IOS_WEBBLE_SCRIPT_URL = `${baseUrl}vendor/webble.js`;
const IOS_WEBBLE_SETUP_URL = `${baseUrl}vendor/webble-setup.html`;

const listeners = new Set();
let initPromise = null;
let scriptPromise = null;

const state = {
  platform: 'unknown',
  isIOSSafari: false,
  hasBluetoothApi: false,
  hasNativeBluetooth: false,
  webbleReady: false,
  needsExtension: false,
  status: 'idle',
  message: '',
  setupUrl: IOS_WEBBLE_SETUP_URL,
};

const emit = () => {
  const snapshot = getBleSupportSnapshot();
  listeners.forEach((listener) => listener(snapshot));
};

const updateState = (partial) => {
  Object.assign(state, partial);
  emit();
};

const readPlatform = () => {
  if (typeof navigator === 'undefined') {
    return {
      platform: 'unknown',
      isIOSSafari: false,
      hasBluetoothApi: false,
      hasNativeBluetooth: false,
    };
  }

  const ua = navigator.userAgent || '';
  const vendor = navigator.vendor || '';
  const isAppleMobile = /iPad|iPhone|iPod/.test(ua)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isSafari = /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo/i.test(ua) && /Apple/i.test(vendor);
  const hasBluetoothApi = typeof navigator.bluetooth?.requestDevice === 'function';

  return {
    platform: isAppleMobile && isSafari ? 'ios-safari' : 'other',
    isIOSSafari: Boolean(isAppleMobile && isSafari),
    hasBluetoothApi,
    hasNativeBluetooth: hasBluetoothApi && !(window.webbleIOS || navigator.webble),
  };
};

const syncPlatformState = () => {
  updateState(readPlatform());
};

const loadIOSWebBLEScript = () => {
  if (typeof document === 'undefined') return Promise.resolve();
  if (document.querySelector(`script[data-ios-webble="true"]`)) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = IOS_WEBBLE_SCRIPT_URL;
    script.async = true;
    script.dataset.iosWebble = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('無法載入 iPad 藍牙相容層腳本'));
    document.head.appendChild(script);
  });

  return scriptPromise;
};

const settleIOSWebBLEState = () => {
  const hasBluetoothApi = typeof navigator.bluetooth?.requestDevice === 'function';
  const webbleReady = Boolean(window.webbleIOS || navigator.webble || hasBluetoothApi);

  if (webbleReady) {
    updateState({
      hasBluetoothApi,
      webbleReady: true,
      needsExtension: false,
      status: 'ready',
      message: 'iPad Safari 藍牙相容層已就緒。',
    });
    return;
  }

  updateState({
    hasBluetoothApi,
    webbleReady: false,
    needsExtension: true,
    status: 'needs-extension',
    message: '請先在 iPad Safari 安裝並啟用 WebBLE 擴充，之後重新整理頁面。',
  });
};

const handleReadySignal = () => {
  syncPlatformState();
  settleIOSWebBLEState();
};

const handleNotInstalledSignal = () => {
  updateState({
    webbleReady: false,
    needsExtension: true,
    status: 'needs-extension',
    message: '尚未偵測到 iPad Safari 的 WebBLE 擴充。',
  });
};

export const initBleSupport = async () => {
  if (typeof window === 'undefined') return getBleSupportSnapshot();
  if (initPromise) return initPromise;

  initPromise = (async () => {
    syncPlatformState();

    if (!state.isIOSSafari) {
      updateState({
        webbleReady: state.hasBluetoothApi,
        needsExtension: false,
        status: state.hasBluetoothApi ? 'ready' : 'unsupported',
        message: state.hasBluetoothApi
          ? '使用瀏覽器原生 Web Bluetooth。'
          : '目前瀏覽器不支援 Web Bluetooth。',
      });
      return getBleSupportSnapshot();
    }

    updateState({
      status: 'loading',
      message: '正在檢查 iPad Safari 藍牙相容層...',
    });

    window.addEventListener('ioswebble:ready', handleReadySignal);
    window.addEventListener('webble:extension:ready', handleReadySignal);
    window.addEventListener('ioswebble:notinstalled', handleNotInstalledSignal);

    try {
      await loadIOSWebBLEScript();
    } catch (error) {
      updateState({
        status: 'error',
        message: error.message,
        needsExtension: false,
      });
      return getBleSupportSnapshot();
    }

    syncPlatformState();

    if (state.hasBluetoothApi) {
      settleIOSWebBLEState();
      return getBleSupportSnapshot();
    }

    await new Promise((resolve) => window.setTimeout(resolve, 1800));
    settleIOSWebBLEState();
    return getBleSupportSnapshot();
  })();

  return initPromise;
};

export const subscribeBleSupport = (listener) => {
  listeners.add(listener);
  listener(getBleSupportSnapshot());
  return () => listeners.delete(listener);
};

export const getBleSupportSnapshot = () => ({
  ...state,
  supportsSerial: typeof navigator !== 'undefined' && 'serial' in navigator,
});

export const ensureBleRequestAvailable = async () => {
  const snapshot = await initBleSupport();
  if (typeof navigator?.bluetooth?.requestDevice === 'function') return snapshot;

  if (snapshot.isIOSSafari && snapshot.needsExtension) {
    throw new Error('iPad Safari 尚未啟用 WebBLE 擴充，請先完成安裝與啟用。');
  }

  throw new Error('目前瀏覽器不支援藍牙連線，請改用桌機 Chrome/Edge 或已啟用 WebBLE 的 iPad Safari。');
};

export const getBleInstallSteps = () => [
  '在 iPad 的 Safari 開啟 WebBLE 安裝頁。',
  '安裝 companion app，並在「設定 > Safari > 擴充功能」啟用 WebBLE。',
  '回到本頁重新整理，再點「連結 Micro:bit」。',
];

export const getBleSetupUrl = () => IOS_WEBBLE_SETUP_URL;

export const getBlePlatformHint = (snapshot) => {
  if (snapshot.isIOSSafari) {
    return snapshot.needsExtension
      ? 'iPad Safari 需先啟用 WebBLE 擴充後才能連線。'
      : 'iPad Safari 已準備好，可直接點擊連線。';
  }

  if (snapshot.hasBluetoothApi) {
    return '目前使用瀏覽器原生 Web Bluetooth。';
  }

  return '此瀏覽器缺少 Web Bluetooth 支援。';
};

export const translateBleError = (error) => {
  const message = error?.message || String(error || '');
  const lower = message.toLowerCase();

  if (lower.includes('user cancelled') || lower.includes('cancelled') || lower.includes('user denied')) {
    return '你取消了裝置選擇，請再試一次。';
  }

  if (lower.includes('extension') || lower.includes('webble')) {
    return '尚未啟用 iPad Safari 的 WebBLE 擴充，請先完成安裝與啟用。';
  }

  if (lower.includes('notfounderror') || lower.includes('device not found')) {
    return '找不到符合條件的 micro:bit，請確認裝置已開機並正在廣播藍牙。';
  }

  if (lower.includes('service_discovery_timeout')) {
    return '藍牙服務搜尋逾時，請重新整理頁面後重試。';
  }

  if (lower.includes('uart')) {
    return '未找到 micro:bit 的 UART 服務，請確認燒錄程式已啟用 BLE UART。';
  }

  if (lower.includes('notify')) {
    return '已連到裝置，但通知通道不可用，請確認 micro:bit 程式支援 BLE UART Notify。';
  }

  if (lower.includes('bluetooth') && lower.includes('support')) {
    return '目前瀏覽器不支援藍牙連線。';
  }

  return message;
};
