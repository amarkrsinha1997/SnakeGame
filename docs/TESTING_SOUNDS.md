# Testing Sounds - Debug Guide

## Quick Test Instructions

### Web Testing
```bash
npm run web
```
1. Open http://localhost:8080
2. **Home Screen**: Music should start automatically (if music is ON)
3. Click **Music button** (🎵): Should toggle music on/off immediately
4. Click **Sound button** (🔊): Should toggle sound effects
5. Click **PLAY**: Game start sound should play
6. **During Game**: 
   - Eating regular eggs: "eat" sound
   - Dragon egg appears: "spawn" sound
   - Eating dragon egg: "dragon eat" sound
   - Dragon egg disappears: "despawn" sound
   - Game over: "game over" sound
7. **Browser Console**: Check for any sound loading errors

### Android Testing
```bash
npm run android
```
1. Watch Metro bundler logs for any asset loading errors
2. Same test steps as web above
3. Check Android logcat for warnings: `adb logcat | grep -i sound`

### iOS Testing
```bash
npm run ios
```
1. Watch Metro bundler logs for any asset loading errors
2. Same test steps as web above
3. Check iOS logs in Xcode Console

## Debugging Steps

### If No Sounds Play At All

1. **Check sound files exist:**
   ```bash
   ls -la src/assets/sounds/
   ```
   Should show 8 files (including music_music.mp3)

2. **Check Metro bundler logs:**
   - Look for "Failed to load" messages
   - Look for asset bundle errors

3. **Web-specific:**
   - Open browser DevTools Console
   - Look for 404 errors or CORS issues
   - Check Network tab for sound file requests

4. **Native-specific:**
   - Check if `react-native-sound` is installed:
     ```bash
     npm list react-native-sound
     ```
   - For iOS, ensure pods are installed:
     ```bash
     cd ios && pod install
     ```

### If Music Doesn't Stop When Toggled

1. Check browser/native console for errors
2. Verify `stopMusic()` is being called (add console.log)
3. Try toggling multiple times

### If Sounds Work on Web But Not Native

1. **Check require() is working:**
   Add this to soundManager.ts temporarily:
   ```typescript
   console.log('Sound files:', soundFiles);
   console.log('Background music:', backgroundMusicFile);
   ```

2. **Verify react-native-sound setup:**
   ```bash
   # Check if library is linked
   npm list react-native-sound
   
   # For Android, rebuild
   cd android && ./gradlew clean && cd ..
   npm run android
   
   # For iOS, clean and rebuild
   cd ios && rm -rf build && cd ..
   npm run ios
   ```

3. **Check native logs:**
   ```bash
   # Android
   adb logcat *:E | grep -i "sound\|audio"
   
   # iOS (in Xcode)
   # Window > Devices and Simulators > Open Console
   # Filter: "sound" or "audio"
   ```

## Common Issues & Solutions

### Issue: "Failed to load native sound"
**Solution:** Check that sound files are in `src/assets/sounds/` and run:
```bash
# Clear Metro cache
npm start -- --reset-cache

# Rebuild app
npm run android  # or npm run ios
```

### Issue: Music plays but won't stop
**Solution:** The fix has been applied. If still happening:
1. Clear app data
2. Uninstall and reinstall app
3. Check console for errors

### Issue: Sounds work initially but stop working
**Solution:** Check memory/resource limits:
- Native: Sounds might not be releasing properly
- Try restarting the app

### Issue: Only some sounds work
**Solution:** 
1. Check which sounds fail (console logs)
2. Verify those specific files exist
3. Check file formats (.mp3 vs .wav)

## Expected Console Output

### Normal (No Errors):
```
[No sound-related messages]
```

### If there's an issue:
```
Failed to load native sound eat: [error details]
Failed to play background music: [error details]
```

## Verification Checklist

- [ ] All 8 sound files exist in `src/assets/sounds/`
- [ ] `react-native-sound` is installed (check package.json)
- [ ] iOS pods are installed (for iOS)
- [ ] Music starts on HomeScreen
- [ ] Music button toggles music on/off
- [ ] Sound button toggles sound effects
- [ ] All game sounds play correctly
- [ ] No errors in console/logs

## Getting Help

If sounds still don't work after following this guide:
1. Collect console/log output
2. Note which platform (web/Android/iOS)
3. Note which sounds work vs which don't
4. Check if music or sound effects are the issue
5. Try on a different platform to isolate the issue

