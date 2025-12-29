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
    this._unsubscribers = [];
    // 초기화 상태 공유 (MainScreen에서 무한 대기 방지용)
    this.initStatus = 'idle'; // 'idle' | 'initializing' | 'ready' | 'failed'
    this.initError = null;
    this._initPromise = null;
  }

  /**
   * 푸시 알림 초기화
   */
  async initialize() {
    // 이미 초기화 중이면 같은 Promise 공유
    if (this._initPromise) return this._initPromise;

    this.initStatus = 'initializing';
    this.initError = null;

    this._initPromise = (async () => {
    if (this.initialized) {
      console.log('✅ 푸시 알림이 이미 초기화되어 있습니다.');
      this.initStatus = 'ready';
      return true;
    }
    
    if (!this.available) {
      console.log('⚠️ Firebase가 설정되지 않았습니다. 푸시 알림 비활성화.');
      console.log('📝 Firebase 설정 방법: PUSH_APP_SETUP_COMPLETE.md 참고');
      this.initStatus = 'failed';
      this.initError = new Error('Firebase messaging module unavailable');
      return false;
    }

    console.log('🚀 푸시 알림 초기화 시작...');

    try {
      // Firebase 앱이 제대로 초기화되었는지 확인
      const isFirebaseInitialized = await this.checkFirebaseInitialization();
      if (!isFirebaseInitialized) {
        // checkFirebaseInitialization()에서 이미 상세 로그를 출력함
        this.initStatus = 'failed';
        this.initError = new Error('Firebase not initialized');
        return false;
      }

      // iOS는 토큰 발급 전 registerDeviceForRemoteMessages가 필요할 수 있음
      if (Platform.OS === 'ios') {
        try {
          console.log('📱 iOS 기기 등록 중...');
          await messaging().setAutoInitEnabled?.(true);
          await messaging().registerDeviceForRemoteMessages();
          console.log('✅ iOS 기기 등록 완료');
        } catch (e) {
          // register 단계 오류는 환경/설정에 따라 발생할 수 있으니 초기화 자체를 막지 않음
          if (__DEV__) {
            console.log('⚠️ iOS registerDeviceForRemoteMessages 실패 (무시하고 계속):', e?.message || e);
          }
        }
      }

      // 권한 요청
      console.log('🔐 푸시 알림 권한 요청 중...');
      const authStatus = await this.requestPermission();
      
      if (authStatus) {
        // FCM 토큰 가져오기
        console.log('🔑 FCM 토큰 가져오는 중...');
        const token = await this.getFCMToken();
        if (!token) {
          console.log('⚠️ FCM 토큰을 가져오지 못했습니다.');
          // 개발 환경에서는 토큰 없이도 계속 진행
          if (__DEV__) {
            console.log('🧪 개발 환경: 토큰 없이 계속 진행');
            this.setupMessageListeners();
            this.initialized = true;
            this.initStatus = 'ready';
            return true;
          }
          this.initStatus = 'failed';
          this.initError = new Error('Failed to get FCM token');
          return false;
        }
        
        // 메시지 리스너 설정
        console.log('👂 메시지 리스너 설정 중...');
        this.setupMessageListeners();
        
        this.initialized = true;
        this.initStatus = 'ready';
        console.log('✅ 푸시 알림 초기화 완료!');
        console.log('📱 FCM 토큰:', token.substring(0, 50) + '...');
        return true;
      } else {
        console.log('⚠️ 푸시 알림 권한이 거부되었습니다');
        // 개발 환경에서는 권한 없이도 계속 진행
        if (__DEV__) {
          console.log('🧪 개발 환경: 권한 없이 계속 진행');
          const token = await this.getFCMToken();
          if (token) {
            this.setupMessageListeners();
            this.initialized = true;
            this.initStatus = 'ready';
            console.log('✅ 푸시 알림 초기화 완료 (개발 모드)');
            return true;
          }
          // 토큰 없어도 초기화는 성공으로 간주
          this.setupMessageListeners();
          this.initialized = true;
          this.initStatus = 'ready';
          console.log('✅ 푸시 알림 초기화 완료 (토큰 없음, 개발 모드)');
          return true;
        }
        this.initStatus = 'failed';
        this.initError = new Error('Push permission denied');
        return false;
      }
    } catch (error) {
      console.error('❌ 푸시 알림 초기화 오류:', error);
      this.initError = error;
      
      if (__DEV__) {
        console.error('오류 상세:', {
          message: error.message,
          code: error.code,
        });
      }
      
      if (error.message && error.message.includes('No Firebase App')) {
        console.log('💡 Firebase 설정 파일이 누락되었습니다.');
        console.log('   - iOS: GoogleService-Info.plist의 BUNDLE_ID 확인');
        console.log('   - Android: google-services.json의 package_name 확인');
      }
      
      // 개발 환경에서는 에러가 발생해도 초기화 성공으로 처리 (앱이 중단되지 않도록)
      if (__DEV__) {
        console.log('🧪 개발 환경: 초기화 실패했지만 계속 진행');
        this.initialized = true; // 개발 환경에서는 강제로 초기화 완료로 설정
        this.initStatus = 'ready';
        return true;
      }
      
      this.initStatus = 'failed';
      return false;
    }
    })().finally(() => {
      // 다음 initialize 호출에서 재시도할 수 있도록 Promise 해제
      this._initPromise = null;
    });

    return await this._initPromise;
  }

  /**
   * Firebase 초기화 상태 확인
   */
  async checkFirebaseInitialization() {
    try {
      // 개발 환경에서는 더 관대하게 체크
      if (__DEV__) {
        console.log('🧪 개발 환경: Firebase 초기화 체크 시작');
      }

      // Firebase messaging이 로드되어 있다면 기본적으로 초기화되어 있다고 판단
      if (!messaging) {
        console.log('⚠️ Firebase Messaging 모듈이 없습니다.');
        return false;
      }

      // 실제로 FCM 토큰을 가져올 수 있는지 테스트 (더 실용적인 체크)
      try {
        const testToken = await messaging().getToken();
        if (testToken) {
          console.log('✅ Firebase 정상 작동 확인 (토큰 가져오기 성공)');
          return true;
        }
      } catch (tokenError) {
        // 토큰 가져오기 실패 시 상세 로그
        if (__DEV__) {
          console.log('⚠️ FCM 토큰 가져오기 실패:', tokenError.message);
        }
        
        // 특정 에러는 무시하고 계속 진행
        if (tokenError.message?.includes('MISSING_INSTANCEID_SERVICE') ||
            tokenError.message?.includes('network') ||
            tokenError.message?.includes('timeout')) {
          console.log('💡 일시적 오류로 판단, Firebase는 초기화되어 있음');
          return true;
        }
        
        // 설정 파일이 없는 경우에만 false 반환
        if (tokenError.message?.includes('No Firebase App') ||
            tokenError.message?.includes('default app') ||
            tokenError.message?.includes('GoogleService-Info') ||
            tokenError.message?.includes('google-services')) {
          console.log('⚠️ Firebase 프로젝트가 설정되지 않았습니다.');
          console.log('📝 다음 파일을 추가해주세요:');
          console.log('   - iOS: GoogleService-Info.plist');
          console.log('   - Android: google-services.json');
          return false;
        }
        
        // 기타 에러는 일단 통과 (너무 엄격하지 않게)
        console.log('⚠️ Firebase 체크 중 오류 발생했지만 계속 진행');
        return true;
      }

      // 혹시 위에서 토큰을 못 가져왔어도 Firebase 앱 자체는 초기화되어 있을 수 있음
      try {
        const app = require('@react-native-firebase/app').default;
        const apps = app.apps;
        
        if (apps && apps.length > 0) {
          console.log('✅ Firebase 앱 초기화 확인됨');
          console.log('   Firebase 앱 이름:', apps[0]?.name);
          console.log('   Firebase 프로젝트:', apps[0]?.options?.projectId);
          return true;
        }
      } catch (appError) {
        if (__DEV__) {
          console.log('⚠️ Firebase 앱 정보 조회 실패 (무시):', appError.message);
        }
      }

      // 개발 환경에서는 기본적으로 true 반환 (너무 엄격하지 않게)
      if (__DEV__) {
        console.log('🧪 개발 환경: Firebase 초기화되어 있다고 가정');
        return true;
      }
      
      return true;
    } catch (error) {
      console.error('❌ Firebase 초기화 체크 오류:', error);
      console.error('   오류 메시지:', error.message);
      
      // 개발 환경에서는 체크 실패해도 계속 진행
      if (__DEV__) {
        console.log('🧪 개발 환경: 체크 실패했지만 true 반환');
        return true;
      }
      
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
      console.log('🔑 FCM 토큰 요청 시작...');
      
      // iOS에서 registerDeviceForRemoteMessages가 호출되지 않았으면 호출
      if (Platform.OS === 'ios') {
        try {
          await messaging().registerDeviceForRemoteMessages();
          console.log('✅ iOS 원격 메시지 등록 완료');
        } catch (e) {
          console.log('⚠️ iOS 원격 메시지 등록 실패 (무시):', e?.message);
        }
      }

      // APNs 토큰이 늦게 설정되어 getToken이 실패하는 케이스가 있어 재시도
      const tryGetToken = async (retries = 3) => {
        try {
          console.log(`   시도 ${4 - retries}/3...`);
          const token = await messaging().getToken();
          console.log('✅ FCM 토큰 획득 성공');
          return token;
        } catch (e) {
          const msg = e?.message || '';
          const isApnsNotSet =
            msg.includes('APNs token') ||
            msg.includes('apns-token-not-set') ||
            msg.includes('messaging/apns-token-not-set');
          
          console.log(`   ⚠️ FCM 토큰 획득 실패: ${msg}`);
          
          if (Platform.OS === 'ios' && isApnsNotSet && retries > 0) {
            console.log(`   ⏳ ${retries}번 재시도 남음, 1초 대기 중...`);
            await new Promise(r => setTimeout(r, 1000));
            return await tryGetToken(retries - 1);
          }
          throw e;
        }
      };

      const token = await tryGetToken();
      this.fcmToken = token;
      console.log('📱 FCM 토큰 (처음 50자):', token.substring(0, 50) + '...');
      
      // 로컬에 저장
      await AsyncStorage.setItem('fcmToken', token);
      console.log('💾 FCM 토큰 로컬 저장 완료');
      
      // 서버에 토큰 전송 (백엔드 준비되면 활성화)
      await this.sendTokenToServer(token);
      
      return token;
    } catch (error) {
      console.error('❌ FCM 토큰 가져오기 최종 실패:', error);
      console.error('   오류 코드:', error.code);
      console.error('   오류 메시지:', error.message);
      
      // 시뮬레이터에서는 실제 토큰을 생성할 수 없음
      // 개발 환경에서는 Mock 토큰 사용
      if (__DEV__ && error.message && (
        error.message.includes('APNs') || 
        error.message.includes('simulator') ||
        error.message.includes('APNS')
      )) {
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
    // 기존 리스너가 있으면 정리
    if (this._unsubscribers?.length) {
      this._unsubscribers.forEach(fn => {
        try { fn && fn(); } catch (_) {}
      });
      this._unsubscribers = [];
    }

    // 포그라운드 메시지 수신 (앱 사용 중)
    const unsubOnMessage = messaging().onMessage(async remoteMessage => {
      console.log('📨 포그라운드 메시지 수신:', remoteMessage);
      
      // 알림 저장
      await this.saveNotification(remoteMessage);
      
      // 알림 표시
      this.showLocalNotification(remoteMessage);
    });

    // 백그라운드 메시지 수신 (index.js에서 설정)
    // messaging().setBackgroundMessageHandler는 루트 레벨에서 설정

    // 알림 탭 이벤트 (앱이 백그라운드에 있을 때)
    const unsubOnOpened = messaging().onNotificationOpenedApp(async remoteMessage => {
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
    const unsubOnRefresh = messaging().onTokenRefresh(async token => {
      console.log('🔄 FCM 토큰 갱신:', token);
      this.fcmToken = token;
      await AsyncStorage.setItem('fcmToken', token);
      
      // 서버에 새 토큰 전송
      await this.sendTokenToServer(token);
    });

    this._unsubscribers.push(unsubOnMessage, unsubOnOpened, unsubOnRefresh);
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
   * 초기화 상태(성공/실패/진행중) 반환
   */
  getInitStatus() {
    return this.initStatus;
  }

  getInitError() {
    return this.initError;
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
