# 푸시 알림 구현 방법 비교

Firebase 외에도 여러 방법으로 푸시 알림을 구현할 수 있습니다.

## 1. Firebase Cloud Messaging (FCM)
**가장 일반적이고 추천하는 방법**

### 장점:
- ✅ **무료** (무제한 알림)
- ✅ Android와 iOS 모두 지원
- ✅ 설정이 비교적 간단
- ✅ React Native 라이브러리 잘 지원됨
- ✅ 높은 전달률
- ✅ Google 인프라 사용 (안정적)

### 단점:
- ❌ Google 서비스에 의존
- ❌ Firebase 프로젝트 설정 필요

### 사용 방법:
```bash
npm install @react-native-firebase/app @react-native-firebase/messaging
```

---

## 2. 네이티브 푸시 알림 (APNs + FCM 직접 사용)

### iOS: APNs (Apple Push Notification service)
**iOS만 지원**

#### 장점:
- ✅ Apple 공식 서비스
- ✅ Firebase 불필요
- ✅ iOS에 최적화

#### 단점:
- ❌ iOS만 지원 (Android 별도 구현 필요)
- ❌ 설정이 복잡 (인증서, 키 관리)
- ❌ 서버 구현이 복잡

#### 서버 구현 (Node.js):
```bash
npm install apn
```

```javascript
const apn = require('apn');

const options = {
  token: {
    key: 'path/to/AuthKey.p8',
    keyId: 'YOUR_KEY_ID',
    teamId: 'YOUR_TEAM_ID'
  },
  production: true
};

const apnProvider = new apn.Provider(options);

async function sendPushToiOS(deviceToken, title, body, data) {
  const notification = new apn.Notification();
  notification.alert = {
    title: title,
    body: body
  };
  notification.badge = 1;
  notification.sound = 'default';
  notification.payload = data;
  notification.topic = 'com.rootfundapp'; // Bundle ID
  
  const result = await apnProvider.send(notification, deviceToken);
  console.log('APNs 결과:', result);
}
```

### Android: FCM 직접 사용
**Android만 지원**

Firebase 없이 FCM HTTP v1 API를 직접 호출할 수 있지만, 
Firebase Admin SDK를 사용하는 것이 훨씬 편리합니다.

---

## 3. OneSignal
**서드파티 푸시 알림 서비스**

### 장점:
- ✅ 무료 플랜 있음 (월 10,000 구독자까지)
- ✅ 설정 매우 간단
- ✅ 웹 대시보드에서 알림 발송 가능
- ✅ 세그먼트, 스케줄링 등 고급 기능
- ✅ Android, iOS, Web 모두 지원
- ✅ A/B 테스트, 분석 기능

### 단점:
- ❌ 무료 플랜 제한 있음
- ❌ 서드파티 서비스 의존

### 사용 방법:
```bash
npm install react-native-onesignal
```

```javascript
// App.js
import OneSignal from 'react-native-onesignal';

// OneSignal 초기화
OneSignal.setAppId('YOUR_ONESIGNAL_APP_ID');

// 알림 권한 요청
OneSignal.promptForPushNotificationsWithUserResponse();

// 알림 수신 리스너
OneSignal.setNotificationWillShowInForegroundHandler(notificationReceivedEvent => {
  console.log('알림 수신:', notificationReceivedEvent);
  notificationReceivedEvent.complete(notificationReceivedEvent.getNotification());
});

// 알림 탭 이벤트
OneSignal.setNotificationOpenedHandler(notification => {
  console.log('알림 탭:', notification);
});
```

#### 서버에서 알림 발송:
```javascript
// OneSignal REST API 사용
const axios = require('axios');

async function sendPushViaOneSignal(userIds, title, body, data) {
  const response = await axios.post(
    'https://onesignal.com/api/v1/notifications',
    {
      app_id: 'YOUR_ONESIGNAL_APP_ID',
      include_external_user_ids: userIds, // 또는 include_player_ids
      headings: { en: title },
      contents: { en: body },
      data: data
    },
    {
      headers: {
        'Authorization': `Basic YOUR_REST_API_KEY`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  return response.data;
}
```

---

## 4. Expo Push Notifications
**Expo를 사용하는 경우**

### 장점:
- ✅ Expo 프로젝트에 최적화
- ✅ 설정 매우 간단
- ✅ 무료
- ✅ Expo 서버가 APNs/FCM 처리

