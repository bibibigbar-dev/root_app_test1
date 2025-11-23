# 루트펀드 앱 딥링크 가이드

## 개요
외부 URL을 통해 루트펀드 앱의 특정 화면으로 직접 이동할 수 있습니다.

## 딥링크 URL 형식

### 1. 커스텀 스킴 (rootfund://)
```
rootfund://withdrawal
```

### 2. 웹 URL (https://rootenergy.co.kr)
```
https://rootenergy.co.kr/withdrawal
http://rootenergy.co.kr/withdrawal
```

## 주요 화면 딥링크

### 출금 신청 화면 ⭐
- `rootfund://withdrawal`
- `https://rootenergy.co.kr/withdrawal`
- **주의**: 로그인이 안 되어 있으면 자동으로 출금 전용 로그인 화면으로 이동합니다.

### 출금 전용 로그인 화면
- `rootfund://withdrawal-login`
- `https://rootenergy.co.kr/withdrawal-login`
- 출금 신청 화면 접근을 위한 전용 로그인 화면입니다.

### 메인 화면
- `rootfund://main`
- `https://rootenergy.co.kr/main`

### 로그인 화면
- `rootfund://login`
- `https://rootenergy.co.kr/login`

### 마이페이지
- `rootfund://mypage`
- `https://rootenergy.co.kr/mypage`

### 상품 목록
- `rootfund://products`
- `https://rootenergy.co.kr/products`

### 상품 상세 (파라미터 포함)
- `rootfund://product/12345`
- `https://rootenergy.co.kr/product/12345`

### 투자 신청 (파라미터 포함)
- `rootfund://invest-request/12345`
- `https://rootenergy.co.kr/invest-request/12345`

### 프로모션
- `rootfund://promotion`
- `https://rootenergy.co.kr/promotion`

### 프로모션 상세 (파라미터 포함)
- `rootfund://promotion/1`
- `https://rootenergy.co.kr/promotion/1`

### 고객센터
- `rootfund://customer-service`
- `https://rootenergy.co.kr/customer-service`

### 회사 소개
- `rootfund://company-intro`
- `https://rootenergy.co.kr/company-intro`

### 채권거래소
- `rootfund://bond-market`
- `https://rootenergy.co.kr/bond-market`

---

## 로컬 개발 환경에서 테스트 방법 🧪

### 방법 1: ADB를 통한 Android 테스트 (추천)

#### 1-1. 실제 기기 연결
```bash
# 기기가 연결되었는지 확인
adb devices

# 출금 신청 화면으로 이동 (커스텀 스킴)
adb shell am start -W -a android.intent.action.VIEW -d "rootfund://withdrawal"

# 출금 신청 화면으로 이동 (웹 URL)
adb shell am start -W -a android.intent.action.VIEW -d "https://rootenergy.co.kr/withdrawal"

# 다른 화면들도 테스트
adb shell am start -W -a android.intent.action.VIEW -d "rootfund://main"
adb shell am start -W -a android.intent.action.VIEW -d "rootfund://withdrawal-login"
```

#### 1-2. Android 에뮬레이터 사용
```bash
# 에뮬레이터 실행 후
adb shell am start -W -a android.intent.action.VIEW -d "rootfund://withdrawal"
```

### 방법 2: iOS 시뮬레이터 테스트

#### 2-1. 터미널에서 시뮬레이터 제어
```bash
# 시뮬레이터에서 딥링크 열기
xcrun simctl openurl booted "rootfund://withdrawal"

# 웹 URL로 테스트
xcrun simctl openurl booted "https://rootenergy.co.kr/withdrawal"

# 다른 화면들도 테스트
xcrun simctl openurl booted "rootfund://main"
xcrun simctl openurl booted "rootfund://withdrawal-login"
```

#### 2-2. 실제 iOS 기기 테스트
1. Safari 브라우저 열기
2. 주소창에 `rootfund://withdrawal` 입력
3. 이동 버튼 클릭
4. "루트펀드 열기" 팝업에서 확인

### 방법 3: HTML 테스트 페이지 생성

로컬 개발 환경에서 간단한 HTML 파일을 만들어 테스트할 수 있습니다.

#### test-deeplink.html 생성
```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>루트펀드 딥링크 테스트</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            padding: 20px;
            max-width: 600px;
            margin: 0 auto;
        }
        h1 {
            color: #007AFF;
        }
        .button {
            display: block;
            padding: 15px 20px;
            margin: 10px 0;
            background-color: #007AFF;
            color: white;
            text-decoration: none;
            border-radius: 8px;
            text-align: center;
            font-weight: bold;
        }
        .button:hover {
            background-color: #0056b3;
        }
        .section {
            margin-top: 30px;
        }
    </style>
</head>
<body>
    <h1>🔗 루트펀드 딥링크 테스트</h1>
    
    <div class="section">
        <h2>커스텀 스킴 (rootfund://)</h2>
        <a href="rootfund://withdrawal" class="button">출금 신청 화면</a>
        <a href="rootfund://withdrawal-login" class="button">출금 로그인 화면</a>
        <a href="rootfund://main" class="button">메인 화면</a>
        <a href="rootfund://mypage" class="button">마이페이지</a>
        <a href="rootfund://products" class="button">상품 목록</a>
    </div>
    
    <div class="section">
        <h2>웹 URL (https://rootenergy.co.kr)</h2>
        <a href="https://rootenergy.co.kr/withdrawal" class="button">출금 신청 (HTTPS)</a>
        <a href="https://rootenergy.co.kr/withdrawal-login" class="button">출금 로그인 (HTTPS)</a>
        <a href="https://rootenergy.co.kr/main" class="button">메인 (HTTPS)</a>
    </div>

    <div class="section">
        <h2>JavaScript 테스트</h2>
        <button class="button" onclick="openDeepLink()">JavaScript로 딥링크 열기</button>
    </div>

    <script>
        function openDeepLink() {
            // 앱 실행 시도
            window.location.href = 'rootfund://withdrawal';
            
            // 1초 후 앱이 실행되지 않으면 알림
            setTimeout(() => {
                alert('앱이 설치되어 있지 않거나 열리지 않았습니다.');
            }, 1000);
        }
    </script>
</body>
</html>
```

