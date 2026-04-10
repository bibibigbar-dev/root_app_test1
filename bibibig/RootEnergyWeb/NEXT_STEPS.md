# 루트에너지 홈페이지 - 다음 단계 가이드

프로젝트 기본 구조와 파일들이 생성되었습니다. 다음 단계를 진행해주세요.

## 1. 의존성 설치

터미널에서 다음 명령어를 실행하여 필요한 패키지를 설치하세요:

```bash
npm install
```

## 2. Firebase 프로젝트 설정

### Firebase Console에서 작업
1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. 프로젝트 설정 > 일반 > 내 앱에서 웹 앱 추가
4. Firebase SDK 설정 정보 복사

### Firestore Database 설정
1. Firebase Console > Firestore Database
2. 데이터베이스 만들기 (테스트 모드로 시작)
3. 다음 컬렉션 생성:
   - `boards` (게시판)
   - `popups` (팝업)
   - `visitors` (방문자 통계)
   - `inquiries` (문의)

### Storage 설정
1. Firebase Console > Storage
2. 시작하기 클릭
3. 보안 규칙 설정

### Authentication 설정
1. Firebase Console > Authentication
2. 시작하기 클릭
3. 이메일/비밀번호 로그인 활성화
4. 관리자 계정 생성

## 3. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 Firebase 설정값을 입력하세요:

```bash
# .env.local
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

ADMIN_EMAIL=admin@rootenergy.com
ADMIN_PASSWORD=change_this_password
```

## 4. 이미지 파일 준비

`public/images/` 폴더에 다음 이미지들을 업로드하세요:

### 필수 이미지
- `logo.png` - 헤더 로고 (160x48px)
- `logo-white.png` - 푸터 로고 (160x48px)

### 솔루션 썸네일 (800x600px)
- `solution01.jpg` - 지역수용성 솔루션
- `solution02.jpg` - 지역주도 사업개발
- `solution03.jpg` - RE100/탄소중립
- `funds.jpg` - 시민펀드

### 페이지 이미지
- `about-main.jpg` - 회사소개 메인
- `re100.jpg` - RE100 설명
- `news1.jpg`, `news2.jpg`, `news3.jpg` - 뉴스 썸네일
- `newsletter1.jpg`, `newsletter2.jpg`, `newsletter3.jpg` - 뉴스레터
- `fund1.jpg`, `fund2.jpg`, `fund3.jpg` - 펀드 프로젝트

## 5. Pretendard 폰트 설치

1. [Pretendard GitHub](https://github.com/orioncactus/pretendard/releases)에서 최신 릴리즈 다운로드
2. `PretendardVariable.woff2` 파일을 `public/fonts/` 폴더에 복사

## 6. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:3000 접속하여 확인

## 7. 테스트

### 사용자 페이지 테스트
- http://localhost:3000 - 메인
- http://localhost:3000/about - 회사소개
- http://localhost:3000/solution01 - 솔루션
- http://localhost:3000/press - 언론보도
- http://localhost:3000/recruitment - 채용

### 관리자 페이지 테스트
- http://localhost:3000/admin/login
- 임시 로그인: admin@rootenergy.com / admin123

## 8. 배포 준비

### Vercel 배포
1. GitHub 저장소에 코드 푸시
2. [Vercel](https://vercel.com) 접속
3. GitHub 저장소 연결
4. 환경 변수 설정
5. 배포

## 추가 작업이 필요한 부분

### Firebase 연동
현재는 더미 데이터로 작동하며, 실제 Firebase와 연동하려면:
- 게시판 CRUD 로직 구현
- 이미지 업로드 기능 구현
- 방문자 추적 로직 구현
- 실시간 통계 수집 구현

### 추가 기능
- 검색 기능
- 페이지네이션
- 댓글 기능
- 이메일 알림
- SEO 최적화
- 소셜 미디어 공유

## 문제 해결

### 이미지가 표시되지 않는 경우
- 이미지 파일이 `public/images/` 폴더에 있는지 확인
- 파일명이 코드와 일치하는지 확인
- Next.js 개발 서버 재시작

### 폰트가 적용되지 않는 경우
- 폰트 파일이 `public/fonts/` 폴더에 있는지 확인
- 브라우저 캐시 삭제
- 개발자 도구에서 폰트 로딩 확인

### Firebase 연결 오류
- `.env.local` 파일의 환경 변수 확인
- Firebase 프로젝트 설정 확인
- 개발 서버 재시작

## 지원

문제가 발생하면 다음을 확인하세요:
- [Next.js 문서](https://nextjs.org/docs)
- [Firebase 문서](https://firebase.google.com/docs)
- [Tailwind CSS 문서](https://tailwindcss.com/docs)

이미지 파일들을 준비해주시면, 실제 화면에 반영하여 테스트할 수 있습니다.

