# Sound Setup Guide

## Overview
The Snake Game now has full sound support across all platforms: Web, Android, and iOS.

## What Was Done

### 1. Installed react-native-sound Library
```bash
npm install react-native-sound --save --legacy-peer-deps
cd ios && pod install
```

### 2. Updated Sound Manager (`src/utils/soundManager.ts`)
- Added support for Android and iOS platforms using `react-native-sound`
- Maintained web platform support using HTML5 Audio API
- Added background music playback for all platforms
- Configured proper sound caching for better performance
- Uses `require()` to load sounds from single source location

### 3. Sound Files Setup

All sound files are located in a single location: **`src/assets/sounds/`**

The sound manager uses `require()` to load sounds from this directory:
- For **Web**: Webpack bundles and serves the sounds
- For **Android**: React Native bundles sounds into the APK
- For **iOS**: React Native bundles sounds into the app bundle

No duplicate copies are maintained - everything loads from `src/assets/sounds/`

## Sound Files List
- `music_music.mp3` - Background music (loops continuously)
- `eat.mp3` - Regular egg eaten
- `dragon_eat.mp3` - Dragon egg eaten
- `dragon_spawn.mp3` - Dragon egg appears
- `dragon_despawn.mp3` - Dragon egg disappears
- `game_over.mp3` - Game over sound
- `game_start.mp3` - Game start sound
- `high_score.mp3` - New high score achieved

## How to Build and Run

### Web
```bash
npm run web
```
The development server will run on http://localhost:8080

### Android
```bash
npm run android
```
Make sure you have an Android emulator running or device connected.

### iOS
```bash
npm run ios
```
Make sure you have Xcode installed and an iOS simulator available.

## Sound Controls
- Sound effects can be toggled on/off from the home screen
- Background music can be toggled on/off separately
- Settings are persisted using AsyncStorage

## Troubleshooting

### Sounds Not Playing on Any Platform
1. Verify all files exist in `src/assets/sounds/`
2. Check that the sound manager correctly uses `require()` statements
3. Rebuild the app (clean build recommended)

### iOS: Sounds Not Playing
1. Clean build folder: `cd ios && rm -rf build && cd ..`
2. Rebuild: `npm run ios`
3. Check React Native logs for any bundling errors

### Android: Sounds Not Playing
1. Clean and rebuild: `cd android && ./gradlew clean && cd ..`
2. Rebuild: `npm run android`
3. Check Metro bundler logs for any asset loading errors

### Web: Sounds Not Loading
1. Check browser console for any errors
2. Verify webpack is bundling the assets correctly
3. Check that sound files exist in `src/assets/sounds/`

## Technical Details

### react-native-sound
- Version: 0.13.0
- Used for Android and iOS platforms
- Supports local audio files from app bundle
- Provides play, pause, stop, and loop functionality

### Platform Detection
The sound manager automatically detects the platform using React Native's `Platform.OS` and uses the appropriate audio implementation.

### Asset Management
All sound files are loaded using `require()` statements, which means:
- React Native Metro bundler handles all platforms automatically
- No need for platform-specific directories
- Webpack bundles assets for web builds
- Single source of truth for all sound files

### Performance
- Sounds are cached after first load
- Background music is loaded once and reused
- Minimal memory footprint with proper cleanup on unmount

