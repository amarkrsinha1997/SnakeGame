import { Platform } from 'react-native';

type SoundType = 'eat' | 'dragonEat' | 'dragonSpawn' | 'dragonDespawn' | 'gameOver' | 'gameStart' | 'highScore';

let isSoundMuted = false;
let isMusicMuted = false;
let webBackgroundMusic: HTMLAudioElement | null = null;

const webAudioCache: Map<SoundType, HTMLAudioElement> = new Map();

function getWebAudioUrl(type: SoundType): string {
  const urls: Record<SoundType, string> = {
    eat: '/sounds/eat.mp3',
    dragonEat: '/sounds/dragon_egg_ate.wav',
    dragonSpawn: '/sounds/dragon_spawn.mp3',
    dragonDespawn: '/sounds/dragon_despawn.wav',
    gameOver: '/sounds/game_over.mp3',
    gameStart: '/sounds/game_start.mp3',
    highScore: '/sounds/high_score.wav',
  };
  return urls[type];
}

function loadWebSound(type: SoundType): HTMLAudioElement | null {
  if (Platform.OS !== 'web') return null;
  
  try {
    const cached = webAudioCache.get(type);
    if (cached) {
      return cached;
    }

    const audio = new Audio(getWebAudioUrl(type));
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
    if (Platform.OS === 'web') {
      const audio = loadWebSound(type);
      if (audio) {
        audio.currentTime = 0;
        await audio.play().catch(() => {});
      }
    } else {
      // Native mobile: Sound disabled (no external libraries needed)
      // Can be implemented with native modules if needed in the future
    }
  } catch (error) {
    console.warn(`Failed to play sound ${type}:`, error);
  }
}

export async function playMusic(): Promise<void> {
  if (isMusicMuted) return;

  try {
    if (Platform.OS === 'web') {
      if (!webBackgroundMusic) {
        webBackgroundMusic = new Audio('/sounds/music_music.mp3');
        webBackgroundMusic.loop = true;
        webBackgroundMusic.volume = 0.3;
      }
      if (webBackgroundMusic.paused) {
        webBackgroundMusic.currentTime = 0;
        await webBackgroundMusic.play().catch(() => {});
      }
    } else {
      // Native mobile: Music disabled (no external libraries needed)
    }
  } catch (error) {
    console.warn('Failed to play background music:', error);
  }
}

export async function stopMusic(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (webBackgroundMusic) {
        webBackgroundMusic.pause();
        webBackgroundMusic.currentTime = 0;
      }
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
