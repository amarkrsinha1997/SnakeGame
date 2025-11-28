import { Platform } from 'react-native';
import Sound from 'react-native-sound';

type SoundType = 'eat' | 'dragonEat' | 'dragonSpawn' | 'dragonDespawn' | 'gameOver' | 'gameStart' | 'highScore';

let isSoundMuted = false;
let isMusicMuted = false;
let webBackgroundMusic: HTMLAudioElement | null = null;
let nativeBackgroundMusic: Sound | null = null;

const webAudioCache: Map<SoundType, HTMLAudioElement> = new Map();
const nativeAudioCache: Map<SoundType, Sound> = new Map();

Sound.setCategory('Playback');

// Sound file mappings - all from src/assets/sounds/
const soundFiles: Record<SoundType, any> = {
  eat: require('../assets/sounds/eat.mp3'),
  dragonEat: require('../assets/sounds/dragon_egg_ate.wav'),
  dragonSpawn: require('../assets/sounds/dragon_spawn.mp3'),
  dragonDespawn: require('../assets/sounds/dragon_despawn.wav'),
  gameOver: require('../assets/sounds/game_over.mp3'),
  gameStart: require('../assets/sounds/game_start.mp3'),
  highScore: require('../assets/sounds/high_score.wav'),
};

const backgroundMusicFile = require('../assets/sounds/music_music.mp3');

function getWebAudioUrl(type: SoundType): string {
  return soundFiles[type];
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

function loadNativeSound(type: SoundType): Promise<Sound | null> {
  if (Platform.OS === 'web') return Promise.resolve(null);
  
  return new Promise((resolve) => {
    try {
      const cached = nativeAudioCache.get(type);
      if (cached) {
        resolve(cached);
        return;
      }

      // Use undefined as basePath when using require()
      const sound = new Sound(soundFiles[type], undefined, (error) => {
        if (error) {
          console.warn(`Failed to load native sound ${type}:`, error);
          console.warn('Sound file:', soundFiles[type]);
          resolve(null);
          return;
        }
        console.log(`Successfully loaded sound: ${type}`);
        nativeAudioCache.set(type, sound);
        resolve(sound);
      });
    } catch (error) {
      console.warn(`Failed to load native sound ${type}:`, error);
      resolve(null);
    }
  });
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
      const sound = await loadNativeSound(type);
      if (sound) {
        // Reset to beginning and play
        sound.setCurrentTime(0);
        sound.play((success) => {
          if (!success) {
            console.warn(`Failed to play sound ${type}`);
          }
        });
      }
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
        webBackgroundMusic = new Audio(backgroundMusicFile);
        webBackgroundMusic.loop = true;
        webBackgroundMusic.volume = 0.3;
      }
      if (webBackgroundMusic.paused) {
        webBackgroundMusic.currentTime = 0;
        await webBackgroundMusic.play().catch((error) => {
          console.warn('Failed to play web music:', error);
        });
      }
    } else {
      if (!nativeBackgroundMusic) {
        // Use undefined as basePath when using require()
        nativeBackgroundMusic = new Sound(backgroundMusicFile, undefined, (error) => {
          if (error) {
            console.warn('Failed to load background music:', error);
            console.warn('Background music file:', backgroundMusicFile);
            nativeBackgroundMusic = null;
            return;
          }
          console.log('Successfully loaded background music');
          if (nativeBackgroundMusic && !isMusicMuted) {
            nativeBackgroundMusic.setNumberOfLoops(-1);
            nativeBackgroundMusic.setVolume(0.3);
            nativeBackgroundMusic.play((success) => {
              if (!success) {
                console.warn('Failed to play background music');
              } else {
                console.log('Background music started playing');
              }
            });
          }
        });
      } else if (!nativeBackgroundMusic.isPlaying()) {
        nativeBackgroundMusic.play((success) => {
          if (!success) {
            console.warn('Failed to resume background music');
          } else {
            console.log('Background music resumed');
          }
        });
      }
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
    } else {
      if (nativeBackgroundMusic) {
        nativeBackgroundMusic.pause();
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
  
  nativeAudioCache.forEach((sound) => {
    sound.release();
  });
  nativeAudioCache.clear();
  
  if (nativeBackgroundMusic) {
    nativeBackgroundMusic.release();
    nativeBackgroundMusic = null;
  }
}
