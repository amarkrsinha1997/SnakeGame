import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { CELL_SIZE, COLORS, Position } from '../constants';

interface FoodProps {
  position: Position;
}

export function Food({ position }: FoodProps) {
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
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  return (
    <View
      style={[
        styles.container,
        {
          left: position.x * CELL_SIZE,
          top: position.y * CELL_SIZE,
        },
      ]}
    >
      <View style={styles.glow} />
      <Animated.View
        style={[
          styles.egg,
          {
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: CELL_SIZE,
    height: CELL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
    width: CELL_SIZE * 2,
    height: CELL_SIZE * 2,
    borderRadius: CELL_SIZE,
    backgroundColor: COLORS.eggGlow,
  },
  egg: {
    width: CELL_SIZE - 2,
    height: CELL_SIZE - 2,
    borderRadius: CELL_SIZE / 2,
    backgroundColor: COLORS.egg,
    shadowColor: COLORS.egg,
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 6,
  },
});

