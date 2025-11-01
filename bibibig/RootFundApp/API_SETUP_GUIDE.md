# API 설정 가이드

## 🚨 404 오류 해결 방법

현재 `Request failed with status code 404` 오류가 발생하고 있습니다. 다음 단계를 따라 해결하세요:

## 1. 서버 주소 확인 및 변경

### 현재 설정
```javascript
// src/services/api.js의 getApiBaseUrl() 함수
return 'http://192.168.1.100:8080'; // 현재 설정된 주소
```

### 해결 방법

#### A. 로컬 네트워크 IP 확인
```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig
```

#### B. API 서버 주소 수정
`src/services/api.js` 파일에서 실제 서버 주소로 변경:

```javascript
getApiBaseUrl() {
  const isDevelopment = __DEV__;
  
  if (isDevelopment) {
    // 실제 서버 주소로 변경하세요
    return 'http://YOUR_ACTUAL_SERVER_IP:8080';
    // 예시:
    // return 'http://192.168.1.50:8080';  // 로컬 서버
    // return 'https://dev-api.yourserver.com';  // 개발 서버
  } else {
    return 'https://api.rootfund.com';  // 프로덕션 서버
  }
}
```

## 2. 개발용 목업 데이터 사용

서버가 준비되지 않은 경우, 목업 데이터로 테스트할 수 있습니다:

### 테스트 계정
- **일반 사용자**: `test@test.com` / `1234`
- **관리자**: `admin@test.com` / `admin123`

### 목업 데이터 특징
- 완전한 세션 데이터 포함
- 잔액, 회원등급 등 실제 데이터 시뮬레이션
- 24시간 세션 만료 설정

## 3. 네트워크 설정 확인

### iOS 시뮬레이터
```bash
# 시뮬레이터에서 localhost 접근
http://localhost:8080  # ❌ 작동하지 않음
http://127.0.0.1:8080  # ❌ 작동하지 않음
http://YOUR_MAC_IP:8080  # ✅ 작동함
```

### Android 에뮬레이터
```bash
# 에뮬레이터에서 localhost 접근
http://10.0.2.2:8080  # Android 에뮬레이터의 호스트 머신
```

## 4. 서버 상태 확인

### 서버 실행 확인
```bash
# 서버가 실행 중인지 확인
curl http://YOUR_SERVER_IP:8080/app/loginProcess
```

### 필요한 API 엔드포인트
- `POST /app/loginProcess` - 로그인
- `GET /app/pulickKey` - 공개키 조회
- `POST /setreqmodes` - 보안 모드 설정
- `POST /app/logout` - 로그아웃

## 5. 개발 환경별 설정

### 개발 서버 사용 시
```javascript
return 'https://dev-api.rootfund.com';
```

### 로컬 서버 사용 시
```javascript
return 'http://192.168.1.XXX:8080';  // 실제 IP로 변경
```

### 목업 데이터만 사용 시
서버 연결 없이 목업 데이터로만 테스트하려면 서버 주소를 잘못된 주소로 설정하면 자동으로 목업 모드로 전환됩니다.

## 6. 문제 해결 체크리스트

- [ ] 서버가 실행 중인가?
- [ ] 방화벽이 포트를 차단하고 있지 않은가?
- [ ] 네트워크 연결이 정상인가?
- [ ] API 엔드포인트가 올바른가?
- [ ] CORS 설정이 되어 있는가?

## 7. 로그 확인

앱 실행 시 콘솔에서 다음 로그를 확인하세요:

```
🌐 API 베이스 URL: http://192.168.1.100:8080
🔍 오류 분석 결과: { isNetworkError: true, ... }
🔧 개발 모드: 목업 데이터로 로그인 시뮬레이션
```

## 8. 즉시 테스트하기

1. 앱을 다시 시작
2. 로그인 화면에서 `test@test.com` / `1234` 입력
3. 목업 데이터로 로그인 성공 확인
4. 출금 화면에서 세션 데이터 표시 확인

이제 서버 연결 없이도 앱의 모든 기능을 테스트할 수 있습니다! 🚀
