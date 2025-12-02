/**
 * RootFund App
 * 지속가능한 친환경 투자 플랫폼
 *
 * @format
 */

import React, { useEffect } from 'react';
import { StatusBar, LogBox, Text, TextInput, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';

// 전역 폰트 스타일 설정
if (Text.defaultProps == null) Text.defaultProps = {};
Text.defaultProps.style = { fontFamily: 'Pretendard-Regular' };

if (TextInput.defaultProps == null) TextInput.defaultProps = {};
TextInput.defaultProps.style = { fontFamily: 'Pretendard-Regular' };

function App() {
  useEffect(() => {
    // Suppress InteractionManager deprecation warning from React Navigation
    LogBox.ignoreLogs([
      'InteractionManager has been deprecated',
    ]);
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}

export default App;
