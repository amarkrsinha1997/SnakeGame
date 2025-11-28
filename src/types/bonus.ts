/**
 * Bonus System - Open/Closed Principle Implementation
 *
 * This module provides a flexible bonus system that allows adding new bonus types
 * without modifying existing code. Each bonus type defines its own:
 * - Visual appearance (colors, icon, animations)
 * - Points and scoring logic
 * - Lifetime and spawn behavior
 * - Sound effects
 * - Vibration patterns
 * - Special effects (e.g., shrink snake)
 */

import { Position } from '../constants';

// ============================================================================
// Sound Types for Bonuses
// ============================================================================

export type BonusSoundType =
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

// ============================================================================
// Special Effect Types
// ============================================================================

export type BonusEffectType =
  | 'none' // No special effect
  | 'shrink' // Shrink the snake by N cells
  | 'speed-boost' // Temporarily increase speed
  | 'slow-motion' // Temporarily decrease speed
  | 'invincible'; // Temporarily invincible

export interface BonusEffect {
  type: BonusEffectType;
  value?: number; // e.g., how many cells to shrink
  duration?: number; // Duration in ms for timed effects
}

// ============================================================================
// Bonus Configuration Interface
// ============================================================================

export interface BonusConfig {
  /** Unique identifier for the bonus type */
  readonly type: string;

  /** Display name shown in UI */
  readonly displayName: string;

  /** Minimum points awarded */
  readonly minPoints: number;

  /** Maximum points awarded */
  readonly maxPoints: number;

  /** Lifetime in milliseconds (0 = permanent like regular food) */
  readonly lifetime: number;

  /** Minimum eggs to eat before this bonus can spawn */
  readonly minSpawnAfterEggs: number;

  /** Maximum eggs to eat before this bonus spawns */
  readonly maxSpawnAfterEggs: number;

  /** Minimum eggs to eat before respawn after collected */
  readonly minRespawnAfterEggs: number;

  /** Maximum eggs to eat before respawn after collected */
  readonly maxRespawnAfterEggs: number;

  /** Chance to spawn when conditions are met (0-1) */
  readonly spawnChance: number;

  /** Maximum instances of this bonus that can exist simultaneously */
  readonly maxInstances: number;

  /** Priority for spawning (higher = spawns first when multiple eligible) */
  readonly priority: number;

  // Visual Configuration
  readonly colors: {
    readonly primary: string;
    readonly secondary: string;
    readonly glow: string;
  };

  /** Icon/emoji to display */
  readonly icon: string;

  /** Size multiplier relative to cell size */
  readonly sizeMultiplier: number;

  /** Whether to show a timer bar */
  readonly showTimer: boolean;

  /** Timer bar color */
  readonly timerColor: string;

  // Sound Configuration
  readonly sounds: {
    readonly onSpawn?: BonusSoundType;
    readonly onCollect?: BonusSoundType;
    readonly onDespawn?: BonusSoundType;
    readonly ambient?: BonusSoundType;
  };

  // Vibration patterns (array of [wait, vibrate, wait, vibrate, ...])
  readonly vibration: {
    readonly onCollect: number[];
  };

  /** Whether this bonus makes the snake grow */
  readonly growsSnake: boolean;

  /** Special effect when collected */
  readonly effect: BonusEffect;
}

// ============================================================================
// Active Bonus Instance
// ============================================================================

export interface ActiveBonus {
  /** Unique instance ID */
  id: string;

  /** Reference to the bonus configuration type */
  configType: string;

  /** Current position on the grid */
  position: Position;

  /** Points this specific instance will award */
  points: number;

  /** Time remaining in milliseconds (0 = permanent) */
  timeRemaining: number;

  /** When this bonus was spawned */
  spawnedAt: number;
}

// ============================================================================
// Bonus Registry - Singleton Pattern
// ============================================================================

class BonusRegistry {
  private configs: Map<string, BonusConfig> = new Map();

  register(config: BonusConfig): void {
    this.configs.set(config.type, config);
  }

  get(type: string): BonusConfig | undefined {
    return this.configs.get(type);
  }

  getAll(): BonusConfig[] {
    return Array.from(this.configs.values());
  }

  getAllSorted(): BonusConfig[] {
    return this.getAll().sort((a, b) => b.priority - a.priority);
  }

  getSpawnableBonuses(): BonusConfig[] {
    return this.getAllSorted().filter(
      config => config.type !== 'regular-egg' && config.lifetime > 0,
    );
  }
}

export const bonusRegistry = new BonusRegistry();

// ============================================================================
// Pre-defined Bonus Configurations
// ============================================================================

