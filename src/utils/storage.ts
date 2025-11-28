import AsyncStorage from '@react-native-async-storage/async-storage';

const HIGH_SCORE_KEY = '@snake_game_high_score';
const SOUND_ENABLED_KEY = '@snake_game_sound_enabled';
const MUSIC_ENABLED_KEY = '@snake_game_music_enabled';

export async function getHighScore(): Promise<number> {
  try {
    const value = await AsyncStorage.getItem(HIGH_SCORE_KEY);
    return value ? parseInt(value, 10) : 0;
  } catch {
    return 0;
  }
}

export async function setHighScore(score: number): Promise<void> {
  try {
    await AsyncStorage.setItem(HIGH_SCORE_KEY, score.toString());
  } catch {
    console.warn('Failed to save high score');
  }
}

export async function updateHighScoreIfNeeded(currentScore: number): Promise<number> {
  const highScore = await getHighScore();
  if (currentScore > highScore) {
    await setHighScore(currentScore);
    return currentScore;
  }
  return highScore;
}

export async function getSoundEnabled(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(SOUND_ENABLED_KEY);
    return value === null ? true : value === 'true';
  } catch {
    return true;
  }
}

export async function setSoundEnabled(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(SOUND_ENABLED_KEY, enabled.toString());
  } catch {
    console.warn('Failed to save sound preference');
  }
}

export async function getMusicEnabled(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(MUSIC_ENABLED_KEY);
    return value === null ? true : value === 'true';
  } catch {
    return true;
  }
}

export async function setMusicEnabled(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(MUSIC_ENABLED_KEY, enabled.toString());
  } catch {
    console.warn('Failed to save music preference');
  }
}
