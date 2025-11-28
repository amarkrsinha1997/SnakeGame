# 🐍 Snake Game

A classic Snake game built with React Native, featuring cross-platform support for Web, Android, and iOS with a dark cyberpunk theme and immersive sound effects.

## ✨ Features

- 🎮 Classic snake gameplay with modern controls
- 🌐 Cross-platform: Web, Android, and iOS
- 🎨 Dark cyberpunk theme with neon glow effects
- 🎵 Full sound support on all platforms
- 🐉 Special dragon eggs with bonus points
- 📱 Mobile-optimized D-Pad controls
- 💾 Persistent high scores
- ⚡ Dynamic difficulty (speed increases as you grow)

## 🚀 Quick Start

### Prerequisites

- Node.js >= 20
- For iOS: Xcode and CocoaPods
- For Android: Android Studio and Android SDK

### Installation

```bash
# Install dependencies
npm install

# For iOS, install pods
cd ios && pod install && cd ..
```

### Running the App

**Web:**
```bash
npm run web
```
Visit http://localhost:8080

**Android:**
```bash
npm run android
```

**iOS:**
```bash
npm run ios
```

## 🎮 How to Play

- **Objective**: Eat eggs to grow your snake and score points
- **Controls**: 
  - Desktop: Arrow keys or on-screen D-Pad
  - Mobile: Touch the D-Pad buttons
- **Regular Eggs** (🟠): +1 point
- **Dragon Eggs** (🟡): +10-15 points (appear randomly, 20s lifetime)
- **Game Over**: Hit a wall or yourself

## 📁 Project Structure

```
SnakeGame/
├── src/
│   ├── assets/
│   │   ├── icons/          # SVG icons
│   │   └── sounds/         # ⚠️ SINGLE SOURCE for all audio files
│   ├── components/         # React components
│   ├── utils/              # Utilities (soundManager, storage)
│   └── constants.ts        # Game configuration
├── docs/                   # 📚 Project documentation
│   ├── README.md          # Documentation index
│   ├── SOUND_SETUP.md     # Sound system guide
│   ├── README_SOUNDS.md   # Sound file management
│   └── CHANGES_SUMMARY.md # Change history
├── web/                    # Web-specific files
├── android/                # Android native code
├── ios/                    # iOS native code
└── .cursor/
    └── rule.mdc           # Project rules and conventions
```

## 🔊 Sound System

All sound files are managed from a **single source location**: `src/assets/sounds/`

- Uses `react-native-sound` for cross-platform audio
- Automatic bundling via Metro (native) and Webpack (web)
- No duplicate files needed
- See [docs/README_SOUNDS.md](./docs/README_SOUNDS.md) for details

**⚠️ IMPORTANT**: Never copy sound files to platform-specific directories!

## 📚 Documentation

Comprehensive documentation is available in the [`docs/`](./docs/) folder:

- **[docs/README.md](./docs/README.md)** - Documentation index
- **[docs/SOUND_SETUP.md](./docs/SOUND_SETUP.md)** - Sound system setup and troubleshooting
- **[docs/README_SOUNDS.md](./docs/README_SOUNDS.md)** - Sound file management guide
- **[.cursor/rule.mdc](./.cursor/rule.mdc)** - Complete project rules and architecture

## 🛠️ Tech Stack

- **React Native** (0.82.1) - Cross-platform framework
- **React Native Web** - Web support
- **TypeScript** - Type safety
- **react-native-sound** - Audio playback
- **AsyncStorage** - Data persistence
- **Webpack** - Web bundling

## 🎨 Theme

Dark cyberpunk aesthetic with neon accents:
- Deep dark background (`#0a0a0f`)
- Neon green snake (`#00ff88`)
- Orange regular eggs (`#ff6b35`)
- Gold dragon eggs (`#ffd700`)
- Glow effects and smooth animations

## 📝 Game Rules

- Snake starts with 3 segments
- Speed increases as snake grows (capped at reasonable level)
- Dragon eggs spawn randomly after eating 5-15 regular eggs
- Dragon eggs despawn after 20 seconds
- High scores saved automatically

## 🤝 Contributing

This is a bare React Native project (no Expo). Follow these guidelines:

1. Keep components under 300 lines
2. Use functional components with hooks
3. Follow TypeScript strict typing
4. **NEVER** copy sound files to platform-specific directories
5. See [.cursor/rule.mdc](./.cursor/rule.mdc) for complete rules

## 📄 License

This project is for educational and entertainment purposes.

## 🐛 Troubleshooting

**Sounds not working?**
- Check [docs/SOUND_SETUP.md](./docs/SOUND_SETUP.md) troubleshooting section
- Verify files exist in `src/assets/sounds/`
- Try clean build: `cd android && ./gradlew clean` or `cd ios && rm -rf build`

**iOS build issues?**
```bash
cd ios
rm -rf Pods Podfile.lock build
pod install
cd ..
npm run ios
```

**Android build issues?**
```bash
cd android
./gradlew clean
cd ..
npm run android
```

## 🎯 Future Enhancements

- Leaderboard system
- Multiple difficulty levels
- Power-ups and special items
- Multiplayer mode
- More themes and customization

---

Made with ❤️ using React Native