/** Regular Food/Egg - Always present, no timer */
export const REGULAR_EGG_CONFIG: BonusConfig = {
  type: 'regular-egg',
  displayName: 'Egg',
  minPoints: 1,
  maxPoints: 1,
  lifetime: 0, // Permanent
  minSpawnAfterEggs: 0,
  maxSpawnAfterEggs: 0,
  minRespawnAfterEggs: 0,
  maxRespawnAfterEggs: 0,
  spawnChance: 1,
  maxInstances: 1,
  priority: 100,
  colors: {
    primary: '#ff6b35',
    secondary: '#ff8c5a',
    glow: 'rgba(255, 107, 53, 0.4)',
  },
  icon: '',
  sizeMultiplier: 1,
  showTimer: false,
  timerColor: '#ff4444',
  sounds: {
    onCollect: 'eat',
  },
  vibration: {
    onCollect: [50],
  },
  growsSnake: true,
  effect: { type: 'none' },
};

/** Dragon Egg - High value, timed bonus */
export const DRAGON_EGG_CONFIG: BonusConfig = {
  type: 'dragon-egg',
  displayName: 'Dragon Egg',
  minPoints: 10,
  maxPoints: 15,
  lifetime: 20000, // 20 seconds
  minSpawnAfterEggs: 5,
  maxSpawnAfterEggs: 15,
  minRespawnAfterEggs: 5,
  maxRespawnAfterEggs: 10,
  spawnChance: 1,
  maxInstances: 1,
  priority: 50,
  colors: {
    primary: '#ffd700',
    secondary: '#ff8c00',
    glow: 'rgba(255, 215, 0, 0.6)',
  },
  icon: '🔥',
  sizeMultiplier: 1.5,
  showTimer: true,
  timerColor: '#ff4444',
  sounds: {
    onSpawn: 'dragonSpawn',
    onCollect: 'dragonEat',
    onDespawn: 'dragonDespawn',
    ambient: 'dragonAmbient',
  },
  vibration: {
    onCollect: [0, 100, 50, 100],
  },
  growsSnake: true,
  effect: { type: 'none' },
};

/** Shrink Egg - Shrinks snake by 5 cells */
export const SHRINK_EGG_CONFIG: BonusConfig = {
  type: 'shrink-egg',
  displayName: 'Shrink Egg',
  minPoints: 3,
  maxPoints: 5,
  lifetime: 15000, // 15 seconds
  minSpawnAfterEggs: 10,
  maxSpawnAfterEggs: 15,
  minRespawnAfterEggs: 10,
  maxRespawnAfterEggs: 15,
  spawnChance: 0.8,
  maxInstances: 1,
  priority: 45,
  colors: {
    primary: '#00ffcc', // Cyan/teal
    secondary: '#00cc99', // Darker teal
    glow: 'rgba(0, 255, 204, 0.5)',
  },
  icon: '🔽',
  sizeMultiplier: 1.4,
  showTimer: true,
  timerColor: '#00ffcc',
  sounds: {
    onSpawn: 'shrinkSpawn',
    onCollect: 'shrinkEat',
    onDespawn: 'dragonDespawn',
  },
  vibration: {
    onCollect: [0, 50, 30, 50, 30, 50],
  },
  growsSnake: false, // Does NOT grow snake
  effect: { type: 'shrink', value: 5 }, // Shrinks snake by 5 cells
};

/** Golden Apple - Medium value, shorter timer */
export const GOLDEN_APPLE_CONFIG: BonusConfig = {
  type: 'golden-apple',
  displayName: 'Golden Apple',
  minPoints: 5,
  maxPoints: 8,
  lifetime: 10000, // 10 seconds
  minSpawnAfterEggs: 10,
  maxSpawnAfterEggs: 25,
  minRespawnAfterEggs: 8,
  maxRespawnAfterEggs: 15,
  spawnChance: 0.6,
  maxInstances: 1,
  priority: 40,
  colors: {
    primary: '#ffcc00',
    secondary: '#ff9900',
    glow: 'rgba(255, 204, 0, 0.5)',
  },
  icon: '🍎',
  sizeMultiplier: 1.3,
  showTimer: true,
  timerColor: '#ffcc00',
  sounds: {
    onSpawn: 'dragonSpawn',
    onCollect: 'dragonEat',
    onDespawn: 'dragonDespawn',
  },
  vibration: {
    onCollect: [0, 75, 50, 75],
  },
  growsSnake: true,
  effect: { type: 'none' },
};

/** Crystal Gem - Rare high value bonus */
export const CRYSTAL_GEM_CONFIG: BonusConfig = {
  type: 'crystal-gem',
  displayName: 'Crystal Gem',
  minPoints: 15,
  maxPoints: 25,
  lifetime: 8000, // 8 seconds
  minSpawnAfterEggs: 20,
  maxSpawnAfterEggs: 40,
  minRespawnAfterEggs: 15,
  maxRespawnAfterEggs: 25,
  spawnChance: 0.4,
  maxInstances: 1,
  priority: 30,
  colors: {
    primary: '#00ffff',
    secondary: '#00cccc',
    glow: 'rgba(0, 255, 255, 0.5)',
  },
  icon: '💎',
  sizeMultiplier: 1.4,
  showTimer: true,
  timerColor: '#00ffff',
  sounds: {
    onSpawn: 'dragonSpawn',
    onCollect: 'dragonEat',
    onDespawn: 'dragonDespawn',
  },
  vibration: {
    onCollect: [0, 50, 30, 50, 30, 100],
  },
  growsSnake: true,
  effect: { type: 'none' },
};

