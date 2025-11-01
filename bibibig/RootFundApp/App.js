/**
 * RootFund App
 * 지속가능한 친환경 투자 플랫폼
 *
 * @format
 */

import React from 'react';
import { StatusBar } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';

function App() {
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <AppNavigator />
    </>
  );
}

export default App;
