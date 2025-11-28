import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  PanResponder,
  Vibration,
  Platform,
} from 'react-native';
import {
  COLORS,
  BOARD_WIDTH,
  BOARD_HEIGHT,
  GRID_WIDTH,
  GRID_HEIGHT,
  Direction,
  DIRECTIONS,
  Position,
  GameDifficulty,
  calculateGameSpeed,
} from '../constants';
import {
  ActiveBonus,
  BonusConfig,
  BonusManagerState,
  bonusRegistry,
  createActiveBonus,
  createInitialBonusState,
  getBonusPositions,
  getRandomRespawnThreshold,
  REGULAR_EGG_CONFIG,
} from '../types/bonus';
import { getHighScore, updateHighScoreIfNeeded } from '../utils/storage';
import {
  playSound,
  playMusic,
  stopMusic,
  playDragonAmbient,
  stopDragonAmbient,
} from '../utils/soundManager';
import { Snake } from './Snake';
import { BonusRenderer, NormalEggRenderer } from './BonusRenderer';
import { DPadControls } from './DPadControls';

interface GameScreenProps {
  onExit: () => void;
  difficulty?: GameDifficulty;
}

interface GameState {
  snake: Position[];
  food: Position;
  bonusState: BonusManagerState;
  direction: Direction;
  nextDirection: Direction;
  score: number;
  isRunning: boolean;
  isGameOver: boolean;
}

// ============================================================================
// Helper Functions (extracted to reduce cognitive complexity)
// ============================================================================

function getRandomPosition(excludePositions: Position[]): Position {
  let position: Position;
  do {
    position = {
      x: Math.floor(Math.random() * GRID_WIDTH),
      y: Math.floor(Math.random() * GRID_HEIGHT),
    };
  } while (
    excludePositions.some(pos => pos.x === position.x && pos.y === position.y)
  );
  return position;
}

function createInitialState(): GameState {
  const centerX = Math.floor(GRID_WIDTH / 2);
  const centerY = Math.floor(GRID_HEIGHT / 2);
  const initialSnake: Position[] = [
    { x: centerX, y: centerY },
    { x: centerX - 1, y: centerY },
    { x: centerX - 2, y: centerY },
  ];
  return {
    snake: initialSnake,
    food: getRandomPosition(initialSnake),
    bonusState: createInitialBonusState(),
    direction: 'RIGHT',
    nextDirection: 'RIGHT',
    score: 0,
    isRunning: false,
    isGameOver: false,
  };
}

function checkCollision(head: Position, snake: Position[]): boolean {
  // Wall collision
  if (
    head.x < 0 ||
    head.x >= GRID_WIDTH ||
    head.y < 0 ||
    head.y >= GRID_HEIGHT
  ) {
    return true;
  }
  // Self collision (skip head at index 0)
  for (let i = 1; i < snake.length; i++) {
    if (snake[i].x === head.x && snake[i].y === head.y) {
      return true;
    }
  }
  return false;
}

function triggerVibration(pattern: number[]): void {
  if (Platform.OS === 'web' || pattern.length === 0) return;
  if (pattern.length === 1) {
    Vibration.vibrate(pattern[0]);
  } else {
    Vibration.vibrate(pattern);
  }
}

function processExpiredBonuses(bonuses: ActiveBonus[]): {
  updated: ActiveBonus[];
  expired: ActiveBonus[];
} {
  const updated: ActiveBonus[] = [];
  const expired: ActiveBonus[] = [];

  for (const bonus of bonuses) {
    const config = bonusRegistry.get(bonus.configType);
    if (!config || config.lifetime === 0) {
      updated.push(bonus);
      continue;
    }

    const newTime = bonus.timeRemaining - 100;
    if (newTime <= 0) {
      expired.push(bonus);
      if (config.sounds.onDespawn) {
        playSound(config.sounds.onDespawn);
      }
      if (bonus.configType === 'dragon-egg') {
        stopDragonAmbient();
      }
    } else {
      updated.push({ ...bonus, timeRemaining: newTime });
    }
  }

  return { updated, expired };
}

function resetExpiredBonusCounters(
  expired: ActiveBonus[],
  eggsEatenSince: Record<string, number>,
  nextSpawnAt: Record<string, number>,
): {
  newEggsEatenSince: Record<string, number>;
  newNextSpawnAt: Record<string, number>;
} {
  const newEggsEatenSince = { ...eggsEatenSince };
  const newNextSpawnAt = { ...nextSpawnAt };

  for (const bonus of expired) {
    const config = bonusRegistry.get(bonus.configType);
    if (config) {
      newEggsEatenSince[bonus.configType] = 0;
      newNextSpawnAt[bonus.configType] = getRandomRespawnThreshold(config);
    }
  }

  return { newEggsEatenSince, newNextSpawnAt };
}

