# Google Play Console 계정 설정 문제 해결

## 오류 메시지
"There are issues with your account which mean you can't publish changes to your app or send changes for review"

이 오류는 **계정 설정이 완료되지 않았거나 개발자 등록이 완료되지 않았다**는 의미입니다.

## 해결 방법

### 1단계: 개발자 등록비 결제 확인

**Google Play Console에서 확인:**
1. https://play.google.com/console 접속
2. 왼쪽 상단 메뉴 (☰) 클릭
3. **"결제 설정"** 또는 **"계정 세부정보"** 메뉴 확인
4. 개발자 등록비 **$25 (약 33,000원)** 결제 상태 확인

**결제가 안 되어 있다면:**
- 결제 수단 추가 (신용카드, 체크카드)
- 개발자 등록비 결제 진행
- 결제 완료 후 24시간 내에 계정 활성화

### 2단계: 신원 확인 및 문서 승인 (우선순위 높음!)

**⚠️ 중요: 전화번호 확인 전에 먼저 완료해야 합니다!**

**필수 확인 작업:**
1. **신원 확인 (Identity Verification):**
   - Google Play Console 홈페이지에서 확인
   - 신분증 또는 여권 업로드
   - Google이 문서 승인까지 처리 (보통 1-3일 소요)

2. **문서 승인 대기:**
   - 신원 확인 문서 제출 후 Google 승인 대기
   - 승인 완료 전까지 다른 확인 작업 진행 불가

3. **확인 순서:**
   ```
   1단계: 신원 확인 문서 제출 ✅ (먼저!)
   2단계: Google 문서 승인 대기 ⏳
   3단계: 문서 승인 완료 후 ✅
   4단계: 전화번호 확인 ✅
   5단계: 결제 정보 등록 ✅
   ```

### 3단계: 개발자 계정 정보 완성

**확인할 항목:**
1. **개인정보:**
   - 이름, 주소, 전화번호 등 기본 정보
   - 프로필 사진 (선택사항)

2. **결제 정보:**
   - 결제 수단 등록
   - 세금 정보 (필요시)

3. **개발자 계약:**
   - 개발자 배포 계약 동의
   - Google Play 정책 동의

### 4단계: 계정 상태 확인

**확인 경로:**
1. Google Play Console 접속
2. 왼쪽 사이드바에서 **"계정 세부정보"** 또는 **"설정"** 클릭
3. **"계정 상태"** 또는 **"알림"** 섹션 확인
4. 미완료 항목이나 경고 메시지 확인

### 5단계: 신원 확인 및 문서 승인 방법 (정확한 메뉴 경로)

**방법 1: 홈페이지에서 확인 (가장 쉬운 방법)**
1. Google Play Console 접속: https://play.google.com/console
2. 대시보드 홈페이지 접속
3. 상단 또는 중앙에 **"확인 작업"** 또는 **"Verification tasks"** 섹션 확인
   - 빨간색 또는 노란색 경고 아이콘 표시
   - "신원 확인 필요" 또는 "Identity verification required" 메시지
4. 해당 섹션 클릭 → 신원 확인 페이지로 이동

**방법 2: 설정 메뉴에서 확인**
1. Google Play Console 접속: https://play.google.com/console
2. 왼쪽 사이드바에서 **"설정"** (⚙️ Settings) 클릭
3. **"계정 세부정보"** (Account details) 클릭
4. **"확인"** (Verification) 탭 클릭
5. **"신원 확인"** (Identity verification) 섹션에서 시작

**방법 3: 계정 세부정보에서 직접**
1. Google Play Console 접속: https://play.google.com/console
2. 왼쪽 사이드바에서 **"계정 세부정보"** (Account details) 클릭
3. **"확인"** (Verification) 탭 클릭
4. **"신원 확인"** (Identity verification) 섹션 확인
   - "시작" 또는 "Start verification" 버튼 클릭

