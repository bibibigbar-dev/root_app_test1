# 앱 푸시 알림 설정 완료! 📱

## ✅ 구현된 기능

### 앱 (프론트엔드) - 완료!
1. ✅ Firebase Messaging 패키지 설치
2. ✅ 푸시 알림 서비스 구현 (`src/services/pushNotification.js`)
3. ✅ App.js에서 자동 초기화
4. ✅ FCM 토큰 자동 생성 및 저장
5. ✅ 포그라운드/백그라운드 메시지 수신
6. ✅ 알림 탭 이벤트 처리
7. ✅ 서버 API 연동 준비

### 백엔드 - 구현 필요
백엔드에서 구현해야 할 API:
- **POST** `/member/save_fcm_token.json`
  - 파라미터: `fcm_token` (String)
  - 설명: 앱에서 받은 FCM 토큰을 DB에 저장

## 🚀 다음 단계

### 1. Firebase 프로젝트 설정 (필수)

#### Firebase Console에서:
1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 프로젝트 생성 또는 기존 프로젝트 선택

#### Android 앱 추가:
1. Android 아이콘 클릭
2. **패키지 이름**: `com.rootfundapp`
3. `google-services.json` 다운로드
4. 파일 저장 위치: `android/app/google-services.json`

#### iOS 앱 추가:
1. iOS 아이콘 클릭
2. **번들 ID**: Xcode 프로젝트에서 확인
3. `GoogleService-Info.plist` 다운로드
4. Xcode에서 RootFundApp 프로젝트에 추가

### 2. Android 설정

#### `android/build.gradle` 수정:
```gradle
buildscript {
    ext {
        buildToolsVersion = "36.0.0"
        minSdkVersion = 24
        compileSdkVersion = 36
        targetSdkVersion = 36
        ndkVersion = "27.1.12297006"
        kotlinVersion = "2.1.20"
    }
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath("com.android.tools.build:gradle")
        classpath("com.facebook.react:react-native-gradle-plugin")
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin")
        // 👇 이 줄 추가
        classpath 'com.google.gms:google-services:4.4.0'
    }
}
```

#### `android/app/build.gradle` 끝에 추가:
```gradle
apply plugin: "com.google.gms.google-services"
```

### 3. iOS 설정

#### Pod 설치:
```bash
cd ios
LANG=en_US.UTF-8 pod install
cd ..
```

#### Xcode에서 설정:
1. `ios/RootFundApp.xcworkspace` 열기
2. **Capabilities** 탭에서:
   - Push Notifications 활성화
   - Background Modes 활성화
     - Remote notifications 체크

#### APNs 인증 키 업로드 (Firebase Console):
1. Apple Developer 센터에서 APNs 인증 키 생성
2. Firebase Console → 프로젝트 설정 → Cloud Messaging
3. APNs 인증 키 업로드

### 4. 앱 실행 및 테스트

#### 앱 실행:
```bash
# iOS
npm run ios

# Android
npm run android
```

#### FCM 토큰 확인:
앱을 실행하면 콘솔에 FCM 토큰이 출력됩니다:
```
📱 FCM 토큰: ey...토큰값...
```

이 토큰을 복사해서 백엔드 테스트에 사용하세요!

### 5. 백엔드 구현 (MySQL)

#### 데이터베이스 테이블:
```sql
CREATE TABLE member_fcm_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  member_id VARCHAR(50) NOT NULL,
  fcm_token TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_member (member_id),
  INDEX idx_member_id (member_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### API 엔드포인트:
**POST** `/member/save_fcm_token.json`

```java
// Spring Controller 예제
@PostMapping("/member/save_fcm_token.json")
@ResponseBody
public Map<String, Object> saveFcmToken(
    @RequestParam("fcm_token") String fcmToken,
    HttpSession session
) {
    Map<String, Object> result = new HashMap<>();
    
    try {
        // 세션에서 사용자 ID 가져오기
        String memberId = (String) session.getAttribute("member_id");
        
        if (memberId == null) {
            result.put("rtnvalue", "0");
            result.put("message", "로그인이 필요합니다");
            return result;
        }
        
        // DB에 토큰 저장 (기존 토큰 업데이트)
        memberService.saveFcmToken(memberId, fcmToken);
        
        result.put("rtnvalue", "1");
        result.put("message", "FCM 토큰 저장 성공");
    } catch (Exception e) {
        result.put("rtnvalue", "0");
        result.put("message", "토큰 저장 실패: " + e.getMessage());
    }
    
    return result;
}
```

#### Service/DAO:
```java
public void saveFcmToken(String memberId, String fcmToken) {
    String sql = "INSERT INTO member_fcm_tokens (member_id, fcm_token, updated_at) " +
                 "VALUES (?, ?, NOW()) " +
                 "ON DUPLICATE KEY UPDATE fcm_token = ?, updated_at = NOW()";
    
    jdbcTemplate.update(sql, memberId, fcmToken, fcmToken);
}
```

### 6. 푸시 알림 발송 (백엔드)

백엔드 구현 방법은 `BACKEND_PUSH_NOTIFICATION.md` 파일 참고!

#### 간단한 테스트:
Firebase Console → Cloud Messaging → "첫 번째 캠페인 만들기"에서
앱에서 받은 FCM 토큰으로 테스트 메시지 전송 가능!

## 📝 중요 파일

### 앱 (이미 완료):
- `src/services/pushNotification.js` - 푸시 알림 서비스
- `src/services/api.js` - FCM 토큰 저장 API 추가됨
- `App.js` - 푸시 알림 자동 초기화
- `index.js` - 백그라운드 메시지 핸들러

### Firebase 설정 파일 (추가 필요):
- `android/app/google-services.json` ← Firebase Console에서 다운로드
- `ios/GoogleService-Info.plist` ← Firebase Console에서 다운로드

## 🎯 동작 흐름

```
1. 앱 실행
   ↓
2. 푸시 알림 권한 요청
   ↓
3. FCM 토큰 생성
   ↓
4. 서버에 FCM 토큰 전송 (/member/save_fcm_token.json)
   ↓
5. 서버: MySQL에 토큰 저장
   ↓
6. 이벤트 발생 (예: 새 상품)
   ↓
7. 서버: Firebase에 푸시 발송 요청
   ↓
8. Firebase → 사용자 디바이스
   ↓
9. 앱: 알림 수신 및 표시
```

## 🧪 테스트 방법

### 1단계: FCM 토큰 확인
- 앱 실행 후 콘솔에서 토큰 복사

### 2단계: Firebase Console 테스트
1. Firebase Console → Cloud Messaging
2. "첫 번째 캠페인 만들기"
3. 테스트 메시지 전송
4. FCM 토큰 입력

### 3단계: 백엔드 구현 후
- 새 상품 등록 시 자동 알림
- 상환 완료 시 자동 알림
- 공지사항 발송 시 자동 알림

## ⚠️ 주의사항

### iOS:
- **실제 디바이스 필요** (시뮬레이터에서는 푸시 알림 안됨)
- APNs 인증 키 필수

### Android:
- `google-services.json` 파일 위치 확인
- 패키지 이름 일치 확인

## 📞 문제 해결

### FCM 토큰이 안 나올 때:
1. Firebase 설정 파일 확인
2. 앱 재시작
3. 네트워크 연결 확인

### 알림이 안 올 때:
1. 권한 승인 확인
2. Firebase 프로젝트 설정 확인
3. 백엔드 API 확인

---

**앱 올리고 백엔드 구현 후 바로 테스트 가능합니다!** 🚀
