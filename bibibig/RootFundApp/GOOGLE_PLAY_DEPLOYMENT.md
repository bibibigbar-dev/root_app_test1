# Google Play Store 배포 가이드

## 📦 생성된 파일

**AAB 파일 위치:**
```
android/app/build/outputs/bundle/release/app-release.aab
```

이 파일을 Google Play Console에 업로드하면 됩니다.

## 🔐 중요 보안 정보

**⚠️ keystore 파일과 비밀번호를 안전하게 보관하세요!**
- `android/app/rootfund-release-key.keystore` - 절대 분실하지 마세요!
- `android/keystore.properties` - 비밀번호가 저장되어 있습니다
- 이 파일들을 잃어버리면 앱 업데이트가 불가능합니다

**백업 권장:**
1. keystore 파일을 안전한 곳에 백업
2. 비밀번호를 안전하게 기록
3. Git에 커밋하지 마세요 (이미 .gitignore에 추가됨)

## 📋 Google Play Console 배포 단계

### 1단계: Google Play Console 계정 생성
1. https://play.google.com/console 접속
2. Google 계정으로 로그인
3. 개발자 등록비 결제 ($25, 일회성)

### 2단계: 앱 생성
1. "앱 만들기" 클릭
2. 앱 이름: "루트펀드"
3. 기본 언어: 한국어
4. 앱 또는 게임: 앱 선택
5. 무료 또는 유료: 선택
6. 개인정보 보호 정책 URL: 제공 (필수)

### 3단계: 프로덕션 트랙에 AAB 업로드

**메뉴 경로:**
1. Google Play Console (https://play.google.com/console) 접속
2. 앱 선택 (또는 새로 생성)
3. 왼쪽 사이드바에서 **"프로덕션"** (Production) 메뉴 클릭
4. **"새 버전 만들기"** (Create new release) 버튼 클릭
5. **"앱 번들 및 APK"** (App bundles and APKs) 섹션에서
   - **"앱 번들 업로드"** (Upload) 또는 **"드래그 앤 드롭"** 영역에 파일 드래그
6. `android/app/build/outputs/bundle/release/app-release.aab` 파일 선택
7. 업로드 완료 후 버전 정보 확인 및 저장

**참고:** 처음 업로드하는 경우 "프로덕션"이 비활성화되어 있을 수 있습니다. 이 경우:
- **"테스트"** (Testing) → **"내부 테스트"** (Internal testing) 또는 **"비공개 테스트"** (Closed testing)에서 먼저 업로드
- 또는 앱 정보와 스토어 등록 정보를 먼저 작성하면 프로덕션이 활성화됩니다

### 4단계: 스토어 등록 정보 작성
**필수 항목:**
- 앱 이름: 루트펀드
- 간단한 설명: (50자 이내)
- 전체 설명: (4000자 이내)
- 스크린샷: 최소 2장 (필수)
  - 휴대전화: 16:9 또는 9:16, 최소 320px
  - 태블릿: 선택사항
- 아이콘: 512x512px PNG (32비트)
- 기능 그래픽: 1024x500px (선택사항)

### 5단계: 콘텐츠 등급 설정
1. "콘텐츠 등급" 메뉴
2. 설문지 작성
3. 등급 확인

### 6단계: 대상 그룹 및 콘텐츠 설정
1. 타겟 연령대 선택
2. 광고 여부 설정
3. 데이터 보안 정보 작성

### 7단계: 앱 출시
1. 모든 필수 항목 완료 확인
2. "앱 출시" 버튼 클릭
3. 검토 완료까지 보통 1-3일 소요

## 🔄 향후 업데이트

**버전 업데이트:**
1. `android/app/build.gradle`에서 `versionCode`와 `versionName` 수정:
   ```gradle
   versionCode 2  // 항상 증가시켜야 함
   versionName "1.1"
   ```

2. 새로운 AAB 빌드:
   ```bash
   cd android && ./gradlew bundleRelease
   ```

3. Google Play Console에서 새 버전 업로드

## 📝 참고사항

- **AAB vs APK**: Google Play Store는 AAB를 권장합니다 (더 작은 파일 크기)
- **테스트**: Internal testing 또는 Closed testing으로 먼저 테스트 권장
- **앱 서명**: Google Play App Signing 사용 권장 (키 분실 시 복구 가능)

## 🚀 빠른 시작

```bash
# Release AAB 빌드
cd android && ./gradlew bundleRelease

# 생성된 파일 확인
ls -lh android/app/build/outputs/bundle/release/app-release.aab
```

이 파일을 Google Play Console에 업로드하세요!