**정확한 메뉴 경로:**
```
Google Play Console
└── 왼쪽 사이드바
    ├── 📊 대시보드 (Dashboard) ← 여기서 확인 작업 섹션 확인
    └── ⚙️ 설정 (Settings)
        └── 계정 세부정보 (Account details)
            └── 확인 (Verification) 탭
                └── 신원 확인 (Identity verification)
```

**한국어/영어 메뉴명:**
- **한국어:** 설정 → 계정 세부정보 → 확인 → 신원 확인
- **영어:** Settings → Account details → Verification → Identity verification

**3. 신원 확인 문서 제출:**
   - 필요한 문서:
     * 신분증 (주민등록증, 운전면허증)
     * 또는 여권
   - 문서 업로드:
     * 앞면, 뒷면 모두 촬영
     * 선명하고 전체가 보이도록 촬영
     * 파일 형식: JPG, PNG, PDF

**4. 제출 후 대기:**
   - Google 검토 기간: 보통 1-3일
   - 승인 완료 시 이메일 알림 발송
   - 승인 전까지 다른 확인 작업 진행 불가

**5. 승인 완료 후:**
   - 전화번호 확인 진행
   - 결제 정보 등록
   - 개발자 등록비 결제

### 6단계: 일반적인 문제들

**문제 1: 개발자 등록비 미결제**
- ✅ 해결: 결제 수단 추가 후 $25 결제

**문제 2: 개발자 계약 미완료**
- ✅ 해결: 계약서 읽고 동의

**문제 3: 결제 정보 누락**
- ✅ 해결: 결제 수단 추가

**문제 4: 계정 정보 미완성**
- ✅ 해결: 프로필 정보 모두 입력

**문제 5: 정책 위반으로 인한 계정 제한**
- ✅ 해결: Google Play Console의 알림 확인 및 조치

### 7단계: 확인 방법

**계정 상태 확인:**
1. Google Play Console 대시보드 접속
2. 상단에 경고 메시지나 알림 확인
3. 빨간색 또는 노란색 경고 아이콘 클릭
4. 미완료 항목 확인 및 완료

**앱 업로드 가능 여부:**
- 계정 문제가 해결되면 "프로덕션" 메뉴가 활성화됩니다
- AAB 파일 업로드가 가능해집니다

## 중요 사항

**⚠️ 개발자 등록비:**
- $25 (일회성, 평생 유효)
- 결제 완료 후 24시간 내 계정 활성화
- 환불 불가 (주의!)

**⚠️ 계정 정보:**
- 정확한 정보 입력 필요
- 나중에 변경 가능하지만 복잡할 수 있음

## 현재 상황별 해결 방법

### 현재 상황: "조직 계정 설정 완료" (Organization Account)

**받은 메시지:**
- ✅ Verify your organization's website (조직 웹사이트 확인)
- ⏳ Verify your phone numbers (전화번호 확인 - 다른 작업 완료 후)

**⚠️ 확인 작업 순서 (반드시 순서대로!):**
```
1단계: 신원 확인 (Identity Verification) ✅
   └── 신분증/여권 업로드 → Google 승인 대기 (1-3일)

2단계: 조직 확인 (Organization Verification) ✅
   └── 조직 문서 업로드 → Google 승인 대기 (1-3일)

3단계: 조직 웹사이트 확인 (Organization Website Verification) ✅
   └── 웹사이트 소유권 확인

4단계: 전화번호 확인 (Phone Number Verification) ✅
   └── 위 모든 작업 완료 후 가능
```

### 1단계: 신원 확인 (Identity Verification)

**메뉴 경로:**
```
설정 (Settings) 
→ 계정 세부정보 (Account details) 
→ 확인 (Verification) 탭
→ 신원 확인 (Identity verification)
```

**작업:**
1. 신분증 또는 여권 업로드
2. Google 승인 대기 (1-3일)

### 2단계: 조직 확인 (Organization Verification)