// Register all bonus types
bonusRegistry.register(REGULAR_EGG_CONFIG);
bonusRegistry.register(DRAGON_EGG_CONFIG);
bonusRegistry.register(SHRINK_EGG_CONFIG);
bonusRegistry.register(GOLDEN_APPLE_CONFIG);
bonusRegistry.register(CRYSTAL_GEM_CONFIG);

// ============================================================================
// Bonus Helper Functions
// ============================================================================

/**
 * Generate a unique ID for a bonus instance
 */
export function generateBonusId(): string {
  return `bonus_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Calculate random points for a bonus based on its config
 */
export function getRandomPoints(config: BonusConfig): number {
  if (config.minPoints === config.maxPoints) {
    return config.minPoints;
  }
  return (
    Math.floor(Math.random() * (config.maxPoints - config.minPoints + 1)) +
    config.minPoints
  );
}

/**
 * Calculate random spawn threshold
 */
export function getRandomSpawnThreshold(config: BonusConfig): number {
  if (config.minSpawnAfterEggs === config.maxSpawnAfterEggs) {
    return config.minSpawnAfterEggs;
  }
  return (
    Math.floor(
      Math.random() * (config.maxSpawnAfterEggs - config.minSpawnAfterEggs + 1),
    ) + config.minSpawnAfterEggs
  );
}

/**
 * Calculate random respawn threshold
 */
export function getRandomRespawnThreshold(config: BonusConfig): number {
  if (config.minRespawnAfterEggs === config.maxRespawnAfterEggs) {
    return config.minRespawnAfterEggs;
  }
  return (
    Math.floor(
      Math.random() *
        (config.maxRespawnAfterEggs - config.minRespawnAfterEggs + 1),
    ) + config.minRespawnAfterEggs
  );
}

/**
 * Check if a bonus should spawn based on spawn chance
 */
export function shouldSpawn(config: BonusConfig): boolean {
  return Math.random() <= config.spawnChance;
}

/**
 * Create a new active bonus instance
 */
export function createActiveBonus(
  config: BonusConfig,
  position: Position,
): ActiveBonus {
  return {
    id: generateBonusId(),
    configType: config.type,
    position,
    points: getRandomPoints(config),
    timeRemaining: config.lifetime,
    spawnedAt: Date.now(),
  };
}

/**
 * Check if a position collides with any active bonus
 */
export function checkBonusCollision(
  position: Position,
  bonuses: ActiveBonus[],
): ActiveBonus | null {
  return (
    bonuses.find(
      bonus =>
        bonus.position.x === position.x && bonus.position.y === position.y,
    ) || null
  );
}

/**
 * Get all positions occupied by active bonuses
 */
export function getBonusPositions(bonuses: ActiveBonus[]): Position[] {
  return bonuses.map(bonus => bonus.position);
}

/**
 * Count active instances of a specific bonus type
 */
export function countActiveBonusType(
  bonuses: ActiveBonus[],
  type: string,
): number {
  return bonuses.filter(bonus => bonus.configType === type).length;
}

// ============================================================================
// Bonus Manager State
// ============================================================================

export interface BonusManagerState {
  /** Currently active timed bonuses on the board */
  activeBonuses: ActiveBonus[];

  /** Eggs eaten since last spawn of each bonus type */
  eggsEatenSince: Record<string, number>;

  /** Next spawn threshold for each bonus type */
  nextSpawnAt: Record<string, number>;
}

/**
 * Create initial bonus manager state
 */
export function createInitialBonusState(): BonusManagerState {
  const configs = bonusRegistry.getSpawnableBonuses();
  const eggsEatenSince: Record<string, number> = {};
  const nextSpawnAt: Record<string, number> = {};

  configs.forEach(config => {
    eggsEatenSince[config.type] = 0;
    nextSpawnAt[config.type] = getRandomSpawnThreshold(config);
  });

  return {
    activeBonuses: [],
    eggsEatenSince,
    nextSpawnAt,
  };
}

/**
 * Check which bonuses are eligible to spawn
 */
export function getEligibleBonuses(state: BonusManagerState): BonusConfig[] {
  const configs = bonusRegistry.getSpawnableBonuses();

  return configs.filter(config => {
    const eggsEaten = state.eggsEatenSince[config.type] || 0;
    const threshold = state.nextSpawnAt[config.type] || 0;
    const activeCount = countActiveBonusType(state.activeBonuses, config.type);

    return (
      eggsEaten >= threshold &&
      activeCount < config.maxInstances &&
      shouldSpawn(config)
    );
  });
}
