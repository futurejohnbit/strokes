const STORAGE_KEYS = {
  music: 'stroke-exhibition-music-enabled',
};

export const FREE_MUSIC_TRACK = {
  provider: 'Mixkit',
  title: 'Playground Fun',
  artist: 'Ahjay Stelino',
  duration: '3:02',
  licenseName: 'Mixkit Stock Music Free License',
  licenseUrl: 'https://mixkit.co/license/#musicFree',
  sourceLabel: 'Mixkit Kids Tag',
  sourceUrl: 'https://mixkit.co/free-stock-music/tag/kids/',
  assetUrl: 'https://assets.mixkit.co/music/12/12.mp3',
  downloadDate: '2026-06-22',
  localPath: '/audio/exhibition-theme.mp3',
  note: '已下載 Mixkit 曲目 Playground Fun 到 public/audio/exhibition-theme.mp3，適合展場首頁循環播放。',
};

function clampGain(value) {
  return Math.max(0.0001, Math.min(value, 0.18));
}

export function readStoredAudioPreference(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  const stored = window.localStorage.getItem(key);
  if (stored === null) return fallback;
  return stored === '1';
}

export function persistAudioPreference(key, enabled) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, enabled ? '1' : '0');
}

export function getAudioStorageKeys() {
  return STORAGE_KEYS;
}

