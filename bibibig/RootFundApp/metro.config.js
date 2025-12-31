const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  server: {
    // 디버거 연결 타임아웃 증가 (기본값: 30초 → 60초)
    enhanceMiddleware: (middleware) => {
      return (req, res, next) => {
        res.setTimeout(60000); // 60초
        middleware(req, res, next);
      };
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
