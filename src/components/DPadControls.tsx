import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { COLORS, Direction } from '../constants';

interface DPadControlsProps {
  onDirectionPress: (direction: Direction) => void;
  disabled?: boolean;
}

export function DPadControls({ onDirectionPress, disabled }: DPadControlsProps) {
  const [activeButton, setActiveButton] = useState<Direction | null>(null);

  const handlePressIn = (direction: Direction) => {
    if (disabled) return;
    setActiveButton(direction);
    onDirectionPress(direction);
  };

  const handlePressOut = () => {
    setActiveButton(null);
  };

  const renderButton = (direction: Direction, arrow: string) => {
    const isActive = activeButton === direction;
    return (
      <TouchableOpacity
        style={[
          styles.button,
          isActive && styles.buttonActive,
          disabled && styles.buttonDisabled,
        ]}
        onPressIn={() => handlePressIn(direction)}
        onPressOut={handlePressOut}
        activeOpacity={0.7}
        disabled={disabled}
      >
        <Text style={[styles.arrow, isActive && styles.arrowActive]}>
          {arrow}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {renderButton('UP', '▲')}
      </View>
      <View style={styles.middleRow}>
        {renderButton('LEFT', '◀')}
        <View style={styles.centerSpace} />
        {renderButton('RIGHT', '▶')}
      </View>
      <View style={styles.row}>
        {renderButton('DOWN', '▼')}
      </View>
    </View>
  )
}

const BUTTON_SIZE = 70;
const BUTTON_GAP = 5;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  row: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  middleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerSpace: {
    width: BUTTON_SIZE + BUTTON_GAP * 2,
    height: BUTTON_SIZE,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: COLORS.dpadButton,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.gridLine,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  buttonActive: {
    backgroundColor: COLORS.dpadButtonActive,
    borderColor: COLORS.snakeHead,
    shadowColor: COLORS.snakeHead,
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 10,
    transform: [{ scale: 0.95 }],
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  arrow: {
    fontSize: 40,
    color: COLORS.dpadArrow,
    fontWeight: 'bold',
  },
  arrowActive: {
    color: COLORS.dpadArrowActive,
  },
});