export function createThemeAudioEngine() {
  let audioContext = null;
  let masterGain = null;
  let musicElement = null;
  let musicBroken = false;
  let lastStartAttempt = 0;
  let musicScene = 'menu';
  let fadeFrame = null;
  let noiseBuffer = null;

  const SCENE_VOLUME = {
    menu: 0.42,
    game: 0.16,
  };

  const getSceneVolume = () => SCENE_VOLUME[musicScene] ?? SCENE_VOLUME.menu;

  const animateMusicVolume = (targetVolume) => {
    if (!musicElement) return;
    if (fadeFrame) {
      window.cancelAnimationFrame(fadeFrame);
      fadeFrame = null;
    }

    const startVolume = Number.isFinite(musicElement.volume) ? musicElement.volume : targetVolume;
    const startTime = performance.now();
    const duration = 260;

    const tick = (now) => {
      if (!musicElement) return;
      const progress = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      musicElement.volume = startVolume + (targetVolume - startVolume) * eased;

      if (progress < 1) {
        fadeFrame = window.requestAnimationFrame(tick);
      } else {
        fadeFrame = null;
      }
    };

    fadeFrame = window.requestAnimationFrame(tick);
  };

  const getAudioContext = async () => {
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) return null;

    if (!audioContext) {
      audioContext = new AudioContextCtor();
      masterGain = audioContext.createGain();
      masterGain.gain.value = 0.82;
      masterGain.connect(audioContext.destination);
    }

    if (audioContext.state === 'suspended') {
      await audioContext.resume().catch(() => {});
    }

    return audioContext;
  };

  const primeAudio = async () => {
    await getAudioContext();
  };

  const getNoiseBuffer = (ctx) => {
    if (noiseBuffer) return noiseBuffer;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.35, ctx.sampleRate);
    const channel = buffer.getChannelData(0);
    for (let index = 0; index < channel.length; index += 1) {
      channel[index] = Math.random() * 2 - 1;
    }
    noiseBuffer = buffer;
    return noiseBuffer;
  };

  const playOscTone = (ctx, startTime, {
    type = 'sine',
    frequency = 440,
    endFrequency = frequency,
    gainPeak = 0.08,
    duration = 0.18,
    attack = 0.015,
    output = masterGain,
  }) => {
    if (!output) return;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startTime);
    oscillator.frequency.linearRampToValueAtTime(endFrequency, startTime + Math.min(duration, 0.12));
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(gainPeak, startTime + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    oscillator.connect(gain);
    gain.connect(output);
    oscillator.start(startTime);
    oscillator.stop(startTime + duration + 0.03);
  };

  const playClapBurst = (ctx, startTime, peak = 0.12) => {
    if (!masterGain) return;
    const source = ctx.createBufferSource();
    source.buffer = getNoiseBuffer(ctx);

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(1900, startTime);
    bandpass.Q.value = 0.9;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(peak, startTime + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.095);

    source.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(masterGain);
    source.start(startTime);
    source.stop(startTime + 0.11);
  };

  const playCheerPad = (ctx, startTime) => {
    if (!masterGain) return;
    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(420, startTime);
    highpass.Q.value = 0.8;
    highpass.connect(masterGain);

    playOscTone(ctx, startTime, {
      type: 'sawtooth',
      frequency: 392,
      endFrequency: 587.33,
      gainPeak: 0.035,
      duration: 0.82,
      attack: 0.03,
      output: highpass,
    });

    playOscTone(ctx, startTime + 0.05, {
      type: 'triangle',
      frequency: 523.25,
      endFrequency: 783.99,
      gainPeak: 0.03,
      duration: 0.76,
      attack: 0.03,
      output: highpass,
    });

    playOscTone(ctx, startTime + 0.12, {
      type: 'sine',
      frequency: 659.25,
      endFrequency: 987.77,
      gainPeak: 0.022,
      duration: 0.68,
      attack: 0.04,
      output: highpass,
    });
  };

  const ensureMusicElement = () => {
    if (typeof window === 'undefined' || musicBroken) return null;

    if (!musicElement) {
      musicElement = new Audio(FREE_MUSIC_TRACK.localPath);
      musicElement.loop = true;
      musicElement.preload = 'auto';
      musicElement.volume = getSceneVolume();
      musicElement.addEventListener('error', () => {
        musicBroken = true;
      });
    }

    return musicElement;
  };

  const scheduleNote = (ctx, startTime, config) => {
    if (!masterGain) return;

    const padOsc = ctx.createOscillator();
    const padGain = ctx.createGain();
    padOsc.type = 'triangle';
    padOsc.frequency.setValueAtTime(config.melody, startTime);
    padOsc.frequency.linearRampToValueAtTime(config.harmony, startTime + config.duration * 0.65);
    padGain.gain.setValueAtTime(0.0001, startTime);
    padGain.gain.linearRampToValueAtTime(clampGain(0.045), startTime + 0.08);
    padGain.gain.exponentialRampToValueAtTime(0.0001, startTime + config.duration);
    padOsc.connect(padGain);
    padGain.connect(masterGain);
    padOsc.start(startTime);
    padOsc.stop(startTime + config.duration + 0.04);

    const bellOsc = ctx.createOscillator();
    const bellGain = ctx.createGain();
    bellOsc.type = 'sine';
    bellOsc.frequency.setValueAtTime(config.harmony * 2, startTime);
    bellGain.gain.setValueAtTime(0.0001, startTime);
    bellGain.gain.linearRampToValueAtTime(clampGain(0.02), startTime + 0.02);
    bellGain.gain.exponentialRampToValueAtTime(0.0001, startTime + config.duration * 0.55);
    bellOsc.connect(bellGain);
    bellGain.connect(masterGain);
    bellOsc.start(startTime);
    bellOsc.stop(startTime + config.duration * 0.6);

    const bassOsc = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bassOsc.type = 'sine';
    bassOsc.frequency.setValueAtTime(config.bass, startTime);
    bassGain.gain.setValueAtTime(0.0001, startTime);
    bassGain.gain.linearRampToValueAtTime(clampGain(0.028), startTime + 0.04);
    bassGain.gain.exponentialRampToValueAtTime(0.0001, startTime + config.duration);
    bassOsc.connect(bassGain);
    bassGain.connect(masterGain);
    bassOsc.start(startTime);
    bassOsc.stop(startTime + config.duration + 0.05);
  };

  const startMusic = async () => {
    const element = ensureMusicElement();
    if (!element) return false;

    lastStartAttempt = Date.now();

    try {
      await element.play();
      return true;
    } catch (error) {
      if (Date.now() - lastStartAttempt > 80) {
        console.warn('Theme music start failed:', error);
      }
      return false;
    }
  };

  const stopMusic = () => {
    if (!musicElement) return;
    musicElement.pause();
    musicElement.currentTime = 0;
  };

  const setMusicScene = (nextScene = 'menu') => {
    musicScene = nextScene === 'game' ? 'game' : 'menu';
    const element = ensureMusicElement();
    if (!element) return;
    animateMusicVolume(getSceneVolume());
  };

  const playUiSfx = async (kind = 'step') => {
    const ctx = await getAudioContext();
    if (!ctx || !masterGain) return;

    const now = ctx.currentTime;
    if (kind === 'correct') {
      // Do Re Mi: 完成一筆時用清楚的三音階上行
      playOscTone(ctx, now, { type: 'triangle', frequency: 523.25, endFrequency: 523.25, gainPeak: 0.085, duration: 0.12 });
      playOscTone(ctx, now + 0.09, { type: 'triangle', frequency: 587.33, endFrequency: 587.33, gainPeak: 0.08, duration: 0.12 });
      playOscTone(ctx, now + 0.18, { type: 'triangle', frequency: 659.25, endFrequency: 659.25, gainPeak: 0.09, duration: 0.18 });
      return;
    }

    if (kind === 'wordComplete') {
      // 更歡快的印象：上行琶音加亮音收尾
      playOscTone(ctx, now, { type: 'triangle', frequency: 523.25, endFrequency: 659.25, gainPeak: 0.09, duration: 0.16 });
      playOscTone(ctx, now + 0.1, { type: 'triangle', frequency: 659.25, endFrequency: 783.99, gainPeak: 0.085, duration: 0.18 });
      playOscTone(ctx, now + 0.2, { type: 'triangle', frequency: 783.99, endFrequency: 1046.5, gainPeak: 0.09, duration: 0.22 });
      playOscTone(ctx, now + 0.28, { type: 'sine', frequency: 1046.5, endFrequency: 1318.51, gainPeak: 0.05, duration: 0.38, attack: 0.02 });
      return;
    }

    if (kind === 'ceremony') {
      // 完成一關：鼓掌節奏 + 歡呼感 pad
      [0, 0.09, 0.18, 0.31, 0.42].forEach((offset, index) => {
        playClapBurst(ctx, now + offset, index >= 3 ? 0.13 : 0.11);
      });
      playCheerPad(ctx, now + 0.02);
      return;
    }

    if (kind === 'reward') {
      playOscTone(ctx, now, { type: 'triangle', frequency: 740, endFrequency: 880, gainPeak: 0.08, duration: 0.16 });
      playOscTone(ctx, now + 0.08, { type: 'sine', frequency: 880, endFrequency: 987.77, gainPeak: 0.045, duration: 0.24 });
      return;
    }

    playOscTone(ctx, now, { type: 'sine', frequency: 520, endFrequency: 660, gainPeak: 0.045, duration: 0.18 });
  };

  const destroy = () => {
    if (fadeFrame) {
      window.cancelAnimationFrame(fadeFrame);
      fadeFrame = null;
    }
    stopMusic();
    if (musicElement) {
      musicElement.src = '';
      musicElement.load();
      musicElement = null;
    }
    if (audioContext) {
      audioContext.close().catch(() => {});
      audioContext = null;
      masterGain = null;
    }
  };

  return {
    primeAudio,
    startMusic,
    stopMusic,
    setMusicScene,
    playUiSfx,
    destroy,
  };
}