#### 사용 방법:
1. 위 HTML 파일을 프로젝트 폴더에 `test-deeplink.html`로 저장
2. 로컬 서버 실행:
```bash
# Python 3이 설치되어 있다면
python3 -m http.server 8000

# 또는 Node.js의 http-server가 설치되어 있다면
npx http-server -p 8000
```
3. 모바일 기기의 브라우저에서 접속:
   - 같은 Wi-Fi 네트워크에 연결
   - `http://[컴퓨터IP]:8000/test-deeplink.html` 접속
   - 버튼 클릭하여 딥링크 테스트

### 방법 4: React Native Dev Menu에서 테스트

```javascript
// App.js 또는 테스트하고 싶은 컴포넌트에 추가
import { Linking } from 'react-native';

// 개발 중 테스트 버튼 추가
<TouchableOpacity onPress={() => Linking.openURL('rootfund://withdrawal')}>
  <Text>딥링크 테스트</Text>
</TouchableOpacity>
```

### 방법 5: QR 코드 생성

온라인 QR 코드 생성기를 사용하여 딥링크 URL을 QR 코드로 만들고 스캔하여 테스트:

1. https://www.qr-code-generator.com/ 접속
2. URL에 `rootfund://withdrawal` 입력
3. QR 코드 생성
4. 모바일 카메라로 스캔
5. 앱이 자동으로 열리는지 확인

---

## 사용 예시

### 1. 웹사이트에서 앱으로 연결
```html
<a href="rootfund://withdrawal">출금 신청하기</a>
```

### 2. 이메일에서 앱으로 연결
```
출금을 원하시면 아래 링크를 클릭하세요:
https://rootenergy.co.kr/withdrawal
```

### 3. SMS/카카오톡에서 앱으로 연결
```
루트펀드 출금 신청: https://rootenergy.co.kr/withdrawal
```

### 4. JavaScript에서 딥링크 실행
```javascript
// 앱이 설치되어 있으면 앱 실행, 없으면 웹페이지로 이동
window.location.href = 'rootfund://withdrawal';

// 또는
window.open('https://rootenergy.co.kr/withdrawal', '_blank');
```

### 5. React/Vue 웹앱에서 사용
```javascript
const handleWithdrawalClick = () => {
  // 모바일 환경 감지
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  if (isMobile) {
    // 앱 딥링크 시도
    window.location.href = 'rootfund://withdrawal';
    
    // 1초 후 앱이 실행되지 않으면 웹페이지로 이동
    setTimeout(() => {
      window.location.href = 'https://rootenergy.co.kr/withdrawal';
    }, 1000);
  } else {
    // 데스크톱은 웹페이지로 이동
    window.location.href = 'https://rootenergy.co.kr/withdrawal';
  }
};
```

---

## 주의사항

1. **앱 설치 필요**: 딥링크는 앱이 설치되어 있어야 작동합니다.
2. **iOS Universal Links**: iOS에서 https 링크가 작동하려면 서버에 `apple-app-site-association` 파일이 필요합니다.
3. **Android App Links**: Android에서 https 링크가 작동하려면 서버에 `assetlinks.json` 파일이 필요합니다.
4. **로그인 상태**: 출금 신청 화면은 로그인이 필요하며, 로그인이 안 되어 있으면 자동으로 출금 전용 로그인 화면으로 이동합니다.

---

## Universal Links 설정 (선택사항)

### iOS - apple-app-site-association
서버의 `https://rootenergy.co.kr/.well-known/apple-app-site-association` 파일:
```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAM_ID.co.kr.rootfund.RootFundApp",
        "paths": ["*"]
      }
    ]
  }
}
```

### Android - assetlinks.json
서버의 `https://rootenergy.co.kr/.well-known/assetlinks.json` 파일:
```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "co.kr.rootfund",
    "sha256_cert_fingerprints": ["YOUR_SHA256_FINGERPRINT"]
  }
}]
```

---

## 문제 해결

### 딥링크가 작동하지 않는 경우
1. 앱을 재설치해보세요
2. 기기를 재시작해보세요
3. URL 형식이 정확한지 확인하세요
4. 앱이 최신 버전인지 확인하세요

### Android에서 작동하지 않는 경우
```bash
# 앱 재설치
adb uninstall co.kr.rootfund
adb install app-release.apk

# Intent filter 확인
adb shell dumpsys package co.kr.rootfund
```

### iOS에서 작동하지 않는 경우
- Xcode에서 Clean Build Folder (Cmd + Shift + K)
- 앱 삭제 후 재설치
- 설정 > Safari > 고급 > 실험적 기능에서 Universal Links 활성화 확인

### 로컬 테스트 시 주의사항
- **커스텀 스킴 (`rootfund://`)**: 항상 작동 ✅
- **웹 URL (`https://rootenergy.co.kr`)**: Universal Links 설정이 필요하므로 로컬에서는 작동하지 않을 수 있음 ⚠️
- 로컬 개발 시에는 **커스텀 스킴**을 사용하여 테스트하는 것을 권장합니다.
