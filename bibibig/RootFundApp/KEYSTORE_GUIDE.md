# Keystore 서명 키 문제 해결 가이드

## 문제 상황
Google Play Console에서 기대하는 서명 키:
- SHA1: `FD:F4:FA:B1:B6:CC:99:CD:2E:E5:F9:E7:0E:E4:71:8B:AB:53:E3:03`

현재 생성한 keystore의 서명 키:
- SHA1: `61:90:97:A8:79:BF:F1:CA:20:68:5A:33:06:8A:F4:C2:4E:4F:8A:52`

## 해결 방법

### 방법 1: 기존 keystore 파일 찾기 (권장)

이전에 앱을 업로드할 때 사용했던 keystore 파일을 찾아야 합니다.

**확인할 위치:**
- 프로젝트 폴더 내 다른 위치
- 백업 폴더
- 다른 컴퓨터
- 이전 개발자가 사용한 keystore

**keystore 파일 찾기:**
```bash
# 전체 시스템에서 검색 (시간이 걸릴 수 있음)
find ~ -name "*.keystore" -o -name "*.jks" 2>/dev/null
```

### 방법 2: Google Play Console에서 업로드 키 확인

1. Google Play Console 접속
2. 앱 선택
3. **"릴리스" → "프로덕션" → "설정"**
4. **"앱 서명"** 메뉴 클릭
5. **"업로드 키 인증서"** 섹션 확인
   - 여기서 등록된 키의 정보와 SHA1 fingerprint 확인 가능

### 방법 3: Google Play App Signing 사용

Google Play App Signing을 사용 중이라면:
1. Google Play Console → **"앱 서명"** 메뉴
2. **"업로드 키 인증서 업데이트"** 선택
3. 새 keystore의 인증서를 업로드
   - 방법: `keytool -export -rfc -keystore rootfund-release-key.keystore -alias rootfund-key-alias -file upload_certificate.pem`
4. Google Play에 인증서 업로드

### 방법 4: 새 앱으로 등록 (마지막 수단)

만약 기존 keystore를 찾을 수 없다면:
- 새 앱으로 등록해야 합니다 (기존 앱은 업데이트 불가)
- 새로운 앱 ID로 등록
- Bundle ID 변경 필요

## 현재 keystore 정보

**위치:** `android/app/rootfund-release-key.keystore`
**Alias:** `rootfund-key-alias`
**비밀번호:** `rootfund2024`

## 다음 단계

1. 기존 keystore 파일을 찾았는지 확인
2. 찾았다면 해당 파일을 사용하도록 설정 변경
3. 찾지 못했다면 Google Play Console에서 업로드 키 업데이트

