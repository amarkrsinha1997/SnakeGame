import { Platform } from 'react-native';

// Lazy / defensive require of react-native-sound so the app doesn't crash
// when the native module isn't linked or available (e.g. in some iOS setups).
// We never assume Sound is available; all native audio paths are guarded.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let SoundModule: any | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const SoundLib = require('react-native-sound');
  SoundModule = SoundLib.default || SoundLib;
  if (SoundModule && typeof SoundModule.setCategory === 'function') {
    SoundModule.setCategory('Playback');
  }
} catch (error) {
  console.warn(
    'react-native-sound is not available; native sounds will be disabled.',
    error,
  );
}

function hasNativeSound(): boolean {
  return Platform.OS !== 'web' && !!SoundModule;
}

type SoundType =
  | 'eat'
  | 'dragonEat'
  | 'dragonSpawn'
  | 'dragonAmbient'
  | 'dragonDespawn'
  | 'shrinkEat'
  | 'shrinkSpawn'
  | 'gameOver'
  | 'gameStart'
  | 'highScore';

let isSoundMuted = false;
let isMusicMuted = false;
let webBackgroundMusic: HTMLAudioElement | null = null;
let nativeBackgroundMusic: any | null = null;
let webDragonAmbient: HTMLAudioElement | null = null;
let nativeDragonAmbient: any | null = null;

const webAudioCache: Map<SoundType, HTMLAudioElement> = new Map();
const nativeAudioCache: Map<SoundType, any> = new Map();

// Web: use require() which returns URLs via webpack
const webSoundFiles: Record<SoundType, any> = {
  eat: require('../assets/sounds/eat.mp3'),
  dragonEat: require('../assets/sounds/dragon_egg_ate.wav'),
  dragonSpawn: require('../assets/sounds/dragon_spawn.mp3'),
  dragonAmbient: require('../assets/sounds/dragon_spawn.mp3'), // Reuse spawn sound as ambient loop
  dragonDespawn: require('../assets/sounds/dragon_despawn.wav'),
  shrinkEat: require('../assets/sounds/eat.mp3'), // Reuse eat sound for shrink collect
  shrinkSpawn: require('../assets/sounds/dragon_spawn.mp3'), // Reuse dragon spawn for shrink spawn
  gameOver: require('../assets/sounds/game_over.mp3'),
  gameStart: require('../assets/sounds/game_start.mp3'),
  highScore: require('../assets/sounds/high_score.wav'),
};

// Native iOS/Android: string filenames for react-native-sound with MAIN_BUNDLE
// These files must be added to the iOS bundle (Xcode) and Android res/raw
const nativeSoundFileNames: Record<SoundType, string> = {
  eat: 'eat.mp3',
  dragonEat: 'dragon_egg_ate.wav',
  dragonSpawn: 'dragon_spawn.mp3',
  dragonAmbient: 'dragon_spawn.mp3', // Reuse spawn sound as ambient loop
  dragonDespawn: 'dragon_despawn.wav',
  shrinkEat: 'eat.mp3', // Reuse eat sound for shrink collect
  shrinkSpawn: 'dragon_spawn.mp3', // Reuse dragon spawn for shrink spawn
  gameOver: 'game_over.mp3',
  gameStart: 'game_start.mp3',
  highScore: 'high_score.wav',
};

const webBackgroundMusicFile = require('../assets/sounds/music_music.mp3');
const nativeBackgroundMusicFileName = 'music_music.mp3';

