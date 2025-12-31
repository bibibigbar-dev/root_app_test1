/**
 * RootFund App
 * 지속가능한 친환경 투자 플랫폼
 *
 * @format
 */

import React, { useEffect, useState } from 'react';
import { StatusBar, LogBox, Text, TextInput, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import SplashScreen from './src/screens/SplashScreen';
import { getFontFamily } from './src/styles/fonts';
import PushNotificationService from './src/services/pushNotification';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './src/config/api';

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
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Suppress deprecation warnings
    LogBox.ignoreLogs([
      'InteractionManager has been deprecated',
      'InteractionManager',
      'requestIdleCallback',
    ]);
    
    // 더 강력한 경고 억제
    LogBox.ignoreAllLogs(false); // 모든 로그는 유지하되
    const originalWarn = console.warn;
    console.warn = (...args) => {
      const message = args[0];
      if (
        typeof message === 'string' &&
        (message.includes('InteractionManager') || 
         message.includes('requestIdleCallback'))
      ) {
        return; // InteractionManager 관련 경고만 무시
      }
      originalWarn.apply(console, args);
    };

    // API 서버 변경 감지 및 세션 정리
    const checkApiServerChange = async () => {
      try {
        const savedApiUrl = await AsyncStorage.getItem('lastApiUrl');
        const currentApiUrl = API_BASE_URL;

        if (savedApiUrl && savedApiUrl !== currentApiUrl) {
          console.log('');
          console.log('🔄 API 서버가 변경되었습니다');
          console.log(`   이전: ${savedApiUrl}`);
          console.log(`   현재: ${currentApiUrl}`);
          console.log('   기존 세션을 정리합니다...');
          
          // 모든 로그인 관련 데이터 삭제
          await AsyncStorage.multiRemove([
            'userData',
            'userToken',
            'loginTime',
            'sessionExpiry',
            'isLoggedIn',
          ]);
          
          console.log('✅ 세션 정리 완료');
          console.log('');
        }

        // 현재 API URL 저장
        await AsyncStorage.setItem('lastApiUrl', currentApiUrl);
      } catch (error) {
        console.error('❌ API 서버 체크 오류:', error);
      }
    };

    // 푸시 알림 초기화
    const initPushNotifications = async () => {
      console.log('');
      console.log('='.repeat(60));
      console.log('🚀 RootFund App 시작');
      console.log('='.repeat(60));
      
      // 먼저 API 서버 변경 체크
      await checkApiServerChange();
      
      try {
        console.log('📱 푸시 알림 서비스 초기화 시작...');
        const success = await PushNotificationService.initialize();
        
        if (success) {
          console.log('');
          console.log('✅ 푸시 알림 초기화 성공!');
          console.log('   - FCM 토큰 획득 완료');
          console.log('   - 메시지 리스너 활성화됨');
          console.log('');
        } else {
          console.log('');
          console.log('⚠️ 푸시 알림 초기화 실패');
          console.log('   - 앱은 정상적으로 동작합니다');
          console.log('   - 푸시 알림 기능만 비활성화됩니다');
          console.log('');
        }
      } catch (error) {
        console.error('');
        console.error('❌ 푸시 알림 초기화 중 예외 발생:', error);
        console.error('   - 앱은 정상적으로 동작합니다');
        console.error('');
      }
      
      console.log('='.repeat(60));
      console.log('');
    };

    initPushNotifications();
  }, []);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  // 스플래시 화면 표시 (매번 3초 동안)
  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}

export default App;
