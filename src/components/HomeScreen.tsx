import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Animated } from 'react-native';
import { COLORS } from '../constants';
import { getHighScore, getSoundEnabled, setSoundEnabled, getMusicEnabled, setMusicEnabled } from '../utils/storage';
import { setSoundMuted, setMusicMuted } from '../utils/soundManager';

interface HomeScreenProps {
  onStartGame: () => void;
}

export function HomeScreen({ onStartGame }: HomeScreenProps) {
  const [highScore, setHighScore] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const [musicOn, setMusicOn] = useState(true);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    getHighScore().then(setHighScore);
    getSoundEnabled().then((enabled) => {
      setSoundOn(enabled);
      setSoundMuted(!enabled);
    });
    getMusicEnabled().then((enabled) => {
      setMusicOn(enabled);
      setMusicMuted(!enabled);
    });

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, [pulseAnim]);

  const toggleSound = () => {
    const newValue = !soundOn;
    setSoundOn(newValue);
    setSoundEnabled(newValue);
    setSoundMuted(!newValue);
  };

  const toggleMusic = () => {
    const newValue = !musicOn;
    setMusicOn(newValue);
    setMusicEnabled(newValue);
    setMusicMuted(!newValue);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      
      <View style={styles.content}>
        <Animated.Text style={[styles.title, { transform: [{ scale: pulseAnim }] }]}>
          🐍 SNAKE
        </Animated.Text>
        
        <Text style={styles.subtitle}>Classic Game</Text>

        <View style={styles.highScoreContainer}>
          <Text style={styles.highScoreLabel}>BEST SCORE</Text>
          <Text style={styles.highScoreValue}>{highScore}</Text>
        </View>

        <TouchableOpacity style={styles.playButton} onPress={onStartGame} activeOpacity={0.8}>
          <Text style={styles.playButtonText}>▶ PLAY</Text>
        </TouchableOpacity>

        <View style={styles.instructions}>
          <Text style={styles.instructionTitle}>HOW TO PLAY</Text>
          <Text style={styles.instructionText}>• Swipe or use D-Pad to move</Text>
          <Text style={styles.instructionText}>• Eat eggs to grow (+1 point)</Text>
          <Text style={styles.instructionText}>• Catch dragon eggs for bonus!</Text>
          <Text style={styles.instructionText}>• Avoid walls and yourself</Text>
        </View>

        <View style={styles.audioControls}>
          <TouchableOpacity
            style={[styles.audioButton, !soundOn && styles.audioButtonOff]}
            onPress={toggleSound}
            activeOpacity={0.7}
          >
            <Text style={styles.audioIcon}>{soundOn ? '🔊' : '🔇'}</Text>
            <Text style={[styles.audioLabel, !soundOn && styles.audioLabelOff]}>Sound</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.audioButton, !musicOn && styles.audioButtonOff]}
            onPress={toggleMusic}
            activeOpacity={0.7}
          >
            <Text style={styles.audioIcon}>{musicOn ? '🎵' : '🎵'}</Text>
            <Text style={[styles.audioLabel, !musicOn && styles.audioLabelOff]}>Music</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.footer}>Made with React Native</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 52,
    color: COLORS.snakeHead,
    fontWeight: 'bold',
    letterSpacing: 4,
    textShadowColor: COLORS.snakeGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 8,
    letterSpacing: 3,
  },
  highScoreContainer: {
    marginTop: 40,
    alignItems: 'center',
    backgroundColor: COLORS.scorePanel,
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.gridLine,
  },
  highScoreLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    letterSpacing: 2,
  },
  highScoreValue: {
    fontSize: 32,
    color: COLORS.dragonEgg,
    fontWeight: 'bold',
    marginTop: 5,
  },
  playButton: {
    marginTop: 45,
    backgroundColor: COLORS.snakeHead,
    paddingVertical: 16,
    paddingHorizontal: 55,
    borderRadius: 35,
    shadowColor: COLORS.snakeHead,
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 10,
  },
  playButtonText: {
    fontSize: 22,
    color: COLORS.buttonText,
    fontWeight: 'bold',
    letterSpacing: 3,
  },
  instructions: {
    marginTop: 45,
    alignItems: 'center',
  },
  instructionTitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
    letterSpacing: 2,
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 13,
    color: COLORS.text,
    opacity: 0.7,
    marginBottom: 6,
  },
  audioControls: {
    flexDirection: 'row',
    marginTop: 30,
    gap: 20,
  },
  audioButton: {
    alignItems: 'center',
    backgroundColor: COLORS.scorePanel,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gridLine,
    minWidth: 80,
  },
  audioButtonOff: {
    opacity: 0.5,
    borderColor: COLORS.textSecondary,
  },
  audioIcon: {
    fontSize: 24,
  },
  audioLabel: {
    fontSize: 11,
    color: COLORS.text,
    marginTop: 4,
    letterSpacing: 1,
  },
  audioLabelOff: {
    color: COLORS.textSecondary,
  },
  footer: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: 11,
    paddingBottom: 30,
    opacity: 0.4,
  },
});
