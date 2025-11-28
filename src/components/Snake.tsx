import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CELL_SIZE, COLORS, Position } from '../constants';

interface SnakeProps {
  segments: Position[];
}

export function Snake({ segments }: SnakeProps) {
  return (
    <>
      {segments.map((segment, index) => {
        const isHead = index === 0;
        return (
          <View
            key={`segment-${index}`}
            style={[
              styles.segment,
              {
                left: segment.x * CELL_SIZE,
                top: segment.y * CELL_SIZE,
                backgroundColor: isHead ? COLORS.snakeHead : COLORS.snakeBody,
                borderRadius: isHead ? CELL_SIZE / 2 : CELL_SIZE / 4,
                shadowColor: COLORS.snakeHead,
                shadowOpacity: isHead ? 0.8 : 0.4,
                shadowRadius: isHead ? 8 : 4,
                elevation: isHead ? 8 : 4,
              },
            ]}
          />
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  segment: {
    position: 'absolute',
    width: CELL_SIZE - 2,
    height: CELL_SIZE - 2,
    margin: 1,
  },
});

