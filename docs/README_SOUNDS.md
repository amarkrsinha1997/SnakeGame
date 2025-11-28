# Sound Files - Single Source Setup

## Location
All sound files are maintained in **one location only**:

```
src/assets/sounds/
```

## Sound Files
- `music_music.mp3` - Background music (1.4MB)
- `eat.mp3` - Regular egg eaten (4KB)
- `dragon_egg_ate.wav` - Dragon egg eaten (610KB)
- `dragon_spawn.mp3` - Dragon egg appears (4KB)
- `dragon_despawn.wav` - Dragon egg disappears (287KB)
- `game_over.mp3` - Game over (96KB)
- `game_start.mp3` - Game start (68KB)
- `high_score.wav` - New high score (513KB)

## How It Works

### Sound Manager
The `src/utils/soundManager.ts` file uses `require()` statements to load all sounds:

```typescript
const soundFiles: Record<SoundType, any> = {
  eat: require('../assets/sounds/eat.mp3'),
  dragonEat: require('../assets/sounds/dragon_egg_ate.wav'),
  // ... etc
};
```

### Platform Handling

**Web (Webpack):**
- Webpack automatically bundles required assets
- Audio played via HTML5 Audio API

**Android:**
- Metro bundler packages sounds into APK
- Sounds played via react-native-sound

**iOS:**
- Metro bundler packages sounds into app bundle
- Sounds played via react-native-sound

## Benefits

✅ **Single source of truth** - No duplicate files  
✅ **Easy updates** - Change sound in one place  
✅ **Automatic bundling** - No manual copying needed  
✅ **Smaller repository** - No redundant files  
✅ **Platform agnostic** - Same code works everywhere  

## Adding New Sounds

1. Add your sound file to `src/assets/sounds/`
2. Add a new entry to the `soundFiles` object in `soundManager.ts`:
   ```typescript
   newSound: require('../assets/sounds/new_sound.mp3'),
   ```
3. Add the sound type to the `SoundType` union type
4. Call `playSound('newSound')` where needed

That's it! The bundlers will handle the rest automatically.

## DO NOT

❌ Copy sounds to `web/sounds/`  
❌ Copy sounds to `android/app/src/main/res/raw/`  
❌ Copy sounds to `ios/SnakeGame/sounds/`  
❌ Add sounds to Xcode project manually  

All sounds should **only** exist in `src/assets/sounds/`