### 단점:
- ❌ Expo 프로젝트만 사용 가능
- ❌ Bare React Native는 별도 설정 필요

### 사용 방법:
```bash
expo install expo-notifications
```

```javascript
import * as Notifications from 'expo-notifications';

// 푸시 토큰 가져오기
const token = await Notifications.getExpoPushTokenAsync();

// 서버에서 알림 발송
await fetch('https://exp.host/--/api/v2/push/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    to: token.data,
    title: '알림 제목',
    body: '알림 내용',
    data: { screen: 'ProductDetail' },
  }),
});
```

---

## 5. Amazon SNS (Simple Notification Service)
**AWS를 사용하는 경우**

### 장점:
- ✅ AWS 생태계와 통합
- ✅ 대규모 알림 처리 가능
- ✅ SMS, 이메일도 함께 지원

### 단점:
- ❌ 비용 발생 (사용량 기반)
- ❌ 설정이 복잡
- ❌ AWS 계정 필요

---

## 6. 자체 구현 (APNs + FCM 직접 호출)
**완전한 자체 구현**

### 장점:
- ✅ 외부 서비스 의존 없음
- ✅ 완전한 제어

### 단점:
- ❌ 구현이 매우 복잡
- ❌ 유지보수 부담
- ❌ 인프라 관리 필요

---

## 추천 방법

### 🥇 1순위: Firebase Cloud Messaging (FCM)
**이유:**
- 무료, 무제한
- 설정 간단
- React Native 지원 우수
- 안정적이고 신뢰성 높음
- 대부분의 앱이 사용

### 🥈 2순위: OneSignal
**이유:**
- Firebase 싫거나 더 간단한 설정 원할 때
- 웹 대시보드에서 직접 알림 보내고 싶을 때
- 고급 기능 (세그먼트, A/B 테스트) 필요할 때

### 🥉 3순위: Expo Push (Expo 사용 시)
**이유:**
- Expo 프로젝트면 가장 간단

---

## 비교표

| 방법 | 무료 | 난이도 | Android | iOS | 웹 대시보드 | 추천도 |
|------|------|--------|---------|-----|-------------|--------|
| **Firebase FCM** | ✅ 무제한 | ⭐⭐ 보통 | ✅ | ✅ | ✅ | ⭐⭐⭐⭐⭐ |
| **OneSignal** | ✅ 10K | ⭐ 쉬움 | ✅ | ✅ | ✅ | ⭐⭐⭐⭐ |
| **Expo Push** | ✅ | ⭐ 쉬움 | ✅ | ✅ | ❌ | ⭐⭐⭐ (Expo만) |
| **APNs 직접** | ✅ | ⭐⭐⭐ 어려움 | ❌ | ✅ | ❌ | ⭐⭐ |
| **Amazon SNS** | ❌ 유료 | ⭐⭐⭐ 어려움 | ✅ | ✅ | ✅ | ⭐⭐ |

---

## 결론

**RootFundApp에는 Firebase FCM을 추천합니다!**

### 이유:
1. ✅ **완전 무료** - 비용 걱정 없음
2. ✅ **React Native 지원 우수** - `@react-native-firebase/messaging` 패키지
3. ✅ **안정적** - Google 인프라
4. ✅ **대부분의 앱이 사용** - 레퍼런스 많음
5. ✅ **Android + iOS 모두 지원**

### 대안:
- OneSignal도 좋은 선택 (더 간단한 설정 원한다면)
- 하지만 무료 플랜 제한 있음 (10,000 구독자)

---

## Firebase 없이 구현하고 싶다면?

### OneSignal 사용 가이드:

1. **OneSignal 계정 생성**
   - https://onesignal.com/ 접속
   - 무료 계정 생성

2. **앱 생성**
   - Android: FCM 서버 키 입력
   - iOS: APNs 인증서 업로드

3. **패키지 설치**
   ```bash
   npm install react-native-onesignal
   ```

4. **앱에서 초기화**
   ```javascript
   OneSignal.setAppId('YOUR_APP_ID');
   ```

5. **서버에서 알림 발송**
   - REST API 사용
   - 또는 웹 대시보드에서 직접 발송

자세한 가이드가 필요하시면 말씀해주세요! 📱