function incrementEggsEaten(
  spawnableBonuses: BonusConfig[],
  currentEggsEaten: Record<string, number>,
): Record<string, number> {
  const newEggsEaten = { ...currentEggsEaten };
  for (const config of spawnableBonuses) {
    newEggsEaten[config.type] = (newEggsEaten[config.type] || 0) + 1;
  }
  return newEggsEaten;
}

function trySpawnBonuses(
  spawnableBonuses: BonusConfig[],
  bonusState: BonusManagerState,
  snake: Position[],
  food: Position,
): ActiveBonus[] {
  const newBonuses: ActiveBonus[] = [];

  for (const config of spawnableBonuses) {
    const eggsEaten = bonusState.eggsEatenSince[config.type] || 0;
    const threshold = bonusState.nextSpawnAt[config.type] || 0;
    const activeCount = bonusState.activeBonuses.filter(
      b => b.configType === config.type,
    ).length;

    const shouldSpawn =
      eggsEaten >= threshold &&
      activeCount < config.maxInstances &&
      Math.random() <= config.spawnChance;

    if (shouldSpawn) {
      const bonusPositions = getBonusPositions(bonusState.activeBonuses);
      const excludePositions = [...snake, food, ...bonusPositions];
      const position = getRandomPosition(excludePositions);
      const newBonus = createActiveBonus(config, position);
      newBonuses.push(newBonus);

      if (config.sounds.onSpawn) {
        playSound(config.sounds.onSpawn);
      }
    }
  }

  return newBonuses;
}

function applyShrinkEffect(snake: Position[], shrinkAmount: number): void {
  const minLength = 3; // Keep at least 3 cells
  if (snake.length > shrinkAmount + minLength - 1) {
    for (let i = 0; i < shrinkAmount; i++) {
      snake.pop();
    }
  }
}

function findCollidedBonus(bonuses: ActiveBonus[], position: Position): number {
  for (let i = 0; i < bonuses.length; i++) {
    if (
      bonuses[i].position.x === position.x &&
      bonuses[i].position.y === position.y
    ) {
      return i;
    }
  }
  return -1;
}

function removeBonusAtIndex(
  bonuses: ActiveBonus[],
  index: number,
): ActiveBonus[] {
  return bonuses.filter((_, i) => i !== index);
}

interface FoodCollisionResult {
  newFood: Position;
  newScore: number;
  snakeGrew: boolean;
  newBonusState: BonusManagerState;
  isNewHighScore: boolean;
}

function handleFoodCollision(
  newSnake: Position[],
  currentFood: Position,
  currentScore: number,
  bonusState: BonusManagerState,
  highScore: number,
): FoodCollisionResult {
  const foodConfig = REGULAR_EGG_CONFIG;
  const newScore = currentScore + foodConfig.minPoints;
  const snakeGrew = foodConfig.growsSnake;

  // Spawn new food
  const bonusPositions = getBonusPositions(bonusState.activeBonuses);
  const newFood = getRandomPosition([...newSnake, ...bonusPositions]);

  // Vibration and sound
  triggerVibration(foodConfig.vibration.onCollect);
  if (foodConfig.sounds.onCollect) {
    playSound(foodConfig.sounds.onCollect);
  }

  // Update bonus spawn tracking
  const spawnableBonuses = bonusRegistry.getSpawnableBonuses();
  const newBonusState = { ...bonusState };
  newBonusState.eggsEatenSince = incrementEggsEaten(
    spawnableBonuses,
    bonusState.eggsEatenSince,
  );

  // Try to spawn bonuses
  const spawnedBonuses = trySpawnBonuses(
    spawnableBonuses,
    newBonusState,
    newSnake,
    newFood,
  );
  if (spawnedBonuses.length > 0) {
    newBonusState.activeBonuses = [
      ...newBonusState.activeBonuses,
      ...spawnedBonuses,
    ];
  }

  return {
    newFood,
    newScore,
    snakeGrew,
    newBonusState,
    isNewHighScore: newScore > highScore,
  };
}

interface BonusCollisionResult {
  newScore: number;
  snakeGrew: boolean;
  newBonusState: BonusManagerState;
  isNewHighScore: boolean;
}

