/**
 * RootFund App
 * 지속가능한 친환경 투자 플랫폼
 *
 * @format
 */

import React, { useEffect } from 'react';
import { StatusBar, LogBox } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';

function App() {
  useEffect(() => {
    // Suppress InteractionManager deprecation warning from React Navigation
    LogBox.ignoreLogs([
      'InteractionManager has been deprecated',
    ]);
  }, []);

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <AppNavigator />
    </>
  );
}

export default App;
