const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const defaultConfig = getDefaultConfig(__dirname);

const config = {
  resolver: {
    ...defaultConfig.resolver,
    extraNodeModules: {
      ...(defaultConfig.resolver ? defaultConfig.resolver.extraNodeModules : {}),
      // Route `react-native-sound` to the JS shim so we don't require
      // a linked native module at runtime (avoids "package not linked" error).
      'react-native-sound': path.resolve(__dirname, 'src/shims/react-native-sound.web.ts'),
    },
  },
};

module.exports = mergeConfig(defaultConfig, config);
