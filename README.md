## 🐍 Snake Game

A classic Snake game built with React Native and TypeScript, featuring cross-platform support for **Web**, **Android**, and **iOS** with a dark cyberpunk theme and immersive sound effects.

## ✨ Features

- 🎮 **Classic snake gameplay** with modern controls
- 🌐 **Cross-platform**: Web, Android, and iOS (single codebase)
- 🎨 **Dark cyberpunk theme** with neon glow effects
- 🎵 **Full sound support** on all platforms using `react-native-sound`
- 🐉 **Special dragon eggs** with bonus points and timed behavior
- 📱 **Mobile-optimized D-Pad controls** for touch devices
- 💾 **Persistent high scores** via AsyncStorage
- ⚡ **Dynamic difficulty** (speed increases as you grow)

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

**Web (development):**
```bash
npm run web
```
Visit http://localhost:8080

**Web (production build):**
```bash
npm run web:build
```
Bundles to `dist/` using Webpack.

**Android:**
```bash
npm run android
```

**iOS:**
```bash
npm run ios
```

> For any substantial feature, prefer validating behavior on **all three platforms** (Web, Android, iOS) as part of your workflow.

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

## 🔊 Sound System & Assets

All sound files are managed from a **single source location**: `src/assets/sounds/`.  
This is the **only** place audio files should live – Web, Android, and iOS all read from here.

- Uses `react-native-sound` for cross-platform audio (native) plus HTML5 Audio on web.
- Automatic bundling via **Metro** (Android/iOS) and **Webpack** (web).
- No duplicate files are needed or allowed.
- See [docs/README_SOUNDS.md](./docs/README_SOUNDS.md) for details.

**⚠️ IMPORTANT – SINGLE SOURCE OF TRUTH**
- **Do NOT** copy sound files into:
  - `web/sounds/`
  - `android/app/src/main/res/raw/`
  - `ios/SnakeGame/sounds/`
  - or any other platform-specific folder.
- If you add a new sound:
  - Put the file in `src/assets/sounds/`
  - Wire it up in `src/utils/soundManager.ts`
  - Update any relevant docs if needed.

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
 
## 🎨 Theme & Visual Style

Dark cyberpunk aesthetic with neon accents:
- Deep dark background (`#0a0a0f`)
- Neon green snake (`#00ff88`)
- Orange regular eggs (`#ff6b35`)
- Gold dragon eggs (`#ffd700`)
- Subtle glow effects and smooth animations
- Consistent palette and constants are centralized in `src/constants.ts`

## 📝 Game Rules

- Snake starts with 3 segments
- Speed increases as snake grows (capped at reasonable level)
- Dragon eggs spawn randomly after eating 5-15 regular eggs
- Dragon eggs despawn after 20 seconds
- High scores saved automatically

## 📦 Builds & Downloads (Placeholders)

These sections are reserved for future build artifacts and media.  
Update the links and paths once you generate them.

- **Android APK**  
  _Coming soon: link to downloadable APK (e.g., GitHub Releases or direct URL)._

- **iOS Build (IPA/TestFlight)**  
  _Coming soon: TestFlight invite or IPA distribution link._

- **Screenshots & Media**  
  _Coming soon: add screenshots/gifs for Web, Android, and iOS (e.g., in `docs/screenshots/`)._

- **Web Demo Link**  
  _Coming soon: deployed web URL (e.g., Vercel/Netlify or static hosting of `dist/`)._

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
