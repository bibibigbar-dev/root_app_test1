# RootFund App

RootFund는 지속가능한 친환경 투자 플랫폼 모바일 애플리케이션입니다.

React Native 기반으로 개발되었으며, iOS와 Android를 지원합니다.

## 📱 주요 기능

- 사용자 인증 (로그인/회원가입)
- 상품 청약
- 상환 내역 조회
- 푸시 알림
- 생체 인증
- 문서 업로드

## 🚀 빠른 시작

### 1. 환경 설정

Node.js 20.16.0 이상이 필요합니다.

```bash
# 의존성 설치
npm install

# iOS CocoaPods 설치 (iOS만)
cd ios && pod install && cd ..
```

### 2. 앱 실행

```bash
# Metro 번들러 시작
npm start

# iOS 실행
npm run ios
# 또는 특정 시뮬레이터
npx react-native run-ios --simulator "iPhone 15"

# Android 실행
npm run android
```

### 3. API 서버 설정

API 서버 주소를 설정하세요:

```javascript
// src/config/api.js
export const API_BASE_URL = 'http://your-server.com';
```

자세한 내용은 [API_SETUP_GUIDE.md](./API_SETUP_GUIDE.md)를 참고하세요.

## 📚 문서

### 👨‍💻 앱 개발자
- **[PUSH_NOTIFICATION_GUIDE.md](./PUSH_NOTIFICATION_GUIDE.md)** - 푸시 알림 설정 및 테스트

### 🖥️ 백엔드 개발자
- **[BACKEND_MULTI_MODULE_QUICK.md](./BACKEND_MULTI_MODULE_QUICK.md)** ⭐ - 멀티 모듈 빠른 시작 (15분)
- **[FINAL_SETUP_CHECKLIST.md](./FINAL_SETUP_CHECKLIST.md)** 🎯 - 최종 구현 체크리스트 (DB 연동)

## 🔔 푸시 알림 설정

### ❌ 백엔드에서 Firebase 키 파일 에러 발생 시

```
Firebase 키 파일을 찾을 수 없습니다!
```

👉 **[BACKEND_MULTI_MODULE_QUICK.md](./BACKEND_MULTI_MODULE_QUICK.md)** (15분 빠른 해결)

### ✅ 코드를 이미 작성하신 경우

👉 **[FINAL_SETUP_CHECKLIST.md](./FINAL_SETUP_CHECKLIST.md)** (DB 연동 30분)

### ✅ 앱 푸시 알림 초기화 성공

2024-12-28 개선 완료:
- Bundle ID 수정
- 에러 핸들링 개선
- 상세 로깅 추가
- 개발 환경 최적화

자세한 내용은 **[PUSH_NOTIFICATION_GUIDE.md](./PUSH_NOTIFICATION_GUIDE.md)**를 참고하세요.

## 🏗️ 프로젝트 구조

```
RootFundApp/
├── src/
│   ├── components/      # 재사용 가능한 컴포넌트
│   ├── config/          # 설정 파일 (API URL 등)
│   ├── navigation/      # 화면 네비게이션
│   ├── screens/         # 화면 컴포넌트
│   ├── services/        # API 및 푸시 알림 서비스
│   ├── styles/          # 스타일 및 폰트
│   └── utils/           # 유틸리티 함수
├── android/             # Android 네이티브 코드
├── ios/                 # iOS 네이티브 코드
├── App.js               # 앱 진입점
└── index.js             # React Native 진입점
```

## 🛠️ 기술 스택

- **React Native** 0.82.1
- **React Navigation** 6.x - 화면 네비게이션
- **Axios** - HTTP 클라이언트
- **Firebase Cloud Messaging** - 푸시 알림
- **AsyncStorage** - 로컬 데이터 저장
- **React Native Biometrics** - 생체 인증
- **React Native Vector Icons** - 아이콘

## 📦 주요 패키지

```json
{
  "@react-native-firebase/app": "^23.7.0",
  "@react-native-firebase/messaging": "^23.7.0",
  "@react-native-clipboard/clipboard": "^1.16.3",
  "@react-native-async-storage/async-storage": "^2.2.0",
  "react-native-biometrics": "^3.0.1",
  "axios": "^1.6.2"
}
```

## 🔐 보안

### 환경 변수
중요한 정보는 환경 변수로 관리하세요:

```javascript
// .env (Git에 커밋하지 마세요!)
API_BASE_URL=http://your-server.com
```

### Firebase 키 파일
- iOS: `GoogleService-Info.plist`
- Android: `google-services.json`

이 파일들은 Git에 커밋되지 않도록 `.gitignore`에 추가하세요.

## 🧪 테스트

### 푸시 알림 테스트
```
앱 실행 → 메인 화면 → 우측 상단 "푸시 테스트" 버튼
```

PushTestScreen에서:
- FCM 토큰 확인 및 복사
- 푸시 알림 재초기화
- 수신된 알림 목록 확인

## 🐛 문제 해결

### 일반적인 문제

**Metro 번들러 캐시 초기화**
```bash
npm start -- --reset-cache
```

**iOS 빌드 오류**
```bash
cd ios
pod deintegrate
pod install
cd ..
```

**Android 빌드 오류**
```bash
cd android
./gradlew clean
cd ..
```

### 푸시 알림 문제

푸시 알림 관련 문제는 [PUSH_NOTIFICATION_GUIDE.md](./PUSH_NOTIFICATION_GUIDE.md)의 "일반적인 문제 해결" 섹션을 참고하세요.

## 📄 라이선스

Copyright © 2024 RootFund. All rights reserved.

## 📞 문의

- 앱 개발 문의: [앱 개발팀]
- 백엔드 API 문의: [백엔드 팀]

---

## 개발 히스토리

### 2024-12-28
- ✅ 푸시 알림 초기화 로직 개선
- ✅ Firebase Bundle ID 수정
- ✅ 에러 핸들링 및 로깅 개선
- ✅ 백엔드 개발자용 문서 작성

### 2024-12-27
- ✅ API 설정 가이드 작성
- ✅ 푸시 알림 서비스 구현
- ✅ PushTestScreen 추가
