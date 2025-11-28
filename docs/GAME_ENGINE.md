# Snake Game Engine Documentation

## Overview

This document provides a comprehensive explanation of the Snake Game engine architecture, including the game loop, collision detection system, and bonus mechanics.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Game Loop](#game-loop)
3. [Collision Detection](#collision-detection)
4. [Bonus System](#bonus-system)
5. [Rendering System](#rendering-system)
6. [Sound System](#sound-system)

---

## Architecture Overview

The Snake Game is built using React Native with a pure functional component approach. The architecture follows several key principles:

### Core Components

```
src/
├── components/
│   ├── GameScreen.tsx      # Main game logic and state management
│   ├── HomeScreen.tsx      # Menu and navigation
│   ├── Snake.tsx           # Snake rendering (pure presentational)
│   ├── BonusRenderer.tsx   # Unified bonus rendering system
│   └── DPadControls.tsx    # Touch controls
├── types/
│   └── bonus.ts            # Bonus configuration and registry
├── utils/
│   ├── soundManager.ts     # Cross-platform audio
│   └── storage.ts          # Persistence (AsyncStorage)
└── constants.ts            # Game constants and configuration
```

### State Management

The game uses React's built-in state management:
- **useState** - For game state (snake position, score, etc.)
- **useRef** - For values that shouldn't trigger re-renders (direction buffer, timers)
- **useEffect** - For side effects (game loop, keyboard listeners)
- **useCallback** - For memoized event handlers

---

## Game Loop

### Implementation

The game loop is implemented using `setInterval` inside a `useEffect` hook:

```typescript
useEffect(() => {
  if (!gameState.isRunning || gameState.isGameOver) return;

  const interval = setInterval(() => {
    setGameState(prev => {
      // 1. Read buffered direction
      const direction = nextDirectionRef.current;
      directionRef.current = direction;
      
      // 2. Calculate new head position
      const dir = DIRECTIONS[direction];
      const head = prev.snake[0];
      const newHead = { x: head.x + dir.x, y: head.y + dir.y };
      
      // 3. Check collisions (walls & self)
      // 4. Process food/bonus collisions
      // 5. Update snake position
      // 6. Return new state
    });
  }, currentSpeed);

  return () => clearInterval(interval);
}, [gameState.isRunning, gameState.isGameOver, currentSpeed]);
```

### Speed System

Game speed is dynamically calculated based on snake length and difficulty:

```typescript
// From constants.ts
export function calculateGameSpeed(
  snakeLength: number,
  difficulty: GameDifficulty = 'medium'
): number {
  const settings = DIFFICULTY_SETTINGS[difficulty];
  const speed = settings.baseSpeed + snakeLength * settings.speedIncrease;
  return Math.min(speed, settings.maxSpeedCap);
}
```

| Difficulty | Base Speed | Speed Increase | Max Cap |
|------------|------------|----------------|---------|
| Easy       | 150ms      | 2ms/segment    | 300ms   |
| Medium     | 100ms      | 2ms/segment    | 250ms   |
| Hard       | 70ms       | 2ms/segment    | 200ms   |
| Extreme    | 50ms       | 2ms/segment    | 150ms   |

### Direction Buffering

To prevent input lag and ensure responsive controls, direction changes are buffered using `useRef`:

```typescript
const directionRef = useRef<Direction>('RIGHT');      // Current direction
const nextDirectionRef = useRef<Direction>('RIGHT');  // Buffered next direction

// Direction change handler
const handleDirectionChange = useCallback((newDirection: Direction) => {
  const currentDir = DIRECTIONS[directionRef.current];
  const newDir = DIRECTIONS[newDirection];
  // Prevent 180° turns
  if (currentDir.x + newDir.x !== 0 || currentDir.y + newDir.y !== 0) {
    nextDirectionRef.current = newDirection;
  }
}, []);
```

---

## Collision Detection

### Wall Collision

The snake dies when its head goes out of bounds:

```typescript
if (
  newHead.x < 0 ||
  newHead.x >= GRID_WIDTH ||
  newHead.y < 0 ||
  newHead.y >= GRID_HEIGHT
) {
  return { ...prev, isGameOver: true, isRunning: false };
}
```

### Self Collision

The snake dies when its head collides with any body segment (except the head itself):

```typescript
if (
  prev.snake.some(
    (seg, i) => i > 0 && seg.x === newHead.x && seg.y === newHead.y
  )
) {
  return { ...prev, isGameOver: true, isRunning: false };
}
```

### Food Collision

When the snake's head position matches the food position:

```typescript
if (newHead.x === prev.food.x && newHead.y === prev.food.y) {
  // Award points
  newScore += foodConfig.minPoints;
  
  // Snake grows (don't remove tail)
  snakeGrew = foodConfig.growsSnake;
  
  // Spawn new food at random position
  newFood = getRandomPosition(allOccupiedPositions);
  
  // Play sound and vibration
  playSound(foodConfig.sounds.onCollect);
  
  // Check bonus spawn conditions
  // ...
}
```

### Bonus Collision

Similar to food collision, but with additional effect handling:

```typescript
const collidedBonusIndex = bonusState.activeBonuses.findIndex(
  bonus => bonus.position.x === newHead.x && bonus.position.y === newHead.y
);

if (collidedBonusIndex !== -1) {
  const collidedBonus = bonusState.activeBonuses[collidedBonusIndex];
  const config = bonusRegistry.get(collidedBonus.configType);
  
  // Award points
  newScore += collidedBonus.points;
  
  // Handle special effects (e.g., shrink)
  if (config.effect.type === 'shrink') {
    // Shrink snake by config.effect.value cells
  }
  
  // Remove collected bonus
  // Reset spawn counter
}
```

---

## Bonus System

### Design Philosophy: Open/Closed Principle

The bonus system is designed using the Open/Closed Principle - open for extension, closed for modification. New bonus types can be added without changing existing code.

### Bonus Configuration Interface

```typescript
interface BonusConfig {
  // Identity
  type: string;                    // Unique identifier
  displayName: string;             // UI name
  
  // Scoring
  minPoints: number;               // Minimum points awarded
  maxPoints: number;               // Maximum points awarded
  
  // Timing
  lifetime: number;                // Duration in ms (0 = permanent)
  
  // Spawn Conditions
  minSpawnAfterEggs: number;       // Min eggs to eat before spawn
  maxSpawnAfterEggs: number;       // Max eggs to eat before spawn
  minRespawnAfterEggs: number;     // Min eggs after collected
  maxRespawnAfterEggs: number;     // Max eggs after collected
  spawnChance: number;             // 0-1 probability
  maxInstances: number;            // Max active at once
  priority: number;                // Spawn priority (higher = first)
  
  // Visual
  colors: { primary, secondary, glow };
  icon: string;
  sizeMultiplier: number;
  showTimer: boolean;
  timerColor: string;
  
  // Audio & Haptics
  sounds: { onSpawn?, onCollect?, onDespawn?, ambient? };
  vibration: { onCollect: number[] };
  
  // Gameplay Effects
  growsSnake: boolean;
  effect: { type: BonusEffectType, value?: number };
}
```

### Current Bonus Types

#### 1. Normal Egg (Regular Food)
- **Points**: 1
- **Lifetime**: Permanent (always on screen)
- **Effect**: Grows snake by 1 cell
- **Visual**: Orange pulsing egg

#### 2. Dragon Egg
- **Points**: 10-15 (random)
- **Lifetime**: 20 seconds
- **Spawn**: After 5-15 eggs eaten
- **Respawn**: After 5-10 eggs eaten
- **Effect**: Grows snake by 1 cell
- **Visual**: Gold rotating egg with particles and fire icon

#### 3. Shrink Egg
- **Points**: 3-5 (random)
- **Lifetime**: 15 seconds
- **Spawn**: After 10-15 eggs eaten
- **Respawn**: After 10-15 eggs eaten
- **Effect**: Shrinks snake by 5 cells (if snake has >7 cells)
- **Visual**: Cyan/teal egg with shrinking animation

### Bonus Spawn Logic

```typescript
// After eating regular food, check each spawnable bonus
spawnableBonuses.forEach(config => {
  const eggsEaten = bonusState.eggsEatenSince[config.type];
  const threshold = bonusState.nextSpawnAt[config.type];
  const activeCount = countActiveBonusType(bonusState.activeBonuses, config.type);

  if (
    eggsEaten >= threshold &&           // Enough eggs eaten
    activeCount < config.maxInstances && // Room for more
    Math.random() <= config.spawnChance  // Luck check
  ) {
    // Spawn the bonus
    const position = getRandomPosition(excludePositions);
    const newBonus = createActiveBonus(config, position);
    bonusState.activeBonuses.push(newBonus);
  }
});
```

### Bonus Timer System

Timed bonuses are managed by a separate interval:

```typescript
useEffect(() => {
  if (activeBonuses.length > 0 && gameState.isRunning) {
    const timer = setInterval(() => {
      setGameState(prev => {
        const updatedBonuses = [];
        const expiredBonuses = [];
        
        prev.bonusState.activeBonuses.forEach(bonus => {
          const config = bonusRegistry.get(bonus.configType);
          const newTime = bonus.timeRemaining - 100;
          
          if (newTime <= 0) {
            expiredBonuses.push(bonus);
            playSound(config.sounds.onDespawn);
          } else {
            updatedBonuses.push({ ...bonus, timeRemaining: newTime });
          }
        });
        
        return { ...prev, bonusState: { activeBonuses: updatedBonuses } };
      });
    }, 100); // Update every 100ms
    
    return () => clearInterval(timer);
  }
}, [activeBonuses.length, gameState.isRunning]);
```

### Adding a New Bonus Type

To add a new bonus, create a configuration in `src/types/bonus.ts`:

```typescript
export const MY_NEW_BONUS_CONFIG: BonusConfig = {
  type: 'my-new-bonus',
  displayName: 'My New Bonus',
  minPoints: 5,
  maxPoints: 10,
  lifetime: 10000,
  minSpawnAfterEggs: 8,
  maxSpawnAfterEggs: 12,
  minRespawnAfterEggs: 6,
  maxRespawnAfterEggs: 10,
  spawnChance: 0.7,
  maxInstances: 1,
  priority: 35,
  colors: {
    primary: '#ff00ff',
    secondary: '#cc00cc',
    glow: 'rgba(255, 0, 255, 0.5)',
  },
  icon: '⭐',
  sizeMultiplier: 1.3,
  showTimer: true,
  timerColor: '#ff00ff',
  sounds: {
    onSpawn: 'dragonSpawn',
    onCollect: 'dragonEat',
    onDespawn: 'dragonDespawn',
  },
  vibration: { onCollect: [0, 80, 40, 80] },
  growsSnake: true,
  effect: { type: 'none' },
};

// Register it
bonusRegistry.register(MY_NEW_BONUS_CONFIG);
```

If the bonus needs a special renderer, add it to `BonusRenderer.tsx`:

```typescript
if (config.type === 'my-new-bonus') {
  return <MyNewBonusRenderer bonus={bonus} config={config} />;
}
```

---

## Rendering System

### Unified Bonus Renderer

All bonuses (including regular food) are rendered through `BonusRenderer.tsx`:

```typescript
export function BonusRenderer({ bonus }: BonusRendererProps) {
  const config = bonusRegistry.get(bonus.configType);
  
  // Delegate to specialized renderers
  if (config.type === 'dragon-egg') {
    return <DragonEggRenderer bonus={bonus} config={config} />;
  }
  if (config.type === 'shrink-egg') {
    return <ShrinkEggRenderer bonus={bonus} config={config} />;
  }
  
  // Default renderer for generic bonuses
  return <DefaultBonusRenderer bonus={bonus} config={config} />;
}

// Normal food has its own renderer
export function NormalEggRenderer({ position }: FoodBonusRendererProps) {
  // Simple pulsing egg animation
}
```

### Animation Patterns

Each bonus type uses different animation patterns:

| Bonus | Animations |
|-------|------------|
| Normal Egg | Pulse (scale 1→1.2→1) |
| Dragon Egg | Pulse + Rotation + Particles + Glow |
| Shrink Egg | Pulse + Reverse Rotation + Shrink Ring + Glow |

---

## Sound System

### Cross-Platform Audio

The sound system (`soundManager.ts`) handles both web and native platforms:

```typescript
// Web: HTML5 Audio API
if (Platform.OS === 'web') {
  const audio = new Audio(soundUrl);
  audio.play();
}

// Native: react-native-sound
else {
  const sound = new SoundModule(filename, SoundModule.MAIN_BUNDLE);
  sound.play();
}
```

### Available Sounds

| Sound Type | File | Usage |
|------------|------|-------|
| eat | eat.mp3 | Regular food eaten |
| dragonEat | dragon_egg_ate.wav | Dragon egg eaten |
| dragonSpawn | dragon_spawn.mp3 | Dragon egg appears |
| dragonDespawn | dragon_despawn.wav | Dragon egg expires |
| shrinkEat | eat.mp3 | Shrink egg eaten |
| shrinkSpawn | dragon_spawn.mp3 | Shrink egg appears |
| gameOver | game_over.mp3 | Game ends |
| gameStart | game_start.mp3 | Game starts |
| highScore | high_score.wav | New high score |

---

## Performance Considerations

1. **Direction Buffering**: Using `useRef` prevents re-renders on every direction change
2. **Memoized Callbacks**: `useCallback` prevents unnecessary function recreations
3. **Sound Caching**: Audio objects are cached after first load
4. **Pure Presentational Components**: Snake, Food, etc. are stateless for efficient rendering
5. **Selective Re-renders**: State updates are batched and minimal

---

## Platform Support

| Feature | Web | iOS | Android |
|---------|-----|-----|---------|
| Game Logic | ✅ | ✅ | ✅ |
| Touch Controls | ✅ | ✅ | ✅ |
| Keyboard (WASD/Arrows) | ✅ | N/A | N/A |
| Vibration | ❌ | ✅ | ✅ |
| Sound Effects | ✅ | ✅ | ✅ |
| Background Music | ✅ | ✅ | ✅ |
| High Score Storage | ✅ | ✅ | ✅ |

---

## Building & Distribution

### Android APK

```bash
cd android
./gradlew assembleRelease
```

Output: `android/app/build/outputs/apk/release/app-release.apk`

### Web

```bash
npm run web:build
```

Output: `dist/` folder

### iOS

```bash
npm run ios
```

Requires Xcode and proper signing configuration.
