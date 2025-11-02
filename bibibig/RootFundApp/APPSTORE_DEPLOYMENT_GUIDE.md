# App Store 배포 가이드

## 📋 사전 준비사항

### 1. Apple Developer 계정
- [Apple Developer Program](https://developer.apple.com/programs/) 가입 필요
- 연간 $99 (USD) 구독료
- Apple ID로 로그인 후 가입

### 2. App Store Connect 설정
1. [App Store Connect](https://appstoreconnect.apple.com) 접속
2. "내 App" → "+" 클릭 → 새 App 생성
3. 앱 정보 입력:
   - **이름**: RootFundApp (또는 원하는 이름)
   - **기본 언어**: 한국어
   - **번들 ID**: `org.reactjs.native.example.RootFundApp` (또는 새로 생성)
   - **SKU**: 고유 식별자 (예: rootfundapp-001)

## 🔧 Xcode 프로젝트 설정

### 1. 번들 ID 확인/변경
1. Xcode에서 `RootFundApp.xcworkspace` 열기
2. 프로젝트 네비게이터에서 **RootFundApp** 선택
3. **Targets** → **RootFundApp** 선택
4. **General** 탭 → **Bundle Identifier** 확인/변경
   - 기본값: `org.reactjs.native.example.RootFundApp`
   - App Store Connect에 등록한 번들 ID와 일치해야 함

### 2. 버전 정보 설정
1. **General** 탭에서:
   - **Version**: `1.0.0` (사용자에게 표시되는 버전)
   - **Build**: `1` (내부 빌드 번호, 업로드마다 증가)

### 3. Signing & Capabilities 설정
1. **Signing & Capabilities** 탭 선택
2. **Automatically manage signing** 체크
3. **Team** 선택 (Apple Developer 계정)
4. Xcode가 자동으로 프로비저닝 프로파일 생성

## 🏗️ Archive 빌드 생성

### 방법 1: Xcode GUI 사용 (권장)

1. **Xcode에서 프로젝트 열기**
   ```bash
   open ios/RootFundApp.xcworkspace
   ```

2. **빌드 스킴 변경**
   - 상단 툴바에서 스킴을 **RootFundApp** → **Any iOS Device** 선택
   - 또는 **Product** → **Destination** → **Any iOS Device**

3. **Archive 생성**
   - **Product** → **Archive** (⌘ + B 후 ⌘ + Shift + B)
   - 빌드 완료 후 자동으로 Organizer 창 열림

4. **Archive 확인**
   - **Window** → **Organizer** (⌘ + Shift + 9)
   - 생성된 Archive 확인

### 방법 2: 명령어 사용

```bash
cd ios

# Release 설정으로 Archive 생성
xcodebuild -workspace RootFundApp.xcworkspace \
  -scheme RootFundApp \
  -configuration Release \
  -archivePath ../build/RootFundApp.xcarchive \
  archive
```

## 📤 App Store Connect에 업로드

### 방법 1: Xcode Organizer 사용 (권장)

1. **Organizer 창 열기**
   - **Window** → **Organizer** (⌘ + Shift + 9)

2. **Archive 선택**
   - 방금 생성한 Archive 선택
   - **Distribute App** 클릭

3. **배포 방식 선택**
   - **App Store Connect** 선택
   - **Next** 클릭

4. **배포 옵션**
   - **Upload** 선택 (직접 제출)
   - **Next** 클릭

5. **서명 옵션**
   - **Automatically manage signing** 선택
   - **Next** 클릭

6. **최종 확인**
   - 빌드 정보 확인
   - **Upload** 클릭
   - 업로드 진행 상황 확인

### 방법 2: 명령어 사용 (xcrun altool)

```bash
# Archive에서 IPA 추출
xcodebuild -exportArchive \
  -archivePath build/RootFundApp.xcarchive \
  -exportOptionsPlist ExportOptions.plist \
  -exportPath build/export

# App Store Connect에 업로드
xcrun altool --upload-app \
  --type ios \
  --file "build/export/RootFundApp.ipa" \
  --username "your-apple-id@example.com" \
  --password "@keychain:Application Loader"
```

## 📝 App Store Connect에서 심사 제출

1. **App Store Connect 접속**
   - [appstoreconnect.apple.com](https://appstoreconnect.apple.com)

2. **앱 정보 입력**
   - 스크린샷 (다양한 기기 크기)
   - 앱 설명
   - 키워드
   - 카테고리
   - 연령 등급
   - 개인정보 보호 정책 URL

3. **빌드 선택**
   - 업로드된 빌드가 나타날 때까지 대기 (보통 10-30분)
   - **빌드** 섹션에서 업로드된 빌드 선택

4. **심사 정보 입력**
   - 연락처 정보
   - 심사 노트
   - 데모 계정 (필요한 경우)

5. **심사 제출**
   - 모든 필수 정보 입력 확인
   - **제출** 버튼 클릭

## 🔍 빌드 및 업로드 스크립트

### ExportOptions.plist 생성

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store</string>
    <key>teamID</key>
    <string>YOUR_TEAM_ID</string>
    <key>uploadBitcode</key>
    <false/>
    <key>uploadSymbols</key>
    <true/>
    <key>compileBitcode</key>
    <false/>
    <key>signingStyle</key>
    <string>automatic</string>
</dict>
</plist>
```

### 자동화 스크립트 (deploy.sh)

```bash
#!/bin/bash

# 프로젝트 경로
PROJECT_DIR="/Users/youngranlee/bibibig/RootFundApp"
cd "$PROJECT_DIR/ios"

# Archive 생성
xcodebuild -workspace RootFundApp.xcworkspace \
  -scheme RootFundApp \
  -configuration Release \
  -archivePath ../build/RootFundApp.xcarchive \
  archive

# App Store Connect에 업로드
xcodebuild -exportArchive \
  -archivePath ../build/RootFundApp.xcarchive \
  -exportOptionsPlist ExportOptions.plist \
  -exportPath ../build/export

echo "✅ 빌드 및 업로드 완료!"
echo "📦 IPA 파일: build/export/RootFundApp.ipa"
```

## ⚠️ 주의사항

1. **번들 ID 변경 시**
   - App Store Connect에 등록된 번들 ID와 일치해야 함
   - 변경 시 App Store Connect에서도 업데이트 필요

2. **버전 관리**
   - 업로드할 때마다 **Build** 번호 증가 필요
   - 같은 Build 번호로는 업로드 불가

3. **서명**
   - Distribution 인증서 필요
   - Xcode가 자동으로 관리하거나 수동 설정 가능

4. **심사 시간**
   - 일반적으로 1-3일 소요
   - 첫 배포는 더 오래 걸릴 수 있음

## 🔗 유용한 링크

- [App Store Connect](https://appstoreconnect.apple.com)
- [Apple Developer](https://developer.apple.com)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [TestFlight](https://developer.apple.com/testflight/)

## 📞 문제 해결

### 업로드 실패 시
1. Xcode 로그 확인
2. 인증서 및 프로비저닝 프로파일 재생성
3. Archive 다시 생성

### 심사 거절 시
1. 거절 이유 확인
2. App Store Connect에서 문제 수정
3. 새 빌드 업로드 후 재제출

