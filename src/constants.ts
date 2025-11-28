import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const CELL_SIZE = 10;

// Difficulty Settings
export type GameDifficulty = 'easy' | 'medium' | 'hard' | 'extreme';

export const DIFFICULTY_SETTINGS = {
  easy: {
    baseSpeed: 150,
    speedIncrease: 2,
    maxSpeedCap: 300,
    label: 'Easy',
    color: '#00ff88',
  },
  medium: {
    baseSpeed: 100,
    speedIncrease: 2,
    maxSpeedCap: 250,
    label: 'Medium',
    color: '#ffd700',
  },
  hard: {
    baseSpeed: 70,
    speedIncrease: 2,
    maxSpeedCap: 200,
    label: 'Hard',
    color: '#ff6b35',
  },
  extreme: {
    baseSpeed: 50,
    speedIncrease: 2,
    maxSpeedCap: 150,
    label: 'Extreme',
    color: '#ff4444',
  },
} as const;

export const GAME_BASE_SPEED = 100;
export const SPEED_INCREASE_PER_SEGMENT = 2;
export const MAX_SPEED_CAP = 250;

export const REGULAR_EGG_POINTS = 1;
export const DRAGON_EGG_MIN_POINTS = 10;
export const DRAGON_EGG_MAX_POINTS = 15;
export const DRAGON_EGG_MIN_SPAWN = 5;
export const DRAGON_EGG_MAX_SPAWN = 15;
export const DRAGON_EGG_MIN_RESPAWN = 5;
export const DRAGON_EGG_MAX_RESPAWN = 10;
export const DRAGON_EGG_LIFETIME = 20000;

export const SOUND_ENABLED = true;

const HEADER_HEIGHT = 200;
const CONTROLS_HEIGHT = 50;
const GAME_AREA_HEIGHT = SCREEN_HEIGHT - HEADER_HEIGHT - CONTROLS_HEIGHT - 180;

export const GRID_WIDTH = Math.floor(SCREEN_WIDTH / CELL_SIZE);
export const GRID_HEIGHT = Math.floor(GAME_AREA_HEIGHT / CELL_SIZE);

export const BOARD_WIDTH = GRID_WIDTH * CELL_SIZE;
export const BOARD_HEIGHT = GRID_HEIGHT * CELL_SIZE;

export const COLORS = {
  background: '#0a0a0f',
  grid: '#1a1a2e',
  gridLine: '#252540',
  snakeHead: '#00ff88',
  snakeBody: '#00cc6a',
  snakeGlow: 'rgba(0, 255, 136, 0.3)',
  egg: '#ff6b35',
  eggGlow: 'rgba(255, 107, 53, 0.4)',
  dragonEgg: '#ffd700',
  dragonEggGlow: 'rgba(255, 215, 0, 0.6)',
  dragonEggInner: '#ff8c00',
  text: '#ffffff',
  textSecondary: '#888899',
  scorePanel: '#16162a',
  gameOver: 'rgba(0, 0, 0, 0.85)',
  button: '#00ff88',
  buttonText: '#0a0a0f',
  dpadButton: '#2a2a4a',
  dpadButtonActive: '#00ff88',
  dpadArrow: '#888899',
  dpadArrowActive: '#0a0a0f',
  timerBar: '#ff4444',
  timerBarBg: '#333355',
};

export const DIRECTIONS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
} as const;

export type Direction = keyof typeof DIRECTIONS;
export type Position = { x: number; y: number };

// Bonus System (Open/Closed Principle)
export interface Bonus {
  readonly type: string;
  position: Position;
  readonly points: number;
  readonly lifetime: number; // milliseconds, 0 = permanent
  timeRemaining: number;
  readonly spawnChance: number; // 0-1, chance to spawn after conditions met
}

export class DragonEggBonus implements Bonus {
  readonly type = 'dragon-egg';
  position: Position;
  readonly points: number;
  readonly lifetime = DRAGON_EGG_LIFETIME;
  timeRemaining: number;
  readonly spawnChance = 1;

  constructor(position: Position) {
    this.position = position;
    this.points = getRandomDragonEggPoints();
    this.timeRemaining = this.lifetime;
  }
}

export function calculateGameSpeed(
  snakeLength: number,
  difficulty: GameDifficulty = 'medium',
): number {
  const settings = DIFFICULTY_SETTINGS[difficulty];
  const speed = settings.baseSpeed + snakeLength * settings.speedIncrease;
  return Math.min(speed, settings.maxSpeedCap);
}

export function getRandomDragonEggSpawn(): number {
  return (
    Math.floor(
      Math.random() * (DRAGON_EGG_MAX_SPAWN - DRAGON_EGG_MIN_SPAWN + 1),
    ) + DRAGON_EGG_MIN_SPAWN
  );
}

export function getRandomDragonEggRespawn(): number {
  return (
    Math.floor(
      Math.random() * (DRAGON_EGG_MAX_RESPAWN - DRAGON_EGG_MIN_RESPAWN + 1),
    ) + DRAGON_EGG_MIN_RESPAWN
  );
}

export function getRandomDragonEggPoints(): number {
  return (
    Math.floor(
      Math.random() * (DRAGON_EGG_MAX_POINTS - DRAGON_EGG_MIN_POINTS + 1),
    ) + DRAGON_EGG_MIN_POINTS
  );
}
