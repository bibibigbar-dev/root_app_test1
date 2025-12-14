/**
 * @format
 */

import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// Firebase가 설정되어 있을 때만 백그라운드 메시지 핸들러 등록
try {
  const messaging = require('@react-native-firebase/messaging').default;
  
  // 백그라운드 메시지 핸들러 (앱이 백그라운드/종료 상태일 때)
  messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('📨 백그라운드 메시지 수신:', remoteMessage);
    // 백그라운드에서는 자동으로 알림이 표시됩니다
  });
} catch (error) {
  console.log('⚠️ Firebase 설정이 필요합니다. 푸시 알림은 비활성화됩니다.');
}

AppRegistry.registerComponent(appName, () => App);
