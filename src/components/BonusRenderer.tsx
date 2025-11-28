/**
 * BonusRenderer - Generic renderer for all bonus types
 *
 * This component renders any bonus based on its configuration,
 * supporting different visual styles, animations, and timer displays.
 *
 * Renderers:
 * - NormalEggRenderer: Regular food egg (orange, pulsing)
 * - DragonEggRenderer: Special dragon egg (gold, rotating, particles)
 * - ShrinkEggRenderer: Shrink bonus (cyan/teal, shrinking animation)
 * - DefaultBonusRenderer: Generic fallback for other bonus types
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { CELL_SIZE, COLORS, Position } from '../constants';
import { ActiveBonus, bonusRegistry, BonusConfig } from '../types/bonus';

interface BonusRendererProps {
  bonus: ActiveBonus;
}

// ============================================================================
// Props for Food rendered via bonus system
// ============================================================================

interface FoodBonusRendererProps {
  position: Position;
}

/**
 * NormalEggRenderer - Renders regular food as part of the bonus system
 * This replaces the standalone Food component
 */
export function NormalEggRenderer({
  position,
}: Readonly<FoodBonusRendererProps>) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  return (
    <View
      style={[
        styles.normalEggContainer,
        {
          left: position.x * CELL_SIZE,
          top: position.y * CELL_SIZE,
        },
      ]}
    >
      <View style={styles.normalEggGlow} />
      <Animated.View
        style={[
          styles.normalEgg,
          {
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />
    </View>
  );
}

export function BonusRenderer({ bonus }: Readonly<BonusRendererProps>) {
  const config = bonusRegistry.get(bonus.configType);

  if (!config) {
    console.warn(`Unknown bonus type: ${bonus.configType}`);
    return null;
  }

  // Delegate to specialized renderers based on bonus type
  if (config.type === 'dragon-egg') {
    return <DragonEggRenderer bonus={bonus} config={config} />;
  }

  if (config.type === 'shrink-egg') {
    return <ShrinkEggRenderer bonus={bonus} config={config} />;
  }

  // Default renderer for other bonus types
  return <DefaultBonusRenderer bonus={bonus} config={config} />;
}

// ============================================================================
// Default Bonus Renderer (for Golden Apple, Crystal Gem, etc.)
// ============================================================================

interface RendererProps {
  bonus: ActiveBonus;
  config: BonusConfig;
}

function DefaultBonusRenderer({ bonus, config }: Readonly<RendererProps>) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    );

    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.6,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    );

    pulse.start();
    glow.start();

    return () => {
      pulse.stop();
      glow.stop();
    };
  }, [pulseAnim, glowAnim]);

  const size = CELL_SIZE * config.sizeMultiplier;
  const offset = (size - CELL_SIZE) / 2;
  const progress =
    config.lifetime > 0 ? bonus.timeRemaining / config.lifetime : 1;
  const timerWidth = Math.max(0, progress * size * 1.5);

  return (
    <View
      style={[
        styles.container,
        {
          left: bonus.position.x * CELL_SIZE - offset,
          top: bonus.position.y * CELL_SIZE - offset,
          width: size,
          height: size,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.glow,
          {
            width: size * 2,
            height: size * 2,
            borderRadius: size,
            backgroundColor: config.colors.glow,
            opacity: glowAnim,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.bonus,
          {
            width: size * 0.8,
            height: size * 0.8,
            borderRadius: (size * 0.8) / 2,
            backgroundColor: config.colors.primary,
            borderColor: config.colors.secondary,
            shadowColor: config.colors.primary,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        {config.icon ? <Text style={styles.icon}>{config.icon}</Text> : null}
      </Animated.View>

      {config.showTimer && config.lifetime > 0 && (
        <View style={[styles.timerContainer, { width: size * 1.5 }]}>
          <View style={[styles.timerBg, { width: size * 1.5 }]}>
            <View
              style={[
                styles.timerBar,
                { width: timerWidth, backgroundColor: config.timerColor },
              ]}
            />
          </View>
        </View>
      )}
    </View>
  );
}

// ============================================================================
// Dragon Egg Renderer (Special animated version)
// ============================================================================

function DragonEggRenderer({ bonus, config }: Readonly<RendererProps>) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.6)).current;
  const [particles] = useState(() =>
    Array.from({ length: 6 }, (_, i) => ({
      id: i,
      angle: i * 60 * (Math.PI / 180),
      anim: new Animated.Value(0),
    })),
  );

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    );

    const rotate = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      }),
    );

    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.6,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    );

    const particleAnims = particles.map(p =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(p.anim, {
            toValue: 1,
            duration: 1000 + Math.random() * 500,
            useNativeDriver: true,
          }),
          Animated.timing(p.anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ),
    );

    pulse.start();
    rotate.start();
    glow.start();
    particleAnims.forEach(a => a.start());

    return () => {
      pulse.stop();
      rotate.stop();
      glow.stop();
      particleAnims.forEach(a => a.stop());
    };
  }, [pulseAnim, rotateAnim, glowAnim, particles]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progress = bonus.timeRemaining / config.lifetime;
  const timerWidth = Math.max(0, progress * (CELL_SIZE * 2.5));

  return (
    <View
      style={[
        styles.dragonContainer,
        {
          left: bonus.position.x * CELL_SIZE - CELL_SIZE * 0.75,
          top: bonus.position.y * CELL_SIZE - CELL_SIZE * 0.75,
        },
      ]}
    >
      {particles.map(particle => {
        const translateX = particle.anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, Math.cos(particle.angle) * 15],
        });
        const translateY = particle.anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, Math.sin(particle.angle) * 15],
        });
        const opacity = particle.anim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, 1, 0],
        });

        return (
          <Animated.View
            key={particle.id}
            style={[
              styles.particle,
              {
                backgroundColor: config.colors.primary,
                transform: [{ translateX }, { translateY }],
                opacity,
              },
            ]}
          />
        );
      })}

      <Animated.View
        style={[
          styles.outerGlow,
          { backgroundColor: config.colors.glow, opacity: glowAnim },
        ]}
      />

      <Animated.View
        style={[
          styles.dragonEgg,
          {
            backgroundColor: config.colors.primary,
            borderColor: config.colors.secondary,
            shadowColor: config.colors.primary,
            transform: [{ scale: pulseAnim }, { rotate: rotation }],
          },
        ]}
      >
        <View
          style={[
            styles.innerEgg,
            { backgroundColor: config.colors.secondary },
          ]}
        />
        <Text style={styles.dragonIcon}>{config.icon}</Text>
      </Animated.View>

      {config.showTimer && (
        <View style={styles.dragonTimerContainer}>
          <View style={styles.dragonTimerBg}>
            <View
              style={[
                styles.dragonTimerBar,
                { width: timerWidth, backgroundColor: config.timerColor },
              ]}
            />
          </View>
        </View>
      )}
    </View>
  );
}

