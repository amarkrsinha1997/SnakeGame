import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Text } from 'react-native';
import { CELL_SIZE, COLORS, Position, DRAGON_EGG_LIFETIME } from '../constants';

interface DragonEggProps {
  position: Position;
  timeRemaining: number;
}

export function DragonEgg({ position, timeRemaining }: DragonEggProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.6)).current;
  const [particles] = useState(() => 
    Array.from({ length: 6 }, (_, i) => ({
      id: i,
      angle: (i * 60) * (Math.PI / 180),
      anim: new Animated.Value(0),
    }))
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
      ])
    );

    const rotate = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
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
      ])
    );

    const particleAnims = particles.map((p) =>
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
        ])
      )
    );

    pulse.start();
    rotate.start();
    glow.start();
    particleAnims.forEach((a) => a.start());

    return () => {
      pulse.stop();
      rotate.stop();
      glow.stop();
      particleAnims.forEach((a) => a.stop());
    };
  }, [pulseAnim, rotateAnim, glowAnim, particles]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progress = timeRemaining / DRAGON_EGG_LIFETIME;
  const timerWidth = Math.max(0, progress * (CELL_SIZE * 2.5));

  return (
    <View
      style={[
        styles.container,
        {
          left: position.x * CELL_SIZE - CELL_SIZE * 0.75,
          top: position.y * CELL_SIZE - CELL_SIZE * 0.75,
        },
      ]}
    >
      {particles.map((particle) => {
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
                transform: [{ translateX }, { translateY }],
                opacity,
              },
            ]}
          />
        );
      })}

      <Animated.View style={[styles.outerGlow, { opacity: glowAnim }]} />

      <Animated.View
        style={[
          styles.egg,
          {
            transform: [{ scale: pulseAnim }, { rotate: rotation }],
          },
        ]}
      >
        <View style={styles.innerEgg} />
        <Text style={styles.dragonIcon}>🔥</Text>
      </Animated.View>

      <View style={styles.timerContainer}>
        <View style={styles.timerBg}>
          <View style={[styles.timerBar, { width: timerWidth }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
    backgroundColor: COLORS.dragonEggGlow,
  },
  egg: {
    width: CELL_SIZE * 1.5,
    height: CELL_SIZE * 1.5,
    borderRadius: CELL_SIZE * 0.75,
    backgroundColor: COLORS.dragonEgg,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.dragonEgg,
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 2,
    borderColor: COLORS.dragonEggInner,
  },
  innerEgg: {
    position: 'absolute',
    width: CELL_SIZE * 0.8,
    height: CELL_SIZE * 0.8,
    borderRadius: CELL_SIZE * 0.4,
    backgroundColor: COLORS.dragonEggInner,
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
    backgroundColor: COLORS.dragonEgg,
  },
  timerContainer: {
    position: 'absolute',
    bottom: -8,
    width: CELL_SIZE * 2.5,
    alignItems: 'center',
  },
  timerBg: {
    width: CELL_SIZE * 2.5,
    height: 4,
    backgroundColor: COLORS.timerBarBg,
    borderRadius: 2,
    overflow: 'hidden',
  },
  timerBar: {
    height: 4,
    backgroundColor: COLORS.timerBar,
    borderRadius: 2,
  },
});

