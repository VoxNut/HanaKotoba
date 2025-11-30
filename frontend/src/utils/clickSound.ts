
const DEFAULT_EXT = ".mp3";

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
const buffers: Map<string, AudioBuffer> = new Map();
let preloadedNames: string[] = [];
let volume = 1;
let muted = false;

function normalizeName(name: string) {
  return name.endsWith(DEFAULT_EXT) ? name : `${name}${DEFAULT_EXT}`;
}

async function ensureAudioContext() {
  if (!audioCtx) {
    type ACType = typeof AudioContext;
    const globalWindow = window as unknown as {
      AudioContext?: ACType;
      webkitAudioContext?: unknown;
    };
    const AC =
      globalWindow.AudioContext ??
      (globalWindow.webkitAudioContext as unknown as ACType | undefined);
    if (!AC) throw new Error("Web Audio API not supported in this browser");
    audioCtx = new AC();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = muted ? 0 : volume;
    masterGain.connect(audioCtx.destination);
  }
  return audioCtx;
}

export async function initAudio(
  names: string[],
  basePath = `${import.meta.env.BASE_URL}sounds/`
) {
  preloadedNames = names.map(normalizeName);
  await ensureAudioContext();

  const promises = preloadedNames.map(async (file) => {
    const url = `${basePath}${file}`;
    try {
      const resp = await fetch(url);
      const arrayBuffer = await resp.arrayBuffer();
      if (!audioCtx) return;
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      buffers.set(file, audioBuffer);
    } catch (e) {
      // log but continue
      console.warn(`Failed to load sound ${url}`, e);
    }
  });

  await Promise.all(promises);
}

export function resumeAudioContext() {
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
}

export function playSound(name: string) {
  const file = normalizeName(name);
  const buffer = buffers.get(file);
  if (!buffer) {
    // fallback to HTMLAudio (still works but higher latency)
    const url = `${import.meta.env.BASE_URL}sounds/${file}`;
    const a = new Audio(url);
    a.volume = muted ? 0 : volume;
    a.play().catch(() => {});
    return;
  }

  if (!audioCtx || !masterGain) {
    ensureAudioContext();
  }

  try {
    const src = audioCtx!.createBufferSource();
    src.buffer = buffer;
    const g = audioCtx!.createGain();
    g.gain.value = muted ? 0 : volume;
    src.connect(g);
    g.connect(masterGain!);
    src.start(0);
    // cleanup when ended
    src.onended = () => {
      try {
        src.disconnect();
        g.disconnect();
      } catch (err) {
        console.warn("Error during audio node cleanup", err);
      }
    };
  } catch (e) {
    // fallback
    const url = `${import.meta.env.BASE_URL}sounds/${file}`;
    const a = new Audio(url);
    a.volume = muted ? 0 : volume;
    a.play().catch((err) => console.warn("Fallback audio play failed", err));
  }
}

export function playRandom(names?: string[]) {
  const list =
    names && names.length > 0 ? names.map(normalizeName) : preloadedNames;
  if (!list || list.length === 0) return;
  const idx = Math.floor(Math.random() * list.length);
  playSound(list[idx]);
}

export function setMasterVolume(v: number) {
  volume = Math.max(0, Math.min(1, v));
  if (masterGain) masterGain.gain.value = muted ? 0 : volume;
}

export function toggleMute() {
  muted = !muted;
  if (masterGain) masterGain.gain.value = muted ? 0 : volume;
  return muted;
}

export function isMuted() {
  return muted;
}

export function getPreloadedNames() {
  return preloadedNames.slice();
}

export function clearAll() {
  buffers.clear();
  preloadedNames = [];
  if (audioCtx) {
    try {
      audioCtx.close();
    } catch (err) {
      console.warn("Failed to close AudioContext", err);
    }
    audioCtx = null;
    masterGain = null;
  }
}

export default {
  initAudio,
  resumeAudioContext,
  playSound,
  playRandom,
  setMasterVolume,
  toggleMute,
  isMuted,
  getPreloadedNames,
  clearAll,
};