// ============================================================================
// Shrink Egg Renderer (Cyan/teal with shrinking animation)
// ============================================================================

function ShrinkEggRenderer({ bonus, config }: Readonly<RendererProps>) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shrinkAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.6)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.9,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    );

    // Shrinking effect animation (mimics the shrink effect)
    const shrink = Animated.loop(
      Animated.sequence([
        Animated.timing(shrinkAnim, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(shrinkAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );

    // Glow animation
    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.4,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    );

    // Slow reverse rotation
    const rotate = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: -1,
        duration: 4000,
        useNativeDriver: true,
      }),
    );

    pulse.start();
    shrink.start();
    glow.start();
    rotate.start();

    return () => {
      pulse.stop();
      shrink.stop();
      glow.stop();
      rotate.stop();
    };
  }, [pulseAnim, shrinkAnim, glowAnim, rotateAnim]);

  const rotation = rotateAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-360deg', '0deg', '360deg'],
  });

  const progress = bonus.timeRemaining / config.lifetime;
  const timerWidth = Math.max(0, progress * (CELL_SIZE * 2.5));

  return (
    <View
      style={[
        styles.shrinkContainer,
        {
          left: bonus.position.x * CELL_SIZE - CELL_SIZE * 0.7,
          top: bonus.position.y * CELL_SIZE - CELL_SIZE * 0.7,
        },
      ]}
    >
      {/* Outer glow */}
      <Animated.View
        style={[
          styles.shrinkOuterGlow,
          { backgroundColor: config.colors.glow, opacity: glowAnim },
        ]}
      />

      {/* Inner rings (shrink visual) */}
      <Animated.View
        style={[
          styles.shrinkRing,
          {
            borderColor: config.colors.primary,
            transform: [{ scale: shrinkAnim }],
            opacity: glowAnim,
          },
        ]}
      />

      {/* Main egg */}
      <Animated.View
        style={[
          styles.shrinkEgg,
          {
            backgroundColor: config.colors.primary,
            borderColor: config.colors.secondary,
            shadowColor: config.colors.primary,
            transform: [{ scale: pulseAnim }, { rotate: rotation }],
          },
        ]}
      >
        <View
          style={[
            styles.shrinkInnerEgg,
            { backgroundColor: config.colors.secondary },
          ]}
        />
        <Text style={styles.shrinkIcon}>{config.icon}</Text>
      </Animated.View>

      {/* Timer bar */}
      {config.showTimer && (
        <View style={styles.shrinkTimerContainer}>
          <View style={styles.shrinkTimerBg}>
            <View
              style={[
                styles.shrinkTimerBar,
                { width: timerWidth, backgroundColor: config.timerColor },
              ]}
            />
          </View>
        </View>
      )}
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  // Normal egg styles (replaces Food component)
  normalEggContainer: {
    position: 'absolute',
    width: CELL_SIZE,
    height: CELL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  normalEggGlow: {
    position: 'absolute',
    width: CELL_SIZE * 2,
    height: CELL_SIZE * 2,
    borderRadius: CELL_SIZE,
    backgroundColor: COLORS.eggGlow,
  },
  normalEgg: {
    width: CELL_SIZE - 2,
    height: CELL_SIZE - 2,
    borderRadius: CELL_SIZE / 2,
    backgroundColor: COLORS.egg,
    shadowColor: COLORS.egg,
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 6,
  },

  // Default bonus styles
  container: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
  },
  bonus: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  icon: {
    fontSize: 10,
  },
  timerContainer: {
    position: 'absolute',
    bottom: -8,
    alignItems: 'center',
  },
  timerBg: {
    height: 3,
    backgroundColor: COLORS.timerBarBg,
    borderRadius: 2,
    overflow: 'hidden',
  },
  timerBar: {
    height: 3,
    borderRadius: 2,
  },

  // Dragon egg styles
  dragonContainer: {
    position: 'absolute',
    width: CELL_SIZE * 2.5,
    height: CELL_SIZE * 2.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outerGlow: {
    position: 'absolute',
    width: CELL_SIZE * 3,
    height: CELL_SIZE * 3,
    borderRadius: CELL_SIZE * 1.5,
  },
  dragonEgg: {
    width: CELL_SIZE * 1.5,
    height: CELL_SIZE * 1.5,
    borderRadius: CELL_SIZE * 0.75,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 2,
  },
  innerEgg: {
    position: 'absolute',
    width: CELL_SIZE * 0.8,
    height: CELL_SIZE * 0.8,
    borderRadius: CELL_SIZE * 0.4,
  },
  dragonIcon: {
    fontSize: 12,
    position: 'absolute',
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  dragonTimerContainer: {
    position: 'absolute',
    bottom: -8,
    width: CELL_SIZE * 2.5,
    alignItems: 'center',
  },
  dragonTimerBg: {
    width: CELL_SIZE * 2.5,
    height: 4,
    backgroundColor: COLORS.timerBarBg,
    borderRadius: 2,
    overflow: 'hidden',
  },
  dragonTimerBar: {
    height: 4,
    borderRadius: 2,
  },

  // Shrink egg styles
  shrinkContainer: {
    position: 'absolute',
    width: CELL_SIZE * 2.4,
    height: CELL_SIZE * 2.4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shrinkOuterGlow: {
    position: 'absolute',
    width: CELL_SIZE * 2.8,
    height: CELL_SIZE * 2.8,
    borderRadius: CELL_SIZE * 1.4,
  },
  shrinkRing: {
    position: 'absolute',
    width: CELL_SIZE * 2.2,
    height: CELL_SIZE * 2.2,
    borderRadius: CELL_SIZE * 1.1,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  shrinkEgg: {
    width: CELL_SIZE * 1.4,
    height: CELL_SIZE * 1.4,
    borderRadius: CELL_SIZE * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 2,
  },
  shrinkInnerEgg: {
    position: 'absolute',
    width: CELL_SIZE * 0.7,
    height: CELL_SIZE * 0.7,
    borderRadius: CELL_SIZE * 0.35,
  },
  shrinkIcon: {
    fontSize: 11,
    position: 'absolute',
  },
  shrinkTimerContainer: {
    position: 'absolute',
    bottom: -8,
    width: CELL_SIZE * 2.4,
    alignItems: 'center',
  },
  shrinkTimerBg: {
    width: CELL_SIZE * 2.4,
    height: 4,
    backgroundColor: COLORS.timerBarBg,
    borderRadius: 2,
    overflow: 'hidden',
  },
  shrinkTimerBar: {
    height: 4,
    borderRadius: 2,
  },
});