function handleBonusCollision(
  newSnake: Position[],
  collidedBonusIndex: number,
  currentScore: number,
  bonusState: BonusManagerState,
  currentSnakeGrew: boolean,
  highScore: number,
): BonusCollisionResult {
  const collidedBonus = bonusState.activeBonuses[collidedBonusIndex];
  const config = bonusRegistry.get(collidedBonus.configType);
  const newBonusState = { ...bonusState };

  if (!config) {
    return {
      newScore: currentScore,
      snakeGrew: currentSnakeGrew,
      newBonusState,
      isNewHighScore: false,
    };
  }

  const newScore = currentScore + collidedBonus.points;
  const snakeGrew = currentSnakeGrew || config.growsSnake;

  // Handle shrink effect
  if (config.effect.type === 'shrink' && config.effect.value) {
    applyShrinkEffect(newSnake, config.effect.value);
  }

  // Vibration and sound
  triggerVibration(config.vibration.onCollect);
  if (config.sounds.onCollect) {
    playSound(config.sounds.onCollect);
  }

  // Stop dragon ambient if applicable
  if (collidedBonus.configType === 'dragon-egg') {
    stopDragonAmbient();
  }

  // Remove collected bonus and reset spawn counter
  newBonusState.activeBonuses = removeBonusAtIndex(
    bonusState.activeBonuses,
    collidedBonusIndex,
  );
  newBonusState.eggsEatenSince[collidedBonus.configType] = 0;
  newBonusState.nextSpawnAt[collidedBonus.configType] =
    getRandomRespawnThreshold(config);

  return {
    newScore,
    snakeGrew,
    newBonusState,
    isNewHighScore: newScore > highScore,
  };
}

