import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SnakeLogoProps {
  size?: number;
}

export function SnakeLogo({ size = 200 }: SnakeLogoProps) {
  const scale = size / 200;
  
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View style={[styles.background, { borderRadius: size * 0.2 }]}>
        <Text style={[styles.emoji, { fontSize: 80 * scale }]}>🐍</Text>
        <Text style={[styles.text, { fontSize: 24 * scale }]}>SNAKE</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  background: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0a0a0f',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#00ff88',
  },
  emoji: {
    marginBottom: 5,
  },
  text: {
    color: '#00ff88',
    fontWeight: 'bold',
    letterSpacing: 2,
  },
});

