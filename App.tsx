import React, { useState } from 'react';
import { GameScreen } from './src/components/GameScreen';
import { HomeScreen } from './src/components/HomeScreen';
import { GameDifficulty } from './src/constants';

type Screen = 'home' | 'game';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [difficulty, setDifficulty] = useState<GameDifficulty>('medium');

  const handleStartGame = (selectedDifficulty: GameDifficulty) => {
    setDifficulty(selectedDifficulty);
    setCurrentScreen('game');
  };

  if (currentScreen === 'home') {
    return <HomeScreen onStartGame={handleStartGame} />;
  }

  return (
    <GameScreen
      onExit={() => setCurrentScreen('home')}
      difficulty={difficulty}
    />
  );
}

export default App;