export function GameScreen({
  onExit,
  difficulty = 'medium',
}: Readonly<GameScreenProps>) {
  const [gameState, setGameState] = useState<GameState>(createInitialState);
  const [highScore, setHighScore] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(
    calculateGameSpeed(3, difficulty),
  );
  const [hasPlayedHighScoreSound, setHasPlayedHighScoreSound] = useState(false);
  const directionRef = useRef<Direction>('RIGHT');
  const nextDirectionRef = useRef<Direction>('RIGHT');
  const bonusTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeDragonEggRef = useRef<boolean>(false);

  useEffect(() => {
    getHighScore().then(setHighScore);
  }, []);

  // Keyboard controls for web (Arrow keys and WASD)
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!gameState.isRunning || gameState.isGameOver) return;

      const keyMap: Record<string, Direction> = {
        ArrowUp: 'UP',
        ArrowDown: 'DOWN',
        ArrowLeft: 'LEFT',
        ArrowRight: 'RIGHT',
        w: 'UP',
        W: 'UP',
        s: 'DOWN',
        S: 'DOWN',
        a: 'LEFT',
        A: 'LEFT',
        d: 'RIGHT',
        D: 'RIGHT',
      };

      const newDirection = keyMap[event.key];
      if (newDirection) {
        event.preventDefault();
        handleDirectionChange(newDirection);
      }
    };

    globalThis.addEventListener('keydown', handleKeyDown);
    return () => globalThis.removeEventListener('keydown', handleKeyDown);
  }, [gameState.isRunning, gameState.isGameOver]);

  useEffect(() => {
    if (gameState.isGameOver) {
      stopMusic();
      stopDragonAmbient();
      if (Platform.OS !== 'web') {
        // Long pattern for game over
        Vibration.vibrate([0, 100, 50, 100, 50, 200]);
      }
      playSound('gameOver');
      updateHighScoreIfNeeded(gameState.score).then(newHighScore => {
        if (
          gameState.score > 0 &&
          gameState.score >= newHighScore &&
          !hasPlayedHighScoreSound
        ) {
          if (Platform.OS !== 'web') {
            // Celebration pattern for new high score at end
            Vibration.vibrate([0, 50, 50, 50, 50, 50, 50, 100]);
          }
          playSound('highScore');
        }
        setHighScore(newHighScore);
      });
    }
  }, [gameState.isGameOver, gameState.score, hasPlayedHighScoreSound]);

  useEffect(() => {
    setCurrentSpeed(calculateGameSpeed(gameState.snake.length, difficulty));
  }, [gameState.snake.length, difficulty]);

  // Bonus timer effect - handles all timed bonuses
  useEffect(() => {
    const activeBonuses = gameState.bonusState.activeBonuses;
    const hasDragonEgg = activeBonuses.some(b => b.configType === 'dragon-egg');

    // Handle dragon egg ambient sound
    if (hasDragonEgg && gameState.isRunning && !activeDragonEggRef.current) {
      activeDragonEggRef.current = true;
      playDragonAmbient();
    } else if (!hasDragonEgg && activeDragonEggRef.current) {
      activeDragonEggRef.current = false;
      stopDragonAmbient();
    }

    if (activeBonuses.length > 0 && gameState.isRunning) {
      bonusTimerRef.current = setInterval(() => {
        setGameState(prev => {
          const { updated, expired } = processExpiredBonuses(
            prev.bonusState.activeBonuses,
          );
          const { newEggsEatenSince, newNextSpawnAt } =
            resetExpiredBonusCounters(
              expired,
              prev.bonusState.eggsEatenSince,
              prev.bonusState.nextSpawnAt,
            );

          return {
            ...prev,
            bonusState: {
              ...prev.bonusState,
              activeBonuses: updated,
              eggsEatenSince: newEggsEatenSince,
              nextSpawnAt: newNextSpawnAt,
            },
          };
        });
      }, 100);

      return () => {
        if (bonusTimerRef.current) {
          clearInterval(bonusTimerRef.current);
        }
      };
    } else if (!gameState.isRunning) {
      stopDragonAmbient();
      activeDragonEggRef.current = false;
    }
  }, [gameState.bonusState.activeBonuses.length, gameState.isRunning]);

  useEffect(() => {
    if (!gameState.isRunning || gameState.isGameOver) return;

    const interval = setInterval(() => {
      setGameState(prev => {
        if (!prev.isRunning || prev.isGameOver) return prev;

        const direction = nextDirectionRef.current;
        directionRef.current = direction;
        const dir = DIRECTIONS[direction];
        const head = prev.snake[0];
        const newHead: Position = { x: head.x + dir.x, y: head.y + dir.y };

        // Check for collision (walls and self)
        if (checkCollision(newHead, prev.snake)) {
          return { ...prev, isGameOver: true, isRunning: false };
        }

        const newSnake = [newHead, ...prev.snake];
        let newFood = prev.food;
        let newScore = prev.score;
        let newBonusState = { ...prev.bonusState };
        let snakeGrew = false;

        // Check regular food collision
        const ateFoodThisTick =
          newHead.x === prev.food.x && newHead.y === prev.food.y;
        if (ateFoodThisTick) {
          const foodResult = handleFoodCollision(
            newSnake,
            prev.food,
            newScore,
            newBonusState,
            highScore,
          );
          newFood = foodResult.newFood;
          newScore = foodResult.newScore;
          snakeGrew = foodResult.snakeGrew;
          newBonusState = foodResult.newBonusState;

          if (foodResult.isNewHighScore && !hasPlayedHighScoreSound) {
            triggerVibration([0, 50, 50, 50, 50, 100]);
            playSound('highScore');
            setHasPlayedHighScoreSound(true);
          }
        }

        // Check bonus collisions
        const collidedBonusIndex = findCollidedBonus(
          newBonusState.activeBonuses,
          newHead,
        );

        if (collidedBonusIndex !== -1) {
          const bonusResult = handleBonusCollision(
            newSnake,
            collidedBonusIndex,
            newScore,
            newBonusState,
            snakeGrew,
            highScore,
          );
          newScore = bonusResult.newScore;
          snakeGrew = bonusResult.snakeGrew;
          newBonusState = bonusResult.newBonusState;

          if (bonusResult.isNewHighScore && !hasPlayedHighScoreSound) {
            triggerVibration([0, 50, 50, 50, 50, 100]);
            playSound('highScore');
            setHasPlayedHighScoreSound(true);
          }
        }

        // Remove tail if snake didn't grow
        if (!snakeGrew) {
          newSnake.pop();
        }

        return {
          ...prev,
          snake: newSnake,
          food: newFood,
          bonusState: newBonusState,
          score: newScore,
          direction,
        };
      });
    }, currentSpeed);

    return () => clearInterval(interval);
  }, [
    gameState.isRunning,
    gameState.isGameOver,
    currentSpeed,
    highScore,
    hasPlayedHighScoreSound,
  ]);

  const startGame = useCallback(() => {
    const newState = createInitialState();
    newState.isRunning = true;
    directionRef.current = 'RIGHT';
    nextDirectionRef.current = 'RIGHT';
    setGameState(newState);
    setCurrentSpeed(calculateGameSpeed(3, difficulty));
    setHasPlayedHighScoreSound(false);
    playSound('gameStart');
    playMusic();
  }, [difficulty]);

  const handleDirectionChange = useCallback((newDirection: Direction) => {
    const currentDir = DIRECTIONS[directionRef.current];
    const newDir = DIRECTIONS[newDirection];
    if (currentDir.x + newDir.x !== 0 || currentDir.y + newDir.y !== 0) {
      nextDirectionRef.current = newDirection;
    }
  }, []);

  const handleExit = useCallback(() => {
    stopMusic();
    onExit();
  }, [onExit]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const { dx, dy } = gestureState;
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);
        if (absX < 15 && absY < 15) return;

        let newDirection: Direction;
        if (absX > absY) {
          newDirection = dx > 0 ? 'RIGHT' : 'LEFT';
        } else {
          newDirection = dy > 0 ? 'DOWN' : 'UP';
        }

        handleDirectionChange(newDirection);
      },
    }),
  ).current;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      <View style={styles.header}>
        <View style={styles.scoresRow}>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreLabel}>SCORE</Text>
            <Text style={styles.scoreValue}>{gameState.score}</Text>
          </View>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreLabel}>BEST</Text>
            <Text style={styles.highScoreValue}>{highScore}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.exitButton}
          onPress={handleExit}
          activeOpacity={0.7}
        >
          <Text style={styles.exitButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.gameContainer} {...panResponder.panHandlers}>
        <View style={styles.board}>
          <Snake segments={gameState.snake} />
          <NormalEggRenderer position={gameState.food} />
          {gameState.bonusState.activeBonuses.map(bonus => (
            <BonusRenderer key={bonus.id} bonus={bonus} />
          ))}
        </View>

        {!gameState.isRunning && !gameState.isGameOver && (
          <View style={styles.overlay}>
            <Text style={styles.title}>SNAKE</Text>
            <Text style={styles.subtitle}>Swipe or use D-Pad to control</Text>
            <TouchableOpacity style={styles.button} onPress={startGame}>
              <Text style={styles.buttonText}>TAP TO PLAY</Text>
            </TouchableOpacity>
          </View>
        )}

        {gameState.isGameOver && (
          <View style={styles.overlay}>
            <Text style={styles.gameOverText}>GAME OVER</Text>
            <Text style={styles.finalScore}>Score: {gameState.score}</Text>
            {gameState.score >= highScore && gameState.score > 0 && (
              <Text style={styles.newHighScore}>NEW HIGH SCORE!</Text>
            )}
            <TouchableOpacity style={styles.button} onPress={startGame}>
              <Text style={styles.buttonText}>PLAY AGAIN</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.controlsContainer}>
        <DPadControls
          onDirectionPress={handleDirectionChange}
          disabled={!gameState.isRunning || gameState.isGameOver}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: COLORS.scorePanel,
    gap: 10,
  },
  exitButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.grid,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gridLine,
  },
  exitButtonText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: 'bold',
  },
  scoresRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreBox: {
    alignItems: 'center',
    minWidth: 60,
  },
  scoreLabel: {
    fontSize: 9,
    color: COLORS.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  scoreValue: {
    fontSize: 22,
    color: COLORS.snakeHead,
    fontWeight: 'bold',
  },
  highScoreValue: {
    fontSize: 22,
    color: COLORS.egg,
    fontWeight: 'bold',
  },
  gridInfo: {
    backgroundColor: COLORS.grid,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  gridText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  gameContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  board: {
    width: BOARD_WIDTH,
    height: BOARD_HEIGHT,
    backgroundColor: COLORS.grid,
    borderWidth: 2,
    borderColor: COLORS.gridLine,
    borderRadius: 4,
    overflow: 'hidden',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.gameOver,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 48,
    color: COLORS.snakeHead,
    fontWeight: 'bold',
    letterSpacing: 8,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 40,
    textAlign: 'center',
  },
  gameOverText: {
    fontSize: 36,
    color: COLORS.egg,
    fontWeight: 'bold',
    letterSpacing: 4,
    marginBottom: 20,
  },
  finalScore: {
    fontSize: 24,
    color: COLORS.text,
    marginBottom: 10,
  },
  newHighScore: {
    fontSize: 18,
    color: COLORS.snakeHead,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  button: {
    backgroundColor: COLORS.button,
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 30,
    shadowColor: COLORS.snakeHead,
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  buttonText: {
    fontSize: 18,
    color: COLORS.buttonText,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  controlsContainer: {
    paddingBottom: 30,
    paddingTop: 10,
    backgroundColor: COLORS.scorePanel,
  },
});
