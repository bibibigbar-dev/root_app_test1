# 푸시 알림 설정 가이드

React Native 앱에서 푸시 알림을 사용하는 방법을 단계별로 안내합니다.

## 1. Firebase 프로젝트 설정

### 1-1. Firebase Console 접속
1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 프로젝트 생성 또는 기존 프로젝트 선택
3. 프로젝트 설정으로 이동

### 1-2. Android 앱 추가
1. Firebase 프로젝트에서 Android 앱 추가
2. **패키지 이름**: `com.rootfundapp` (android/app/build.gradle에서 확인)
3. `google-services.json` 다운로드
4. 파일 위치: `android/app/google-services.json`

### 1-3. iOS 앱 추가
1. Firebase 프로젝트에서 iOS 앱 추가
2. **번들 ID**: Xcode 프로젝트에서 확인
3. `GoogleService-Info.plist` 다운로드
4. Xcode에서 프로젝트에 추가

## 2. 패키지 설치

```bash
npm install @react-native-firebase/app @react-native-firebase/messaging --save
```

## 3. Android 설정

### 3-1. android/build.gradle
```gradle
buildscript {
    dependencies {
        // Firebase
        classpath 'com.google.gms:google-services:4.4.0'
    }
}
```

### 3-2. android/app/build.gradle
파일 끝에 추가:
```gradle
apply plugin: 'com.google.gms.google-services'
```

### 3-3. AndroidManifest.xml
`android/app/src/main/AndroidManifest.xml`에 추가:

```xml
<application>
    <!-- 기존 내용 -->
    
    <!-- FCM 설정 -->
    <meta-data
        android:name="com.google.firebase.messaging.default_notification_channel_id"
        android:value="default_channel" />
    
    <service
        android:name=".MyFirebaseMessagingService"
        android:exported="false">
        <intent-filter>
            <action android:name="com.google.firebase.MESSAGING_EVENT" />
        </intent-filter>
    </service>
</application>
```

## 4. iOS 설정

### 4-1. Podfile
`ios/Podfile`에 추가 (이미 있을 수 있음):

```ruby
# Firebase
pod 'Firebase/Messaging'
```

그 다음:
```bash
cd ios
pod install
cd ..
```

### 4-2. AppDelegate 설정
`ios/RootFundApp/AppDelegate.swift` 또는 `.m` 파일 수정:

**Swift의 경우:**
```swift
import Firebase
import UserNotifications

// application didFinishLaunchingWithOptions 메서드 안에
FirebaseApp.configure()
UNUserNotificationCenter.current().delegate = self
```

### 4-3. Background Modes 활성화
Xcode에서:
1. 프로젝트 선택
2. Targets > Capabilities
3. Background Modes 활성화
4. "Remote notifications" 체크

### 4-4. Push Notifications 권한
1. Capabilities > Push Notifications 활성화

## 5. 코드 구현

### 5-1. 푸시 알림 서비스 생성
`src/services/pushNotification.js`:

```javascript
import messaging from '@react-native-firebase/messaging';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

class PushNotificationService {
  constructor() {
    this.fcmToken = null;
  }

  /**
   * 푸시 알림 초기화
   */
  async initialize() {
    try {
      // 권한 요청
      const authStatus = await this.requestPermission();
      
      if (authStatus) {
        // FCM 토큰 가져오기
        await this.getFCMToken();
        
        // 메시지 리스너 설정
        this.setupMessageListeners();
        
        console.log('푸시 알림 초기화 완료');
      }
    } catch (error) {
      console.error('푸시 알림 초기화 오류:', error);
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
          console.log('iOS 푸시 알림 권한 승인됨:', authStatus);
          return true;
        }
      } else {
        // Android
        if (Platform.Version >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('권한 요청 오류:', error);
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
      console.log('FCM 토큰:', token);
      
      // 토큰을 서버에 저장
      await AsyncStorage.setItem('fcmToken', token);
      
      // TODO: 서버에 토큰 전송
      // await ApiService.saveFCMToken(token);
      
      return token;
    } catch (error) {
      console.error('FCM 토큰 가져오기 오류:', error);
      return null;
    }
  }

  /**
   * 메시지 리스너 설정
   */
  setupMessageListeners() {
    // 포그라운드 메시지 수신
    messaging().onMessage(async remoteMessage => {
      console.log('포그라운드 메시지 수신:', remoteMessage);
      
      // 알림 표시
      this.showLocalNotification(remoteMessage);
    });

    // 백그라운드 메시지 수신
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('백그라운드 메시지 수신:', remoteMessage);
    });

    // 알림 탭 이벤트
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('알림 탭으로 앱 열림:', remoteMessage);
      this.handleNotificationOpen(remoteMessage);
    });

    // 앱이 종료된 상태에서 알림 탭
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('앱 종료 상태에서 알림 탭:', remoteMessage);
          this.handleNotificationOpen(remoteMessage);
        }
      });

    // 토큰 갱신 리스너
    messaging().onTokenRefresh(async token => {
      console.log('FCM 토큰 갱신:', token);
      this.fcmToken = token;
      await AsyncStorage.setItem('fcmToken', token);
      
      // TODO: 서버에 새 토큰 전송
      // await ApiService.saveFCMToken(token);
    });
  }

  /**
   * 로컬 알림 표시 (포그라운드)
   */
  showLocalNotification(remoteMessage) {
    Alert.alert(
      remoteMessage.notification?.title || '알림',
      remoteMessage.notification?.body || '',
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
   * 알림 탭 처리
   */
  handleNotificationOpen(remoteMessage) {
    // TODO: 알림 데이터에 따라 특정 화면으로 이동
    const data = remoteMessage.data;
    console.log('알림 데이터:', data);
    
    // 예: 상품 상세로 이동
    // if (data.type === 'product' && data.orderKey) {
    //   navigation.navigate('ProductDetail', { orderKey: data.orderKey });
    // }
  }

  /**
   * 현재 FCM 토큰 반환
   */
  getToken() {
    return this.fcmToken;
  }
}

export default new PushNotificationService();
```

