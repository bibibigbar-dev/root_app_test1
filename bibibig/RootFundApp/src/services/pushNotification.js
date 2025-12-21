import { Platform, PermissionsAndroid, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from './api';

// Firebase Messaging을 동적으로 import
let messaging = null;
try {
  messaging = require('@react-native-firebase/messaging').default;
} catch (error) {
  console.log('⚠️ Firebase Messaging 모듈을 찾을 수 없습니다.');
}

class PushNotificationService {
  constructor() {
    this.fcmToken = null;
    this.initialized = false;
    this.available = messaging !== null;
  }

  /**
   * 푸시 알림 초기화
   */
  async initialize() {
    if (!this.available) {
      console.log('⚠️ Firebase가 설정되지 않았습니다. 푸시 알림 비활성화.');
      console.log('📝 Firebase 설정 방법: PUSH_APP_SETUP_COMPLETE.md 참고');
      return false;
    }

    try {
      // Firebase 앱이 제대로 초기화되었는지 확인
      const isFirebaseInitialized = await this.checkFirebaseInitialization();
      if (!isFirebaseInitialized) {
        console.log('⚠️ Firebase 프로젝트가 설정되지 않았습니다.');
        console.log('📝 다음 파일을 추가해주세요:');
        console.log('   - iOS: GoogleService-Info.plist');
        console.log('   - Android: google-services.json');
        console.log('💡 자세한 내용: PUSH_APP_SETUP_COMPLETE.md 참고');
        return false;
      }

      // 권한 요청
      const authStatus = await this.requestPermission();
      
      if (authStatus) {
        // FCM 토큰 가져오기
        await this.getFCMToken();
        
        // 메시지 리스너 설정
        this.setupMessageListeners();
        
        this.initialized = true;
        console.log('✅ 푸시 알림 초기화 완료');
        return true;
      } else {
        console.log('⚠️ 푸시 알림 권한이 거부되었습니다');
        return false;
      }
    } catch (error) {
      console.error('❌ 푸시 알림 초기화 오류:', error.message);
      if (error.message && error.message.includes('No Firebase App')) {
        console.log('💡 Firebase 설정 파일이 누락되었습니다. PUSH_APP_SETUP_COMPLETE.md 참고');
      }
      return false;
    }
  }

  /**
   * Firebase 초기화 상태 확인
   */
  async checkFirebaseInitialization() {
    try {
      // Firebase 앱이 초기화되어 있는지 확인
      const app = require('@react-native-firebase/app').default;
      const apps = app.apps;
      
      if (!apps || apps.length === 0) {
        console.log('⚠️ Firebase 앱이 초기화되지 않았습니다.');
        return false;
      }
      
      console.log('✅ Firebase 앱 초기화 확인됨');
      
      // 개발 환경(시뮬레이터)에서는 권한 체크 건너뛰기
      if (__DEV__) {
        console.log('🧪 개발 환경: Firebase 초기화 통과');
        return true;
      }
      
      // Firebase 앱이 있어도 설정 파일이 올바른지 확인
      try {
        await messaging().requestPermission();
        return true;
      } catch (err) {
        if (err.message && err.message.includes('No Firebase App')) {
          return false;
        }
        // 다른 에러는 권한 관련일 수 있으므로 true 반환
        return true;
      }
    } catch (error) {
      console.error('Firebase 초기화 체크 오류:', error);
      return false;
    }
  }

  /**
   * 푸시 알림 권한 요청
   */
  async requestPermission() {
    try {
      if (Platform.OS === 'ios') {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
          console.log('✅ iOS 푸시 알림 권한 승인:', authStatus);
          return true;
        } else {
          console.log('❌ iOS 푸시 알림 권한 거부:', authStatus);
          // 개발 환경에서는 권한 거부되어도 계속 진행
          if (__DEV__) {
            console.log('🧪 개발 환경: 권한 체크 무시하고 계속 진행');
            return true;
          }
          return false;
        }
      } else {
        // Android 13 (API 33) 이상에서는 권한 요청 필요
        if (Platform.Version >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            console.log('✅ Android 푸시 알림 권한 승인');
            return true;
          } else {
            console.log('❌ Android 푸시 알림 권한 거부');
            // 개발 환경에서는 권한 거부되어도 계속 진행
            if (__DEV__) {
              console.log('🧪 개발 환경: 권한 체크 무시하고 계속 진행');
              return true;
            }
            return false;
          }
        }
        // Android 12 이하는 자동 승인
        return true;
      }
    } catch (error) {
      console.error('권한 요청 오류:', error);
      // 개발 환경에서는 오류 발생해도 계속 진행
      if (__DEV__) {
        console.log('🧪 개발 환경: 권한 오류 무시하고 계속 진행');
        return true;
      }
      return false;
    }
  }

  /**
   * FCM 토큰 가져오기
   */
  async getFCMToken() {
    try {
      const token = await messaging().getToken();
      this.fcmToken = token;
      console.log('📱 FCM 토큰:', token);
      
      // 로컬에 저장
      await AsyncStorage.setItem('fcmToken', token);
      
      // 서버에 토큰 전송 (백엔드 준비되면 활성화)
      await this.sendTokenToServer(token);
      
      return token;
    } catch (error) {
      console.error('❌ FCM 토큰 가져오기 오류:', error);
      console.error('오류 상세:', error.message);
      
      // 시뮬레이터에서는 실제 토큰을 생성할 수 없음
      // 개발 환경에서는 Mock 토큰 사용
      if (__DEV__ && error.message && error.message.includes('APNs')) {
        console.log('⚠️ 시뮬레이터 감지: Mock FCM 토큰 생성');
        const mockToken = `MOCK_FCM_TOKEN_${Platform.OS}_${Date.now()}`;
        this.fcmToken = mockToken;
        await AsyncStorage.setItem('fcmToken', mockToken);
        console.log('🧪 Mock FCM 토큰:', mockToken);
        return mockToken;
      }
      
      return null;
    }
  }

  /**
   * 서버에 FCM 토큰 전송
   */
  async sendTokenToServer(token) {
    try {
      // 백엔드 API 호출 (준비될 때까지 에러 무시)
      const response = await ApiService.saveFCMToken(token);
      if (response) {
        console.log('✅ FCM 토큰 서버 전송 완료');
      } else {
        console.log('⏳ FCM 토큰 서버 전송 대기 중 (백엔드 구현 후 활성화)');
      }
    } catch (error) {
      console.log('⏳ FCM 토큰 서버 전송 대기 중 (백엔드 구현 후 활성화)');
    }
  }

  /**
   * 알림 저장
   */
  async saveNotification(remoteMessage) {
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
      
      // 최근 100개만 유지
      const trimmed = list.slice(0, 100);
      await AsyncStorage.setItem('notifications', JSON.stringify(trimmed));
      
      // 안읽은 알림 개수 업데이트
      await this.updateUnreadCount();
      
      console.log('✅ 알림 저장 완료:', newNotification.id);
    } catch (error) {
      console.error('❌ 알림 저장 오류:', error);
    }
  }

  /**
   * 안읽은 알림 개수 업데이트
   */
  async updateUnreadCount() {
    try {
      const notifications = await AsyncStorage.getItem('notifications');
      const list = notifications ? JSON.parse(notifications) : [];
      const unreadCount = list.filter(n => !n.read).length;
      await AsyncStorage.setItem('unreadNotificationCount', unreadCount.toString());
      return unreadCount;
    } catch (error) {
      console.error('❌ 안읽은 알림 개수 업데이트 오류:', error);
      return 0;
    }
  }

  /**
   * 메시지 리스너 설정
   */
  setupMessageListeners() {
    // 포그라운드 메시지 수신 (앱 사용 중)
    messaging().onMessage(async remoteMessage => {
      console.log('📨 포그라운드 메시지 수신:', remoteMessage);
      
      // 알림 저장
      await this.saveNotification(remoteMessage);
      
      // 알림 표시
      this.showLocalNotification(remoteMessage);
    });

    // 백그라운드 메시지 수신 (index.js에서 설정)
    // messaging().setBackgroundMessageHandler는 루트 레벨에서 설정

    // 알림 탭 이벤트 (앱이 백그라운드에 있을 때)
    messaging().onNotificationOpenedApp(async remoteMessage => {
      console.log('🔔 알림 탭으로 앱 열림 (백그라운드):', remoteMessage);
      await this.saveNotification(remoteMessage);
      this.handleNotificationOpen(remoteMessage);
    });

    // 앱이 종료된 상태에서 알림 탭
    messaging()
      .getInitialNotification()
      .then(async remoteMessage => {
        if (remoteMessage) {
          console.log('🔔 알림 탭으로 앱 열림 (종료 상태):', remoteMessage);
          await this.saveNotification(remoteMessage);
          this.handleNotificationOpen(remoteMessage);
        }
      });

    // 토큰 갱신 리스너
    messaging().onTokenRefresh(async token => {
      console.log('🔄 FCM 토큰 갱신:', token);
      this.fcmToken = token;
      await AsyncStorage.setItem('fcmToken', token);
      
      // 서버에 새 토큰 전송
      await this.sendTokenToServer(token);
    });

    console.log('✅ 메시지 리스너 설정 완료');
  }

  /**
   * 로컬 알림 표시 (포그라운드)
   */
  showLocalNotification(remoteMessage) {
    const title = remoteMessage.notification?.title || '알림';
    const body = remoteMessage.notification?.body || '';
    
    Alert.alert(
      title,
      body,
      [
        {
          text: '닫기',
          style: 'cancel',
        },
        {
          text: '보기',
          onPress: () => this.handleNotificationOpen(remoteMessage),
        },
      ]
    );
  }

  /**
   * 알림 탭 처리 (화면 이동)
   */
  handleNotificationOpen(remoteMessage) {
    try {
      const data = remoteMessage.data;
      console.log('📍 알림 데이터:', data);
      
      // TODO: 알림 타입에 따라 화면 이동
      // navigation은 App.js에서 ref로 접근 가능하도록 설정 필요
      
      // 예시:
      // if (data.type === 'product' && data.orderKey) {
      //   navigation.navigate('ProductDetail', { orderKey: data.orderKey });
      // } else if (data.type === 'repayment') {
      //   navigation.navigate('RepaymentHistory');
      // } else if (data.type === 'notice' && data.noticeId) {
      //   navigation.navigate('NoticeDetail', { noticeId: data.noticeId });
      // }
      
      console.log('⚠️ 화면 이동 로직은 navigation ref 설정 후 구현 필요');
    } catch (error) {
      console.error('❌ 알림 처리 오류:', error);
    }
  }

  /**
   * 현재 FCM 토큰 반환
   */
  getToken() {
    return this.fcmToken;
  }

  /**
   * 초기화 상태 확인
   */
  isInitialized() {
    return this.initialized;
  }

  /**
   * 모든 알림 가져오기
   */
  async getNotifications() {
    try {
      const notifications = await AsyncStorage.getItem('notifications');
      return notifications ? JSON.parse(notifications) : [];
    } catch (error) {
      console.error('❌ 알림 목록 가져오기 오류:', error);
      return [];
    }
  }

  /**
   * 알림 읽음 처리
   */
  async markAsRead(notificationId) {
    try {
      const notifications = await AsyncStorage.getItem('notifications');
      const list = notifications ? JSON.parse(notifications) : [];
      
      const updated = list.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      );
      
      await AsyncStorage.setItem('notifications', JSON.stringify(updated));
      await this.updateUnreadCount();
      
      console.log('✅ 알림 읽음 처리:', notificationId);
    } catch (error) {
      console.error('❌ 알림 읽음 처리 오류:', error);
    }
  }

  /**
   * 모든 알림 읽음 처리
   */
  async markAllAsRead() {
    try {
      const notifications = await AsyncStorage.getItem('notifications');
      const list = notifications ? JSON.parse(notifications) : [];
      
      const updated = list.map(n => ({ ...n, read: true }));
      
      await AsyncStorage.setItem('notifications', JSON.stringify(updated));
      await AsyncStorage.setItem('unreadNotificationCount', '0');
      
      console.log('✅ 모든 알림 읽음 처리');
    } catch (error) {
      console.error('❌ 모든 알림 읽음 처리 오류:', error);
    }
  }

  /**
   * 알림 삭제
   */
  async deleteNotification(notificationId) {
    try {
      const notifications = await AsyncStorage.getItem('notifications');
      const list = notifications ? JSON.parse(notifications) : [];
      
      const filtered = list.filter(n => n.id !== notificationId);
      
      await AsyncStorage.setItem('notifications', JSON.stringify(filtered));
      await this.updateUnreadCount();
      
      console.log('✅ 알림 삭제:', notificationId);
    } catch (error) {
      console.error('❌ 알림 삭제 오류:', error);
    }
  }

  /**
   * 모든 알림 삭제
   */
  async deleteAllNotifications() {
    try {
      await AsyncStorage.setItem('notifications', JSON.stringify([]));
      await AsyncStorage.setItem('unreadNotificationCount', '0');
      
      console.log('✅ 모든 알림 삭제');
    } catch (error) {
      console.error('❌ 모든 알림 삭제 오류:', error);
    }
  }

  /**
   * 안읽은 알림 개수 가져오기
   */
  async getUnreadCount() {
    try {
      const count = await AsyncStorage.getItem('unreadNotificationCount');
      return count ? parseInt(count, 10) : 0;
    } catch (error) {
      console.error('❌ 안읽은 알림 개수 가져오기 오류:', error);
      return 0;
    }
  }
}

export default new PushNotificationService();
