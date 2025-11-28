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
  REGULAR_EGG_POINTS,
  DRAGON_EGG_LIFETIME,
  calculateGameSpeed,
  getRandomDragonEggSpawn,
  getRandomDragonEggRespawn,
  getRandomDragonEggPoints,
} from '../constants';
import { getHighScore, updateHighScoreIfNeeded } from '../utils/storage';
import {
  playSound,
  playMusic,
  stopMusic,
  playDragonAmbient,
  stopDragonAmbient,
} from '../utils/soundManager';
import { Snake } from './Snake';
import { Food } from './Food';
import { DragonEgg } from './DragonEgg';
import { DPadControls } from './DPadControls';

interface GameScreenProps {
  onExit: () => void;
  difficulty?: GameDifficulty;
}

interface GameState {
  snake: Position[];
  food: Position;
  dragonEgg: Position | null;
  dragonEggTimeRemaining: number;
  eggsEatenSinceLastDragon: number;
  nextDragonEggAt: number;
  direction: Direction;
  nextDirection: Direction;
  score: number;
  isRunning: boolean;
  isGameOver: boolean;
}

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
    dragonEgg: null,
    dragonEggTimeRemaining: 0,
    eggsEatenSinceLastDragon: 0,
    nextDragonEggAt: getRandomDragonEggSpawn(),
    direction: 'RIGHT',
    nextDirection: 'RIGHT',
    score: 0,
    isRunning: false,
    isGameOver: false,
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
  const dragonEggTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  useEffect(() => {
    if (gameState.dragonEgg && gameState.isRunning) {
      // Play dragon spawn sound once and start ambient loop
      playDragonAmbient();

      dragonEggTimerRef.current = setInterval(() => {
        setGameState(prev => {
          if (!prev.dragonEgg) return prev;
          const newTime = prev.dragonEggTimeRemaining - 100;
          if (newTime <= 0) {
            playSound('dragonDespawn');
            stopDragonAmbient();
            return {
              ...prev,
              dragonEgg: null,
              dragonEggTimeRemaining: 0,
              nextDragonEggAt: getRandomDragonEggRespawn(),
              eggsEatenSinceLastDragon: 0,
            };
          }
          return { ...prev, dragonEggTimeRemaining: newTime };
        });
      }, 100);

      return () => {
        if (dragonEggTimerRef.current) {
          clearInterval(dragonEggTimerRef.current);
        }
        stopDragonAmbient();
      };
    } else {
      stopDragonAmbient();
    }
  }, [gameState.dragonEgg, gameState.isRunning]);

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

        if (
          newHead.x < 0 ||
          newHead.x >= GRID_WIDTH ||
          newHead.y < 0 ||
          newHead.y >= GRID_HEIGHT ||
          prev.snake.some(
            (seg, i) => i > 0 && seg.x === newHead.x && seg.y === newHead.y,
          )
        ) {
          return { ...prev, isGameOver: true, isRunning: false };
        }

        const newSnake = [newHead, ...prev.snake];
        let newFood = prev.food;
        let newScore = prev.score;
        let newDragonEgg = prev.dragonEgg;
        let newDragonEggTime = prev.dragonEggTimeRemaining;
        let eggsEaten = prev.eggsEatenSinceLastDragon;
        let nextDragonAt = prev.nextDragonEggAt;

        if (newHead.x === prev.food.x && newHead.y === prev.food.y) {
          newScore += REGULAR_EGG_POINTS;
          const allPositions = [...newSnake];
          if (newDragonEgg) allPositions.push(newDragonEgg);
          newFood = getRandomPosition(allPositions);
          eggsEaten += 1;

          // Short vibration for eating
          if (Platform.OS !== 'web') {
            Vibration.vibrate(50);
          }
          playSound('eat');

          // Check if new high score achieved during gameplay
          if (newScore > highScore && !hasPlayedHighScoreSound) {
            if (Platform.OS !== 'web') {
              // Celebration vibration for high score
              Vibration.vibrate([0, 50, 50, 50, 50, 100]);
            }
            playSound('highScore');
            setHasPlayedHighScoreSound(true);
          }

          if (!newDragonEgg && eggsEaten >= nextDragonAt) {
            const excludePositions = [...newSnake, newFood];
            newDragonEgg = getRandomPosition(excludePositions);
            newDragonEggTime = DRAGON_EGG_LIFETIME;
            playSound('dragonSpawn');
          }
        } else if (
          prev.dragonEgg &&
          newHead.x === prev.dragonEgg.x &&
          newHead.y === prev.dragonEgg.y
        ) {
          const dragonPoints = getRandomDragonEggPoints();
          newScore += dragonPoints;
          newDragonEgg = null;
          newDragonEggTime = 0;
          eggsEaten = 0;
          nextDragonAt = getRandomDragonEggRespawn();

          // Medium vibration for dragon egg
          if (Platform.OS !== 'web') {
            Vibration.vibrate([0, 100, 50, 100]);
          }
          playSound('dragonEat');

          // Check if new high score achieved during gameplay
          if (newScore > highScore && !hasPlayedHighScoreSound) {
            if (Platform.OS !== 'web') {
              // Celebration vibration for high score
              Vibration.vibrate([0, 50, 50, 50, 50, 100]);
            }
            playSound('highScore');
            setHasPlayedHighScoreSound(true);
          }
        } else {
          newSnake.pop();
        }

        return {
          ...prev,
          snake: newSnake,
          food: newFood,
          dragonEgg: newDragonEgg,
          dragonEggTimeRemaining: newDragonEggTime,
          eggsEatenSinceLastDragon: eggsEaten,
          nextDragonEggAt: nextDragonAt,
          score: newScore,
          direction,
        };
      });
    }, currentSpeed);

    return () => clearInterval(interval);
  }, [gameState.isRunning, gameState.isGameOver, currentSpeed]);

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
          <Food position={gameState.food} />
          {gameState.dragonEgg && (
            <DragonEgg
              position={gameState.dragonEgg}
              timeRemaining={gameState.dragonEggTimeRemaining}
            />
          )}
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
    ...StyleSheet.absoluteFillObject,
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