### 5-2. App.js에서 초기화

```javascript
import React, { useEffect } from 'react';
import PushNotificationService from './src/services/pushNotification';

function App() {
  useEffect(() => {
    // 푸시 알림 초기화
    PushNotificationService.initialize();
  }, []);

  return (
    // ... 기존 코드
  );
}
```

## 6. 서버 연동

### FCM 토큰을 서버에 저장
사용자 로그인 후 FCM 토큰을 서버에 전송하여 저장합니다.

```javascript
// src/services/api.js
async saveFCMToken(token) {
  try {
    const response = await this.api.post('/member/fcm-token', {
      fcm_token: token,
    });
    return response.data;
  } catch (error) {
    console.error('FCM 토큰 저장 오류:', error);
    throw error;
  }
}
```

## 7. 서버에서 푸시 알림 발송

### Node.js 예제:
```javascript
const admin = require('firebase-admin');

// Firebase Admin SDK 초기화
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// 푸시 알림 발송
async function sendPushNotification(fcmToken, title, body, data = {}) {
  const message = {
    notification: {
      title: title,
      body: body,
    },
    data: data,
    token: fcmToken,
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('푸시 알림 발송 성공:', response);
    return response;
  } catch (error) {
    console.error('푸시 알림 발송 실패:', error);
    throw error;
  }
}
```

## 8. 테스트

### Firebase Console에서 테스트
1. Firebase Console > Cloud Messaging
2. "첫 번째 캠페인 만들기" 클릭
3. 알림 메시지 작성
4. 테스트 메시지 전송
5. FCM 토큰 입력하여 테스트

### 로그 확인
```bash
# iOS
npx react-native run-ios

# Android
npx react-native run-android
```

콘솔에서 FCM 토큰과 메시지 수신 로그 확인

## 9. 주의사항

### iOS
- **APNs 인증서 필요**: Firebase Console에서 APNs 인증키 또는 인증서 업로드 필수
- **실제 디바이스 필요**: 시뮬레이터에서는 푸시 알림 테스트 불가
- **배포 시**: Production APNs 인증서 필요

### Android
- **google-services.json**: 반드시 올바른 패키지 이름으로 생성
- **SHA-1 인증서**: Firebase Console에 등록 필요 (특히 릴리즈 빌드)

## 10. 문제 해결

### FCM 토큰을 받지 못하는 경우
- Firebase 설정 파일 확인 (google-services.json, GoogleService-Info.plist)
- 패키지 이름/번들 ID 일치 확인
- 네트워크 연결 확인

### iOS에서 알림이 오지 않는 경우
- APNs 인증서 확인
- Background Modes 설정 확인
- 실제 디바이스에서 테스트

### Android에서 알림이 오지 않는 경우
- google-services.json 파일 위치 확인
- SHA-1 인증서 등록 확인
- 앱 알림 권한 확인

## 참고 자료

- [React Native Firebase 공식 문서](https://rnfirebase.io/)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [iOS Push Notifications 설정](https://firebase.google.com/docs/cloud-messaging/ios/client)
- [Android Push Notifications 설정](https://firebase.google.com/docs/cloud-messaging/android/client)
