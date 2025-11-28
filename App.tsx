import React, { useState } from 'react';
import { GameScreen } from './src/components/GameScreen';
import { HomeScreen } from './src/components/HomeScreen';

type Screen = 'home' | 'game';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');

  if (currentScreen === 'home') {
    return <HomeScreen onStartGame={() => setCurrentScreen('game')} />;
  }

  return <GameScreen onExit={() => setCurrentScreen('home')} />;
}

export default App;
