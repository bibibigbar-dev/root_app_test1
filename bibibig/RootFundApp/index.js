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
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  
  // 백그라운드 메시지 핸들러 (앱이 백그라운드/종료 상태일 때)
  messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('📨 백그라운드 메시지 수신:', remoteMessage);
    
    // 알림 저장
    try {
      const notifications = await AsyncStorage.getItem('notifications');
      const list = notifications ? JSON.parse(notifications) : [];
      
      const newNotification = {
        id: Date.now().toString(),
        title: remoteMessage.notification?.title || '알림',
        body: remoteMessage.notification?.body || '',
        data: remoteMessage.data || {},
        receivedAt: new Date().toISOString(),
        read: false
      };
      
      list.unshift(newNotification);
      const trimmed = list.slice(0, 100);
      await AsyncStorage.setItem('notifications', JSON.stringify(trimmed));
      
      // 안읽은 알림 개수 업데이트
      const unreadCount = trimmed.filter(n => !n.read).length;
      await AsyncStorage.setItem('unreadNotificationCount', unreadCount.toString());
      
      console.log('✅ 백그라운드 알림 저장 완료');
    } catch (error) {
      console.error('❌ 백그라운드 알림 저장 오류:', error);
    }
  });
} catch (error) {
  console.log('⚠️ Firebase 설정이 필요합니다. 푸시 알림은 비활성화됩니다.');
}

AppRegistry.registerComponent(appName, () => App);
