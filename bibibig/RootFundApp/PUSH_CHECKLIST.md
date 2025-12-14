# 푸시 알림 체크리스트 ✅

## 앱 (프론트엔드) - 완료! ✅

- [x] Firebase Messaging 패키지 설치
- [x] 푸시 알림 서비스 구현
- [x] App.js 자동 초기화
- [x] FCM 토큰 생성
- [x] 서버 API 연동 준비
- [x] 포그라운드 알림 수신
- [x] 백그라운드 알림 수신
- [x] 알림 탭 이벤트 처리

## Firebase 설정 - 수동 필요 ⏳

### 1. Firebase Console
- [ ] Firebase 프로젝트 생성
- [ ] Android 앱 추가 (패키지: com.rootfundapp)
- [ ] `google-services.json` 다운로드 → `android/app/` 저장
- [ ] iOS 앱 추가 (번들 ID 확인)
- [ ] `GoogleService-Info.plist` 다운로드 → Xcode에 추가

### 2. Android 설정
- [ ] `android/build.gradle`에 `classpath 'com.google.gms:google-services:4.4.0'` 추가
- [ ] `android/app/build.gradle` 끝에 `apply plugin: "com.google.gms.google-services"` 추가
- [ ] `google-services.json` 파일 위치 확인

### 3. iOS 설정
- [ ] `cd ios && pod install` 실행
- [ ] Xcode에서 Push Notifications 활성화
- [ ] Background Modes → Remote notifications 활성화
- [ ] Firebase Console에 APNs 인증 키 업로드

### 4. 앱 테스트
- [ ] 앱 실행
- [ ] 콘솔에서 FCM 토큰 확인
- [ ] Firebase Console에서 테스트 메시지 전송

## 백엔드 - 구현 필요 ⏳

### 1. 데이터베이스
```sql
- [ ] member_fcm_tokens 테이블 생성
```

### 2. API 구현
```
- [ ] POST /member/save_fcm_token.json
      파라미터: fcm_token
      기능: FCM 토큰을 DB에 저장
```

### 3. Firebase Admin SDK
```
- [ ] Firebase Admin SDK 설치 (Node.js/PHP/Java)
- [ ] Firebase 서비스 계정 키 다운로드
- [ ] 푸시 발송 함수 구현
```

### 4. 알림 발송 로직
```
- [ ] 새 상품 등록 시 전체 알림
- [ ] 상환 완료 시 투자자 알림
- [ ] 공지사항 발송 시 전체 알림
```

## 파일 위치 참고

### 앱 파일 (이미 완료):
```
src/services/pushNotification.js  ← 푸시 알림 서비스
src/services/api.js                ← FCM 토큰 API 추가됨
App.js                             ← 초기화 코드 추가됨
index.js                           ← 백그라운드 핸들러 추가됨
```

### Firebase 설정 파일 (추가 필요):
```
android/app/google-services.json         ← Firebase에서 다운로드
ios/GoogleService-Info.plist            ← Firebase에서 다운로드
android/build.gradle                     ← 수정 필요
android/app/build.gradle                 ← 수정 필요
```

### 가이드 문서:
```
PUSH_APP_SETUP_COMPLETE.md         ← 전체 설정 가이드
BACKEND_PUSH_NOTIFICATION.md       ← 백엔드 구현 가이드
PUSH_NOTIFICATION_ALTERNATIVES.md  ← 다른 방법들
```

## 빠른 시작

### 앱만 테스트하려면:
1. Firebase 프로젝트 설정 (위 Firebase 설정 섹션)
2. 앱 실행
3. Firebase Console에서 테스트 메시지 전송

### 백엔드까지 완성하려면:
1. 위 모든 체크리스트 완료
2. MySQL 테이블 생성
3. API 구현
4. Firebase Admin SDK 설정
5. 푸시 발송 로직 구현

---

**현재 상태: 앱 준비 완료! Firebase 설정 후 바로 테스트 가능** ✅
