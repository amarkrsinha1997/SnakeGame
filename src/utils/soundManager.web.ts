// Web-only sound manager implementation
// Uses HTML5 Audio API and bundles sounds via require() from src/assets/sounds

type SoundType = 'eat' | 'dragonEat' | 'dragonSpawn' | 'dragonDespawn' | 'gameOver' | 'gameStart' | 'highScore';

let isSoundMuted = false;
let isMusicMuted = false;
let webBackgroundMusic: HTMLAudioElement | null = null;

const webAudioCache: Map<SoundType, HTMLAudioElement> = new Map();

// All sounds come from the single source of truth: src/assets/sounds/
const soundFiles: Record<SoundType, string> = {
  eat: require('../assets/sounds/eat.mp3') as string,
  dragonEat: require('../assets/sounds/dragon_egg_ate.wav') as string,
  dragonSpawn: require('../assets/sounds/dragon_spawn.mp3') as string,
  dragonDespawn: require('../assets/sounds/dragon_despawn.wav') as string,
  gameOver: require('../assets/sounds/game_over.mp3') as string,
  gameStart: require('../assets/sounds/game_start.mp3') as string,
  highScore: require('../assets/sounds/high_score.wav') as string,
};

const backgroundMusicFile: string = require('../assets/sounds/music_music.mp3') as string;

function loadWebSound(type: SoundType): HTMLAudioElement | null {
  try {
    const cached = webAudioCache.get(type);
    if (cached) {
      return cached;
    }

    const src = soundFiles[type];
    const audio = new Audio(src);
    audio.preload = 'auto';
    webAudioCache.set(type, audio);
    return audio;
  } catch (error) {
    console.warn(`Failed to load web sound ${type}:`, error);
    return null;
  }
}

export async function playSound(type: SoundType): Promise<void> {
  if (isSoundMuted) return;

  try {
    const audio = loadWebSound(type);
    if (audio) {
      audio.currentTime = 0;
      await audio.play().catch(() => {});
    }
  } catch (error) {
    console.warn(`Failed to play sound ${type}:`, error);
  }
}

export async function playMusic(): Promise<void> {
  if (isMusicMuted) return;

  try {
    if (!webBackgroundMusic) {
      webBackgroundMusic = new Audio(backgroundMusicFile);
      webBackgroundMusic.loop = true;
      webBackgroundMusic.volume = 0.3;
    }
    if (webBackgroundMusic.paused) {
      webBackgroundMusic.currentTime = 0;
      await webBackgroundMusic.play().catch(() => {});
    }
  } catch (error) {
    console.warn('Failed to play background music:', error);
  }
}

export async function stopMusic(): Promise<void> {
  try {
    if (webBackgroundMusic) {
      webBackgroundMusic.pause();
      webBackgroundMusic.currentTime = 0;
    }
  } catch (error) {
    console.warn('Failed to stop background music:', error);
  }
}

export function setSoundMuted(muted: boolean): void {
  isSoundMuted = muted;
}

export function setMusicMuted(muted: boolean): void {
  isMusicMuted = muted;
  if (muted) {
    stopMusic();
  }
}

export function getSoundMuted(): boolean {
  return isSoundMuted;
}

export function getMusicMuted(): boolean {
  return isMusicMuted;
}

export function setMuted(muted: boolean): void {
  isSoundMuted = muted;
}

export function isSoundMutedState(): boolean {
  return isSoundMuted;
}

export function toggleMute(): boolean {
  isSoundMuted = !isSoundMuted;
  return isSoundMuted;
}

export async function releaseAllSounds(): Promise<void> {
  webAudioCache.clear();
  webBackgroundMusic = null;
}


