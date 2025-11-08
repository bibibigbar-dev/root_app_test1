# 안드로이드 앱 배포 가이드

## 📦 배포 파일 생성 완료

배포용 AAB(Android App Bundle) 파일이 성공적으로 생성되었습니다!

### 생성된 파일 정보
- **파일명**: `app-release.aab`
- **위치**: `android/app/build/outputs/bundle/release/app-release.aab`
- **파일 크기**: 약 38MB
- **버전**: 1.0 (versionCode: 1)

---

## 🚀 Google Play Console 배포 방법

### 1단계: Google Play Console 접속
1. [Google Play Console](https://play.google.com/console) 접속
2. 개발자 계정으로 로그인
3. 앱 선택 (또는 새 앱 만들기)

### 2단계: 새 릴리스 만들기
1. 왼쪽 메뉴에서 **"프로덕션"** 선택
2. **"새 릴리스 만들기"** 버튼 클릭
3. **"App Bundle 업로드"** 클릭

### 3단계: AAB 파일 업로드
1. 다음 파일을 업로드:
   ```
   /Users/youngranlee/bibibig/RootFundApp/android/app/build/outputs/bundle/release/app-release.aab
   ```
2. 업로드 완료 대기

### 4단계: 릴리스 정보 입력
1. **릴리스 이름**: 예) `1.0 - 초기 출시`
2. **출시 노트**: 
   ```
   루트펀드 출금 앱 첫 출시
   - 로그인 기능
   - 출금 신청 기능
   - 사용자 정보 관리
   ```

### 5단계: 검토 및 출시
1. **"검토"** 버튼 클릭
2. 모든 정보 확인
3. **"출시 시작"** 버튼 클릭

---

## ⚠️ 주의사항

### 서명 키 관리
현재 앱은 다음 keystore로 서명되어 있습니다:
- **Keystore 파일**: `android/app/rootfund-release-key.keystore`
- **Alias**: `rootfund-key-alias`
- **비밀번호**: `rootfund2024`

**⚠️ 중요**: 이 keystore 파일을 안전하게 백업하세요!
- keystore를 잃어버리면 앱 업데이트를 할 수 없습니다
- 비밀번호를 잊어버리면 앱을 다시 출시해야 합니다

### 버전 관리
앱을 업데이트할 때는 `android/app/build.gradle` 파일에서 버전을 올려야 합니다:

```gradle
defaultConfig {
    applicationId "com.rootfundapp"
    versionCode 2        // 이 숫자를 1씩 증가
    versionName "1.1"    // 사용자에게 보이는 버전
}
```

---

## 🔄 앱 업데이트 방법

### 1. 코드 수정 후 새 AAB 생성
```bash
cd android
./gradlew bundleRelease
```

### 2. 버전 코드 증가
`android/app/build.gradle`에서 `versionCode`를 증가시키세요.

### 3. Google Play Console에서 업데이트
1. **"프로덕션"** > **"새 릴리스 만들기"**
2. 새로운 AAB 파일 업로드
3. 출시 노트 작성
4. 검토 및 출시

---

## 📱 테스트 배포 (내부 테스트)

프로덕션 출시 전에 내부 테스트를 권장합니다:

1. Google Play Console에서 **"내부 테스트"** 선택
2. 새 릴리스 만들기
3. AAB 파일 업로드
4. 테스터 이메일 추가
5. 테스터에게 테스트 링크 전송

---

## 🔍 문제 해결

### "서명 키가 일치하지 않습니다" 오류
- 이전에 다른 keystore로 업로드한 경우 발생
- 해결: 원래 keystore 파일 사용 또는 Google Play Console에서 업로드 키 재설정

### "버전 코드가 이미 존재합니다" 오류
- `versionCode`를 증가시키지 않은 경우 발생
- 해결: `build.gradle`에서 `versionCode` 증가

### AAB 파일 크기가 너무 큼
- 현재 38MB로 적절한 크기입니다
- 필요시 ProGuard 활성화로 크기 감소 가능

---

## 📞 지원

배포 중 문제가 발생하면:
1. [Google Play Console 고객센터](https://support.google.com/googleplay/android-developer)
2. [React Native 배포 가이드](https://reactnative.dev/docs/signed-apk-android)

---

## ✅ 체크리스트

배포 전 확인사항:
- [ ] keystore 파일 백업 완료
- [ ] 앱 아이콘 설정 완료
- [ ] 앱 이름 확인 (루트펀드)
- [ ] 런처 스크린 확인
- [ ] 모든 기능 테스트 완료
- [ ] 버전 정보 확인
- [ ] 개인정보처리방침 준비
- [ ] 스크린샷 준비 (최소 2개)
- [ ] 앱 설명 작성

