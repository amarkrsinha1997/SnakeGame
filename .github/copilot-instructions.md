<!-- Copilot / AI agent instructions for the SnakeGame repo -->

# Copilot instructions — SnakeGame (concise)

Purpose: help an AI coding agent be productive immediately in this repo.

- **Big picture**: This is a bare React Native + React Native Web game. UI is split into `HomeScreen` and `GameScreen` (both in `src/components/`). Game logic lives in `src/components/GameScreen.tsx` (hook-based state + a setInterval game loop). Audio is centralized in `src/utils/soundManager.ts` (web shim `soundManager.web.ts`) and all sound files must live in `src/assets/sounds/` (single source of truth).

- **Key files to read first**:

  - `src/components/GameScreen.tsx` — main game loop, collision, dragon-egg logic, direction buffering via `useRef`.
  - `src/utils/soundManager.ts` & `src/utils/soundManager.web.ts` — cross-platform audio handling and caching.
  - `src/utils/storage.ts` — AsyncStorage wrapper and storage keys (`@snake_game_high_score`, `@snake_game_sound_enabled`, `@snake_game_music_enabled`).
  - `src/constants.ts` — theme colors, grid/board sizing, speed calculation helpers, and dragon-egg constants.

- **Architecture & patterns (concrete)**:

  - Game loop: implemented with `setInterval` inside `useEffect`, speed comes from `calculateGameSpeed(snakeLength)` in `src/constants.ts`.
  - Direction input: buffered using `useRef` (`directionRef` and `nextDirectionRef`) to avoid render churn — preserve this when changing controls.
  - Presentational components: `Snake.tsx`, `Food.tsx`, `DragonEgg.tsx` are pure renderers (no internal game logic) — prefer this separation.
  - Audio: all audio files are `require()`-d from `src/assets/sounds/`. Example mapping in `soundManager.ts`:

  ```ts
  const soundFiles = {
    eat: require('../assets/sounds/eat.mp3'),
    dragonEat: require('../assets/sounds/dragon_egg_ate.wav'),
    // ...
  };
  ```

- **Critical developer workflows / commands** (use these exactly):

  - Install: `npm install`
  - Web dev server: `npm run web` (webpack dev server, port 8080)
  - Web prod build: `npm run web:build` (outputs `dist/`)
  - Android: `npm run android`
  - iOS: `npm run ios` (use `cd ios && pod install` first if pods change)

- **Project conventions to follow**:

  - NO EXPO — this is a bare RN project. Do not add `expo-*` packages.
  - Single source for sounds: only `src/assets/sounds/` (do not copy to platform folders).
  - Components should be functional + hooks, and kept under ~300 lines when practical.
  - Use `require()` for assets so Metro/Webpack will bundle them automatically.

- **How to add a new sound (explicit steps)**:

  1. Add file to `src/assets/sounds/`.
  2. Add `require()` mapping in `src/utils/soundManager.ts` (and/or `soundManager.web.ts` if you want an explicit type cast for web).
  3. Add the new key to the `SoundType` union in `soundManager.ts`.
  4. Use `playSound('<key>')` from components (e.g., `playSound('eat')`).

- **Cross-platform notes**:

  - `Platform.OS === 'web'` branches use HTML5 Audio; native uses `react-native-sound` (guarded with defensive `require()` to avoid crashes when native module missing).
  - When modifying audio, test on Web **and** at least one native platform per the repo rules.

- **Testing & validation hints**:

  - Run `npm run web` for quick iteration; open `http://localhost:8080`.
  - For native audio problems, check console warnings — `soundManager.ts` logs load/play failures with the sound path.
  - High scores & audio prefs persist via AsyncStorage keys listed above — use `storage.ts` helpers to read/write.

- **Common edits and where to make them**:

  - Change theme/colors: `src/constants.ts` (COLORS object).
  - Change grid/cell size: `CELL_SIZE` in `src/constants.ts` (update UI dimensions follow-through is present in `GameScreen` styles).
  - Adjust game pacing: `GAME_BASE_SPEED`, `SPEED_INCREASE_PER_SEGMENT`, or `calculateGameSpeed` in `src/constants.ts`.

- **Safety and merge guidance for AI edits**:
  - Keep platform behavior explicit in PRs: mention `web:`, `ios:`, `android:` status as required by repo rules.
  - Do not add platform-specific audio files; follow single-source sound rule.
  - Preserve `useRef`-based input buffering semantics in `GameScreen` when refactoring the loop.

If anything here is unclear or you want a different focus (tests, CI, or an architecture diagram), tell me which area to expand and I will iterate.