function getWebAudioUrl(type: SoundType): string {
  return webSoundFiles[type];
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function loadNativeSound(type: SoundType): Promise<any | null> {
  if (!hasNativeSound()) return Promise.resolve(null);

  return new Promise(resolve => {
    try {
      const cached = nativeAudioCache.get(type);
      if (cached) {
        resolve(cached);
        return;
      }

      // Use string filename with MAIN_BUNDLE for iOS/Android
      const sound = new SoundModule(
        nativeSoundFileNames[type],
        SoundModule.MAIN_BUNDLE,
        (error: unknown) => {
          if (error) {
            console.warn(`Failed to load native sound ${type}:`, error);
            console.warn('Sound file:', nativeSoundFileNames[type]);
            resolve(null);
            return;
          }
          console.log(`Successfully loaded sound: ${type}`);
          nativeAudioCache.set(type, sound);
          resolve(sound);
        },
      );
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
        sound.play((success: boolean) => {
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
        webBackgroundMusic = new Audio(webBackgroundMusicFile);
        webBackgroundMusic.loop = true;
        webBackgroundMusic.volume = 0.3;
      }
      if (webBackgroundMusic.paused) {
        webBackgroundMusic.currentTime = 0;
        await webBackgroundMusic.play().catch(error => {
          console.warn('Failed to play web music:', error);
        });
      }
    } else {
      if (!hasNativeSound()) {
        console.warn(
          'react-native-sound is not available; cannot play native background music.',
        );
        return;
      }

      if (!nativeBackgroundMusic) {
        // Use string filename with MAIN_BUNDLE for iOS/Android
        nativeBackgroundMusic = new SoundModule(
          nativeBackgroundMusicFileName,
          SoundModule.MAIN_BUNDLE,
          (error: unknown) => {
            if (error) {
              console.warn('Failed to load background music:', error);
              console.warn(
                'Background music file:',
                nativeBackgroundMusicFileName,
              );
              nativeBackgroundMusic = null;
              return;
            }
            console.log('Successfully loaded background music');
            if (nativeBackgroundMusic && !isMusicMuted) {
              nativeBackgroundMusic.setNumberOfLoops(-1);
              nativeBackgroundMusic.setVolume(0.3);
              nativeBackgroundMusic.play((success: boolean) => {
                if (!success) {
                  console.warn('Failed to play background music');
                } else {
                  console.log('Background music started playing');
                }
              });
            }
          },
        );
      } else if (!nativeBackgroundMusic.isPlaying()) {
        nativeBackgroundMusic.play((success: boolean) => {
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
      if (hasNativeSound() && nativeBackgroundMusic) {
        nativeBackgroundMusic.pause();
      }
    }
  } catch (error) {
    console.warn('Failed to stop background music:', error);
  }
}

export async function playDragonAmbient(): Promise<void> {
  if (isSoundMuted) return;

  try {
    if (Platform.OS === 'web') {
      if (!webDragonAmbient) {
        webDragonAmbient = new Audio(webSoundFiles.dragonAmbient);
        webDragonAmbient.loop = true;
        webDragonAmbient.volume = 0.2; // Subtle ambient volume
      }
      if (webDragonAmbient.paused) {
        webDragonAmbient.currentTime = 0;
        await webDragonAmbient.play().catch(error => {
          console.warn('Failed to play dragon ambient:', error);
        });
      }
    } else {
      if (!hasNativeSound()) return;

      if (!nativeDragonAmbient) {
        nativeDragonAmbient = new SoundModule(
          nativeSoundFileNames.dragonAmbient,
          SoundModule.MAIN_BUNDLE,
          (error: unknown) => {
            if (error) {
              console.warn('Failed to load dragon ambient:', error);
              nativeDragonAmbient = null;
              return;
            }
            if (nativeDragonAmbient && !isSoundMuted) {
              nativeDragonAmbient.setNumberOfLoops(-1); // Loop indefinitely
              nativeDragonAmbient.setVolume(0.2); // Subtle volume
              nativeDragonAmbient.play((success: boolean) => {
                if (!success) {
                  console.warn('Failed to play dragon ambient');
                }
              });
            }
          },
        );
      } else if (!nativeDragonAmbient.isPlaying()) {
        nativeDragonAmbient.play();
      }
    }
  } catch (error) {
    console.warn('Failed to play dragon ambient:', error);
  }
}

export async function stopDragonAmbient(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (webDragonAmbient) {
        webDragonAmbient.pause();
        webDragonAmbient.currentTime = 0;
      }
    } else {
      if (hasNativeSound() && nativeDragonAmbient) {
        nativeDragonAmbient.pause();
        nativeDragonAmbient.setCurrentTime(0);
      }
    }
  } catch (error) {
    console.warn('Failed to stop dragon ambient:', error);
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
  webDragonAmbient = null;

  if (hasNativeSound()) {
    nativeAudioCache.forEach(sound => {
      sound.release();
    });
    nativeAudioCache.clear();

    if (nativeBackgroundMusic) {
      nativeBackgroundMusic.release();
      nativeBackgroundMusic = null;
    }

    if (nativeDragonAmbient) {
      nativeDragonAmbient.release();
      nativeDragonAmbient = null;
    }
  }
}
