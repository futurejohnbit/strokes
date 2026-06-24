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

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(masterGain);

    const now = ctx.currentTime;
    const sfxMap = {
      step: { type: 'sine', start: 520, end: 660, peak: 0.045, attack: 0.02, release: 0.18 },
      reward: { type: 'triangle', start: 740, end: 980, peak: 0.09, attack: 0.02, release: 0.34 },
      correct: { type: 'triangle', start: 640, end: 920, peak: 0.11, attack: 0.02, release: 0.32 },
      wordComplete: { type: 'triangle', start: 720, end: 1120, peak: 0.12, attack: 0.02, release: 0.52 },
      ceremony: { type: 'sine', start: 720, end: 1040, peak: 0.1, attack: 0.03, release: 0.42 },
    };
    const config = sfxMap[kind] || sfxMap.step;

    oscillator.type = config.type;
    oscillator.frequency.setValueAtTime(config.start, now);
    oscillator.frequency.linearRampToValueAtTime(config.end, now + 0.12);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(config.peak, now + config.attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + config.release);
    oscillator.start(now);
    oscillator.stop(now + config.release + 0.02);

    if (kind === 'correct' || kind === 'wordComplete' || kind === 'ceremony') {
      const chime = ctx.createOscillator();
      const chimeGain = ctx.createGain();
      chime.type = 'sine';
      chime.frequency.setValueAtTime(kind === 'ceremony' ? 1040 : kind === 'correct' ? 980 : 960, now + 0.08);
      chime.frequency.linearRampToValueAtTime(kind === 'ceremony' ? 1320 : kind === 'correct' ? 1260 : 1180, now + 0.22);
      chimeGain.gain.setValueAtTime(0.0001, now);
      chimeGain.gain.linearRampToValueAtTime(kind === 'ceremony' ? 0.06 : kind === 'correct' ? 0.05 : 0.04, now + 0.1);
      chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + (kind === 'ceremony' ? 0.48 : kind === 'correct' ? 0.42 : 0.38));
      chime.connect(chimeGain);
      chimeGain.connect(masterGain);
      chime.start(now + 0.08);
      chime.stop(now + (kind === 'ceremony' ? 0.5 : kind === 'correct' ? 0.44 : 0.4));
    }

    if (kind === 'wordComplete') {
      const flourishA = ctx.createOscillator();
      const flourishAGain = ctx.createGain();
      flourishA.type = 'triangle';
      flourishA.frequency.setValueAtTime(980, now + 0.02);
      flourishA.frequency.linearRampToValueAtTime(1320, now + 0.18);
      flourishAGain.gain.setValueAtTime(0.0001, now);
      flourishAGain.gain.linearRampToValueAtTime(0.05, now + 0.06);
      flourishAGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.46);
      flourishA.connect(flourishAGain);
      flourishAGain.connect(masterGain);
      flourishA.start(now + 0.02);
      flourishA.stop(now + 0.48);

      const flourishB = ctx.createOscillator();
      const flourishBGain = ctx.createGain();
      flourishB.type = 'sine';
      flourishB.frequency.setValueAtTime(1174, now + 0.12);
      flourishB.frequency.linearRampToValueAtTime(1568, now + 0.32);
      flourishBGain.gain.setValueAtTime(0.0001, now + 0.08);
      flourishBGain.gain.linearRampToValueAtTime(0.04, now + 0.18);
      flourishBGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.62);
      flourishB.connect(flourishBGain);
      flourishBGain.connect(masterGain);
      flourishB.start(now + 0.12);
      flourishB.stop(now + 0.64);
    }
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