**메뉴 경로:**
```
설정 (Settings)
→ 계정 세부정보 (Account details)
→ 확인 (Verification) 탭
→ 조직 확인 (Organization verification)
```

**작업:**
1. 조직 문서 업로드 (사업자등록증, 법인등기부등본 등)
2. Google 승인 대기 (1-3일)

### 3단계: 조직 웹사이트 확인 (Organization Website Verification)

**메뉴 경로:**
```
설정 (Settings)
→ 계정 세부정보 (Account details)
→ 확인 (Verification) 탭
→ 조직 웹사이트 확인 (Verify your organization's website)
```

**작업 방법:**
1. **방법 1: HTML 파일 업로드**
   - Google이 제공하는 HTML 파일 다운로드
   - 웹사이트의 루트 디렉토리에 업로드
   - 예: `https://yourdomain.com/google1234567890.html`
   - Google이 확인 후 자동으로 검증 완료

2. **방법 2: DNS 레코드 추가**
   - Google이 제공하는 TXT 레코드 복사
   - 웹사이트 DNS 설정에 TXT 레코드 추가
   - Google이 확인 후 자동으로 검증 완료

3. **방법 3: Google Analytics 또는 Google Tag Manager**
   - 웹사이트에 Google Analytics 또는 GTM이 연결되어 있다면
   - 자동으로 확인 가능

**필요한 정보:**
- 조직의 공식 웹사이트 URL
- 웹사이트 관리자 접근 권한 (HTML 파일 업로드 또는 DNS 설정 가능)

### 4단계: 전화번호 확인 (Phone Number Verification)

**⚠️ 전제 조건:**
- 신원 확인 완료 ✅
- 조직 확인 완료 ✅
- 조직 웹사이트 확인 완료 ✅

**메뉴 경로:**
```
설정 (Settings)
→ 계정 세부정보 (Account details)
→ 확인 (Verification) 탭
→ 전화번호 확인 (Verify your phone numbers)
```

**작업:**
1. 전화번호 입력
2. SMS 또는 전화로 인증 코드 받기
3. 인증 코드 입력

**⚠️ 중요:**
- 신원 확인 문서가 승인되기 전까지는 전화번호 확인을 할 수 없습니다
- 조직 확인 및 웹사이트 확인도 완료되어야 합니다
- 문서 승인은 보통 1-3일이 소요됩니다
- 승인 완료 후 이메일 알림을 받게 됩니다

## 다음 단계 (조직 계정)

**현재 진행 순서:**
1. ✅ **신원 확인 문서 제출**
   - 설정 → 계정 세부정보 → 확인 → 신원 확인
   - 신분증/여권 업로드
   - ⏳ Google 승인 대기 (1-3일)

2. ✅ **조직 확인 문서 제출** (신원 확인과 동시에 가능)
   - 설정 → 계정 세부정보 → 확인 → 조직 확인
   - 사업자등록증/법인등기부등본 업로드
   - ⏳ Google 승인 대기 (1-3일)

3. ✅ **조직 웹사이트 확인** (신원/조직 확인 완료 후)
   - 설정 → 계정 세부정보 → 확인 → 조직 웹사이트 확인
   - HTML 파일 업로드 또는 DNS 레코드 추가
   - 즉시 확인 가능 (수동 확인)

4. ✅ **전화번호 확인** (위 모든 작업 완료 후)
   - 설정 → 계정 세부정보 → 확인 → 전화번호 확인
   - SMS 인증 코드 입력

5. ✅ **개발자 등록비 결제** ($25)
6. ✅ **계정 활성화 후 AAB 업로드**

**⚠️ 중요:**
- 조직 웹사이트 확인은 신원 확인과 조직 확인이 완료된 후 가능합니다
- 전화번호 확인은 모든 확인 작업이 완료된 후 가능합니다
- 각 단계의 승인은 보통 1-3일이 소요됩니다

계정 문제가 해결되면 이전 keystore 문제도 해결할 수 있습니다!

