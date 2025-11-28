# Snake Game Documentation

Welcome to the Snake Game documentation! This folder contains all project documentation and guides.

## 📚 Documentation Files

### 🔊 Sound System
- **[README_SOUNDS.md](./README_SOUNDS.md)** - Quick reference guide for sound file management
  - Single source location rules
  - How the sound system works
  - Adding new sounds
  - What NOT to do

- **[SOUND_SETUP.md](./SOUND_SETUP.md)** - Complete sound setup guide
  - Installation steps
  - Platform-specific details
  - Troubleshooting guide
  - Technical details

### 📝 Project History
- **[CHANGES_SUMMARY.md](./CHANGES_SUMMARY.md)** - Detailed change history
  - Sound implementation details
  - File structure changes
  - Benefits of current approach
  - Platform-specific adaptations

## ⚠️ Critical Rules

### Sound File Management
**ALL sound files MUST exist ONLY in `src/assets/sounds/`**

❌ **NEVER** copy sounds to:
- `web/sounds/`
- `android/app/src/main/res/raw/`
- `ios/SnakeGame/sounds/`

✅ **ALWAYS** use `require()` statements in `soundManager.ts`:
```typescript
const soundFiles = {
  eat: require('../assets/sounds/eat.mp3'),
  // ...
};
```

## 🎮 Quick Links

- **Project Rules**: `../.cursor/rule.mdc` - Complete project rules and conventions
- **Source Code**: `../src/` - All application source code
- **Game Components**: `../src/components/` - React components
- **Utilities**: `../src/utils/` - Helper functions and managers
- **Assets**: `../src/assets/` - Images, icons, and sounds

## 🚀 Getting Started

### Web
```bash
npm run web
```
Visit http://localhost:8080

### Android
```bash
npm run android
```

### iOS
```bash
npm run ios
```

## 📖 More Information

For complete project rules, architecture details, and coding conventions, see:
- **[../.cursor/rule.mdc](../.cursor/rule.mdc)** - Comprehensive project rules

For sound-specific information, start with:
- **[README_SOUNDS.md](./README_SOUNDS.md)** - Quick overview
- **[SOUND_SETUP.md](./SOUND_SETUP.md)** - Detailed guide

