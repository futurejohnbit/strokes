export const PIE_CONFIRM_THRESHOLD = 0.72;
export const PIE_MIN_SAMPLES = 6;
export const PIE_ASSIST_WINDOW_MS = 1000;

const clampScore = (value) => {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return 0;
  if (numeric < 0) return 0;
  if (numeric > 1) return 1;
  return numeric;
};

const parseSampleCount = (value) => {
  const numeric = Number(value);
  if (Number.isNaN(numeric) || numeric < 0) return 0;
  return Math.round(numeric);
};

export function parseImuAssistToken(raw) {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) return null;

  try {
    const parsed = JSON.parse(trimmed);
    if (parsed?.kind !== 'imuAssist') return null;

    return {
      kind: 'imuAssist',
      forCode: String(parsed.forCode || '').toUpperCase(),
      imuDir: String(parsed.imuDir || 'unknown').toLowerCase(),
      pieScore: clampScore(parsed.pieScore),
      sumGX: Number(parsed.sumGX || 0),
      sumGY: Number(parsed.sumGY || 0),
      sampleCount: parseSampleCount(parsed.sampleCount),
    };
  } catch (error) {
    return null;
  }
}

export function isFreshAssist(assist, now, windowMs = PIE_ASSIST_WINDOW_MS) {
  if (!assist || typeof assist.receivedAt !== 'number') return false;
  return now - assist.receivedAt <= windowMs;
}

export function shouldUpgradeToPie({
  targetDirection,
  createAiDirection,
  createAiToken,
  assist,
  now,
  threshold = PIE_CONFIRM_THRESHOLD,
}) {
  if (targetDirection !== 'left-down') return false;
  if (createAiDirection === 'left-down') return false;
  if (!assist || assist.imuDir !== 'left-down') return false;
  if (!isFreshAssist(assist, now)) return false;
  if (assist.sampleCount < PIE_MIN_SAMPLES) return false;
  if (assist.pieScore < threshold) return false;

  const normalizedToken = String(createAiToken || '').toUpperCase();
  if (assist.forCode && normalizedToken && assist.forCode !== normalizedToken) {
    return false;
  }

  return true;
}
