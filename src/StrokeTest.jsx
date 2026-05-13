import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Bluetooth, Trash2, Unplug } from 'lucide-react';

const UART_SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';

export default function StrokeTest() {
  const [isConnected, setIsConnected] = useState(false);
  const [isSerialConnected, setIsSerialConnected] = useState(false);
  const [error, setError] = useState('');
  const [currentStroke, setCurrentStroke] = useState('無');
  const [currentAngle, setCurrentAngle] = useState(0);
  const [magnitude, setMagnitude] = useState(0);
  const [logs, setLogs] = useState([]);
  const [rawXYZ, setRawXYZ] = useState({ x: 0, y: 0, z: 0 });
  const [invertY, setInvertY] = useState(false);
  const [source, setSource] = useState('ble');
  const [wsUrl, setWsUrl] = useState('');
  const [wsConnected, setWsConnected] = useState(false);
  const [useGate, setUseGate] = useState(true);
  const [gateActive, setGateActive] = useState(false);
  const [idleTimeoutMs, setIdleTimeoutMs] = useState(180);
  const [minStepMm, setMinStepMm] = useState(1.2);
  const [turnDeg, setTurnDeg] = useState(65);
  const [minSegLenMm, setMinSegLenMm] = useState(10);
  const [hookMaxRatio, setHookMaxRatio] = useState(0.35);
  const [useMlHint, setUseMlHint] = useState(false);

  const canvasRef = useRef(null);
  const deviceRef = useRef(null);
  const characteristicRef = useRef(null);
  const decoderRef = useRef(new TextDecoder('utf-8'));
  const serialPortRef = useRef(null);
  const serialReaderRef = useRef(null);
  const serialBufferRef = useRef('');
  const wsRef = useRef(null);
  const lastPosRef = useRef(null);
  const strokePointsRef = useRef([]);
  const segRef = useRef({ vx: 0, vy: 0, len: 0 });
  const segmentsRef = useRef([]);
  const idleTimerRef = useRef(null);
  const lastStrokeRef = useRef({ points: [], segments: [], label: '無' });
  const mlHintRef = useRef({ token: '', ts: 0 });

  const addLog = (msg) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 10));
  };

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.stroke();

    const cur = strokePointsRef.current;
    const last = lastStrokeRef.current?.points || [];
    const all = (cur.length ? cur : last);
    if (!all.length) return;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const p of all) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    const pad = 15;
    minX -= pad;
    maxX += pad;
    minY -= pad;
    maxY += pad;
    const spanX = Math.max(1, maxX - minX);
    const spanY = Math.max(1, maxY - minY);
    const s = Math.min((width - 30) / spanX, (height - 30) / spanY);
    const ox = centerX - ((minX + maxX) / 2) * s;
    const oy = centerY - ((minY + maxY) / 2) * s;
    const map = (p) => ({ x: p.x * s + ox, y: p.y * s + oy });

    if (last.length) {
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const p0 = map(last[0]);
      ctx.moveTo(p0.x, p0.y);
      for (let i = 1; i < last.length; i++) {
        const pi = map(last[i]);
        ctx.lineTo(pi.x, pi.y);
      }
      ctx.stroke();
    }

    if (cur.length) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 3;
      ctx.beginPath();
      const p0 = map(cur[0]);
      ctx.moveTo(p0.x, p0.y);
      for (let i = 1; i < cur.length; i++) {
        const pi = map(cur[i]);
        ctx.lineTo(pi.x, pi.y);
      }
      ctx.stroke();

      const pe = map(cur[cur.length - 1]);
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(pe.x, pe.y, 6, 0, 2 * Math.PI);
      ctx.fill();
    }
  }, []);

  const normAngle = (a) => {
    let x = a;
    while (x < 0) x += 360;
    while (x >= 360) x -= 360;
    return x;
  };

  const angleDiff = (a, b) => {
    const d = Math.abs(normAngle(a) - normAngle(b)) % 360;
    return d > 180 ? 360 - d : d;
  };

  const angleFromVec = (dx, dy) => {
    let a = Math.atan2(dy, dx) * (180 / Math.PI);
    if (a < 0) a += 360;
    return a;
  };

  const dirFromAngle = (angle) => {
    const a = normAngle(angle);
    if (a >= 330 || a <= 30) return 'HENG';
    if (a >= 60 && a <= 120) return 'SHU';
    if (a >= 120 && a <= 180) return 'PIE';
    if (a >= 0 && a <= 60) return 'NA';
    if (a >= 180 && a <= 240) return 'LEFT';
    if (a >= 240 && a <= 300) return 'UP';
    return 'UNKNOWN';
  };

  const labelFromToken = (token) => {
    if (token === 'HENG') return '➡️ 橫 (一)';
    if (token === 'SHU') return '⬇️ 豎 (丨)';
    if (token === 'PIE') return '↙️ 撇 (丿)';
    if (token === 'NA') return '↘️ 捺 (乀)';
    if (token === 'DIAN') return '💧 點 (丶)';
    if (token === 'HENGZHE') return '⤵️ 橫折 (ㄱ)';
    if (token === 'HENGZHEGOU') return '🪝 橫折勾';
    if (token === 'SHUGOU') return '🪝 豎鉤 (亅)';
    return '未知';
  };

  const classifySegments = (segs) => {
    if (!segs.length) return { token: 'UNKNOWN', label: '未知' };
    const s = segs.map(x => ({ ...x, dir: dirFromAngle(x.angle) }));
    if (s.length === 1) {
      if (s[0].dir === 'HENG') return { token: 'HENG', label: labelFromToken('HENG') };
      if (s[0].dir === 'SHU') return { token: 'SHU', label: labelFromToken('SHU') };
      if (s[0].dir === 'PIE') return { token: 'PIE', label: labelFromToken('PIE') };
      if (s[0].dir === 'NA') return { token: 'NA', label: labelFromToken('NA') };
      if (s[0].dir === 'UP') return { token: 'UP', label: '⬆️ 挑 (㇀)' };
      return { token: 'UNKNOWN', label: '未知' };
    }

    if (s.length === 2) {
      if (s[0].dir === 'HENG' && s[1].dir === 'SHU') {
        return { token: 'HENGZHE', label: labelFromToken('HENGZHE') };
      }
      if (s[0].dir === 'SHU' && (s[1].dir === 'UP' || s[1].dir === 'LEFT')) {
        return { token: 'SHUGOU', label: labelFromToken('SHUGOU') };
      }
    }

    if (s.length >= 3) {
      const a = s[0];
      const b = s[1];
      const c = s[2];
      const hookRatio = c.len / Math.max(1e-6, (a.len + b.len));
      const hookDirOk = (c.dir === 'UP' || c.dir === 'LEFT');
      if (a.dir === 'HENG' && b.dir === 'SHU' && hookDirOk && hookRatio <= hookMaxRatio) {
        return { token: 'HENGZHEGOU', label: labelFromToken('HENGZHEGOU') };
      }
    }
    return { token: 'UNKNOWN', label: '未知' };
  };

  const finalizeStroke = useCallback((reason) => {
    const pts = strokePointsRef.current;
    if (pts.length < 2) {
      strokePointsRef.current = [];
      segmentsRef.current = [];
      segRef.current = { vx: 0, vy: 0, len: 0 };
      lastPosRef.current = null;
      drawCanvas();
      return;
    }

    const segs = [...segmentsRef.current];
    const curSeg = segRef.current;
    if (curSeg.len >= minSegLenMm) {
      segs.push({ angle: angleFromVec(curSeg.vx, curSeg.vy), len: curSeg.len });
    }
    const filtered = segs.filter(s => s.len >= minSegLenMm);
    const res = classifySegments(filtered.slice(0, 3));
    const ml = mlHintRef.current;
    const mlFresh = useMlHint && ml.token && (Date.now() - ml.ts <= 800);
    const finalToken = mlFresh ? ml.token : res.token;
    const finalLabel = mlFresh ? labelFromToken(ml.token) : res.label;

    lastStrokeRef.current = { points: [...pts], segments: filtered.slice(0, 3), label: finalLabel };
    strokePointsRef.current = [];
    segmentsRef.current = [];
    segRef.current = { vx: 0, vy: 0, len: 0 };
    lastPosRef.current = null;

    setCurrentStroke(finalLabel);
    addLog(`判定: ${finalLabel} | seg=${filtered.length} | 原因=${reason}${mlFresh ? ' | ML=ON' : ''}`);
    drawCanvas();
  }, [classifySegments, drawCanvas, minSegLenMm, useMlHint, hookMaxRatio]);

  const processPoint = useCallback((x, y, z = 0) => {
    const now = Date.now();
    const yAdj = invertY ? -y : y;

    setRawXYZ({ x: Math.round(x), y: Math.round(yAdj), z: Math.round(z) });

    if (useGate && !gateActive) {
      lastPosRef.current = null;
      strokePointsRef.current = [];
      segmentsRef.current = [];
      segRef.current = { vx: 0, vy: 0, len: 0 };
      drawCanvas();
      return;
    }

    const prev = lastPosRef.current;
    lastPosRef.current = { x, y: yAdj, t: now };

    if (!prev) {
      strokePointsRef.current = [{ x, y: yAdj, t: now }];
      segmentsRef.current = [];
      segRef.current = { vx: 0, vy: 0, len: 0 };
      drawCanvas();
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => finalizeStroke('idle'), idleTimeoutMs);
      return;
    }

    const dx = x - prev.x;
    const dy = yAdj - prev.y;
    const step = Math.sqrt(dx * dx + dy * dy);
    if (step < minStepMm) {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => finalizeStroke('idle'), idleTimeoutMs);
      return;
    }

    strokePointsRef.current.push({ x, y: yAdj, t: now });
    const angle = angleFromVec(dx, dy);
    setCurrentAngle(Math.round(angle));
    setMagnitude(Math.round(step));

    const cur = segRef.current;
    if (cur.len < 1e-6) {
      segRef.current = { vx: dx, vy: dy, len: step };
    } else {
      const curAngle = angleFromVec(cur.vx, cur.vy);
      if (angleDiff(curAngle, angle) >= turnDeg && cur.len >= minSegLenMm) {
        segmentsRef.current.push({ angle: curAngle, len: cur.len });
        segRef.current = { vx: dx, vy: dy, len: step };
      } else {
        segRef.current = { vx: cur.vx + dx, vy: cur.vy + dy, len: cur.len + step };
      }
    }

    drawCanvas();
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => finalizeStroke('idle'), idleTimeoutMs);
  }, [drawCanvas, finalizeStroke, gateActive, idleTimeoutMs, invertY, minSegLenMm, minStepMm, turnDeg, useGate]);

  const wsSend = useCallback((obj) => {
    try {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
      wsRef.current.send(JSON.stringify(obj));
    } catch (e) {}
  }, []);

  // 處理收到的資料，兼容 "X,Y" 與 "X,Y,Z"
  const handleData = useCallback((event) => {
    const value = event.target.value;
    const rawData = decoderRef.current.decode(value);
    const tokens = rawData
      .replace(/\0/g, '')
      .split(/[\r\n]+/)
      .map(s => s.trim())
      .filter(Boolean);

    for (const token of tokens) {
      if (/^VI_\d+$/i.test(token) || /^ID_PROP$/i.test(token)) continue;

      const up = token.toUpperCase();
      if (up === 'HENG' || up === 'SHU' || up === 'PIE' || up === 'NA' || up === 'DIAN' || up === 'HENGZHE' || up === 'HENGZHEGOU' || up === 'SHUGOU') {
        mlHintRef.current = { token: up, ts: Date.now() };
        addLog(`ML 提示: ${up}`);
        continue;
      }

      if (token.startsWith('{') && token.endsWith('}')) {
        try {
          const obj = JSON.parse(token);
          const x = typeof obj.x === 'number' ? obj.x : (obj.pos && typeof obj.pos.x === 'number' ? obj.pos.x : null);
          const y = typeof obj.y === 'number' ? obj.y : (obj.pos && typeof obj.pos.y === 'number' ? obj.pos.y : null);
          const z = typeof obj.z === 'number' ? obj.z : (obj.pos && typeof obj.pos.z === 'number' ? obj.pos.z : 0);
          if (x !== null && y !== null) {
            wsSend(obj);
            processPoint(x, y, z || 0);
            continue;
          }
        } catch (e) {}
      }

      const parts = token.split(',').map(p => p.trim());
      if (parts.length === 2 && (parts[0].toUpperCase() === 'G' || parts[0].toUpperCase() === 'GATE')) {
        const v = parts[1] === '1' || parts[1].toLowerCase() === 'true' || parts[1].toUpperCase() === 'ON';
        setGateActive(v);
        if (!v) finalizeStroke('gate');
        addLog(`Gate: ${v ? 'ON' : 'OFF'}`);
        continue;
      }
      if (parts.length !== 2 && parts.length !== 3) continue;

      const x = parseFloat(parts[0]);
      const y = parseFloat(parts[1]);
      const z = parts.length === 3 ? parseFloat(parts[2]) : 0;

      if (!Number.isNaN(x) && !Number.isNaN(y) && !Number.isNaN(z)) {
        wsSend({ t: Date.now(), x, y, z });
        processPoint(x, y, z);
      }
    }
  }, [finalizeStroke, processPoint, wsSend]);

  const handleSerialChunk = useCallback((text) => {
    serialBufferRef.current += text;
    const tokens = serialBufferRef.current
      .replace(/\0/g, '')
      .split(/[\r\n]+/);
    serialBufferRef.current = tokens.pop() || '';
    for (const raw of tokens) {
      const token = raw.trim();
      if (!token) continue;
      if (/^VI_\d+$/i.test(token) || /^ID_PROP$/i.test(token)) continue;
      const up = token.toUpperCase();
      if (up === 'HENG' || up === 'SHU' || up === 'PIE' || up === 'NA' || up === 'DIAN' || up === 'HENGZHE' || up === 'HENGZHEGOU' || up === 'SHUGOU') {
        mlHintRef.current = { token: up, ts: Date.now() };
        addLog(`ML 提示: ${up}`);
        continue;
      }
      if (token.startsWith('{') && token.endsWith('}')) {
        try {
          const obj = JSON.parse(token);
          const x = typeof obj.x === 'number' ? obj.x : (obj.pos && typeof obj.pos.x === 'number' ? obj.pos.x : null);
          const y = typeof obj.y === 'number' ? obj.y : (obj.pos && typeof obj.pos.y === 'number' ? obj.pos.y : null);
          const z = typeof obj.z === 'number' ? obj.z : (obj.pos && typeof obj.pos.z === 'number' ? obj.pos.z : 0);
          if (x !== null && y !== null) {
            wsSend(obj);
            processPoint(x, y, z || 0);
            continue;
          }
        } catch (e) {}
      }
      const parts = token.split(',').map(p => p.trim());
      if (parts.length === 2 && (parts[0].toUpperCase() === 'G' || parts[0].toUpperCase() === 'GATE')) {
        const v = parts[1] === '1' || parts[1].toLowerCase() === 'true' || parts[1].toUpperCase() === 'ON';
        setGateActive(v);
        if (!v) finalizeStroke('gate');
        addLog(`Gate: ${v ? 'ON' : 'OFF'}`);
        continue;
      }
      if (parts.length !== 2 && parts.length !== 3) continue;
      const x = parseFloat(parts[0]);
      const y = parseFloat(parts[1]);
      const z = parts.length === 3 ? parseFloat(parts[2]) : 0;
      if (!Number.isNaN(x) && !Number.isNaN(y) && !Number.isNaN(z)) {
        wsSend({ t: Date.now(), x, y, z });
        processPoint(x, y, z);
      }
    }
  }, [finalizeStroke, processPoint, wsSend]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const connectMicrobit = async () => {
    try {
      setError('');
      addLog('開始連接...');
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: 'BBC micro:bit' }],
        optionalServices: [UART_SERVICE_UUID]
      });

      const server = await device.gatt.connect();
      const services = await server.getPrimaryServices();
      const service = services.find(s => s.uuid.toLowerCase() === UART_SERVICE_UUID.toLowerCase());
      
      if (!service) throw new Error('未找到 UART 服務');

      const TX_UUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e'; 
      const RX_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';
      
      let characteristic = null;
      for (const uuid of [TX_UUID, RX_UUID]) {
        try {
          const char = await service.getCharacteristic(uuid);
          if (char.properties.notify) characteristic = char;
        } catch(e) {}
      }

      if (!characteristic) throw new Error('找不到支援通知的特徵值');

      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', handleData);
      device.addEventListener('gattserverdisconnected', () => {
        setIsConnected(false);
        addLog('裝置已斷線');
      });

      deviceRef.current = device;
      characteristicRef.current = characteristic;
      setIsConnected(true);
      addLog('✅ 連接成功！請開始揮動。');
    } catch (err) {
      setError(err.message);
      addLog(`❌ 錯誤: ${err.message}`);
    }
  };

  const disconnectMicrobit = async () => {
    try {
      if (characteristicRef.current) {
        characteristicRef.current.removeEventListener('characteristicvaluechanged', handleData);
      }
      if (deviceRef.current?.gatt?.connected) {
        deviceRef.current.gatt.disconnect();
      }
      setIsConnected(false);
      addLog('已手動斷開連接');
    } catch (err) {
      setError(err.message);
    }
  };

  const connectSerial = async () => {
    try {
      setError('');
      if (!('serial' in navigator)) {
        throw new Error('此瀏覽器不支援 WebSerial（建議使用 Chrome/Edge）');
      }
      addLog('開始連接序列埠...');
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 115200 });
      serialPortRef.current = port;
      setIsSerialConnected(true);
      addLog('✅ 序列埠已連接（115200）');
      const decoder = new TextDecoderStream();
      const readableStreamClosed = port.readable.pipeTo(decoder.writable);
      const reader = decoder.readable.getReader();
      serialReaderRef.current = { reader, readableStreamClosed };
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) handleSerialChunk(value);
      }
    } catch (err) {
      setError(err.message || String(err));
      addLog(`❌ 錯誤: ${err.message || String(err)}`);
      setIsSerialConnected(false);
      try {
        if (serialPortRef.current) await serialPortRef.current.close();
      } catch (e) {}
      serialPortRef.current = null;
    }
  };

  const disconnectSerial = async () => {
    try {
      const ref = serialReaderRef.current;
      if (ref?.reader) {
        try { await ref.reader.cancel(); } catch (e) {}
        try { ref.reader.releaseLock(); } catch (e) {}
      }
      if (serialPortRef.current) {
        try { await serialPortRef.current.close(); } catch (e) {}
      }
      serialReaderRef.current = null;
      serialPortRef.current = null;
      setIsSerialConnected(false);
      addLog('已手動斷開序列埠');
    } catch (err) {
      setError(err.message || String(err));
    }
  };

  const connectWs = async () => {
    try {
      setError('');
      if (!wsUrl.trim()) throw new Error('請先輸入 WebSocket URL');
      if (wsRef.current) {
        try { wsRef.current.close(); } catch (e) {}
      }
      const ws = new WebSocket(wsUrl.trim());
      wsRef.current = ws;
      ws.onopen = () => {
        setWsConnected(true);
        addLog('✅ WebSocket 已連接');
      };
      ws.onclose = () => {
        setWsConnected(false);
        addLog('WebSocket 已斷線');
      };
      ws.onerror = () => {
        setWsConnected(false);
      };
    } catch (err) {
      setError(err.message || String(err));
    }
  };

  const disconnectWs = async () => {
    try {
      if (wsRef.current) {
        try { wsRef.current.close(); } catch (e) {}
      }
      wsRef.current = null;
      setWsConnected(false);
    } catch (err) {
      setError(err.message || String(err));
    }
  };

  useEffect(() => {
    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      if (characteristicRef.current) {
        characteristicRef.current.removeEventListener('characteristicvaluechanged', handleData);
      }
      if (deviceRef.current?.gatt?.connected) {
        deviceRef.current.gatt.disconnect();
      }
      if (serialReaderRef.current?.reader) {
        try { serialReaderRef.current.reader.cancel(); } catch (e) {}
        try { serialReaderRef.current.reader.releaseLock(); } catch (e) {}
      }
      if (serialPortRef.current) {
        try { serialPortRef.current.close(); } catch (e) {}
      }
      if (wsRef.current) {
        try { wsRef.current.close(); } catch (e) {}
      }
    };
  }, [handleData]);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6 text-amber-400">MPU6050 筆劃方向測試器</h1>

      <div className="flex flex-col items-center gap-3 mb-4">
        <div className="flex items-center gap-3 text-sm text-slate-300">
          <label className="inline-flex items-center gap-2">
            <input type="radio" name="source" value="ble" checked={source === 'ble'} onChange={() => setSource('ble')} />
            藍牙 UART
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="radio" name="source" value="serial" checked={source === 'serial'} onChange={() => setSource('serial')} />
            USB 序列埠
          </label>
        </div>

        {source === 'ble' ? (
          !isConnected ? (
            <button 
              onClick={connectMicrobit}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold flex items-center gap-2"
            >
              <Bluetooth /> 連接 Micro:bit
            </button>
          ) : (
            <div className="px-6 py-3 bg-green-600 rounded-xl font-bold flex items-center gap-2">
              <Bluetooth /> 已連接（藍牙），請揮動測試
            </div>
          )
        ) : (
          !isSerialConnected ? (
            <button 
              onClick={connectSerial}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold flex items-center gap-2"
            >
              <Bluetooth /> 連接序列埠
            </button>
          ) : (
            <div className="px-6 py-3 bg-green-600 rounded-xl font-bold flex items-center gap-2">
              <Bluetooth /> 已連接（序列埠），請揮動測試
            </div>
          )
        )}
      </div>
      
      {error && <div className="text-red-400 mb-4">{error}</div>}

      <div className="w-full max-w-4xl mb-6 bg-slate-800 p-4 rounded-2xl border border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <label className="flex flex-col gap-2">
            <span>最小步長：{minStepMm.toFixed(1)} mm</span>
            <input
              type="range"
              min="0.2"
              max="5"
              step="0.1"
              value={minStepMm}
              onChange={(e) => setMinStepMm(Number(e.target.value))}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span>靜止切段：{idleTimeoutMs} ms</span>
            <input
              type="range"
              min="80"
              max="600"
              step="10"
              value={idleTimeoutMs}
              onChange={(e) => setIdleTimeoutMs(Number(e.target.value))}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span>轉折門檻：{turnDeg}°</span>
            <input
              type="range"
              min="35"
              max="110"
              step="5"
              value={turnDeg}
              onChange={(e) => setTurnDeg(Number(e.target.value))}
            />
          </label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-4">
          <label className="flex flex-col gap-2">
            <span>最小段長：{minSegLenMm} mm</span>
            <input
              type="range"
              min="4"
              max="40"
              step="1"
              value={minSegLenMm}
              onChange={(e) => setMinSegLenMm(Number(e.target.value))}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span>鉤段比例上限：{hookMaxRatio.toFixed(2)}</span>
            <input
              type="range"
              min="0.15"
              max="0.6"
              step="0.01"
              value={hookMaxRatio}
              onChange={(e) => setHookMaxRatio(Number(e.target.value))}
            />
          </label>
          <div className="flex flex-col gap-2">
            <span>Gate/提示</span>
            <label className="inline-flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" checked={useGate} onChange={(e) => setUseGate(e.target.checked)} />
              只在按鈕按下期間偵測（Gate={gateActive ? 'ON' : 'OFF'}）
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" checked={useMlHint} onChange={(e) => setUseMlHint(e.target.checked)} />
              使用 ML 提示（可選）
            </label>
          </div>
        </div>
        <label className="inline-flex items-center gap-2 mt-4 text-sm text-slate-300">
          <input type="checkbox" checked={invertY} onChange={(e) => setInvertY(e.target.checked)} />
          反轉 Y 軸（方向顛倒時勾選）
        </label>
        <div className="mt-4 flex flex-col gap-2">
          <div className="text-sm text-slate-300">WebSocket 轉發（可選）</div>
          <div className="flex flex-col md:flex-row gap-2">
            <input
              value={wsUrl}
              onChange={(e) => setWsUrl(e.target.value)}
              placeholder="ws://localhost:8765"
              className="flex-1 px-3 py-2 rounded bg-slate-900 border border-slate-700 text-slate-200 text-sm"
            />
            {!wsConnected ? (
              <button
                onClick={connectWs}
                className="px-4 py-2 rounded bg-slate-700 hover:bg-slate-600 text-sm"
              >
                連接 WS
              </button>
            ) : (
              <button
                onClick={disconnectWs}
                className="px-4 py-2 rounded bg-red-700 hover:bg-red-600 text-sm"
              >
                斷開 WS
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        {/* 左側：視覺化畫布 */}
        <div className="bg-slate-800 p-4 rounded-2xl flex flex-col items-center border border-slate-700">
          <h2 className="text-xl mb-4">筆畫軌跡 (X, Y)</h2>
          <canvas 
            ref={canvasRef} 
            width={300} 
            height={300} 
            className="bg-slate-50 rounded-full shadow-inner border-4 border-slate-600"
          ></canvas>
          <div className="mt-4 flex gap-4 text-sm text-slate-400">
            <div>步長 (mm): <span className="text-white text-lg">{magnitude}</span></div>
            <div>角度: <span className="text-white text-lg">{currentAngle}°</span></div>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Raw: X={rawXYZ.x}, Y={rawXYZ.y}, Z={rawXYZ.z}
          </div>
        </div>

        {/* 右側：判定結果與日誌 */}
        <div className="bg-slate-800 p-6 rounded-2xl flex flex-col border border-slate-700">
          <h2 className="text-xl mb-4 text-slate-300">最新判定筆劃</h2>
          <div className="text-5xl font-bold text-amber-400 mb-8 h-20 flex items-center justify-center bg-slate-900 rounded-xl border border-amber-500/30">
            {currentStroke}
          </div>
          
          <h3 className="text-sm font-bold text-slate-400 mb-2">觸發日誌</h3>
          <div className="flex-1 bg-black/50 p-3 rounded-lg font-mono text-xs overflow-y-auto border border-slate-700">
            {logs.map((log, i) => (
              <div key={i} className={log.includes('觸發') ? 'text-green-400' : 'text-slate-400'}>
                {log}
              </div>
            ))}
            {logs.length === 0 && <div className="text-slate-600 italic">等待揮動數據...</div>}
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setLogs([])}
              className="px-3 py-2 text-xs rounded bg-slate-700 hover:bg-slate-600 flex items-center gap-1"
            >
              <Trash2 size={14} /> 清空日誌
            </button>
            <button
              onClick={source === 'ble' ? disconnectMicrobit : disconnectSerial}
              className="px-3 py-2 text-xs rounded bg-red-700 hover:bg-red-600 flex items-center gap-1"
            >
              <Unplug size={14} /> 斷開連線
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 text-slate-400 text-sm max-w-2xl text-center">
        支援 "X,Y" / "X,Y,Z" 或 JSON {"{\"x\":...,\"y\":...}"}；可額外接收 Gate 控制行 "G,1" / "G,0" 與 ML token（HENG/SHU/PIE/NA...）。
      </div>
    </div>
  );
}
