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
import { getFontFamily } from './src/styles/fonts';
import PushNotificationService from './src/services/pushNotification';

// 전역 폰트 스타일 설정
// Text 컴포넌트의 기본 렌더링 오버라이드
const OriginalText = Text.render;
const OriginalTextInput = TextInput.render;

// Text 컴포넌트 래핑
Text.render = function (props, ref) {
  const { style, ...restProps } = props;
  const flatStyle = StyleSheet.flatten(style);
  const fontWeight = flatStyle?.fontWeight;
  const fontFamily = getFontFamily(fontWeight);
  
  const newStyle = [{ fontFamily }, style];
  return OriginalText.call(this, { ...restProps, style: newStyle }, ref);
};

// TextInput 컴포넌트 래핑
TextInput.render = function (props, ref) {
  const { style, ...restProps } = props;
  const flatStyle = StyleSheet.flatten(style);
  const fontWeight = flatStyle?.fontWeight;
  const fontFamily = getFontFamily(fontWeight);
  
  const newStyle = [{ fontFamily }, style];
  return OriginalTextInput.call(this, { ...restProps, style: newStyle }, ref);
};

function App() {
  useEffect(() => {
    // Suppress deprecation warnings
    LogBox.ignoreLogs([
      'InteractionManager has been deprecated',
      'InteractionManager',
      'requestIdleCallback',
    ]);

    // 푸시 알림 초기화 - 임시 비활성화
    // const initPushNotifications = async () => {
    //   try {
    //     await PushNotificationService.initialize();
    //   } catch (error) {
    //     console.error('푸시 알림 초기화 실패:', error);
    //   }
    // };

    // initPushNotifications();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}

export default App;
